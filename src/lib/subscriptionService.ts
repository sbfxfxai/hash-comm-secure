import { supabase } from './supabase'
import { UsageEventData } from '@/types/database'

export type SubscriptionTier = 'free' | 'premium' | 'business' | 'enterprise'
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due'

export interface Subscription {
  id: string
  user_id: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  stripe_customer_id?: string
  stripe_subscription_id?: string
  current_period_start?: string
  current_period_end?: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export interface SubscriptionPlan {
  tier: SubscriptionTier
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  features: string[]
  identityLimit: number
  deviceSyncEnabled: boolean
  verificationLevels: string[]
  support: string
  popular?: boolean
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    tier: 'free',
    name: 'Free',
    description: 'Perfect for personal use',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Basic identity creation',
      'Encrypted messaging',
      'Proof-of-work anti-spam',
      'P2P networking',
      'Local storage only'
    ],
    identityLimit: 3,
    deviceSyncEnabled: false,
    verificationLevels: [],
    support: 'Community'
  },
  {
    tier: 'premium',
    name: 'Premium',
    description: 'Enhanced features for power users',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    features: [
      'Everything in Free',
      'Verified identity badges',
      'Multi-device sync',
      'Cloud backup',
      'Advanced encryption',
      'Priority support'
    ],
    identityLimit: 10,
    deviceSyncEnabled: true,
    verificationLevels: ['basic'],
    support: 'Email',
    popular: true
  },
  {
    tier: 'business',
    name: 'Business',
    description: 'Professional features for teams',
    monthlyPrice: 29.99,
    yearlyPrice: 299.99,
    features: [
      'Everything in Premium',
      'Business verification',
      'Domain-linked identities',
      'Team management',
      'Compliance reporting',
      'API access'
    ],
    identityLimit: 50,
    deviceSyncEnabled: true,
    verificationLevels: ['basic', 'business', 'domain'],
    support: 'Priority Email'
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    description: 'Full-scale enterprise solution',
    monthlyPrice: 99.99,
    yearlyPrice: 999.99,
    features: [
      'Everything in Business',
      'Enterprise verification',
      'Custom deployment',
      'Advanced analytics',
      'Audit trails',
      'Dedicated support',
      'SLA guarantee'
    ],
    identityLimit: -1, // unlimited
    deviceSyncEnabled: true,
    verificationLevels: ['basic', 'business', 'domain', 'enterprise'],
    support: 'Dedicated Manager'
  }
]

export class SubscriptionService {
  
  // Get user's current subscription
  static async getUserSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching subscription:', error)
      return null
    }

    return data
  }

  // Create a new subscription
  static async createSubscription(params: {
    userId: string
    tier: SubscriptionTier
    stripeCustomerId?: string
    stripeSubscriptionId?: string
  }): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: params.userId,
        tier: params.tier,
        status: 'active',
        stripe_customer_id: params.stripeCustomerId,
        stripe_subscription_id: params.stripeSubscriptionId,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating subscription:', error)
      return null
    }

    return data
  }

  // Update subscription
  static async updateSubscription(
    subscriptionId: string, 
    updates: Partial<Subscription>
  ): Promise<boolean> {
    const { error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', subscriptionId)

    if (error) {
      console.error('Error updating subscription:', error)
      return false
    }

    return true
  }

  // Cancel subscription
  static async cancelSubscription(subscriptionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)

    if (error) {
      console.error('Error cancelling subscription:', error)
      return false
    }

    return true
  }

  // Get subscription plan details
  static getSubscriptionPlan(tier: SubscriptionTier): SubscriptionPlan {
    return SUBSCRIPTION_PLANS.find(plan => plan.tier === tier) || SUBSCRIPTION_PLANS[0]
  }

  // Check if user has access to a feature
  static async hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId)
    if (!subscription) return false

    const plan = this.getSubscriptionPlan(subscription.tier)
    return plan.features.some(f => f.toLowerCase().includes(feature.toLowerCase()))
  }

  // Check if user can create more identities
  static async canCreateIdentity(userId: string, currentCount: number): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId)
    if (!subscription) {
      // Free tier default
      return currentCount < SUBSCRIPTION_PLANS[0].identityLimit
    }

    const plan = this.getSubscriptionPlan(subscription.tier)
    return plan.identityLimit === -1 || currentCount < plan.identityLimit
  }

  // Get usage statistics
  static async getUsageStats(userId: string): Promise<{
    identityCount: number
    messagesThisMonth: number
    deviceCount: number
  }> {
    // Get identity count
    const { count: identityCount } = await supabase
      .from('premium_identities')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    // Get messages this month (from usage tracking)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: messagesThisMonth } = await supabase
      .from('usage_tracking')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('event_type', 'message_sent')
      .gte('timestamp', startOfMonth.toISOString())

    // Get device count
    const { data: identities } = await supabase
      .from('premium_identities')
      .select('id')
      .eq('user_id', userId)

    const identityIds = identities?.map(i => i.id) || []
    
    const { count: deviceCount } = await supabase
      .from('device_sync')
      .select('device_id', { count: 'exact' })
      .in('identity_id', identityIds)

    return {
      identityCount: identityCount || 0,
      messagesThisMonth: messagesThisMonth || 0,
      deviceCount: deviceCount || 0
    }
  }

  // Track usage event
  static async trackUsage(userId: string, eventType: string, eventData: UsageEventData = {}): Promise<void> {
    await supabase
      .from('usage_tracking')
      .insert({
        user_id: userId,
        event_type: eventType,
        event_data: eventData,
        timestamp: new Date().toISOString()
      })
  }

  // Get all subscriptions (admin only)
  static async getAllSubscriptions(page = 1, pageSize = 20): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        user_profiles!inner(full_name, avatar_url)
      `)
      .range((page - 1) * pageSize, page * pageSize - 1)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all subscriptions:', error)
      return []
    }

    return data || []
  }
}
