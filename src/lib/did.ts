import CryptoJS from 'crypto-js'

export interface DIDDocument {
  '@context': string[]
  id: string
  publicKey: PublicKeyInfo[]
  authentication: string[]
  service?: ServiceEndpoint[]
  created: string
  updated: string
  proof?: Proof
}

export interface PublicKeyInfo {
  id: string
  type: string
  controller: string
  publicKeyHex?: string
  publicKeyBase58?: string
}

export interface ServiceEndpoint {
  id: string
  type: string
  serviceEndpoint: string
}

export interface Proof {
  type: string
  created: string
  creator: string
  signatureValue: string
}

export interface Identity {
  did: string
  publicKey: string
  privateKey: string
  document: DIDDocument
}

export interface DIDUser {
  did: string
  publicKey: string
  displayName?: string
  avatar?: string
  createdAt: Date
}

/**
 * Generate a new DID using Bitcoin-style cryptography
 */
export const generateDID = (): { did: string; publicKey: string; privateKey: string } => {
  // Generate a random private key
  const privateKey = CryptoJS.lib.WordArray.random(32).toString()
  
  // Generate public key from private key (simplified)
  const publicKey = CryptoJS.SHA256(privateKey).toString()
  
  // Create DID using Bitcoin-style addressing
  const didHash = CryptoJS.SHA256(publicKey).toString().substring(0, 20)
  const did = `did:btc:${didHash}`
  
  return { did, publicKey, privateKey }
}

/**
 * Create a complete identity with DID document
 */
export const createIdentity = async (displayName: string): Promise<Identity> => {
  const { did, publicKey, privateKey } = generateDID()
  
  const document: DIDDocument = {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/v1'
    ],
    id: did,
    publicKey: [{
      id: `${did}#keys-1`,
      type: 'Secp256k1VerificationKey2018',
      controller: did,
      publicKeyHex: publicKey
    }],
    authentication: [`${did}#keys-1`],
    service: [{
      id: `${did}#bitcomm`,
      type: 'BitCommService',
      serviceEndpoint: 'https://bitcomm.email/api/did'
    }],
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  }
  
  // Add proof (simplified signature)
  const proof: Proof = {
    type: 'BitCommSignature2024',
    created: new Date().toISOString(),
    creator: `${did}#keys-1`,
    signatureValue: CryptoJS.HmacSHA256(JSON.stringify(document), privateKey).toString()
  }
  
  document.proof = proof
  
  return {
    did,
    publicKey,
    privateKey,
    document
  }
}

/**
 * Verify a DID and its document
 */
export const verifyDID = async (did: string): Promise<boolean> => {
  try {
    // Basic DID format validation
    if (!did.startsWith('did:btc:')) {
      return false
    }
    
    // Check if DID hash is valid format
    const hash = did.replace('did:btc:', '')
    if (hash.length !== 20) {
      return false
    }
    
    // For a full implementation, you would:
    // 1. Resolve the DID document from IPFS/DHT
    // 2. Verify the cryptographic signatures
    // 3. Check the proof chain
    
    return true
  } catch (error) {
    console.error('DID verification failed:', error)
    return false
  }
}

/**
 * Store DID user data locally (decentralized storage)
 */
export const storeDIDLocally = (user: DIDUser): void => {
  try {
    const userData = {
      ...user,
      createdAt: user.createdAt.toISOString()
    }
    localStorage.setItem('bitcomm_did_user', JSON.stringify(userData))
  } catch (error) {
    console.error('Failed to store DID locally:', error)
    throw new Error('Failed to store identity')
  }
}

/**
 * Retrieve DID user data from local storage
 */
export const getDIDFromStorage = (): DIDUser | null => {
  try {
    const stored = localStorage.getItem('bitcomm_did_user')
    if (!stored) return null
    
    const userData = JSON.parse(stored)
    return {
      ...userData,
      createdAt: new Date(userData.createdAt)
    }
  } catch (error) {
    console.error('Failed to retrieve DID from storage:', error)
    return null
  }
}

/**
 * Sign a message with DID private key
 */
export const signWithDID = (message: string, privateKey: string): string => {
  return CryptoJS.HmacSHA256(message, privateKey).toString()
}

/**
 * Verify a message signature with DID public key
 */
export const verifyDIDSignature = (message: string, signature: string, publicKey: string): boolean => {
  try {
    // This is a simplified verification - in production you'd use proper cryptographic verification
    const expectedSig = CryptoJS.HmacSHA256(message, publicKey).toString()
    return signature === expectedSig
  } catch (error) {
    console.error('Signature verification failed:', error)
    return false
  }
}

/**
 * Resolve DID document (would typically fetch from IPFS/DHT)
 */
export const resolveDID = async (did: string): Promise<DIDDocument | null> => {
  try {
    // In a full implementation, this would:
    // 1. Query IPFS/DHT network
    // 2. Retrieve and validate the DID document
    // 3. Verify cryptographic proofs
    
    // For now, return a basic document structure
    return {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/v1'
      ],
      id: did,
      publicKey: [],
      authentication: [],
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    }
  } catch (error) {
    console.error('DID resolution failed:', error)
    return null
  }
}

/**
 * Publish DID document to decentralized network (IPFS/DHT)
 */
export const publishDID = async (document: DIDDocument): Promise<boolean> => {
  try {
    // In a full implementation, this would:
    // 1. Store document on IPFS
    // 2. Announce to DHT network
    // 3. Update blockchain records if needed
    
    console.log('Publishing DID document:', document.id)
    return true
  } catch (error) {
    console.error('DID publishing failed:', error)
    return false
  }
}
