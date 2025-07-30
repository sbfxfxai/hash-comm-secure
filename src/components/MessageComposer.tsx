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
  User
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
  const [identities, setIdentities] = useState<StoredIdentity[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<BitCommMessage[]>([]);
  const [activeIdentity, setActiveIdentity] = useState<StoredIdentity | null>(null);
  
  // Compose form state
  const [recipientAddress, setRecipientAddress] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [powDifficulty, setPowDifficulty] = useState(4);
  
  // Sending state
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [currentNonce, setCurrentNonce] = useState(0);
  
  // Contact management
  const [newContactName, setNewContactName] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');
  const [isAddingContact, setIsAddingContact] = useState(false);
  
  const { toast } = useToast();

  // Load data from localStorage
  useEffect(() => {
    loadIdentities();
    loadContacts();
    loadMessages();
  }, []);

  const loadIdentities = () => {
    const stored = localStorage.getItem('bitcomm-identities');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const identitiesWithDates = parsed.map((id: any) => ({
          ...id,
          created: new Date(id.created)
        }));
        setIdentities(identitiesWithDates);
        
        const active = identitiesWithDates.find((id: StoredIdentity) => id.isActive);
        setActiveIdentity(active || null);
      } catch (error) {
        console.error('Failed to load identities:', error);
      }
    }
  };

  const loadContacts = () => {
    const stored = localStorage.getItem('bitcomm-contacts');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setContacts(parsed.map((contact: any) => ({
          ...contact,
          lastSeen: new Date(contact.lastSeen)
        })));
      } catch (error) {
        console.error('Failed to load contacts:', error);
      }
    }
  };

  const loadMessages = () => {
    const stored = localStorage.getItem('bitcomm-messages');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    }
  };

  const saveContacts = (newContacts: Contact[]) => {
    localStorage.setItem('bitcomm-contacts', JSON.stringify(newContacts));
    setContacts(newContacts);
  };

  const saveMessages = (newMessages: BitCommMessage[]) => {
    localStorage.setItem('bitcomm-messages', JSON.stringify(newMessages));
    setMessages(newMessages);
  };

  const addContact = () => {
    if (!newContactName.trim() || !newContactAddress.trim()) {
      toast({
        title: "Invalid Contact",
        description: "Please enter both name and address.",
        variant: "destructive",
      });
      return;
    }

    // Check if contact already exists
    if (contacts.some(c => c.address === newContactAddress)) {
      toast({
        title: "Contact Exists",
        description: "This address is already in your contacts.",
        variant: "destructive",
      });
      return;
    }

    const newContact: Contact = {
      address: newContactAddress.trim(),
      name: newContactName.trim(),
      publicKey: '', // In real implementation, this would be fetched from blockchain
      powDifficulty: 4,
      lastSeen: new Date()
    };

    const updatedContacts = [...contacts, newContact];
    saveContacts(updatedContacts);
    
    setNewContactName('');
    setNewContactAddress('');
    setIsAddingContact(false);
    
    toast({
      title: "Contact Added",
      description: `${newContact.name} has been added to your contacts.`,
    });
  };

  const sendMessage = async () => {
    if (!activeIdentity) {
      toast({
        title: "No Identity",
        description: "Please create an identity first.",
        variant: "destructive",
      });
      return;
    }

    if (!recipientAddress.trim() || !messageContent.trim()) {
      toast({
        title: "Incomplete Message",
        description: "Please enter recipient address and message content.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    setSendingProgress(0);
    
    try {
      // Step 1: Encrypt the message
      const recipientPublicKey = recipientAddress; // Simplified - in real app, fetch from blockchain
      const encryptedContent = encryptMessage(messageContent, recipientPublicKey);
      
      // Step 2: Compute proof-of-work
      const powResult = await computeProofOfWork(
        messageContent,
        powDifficulty,
        (nonce, hash) => {
          setCurrentNonce(nonce);
          setSendingProgress((nonce % 10000) / 100);
        }
      );

      // Step 3: Create message object
      const newMessage: BitCommMessage = {
        id: Date.now().toString(),
        from: activeIdentity.address,
        to: recipientAddress,
        content: messageContent,
        encrypted: encryptedContent,
        timestamp: new Date(),
        pow: powResult,
        delivered: true // Simulated P2P delivery
      };

      // Step 4: Save message
      const updatedMessages = [...messages, newMessage];
      saveMessages(updatedMessages);

      // Step 5: Reset form
      setRecipientAddress('');
      setMessageContent('');
      setSendingProgress(0);
      
      toast({
        title: "Message Sent!",
        description: `Message delivered with ${powResult.difficulty}-difficulty PoW in ${powResult.computeTime.toFixed(2)}s`,
      });

    } catch (error) {
      toast({
        title: "Send Failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getContactName = (address: string) => {
    const contact = contacts.find(c => c.address === address);
    return contact ? contact.name : `${address.substring(0, 8)}...${address.substring(-6)}`;
  };

  if (!activeIdentity) {
    return (
      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <User className="h-8 w-8 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-yellow-900">No Active Identity</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Please create and activate an identity in the Identity Manager tab before sending messages.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Identity Display */}
      <Card className="border-bitcoin-orange/20 bg-bitcoin-orange/5">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-bitcoin-orange rounded-full flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold">{activeIdentity.name}</h4>
              <p className="text-sm text-muted-foreground font-mono">
                {activeIdentity.address.substring(0, 20)}...
              </p>
            </div>
            <Badge className="bg-bitcoin-orange text-white ml-auto">Active</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Message Composer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-bitcoin-orange" />
            Compose Message
          </CardTitle>
          <CardDescription>
            Send encrypted, PoW-protected messages via BitComm network
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <div className="flex gap-2">
              <Input
                id="recipient"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="Enter BitComm address..."
                className="flex-1"
              />
              <BitCommButton
                onClick={() => setIsAddingContact(!isAddingContact)}
                variant="outline"
                size="sm"
              >
                Add Contact
              </BitCommButton>
            </div>
            
            {/* Quick contact selection */}
            {contacts.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {contacts.slice(0, 3).map((contact) => (
                  <Badge
                    key={contact.address}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => setRecipientAddress(contact.address)}
                  >
                    {contact.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message Content</Label>
            <Textarea
              id="message"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[120px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Proof-of-Work Difficulty: {powDifficulty}</Label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={3}
                max={6}
                value={powDifficulty}
                onChange={(e) => setPowDifficulty(Number(e.target.value))}
                className="flex-1"
              />
              <Badge variant="outline">
                ~{Math.pow(16, powDifficulty).toLocaleString()} hashes
              </Badge>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Fast (3)</span>
              <span>Balanced (4-5)</span>
              <span>Secure (6)</span>
            </div>
          </div>

          <BitCommButton
            onClick={sendMessage}
            disabled={isSending || !recipientAddress.trim() || !messageContent.trim()}
            variant={isSending ? "mining" : "hero"}
            size="lg"
            className="w-full"
          >
            {isSending ? (
              <>
                <Cpu className="mr-2 h-4 w-4 animate-spin" />
                Computing PoW... {currentNonce.toLocaleString()}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </>
            )}
          </BitCommButton>

          {isSending && (
            <div className="space-y-2">
              <Progress value={sendingProgress} className="w-full" />
              <div className="text-sm text-center text-muted-foreground">
                <Lock className="inline h-3 w-3 mr-1" />
                Encrypting & computing proof-of-work...
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Contact Form */}
      {isAddingContact && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-blue-900">Add New Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact-name">Contact Name</Label>
                <Input
                  id="contact-name"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="e.g., Alice, Bob..."
                />
              </div>
              <div>
                <Label htmlFor="contact-address">BitComm Address</Label>
                <Input
                  id="contact-address"
                  value={newContactAddress}
                  onChange={(e) => setNewContactAddress(e.target.value)}
                  placeholder="40-character address..."
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <BitCommButton
                onClick={() => setIsAddingContact(false)}
                variant="outline"
              >
                Cancel
              </BitCommButton>
              <BitCommButton onClick={addContact} variant="hero">
                Add Contact
              </BitCommButton>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-bitcoin-orange" />
            Message History ({messages.length})
          </CardTitle>
          <CardDescription>
            Your sent and received BitComm messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No messages yet. Send your first BitComm message!</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {messages
                  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                  .map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg border ${
                        message.from === activeIdentity.address
                          ? 'bg-bitcoin-orange/5 border-bitcoin-orange/20 ml-8'
                          : 'bg-gray-50 border-gray-200 mr-8'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium">
                            {message.from === activeIdentity.address ? 'You' : getContactName(message.from)}
                            {message.from !== activeIdentity.address && (
                              <span className="text-xs text-muted-foreground ml-2">
                                → {getContactName(message.to)}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {message.timestamp.toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            <Hash className="h-3 w-3 mr-1" />
                            PoW {message.pow.difficulty}
                          </Badge>
                          {message.delivered && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm mb-2">{message.content}</p>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-4">
                          <span>Nonce: {message.pow.nonce.toLocaleString()}</span>
                          <span>Time: {message.pow.computeTime.toFixed(2)}s</span>
                          <span className="font-mono">
                            Hash: {message.pow.hash.substring(0, 16)}...
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Contacts List */}
      {contacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-bitcoin-orange" />
              Contacts ({contacts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contacts.map((contact) => (
                <div
                  key={contact.address}
                  className="p-3 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => setRecipientAddress(contact.address)}
                >
                  <div className="font-medium">{contact.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {contact.address.substring(0, 20)}...
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      PoW {contact.powDifficulty}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}