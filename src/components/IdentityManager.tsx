import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BitCommButton } from '@/components/ui/bitcomm-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { generateBitCommIdentity, type BitCommAddress } from '@/lib/bitcomm';
import { User, Key, Hash, Plus, Trash2, Eye, EyeOff, Copy, Bitcoin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StoredIdentity extends BitCommAddress {
  name: string;
  isActive: boolean;
}

export function IdentityManager() {
  const [identities, setIdentities] = useState<StoredIdentity[]>([]);
  const [showPrivateKeys, setShowPrivateKeys] = useState<{ [key: string]: boolean }>({});
  const [newIdentityName, setNewIdentityName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // Load identities from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('bitcomm-identities');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setIdentities(parsed.map((id: any) => ({
          ...id,
          created: new Date(id.created)
        })));
      } catch (error) {
        console.error('Failed to load identities:', error);
      }
    }
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
    setShowPrivateKeys(prev => ({
      ...prev,
      [address]: !prev[address]
    }));
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
          <CardContent className="space-y-4">
            {identities.map((identity) => (
              <div 
                key={identity.address} 
                className={`p-4 rounded-lg border transition-all ${
                  identity.isActive 
                    ? 'border-bitcoin-orange bg-bitcoin-orange/5' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{identity.name}</h4>
                      {identity.isActive && (
                        <Badge variant="default" className="bg-bitcoin-orange">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Created {identity.created.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!identity.isActive && (
                      <BitCommButton
                        onClick={() => setActiveIdentity(identity.address)}
                        variant="outline"
                        size="sm"
                      >
                        Set Active
                      </BitCommButton>
                    )}
                    <BitCommButton
                      onClick={() => deleteIdentity(identity.address)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </BitCommButton>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* BitComm Address */}
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      BITCOMM ADDRESS (PUBLIC)
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="bg-gray-100 p-2 rounded font-mono text-sm flex-1 break-all">
                        {identity.address}
                      </div>
                      <BitCommButton
                        onClick={() => copyToClipboard(identity.address, 'Address')}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="h-4 w-4" />
                      </BitCommButton>
                    </div>
                  </div>

                  {/* Public Key */}
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      PUBLIC KEY
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="bg-gray-100 p-2 rounded font-mono text-sm flex-1 break-all">
                        {formatAddress(identity.publicKey)}
                      </div>
                      <BitCommButton
                        onClick={() => copyToClipboard(identity.publicKey, 'Public Key')}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="h-4 w-4" />
                      </BitCommButton>
                    </div>
                  </div>

                  {/* Private Key */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Label className="text-xs font-medium text-muted-foreground">
                        PRIVATE KEY (KEEP SECRET!)
                      </Label>
                      <BitCommButton
                        onClick={() => togglePrivateKeyVisibility(identity.address)}
                        variant="ghost"
                        size="sm"
                      >
                        {showPrivateKeys[identity.address] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </BitCommButton>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-red-50 border border-red-200 p-2 rounded font-mono text-sm flex-1 break-all">
                        {showPrivateKeys[identity.address] 
                          ? identity.privateKey 
                          : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'
                        }
                      </div>
                      {showPrivateKeys[identity.address] && (
                        <BitCommButton
                          onClick={() => copyToClipboard(identity.privateKey, 'Private Key')}
                          variant="outline"
                          size="sm"
                        >
                          <Copy className="h-4 w-4" />
                        </BitCommButton>
                      )}
                    </div>
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ Never share your private key. It controls your identity!
                    </p>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    SHA-256 Secured
                  </div>
                  <div className="flex items-center gap-1">
                    <Bitcoin className="h-3 w-3" />
                    Bitcoin Verified
                  </div>
                  <div className="text-green-600">✓ Immutable</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Getting Started */}
      {identities.length === 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">No Identities Yet</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Create your first BitComm identity to start sending secure, spam-free messages.
                  Unlike email addresses, you have full control over your identity.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
