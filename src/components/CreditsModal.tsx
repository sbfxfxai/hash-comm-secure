/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Zap, Copy, Check, CreditCard, Wallet, AlertCircle } from 'lucide-react';

interface CreditsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreditsAdded: () => void;
}

interface CreditPackage {
    sats: number;
    price: string;
    recommended?: boolean;
}

interface PaymentDetails {
    lightningAddress: string;
    amount: number;
    memo: string;
    paymentId: string;
}

// Mock streamlined payments service
const mockStreamlinedPayments = {
    getCreditPackages: (): Record<string, CreditPackage> => ({
        small: { sats: 1000, price: '$1.00' },
        medium: { sats: 5000, price: '$4.50', recommended: true },
        large: { sats: 10000, price: '$8.00' }
    }),

    getPaymentSummary: () => ({
        creditsBalance: 2500,
        messagesRemaining: 250
    }),

    generateLightningAddressPayment: (amount: number): PaymentDetails => ({
        lightningAddress: 'bitcomm@getalby.com',
        amount,
        memo: `BitComm Credits - ${amount} sats`,
        paymentId: `payment_${Date.now()}`
    }),

    addCredits: (amount: number, method: string) => {
        console.log(`Added ${amount} sats via ${method}`);
        return true;
    }
};

// Mock toast hook
const useToast = () => ({
    toast: useCallback((options: { title: string; description: string; variant?: string }) => {
        console.log('Toast:', options);
    }, [])
});

type PackageKey = 'small' | 'medium' | 'large';

export const CreditsModal: React.FC<CreditsModalProps> = ({
    isOpen,
    onClose,
    onCreditsAdded
}) => {
    const [selectedPackage, setSelectedPackage] = useState<PackageKey>('medium');
    const [showLightningPayment, setShowLightningPayment] = useState(false);
    const [paymentGenerated, setPaymentGenerated] = useState<PaymentDetails | null>(null);
    const [copied, setCopied] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const { toast } = useToast();

    const creditPackages = mockStreamlinedPayments.getCreditPackages();
    const summary = mockStreamlinedPayments.getPaymentSummary();

    const generateLightningPayment = useCallback(() => {
        const packageInfo = creditPackages[selectedPackage];
        if (!packageInfo) return;

        const payment = mockStreamlinedPayments.generateLightningAddressPayment(packageInfo.sats);
        setPaymentGenerated(payment);
        setShowLightningPayment(true);
    }, [selectedPackage, creditPackages]);

    const copyLightningAddress = useCallback(async () => {
        if (!paymentGenerated) return;

        try {
            await navigator.clipboard.writeText(paymentGenerated.lightningAddress);
            setCopied(true);
            toast({
                title: "Copied!",
                description: "Lightning address copied to clipboard",
            });
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast({
                title: "Copy Failed",
                description: "Could not copy to clipboard",
                variant: "destructive"
            });
        }
    }, [paymentGenerated, toast]);

    const simulatePaymentReceived = useCallback(async () => {
        if (!paymentGenerated) return;

        setIsProcessing(true);

        try {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            const packageInfo = creditPackages[selectedPackage];
            if (!packageInfo) throw new Error('Invalid package');

            mockStreamlinedPayments.addCredits(packageInfo.sats, 'lightning');

            toast({
                title: "Credits Added!",
                description: `${packageInfo.sats} sats added to your account`,
            });

            onCreditsAdded();
            handleClose();
        } catch (error) {
            toast({
                title: "Payment Failed",
                description: "Failed to process payment. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsProcessing(false);
        }
    }, [paymentGenerated, selectedPackage, creditPackages, toast, onCreditsAdded]);

    const handleClose = useCallback(() => {
        setShowLightningPayment(false);
        setPaymentGenerated(null);
        setCopied(false);
        setIsProcessing(false);
        onClose();
    }, [onClose]);

    const handlePackageSelect = useCallback((packageKey: PackageKey) => {
        setSelectedPackage(packageKey);
    }, []);

    const calculateMessages = useCallback((sats: number) => {
        return Math.floor(sats / 10); // Assuming 10 sats per message
    }, []);

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-orange-500" />
                        Add Credits
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Current Balance */}
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-500">
                                    {summary.creditsBalance.toLocaleString()} sats
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    ~{summary.messagesRemaining.toLocaleString()} messages remaining
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {!showLightningPayment ? (
                        <>
                            {/* Credit Packages */}
                            <div className="space-y-3">
                                <h3 className="font-medium">Choose Credit Package:</h3>
                                <div className="grid gap-2">
                                    {Object.entries(creditPackages).map(([key, pkg]) => (
                                        <div
                                            key={key}
                                            className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${selectedPackage === key
                                                    ? 'border-orange-500 bg-orange-50 shadow-sm'
                                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                                }`}
                                            onClick={() => handlePackageSelect(key as PackageKey)}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="font-medium flex items-center gap-2">
                                                        {pkg.sats.toLocaleString()} sats
                                                        {pkg.recommended && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Recommended
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        ~{calculateMessages(pkg.sats).toLocaleString()} messages
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant="outline" className="font-medium">
                                                        {pkg.price}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="space-y-2">
                                <Button
                                    onClick={generateLightningPayment}
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                                    disabled={isProcessing}
                                >
                                    <Zap className="h-4 w-4 mr-2" />
                                    Pay with Lightning Network
                                </Button>

                                <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                                    <AlertCircle className="h-3 w-3" />
                                    Instant, low-fee Bitcoin payments
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Lightning Payment Details */}
                            <div className="space-y-4">
                                <div className="text-center">
                                    <h3 className="font-medium mb-2">Lightning Payment</h3>
                                    <div className="text-2xl font-bold text-orange-500">
                                        {paymentGenerated?.amount.toLocaleString()} sats
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {paymentGenerated?.memo}
                                    </div>
                                </div>

                                {/* Lightning Address */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Lightning Address:</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 p-3 bg-gray-50 rounded-lg border font-mono text-sm break-all">
                                            {paymentGenerated?.lightningAddress}
                                        </div>
                                        <Button
                                            onClick={copyLightningAddress}
                                            variant="outline"
                                            size="sm"
                                            className="shrink-0"
                                        >
                                            {copied ? (
                                                <Check className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Instructions */}
                                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                    <div className="text-sm text-blue-800 space-y-1">
                                        <div className="font-medium mb-2">Payment Instructions:</div>
                                        <div>1. Copy the Lightning address above</div>
                                        <div>2. Open your Lightning wallet</div>
                                        <div>3. Send exactly {paymentGenerated?.amount.toLocaleString()} sats</div>
                                        <div>4. Credits will be added automatically</div>
                                    </div>
                                </div>

                                {/* Demo Button - Remove in production */}
                                <div className="border-t pt-4">
                                    <div className="text-xs text-muted-foreground mb-2 text-center">
                                        Demo Mode - For testing purposes only
                                    </div>
                                    <Button
                                        onClick={simulatePaymentReceived}
                                        variant="outline"
                                        className="w-full border-dashed"
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>🧪 Simulate Payment Received</>
                                        )}
                                    </Button>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        onClick={() => setShowLightningPayment(false)}
                                        variant="outline"
                                        className="flex-1"
                                        disabled={isProcessing}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        onClick={handleClose}
                                        variant="outline"
                                        className="flex-1"
                                        disabled={isProcessing}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreditsModal;