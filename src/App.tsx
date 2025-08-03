import React, { useState, useEffect } from 'react';
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
    Zap,
    QrCode,
    Plus,
    X,
    Camera
} from 'lucide-react';

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

interface BitCommMessage {
    id: string;
    from: string;
    to: string;
    content: string;
    encrypted: string;
    timestamp: Date;
    pow: {
        nonce: number;
        hash: string;
        computeTime: number;
        difficulty: number;
    };
    delivered: boolean;
}

// Mock hooks and services for demo
interface ToastProps {
    title: string;
    description: string;
    variant?: 'default' | 'destructive';
}

const useToast = () => ({
    toast: ({ title, description, variant }: ToastProps) => {
        console.log(`Toast: ${title} - ${description} (${variant || 'default'})`);
    }
});

// Mock services
interface PoWResult {
    nonce: number;
    hash: string;
    computeTime: number;
    difficulty: number;
}

interface PaymentResult {
    success: boolean;
    method?: string;
    error?: string;
}

interface PaymentSummary {
    creditsBalance: number;
    messagesRemaining: number;
}

interface MessageEnvelope {
    id: string;
    message: BitCommMessage;
    timestamp: number;
}

const mockServices = {
    computeProofOfWork: async (
        message: string,
        difficulty: number,
        onProgress: (nonce: number, hash: string) => void
    ): Promise<PoWResult> => {
        return new Promise<PoWResult>((resolve) => {
            let nonce = 0;
            const startTime = Date.now();
            const interval = setInterval(() => {
                nonce += Math.floor(Math.random() * 1000) + 100;
                const hash = '0'.repeat(difficulty) + Math.random().toString(16).substring(2, 10);
                onProgress(nonce, hash);

                if (nonce > Math.pow(16, difficulty) / 20) {
                    clearInterval(interval);
                    resolve({
                        nonce,
                        hash,
                        computeTime: (Date.now() - startTime) / 1000,
                        difficulty
                    });
                }
            }, 100);
        });
    },

    encryptMessage: (message: string, publicKey: string) => {
        return `encrypted_${btoa(message)}_${publicKey.substring(0, 8)}`;
    },

    streamlinedPayments: {
        processPayment: async (address: string): Promise<PaymentResult> => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return { success: true, method: 'credits' };
        },
        getPaymentSummary: (): PaymentSummary => ({
            creditsBalance: 250,
            messagesRemaining: 25
        })
    },

    secureP2P: {
        sendMessage: async (envelope: MessageEnvelope): Promise<boolean> => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return Math.random() > 0.3; // 70% success rate
        },
        getNetworkStats: () => ({
            isOnline: true,
            peers: 12,
            messages: 45
        }),
        initialize: async (address: string): Promise<void> => {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
};

export default function App() {
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
    const [contacts, setContacts] = useState<Contact[]>([
        {
            address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            name: 'Alice Johnson',
            publicKey: 'pubkey_alice_xyz123',
            powDifficulty: 4,
            lastSeen: new Date()
        },
        {
            address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
            name: 'Bob Smith',
            publicKey: 'pubkey_bob_abc456',
            powDifficulty: 5,
            lastSeen: new Date()
        }
    ]);
    const [sentMessages, setSentMessages] = useState<BitCommMessage[]>([]);
    const [identities, setIdentities] = useState<StoredIdentity[]>([]);
    const [activeIdentity, setActiveIdentity] = useState<StoredIdentity | null>({
        privateKey: 'priv_key_demo',
        publicKey: 'pub_key_demo',
        address: 'bc1demo123456789abcdef',
        name: 'Demo Identity',
        isActive: true,
        created: new Date()
    });

    // Contact management
    const [newContactName, setNewContactName] = useState('');
    const [newContactAddress, setNewContactAddress] = useState('');
    const [newContactPubKey, setNewContactPubKey] = useState('');
    const [showAddContact, setShowAddContact] = useState(false);

    // Credits management
    const [showCreditsModal, setShowCreditsModal] = useState(false);
    const [paymentSummary, setPaymentSummary] = useState(mockServices.streamlinedPayments.getPaymentSummary());
    const [showQRDisplay, setShowQRDisplay] = useState(false);
    const [showQRScanner, setShowQRScanner] = useState(false);

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

        // Perform streamlined payment using mock service
        const paymentResult = await mockServices.streamlinedPayments.processPayment(activeIdentity.address);

        if (!paymentResult.success) {
            setShowCreditsModal(true);
            setIsSending(false);
            return;
        }

        setIsComputing(true);

        try {
            // Compute proof-of-work
            const pow = await mockServices.computeProofOfWork(
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
            const encryptedContent = mockServices.encryptMessage(message, selectedContact?.publicKey || recipient);

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

            // Send via secure P2P network
            try {
                const success = await mockServices.secureP2P.sendMessage({
                    id: newMessage.id,
                    message: newMessage,
                    timestamp: Date.now()
                });
                newMessage.delivered = success;

                toast({
                    title: success ? "Message Sent Securely!" : "Message Saved!",
                    description: success
                        ? `Message sent via encrypted P2P network (${pow.computeTime.toFixed(2)}s PoW)`
                        : `Message saved locally (${pow.computeTime.toFixed(2)}s PoW)`,
                });
            } catch (p2pError) {
                newMessage.delivered = false;
                toast({
                    title: "Message Saved!",
                    description: `Message saved locally (${pow.computeTime.toFixed(2)}s PoW) - P2P error`,
                });
            }

            // Store sent message locally
            const updatedMessages = [newMessage, ...sentMessages];
            setSentMessages(updatedMessages);

            // Reset form
            setMessage('');
            setRecipient('');
            setSelectedContact(null);
            setPowProgress(0);
            setPowStats(null);

        } catch (error) {
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 lg:gap-6 p-2 md:p-3 lg:p-4">
            {/* Message Composer */}
            <div className="md:col-span-2 order-1">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-fit">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                                    <Mail className="h-5 w-5" />
                                    Compose Message
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Send encrypted, PoW-protected messages via BitComm
                                </p>
                            </div>
                            {activeIdentity && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 border border-gray-300 rounded-full w-fit">
                                    <User className="h-3 w-3" />
                                    <span className="font-mono text-xs">{activeIdentity.address.substring(0, 8)}...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-4 space-y-6">
                        {/* QR Code Display and Scanner */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => setShowQRDisplay(!showQRDisplay)}
                                className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                            >
                                <QrCode className="h-5 w-5 text-gray-500" />
                                <span className="text-sm text-gray-600">Show My QR Code</span>
                            </button>

                            <button
                                onClick={() => setShowQRScanner(!showQRScanner)}
                                className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                            >
                                <Camera className="h-5 w-5 text-gray-500" />
                                <span className="text-sm text-gray-600">Scan QR Code</span>
                            </button>
                        </div>

                        {showQRDisplay && (
                            <div className="p-4 bg-gray-50 rounded-lg border">
                                <div className="text-center">
                                    <div className="w-32 h-32 bg-white border-2 border-gray-300 rounded-lg mx-auto mb-3 flex items-center justify-center">
                                        <QrCode className="h-16 w-16 text-gray-400" />
                                    </div>
                                    <p className="text-xs text-gray-600 font-mono break-all">
                                        {activeIdentity?.address || 'No active identity'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {showQRScanner && (
                            <div className="p-4 bg-gray-50 rounded-lg border">
                                <div className="text-center">
                                    <div className="w-32 h-32 bg-gray-200 border-2 border-dashed border-gray-400 rounded-lg mx-auto mb-3 flex items-center justify-center">
                                        <Camera className="h-16 w-16 text-gray-400" />
                                    </div>
                                    <p className="text-sm text-gray-600">Camera scanner would appear here</p>
                                    <button
                                        onClick={() => setRecipient('bc1qexample123456789')}
                                        className="mt-2 text-xs text-blue-600 hover:text-blue-700"
                                    >
                                        Simulate scan result
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Recipient Section */}
                        <div className="space-y-3">
                            <label htmlFor="recipient" className="block text-sm font-medium text-gray-700">Recipient Address</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    id="recipient"
                                    type="text"
                                    placeholder="Enter BitComm address or select contact..."
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                                <button
                                    onClick={() => setShowAddContact(true)}
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent whitespace-nowrap"
                                >
                                    Add Contact
                                </button>
                            </div>

                            {selectedContact && (
                                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                    <User className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium">{selectedContact.name}</span>
                                    <span className="ml-auto px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                                        PoW: {selectedContact.powDifficulty}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Message Content */}
                        <div className="space-y-3">
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                            <textarea
                                id="message"
                                placeholder="Type your message here... (will be encrypted)"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>{message.length} characters</span>
                                <span className="flex items-center gap-1">
                                    <Lock className="h-3 w-3" />
                                    End-to-end encrypted
                                </span>
                            </div>
                        </div>

                        {/* PoW Settings */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">Proof-of-Work Difficulty</label>
                                <span className="px-2 py-1 bg-gray-100 border border-gray-300 rounded-full font-mono text-sm">
                                    {powDifficulty} zeros
                                </span>
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                                {[3, 4, 5, 6].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setPowDifficulty(level)}
                                        disabled={isSending}
                                        className={`py-2 px-3 text-xs font-medium rounded-md transition-colors ${powDifficulty === level
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                            } ${isSending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>

                            <p className="text-xs text-gray-500">
                                Higher difficulty = stronger anti-spam protection (~{Math.pow(2, powDifficulty * 4 - 16) * 15}s compute time)
                            </p>
                        </div>

                        {/* Send Progress */}
                        {isSending && (
                            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Cpu className="h-4 w-4 animate-pulse text-orange-500" />
                                    <span className="text-sm font-medium">
                                        {isComputing ? 'Computing Proof-of-Work...' : 'Finalizing...'}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${powProgress}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>{powProgress.toFixed(1)}% complete</span>
                                    {powStats && (
                                        <span>{powStats.computeTime.toFixed(2)}s elapsed</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Identity Warning */}
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
                                    <span className="px-2 py-1 bg-yellow-100 border border-yellow-300 rounded text-yellow-700">
                                        Identity Manager
                                    </span>
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
                                <p className="text-xs text-gray-600">
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

                        {/* Send Button */}
                        <button
                            onClick={sendMessage}
                            disabled={!message.trim() || !recipient.trim() || isSending || !activeIdentity}
                            className={`w-full py-3 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${!activeIdentity || !message.trim() || !recipient.trim()
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700'
                                }`}
                        >
                            {isSending ? (
                                <>
                                    <Cpu className="h-4 w-4 animate-spin" />
                                    {isComputing ? 'Computing...' : 'Sending...'}
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    {!activeIdentity ? 'Identity Required' : `Send Message (${paymentSummary.creditsBalance >= 10 ? '10 sats' : 'Add Credits'})`}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <div className="order-2 space-y-3 md:space-y-4 lg:space-y-6">
                {/* Quick Add Contact Modal */}
                {showAddContact && (
                    <div className="bg-white rounded-lg shadow-sm border border-orange-200">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Add New Contact</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="space-y-3">
                                <div>
                                    <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        id="contact-name"
                                        type="text"
                                        placeholder="Contact name"
                                        value={newContactName}
                                        onChange={(e) => setNewContactName(e.target.value)}
                                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="contact-address" className="block text-sm font-medium text-gray-700">BitComm Address</label>
                                    <input
                                        id="contact-address"
                                        type="text"
                                        placeholder="Address (40 characters)"
                                        value={newContactAddress}
                                        onChange={(e) => setNewContactAddress(e.target.value)}
                                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="contact-pubkey" className="block text-sm font-medium text-gray-700">Public Key</label>
                                    <input
                                        id="contact-pubkey"
                                        type="text"
                                        placeholder="Public key for encryption"
                                        value={newContactPubKey}
                                        onChange={(e) => setNewContactPubKey(e.target.value)}
                                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={addContact}
                                    className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-md font-medium hover:bg-orange-600 transition-colors"
                                >
                                    Add Contact
                                </button>
                                <button
                                    onClick={() => setShowAddContact(false)}
                                    className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Contacts List */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Contacts ({contacts.length})
                        </h3>
                    </div>
                    <div className="p-4">
                        {contacts.length === 0 ? (
                            <div className="text-center py-4 md:py-6 lg:py-8 text-gray-500">
                                <User className="h-6 w-6 lg:h-8 lg:w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No contacts yet</p>
                                <p className="text-xs">Add contacts to send messages</p>
                            </div>
                        ) : (
                            <div className="max-h-[120px] md:max-h-[180px] lg:max-h-[200px] overflow-y-auto">
                                <div className="space-y-2">
                                    {contacts.map((contact, index) => (
                                        <div
                                            key={index}
                                            className={`p-3 rounded-lg cursor-pointer border transition-colors ${selectedContact?.address === contact.address
                                                    ? 'bg-orange-50 border-orange-200'
                                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                                }`}
                                            onClick={() => selectContact(contact)}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium text-sm">{contact.name}</span>
                                                <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                                                    PoW {contact.powDifficulty}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 font-mono">
                                                {contact.address.substring(0, 12)}...{contact.address.substring(-8)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Messages */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Sent Messages ({sentMessages.length})
                        </h3>
                    </div>
                    <div className="p-4">
                        {sentMessages.length === 0 ? (
                            <div className="text-center py-4 md:py-6 lg:py-8 text-gray-500">
                                <Mail className="h-6 w-6 lg:h-8 lg:w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No messages sent</p>
                                <p className="text-xs">Your sent messages appear here</p>
                            </div>
                        ) : (
                            <div className="max-h-[150px] md:max-h-[250px] lg:max-h-[300px] overflow-y-auto">
                                <div className="space-y-3">
                                    {sentMessages.slice(0, 10).map((msg, index) => (
                                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="px-2 py-1 bg-gray-200 border border-gray-300 rounded text-xs">
                                                    To: {msg.to.substring(0, 8)}...
                                                </span>
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

                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Hash className="h-3 w-3" />
                                                    PoW: {msg.pow.computeTime.toFixed(1)}s
                                                </span>
                                                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Network Status */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Security Status
                        </h3>
                    </div>
                    <div className="p-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">
                                    <Lock className="h-3 w-3 text-green-500" />
                                    Encryption
                                </span>
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">
                                    <Hash className="h-3 w-3 text-blue-500" />
                                    Proof-of-Work
                                </span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Level {powDifficulty}</span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">
                                    <Shield className="h-3 w-3 text-purple-500" />
                                    Identity
                                </span>
                                <span className={`px-2 py-1 text-xs rounded-full ${activeIdentity
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {activeIdentity ? "Active" : "None"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Credits Modal */}
            {showCreditsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Add Credits</h3>
                            <button
                                onClick={() => setShowCreditsModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4">
                            <div className="text-center mb-6">
                                <Zap className="h-12 w-12 text-orange-500 mx-auto mb-3" />
                                <h4 className="text-lg font-medium text-gray-900 mb-2">Low Credits</h4>
                                <p className="text-sm text-gray-600">
                                    You need more credits to send messages. Each message costs 10 sats.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Current Balance</span>
                                        <span className="font-mono font-bold text-orange-600">
                                            {paymentSummary.creditsBalance} sats
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    {[100, 500, 1000].map((amount) => (
                                        <button
                                            key={amount}
                                            onClick={() => {
                                                setPaymentSummary({
                                                    creditsBalance: paymentSummary.creditsBalance + amount,
                                                    messagesRemaining: Math.floor((paymentSummary.creditsBalance + amount) / 10)
                                                });
                                                toast({
                                                    title: "Credits Added",
                                                    description: `Added ${amount} sats to your balance`,
                                                });
                                                setShowCreditsModal(false);
                                            }}
                                            className="p-3 bg-white border border-gray-300 rounded-lg text-center hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="font-mono font-bold text-orange-600">{amount}</div>
                                            <div className="text-xs text-gray-600">sats</div>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setShowCreditsModal(false)}
                                    className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-medium hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Export the component as both default and named export for compatibility
export { App as MessageComposer };
