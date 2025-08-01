import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BitCommButton } from '@/components/ui/bitcomm-button'
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/lib/subscriptionService'
import { Check, Star, Zap } from 'lucide-react'

interface PricingCardProps {
  plan: SubscriptionPlan
  onSubscribe: (tier: SubscriptionPlan['tier']) => void
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, onSubscribe }) => (
  <Card className={`flex flex-col ${plan.popular ? 'border-bitcoin-orange' : ''}`}>
    {plan.popular && (
      <div className="bg-bitcoin-orange text-white text-xs font-bold uppercase tracking-wider text-center py-1 rounded-t-lg">
        Most Popular
      </div>
    )}
    <CardHeader className="text-center">
      <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
      <CardDescription>{plan.description}</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col flex-1 space-y-6">
      <div className="text-center">
        <span className="text-4xl font-bold">${plan.monthlyPrice}</span>
        <span className="text-muted-foreground">/month</span>
      </div>
      <ul className="space-y-3 flex-1">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <BitCommButton 
        onClick={() => onSubscribe(plan.tier)}
        className="w-full"
        variant={plan.popular ? 'hero' : 'default'}
      >
        {plan.tier === 'basic' ? 'Get Started' : 'Upgrade to ' + plan.name}
      </BitCommButton>
    </CardContent>
  </Card>
)

export const PricingPage = () => {
  const handleSubscribe = (tier: SubscriptionPlan['tier']) => {
    // In a real app, this would trigger the payment flow
    console.log(`Subscribing to ${tier} tier...`)
  }

  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Unlock the full power of BitComm with our premium subscription tiers. 
          Free forever, with options to upgrade.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {SUBSCRIPTION_PLANS.map(plan => (
          <PricingCard key={plan.tier} plan={plan} onSubscribe={handleSubscribe} />
        ))}
      </div>
    </div>
  )
}
