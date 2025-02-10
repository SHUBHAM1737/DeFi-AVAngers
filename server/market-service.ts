import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import { APIError, RateLimitError } from '../client/src/types/agent';
import { z } from 'zod';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const WS_FEED_URL = 'wss://ws.coincap.io/prices?assets=';

export class MarketService extends EventEmitter {
  private static instance: MarketService;
  private websockets: Map<string, WebSocket> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 1000;

  private constructor() {
    super();
    this.handleWebSocketError = this.handleWebSocketError.bind(this);
    this.handleWebSocketMessage = this.handleWebSocketMessage.bind(this);
  }

  static getInstance(): MarketService {
    if (!MarketService.instance) {
      MarketService.instance = new MarketService();
    }
    return MarketService.instance;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${COINGECKO_API_BASE}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
          throw new RateLimitError(
            'Rate limit exceeded',
            retryAfter,
            errorData
          );
        }
        throw new APIError(
          errorData.message || 'API request failed',
          errorData.code || 'API_ERROR',
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof APIError || error instanceof RateLimitError) {
        throw error;
      }
      if (error.name === 'AbortError') {
        throw new APIError('Request timeout', 'TIMEOUT', 408);
      }
      throw new APIError(
        `Request failed: ${error instanceof Error ? error.message : String(error)}`,
        'REQUEST_FAILED',
        500
      );
    }
  }

  async getTokenPrice(tokenId: string, vsCurrency: string = 'usd') {
    return await this.makeRequest(
      `/simple/price?ids=${tokenId}&vs_currencies=${vsCurrency}&include_24hr_vol=true&include_24hr_change=true`
    );
  }

  async getMarketChart(tokenId: string, days: number = 7) {
    return await this.makeRequest(
      `/coins/${tokenId}/market_chart?vs_currency=usd&days=${days}`
    );
  }

  async getTrendingTokens() {
    return await this.makeRequest('/search/trending');
  }

  async getTokenMetadata(tokenId: string) {
    return await this.makeRequest(
      `/coins/${tokenId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
    );
  }

  subscribeToPriceUpdates(tokenId: string): void {
    if (this.websockets.has(tokenId)) {
      return;
    }

    const ws = new WebSocket(`${WS_FEED_URL}${tokenId}`);
    this.setupWebSocketHandlers(ws, tokenId);
    this.websockets.set(tokenId, ws);
    this.reconnectAttempts.set(tokenId, 0);
  }

  unsubscribeFromPriceUpdates(tokenId: string): void {
    const ws = this.websockets.get(tokenId);
    if (ws) {
      ws.close();
      this.websockets.delete(tokenId);
      this.reconnectAttempts.delete(tokenId);
    }
  }

  private setupWebSocketHandlers(ws: WebSocket, tokenId: string): void {
    ws.on('message', this.handleWebSocketMessage);
    ws.on('error', (error) => this.handleWebSocketError(error, tokenId));
    ws.on('close', () => this.handleWebSocketClose(tokenId));
  }

  private handleWebSocketMessage(data: WebSocket.Data): void {
    try {
      const parsed = JSON.parse(data.toString());
      this.emit('priceUpdate', parsed);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleWebSocketError(error: Error, tokenId: string): void {
    console.error(`WebSocket error for ${tokenId}:`, error);
    this.emit('error', { tokenId, error });
  }

  private async handleWebSocketClose(tokenId: string): Promise<void> {
    const attempts = this.reconnectAttempts.get(tokenId) || 0;
    if (attempts < this.maxReconnectAttempts) {
      await new Promise(resolve => setTimeout(resolve, this.reconnectDelay * Math.pow(2, attempts)));
      this.reconnectAttempts.set(tokenId, attempts + 1);
      this.subscribeToPriceUpdates(tokenId);
    } else {
      this.emit('maxReconnectAttemptsReached', tokenId);
    }
  }

  getActiveSubscriptions(): string[] {
    return Array.from(this.websockets.keys());
  }

  closeAllConnections(): void {
    this.websockets.forEach((ws, tokenId) => {
      this.unsubscribeFromPriceUpdates(tokenId);
    });
  }
}

export const marketService = MarketService.getInstance();