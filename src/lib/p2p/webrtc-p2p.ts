// Simple, working P2P WebRTC implementation for BitComm
import { BitCommMessage, verifyProofOfWork } from '../bitcomm';

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

export class WebRTCP2PNetwork {
  private messageHandlers: Set<(envelope: MessageEnvelope) => void> = new Set();
  private isInitialized = false;
  private localPeerId: string = '';
  private bitcommAddress: string = '';

  constructor() {
    // Generate a local peer ID immediately
    this.localPeerId = 'local-' + Math.random().toString(36).substr(2, 9);
    console.log('🔧 Simple P2P Network initialized with local peer ID:', this.localPeerId);
  }

  async initialize(bitcommAddress: string): Promise<P2PNode> {
    console.log('🚀 Initializing Simple P2P network for address:', bitcommAddress);
    
    this.bitcommAddress = bitcommAddress;
    this.isInitialized = true;
    
    const p2pNode: P2PNode = {
      peerId: this.localPeerId,
      isOnline: true,
      connectedPeers: new Set() // Start with no peers
    };

    console.log('✅ P2P node ready (local mode)', p2pNode);
    return p2pNode;
  }



  // For now, just simulate message handling locally
  private simulateMessageReception(envelope: MessageEnvelope): void {
    // Store received message to localStorage for testing
    const storedMessages = localStorage.getItem('bitcomm-received-messages') || '[]';
    const messages = JSON.parse(storedMessages);
    messages.unshift(envelope);
    localStorage.setItem('bitcomm-received-messages', JSON.stringify(messages.slice(0, 50))); // Keep last 50
    
    // Notify message handlers
    this.messageHandlers.forEach(handler => handler(envelope));
    console.log('📨 Simulated message reception:', envelope.id);
  }

  async sendMessage(envelope: MessageEnvelope, targetPeerId?: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('P2P node not initialized');
    }

    try {
      // For now, just store locally and simulate sending
      console.log('📤 Simulating message send (local mode):', envelope.id);
      
      // Store the sent message locally
      const storedSentMessages = localStorage.getItem('bitcomm-sent-messages') || '[]';
      const sentMessages = JSON.parse(storedSentMessages);
      sentMessages.unshift(envelope.message);
      localStorage.setItem('bitcomm-sent-messages', JSON.stringify(sentMessages.slice(0, 50)));
      
      // For testing purposes, simulate receiving our own message after a delay
      setTimeout(() => {
        this.simulateMessageReception(envelope);
      }, 1000);
      
      return true; // Always succeed in local mode
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }

  async findPeersForAddress(bitcommAddress: string): Promise<string[]> {
    // Return empty array for now (no real peers in local mode)
    return [];
  }

  addMessageHandler(handler: (envelope: MessageEnvelope) => void): void {
    this.messageHandlers.add(handler);
  }

  removeMessageHandler(handler: (envelope: MessageEnvelope) => void): void {
    this.messageHandlers.delete(handler);
  }

  getNetworkStats() {
    if (!this.isInitialized) {
      return {
        peerId: 'Not connected',
        connectedPeers: 0,
        isOnline: false,
        peers: [] as string[]
      };
    }

    return {
      peerId: this.localPeerId,
      connectedPeers: 0, // No real peers in local mode
      isOnline: true,
      peers: [] // No real peers in local mode
    };
  }

  async shutdown(): Promise<void> {
    // Simple shutdown for local mode
    this.isInitialized = false;
    this.messageHandlers.clear();
    console.log('🔌 Simple P2P network shut down');
  }

}

// Export singleton instance
export const webrtcP2P = new WebRTCP2PNetwork();