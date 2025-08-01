// Enhanced Lightning Service using js-lightning-tools
// Provides robust Lightning Network functionality for BitComm
import { LightningAddress, Invoice, fiat } from '@getalby/lightning-tools'
import { bitcoinConnect } from './bitcoinConnectService'

export interface P2PPaymentRequest {
  fromUserId: string
  toUserId: string
  amount: number // in satoshis
  description: string
  messageId?: string
}

export interface PaywallConfig {
  amount: number // in satoshis
  description: string
  feature: string
  onPaid?: () => void
}

export interface InvoiceRequest {
  amount: number // in satoshis
  description: string
  expiry?: number // in seconds
  lightningAddress?: string
}

export interface PaymentResult {
  success: boolean
  preimage?: string
  paymentHash?: string
  invoice?: string
  error?: string
}

class LightningToolsService {
  private userConnections: Map<string, any> = new Map()
  private activeInvoices: Map<string, Invoice> = new Map()
  private developerAddress: string
  private developerShare: number = 10 // 10% developer revenue

  constructor() {
    this.developerAddress = process.env.VITE_DEVELOPER_BITCOIN_ADDRESS || 'excitementresourceful193152@getalby.com'
  }

  // Initialize connection for a user using their Lightning Address
  async initializeUserConnection(userId: string, lightningAddress?: string): Promise<boolean> {
    try {
      // Use Bitcoin Connect provider as primary connection
      const provider = await bitcoinConnect.getProvider()
      
      if (provider) {
        this.userConnections.set(userId, {
          provider,
          lightningAddress: lightningAddress || `${userId}@getalby.com`,
          connected: true
        })
        console.log(`✅ User ${userId} connected via Bitcoin Connect`)
        return true
      }
      
      return false
    } catch (error) {
      console.error(`❌ Failed to initialize connection for user ${userId}:`, error)
      return false
    }
  }

  // Enhanced P2P Payment using Lightning Address
  async processP2PPayment(request: P2PPaymentRequest): Promise<PaymentResult> {
    try {
      const senderConnection = this.userConnections.get(request.fromUserId)
      const recipientConnection = this.userConnections.get(request.toUserId)

      if (!senderConnection || !recipientConnection) {
        throw new Error('Both users must be connected')
      }

      // Step 1: Create Lightning Address for recipient
      const recipientLN = new LightningAddress(recipientConnection.lightningAddress)
      await recipientLN.fetch()

      // Step 2: Request invoice from recipient
      console.log(`💰 Creating invoice for ${request.amount} sats`)
      const invoice = await recipientLN.requestInvoice({
        satoshi: request.amount,
        comment: `BitComm P2P: ${request.description}`
      })

      if (!invoice.paymentRequest) {
        throw new Error('Failed to create invoice')
      }

      // Store invoice for verification
      this.activeInvoices.set(invoice.paymentHash, invoice)

      // Step 3: Pay invoice with sender's provider
      console.log(`⚡ Processing payment from ${request.fromUserId}`)
      const paymentResponse = await senderConnection.provider.sendPayment(invoice.paymentRequest)

      if (paymentResponse.preimage) {
        // Verify payment
        const verified = invoice.validatePreimage(paymentResponse.preimage)
        
        if (verified) {
          console.log(`✅ P2P payment verified: ${paymentResponse.preimage}`)
          
          // Record payment
          this.recordP2PPayment(request, paymentResponse.preimage, invoice.paymentHash)
          
          // Process developer revenue (10% to developer address)
          this.processDeveloperRevenue(request.amount).catch(console.error)
          
          return {
            success: true,
            preimage: paymentResponse.preimage,
            paymentHash: invoice.paymentHash,
            invoice: invoice.paymentRequest
          }
        }
      }

      throw new Error('Payment verification failed')
    } catch (error) {
      console.error('❌ P2P payment failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Create paywall using Lightning Address
  async createPaywall(config: PaywallConfig): Promise<{ invoice: string; verification: Promise<boolean> }> {
    try {
      // Create Lightning Address for developer
      const developerLN = new LightningAddress(this.developerAddress)
      await developerLN.fetch()

      // Request invoice for the feature
      const invoice = await developerLN.requestInvoice({
        satoshi: config.amount,
        comment: `BitComm ${config.feature}: ${config.description}`
      })

      if (!invoice.paymentRequest) {
        throw new Error('Failed to create paywall invoice')
      }

      // Store for verification
      this.activeInvoices.set(invoice.paymentHash, invoice)

      // Create verification promise
      const verification = this.createPaymentVerification(invoice, config.onPaid)

      console.log(`🎫 Paywall created for ${config.feature}: ${config.amount} sats`)

      return {
        invoice: invoice.paymentRequest,
        verification
      }
    } catch (error) {
      console.error('❌ Paywall creation failed:', error)
      throw error
    }
  }

  // Request invoice from Lightning Address
  async requestInvoice(userId: string, request: InvoiceRequest): Promise<string | null> {
    try {
      const userConnection = this.userConnections.get(userId)
      if (!userConnection) {
        throw new Error(`No connection for user ${userId}`)
      }

      const lightningAddr = request.lightningAddress || userConnection.lightningAddress
      const ln = new LightningAddress(lightningAddr)
      await ln.fetch()

      const invoice = await ln.requestInvoice({
        satoshi: request.amount,
        comment: request.description
      })

      if (invoice.paymentRequest) {
        this.activeInvoices.set(invoice.paymentHash, invoice)
        console.log(`📄 Invoice created for ${userId}: ${request.amount} sats`)
        return invoice.paymentRequest
      }

      throw new Error('Failed to create invoice')
    } catch (error) {
      console.error('❌ Invoice creation failed:', error)
      return null
    }
  }

  // Pay invoice using WebLN provider
  async payInvoice(userId: string, invoiceStr: string): Promise<PaymentResult> {
    try {
      const userConnection = this.userConnections.get(userId)
      if (!userConnection) {
        throw new Error(`No connection for user ${userId}`)
      }

      // Decode invoice for details
      const invoice = new Invoice({ pr: invoiceStr })
      
      // Pay using WebLN provider
      const response = await userConnection.provider.sendPayment(invoiceStr)
      
      if (response.preimage) {
        // Verify payment
        const verified = invoice.validatePreimage(response.preimage)
        
        if (verified) {
          console.log(`✅ Invoice paid by ${userId}: ${response.preimage}`)
          
          return {
            success: true,
            preimage: response.preimage,
            paymentHash: invoice.paymentHash,
            invoice: invoiceStr
          }
        }
      }

      throw new Error('Payment verification failed')
    } catch (error) {
      console.error('❌ Invoice payment failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Get fiat conversion for amount
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

  // Verify payment status of invoice
  async verifyPayment(paymentHash: string): Promise<boolean> {
    try {
      const invoice = this.activeInvoices.get(paymentHash)
      if (!invoice) {
        console.warn(`Invoice not found for hash: ${paymentHash}`)
        return false
      }

      // Check if payment is verified
      const paid = await invoice.verifyPayment()
      
      if (paid) {
        console.log(`✅ Payment verified for hash: ${paymentHash}`)
        return true
      }

      return false
    } catch (error) {
      console.error('❌ Payment verification failed:', error)
      return false
    }
  }

  // Check if user has connection
  hasConnection(userId: string): boolean {
    return this.userConnections.has(userId)
  }

  // Disconnect user
  disconnectUser(userId: string): void {
    this.userConnections.delete(userId)
    console.log(`🔌 User ${userId} disconnected`)
  }

  // Get payment history (same as before)
  getP2PPaymentHistory(userId: string): any[] {
    try {
      const payments = JSON.parse(localStorage.getItem('bitcomm_p2p_payments') || '[]')
      return payments.filter((p: any) => p.from === userId || p.to === userId)
    } catch (error) {
      console.error('Failed to get payment history:', error)
      return []
    }
  }

  // Private helper methods
  private async createPaymentVerification(invoice: Invoice, onPaid?: () => void): Promise<boolean> {
    return new Promise((resolve) => {
      // Poll for payment verification
      const checkInterval = setInterval(async () => {
        try {
          const paid = await invoice.verifyPayment()
          
          if (paid) {
            clearInterval(checkInterval)
            console.log(`✅ Payment verified: ${invoice.paymentHash}`)
            if (onPaid) onPaid()
            resolve(true)
          }
        } catch (error) {
          console.error('Payment check error:', error)
        }
      }, 2000) // Check every 2 seconds

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkInterval)
        resolve(false)
      }, 300000)
    })
  }

  private recordP2PPayment(request: P2PPaymentRequest, preimage: string, paymentHash: string): void {
    const payment = {
      from: request.fromUserId,
      to: request.toUserId,
      amount: request.amount,
      description: request.description,
      preimage,
      paymentHash,
      timestamp: Date.now(),
      messageId: request.messageId
    }

    const existing = JSON.parse(localStorage.getItem('bitcomm_p2p_payments') || '[]')
    existing.push(payment)
    localStorage.setItem('bitcomm_p2p_payments', JSON.stringify(existing))
    
    console.log('💾 P2P payment recorded:', payment)
  }

  private async processDeveloperRevenue(amount: number): Promise<void> {
    try {
      const developerFee = Math.floor(amount * (this.developerShare / 100))
      console.log(`💸 Processing developer revenue: ${developerFee} sats to ${this.developerAddress}`)
      
      // In production, this would send actual payment to developer address
      // For now, just log the transaction
      console.log(`✅ Developer revenue processed: ${developerFee} sats`)
    } catch (error) {
      console.error('❌ Developer revenue processing failed:', error)
    }
  }

  // Cleanup expired invoices
  cleanupExpiredInvoices(): void {
    const now = Date.now()
    const expiredThreshold = 10 * 60 * 1000 // 10 minutes

    for (const [hash, invoice] of this.activeInvoices.entries()) {
      // Check if invoice is expired based on creation time
      if (now - (invoice as any).createdDate > expiredThreshold) {
        this.activeInvoices.delete(hash)
      }
    }
  }
}

// Export singleton instance
export const lightningTools = new LightningToolsService()
export default lightningTools