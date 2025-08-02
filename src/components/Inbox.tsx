import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Zap
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Types for inbox functionality
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

// Mock data for demonstration
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
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
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
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
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
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    isRead: true,
    isStarred: false,
    isArchived: false,
    hasAttachments: true,
    priority: 'high',
    category: 'inbox'
  },
  {
    id: '4',
    from: {
      did: 'did:btc:current-user',
      displayName: 'You'
    },
    to: ['did:btc:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'],
    subject: 'Re: Welcome to the Future of Communication',
    content: `Thank you for the welcome message!

BitComm is exactly what the world needs - true peer-to-peer communication without central authorities.

I'm excited to be part of this revolution.`,
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    isRead: true,
    isStarred: false,
    isArchived: false,
    hasAttachments: false,
    priority: 'normal',
    category: 'sent'
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
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Filter messages based on selected folder and search
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

  // Get unread count
  const unreadCount = messages.filter(m => !m.isRead && m.category === 'inbox').length;

  const handleMessageSelect = (message: Message) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      setMessages(prev => prev.map(m => 
        m.id === message.id ? { ...m, isRead: true } : m
      ));
    }
  };

  const handleStarToggle = (messageId: string) => {
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
  };

  const handleDelete = (messageId: string) => {
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, category: 'trash' } : m
    ));
    toast({
      title: "Message moved to trash",
      description: "Message moved to trash folder."
    });
  };

  const handleCompose = () => {
    setIsComposing(true);
    setSelectedMessage(null);
    setComposeData({ to: '', subject: '', content: '' });
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

    // Create new message
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
    
    if (hours < 1) {
      return 'Just now';
    } else if (hours < 24) {
      return `${Math.floor(hours)}h ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'low': return 'text-gray-400';
      default: return '';
    }
  };

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-border">
        <div className="p-4 border-b border-border">
          <Button onClick={handleCompose} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Compose
          </Button>
        </div>
        
        <div className="p-2">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="space-y-1">
            {inboxFolders.map(folder => (
              <Button
                key={folder.id}
                variant={selectedFolder === folder.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedFolder(folder.id)}
              >
                <folder.icon className={`h-4 w-4 mr-2 ${folder.color || ''}`} />
                <span className="flex-1 text-left">{folder.name}</span>
                {folder.count > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {folder.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Message List */}
      <div className="w-80 border-r border-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold capitalize">{selectedFolder}</h2>
            <Button variant="ghost" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          {unreadCount > 0 && selectedFolder === 'inbox' && (
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="divide-y divide-border">
            {filteredMessages.map(message => (
              <div
                key={message.id}
                className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedMessage?.id === message.id ? 'bg-muted' : ''
                } ${!message.isRead ? 'bg-blue-50/30 border-l-2 border-l-blue-500' : ''}`}
                onClick={() => handleMessageSelect(message)}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.from.avatar} />
                    <AvatarFallback>
                      {message.from.displayName[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium truncate ${
                        !message.isRead ? 'font-semibold' : ''
                      }`}>
                        {message.from.displayName}
                      </p>
                      <div className="flex items-center gap-1">
                        {message.isStarred && (
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        )}
                        {message.hasAttachments && (
                          <Paperclip className="h-3 w-3 text-muted-foreground" />
                        )}
                        {message.paymentRequired && (
                          <Zap className="h-3 w-3 text-bitcoin-orange" />
                        )}
                        {message.proofOfWork?.verified && (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                    </div>
                    
                    <p className={`text-sm truncate ${
                      !message.isRead ? 'font-medium' : 'text-muted-foreground'
                    } ${getPriorityColor(message.priority)}`}>
                      {message.subject}
                    </p>
                    
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {message.content.substring(0, 60)}...
                    </p>
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimestamp(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Message Content / Compose */}
      <div className="flex-1 flex flex-col">
        {isComposing ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold">New Message</h2>
            </div>
            
            <div className="flex-1 p-4 space-y-4">
              <div>
                <label className="text-sm font-medium">To:</label>
                <Input
                  placeholder="Recipient DID address..."
                  value={composeData.to}
                  onChange={(e) => setComposeData(prev => ({ ...prev, to: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Subject:</label>
                <Input
                  placeholder="Message subject..."
                  value={composeData.subject}
                  onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              
              <div className="flex-1">
                <label className="text-sm font-medium">Message:</label>
                <Textarea
                  placeholder="Write your message..."
                  value={composeData.content}
                  onChange={(e) => setComposeData(prev => ({ ...prev, content: e.target.value }))}
                  className="min-h-[300px] resize-none"
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-border">
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setIsComposing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </div>
          </div>
        ) : selectedMessage ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{selectedMessage.subject}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedMessage.from.avatar} />
                      <AvatarFallback className="text-xs">
                        {selectedMessage.from.displayName[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      {selectedMessage.from.displayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {selectedMessage.timestamp.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStarToggle(selectedMessage.id)}
                  >
                    <Star className={`h-4 w-4 ${
                      selectedMessage.isStarred ? 'text-yellow-500 fill-current' : ''
                    }`} />
                  </Button>
                  
                  <Button variant="ghost" size="sm">
                    <Reply className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArchive(selectedMessage.id)}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <ReplyAll className="h-4 w-4 mr-2" />
                        Reply All
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Forward className="h-4 w-4 mr-2" />
                        Forward
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(selectedMessage.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* Message metadata */}
              <div className="flex gap-2 mt-2">
                {selectedMessage.proofOfWork?.verified && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    PoW Verified
                  </Badge>
                )}
                {selectedMessage.paymentRequired && (
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    {selectedMessage.paymentRequired.amount} sats
                  </Badge>
                )}
                {selectedMessage.priority === 'high' && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    High Priority
                  </Badge>
                )}
              </div>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {selectedMessage.content}
                </pre>
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No message selected</h3>
              <p className="text-muted-foreground">
                Choose a message from the list to read it here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
