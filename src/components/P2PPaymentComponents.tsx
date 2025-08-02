// P2P Payment Components for BitComm - Enhanced with Lightning Tools and DID Support
import React, { useState, useEffect } from 'react'
import { lightningTools } from '@/lib/lightningToolsService'
import { bitcoinConnect } from '@/lib/bitcoinConnectService'
import { useAuth } from '@/contexts/AuthContext'
import { useDIDAuth } from '@/contexts/DIDAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BitCommButton } from '@/components/ui/bitcomm-button'
import { 
  Users, 
  Zap, 
  Send, 
  Receipt, 
  History, 
  Wallet,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Shield
} from 'lucide-react'

interface P2PPaymentProps {
  recipientDID: string
  recipientName: string
  recipientDisplayName?: string
  onPaymentComplete?: (result: any) => void
}

export const P2PPaymentCard: React.FC<P2PPaymentProps> = ({
  recipientDID,
  recipientName,
  recipientDisplayName,
  onPaymentComplete
}) => {
  const { user } = useAuth()
  const { identity } = useDIDAuth()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentResult, setPaymentResult] = useState<any>(null)

  const handleP2PPayment = async () => {
    if (!amount || !description) return
    if (!user?.did && !identity?.did) {
      setPaymentResult({ success: false, error: 'No authenticated user found' })
      return
    }

    setIsProcessing(true)
    try {
      // Use DID from either AuthContext or DIDAuthContext
      const currentUserDID = user?.did || identity?.did
      
      // Auto-initialize Lightning connections for both users
      console.log('🔌 Initializing Lightning connections...')
      
      // Initialize sender connection
      const senderConnected = await lightningTools.initializeUserConnection(
        currentUserDID!, 
        `${currentUserDID}@getalby.com`
      )
      
      // Initialize recipient connection
      const recipientConnected = await lightningTools.initializeUserConnection(
        recipientDID,
        `${recipientDID}@getalby.com`
      )
      
      if (!senderConnected) {
        throw new Error('Failed to connect sender to Lightning Network')
      }
      
      if (!recipientConnected) {
        throw new Error('Failed to connect recipient to Lightning Network')
      }
      
      console.log('✅ Both users connected to Lightning Network')
      
      const result = await lightningTools.processP2PPayment({
        fromUserId: currentUserDID!,
        toUserId: recipientDID,
        amount: parseInt(amount),
        description
      })

      setPaymentResult(result)
      if (result.success && onPaymentComplete) {
        onPaymentComplete(result)
      }
    } catch (error) {
      setPaymentResult({ success: false, error: error instanceof Error ? error.message : 'Payment failed' })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-bitcoin-orange" />
          Send Payment to {recipientName}
        </CardTitle>
        <CardDescription>
          Send satoshis directly through Lightning Network
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Amount (sats)</label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1000"
            disabled={isProcessing}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Description</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Coffee payment"
            disabled={isProcessing}
          />
        </div>

        {paymentResult && (
          <div className={`p-3 rounded-lg ${paymentResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <div className="flex items-center gap-2">
              {paymentResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {paymentResult.success ? 'Payment Sent!' : 'Payment Failed'}
              </span>
            </div>
            {paymentResult.error && (
              <p className="text-xs mt-1">{paymentResult.error}</p>
            )}
          </div>
        )}

        <BitCommButton
          onClick={handleP2PPayment}
          disabled={!amount || !description || isProcessing}
          variant="hero"
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Zap className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send {amount || '0'} sats
            </>
          )}
        </BitCommButton>
      </CardContent>
    </Card>
  )
}

interface PaywallCardProps {
  feature: string
  amount: number
  description: string
  onPaymentSuccess?: () => void
}

export const PaywallCard: React.FC<PaywallCardProps> = ({
  feature,
  amount,
  description,
  onPaymentSuccess
}) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentResult, setPaymentResult] = useState<any>(null)

  const handlePaywallPayment = async () => {
    setIsProcessing(true)
    try {
      const { invoice, verification } = await lightningTools.createPaywall({
        amount,
        description,
        feature,
        onPaid: onPaymentSuccess
      })

      // Launch Bitcoin Connect payment modal
      await bitcoinConnect.launchPaymentModal(invoice, (response) => {
        setPaymentResult({ success: true, preimage: response.preimage })
        if (onPaymentSuccess) onPaymentSuccess()
      })

      // Wait for payment verification
      const verified = await verification
      if (verified) {
        setPaymentResult({ success: true })
        if (onPaymentSuccess) onPaymentSuccess()
      }
    } catch (error) {
      setPaymentResult({ success: false, error: error.message })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className="border-bitcoin-orange/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-bitcoin-orange" />
          Premium Feature: {feature}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">{amount} sats</span>
          <Badge variant="outline" className="text-bitcoin-orange border-bitcoin-orange">
            Lightning Payment
          </Badge>
        </div>

        <Separator />

        {paymentResult && (
          <div className={`p-3 rounded-lg ${paymentResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <div className="flex items-center gap-2">
              {paymentResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {paymentResult.success ? 'Access Granted!' : 'Payment Failed'}
              </span>
            </div>
          </div>
        )}

        <BitCommButton
          onClick={handlePaywallPayment}
          disabled={isProcessing}
          variant="hero"
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Zap className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4 mr-2" />
              Unlock Feature
            </>
          )}
        </BitCommButton>
      </CardContent>
    </Card>
  )
}

interface PaymentHistoryProps {
  userDID?: string // Optional - will use current user if not provided
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ userDID }) => {
  const { user } = useAuth()
  const { identity } = useDIDAuth()
  const [payments, setPayments] = useState<any[]>([])
  
  // Use provided DID or current user's DID
  const currentDID = userDID || user?.did || identity?.did

  useEffect(() => {
    if (currentDID) {
      const history = lightningTools.getP2PPaymentHistory(currentDID)
      setPayments(history.slice(-10)) // Show last 10 payments
    }
  }, [currentDID])

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">No payments yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Recent Payments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {payments.map((payment, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${payment.from === currentDID ? 'bg-red-100' : 'bg-green-100'}`}>
                  {payment.from === currentDID ? (
                    <Send className="h-4 w-4 text-red-600" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{payment.description}</p>
                  <p className="text-sm text-gray-500">
                    {payment.from === currentDID ? 'Sent' : 'Received'} • {new Date(payment.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${payment.from === currentDID ? 'text-red-600' : 'text-green-600'}`}>
                  {payment.from === currentDID ? '-' : '+'}{payment.amount} sats
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}