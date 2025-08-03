import React from 'react';
import { Check, Star, Zap, Bitcoin } from 'lucide-react';

interface SubscriptionPlan {
    tier: 'free' | 'basic' | 'pro' | 'enterprise';
    name: string;
    description: string;
    monthlyPrice: number;
    price_sats: number;
    features: string[];
    popular?: boolean;
}

// Mock subscription plans data
const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        tier: 'free',
        name: 'Free',
        description: 'Perfect for getting started',
        monthlyPrice: 0,
        price_sats: 0,
        features: [
            '10 messages per day',
            'Basic encryption',
            'Standard PoW difficulty',
            'Community support',
            'Mobile app access'
        ]
    },
    {
        tier: 'basic',
        name: 'Basic',
        description: 'For regular users',
        monthlyPrice: 9,
        price_sats: 21000,
        features: [
            '100 messages per day',
            'Enhanced encryption',
            'Priority routing',
            'Email support',
            'Custom themes',
            'Message scheduling'
        ]
    },
    {
        tier: 'pro',
        name: 'Pro',
        description: 'For power users',
        monthlyPrice: 29,
        price_sats: 65000,
        popular: true,
        features: [
            'Unlimited messages',
            'Advanced encryption',
            'Lightning-fast routing',
            'Priority support',
            'Advanced analytics',
            'API access',
            'Custom domains',
            'Group messaging'
        ]
    },
    {
        tier: 'enterprise',
        name: 'Enterprise',
        description: 'For organizations',
        monthlyPrice: 99,
        price_sats: 210000,
        features: [
            'Everything in Pro',
            'Dedicated infrastructure',
            'Custom integrations',
            'SLA guarantee',
            '24/7 phone support',
            'Advanced security',
            'Compliance tools',
            'Team management'
        ]
    }
];

interface PricingCardProps {
    plan: SubscriptionPlan;
    onSubscribe: (tier: SubscriptionPlan['tier']) => void;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, onSubscribe }) => (
    <div className={`bg-white rounded-lg shadow-sm border flex flex-col relative ${plan.popular ? 'border-orange-500 shadow-lg' : 'border-gray-200'
        }`}>
        {plan.popular && (
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold uppercase tracking-wider text-center py-2 rounded-t-lg">
                <Star className="inline h-3 w-3 mr-1" />
                Most Popular
            </div>
        )}

        <div className="p-6 text-center border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
            <p className="text-gray-600">{plan.description}</p>
        </div>

        <div className="p-6 flex flex-col flex-1 space-y-6">
            <div className="text-center">
                <span className="text-4xl font-bold text-gray-900">${plan.monthlyPrice}</span>
                <span className="text-gray-600">/month</span>
                {plan.price_sats > 0 && (
                    <div className="text-sm text-orange-600 font-mono mt-1">
                        {plan.price_sats.toLocaleString()} sats
                    </div>
                )}
            </div>

            <ul className="space-y-3 flex-1">
                {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                    </li>
                ))}
            </ul>

            <div className="mt-6 space-y-3">
                {/* Bitcoin Connect Button */}
                <button
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-all ${plan.popular
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                >
                    <Bitcoin className="h-4 w-4" />
                    Connect Wallet
                </button>

                {/* Payment Button */}
                <button
                    onClick={() => onSubscribe(plan.tier)}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium border transition-all ${plan.tier === 'free'
                            ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                            : plan.popular
                                ? 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
                                : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                >
                    <Zap className="h-4 w-4" />
                    {plan.tier === 'free' ? 'Get Started Free' : `Subscribe to ${plan.name}`}
                </button>
            </div>
        </div>
    </div>
);

export function PricingPage() {
    const handleSubscribe = (tier: SubscriptionPlan['tier']) => {
        // Mock subscription logic
        if (tier === 'free') {
            console.log('Starting free plan...');
            alert('Welcome to BitComm Free! You can start messaging right away.');
        } else {
            console.log(`Subscribing to ${tier} tier...`);
            alert(`Initiating payment for ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan. In a real app, this would connect to Lightning Network for payment.`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Choose Your Plan
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Unlock the full power of BitComm with our premium subscription tiers.
                        Start free forever, with options to upgrade as your needs grow.
                    </p>

                    {/* Value Proposition */}
                    <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>No credit cards required</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>Pay with Bitcoin Lightning</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>Cancel anytime</span>
                        </div>
                    </div>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {SUBSCRIPTION_PLANS.map(plan => (
                        <PricingCard key={plan.tier} plan={plan} onSubscribe={handleSubscribe} />
                    ))}
                </div>

                {/* FAQ Section */}
                <div className="mt-20 max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                        Frequently Asked Questions
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-3">How does Bitcoin payment work?</h3>
                            <p className="text-gray-600 text-sm">
                                We use the Lightning Network for instant, low-fee Bitcoin payments.
                                Connect your Lightning wallet and pay in seconds.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-3">Can I change plans anytime?</h3>
                            <p className="text-gray-600 text-sm">
                                Yes! Upgrade or downgrade your plan at any time.
                                Changes take effect immediately with prorated billing.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-3">What's included in the free plan?</h3>
                            <p className="text-gray-600 text-sm">
                                The free plan includes 10 messages per day, basic encryption,
                                and access to the core BitComm features - perfect for trying out the platform.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-3">Is my data secure?</h3>
                            <p className="text-gray-600 text-sm">
                                All plans include end-to-end encryption. Higher tiers offer
                                enhanced security features and compliance tools.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="mt-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 md:p-12 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Ready to get started?
                    </h2>
                    <p className="text-orange-100 text-lg mb-8 max-w-2xl mx-auto">
                        Join thousands of users who trust BitComm for secure,
                        decentralized messaging. Start free today.
                    </p>
                    <button
                        onClick={() => handleSubscribe('free')}
                        className="bg-white text-orange-600 px-8 py-4 rounded-lg font-semibold hover:bg-orange-50 transition-colors inline-flex items-center gap-2"
                    >
                        <Zap className="h-5 w-5" />
                        Start Free Now
                    </button>
                </div>
            </div>
        </div>
    );
}