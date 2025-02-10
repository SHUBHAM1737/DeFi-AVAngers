import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useMarketChart } from '../hooks/use-market-data';

interface MarketChartProps {
  tokenId: string;
  timeframe?: number;
}

export function MarketChart({ tokenId, timeframe = 7 }: MarketChartProps) {
  const { data: chartData, error, isLoading } = useMarketChart(tokenId, timeframe);
  const [formattedData, setFormattedData] = useState<any[]>([]);

  useEffect(() => {
    if (chartData?.prices) {
      const formatted = chartData.prices.map(([timestamp, price]) => ({
        timestamp,
        price,
        date: format(new Date(timestamp), 'MMM dd HH:mm'),
      }));
      setFormattedData(formatted);
    }
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-[#151f2e] rounded-lg border border-white/10">
        <Loader2 className="w-8 h-8 animate-spin text-[#E84142]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-[#151f2e] rounded-lg border border-white/10">
        <p className="text-white/60">{error instanceof Error ? error.message : 'Failed to load chart data'}</p>
      </div>
    );
  }

  if (!formattedData.length) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-[#151f2e] rounded-lg border border-white/10">
        <p className="text-white/60">No chart data available</p>
      </div>
    );
  }

  return (
    <div className="h-[400px] bg-[#151f2e] rounded-lg border border-white/10 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#E84142" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#E84142" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.6)"
            tick={{ fill: 'rgba(255,255,255,0.6)' }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.6)"
            tick={{ fill: 'rgba(255,255,255,0.6)' }}
            domain={['auto', 'auto']}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.5rem',
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
            itemStyle={{ color: '#E84142' }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Price']}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#E84142"
            fillOpacity={1}
            fill="url(#colorPrice)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}