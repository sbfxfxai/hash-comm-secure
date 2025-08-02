// QR Code Wallet Connection Component
import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BitCommButton } from '@/components/ui/bitcomm-button'
import { Badge } from '@/components/ui/badge'
import { qrConnectionFlow, type QRScanResult } from '@/lib/nwc/qr-connection'
import { clientSecretManager } from '@/lib/nwc/client-secret'
import { nwcConnectionManager, type WalletConnection } from '@/lib/nwc/connection-manager'
import { 
  QrCode, 
  Smartphone, 
  Copy, 
  ExternalLink,
  CheckCircle,
  Loader2,
  RefreshCw
} from 'lucide-react'

interface QRWalletConnectProps {
  onSuccess: (connection: WalletConnection) => void
  onError: (error: string) => void
}

interface QRState {
  qrData: string
  connectionId: string
  deepLink: string
}

export const QRWalletConnect: React.FC<QRWalletConnectProps> = ({
  onSuccess,
  onError
}) => {
  const [qrState, setQrState] = useState<QRState | null>(null)
  const [isWaiting, setIsWaiting] = useState(false)
  const [supportedWallets, setSupportedWallets] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Check for supported native wallets
    qrConnectionFlow.checkNativeWalletSupport().then(setSupportedWallets)
  }, [])

  useEffect(() => {
    // Start countdown when waiting
    if (isWaiting && timeLeft > 0) {
      timeoutRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      handleTimeout()
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isWaiting, timeLeft])

  const generateQRCode = async () => {
    try {
      // Generate client secret
      const clientSecret = clientSecretManager.generateClientSecret()
      
      // Generate QR connection data
      const { qrData, connectionId } = qrConnectionFlow.generateConnectionQR(
        clientSecret.publicKey,
        ['pay_invoice', 'get_balance', 'get_info'],
        { daily: 100000, monthly: 1000000 }
      )

      // Generate deep link
      const deepLink = qrConnectionFlow.generateDeepLink(qrData)

      setQrState({ qrData, connectionId, deepLink })
      setIsWaiting(true)
      setTimeLeft(300)

      // Draw QR code
      await drawQRCode(qrData)

      // Wait for connection
      qrConnectionFlow.waitForConnection(
        connectionId,
        handleQRScanResult,
        300000 // 5 minutes
      )

      console.log('📱 QR code generated, waiting for scan...')
    } catch (error) {
      console.error('Failed to generate QR code:', error)
      onError('Failed to generate QR code')
    }
  }

  const handleQRScanResult = async (result: QRScanResult) => {
    if (!result.wallet_pubkey) {
      onError('Connection timeout or cancelled')
      setIsWaiting(false)
      return
    }

    try {
      // Complete the connection
      const connectionResult = await nwcConnectionManager.completeNostrConnection({
        wallet_pubkey: result.wallet_pubkey,
        relay_url: result.relay_url,
        wallet_name: result.wallet_name
      })

      if (connectionResult.success && connectionResult.connection) {
        onSuccess(connectionResult.connection)
        setIsWaiting(false)
      } else {
        onError(connectionResult.error || 'Failed to complete connection')
        setIsWaiting(false)
      }
    } catch (error) {
      console.error('Failed to complete connection:', error)
      onError('Failed to complete connection')
      setIsWaiting(false)
    }
  }

  const handleTimeout = () => {
    if (qrState) {
      qrConnectionFlow.cancelConnection(qrState.connectionId)
    }
    setIsWaiting(false)
    onError('Connection timeout - please try again')
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Could add toast notification here
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const openInWallet = (walletType: string) => {
    if (!qrState) return

    const walletUrls = {
      alby: `alby://connect?data=${encodeURIComponent(qrState.qrData)}`,
      phoenix: `phoenix://connect?data=${encodeURIComponent(qrState.qrData)}`,
      wallet_of_satoshi: `walletofsatoshi://connect?data=${encodeURIComponent(qrState.qrData)}`,
      blue_wallet: `bluewallet://connect?data=${encodeURIComponent(qrState.qrData)}`,
      breez: `breez://connect?data=${encodeURIComponent(qrState.qrData)}`
    }

    const url = walletUrls[walletType as keyof typeof walletUrls]
    if (url) {
      window.location.href = url
    }
  }

  const drawQRCode = async (data: string): Promise<void> => {
    if (!canvasRef.current) return

    // Simple QR code drawing (in production, use a proper QR library)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw mock QR pattern (replace with real QR library)
    ctx.fillStyle = '#000000'
    const cellSize = 8
    const size = 25

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if ((i + j) % 3 === 0 || i % 5 === 0 || j % 7 === 0) {
          ctx.fillRect(i * cellSize + 20, j * cellSize + 20, cellSize, cellSize)
        }
      }
    }

    // Draw corner squares
    const drawCornerSquare = (x: number, y: number) => {
      ctx.fillRect(x, y, cellSize * 7, cellSize * 7)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x + cellSize, y + cellSize, cellSize * 5, cellSize * 5)
      ctx.fillStyle = '#000000'
      ctx.fillRect(x + cellSize * 2, y + cellSize * 2, cellSize * 3, cellSize * 3)
    }

    drawCornerSquare(20, 20)
    drawCornerSquare(20, 20 + cellSize * 18)
    drawCornerSquare(20 + cellSize * 18, 20)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!qrState) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <QrCode className="h-5 w-5" />
            Connect Mobile Wallet
          </CardTitle>
          <CardDescription>
            Use your mobile Lightning wallet to connect with one scan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BitCommButton onClick={generateQRCode} className="w-full">
            <QrCode className="h-4 w-4 mr-2" />
            Generate QR Code
          </BitCommButton>

          <div className="space-y-2">
            <div className="text-sm font-medium">Supported Wallets:</div>
            <div className="flex flex-wrap gap-2">
              {['Alby Go', 'Phoenix', 'Wallet of Satoshi', 'Blue Wallet', 'Breez'].map((wallet) => (
                <Badge key={wallet} variant="outline" className="text-xs">
                  {wallet}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          {isWaiting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Waiting for Connection
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              Ready to Scan
            </>
          )}
        </CardTitle>
        <CardDescription>
          Scan with your Lightning wallet or open in mobile app
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* QR Code */}
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg border">
            <canvas
              ref={canvasRef}
              width={240}
              height={240}
              className="border"
            />
          </div>
        </div>

        {/* Timer */}
        {isWaiting && (
          <div className="text-center">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Expires in {formatTime(timeLeft)}
            </Badge>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(qrState.qrData)}
              className="text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy Data
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(qrState.deepLink, '_blank')}
              className="text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open Link
            </Button>
          </div>

          {/* Native Wallet Buttons */}
          {supportedWallets.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600">Or open directly:</div>
              <div className="grid grid-cols-2 gap-2">
                {supportedWallets.slice(0, 4).map((wallet) => (
                  <Button
                    key={wallet}
                    variant="outline"
                    size="sm"
                    onClick={() => openInWallet(wallet)}
                    className="text-xs capitalize"
                  >
                    <Smartphone className="h-3 w-3 mr-1" />
                    {wallet.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={generateQRCode}
            className="w-full text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Generate New Code
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}