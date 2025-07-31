// Mesh Networking for BitComm
import CryptoJS from 'crypto-js';

export interface MeshNode {
  nodeId: string;
  address: string;
  lastSeen: number;
  connections: Set<string>;
  reputation: number;
  bandwidthScore: number;
  latency: number;
  isBootstrap: boolean;
}

export interface RoutingTable {
  destination: string;
  nextHop: string;
  hopCount: number;
  reliability: number;
  lastUpdated: number;
}

export interface NetworkTopology {
  nodes: Map<string, MeshNode>;
  routes: Map<string, RoutingTable>;
  clusters: Map<string, Set<string>>;
  bridgeNodes: Set<string>;
}

export class MeshNetwork {
  private nodes: Map<string, MeshNode> = new Map();
  private routingTable: Map<string, RoutingTable> = new Map();
  private messageCache: Map<string, any> = new Map();
  private localNodeId: string;
  private maxHopCount = 7; // Maximum message forwarding hops
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.localNodeId = 'mesh-' + CryptoJS.SHA256(Date.now().toString()).toString().substring(0, 16);
    this.initializeBootstrapNodes();
    this.startHeartbeat();
  }

  private initializeBootstrapNodes(): void {
    // Initialize with well-known bootstrap nodes
    const bootstrapNodes = [
      {
        nodeId: 'bootstrap-na-1',
        address: 'mesh://na.bootstrap.bitcomm.network',
        reputation: 100,
        isBootstrap: true
      },
      {
        nodeId: 'bootstrap-eu-1', 
        address: 'mesh://eu.bootstrap.bitcomm.network',
        reputation: 100,
        isBootstrap: true
      },
      {
        nodeId: 'bootstrap-asia-1',
        address: 'mesh://asia.bootstrap.bitcomm.network', 
        reputation: 100,
        isBootstrap: true
      }
    ];

    bootstrapNodes.forEach(node => {
      this.nodes.set(node.nodeId, {
        ...node,
        lastSeen: Date.now(),
        connections: new Set(),
        bandwidthScore: 100,
        latency: 50
      });
    });

    console.log('🕸️ Mesh network initialized with bootstrap nodes');
  }

  async joinNetwork(): Promise<boolean> {
    try {
      // Connect to bootstrap nodes
      const bootstrapNodes = Array.from(this.nodes.values()).filter(n => n.isBootstrap);
      
      for (const node of bootstrapNodes) {
        await this.establishConnection(node.nodeId);
      }

      // Request peer list from connected nodes
      await this.requestPeerDiscovery();
      
      console.log('🌐 Successfully joined mesh network');
      return true;
    } catch (error) {
      console.error('Failed to join mesh network:', error);
      return false;
    }
  }

  private async establishConnection(nodeId: string): Promise<boolean> {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    // Simulate connection establishment
    console.log(`🔗 Establishing connection to ${nodeId}`);
    
    // Add mutual connection
    node.connections.add(this.localNodeId);
    node.lastSeen = Date.now();
    
    // Update routing table
    this.updateRoutingTable(nodeId, nodeId, 1, 0.95);
    
    return true;
  }

  private async requestPeerDiscovery(): Promise<void> {
    // Request peer lists from connected nodes
    const connectedNodes = this.getConnectedNodes();
    
    for (const nodeId of connectedNodes) {
      const peers = await this.getPeersFromNode(nodeId);
      peers.forEach(peer => this.addPeerToNetwork(peer));
    }
  }

  private async getPeersFromNode(nodeId: string): Promise<MeshNode[]> {
    // Simulate peer discovery response
    const mockPeers: MeshNode[] = [];
    const peerCount = Math.floor(Math.random() * 5) + 2;
    
    for (let i = 0; i < peerCount; i++) {
      const peerId = 'peer-' + CryptoJS.SHA256(nodeId + i).toString().substring(0, 12);
      mockPeers.push({
        nodeId: peerId,
        address: `mesh://${peerId}.bitcomm.network`,
        lastSeen: Date.now(),
        connections: new Set(),
        reputation: Math.floor(Math.random() * 40) + 60,
        bandwidthScore: Math.floor(Math.random() * 50) + 50,
        latency: Math.floor(Math.random() * 100) + 20,
        isBootstrap: false
      });
    }
    
    return mockPeers;
  }

  private addPeerToNetwork(peer: MeshNode): void {
    if (!this.nodes.has(peer.nodeId)) {
      this.nodes.set(peer.nodeId, peer);
      
      // Update routing table with multi-hop route
      const hopCount = this.calculateHopCount(peer.nodeId);
      this.updateRoutingTable(peer.nodeId, this.findBestNextHop(peer.nodeId), hopCount, 0.8);
      
      console.log(`📡 Added peer to network: ${peer.nodeId}`);
    }
  }

  private calculateHopCount(targetId: string): number {
    // Simplified hop count calculation
    return Math.floor(Math.random() * 3) + 2;
  }

  private findBestNextHop(targetId: string): string {
    // Find best next hop based on latency and reliability
    const connectedNodes = this.getConnectedNodes();
    if (connectedNodes.length === 0) return targetId;
    
    return connectedNodes.reduce((best, nodeId) => {
      const node = this.nodes.get(nodeId);
      const bestNode = this.nodes.get(best);
      if (!node || !bestNode) return best;
      
      return (node.latency + node.reputation) < (bestNode.latency + bestNode.reputation) ? nodeId : best;
    });
  }

  private updateRoutingTable(destination: string, nextHop: string, hopCount: number, reliability: number): void {
    this.routingTable.set(destination, {
      destination,
      nextHop,
      hopCount,
      reliability,
      lastUpdated: Date.now()
    });
  }

  async routeMessage(message: any, targetNodeId: string): Promise<boolean> {
    const route = this.routingTable.get(targetNodeId);
    
    if (!route) {
      console.warn(`❌ No route found to ${targetNodeId}`);
      return false;
    }

    // Add message to cache to prevent loops
    const messageId = CryptoJS.SHA256(JSON.stringify(message)).toString();
    if (this.messageCache.has(messageId)) {
      console.log('🔄 Message already routed, preventing loop');
      return false;
    }

    this.messageCache.set(messageId, {
      ...message,
      hopCount: (message.hopCount || 0) + 1,
      routePath: [...(message.routePath || []), this.localNodeId]
    });

    // Check hop limit
    if (message.hopCount >= this.maxHopCount) {
      console.warn('🚫 Message exceeded maximum hop count');
      return false;
    }

    console.log(`📤 Routing message to ${targetNodeId} via ${route.nextHop}`);
    
    // Simulate message forwarding
    setTimeout(() => {
      this.forwardMessage(message, route.nextHop);
    }, route.hopCount * 10); // Simulate network delay

    return true;
  }

  private forwardMessage(message: any, nextHopId: string): void {
    console.log(`🔀 Forwarding message to ${nextHopId}`);
    // In real implementation, this would send to the actual peer
  }

  private getConnectedNodes(): string[] {
    return Array.from(this.nodes.values())
      .filter(node => node.connections.has(this.localNodeId))
      .map(node => node.nodeId);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
      this.cleanupStaleNodes();
    }, 30000); // 30 second heartbeat
  }

  private sendHeartbeat(): void {
    const connectedNodes = this.getConnectedNodes();
    connectedNodes.forEach(nodeId => {
      const node = this.nodes.get(nodeId);
      if (node) {
        node.lastSeen = Date.now();
        // Simulate latency measurement
        node.latency = Math.floor(Math.random() * 50) + 20;
      }
    });
  }

  private cleanupStaleNodes(): void {
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    
    for (const [nodeId, node] of this.nodes.entries()) {
      if (!node.isBootstrap && (now - node.lastSeen) > staleThreshold) {
        this.nodes.delete(nodeId);
        this.routingTable.delete(nodeId);
        console.log(`🗑️ Removed stale node: ${nodeId}`);
      }
    }
  }

  getNetworkTopology(): NetworkTopology {
    const clusters = this.identifyClusters();
    const bridgeNodes = this.identifyBridgeNodes();
    
    return {
      nodes: this.nodes,
      routes: this.routingTable,
      clusters,
      bridgeNodes
    };
  }

  private identifyClusters(): Map<string, Set<string>> {
    // Simple clustering based on connection density
    const clusters = new Map<string, Set<string>>();
    const visited = new Set<string>();
    
    for (const [nodeId, node] of this.nodes.entries()) {
      if (visited.has(nodeId)) continue;
      
      const cluster = new Set<string>();
      this.depthFirstSearch(nodeId, cluster, visited);
      
      if (cluster.size > 1) {
        clusters.set(`cluster-${clusters.size}`, cluster);
      }
    }
    
    return clusters;
  }

  private depthFirstSearch(nodeId: string, cluster: Set<string>, visited: Set<string>): void {
    visited.add(nodeId);
    cluster.add(nodeId);
    
    const node = this.nodes.get(nodeId);
    if (node) {
      for (const connectedId of node.connections) {
        if (!visited.has(connectedId)) {
          this.depthFirstSearch(connectedId, cluster, visited);
        }
      }
    }
  }

  private identifyBridgeNodes(): Set<string> {
    // Identify nodes that connect different clusters
    const bridgeNodes = new Set<string>();
    
    for (const [nodeId, node] of this.nodes.entries()) {
      const connectedClusters = new Set<string>();
      
      for (const connectedId of node.connections) {
        // Find which cluster this connected node belongs to
        for (const [clusterId, clusterNodes] of this.identifyClusters()) {
          if (clusterNodes.has(connectedId)) {
            connectedClusters.add(clusterId);
          }
        }
      }
      
      if (connectedClusters.size > 1) {
        bridgeNodes.add(nodeId);
      }
    }
    
    return bridgeNodes;
  }

  getNetworkStats() {
    const connectedCount = this.getConnectedNodes().length;
    const avgLatency = Array.from(this.nodes.values())
      .reduce((sum, node) => sum + node.latency, 0) / this.nodes.size;
    
    return {
      totalNodes: this.nodes.size,
      connectedNodes: connectedCount,
      routingEntries: this.routingTable.size,
      averageLatency: Math.round(avgLatency),
      messageCacheSize: this.messageCache.size,
      networkDensity: (connectedCount / this.nodes.size) * 100
    };
  }

  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    this.nodes.clear();
    this.routingTable.clear();
    this.messageCache.clear();
    
    console.log('🔌 Mesh network shut down');
  }
}

export const meshNetwork = new MeshNetwork();

