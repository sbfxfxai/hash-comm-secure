// P2P Module Entry Point - Fully decentralized compliance
export { WebRTCP2PNetwork } from './webrtc-p2p'
export { decentralizedIdentityManager } from './decentralized-identity'
export { decentralizedStorage } from './decentralized-storage'
export { bitcoinPayments } from './bitcoin-payments'
export { distributedConsensus } from './distributed-consensus'
export { blockchainBridge } from './blockchain-bridge'
export { meshNetwork } from './mesh-network'
export { decentralizedCoordinator } from './decentralized-coordinator'

// Re-export types
export type { P2PNode, MessageEnvelope } from './webrtc-p2p'
export type { DecentralizedIdentity } from './decentralized-identity'
export type { DecentralizedFile } from './decentralized-storage'
export type { BitcoinPayment } from './bitcoin-payments'
export type { ConsensusMessage, ConsensusNode } from './distributed-consensus'
export type { BlockchainIdentity, OnChainMessage } from './blockchain-bridge'
export type { MeshNode, NetworkTopology } from './mesh-network'
export type { DecentralizedNetworkStats } from './decentralized-coordinator'
