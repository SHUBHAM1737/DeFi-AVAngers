import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { FormattedResponse } from "../client/src/types/agent";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = "gpt-4o";

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeIntent(userMessage: string): Promise<{
    agent: string;
    action: string;
    parameters?: Record<string, any>;
  }> {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an advanced DeFi AI agent specializing in cross-chain operations, blockchain analytics, and knowledge graph analysis.
Analyze the user's intent and respond with a JSON object containing the following fields:
- agent: The type of agent to handle the request ("defi", "tools", "allora", "bridge", "system", "analytics")
- action: The specific action to perform
- parameters: Optional parameters for the action

Key capabilities aligned with Brian API:

1. DeFi Operations (agent: "defi")
   - swap: Cross-chain token swaps
   - transfer: Token transfers
   - position: Manage DeFi positions
   - analyze: Protocol analysis
   Example: { "agent": "defi", "action": "swap", "parameters": { "token1": "ETH", "token2": "USDC", "amount": "1", "chain": "avalanche" } }

2. Tools & Analytics (agent: "tools")
   - simulate: Transaction simulation
   - gas: Gas estimation
   - risk: Risk analysis
   - parameters: Parameter extraction
   Example: { "agent": "tools", "action": "parameters", "parameters": { "prompt": "string" } }

3. Smart Contracts (agent: "bridge")
   - generate: Smart contract generation
   - compile: Contract compilation
   - validate: Code validation
   Example: { "agent": "bridge", "action": "generate", "parameters": { "prompt": "string", "compile": true } }

4. Knowledge Graph Analytics (agent: "analytics")
   - query: General knowledge graph queries
   - analyze: Detailed entity analysis
   - patterns: Pattern detection in timeframes
   - relations: Entity relationship exploration
   Example: { "agent": "analytics", "action": "patterns", "parameters": { "timeframe": "24h" } }

5. System & Help (agent: "system")
   - help: Get capabilities
   - networks: List supported networks
   - actions: List available actions
   Example: { "agent": "system", "action": "networks" }

For unclear queries, return: { "agent": "system", "action": "clarify" }

Always return a valid JSON object matching the above structure.`
      },
      {
        role: "user",
        content: userMessage
      }
    ];

    const response = await this.openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0].message.content || '{"agent":"system","action":"help"}';
    return JSON.parse(content);
  }

  async generateResponse(
    context: {
      intent: {
        agent: string;
        action: string;
        parameters?: Record<string, any>;
      };
      result?: FormattedResponse;
      error?: string;
    }
  ): Promise<string> {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an advanced DeFi AI assistant providing detailed insights using the Brian API.
Format your response using this markdown structure:

### [Title based on the action type]

#### Transaction Status
- **Timestamp**: [Current UTC time]
- **Action**: [Operation type]
- **Status**: [Success/Error/Pending]
- **Network**: [Chain name]

#### Transaction Details
- **Type**: [Transaction type]
- **Amount**: [Transaction amount if applicable]
- **Gas Cost**: [Estimated/actual gas cost]
- **Contract**: [Contract address if applicable]

#### Market Context
- **Price Impact**: [If applicable]
- **Market Conditions**: [Current state]
- **Risk Level**: [Low/Medium/High with explanation]

#### Next Steps & Recommendations
- **Immediate Actions**: [User next steps]
- **Monitoring**: [What to watch]
- **Risk Management**: [Safety tips]

Style Requirements:
- Keep responses concise and actionable
- Focus on relevant information
- Include specific values where available
- Maintain professional tone`
      },
      {
        role: "user",
        content: JSON.stringify(context)
      }
    ];

    const response = await this.openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "Unable to process request. Please try again.";
  }

  async suggestNextSteps(
    userHistory: string[],
    lastResult: any
  ): Promise<string[]> {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `Based on the user's interaction history and last operation result,
        suggest up to 3 relevant next actions they could take.
        Format as a JSON array of strings.`
      },
      {
        role: "user",
        content: JSON.stringify({
          history: userHistory,
          lastResult
        })
      }
    ];

    const response = await this.openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const content = response.choices[0].message.content || '{"suggestions":[]}';
    return JSON.parse(content).suggestions;
  }

  async validateUserInput(
    intent: {
      agent: string;
      action: string;
    },
    userInput: string
  ): Promise<{
    isValid: boolean;
    normalizedValue?: string;
    error?: string;
  }> {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `Validate and normalize user input for Brian API operations.
Validate input matches requirements for given agent and action.
Return JSON with:
- isValid: boolean
- normalizedValue: cleaned value if valid
- error: error message if invalid

Focus on:
- Token symbols/addresses
- Network names
- Numerical values
- Address formats`
      },
      {
        role: "user",
        content: JSON.stringify({
          intent,
          userInput
        })
      }
    ];

    const response = await this.openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const content = response.choices[0].message.content || '{"isValid":false,"error":"Validation failed"}';
    return JSON.parse(content);
  }

  async explainError(error: Error, context: string): Promise<string> {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are a DeFi support specialist helping users with Brian API operations.
Format error responses using this structure:

### [Error Title]

#### Error Details
- **Type**: [Error category]
- **Component**: [Affected system part]
- **Impact**: [User impact]
- **Status**: [Current state]

#### Analysis
- **Cause**: [Root cause]
- **Context**: [Relevant conditions]
- **Severity**: [Impact level]

#### Resolution
- **Immediate Steps**: [What to do now]
- **Prevention**: [How to avoid]
- **Alternatives**: [Other options]

Requirements:
- Clear, actionable language
- Specific steps
- Focus on resolution
- Professional tone`
      },
      {
        role: "user",
        content: JSON.stringify({
          error: error.message,
          context,
          timestamp: new Date().toISOString()
        })
      }
    ];

    const response = await this.openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "An error occurred. Please try again.";
  }
}

export const openAIService = new OpenAIService();