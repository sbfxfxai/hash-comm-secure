// Distributed Consensus System for BitComm
import CryptoJS from 'crypto-js';

export interface ConsensusMessage {
  id: string;
  content: string;
  timestamp: number;
  signatures: Map<string, string>;
  confirmations: number;
  isVerified: boolean;
}

export interface ConsensusNode {
  nodeId: string;
  publicKey: string;
  stake: number;
  reputation: number;
  isActive: boolean;
}

export class DistributedConsensus {
  private nodes: Map<string, ConsensusNode> = new Map();
  private messages: Map<string, ConsensusMessage> = new Map();
  private requiredConfirmations = 3; // Minimum confirmations for consensus
  
  constructor() {
    this.initializeBootstrapNodes();
  }

  private initializeBootstrapNodes(): void {
    // Initialize with genesis nodes for cold start
    const genesisNodes = [
      { nodeId: 'genesis-1', publicKey: 'genesis-key-1', stake: 100, reputation: 100 },
      { nodeId: 'genesis-2', publicKey: 'genesis-key-2', stake: 100, reputation: 100 },
      { nodeId: 'genesis-3', publicKey: 'genesis-key-3', stake: 100, reputation: 100 }
    ];

    genesisNodes.forEach(node => {
      this.nodes.set(node.nodeId, {
        ...node,
        isActive: true
      });
    });

    console.log('🏛️ Distributed consensus initialized with genesis nodes');
  }

  async proposeMessage(content: string, proposerId: string): Promise<string> {
    const messageId = CryptoJS.SHA256(content + Date.now()).toString();
    
    const message: ConsensusMessage = {
      id: messageId,
      content,
      timestamp: Date.now(),
      signatures: new Map(),
      confirmations: 0,
      isVerified: false
    };

    this.messages.set(messageId, message);
    
    // Broadcast to network for consensus
    await this.broadcastForConsensus(messageId, proposerId);
    
    console.log('📢 Message proposed for consensus:', messageId);
    return messageId;
  }

  private async broadcastForConsensus(messageId: string, proposerId: string): Promise<void> {
    const message = this.messages.get(messageId);
    if (!message) return;

    // Simulate network broadcast and collect signatures
    const activeNodes = Array.from(this.nodes.values()).filter(node => node.isActive);
    
    for (const node of activeNodes) {
      // Simulate signature verification and consensus participation
      if (this.shouldNodeParticipate(node)) {
        const signature = this.generateSignature(message.content, node.nodeId);
        message.signatures.set(node.nodeId, signature);
        message.confirmations++;
        
        console.log(`✅ Node ${node.nodeId} confirmed message ${messageId}`);
      }
    }

    // Check if consensus reached
    if (message.confirmations >= this.requiredConfirmations) {
      message.isVerified = true;
      console.log('🎯 Consensus reached for message:', messageId);
    }
  }

  private shouldNodeParticipate(node: ConsensusNode): boolean {
    // Stake-weighted random participation
    const participationThreshold = 0.7 + (node.stake / 1000);
    return Math.random() < participationThreshold;
  }

  private generateSignature(content: string, nodeId: string): string {
    // Simulate cryptographic signature
    return CryptoJS.SHA256(content + nodeId + Date.now()).toString();
  }

  isMessageVerified(messageId: string): boolean {
    const message = this.messages.get(messageId);
    return message?.isVerified || false;
  }

  getNetworkStats() {
    return {
      totalNodes: this.nodes.size,
      activeNodes: Array.from(this.nodes.values()).filter(n => n.isActive).length,
      totalMessages: this.messages.size,
      verifiedMessages: Array.from(this.messages.values()).filter(m => m.isVerified).length,
      consensusThreshold: this.requiredConfirmations
    };
  }

  addNode(nodeData: Omit<ConsensusNode, 'isActive'>): void {
    this.nodes.set(nodeData.nodeId, {
      ...nodeData,
      isActive: true
    });
    console.log('🔗 New consensus node joined:', nodeData.nodeId);
  }

  removeNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.isActive = false;
      console.log('❌ Consensus node deactivated:', nodeId);
    }
  }
}

export const distributedConsensus = new DistributedConsensus();
