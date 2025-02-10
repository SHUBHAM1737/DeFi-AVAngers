import { WebSocket, WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import { randomBytes } from 'crypto';

class MockBlockchainNode extends EventEmitter {
  private blockNumber: number = 0;
  private blockInterval!: NodeJS.Timeout;
  private isRunning: boolean = false;
  private transactions: Map<string, any> = new Map();
  private readonly chainId: number = 1337; // Mock chain ID

  constructor() {
    super();
    this.startMining();
  }

  private startMining() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.blockInterval = setInterval(() => {
      this.blockNumber++;
      this.emit('block', this.blockNumber);
    }, 12000); // New block every 12 seconds
  }

  stop() {
    if (this.blockInterval) {
      clearInterval(this.blockInterval);
      this.isRunning = false;
    }
  }

  getBlockNumber(): number {
    return this.blockNumber;
  }

  // Mock balance for any address
  getBalance(_address: string): string {
    return '1000000000000000000'; // 1 SONIC
  }

  // Mock transaction processing
  sendTransaction(tx: any): string {
    const txHash = '0x' + randomBytes(32).toString('hex');
    this.transactions.set(txHash, {
      ...tx,
      blockNumber: this.blockNumber,
      timestamp: Date.now(),
    });
    return txHash;
  }

  // Mock contract call
  call(_tx: any): string {
    return '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000'; // Mock response
  }

  // Mock gas estimation
  estimateGas(_tx: any): string {
    return '0x5208'; // 21000 gas units
  }

  getChainId(): number {
    return this.chainId;
  }

  // Get transaction by hash
  getTransaction(txHash: string): any {
    return this.transactions.get(txHash);
  }
}

export function startMockBlockchain(server: WebSocketServer) {
  const node = new MockBlockchainNode();

  server.on('connection', (ws: WebSocket) => {
    console.log('Mock blockchain client connected');
    let isAlive = true;

    const pingInterval = setInterval(() => {
      if (!isAlive) {
        ws.terminate();
        return;
      }
      isAlive = false;
      ws.ping();
    }, 30000);

    ws.on('pong', () => {
      isAlive = true;
    });

    ws.on('message', async (data: string) => {
      try {
        const request = JSON.parse(data.toString());
        let response;

        switch (request.method) {
          case 'eth_blockNumber':
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x' + node.getBlockNumber().toString(16)
            };
            break;
          case 'eth_getBalance':
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x' + BigInt(node.getBalance(request.params[0])).toString(16)
            };
            break;
          case 'eth_sendTransaction':
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: node.sendTransaction(request.params[0])
            };
            break;
          case 'eth_call':
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: node.call(request.params[0])
            };
            break;
          case 'eth_estimateGas':
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: node.estimateGas(request.params[0])
            };
            break;
          case 'eth_chainId':
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x' + node.getChainId().toString(16)
            };
            break;
          case 'eth_getTransactionByHash':
            const tx = node.getTransaction(request.params[0]);
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: tx || null
            };
            break;
          default:
            response = {
              jsonrpc: '2.0',
              id: request.id,
              error: { code: -32601, message: 'Method not found' }
            };
        }

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(response));
        }
      } catch (error) {
        console.error('Error processing blockchain request:', error);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: { code: -32603, message: 'Internal error' }
          }));
        }
      }
    });

    // Send new block notifications
    const blockHandler = (blockNumber: number) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_subscription',
          params: {
            subscription: '0x1',
            result: {
              number: '0x' + blockNumber.toString(16)
            }
          }
        }));
      }
    };

    node.on('block', blockHandler);

    ws.on('close', () => {
      clearInterval(pingInterval);
      node.removeListener('block', blockHandler);
      console.log('Mock blockchain client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clearInterval(pingInterval);
      node.removeListener('block', blockHandler);
    });
  });

  return node;
}