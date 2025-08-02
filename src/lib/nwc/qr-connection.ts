// QR Code Connection Flow for NWC
// Enables seamless mobile-to-web wallet connections

export interface QRConnectionData {
  method: 'connect'
  client_pubkey: string
  permissions: string[]
  budget?: {
    daily?: number
    monthly?: number
  }
  relay: string
  app_name: string
  timestamp: number
}

export interface QRScanResult {
  wallet_pubkey: string
  relay_url: string
  wallet_name?: string
  permissions_granted: string[]
  budget_approved?: {
    daily?: number
    monthly?: number
  }
}

export class QRConnectionFlow {
  private static instance: QRConnectionFlow
  private connectionCallbacks: Map<string, (result: QRScanResult) => void> = new Map()
  private timeouts: Map<string, NodeJS.Timeout> = new Map()

  static getInstance(): QRConnectionFlow {
    if (!QRConnectionFlow.instance) {
      QRConnectionFlow.instance = new QRConnectionFlow()
    }
    return QRConnectionFlow.instance
  }

  /**
   * Generate QR code data for wallet connection
   */
  generateConnectionQR(
    clientPubkey: string,
    permissions: string[] = ['pay_invoice', 'get_balance', 'get_info'],
    budget?: { daily?: number; monthly?: number }
  ): { qrData: string; connectionId: string } {
    const connectionId = `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const qrData: QRConnectionData = {
      method: 'connect',
      client_pubkey: clientPubkey,
      permissions,
      budget,
      relay: 'wss://relay.getalby.com/v1',
      app_name: 'BitComm',
      timestamp: Date.now()
    }

    // Convert to QR-friendly format
    const qrString = this.encodeQRData(qrData, connectionId)
    
    console.log('📱 QR connection code generated:', connectionId)
    return { qrData: qrString, connectionId }
  }

  /**
   * Wait for QR scan result
   */
  waitForConnection(
    connectionId: string,
    callback: (result: QRScanResult) => void,
    timeoutMs: number = 300000 // 5 minutes
  ): void {
    // Store callback
    this.connectionCallbacks.set(connectionId, callback)

    // Set timeout
    const timeout = setTimeout(() => {
      this.connectionCallbacks.delete(connectionId)
      callback({
        wallet_pubkey: '',
        relay_url: '',
        wallet_name: 'Connection Timeout',
        permissions_granted: []
      })
    }, timeoutMs)

    this.timeouts.set(connectionId, timeout)

    // Listen for connection events
    this.setupConnectionListener(connectionId)
  }

  /**
   * Process scanned QR result (simulated - in production this would come from Nostr relay)
   */
  processQRScan(qrData: string): QRScanResult | null {
    try {
      const parsed = this.decodeQRData(qrData)
      
      if (parsed.method === 'connect') {
        // Simulate wallet approval
        return {
          wallet_pubkey: this.generateMockWalletPubkey(),
          relay_url: parsed.relay,
          wallet_name: 'Mobile Lightning Wallet',
          permissions_granted: parsed.permissions,
          budget_approved: parsed.budget
        }
      }

      return null
    } catch (error) {
      console.error('Failed to process QR scan:', error)
      return null
    }
  }

  /**
   * Handle mobile wallet response (called when wallet scans QR)
   */
  handleWalletResponse(connectionId: string, response: QRScanResult): void {
    const callback = this.connectionCallbacks.get(connectionId)
    
    if (callback) {
      // Clear timeout
      const timeout = this.timeouts.get(connectionId)
      if (timeout) {
        clearTimeout(timeout)
        this.timeouts.delete(connectionId)
      }

      // Remove callback
      this.connectionCallbacks.delete(connectionId)

      // Execute callback
      callback(response)
      
      console.log('✅ QR connection completed:', connectionId)
    }
  }

  /**
   * Cancel pending connection
   */
  cancelConnection(connectionId: string): void {
    // Clear timeout
    const timeout = this.timeouts.get(connectionId)
    if (timeout) {
      clearTimeout(timeout)
      this.timeouts.delete(connectionId)
    }

    // Remove callback
    this.connectionCallbacks.delete(connectionId)
    
    console.log('❌ QR connection cancelled:', connectionId)
  }

  /**
   * Generate deep link for mobile wallets
   */
  generateDeepLink(qrData: string): string {
    const encoded = encodeURIComponent(qrData)
    
    // Support multiple wallet apps
    const deepLinks = {
      alby: `alby://connect?data=${encoded}`,
      phoenix: `phoenix://connect?data=${encoded}`,
      wallet_of_satoshi: `walletofsatoshi://connect?data=${encoded}`,
      blue_wallet: `bluewallet://connect?data=${encoded}`,
      breez: `breez://connect?data=${encoded}`
    }

    // Return universal link that tries multiple wallets
    return `https://nwc.link/connect?data=${encoded}&fallback=true`
  }

  /**
   * Check if device supports native wallet apps
   */
  checkNativeWalletSupport(): Promise<string[]> {
    return new Promise((resolve) => {
      const supportedWallets: string[] = []
      
      // Check for installed wallet apps (simplified)
      if (this.isAndroid()) {
        // Android specific checks
        supportedWallets.push('wallet_of_satoshi', 'phoenix', 'breez')
      } else if (this.isIOS()) {
        // iOS specific checks
        supportedWallets.push('blue_wallet', 'phoenix')
      }

      // Check for browser extension wallets
      if (typeof window !== 'undefined') {
        if ((window as any).alby) supportedWallets.push('alby')
        if ((window as any).webln) supportedWallets.push('webln')
      }

      setTimeout(() => resolve(supportedWallets), 100)
    })
  }

  /**
   * Private helper methods
   */
  private encodeQRData(data: QRConnectionData, connectionId: string): string {
    // Encode as JSON for QR code
    const payload = {
      ...data,
      connection_id: connectionId
    }
    
    return JSON.stringify(payload)
  }

  private decodeQRData(qrData: string): QRConnectionData & { connection_id: string } {
    return JSON.parse(qrData)
  }

  private generateMockWalletPubkey(): string {
    // Generate mock wallet public key
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)
    
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  private setupConnectionListener(connectionId: string): void {
    // In production, this would listen to Nostr relay for wallet responses
    // For demo, we'll simulate a response after delay
    setTimeout(() => {
      if (this.connectionCallbacks.has(connectionId)) {
        const mockResponse: QRScanResult = {
          wallet_pubkey: this.generateMockWalletPubkey(),
          relay_url: 'wss://relay.getalby.com/v1',
          wallet_name: 'Demo Mobile Wallet',
          permissions_granted: ['pay_invoice', 'get_balance', 'get_info'],
          budget_approved: {
            daily: 100000,
            monthly: 1000000
          }
        }
        
        this.handleWalletResponse(connectionId, mockResponse)
      }
    }, 5000) // Simulate 5 second scan delay
  }

  private isAndroid(): boolean {
    return typeof navigator !== 'undefined' && 
           /Android/i.test(navigator.userAgent)
  }

  private isIOS(): boolean {
    return typeof navigator !== 'undefined' && 
           /iPad|iPhone|iPod/.test(navigator.userAgent)
  }
}

export const qrConnectionFlow = QRConnectionFlow.getInstance()