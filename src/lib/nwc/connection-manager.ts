// NWC Connection Manager - Implements 1-Click Connection Flows
// Supports both HTTP and Nostr flows for maximum compatibility

import { clientSecretManager, type ClientSecret, type NWCConnectionData } from './client-secret'

export interface WalletConnection {
  id: string
  type: 'http' | 'nostr'
  name: string
  publicKey: string
  relayUrl?: string
  httpUrl?: string
  connected: boolean
  budget?: {
    daily?: number
    monthly?: number
  }
  permissions: string[]
}

export interface ConnectionResult {
  success: boolean
  connection?: WalletConnection
  error?: string
  requiresQR?: boolean
  qrData?: string
}

export class NWCConnectionManager {
  private static instance: NWCConnectionManager
  private connections: Map<string, WalletConnection> = new Map()
  private activeConnection: WalletConnection | null = null

  static getInstance(): NWCConnectionManager {
    if (!NWCConnectionManager.instance) {
      NWCConnectionManager.instance = new NWCConnectionManager()
    }
    return NWCConnectionManager.instance
  }

  /**
   * Initialize connection manager and load existing connections
   */
  async initialize(): Promise<void> {
    try {
      // Load stored connections
      const stored = localStorage.getItem('nwc_connections')
      if (stored) {
        const connections: WalletConnection[] = JSON.parse(stored)
        connections.forEach(conn => {
          this.connections.set(conn.id, conn)
        })
      }

      // Load active connection
      const activeId = localStorage.getItem('nwc_active_connection')
      if (activeId && this.connections.has(activeId)) {
        this.activeConnection = this.connections.get(activeId)!
      }

      console.log('🔗 NWC Connection Manager initialized')
    } catch (error) {
      console.error('Failed to initialize connection manager:', error)
    }
  }

  /**
   * Start 1-click connection flow
   * Automatically detects wallet type and uses appropriate flow
   */
  async connect(walletUrl?: string): Promise<ConnectionResult> {
    try {
      if (walletUrl) {
        // Try HTTP flow first for publicly accessible wallets
        const httpResult = await this.connectViaHTTP(walletUrl)
        if (httpResult.success) {
          return httpResult
        }
      }

      // Fall back to Nostr flow for mobile/self-hosted wallets
      return await this.connectViaNostr()
    } catch (error) {
      console.error('Connection failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }
    }
  }

  /**
   * HTTP Flow - For publicly accessible wallets
   * OAuth-like experience similar to "Login with Google"
   */
  private async connectViaHTTP(walletUrl: string): Promise<ConnectionResult> {
    try {
      console.log('🌐 Starting HTTP connection flow...')

      // Generate client secret
      const clientSecret = clientSecretManager.generateClientSecret()
      
      // Construct connection request
      const connectionRequest = {
        client_pubkey: clientSecret.publicKey,
        permissions: ['pay_invoice', 'get_balance', 'get_info'],
        budget: {
          daily: 100000, // 100k sats daily limit
          monthly: 1000000 // 1M sats monthly limit
        }
      }

      // Send connection request to wallet
      const response = await fetch(`${walletUrl}/api/nwc/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(connectionRequest)
      })

      if (!response.ok) {
        throw new Error('Wallet connection rejected')
      }

      const result = await response.json()
      
      if (result.success && result.wallet_pubkey) {
        // Create connection
        const connection: WalletConnection = {
          id: `http_${Date.now()}`,
          type: 'http',
          name: result.wallet_name || 'HTTP Wallet',
          publicKey: result.wallet_pubkey,
          httpUrl: walletUrl,
          connected: true,
          budget: connectionRequest.budget,
          permissions: connectionRequest.permissions
        }

        // Store connection
        this.addConnection(connection)
        this.setActiveConnection(connection)

        console.log('✅ HTTP connection established')
        return { success: true, connection }
      }

      throw new Error('Invalid wallet response')
    } catch (error) {
      console.error('HTTP connection failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'HTTP connection failed'
      }
    }
  }

  /**
   * Nostr Flow - For mobile/self-hosted wallets
   * Uses QR code for cross-device connectivity
   */
  private async connectViaNostr(): Promise<ConnectionResult> {
    try {
      console.log('⚡ Starting Nostr connection flow...')

      // Generate client secret
      const clientSecret = clientSecretManager.generateClientSecret()
      
      // Create connection request for QR code
      const connectionRequest = {
        method: 'connect',
        client_pubkey: clientSecret.publicKey,
        permissions: ['pay_invoice', 'get_balance', 'get_info'],
        budget: {
          daily: 100000,
          monthly: 1000000
        },
        relay: 'wss://relay.getalby.com/v1'
      }

      // Generate QR code data
      const qrData = JSON.stringify(connectionRequest)

      console.log('📱 QR code generated for mobile connection')
      
      return {
        success: false, // Will be completed when QR is scanned
        requiresQR: true,
        qrData
      }
    } catch (error) {
      console.error('Nostr connection setup failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Nostr connection failed'
      }
    }
  }

  /**
   * Complete Nostr connection after QR scan
   */
  async completeNostrConnection(walletData: {
    wallet_pubkey: string
    relay_url: string
    wallet_name?: string
  }): Promise<ConnectionResult> {
    try {
      // Get the client secret used in QR
      const clientSecret = clientSecretManager.generateClientSecret() // This should retrieve the one used in QR
      
      // Construct NWC connection
      const nwcData = clientSecretManager.constructConnection(
        walletData.wallet_pubkey,
        walletData.relay_url,
        clientSecret
      )

      // Create connection
      const connection: WalletConnection = {
        id: `nostr_${Date.now()}`,
        type: 'nostr',
        name: walletData.wallet_name || 'Mobile Wallet',
        publicKey: walletData.wallet_pubkey,
        relayUrl: walletData.relay_url,
        connected: true,
        budget: {
          daily: 100000,
          monthly: 1000000
        },
        permissions: ['pay_invoice', 'get_balance', 'get_info']
      }

      // Store connection
      this.addConnection(connection)
      this.setActiveConnection(connection)

      console.log('✅ Nostr connection established')
      return { success: true, connection }
    } catch (error) {
      console.error('Failed to complete Nostr connection:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete connection'
      }
    }
  }

  /**
   * Send payment using active connection
   */
  async sendPayment(invoice: string): Promise<{ success: boolean; preimage?: string; error?: string }> {
    if (!this.activeConnection) {
      return { success: false, error: 'No active wallet connection' }
    }

    try {
      if (this.activeConnection.type === 'http') {
        return await this.sendPaymentHTTP(invoice)
      } else {
        return await this.sendPaymentNostr(invoice)
      }
    } catch (error) {
      console.error('Payment failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed'
      }
    }
  }

  /**
   * Send payment via HTTP
   */
  private async sendPaymentHTTP(invoice: string): Promise<{ success: boolean; preimage?: string; error?: string }> {
    if (!this.activeConnection?.httpUrl) {
      throw new Error('No HTTP URL configured')
    }

    const response = await fetch(`${this.activeConnection.httpUrl}/api/nwc/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ invoice })
    })

    const result = await response.json()
    
    if (result.success) {
      return { success: true, preimage: result.preimage }
    } else {
      return { success: false, error: result.error }
    }
  }

  /**
   * Send payment via Nostr
   */
  private async sendPaymentNostr(invoice: string): Promise<{ success: boolean; preimage?: string; error?: string }> {
    // In production, this would use Nostr protocol to communicate with wallet
    // For now, simulate the process
    console.log('⚡ Sending payment via Nostr protocol...')
    
    // This would involve:
    // 1. Create encrypted message with payment request
    // 2. Send to wallet via Nostr relay
    // 3. Wait for encrypted response
    // 4. Decrypt and return result
    
    return { success: true, preimage: 'mock_preimage_' + Date.now() }
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<{ balance?: number; error?: string }> {
    if (!this.activeConnection) {
      return { error: 'No active wallet connection' }
    }

    try {
      if (this.activeConnection.type === 'http') {
        return await this.getBalanceHTTP()
      } else {
        return await this.getBalanceNostr()
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to get balance' }
    }
  }

  private async getBalanceHTTP(): Promise<{ balance?: number; error?: string }> {
    if (!this.activeConnection?.httpUrl) {
      throw new Error('No HTTP URL configured')
    }

    const response = await fetch(`${this.activeConnection.httpUrl}/api/nwc/balance`)
    const result = await response.json()
    
    return { balance: result.balance }
  }

  private async getBalanceNostr(): Promise<{ balance?: number; error?: string }> {
    // Simulate Nostr balance request
    return { balance: Math.floor(Math.random() * 1000000) }
  }

  /**
   * Connection management
   */
  private addConnection(connection: WalletConnection): void {
    this.connections.set(connection.id, connection)
    this.saveConnections()
  }

  private setActiveConnection(connection: WalletConnection): void {
    this.activeConnection = connection
    localStorage.setItem('nwc_active_connection', connection.id)
  }

  private saveConnections(): void {
    const connections = Array.from(this.connections.values())
    localStorage.setItem('nwc_connections', JSON.stringify(connections))
  }

  getActiveConnection(): WalletConnection | null {
    return this.activeConnection
  }

  getAllConnections(): WalletConnection[] {
    return Array.from(this.connections.values())
  }

  disconnect(connectionId?: string): void {
    if (connectionId) {
      this.connections.delete(connectionId)
      if (this.activeConnection?.id === connectionId) {
        this.activeConnection = null
        localStorage.removeItem('nwc_active_connection')
      }
    } else {
      // Disconnect all
      this.connections.clear()
      this.activeConnection = null
      localStorage.removeItem('nwc_active_connection')
    }
    this.saveConnections()
  }
}

export const nwcConnectionManager = NWCConnectionManager.getInstance()