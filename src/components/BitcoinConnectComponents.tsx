// Bitcoin Connect React Components for BitComm
import React, { useEffect, useState } from 'react'
import { bitcoinConnect } from '@/lib/bitcoinConnectService'
import { Button } from '@/components/ui/button'
import { BitCommButton } from '@/components/ui/bitcomm-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wallet, Zap, CheckCircle, AlertCircle } from 'lucide-react'

interface BitcoinConnectButtonProps {
  onConnect?: (provider: any) => void
  onDisconnect?: () => void
  className?: string
  variant?: 'default' | 'hero' | 'outline'
}

export const BitcoinConnectButton: React.FC<BitcoinConnectButtonProps> = ({
  onConnect,
  onDisconnect,
  className = '',
  variant = 'hero'
}) => {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [walletInfo, setWalletInfo] = useState<any>(null)

  useEffect(() => {
    // Initialize Bitcoin Connect
    bitcoinConnect.initialize().catch(console.error)
    
    // Check initial connection status
    setIsConnected(bitcoinConnect.isConnected())
  }, [])

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      await bitcoinConnect.launchConnectionModal()
      
      // Check if connected after modal interaction
      setTimeout(async () => {
        const connected = bitcoinConnect.isConnected()
        setIsConnected(connected)
        
        if (connected) {
          const info = await bitcoinConnect.getWalletInfo()
          setWalletInfo(info)
          if (onConnect) onConnect(info)
        }
        setIsConnecting(false)
      }, 1000)
    } catch (error) {
      console.error('Connection failed:', error)
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await bitcoinConnect.disconnectWallet()
      setIsConnected(false)
      setWalletInfo(null)
      if (onDisconnect) onDisconnect()
    } catch (error) {
      console.error('Disconnect failed:', error)
    }
  }

  if (isConnected && walletInfo) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Connected
        </Badge>
        <span className="text-sm text-gray-600">{walletInfo.alias || 'Wallet'}</span>
        <Button variant="outline" size="sm" onClick={handleDisconnect}>
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <BitCommButton
      onClick={handleConnect}
      disabled={isConnecting}
      variant={variant}
      className={className}
    >
      {isConnecting ? (
        <>
          <Zap className="h-4 w-4 mr-2 animate-pulse" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="h-4 w-4 mr-2" />
          Connect Lightning Wallet
        </>
      )}
    </BitCommButton>
  )
}

interface PaymentButtonProps {
  amount: number // Amount in satoshis
  description: string
  onPaymentSuccess?: (result: any) => void
  onPaymentError?: (error: string) => void
  disabled?: boolean
  className?: string
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  amount,
  description,
  onPaymentSuccess,
  onPaymentError,
  disabled = false,
  className = ''
}) => {
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePayment = async () => {
    setIsProcessing(true)
    try {
      const result = await bitcoinConnect.processPayment({
        amount,
        description
      })

      if (result.success) {
        if (onPaymentSuccess) onPaymentSuccess(result)
      } else {
        if (onPaymentError) onPaymentError(result.error || 'Payment failed')
      }
    } catch (error) {
      if (onPaymentError) onPaymentError(error.message || 'Payment error')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <BitCommButton
      onClick={handlePayment}
      disabled={disabled || isProcessing}
      variant="hero"
      className={className}
    >
      {isProcessing ? (
        <>
          <Zap className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <Zap className="h-4 w-4 mr-2" />
          Pay {amount} sats
        </>
      )}
    </BitCommButton>
  )
}

interface WalletStatusProps {
  className?: string
}

export const WalletStatus: React.FC<WalletStatusProps> = ({ className = '' }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [walletInfo, setWalletInfo] = useState<any>(null)

  useEffect(() => {
    const checkStatus = async () => {
      const connected = bitcoinConnect.isConnected()
      setIsConnected(connected)
      
      if (connected) {
        const info = await bitcoinConnect.getWalletInfo()
        setWalletInfo(info)
      }
    }

    checkStatus()
    
    // Check status periodically
    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Lightning Wallet</CardTitle>
      </CardHeader>
      <CardContent>
        {isConnected && walletInfo ? (
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm">{walletInfo.alias || 'Connected'}</span>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Ready
            </Badge>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-gray-600">Not connected</span>
            <BitcoinConnectButton variant="outline" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}