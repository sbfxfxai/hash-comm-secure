/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect } from 'react';
import {
    User,
    Key,
    Hash,
    Plus,
    Trash2,
    Eye,
    EyeOff,
    Copy,
    Bitcoin,
    CheckCircle,
    Crown,
    Building,
    Globe,
    Smartphone,
    Shield
} from 'lucide-react';

// Mock types since we don't have access to the actual libraries
interface BitCommAddress {
    address: string;
    privateKey: string;
    publicKey: string;
    created: Date;
}

interface StoredIdentity extends BitCommAddress {
    name: string;
    isActive: boolean;
}

interface PremiumIdentity {
    id: string;
    name: string;
    metadata?: {
        address?: string;
    };
    verification_level?: 'basic' | 'business' | 'government' | 'celebrity';
}

interface VerificationBadge {
    icon: string;
    text: string;
    color: string;
}

// Mock functions - replace with your actual implementations
const generateBitCommIdentity = (): BitCommAddress => ({
    address: `bc1${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
    privateKey: `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
    publicKey: `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
    created: new Date()
});

const PremiumIdentityService = {
    getUserIdentities: async (userId: string): Promise<PremiumIdentity[]> => {
        // Mock implementation
        return [];
    },
    getVerificationBadge: (identity: PremiumIdentity): VerificationBadge | null => {
        const badges = {
            basic: { icon: 'CheckCircle', text: 'Verified', color: 'text-green-600' },
            business: { icon: 'Building', text: 'Business', color: 'text-blue-600' },
            government: { icon: 'Shield', text: 'Government', color: 'text-purple-600' },
            celebrity: { icon: 'Crown', text: 'Celebrity', color: 'text-gold-600' }
        };
        return identity.verification_level ? badges[identity.verification_level] : null;
    }
};

// Import real hooks
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function IdentityManager() {
    const [identities, setIdentities] = useState<StoredIdentity[]>([]);
    const [premiumIdentities, setPremiumIdentities] = useState<PremiumIdentity[]>([]);
    const [showPrivateKeys, setShowPrivateKeys] = useState<{ [key: string]: boolean }>({});
    const [newIdentityName, setNewIdentityName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const { toast } = useToast();
    const { user, createDIDIdentity, isAuthenticated } = useAuth();

    // Load identities from localStorage and integrate with AuthContext
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load existing identities from localStorage
                const storedIdentities = localStorage.getItem('bitcomm_identities');
                let existingIdentities: StoredIdentity[] = [];
                
                if (storedIdentities) {
                    existingIdentities = JSON.parse(storedIdentities).map((id: any) => ({
                        ...id,
                        created: new Date(id.created)
                    }));
                }

                // If user is authenticated via AuthContext, ensure their identity is included
                if (user) {
                    const userIdentityExists = existingIdentities.some(id => id.address === user.did);
                    if (!userIdentityExists) {
                        const userIdentity: StoredIdentity = {
                            address: user.did,
                            privateKey: 'encrypted_private_key', // In production, this would be properly encrypted
                            publicKey: user.publicKey,
                            created: user.createdAt,
                            name: user.displayName || 'Main Identity',
                            isActive: existingIdentities.length === 0
                        };
                        existingIdentities.unshift(userIdentity);
                    }
                }

                setIdentities(existingIdentities);

                // Load premium identities if user exists
                if (user) {
                    const premium = await PremiumIdentityService.getUserIdentities(user.did);
                    setPremiumIdentities(premium);
                }
            } catch (error) {
                console.error('Failed to load identities:', error);
            }
        };
        loadData();
    }, [user]);

    // Save identities to localStorage
    const saveIdentities = (newIdentities: StoredIdentity[]) => {
        try {
            const identitiesToStore = newIdentities.map(id => ({
                ...id,
                created: id.created.toISOString()
            }));
            localStorage.setItem('bitcomm_identities', JSON.stringify(identitiesToStore));
            setIdentities(newIdentities);
        } catch (error) {
            console.error('Failed to save identities:', error);
            toast({
                title: "Save Failed",
                description: "Failed to save identities to local storage.",
                variant: "destructive"
            });
        }
    };

    const createIdentity = async () => {
        if (!newIdentityName.trim()) {
            toast({
                title: "Name Required",
                description: "Please enter a name for your new identity.",
                variant: "destructive",
            });
            return;
        }

        setIsCreating(true);

        try {
            // Use the AuthContext's createDIDIdentity for consistency
            const result = await createDIDIdentity(newIdentityName.trim());
            
            if (result.error) {
                throw new Error(result.error);
            }

            // The identity will be automatically added to the list via the useEffect
            setNewIdentityName('');

            toast({
                title: "Identity Created!",
                description: `DID identity created and registered successfully.`,
            });
        } catch (error) {
            toast({
                title: "Creation Failed",
                description: error instanceof Error ? error.message : "Failed to create identity. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsCreating(false);
        }
    };

    const deleteIdentity = (address: string) => {
        const updatedIdentities = identities.filter(id => id.address !== address);
        saveIdentities(updatedIdentities);

        toast({
            title: "Identity Deleted",
            description: "The identity has been removed from your device.",
        });
    };

    const setActiveIdentity = (address: string) => {
        const updatedIdentities = identities.map(id => ({
            ...id,
            isActive: id.address === address
        }));
        saveIdentities(updatedIdentities);

        toast({
            title: "Active Identity Changed",
            description: `Now using ${address.substring(0, 12)}... for sending messages.`,
        });
    };

    const togglePrivateKeyVisibility = (address: string) => {
        setShowPrivateKeys(prev => {
            const newState = { ...prev };
            if (Object.prototype.hasOwnProperty.call(newState, address)) {
                newState[address] = !newState[address];
            } else {
                newState[address] = true;
            }
            return newState;
        });
    };

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied!",
            description: `${type} copied to clipboard.`,
        });
    };

    const formatAddress = (address: string) => {
        return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
    };

    const renderVerificationBadge = (identity: PremiumIdentity) => {
        const badge = PremiumIdentityService.getVerificationBadge(identity);
        if (!badge) return null;

        const Icon = {
            CheckCircle,
            Building,
            Globe,
            Crown
        }[badge.icon] || Shield;

        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color} bg-current bg-opacity-10`}>
                <Icon className="w-4 h-4 mr-1" />
                {badge.text}
            </span>
        );
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-6">
            {/* Create New Identity */}
            <div className="bg-white rounded-xl border-2 border-orange-200 shadow-lg">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                        <User className="w-5 h-5 text-orange-500" />
                        BitComm Identity Manager
                    </h2>
                    <p className="text-gray-600">
                        Create and manage your decentralized identities on the Bitcoin blockchain
                    </p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label htmlFor="identity-name" className="block text-sm font-medium text-gray-700 mb-1">
                                Identity Name
                            </label>
                            <input
                                id="identity-name"
                                type="text"
                                value={newIdentityName}
                                onChange={(e) => setNewIdentityName(e.target.value)}
                                placeholder="e.g., Personal, Work, Anonymous..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={createIdentity}
                                disabled={isCreating || !newIdentityName.trim()}
                                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${isCreating || !newIdentityName.trim()
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg hover:shadow-xl'
                                    }`}
                            >
                                {isCreating ? (
                                    <>
                                        <Bitcoin className="w-4 h-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" />
                                        Create Identity
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {isCreating && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <p className="text-sm text-orange-800">
                                🔗 Registering your identity on the Bitcoin blockchain...
                                <br />
                                This ensures immutable, verifiable identity without central authorities.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Identities */}
            {premiumIdentities.length > 0 && (
                <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Crown className="w-5 h-5 text-yellow-500" />
                            Premium Identities
                        </h2>
                    </div>
                    <div className="p-6">
                        {premiumIdentities.map(identity => (
                            <div key={identity.id} className="p-4 border border-gray-200 rounded-lg mb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-900">{identity.name}</h3>
                                        <p className="text-sm text-gray-500">{formatAddress(identity.metadata?.address || '')}</p>
                                    </div>
                                    {renderVerificationBadge(identity)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Existing Identities */}
            {identities.length > 0 && (
                <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                            <Key className="w-5 h-5 text-gray-700" />
                            Your Identities ({identities.length})
                        </h2>
                        <p className="text-gray-600">
                            Each identity is cryptographically secured and registered on Bitcoin
                        </p>
                    </div>
                    <div className="p-6 space-y-3">
                        {identities.map((identity) => (
                            <div key={identity.address} className="p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-3">
                                            <h3 className="font-medium text-gray-900">{identity.name}</h3>
                                            {identity.isActive && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Bitcoin className="w-4 h-4 text-orange-500" />
                                                <span className="text-xs text-gray-600 font-medium">Messaging Address:</span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border">
                                                <code className="text-sm font-mono flex-1 text-gray-800">
                                                    {identity.address}
                                                </code>
                                                <button
                                                    onClick={() => copyToClipboard(identity.address, 'Messaging Address')}
                                                    className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded border border-gray-300 transition-colors flex items-center gap-1"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                    Copy
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Share this address with others to receive messages
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 ml-4">
                                        {!identity.isActive && (
                                            <button
                                                onClick={() => setActiveIdentity(identity.address)}
                                                className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                                            >
                                                Activate
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteIdentity(identity.address)}
                                            className="px-4 py-2 text-red-600 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}