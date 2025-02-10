import { OpenAI } from 'openai';
import { z } from 'zod';
import { PoolClient } from 'pg';
import { createPublicClient, http, type Block } from 'viem';
import { avalancheFuji } from 'viem/chains';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http('https://api.avax-test.network/ext/bc/C/rpc')
});

interface MarketPrediction {
  asset: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  timeframe: string;
  signals: {
    technical: TechnicalSignals;
    sentiment: SentimentSignals;
    fundamental: FundamentalSignals;
  };
  indicators: {
    rsi: number;
    macd: {
      value: number;
      signal: number;
      histogram: number;
    };
    volume: number;
    volatility: number;
  };
}

interface TechnicalSignals {
  macdSignal: number;
  rsiValue: number;
  bollingerPosition: number;
  trendStrength: number;
}

interface SentimentSignals {
  socialMediaScore: number;
  newsImpact: number;
  marketMomentum: number;
  communityEngagement: number;
}

interface FundamentalSignals {
  marketCap: number;
  volume24h: number;
  dominanceIndex: number;
  networkActivity: {
    transactions: number;
    activeAddresses: number;
    gasUsed: number;
  };
}

type MarketHistoryResponse = {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
};

type SocialStatsResponse = {
  twitter_followers: number;
  reddit_subscribers: number;
  telegram_members: number;
  github_commits: number;
};

type NewsResponse = {
  articles: Array<{
    title: string;
    sentiment: number;
    timestamp: string;
  }>;
};

export class MarketAnalyticsEngine {
  private async fetchHistoricalData(asset: string): Promise<MarketHistoryResponse> {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${asset}/market_chart?vs_currency=usd&days=30&interval=daily`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch historical data');
    }

    return response.json();
  }

  private async analyzeTechnicalIndicators(asset: string): Promise<TechnicalSignals> {
    try {
      // Fetch real historical data
      const historicalData = await this.fetchHistoricalData(asset);
      const prices = historicalData.prices.map(p => p[1]);

      // Calculate real technical indicators
      const rsi = this.calculateRSI(prices);
      const macd = this.calculateMACD(prices);
      const bollinger = this.calculateBollingerBands(prices);

      return {
        macdSignal: macd.signal,
        rsiValue: rsi,
        bollingerPosition: this.calculateBollingerPosition(prices[prices.length - 1], bollinger),
        trendStrength: this.calculateTrendStrength(prices),
      };
    } catch (error) {
      console.error('Error in technical analysis:', error);
      throw error;
    }
  }

  private async analyzeSentiment(asset: string): Promise<SentimentSignals> {
    try {
      // Fetch real social media and news data
      const [socialData, newsData] = await Promise.all([
        this.fetchSocialMediaData(asset),
        this.fetchNewsData(asset)
      ]);

      // Process with GPT-4 for sentiment analysis
      const prompt = `Analyze the market sentiment for ${asset} based on the following data:
        Social Media Metrics: ${JSON.stringify(socialData)}
        News Articles: ${JSON.stringify(newsData)}

        Provide sentiment analysis scores in JSON format:
        {
          "socialMediaScore": number (-1 to 1),
          "newsImpact": number (-1 to 1),
          "marketMomentum": number (-1 to 1),
          "communityEngagement": number (0 to 1)
        }`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const sentiment = JSON.parse(response.choices[0].message.content || '{}') as SentimentSignals;
      return sentiment;
    } catch (error) {
      console.error('Error in sentiment analysis:', error);
      throw error;
    }
  }

  private async analyzeFundamentals(asset: string): Promise<FundamentalSignals> {
    try {
      // Fetch real on-chain data
      const [marketData, networkStats] = await Promise.all([
        this.fetchMarketData(asset),
        this.fetchNetworkStatistics()
      ]);

      return {
        marketCap: marketData.market_cap,
        volume24h: marketData.total_volume,
        dominanceIndex: marketData.market_cap_dominance,
        networkActivity: {
          transactions: networkStats.transactions,
          activeAddresses: networkStats.activeAddresses,
          gasUsed: networkStats.gasUsed
        }
      };
    } catch (error) {
      console.error('Error in fundamental analysis:', error);
      throw error;
    }
  }

  private async fetchSocialMediaData(asset: string): Promise<SocialStatsResponse> {
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${asset}/social_stats`);
    return response.json();
  }

  private async fetchNewsData(asset: string): Promise<NewsResponse> {
    const response = await fetch(`https://crypto-news-api.com/api/v1/coin/${asset}`);
    return response.json();
  }

  private async fetchMarketData(asset: string) {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${asset}?localization=false&tickers=false&sparkline=false`
    );
    return response.json();
  }

  private async fetchNetworkStatistics() {
    try {
      const [blockNumber, gasPrice] = await Promise.all([
        publicClient.getBlockNumber(),
        publicClient.getGasPrice()
      ]);

      const recentBlocks = await Promise.all(
        Array.from({ length: 10 }, async (_, i) => {
          const block = await publicClient.getBlock({ 
            blockNumber: blockNumber - BigInt(i) 
          });
          return block;
        })
      );

      const transactions = recentBlocks.reduce(
        (sum, block) => sum + (block.transactions?.length || 0), 
        0
      );

      const uniqueAddresses = new Set<string>();
      recentBlocks.forEach(block => {
        if (block.transactions) {
          block.transactions.forEach(tx => {
            if (typeof tx === 'string') {
              uniqueAddresses.add(tx);
            }
          });
        }
      });

      return {
        transactions,
        activeAddresses: uniqueAddresses.size,
        gasUsed: Number(gasPrice)
      };
    } catch (error) {
      console.error('Error fetching network statistics:', error);
      throw error;
    }
  }

  // Technical Analysis Calculations
  private calculateRSI(prices: number[]): number {
    const periods = 14;
    const changes = prices.slice(1).map((price, i) => price - prices[i]);
    const gains = changes.map(change => change > 0 ? change : 0);
    const losses = changes.map(change => change < 0 ? -change : 0);

    const avgGain = gains.slice(-periods).reduce((sum, gain) => sum + gain, 0) / periods;
    const avgLoss = losses.slice(-periods).reduce((sum, loss) => sum + loss, 0) / periods;

    const rs = avgGain / (avgLoss || 1);
    return 100 - (100 / (1 + rs));
  }

  private calculateMACD(prices: number[]): { value: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;
    const signalLine = this.calculateEMA([macdLine], 9);

    return {
      value: macdLine,
      signal: signalLine,
      histogram: macdLine - signalLine
    };
  }

  private calculateEMA(prices: number[], periods: number): number {
    const k = 2 / (periods + 1);
    return prices.reduce((ema, price) => price * k + ema * (1 - k), prices[0]);
  }

  private calculateBollingerBands(prices: number[]): { upper: number; lower: number; middle: number } {
    const periods = 20;
    const stdDev = 2;

    const sma = prices.slice(-periods).reduce((sum, price) => sum + price, 0) / periods;
    const variance = prices.slice(-periods)
      .reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / periods;
    const std = Math.sqrt(variance);

    return {
      upper: sma + stdDev * std,
      middle: sma,
      lower: sma - stdDev * std
    };
  }

  private calculateBollingerPosition(currentPrice: number, bands: { upper: number; lower: number }): number {
    const range = bands.upper - bands.lower;
    return (currentPrice - bands.lower) / range;
  }

  private calculateTrendStrength(prices: number[]): number {
    const changes = prices.slice(1).map((price, i) => price - prices[i]);
    const positiveChanges = changes.filter(change => change > 0).length;
    return positiveChanges / changes.length;
  }

  async generateMarketPrediction(asset: string): Promise<MarketPrediction> {
    try {
      const [technical, sentiment, fundamental] = await Promise.all([
        this.analyzeTechnicalIndicators(asset),
        this.analyzeSentiment(asset),
        this.analyzeFundamentals(asset),
      ]);

      const direction = this.determineDirection(technical, sentiment, fundamental);
      const confidence = this.calculateConfidence(technical, sentiment, fundamental);

      // Calculate actual technical indicators
      const prices = (await this.fetchHistoricalData(asset)).prices.map(p => p[1]);
      const indicators = {
        rsi: this.calculateRSI(prices),
        macd: this.calculateMACD(prices),
        volume: fundamental.volume24h,
        volatility: this.calculateVolatility(prices)
      };

      return {
        asset,
        direction,
        confidence,
        timeframe: '24h',
        signals: {
          technical,
          sentiment,
          fundamental,
        },
        indicators
      };
    } catch (error) {
      console.error('Error generating market prediction:', error);
      throw error;
    }
  }

  private calculateVolatility(prices: number[]): number {
    const returns = prices.slice(1).map((price, i) => Math.log(price / prices[i]));
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const squaredDiffs = returns.map(ret => Math.pow(ret - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((sum, diff) => sum + diff, 0) / returns.length);
  }

  private determineDirection(
    technical: TechnicalSignals,
    sentiment: SentimentSignals,
    fundamental: FundamentalSignals
  ): 'bullish' | 'bearish' | 'neutral' {
    // Complex direction determination logic
    const technicalScore = (
      technical.macdSignal +
      (technical.rsiValue - 50) / 50 +
      technical.bollingerPosition
    ) / 3;

    const sentimentScore = (
      sentiment.socialMediaScore +
      sentiment.newsImpact +
      sentiment.marketMomentum
    ) / 3;

    const fundamentalScore = (
      Math.log10(fundamental.marketCap) / 10 +
      Math.log10(fundamental.volume24h) / 10 +
      fundamental.dominanceIndex
    ) / 3;

    const totalScore = (
      technicalScore * 0.4 +
      sentimentScore * 0.3 +
      fundamentalScore * 0.3
    );

    if (totalScore > 0.2) return 'bullish';
    if (totalScore < -0.2) return 'bearish';
    return 'neutral';
  }

  private calculateConfidence(
    technical: TechnicalSignals,
    sentiment: SentimentSignals,
    fundamental: FundamentalSignals
  ): number {
    // Sophisticated confidence calculation
    const technicalConfidence = technical.trendStrength;
    const sentimentConfidence = Math.abs(sentiment.marketMomentum);
    const fundamentalConfidence = fundamental.networkActivity.transactions > 0 ? 
      Math.min(1, Math.log10(fundamental.networkActivity.transactions) / 5) : 0;

    // Weight the different confidence factors
    return Math.min(1, (
      technicalConfidence * 0.4 +
      sentimentConfidence * 0.3 +
      fundamentalConfidence * 0.3
    ));
  }
}

export const marketAnalyticsEngine = new MarketAnalyticsEngine();