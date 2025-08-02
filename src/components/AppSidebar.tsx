import { 
  Network, 
  MessageSquare, 
  Cpu, 
  User, 
  Building2, 
  UserCircle, 
  CreditCard,
  LogIn,
  LogOut
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AppSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navigationItems = [
  { id: "p2p", title: "P2P Network", icon: Network },
  { id: "composer", title: "Messages", icon: MessageSquare },
  { id: "pow", title: "Proof of Work", icon: Cpu },
  { id: "identity", title: "Identity", icon: User },
  { id: "payments", title: "Payments", icon: CreditCard },
  { id: "enterprise", title: "Enterprise", icon: Building2 },
  { id: "profile", title: "Profile", icon: UserCircle },
]

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { open } = useSidebar()
  const { user, createDIDIdentity, signOut } = useAuth()

  const isActive = (tabId: string) => activeTab === tabId

  const handleSignIn = () => {
    createDIDIdentity("User")
  }

  return (
    <Sidebar className={open ? "w-60" : "w-14"} collapsible="icon">
      <SidebarHeader className="border-b border-border/40">
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Network className="h-4 w-4" />
          </div>
          {open && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold">BitComm</span>
              <span className="text-xs text-muted-foreground">Secure Messaging</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    onClick={() => onTabChange(item.id)}
                    className={isActive(item.id) ? "bg-accent text-accent-foreground" : ""}
                  >
                    <item.icon className="h-4 w-4" />
                    {open && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40">
        {user ? (
          <div className="flex items-center gap-2 p-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.displayName?.[0] || user.did[0]}</AvatarFallback>
            </Avatar>
            {open && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.displayName || user.did.slice(-8)}</p>
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
            )}
          </div>
        ) : (
          <Button 
            variant="default" 
            size={open ? "default" : "icon"}
            onClick={handleSignIn}
            className="mx-2 mb-2"
          >
            <LogIn className="h-4 w-4" />
            {open && <span className="ml-2">Sign In</span>}
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}