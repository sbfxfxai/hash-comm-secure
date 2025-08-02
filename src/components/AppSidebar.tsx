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
} from "@/components/ui/sidebar"
import { 
  Bitcoin, 
  MessageSquare, 
  Shield, 
  User, 
  Zap, 
  Building2, 
  UserCircle,
  Network,
  CreditCard
} from "lucide-react"

interface AppSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navigationItems = [
  {
    title: "P2P Network",
    value: "network",
    icon: Network,
    description: "Decentralized network status"
  },
  {
    title: "Messages",
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
        <div className="p-4 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          <p>BitComm v1.0</p>
          <p>Secure P2P Messaging</p>
        </div>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}
