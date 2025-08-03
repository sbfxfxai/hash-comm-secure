import React, { useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

// Import Lucide React icons
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

export default function App() {
    // Navigation state
    const [activeTab, setActiveTab] = useState('composer');

    // Render content based on active tab
    const renderContent = () => {
        switch (activeTab) {
            case 'inbox':
                return (
                    <div className="p-6">
                        <h1 className="text-2xl font-bold mb-4">Inbox</h1>
                        <p className="text-gray-600">Your received messages will appear here.</p>
                    </div>
                );
            case 'contacts':
                return (
                    <div className="p-6">
                        <h1 className="text-2xl font-bold mb-4">Contacts</h1>
                        <p className="text-gray-600">Manage your contact list here.</p>
                    </div>
                );
            case 'network':
                return (
                    <div className="p-6">
                        <h1 className="text-2xl font-bold mb-4">P2P Network</h1>
                        <p className="text-gray-600">Network status and peer information.</p>
                    </div>
                );
            case 'pow':
                return (
                    <div className="p-6">
                        <h1 className="text-2xl font-bold mb-4">Proof of Work</h1>
                        <p className="text-gray-600">Proof of Work demo and settings.</p>
                    </div>
                );
            case 'identity':
                return (
                    <div className="p-6">
                        <h1 className="text-2xl font-bold mb-4">Identity Manager</h1>
                        <p className="text-gray-600">Manage your BitComm identities.</p>
                    </div>
                );
            case 'payments':
                return (
                    <div className="p-6">
                        <h1 className="text-2xl font-bold mb-4">Payments</h1>
                        <p className="text-gray-600">Lightning payment management.</p>
                    </div>
                );
            case 'enterprise':
                return (
                    <div className="p-6">
                        <h1 className="text-2xl font-bold mb-4">Enterprise</h1>
                        <p className="text-gray-600">Enterprise features and administration.</p>
                    </div>
                );
            case 'profile':
                return (
                    <div className="p-6">
                        <h1 className="text-2xl font-bold mb-4">Profile</h1>
                        <p className="text-gray-600">Your user profile and settings.</p>
                    </div>
                );
            case 'composer':
            default:
                return (
                    <div className="p-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
                                </div>
                            </div>
                            <div className="p-4 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                                        <QrCode className="h-5 w-5 text-gray-500" />
                                        <span className="text-sm text-gray-600">Show My QR Code</span>
                                    </button>
                                    <button className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                                        <Camera className="h-5 w-5 text-gray-500" />
                                        <span className="text-sm text-gray-600">Scan QR Code</span>
                                    </button>
                                </div>
                                
                                <div className="space-y-3">
                                    <label htmlFor="recipient" className="block text-sm font-medium text-gray-700">Recipient Address</label>
                                    <input
                                        id="recipient"
                                        type="text"
                                        placeholder="Enter BitComm address..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                                    <textarea
                                        id="message"
                                        placeholder="Type your message here... (will be encrypted)"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>0 characters</span>
                                        <span className="flex items-center gap-1">
                                            <Lock className="h-3 w-3" />
                                            End-to-end encrypted
                                        </span>
                                    </div>
                                </div>

                                <button className="w-full py-3 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700">
                                    <Send className="h-4 w-4" />
                                    Send Message
                                </button>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <SidebarProvider>
            <AppSidebar onTabChange={setActiveTab} activeTab={activeTab} />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="#">
                                        BitComm
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>
                                        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    {renderContent()}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
