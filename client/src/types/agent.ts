import { z } from 'zod';

// Base response types
export interface BaseResponse {
  timestamp: string;
  status: 'success' | 'error' | 'pending';
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

// Market data types with validation
export const marketDataSchema = z.object({
  price: z.number().positive(),
  change24h: z.number(),
  volume24h: z.number().positive(),
  timestamp: z.string().datetime(),
  marketCap: z.number().positive(),
  fullyDilutedValuation: z.number().positive().optional(),
  circulatingSupply: z.number().positive(),
  totalSupply: z.number().positive().optional(),
  maxSupply: z.number().positive().optional(),
  ath: z.number().positive(),
  athChangePercentage: z.number(),
  athDate: z.string().datetime(),
  atl: z.number().positive(),
  atlChangePercentage: z.number(),
  atlDate: z.string().datetime(),
  lastUpdated: z.string().datetime(),
});

export type MarketData = z.infer<typeof marketDataSchema>;

// Blockchain types
export interface ChainConfig {
  chainId: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
  iconUrl: string;
}

// WebSocket message types
export type WebSocketMessage = {
  type: 'response' | 'error' | 'update';
  data: BlockchainAgentResponse | { error: string };
};

export interface BlockchainAgentResponse extends BaseResponse {
  response: string;
  agentType: string;
  subType: string;
  details?: {
    transaction?: {
      hash: string;
      from: string;
      to: string;
      value: string;
      gasPrice: string;
      gasLimit: string;
      data: string;
    };
    validation?: {
      success: boolean;
      warnings: string[];
      errors: string[];
    };
    simulation?: {
      success: boolean;
      gasUsed: number;
      returnValue: string;
      events: Array<{
        address: string;
        topics: string[];
        data: string;
      }>;
    };
  };
}

// Agent command types
export interface Command {
  label: string;
  command: string;
  requiresAddress?: boolean;
  addressPrompt?: string;
  group?: string;
  description?: string;
  validation?: {
    schema: z.ZodSchema;
    errorMessages: Record<string, string>;
  };
}

// Chat message types
export interface ChatMessage {
  id: string;
  type: 'user' | 'agent' | 'error' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    agentType?: 'defi' | 'tools' | 'allora' | 'bridge' | 'system' | 'analytics';
    subType?: string;
    details?: Record<string, any>;
    error?: {
      code: string;
      message: string;
      stack?: string;
    };
  };
}

// Market analysis types
export interface MarketAnalysis {
  price: MarketData;
  technicalIndicators: {
    rsi: number;
    macd: {
      macd: number;
      signal: number;
      histogram: number;
    };
    ema: {
      ema9: number;
      ema21: number;
      ema50: number;
    };
  };
  onChainMetrics: {
    activeAddresses: number;
    transactionCount: number;
    averageTransactionValue: number;
    largeTransactions: Array<{
      hash: string;
      value: number;
      timestamp: string;
    }>;
  };
}

// Transaction types
export interface TransactionRequest {
  to: string;
  data: string;
  value?: string;
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
}

export interface TransactionResponse {
  hash: string;
  blockNumber?: number;
  confirmations: number;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasLimit: string;
  data: string;
  status?: 'pending' | 'confirmed' | 'failed';
  error?: string;
}

// API Error types
export class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class RateLimitError extends APIError {
  constructor(
    message: string,
    public retryAfter: number,
    details?: Record<string, any>
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, details);
    this.name = 'RateLimitError';
  }
}

export interface Agent {
  id: string;
  title: string;
  type: string;
  description: string;
  image: string;
  commands: Command[];
}

export interface FormattedResponse extends BaseResponse {
  title: string;
  currentStatus: {
    timestamp: string;
    actionType: string;
    status: 'Success' | 'Error' | 'In Progress';
    confidenceLevel: string;
  };
  keyMetrics: {
    gasUsage?: string;
    riskLevel: string;
    networkStatus: string;
    priceImpact?: string;
  };
  contextAnalysis: {
    marketConditions: string;
    historicalTrends: string;
    networkActivity: string;
  };
  technicalDetails: {
    transactionHash?: string;
    blockNumber?: string;
    contractAddress?: string;
  };
  recommendations: {
    immediateActions: string[];
    riskManagement: string[];
    optimizationTips: string[];
  };
  additionalResources: {
    documentation: string[];
    tools: string[];
  };
}

export interface SystemEvent extends BaseResponse {
  type: 'info' | 'success' | 'error';
  message: string;
  metadata?: {
    type?: 'defi' | 'bridge' | 'allora' | 'network' | 'analytics';
    details?: string;
  };
}

export interface DeFiPosition {
  protocol: string;
  type: string;
  value: number;
  apr: number;
  chain: string;
}

export interface BridgeQuote {
  fromChain: string;
  toChain: string;
  asset: string;
  amount: number;
  estimatedTime: string;
  fee: number;
}