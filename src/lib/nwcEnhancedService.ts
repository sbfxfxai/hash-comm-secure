// Enhanced NWC Service for BitComm P2P Payments
// Integrates with Bitcoin Connect for advanced Lightning Network features
import { bitcoinConnect } from './bitcoinConnectService'

// We'll use the existing Bitcoin Connect infrastructure instead of direct NWC
// This provides better compatibility and user experience

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
}

class NWCEnhancedService {
  private nwcClients: Map<string, any> = new Map()
  private activeInvoices: Map<string, any> = new Map()

  // Initialize user connection via Bitcoin Connect
  async initializeUserConnection(userId: string): Promise<boolean> {
    try {
      // Use Bitcoin Connect to get WebLN provider
      const provider = await bitcoinConnect.getProvider()
      
      if (provider) {
        console.log(`✅ User ${userId} connected via Bitcoin Connect`)
        this.nwcClients.set(userId, provider)
        return true
      }
      
      return false
    } catch (error) {
      console.error(`❌ Failed to initialize connection for user ${userId}:`, error)
      return false
    }
  }

  // P2P Payment: Request invoice from recipient, pay from sender
  async processP2PPayment(request: P2PPaymentRequest): Promise<{ success: boolean; error?: string }> {
    try {
      const recipientClient = this.nwcClients.get(request.toUserId)
      const senderClient = this.nwcClients.get(request.fromUserId)

      if (!recipientClient || !senderClient) {
        throw new Error('Both users must have NWC connections')
      }

      // Step 1: Request invoice from recipient
      console.log(`💰 Creating invoice for ${request.amount} sats from ${request.toUserId}`)
      const invoiceResponse = await recipientClient.makeInvoice({
        amount: request.amount * 1000, // Convert sats to millisats
        description: `BitComm P2P: ${request.description}`,
        expiry: 300, // 5 minutes
      })

      if (!invoiceResponse.invoice) {
        throw new Error('Failed to create invoice')
      }

      // Step 2: Pay invoice with sender's wallet
      console.log(`⚡ Paying invoice from ${request.fromUserId} to ${request.toUserId}`)
      const paymentResponse = await senderClient.payInvoice({
        invoice: invoiceResponse.invoice,
      })

      if (paymentResponse.preimage) {
        console.log(`✅ P2P payment successful: ${paymentResponse.preimage}`)
        
        // Store payment record for chat history
        this.recordP2PPayment(request, paymentResponse.preimage)
        
        return { success: true }
      }

      throw new Error('Payment failed')
    } catch (error) {
      console.error('❌ P2P payment failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Create paywall for premium features
  async createPaywall(config: PaywallConfig): Promise<{ invoice: string; onPaid: Promise<void> }> {
    try {
      // Use existing Bitcoin Connect for payment processing
      const result = await bitcoinConnect.processFeaturePayment(config.feature, config.amount)
      
      if (result.success) {
        const onPaid = new Promise<void>((resolve) => {
          console.log(`✅ Paywall payment received for ${config.feature}`)
          if (config.onPaid) config.onPaid()
          resolve()
        })

        return { 
          invoice: `demo_invoice_${config.amount}_${Date.now()}`,
          onPaid 
        }
      }
      
      throw new Error('Failed to create paywall')
    } catch (error) {
      console.error('❌ Paywall creation failed:', error)
      throw error
    }
  }

  // Request invoice from user's connected wallet
  async requestInvoice(userId: string, request: InvoiceRequest): Promise<string | null> {
    try {
      const provider = this.nwcClients.get(userId)
      if (!provider) {
        throw new Error(`No connection for user ${userId}`)
      }

      // Generate demo invoice for now
      const demoInvoice = `lnbc${request.amount * 1000}1demo${request.description.replace(/\s+/g, '').toLowerCase()}`
      const paymentHash = `hash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      this.activeInvoices.set(paymentHash, {
        userId,
        amount: request.amount,
        description: request.description,
        created: Date.now(),
        invoice: demoInvoice
      })
      
      console.log(`📄 Invoice created for ${userId}: ${request.amount} sats`)
      return demoInvoice

      throw new Error('Failed to create invoice')
    } catch (error) {
      console.error('❌ Invoice creation failed:', error)
      return null
    }
  }

  // Pay invoice using user's wallet
  async payInvoice(userId: string, invoice: string): Promise<{ success: boolean; preimage?: string; error?: string }> {
    try {
      const client = this.nwcClients.get(userId)
      if (!client) {
        throw new Error(`No NWC connection for user ${userId}`)
      }

      const response = await client.payInvoice({ invoice })
      
      if (response.preimage) {
        console.log(`✅ Invoice paid by ${userId}: ${response.preimage}`)
        return { success: true, preimage: response.preimage }
      }

      throw new Error('Payment failed')
    } catch (error) {
      console.error('❌ Invoice payment failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Get user's wallet balance (if permission granted)
  async getUserBalance(userId: string): Promise<number | null> {
    try {
      const client = this.nwcClients.get(userId)
      if (!client) return null

      const response = await client.getBalance()
      return Math.floor(response.balance / 1000) // Convert millisats to sats
    } catch (error) {
      console.error('❌ Failed to get balance:', error)
      return null
    }
  }

  // Check if user has NWC connection
  hasNWCConnection(userId: string): boolean {
    return this.nwcClients.has(userId)
  }

  // Disconnect user's NWC
  disconnectUserNWC(userId: string): void {
    const client = this.nwcClients.get(userId)
    if (client) {
      try {
        client.close()
      } catch (error) {
        console.error('Error closing NWC client:', error)
      }
      this.nwcClients.delete(userId)
      console.log(`🔌 NWC disconnected for user ${userId}`)
    }
  }

  // Private helper to record P2P payments
  private recordP2PPayment(request: P2PPaymentRequest, preimage: string): void {
    const payment = {
      from: request.fromUserId,
      to: request.toUserId,
      amount: request.amount,
      description: request.description,
      preimage,
      timestamp: Date.now(),
      messageId: request.messageId
    }

    // Store in localStorage for demo (in production, use proper database)
    const existing = JSON.parse(localStorage.getItem('bitcomm_p2p_payments') || '[]')
    existing.push(payment)
    localStorage.setItem('bitcomm_p2p_payments', JSON.stringify(existing))
    
    console.log('💾 P2P payment recorded:', payment)
  }

  // Get P2P payment history
  getP2PPaymentHistory(userId: string): any[] {
    try {
      const payments = JSON.parse(localStorage.getItem('bitcomm_p2p_payments') || '[]')
      return payments.filter((p: any) => p.from === userId || p.to === userId)
    } catch (error) {
      console.error('Failed to get payment history:', error)
      return []
    }
  }

  // Clean up expired invoices
  cleanupExpiredInvoices(): void {
    const now = Date.now()
    const expiredThreshold = 5 * 60 * 1000 // 5 minutes

    for (const [hash, invoice] of this.activeInvoices.entries()) {
      if (now - invoice.created > expiredThreshold) {
        this.activeInvoices.delete(hash)
      }
    }
  }
}

// Export singleton instance
export const nwcService = new NWCEnhancedService()
export default nwcService