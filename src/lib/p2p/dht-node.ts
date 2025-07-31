// Distributed Hash Table for decentralized peer discovery
import CryptoJS from 'crypto-js';

export interface DHTNode {
  nodeId: string;
  address: string;
  publicKey: string;
  lastSeen: number;
  reputation: number;
  location: {
    latitude?: number;
    longitude?: number;
    region?: string;
  };
}

export interface DHTEntry {
  key: string;
  value: any;
  timestamp: number;
  ttl: number; // Time to live in seconds
  signature: string;
}

export interface KBucket {
  nodes: DHTNode[];
  lastUpdated: number;
  k: number; // Maximum nodes per bucket (typically 20)
}

export class DHTNetwork {
  private nodeId: string;
  private kBuckets: Map<number, KBucket> = new Map();
  private dataStore: Map<string, DHTEntry> = new Map();
  private bootstrapNodes: DHTNode[] = [];
  private k = 20; // Kademlia parameter
  private alpha = 3; // Concurrency parameter
  private refreshInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.nodeId = this.generateNodeId();
    this.initializeBootstrapNodes();
    this.initializeKBuckets();
  }

  private generateNodeId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString();
    return CryptoJS.SHA256(timestamp + random).toString();
  }

  private initializeBootstrapNodes(): void {
    this.bootstrapNodes = [
      {
        nodeId: 'boot1' + CryptoJS.SHA256('bootstrap-1').toString().substring(0, 16),
        address: 'dht://bootstrap-1.bitcomm.network:4001',
        publicKey: 'bootstrap-key-1',
        lastSeen: Date.now(),
        reputation: 100,
        location: { region: 'us-east-1' }
      },
      {
        nodeId: 'boot2' + CryptoJS.SHA256('bootstrap-2').toString().substring(0, 16),
        address: 'dht://bootstrap-2.bitcomm.network:4001',
        publicKey: 'bootstrap-key-2',
        lastSeen: Date.now(),
        reputation: 100,
        location: { region: 'eu-west-1' }
      },
      {
        nodeId: 'boot3' + CryptoJS.SHA256('bootstrap-3').toString().substring(0, 16),
        address: 'dht://bootstrap-3.bitcomm.network:4001',
        publicKey: 'bootstrap-key-3',
        lastSeen: Date.now(),
        reputation: 95,
        location: { region: 'ap-northeast-1' }
      }
    ];

    console.log('🌐 DHT bootstrap nodes initialized');
  }

  private initializeKBuckets(): void {
    // Initialize k-buckets for 256-bit address space
    for (let i = 0; i < 256; i++) {
      this.kBuckets.set(i, {
        nodes: [],
        lastUpdated: Date.now(),
        k: this.k
      });
    }
  }

  async start(): Promise<void> {
    console.log('🚀 Starting DHT node:', this.nodeId.substring(0, 16));
    
    // Bootstrap by connecting to known nodes
    await this.bootstrap();
    
    // Start periodic maintenance
    this.startMaintenance();
    
    console.log('✅ DHT node started successfully');
  }

  private async bootstrap(): Promise<void> {
    console.log('🔄 Bootstrapping DHT network...');
    
    // Add bootstrap nodes to routing table
    for (const node of this.bootstrapNodes) {
      this.addNode(node);
    }
    
    // Perform self-lookup to populate routing table
    await this.findNode(this.nodeId);
    
    console.log('🎯 DHT bootstrap complete');
  }

  private calculateDistance(nodeId1: string, nodeId2: string): string {
    // XOR distance calculation (Kademlia)
    const hash1 = CryptoJS.SHA256(nodeId1).toString();
    const hash2 = CryptoJS.SHA256(nodeId2).toString();
    
    let xor = '';
    for (let i = 0; i < hash1.length; i++) {
      const a = parseInt(hash1[i], 16);
      const b = parseInt(hash2[i], 16);
      xor += (a ^ b).toString(16);
    }
    
    return xor;
  }

  private getBucketIndex(nodeId: string): number {
    const distance = this.calculateDistance(this.nodeId, nodeId);
    // Find the position of the first '1' bit (most significant bit)
    for (let i = 0; i < distance.length; i++) {
      const nibble = parseInt(distance[i], 16);
      if (nibble !== 0) {
        // Count leading zeros in this nibble
        const leadingZeros = Math.clz32(nibble) - 28; // 32-bit - 4-bit nibble offset
        return i * 4 + leadingZeros;
      }
    }
    return 255; // Maximum distance
  }

  addNode(node: DHTNode): void {
    if (node.nodeId === this.nodeId) return; // Don't add self
    
    const bucketIndex = this.getBucketIndex(node.nodeId);
    const bucket = this.kBuckets.get(bucketIndex);
    
    if (!bucket) return;
    
    // Check if node already exists
    const existingIndex = bucket.nodes.findIndex(n => n.nodeId === node.nodeId);
    
    if (existingIndex !== -1) {
      // Update existing node (move to end - most recently seen)
      bucket.nodes.splice(existingIndex, 1);
      bucket.nodes.push({ ...node, lastSeen: Date.now() });
    } else if (bucket.nodes.length < bucket.k) {
      // Add new node if bucket not full
      bucket.nodes.push({ ...node, lastSeen: Date.now() });
    } else {
      // Bucket full - ping least recently seen node
      const leastRecent = bucket.nodes[0];
      if (this.shouldReplaceNode(leastRecent, node)) {
        bucket.nodes.shift();
        bucket.nodes.push({ ...node, lastSeen: Date.now() });
      }
    }
    
    bucket.lastUpdated = Date.now();
    console.log(`📍 Added node to bucket ${bucketIndex}:`, node.nodeId.substring(0, 12));
  }

  private shouldReplaceNode(oldNode: DHTNode, newNode: DHTNode): boolean {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    // Replace if old node hasn't been seen in 5 minutes
    if (oldNode.lastSeen < fiveMinutesAgo) return true;
    
    // Replace if new node has better reputation
    if (newNode.reputation > oldNode.reputation + 10) return true;
    
    return false;
  }

  async findNode(targetId: string): Promise<DHTNode[]> {
    console.log('🔍 Finding node:', targetId.substring(0, 12));
    
    const closestNodes = this.getClosestNodes(targetId, this.k);
    const contacted = new Set<string>();
    const candidates = new Set(closestNodes.map(n => n.nodeId));
    
    // Iterative lookup
    while (candidates.size > 0) {
      const nodesToContact = Array.from(candidates)
        .filter(id => !contacted.has(id))
        .slice(0, this.alpha);
      
      if (nodesToContact.length === 0) break;
      
      // Simulate concurrent lookups
      const results = await Promise.all(
        nodesToContact.map(id => this.simulateLookup(id, targetId))
      );
      
      nodesToContact.forEach(id => contacted.add(id));
      
      // Process results
      results.flat().forEach(node => {
        if (!contacted.has(node.nodeId)) {
          candidates.add(node.nodeId);
          this.addNode(node);
        }
      });
      
      // Remove processed nodes
      nodesToContact.forEach(id => candidates.delete(id));
    }
    
    return this.getClosestNodes(targetId, this.k);
  }

  private async simulateLookup(nodeId: string, targetId: string): Promise<DHTNode[]> {
    // Simulate network lookup with delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    
    // Return mock nodes closer to target
    const mockNodes: DHTNode[] = [];
    const count = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < count; i++) {
      const mockId = this.generateMockNodeId(targetId);
      mockNodes.push({
        nodeId: mockId,
        address: `dht://node-${mockId.substring(0, 8)}.bitcomm.network:4001`,
        publicKey: 'mock-key-' + mockId.substring(0, 16),
        lastSeen: Date.now(),
        reputation: Math.floor(Math.random() * 50) + 50,
        location: { region: 'mock-region' }
      });
    }
    
    return mockNodes;
  }

  private generateMockNodeId(targetId: string): string {
    // Generate node ID closer to target for simulation
    const targetHash = CryptoJS.SHA256(targetId).toString();
    const random = Math.random().toString();
    const mixed = targetHash.substring(0, 32) + CryptoJS.SHA256(random).toString().substring(32);
    return mixed;
  }

  private getClosestNodes(targetId: string, count: number): DHTNode[] {
    const allNodes: { node: DHTNode; distance: string }[] = [];
    
    // Collect all nodes from all buckets
    for (const bucket of this.kBuckets.values()) {
      for (const node of bucket.nodes) {
        allNodes.push({
          node,
          distance: this.calculateDistance(targetId, node.nodeId)
        });
      }
    }
    
    // Sort by distance and return closest
    return allNodes
      .sort((a, b) => a.distance.localeCompare(b.distance))
      .slice(0, count)
      .map(item => item.node);
  }

  async store(key: string, value: any, ttl: number = 3600): Promise<boolean> {
    const signature = this.signData(key + JSON.stringify(value));
    
    const entry: DHTEntry = {
      key,
      value,
      timestamp: Date.now(),
      ttl,
      signature
    };
    
    this.dataStore.set(key, entry);
    
    // Replicate to closest nodes
    const targetNodes = await this.findNode(key);
    const replicationPromises = targetNodes.slice(0, 3).map(node => 
      this.replicateToNode(node, entry)
    );
    
    const results = await Promise.all(replicationPromises);
    const successCount = results.filter(Boolean).length;
    
    console.log(`💾 Stored key ${key} with ${successCount} replications`);
    return successCount > 0;
  }

  private async replicateToNode(node: DHTNode, entry: DHTEntry): Promise<boolean> {
    // Simulate replication with network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
    
    // 90% success rate for simulation
    const success = Math.random() > 0.1;
    if (success) {
      console.log(`📤 Replicated to node ${node.nodeId.substring(0, 12)}`);
    }
    
    return success;
  }

  async findValue(key: string): Promise<any | null> {
    console.log('🔎 Finding value for key:', key);
    
    // Check local store first
    const localEntry = this.dataStore.get(key);
    if (localEntry && !this.isExpired(localEntry)) {
      console.log('📋 Found value locally');
      return localEntry.value;
    }
    
    // Search network
    const targetNodes = await this.findNode(key);
    
    for (const node of targetNodes.slice(0, 5)) {
      const value = await this.queryNodeForValue(node, key);
      if (value !== null) {
        console.log(`📥 Found value from node ${node.nodeId.substring(0, 12)}`);
        return value;
      }
    }
    
    console.log('❌ Value not found in DHT');
    return null;
  }

  private async queryNodeForValue(node: DHTNode, key: string): Promise<any | null> {
    // Simulate network query
    await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 25));
    
    // 30% chance of having the value for simulation
    if (Math.random() < 0.3) {
      return `mock-value-for-${key}`;
    }
    
    return null;
  }

  private isExpired(entry: DHTEntry): boolean {
    return (Date.now() - entry.timestamp) > (entry.ttl * 1000);
  }

  private signData(data: string): string {
    // Simple signature simulation
    return CryptoJS.SHA256(data + this.nodeId).toString();
  }

  private startMaintenance(): void {
    // Periodic bucket refresh and cleanup
    this.refreshInterval = setInterval(() => {
      this.performMaintenance();
    }, 60000); // Every minute
  }

  private performMaintenance(): void {
    console.log('🔧 Performing DHT maintenance...');
    
    // Remove expired entries
    for (const [key, entry] of this.dataStore.entries()) {
      if (this.isExpired(entry)) {
        this.dataStore.delete(key);
        console.log('🗑️ Removed expired entry:', key);
      }
    }
    
    // Refresh buckets that haven't been updated recently
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [index, bucket] of this.kBuckets.entries()) {
      if (bucket.lastUpdated < oneHourAgo && bucket.nodes.length > 0) {
        this.refreshBucket(index);
      }
    }
  }

  private async refreshBucket(bucketIndex: number): Promise<void> {
    // Generate random node ID in bucket range and perform lookup
    const randomId = this.generateRandomIdInBucket(bucketIndex);
    await this.findNode(randomId);
    console.log(`🔄 Refreshed bucket ${bucketIndex}`);
  }

  private generateRandomIdInBucket(bucketIndex: number): string {
    // Generate random ID that would fall into the specified bucket
    const random = CryptoJS.lib.WordArray.random(32).toString();
    return random;
  }

  getStats() {
    const totalNodes = Array.from(this.kBuckets.values())
      .reduce((sum, bucket) => sum + bucket.nodes.length, 0);
    
    const occupiedBuckets = Array.from(this.kBuckets.values())
      .filter(bucket => bucket.nodes.length > 0).length;
    
    return {
      nodeId: this.nodeId.substring(0, 16),
      totalNodes,
      occupiedBuckets,
      storedEntries: this.dataStore.size,
      bootstrapNodes: this.bootstrapNodes.length
    };
  }

  shutdown(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    
    this.kBuckets.clear();
    this.dataStore.clear();
    
    console.log('🔌 DHT node shut down');
  }
}

export function initializeDHTNode(): DHTNetwork {
  return new DHTNetwork();
}
