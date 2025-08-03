import { Suspense, lazy, useState } from 'react';
import { AuthModal } from '@/components/AuthModal';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Skeleton } from '@/components/ui/skeleton';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

// Lazy load heavy components
const Inbox = lazy(() => import('@/components/Inbox').then(m => ({ default: m.Inbox })));
const ContactManager = lazy(() => import('@/components/ContactManager').then(m => ({ default: m.ContactManager })));
const ProofOfWorkDemo = lazy(() => import('@/components/ProofOfWorkDemo').then(m => ({ default: m.ProofOfWorkDemo })));
const IdentityManager = lazy(() => import('@/components/IdentityManager').then(m => ({ default: m.IdentityManager })));
const MessageComposer = lazy(() => import('@/components/MessageComposer').then(m => ({ default: m.MessageComposer })));
const P2PNetworkStatus = lazy(() => import('@/components/P2PNetworkStatus').then(m => ({ default: m.P2PNetworkStatus })));
const AdminDashboard = lazy(() => import('@/components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const PricingPage = lazy(() => import('@/components/PricingPage').then(m => ({ default: m.PricingPage })));
const UserProfile = lazy(() => import('@/components/UserProfile').then(m => ({ default: m.UserProfile })));
const TestPage = lazy(() => import('@/components/TestPage').then(m => ({ default: m.TestPage })));
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BitCommButton } from '@/components/ui/bitcomm-button';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Bitcoin, Shield, Zap, Users, LogOut, User, CreditCard } from 'lucide-react';
import { P2PPaymentCard, PaywallCard, PaymentHistory } from '@/components/P2PPaymentComponents';

// Component skeleton for loading states
const ComponentSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-48 mx-auto" />
    <Skeleton className="h-64 w-full" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);

const Index = () => {
  const { user, signOut, loading, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState("inbox")

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Sidebar - Hidden on mobile by default, shown on desktop */}
        <AppSidebar activeTab={activeTab} onTabChange={handleTabChange} />
        
        {/* Main content area */}
        <SidebarInset className="flex-1">
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2">
              <Bitcoin className="h-6 w-6 text-bitcoin-orange" />
              <h1 className="text-xl font-bold">BitComm</h1>
            </div>
            <div className="ml-auto">
              {loading ? (
                <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.displayName} />
                        <AvatarFallback>{user.displayName?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleTabChange('profile')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Billing</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <AuthModal>
                  <BitCommButton variant="hero">Sign In</BitCommButton>
                </AuthModal>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {/* Desktop tabs - hidden on mobile */}
            <div className="hidden md:block mb-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-10">
                  <TabsTrigger value="inbox">Inbox</TabsTrigger>
                  <TabsTrigger value="contacts">Contacts</TabsTrigger>
                  <TabsTrigger value="network">P2P Network</TabsTrigger>
                  <TabsTrigger value="composer">Compose</TabsTrigger>
                  <TabsTrigger value="pow">Proof-of-Work</TabsTrigger>
                  <TabsTrigger value="identity">Identity</TabsTrigger>
                  <TabsTrigger value="lightning">Payments</TabsTrigger>
                  <TabsTrigger value="test">Test</TabsTrigger>
                  <TabsTrigger value="enterprise">Enterprise</TabsTrigger>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {/* Tab Content */}
            {activeTab === "inbox" && (
              <div className="h-[calc(100vh-140px)]">
                <ProtectedRoute>
                  <Suspense fallback={<ComponentSkeleton />}>
                    <Inbox />
                  </Suspense>
                </ProtectedRoute>
              </div>
            )}
            
            {activeTab === "contacts" && (
              <div className="h-[calc(100vh-140px)]">
                <ProtectedRoute>
                  <Suspense fallback={<ComponentSkeleton />}>
                    <ContactManager />
                  </Suspense>
                </ProtectedRoute>
              </div>
            )}
            
            {activeTab === "network" && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4">P2P Network Layer</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Connect to the decentralized BitComm network. No central servers, 
                    just peer-to-peer communication with Bitcoin-level security.
                  </p>
                </div>
                <Suspense fallback={<ComponentSkeleton />}>
                  <P2PNetworkStatus />
                </Suspense>
              </div>
            )}
            
            {activeTab === "composer" && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4">Send Encrypted Messages</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Experience the full BitComm workflow - compose, encrypt, and send messages protected by 
                    Bitcoin-style proof-of-work anti-spam technology.
                  </p>
                </div>
                <Suspense fallback={<ComponentSkeleton />}>
                  <MessageComposer />
                </Suspense>
              </div>
            )}
            
            {activeTab === "pow" && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4">Experience Bitcoin's Anti-Spam Power</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    See how requiring computational work for each message makes spam economically impossible 
                    while keeping legitimate communication free and instant.
                  </p>
                </div>
                <Suspense fallback={<ComponentSkeleton />}>
                  <ProofOfWorkDemo />
                </Suspense>
              </div>
            )}
            
            {activeTab === "identity" && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4">Decentralized Identity Management</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Create Bitcoin blockchain-verified identities that you fully control. 
                    No more permanent email addresses you can't revoke when compromised.
                  </p>
                </div>
                <Suspense fallback={<ComponentSkeleton />}>
                  <IdentityManager />
                </Suspense>
              </div>
            )}

            {activeTab === "lightning" && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4">Lightning Network Payments</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Test real Lightning Network payments with instant, low-cost Bitcoin transactions. 
                    Send satoshis peer-to-peer and unlock premium features.
                  </p>
                </div>
                <ProtectedRoute>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* P2P Payment Test */}
                    <P2PPaymentCard
                      recipientDID="did:btc:1234567890abcdef"
                      recipientName="Test Recipient"
                      recipientDisplayName="Test User"
                      onPaymentComplete={(result) => {
                        console.log('Payment completed:', result)
                      }}
                    />
                    
                    {/* Paywall Test */}
                    <PaywallCard
                      feature="Premium Messaging"
                      amount={1000}
                      description="Unlock unlimited encrypted messages with enhanced features"
                      onPaymentSuccess={() => {
                        console.log('Premium feature unlocked!')
                      }}
                    />
                  </div>
                  
                  {/* Payment History */}
                  <div className="mt-8">
                    <PaymentHistory />
                  </div>
                </ProtectedRoute>
              </div>
            )}

            {activeTab === "test" && (
              <div className="space-y-6">
                <Suspense fallback={<ComponentSkeleton />}>
                  <TestPage />
                </Suspense>
              </div>
            )}

            {activeTab === "enterprise" && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4">Enterprise Dashboard</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Manage premium identities, generate compliance reports, and view network analytics.
                  </p>
                </div>
                <ProtectedRoute>
                  <Suspense fallback={<ComponentSkeleton />}>
                    <AdminDashboard />
                  </Suspense>
                </ProtectedRoute>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4">User Profile</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Manage your BitComm account settings and view your authentication details.
                  </p>
                </div>
                <ProtectedRoute>
                  <Suspense fallback={<ComponentSkeleton />}>
                    <UserProfile />
                  </Suspense>
                </ProtectedRoute>
              </div>
            )}

            {activeTab === "pricing" && (
              <div className="space-y-6">
                <Suspense fallback={<ComponentSkeleton />}>
                  <PricingPage />
                </Suspense>
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
