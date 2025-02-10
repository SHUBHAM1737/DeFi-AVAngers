import React, { useState } from 'react';
import { MarketOverview } from './MarketOverview';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArrowRightLeft, TrendingUp, Wallet } from 'lucide-react';

export function TradingView() {
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('avalanche-2');

  const handleTrade = async () => {
    // Trade logic will be implemented here
    console.log('Trading:', amount, selectedToken);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 p-6">
      <div className="xl:col-span-2">
        <MarketOverview tokenId={selectedToken} />
      </div>

      <div className="space-y-6">
        <Card className="bg-[#151f2e] border-white/10">
          <Tabs defaultValue="swap" className="w-full">
            <TabsList className="w-full grid grid-cols-3 bg-[#0B1120]">
              <TabsTrigger value="swap" className="data-[state=active]:text-[#E84142]">
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Swap
              </TabsTrigger>
              <TabsTrigger value="market" className="data-[state=active]:text-[#E84142]">
                <TrendingUp className="w-4 h-4 mr-2" />
                Market
              </TabsTrigger>
              <TabsTrigger value="wallet" className="data-[state=active]:text-[#E84142]">
                <Wallet className="w-4 h-4 mr-2" />
                Wallet
              </TabsTrigger>
            </TabsList>

            <TabsContent value="swap" className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Amount</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-[#0B1120] border-white/10 text-white"
                />
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-white/60">Available Balance</span>
                <span className="text-white">0.00 AVAX</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Estimated Gas Fee</span>
                  <span className="text-white">~0.001 AVAX</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Price Impact</span>
                  <span className="text-green-500">0.05%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Minimum Received</span>
                  <span className="text-white">0.00 USDC</span>
                </div>
              </div>

              <Button
                onClick={handleTrade}
                className="w-full bg-[#E84142] hover:bg-[#E84142]/90"
                disabled={!amount}
              >
                Swap
              </Button>
            </TabsContent>

            <TabsContent value="market" className="p-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Market Orders</h3>
                <div className="space-y-2">
                  <Label className="text-white">Price</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="bg-[#0B1120] border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="bg-[#0B1120] border-white/10 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button className="bg-green-500 hover:bg-green-600">Buy</Button>
                  <Button className="bg-red-500 hover:bg-red-600">Sell</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="wallet" className="p-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Wallet Overview</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-3 bg-[#0B1120] rounded-lg">
                    <span className="text-white">AVAX</span>
                    <span className="text-white">0.00</span>
                  </div>
                  <div className="flex justify-between p-3 bg-[#0B1120] rounded-lg">
                    <span className="text-white">USDC</span>
                    <span className="text-white">0.00</span>
                  </div>
                  <div className="flex justify-between p-3 bg-[#0B1120] rounded-lg">
                    <span className="text-white">ETH</span>
                    <span className="text-white">0.00</span>
                  </div>
                </div>
                <Button className="w-full bg-[#E84142] hover:bg-[#E84142]/90">
                  Connect Wallet
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        <Card className="bg-[#151f2e] border-white/10 p-4">
          <h3 className="text-lg font-medium text-white mb-4">Recent Transactions</h3>
          <div className="space-y-2">
            <div className="text-white/60 text-sm text-center">
              No recent transactions
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
