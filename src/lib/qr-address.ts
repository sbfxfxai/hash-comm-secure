import QRCode from 'qrcode';
import QrScanner from 'qr-scanner';

export interface AddressInfo {
  address: string;
  displayName?: string;
  publicKey?: string;
  timestamp: number;
}

export class QRAddressManager {
  private static instance: QRAddressManager;
  private scanner: QrScanner | null = null;

  static getInstance(): QRAddressManager {
    if (!QRAddressManager.instance) {
      QRAddressManager.instance = new QRAddressManager();
    }
    return QRAddressManager.instance;
  }

  /**
   * Generate QR code for user's address info
   */
  async generateAddressQR(addressInfo: AddressInfo): Promise<string> {
    try {
      const qrData = JSON.stringify({
        type: 'bitcomm_address',
        ...addressInfo
      });

      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      return qrCodeDataURL;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      throw new Error('QR code generation failed');
    }
  }

  /**
   * Generate QR code for canvas rendering
   */
  async generateQRToCanvas(canvas: HTMLCanvasElement, addressInfo: AddressInfo): Promise<void> {
    try {
      const qrData = JSON.stringify({
        type: 'bitcomm_address',
        ...addressInfo
      });

      await QRCode.toCanvas(canvas, qrData, {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });
    } catch (error) {
      console.error('Failed to generate QR code to canvas:', error);
      throw new Error('QR code canvas generation failed');
    }
  }

  /**
   * Start QR code scanner with camera
   */
  async startScanner(
    videoElement: HTMLVideoElement,
    onScanResult: (addressInfo: AddressInfo) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported');
      }

      this.scanner = new QrScanner(
        videoElement,
        (result) => {
          try {
            const parsed = JSON.parse(result.data);
            
            // Validate that this is a bitcomm address QR code
            if (parsed.type === 'bitcomm_address' && parsed.address) {
              const addressInfo: AddressInfo = {
                address: parsed.address,
                displayName: parsed.displayName,
                publicKey: parsed.publicKey,
                timestamp: parsed.timestamp || Date.now()
              };
              onScanResult(addressInfo);
            } else {
              onError('Invalid QR code format');
            }
          } catch (parseError) {
            onError('Failed to parse QR code data');
          }
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      await this.scanner.start();
    } catch (error) {
      console.error('Failed to start QR scanner:', error);
      onError(`Scanner error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop QR code scanner
   */
  stopScanner(): void {
    if (this.scanner) {
      this.scanner.stop();
      this.scanner.destroy();
      this.scanner = null;
    }
  }

  /**
   * Scan QR code from image file
   */
  async scanFromFile(file: File): Promise<AddressInfo> {
    try {
      const result = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true
      });

      const parsed = JSON.parse(result.data);
      
      if (parsed.type === 'bitcomm_address' && parsed.address) {
        return {
          address: parsed.address,
          displayName: parsed.displayName,
          publicKey: parsed.publicKey,
          timestamp: parsed.timestamp || Date.now()
        };
      } else {
        throw new Error('Invalid QR code format');
      }
    } catch (error) {
      console.error('Failed to scan QR code from file:', error);
      throw new Error('QR file scan failed');
    }
  }

  /**
   * Check if QR Scanner is supported in current environment
   */
  static async isSupported(): Promise<boolean> {
    return await QrScanner.hasCamera();
  }

  /**
   * Get current user's address info for QR generation
   */
  getCurrentUserAddressInfo(): AddressInfo {
    // This should integrate with your existing identity/address system
    const address = localStorage.getItem('userAddress') || 'anonymous_' + Date.now();
    const displayName = localStorage.getItem('displayName') || 'Anonymous User';
    const publicKey = localStorage.getItem('publicKey') || undefined;

    return {
      address,
      displayName,
      publicKey,
      timestamp: Date.now()
    };
  }

  /**
   * Validate address info structure
   */
  static validateAddressInfo(data: any): data is AddressInfo {
    return (
      typeof data === 'object' &&
      typeof data.address === 'string' &&
      data.address.length > 0 &&
      typeof data.timestamp === 'number' &&
      (data.displayName === undefined || typeof data.displayName === 'string') &&
      (data.publicKey === undefined || typeof data.publicKey === 'string')
    );
  }
}

export default QRAddressManager;
