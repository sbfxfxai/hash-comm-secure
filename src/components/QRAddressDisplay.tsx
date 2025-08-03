import React, { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { QRAddressManager, AddressInfo } from '../lib/qr-address';
import { Copy, Download, Share2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface QRAddressDisplayProps {
  userAddress?: string;
  displayName?: string;
  publicKey?: string;
  className?: string;
}

export const QRAddressDisplay: React.FC<QRAddressDisplayProps> = ({
  userAddress,
  displayName,
  publicKey,
  className = ''
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const qrManager = QRAddressManager.getInstance();

  useEffect(() => {
    generateQRCode();
  }, [userAddress, displayName, publicKey]);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      const addressInfo: AddressInfo = {
        address: userAddress || qrManager.getCurrentUserAddressInfo().address,
        displayName: displayName || qrManager.getCurrentUserAddressInfo().displayName,
        publicKey: publicKey || qrManager.getCurrentUserAddressInfo().publicKey,
        timestamp: Date.now()
      };

      // Generate data URL for display
      const qrUrl = await qrManager.generateAddressQR(addressInfo);
      setQrCodeUrl(qrUrl);

      // Also generate on canvas for potential canvas operations
      if (canvasRef.current) {
        await qrManager.generateQRToCanvas(canvasRef.current, addressInfo);
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      toast({
        title: "QR Generation Failed",
        description: "Could not generate QR code for your address",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyAddressToClipboard = async () => {
    const address = userAddress || qrManager.getCurrentUserAddressInfo().address;
    try {
      await navigator.clipboard.writeText(address);
      toast({
        title: "Address Copied",
        description: "Your BitComm address has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy address to clipboard",
        variant: "destructive"
      });
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.download = `bitcomm-address-${Date.now()}.png`;
    link.href = qrCodeUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "QR Code Downloaded",
      description: "Your QR code has been saved to your device",
    });
  };

  const shareQRCode = async () => {
    if (!navigator.share) {
      toast({
        title: "Share Not Supported",
        description: "Your browser doesn't support native sharing",
        variant: "destructive"
      });
      return;
    }

    try {
      // Convert data URL to blob for sharing
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const file = new File([blob], 'bitcomm-address.png', { type: 'image/png' });

      await navigator.share({
        title: 'My BitComm Address',
        text: 'Scan this QR code to add my BitComm address',
        files: [file]
      });
    } catch (error) {
      console.error('Share failed:', error);
      toast({
        title: "Share Failed",
        description: "Could not share QR code",
        variant: "destructive"
      });
    }
  };

  const currentAddress = userAddress || qrManager.getCurrentUserAddressInfo().address;
  const currentDisplayName = displayName || qrManager.getCurrentUserAddressInfo().displayName;

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          My BitComm Address
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code Display */}
        <div className="flex flex-col items-center space-y-3">
          {isGenerating ? (
            <div className="w-64 h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Generating QR Code...</p>
              </div>
            </div>
          ) : qrCodeUrl ? (
            <img 
              src={qrCodeUrl} 
              alt="BitComm Address QR Code"
              className="w-64 h-64 border rounded-lg shadow-sm"
            />
          ) : (
            <div className="w-64 h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <p className="text-sm text-gray-600">QR Code not available</p>
            </div>
          )}
          
          {/* Hidden canvas for additional QR operations */}
          <canvas 
            ref={canvasRef}
            className="hidden"
            width={256}
            height={256}
          />
        </div>

        {/* Address Info */}
        <div className="space-y-2">
          <div>
            <label className="text-sm font-medium text-gray-700">Display Name:</label>
            <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
              {currentDisplayName}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Address:</label>
            <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded break-all">
              {currentAddress}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={copyAddressToClipboard}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Address
          </Button>
          
          <Button
            onClick={downloadQRCode}
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={!qrCodeUrl}
          >
            <Download className="h-4 w-4 mr-2" />
            Download QR
          </Button>
          
          {navigator.share && (
            <Button
              onClick={shareQRCode}
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={!qrCodeUrl}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}
        </div>

        <p className="text-xs text-gray-500 text-center">
          Share this QR code so others can easily add your address for messaging
        </p>
      </CardContent>
    </Card>
  );
};

export default QRAddressDisplay;
