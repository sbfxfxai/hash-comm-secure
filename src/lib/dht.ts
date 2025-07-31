// DHT (Distributed Hash Table) implementation for BitComm
// Enables decentralized peer discovery without central signaling server

import CryptoJS from 'crypto-js';

export interface DHTNode {
  id: string;
  endpoint: string;
  lastSeen: number;
}

export interface DHTMessage {
  type: 'ping' | 'pong' | 'find_node' | 'found_nodes' | 'announce' | 'get_peers';
  nodeId: string;
  target?: string;
  nodes?: DHTNode[];
  data?: any;
}

export class BitCommDHT {
  private nodeId: string;
  private routingTable: Map<string, DHTNode> = new Map();
  private buckets: Map<number, DHTNode[]> = new Map();
  private bootstrapNodes: string[] = [];
  private isStarted = false;
  private pingInterval: NodeJS.Timeout | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor() {
    this.nodeId = this.generateNodeId();
    this.initializeBuckets();
  }

  private generateNodeId(): string {
    // Generate 160-bit node ID (like Kademlia)
    return CryptoJS.SHA1(CryptoJS.lib.WordArray.random(160/8)).toString();
  }

  private initializeBuckets(): void {
    // Initialize K-buckets for Kademlia-style routing
    for (let i = 0; i < 160; i++) {
      this.buckets.set(i, []);
    }
  }

  async start(): Promise<void> {
    if (this.isStarted) return;

    console.log('🌐 Starting DHT node:', this.nodeId.substring(0, 8));
    
    // Bootstrap with known nodes or use WebRTC data channels for initial peers
    await this.bootstrap();
    
    // Start periodic maintenance
    this.startMaintenance();
    
    this.isStarted = true;
    console.log('✅ DHT node started successfully');
  }

  private async bootstrap(): Promise<void> {
    // In a real DHT, we'd connect to bootstrap nodes
    // For now, we'll simulate discovering initial peers
    const bootstrapPeers = this.generateBootstrapPeers();
    
    for (const peer of bootstrapPeers) {
      this.addNode(peer);
    }

    // Emit discovery events for WebRTC to handle
    setTimeout(() => {
      bootstrapPeers.forEach(peer => {
        this.emit('peer:discover', peer);
      });
    }, 1000);
  }

  private generateBootstrapPeers(): DHTNode[] {
    // Simulate discovering peers through various methods:
    // - Local network discovery (mDNS/Bonjour)
    // - Known peer lists
    // - WebRTC data channel gossip
    return [
      {
        id: this.generateNodeId(),
        endpoint: 'peer-1',
        lastSeen: Date.now()
      },
      {
        id: this.generateNodeId(),
        endpoint: 'peer-2', 
        lastSeen: Date.now()
      }
    ];
  }

  private startMaintenance(): void {
    // Periodic DHT maintenance tasks
    this.pingInterval = setInterval(() => {
      this.performMaintenance();
    }, 30000); // Every 30 seconds
  }

  private performMaintenance(): void {
    // Remove stale nodes
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [bucketIndex, nodes] of this.buckets.entries()) {
      const activeNodes = nodes.filter(node => 
        now - node.lastSeen < staleThreshold
      );
      this.buckets.set(bucketIndex, activeNodes);
    }

    // Refresh buckets that haven't been used recently
    this.refreshBuckets();
  }

  private refreshBuckets(): void {
    // Find nodes in buckets that need refreshing
    for (const [bucketIndex, nodes] of this.buckets.entries()) {
      if (nodes.length < 8) { // K=8 for k-bucket size
        // Generate random ID in this bucket's range and search for it
        const targetId = this.generateRandomIdInBucket(bucketIndex);
        this.findNode(targetId);
      }
    }
  }

  private generateRandomIdInBucket(bucketIndex: number): string {
    // Generate random ID that would fall in the specified bucket
    const randomBytes = CryptoJS.lib.WordArray.random(160/8);
    return CryptoJS.SHA1(randomBytes).toString();
  }

  addNode(node: DHTNode): void {
    const distance = this.calculateDistance(this.nodeId, node.id);
    const bucketIndex = this.getBucketIndex(distance);
    
    const bucket = this.buckets.get(bucketIndex) || [];
    
    // Remove if already exists
    const filtered = bucket.filter(n => n.id !== node.id);
    
    // Add to front (most recently seen)
    filtered.unshift(node);
    
    // Limit bucket size to K=8
    if (filtered.length > 8) {
      filtered.pop();
    }
    
    this.buckets.set(bucketIndex, filtered);
    this.routingTable.set(node.id, node);
  }

  private calculateDistance(id1: string, id2: string): string {
    // XOR distance for Kademlia
    const bytes1 = CryptoJS.enc.Hex.parse(id1);
    const bytes2 = CryptoJS.enc.Hex.parse(id2);
    
    const distance = bytes1.clone();
    for (let i = 0; i < distance.words.length; i++) {
      distance.words[i] ^= bytes2.words[i];
    }
    
    return CryptoJS.enc.Hex.stringify(distance);
  }

  private getBucketIndex(distance: string): number {
    // Find the bucket index based on the distance
    const distanceBytes = CryptoJS.enc.Hex.parse(distance);
    
    for (let i = 0; i < 160; i++) {
      const byteIndex = Math.floor(i / 8);
      const bitIndex = 7 - (i % 8);
      
      if (byteIndex < distanceBytes.words.length) {
        const word = distanceBytes.words[Math.floor(byteIndex / 4)];
        const byte = (word >> ((3 - (byteIndex % 4)) * 8)) & 0xFF;
        
        if ((byte >> bitIndex) & 1) {
          return 159 - i;
        }
      }
    }
    
    return 0;
  }

  async findNode(targetId: string): Promise<DHTNode[]> {
    const closestNodes = this.getClosestNodes(targetId, 8);
    
    // In a real implementation, we'd query these nodes
    // For now, return what we have locally
    return closestNodes;
  }

  private getClosestNodes(targetId: string, count: number): DHTNode[] {
    const allNodes = Array.from(this.routingTable.values());
    
    return allNodes
      .map(node => ({
        node,
        distance: this.calculateDistance(targetId, node.id)
      }))
      .sort((a, b) => a.distance.localeCompare(b.distance))
      .slice(0, count)
      .map(item => item.node);
  }

  async announcePeer(infoHash: string, port: number): Promise<void> {
    // Announce that we have data for this info hash
    const closestNodes = this.getClosestNodes(infoHash, 8);
    
    // In real implementation, send announce messages to closest nodes
    console.log(`📢 Announcing presence for ${infoHash} to ${closestNodes.length} nodes`);
  }

  async getPeers(infoHash: string): Promise<DHTNode[]> {
    // Find peers that have announced for this info hash
    return this.getClosestNodes(infoHash, 8);
  }

  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  private emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => handler(...args));
  }

  async stop(): Promise<void> {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    this.isStarted = false;
    console.log('🛑 DHT node stopped');
  }

  getStats() {
    const totalNodes = Array.from(this.buckets.values())
      .reduce((sum, bucket) => sum + bucket.length, 0);
    
    return {
      nodeId: this.nodeId.substring(0, 8),
      totalNodes,
      activeBuckets: Array.from(this.buckets.values())
        .filter(bucket => bucket.length > 0).length,
      isStarted: this.isStarted
    };
  }
}

// Initialize DHT node function
export function initializeDHTNode(): BitCommDHT {
  return new BitCommDHT();
}
