// Decentralized Subscription Service - Bitcoin Lightning Only
import { BitcoinPaymentService } from './bitcoinPaymentService'

// Create instance
const bitcoinPayments = BitcoinPaymentService.getInstance()

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_sats: number;
  price_usd: number;
  tier: 'basic' | 'professional' | 'enterprise';
  popular?: boolean;
  monthlyPrice?: number;
  features: string[];
  billing_interval: 'monthly' | 'yearly';
  max_identities: number;
  storage_gb: number;
  priority_support: boolean;
  verification_included: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  lightning_payment_hash?: string;
  created_at: string;
  expires_at: string;
  auto_renew: boolean;
}

export interface PricingTier {
  name: string;
  price_sats: number;
  description: string;
}

export class SubscriptionService {
  
  // Get available subscription plans
  static getSubscriptionPlans(): SubscriptionPlan[] {
    const plans: SubscriptionPlan[] = [
      {
        id: 'basic',
        name: 'Basic',
        tier: 'basic',
        popular: false,
        description: 'Essential decentralized identity features',
        price_sats: 10000, // ~$4 at current rates
        price_usd: 4,
        monthlyPrice: 4,
        features: [
          '1 Premium Identity',
          '1GB Decentralized Storage',
          'Basic P2P Messaging',
          'Standard Support'
        ],
        billing_interval: 'monthly',
        max_identities: 1,
        storage_gb: 1,
        priority_support: false,
        verification_included: false
      },
      {
        id: 'professional',
        name: 'Professional',
        tier: 'professional',
        popular: true,
        description: 'Advanced features for power users',
        price_sats: 25000, // ~$10 at current rates
        price_usd: 10,
        monthlyPrice: 10,
        features: [
          '5 Premium Identities',
          '10GB Decentralized Storage',
          'Advanced P2P Messaging',
          'Identity Verification',
          'Priority Support'
        ],
        billing_interval: 'monthly',
        max_identities: 5,
        storage_gb: 10,
        priority_support: true,
        verification_included: true
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        tier: 'enterprise',
        popular: false,
        description: 'Full-featured plan for organizations',
        price_sats: 100000, // ~$40 at current rates
        price_usd: 40,
        monthlyPrice: 40,
        features: [
          'Unlimited Premium Identities',
          '100GB Decentralized Storage',
          'Enterprise P2P Messaging',
          'Advanced Identity Verification',
          'Admin Dashboard',
          'Compliance Reports',
          '24/7 Priority Support'
        ],
        billing_interval: 'monthly',
        max_identities: -1, // unlimited
        storage_gb: 100,
        priority_support: true,
        verification_included: true
      }
    ]
    return plans
  }

  // Export constant for compatibility
  static get SUBSCRIPTION_PLANS() {
    return this.getSubscriptionPlans()
  }

  // Get Bitcoin pricing tiers
  static getBitcoinPricingTiers(): PricingTier[] {
    // Return local pricing instead of Bitcoin service
    return [
      { name: 'Basic', price_sats: 10000, description: 'Basic plan' },
      { name: 'Professional', price_sats: 25000, description: 'Professional plan' },
      { name: 'Enterprise', price_sats: 100000, description: 'Enterprise plan' }
    ]
  }

  // Create subscription with Bitcoin payment
  static async createSubscription(
    userId: string, 
    planId: string
  ): Promise<{ success: boolean; subscription?: Subscription; invoice?: any }> {
    try {
      const plan = this.getSubscriptionPlans().find(p => p.id === planId)
      if (!plan) {
        throw new Error('Plan not found')
      }

      // Generate demo invoice for decentralized mode
      const invoiceResult = {
        payment_request: `lnbc${plan.price_sats}1demo`,
        payment_hash: 'demo_hash_' + Date.now(),
        success: true
      }

      const subscription: Subscription = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        plan_id: planId,
        status: 'inactive', // becomes active after payment
        lightning_payment_hash: invoiceResult.payment_request,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          auto_renew: true
        }

      // Store subscription locally
      this.storeSubscription(subscription)

      return { 
        success: true, 
        subscription, 
        invoice: invoiceResult 
      }
    } catch (error) {
      console.error('Failed to create subscription:', error)
      return { success: false }
    }
  }

  // Get user subscription
  static async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      const subscriptions = this.getStoredSubscriptions()
      return subscriptions.find(sub => sub.user_id === userId) || null
    } catch (error) {
      console.error('Failed to get user subscription:', error)
      return null
    }
  }

  // Update subscription
  static async updateSubscription(
    subscriptionId: string, 
    updates: Partial<Subscription>
  ): Promise<boolean> {
    try {
      const subscriptions = this.getStoredSubscriptions()
      const index = subscriptions.findIndex(sub => sub.id === subscriptionId)
      
      if (index !== -1) {
        subscriptions[index] = { ...subscriptions[index], ...updates }
        localStorage.setItem('subscriptions', JSON.stringify(subscriptions))
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error updating subscription:', error)
      return false
    }
  }

  // Cancel subscription
  static async cancelSubscription(subscriptionId: string): Promise<boolean> {
    return this.updateSubscription(subscriptionId, { 
      status: 'cancelled',
      auto_renew: false
    })
  }

  // Check if user has active subscription
  static async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId)
    return subscription?.status === 'active' && new Date(subscription.expires_at) > new Date()
  }

  // Get subscription analytics
  static async getSubscriptionAnalytics(): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    revenue: { sats: number; usd: number };
    popularPlan: string;
  }> {
    const subscriptions = this.getStoredSubscriptions()
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active')
    
    return {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: activeSubscriptions.length,
      revenue: { sats: 0, usd: 0 }, // Would calculate from payments
      popularPlan: 'professional'
    }
  }

  // Private helper methods
  private static storeSubscription(subscription: Subscription): void {
    try {
      const subscriptions = this.getStoredSubscriptions()
      subscriptions.push(subscription)
      localStorage.setItem('subscriptions', JSON.stringify(subscriptions))
    } catch (error) {
      console.error('Failed to store subscription:', error)
    }
  }

  private static getStoredSubscriptions(): Subscription[] {
    try {
      const stored = localStorage.getItem('subscriptions')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to get stored subscriptions:', error)
      return []
    }
  }
}

// Export the plans as a constant for compatibility
export const SUBSCRIPTION_PLANS = SubscriptionService.getSubscriptionPlans()