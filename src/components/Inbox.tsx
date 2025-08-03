import React, { useState, useEffect, useRef } from 'react';
import {
    Mail,
    Search,
    Archive,
    Star,
    Trash2,
    Reply,
    ReplyAll,
    Forward,
    MoreHorizontal,
    Filter,
    Paperclip,
    Send,
    Plus,
    Inbox as InboxIcon,
    Clock,
    CheckCircle,
    AlertCircle,
    Zap,
    Menu,
    ArrowLeft,
    X,
    ChevronDown
} from 'lucide-react';

// Mock types and interfaces
interface Message {
    id: string;
    from: {
        did: string;
        displayName: string;
        avatar?: string;
    };
    to: string[];
    subject: string;
    content: string;
    timestamp: Date;
    isRead: boolean;
    isStarred: boolean;
    isArchived: boolean;
    hasAttachments: boolean;
    priority: 'low' | 'normal' | 'high';
    category: 'inbox' | 'sent' | 'drafts' | 'archive' | 'trash';
    paymentRequired?: {
        amount: number;
        currency: 'sats';
        paid: boolean;
    };
    proofOfWork?: {
        difficulty: number;
        hash: string;
        verified: boolean;
    };
}

interface InboxFolder {
    id: string;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    count: number;
    color?: string;
}

// Mock hooks
const useAuth = () => ({
    user: {
        did: 'did:btc:current-user',
        displayName: 'Current User'
    }
});

const useToast = () => ({
    toast: ({ title, description, variant }: { title: string; description: string; variant?: string }) => {
        console.log(`${title}: ${description}`);
        alert(`${title}: ${description}`);
    }
});

const useIsMobile = () => window.innerWidth < 768;

// Mock P2P network
const secureP2P = {
    addMessageHandler: (handler: never) => console.log('P2P handler added'),
    removeMessageHandler: function(handler: never) {
        return console.log('P2P handler removed');
    }
};

// Mock data
const mockMessages: Message[] = [
    {
        id: '1',
        from: {
            did: 'did:btc:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
            displayName: 'Satoshi Nakamoto',
            avatar: undefined
        },
        to: ['did:btc:current-user'],
        subject: 'Welcome to the Future of Communication',
        content: `Welcome to BitComm! This is the beginning of truly decentralized communication.

No more central authorities controlling your messages. No more permanent email addresses that become attack vectors when compromised. 

With BitComm, you control your identity, your messages are encrypted by default, and spam is economically impossible thanks to proof-of-work requirements.

The future of communication is peer-to-peer, private, and powered by Bitcoin.

Best regards,
Satoshi`,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isRead: false,
        isStarred: true,
        isArchived: false,
        hasAttachments: false,
        priority: 'high',
        category: 'inbox',
        proofOfWork: {
            difficulty: 4,
            hash: '0000a1b2c3d4e5f6...',
            verified: true
        }
    },
    {
        id: '2',
        from: {
            did: 'did:btc:3FQP4L4QHLCj1k3Qfz9Nx7z5QYjGz8',
            displayName: 'Lightning Network Dev',
            avatar: undefined
        },
        to: ['did:btc:current-user'],
        subject: 'Lightning Payment Received ⚡',
        content: `Payment confirmation for your BitComm message fee.

Amount: 10 sats
From: Lightning Network Dev
Transaction ID: lnbc10n1pw...

Your message has been processed and delivered to the recipient.

This microtransaction model ensures quality communication while keeping costs minimal.`,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        isRead: true,
        isStarred: false,
        isArchived: false,
        hasAttachments: false,
        priority: 'normal',
        category: 'inbox',
        paymentRequired: {
            amount: 10,
            currency: 'sats',
            paid: true
        }
    },
    {
        id: '3',
        from: {
            did: 'did:btc:1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
            displayName: 'Enterprise Customer',
            avatar: undefined
        },
        to: ['did:btc:current-user'],
        subject: 'Meeting Request - BitComm Enterprise Implementation',
        content: `Hi there,

We're interested in implementing BitComm for our enterprise communication needs. Could we schedule a meeting to discuss:

1. Enterprise identity management
2. Compliance and audit trails  
3. Integration with existing systems
4. Pricing for business accounts

Please let me know your availability this week.

Thanks!`,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        isRead: true,
        isStarred: false,
        isArchived: false,
        hasAttachments: true,
        priority: 'high',
        category: 'inbox'
    }
];

const inboxFolders: InboxFolder[] = [
    { id: 'inbox', name: 'Inbox', icon: InboxIcon, count: 3 },
    { id: 'sent', name: 'Sent', icon: Send, count: 1 },
    { id: 'drafts', name: 'Drafts', icon: Clock, count: 0 },
    { id: 'starred', name: 'Starred', icon: Star, count: 1, color: 'text-yellow-500' },
    { id: 'archive', name: 'Archive', icon: Archive, count: 0 },
    { id: 'trash', name: 'Trash', icon: Trash2, count: 0 }
];

export const Inbox: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>(mockMessages);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [selectedFolder, setSelectedFolder] = useState('inbox');
    const [searchQuery, setSearchQuery] = useState('');
    const [isComposing, setIsComposing] = useState(false);
    const [composeData, setComposeData] = useState({
        to: '',
        subject: '',
        content: ''
    });
    const [showDropdown, setShowDropdown] = useState<string | null>(null);

    // Mobile state management
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentView, setCurrentView] = useState<'folders' | 'messages' | 'content'>('folders');
    const isMobile = useIsMobile();

    const { user } = useAuth();
    const { toast } = useToast();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle P2P messages (mock implementation)
    useEffect(() => {
        // Mock P2P setup
        const cleanup = () => {
            console.log('P2P cleanup');
        };
        return cleanup;
    }, [toast, user]);

    // Filter messages
    const filteredMessages = messages.filter(message => {
        const matchesFolder = selectedFolder === 'starred'
            ? message.isStarred
            : message.category === selectedFolder || (selectedFolder === 'inbox' && !message.isArchived);

        const matchesSearch = searchQuery === '' ||
            message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            message.from.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            message.content.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesFolder && matchesSearch;
    });

    const unreadCount = messages.filter(m => !m.isRead && m.category === 'inbox').length;

    const handleMessageSelect = (message: Message) => {
        setSelectedMessage(message);
        if (!message.isRead) {
            setMessages(prev => prev.map(m =>
                m.id === message.id ? { ...m, isRead: true } : m
            ));
        }
        if (isMobile) {
            setCurrentView('content');
        }
    };

    const handleStarToggle = (messageId: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setMessages(prev => prev.map(m =>
            m.id === messageId ? { ...m, isStarred: !m.isStarred } : m
        ));
    };

    const handleArchive = (messageId: string) => {
        setMessages(prev => prev.map(m =>
            m.id === messageId ? { ...m, isArchived: true, category: 'archive' } : m
        ));
        toast({
            title: "Message archived",
            description: "Message moved to archive folder."
        });
        setShowDropdown(null);
    };

    const handleDelete = (messageId: string) => {
        setMessages(prev => prev.map(m =>
            m.id === messageId ? { ...m, category: 'trash' } : m
        ));
        toast({
            title: "Message moved to trash",
            description: "Message moved to trash folder."
        });
        setShowDropdown(null);
    };

    const handleCompose = () => {
        setIsComposing(true);
        setSelectedMessage(null);
        setComposeData({ to: '', subject: '', content: '' });
        if (isMobile) {
            setCurrentView('content');
        }
    };

    const handleSendMessage = () => {
        if (!composeData.to || !composeData.subject || !composeData.content) {
            toast({
                title: "Missing fields",
                description: "Please fill in all required fields.",
                variant: "destructive"
            });
            return;
        }

        const newMessage: Message = {
            id: Date.now().toString(),
            from: {
                did: user?.did || 'did:btc:current-user',
                displayName: user?.displayName || 'You'
            },
            to: [composeData.to],
            subject: composeData.subject,
            content: composeData.content,
            timestamp: new Date(),
            isRead: true,
            isStarred: false,
            isArchived: false,
            hasAttachments: false,
            priority: 'normal',
            category: 'sent'
        };

        setMessages(prev => [newMessage, ...prev]);
        setIsComposing(false);
        setComposeData({ to: '', subject: '', content: '' });

        toast({
            title: "Message sent",
            description: "Your encrypted message has been sent successfully."
        });
    };

    const formatTimestamp = (timestamp: Date) => {
        const now = new Date();
        const diff = now.getTime() - timestamp.getTime();
        const hours = diff / (1000 * 60 * 60);

        if (hours < 1) return 'Just now';
        else if (hours < 24) return `${Math.floor(hours)}h ago`;
        else return timestamp.toLocaleDateString();
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'text-red-500';
            case 'low': return 'text-gray-400';
            default: return '';
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Mobile view rendering
    if (isMobile) {
        if (currentView === 'folders') {
            return (
                <div className="h-full bg-white">
                    <div className="p-4 border-b">
                        <button
                            onClick={handleCompose}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Compose
                        </button>
                    </div>

                    <div className="p-4">
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search messages..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div className="space-y-1">
                            {inboxFolders.map(folder => (
                                <button
                                    key={folder.id}
                                    onClick={() => {
                                        setSelectedFolder(folder.id);
                                        setCurrentView('messages');
                                    }}
                                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${selectedFolder === folder.id
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'hover:bg-gray-100'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <folder.icon className={`w-4 h-4 ${folder.color || ''}`} />
                                        <span>{folder.name}</span>
                                    </div>
                                    {folder.count > 0 && (
                                        <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                                            {folder.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        if (currentView === 'messages') {
            return (
                <div className="h-full bg-white">
                    <div className="flex items-center justify-between p-4 border-b">
                        <button
                            onClick={() => setCurrentView('folders')}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h2 className="font-semibold capitalize">{selectedFolder}</h2>
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="divide-y">
                        {filteredMessages.map(message => (
                            <div
                                key={message.id}
                                className={`p-4 cursor-pointer hover:bg-gray-50 ${!message.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                    }`}
                                onClick={() => handleMessageSelect(message)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                                        {getInitials(message.from.displayName)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className={`font-medium truncate ${!message.isRead ? 'font-bold' : ''}`}>
                                                {message.from.displayName}
                                            </p>
                                            <span className="text-xs text-gray-500 ml-2">
                                                {formatTimestamp(message.timestamp)}
                                            </span>
                                        </div>

                                        <p className={`text-sm truncate mt-1 ${!message.isRead ? 'font-medium text-gray-900' : 'text-gray-600'
                                            }`}>
                                            {message.subject}
                                        </p>

                                        <p className="text-xs text-gray-500 truncate mt-1">
                                            {message.content.substring(0, 60)}...
                                        </p>

                                        <div className="flex items-center gap-1 mt-2">
                                            {message.isStarred && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
                                            {message.hasAttachments && <Paperclip className="w-3 h-3 text-gray-400" />}
                                            {message.paymentRequired && <Zap className="w-3 h-3 text-orange-500" />}
                                            {message.proofOfWork?.verified && <CheckCircle className="w-3 h-3 text-green-500" />}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
    }

    // Desktop view
    return (
        <div className="h-full flex bg-white">
            {/* Sidebar */}
            <div className={`${isMobile ? 'hidden' : 'w-64'} border-r border-gray-200`}>
                <div className="p-4 border-b border-gray-200">
                    <button
                        onClick={handleCompose}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Compose
                    </button>
                </div>

                <div className="p-4">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search messages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>

                    <div className="space-y-1">
                        {inboxFolders.map(folder => (
                            <button
                                key={folder.id}
                                onClick={() => setSelectedFolder(folder.id)}
                                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${selectedFolder === folder.id
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'hover:bg-gray-100'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <folder.icon className={`w-4 h-4 ${folder.color || ''}`} />
                                    <span>{folder.name}</span>
                                </div>
                                {folder.count > 0 && (
                                    <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                                        {folder.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Message List */}
            <div className={`${isMobile ? 'hidden' : 'w-80'} border-r border-gray-200`}>
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold capitalize">{selectedFolder}</h2>
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                    {unreadCount > 0 && selectedFolder === 'inbox' && (
                        <p className="text-sm text-gray-500 mt-1">
                            {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
                        </p>
                    )}
                </div>

                <div className="overflow-y-auto h-[calc(100vh-200px)]">
                    <div className="divide-y">
                        {filteredMessages.map(message => (
                            <div
                                key={message.id}
                                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedMessage?.id === message.id ? 'bg-gray-100' : ''
                                    } ${!message.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                                onClick={() => handleMessageSelect(message)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                                        {getInitials(message.from.displayName)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className={`text-sm font-medium truncate ${!message.isRead ? 'font-bold' : ''}`}>
                                                {message.from.displayName}
                                            </p>
                                            <div className="flex items-center gap-1">
                                                {message.isStarred && (
                                                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                                )}
                                                {message.hasAttachments && (
                                                    <Paperclip className="w-3 h-3 text-gray-400" />
                                                )}
                                                {message.paymentRequired && (
                                                    <Zap className="w-3 h-3 text-orange-500" />
                                                )}
                                                {message.proofOfWork?.verified && (
                                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                                )}
                                            </div>
                                        </div>

                                        <p className={`text-sm truncate ${!message.isRead ? 'font-medium' : 'text-gray-600'
                                            } ${getPriorityColor(message.priority)}`}>
                                            {message.subject}
                                        </p>

                                        <p className="text-xs text-gray-500 truncate mt-1">
                                            {message.content.substring(0, 60)}...
                                        </p>

                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatTimestamp(message.timestamp)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Message Content / Compose */}
            <div className="flex-1 flex flex-col">
                {isComposing ? (
                    <div className="flex-1 flex flex-col">
                        {isMobile && (
                            <div className="flex items-center justify-between p-4 border-b">
                                <button
                                    onClick={() => setCurrentView('messages')}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <h2 className="font-semibold">New Message</h2>
                                <div></div>
                            </div>
                        )}

                        {!isMobile && (
                            <div className="p-4 border-b border-gray-200">
                                <h2 className="font-semibold">New Message</h2>
                            </div>
                        )}

                        <div className="flex-1 p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">To:</label>
                                <input
                                    type="text"
                                    placeholder="Recipient DID address..."
                                    value={composeData.to}
                                    onChange={(e) => setComposeData(prev => ({ ...prev, to: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
                                <input
                                    type="text"
                                    placeholder="Message subject..."
                                    value={composeData.subject}
                                    onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message:</label>
                                <textarea
                                    placeholder="Write your message..."
                                    value={composeData.content}
                                    onChange={(e) => setComposeData(prev => ({ ...prev, content: e.target.value }))}
                                    className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-200">
                            <div className="flex justify-between">
                                <button
                                    onClick={() => {
                                        setIsComposing(false);
                                        if (isMobile) setCurrentView('messages');
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendMessage}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    Send Message
                                </button>
                            </div>
                        </div>
                    </div>
                ) : selectedMessage ? (
                    <div className="flex-1 flex flex-col">
                        <div className="p-4 border-b border-gray-200">
                            {isMobile && (
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        onClick={() => setCurrentView('messages')}
                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div></div>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="font-semibold">{selectedMessage.subject}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                                            {getInitials(selectedMessage.from.displayName)}
                                        </div>
                                        <span className="text-sm text-gray-600">
                                            {selectedMessage.from.displayName}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {selectedMessage.timestamp.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleStarToggle(selectedMessage.id)}
                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                    >
                                        <Star className={`w-4 h-4 ${selectedMessage.isStarred ? 'text-yellow-500 fill-current' : 'text-gray-400'
                                            }`} />
                                    </button>

                                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                                        <Reply className="w-4 h-4" />
                                    </button>

                                    <button
                                        onClick={() => handleArchive(selectedMessage.id)}
                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                    >
                                        <Archive className="w-4 h-4" />
                                    </button>

                                    <div className="relative" ref={dropdownRef}>
                                        <button
                                            onClick={() => setShowDropdown(showDropdown === selectedMessage.id ? null : selectedMessage.id)}
                                            className="p-2 hover:bg-gray-100 rounded-lg"
                                        >
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>

                                        {showDropdown === selectedMessage.id && (
                                            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                                <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2">
                                                    <ReplyAll className="w-4 h-4" />
                                                    Reply All
                                                </button>
                                                <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2">
                                                    <Forward className="w-4 h-4" />
                                                    Forward
                                                </button>
                                                <div className="border-t border-gray-200 my-1"></div>
                                                <button
                                                    onClick={() => handleDelete(selectedMessage.id)}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 text-red-600 flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Message metadata */}
                            <div className="flex gap-2 mt-2">
                                {selectedMessage.proofOfWork?.verified && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        PoW Verified
                                    </span>
                                )}
                                {selectedMessage.paymentRequired && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                        <Zap className="w-3 h-3 mr-1" />
                                        {selectedMessage.paymentRequired.amount} sats
                                    </span>
                                )}
                                {selectedMessage.priority === 'high' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        High Priority
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 p-4 overflow-y-auto">
                            <div className="prose prose-sm max-w-none">
                                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-900">
                                    {selectedMessage.content}
                                </pre>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h2 className="text-lg font-medium text-gray-900">No message selected</h2>
                            <p className="text-gray-500">
                                Choose a message from the list to read it here
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};