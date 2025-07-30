import { supabase } from './supabase'
import CryptoJS from 'crypto-js'

export interface PremiumIdentity {
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
}

export interface VerificationBadge {
  type: 'verified' | 'business' | 'domain' | 'enterprise'
  color: string
  icon: string
  label: string
  description: string
}

export class PremiumIdentityService {
  
  // Get verification badge info based on verification level
  static getVerificationBadge(identity: PremiumIdentity): VerificationBadge | null {
    if (!identity.is_verified) return null

    const badges: Record<string, VerificationBadge> = {
      basic: {
        type: 'verified',
        color: 'text-blue-500',
        icon: 'CheckCircle',
        label: 'Verified',
        description: 'Identity verified through email and phone'
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

  // Create a new premium identity
  static async createPremiumIdentity(params: {
    user_id: string
    name: string
    address: string
    public_key: string
    private_key: string
    passphrase: string
  }): Promise<PremiumIdentity> {
    // Encrypt private key with user's passphrase
    const encrypted_private_key = CryptoJS.AES.encrypt(
      params.private_key, 
      params.passphrase
    ).toString()

    const { data, error } = await supabase
      .from('premium_identities')
      .insert({
        user_id: params.user_id,
        name: params.name,
        address: params.address,
        public_key: params.public_key,
        private_key_encrypted: encrypted_private_key,
        is_verified: false,
        verification_level: 'basic'
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Get user's premium identities
  static async getUserIdentities(user_id: string): Promise<PremiumIdentity[]> {
    const { data, error } = await supabase
      .from('premium_identities')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Sync identity to device
  static async syncToDevice(params: {
    identity_id: string
    device_id: string
    device_name: string
    encrypted_data: string
  }): Promise<void> {
    const { error } = await supabase
      .from('device_sync')
      .upsert({
        identity_id: params.identity_id,
        device_id: params.device_id,
        device_name: params.device_name,
        encrypted_data: params.encrypted_data,
        last_sync: new Date().toISOString()
      })

    if (error) throw error
  }

  // Get synced devices for identity
  static async getSyncedDevices(identity_id: string) {
    const { data, error } = await supabase
      .from('device_sync')
      .select('*')
      .eq('identity_id', identity_id)
      .order('last_sync', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Request verification upgrade
  static async requestVerification(params: {
    identity_id: string
    verification_level: 'business' | 'domain' | 'enterprise'
    business_name?: string
    domain?: string
    documentation?: string[]
  }): Promise<void> {
    // In a real implementation, this would create a verification request
    // For now, we'll simulate immediate verification for demo purposes
    const { error } = await supabase
      .from('premium_identities')
      .update({
        verification_level: params.verification_level,
        is_verified: true,
        verification_date: new Date().toISOString(),
        business_name: params.business_name,
        domain: params.domain,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.identity_id)

    if (error) throw error
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
}
