import { MarketData, marketDataSchema, APIError, RateLimitError } from '../types/agent';
import { z } from 'zod';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const CACHE_DURATION = 30 * 1000; // 30 seconds
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // Reduced for free tier

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface RateLimitInfo {
  requestCount: number;
  windowStart: number;
}

export class MarketService {
  private static cache: Map<string, CacheEntry<any>> = new Map();
  private static rateLimit: RateLimitInfo = {
    requestCount: 0,
    windowStart: Date.now()
  };

  private static validateResponse<T>(data: unknown, schema: z.ZodSchema<T>): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new APIError(
          'Invalid API response format',
          'INVALID_RESPONSE',
          500,
          { zodError: error.errors }
        );
      }
      throw error;
    }
  }

  private static async makeRequest<T>(
    endpoint: string,
    schema: z.ZodSchema<T>,
    options: RequestInit = {}
  ): Promise<T> {
    const now = Date.now();

    // Check rate limiting
    if (now - this.rateLimit.windowStart > RATE_LIMIT_WINDOW) {
      this.rateLimit = { requestCount: 0, windowStart: now };
    }

    if (this.rateLimit.requestCount >= MAX_REQUESTS_PER_WINDOW) {
      const resetTime = this.rateLimit.windowStart + RATE_LIMIT_WINDOW;
      throw new RateLimitError(
        'Rate limit exceeded for free API tier',
        Math.ceil((resetTime - now) / 1000),
        { resetTime, tier: 'free' }
      );
    }

    this.rateLimit.requestCount++;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

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
            { ...errorData, tier: 'free' }
          );
        }

        if (response.status === 403) {
          throw new APIError(
            'API key required for this endpoint',
            'UNAUTHORIZED',
            403,
            { endpoint }
          );
        }

        throw new APIError(
          errorData.message || 'API request failed',
          errorData.code || 'API_ERROR',
          response.status,
          errorData
        );
      }

      const data = await response.json();
      return this.validateResponse(data, schema);
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

  private static getCacheKey(endpoint: string, params: Record<string, any> = {}): string {
    return `${endpoint}:${JSON.stringify(params)}`;
  }

  private static getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private static setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  static async getTokenPrice(
    tokenId: string,
    vsCurrency: string = 'usd'
  ): Promise<MarketData> {
    const cacheKey = this.getCacheKey('/simple/price', { tokenId, vsCurrency });
    const cached = this.getCachedData<MarketData>(cacheKey);
    if (cached) return cached;

    const data = await this.makeRequest(
      `/simple/price?ids=${tokenId}&vs_currencies=${vsCurrency}&include_24hr_vol=true&include_24hr_change=true`,
      marketDataSchema
    );

    this.setCachedData(cacheKey, data);
    return data;
  }

  static async getMarketChart(
    tokenId: string,
    days: number = 7
  ): Promise<{
    prices: [number, number][];
    market_caps: [number, number][];
    volumes: [number, number][];
  }> {
    const chartDataSchema = z.object({
      prices: z.array(z.tuple([z.number(), z.number()])),
      market_caps: z.array(z.tuple([z.number(), z.number()])),
      volumes: z.array(z.tuple([z.number(), z.number()]))
    });

    const cacheKey = this.getCacheKey('/market_chart', { tokenId, days });
    const cached = this.getCachedData<z.infer<typeof chartDataSchema>>(cacheKey);
    if (cached) return cached;

    const data = await this.makeRequest(
      `/coins/${tokenId}/market_chart?vs_currency=usd&days=${days}`,
      chartDataSchema
    );

    this.setCachedData(cacheKey, data);
    return data;
  }

  static async getTrendingTokens(): Promise<{
    coins: Array<{
      item: {
        id: string;
        coin_id: number;
        name: string;
        symbol: string;
        market_cap_rank: number;
        thumb: string;
        score: number;
      };
    }>;
  }> {
    const trendingSchema = z.object({
      coins: z.array(z.object({
        item: z.object({
          id: z.string(),
          coin_id: z.number(),
          name: z.string(),
          symbol: z.string(),
          market_cap_rank: z.number(),
          thumb: z.string(),
          score: z.number()
        })
      }))
    });

    const cacheKey = this.getCacheKey('/trending');
    const cached = this.getCachedData<z.infer<typeof trendingSchema>>(cacheKey);
    if (cached) return cached;

    const data = await this.makeRequest('/search/trending', trendingSchema);

    this.setCachedData(cacheKey, data);
    return data;
  }

  static clearCache(): void {
    this.cache.clear();
  }

  static getCacheStats(): {
    size: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    let oldestEntry = Infinity;
    let newestEntry = -Infinity;

    this.cache.forEach((entry) => {
      oldestEntry = Math.min(oldestEntry, entry.timestamp);
      newestEntry = Math.max(newestEntry, entry.timestamp);
    });

    return {
      size: this.cache.size,
      oldestEntry: oldestEntry === Infinity ? null : oldestEntry,
      newestEntry: newestEntry === -Infinity ? null : newestEntry
    };
  }
}

// Global error handling for API errors
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason instanceof APIError) {
    console.error('Unhandled API Error:', {
      message: event.reason.message,
      code: event.reason.code,
      status: event.reason.status,
      details: event.reason.details
    });
  }
});