// Modern NWC Connection Modal with 1-Click Flows
import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BitCommButton } from '@/components/ui/bitcomm-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QRWalletConnect } from './QRWalletConnect'
import { nwcConnectionManager, type WalletConnection } from '@/lib/nwc/connection-manager'
import { 
  Wallet, 
  Smartphone, 
  Globe, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Shield,
  Timer,
  Users
} from 'lucide-react'

interface NWCConnectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnectionComplete?: (connection: WalletConnection) => void
}

const POPULAR_WALLETS = [
  {
    name: 'Alby Hub',
    url: 'https://getalby.com',
    type: 'http' as const,
    description: 'Cloud-hosted Lightning wallet',
    icon: '⚡'
  },
  {
    name: 'Alby Go',
    type: 'mobile' as const,
    description: 'Self-custodial mobile wallet',
    icon: '📱'
  },
  {
    name: 'Phoenix',
    type: 'mobile' as const,
    description: 'Non-custodial Lightning wallet',
    icon: '🔥'
  },
  {
    name: 'Wallet of Satoshi',
    type: 'mobile' as const,
    description: 'Simple Lightning wallet',
    icon: '💰'
  }
]

export const NWCConnectionModal: React.FC<NWCConnectionModalProps> = ({
  open,
  onOpenChange,
  onConnectionComplete
}) => {
  const [connecting, setConnecting] = useState(false)
  const [connectionType, setConnectionType] = useState<'auto' | 'http' | 'qr'>('auto')
  const [customWalletUrl, setCustomWalletUrl] = useState('')
  const [activeConnection, setActiveConnection] = useState<WalletConnection | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Initialize connection manager
    nwcConnectionManager.initialize()
    setActiveConnection(nwcConnectionManager.getActiveConnection())
  }, [])

  const handleQuickConnect = async (walletUrl?: string) => {
    setConnecting(true)
    setError(null)

    try {
      const result = await nwcConnectionManager.connect(walletUrl)

      if (result.success && result.connection) {
        setActiveConnection(result.connection)
        if (onConnectionComplete) {
          onConnectionComplete(result.connection)
        }
        onOpenChange(false)
      } else if (result.requiresQR) {
        setConnectionType('qr')
      } else {
        setError(result.error || 'Connection failed')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Connection failed')
    } finally {
      setConnecting(false)
    }
  }

  const handleCustomConnect = () => {
    if (customWalletUrl.trim()) {
      handleQuickConnect(customWalletUrl.trim())
    }
  }

  const handleDisconnect = () => {
    nwcConnectionManager.disconnect()
    setActiveConnection(null)
    onOpenChange(false)
  }

  const handleQRSuccess = (connection: WalletConnection) => {
    setActiveConnection(connection)
    if (onConnectionComplete) {
      onConnectionComplete(connection)
    }
    onOpenChange(false)
  }

  // If already connected, show connection status
  if (activeConnection) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Wallet Connected
            </DialogTitle>
            <DialogDescription>
              Your Lightning wallet is connected and ready to use
            </DialogDescription>
          </DialogHeader>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {activeConnection.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {activeConnection.type === 'http' ? 'HTTP' : 'Nostr'}
                </Badge>
                <span className="text-xs">Connected</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Permissions:</span>
                <span>{activeConnection.permissions.length} granted</span>
              </div>
              
              {activeConnection.budget && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Daily limit:</span>
                  <span>{activeConnection.budget.daily?.toLocaleString()} sats</span>
                </div>
              )}
              
              <Button 
                variant="outline" 
                onClick={handleDisconnect}
                className="w-full"
              >
                Disconnect Wallet
              </Button>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Lightning Wallet
          </DialogTitle>
          <DialogDescription>
            Connect your wallet with 1-click using Nostr Wallet Connect (NWC)
          </DialogDescription>
        </DialogHeader>

        <Tabs value={connectionType} onValueChange={(v: any) => setConnectionType(v)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="auto" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Quick Connect
            </TabsTrigger>
            <TabsTrigger value="http" className="text-xs">
              <Globe className="h-3 w-3 mr-1" />
              Web Wallet
            </TabsTrigger>
            <TabsTrigger value="qr" className="text-xs">
              <Smartphone className="h-3 w-3 mr-1" />
              Mobile Wallet
            </TabsTrigger>
          </TabsList>

          <TabsContent value="auto" className="space-y-4">
            <div className="grid gap-3">
              <div className="text-sm text-gray-600 mb-2">
                Popular wallets with 1-click connection:
              </div>
              
              {POPULAR_WALLETS.map((wallet) => (
                <Card key={wallet.name} className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{wallet.icon}</span>
                        <div>
                          <div className="font-medium text-sm">{wallet.name}</div>
                          <div className="text-xs text-gray-600">{wallet.description}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {wallet.type === 'http' ? 'Web' : 'Mobile'}
                        </Badge>
                        <BitCommButton
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickConnect(wallet.url)}
                          disabled={connecting}
                        >
                          {connecting ? 'Connecting...' : 'Connect'}
                        </BitCommButton>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
              <Shield className="h-4 w-4 text-blue-600" />
              <div>
                <strong>Secure:</strong> Your keys never leave your device. 
                Only permissions and budgets are shared.
              </div>
            </div>
          </TabsContent>

          <TabsContent value="http" className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="wallet-url">Wallet URL</Label>
              <Input
                id="wallet-url"
                placeholder="https://getalby.com or your hub URL"
                value={customWalletUrl}
                onChange={(e) => setCustomWalletUrl(e.target.value)}
              />
              <div className="text-xs text-gray-600">
                For publicly accessible wallets like Alby Hub, Phoenix Web, etc.
              </div>
            </div>

            <BitCommButton
              onClick={handleCustomConnect}
              disabled={connecting || !customWalletUrl.trim()}
              className="w-full"
            >
              {connecting ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Connect Web Wallet
                </>
              )}
            </BitCommButton>

            <div className="flex items-center gap-2 text-xs text-gray-500 bg-green-50 p-3 rounded-lg">
              <Timer className="h-4 w-4 text-green-600" />
              <div>
                <strong>Fast:</strong> Direct HTTP connection for instant access.
              </div>
            </div>
          </TabsContent>

          <TabsContent value="qr" className="space-y-4">
            <QRWalletConnect
              onSuccess={handleQRSuccess}
              onError={(error) => setError(error)}
            />

            <div className="flex items-center gap-2 text-xs text-gray-500 bg-purple-50 p-3 rounded-lg">
              <Users className="h-4 w-4 text-purple-600" />
              <div>
                <strong>Cross-device:</strong> Connect mobile wallets to web apps seamlessly.
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}