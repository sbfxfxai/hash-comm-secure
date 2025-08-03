import { useToast } from '@/hooks/use-toast';

export interface PaymentResult {
  success: boolean;
  method: 'credits' | 'lightning_simple' | 'freemium' | 'none';
  error?: string;
  transactionId?: string;
  creditsRemaining?: number;
}

export interface UserCredits {
  balance: number;
  lastRefill: Date;
  totalSpent: number;
  subscriptionActive: boolean;
}

export class StreamlinedPaymentService {
  private static instance: StreamlinedPaymentService;
  private readonly MESSAGE_COST = 10; // sats
  private readonly CREDIT_PACKAGES = {
    small: { sats: 100, price: '$1' },
    medium: { sats: 500, price: '$5' },
    large: { sats: 1000, price: '$10' }
  };
  private readonly LIGHTNING_ADDRESS = 'payments@bitcomm.eth'; // Your Lightning address

  static getInstance(): StreamlinedPaymentService {
    if (!StreamlinedPaymentService.instance) {
      StreamlinedPaymentService.instance = new StreamlinedPaymentService();
    }
    return StreamlinedPaymentService.instance;
  }

  /**
   * Get user's current credit balance and payment status
   */
  getUserCredits(): UserCredits {
    const stored = localStorage.getItem('bitcomm-user-credits');
    const defaultCredits: UserCredits = {
      balance: 100, // Give new users 100 sats to start (10 messages)
      lastRefill: new Date(),
      totalSpent: 0,
      subscriptionActive: false
    };

    if (!stored) {
      this.saveUserCredits(defaultCredits);
      return defaultCredits;
    }

    const credits = JSON.parse(stored) as UserCredits;
    return credits;
  }

  /**
   * Save user credits to localStorage
   */
  private saveUserCredits(credits: UserCredits): void {
    localStorage.setItem('bitcomm-user-credits', JSON.stringify(credits));
  }

  /**
   * Process payment using the most frictionless method available
   */
  async processPayment(userAddress: string): Promise<PaymentResult> {
    const credits = this.getUserCredits();

    // 1. Try subscription if active
    if (credits.subscriptionActive) {
      return {
        success: true,
        method: 'freemium',
        transactionId: `sub-${Date.now()}`
      };
    }

    // 2. Try credits balance
    if (credits.balance >= this.MESSAGE_COST) {
      credits.balance -= this.MESSAGE_COST;
      credits.totalSpent += this.MESSAGE_COST;
      this.saveUserCredits(credits);

      return {
        success: true,
        method: 'credits',
        transactionId: `credit-${Date.now()}`,
        creditsRemaining: credits.balance
      };
    }

    // 3. Need to add credits
    return {
      success: false,
      method: 'none',
      error: 'insufficient_credits'
    };
  }

  /**
   * Generate Lightning address payment for credits
   */
  generateLightningAddressPayment(satAmount: number): {
    lightningAddress: string;
    amount: number;
    memo: string;
    qrCode: string;
  } {
    const memo = `BitComm Credits: ${satAmount} sats`;
    const lightningUrl = `lightning:${this.LIGHTNING_ADDRESS}?amount=${satAmount * 1000}&comment=${encodeURIComponent(memo)}`;
    
    return {
      lightningAddress: this.LIGHTNING_ADDRESS,
      amount: satAmount,
      memo,
      qrCode: lightningUrl
    };
  }

  /**
   * Add credits to user account (from simple Lightning payment)
   */
  async addCredits(amount: number, paymentMethod: 'lightning' | 'card' | 'gift'): Promise<boolean> {
    const credits = this.getUserCredits();
    credits.balance += amount;
    this.saveUserCredits(credits);
    return true;
  }

  /**
   * Generate simple Lightning invoice for credits
   */
  async generateLightningInvoice(satAmount: number): Promise<{ invoice: string; paymentHash: string }> {
    // This would integrate with a simple Lightning service like OpenNode, Strike, or Wallet of Satoshi
    // For demo purposes, we'll simulate this
    const mockInvoice = `lnbc${satAmount}n1p0example...`; // Mock invoice
    const mockHash = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      invoice: mockInvoice,
      paymentHash: mockHash
    };
  }

  /**
   * Check if Lightning payment was completed
   */
  async checkPaymentStatus(paymentHash: string): Promise<boolean> {
    // This would check with the Lightning service
    // For demo, simulate payment after 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));
    return Math.random() > 0.2; // 80% success rate for demo
  }

  /**
   * Get payment summary for UI
   */
  getPaymentSummary(): {
    creditsBalance: number;
    messagesRemaining: number;
    totalSpent: number;
    subscriptionActive: boolean;
    lightningAddress: string;
  } {
    const credits = this.getUserCredits();

    return {
      creditsBalance: credits.balance,
      messagesRemaining: Math.floor(credits.balance / this.MESSAGE_COST),
      totalSpent: credits.totalSpent,
      subscriptionActive: credits.subscriptionActive,
      lightningAddress: this.LIGHTNING_ADDRESS
    };
  }

  /**
   * Activate premium subscription
   */
  async activateSubscription(plan: 'monthly' | 'yearly'): Promise<boolean> {
    const credits = this.getUserCredits();
    credits.subscriptionActive = true;
    this.saveUserCredits(credits);
    return true;
  }

  /**
   * Gift credits (promotional)
   */
  giftCredits(amount: number, reason: string): void {
    const credits = this.getUserCredits();
    credits.balance += amount;
    this.saveUserCredits(credits);
  }

  /**
   * Get credit packages for purchase
   */
  getCreditPackages() {
    return this.CREDIT_PACKAGES;
  }
}

// Export singleton instance
export const streamlinedPayments = StreamlinedPaymentService.getInstance();
