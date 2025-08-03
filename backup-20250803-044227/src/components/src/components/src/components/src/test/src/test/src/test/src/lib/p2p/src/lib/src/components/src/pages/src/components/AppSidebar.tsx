import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { 
  Bitcoin, 
  MessageSquare, 
  Shield, 
  User, 
  Building2, 
  UserCircle,
  Network,
  CreditCard,
  LogIn,
  LogOut
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AppSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navigationItems = [
  {
    title: "Inbox",
    value: "inbox",
    icon: MessageSquare,
    description: "Your encrypted messages"
  },
  {
    title: "Contacts",
    value: "contacts",
    icon: User,
    description: "Manage your contacts"
  },
  {
    title: "P2P Network",
    value: "network",
    icon: Network,
    description: "Decentralized network status"
  },
  {
    title: "Compose",
    value: "composer", 
    icon: MessageSquare,
    description: "Send encrypted messages"
  },
  {
    title: "Proof of Work",
    value: "pow",
    icon: Shield,
    description: "Anti-spam demonstration"
  },
  {
    title: "Identity",
    value: "identity",
    icon: User,
    description: "Manage your identities"
  },
  {
    title: "Payments",
    value: "lightning",
    icon: CreditCard,
    description: "Lightning Network payments"
  },
  {
    title: "Enterprise",
    value: "enterprise",
    icon: Building2,
    description: "Business dashboard"
  },
  {
    title: "Profile",
    value: "profile",
    icon: UserCircle,
    description: "Account settings"
  }
]

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { user, createDIDIdentity, signOut } = useAuth()

  const handleSignIn = () => {
    createDIDIdentity("User")
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-4 py-2">
          <Bitcoin className="h-6 w-6 text-bitcoin-orange" />
          <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">
            BitComm
          </span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    onClick={() => onTabChange(item.value)}
                    isActive={activeTab === item.value}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {user ? (
          <div className="flex items-center gap-2 p-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.displayName?.[0] || user.did?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-medium truncate">{user.displayName || user.did?.slice(-8)}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={signOut}
                className="h-6 px-0 text-xs text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-3 w-3 mr-1" />
                Sign out
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            variant="default" 
            onClick={handleSignIn}
            className="mx-2 mb-2"
          >
            <LogIn className="h-4 w-4" />
            <span className="ml-2 group-data-[collapsible=icon]:hidden">Sign In</span>
          </Button>
        )}
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}
