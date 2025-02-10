import { createPublicClient, http } from 'viem';
import { avalancheFuji } from 'viem/chains';

interface BrianOptions {
  apiKey: string;
  baseUrl?: string;
}

interface TransactionStep {
  chainId: number;
  blockNumber: number;
  from: string;
  to: string;
  gasLimit: string;
  data: string;
  value: string;
}

interface NetworkInfo {
  id: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

interface ActionParameter {
  name: string;
  type: string;
  description: string;
  mandatory: boolean;
}

interface ActionInfo {
  name: string;
  description: string;
  parameters: ActionParameter[];
}

interface ConversationMessage {
  sender: 'user' | 'brian';
  content: string;
}

interface KnowledgeGraphResponse {
  nodes: Array<{
    id: string;
    type: string;
    properties: Record<string, any>;
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: string;
    properties: Record<string, any>;
  }>;
  metadata: {
    timestamp: string;
    confidence: number;
    source: string;
  };
}

interface AnalyticsResult {
  insights: Array<{
    type: string;
    description: string;
    confidence: number;
    relatedEntities: string[];
  }>;
  trends: Array<{
    metric: string;
    direction: 'up' | 'down' | 'stable';
    change: number;
    timeframe: string;
  }>;
  recommendations: string[];
}

export class BrianSDK {
  private apiKey: string;
  private baseUrl: string;
  private publicClient: ReturnType<typeof createPublicClient>;

  constructor(options: BrianOptions) {
    if (!options.apiKey) {
      throw new Error('Brian API key is required');
    }
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || 'https://api.brianknows.org/api/v0';
    this.publicClient = createPublicClient({
      chain: avalancheFuji,
      transport: http('https://api.avax-test.network/ext/bc/C/rpc')
    });
  }

  private async makeRequest<T>(endpoint: string, method: string = 'GET', body?: any): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Brian-Api-Key': this.apiKey
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`Brian API request failed: ${error.error || response.statusText}`);
    }

    return response.json();
  }

  async transact(params: { 
    prompt: string; 
    address: string;
    chainId?: number;
    messages?: ConversationMessage[];
  }) {
    const response = await this.makeRequest('/agent', 'POST', {
      prompt: params.prompt,
      address: params.address,
      chainId: params.chainId,
      messages: params.messages || []
    });
    return Array.isArray(response.result) ? response.result : [response.result];
  }

  async extractParameters(prompt: string) {
    const response = await this.makeRequest('/agent/parameters-extraction', 'POST', {
      prompt
    });
    return response.result;
  }

  async generateSmartContract(params: {
    prompt: string;
    compile?: boolean;
    messages?: ConversationMessage[];
  }) {
    const response = await this.makeRequest('/agent/smart-contract', 'POST', {
      prompt: params.prompt,
      compile: params.compile,
      messages: params.messages
    });
    return response.result;
  }

  async getSupportedNetworks(): Promise<NetworkInfo[]> {
    const response = await this.makeRequest('/utils/networks');
    return response.result;
  }

  async getSupportedActions(): Promise<ActionInfo[]> {
    const response = await this.makeRequest('/utils/actions');
    return response.result;
  }

  async ask(params: {
    prompt: string;
    kb: string;
    messages?: ConversationMessage[];
  }) {
    const response = await this.makeRequest('/agent', 'POST', {
      prompt: params.prompt,
      kb: params.kb,
      messages: params.messages || []
    });
    return response;
  }

  // Helper method to validate transaction parameters
  async validateTransaction(transaction: any) {
    try {
      const network = await this.publicClient.getChainId();
      if (transaction.chainId !== network) {
        throw new Error(`Chain ID mismatch: expected ${network} (Fuji Testnet), got ${transaction.chainId}`);
      }

      // Verify the RPC connection
      const blockNumber = await this.publicClient.getBlockNumber();
      console.log(`Connected to Fuji Testnet, current block: ${blockNumber}`);

      return true;
    } catch (error) {
      throw new Error(`Transaction validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // New methods for knowledge graph analytics
  async queryKnowledgeGraph(query: string): Promise<KnowledgeGraphResponse> {
    const response = await this.makeRequest('/graph/query', 'POST', {
      query,
      includeMetadata: true
    });
    return response.result;
  }

  async analyzeEntity(entityId: string): Promise<AnalyticsResult> {
    const response = await this.makeRequest(`/graph/analytics/${entityId}`, 'POST');
    return response.result;
  }

  async getEntityRelations(entityId: string, depth: number = 1): Promise<KnowledgeGraphResponse> {
    const response = await this.makeRequest(`/graph/relations/${entityId}`, 'POST', {
      depth,
      includeProperties: true
    });
    return response.result;
  }

  async detectPatterns(timeframe: string): Promise<AnalyticsResult> {
    const response = await this.makeRequest('/graph/patterns', 'POST', {
      timeframe,
      minConfidence: 0.7
    });
    return response.result;
  }
}

// Initialize with environment variables
export const brianSDK = new BrianSDK({
  apiKey: process.env.BRIAN_API_KEY || '',
});