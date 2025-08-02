import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mail, 
  Send, 
  Plus, 
  Search, 
  Star, 
  Archive, 
  Trash2, 
  Reply,
  Settings,
  Users,
  Shield,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Simplified message interface - no technical details
interface SimpleMessage {
  id: string;
  from: string; // Just the username, not full DID
  fromName: string;
  to: string;
  subject: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  isSecure: boolean; // Simplified security indicator
}

// Mock simplified messages
const simplifiedMessages: SimpleMessage[] = [
  {
    id: '1',
    from: 'satoshi',
    fromName: 'Satoshi Nakamoto',
    to: 'you',
    subject: 'Welcome to Secure Email!',
    content: `Hi there!\n\nWelcome to the future of email. Your messages are now completely secure and spam-free.\n\nNo more worrying about privacy or unwanted emails. Everything just works better now.\n\nBest regards,\nSatoshi`,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: false,
    isStarred: true,
    isSecure: true
  },
  {
    id: '2',
    from: 'support',
    fromName: 'BitComm Support',
    to: 'you',
    subject: 'Your account is protected ✅',
    content: `Great news!\n\nYour email account now has military-grade protection. Here's what's working:\n\n• 100% spam blocked automatically\n• All messages encrypted\n• Lightning-fast delivery\n• No tracking or ads\n\nYou don't need to do anything - it's all automatic!\n\nHappy messaging!`,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    isRead: true,
    isStarred: false,
    isSecure: true
  },
  {
    id: '3',
    from: 'jane.doe',
    fromName: 'Jane Doe',
    to: 'you',
    subject: 'Coffee this week?',
    content: `Hey!\n\nI love this new secure email system you told me about. No more spam!\n\nWant to grab coffee this week and catch up?\n\nLet me know!\nJane`,
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    isRead: true,
    isStarred: false,
    isSecure: true
  }
];

export const SimpleApp: React.FC = () => {
  const [selectedMessage, setSelectedMessage] = useState<SimpleMessage | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    content: ''
  });
  
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSendMessage = () => {
    if (!composeData.to || !composeData.subject || !composeData.content) {
      toast({
        title: "Please fill in all fields",
        description: "To, subject, and message are required",
        variant: "destructive"
      });
      return;
    }

    // Simulate sending (hide the Lightning payment complexity)
    toast({
      title: "Message sent securely!",
      description: "Your encrypted message was delivered instantly"
    });

    setComposeData({ to: '', subject: '', content: '' });
    setIsComposing(false);
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

  const filteredMessages = simplifiedMessages.filter(message =>
    searchQuery === '' ||
    message.fromName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadCount = simplifiedMessages.filter(m => !m.isRead).length;

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Simple Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Secure Email</h1>
            <p className="text-sm text-muted-foreground">
              {user?.displayName}@bitcomm
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Shield className="h-3 w-3 mr-1" />
            Protected
          </Badge>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-64 border-r bg-gray-50">
          <div className="p-4">
            <Button 
              onClick={() => setIsComposing(true)} 
              className="w-full mb-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Message
            </Button>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between px-3 py-2 text-sm font-medium">
                <span>Inbox</span>
                {unreadCount > 0 && (
                  <Badge variant="default" className="bg-blue-500">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <div className="px-3 py-2 text-sm text-muted-foreground hover:bg-white rounded cursor-pointer">
                <Star className="h-4 w-4 inline mr-2" />
                Starred
              </div>
              <div className="px-3 py-2 text-sm text-muted-foreground hover:bg-white rounded cursor-pointer">
                <Send className="h-4 w-4 inline mr-2" />
                Sent
              </div>
              <div className="px-3 py-2 text-sm text-muted-foreground hover:bg-white rounded cursor-pointer">
                <Archive className="h-4 w-4 inline mr-2" />
                Archive
              </div>
            </div>
          </div>
        </div>

        {/* Message List */}
        <div className="w-80 border-r">
          <div className="p-4 border-b">
            <h2 className="font-semibold">
              Inbox ({filteredMessages.length})
            </h2>
          </div>
          
          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="divide-y">
              {filteredMessages.map(message => (
                <div
                  key={message.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedMessage?.id === message.id ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
                  } ${!message.isRead ? 'bg-blue-25' : ''}`}
                  onClick={() => setSelectedMessage(message)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {message.fromName[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-sm font-medium truncate ${
                          !message.isRead ? 'font-semibold text-blue-900' : 'text-gray-900'
                        }`}>
                          {message.fromName}
                        </p>
                        <div className="flex items-center gap-1">
                          {message.isStarred && (
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          )}
                          {message.isSecure && (
                            <Shield className="h-3 w-3 text-green-500" />
                          )}
                        </div>
                      </div>
                      
                      <p className={`text-sm truncate ${
                        !message.isRead ? 'font-medium text-gray-900' : 'text-gray-600'
                      }`}>
                        {message.subject}
                      </p>
                      
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {message.content.substring(0, 50)}...
                      </p>
                      
                      <p className="text-xs text-gray-400 mt-1">
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
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">New Message</h2>
              </div>
              
              <div className="flex-1 p-4 space-y-4">
                <div>
                  <Input
                    placeholder="To: john@domain.com or username@bitcomm"
                    value={composeData.to}
                    onChange={(e) => setComposeData(prev => ({ ...prev, to: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Input
                    placeholder="Subject"
                    value={composeData.subject}
                    onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                
                <div className="flex-1">
                  <Textarea
                    placeholder="Write your message..."
                    value={composeData.content}
                    onChange={(e) => setComposeData(prev => ({ ...prev, content: e.target.value }))}
                    className="min-h-[300px] resize-none"
                  />
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground bg-green-50 p-3 rounded">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>This message will be automatically encrypted and spam-protected</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t bg-gray-50">
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setIsComposing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-700">
                    <Send className="h-4 w-4 mr-2" />
                    Send Securely
                  </Button>
                </div>
              </div>
            </div>
          ) : selectedMessage ? (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">{selectedMessage.subject}</h2>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Reply className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Star className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {selectedMessage.fromName[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedMessage.fromName}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{selectedMessage.from}@bitcomm</span>
                      <span>•</span>
                      <span>{selectedMessage.timestamp.toLocaleString()}</span>
                      {selectedMessage.isSecure && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1 text-green-600">
                            <Shield className="h-3 w-3" />
                            <span>Encrypted</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
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
                <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Select a message to read
                </h3>
                <p className="text-gray-500">
                  Choose a message from your inbox to view it here
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleApp;
