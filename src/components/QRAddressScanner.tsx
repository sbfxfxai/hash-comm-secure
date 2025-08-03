import React, { useRef, useEffect, useState } from 'react';
import { QRAddressManager, AddressInfo } from '../lib/qr-address';
import { useToast } from '../hooks/use-toast';
import { Button } from './ui/button';
import { Barcode, Warning, CameraOff } from 'lucide-react';

interface QRAddressScannerProps {
  onScanComplete: (addressInfo: AddressInfo) => void;
  className?: string;
}

export const QRAddressScanner: React.FC<QRAddressScannerProps> = ({ onScanComplete, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();
  const qrManager = QRAddressManager.getInstance();

  useEffect(() => {
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

  return (
    <div className={`relative w-full max-w-md ${className}`}>
      <video ref={videoRef} className="w-full rounded" autoPlay muted playsInline />

      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        {isScanning ? (
          <Button onClick={stopScan} variant="outline" size="sm">
            <CameraOff className="h-4 w-4 mr-2" />
            Stop Scanning
          </Button>
        ) : (
          <Button onClick={startScan} variant="outline" size="sm">
            <Barcode className="h-4 w-4 mr-2" />
            Start Scanning
          </Button>
        )}
      </div>

      {!isScanning && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-center text-white">
            <Warning className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Camera is off. Start scanning to proceed.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRAddressScanner;

