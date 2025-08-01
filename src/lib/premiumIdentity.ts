// Decentralized Premium Identity Service
import { decentralizedStorage } from './p2p/decentralized-storage'
import CryptoJS from 'crypto-js'

export interface PremiumIdentity {
  id: string;
  user_id: string;
  name: string;
  public_key: string;
  encrypted_private_key: string;
  is_verified: boolean;
  verification_method: string;
  created_at: string;
  updated_at: string;
  metadata: IdentityMetadata;
}

export interface VerificationBadge {
  level: 'basic' | 'verified' | 'premium';
  text: string;
  color: string;
  icon?: string;
}

export interface IdentityMetadata {
  address?: string;
  phone?: string;
  email?: string;
  social_profiles?: Record<string, string>;
  verification_documents?: string[];
  ipfs_hash?: string;
}

export class PremiumIdentityService {
  
  // Get verification badge for identity
  static getVerificationBadge(identity: PremiumIdentity): VerificationBadge | null {
    if (identity.is_verified) {
      return {
        level: 'verified',
        text: 'Verified',
        color: 'green',
        icon: 'check'
      }
    }
    return {
      level: 'basic',
      text: 'Unverified',
      color: 'gray',
      icon: 'clock'
    }
  }
  
  // Create a new premium identity (stored on IPFS)
  static async createPremiumIdentity(params: {
    user_id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    public_key: string;
    private_key: string;
    passphrase: string;
  }): Promise<PremiumIdentity> {
    const encryptedPrivateKey = CryptoJS.AES.encrypt(params.private_key, params.passphrase).toString()
    
    const identity: PremiumIdentity = {
      id: `identity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: params.user_id,
      name: params.name,
      public_key: params.public_key,
      encrypted_private_key: encryptedPrivateKey,
      is_verified: false,
      verification_method: 'manual',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        address: params.address,
        phone: params.phone,
        email: params.email,
        social_profiles: {},
        verification_documents: []
      }
    }

    try {
      // Store on IPFS via decentralized storage
      const ipfsHash = await decentralizedStorage.storeData(JSON.stringify(identity))
      identity.metadata.ipfs_hash = ipfsHash
      
      // Store reference locally for fast access
      this.storeIdentityReference(identity)
      
      return identity
    } catch (error) {
      console.error('Failed to create premium identity:', error)
      throw error
    }
  }

  // Get user's premium identities
  static async getUserIdentities(user_id: string): Promise<PremiumIdentity[]> {
    try {
      // Try to get from local storage first
      const localIdentities = this.getStoredIdentityReferences()
      const userIdentities = localIdentities.filter(id => id.user_id === user_id)
      
      if (userIdentities.length > 0) {
        return userIdentities
      }

      // If not found locally, return empty array (in production would query IPFS)
      return []
    } catch (error) {
      console.error('Failed to retrieve identities:', error)
      return []
    }
  }

  // Update a premium identity
  static async updatePremiumIdentity(
    identityId: string, 
    updates: Partial<PremiumIdentity>
  ): Promise<PremiumIdentity | null> {
    try {
      const identities = this.getStoredIdentityReferences()
      const index = identities.findIndex(id => id.id === identityId)
      
      if (index !== -1) {
        const updatedIdentity = {
          ...identities[index],
          ...updates,
          updated_at: new Date().toISOString()
        }
        
        identities[index] = updatedIdentity
        localStorage.setItem('premium_identities', JSON.stringify(identities))
        
        // In production: update on IPFS
        if (updatedIdentity.metadata.ipfs_hash) {
          await decentralizedStorage.storeData(JSON.stringify(updatedIdentity))
        }
        
        return updatedIdentity
      }
      
      return null
    } catch (error) {
      console.error('Failed to update identity:', error)
      return null
    }
  }

  // Delete a premium identity
  static async deletePremiumIdentity(identityId: string): Promise<boolean> {
    try {
      const identities = this.getStoredIdentityReferences()
      const filteredIdentities = identities.filter(id => id.id !== identityId)
      
      localStorage.setItem('premium_identities', JSON.stringify(filteredIdentities))
      return true
    } catch (error) {
      console.error('Failed to delete identity:', error)
      return false
    }
  }

  // Request verification for an identity
  static async requestVerification(
    identityId: string, 
    verificationType: 'email' | 'phone' | 'document' | 'manual'
  ): Promise<boolean> {
    try {
      const identities = this.getStoredIdentityReferences()
      const identity = identities.find(id => id.id === identityId)
      
      if (identity) {
        identity.verification_method = verificationType
        identity.updated_at = new Date().toISOString()
        
        localStorage.setItem('premium_identities', JSON.stringify(identities))
        return true
      }
      
      return false
    } catch (error) {
      console.error('Failed to request verification:', error)
      return false
    }
  }

  // Private helper methods
  private static storeIdentityReference(identity: PremiumIdentity): void {
    try {
      const existingIdentities = this.getStoredIdentityReferences()
      existingIdentities.push(identity)
      localStorage.setItem('premium_identities', JSON.stringify(existingIdentities))
    } catch (error) {
      console.error('Failed to store identity reference:', error)
    }
  }

  private static getStoredIdentityReferences(): PremiumIdentity[] {
    try {
      const stored = localStorage.getItem('premium_identities')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to get stored identity references:', error)
      return []
    }
  }
}