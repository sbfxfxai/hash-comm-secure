// Real WebRTC P2P implementation for BitComm with production signaling
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

interface SignalingMessage {
  type: string;
  [key: string]: any;
}

export class WebRTCP2PNetwork {
  private connections = new Map<string, RTCPeerConnection>();
  private dataChannels = new Map<string, RTCDataChannel>();
  private messageHandlers: Set<(envelope: MessageEnvelope) => void> = new Set();
  private isInitialized = false;
  private localPeerId: string = '';
  private bitcommAddress: string = '';
  private signalingSocket: WebSocket | null = null;
  private messageQueue: Map<string, MessageEnvelope[]> = new Map();
  private peerDiscoveryCallback: ((peer: any) => void) | null = null;
  private registrationComplete = false;

  constructor() {
    // Set up reconnection logic
    this.setupReconnection();
  }

  async initialize(bitcommAddress: string): Promise<P2PNode> {
    console.log('🚀 Initializing WebRTC P2P network...');
    
    this.bitcommAddress = bitcommAddress;
    
    // Connect to signaling server
    await this.connectToSignalingServer();
    
    this.isInitialized = true;
    
    const p2pNode: P2PNode = {
      peerId: this.localPeerId,
      isOnline: true,
      connectedPeers: new Set(this.connections.keys())
    };

    console.log('🌐 WebRTC P2P node ready for real peer connections');
    return p2pNode;
  }

  private async connectToSignalingServer(): Promise<void> {
    const signalingUrl = process.env.VITE_SIGNALING_SERVER_URL || 'wss://bitcomm-signaling.herokuapp.com';
    
    return new Promise((resolve, reject) => {
      console.log('🚀 Connecting to production signaling server:', signalingUrl);
      
      this.signalingSocket = new WebSocket(signalingUrl);
      
      this.signalingSocket.onopen = () => {
        console.log('✅ Connected to signaling server');
        
        // Register with BitComm address
        this.signalingSocket?.send(JSON.stringify({
          type: 'register',
          bitcommAddress: this.bitcommAddress
        }));
        
        resolve();
      };
      
      this.signalingSocket.onmessage = (event) => {
        this.handleSignalingMessage(JSON.parse(event.data));
      };
      
      this.signalingSocket.onerror = (error) => {
        console.error('❌ Signaling server connection error:', error);
        reject(error);
      };
      
      this.signalingSocket.onclose = () => {
        console.log('⚠️ Signaling server disconnected, attempting reconnect...');
        setTimeout(() => this.connectToSignalingServer(), 5000);
      };
    });
  }



  private handleSignalingMessage(message: SignalingMessage): void {
    switch (message.type) {
      case 'welcome':
        this.localPeerId = message.peerId;
        console.log('🎉 Received peer ID:', this.localPeerId);
        break;
      
      case 'registered':
        console.log('✅ Registered with BitComm address:', message.bitcommAddress);
        this.registrationComplete = true;
        // Start looking for peers immediately after registration
        setTimeout(() => this.discoverPeers(), 1000);
        break;
      
      case 'peers-found':
        console.log('👥 Found peers:', message.peers);
        if (message.peers && message.peers.length > 0) {
          this.initiateConnections(message.peers);
        } else {
          console.log('No peers found for this address yet');
        }
        break;
      
      case 'offer':
      case 'answer':
      case 'ice-candidate':
        this.handleWebRTCSignaling(message);
        break;
      
      default:
        console.log('Unknown signaling message:', message.type);
    }
  }

  private async initiateConnections(peers: any[]): Promise<void> {
    for (const peer of peers) {
      await this.createPeerConnection(peer.peerId);
    }
  }

  private async createPeerConnection(remotePeerId: string): Promise<void> {
    console.log('Creating connection to:', remotePeerId);
    
    if (this.connections.has(remotePeerId)) {
      console.log('Already connected to:', remotePeerId);
      return;
    }
    
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
    
    peerConnection.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.signalingSocket?.send(JSON.stringify({
          type: 'ice-candidate',
          targetPeerId: remotePeerId,
          candidate
        }));
      }
    };
    
    peerConnection.ondatachannel = ({ channel }) => {
      channel.onmessage = (event) => {
        this.handleIncomingMessage(event.data, remotePeerId);
      };
    };

    const dataChannel = peerConnection.createDataChannel('bitcomm', { ordered: true });
    dataChannel.onopen = () => {
      console.log('Data channel open with peer:', remotePeerId);
    };

    this.connections.set(remotePeerId, peerConnection);
    this.dataChannels.set(remotePeerId, dataChannel);

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    this.signalingSocket?.send(JSON.stringify({
      type: 'offer',
      offer,
      targetPeerId: remotePeerId
    }));
  }

  private async handleWebRTCSignaling(message: SignalingMessage): Promise<void> {
    const { fromPeerId, type } = message;
    
    switch (type) {
      case 'offer':
        await this.handleOffer(fromPeerId, message.offer);
        break;
      case 'answer':
        await this.handleAnswer(fromPeerId, message.answer);
        break;
      case 'ice-candidate':
        await this.handleIceCandidate(fromPeerId, message.candidate);
        break;
    }
  }

  private async handleOffer(fromPeerId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    peerConnection.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.signalingSocket?.send(JSON.stringify({
          type: 'ice-candidate',
          targetPeerId: fromPeerId,
          candidate
        }));
      }
    };

    peerConnection.ondatachannel = ({ channel }) => {
      channel.onopen = () => {
        console.log('Data channel opened with peer:', fromPeerId);
        this.dataChannels.set(fromPeerId, channel);
        this.processQueuedMessages(fromPeerId);
      };
      channel.onmessage = (event) => {
        this.handleIncomingMessage(event.data, fromPeerId);
      };
    };

    this.connections.set(fromPeerId, peerConnection);
    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    this.signalingSocket?.send(JSON.stringify({
      type: 'answer',
      answer,
      targetPeerId: fromPeerId
    }));
  }

  private async handleAnswer(fromPeerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peerConnection = this.connections.get(fromPeerId);
    if (peerConnection) {
      await peerConnection.setRemoteDescription(answer);
      console.log('Answer set for peer:', fromPeerId);
    }
  }

  private async handleIceCandidate(fromPeerId: string, candidate: RTCIceCandidate): Promise<void> {
    const peerConnection = this.connections.get(fromPeerId);
    if (peerConnection) {
      await peerConnection.addIceCandidate(candidate);
      console.log('ICE candidate added for peer:', fromPeerId);
    }
  }

  private setupReconnection(): void {
    // Set up periodic peer discovery
    setInterval(() => {
      if (this.isInitialized && this.registrationComplete) {
        this.discoverPeers();
      }
    }, 30000); // Check for peers every 30 seconds
  }

  private discoverPeers(): void {
    if (this.signalingSocket && this.signalingSocket.readyState === WebSocket.OPEN) {
      this.signalingSocket.send(JSON.stringify({
        type: 'find-peers',
        targetAddress: this.bitcommAddress
      }));
    }
  }

  private queueMessage(targetPeerId: string, envelope: MessageEnvelope): void {
    if (!this.messageQueue.has(targetPeerId)) {
      this.messageQueue.set(targetPeerId, []);
    }
    this.messageQueue.get(targetPeerId)!.push(envelope);
  }

  private processQueuedMessages(peerId: string): void {
    const queuedMessages = this.messageQueue.get(peerId);
    if (queuedMessages) {
      queuedMessages.forEach((envelope) => {
        this.sendMessage(envelope, peerId);
      });
      this.messageQueue.delete(peerId);
      console.log('Processed queued messages for peer:', peerId);
    }
  }


  private handleIncomingMessage(data: string, fromPeerId: string): void {
    try {
      const envelope: MessageEnvelope = JSON.parse(data);
      
      if (verifyProofOfWork(envelope.message.content, envelope.message.pow)) {
        this.messageHandlers.forEach(handler => handler(envelope));
        console.log(`✅ Received valid BitComm message from ${fromPeerId}:`, envelope.id);
      } else {
        console.warn('❌ Received message with invalid proof of work');
      }
    } catch (error) {
      console.error('Error handling incoming message:', error);
    }
  }

  async sendMessage(envelope: MessageEnvelope, targetPeerId?: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('P2P node not initialized');
    }

    try {
      const messageData = JSON.stringify(envelope);

      if (targetPeerId && this.dataChannels.has(targetPeerId)) {
        // Send to specific peer
        const channel = this.dataChannels.get(targetPeerId)!;
        if (channel.readyState === 'open') {
          channel.send(messageData);
          console.log(`📤 Message sent directly to peer: ${targetPeerId}`);
          return true;
        }
      } else {
        // Broadcast to all connected peers
        let sentCount = 0;
        for (const [peerId, channel] of this.dataChannels.entries()) {
          if (channel.readyState === 'open') {
            channel.send(messageData);
            sentCount++;
          }
        }
        console.log(`📡 Message broadcast to ${sentCount} WebRTC peers`);
        return sentCount > 0;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }

  async findPeersForAddress(bitcommAddress: string): Promise<string[]> {
    // Return all connected peers that can route to this address
    return Array.from(this.connections.keys());
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
      connectedPeers: this.connections.size,
      isOnline: true,
      peers: Array.from(this.connections.keys())
    };
  }

  async shutdown(): Promise<void> {
    // Close all WebRTC connections
    for (const [peerId, connection] of this.connections.entries()) {
      connection.close();
      console.log(`Closed connection to peer: ${peerId}`);
    }
    
    this.connections.clear();
    this.dataChannels.clear();
    this.isInitialized = false;
    console.log('🔌 WebRTC P2P network shut down');
  }

}

// Export singleton instance
export const webrtcP2P = new WebRTCP2PNetwork();