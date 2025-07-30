import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SubscriptionService, SUBSCRIPTION_PLANS } from '../subscriptionService'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnValue({ data: null, error: null }),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
  },
}))

describe('SubscriptionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('SUBSCRIPTION_PLANS', () => {
    it('should have all subscription tiers', () => {
      const tiers = SUBSCRIPTION_PLANS.map(plan => plan.tier)
      expect(tiers).toContain('free')
      expect(tiers).toContain('premium')
      expect(tiers).toContain('business')
      expect(tiers).toContain('enterprise')
    })

    it('should have premium marked as popular', () => {
      const premiumPlan = SUBSCRIPTION_PLANS.find(plan => plan.tier === 'premium')
      expect(premiumPlan?.popular).toBe(true)
    })

    it('should have increasing prices from free to enterprise', () => {
      const plans = SUBSCRIPTION_PLANS
      expect(plans[0].monthlyPrice).toBe(0) // free
      expect(plans[1].monthlyPrice).toBeGreaterThan(plans[0].monthlyPrice) // premium > free
      expect(plans[2].monthlyPrice).toBeGreaterThan(plans[1].monthlyPrice) // business > premium
      expect(plans[3].monthlyPrice).toBeGreaterThan(plans[2].monthlyPrice) // enterprise > business
    })

    it('should have unlimited identities for enterprise', () => {
      const enterprisePlan = SUBSCRIPTION_PLANS.find(plan => plan.tier === 'enterprise')
      expect(enterprisePlan?.identityLimit).toBe(-1)
    })
  })

  describe('getSubscriptionPlan', () => {
    it('should return correct plan for each tier', () => {
      const freePlan = SubscriptionService.getSubscriptionPlan('free')
      expect(freePlan.tier).toBe('free')
      expect(freePlan.monthlyPrice).toBe(0)

      const premiumPlan = SubscriptionService.getSubscriptionPlan('premium')
      expect(premiumPlan.tier).toBe('premium')
      expect(premiumPlan.deviceSyncEnabled).toBe(true)
    })

    it('should return free plan for invalid tier', () => {
      const invalidPlan = SubscriptionService.getSubscriptionPlan('invalid' as never)
      expect(invalidPlan.tier).toBe('free')
    })
  })

  describe('Plan features', () => {
    it('should have device sync disabled for free tier', () => {
      const freePlan = SUBSCRIPTION_PLANS.find(plan => plan.tier === 'free')
      expect(freePlan?.deviceSyncEnabled).toBe(false)
    })

    it('should have device sync enabled for paid tiers', () => {
      const paidPlans = SUBSCRIPTION_PLANS.filter(plan => plan.tier !== 'free')
      paidPlans.forEach(plan => {
        expect(plan.deviceSyncEnabled).toBe(true)
      })
    })

    it('should have verification levels increasing with tier', () => {
      const freePlan = SUBSCRIPTION_PLANS.find(plan => plan.tier === 'free')
      const premiumPlan = SUBSCRIPTION_PLANS.find(plan => plan.tier === 'premium')
      const businessPlan = SUBSCRIPTION_PLANS.find(plan => plan.tier === 'business')
      const enterprisePlan = SUBSCRIPTION_PLANS.find(plan => plan.tier === 'enterprise')

      expect(freePlan?.verificationLevels).toHaveLength(0)
      expect(premiumPlan?.verificationLevels).toContain('basic')
      expect(businessPlan?.verificationLevels).toContain('domain')
      expect(enterprisePlan?.verificationLevels).toContain('enterprise')
    })
  })

  describe('Identity limits', () => {
    it('should have different identity limits for each tier', () => {
      const plans = SUBSCRIPTION_PLANS
      expect(plans[0].identityLimit).toBe(3) // free
      expect(plans[1].identityLimit).toBe(10) // premium
      expect(plans[2].identityLimit).toBe(50) // business
      expect(plans[3].identityLimit).toBe(-1) // enterprise (unlimited)
    })
  })

  describe('Feature lists', () => {
    it('should have incremental features', () => {
      const freePlan = SUBSCRIPTION_PLANS.find(plan => plan.tier === 'free')
      const premiumPlan = SUBSCRIPTION_PLANS.find(plan => plan.tier === 'premium')

      expect(freePlan?.features).toContain('Basic identity creation')
      expect(premiumPlan?.features).toContain('Everything in Free')
      expect(premiumPlan?.features).toContain('Verified identity badges')
    })

    it('should have enterprise-specific features', () => {
      const enterprisePlan = SUBSCRIPTION_PLANS.find(plan => plan.tier === 'enterprise')
      expect(enterprisePlan?.features).toContain('SLA guarantee')
      expect(enterprisePlan?.features).toContain('Dedicated support')
    })
  })
})
