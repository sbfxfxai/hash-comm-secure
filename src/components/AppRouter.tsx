import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SimpleOnboarding from '@/components/SimpleOnboarding';
import SimpleApp from '@/components/SimpleApp';
import Index from '@/pages/Index';
import { DomainSelector } from '@/components/DomainSelector';

export const AppRouter: React.FC = () => {
  const { user, loading } = useAuth();
  const [showSimpleMode, setShowSimpleMode] = useState(true);
  const [showDomainSelector, setShowDomainSelector] = useState(false);

  // Check if user prefers advanced mode
  useEffect(() => {
    const advancedMode = localStorage.getItem('bitcomm-advanced-mode');
    const domainPreference = localStorage.getItem('bitcomm-domain-selected');
    
    if (advancedMode === 'true') {
      setShowSimpleMode(false);
    }
    
    if (!domainPreference) {
      setShowDomainSelector(true);
    }
  }, []);

  // Handle domain selection
  const handleDomainSelected = (domain: string) => {
    localStorage.setItem('bitcomm-domain-selected', domain);
    setShowDomainSelector(false);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your secure email...</p>
        </div>
      </div>
    );
  }

  // Show domain selector if not selected
  if (showDomainSelector && !user) {
    return <DomainSelector onDomainSelected={handleDomainSelected} />;
  }

  // Show onboarding for new users
  if (!user) {
    return <SimpleOnboarding />;
  }

  // Show appropriate interface based on user preference
  if (showSimpleMode) {
    return (
      <div className="relative">
        <SimpleApp />
        
        {/* Advanced Mode Toggle */}
        <button
          onClick={() => {
            setShowSimpleMode(false);
            localStorage.setItem('bitcomm-advanced-mode', 'true');
          }}
          className="fixed bottom-4 right-4 text-xs text-muted-foreground hover:text-foreground transition-colors bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full border shadow-sm"
        >
          Advanced Mode
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Index />
      
      {/* Simple Mode Toggle */}
      <button
        onClick={() => {
          setShowSimpleMode(true);
          localStorage.setItem('bitcomm-advanced-mode', 'false');
        }}
        className="fixed bottom-4 right-4 text-xs text-muted-foreground hover:text-foreground transition-colors bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full border shadow-sm"
      >
        Simple Mode
      </button>
    </div>
  );
};

export default AppRouter;
