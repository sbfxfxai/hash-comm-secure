import { init, launchModal, launchPaymentModal, requestProvider } from '@getalby/bitcoin-connect';

export interface BitcoinConnectConfig {
  appName: string;
  developerAddress: string;
  developerSharePercentage: number;
}

export interface PaymentRequest {
  amount: number; // Amount in satoshis
  description: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  preimage?: string;
  error?: string;
  developerShare?: number;
  userAmount?: number;
}

export class BitcoinConnectService {
  private static instance: BitcoinConnectService;
  private isInitialized = false;
  private config: BitcoinConnectConfig;
  private webln: any = null;

  private constructor() {
    this.config = {
      appName: 'BitComm',
      developerAddress: import.meta.env.VITE_DEVELOPER_BITCOIN_ADDRESS || 'excitementresourceful193152@getalby.com',
      developerSharePercentage: parseFloat(import.meta.env.VITE_DEVELOPER_SHARE_PERCENTAGE || '0.1')
    };
  }

  public static getInstance(): BitcoinConnectService {
    if (!BitcoinConnectService.instance) {
      BitcoinConnectService.instance = new BitcoinConnectService();
    }
    return BitcoinConnectService.instance;
  }

  /**
   * Initialize Bitcoin Connect
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await init({
        appName: this.config.appName,
        filters: ['webln'],
        showBalance: true,
        showOnboarding: true
      });
      
      this.isInitialized = true;
      console.log('Bitcoin Connect initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Bitcoin Connect:', error);
      throw new Error('Bitcoin Connect initialization failed');
    }
  }

  /**
   * Launch wallet connection modal
   */
  public async connectWallet(): Promise<boolean> {
    try {
      await this.initialize();
      await launchModal();
      
      // Get WebLN provider after connection
      this.webln = await requestProvider();
      return !!this.webln;
    } catch (error) {
      console.error('Wallet connection failed:', error);
      return false;
    }
  }

  /**
   * Check if wallet is connected
   */
  public async isWalletConnected(): Promise<boolean> {
    try {
      if (!this.webln) {
        this.webln = await requestProvider();
      }
      return !!this.webln;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get wallet info
   */
  public async getWalletInfo(): Promise<any> {
    try {
      if (!this.webln) {
        this.webln = await requestProvider();
      }
      
      if (this.webln && this.webln.getInfo) {
        return await this.webln.getInfo();
      }
      return null;
    } catch (error) {
      console.error('Failed to get wallet info:', error);
      return null;
    }
  }

  /**
   * Calculate payment amounts including developer share
   */
  private calculatePaymentAmounts(baseAmount: number): { userAmount: number; developerShare: number; totalAmount: number } {
    const developerShare = Math.floor(baseAmount * this.config.developerSharePercentage);
    const userAmount = baseAmount;
    const totalAmount = userAmount + developerShare;
    
    return { userAmount, developerShare, totalAmount };
  }

  /**
   * Process payment with developer revenue sharing
   */
  public async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      if (!this.webln) {
        this.webln = await requestProvider();
      }

      if (!this.webln) {
        throw new Error('No wallet connected');
      }

      const { userAmount, developerShare, totalAmount } = this.calculatePaymentAmounts(request.amount);

      // Create invoice for the main payment
      const invoice = await this.createInvoice({
        amount: userAmount,
        description: request.description,
        metadata: request.metadata
      });

      if (!invoice) {
        throw new Error('Failed to create payment invoice');
      }

      // Send main payment
      const mainPayment = await this.webln.sendPayment(invoice);
      
      if (!mainPayment || !mainPayment.preimage) {
        throw new Error('Main payment failed');
      }

      // Send developer share if configured
      let developerPaymentSuccess = true;
      if (developerShare > 0 && this.config.developerAddress) {
        try {
          await this.sendDeveloperShare(developerShare, `BitComm Developer Share - ${request.description}`);
        } catch (error) {
          console.warn('Developer share payment failed:', error);
          developerPaymentSuccess = false;
        }
      }

      return {
        success: true,
        preimage: mainPayment.preimage,
        developerShare: developerPaymentSuccess ? developerShare : 0,
        userAmount
      };

    } catch (error) {
      console.error('Payment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed'
      };
    }
  }

  /**
   * Launch payment modal for seamless UX
   */
  public async launchPaymentModal(request: PaymentRequest): Promise<PaymentResult> {
    try {
      await this.initialize();
      
      const { userAmount, developerShare } = this.calculatePaymentAmounts(request.amount);
      
      // Use Bitcoin Connect's payment modal
      const result = await launchPaymentModal({
        invoice: await this.createInvoice({
          amount: userAmount,
          description: request.description
        }),
        showBalance: true,
        showOnboarding: true
      });

      if (result && result.preimage) {
        // Send developer share after successful payment
        if (developerShare > 0 && this.config.developerAddress) {
          try {
            await this.sendDeveloperShare(developerShare, `BitComm Developer Share - ${request.description}`);
          } catch (error) {
            console.warn('Developer share payment failed:', error);
          }
        }

        return {
          success: true,
          preimage: result.preimage,
          developerShare,
          userAmount
        };
      }

      return {
        success: false,
        error: 'Payment was cancelled or failed'
      };

    } catch (error) {
      console.error('Payment modal failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed'
      };
    }
  }

  /**
   * Create Lightning invoice (mock implementation - replace with your backend)
   */
  private async createInvoice(request: PaymentRequest): Promise<string | null> {
    try {
      // This should integrate with your Lightning node or payment processor
      // For now, we'll use a mock invoice for demonstration
      
      // In production, you would:
      // 1. Call your backend API to create a Lightning invoice
      // 2. Return the payment request (bolt11 invoice)
      
      console.log('Creating invoice for:', request);
      
      // Mock invoice - replace with real implementation
      return 'lnbc' + request.amount + 'n1p' + Math.random().toString(36).substring(7);
      
    } catch (error) {
      console.error('Failed to create invoice:', error);
      return null;
    }
  }

  /**
   * Send developer revenue share
   */
  private async sendDeveloperShare(amount: number, description: string): Promise<void> {
    try {
      if (!this.webln || !this.config.developerAddress) {
        throw new Error('No wallet or developer address configured');
      }

      // Create Lightning address payment
      const response = await fetch(`https://api.getalby.com/lightning/address/${this.config.developerAddress}/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amount,
          comment: description
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create developer share invoice');
      }

      const invoiceData = await response.json();
      
      if (invoiceData.invoice) {
        await this.webln.sendPayment(invoiceData.invoice);
        console.log(`Developer share of ${amount} sats sent successfully`);
      }

    } catch (error) {
      console.error('Developer share payment failed:', error);
      throw error;
    }
  }

  /**
   * Get payment history (if supported by wallet)
   */
  public async getPaymentHistory(): Promise<any[]> {
    try {
      if (!this.webln) {
        this.webln = await requestProvider();
      }

      if (this.webln && this.webln.listTransactions) {
        return await this.webln.listTransactions();
      }

      return [];
    } catch (error) {
      console.error('Failed to get payment history:', error);
      return [];
    }
  }

  /**
   * Sign message with wallet
   */
  public async signMessage(message: string): Promise<string | null> {
    try {
      if (!this.webln) {
        this.webln = await requestProvider();
      }

      if (this.webln && this.webln.signMessage) {
        const result = await this.webln.signMessage(message);
        return result.signature;
      }

      return null;
    } catch (error) {
      console.error('Failed to sign message:', error);
      return null;
    }
  }

  /**
   * Disconnect wallet
   */
  public async disconnect(): Promise<void> {
    try {
      this.webln = null;
      // Bitcoin Connect doesn't have a direct disconnect method
      // The user needs to disconnect from their wallet interface
      console.log('Wallet connection cleared');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  }
}

export default BitcoinConnectService;
