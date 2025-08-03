import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
    Zap,
    Wallet,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Copy,
    ExternalLink,
    RefreshCw,
    Settings,
    Eye,
    EyeOff
} from 'lucide-react';

// Types for Lightning Network routes
interface RouteHop {
    pubkey: string;
    short_channel_id: string;
    fee_msat: number;
    cltv_expiry_delta: number;
}

interface PaymentRoute {
    total_time_lock: number;
    total_fees: number;
    total_amt: number;
    hops: RouteHop[];
    total_fees_msat: number;
    total_amt_msat: number;
}

// Types for Alby WebLN and NWC
interface WebLNProvider {
    enable: () => Promise<void>;
    isEnabled: boolean;
    getInfo: () => Promise<{
        node: {
            alias: string;
            pubkey: string;
            color?: string;
        };
        methods: string[];
    }>;
    makeInvoice: (args: {
        amount: number;
        defaultMemo?: string;
    }) => Promise<{
        paymentRequest: string;
        rHash: string;
    }>;
    sendPayment: (paymentRequest: string) => Promise<{
        preimage: string;
        route?: PaymentRoute;
    }>;
    signMessage: (message: string) => Promise<{
        message: string;
        signature: string;
    }>;
    verifyMessage: (signature: string, message: string) => Promise<boolean>;
    request: (method: string, params?: unknown) => Promise<unknown>;
}

interface NostrProvider {
    getPublicKey: () => Promise<string>;
    signEvent: (event: unknown) => Promise<unknown>;
    getRelays?: () => Promise<Record<string, { read: boolean; write: boolean }>>;
    nip04?: {
        encrypt: (pubkey: string, plaintext: string) => Promise<string>;
        decrypt: (pubkey: string, ciphertext: string) => Promise<string>;
    };
}

interface NostrWalletConnect {
    nwcUrl?: string;
    relay?: string;
    walletPubkey?: string;
    secret?: string;
    enabled: boolean;
}

declare global {
    interface Window {
        webln?: WebLNProvider;
        nostr?: NostrProvider;
    }
}

interface TestResult {
    name: string;
    status: 'pending' | 'success' | 'error' | 'warning';
    message: string;
    data?: unknown;
    timestamp: number;
}

interface InvoiceTest {
    amount: number;
    memo: string;
    invoice?: string;
    paid: boolean;
    error?: string;
}

export const AlbyIntegrationTest: React.FC = () => {
    // State management
    const [webLNConnected, setWebLNConnected] = useState(false);
    const [nodeInfo, setNodeInfo] = useState<{
        node: {
            alias: string;
            pubkey: string;
            color?: string;
        };
        methods: string[];
    } | null>(null);
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [isRunningTests, setIsRunningTests] = useState(false);
    const [nwcConfig, setNwcConfig] = useState<NostrWalletConnect>({
        enabled: false
    });

    // Test parameters
    const [testAmount, setTestAmount] = useState(10);
    const [testMemo, setTestMemo] = useState('BitComm Test Payment');
    const [testMessage, setTestMessage] = useState('BitComm Alby Integration Test');
    const [showSecrets, setShowSecrets] = useState(false);

    // Invoice testing
    const [invoiceTest, setInvoiceTest] = useState<InvoiceTest>({
        amount: 10,
        memo: 'Test Invoice',
        paid: false
    });

    // Utility functions
    const addTestResult = useCallback((result: Omit<TestResult, 'timestamp'>) => {
        setTestResults(prev => [...prev, { ...result, timestamp: Date.now() }]);
    }, []);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            addTestResult({
                name: 'Clipboard',
                status: 'success',
                message: 'Copied to clipboard'
            });
        } catch (err) {
            addTestResult({
                name: 'Clipboard',
                status: 'error',
                message: 'Failed to copy to clipboard'
            });
        }
    };

    // WebLN Connection
    const connectWebLN = async () => {
        try {
            if (!window.webln) {
                throw new Error('WebLN not available. Please install Alby or another WebLN provider.');
            }

            await window.webln.enable();
            setWebLNConnected(true);

            const info = await window.webln.getInfo();
            setNodeInfo(info);

            addTestResult({
                name: 'WebLN Connection',
                status: 'success',
                message: `Connected to ${info.node.alias}`,
                data: info
            });
        } catch (error) {
            addTestResult({
                name: 'WebLN Connection',
                status: 'error',
                message: error instanceof Error ? error.message : 'Connection failed'
            });
        }
    };

    // Test WebLN Info
    const testWebLNInfo = async () => {
        if (!window.webln || !webLNConnected) {
            addTestResult({
                name: 'Node Info Test',
                status: 'error',
                message: 'WebLN not connected'
            });
            return;
        }

        try {
            const info = await window.webln.getInfo();
            addTestResult({
                name: 'Node Info Test',
                status: 'success',
                message: `Node: ${info.node.alias}`,
                data: {
                    pubkey: info.node.pubkey,
                    methods: info.methods,
                    color: info.node.color
                }
            });
        } catch (error) {
            addTestResult({
                name: 'Node Info Test',
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to get node info'
            });
        }
    };

    // Test Invoice Creation
    const testInvoiceCreation = async () => {
        if (!window.webln || !webLNConnected) {
            addTestResult({
                name: 'Invoice Creation',
                status: 'error',
                message: 'WebLN not connected'
            });
            return;
        }

        try {
            const invoice = await window.webln.makeInvoice({
                amount: testAmount,
                defaultMemo: testMemo
            });

            setInvoiceTest(prev => ({
                ...prev,
                invoice: invoice.paymentRequest,
                error: undefined
            }));

            addTestResult({
                name: 'Invoice Creation',
                status: 'success',
                message: `Created ${testAmount} sat invoice`,
                data: {
                    invoice: invoice.paymentRequest,
                    hash: invoice.rHash
                }
            });
        } catch (error) {
            addTestResult({
                name: 'Invoice Creation',
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to create invoice'
            });
        }
    };

    // Test Message Signing
    const testMessageSigning = async () => {
        if (!window.webln || !webLNConnected) {
            addTestResult({
                name: 'Message Signing',
                status: 'error',
                message: 'WebLN not connected'
            });
            return;
        }

        try {
            const signature = await window.webln.signMessage(testMessage);
            addTestResult({
                name: 'Message Signing',
                status: 'success',
                message: 'Message signed successfully',
                data: signature
            });

            // Test verification
            try {
                const verified = await window.webln.verifyMessage(signature.signature, testMessage);
                addTestResult({
                    name: 'Signature Verification',
                    status: verified ? 'success' : 'error',
                    message: verified ? 'Signature verified' : 'Signature verification failed'
                });
            } catch (verifyError) {
                addTestResult({
                    name: 'Signature Verification',
                    status: 'warning',
                    message: 'Verification method not supported'
                });
            }
        } catch (error) {
            addTestResult({
                name: 'Message Signing',
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to sign message'
            });
        }
    };

    // Test NWC Connection
    const testNWCConnection = async () => {
        if (!nwcConfig.nwcUrl) {
            addTestResult({
                name: 'NWC Connection',
                status: 'error',
                message: 'NWC URL not configured'
            });
            return;
        }

        try {
            // Parse NWC URL
            const url = new URL(nwcConfig.nwcUrl);
            const walletPubkey = url.hostname;
            const relay = url.searchParams.get('relay');
            const secret = url.searchParams.get('secret');

            setNwcConfig(prev => ({
                ...prev,
                walletPubkey,
                relay: relay || undefined,
                secret: secret || undefined,
                enabled: true
            }));

            addTestResult({
                name: 'NWC Connection',
                status: 'success',
                message: 'NWC configuration parsed successfully',
                data: {
                    walletPubkey: walletPubkey.substring(0, 16) + '...',
                    relay,
                    hasSecret: !!secret
                }
            });
        } catch (error) {
            addTestResult({
                name: 'NWC Connection',
                status: 'error',
                message: 'Invalid NWC URL format'
            });
        }
    };

    // Test Nostr Integration
    const testNostrIntegration = async () => {
        if (!window.nostr) {
            addTestResult({
                name: 'Nostr Integration',
                status: 'warning',
                message: 'Nostr extension not available'
            });
            return;
        }

        try {
            const pubkey = await window.nostr.getPublicKey();
            addTestResult({
                name: 'Nostr Integration',
                status: 'success',
                message: 'Nostr extension connected',
                data: {
                    pubkey: pubkey.substring(0, 16) + '...'
                }
            });
        } catch (error) {
            addTestResult({
                name: 'Nostr Integration',
                status: 'error',
                message: error instanceof Error ? error.message : 'Nostr connection failed'
            });
        }
    };

    // Run all basic tests
    const runAllTests = async () => {
        setIsRunningTests(true);
        setTestResults([]);

        const tests = [
            connectWebLN,
            testWebLNInfo,
            testInvoiceCreation,
            testMessageSigning,
            testNostrIntegration
        ];

        for (const test of tests) {
            await test();
            await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
        }

        setIsRunningTests(false);
    };

    // Component rendering helpers
    const getStatusIcon = (status: TestResult['status']) => {
        switch (status) {
            case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            default: return <RefreshCw className="h-4 w-4 text-gray-500 animate-spin" />;
        }
    };

    const getStatusColor = (status: TestResult['status']) => {
        switch (status) {
            case 'success': return 'text-green-600';
            case 'error': return 'text-red-600';
            case 'warning': return 'text-yellow-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-4">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
                    <Zap className="h-8 w-8 text-yellow-500" />
                    Alby Lightning Integration Test
                </h1>
                <p className="text-muted-foreground">
                    Comprehensive testing suite for Alby WebLN and Nostr Wallet Connect integration
                </p>
            </div>

            {/* Connection Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Connection Status
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Badge variant={webLNConnected ? 'default' : 'secondary'}>
                                {webLNConnected ? 'Connected' : 'Disconnected'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">WebLN Status</span>
                        </div>
                        {!webLNConnected && (
                            <Button onClick={connectWebLN} disabled={isRunningTests}>
                                Connect Wallet
                            </Button>
                        )}
                    </div>

                    {nodeInfo && (
                        <div className="bg-muted p-3 rounded-lg space-y-2">
                            <div className="flex items-center gap-2">
                                <strong>Node:</strong> {nodeInfo.node.alias}
                            </div>
                            <div className="flex items-center gap-2">
                                <strong>Pubkey:</strong>
                                <code className="text-xs bg-background px-2 py-1 rounded">
                                    {nodeInfo.node.pubkey.substring(0, 32)}...
                                </code>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard(nodeInfo.node.pubkey)}
                                >
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                            <div>
                                <strong>Methods:</strong> {nodeInfo.methods.join(', ')}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Test Tabs */}
            <Tabs defaultValue="basic" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">Basic Tests</TabsTrigger>
                    <TabsTrigger value="invoices">Invoice Testing</TabsTrigger>
                    <TabsTrigger value="nwc">NWC Integration</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced Tests</TabsTrigger>
                </TabsList>

                {/* Basic Tests Tab */}
                <TabsContent value="basic" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic WebLN Tests</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="testAmount">Test Amount (sats)</Label>
                                    <Input
                                        id="testAmount"
                                        type="number"
                                        value={testAmount}
                                        onChange={(e) => setTestAmount(Number(e.target.value))}
                                        disabled={isRunningTests}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="testMemo">Test Memo</Label>
                                    <Input
                                        id="testMemo"
                                        value={testMemo}
                                        onChange={(e) => setTestMemo(e.target.value)}
                                        disabled={isRunningTests}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="testMessage">Test Message (for signing)</Label>
                                <Textarea
                                    id="testMessage"
                                    value={testMessage}
                                    onChange={(e) => setTestMessage(e.target.value)}
                                    disabled={isRunningTests}
                                    rows={2}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={runAllTests}
                                    disabled={isRunningTests}
                                    className="flex-1"
                                >
                                    {isRunningTests ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Running Tests...
                                        </>
                                    ) : (
                                        'Run All Tests'
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setTestResults([])}
                                    disabled={isRunningTests}
                                >
                                    Clear Results
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Test Results */}
                    {testResults.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Test Results</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {testResults.map((result, index) => (
                                        <div
                                            key={index}
                                            className="flex items-start gap-3 p-3 rounded-lg border"
                                        >
                                            {getStatusIcon(result.status)}
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">{result.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(result.timestamp).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <p className={`text-sm ${getStatusColor(result.status)}`}>
                                                    {result.message}
                                                </p>
                                                {result.data && (
                                                    <details className="text-xs">
                                                        <summary className="cursor-pointer text-muted-foreground">
                                                            View Details
                                                        </summary>
                                                        <pre className="mt-2 p-2 bg-background rounded text-xs overflow-auto">
                                                            {JSON.stringify(result.data, null, 2)}
                                                        </pre>
                                                    </details>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Invoice Testing Tab */}
                <TabsContent value="invoices">
                    <Card>
                        <CardHeader>
                            <CardTitle>Invoice Testing</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="invoiceAmount">Amount (sats)</Label>
                                    <Input
                                        id="invoiceAmount"
                                        type="number"
                                        value={invoiceTest.amount}
                                        onChange={(e) => setInvoiceTest(prev => ({
                                            ...prev,
                                            amount: Number(e.target.value)
                                        }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="invoiceMemo">Memo</Label>
                                    <Input
                                        id="invoiceMemo"
                                        value={invoiceTest.memo}
                                        onChange={(e) => setInvoiceTest(prev => ({
                                            ...prev,
                                            memo: e.target.value
                                        }))}
                                    />
                                </div>
                            </div>

                            <Button onClick={testInvoiceCreation} disabled={!webLNConnected}>
                                Generate Test Invoice
                            </Button>

                            {invoiceTest.invoice && (
                                <div className="space-y-2">
                                    <Label>Generated Invoice</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={invoiceTest.invoice}
                                            readOnly
                                            className="font-mono text-xs"
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyToClipboard(invoiceTest.invoice!)}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        This is a test invoice for {invoiceTest.amount} sats. You can pay it to test the integration.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* NWC Integration Tab */}
                <TabsContent value="nwc">
                    <Card>
                        <CardHeader>
                            <CardTitle>Nostr Wallet Connect (NWC)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    NWC allows remote wallet control via Nostr. Only use trusted connection strings.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-2">
                                <Label htmlFor="nwcUrl">NWC Connection String</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="nwcUrl"
                                        type={showSecrets ? 'text' : 'password'}
                                        placeholder="nostr+walletconnect://..."
                                        value={nwcConfig.nwcUrl || ''}
                                        onChange={(e) => setNwcConfig(prev => ({
                                            ...prev,
                                            nwcUrl: e.target.value
                                        }))}
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowSecrets(!showSecrets)}
                                    >
                                        {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>

                            <Button onClick={testNWCConnection} disabled={!nwcConfig.nwcUrl}>
                                Test NWC Connection
                            </Button>

                            {nwcConfig.enabled && (
                                <div className="bg-muted p-3 rounded-lg space-y-2">
                                    <div><strong>Status:</strong> Connected</div>
                                    <div><strong>Wallet Pubkey:</strong> {nwcConfig.walletPubkey}</div>
                                    <div><strong>Relay:</strong> {nwcConfig.relay}</div>
                                    <div><strong>Secret:</strong> {nwcConfig.secret ? '••••••••' : 'Not provided'}</div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Advanced Tests Tab */}
                <TabsContent value="advanced">
                    <Card>
                        <CardHeader>
                            <CardTitle>Advanced Integration Tests</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    Advanced tests may require additional permissions or specific wallet configurations.
                                </AlertDescription>
                            </Alert>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button onClick={testNostrIntegration} variant="outline">
                                    Test Nostr Integration
                                </Button>
                                <Button onClick={testMessageSigning} variant="outline" disabled={!webLNConnected}>
                                    Test Message Signing
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label>Integration Checklist</Label>
                                <div className="space-y-2">
                                    {[
                                        { name: 'WebLN Extension Detected', check: !!window.webln },
                                        { name: 'WebLN Enabled', check: webLNConnected },
                                        { name: 'Nostr Extension Available', check: !!window.nostr },
                                        { name: 'Invoice Creation Supported', check: webLNConnected && nodeInfo?.methods.includes('makeInvoice') },
                                        { name: 'Payment Sending Supported', check: webLNConnected && nodeInfo?.methods.includes('sendPayment') },
                                        { name: 'Message Signing Supported', check: webLNConnected && nodeInfo?.methods.includes('signMessage') }
                                    ].map((item, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            {item.check ? (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-500" />
                                            )}
                                            <span className={item.check ? 'text-green-600' : 'text-red-600'}>
                                                {item.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AlbyIntegrationTest;