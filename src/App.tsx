import React, { useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';

// Import component pages
import { Inbox } from '@/components/Inbox';
import { ContactManager } from '@/components/ContactManager';
import { P2PNetworkStatus } from '@/components/P2PNetworkStatus';
import MessageComposer from '@/components/MessageComposer';
import { ProofOfWorkDemo } from '@/components/ProofOfWorkDemo';
import { IdentityManager } from '@/components/IdentityManager';
// import { P2PPaymentCard as P2PPaymentComponents } from '@/components/P2PPaymentComponents';
import { AdminDashboard } from '@/components/AdminDashboard';
import { UserProfile } from '@/components/UserProfile';

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
                return <Inbox />;
            case 'contacts':
                return <ContactManager />;
            case 'network':
                return (
                    <div className="p-6">
                        <P2PNetworkStatus />
                    </div>
                );
            case 'pow':
                return (
                    <div className="p-6">
                        <ProofOfWorkDemo />
                    </div>
                );
            case 'identity':
                return (
                    <div className="p-6">
                        <IdentityManager />
                    </div>
                );
            case 'payments':
                return (
                    <div className="p-6">
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-2xl font-bold mb-4">Lightning Payments</h1>
                                <p className="text-gray-600">Manage your Bitcoin Lightning Network payments and transactions.</p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <div className="p-4 border rounded-lg">
                                    <h3 className="font-semibold mb-2">Balance</h3>
                                    <p className="text-2xl font-bold text-orange-600">21,000 sats</p>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <h3 className="font-semibold mb-2">Transactions</h3>
                                    <p className="text-2xl font-bold">47</p>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <h3 className="font-semibold mb-2">Network Status</h3>
                                    <p className="text-green-600 font-medium">Connected</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'enterprise':
                return (
                    <div className="p-6">
                        <AdminDashboard />
                    </div>
                );
            case 'profile':
                return (
                    <div className="p-6">
                        <UserProfile />
                    </div>
                );
            case 'composer':
            default:
                return (
                    <div className="p-6">
                        <MessageComposer />
                    </div>
                );
        }
    };

    return (
        <AuthProvider>
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
                <Toaster />
            </SidebarProvider>
        </AuthProvider>
    );
}
