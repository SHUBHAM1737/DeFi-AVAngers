import { OpenAI } from 'openai';
import { ConversationChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { BufferMemory } from 'langchain/memory';
import { PromptTemplate } from 'langchain/prompts';
import { VectorStore } from './vector-store';
import { MarketAnalyticsEngine } from './market-analytics';
import { PortfolioOptimizer } from './portfolio-optimizer';

interface ConversationContext {
  userId: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

interface ConversationResponse {
  response: string;
  actions: Array<{
    type: string;
    payload: any;
  }>;
  confidence: number;
  context: Record<string, any>;
}

export class ConversationChainManager {
  private openai: OpenAI;
  private chatModel: ChatOpenAI;
  private vectorStore: VectorStore;
  private marketAnalytics: MarketAnalyticsEngine;
  private portfolioOptimizer: PortfolioOptimizer;
  private conversations: Map<string, ConversationChain>;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.chatModel = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.7,
      maxTokens: 1500,
    });
    this.vectorStore = new VectorStore('conversations');
    this.marketAnalytics = new MarketAnalyticsEngine();
    this.portfolioOptimizer = new PortfolioOptimizer();
    this.conversations = new Map();
  }

  private getConversationKey(context: ConversationContext): string {
    return `${context.userId}:${context.sessionId}`;
  }

  private async getOrCreateChain(context: ConversationContext): Promise<ConversationChain> {
    const key = this.getConversationKey(context);
    if (this.conversations.has(key)) {
      return this.conversations.get(key)!;
    }

    const template = `
    System: You are an AI assistant specializing in blockchain and DeFi operations on the Avalanche network.
    Current Context: {context}
    Conversation History: {history}
    Human: {input}
    Assistant: Let me help you with that.
    `;

    const chain = new ConversationChain({
      llm: this.chatModel,
      memory: new BufferMemory({
        returnMessages: true,
        inputKey: 'input',
        outputKey: 'response',
        memoryKey: 'history',
      }),
      prompt: PromptTemplate.fromTemplate(template),
    });

    this.conversations.set(key, chain);
    return chain;
  }

  async processMessage(
    message: string,
    context: ConversationContext
  ): Promise<ConversationResponse> {
    // Get relevant knowledge from vector store
    const relevantKnowledge = await this.vectorStore.similaritySearch(message);
    
    // Get market context if needed
    const marketContext = await this.getMarketContext(message);
    
    // Combine all context
    const enrichedContext = {
      ...context.metadata,
      relevantKnowledge,
      marketContext,
    };

    // Get conversation chain
    const chain = await this.getOrCreateChain(context);

    // Process message
    const result = await chain.call({
      input: message,
      context: JSON.stringify(enrichedContext),
    });

    // Extract actions and generate response
    const actions = await this.extractActions(result.response, context);
    const confidence = await this.calculateConfidence(result.response, message);

    return {
      response: result.response,
      actions,
      confidence,
      context: enrichedContext,
    };
  }

  private async getMarketContext(message: string): Promise<any> {
    // Analyze if message is market-related
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Analyze if the message requires market context. Respond with JSON: { needsMarket: boolean, assets: string[] }"
        },
        {
          role: "user",
          content: message
        }
      ],
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(completion.choices[0].message.content);
    
    if (!analysis.needsMarket) return null;

    // Get market data for relevant assets
    return Promise.all(
      analysis.assets.map(asset =>
        this.marketAnalytics.generateMarketPrediction(asset)
      )
    );
  }

  private async extractActions(
    response: string,
    context: ConversationContext
  ): Promise<Array<{ type: string; payload: any }>> {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Extract required actions from the response. Output JSON array of actions with 'type' and 'payload'."
        },
        {
          role: "user",
          content: response
        }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(completion.choices[0].message.content).actions;
  }

  private async calculateConfidence(
    response: string,
    originalMessage: string
  ): Promise<number> {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Calculate confidence score (0-1) for the response based on relevance and completeness. Output JSON: { confidence: number }"
        },
        {
          role: "user",
          content: `Original message: ${originalMessage}\nResponse: ${response}`
        }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(completion.choices[0].message.content).confidence;
  }

  async clearConversation(context: ConversationContext) {
    const key = this.getConversationKey(context);
    this.conversations.delete(key);
  }
}

export const conversationChain = new ConversationChainManager();
