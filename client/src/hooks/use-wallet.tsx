import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { avalancheProvider } from '@/lib/avalanche';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export function useWallet() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.avalancheAddress) {
      loadWalletBalance();
    }
  }, [user?.avalancheAddress]);

  async function loadWalletBalance() {
    if (!user?.avalancheAddress || !avalancheProvider) return;

    try {
      const balance = await avalancheProvider.getBalance(user.avalancheAddress);
      setBalance(balance);
    } catch (error) {
      console.error('Error loading balance:', error);
      toast({
        title: 'Error loading balance',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }

  async function createWallet() {
    if (!user || !avalancheProvider) return;
    setIsLoading(true);

    try {
      const { address, privateKey } = await avalancheProvider.createWallet();

      // Update user record with new wallet info
      await apiRequest('POST', '/api/update-wallet', {
        avalancheAddress: address,
        privateKey: privateKey,
      });

      toast({
        title: 'Wallet Created',
        description: 'Your Avalanche wallet has been created successfully',
      });

      return address;
    } catch (error) {
      console.error('Error creating wallet:', error);
      toast({
        title: 'Error creating wallet',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function sendTransaction(to: string, amount: string) {
    if (!avalancheProvider || !user?.avalancheAddress) {
      throw new Error('Wallet not initialized');
    }

    try {
      const txHash = await avalancheProvider.sendTransaction(to, amount);
      toast({
        title: 'Transaction Sent',
        description: `Transaction hash: ${txHash}`,
      });
      return txHash;
    } catch (error) {
      console.error('Error sending transaction:', error);
      toast({
        title: 'Transaction Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      throw error;
    }
  }

  return {
    address: user?.avalancheAddress || null,
    balance,
    isLoading,
    createWallet,
    sendTransaction,
    refreshBalance: loadWalletBalance,
  };
}