import { decentralizedStorage } from '@/lib/p2p/decentralized-storage'
import CryptoJS from 'crypto-js'

export interface DecentralizedPremiumIdentity {
  id: string
  user_id: string
  name: string
  address: string
  public_key: string
  private_key_encrypted: string
  is_verified: boolean
  verification_level: 'basic' | 'business' | 'domain' | 'enterprise'
  verification_date: string | null
  domain: string | null
  business_name: string | null
  created_at: string
  updated_at: string
  ipfs_hash: string // IPFS storage hash
}

export interface DeviceSync {
  identity_id: string
  device_id: string
  device_name: string
  encrypted_data: string
  last_sync: string
  ipfs_hash: string
}

export interface VerificationBadge {
  type: 'verified' | 'business' | 'domain' | 'enterprise'
  color: string
  icon: string
  label: string
  description: string
}

export class DecentralizedPremiumIdentityService {
  
  // Get verification badge info based on verification level
  static getVerificationBadge(identity: DecentralizedPremiumIdentity): VerificationBadge | null {
    if (!identity.is_verified) return null

    const badges: Record<string, VerificationBadge> = {
      basic: {
        type: 'verified',
        color: 'text-blue-500',
        icon: 'CheckCircle',
        label: 'Verified',
        description: 'Identity verified through cryptographic proof'
      },
      business: {
        type: 'business',
        color: 'text-green-500',
        icon: 'Building',
        label: 'Business',
        description: 'Verified business identity'
      },
      domain: {
        type: 'domain',
        color: 'text-purple-500',
        icon: 'Globe',
        label: 'Domain Verified',
        description: 'Domain ownership verified'
      },
      enterprise: {
        type: 'enterprise',
        color: 'text-gold-500',
        icon: 'Crown',
        label: 'Enterprise',
        description: 'Enterprise-grade verification'
      }
    }

    return badges[identity.verification_level] || null
  }

  // Create a new premium identity and store on IPFS
  static async createPremiumIdentity(params: {
    user_id: string
    name: string
    address: string
    public_key: string
    private_key: string
    passphrase: string
  }): Promise<DecentralizedPremiumIdentity> {
    await decentralizedStorage.initialize()
    
    // Encrypt private key with user's passphrase
    const encrypted_private_key = CryptoJS.AES.encrypt(
      params.private_key, 
      params.passphrase
    ).toString()

    const identity: DecentralizedPremiumIdentity = {
      id: CryptoJS.SHA256(params.public_key + Date.now()).toString(),
      user_id: params.user_id,
      name: params.name,
      address: params.address,
      public_key: params.public_key,
      private_key_encrypted: encrypted_private_key,
      is_verified: false,
      verification_level: 'basic',
      verification_date: null,
      domain: null,
      business_name: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ipfs_hash: ''
    }

    // Store identity on IPFS
    const identityData = JSON.stringify(identity)
    const hash = await decentralizedStorage.storeData(identityData, true)
    if (!hash) throw new Error('Failed to store identity on IPFS')

    identity.ipfs_hash = hash
    
    // Store the updated identity with hash
    const finalHash = await decentralizedStorage.storeData(JSON.stringify(identity), true)
    if (finalHash) {
      identity.ipfs_hash = finalHash
    }

    // Store identity reference in local storage
    this.storeIdentityReference(identity)

    console.log('📦 Premium identity stored on IPFS:', hash)
    return identity
  }

  // Get user's premium identities from IPFS
  static async getUserIdentities(user_id: string): Promise<DecentralizedPremiumIdentity[]> {
    const identityRefs = this.getStoredIdentityReferences(user_id)
    const identities: DecentralizedPremiumIdentity[] = []

    for (const ref of identityRefs) {
      try {
        const identityData = await decentralizedStorage.retrieveData(ref.ipfs_hash, true)
        if (identityData) {
          const identity = JSON.parse(identityData) as DecentralizedPremiumIdentity
          identities.push(identity)
        }
      } catch (error) {
        console.error('Failed to retrieve identity from IPFS:', error)
      }
    }

    return identities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  // Update premium identity on IPFS
  static async updatePremiumIdentity(
    identity: DecentralizedPremiumIdentity,
    updates: Partial<DecentralizedPremiumIdentity>
  ): Promise<DecentralizedPremiumIdentity> {
    await decentralizedStorage.initialize()
    
    const updatedIdentity = {
      ...identity,
      ...updates,
      updated_at: new Date().toISOString()
    }

    // Store updated identity on IPFS
    const identityData = JSON.stringify(updatedIdentity)
    const hash = await decentralizedStorage.storeData(identityData, true)
    if (!hash) throw new Error('Failed to update identity on IPFS')

    updatedIdentity.ipfs_hash = hash
    
    // Update local reference
    this.updateIdentityReference(updatedIdentity)

    return updatedIdentity
  }

  // Sync identity to device using IPFS
  static async syncToDevice(params: {
    identity_id: string
    device_id: string
    device_name: string
    encrypted_data: string
  }): Promise<void> {
    await decentralizedStorage.initialize()
    
    const syncData: DeviceSync = {
      identity_id: params.identity_id,
      device_id: params.device_id,
      device_name: params.device_name,
      encrypted_data: params.encrypted_data,
      last_sync: new Date().toISOString(),
      ipfs_hash: ''
    }

    // Store sync data on IPFS
    const syncDataString = JSON.stringify(syncData)
    const hash = await decentralizedStorage.storeData(syncDataString, true)
    if (!hash) throw new Error('Failed to sync to IPFS')

    syncData.ipfs_hash = hash
    
    // Store sync reference locally
    this.storeSyncReference(syncData)
  }

  // Get synced devices for identity from IPFS
  static async getSyncedDevices(identity_id: string): Promise<DeviceSync[]> {
    const syncRefs = this.getStoredSyncReferences(identity_id)
    const syncs: DeviceSync[] = []

    for (const ref of syncRefs) {
      try {
        const syncData = await decentralizedStorage.retrieveData(ref.ipfs_hash, true)
        if (syncData) {
          const sync = JSON.parse(syncData) as DeviceSync
          syncs.push(sync)
        }
      } catch (error) {
        console.error('Failed to retrieve sync data from IPFS:', error)
      }
    }

    return syncs.sort((a, b) => new Date(b.last_sync).getTime() - new Date(a.last_sync).getTime())
  }

  // Request verification upgrade (decentralized approach)
  static async requestVerification(params: {
    identity: DecentralizedPremiumIdentity
    verification_level: 'business' | 'domain' | 'enterprise'
    business_name?: string
    domain?: string
    documentation?: string[]
  }): Promise<DecentralizedPremiumIdentity> {
    // In a decentralized system, verification would be done through:
    // 1. Cryptographic proofs
    // 2. Community consensus
    // 3. Third-party attestations stored on IPFS
    
    const updatedIdentity = await this.updatePremiumIdentity(params.identity, {
      verification_level: params.verification_level,
      is_verified: true, // Simplified for demo - would require actual verification
      verification_date: new Date().toISOString(),
      business_name: params.business_name,
      domain: params.domain
    })

    console.log('🎖️ Verification request processed for', params.identity.name)
    return updatedIdentity
  }

  // Generate device fingerprint for multi-device sync
  static generateDeviceFingerprint(): string {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx?.fillText('BitComm Device ID', 10, 50)
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|')

    return CryptoJS.SHA256(fingerprint).toString()
  }

  // Decrypt private key with passphrase
  static decryptPrivateKey(encrypted_private_key: string, passphrase: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encrypted_private_key, passphrase)
      return bytes.toString(CryptoJS.enc.Utf8)
    } catch (error) {
      throw new Error('Invalid passphrase')
    }
  }

  // Store identity reference locally for quick access
  private static storeIdentityReference(identity: DecentralizedPremiumIdentity): void {
    const key = `bitcomm_identity_refs_${identity.user_id}`
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    const ref = {
      id: identity.id,
      name: identity.name,
      ipfs_hash: identity.ipfs_hash,
      created_at: identity.created_at
    }
    existing.push(ref)
    localStorage.setItem(key, JSON.stringify(existing))
  }

  // Get stored identity references
  private static getStoredIdentityReferences(user_id: string): Array<{
    id: string
    name: string
    ipfs_hash: string
    created_at: string
  }> {
    const key = `bitcomm_identity_refs_${user_id}`
    return JSON.parse(localStorage.getItem(key) || '[]')
  }

  // Update identity reference
  private static updateIdentityReference(identity: DecentralizedPremiumIdentity): void {
    const key = `bitcomm_identity_refs_${identity.user_id}`
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    const index = existing.findIndex((ref: any) => ref.id === identity.id)
    if (index !== -1) {
      existing[index] = {
        id: identity.id,
        name: identity.name,
        ipfs_hash: identity.ipfs_hash,
        created_at: identity.created_at
      }
      localStorage.setItem(key, JSON.stringify(existing))
    }
  }

  // Store sync reference locally
  private static storeSyncReference(sync: DeviceSync): void {
    const key = `bitcomm_sync_refs_${sync.identity_id}`
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    const ref = {
      device_id: sync.device_id,
      device_name: sync.device_name,
      ipfs_hash: sync.ipfs_hash,
      last_sync: sync.last_sync
    }
    existing.push(ref)
    localStorage.setItem(key, JSON.stringify(existing))
  }

  // Get stored sync references
  private static getStoredSyncReferences(identity_id: string): Array<{
    device_id: string
    device_name: string
    ipfs_hash: string
    last_sync: string
  }> {
    const key = `bitcomm_sync_refs_${identity_id}`
    return JSON.parse(localStorage.getItem(key) || '[]')
  }
}
