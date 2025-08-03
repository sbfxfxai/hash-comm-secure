// Bitcoin Connect React Components for BitComm - Enhanced with NWC
import React, { useEffect, useState } from 'react'
import { bitcoinConnect } from '@/lib/bitcoinConnectService'
import { NWCConnectionModal } from '@/components/wallet/NWCConnectionModal'
import { Button } from '@/components/ui/button'
import { BitCommButton } from '@/components/ui/bitcomm-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wallet, Zap, CheckCircle, AlertCircle } from 'lucide-react'
import type { WalletConnection } from '@/lib/nwc/connection-manager'

// Type definitions
interface WalletInfo {
    alias?: string
    pubkey?: string
    color?: string
    balance?: number
    connectionType?: 'nwc' | 'webln' | 'extension'
    nodeId?: string
}

interface PaymentResult {
    success: boolean
    paymentHash?: string
    preimage?: string
    error?: string
    timestamp?: number
}

interface PaymentRequest {
    amount: number
    description: string
    expiry?: number
    metadata?: Record<string, unknown>
}

interface ConnectionResult {
    success: boolean
    walletInfo?: WalletInfo
    connectionType?: string
    error?: string
}

// Note: WalletConnection is now imported from connection-manager

interface BitcoinConnectButtonProps {
    onConnect?: (provider: WalletInfo) => void
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
    const [isConnected, setIsConnected] = useState<boolean>(false)
    const [isConnecting, setIsConnecting] = useState<boolean>(false)
    const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
    const [showModal, setShowModal] = useState<boolean>(false)

    useEffect(() => {
        // Initialize Bitcoin Connect
        bitcoinConnect.initialize().catch(console.error)

        // Check initial connection status
        setIsConnected(bitcoinConnect.isConnected())
    }, [])

    const handleConnect = (): void => {
        setShowModal(true)
    }

    const handleConnectionComplete = (connection: WalletConnection): void => {
        setIsConnected(true)
        setShowModal(false)

        // Handle wallet info retrieval asynchronously without blocking the callback
        bitcoinConnect.getWalletInfo()
            .then((info) => {
                setWalletInfo(info)
                if (onConnect) onConnect(info)
            })
            .catch((error) => {
                console.error('Failed to get wallet info after connection:', error)
                // Handle connection error - maybe show a toast or set error state
                setIsConnected(false)
                setWalletInfo(null)
            })
    }

    const handleDisconnect = async (): Promise<void> => {
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
        <>
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

            <NWCConnectionModal
                open={showModal}
                onOpenChange={setShowModal}
                onConnectionComplete={handleConnectionComplete}
            />
        </>
    )
}

interface PaymentButtonProps {
    amount: number // Amount in satoshis
    description: string
    onPaymentSuccess?: (result: PaymentResult) => void
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
    const [isProcessing, setIsProcessing] = useState<boolean>(false)

    const handlePayment = async (): Promise<void> => {
        setIsProcessing(true)
        try {
            const paymentRequest: PaymentRequest = {
                amount,
                description
            }

            const result = await bitcoinConnect.processPayment(paymentRequest)

            if (result.success) {
                if (onPaymentSuccess) onPaymentSuccess(result)
            } else {
                if (onPaymentError) onPaymentError(result.error || 'Payment failed')
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Payment error'
            if (onPaymentError) onPaymentError(errorMessage)
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
    const [isConnected, setIsConnected] = useState<boolean>(false)
    const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)

    useEffect(() => {
        const checkStatus = async (): Promise<void> => {
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

// Export types for use in other components
export type {
    WalletInfo,
    PaymentResult,
    PaymentRequest,
    ConnectionResult,
    BitcoinConnectButtonProps,
    PaymentButtonProps,
    WalletStatusProps
}

// Re-export WalletConnection from connection-manager for convenience
export type { WalletConnection } from '@/lib/nwc/connection-manager'