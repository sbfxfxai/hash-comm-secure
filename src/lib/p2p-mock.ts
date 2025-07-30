import { BitCommMessage, verifyProofOfWork } from './bitcomm';

export interface P2PNode {
  peerId: string;
  isOnline: boolean;
  connectedPeers: Set<string>;
}

export interface MessageEnvelope {
  id: string;
  message: BitCommMessage;
  timestamp: number;
  signature: string;
}

export class BitCommP2PNetwork {
  private node: P2PNode | null = null;
  private messageHandlers: Set<(envelope: MessageEnvelope) => void> = new Set();
  private isInitialized = false;

  async initialize(): Promise<P2PNode> {
    // Mock implementation for demo purposes
    const mockPeerId = 'mock-peer-' + Math.random().toString(36).substring(2, 15);
    
    this.node = {
      peerId: mockPeerId,
      isOnline: true,
      connectedPeers: new Set([
        'peer-' + Math.random().toString(36).substring(2, 8),
        'peer-' + Math.random().toString(36).substring(2, 8),
        'peer-' + Math.random().toString(36).substring(2, 8)
      ])
    };

    this.isInitialized = true;
    console.log(`Mock BitComm P2P node started. Peer ID: ${this.node.peerId}`);
    
    // Simulate receiving a test message after 5 seconds
    setTimeout(() => {
      this.simulateIncomingMessage();
    }, 5000);

    return this.node;
  }

  private simulateIncomingMessage(): void {
    const mockMessage: BitCommMessage = {
      id: 'mock-msg-' + Date.now(),
      from: 'demo-sender-address-12345',
      to: 'demo-recipient-address-67890',
      content: 'Hello from the P2P network! This is a test message.',
      encrypted: 'mock-encrypted-content',
      timestamp: new Date(),
      pow: {
        nonce: 12345,
        hash: '0000abcd1234567890',
        computeTime: 15.5,
        difficulty: 4
      },
      delivered: true
    };

    const envelope: MessageEnvelope = {
      id: mockMessage.id,
      message: mockMessage,
      timestamp: Date.now(),
      signature: 'mock-signature'
    };

    // Notify all message handlers
    this.messageHandlers.forEach(handler => handler(envelope));
    console.log('Simulated incoming P2P message');
  }

  async sendMessage(envelope: MessageEnvelope, targetPeerId?: string): Promise<boolean> {
    if (!this.node || !this.node.isOnline) {
      throw new Error('P2P node not initialized or offline');
    }

    // Mock sending - just log it
    console.log(`Mock sending message to ${targetPeerId || 'broadcast'}`);
    return true;
  }

  async findPeersForAddress(bitcommAddress: string): Promise<string[]> {
    if (!this.node) return [];
    
    // Return mock peers
    return Array.from(this.node.connectedPeers);
  }

  addMessageHandler(handler: (envelope: MessageEnvelope) => void): void {
    this.messageHandlers.add(handler);
  }

  removeMessageHandler(handler: (envelope: MessageEnvelope) => void): void {
    this.messageHandlers.delete(handler);
  }

  getNetworkStats() {
    if (!this.node) {
      return {
        peerId: 'Not connected',
        connectedPeers: 0,
        isOnline: false,
        peers: [] as string[]
      };
    }

    return {
      peerId: this.node.peerId,
      connectedPeers: this.node.connectedPeers.size,
      isOnline: this.node.isOnline,
      peers: Array.from(this.node.connectedPeers)
    };
  }

  async shutdown(): Promise<void> {
    if (this.node) {
      this.node.isOnline = false;
      this.node.connectedPeers.clear();
      this.isInitialized = false;
      console.log('Mock P2P network shut down');
    }
  }
}

// Singleton instance for the application
export const bitcommP2P = new BitCommP2PNetwork();