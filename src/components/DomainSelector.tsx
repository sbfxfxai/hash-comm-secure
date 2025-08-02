import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Globe, Mail, Shield, Zap } from 'lucide-react';

interface DomainSelectorProps {
  onDomainSelect?: (domain: string) => void;
  currentDomain?: string;
}

export const DomainSelector: React.FC<DomainSelectorProps> = ({ 
  onDomainSelect, 
  currentDomain 
}) => {
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    // Check if user is on a custom domain
    const hostname = window.location.hostname;
    if (hostname.includes('bitcomm.email') || hostname.includes('bitcomm.eth')) {
      setSelectedDomain(hostname);
    } else {
      // Show selector if on default Vercel domain
      setShowSelector(true);
    }
  }, []);

  const domains = [
    {
      name: 'bitcomm.email',
      title: 'BitComm Email',
      description: 'Primary domain with email-focused branding',
      features: ['Fast DNS resolution', 'Traditional web experience', 'Email integration'],
      icon: <Mail className="h-6 w-6" />,
      badge: 'Primary',
      badgeVariant: 'default' as const
    },
    {
      name: 'bitcomm.eth',  
      title: 'BitComm ETH',
      description: 'Decentralized ENS domain for Web3 users',
      features: ['ENS resolution', 'Web3 native', 'Blockchain verified'],
      icon: <Globe className="h-6 w-6" />,
      badge: 'Backup',
      badgeVariant: 'secondary' as const
    }
  ];

  const handleDomainSelect = (domain: string) => {
    setSelectedDomain(domain);
    setShowSelector(false);
    
    // Redirect to selected domain
    if (window.location.hostname !== domain) {
      window.location.href = `https://${domain}${window.location.pathname}${window.location.search}`;
    }
    
    onDomainSelect?.(domain);
  };

  const handleShowSelector = () => {
    setShowSelector(true);
  };

  if (!showSelector && selectedDomain) {
    return (
      <div className="fixed bottom-4 right-4 z-40 md:top-4 md:right-4 md:bottom-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={handleShowSelector}
          className="bg-background/95 shadow-lg border-2"
        >
          <Globe className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Switch Domain</span>
          <span className="sm:hidden">Domain</span>
        </Button>
      </div>
    );
  }

  if (!showSelector) return null;

  return (
    <div className="fixed inset-0 bg-background/95 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Shield className="h-6 w-6" />
            Choose Your BitComm Domain
          </CardTitle>
          <CardDescription>
            Select your preferred domain to access BitComm. You can switch between them anytime.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {domains.map((domain) => (
              <Card 
                key={domain.name}
                className="relative cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/50"
                onClick={() => handleDomainSelect(domain.name)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {domain.icon}
                      <div>
                        <CardTitle className="text-lg">{domain.title}</CardTitle>
                        <p className="text-sm text-muted-foreground font-mono">
                          {domain.name}
                        </p>
                      </div>
                    </div>
                    <Badge variant={domain.badgeVariant}>
                      {domain.badge}
                    </Badge>
                  </div>
                  <CardDescription>{domain.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {domain.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Zap className="h-3 w-3 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-4"
                    variant={domain.badgeVariant === 'default' ? 'default' : 'outline'}
                  >
                    Access via {domain.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {selectedDomain && (
            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => setShowSelector(false)}
              >
                Continue with current domain
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
