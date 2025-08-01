import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BitCommButton } from '@/components/ui/bitcomm-button';
import { Wifi, WifiOff, Users, Activity, Radio } from 'lucide-react';
import { webrtcP2P as bitcommP2P, MessageEnvelope } from '@/lib/p2p/webrtc-p2p';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const P2PNetworkStatus = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [networkStats, setNetworkStats] = useState({
    peerId: 'Not connected',
    connectedPeers: 0,
    isOnline: false,
    peers: [] as string[]
  });
  const [isInitializing, setIsInitializing] = useState(false);
  const [receivedMessages, setReceivedMessages] = useState<MessageEnvelope[]>([]);

  const updateNetworkStats = () => {
    const stats = bitcommP2P.getNetworkStats();
    setNetworkStats(stats);
    setIsConnected(stats.isOnline);
  };

  const handleReceivedMessage = (envelope: MessageEnvelope) => {
    setReceivedMessages(prev => [envelope, ...prev].slice(0, 10)); // Keep last 10 messages
    toast({
      title: "Message Received",
      description: `New message from ${envelope.message.from.substring(0, 12)}...`,
    });
  };

  const initializeP2P = async () => {
    setIsInitializing(true);
    try {
      // Initialize P2P network with user's DID
      if (user?.did) {
        await bitcommP2P.initialize(user.did);
      }
      bitcommP2P.addMessageHandler(handleReceivedMessage);
      updateNetworkStats();
      
      toast({
        title: "P2P Network Started",
        description: "Successfully connected to BitComm network",
      });

      // Update stats periodically
      const interval = setInterval(updateNetworkStats, 5000);
      return () => clearInterval(interval);
    } catch (error) {
      console.error('Failed to initialize P2P:', error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to P2P network",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const shutdownP2P = async () => {
    try {
      await bitcommP2P.shutdown();
      setIsConnected(false);
      setNetworkStats({
        peerId: 'Not connected',
        connectedPeers: 0,
        isOnline: false,
        peers: []
      });
      
      toast({
        title: "Network Disconnected",
        description: "P2P network shut down successfully",
      });
    } catch (error) {
      console.error('Failed to shutdown P2P:', error);
    }
  };

  useEffect(() => {
    updateNetworkStats();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            P2P Network Status
          </CardTitle>
          <CardDescription>
            BitComm decentralized networking layer status and statistics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
                {isConnected && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {networkStats.peerId.substring(0, 12)}...
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Peer ID: {networkStats.peerId}
              </p>
            </div>
            
            <div className="flex gap-2">
              {!isConnected ? (
                <BitCommButton
                  onClick={initializeP2P}
                  disabled={isInitializing}
                  className="bg-gradient-primary"
                >
                  {isInitializing ? (
                    <>
                      <Activity className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Radio className="h-4 w-4 mr-2" />
                      Start P2P Network
                    </>
                  )}
                </BitCommButton>
              ) : (
                <Button onClick={shutdownP2P} variant="outline">
                  <WifiOff className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              )}
            </div>
          </div>

          {isConnected && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{networkStats.connectedPeers}</span>
                </div>
                <p className="text-sm text-muted-foreground">Connected Peers</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{receivedMessages.length}</span>
                </div>
                <p className="text-sm text-muted-foreground">Messages Received</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Radio className="h-4 w-4 text-green-500" />
                  <span className="text-2xl font-bold text-green-500">LIVE</span>
                </div>
                <p className="text-sm text-muted-foreground">Network Status</p>
              </div>
            </div>
          )}

          {networkStats.peers.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Connected Peers</h4>
              <div className="flex flex-wrap gap-2">
                {networkStats.peers.slice(0, 5).map((peerId, index) => (
                  <Badge key={index} variant="outline" className="font-mono text-xs">
                    {peerId.substring(0, 8)}...
                  </Badge>
                ))}
                {networkStats.peers.length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    +{networkStats.peers.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {receivedMessages.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Recent Messages</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {receivedMessages.slice(0, 3).map((envelope, index) => (
                  <div key={index} className="text-xs bg-muted/50 p-2 rounded">
                    <div className="font-mono">From: {envelope.message.from.substring(0, 16)}...</div>
                    <div className="text-muted-foreground">
                      {new Date(envelope.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};