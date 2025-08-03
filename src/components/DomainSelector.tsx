/* eslint-disable security/detect-object-injection */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Globe, Mail, Shield, Zap, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface DomainSelectorProps {
    onDomainSelect?: (domain: string) => void;
    currentDomain?: string;
    onClose?: () => void;
}

interface DomainStatus {
    isChecking: boolean;
    isReachable: boolean | null;
    lastChecked: number | null;
}

export const DomainSelector: React.FC<DomainSelectorProps> = ({
    onDomainSelect,
    currentDomain,
    onClose
}) => {
    const [selectedDomain, setSelectedDomain] = useState<string>('');
    const [showSelector, setShowSelector] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [domainStatuses, setDomainStatuses] = useState<Record<string, DomainStatus>>({});
    const [focusedDomain, setFocusedDomain] = useState<string>('');

    // Refs for accessibility
    const dialogRef = useRef<HTMLDivElement>(null);
    const firstButtonRef = useRef<HTMLButtonElement>(null);

    const domains = [
        {
            name: 'bitcomm.email',
            title: 'BitComm Email',
            description: 'Primary domain with email-focused branding and optimized performance',
            features: ['Fast DNS resolution', 'Traditional web experience', 'Email integration', 'SSL secured'],
            icon: <Mail className="h-6 w-6" />,
            badge: 'Primary',
            badgeVariant: 'primary' as const,
            priority: 1
        },
        {
            name: 'bitcomm.eth',
            title: 'BitComm ETH',
            description: 'Decentralized ENS domain for Web3 users with blockchain verification',
            features: ['ENS resolution', 'Web3 native', 'Blockchain verified', 'IPFS gateway'],
            icon: <Globe className="h-6 w-6" />,
            badge: 'Web3',
            badgeVariant: 'secondary' as const,
            priority: 2
        }
    ];

    // Debounced domain health check
    const checkDomainHealth = useCallback(async (domain: string) => {
        setDomainStatuses(prev => ({
            ...prev,
            [domain]: { ...prev[domain], isChecking: true }
        }));

        try {
            // Simple health check - in production, use a proper health endpoint
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`https://${domain}/health`, {
                method: 'HEAD',
                signal: controller.signal,
                mode: 'no-cors' // For demo - in production use proper CORS
            });

            clearTimeout(timeoutId);

            setDomainStatuses(prev => ({
                ...prev,
                [domain]: {
                    isChecking: false,
                    isReachable: true,
                    lastChecked: Date.now()
                }
            }));
        } catch (error) {
            setDomainStatuses(prev => ({
                ...prev,
                [domain]: {
                    isChecking: false,
                    isReachable: false,
                    lastChecked: Date.now()
                }
            }));
        }
    }, []);

    useEffect(() => {
        const hostname = window.location.hostname;
        const detectedDomain = domains.find(d => hostname.includes(d.name));

        if (detectedDomain) {
            setSelectedDomain(detectedDomain.name);
        } else {
            setShowSelector(true);
            // Focus management for accessibility
            setTimeout(() => {
                firstButtonRef.current?.focus();
            }, 100);
        }

        // Check domain health on mount
        domains.forEach(domain => {
            checkDomainHealth(domain.name);
        });
    }, [checkDomainHealth, domains]);

    // Keyboard navigation
    useEffect(() => {
        if (!showSelector) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
            } else if (e.key === 'Tab') {
                // Trap focus within the dialog
                const focusableElements = dialogRef.current?.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );

                if (focusableElements && focusableElements.length > 0) {
                    const firstElement = focusableElements[0] as HTMLElement;
                    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

                    if (e.shiftKey && document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    } else if (!e.shiftKey && document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showSelector]);

    const handleDomainSelect = useCallback(async (domain: string) => {
        setIsRedirecting(true);
        setSelectedDomain(domain);

        // Analytics/tracking (replace with your analytics service)
        if (typeof window !== 'undefined' && 'gtag' in window && typeof window.gtag === 'function') {
            window.gtag('event', 'domain_switch', {
                'domain_from': window.location.hostname,
                'domain_to': domain
            });
        }

        try {
            // Check if domain is different from current
            if (window.location.hostname !== domain) {
                // Store preference
                try {
                    localStorage.setItem('bitcomm_preferred_domain', domain);
                } catch (e) {
                    // localStorage not available, continue without storing preference
                }

                // Smooth redirect with user feedback
                const redirectUrl = `https://${domain}${window.location.pathname}${window.location.search}`;

                // For better UX, you might want to add a small delay
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 500);
            } else {
                setShowSelector(false);
                setIsRedirecting(false);
            }

            if (onDomainSelect) {
                onDomainSelect(domain);
            }
        } catch (error) {
            console.error('Domain selection error:', error);
            setIsRedirecting(false);
            // You could show an error toast here
        }
    }, [onDomainSelect]);

    const handleClose = useCallback(() => {
        setShowSelector(false);
        if (onClose) {
            onClose();
        }
    }, [onClose]);

    const handleShowSelector = useCallback(() => {
        setShowSelector(true);
        setTimeout(() => {
            firstButtonRef.current?.focus();
        }, 100);
    }, []);

    const getDomainStatusIcon = (domain: string) => {
        const status = domainStatuses[domain];
        if (!status) return null;

        if (status.isChecking) {
            return <Loader2 className="w-4 h-4 animate-spin text-gray-500" />;
        }

        if (status.isReachable === true) {
            return <CheckCircle className="w-4 h-4 text-green-500" />;
        }

        if (status.isReachable === false) {
            return <AlertCircle className="w-4 h-4 text-amber-500" />;
        }

        return null;
    };

    // Floating switch button when domain is selected
    if (!showSelector && selectedDomain) {
        return (
            <div className="fixed bottom-4 right-4 z-40 md:top-4 md:right-4 md:bottom-auto">
                <button
                    ref={firstButtonRef}
                    onClick={handleShowSelector}
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg hover:border-blue-500 hover:shadow-xl transition-all duration-200 text-sm font-medium text-gray-700 hover:text-blue-600"
                    aria-label="Switch to a different BitComm domain"
                >
                    <Globe className="w-4 h-4" />
                    <span className="hidden sm:inline">Switch Domain</span>
                    <span className="sm:hidden">Domain</span>
                </button>
            </div>
        );
    }

    if (!showSelector) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="domain-selector-title"
            aria-describedby="domain-selector-description"
        >
            <div
                ref={dialogRef}
                className="w-full max-w-4xl bg-white rounded-xl shadow-2xl border-2 border-gray-200"
            >
                {/* Header */}
                <div className="text-center relative p-6 border-b border-gray-100">
                    <button
                        onClick={handleClose}
                        className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Close domain selector"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <h2 id="domain-selector-title" className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-900 mb-2">
                        <Shield className="w-6 h-6" />
                        Choose Your BitComm Domain
                    </h2>
                    <p id="domain-selector-description" className="text-gray-600">
                        Select your preferred domain to access BitComm. You can switch between them anytime.
                        {isRedirecting && (
                            <span className="block mt-2 text-blue-600">
                                <Loader2 className="inline w-4 h-4 animate-spin mr-2" />
                                Redirecting...
                            </span>
                        )}
                    </p>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        {domains.sort((a, b) => a.priority - b.priority).map((domain, index) => {
                            const status = domainStatuses[domain.name];
                            const isCurrentDomain = selectedDomain === domain.name;
                            const isPrimary = domain.badgeVariant === 'primary';

                            return (
                                <div
                                    key={domain.name}
                                    className={`relative cursor-pointer transition-all duration-200 border-2 rounded-xl p-6 bg-white
                    ${isCurrentDomain ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'}
                    ${focusedDomain === domain.name ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                    ${isRedirecting ? 'pointer-events-none opacity-50' : ''}
                  `}
                                    onClick={() => !isRedirecting && handleDomainSelect(domain.name)}
                                    onMouseEnter={() => setFocusedDomain(domain.name)}
                                    onMouseLeave={() => setFocusedDomain('')}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Select ${domain.title} domain`}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            !isRedirecting && handleDomainSelect(domain.name);
                                        }
                                    }}
                                >
                                    {/* Card Header */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="text-blue-600">
                                                    {domain.icon}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                        {domain.title}
                                                        {getDomainStatusIcon(domain.name)}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 font-mono">
                                                        {domain.name}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${isPrimary
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {domain.badge}
                                                </span>
                                                {status?.isReachable === false && (
                                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                                        Checking...
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-gray-600 text-sm">{domain.description}</p>
                                    </div>

                                    {/* Features List */}
                                    <div className="mb-4">
                                        <ul className="space-y-2">
                                            {domain.features.map((feature, featureIndex) => (
                                                <li key={featureIndex} className="flex items-center gap-2 text-sm text-gray-700">
                                                    <Zap className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        ref={index === 0 ? firstButtonRef : undefined}
                                        className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${isPrimary
                                                ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300'
                                                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-600 disabled:bg-gray-50 disabled:text-gray-400'
                                            }`}
                                        disabled={isRedirecting || status?.isReachable === false}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            !isRedirecting && handleDomainSelect(domain.name);
                                        }}
                                    >
                                        {isRedirecting && selectedDomain === domain.name ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Redirecting...
                                            </span>
                                        ) : (
                                            `Access via ${domain.name}`
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {selectedDomain && !isRedirecting && (
                        <div className="mt-6 text-center">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Continue with current domain
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};