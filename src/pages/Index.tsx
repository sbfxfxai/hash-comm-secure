import { ProofOfWorkDemo } from '@/components/ProofOfWorkDemo';
import { IdentityManager } from '@/components/IdentityManager';
import { MessageComposer } from '@/components/MessageComposer';
import { P2PNetworkStatus } from '@/components/P2PNetworkStatus';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BitCommButton } from '@/components/ui/bitcomm-button';
import { Bitcoin, Shield, Zap, Users } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20">
        <div className="absolute inset-0 bg-gradient-glow opacity-50"></div>
        <div className="relative container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-6">
            <Bitcoin className="h-16 w-16 text-white mr-4" />
            <h1 className="text-5xl font-bold text-white">BitComm</h1>
          </div>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Revolutionary decentralized communication that fixes email's problems using Bitcoin's proven hash principles. 
            Say goodbye to spam, data breaches, and centralized control.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-white">
              <Shield className="h-4 w-4" />
              <span>Bitcoin-Secured Identity</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-white">
              <Zap className="h-4 w-4" />
              <span>Proof-of-Work Anti-Spam</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-white">
              <Users className="h-4 w-4" />
              <span>P2P Decentralized</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12">
        <Tabs defaultValue="network" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="network">P2P Network</TabsTrigger>
            <TabsTrigger value="composer">Message Composer</TabsTrigger>
            <TabsTrigger value="pow">Proof-of-Work Demo</TabsTrigger>
            <TabsTrigger value="identity">Identity Manager</TabsTrigger>
          </TabsList>
          
          <TabsContent value="network" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">P2P Network Layer</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Connect to the decentralized BitComm network. No central servers, 
                just peer-to-peer communication with Bitcoin-level security.
              </p>
            </div>
            <P2PNetworkStatus />
          </TabsContent>
          
          <TabsContent value="composer" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Send Encrypted Messages</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Experience the full BitComm workflow - compose, encrypt, and send messages protected by 
                Bitcoin-style proof-of-work anti-spam technology.
              </p>
            </div>
            <MessageComposer />
          </TabsContent>
          
          <TabsContent value="pow" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Experience Bitcoin's Anti-Spam Power</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See how requiring computational work for each message makes spam economically impossible 
                while keeping legitimate communication free and instant.
              </p>
            </div>
            <ProofOfWorkDemo />
          </TabsContent>
          
          <TabsContent value="identity" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Decentralized Identity Management</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Create Bitcoin blockchain-verified identities that you fully control. 
                No more permanent email addresses you can't revoke when compromised.
              </p>
            </div>
            <IdentityManager />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};

export default Index;
