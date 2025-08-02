import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Search, 
  Plus, 
  Download, 
  Upload, 
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Mail,
  Tag,
  FileText,
  BarChart3,
  Shield,
  Bitcoin,
  Zap,
  CheckCircle,
  AlertCircle,
  Star,
  Send,
  UserPlus,
  FolderOpen,
  Import,
  Settings
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Enhanced contact interface for DID-based contacts
interface Contact {
  id: string;
  did: string;
  displayName: string;
  avatar?: string;
  email?: string; // Optional legacy email for migration
  tags: string[];
  category: string;
  notes: string;
  verified: boolean;
  lastContact?: Date;
  addedDate: Date;
  lightningAddress?: string;
  publicKey: string;
  reputation: number;
  blocked: boolean;
  favorite: boolean;
  metadata: {
    domain?: string;
    source: 'manual' | 'imported' | 'network' | 'payment';
    interactions: number;
    totalSatsPaid: number;
    totalSatsReceived: number;
  };
}

interface ContactGroup {
  id: string;
  name: string;
  description: string;
  contacts: string[]; // Contact IDs
  color: string;
  createdDate: Date;
}

// Mock data for demonstration
const mockContacts: Contact[] = [
  {
    id: '1',
    did: 'did:btc:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    displayName: 'Satoshi Nakamoto',
    tags: ['bitcoin', 'founder', 'vip'],
    category: 'colleagues',
    notes: 'Bitcoin creator and visionary',
    verified: true,
    addedDate: new Date('2023-01-01'),
    lastContact: new Date('2024-01-15'),
    lightningAddress: 'satoshi@lightning.network',
    publicKey: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    reputation: 100,
    blocked: false,
    favorite: true,
    metadata: {
      domain: 'lightning.network',
      source: 'network',
      interactions: 25,
      totalSatsPaid: 0,
      totalSatsReceived: 10000
    }
  },
  {
    id: '2',
    did: 'did:btc:3FQP4L4QHLCj1k3Qfz9Nx7z5QYjGz8Ab',
    displayName: 'Lightning Dev',
    email: 'dev@lightning.engineering',
    tags: ['developer', 'lightning'],
    category: 'business',
    notes: 'Lightning Network development team',
    verified: true,
    addedDate: new Date('2023-06-15'),
    lastContact: new Date('2024-01-10'),
    lightningAddress: 'dev@lightning.engineering',
    publicKey: '02f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9',
    reputation: 95,
    blocked: false,
    favorite: false,
    metadata: {
      domain: 'lightning.engineering',
      source: 'imported',
      interactions: 12,
      totalSatsPaid: 5000,
      totalSatsReceived: 3000
    }
  },
  {
    id: '3',
    did: 'did:btc:1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
    displayName: 'Enterprise Customer',
    email: 'contact@enterprise.com',
    tags: ['customer', 'enterprise', 'high-value'],
    category: 'customers',
    notes: 'Large enterprise client interested in BitComm implementation',
    verified: true,
    addedDate: new Date('2023-12-01'),
    lastContact: new Date('2024-01-02'),
    publicKey: '03661ac4b46e1e2d75c5db59e6ab8e4b6f8e4b2f4b7e8a5a3d2c1b0a9876543210',
    reputation: 88,
    blocked: false,
    favorite: true,
    metadata: {
      domain: 'enterprise.com',
      source: 'manual',
      interactions: 8,
      totalSatsPaid: 15000,
      totalSatsReceived: 0
    }
  }
];

const mockGroups: ContactGroup[] = [
  {
    id: '1',
    name: 'Bitcoin Core Team',
    description: 'Core Bitcoin developers and contributors',
    contacts: ['1'],
    color: 'orange',
    createdDate: new Date('2023-01-01')
  },
  {
    id: '2',
    name: 'Enterprise Customers',
    description: 'Business customers and partners',
    contacts: ['3'],
    color: 'blue',
    createdDate: new Date('2023-06-01')
  },
  {
    id: '3',
    name: 'Lightning Network',
    description: 'Lightning Network ecosystem contacts',
    contacts: ['1', '2'],
    color: 'yellow',
    createdDate: new Date('2023-03-01')
  }
];

const categories = [
  'colleagues',
  'customers',
  'business',
  'friends',
  'family',
  'vendors',
  'partners',
  'other'
];

export const ContactManager: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [groups, setGroups] = useState<ContactGroup[]>(mockGroups);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'reputation' | 'interactions'>('name');
  const [activeTab, setActiveTab] = useState('contacts');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // New contact form state
  const [newContact, setNewContact] = useState({
    did: '',
    displayName: '',
    email: '',
    category: 'colleagues',
    tags: '',
    notes: '',
    lightningAddress: ''
  });

  // Filter and sort contacts
  const filteredContacts = useMemo(() => {
    let filtered = contacts.filter(contact => {
      const matchesSearch = searchQuery === '' || 
        contact.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.did.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = filterCategory === 'all' || contact.category === filterCategory;

      const matchesTags = filterTags.length === 0 || 
        filterTags.some(tag => contact.tags.includes(tag));

      return matchesSearch && matchesCategory && matchesTags && !contact.blocked;
    });

    // Sort contacts
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.displayName.localeCompare(b.displayName);
        case 'date':
          return b.addedDate.getTime() - a.addedDate.getTime();
        case 'reputation':
          return b.reputation - a.reputation;
        case 'interactions':
          return b.metadata.interactions - a.metadata.interactions;
        default:
          return 0;
      }
    });

    return filtered;
  }, [contacts, searchQuery, filterCategory, filterTags, sortBy]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    contacts.forEach(contact => {
      contact.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [contacts]);

  // Analytics
  const analytics = useMemo(() => {
    const total = contacts.length;
    const verified = contacts.filter(c => c.verified).length;
    const favorites = contacts.filter(c => c.favorite).length;
    const byCategory = categories.reduce((acc, cat) => {
      acc[cat] = contacts.filter(c => c.category === cat).length;
      return acc;
    }, {} as Record<string, number>);
    
    const totalSatsPaid = contacts.reduce((sum, c) => sum + c.metadata.totalSatsPaid, 0);
    const totalSatsReceived = contacts.reduce((sum, c) => sum + c.metadata.totalSatsReceived, 0);
    const totalInteractions = contacts.reduce((sum, c) => sum + c.metadata.interactions, 0);

    return {
      total,
      verified,
      favorites,
      byCategory,
      totalSatsPaid,
      totalSatsReceived,
      totalInteractions,
      averageReputation: contacts.reduce((sum, c) => sum + c.reputation, 0) / total
    };
  }, [contacts]);

  const handleAddContact = () => {
    if (!newContact.did || !newContact.displayName) {
      toast({
        title: "Missing required fields",
        description: "DID address and display name are required.",
        variant: "destructive"
      });
      return;
    }

    // Validate DID format
    if (!newContact.did.startsWith('did:btc:')) {
      toast({
        title: "Invalid DID format",
        description: "DID must start with 'did:btc:'",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicates
    if (contacts.some(c => c.did === newContact.did)) {
      toast({
        title: "Contact already exists",
        description: "A contact with this DID already exists.",
        variant: "destructive"
      });
      return;
    }

    const contact: Contact = {
      id: Date.now().toString(),
      did: newContact.did,
      displayName: newContact.displayName,
      email: newContact.email || undefined,
      tags: newContact.tags.split(',').map(t => t.trim()).filter(t => t),
      category: newContact.category,
      notes: newContact.notes,
      verified: false,
      addedDate: new Date(),
      lightningAddress: newContact.lightningAddress || undefined,
      publicKey: 'generated-key-' + Date.now(),
      reputation: 50, // Default reputation
      blocked: false,
      favorite: false,
      metadata: {
        domain: newContact.email ? newContact.email.split('@')[1] : undefined,
        source: 'manual',
        interactions: 0,
        totalSatsPaid: 0,
        totalSatsReceived: 0
      }
    };

    setContacts(prev => [...prev, contact]);
    setNewContact({
      did: '',
      displayName: '',
      email: '',
      category: 'colleagues',
      tags: '',
      notes: '',
      lightningAddress: ''
    });
    setShowAddDialog(false);

    toast({
      title: "Contact added",
      description: `${contact.displayName} has been added to your contacts.`
    });
  };

  const handleDeleteContact = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    setContacts(prev => prev.filter(c => c.id !== contactId));
    toast({
      title: "Contact deleted",
      description: `${contact?.displayName} has been removed from your contacts.`
    });
  };

  const handleToggleFavorite = (contactId: string) => {
    setContacts(prev => prev.map(c => 
      c.id === contactId ? { ...c, favorite: !c.favorite } : c
    ));
  };

  const handleBulkOperation = (operation: string) => {
    if (selectedContacts.length === 0) {
      toast({
        title: "No contacts selected",
        description: "Please select contacts to perform bulk operations.",
        variant: "destructive"
      });
      return;
    }

    switch (operation) {
      case 'delete':
        setContacts(prev => prev.filter(c => !selectedContacts.includes(c.id)));
        toast({
          title: "Contacts deleted",
          description: `${selectedContacts.length} contacts have been deleted.`
        });
        break;
      case 'favorite':
        setContacts(prev => prev.map(c => 
          selectedContacts.includes(c.id) ? { ...c, favorite: true } : c
        ));
        toast({
          title: "Contacts favorited",
          description: `${selectedContacts.length} contacts have been added to favorites.`
        });
        break;
      case 'export':
        handleExportContacts(selectedContacts);
        break;
    }
    setSelectedContacts([]);
  };

  const handleExportContacts = (contactIds?: string[]) => {
    const contactsToExport = contactIds 
      ? contacts.filter(c => contactIds.includes(c.id))
      : contacts;

    const csvContent = [
      'DID,Display Name,Email,Lightning Address,Category,Tags,Notes,Reputation,Verified,Added Date',
      ...contactsToExport.map(c => [
        c.did,
        c.displayName,
        c.email || '',
        c.lightningAddress || '',
        c.category,
        c.tags.join(';'),
        c.notes.replace(/,/g, ';'),
        c.reputation,
        c.verified,
        c.addedDate.toISOString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bitcomm-contacts-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Contacts exported",
      description: `${contactsToExport.length} contacts exported to CSV.`
    });
  };

  const handleImportContacts = (csvContent: string) => {
    try {
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',');
      const importedContacts: Contact[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length < headers.length) continue;

        const contact: Contact = {
          id: Date.now().toString() + i,
          did: values[0],
          displayName: values[1],
          email: values[2] || undefined,
          lightningAddress: values[3] || undefined,
          category: values[4] || 'other',
          tags: values[5] ? values[5].split(';') : [],
          notes: values[6] || '',
          reputation: parseInt(values[7]) || 50,
          verified: values[8] === 'true',
          addedDate: new Date(values[9]) || new Date(),
          publicKey: 'imported-key-' + Date.now() + i,
          blocked: false,
          favorite: false,
          metadata: {
            domain: values[2] ? values[2].split('@')[1] : undefined,
            source: 'imported',
            interactions: 0,
            totalSatsPaid: 0,
            totalSatsReceived: 0
          }
        };

        // Check for duplicates
        if (!contacts.some(c => c.did === contact.did)) {
          importedContacts.push(contact);
        }
      }

      setContacts(prev => [...prev, ...importedContacts]);
      setShowImportDialog(false);

      toast({
        title: "Contacts imported",
        description: `${importedContacts.length} contacts imported successfully.`
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to parse CSV file. Please check the format.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Contact Manager</h1>
          <Badge variant="secondary">{analytics.total} contacts</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
                <DialogDescription>
                  Add a new contact using their DID address or import from traditional email.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="did">DID Address *</Label>
                  <Input
                    id="did"
                    placeholder="did:btc:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                    value={newContact.did}
                    onChange={(e) => setNewContact(prev => ({ ...prev, did: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="displayName">Display Name *</Label>
                  <Input
                    id="displayName"
                    placeholder="Satoshi Nakamoto"
                    value={newContact.displayName}
                    onChange={(e) => setNewContact(prev => ({ ...prev, displayName: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Legacy Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="satoshi@bitcoin.org"
                    value={newContact.email}
                    onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="lightningAddress">Lightning Address</Label>
                  <Input
                    id="lightningAddress"
                    placeholder="satoshi@lightning.network"
                    value={newContact.lightningAddress}
                    onChange={(e) => setNewContact(prev => ({ ...prev, lightningAddress: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newContact.category} onValueChange={(value) => setNewContact(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    placeholder="bitcoin, developer, vip"
                    value={newContact.tags}
                    onChange={(e) => setNewContact(prev => ({ ...prev, tags: e.target.value }))}
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes about this contact..."
                    value={newContact.notes}
                    onChange={(e) => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddContact}>
                  Add Contact
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setShowImportDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Import Contacts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportContacts()}>
                <Download className="h-4 w-4 mr-2" />
                Export All
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowStatsDialog(true)}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <div className="border-b">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="blocked">Blocked</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="contacts" className="flex-1 m-0">
          <div className="flex h-full">
            {/* Filters Sidebar */}
            <div className="w-64 border-r p-4 space-y-4">
              <div>
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label>Category</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)} ({analytics.byCategory[cat] || 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy as any}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="date">Date Added</SelectItem>
                    <SelectItem value="reputation">Reputation</SelectItem>
                    <SelectItem value="interactions">Interactions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {allTags.map(tag => (
                    <div key={tag} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filterTags.includes(tag)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilterTags(prev => [...prev, tag]);
                          } else {
                            setFilterTags(prev => prev.filter(t => t !== tag));
                          }
                        }}
                      />
                      <label className="text-sm">{tag}</label>
                    </div>
                  ))}
                </div>
              </div>

              {selectedContacts.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <Label>Bulk Actions ({selectedContacts.length} selected)</Label>
                  <div className="space-y-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkOperation('favorite')}
                      className="w-full justify-start"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Add to Favorites
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkOperation('export')}
                      className="w-full justify-start"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Selected
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkOperation('delete')}
                      className="w-full justify-start text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Contact List */}
            <div className="flex-1">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {filteredContacts.length} contacts found
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedContacts.length === filteredContacts.length) {
                        setSelectedContacts([]);
                      } else {
                        setSelectedContacts(filteredContacts.map(c => c.id));
                      }
                    }}
                  >
                    {selectedContacts.length === filteredContacts.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="p-4 space-y-2">
                  {filteredContacts.map(contact => (
                    <Card key={contact.id} className={`cursor-pointer transition-all ${
                      selectedContacts.includes(contact.id) ? 'ring-2 ring-primary' : ''
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={selectedContacts.includes(contact.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedContacts(prev => [...prev, contact.id]);
                              } else {
                                setSelectedContacts(prev => prev.filter(id => id !== contact.id));
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={contact.avatar} />
                            <AvatarFallback>
                              {contact.displayName[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium truncate">{contact.displayName}</h3>
                              {contact.favorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                              {contact.verified && <CheckCircle className="h-4 w-4 text-green-500" />}
                              {contact.lightningAddress && <Zap className="h-4 w-4 text-bitcoin-orange" />}
                            </div>
                            
                            <p className="text-sm text-muted-foreground truncate">
                              {contact.did}
                            </p>
                            
                            {contact.email && (
                              <p className="text-xs text-muted-foreground">
                                {contact.email}
                              </p>
                            )}

                            <div className="flex items-center gap-2 mt-2">
                              {contact.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {contact.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{contact.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                              <Shield className="h-3 w-3" />
                              {contact.reputation}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {contact.metadata.interactions} interactions
                            </div>
                            {contact.metadata.totalSatsReceived > 0 && (
                              <div className="text-xs text-bitcoin-orange">
                                +{contact.metadata.totalSatsReceived} sats
                              </div>
                            )}
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Zap className="h-4 w-4 mr-2" />
                                Send Payment
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleFavorite(contact.id)}>
                                <Star className="h-4 w-4 mr-2" />
                                {contact.favorite ? 'Remove from Favorites' : 'Add to Favorites'}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Contact
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteContact(contact.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Contact
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.total}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.verified} verified
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Interactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalInteractions}</div>
                <p className="text-xs text-muted-foreground">
                  Avg: {(analytics.totalInteractions / analytics.total).toFixed(1)} per contact
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sats Transacted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-bitcoin-orange">
                  {analytics.totalSatsPaid + analytics.totalSatsReceived}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{analytics.totalSatsReceived} received, -{analytics.totalSatsPaid} sent
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Avg Reputation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.averageReputation.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.favorites} favorites
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Contacts by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(analytics.byCategory).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="capitalize">{category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${(count / analytics.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Contacts</DialogTitle>
            <DialogDescription>
              Import contacts from CSV file or paste CSV data directly.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>CSV Data</Label>
              <Textarea
                placeholder="DID,Display Name,Email,Lightning Address,Category,Tags,Notes,Reputation,Verified,Added Date"
                className="min-h-32"
                id="csvData"
              />
            </div>
            
            <div>
              <Label>Or upload CSV file</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      const content = e.target?.result as string;
                      (document.getElementById('csvData') as HTMLTextAreaElement).value = content;
                    };
                    reader.readAsText(file);
                  }
                }}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              const csvData = (document.getElementById('csvData') as HTMLTextAreaElement).value;
              handleImportContacts(csvData);
            }}>
              Import Contacts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
