import { createLibp2p, Libp2p } from 'libp2p';
import { webSockets } from '@libp2p/websockets';
import { webRTC } from '@libp2p/webrtc';
import { noise } from '@libp2p/noise';
import { mplex } from '@libp2p/mplex';
import { kadDHT } from '@libp2p/kad-dht';
import { peerIdFromString } from '@libp2p/peer-id';
import { BitCommMessage, verifyProofOfWork } from './bitcomm';

export interface P2PNode {
  libp2p: Libp2p;
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
  private bootstrapPeers: string[] = [
    // BitComm testnet bootstrap nodes (would be real addresses in production)
    '/dns4/bootstrap1.bitcomm.network/tcp/4001/ws/p2p/12D3KooWExample1',
    '/dns4/bootstrap2.bitcomm.network/tcp/4001/ws/p2p/12D3KooWExample2'
  ];

  async initialize(): Promise<P2PNode> {
    try {
      const libp2p = await createLibp2p({
        addresses: {
          listen: ['/ip4/0.0.0.0/tcp/0/ws']
        },
        transports: [
          webSockets(),
          webRTC()
        ],
        connectionEncrypters: [noise()],
        streamMuxers: [mplex()],
        // Remove DHT for now to fix compatibility issues
        // services: {
        //   dht: kadDHT()
        // }
      });

      // Set up event listeners
      libp2p.addEventListener('peer:connect', (event) => {
        const peerId = event.detail.toString();
        this.node?.connectedPeers.add(peerId);
        console.log(`Connected to peer: ${peerId}`);
      });

      libp2p.addEventListener('peer:disconnect', (event) => {
        const peerId = event.detail.toString();
        this.node?.connectedPeers.delete(peerId);
        console.log(`Disconnected from peer: ${peerId}`);
      });

      // Handle incoming messages
      await libp2p.handle('/bitcomm/message/1.0.0', ({ stream }) => {
        this.handleIncomingMessage(stream);
      });

      await libp2p.start();

      this.node = {
        libp2p,
        peerId: libp2p.peerId.toString(),
        isOnline: true,
        connectedPeers: new Set()
      };

      // Connect to bootstrap peers
      await this.connectToBootstrapPeers();

      console.log(`BitComm P2P node started. Peer ID: ${this.node.peerId}`);
      return this.node;

    } catch (error) {
      console.error('Failed to initialize P2P network:', error);
      throw error;
    }
  }

  private async connectToBootstrapPeers(): Promise<void> {
    if (!this.node) return;

    for (const peerAddr of this.bootstrapPeers) {
      try {
        // In a real implementation, these would be actual multiaddresses
        console.log(`Attempting to connect to bootstrap peer: ${peerAddr}`);
        // await this.node.libp2p.dial(peerAddr);
      } catch (error) {
        console.warn(`Failed to connect to bootstrap peer ${peerAddr}:`, error);
      }
    }
  }

  private async handleIncomingMessage(stream: any): Promise<void> {
    try {
      const chunks: Uint8Array[] = [];
      
      for await (const chunk of stream.source) {
        chunks.push(chunk.subarray());
      }

      const messageData = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        messageData.set(chunk, offset);
        offset += chunk.length;
      }

      const messageJson = new TextDecoder().decode(messageData);
      const envelope: MessageEnvelope = JSON.parse(messageJson);

      // Verify proof-of-work before processing
      if (verifyProofOfWork(envelope.message.content, envelope.message.pow)) {
        // Notify all message handlers
        this.messageHandlers.forEach(handler => handler(envelope));
        console.log(`Received valid message from ${envelope.message.from}`);
      } else {
        console.warn('Rejected message with invalid proof-of-work');
      }

    } catch (error) {
      console.error('Error handling incoming message:', error);
    }
  }

  async sendMessage(envelope: MessageEnvelope, targetPeerId?: string): Promise<boolean> {
    if (!this.node || !this.node.isOnline) {
      throw new Error('P2P node not initialized or offline');
    }

    try {
      const messageData = new TextEncoder().encode(JSON.stringify(envelope));

      if (targetPeerId && this.node.connectedPeers.has(targetPeerId)) {
        // Direct send to specific peer
        const peerIdObj = peerIdFromString(targetPeerId);
        const stream = await this.node.libp2p.dialProtocol(peerIdObj, '/bitcomm/message/1.0.0');
        await stream.sink([messageData]);
        await stream.close();
        console.log(`Message sent directly to peer: ${targetPeerId}`);
        return true;
      } else {
        // Broadcast to all connected peers (store-and-forward)
        let success = false;
        for (const peerId of this.node.connectedPeers) {
          try {
            const peerIdObj = peerIdFromString(peerId);
            const stream = await this.node.libp2p.dialProtocol(peerIdObj, '/bitcomm/message/1.0.0');
            await stream.sink([messageData]);
            await stream.close();
            success = true;
          } catch (error) {
            console.warn(`Failed to send to peer ${peerId}:`, error);
          }
        }
        
        if (success) {
          console.log(`Message broadcasted to ${this.node.connectedPeers.size} peers`);
        }
        return success;
      }

    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  async findPeersForAddress(bitcommAddress: string): Promise<string[]> {
    if (!this.node) return [];

    try {
      // Use DHT to find peers associated with this BitComm address
      // In a real implementation, this would query the DHT for peers
      // who have announced they can receive messages for this address
      const peers: string[] = [];
      
      // For now, return connected peers (in production, would use DHT lookup)
      for (const peerId of this.node.connectedPeers) {
        peers.push(peerId);
      }

      return peers;
    } catch (error) {
      console.error('Error finding peers for address:', error);
      return [];
    }
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
    if (this.node?.libp2p) {
      await this.node.libp2p.stop();
      this.node.isOnline = false;
      this.node.connectedPeers.clear();
      console.log('P2P network shut down');
    }
  }
}

// Singleton instance for the application
export const bitcommP2P = new BitCommP2PNetwork();