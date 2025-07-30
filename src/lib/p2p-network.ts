import { BitCommMessage, verifyProofOfWork } from './bitcomm'

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
  private messageHandlers: Set<(envelope: MessageEnvelope) => void> = new Set();
  private isInitialized = false;
  private connectedPeers = new Set<string>();
  private isDemoMode = true; // Start in demo mode, real LibP2P coming soon

  async initialize(): Promise<P2PNode> {
    console.log('Initializing BitComm P2P Network...')
    
    // For now, we'll use demo mode while LibP2P integration is being finalized
    // Real LibP2P networking will be enabled in production
    return this.initializeDemoMode()
  }

  private async initializeDemoMode(): Promise<P2PNode> {
    const demoPeerId = 'demo-peer-' + Math.random().toString(36).substring(2, 15)
    
    // Add some demo peers
    this.connectedPeers.add('peer-' + Math.random().toString(36).substring(2, 8))
    this.connectedPeers.add('peer-' + Math.random().toString(36).substring(2, 8))
    this.connectedPeers.add('peer-' + Math.random().toString(36).substring(2, 8))

    this.isInitialized = true
    
    // Simulate receiving a test message after 5 seconds
    setTimeout(() => {
      this.simulateIncomingMessage()
    }, 5000)

    const p2pNode: P2PNode = {
      peerId: demoPeerId,
      isOnline: true,
      connectedPeers: this.connectedPeers
    }

    console.log(`Demo P2P node started. Peer ID: ${p2pNode.peerId}`)
    return p2pNode
  }

  // LibP2P integration methods will be added here when ready

  async sendMessage(envelope: MessageEnvelope, targetPeerId?: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('P2P node not initialized')
    }

    // Demo mode - just log the message sending
    console.log(`Demo: Sending message to ${targetPeerId || 'broadcast'} via P2P network`)
    console.log('Message envelope:', envelope)
    return true
  }

  async findPeersForAddress(bitcommAddress: string): Promise<string[]> {
    // Return demo peers that can route to this address
    return Array.from(this.connectedPeers)
  }

  addMessageHandler(handler: (envelope: MessageEnvelope) => void): void {
    this.messageHandlers.add(handler)
  }

  removeMessageHandler(handler: (envelope: MessageEnvelope) => void): void {
    this.messageHandlers.delete(handler)
  }

  getNetworkStats() {
    if (!this.isInitialized) {
      return {
        peerId: 'Not connected',
        connectedPeers: 0,
        isOnline: false,
        peers: [] as string[]
      }
    }

    return {
      peerId: this.isDemoMode ? 'demo-peer-' + Date.now().toString(36) : 'real-peer-id',
      connectedPeers: this.connectedPeers.size,
      isOnline: true,
      peers: Array.from(this.connectedPeers)
    }
  }

  async shutdown(): Promise<void> {
    this.connectedPeers.clear()
    this.isInitialized = false
    console.log('P2P network shut down')
  }

  private simulateIncomingMessage(): void {
    const mockMessage: BitCommMessage = {
      id: 'demo-msg-' + Date.now(),
      from: 'demo-sender-address-12345',
      to: 'demo-recipient-address-67890',
      content: 'Hello from the P2P network! This is a demo message.',
      encrypted: 'demo-encrypted-content',
      timestamp: new Date(),
      pow: {
        nonce: 12345,
        hash: '0000abcd1234567890',
        computeTime: 15.5,
        difficulty: 4
      },
      delivered: true
    }

    const envelope: MessageEnvelope = {
      id: mockMessage.id,
      message: mockMessage,
      timestamp: Date.now(),
      signature: 'demo-signature'
    }

    // Notify all message handlers
    this.messageHandlers.forEach(handler => handler(envelope))
    console.log('Simulated incoming P2P message')
  }
}

// Singleton instance for the application
export const bitcommP2P = new BitCommP2PNetwork()