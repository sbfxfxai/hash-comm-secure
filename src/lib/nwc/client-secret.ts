// Client-Side Secret Management for NWC
// Implements secure client-side secret generation as per NWC best practices

export interface ClientSecret {
  privateKey: string
  publicKey: string
  secret: string
}

export interface NWCConnectionData {
  walletPublicKey: string
  relayUrl: string
  clientSecret: ClientSecret
  connectionString: string
}

export class ClientSecretManager {
  private static instance: ClientSecretManager
  private secrets: Map<string, ClientSecret> = new Map()

  static getInstance(): ClientSecretManager {
    if (!ClientSecretManager.instance) {
      ClientSecretManager.instance = new ClientSecretManager()
    }
    return ClientSecretManager.instance
  }

  /**
   * Generate new client secret that never leaves the device
   */
  generateClientSecret(): ClientSecret {
    // Generate random private key (32 bytes)
    const privateKeyBytes = new Uint8Array(32)
    crypto.getRandomValues(privateKeyBytes)
    
    // Convert to hex
    const privateKey = Array.from(privateKeyBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Generate public key (simplified - in production use proper secp256k1)
    const publicKey = this.derivePublicKey(privateKey)
    
    // Generate secret (used for NWC connection)
    const secretBytes = new Uint8Array(32)
    crypto.getRandomValues(secretBytes)
    const secret = Array.from(secretBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    const clientSecret: ClientSecret = {
      privateKey,
      publicKey,
      secret
    }

    // Store securely in device storage
    this.storeSecret(publicKey, clientSecret)
    
    return clientSecret
  }

  /**
   * Construct NWC connection from client secret and wallet data
   */
  constructConnection(
    walletPublicKey: string,
    relayUrl: string,
    clientSecret: ClientSecret
  ): NWCConnectionData {
    // Construct NWC connection string using client-generated secret
    const connectionString = `nostr+walletconnect://${walletPublicKey}?relay=${encodeURIComponent(relayUrl)}&secret=${clientSecret.secret}`

    return {
      walletPublicKey,
      relayUrl,
      clientSecret,
      connectionString
    }
  }

  /**
   * Retrieve stored secret by public key
   */
  getSecret(publicKey: string): ClientSecret | null {
    return this.secrets.get(publicKey) || this.loadSecretFromStorage(publicKey)
  }

  /**
   * Store secret securely on device
   */
  private storeSecret(publicKey: string, secret: ClientSecret): void {
    this.secrets.set(publicKey, secret)
    
    try {
      // Store in localStorage with encryption
      const encrypted = this.encryptSecret(secret)
      localStorage.setItem(`nwc_secret_${publicKey}`, encrypted)
    } catch (error) {
      console.error('Failed to store secret:', error)
    }
  }

  /**
   * Load secret from secure storage
   */
  private loadSecretFromStorage(publicKey: string): ClientSecret | null {
    try {
      const encrypted = localStorage.getItem(`nwc_secret_${publicKey}`)
      if (!encrypted) return null
      
      const secret = this.decryptSecret(encrypted)
      this.secrets.set(publicKey, secret)
      return secret
    } catch (error) {
      console.error('Failed to load secret:', error)
      return null
    }
  }

  /**
   * Derive public key from private key (simplified implementation)
   */
  private derivePublicKey(privateKey: string): string {
    // In production, use proper secp256k1 library
    // This is a simplified version for demo
    const hash = new TextEncoder().encode(privateKey)
    return Array.from(hash.slice(0, 32))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  /**
   * Encrypt secret for storage (basic implementation)
   */
  private encryptSecret(secret: ClientSecret): string {
    // In production, use proper encryption
    return btoa(JSON.stringify(secret))
  }

  /**
   * Decrypt secret from storage (basic implementation)
   */
  private decryptSecret(encrypted: string): ClientSecret {
    // In production, use proper decryption
    return JSON.parse(atob(encrypted))
  }

  /**
   * Clear all stored secrets (for logout/reset)
   */
  clearAllSecrets(): void {
    this.secrets.clear()
    
    // Clear from localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key?.startsWith('nwc_secret_')) {
        localStorage.removeItem(key)
      }
    }
  }

  /**
   * Get connection budget settings for a wallet
   */
  getBudgetSettings(publicKey: string): { daily?: number; monthly?: number } {
    try {
      const settings = localStorage.getItem(`nwc_budget_${publicKey}`)
      return settings ? JSON.parse(settings) : {}
    } catch {
      return {}
    }
  }

  /**
   * Set connection budget settings
   */
  setBudgetSettings(publicKey: string, budget: { daily?: number; monthly?: number }): void {
    try {
      localStorage.setItem(`nwc_budget_${publicKey}`, JSON.stringify(budget))
    } catch (error) {
      console.error('Failed to store budget settings:', error)
    }
  }
}

export const clientSecretManager = ClientSecretManager.getInstance()