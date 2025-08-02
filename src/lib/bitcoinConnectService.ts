// Bitcoin Connect Service for BitComm - Enhanced with modern NWC patterns
// Implements 1-click wallet connections with HTTP + Nostr flows
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
import { nwcConnectionManager, type WalletConnection } from './nwc/connection-manager'
import { clientSecretManager } from './nwc/client-secret'

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
  private nwcConnection: WalletConnection | null = null

  constructor() {
    this.config = {
      appName: 'BitComm - Decentralized Communication',
      developerShare: 10, // 10% developer revenue
      developerAddress: process.env.VITE_DEVELOPER_BITCOIN_ADDRESS || 'excitementresourceful193152@getalby.com'
    }
  }

  // Initialize Bitcoin Connect with modern NWC support
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Initialize NWC connection manager
      await nwcConnectionManager.initialize()
      
      // Initialize Bitcoin Connect with NWC focus
      init({
        appName: this.config.appName,
        showBalance: true,
        filters: ['nwc'], // Focus on NWC connections for modern flow
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
        this.nwcConnection = null
        console.log('🔌 Bitcoin wallet disconnected')
        
        // Clear global WebLN
        if (typeof window !== 'undefined') {
          delete window.webln
        }
      })

      // Load existing NWC connection
      this.nwcConnection = nwcConnectionManager.getActiveConnection()

      this.isInitialized = true
      console.log('🚀 Bitcoin Connect initialized with modern NWC support')
    } catch (error) {
      console.error('❌ Failed to initialize Bitcoin Connect:', error)
      throw error
    }
  }

  // Get WebLN provider with NWC fallback
  async getProvider(): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      // First try existing provider
      if (this.currentProvider) {
        return this.currentProvider
      }

      // Check for active NWC connection
      if (this.nwcConnection) {
        console.log('✅ Using active NWC connection')
        return this.createNWCProvider()
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

  // Launch modern NWC connection modal
  async launchConnectionModal(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
    
    // Try modern NWC connection first
    try {
      const result = await nwcConnectionManager.connect()
      if (result.success && result.connection) {
        this.nwcConnection = result.connection
        console.log('✅ NWC connection established')
        return
      }
    } catch (error) {
      console.warn('NWC connection failed, falling back to Bitcoin Connect modal:', error)
    }
    
    // Fallback to traditional Bitcoin Connect modal
    launchModal()
  }

  // Enhanced payment processing with modern NWC patterns
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      // Calculate developer fee
      const developerFee = Math.floor(request.amount * (this.config.developerShare / 100))
      const userAmount = request.amount - developerFee

      console.log(`💰 Processing payment: ${request.amount} sats (User: ${userAmount}, Dev: ${developerFee})`)

      // Try NWC connection first for modern flow
      if (this.nwcConnection) {
        try {
          // Use Lightning Address for invoice generation
          const ln = new LightningAddress(this.config.developerAddress)
          await ln.fetch()
          
          const invoice = await ln.requestInvoice({
            satoshi: userAmount,
            comment: request.description
          })

          if (invoice.paymentRequest) {
            // Send payment via NWC
            const nwcResult = await nwcConnectionManager.sendPayment(invoice.paymentRequest)
            
            if (nwcResult.success && nwcResult.preimage) {
              // Verify payment
              const verified = invoice.validatePreimage(nwcResult.preimage)
              
              if (verified) {
                // Process developer payment asynchronously
                this.processDeveloperPayment(developerFee).catch(console.error)
                
                return {
                  success: true,
                  preimage: nwcResult.preimage,
                  developerPayment: true
                }
              }
            }
          }
        } catch (nwcError) {
          console.warn('NWC payment failed, falling back to traditional flow:', nwcError)
        }
      }

      // Fallback to traditional Bitcoin Connect flow
      const provider = await this.getProvider()
      
      const ln = new LightningAddress(this.config.developerAddress)
      await ln.fetch()
      
      const invoice = await ln.requestInvoice({
        satoshi: userAmount,
        comment: request.description
      })

      if (invoice.paymentRequest) {
        const response = await provider.sendPayment(invoice.paymentRequest)
        
        if (response.preimage) {
          const verified = invoice.validatePreimage(response.preimage)
          
          if (verified) {
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

  // Check if wallet is connected (NWC or traditional)
  isConnected(): boolean {
    return this.currentProvider !== null || this.nwcConnection !== null
  }

  // Disconnect wallet (both NWC and traditional)
  async disconnectWallet(): Promise<void> {
    try {
      // Disconnect NWC connection
      if (this.nwcConnection) {
        nwcConnectionManager.disconnect()
        this.nwcConnection = null
      }
      
      // Disconnect traditional connection
      if (this.currentProvider) {
        disconnect()
        this.currentProvider = null
      }
      
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
  private createNWCProvider(): any {
    // Create a WebLN-compatible provider for NWC connections
    return {
      sendPayment: async (invoice: string) => {
        const result = await nwcConnectionManager.sendPayment(invoice)
        if (result.success) {
          return { preimage: result.preimage }
        }
        throw new Error(result.error || 'Payment failed')
      },
      getInfo: async () => {
        return {
          alias: this.nwcConnection?.name || 'NWC Wallet',
          node: {
            alias: this.nwcConnection?.name || 'NWC Wallet'
          }
        }
      },
      getBalance: async () => {
        const result = await nwcConnectionManager.getBalance()
        return { balance: result.balance || 0 }
      }
    }
  }

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