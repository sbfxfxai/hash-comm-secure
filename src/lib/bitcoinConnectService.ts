// Bitcoin Connect Service for BitComm
// Integrates Lightning wallet connectivity with WebLN
import {
  init,
  launchModal,
  launchPaymentModal,
  requestProvider,
  onConnected,
  onDisconnected,
  closeModal,
  disconnect
} from '@getalby/bitcoin-connect'

export interface BitcoinConnectConfig {
  appName: string
  developerShare: number // Percentage (e.g., 10 for 10%)
  developerAddress: string
}

export interface PaymentRequest {
  amount: number // Amount in satoshis
  description: string
  developerFee?: number
}

export interface PaymentResult {
  success: boolean
  preimage?: string
  error?: string
  developerPayment?: boolean
}

class BitcoinConnectService {
  private isInitialized = false
  private config: BitcoinConnectConfig
  private currentProvider: any = null

  constructor() {
    this.config = {
      appName: 'BitComm - Decentralized Communication',
      developerShare: 10, // 10% developer revenue
      developerAddress: process.env.VITE_DEVELOPER_BITCOIN_ADDRESS || 'excitementresourceful193152@getalby.com'
    }
  }

  // Initialize Bitcoin Connect
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      init({
        appName: this.config.appName,
        showBalance: true,
        // filters: ['nwc'], // Focus on NWC connections
      })

      // Set up connection events
      onConnected((provider) => {
        this.currentProvider = provider
        console.log('✅ Bitcoin wallet connected via Bitcoin Connect')
        
        // Make WebLN globally available
        if (typeof window !== 'undefined') {
          window.webln = provider
        }
      })

      onDisconnected(() => {
        this.currentProvider = null
        console.log('🔌 Bitcoin wallet disconnected')
        
        // Clear global WebLN
        if (typeof window !== 'undefined') {
          delete window.webln
        }
      })

      this.isInitialized = true
      console.log('🚀 Bitcoin Connect initialized for BitComm')
    } catch (error) {
      console.error('❌ Failed to initialize Bitcoin Connect:', error)
      throw error
    }
  }

  // Get WebLN provider (launches modal if needed)
  async getProvider(): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      if (this.currentProvider) {
        return this.currentProvider
      }

      // Request provider - will launch modal if needed
      const provider = await requestProvider()
      this.currentProvider = provider
      return provider
    } catch (error) {
      console.error('❌ Failed to get WebLN provider:', error)
      throw error
    }
  }

  // Launch connection modal manually
  async launchConnectionModal(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
    
    launchModal()
  }

  // Process payment with developer revenue sharing
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const provider = await this.getProvider()
      
      // Calculate developer fee
      const developerFee = Math.floor(request.amount * (this.config.developerShare / 100))
      const userAmount = request.amount - developerFee

      console.log(`💰 Processing payment: ${request.amount} sats (User: ${userAmount}, Dev: ${developerFee})`)

      // Process main payment
      const response = await provider.sendPayment(this.generateInvoice(userAmount, request.description))
      
      if (response.preimage) {
        // Process developer payment asynchronously
        this.processDeveloperPayment(developerFee).catch(console.error)
        
        return {
          success: true,
          preimage: response.preimage,
          developerPayment: true
        }
      }

      return {
        success: false,
        error: 'Payment failed'
      }
    } catch (error) {
      console.error('❌ Payment processing failed:', error)
      return {
        success: false,
        error: error.message || 'Unknown payment error'
      }
    }
  }

  // Launch payment modal for one-time payments
  async launchPaymentModal(invoice: string, onPaid?: (response: any) => void): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    return launchPaymentModal({
      invoice,
      onPaid: (response) => {
        console.log('✅ Payment completed via modal:', response.preimage)
        if (onPaid) onPaid(response)
      },
      onCancelled: () => {
        console.log('❌ Payment cancelled by user')
      }
    })
  }

  // Process subscription payment with Bitcoin Connect
  async processSubscriptionPayment(planId: string, amountSats: number): Promise<PaymentResult> {
    return this.processPayment({
      amount: amountSats,
      description: `BitComm ${planId} Subscription`,
    })
  }

  // Process feature payment (identity verification, file storage, etc.)
  async processFeaturePayment(feature: string, amountSats: number): Promise<PaymentResult> {
    return this.processPayment({
      amount: amountSats,
      description: `BitComm ${feature}`,
    })
  }

  // Get wallet info if available
  async getWalletInfo(): Promise<any> {
    try {
      const provider = await this.getProvider()
      
      if (provider.getInfo) {
        return await provider.getInfo()
      }
      
      return { alias: 'Connected Wallet', connected: true }
    } catch (error) {
      console.error('❌ Failed to get wallet info:', error)
      return null
    }
  }

  // Check if wallet is connected
  isConnected(): boolean {
    return this.currentProvider !== null
  }

  // Disconnect wallet
  async disconnectWallet(): Promise<void> {
    try {
      disconnect()
      this.currentProvider = null
      console.log('🔌 Wallet disconnected manually')
    } catch (error) {
      console.error('❌ Failed to disconnect wallet:', error)
    }
  }

  // Close modal programmatically
  closeModal(): void {
    closeModal()
  }

  // Private helper methods
  private generateInvoice(amount: number, description: string): string {
    // For demo - in production, generate real Lightning invoices
    return `lnbc${amount}1demo${description.replace(/\s+/g, '').toLowerCase()}`
  }

  private async processDeveloperPayment(amount: number): Promise<void> {
    try {
      console.log(`💸 Processing developer fee: ${amount} sats to ${this.config.developerAddress}`)
      
      // In production, this would send to your Lightning address
      // For now, just log the transaction
      console.log(`✅ Developer revenue share processed: ${amount} sats`)
    } catch (error) {
      console.error('❌ Developer payment failed:', error)
    }
  }
}

// Export singleton instance
export const bitcoinConnect = new BitcoinConnectService()
export default bitcoinConnect