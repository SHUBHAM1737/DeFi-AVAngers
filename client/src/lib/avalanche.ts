import { Contract } from '@ethersproject/contracts';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { parseUnits, formatUnits } from '@ethersproject/units';

export class AvalancheProvider {
  private provider: JsonRpcProvider | null = null;
  private wallet: Wallet | null = null;
  private readonly chainId = 43113; // Avalanche Fuji Testnet

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  private async connect() {
    try {
      this.provider = new JsonRpcProvider('https://api.avax-test.network/ext/bc/C/rpc');

      // Verify chain ID matches Fuji testnet
      const networkChainId = await this.provider.getNetwork()
        .then(network => network.chainId)
        .catch(() => -1);

      if (networkChainId !== this.chainId) {
        throw new Error('Connected to wrong network');
      }

      console.log('Connected to Avalanche Fuji Testnet');
    } catch (error) {
      console.error('Failed to connect to Avalanche network:', error);
    }
  }

  private ensureConnection() {
    if (!this.provider) {
      throw new Error('Not connected to Avalanche Fuji network');
    }
    return this.provider;
  }

  async createWallet(): Promise<{ address: string; privateKey: string }> {
    const wallet = Wallet.createRandom();
    this.wallet = wallet;
    return {
      address: wallet.address,
      privateKey: wallet.privateKey
    };
  }

  async loadWallet(privateKey: string): Promise<string> {
    try {
      const provider = this.ensureConnection();
      this.wallet = new Wallet(privateKey, provider);
      return this.wallet.address;
    } catch (error) {
      console.error('Error loading wallet:', error);
      throw new Error('Failed to load wallet');
    }
  }

  async getBalance(address: string): Promise<string> {
    try {
      const provider = this.ensureConnection();
      const balance = await provider.getBalance(address);
      return formatUnits(balance, 18); // 18 decimals for AVAX
    } catch (error) {
      console.error('Error getting balance:', error);
      throw new Error('Failed to get balance');
    }
  }

  async sendTransaction(to: string, amount: string, data?: string): Promise<string> {
    try {
      if (!this.wallet) {
        throw new Error('No wallet loaded');
      }

      const tx = await this.wallet.sendTransaction({
        to,
        value: parseUnits(amount, 18),
        data,
        chainId: this.chainId
      });

      return tx.hash;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw new Error('Failed to send transaction');
    }
  }

  async estimateGas(tx: any): Promise<string> {
    try {
      const provider = this.ensureConnection();
      const gasEstimate = await provider.estimateGas(tx);
      return gasEstimate.toString();
    } catch (error) {
      console.error('Error estimating gas:', error);
      throw new Error('Failed to estimate gas');
    }
  }

  async callContract(address: string, data: string): Promise<string> {
    try {
      const provider = this.ensureConnection();
      return await provider.call({
        to: address,
        data
      });
    } catch (error) {
      console.error('Error calling contract:', error);
      throw new Error('Failed to call contract');
    }
  }

  async getLatestBlock(): Promise<number> {
    try {
      const provider = this.ensureConnection();
      return await provider.getBlockNumber();
    } catch (error) {
      console.error('Error getting latest block:', error);
      return -1;
    }
  }

  async getContract(address: string, abi: any): Promise<Contract> {
    const provider = this.ensureConnection();
    if (!this.wallet) {
      return new Contract(address, abi, provider);
    }
    return new Contract(address, abi, this.wallet);
  }

  get isConnected(): boolean {
    return !!this.provider && !!this.wallet;
  }

  get currentAddress(): string | null {
    return this.wallet?.address || null;
  }
}

export const avalancheProvider = typeof window !== 'undefined' ? new AvalancheProvider() : null;
