// P2P Module Entry Point - Lazy loaded for better performance
export { WebRTCP2PNetwork } from './webrtc-p2p'
export { decentralizedIdentityManager } from './decentralized-identity'
export { decentralizedStorage } from './decentralized-storage'
export { bitcoinPayments } from './bitcoin-payments'

// Re-export types
export type { P2PNode, MessageEnvelope } from './webrtc-p2p'
export type { DecentralizedIdentity } from './decentralized-identity'
export type { DecentralizedFile } from './decentralized-storage'
export type { BitcoinPayment } from './bitcoin-payments'
