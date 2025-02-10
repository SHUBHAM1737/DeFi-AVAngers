import { EventEmitter } from 'events';
import { APIError } from '../types/agent';

const WS_FEED_URL = 'wss://ws.coincap.io/prices?assets=';

export class WebSocketManager extends EventEmitter {
  private static instance: WebSocketManager;
  private sockets: Map<string, WebSocket> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 1000;

  private constructor() {
    super();
  }

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  subscribeToPriceUpdates(tokenId: string): void {
    if (this.sockets.has(tokenId)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/prices/${tokenId}`;
    
    const ws = new WebSocket(wsUrl);
    this.setupWebSocketHandlers(ws, tokenId);
    this.sockets.set(tokenId, ws);
    this.reconnectAttempts.set(tokenId, 0);
  }

  unsubscribeFromPriceUpdates(tokenId: string): void {
    const ws = this.sockets.get(tokenId);
    if (ws) {
      ws.close();
      this.sockets.delete(tokenId);
      this.reconnectAttempts.delete(tokenId);
    }
  }

  private setupWebSocketHandlers(ws: WebSocket, tokenId: string): void {
    ws.onmessage = (event) => this.handleWebSocketMessage(event.data);
    ws.onerror = (error) => this.handleWebSocketError(error, tokenId);
    ws.onclose = () => this.handleWebSocketClose(tokenId);
  }

  private handleWebSocketMessage(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.emit('priceUpdate', parsed);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
      this.emit('error', new APIError(
        'Failed to parse WebSocket message',
        'WS_PARSE_ERROR',
        500
      ));
    }
  }

  private handleWebSocketError(error: Event, tokenId: string): void {
    console.error(`WebSocket error for ${tokenId}:`, error);
    this.emit('error', new APIError(
      'WebSocket connection error',
      'WS_CONNECTION_ERROR',
      500
    ));
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
    return Array.from(this.sockets.keys());
  }

  closeAllConnections(): void {
    this.sockets.forEach((ws, tokenId) => {
      this.unsubscribeFromPriceUpdates(tokenId);
    });
  }
}

export const websocketManager = WebSocketManager.getInstance();
