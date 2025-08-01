// P2P Payment Components for BitComm - Enhanced with Lightning Tools
import React, { useState, useEffect } from 'react'
import { lightningTools } from '@/lib/lightningToolsService'
import { bitcoinConnect } from '@/lib/bitcoinConnectService'
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
  ArrowRight
} from 'lucide-react'

interface P2PPaymentProps {
  currentUserId: string
  recipientUserId: string
  recipientName: string
  onPaymentComplete?: (result: any) => void
}

export const P2PPaymentCard: React.FC<P2PPaymentProps> = ({
  currentUserId,
  recipientUserId,
  recipientName,
  onPaymentComplete
}) => {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentResult, setPaymentResult] = useState<any>(null)

  const handleP2PPayment = async () => {
    if (!amount || !description) return

    setIsProcessing(true)
    try {
      const result = await lightningTools.processP2PPayment({
        fromUserId: currentUserId,
        toUserId: recipientUserId,
        amount: parseInt(amount),
        description
      })

      setPaymentResult(result)
      if (result.success && onPaymentComplete) {
        onPaymentComplete(result)
      }
    } catch (error) {
      setPaymentResult({ success: false, error: error.message })
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
  userId: string
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ userId }) => {
  const [payments, setPayments] = useState<any[]>([])

  useEffect(() => {
    const history = lightningTools.getP2PPaymentHistory(userId)
    setPayments(history.slice(-10)) // Show last 10 payments
  }, [userId])

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
                <div className={`p-2 rounded-full ${payment.from === userId ? 'bg-red-100' : 'bg-green-100'}`}>
                  {payment.from === userId ? (
                    <Send className="h-4 w-4 text-red-600" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{payment.description}</p>
                  <p className="text-sm text-gray-500">
                    {payment.from === userId ? 'Sent' : 'Received'} • {new Date(payment.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${payment.from === userId ? 'text-red-600' : 'text-green-600'}`}>
                  {payment.from === userId ? '-' : '+'}{payment.amount} sats
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}