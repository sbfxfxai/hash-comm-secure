import React, { useRef, useEffect, useState } from 'react';
import { QRAddressManager, AddressInfo } from '../lib/qr-address';
import { useToast } from '../hooks/use-toast';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Barcode, AlertTriangle, CameraOff, Camera, Upload } from 'lucide-react';

interface QRAddressScannerProps {
  onScanComplete: (addressInfo: AddressInfo) => void;
  className?: string;
}

export const QRAddressScanner: React.FC<QRAddressScannerProps> = ({ onScanComplete, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraSupported, setCameraSupported] = useState<boolean | null>(null);
  const { toast } = useToast();
  const qrManager = QRAddressManager.getInstance();

  useEffect(() => {
    // Check camera support on mount
    QRAddressManager.isSupported().then(setCameraSupported);
    
    return () => {
      qrManager.stopScanner();
    };
  }, []);

  const startScan = async () => {
    if (!videoRef.current) return;

    try {
      setIsScanning(true);

      await qrManager.startScanner(
        videoRef.current,
        (addressInfo) => {
          onScanComplete(addressInfo);
          toast({
            title: "Scan Success",
            description: `Address scanned: ${addressInfo.displayName || addressInfo.address}`,
          });
          stopScan();
        },
        (error) => {
          toast({
            title: "Scan Error",
            description: error,
            variant: "destructive",
          });
          stopScan();
        }
      );
    } catch (error) {
      console.error('Error starting QR scanner:', error);
      toast({
        title: "Scanner Error",
        description: "Failed to start scanner",
        variant: "destructive",
      });
      stopScan();
    }
  };

  const stopScan = () => {
    qrManager.stopScanner();
    setIsScanning(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const addressInfo = await qrManager.scanFromFile(file);
      onScanComplete(addressInfo);
      toast({
        title: "File Scan Success",
        description: `Address found: ${addressInfo.displayName || addressInfo.address}`,
      });
    } catch (error) {
      toast({
        title: "File Scan Error",
        description: "Could not read QR code from this image",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="h-5 w-5" />
          Scan QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Camera Scanner */}
        <div className="relative">
          <video 
            ref={videoRef} 
            className={`w-full h-64 bg-gray-100 rounded-lg object-cover ${
              isScanning ? 'block' : 'hidden'
            }`} 
            autoPlay 
            muted 
            playsInline 
          />
          
          {!isScanning && (
            <div className="w-full h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium mb-1">QR Code Scanner</p>
                <p className="text-xs">Click "Start Camera" to scan QR codes</p>
              </div>
            </div>
          )}

          {isScanning && (
            <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
              <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-blue-500"></div>
              <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-blue-500"></div>
              <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-blue-500"></div>
              <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>

        {/* Camera Status */}
        {cameraSupported === false && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Camera Not Available</span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              Your device doesn't support camera access. Use file upload instead.
            </p>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          {cameraSupported !== false && (
            <Button 
              onClick={isScanning ? stopScan : startScan}
              variant={isScanning ? "destructive" : "default"}
              className="flex-1"
            >
              {isScanning ? (
                <>
                  <CameraOff className="h-4 w-4 mr-2" />
                  Stop Camera
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </>
              )}
            </Button>
          )}
          
          <Button 
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Image
          </Button>
        </div>

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        <p className="text-xs text-gray-500 text-center">
          Scan someone's BitComm QR code to automatically populate their address
        </p>
      </CardContent>
    </Card>
  );
};

export default QRAddressScanner;

