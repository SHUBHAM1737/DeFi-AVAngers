import { createWalletClient, http } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { MarketService } from './market-service';
import { FormattedResponse } from '../client/src/types/agent';
import { openAIService } from './openai';
import { BrianSDK } from './brian-sdk';
import { storage } from './storage';

export class AgentService {
  private brianSDK: BrianSDK;
  private walletClient: ReturnType<typeof createWalletClient>;
  private account: ReturnType<typeof privateKeyToAccount>;

  constructor() {
    if (!process.env.BRIAN_API_KEY) {
      throw new Error("BRIAN_API_KEY environment variable is required");
    }
    this.brianSDK = new BrianSDK({ apiKey: process.env.BRIAN_API_KEY });
    this.initializeWallet();
  }

  private initializeWallet() {
    if (!process.env.PRIVATE_KEY) {
      throw new Error("PRIVATE_KEY environment variable is required");
    }

    const privateKey = process.env.PRIVATE_KEY;
    const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;

    if (formattedKey.length !== 66) {
      throw new Error("PRIVATE_KEY must be 32 bytes (64 hex characters) with '0x' prefix");
    }

    this.walletClient = createWalletClient({
      chain: avalancheFuji,
      transport: http('https://api.avax-test.network/ext/bc/C/rpc')
    });

    try {
      this.account = privateKeyToAccount(formattedKey as `0x${string}`);
    } catch (error) {
      throw new Error(`Failed to create account from private key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async processMessage(message: string, userId?: number) {
    try {
      const intent = await openAIService.analyzeIntent(message);
      let result;
      let error;

      try {
        result = await this.executeAgentAction(intent, message, userId);
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
        console.error('Action execution error:', error);
      }

      const response = await openAIService.generateResponse({
        intent,
        result,
        error,
      });

      return {
        response,
        agentType: intent.agent,
        subType: intent.action,
        details: result
      };
    } catch (error) {
      console.error('Agent service error:', error);
      const errorExplanation = await openAIService.explainError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to process request'
      );

      return {
        response: errorExplanation,
        agentType: 'error',
        subType: 'processing_error'
      };
    }
  }

  private async executeAgentAction(
    intent: { agent: string; action: string; parameters?: Record<string, any> },
    message: string,
    userId?: number
  ) {
    let userAddress = this.account.address;

    if (userId) {
      const user = await storage.getUser(userId);
      if (user?.avalancheAddress) {
        userAddress = user.avalancheAddress;
      }
    }

    try {
      let result;
      switch (intent.agent) {
        case 'market':
          switch (intent.action) {
            case 'price':
              result = await MarketService.getTokenPrice(intent.parameters?.tokenId || 'avalanche-2');
              break;
            case 'chart':
              result = await MarketService.getMarketChart(intent.parameters?.tokenId || 'avalanche-2', intent.parameters?.days || 7);
              break;
            case 'trending':
              result = await MarketService.getTrendingTokens();
              break;
            default:
              throw new Error('Unsupported market action');
          }
          break;

        case 'defi':
          result = await this.brianSDK.transact({
            prompt: message,
            address: userAddress,
            chainId: avalancheFuji.id,
          });
          break;

        case 'bridge':
          result = await this.brianSDK.transact({
            prompt: message,
            address: userAddress,
            chainId: avalancheFuji.id,
          });
          break;

        case 'system':
          switch (intent.action) {
            case 'networks':
              result = await this.brianSDK.getSupportedNetworks();
              break;
            case 'actions':
              result = await this.brianSDK.getSupportedActions();
              break;
            default:
              throw new Error('Unsupported system action');
          }
          break;

        default:
          throw new Error('Unsupported agent type');
      }

      return result;
    } catch (error) {
      throw new Error(`${intent.agent} action failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const agentService = new AgentService();