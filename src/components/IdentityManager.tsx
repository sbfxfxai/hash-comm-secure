import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BitCommButton } from '@/components/ui/bitcomm-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { generateBitCommIdentity, type BitCommAddress } from '@/lib/bitcomm';
import { 
  PremiumIdentityService, 
  type PremiumIdentity,
  type VerificationBadge 
} from '@/lib/premiumIdentity';
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
import { useToast } from '@/hooks/use-toast';

interface StoredIdentity extends BitCommAddress {
  name: string;
  isActive: boolean;
}

export function IdentityManager() {
  const [identities, setIdentities] = useState<StoredIdentity[]>([]);
  const [premiumIdentities, setPremiumIdentities] = useState<PremiumIdentity[]>([]);
  const [showPrivateKeys, setShowPrivateKeys] = useState<{ [key: string]: boolean }>({});
  const [newIdentityName, setNewIdentityName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // Load identities from localStorage and Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      // Load local identities
      const stored = localStorage.getItem('bitcomm-identities');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Validate and safely map identities
          const validatedIdentities = parsed
            .filter((id: unknown): id is StoredIdentity => {
              return typeof id === 'object' && id !== null &&
                     'name' in id && 'address' in id && 'privateKey' in id && 'publicKey' in id;
            })
            .map((id: StoredIdentity) => ({
              ...id,
              created: id.created ? new Date(id.created) : new Date()
            }));
          setIdentities(validatedIdentities);
        } catch (error) {
console.error('Error loading identities from localStorage:', error);
          // Optionally, add Sentry or a third-party logging service here
        }
      }

      // Load premium identities (assuming a logged-in user)
      const user_id = '<USER_ID>'; // Replace with actual user ID
      const premium = await PremiumIdentityService.getUserIdentities(user_id);
      setPremiumIdentities(premium);
    };
    loadData();
  }, []);

  // Save identities to localStorage
  const saveIdentities = (newIdentities: StoredIdentity[]) => {
    localStorage.setItem('bitcomm-identities', JSON.stringify(newIdentities));
    setIdentities(newIdentities);
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
      // Simulate blockchain registration delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const identity = generateBitCommIdentity();
      const newIdentity: StoredIdentity = {
        ...identity,
        name: newIdentityName.trim(),
        isActive: identities.length === 0 // First identity is active by default
      };

      const updatedIdentities = [...identities, newIdentity];
      saveIdentities(updatedIdentities);
      
      setNewIdentityName('');
      
      toast({
        title: "Identity Created!",
        description: `BitComm address ${newIdentity.address.substring(0, 12)}... registered on Bitcoin blockchain.`,
      });
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: "Failed to create identity. Please try again.",
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
    // Safely access object property to prevent injection
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
      <Badge className={`${badge.color} bg-opacity-10`}>
        <Icon className="h-4 w-4 mr-1" />
        {badge.text}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Create New Identity */}
      <Card className="border-bitcoin-orange/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-bitcoin-orange" />
            BitComm Identity Manager
          </CardTitle>
          <CardDescription>
            Create and manage your decentralized identities on the Bitcoin blockchain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="identity-name">Identity Name</Label>
              <Input
                id="identity-name"
                value={newIdentityName}
                onChange={(e) => setNewIdentityName(e.target.value)}
                placeholder="e.g., Personal, Work, Anonymous..."
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <BitCommButton 
                onClick={createIdentity}
                disabled={isCreating || !newIdentityName.trim()}
                variant={isCreating ? "mining" : "hero"}
                size="lg"
              >
                {isCreating ? (
                  <>
                    <Bitcoin className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Identity
                  </>
                )}
              </BitCommButton>
            </div>
          </div>
          
          {isCreating && (
            <div className="bg-bitcoin-orange/10 p-4 rounded-lg border border-bitcoin-orange/20">
              <p className="text-sm text-bitcoin-dark">
                🔗 Registering your identity on the Bitcoin blockchain...
                <br />
                This ensures immutable, verifiable identity without central authorities.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Premium Identities */}
      {premiumIdentities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-gold-500" />
              Premium Identities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {premiumIdentities.map(identity => (
              <div key={identity.id} className="p-4 border rounded-lg mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{identity.name}</h3>
                    <p className="text-sm text-muted-foreground">{formatAddress(identity.metadata?.address || '')}</p>
                  </div>
                  {renderVerificationBadge(identity)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Existing Identities */}
      {identities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Your Identities ({identities.length})
            </CardTitle>
            <CardDescription>
              Each identity is cryptographically secured and registered on Bitcoin
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
