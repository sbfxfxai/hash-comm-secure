// Bitcoin Lightning Network payments for decentralized monetization

export interface BitcoinPayment {
  invoice: string
  amount: number // satoshis
  description: string
  preimage?: string
  settled: boolean
}

export class BitcoinPaymentService {
  private static instance: BitcoinPaymentService
  private isConnected = false

  static getInstance(): BitcoinPaymentService {
    if (!this.instance) {
      this.instance = new BitcoinPaymentService()
    }
    return this.instance
  }

  async connectWallet(): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && window.webln) {
        await window.webln.enable()
        this.isConnected = true
        console.log('⚡ Lightning wallet connected')
        return true
      }
      
      // Fallback to other Lightning wallets
      console.log('💡 No WebLN wallet detected. Please install Alby, Zeus, or similar.')
      return false
    } catch (error) {
      console.error('Failed to connect Lightning wallet:', error)
      return false
    }
  }

  // Developer earns sats per transaction/feature usage
  async createPaymentRequest(params: {
    amountSats: number
    description: string
    developerShare?: number // percentage to developer
  }): Promise<string | null> {
    try {
      if (!this.isConnected) {
        await this.connectWallet()
      }

      // For now, we'll use a simple invoice generation
      // In production, integrate with BTCPay Server or similar
      const invoice = await this.generateInvoice(params.amountSats, params.description)
      
      return invoice
    } catch (error) {
      console.error('Failed to create payment request:', error)
      return null
    }
  }

  private async generateInvoice(amountSats: number, description: string): Promise<string> {
    // This would integrate with your Lightning node or BTCPay Server
    // For demo purposes, return a mock invoice
    return `lnbc${amountSats}1ps...mock_invoice`
  }

  async payInvoice(invoice: string): Promise<boolean> {
    try {
      if (!this.isConnected || !window.webln) {
        throw new Error('Lightning wallet not connected')
      }

      const result = await window.webln.sendPayment(invoice)
      console.log('⚡ Payment successful:', result.preimage)
      return true
    } catch (error) {
      console.error('Payment failed:', error)
      return false
    }
  }

  // Pricing for different features (in satoshis)
  static getPricing() {
    return {
      messageComposition: 10, // 10 sats per message
      identityCreation: 1000, // 1000 sats per identity  
      verification: 10000, // 10,000 sats for verification
      premiumFeatures: 5000, // 5000 sats/month for premium
      developerShare: 0.1 // 10% to developer
    }
  }
}

// WebLN type declarations
declare global {
  interface Window {
    webln?: {
      enable(): Promise<void>
      sendPayment(invoice: string): Promise<{ preimage: string }>
      makeInvoice(args: { amount: number; defaultMemo?: string }): Promise<{ paymentRequest: string }>
    }
  }
}

export const bitcoinPayments = BitcoinPaymentService.getInstance()