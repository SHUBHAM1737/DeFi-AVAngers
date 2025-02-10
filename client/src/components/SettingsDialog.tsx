import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Key, Wallet, Cog, Eye, EyeOff } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [showKey, setShowKey] = useState<Record<string, boolean>>({
    trading: false,
    bridge: false,
    analytics: false
  });

  const [formData, setFormData] = useState({
    tradingKey: '',
    bridgeKey: '',
    analyticsKey: '',
    defaultDex: 'TraderJoe',
    bridgeService: 'LayerZero',
    rpcEndpoint: 'https://api.avax-test.network/ext/bc/C/rpc'
  });

  const toggleKeyVisibility = (field: 'trading' | 'bridge' | 'analytics') => {
    setShowKey(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = () => {
    // Save settings logic here
    onOpenChange(false);
  };

  const handleReset = () => {
    setFormData({
      tradingKey: '',
      bridgeKey: '',
      analyticsKey: '',
      defaultDex: 'TraderJoe',
      bridgeService: 'LayerZero',
      rpcEndpoint: 'https://api.avax-test.network/ext/bc/C/rpc'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] bg-[#111927] border border-white/10 flex flex-col overflow-hidden p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#E84142]" />
            Platform Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="keys" className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full bg-[#151f2e] border-b border-white/10 px-6 py-2">
            <TabsTrigger value="keys" className="flex items-center gap-2 data-[state=active]:text-[#E84142]">
              <Key className="w-4 h-4" />
              Private Keys
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2 data-[state=active]:text-[#E84142]">
              <Wallet className="w-4 h-4" />
              Saved Addresses
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2 data-[state=active]:text-[#E84142]">
              <Cog className="w-4 h-4" />
              Default Services
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto min-h-0">
            <TabsContent value="keys" className="p-6 space-y-6 m-0">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label className="text-white">Trading Private Key</Label>
                  <div className="relative">
                    <Input 
                      type={showKey.trading ? "text" : "password"}
                      value={formData.tradingKey}
                      onChange={(e) => setFormData(prev => ({ ...prev, tradingKey: e.target.value }))}
                      placeholder="Enter private key for DeFi operations"
                      className="bg-[#151f2e] border-white/10 text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => toggleKeyVisibility('trading')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                    >
                      {showKey.trading ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-sm text-white/60">Used for executing DeFi transactions and token swaps</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Bridge Private Key</Label>
                  <div className="relative">
                    <Input 
                      type={showKey.bridge ? "text" : "password"}
                      value={formData.bridgeKey}
                      onChange={(e) => setFormData(prev => ({ ...prev, bridgeKey: e.target.value }))}
                      placeholder="Enter private key for cross-chain transfers"
                      className="bg-[#151f2e] border-white/10 text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => toggleKeyVisibility('bridge')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                    >
                      {showKey.bridge ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-sm text-white/60">Required for cross-chain operations and bridging assets</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Analytics Key</Label>
                  <div className="relative">
                    <Input 
                      type={showKey.analytics ? "text" : "password"}
                      value={formData.analyticsKey}
                      onChange={(e) => setFormData(prev => ({ ...prev, analyticsKey: e.target.value }))}
                      placeholder="Enter key for analytics operations"
                      className="bg-[#151f2e] border-white/10 text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => toggleKeyVisibility('analytics')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                    >
                      {showKey.analytics ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-sm text-white/60">Used for accessing advanced analytics and data services</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="addresses" className="p-6 m-0">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-white">Saved Addresses</h3>
                  <Button variant="outline" className="bg-[#E84142] hover:bg-[#E84142]/90 text-white border-0">
                    Add New Address
                  </Button>
                </div>

                <div className="grid gap-4">
                  <div className="p-4 bg-[#151f2e] rounded-lg border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">Main Trading Wallet</p>
                        <p className="text-sm text-white/60 font-mono">0x1234...5678</p>
                      </div>
                      <Button variant="ghost" className="text-white/60 hover:text-white">Edit</Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="services" className="p-6 m-0">
              <div className="space-y-6">
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label className="text-white">Default DEX</Label>
                    <Input 
                      value={formData.defaultDex}
                      onChange={(e) => setFormData(prev => ({ ...prev, defaultDex: e.target.value }))}
                      placeholder="TraderJoe"
                      className="bg-[#151f2e] border-white/10 text-white"
                    />
                    <p className="text-sm text-white/60">Preferred decentralized exchange for token swaps</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Bridge Service</Label>
                    <Input 
                      value={formData.bridgeService}
                      onChange={(e) => setFormData(prev => ({ ...prev, bridgeService: e.target.value }))}
                      placeholder="LayerZero"
                      className="bg-[#151f2e] border-white/10 text-white"
                    />
                    <p className="text-sm text-white/60">Default bridge service for cross-chain transfers</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">RPC Endpoint</Label>
                    <Input 
                      value={formData.rpcEndpoint}
                      onChange={(e) => setFormData(prev => ({ ...prev, rpcEndpoint: e.target.value }))}
                      placeholder="https://api.avax-test.network/ext/bc/C/rpc"
                      className="bg-[#151f2e] border-white/10 text-white"
                    />
                    <p className="text-sm text-white/60">Custom RPC endpoint for blockchain interactions</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>

          <div className="border-t border-white/10 p-4 bg-[#151f2e]">
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="bg-transparent border-white/10 text-white hover:bg-white/5"
              >
                Reset
              </Button>
              <Button 
                onClick={handleSave}
                className="bg-[#E84142] hover:bg-[#E84142]/90 text-white"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}