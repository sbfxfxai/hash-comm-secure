import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BitCommButton } from '@/components/ui/bitcomm-button'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Shield, Wallet, User, Bitcoin, LogIn, UserPlus, Key } from 'lucide-react'

interface AuthModalProps {
  children: React.ReactNode
}

export const AuthModal: React.FC<AuthModalProps> = ({ children }) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [didInput, setDidInput] = useState('')
  const { createDIDIdentity, signInWithDID, connectBitcoinWallet } = useAuth()

  const handleCreateDID = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await createDIDIdentity(displayName)
    
    if (error) {
      toast.error(error || 'Failed to create DID identity')
    } else {
      toast.success('DID Identity created successfully!')
      setOpen(false)
      setDisplayName('')
    }
    setLoading(false)
  }

  const handleSignInWithDID = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await signInWithDID(didInput)
    
    if (error) {
      toast.error(error || 'Failed to sign in with DID')
    } else {
      toast.success('Signed in successfully!')
      setOpen(false)
      setDidInput('')
    }
    setLoading(false)
  }

  const handleBitcoinConnect = async () => {
    setLoading(true)
    const { error } = await connectBitcoinWallet()
    
    if (error) {
      toast.error(error || 'Failed to connect Bitcoin wallet')
    } else {
      setOpen(false)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Join BitComm
          </DialogTitle>
          <DialogDescription className="text-center">
            Access premium features and secure messaging
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create DID</TabsTrigger>
            <TabsTrigger value="signin">Sign In</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <Card>
              <CardHeader className="text-center pb-4">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Shield className="h-5 w-5" />
                  Create DID Identity
                </CardTitle>
                <CardDescription>
                  Create a decentralized identity for secure messaging
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateDID} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="display-name">Display Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="display-name"
                        type="text"
                        placeholder="Your display name"
                        className="pl-10"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This will be your public identifier on BitComm
                    </p>
                  </div>
                  <BitCommButton
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Creating DID..." : "Create Decentralized Identity"}
                  </BitCommButton>
                </form>

                <div className="mt-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or connect with
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={handleBitcoinConnect}
                    disabled={loading}
                  >
                    <Bitcoin className="mr-2 h-4 w-4" />
                    Bitcoin Wallet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signin">
            <Card>
              <CardHeader className="text-center pb-4">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Key className="h-5 w-5" />
                  Sign In with DID
                </CardTitle>
                <CardDescription>
                  Enter your decentralized identity to sign in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignInWithDID} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="did-input">Your DID</Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="did-input"
                        type="text"
                        placeholder="did:btc:..."
                        className="pl-10 font-mono text-sm"
                        value={didInput}
                        onChange={(e) => setDidInput(e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter your Bitcoin-based decentralized identifier
                    </p>
                  </div>
                  <BitCommButton
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In with DID"}
                  </BitCommButton>
                </form>

                <div className="mt-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or connect with
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={handleBitcoinConnect}
                    disabled={loading}
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Bitcoin Wallet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
