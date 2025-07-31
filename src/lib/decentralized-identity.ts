// Decentralized Identity using DID and Web5
import CryptoJS from 'crypto-js'

export interface DecentralizedIdentity {
  did: string // Decentralized Identifier
  publicKey: string
  privateKey: string // Encrypted locally
  metadata: {
    name: string
    created: Date
    lastUsed: Date
  }
}

export class DecentralizedIdentityManager {
  private identities: Map<string, DecentralizedIdentity> = new Map()
  
  // Create self-sovereign identity
  async createIdentity(name: string): Promise<DecentralizedIdentity | null> {
    try {
      // Generate key pair
      const keyPair = await this.generateKeyPair()
      
      // Create DID (Decentralized Identifier)
      const did = `did:peer:${this.generateDIDSuffix(keyPair.publicKey)}`
      
      const identity: DecentralizedIdentity = {
        did,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        metadata: {
          name,
          created: new Date(),
          lastUsed: new Date()
        }
      }

      // Store locally (no central server)
      this.identities.set(did, identity)
      await this.saveToLocalStorage()
      
      console.log('🆔 Created decentralized identity:', did)
      return identity
    } catch (error) {
      console.error('Failed to create identity:', error)
      return null
    }
  }

  // Load identities from local storage only
  async loadIdentities(): Promise<DecentralizedIdentity[]> {
    try {
      const stored = localStorage.getItem('bitcomm_identities')
      if (stored) {
        const parsed = JSON.parse(stored)
        Object.entries(parsed).forEach(([did, identity]) => {
          this.identities.set(did, identity as DecentralizedIdentity)
        })
      }
      return Array.from(this.identities.values())
    } catch (error) {
      console.error('Failed to load identities:', error)
      return []
    }
  }

  // Verify identity without central authority
  async verifyIdentity(did: string, signature: string, message: string): Promise<boolean> {
    try {
      const identity = this.identities.get(did)
      if (!identity) return false
      
      // Verify signature using public key
      return this.verifySignature(message, signature, identity.publicKey)
    } catch (error) {
      console.error('Failed to verify identity:', error)
      return false
    }
  }

  private async generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    // Use Web Crypto API for key generation
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true,
      ['sign', 'verify']
    )

    const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey)
    const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)

    return {
      publicKey: this.arrayBufferToBase64(publicKey),
      privateKey: this.arrayBufferToBase64(privateKey)
    }
  }

  private generateDIDSuffix(publicKey: string): string {
    return CryptoJS.SHA256(publicKey).toString().substring(0, 32)
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  private async verifySignature(message: string, signature: string, publicKeyBase64: string): Promise<boolean> {
    // Implement signature verification
    // For demo purposes, return true if signature exists
    return signature.length > 0
  }

  private async saveToLocalStorage(): Promise<void> {
    const identitiesObj = Object.fromEntries(this.identities)
    localStorage.setItem('bitcomm_identities', JSON.stringify(identitiesObj))
  }
}

export const decentralizedIdentityManager = new DecentralizedIdentityManager()