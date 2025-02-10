import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MarketService } from '../services/market-service';
import { websocketManager } from '../services/websocket-service';
import { useEffect } from 'react';
import { MarketData } from '../types/agent';

export function useMarketData(tokenId: string) {
  const queryClient = useQueryClient();

  const { data: marketData, error, isLoading } = useQuery<MarketData, Error>({
    queryKey: ['market', tokenId],
    queryFn: () => MarketService.getTokenPrice(tokenId),
    staleTime: 30000, // Consider data fresh for 30 seconds
    retry: 3,
  });

  useEffect(() => {
    // Subscribe to real-time updates
    websocketManager.subscribeToPriceUpdates(tokenId);

    const handlePriceUpdate = (update: any) => {
      if (update[tokenId]) {
        queryClient.setQueryData(['market', tokenId], (oldData: MarketData | undefined) => ({
          ...oldData,
          price: parseFloat(update[tokenId]),
          timestamp: new Date().toISOString(),
        }));
      }
    };

    websocketManager.on('priceUpdate', handlePriceUpdate);

    return () => {
      websocketManager.off('priceUpdate', handlePriceUpdate);
      websocketManager.unsubscribeFromPriceUpdates(tokenId);
    };
  }, [tokenId, queryClient]);

  return {
    marketData,
    error,
    isLoading,
  };
}

export function useMarketChart(tokenId: string, days: number = 7) {
  return useQuery({
    queryKey: ['marketChart', tokenId, days],
    queryFn: () => MarketService.getMarketChart(tokenId, days),
    staleTime: 300000, // Consider chart data fresh for 5 minutes
    retry: 2,
  });
}

export function useTrendingTokens() {
  return useQuery({
    queryKey: ['trending'],
    queryFn: () => MarketService.getTrendingTokens(),
    staleTime: 300000, // Consider trending data fresh for 5 minutes
    retry: 2,
  });
}
