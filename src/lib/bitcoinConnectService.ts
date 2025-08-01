// Bitcoin Connect Service for BitComm - Enhanced with Lightning Tools
// Integrates Lightning wallet connectivity with WebLN and js-lightning-tools
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
import { LightningAddress, fiat } from '@getalby/lightning-tools'

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

  // Enhanced payment processing with Lightning Tools
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const provider = await this.getProvider()
      
      // Calculate developer fee
      const developerFee = Math.floor(request.amount * (this.config.developerShare / 100))
      const userAmount = request.amount - developerFee

      console.log(`💰 Processing payment: ${request.amount} sats (User: ${userAmount}, Dev: ${developerFee})`)

      // Use Lightning Address for more robust payment processing
      const ln = new LightningAddress(this.config.developerAddress)
      await ln.fetch()
      
      // Request invoice for user amount
      const invoice = await ln.requestInvoice({
        satoshi: userAmount,
        comment: request.description
      })

      if (invoice.paymentRequest) {
        // Process payment
        const response = await provider.sendPayment(invoice.paymentRequest)
        
        if (response.preimage) {
          // Verify payment using Lightning Tools
          const verified = invoice.validatePreimage(response.preimage)
          
          if (verified) {
            // Process developer payment asynchronously
            this.processDeveloperPayment(developerFee).catch(console.error)
            
            return {
              success: true,
              preimage: response.preimage,
              developerPayment: true
            }
          }
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

  // Get fiat conversion using Lightning Tools
  async getFiatValue(satoshi: number, currency: string = 'USD'): Promise<number> {
    try {
      return await fiat.getFiatValue({ satoshi, currency: currency.toLowerCase() })
    } catch (error) {
      console.error('❌ Fiat conversion failed:', error)
      return 0
    }
  }

  // Get formatted fiat value
  async getFormattedFiatValue(satoshi: number, currency: string = 'USD', locale: string = 'en'): Promise<string> {
    try {
      return await fiat.getFormattedFiatValue({ satoshi, currency: currency.toLowerCase(), locale })
    } catch (error) {
      console.error('❌ Formatted fiat conversion failed:', error)
      return `${satoshi} sats`
    }
  }

  // Private helper methods
  private async processDeveloperPayment(amount: number): Promise<void> {
    try {
      console.log(`💸 Processing developer fee: ${amount} sats to ${this.config.developerAddress}`)
      
      // Use Lightning Address for developer payment
      const developerLN = new LightningAddress(this.config.developerAddress)
      await developerLN.fetch()
      
      const invoice = await developerLN.requestInvoice({
        satoshi: amount,
        comment: 'BitComm Developer Revenue Share'
      })
      
      console.log(`✅ Developer revenue invoice created: ${amount} sats`)
    } catch (error) {
      console.error('❌ Developer payment failed:', error)
    }
  }
}

// Export singleton instance
export const bitcoinConnect = new BitcoinConnectService()
export default bitcoinConnect