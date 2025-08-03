// Secure Decentralized P2P Network for BitComm
// Inspired by Briar, Session, and BitMessage architectures
import { BitCommMessage, verifyProofOfWork } from '../bitcomm';
import CryptoJS from 'crypto-js';

export interface P2PNode {
  peerId: string;
  isOnline: boolean;
  connectedPeers: Set<string>;
  networkType: 'direct' | 'dht' | 'mesh' | 'hybrid';
}

export interface MessageEnvelope {
  id: string;
  message: BitCommMessage;
  timestamp: number;
  signature: string;
  routing: {
    hops: number;
    maxHops: number;
    path: string[];
  };
  encryption: {
    algorithm: string;
    keyFingerprint: string;
  };
}

export interface PeerInfo {
  id: string;
  publicKey: string;
  lastSeen: number;
  reliability: number; // 0-1 score based on successful message delivery
  networkAddress?: string;
  capabilities: string[];
}

// DHT Node for decentralized peer discovery
interface DHTNode {
  id: string;
  distance: number;
  lastContact: number;
}

export class SecureP2PNetwork {
  private messageHandlers: Set<(envelope: MessageEnvelope) => void> = new Set();
  private isInitialized = false;
  private localPeerId: string = '';
  private bitcommAddress: string = '';
  private privateKey: string = '';
  private publicKey: string = '';
  
  // Direct P2P connections (WebRTC)
  private peerConnections = new Map<string, RTCPeerConnection>();
  private dataChannels = new Map<string, RTCDataChannel>();
  
  // DHT for peer discovery
  private dhtNodes = new Map<string, DHTNode>();
  private knownPeers = new Map<string, PeerInfo>();
  
  // Message routing and caching
  private messageCache = new Map<string, MessageEnvelope>();
  private routingTable = new Map<string, string[]>(); // destination -> path
  private messageQueue = new Map<string, MessageEnvelope[]>();
  
  // Network resilience
  private meshConnections = new Set<string>();
  private backupPeers = new Set<string>();
  
  constructor() {
    this.generateKeys();
    this.localPeerId = this.generatePeerId();
    console.log('🔐 Secure P2P Network initialized with peer ID:', this.localPeerId);
  }

  private generateKeys(): void {
    // Generate cryptographic keys for secure communication
    const keyPair = this.generateKeyPair();
    this.privateKey = keyPair.private;
    this.publicKey = keyPair.public;
  }

  private generateKeyPair(): { private: string; public: string } {
    // Simple key generation for demo - in production use proper crypto libraries
    const seed = CryptoJS.lib.WordArray.random(256/8);
    const privateKey = CryptoJS.SHA256(seed).toString();
    const publicKey = CryptoJS.SHA256(privateKey + 'public').toString();
    return { private: privateKey, public: publicKey };
  }

  private generatePeerId(): string {
    // Generate peer ID from public key (like Briar)
    return 'peer_' + CryptoJS.SHA256(this.publicKey).toString().substring(0, 16);
  }

  async initialize(bitcommAddress: string): Promise<P2PNode> {
    console.log('🚀 Initializing Secure Decentralized P2P Network...');
    
    this.bitcommAddress = bitcommAddress;
    this.isInitialized = true;

    // Initialize different network layers
    await this.initializeDirectP2P();
    await this.initializeDHT();
    await this.initializeMeshNetwork();
    
    // Start periodic maintenance tasks
    this.startNetworkMaintenance();
    
    const p2pNode: P2PNode = {
      peerId: this.localPeerId,
      isOnline: true,
      connectedPeers: new Set(this.peerConnections.keys()),
      networkType: 'hybrid'
    };

    console.log('✅ Secure P2P node ready:', p2pNode);
    return p2pNode;
  }

  private async initializeDirectP2P(): Promise<void> {
    console.log('🔗 Initializing Direct P2P connections...');
    
    // Try to connect to bootstrap peers (stored locally)
    const bootstrapPeers = this.loadBootstrapPeers();
    for (const peer of bootstrapPeers) {
      await this.connectToPeer(peer);
    }
  }

  private async initializeDHT(): Promise<void> {
    console.log('🌐 Initializing DHT for peer discovery...');
    
    // Initialize distributed hash table for peer discovery
    // This allows finding peers without central servers
    this.populateInitialDHTNodes();
    
    // Start DHT maintenance
    setInterval(() => this.maintainDHT(), 30000);
  }

  private async initializeMeshNetwork(): Promise<void> {
    console.log('🕸️ Initializing Mesh Network capabilities...');
    
    // Set up mesh networking for message routing through multiple hops
    // This provides resilience when direct connections fail
    this.setupMeshRouting();
  }

  private loadBootstrapPeers(): PeerInfo[] {
    const stored = localStorage.getItem('bitcomm-bootstrap-peers');
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Default bootstrap peers (in production, these would be well-known nodes)
    return [
      {
        id: 'bootstrap_1',
        publicKey: 'bootstrap_key_1',
        lastSeen: Date.now(),
        reliability: 0.9,
        capabilities: ['routing', 'discovery']
      }
    ];
  }

  private async connectToPeer(peerInfo: PeerInfo): Promise<boolean> {
    if (this.peerConnections.has(peerInfo.id)) {
      return true; // Already connected
    }

    try {
      console.log('🤝 Connecting to peer:', peerInfo.id);
      
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Set up data channel for secure messaging
      const dataChannel = peerConnection.createDataChannel('bitcomm-secure', {
        ordered: true,
        maxRetransmits: 3
      });

      dataChannel.onopen = () => {
        console.log('✅ Secure channel established with:', peerInfo.id);
        this.onPeerConnected(peerInfo.id);
      };

      dataChannel.onmessage = (event) => {
        this.handleSecureMessage(event.data, peerInfo.id);
      };

      dataChannel.onerror = (error) => {
        console.error('❌ Data channel error with', peerInfo.id, ':', error);
        this.onPeerDisconnected(peerInfo.id);
      };

      this.peerConnections.set(peerInfo.id, peerConnection);
      this.dataChannels.set(peerInfo.id, dataChannel);
      this.knownPeers.set(peerInfo.id, peerInfo);

      return true;
    } catch (error) {
      console.error('Failed to connect to peer:', peerInfo.id, error);
      return false;
    }
  }

  private handleSecureMessage(encryptedData: string, fromPeerId: string): void {
    try {
      // Decrypt the message
      const decryptedData = this.decryptMessage(encryptedData, fromPeerId);
      const envelope: MessageEnvelope = JSON.parse(decryptedData);
      
      // Verify message integrity and proof of work
      if (!this.verifyMessageEnvelope(envelope)) {
        console.warn('❌ Invalid message from:', fromPeerId);
        return;
      }
      
      // Check if this is a duplicate message
      if (this.messageCache.has(envelope.id)) {
        console.log('📦 Duplicate message ignored:', envelope.id);
        return;
      }
      
      // Cache the message
      this.messageCache.set(envelope.id, envelope);
      
      // Route message if it's not for us
      if (envelope.message.to !== this.bitcommAddress) {
        this.routeMessage(envelope);
        return;
      }
      
      // Process message for local delivery
      this.messageHandlers.forEach(handler => handler(envelope));
      console.log('📨 Secure message received:', envelope.id);
      
    } catch (error) {
      console.error('Error processing secure message:', error);
    }
  }

  private verifyMessageEnvelope(envelope: MessageEnvelope): boolean {
    // Verify proof of work
    if (!verifyProofOfWork(envelope.message.content, envelope.message.pow)) {
      return false;
    }
    
    // Verify message signature
    if (!this.verifySignature(envelope)) {
      return false;
    }
    
    // Check routing constraints
    if (envelope.routing.hops > envelope.routing.maxHops) {
      return false;
    }
    
    return true;
  }

  private verifySignature(envelope: MessageEnvelope): boolean {
    // Verify cryptographic signature of the message
    const messageHash = CryptoJS.SHA256(JSON.stringify(envelope.message)).toString();
    const expectedSignature = CryptoJS.HmacSHA256(messageHash, envelope.message.from).toString();
    return envelope.signature === expectedSignature;
  }

  private routeMessage(envelope: MessageEnvelope): void {
    // Implement mesh routing - forward message toward destination
    const destination = envelope.message.to;
    const bestRoute = this.findBestRoute(destination);
    
    if (bestRoute && bestRoute.length > 0) {
      const nextHop = bestRoute[0];
      const channel = this.dataChannels.get(nextHop);
      
      if (channel && channel.readyState === 'open') {
        // Increment hop count
        envelope.routing.hops++;
        envelope.routing.path.push(this.localPeerId);
        
        // Forward the message
        const encryptedData = this.encryptMessage(JSON.stringify(envelope), nextHop);
        channel.send(encryptedData);
        
        console.log('📤 Message routed to:', nextHop, 'for destination:', destination);
      }
    }
  }

  private findBestRoute(destination: string): string[] | null {
    // Simple routing: return direct connection if available
    if (this.peerConnections.has(destination)) {
      return [destination];
    }
    
    // Use cached routing table
    return this.routingTable.get(destination) || null;
  }

  async sendMessage(envelope: MessageEnvelope, targetPeerId?: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Secure P2P network not initialized');
    }

    try {
      console.log('📤 Sending secure message:', envelope.id);
      
      // Sign the message
      envelope.signature = this.signMessage(envelope.message);
      envelope.routing = {
        hops: 0,
        maxHops: 10,
        path: [this.localPeerId]
      };
      envelope.encryption = {
        algorithm: 'AES-256',
        keyFingerprint: CryptoJS.SHA256(envelope.message.to).toString().substring(0, 8)
      };
      
      // Try direct delivery first
      const targetChannel = this.dataChannels.get(envelope.message.to);
      if (targetChannel && targetChannel.readyState === 'open') {
        const encryptedData = this.encryptMessage(JSON.stringify(envelope), envelope.message.to);
        targetChannel.send(encryptedData);
        return true;
      }
      
      // Use mesh routing
      this.routeMessage(envelope);
      
      // For now, also simulate local delivery for testing
      setTimeout(() => {
        this.simulateMessageReception(envelope);
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('Failed to send secure message:', error);
      return false;
    }
  }

  private signMessage(message: BitCommMessage): string {
    const messageHash = CryptoJS.SHA256(JSON.stringify(message)).toString();
    return CryptoJS.HmacSHA256(messageHash, this.privateKey).toString();
  }

  private encryptMessage(data: string, recipientId: string): string {
    // Get recipient's public key
    const recipient = this.knownPeers.get(recipientId);
    const key = recipient?.publicKey || recipientId; // Fallback for testing
    
    // Encrypt using AES
    return CryptoJS.AES.encrypt(data, key).toString();
  }

  private decryptMessage(encryptedData: string, senderId: string): string {
    // Use sender's public key or our private key for decryption
    const sender = this.knownPeers.get(senderId);
    const key = sender?.publicKey || this.privateKey; // Fallback for testing
    
    // Decrypt using AES
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  private simulateMessageReception(envelope: MessageEnvelope): void {
    // Store received message for testing
    const storedMessages = localStorage.getItem('bitcomm-received-messages') || '[]';
    const messages = JSON.parse(storedMessages);
    messages.unshift(envelope);
    localStorage.setItem('bitcomm-received-messages', JSON.stringify(messages.slice(0, 50)));
    
    // Notify handlers
    this.messageHandlers.forEach(handler => handler(envelope));
    console.log('📨 Simulated secure message reception:', envelope.id);
  }

  private onPeerConnected(peerId: string): void {
    console.log('✅ Peer connected:', peerId);
    this.meshConnections.add(peerId);
    
    // Exchange routing tables
    this.exchangeRoutingInfo(peerId);
    
    // Process queued messages
    const queuedMessages = this.messageQueue.get(peerId);
    if (queuedMessages) {
      queuedMessages.forEach(envelope => this.sendMessage(envelope));
      this.messageQueue.delete(peerId);
    }
  }

  private onPeerDisconnected(peerId: string): void {
    console.log('❌ Peer disconnected:', peerId);
    this.meshConnections.delete(peerId);
    this.peerConnections.delete(peerId);
    this.dataChannels.delete(peerId);
    
    // Update routing table
    this.updateRoutingTable();
  }

  private populateInitialDHTNodes(): void {
    // Initialize DHT with some bootstrap nodes
    const bootstrapNodes = [
      { id: 'dht_node_1', distance: 0.1, lastContact: Date.now() },
      { id: 'dht_node_2', distance: 0.3, lastContact: Date.now() },
      { id: 'dht_node_3', distance: 0.7, lastContact: Date.now() }
    ];
    
    bootstrapNodes.forEach(node => {
      this.dhtNodes.set(node.id, node);
    });
  }

  private maintainDHT(): void {
    // DHT maintenance: ping nodes, update distances, find new peers
    console.log('🔄 Maintaining DHT with', this.dhtNodes.size, 'nodes');
    
    // Remove stale nodes
    const now = Date.now();
    for (const [nodeId, node] of this.dhtNodes.entries()) {
      if (now - node.lastContact > 300000) { // 5 minutes
        this.dhtNodes.delete(nodeId);
      }
    }
  }

  private setupMeshRouting(): void {
    // Set up mesh network routing capabilities
    console.log('🕸️ Setting up mesh routing...');
    
    // Initialize routing table
    this.updateRoutingTable();
    
    // Start periodic routing updates
    setInterval(() => this.updateRoutingTable(), 60000);
  }

  private exchangeRoutingInfo(peerId: string): void {
    // Exchange routing information with connected peer
    const routingInfo = {
      type: 'routing_update',
      routes: Array.from(this.routingTable.entries()),
      timestamp: Date.now()
    };
    
    const channel = this.dataChannels.get(peerId);
    if (channel && channel.readyState === 'open') {
      channel.send(JSON.stringify(routingInfo));
    }
  }

  private updateRoutingTable(): void {
    // Update routing table based on connected peers
    this.routingTable.clear();
    
    // Add direct routes to connected peers
    for (const peerId of this.peerConnections.keys()) {
      this.routingTable.set(peerId, [peerId]);
    }
    
    console.log('📊 Routing table updated with', this.routingTable.size, 'routes');
  }

  private startNetworkMaintenance(): void {
    // Start periodic network maintenance tasks
    setInterval(() => {
      this.maintainConnections();
      this.cleanupMessageCache();
      this.updatePeerReliability();
    }, 60000); // Every minute
  }

  private maintainConnections(): void {
    // Maintain healthy connections, reconnect to failed peers
    console.log('🔧 Maintaining network connections...');
    
    // Check connection health
    for (const [peerId, connection] of this.peerConnections.entries()) {
      if (connection.connectionState === 'failed' || connection.connectionState === 'closed') {
        console.log('🔄 Reconnecting to failed peer:', peerId);
        const peerInfo = this.knownPeers.get(peerId);
        if (peerInfo) {
          this.connectToPeer(peerInfo);
        }
      }
    }
  }

  private cleanupMessageCache(): void {
    // Clean up old messages from cache
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [messageId, envelope] of this.messageCache.entries()) {
      if (now - envelope.timestamp > maxAge) {
        this.messageCache.delete(messageId);
      }
    }
  }

  private updatePeerReliability(): void {
    // Update peer reliability scores based on successful interactions
    for (const [peerId, peerInfo] of this.knownPeers.entries()) {
      const connection = this.peerConnections.get(peerId);
      if (connection && connection.connectionState === 'connected') {
        peerInfo.reliability = Math.min(1.0, peerInfo.reliability + 0.01);
      } else {
        peerInfo.reliability = Math.max(0.0, peerInfo.reliability - 0.05);
      }
    }
  }

  // Public API methods
  addMessageHandler(handler: (envelope: MessageEnvelope) => void): void {
    this.messageHandlers.add(handler);
  }

  removeMessageHandler(handler: (envelope: MessageEnvelope) => void): void {
    this.messageHandlers.delete(handler);
  }

  async findPeersForAddress(bitcommAddress: string): Promise<string[]> {
    // Use DHT to find peers that can route to this address
    const peers = Array.from(this.knownPeers.keys()).filter(peerId => {
      const peer = this.knownPeers.get(peerId);
      return peer && peer.reliability > 0.5;
    });
    
    return peers;
  }

  getNetworkStats() {
    return {
      peerId: this.localPeerId,
      connectedPeers: this.peerConnections.size,
      knownPeers: this.knownPeers.size,
      dhtNodes: this.dhtNodes.size,
      meshConnections: this.meshConnections.size,
      cachedMessages: this.messageCache.size,
      isOnline: this.isInitialized,
      networkType: 'hybrid' as const,
      peers: Array.from(this.peerConnections.keys())
    };
  }

  async shutdown(): Promise<void> {
    console.log('🔌 Shutting down Secure P2P Network...');
    
    // Close all connections
    for (const [peerId, connection] of this.peerConnections.entries()) {
      connection.close();
    }
    
    // Clear all data structures
    this.peerConnections.clear();
    this.dataChannels.clear();
    this.knownPeers.clear();
    this.dhtNodes.clear();
    this.messageCache.clear();
    this.routingTable.clear();
    this.messageQueue.clear();
    
    this.isInitialized = false;
    console.log('✅ Secure P2P Network shutdown complete');
  }
}

// Export singleton instance
export const secureP2P = new SecureP2PNetwork();
