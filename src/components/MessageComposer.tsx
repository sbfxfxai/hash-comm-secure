import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BitCommButton } from '@/components/ui/bitcomm-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PaywallCard } from '@/components/P2PPaymentComponents';
import { lightningTools } from '@/lib/lightningToolsService';
import { webrtcP2P, type MessageEnvelope } from '@/lib/p2p/webrtc-p2p';
import { streamlinedPayments } from '@/lib/streamlined-payments';
import QRAddressDisplay from './QRAddressDisplay';
import QRAddressScanner from './QRAddressScanner';
import CreditsModal from './CreditsModal';
import { 
  computeProofOfWork, 
  encryptMessage, 
  decryptMessage,
  verifyProofOfWork,
  type BitCommMessage,
  type PoWResult 
} from '@/lib/bitcomm';
import { 
  Send, 
  Mail, 
  Lock, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Cpu,
  Hash,
  Shield,
  User,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StoredIdentity {
  privateKey: string;
  publicKey: string;
  address: string;
  name: string;
  isActive: boolean;
  created: Date;
}

interface Contact {
  address: string;
  name: string;
  publicKey: string;
  powDifficulty: number;
  lastSeen: Date;
}

export function MessageComposer() {
  const { toast } = useToast();
  
  // State management
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [powProgress, setPowProgress] = useState(0);
  const [powStats, setPowStats] = useState<PoWResult | null>(null);
  const [powDifficulty, setPowDifficulty] = useState(4);
  const [isComputing, setIsComputing] = useState(false);
  
  // Storage state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [sentMessages, setSentMessages] = useState<BitCommMessage[]>([]);
  const [identities, setIdentities] = useState<StoredIdentity[]>([]);
  const [activeIdentity, setActiveIdentity] = useState<StoredIdentity | null>(null);
  
  // Contact management
  const [newContactName, setNewContactName] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');
  const [newContactPubKey, setNewContactPubKey] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  
  // Credits management
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState(streamlinedPayments.getPaymentSummary());

  // Load data from localStorage on component mount
  useEffect(() => {
    const storedContacts = localStorage.getItem('bitcomm-contacts');
    if (storedContacts) {
      setContacts(JSON.parse(storedContacts));
    }

    const storedMessages = localStorage.getItem('bitcomm-sent-messages');
    if (storedMessages) {
      setSentMessages(JSON.parse(storedMessages));
    }

    const storedIdentities = localStorage.getItem('bitcomm-identities');
    if (storedIdentities) {
      const parsed = JSON.parse(storedIdentities);
      setIdentities(parsed);
      const active = parsed.find((id: StoredIdentity) => id.isActive);
      if (active) setActiveIdentity(active);
    }
  }, []);

  const addContact = () => {
    if (!newContactName || !newContactAddress || !newContactPubKey) {
      toast({
        title: "Missing Information",
        description: "Please fill in all contact fields",
        variant: "destructive",
      });
      return;
    }

    const newContact: Contact = {
      address: newContactAddress,
      name: newContactName,
      publicKey: newContactPubKey,
      powDifficulty: 4,
      lastSeen: new Date()
    };

    const updatedContacts = [...contacts, newContact];
    setContacts(updatedContacts);
    localStorage.setItem('bitcomm-contacts', JSON.stringify(updatedContacts));
    
    setNewContactName('');
    setNewContactAddress('');
    setNewContactPubKey('');
    setShowAddContact(false);

    toast({
      title: "Contact Added",
      description: `${newContactName} has been added to your contacts`,
    });
  };

  const selectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setRecipient(contact.address);
    setPowDifficulty(contact.powDifficulty);
  };

  const sendMessage = async () => {
    if (!message.trim() || !recipient.trim()) {
      toast({
        title: "Incomplete Message",
        description: "Please enter both message and recipient",
        variant: "destructive",
      });
      return;
    }

    if (!activeIdentity) {
      toast({
        title: "No Identity Selected",
        description: "Please select an active identity first",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    // Perform streamlined payment using the new service
    const paymentResult = await streamlinedPayments.processPayment(activeIdentity.address);

    if (!paymentResult.success) {
      if (paymentResult.error === 'insufficient_credits') {
        setShowCreditsModal(true);
        setIsSending(false);
        return;
      }
      
      toast({
        title: "Payment Required",
        description: "Please add credits to continue sending messages",
        variant: "destructive",
      });
      setIsSending(false);
      return;
    }

    console.log(`Payment successful using method: ${paymentResult.method}`);
    setIsComputing(true);

    try {
      // Compute proof-of-work
      const pow = await computeProofOfWork(
        message,
        powDifficulty,
        (nonce, hash) => {
          const progress = Math.min((nonce / (Math.pow(16, powDifficulty) / 10)) * 100, 95);
          setPowProgress(progress);
        }
      );

      setPowStats(pow);
      setPowProgress(100);
      setIsComputing(false);

      // Encrypt message
      const encryptedContent = encryptMessage(message, selectedContact?.publicKey || recipient);

      // Create message object
      const newMessage: BitCommMessage = {
        id: 'msg-' + Date.now(),
        from: activeIdentity.address,
        to: recipient,
        content: message,
        encrypted: encryptedContent,
        timestamp: new Date(),
        pow,
        delivered: false
      };

      // Create message envelope for P2P network
      const envelope: MessageEnvelope = {
        id: newMessage.id,
        message: newMessage,
        timestamp: Date.now(),
        signature: 'sender-signature-' + Date.now() // In production, use proper cryptographic signature
      };

      // Send via simple P2P network (local simulation for now)
      try {
        const success = await webrtcP2P.sendMessage(envelope);
        newMessage.delivered = success;
        
        toast({
          title: success ? "Message Sent!" : "Message Saved!",
          description: success 
            ? `Message processed successfully (${pow.computeTime.toFixed(2)}s PoW)`
            : `Message saved locally (${pow.computeTime.toFixed(2)}s PoW)`,
        });
        
        console.log(success ? '📤 Message processed' : '📝 Message saved locally');
      } catch (p2pError) {
        console.log('📝 P2P error - message saved locally:', p2pError);
        newMessage.delivered = false;
        toast({
          title: "Message Saved!",
          description: `Message saved locally (${pow.computeTime.toFixed(2)}s PoW)`,
        });
      }

      // Store sent message locally
      const updatedMessages = [newMessage, ...sentMessages];
      setSentMessages(updatedMessages);
      localStorage.setItem('bitcomm-sent-messages', JSON.stringify(updatedMessages));

      // Reset form
      setMessage('');
      setRecipient('');
      setSelectedContact(null);
      setPowProgress(0);
      setPowStats(null);

    } catch (error) {
console.error('Message send failed. Error details:', error);
      // Consider logging to a remote server for further analysis
      toast({
        title: "Send Failed",
        description: "Could not send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
      setIsComputing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 p-2 lg:p-4">
      {/* Mobile-First Message Composer */}
      <div className="lg:col-span-2 order-1 lg:order-1">
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Mail className="h-5 w-5" />
                  Compose Message
                </CardTitle>
                <CardDescription>
                  Send encrypted, PoW-protected messages via BitComm
                </CardDescription>
              </div>
              {activeIdentity && (
                <Badge variant="outline" className="flex items-center gap-2 w-fit">
                  <User className="h-3 w-3" />
                  <span className="font-mono text-xs">{activeIdentity.address.substring(0, 8)}...</span>
                </Badge>
              )}
            </div>
          </CardHeader>
          
          
          <CardContent className="space-y-6">
            {/* QR Code Display */}
            <div className="space-y-4">
              <QRAddressDisplay className="mb-6" />
            </div>

            {/* QR Code Scanner */}
            <div className="space-y-4">
              <QRAddressScanner 
                onScanComplete={(addressInfo) => setRecipient(addressInfo.address)} 
                className="mb-6"
              />
            </div>

            {/* Recipient Section - Mobile Optimized */}
            <div className="space-y-3">
              <Label htmlFor="recipient" className="text-sm font-medium">Recipient Address</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="recipient"
                  placeholder="Enter BitComm address or select contact..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="flex-1 font-mono text-sm"
                />
                <BitCommButton
                  variant="outline"
                  onClick={() => setShowAddContact(true)}
                  className="w-full sm:w-auto whitespace-nowrap"
                >
                  Add Contact
                </BitCommButton>
              </div>
              
              {selectedContact && (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedContact.name}</span>
                  <Badge variant="secondary" className="ml-auto">
                    PoW: {selectedContact.powDifficulty}
                  </Badge>
                </div>
              )}
            </div>

            {/* Message Content - Mobile Optimized */}
            <div className="space-y-3">
              <Label htmlFor="message" className="text-sm font-medium">Message</Label>
              <Textarea
                id="message"
                placeholder="Type your message here... (will be encrypted)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px] resize-none"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{message.length} characters</span>
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  End-to-end encrypted
                </span>
              </div>
            </div>

            {/* PoW Settings - Compact Mobile Layout */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Proof-of-Work Difficulty</Label>
                <Badge variant="outline" className="font-mono">
                  {powDifficulty} zeros
                </Badge>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {[3, 4, 5, 6].map((level) => (
                  <BitCommButton
                    key={level}
                    variant={powDifficulty === level ? "default" : "outline"}
                    onClick={() => setPowDifficulty(level)}
                    className="text-xs py-2"
                    disabled={isSending}
                  >
                    {level}
                  </BitCommButton>
                ))}
              </div>
              
              <p className="text-xs text-muted-foreground">
                Higher difficulty = stronger anti-spam protection (~{Math.pow(2, powDifficulty * 4 - 16) * 15}s compute time)
              </p>
            </div>

            {/* Send Progress - Mobile Optimized */}
            {isSending && (
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 animate-pulse" />
                  <span className="text-sm font-medium">
                    {isComputing ? 'Computing Proof-of-Work...' : 'Finalizing...'}
                  </span>
                </div>
                <Progress value={powProgress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{powProgress.toFixed(1)}% complete</span>
                  {powStats && (
                    <span>{powStats.computeTime.toFixed(2)}s elapsed</span>
                  )}
                </div>
              </div>
            )}

            {/* Identity Warning - Show when no active identity */}
            {!activeIdentity && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">No Active Identity</span>
                </div>
                <p className="text-xs text-yellow-700 mb-3">
                  You need to create and activate an identity before sending messages.
                </p>
                <div className="flex items-center gap-2 text-xs text-yellow-600">
                  <span>💡 Go to</span>
                  <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                    Identity Manager
                  </Badge>
                  <span>→ Create Identity → Activate it</span>
                </div>
              </div>
            )}

            {/* Credits Balance Card */}
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Credits Balance</span>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-orange-600">
                    {paymentSummary.creditsBalance} sats
                  </div>
                  <div className="text-xs text-gray-600">
                    ~{paymentSummary.messagesRemaining} messages
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Messages cost 10 sats each. Add credits via Lightning.
                </p>
                <button
                  onClick={() => setShowCreditsModal(true)}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                >
                  Add Credits
                </button>
              </div>
            </div>

            {/* Send Button - Full Width on Mobile */}
            <BitCommButton
              onClick={sendMessage}
              disabled={!message.trim() || !recipient.trim() || isSending || !activeIdentity}
              className={`w-full bg-gradient-primary py-3 transition-all ${
                !activeIdentity 
                  ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                  : 'bg-gradient-primary hover:bg-gradient-primary/90'
              }`}
            >
              {isSending ? (
                <>
                  <Cpu className="h-4 w-4 mr-2 animate-spin" />
                  {isComputing ? 'Computing...' : 'Sending...'}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {!activeIdentity ? 'Identity Required' : `Send Message (${paymentSummary.creditsBalance >= 10 ? '10 sats' : 'Add Credits'})`}
                </>
              )}
            </BitCommButton>
          </CardContent>
        </Card>
      </div>

      {/* Mobile-Optimized Sidebar */}
      <div className="order-2 lg:order-2 space-y-4 lg:space-y-6">
        {/* Quick Add Contact Modal */}
        {showAddContact && (
          <Card className="border-primary">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Add New Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="contact-name" className="text-sm">Name</Label>
                  <Input
                    id="contact-name"
                    placeholder="Contact name"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-address" className="text-sm">BitComm Address</Label>
                  <Input
                    id="contact-address"
                    placeholder="Address (40 characters)"
                    value={newContactAddress}
                    onChange={(e) => setNewContactAddress(e.target.value)}
                    className="mt-1 font-mono text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-pubkey" className="text-sm">Public Key</Label>
                  <Input
                    id="contact-pubkey"
                    placeholder="Public key for encryption"
                    value={newContactPubKey}
                    onChange={(e) => setNewContactPubKey(e.target.value)}
                    className="mt-1 font-mono text-sm"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <BitCommButton onClick={addContact} className="flex-1">
                  Add Contact
                </BitCommButton>
                <BitCommButton 
                  variant="outline" 
                  onClick={() => setShowAddContact(false)}
                  className="flex-1"
                >
                  Cancel
                </BitCommButton>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contacts List - Mobile Optimized */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-4 w-4" />
              Contacts ({contacts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contacts.length === 0 ? (
              <div className="text-center py-6 lg:py-8 text-muted-foreground">
                <User className="h-6 w-6 lg:h-8 lg:w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No contacts yet</p>
                <p className="text-xs">Add contacts to send messages</p>
              </div>
            ) : (
              <ScrollArea className="h-[180px] lg:h-[200px]">
                <div className="space-y-2">
                  {contacts.map((contact, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                        selectedContact?.address === contact.address
                          ? 'bg-primary/10 border-primary'
                          : 'bg-muted/30 border-muted hover:bg-muted/50'
                      }`}
                      onClick={() => selectContact(contact)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{contact.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          PoW {contact.powDifficulty}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {contact.address.substring(0, 12)}...{contact.address.substring(-8)}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Recent Messages - Mobile Optimized */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Sent Messages ({sentMessages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sentMessages.length === 0 ? (
              <div className="text-center py-6 lg:py-8 text-muted-foreground">
                <Mail className="h-6 w-6 lg:h-8 lg:w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No messages sent</p>
                <p className="text-xs">Your sent messages appear here</p>
              </div>
            ) : (
              <ScrollArea className="h-[250px] lg:h-[300px]">
                <div className="space-y-3">
                  {sentMessages.slice(0, 10).map((msg, index) => (
                    <div key={index} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          To: {msg.to.substring(0, 8)}...
                        </Badge>
                        <div className="flex items-center gap-1">
                          {msg.delivered ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                            <Clock className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm mb-2 line-clamp-2">
                        {msg.content.length > 60 ? `${msg.content.substring(0, 60)}...` : msg.content}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          PoW: {msg.pow.computeTime.toFixed(1)}s
                        </span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Network Status - Mobile Compact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Lock className="h-3 w-3 text-green-500" />
                  Encryption
                </span>
                <Badge variant="default" className="text-xs">Active</Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Hash className="h-3 w-3 text-blue-500" />
                  Proof-of-Work
                </span>
                <Badge variant="default" className="text-xs">Level {powDifficulty}</Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-purple-500" />
                  Identity
                </span>
                <Badge variant={activeIdentity ? "default" : "secondary"} className="text-xs">
                  {activeIdentity ? "Active" : "None"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Credits Modal */}
      <CreditsModal
        isOpen={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
        onCreditsAdded={() => {
          setPaymentSummary(streamlinedPayments.getPaymentSummary());
          toast({
            title: "Credits Updated",
            description: "Your credit balance has been refreshed",
          });
        }}
      />
    </div>
  );
}