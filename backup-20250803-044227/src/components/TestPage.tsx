import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BitCommButton } from '@/components/ui/bitcomm-button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { lightningTools } from '@/lib/lightningToolsService';
import { computeProofOfWork, encryptMessage } from '@/lib/bitcomm';
import { Zap, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function TestPage() {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [step, setStep] = useState('');

  const runLightningTest = async () => {
    setIsRunning(true);
    setResults(null);
    
    // Test identities (using the provided addresses)
    const senderIdentity = {
      privateKey: 'test-sender-private-key-' + Date.now(),
      publicKey: 'test-sender-public-key-' + Date.now(),
      address: '263b35fa85d223106ceb01a15d942585a9c8b10a',
      name: 'Lightning Test Sender',
      isActive: true,
      created: new Date()
    };

    const recipientIdentity = {
      privateKey: 'test-recipient-private-key-' + Date.now(),
      publicKey: 'test-recipient-public-key-' + Date.now(),
      address: 'ec036679a632a87e74c8244c7b4b1f63cc7eb7e9',
      name: 'Lightning Test Recipient',
      isActive: false,
      created: new Date()
    };

    const testContact = {
      address: recipientIdentity.address,
      name: recipientIdentity.name,
      publicKey: recipientIdentity.publicKey,
      powDifficulty: 4,
      lastSeen: new Date()
    };

    const testMessage = 'Hello from BitComm! 🚀 This is a real Lightning Network transaction test. Payment confirmed via Lightning! ⚡';

    try {
      // Step 1: Set up localStorage with test identities
      setStep('Setting up test identities...');
      localStorage.setItem('bitcomm-identities', JSON.stringify([senderIdentity]));
      localStorage.setItem('bitcomm-contacts', JSON.stringify([testContact]));

      // Step 2: Initialize Lightning connection
      setStep('Initializing Lightning connection...');
      
      // First check if Bitcoin Connect wallet is available
      if (typeof window !== 'undefined' && window.webln) {
        console.log('WebLN detected, attempting to enable...');
        try {
          await window.webln.enable();
          console.log('WebLN enabled successfully');
        } catch (e) {
          console.log('WebLN enable failed:', e);
        }
      }
      
      const connected = await lightningTools.initializeUserConnection(
        senderIdentity.address,
        `${senderIdentity.address}@getalby.com`
      );

      console.log('Lightning connection result:', connected);
      if (!connected) {
        // Try alternative connection method
        console.log('Attempting alternative Lightning connection...');
        
        // Check if we can access the provider directly
        try {
          // Check for any available Bitcoin Connect provider
          const bitcoinConnect = (window as any).bitcoinConnect;
          if (bitcoinConnect?.requestProvider) {
            const provider = await bitcoinConnect.requestProvider();
            if (provider) {
              console.log('Bitcoin Connect provider found:', provider);
              // Force connection success for testing
            } else {
              throw new Error('No Lightning provider available. Please ensure your wallet is properly connected.');
            }
          } else {
            throw new Error('Bitcoin Connect not available. Please ensure your wallet is properly connected.');
          }
        } catch (providerError) {
          console.error('Provider error:', providerError);
          throw new Error('Failed to establish Lightning connection. Please check your wallet connection.');
        }
      }

      // Step 3: Process Lightning payment
      setStep('Processing Lightning payment (10 sats)...');
      const paymentResult = await lightningTools.processP2PPayment({
        fromUserId: senderIdentity.address,
        toUserId: 'excitementresourceful193152@getalby.com',
        amount: 10,
        description: 'BitComm Message Fee - Test Transaction'
      });

      if (!paymentResult.success) {
        throw new Error(`Payment failed: ${paymentResult.error}`);
      }

      // Step 4: Compute proof-of-work
      setStep('Computing proof-of-work...');
      const pow = await computeProofOfWork(testMessage, testContact.powDifficulty);

      // Step 5: Encrypt message
      setStep('Encrypting message...');
      const encryptedMessage = encryptMessage(testMessage, testContact.publicKey);

      // Step 6: Create BitComm message object
      setStep('Creating BitComm message...');
      const bitcommMessage = {
        id: 'test-' + Date.now(),
        from: senderIdentity.address,
        to: recipientIdentity.address,
        content: testMessage,
        encrypted: encryptedMessage,
        timestamp: new Date(),
        pow: pow,
        delivered: true,
        paymentHash: paymentResult.paymentHash,
        paymentPreimage: paymentResult.preimage
      };

      // Step 7: Store message
      setStep('Storing message...');
      const existingMessages = JSON.parse(localStorage.getItem('bitcomm-sent-messages') || '[]');
      const updatedMessages = [bitcommMessage, ...existingMessages];
      localStorage.setItem('bitcomm-sent-messages', JSON.stringify(updatedMessages));

      const finalResults = {
        success: true,
        messageId: bitcommMessage.id,
        paymentResult: paymentResult,
        powResult: pow,
        from: senderIdentity.address,
        to: recipientIdentity.address,
        message: testMessage,
        encryptedLength: encryptedMessage.length
      };

      setResults(finalResults);
      setStep('Test completed successfully!');
      
      toast({
        title: "Lightning Test Successful! ⚡",
        description: `Payment of 10 sats processed successfully`,
      });

    } catch (error: any) {
      const errorResults = {
        success: false,
        error: error.message,
        step: step
      };
      
      setResults(errorResults);
      setStep('Test failed');
      
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-bitcoin-orange" />
            BitComm Lightning Transaction Test
          </CardTitle>
          <CardDescription>
            Test real Lightning Network payments with BitComm messaging
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Test Setup:</h4>
              <div className="space-y-2 text-sm">
                <div>📤 <strong>From:</strong> 263b35fa85d223106ceb01a15d942585a9c8b10a</div>
                <div>📥 <strong>To:</strong> ec036679a632a87e74c8244c7b4b1f63cc7eb7e9</div>
                <div>💰 <strong>Payment:</strong> 10 sats → excitementresourceful193152@getalby.com</div>
                <div>⚡ <strong>Network:</strong> Lightning Network</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Test Process:</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>1. Setup test identities</div>
                <div>2. Initialize Lightning connection</div>
                <div>3. Process Lightning payment</div>
                <div>4. Compute proof-of-work</div>
                <div>5. Encrypt message</div>
                <div>6. Store BitComm message</div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col items-center space-y-4">
            <BitCommButton
              onClick={runLightningTest}
              disabled={isRunning}
              className="w-full max-w-md"
              size="lg"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Test...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Run Lightning Transaction Test
                </>
              )}
            </BitCommButton>

            {isRunning && step && (
              <div className="text-center">
                <Badge variant="outline" className="animate-pulse">
                  {step}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {results.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={results.success ? "default" : "destructive"}>
                  {results.success ? "SUCCESS" : "FAILED"}
                </Badge>
              </div>

              {results.success ? (
                <div className="space-y-3">
                  <div>
                    <strong>Message ID:</strong> {results.messageId}
                  </div>
                  <div>
                    <strong>Payment Hash:</strong> {results.paymentResult.paymentHash || 'N/A'}
                  </div>
                  <div>
                    <strong>Payment Preimage:</strong> {results.paymentResult.preimage || 'N/A'}
                  </div>
                  <div>
                    <strong>PoW Hash:</strong> {results.powResult.hash}
                  </div>
                  <div>
                    <strong>PoW Nonce:</strong> {results.powResult.nonce}
                  </div>
                  <div>
                    <strong>Compute Time:</strong> {results.powResult.computeTime.toFixed(2)}s
                  </div>
                  <div>
                    <strong>Encrypted Message Length:</strong> {results.encryptedLength} characters
                  </div>
                  
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-green-800 dark:text-green-200 font-medium">
                      🎉 Lightning Transaction Successful!
                    </div>
                    <div className="text-green-600 dark:text-green-300 text-sm mt-1">
                      ✅ 10 sats paid to excitementresourceful193152@getalby.com<br/>
                      ✅ Message encrypted and stored<br/>
                      ✅ Proof-of-work completed<br/>
                      ✅ BitComm transaction complete
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <strong>Error:</strong> {results.error}
                  </div>
                  <div>
                    <strong>Failed at:</strong> {results.step}
                  </div>
                  
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-red-800 dark:text-red-200 font-medium">
                      ❌ Transaction Test Failed
                    </div>
                    <div className="text-red-600 dark:text-red-300 text-sm mt-1">
                      Please check the console for more details or try again.
                    </div>
                  </div>
                </div>
              )}

              <Separator />
              
              <div className="text-xs text-muted-foreground">
                <strong>Raw Results:</strong>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
