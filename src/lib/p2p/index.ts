// P2P Module Entry Point - Lazy loaded for better performance
export { WebRTCP2PNetwork, webrtcP2P } from './webrtc-p2p'
export { decentralizedIdentityManager } from './decentralized-identity'
export { decentralizedStorage } from './decentralized-storage'
export { bitcoinPayments } from './bitcoin-payments'
export { distributedConsensus } from './distributed-consensus'
export { meshNetwork } from './mesh-network'
export { initializeDHTNode } from './dht-node'
export { decentralizedCoordinator } from './decentralized-coordinator'

// Re-export types
export type { P2PNode, MessageEnvelope } from './webrtc-p2p'
export type { DecentralizedIdentity } from './decentralized-identity'
export type { DecentralizedFile } from './decentralized-storage'
export type { BitcoinPayment } from './bitcoin-payments'
export type { ConsensusMessage, ConsensusNode } from './distributed-consensus'
export type { MeshNode, RoutingTable, NetworkTopology } from './mesh-network'
export type { DHTNode, DHTEntry, KBucket } from './dht-node'
