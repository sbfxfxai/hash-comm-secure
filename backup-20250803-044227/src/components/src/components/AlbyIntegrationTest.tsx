// Comprehensive Alby Integration Test Component
// Tests all Lightning features and demonstrates proper integration

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  Zap, 
  Wallet, 
  Settings, 
  CreditCard, 
  Users, 
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { bitcoinConnect } from '../lib/bitcoinConnectService'
import { lightningTools } from '../lib/lightningToolsService'
import { albyConfig } from '../lib/albyConfig'
import { nwcConnectionManager } from '../lib/nwc/connection-manager'
import { toast } from 'sonner'

export const AlbyIntegrationTest: React.FC = () => {
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletInfo, setWalletInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})
  const [paymentAmount, setPaymentAmount] = useState('100')
  const [lightningAddress, setLightningAddress] = useState('')
  const [configInfo, setConfigInfo] = useState<any>(null)

  useEffect(() => {
    // Initialize and check configuration
    const init = async () => {
      try {
        await bitcoinConnect.initialize()
        setConfigInfo(albyConfig.getDebugInfo())
        setWalletConnected(bitcoinConnect.isConnected())
        
        if (bitcoinConnect.isConnected()) {
          const info = await bitcoinConnect.getWalletInfo()
          setWalletInfo(info)
        }
      } catch (error) {
        console.error('Failed to initialize:', error)
      }
    }
    
    init()
  }, [])

  const handleWalletConnect = async () => {
    setLoading(true)
    try {
      await bitcoinConnect.launchConnectionModal()
      setWalletConnected(bitcoinConnect.isConnected())
      
      if (bitcoinConnect.isConnected()) {
        const info = await bitcoinConnect.getWalletInfo()
        setWalletInfo(info)
        toast.success('Wallet connected successfully!')
      }
    } catch (error) {
      toast.error('Failed to connect wallet')
      console.error('Wallet connection error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWalletDisconnect = async () => {
    setLoading(true)
    try {
      await bitcoinConnect.disconnectWallet()
      setWalletConnected(false)
      setWalletInfo(null)
      toast.success('Wallet disconnected')
    } catch (error) {
      toast.error('Failed to disconnect wallet')
    } finally {
      setLoading(false)
    }
  }

  const runPaymentTest = async () => {
    if (!walletConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    setLoading(true)
    try {
      const result = await bitcoinConnect.processPayment({
        amount: parseInt(paymentAmount),
        description: 'Alby Integration Test Payment'
      })

      if (result.success) {
        setTestResults(prev => ({ ...prev, payment: true }))
        toast.success(`Payment successful! Preimage: ${result.preimage?.slice(0, 20)}...`)
      } else {
        setTestResults(prev => ({ ...prev, payment: false }))
        toast.error(`Payment failed: ${result.error}`)
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, payment: false }))
      toast.error('Payment test failed')
    } finally {
      setLoading(false)
    }
  }

  const runInvoiceTest = async () => {
    if (!lightningAddress) {
      toast.error('Please enter a Lightning Address')
      return
    }

    setLoading(true)
    try {
      const invoice = await lightningTools.requestInvoice('test-user', {
        amount: parseInt(paymentAmount),
        description: 'Test Invoice',
        lightningAddress
      })

      if (invoice) {
        setTestResults(prev => ({ ...prev, invoice: true }))
        toast.success('Invoice created successfully!')
        console.log('Invoice:', invoice)
      } else {
        setTestResults(prev => ({ ...prev, invoice: false }))
        toast.error('Failed to create invoice')
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, invoice: false }))
      toast.error('Invoice test failed')
    } finally {
      setLoading(false)
    }
  }

  const runFiatConversionTest = async () => {
    setLoading(true)
    try {
      const sats = parseInt(paymentAmount)
      const usdValue = await bitcoinConnect.getFiatValue(sats, 'USD')
      const formattedValue = await bitcoinConnect.getFormattedFiatValue(sats, 'USD')
      
      setTestResults(prev => ({ ...prev, fiat: true }))
      toast.success(`${sats} sats = ${formattedValue} (${usdValue})`)
    } catch (error) {
      setTestResults(prev => ({ ...prev, fiat: false }))
      toast.error('Fiat conversion test failed')
    } finally {
      setLoading(false)
    }
  }

  const runNWCTest = async () => {
    setLoading(true)
    try {
      const result = await nwcConnectionManager.connect()
      
      if (result.success) {
        setTestResults(prev => ({ ...prev, nwc: true }))
        toast.success('NWC connection test successful!')
      } else {
        setTestResults(prev => ({ ...prev, nwc: false }))
        toast.error(`NWC test failed: ${result.error}`)
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, nwc: false }))
      toast.error('NWC connection test failed')
    } finally {
      setLoading(false)
    }
  }

  const runAllTests = async () => {
    setTestResults({})
    await runFiatConversionTest()
    await new Promise(resolve => setTimeout(resolve, 1000))
    await runInvoiceTest()
    await new Promise(resolve => setTimeout(resolve, 1000))
    await runNWCTest()
  }

  const getStatusIcon = (test: string) => {
    if (loading) return <Loader2 className="h-4 w-4 animate-spin" />
    if (testResults[test] === true) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (testResults[test] === false) return <AlertCircle className="h-4 w-4 text-red-500" />
    return <div className="h-4 w-4 rounded-full border-2" />
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Alby Lightning Integration Test Suite
          </CardTitle>
          <CardDescription>
            Comprehensive testing of all Alby Lightning Network features in BitComm
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Wallet Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Connection Status</span>
                  <Badge variant={walletConnected ? 'default' : 'destructive'}>
                    {walletConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                
                {walletInfo && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Wallet Alias</span>
                      <span className="text-sm">{walletInfo.alias || 'Unknown'}</span>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={walletConnected ? handleWalletDisconnect : handleWalletConnect}
                  disabled={loading}
                  className="w-full"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {walletConnected ? 'Disconnect Wallet' : 'Connect Wallet'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Test Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Fiat Conversion</span>
                  {getStatusIcon('fiat')}
                </div>
                <div className="flex items-center justify-between">
                  <span>Invoice Creation</span>
                  {getStatusIcon('invoice')}
                </div>
                <div className="flex items-center justify-between">
                  <span>NWC Connection</span>
                  {getStatusIcon('nwc')}
                </div>
                <div className="flex items-center justify-between">
                  <span>Payment Processing</span>
                  {getStatusIcon('payment')}
                </div>
                
                <Separator />
                
                <Button 
                  onClick={runAllTests}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Run All Tests
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="connection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Connection Testing</CardTitle>
              <CardDescription>
                Test different wallet connection methods and verify integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Button 
                  onClick={handleWalletConnect}
                  disabled={loading}
                  variant="outline"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Launch Connection Modal
                </Button>
                
                <Button 
                  onClick={runNWCTest}
                  disabled={loading}
                  variant="outline"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Test NWC Connection
                </Button>
              </div>

              {walletInfo && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Connected Wallet Info:</h4>
                  <pre className="text-sm">
                    {JSON.stringify(walletInfo, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Testing</CardTitle>
              <CardDescription>
                Test Lightning payments, invoices, and fiat conversions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount (sats)</label>
                  <Input
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="100"
                    type="number"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lightning Address</label>
                  <Input
                    value={lightningAddress}
                    onChange={(e) => setLightningAddress(e.target.value)}
                    placeholder="user@getalby.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Button 
                  onClick={runPaymentTest}
                  disabled={loading || !walletConnected}
                  variant="outline"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Test Payment
                </Button>
                
                <Button 
                  onClick={runInvoiceTest}
                  disabled={loading}
                  variant="outline"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Test Invoice
                </Button>
                
                <Button 
                  onClick={runFiatConversionTest}
                  disabled={loading}
                  variant="outline"
                >
                  <div className="mr-2 h-4 w-4">$</div>
                  Test Fiat
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Integration</CardTitle>
              <CardDescription>
                Test specific BitComm features that use Lightning payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Button 
                  onClick={() => {
                    bitcoinConnect.processFeaturePayment('identity-verification', 1000)
                      .then(result => {
                        if (result.success) {
                          toast.success('Identity verification payment successful!')
                        } else {
                          toast.error(`Payment failed: ${result.error}`)
                        }
                      })
                  }}
                  disabled={loading || !walletConnected}
                  variant="outline"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Test Identity Payment
                </Button>
                
                <Button 
                  onClick={() => {
                    bitcoinConnect.processSubscriptionPayment('premium', 10000)
                      .then(result => {
                        if (result.success) {
                          toast.success('Subscription payment successful!')
                        } else {
                          toast.error(`Payment failed: ${result.error}`)
                        }
                      })
                  }}
                  disabled={loading || !walletConnected}
                  variant="outline"
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Test Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration Details
              </CardTitle>
              <CardDescription>
                Current Alby and Lightning configuration settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {configInfo && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">App Configuration</h4>
                      <div className="text-sm space-y-1">
                        <div>App Name: {configInfo.appName}</div>
                        <div>Network: {configInfo.network}</div>
                        <div>Environment: {configInfo.environment}</div>
                        <div>Valid Config: {configInfo.isValid ? '✅' : '❌'}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Developer Settings</h4>
                      <div className="text-sm space-y-1">
                        <div>Address: {configInfo.developerAddress}</div>
                        <div>Revenue Share: {configInfo.developerShare}</div>
                        <div>NWC Enabled: {configInfo.nwcEnabled ? '✅' : '❌'}</div>
                        <div>WebLN Provider: {configInfo.weblnProvider}</div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Feature Pricing</h4>
                    <div className="grid md:grid-cols-3 gap-2 text-sm">
                      <div>Message Send: {albyConfig.getPricing().messageSend} sats</div>
                      <div>Identity Create: {albyConfig.getPricing().identityCreate} sats</div>
                      <div>Identity Verify: {albyConfig.getPricing().identityVerify} sats</div>
                      <div>Premium/Month: {albyConfig.getPricing().premiumMonth} sats</div>
                      <div>Business/Month: {albyConfig.getPricing().businessMonth} sats</div>
                      <div>Enterprise/Month: {albyConfig.getPricing().enterpriseMonth} sats</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}