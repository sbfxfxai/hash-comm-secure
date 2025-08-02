import { Suspense, lazy } from 'react';
import { AuthModal } from '@/components/AuthModal';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy components
const ProofOfWorkDemo = lazy(() => import('@/components/ProofOfWorkDemo').then(m => ({ default: m.ProofOfWorkDemo })));
const IdentityManager = lazy(() => import('@/components/IdentityManager').then(m => ({ default: m.IdentityManager })));
const MessageComposer = lazy(() => import('@/components/MessageComposer').then(m => ({ default: m.MessageComposer })));
const P2PNetworkStatus = lazy(() => import('@/components/P2PNetworkStatus').then(m => ({ default: m.P2PNetworkStatus })));
const AdminDashboard = lazy(() => import('@/components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const PricingPage = lazy(() => import('@/components/PricingPage').then(m => ({ default: m.PricingPage })));
const UserProfile = lazy(() => import('@/components/UserProfile').then(m => ({ default: m.UserProfile })));
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

  return (
    <div className="min-h-screen bg-background">
      <header className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bitcoin className="h-8 w-8 text-bitcoin-orange" />
          <h1 className="text-2xl font-bold">BitComm</h1>
        </div>
        <div>
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
                <DropdownMenuItem>
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
      <section className="container mx-auto px-4 py-12">
        <Tabs defaultValue="network" className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-8">
            <TabsTrigger value="network">P2P Network</TabsTrigger>
            <TabsTrigger value="composer">Message Composer</TabsTrigger>
            <TabsTrigger value="pow">Proof-of-Work Demo</TabsTrigger>
            <TabsTrigger value="identity">Identity Manager</TabsTrigger>
            <TabsTrigger value="lightning">Lightning Payments</TabsTrigger>
            <TabsTrigger value="enterprise">Enterprise</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="network" className="space-y-6">
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
          </TabsContent>
          
          <TabsContent value="composer" className="space-y-6">
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
          </TabsContent>
          
          <TabsContent value="pow" className="space-y-6">
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
          </TabsContent>
          
          <TabsContent value="identity" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="lightning" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="enterprise" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="pricing">
            <Suspense fallback={<ComponentSkeleton />}>
              <PricingPage />
            </Suspense>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};

export default Index;
