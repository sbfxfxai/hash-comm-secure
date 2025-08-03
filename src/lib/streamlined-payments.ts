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
  freeMessagesRemaining: number;
  subscriptionActive: boolean;
}

export class StreamlinedPaymentService {
  private static instance: StreamlinedPaymentService;
  private readonly MESSAGE_COST = 10; // sats
  private readonly FREE_MESSAGES_PER_DAY = 5;
  private readonly CREDIT_REFILL_AMOUNT = 100; // sats worth of credits

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
      balance: 0,
      lastRefill: new Date(),
      totalSpent: 0,
      freeMessagesRemaining: this.FREE_MESSAGES_PER_DAY,
      subscriptionActive: false
    };

    if (!stored) {
      this.saveUserCredits(defaultCredits);
      return defaultCredits;
    }

    const credits = JSON.parse(stored) as UserCredits;
    
    // Reset free messages daily
    const lastRefill = new Date(credits.lastRefill);
    const now = new Date();
    if (now.getDate() !== lastRefill.getDate() || now.getMonth() !== lastRefill.getMonth()) {
      credits.freeMessagesRemaining = this.FREE_MESSAGES_PER_DAY;
      credits.lastRefill = now;
      this.saveUserCredits(credits);
    }

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

    // 1. Try freemium first (free messages)
    if (credits.freeMessagesRemaining > 0) {
      credits.freeMessagesRemaining--;
      this.saveUserCredits(credits);
      
      return {
        success: true,
        method: 'freemium',
        transactionId: `free-${Date.now()}`,
        creditsRemaining: credits.freeMessagesRemaining
      };
    }

    // 2. Try subscription if active
    if (credits.subscriptionActive) {
      return {
        success: true,
        method: 'freemium',
        transactionId: `sub-${Date.now()}`
      };
    }

    // 3. Try credits balance
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

    // 4. Show payment options modal (simplified)
    return this.showPaymentOptions();
  }

  /**
   * Show simplified payment options without complex wallet connections
   */
  private async showPaymentOptions(): Promise<PaymentResult> {
    // For now, return a failure that triggers the payment modal
    return {
      success: false,
      method: 'none',
      error: 'payment_required'
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
    freeMessagesLeft: number;
    creditsBalance: number;
    totalSpent: number;
    subscriptionActive: boolean;
    nextFreeRefill: Date;
  } {
    const credits = this.getUserCredits();
    const nextRefill = new Date();
    nextRefill.setDate(nextRefill.getDate() + 1);
    nextRefill.setHours(0, 0, 0, 0);

    return {
      freeMessagesLeft: credits.freeMessagesRemaining,
      creditsBalance: credits.balance,
      totalSpent: credits.totalSpent,
      subscriptionActive: credits.subscriptionActive,
      nextFreeRefill: nextRefill
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
   * Gift free credits (promotional)
   */
  giftCredits(amount: number, reason: string): void {
    const credits = this.getUserCredits();
    credits.balance += amount;
    this.saveUserCredits(credits);
  }
}

// Export singleton instance
export const streamlinedPayments = StreamlinedPaymentService.getInstance();
