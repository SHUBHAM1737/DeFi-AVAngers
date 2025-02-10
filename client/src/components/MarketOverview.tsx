import React from 'react';
import { ArrowUpIcon, ArrowDownIcon, Loader2 } from 'lucide-react';
import { Card } from './ui/card';
import { MarketChart } from './MarketChart';
import { useMarketData } from '../hooks/use-market-data';

interface MarketOverviewProps {
  tokenId: string;
}

export function MarketOverview({ tokenId }: MarketOverviewProps) {
  const { marketData, error, isLoading } = useMarketData(tokenId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#E84142]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-white/60">
        {error.message}
      </div>
    );
  }

  if (!marketData) {
    return (
      <div className="flex items-center justify-center h-96 text-white/60">
        No market data available
      </div>
    );
  }

  const isPriceUp = marketData.change24h >= 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#151f2e] border-white/10 p-6">
          <h3 className="text-sm font-medium text-white/60 mb-2">Current Price</h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">
              ${marketData.price.toLocaleString()}
            </span>
            <span
              className={`flex items-center text-sm ${
                isPriceUp ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {isPriceUp ? (
                <ArrowUpIcon className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDownIcon className="w-4 h-4 mr-1" />
              )}
              {Math.abs(marketData.change24h).toFixed(2)}%
            </span>
          </div>
        </Card>

        <Card className="bg-[#151f2e] border-white/10 p-6">
          <h3 className="text-sm font-medium text-white/60 mb-2">Market Cap</h3>
          <div className="text-2xl font-bold text-white">
            ${marketData.marketCap.toLocaleString()}
          </div>
        </Card>

        <Card className="bg-[#151f2e] border-white/10 p-6">
          <h3 className="text-sm font-medium text-white/60 mb-2">24h Volume</h3>
          <div className="text-2xl font-bold text-white">
            ${marketData.volume24h.toLocaleString()}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Price Chart</h2>
        <MarketChart tokenId={tokenId} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#151f2e] border-white/10 p-6">
          <h3 className="text-lg font-medium text-white mb-4">Market Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-white/60">All-Time High</span>
              <span className="text-white font-medium">
                ${marketData.ath.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">All-Time Low</span>
              <span className="text-white font-medium">
                ${marketData.atl.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Circulating Supply</span>
              <span className="text-white font-medium">
                {marketData.circulatingSupply.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Total Supply</span>
              <span className="text-white font-medium">
                {marketData.totalSupply?.toLocaleString() || 'N/A'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}