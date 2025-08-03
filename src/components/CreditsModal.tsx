import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { streamlinedPayments } from '../lib/streamlined-payments';
import { useToast } from '../hooks/use-toast';
import { Zap, Copy, Check, CreditCard, Wallet } from 'lucide-react';

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreditsAdded: () => void;
}

export const CreditsModal: React.FC<CreditsModalProps> = ({ isOpen, onClose, onCreditsAdded }) => {
  const [selectedPackage, setSelectedPackage] = useState<'small' | 'medium' | 'large'>('medium');
  const [showLightningPayment, setShowLightningPayment] = useState(false);
  const [paymentGenerated, setPaymentGenerated] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const creditPackages = streamlinedPayments.getCreditPackages();
  const summary = streamlinedPayments.getPaymentSummary();

  const generateLightningPayment = () => {
    const packageInfo = creditPackages[selectedPackage];
    const payment = streamlinedPayments.generateLightningAddressPayment(packageInfo.sats);
    setPaymentGenerated(payment);
    setShowLightningPayment(true);
  };

  const copyLightningAddress = async () => {
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
  };

  const simulatePaymentReceived = () => {
    // In production, this would be triggered by actual payment confirmation
    const packageInfo = creditPackages[selectedPackage];
    streamlinedPayments.addCredits(packageInfo.sats, 'lightning');
    
    toast({
      title: "Credits Added!",
      description: `${packageInfo.sats} sats added to your account`,
    });
    
    onCreditsAdded();
    onClose();
    setShowLightningPayment(false);
    setPaymentGenerated(null);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
                <div className="text-2xl font-bold">{summary.creditsBalance} sats</div>
                <div className="text-sm text-gray-600">
                  ~{summary.messagesRemaining} messages remaining
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
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedPackage === key
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPackage(key as any)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{pkg.sats} sats</div>
                          <div className="text-sm text-gray-600">
                            ~{Math.floor(pkg.sats / 10)} messages
                          </div>
                        </div>
                        <Badge variant="outline">{pkg.price}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <Button
                onClick={generateLightningPayment}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Zap className="h-4 w-4 mr-2" />
                Pay with Lightning
              </Button>
            </>
          ) : (
            <>
              {/* Lightning Payment Details */}
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-medium mb-2">Send Lightning Payment</h3>
                  <div className="text-2xl font-bold text-orange-500">
                    {paymentGenerated.amount} sats
                  </div>
                  <div className="text-sm text-gray-600">{paymentGenerated.memo}</div>
                </div>

                {/* Lightning Address */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lightning Address:</label>
                  <div className="flex gap-2">
                    <div className="flex-1 p-2 bg-gray-50 rounded border font-mono text-sm">
                      {paymentGenerated.lightningAddress}
                    </div>
                    <Button
                      onClick={copyLightningAddress}
                      variant="outline"
                      size="sm"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    1. Copy the Lightning address above
                    <br />
                    2. Send {paymentGenerated.amount} sats from your Lightning wallet
                    <br />
                    3. Credits will be added automatically
                  </p>
                </div>

                {/* Demo Button - Remove in production */}
                <Button
                  onClick={simulatePaymentReceived}
                  variant="outline"
                  className="w-full border-dashed"
                >
                  🧪 Simulate Payment Received (Demo)
                </Button>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowLightningPayment(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="flex-1"
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
