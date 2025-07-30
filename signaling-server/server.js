require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 8080;
const SIGNALING_VERSION = '1.0.0';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Peer storage with metadata
const peers = new Map();
const rooms = new Map(); // For peer discovery by BitComm address

// REST API endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    version: SIGNALING_VERSION,
    connectedPeers: peers.size,
    activeRooms: rooms.size
  });
});

app.get('/stats', (req, res) => {
  res.json({
    totalPeers: peers.size,
    activeRooms: rooms.size,
    serverUptime: process.uptime(),
    version: SIGNALING_VERSION
  });
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  const peerId = uuidv4();
  const peerInfo = {
    id: peerId,
    ws: ws,
    bitcommAddress: null,
    joinedAt: new Date(),
    lastSeen: new Date(),
    rooms: new Set()
  };
  
  peers.set(peerId, peerInfo);
  console.log(`🔗 Peer connected: ${peerId} (${req.socket.remoteAddress})`);

  // Send welcome message with peer ID
  ws.send(JSON.stringify({
    type: 'welcome',
    peerId: peerId,
    serverVersion: SIGNALING_VERSION
  }));

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      await handleSignalingMessage(peerId, data);
    } catch (error) {
      console.error(`❌ Failed to process message from ${peerId}:`, error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Invalid message format' 
      }));
    }
  });

  ws.on('close', () => {
    handlePeerDisconnection(peerId);
  });

  ws.on('error', (error) => {
    console.error(`⚠️ WebSocket error for peer ${peerId}:`, error);
    handlePeerDisconnection(peerId);
  });

  // Ping-pong for connection health
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
    if (peers.has(peerId)) {
      peers.get(peerId).lastSeen = new Date();
    }
  });
});

// Handle different types of signaling messages
async function handleSignalingMessage(fromPeerId, data) {
  const peer = peers.get(fromPeerId);
  if (!peer) return;

  switch (data.type) {
    case 'register':
      await handlePeerRegistration(fromPeerId, data);
      break;
    
    case 'find-peers':
      await handlePeerDiscovery(fromPeerId, data);
      break;
    
    case 'offer':
    case 'answer':
    case 'ice-candidate':
      await relaySignalingMessage(fromPeerId, data);
      break;
    
    case 'ping':
      peer.ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
    
    default:
      console.warn(`🤔 Unknown message type from ${fromPeerId}:`, data.type);
  }
}

// Register peer with BitComm address
async function handlePeerRegistration(peerId, data) {
  const peer = peers.get(peerId);
  if (!peer) return;

  const { bitcommAddress } = data;
  if (!bitcommAddress) {
    peer.ws.send(JSON.stringify({ 
      type: 'error', 
      message: 'BitComm address required for registration' 
    }));
    return;
  }

  peer.bitcommAddress = bitcommAddress;
  
  // Add to room for this address
  if (!rooms.has(bitcommAddress)) {
    rooms.set(bitcommAddress, new Set());
  }
  rooms.get(bitcommAddress).add(peerId);
  peer.rooms.add(bitcommAddress);

  console.log(`📝 Peer ${peerId} registered with address: ${bitcommAddress}`);
  
  peer.ws.send(JSON.stringify({ 
    type: 'registered', 
    bitcommAddress: bitcommAddress,
    peerId: peerId
  }));
}

// Discover peers for a BitComm address
async function handlePeerDiscovery(peerId, data) {
  const peer = peers.get(peerId);
  if (!peer) return;

  const { targetAddress } = data;
  if (!targetAddress) {
    peer.ws.send(JSON.stringify({ 
      type: 'error', 
      message: 'Target address required for peer discovery' 
    }));
    return;
  }

  const targetPeers = rooms.get(targetAddress);
  if (!targetPeers || targetPeers.size === 0) {
    peer.ws.send(JSON.stringify({ 
      type: 'peers-found', 
      targetAddress: targetAddress,
      peers: []
    }));
    return;
  }

  // Return list of online peers for this address (excluding self)
  const availablePeers = Array.from(targetPeers)
    .filter(pId => pId !== peerId && peers.has(pId))
    .map(pId => ({ 
      peerId: pId, 
      lastSeen: peers.get(pId).lastSeen.toISOString() 
    }));

  console.log(`🔍 Peer discovery: ${peerId} found ${availablePeers.length} peers for ${targetAddress}`);
  
  peer.ws.send(JSON.stringify({ 
    type: 'peers-found', 
    targetAddress: targetAddress,
    peers: availablePeers
  }));
}

// Relay WebRTC signaling messages between peers
async function relaySignalingMessage(fromPeerId, data) {
  const { targetPeerId, ...messageData } = data;
  
  if (!targetPeerId || !peers.has(targetPeerId)) {
    const peer = peers.get(fromPeerId);
    if (peer) {
      peer.ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Target peer not found or offline' 
      }));
    }
    return;
  }

  const targetPeer = peers.get(targetPeerId);
  const relayedMessage = {
    ...messageData,
    fromPeerId: fromPeerId,
    timestamp: Date.now()
  };

  targetPeer.ws.send(JSON.stringify(relayedMessage));
  console.log(`📡 Relayed ${data.type} from ${fromPeerId} to ${targetPeerId}`);
}

// Handle peer disconnection
function handlePeerDisconnection(peerId) {
  const peer = peers.get(peerId);
  if (!peer) return;

  // Remove from all rooms
  peer.rooms.forEach(roomId => {
    const room = rooms.get(roomId);
    if (room) {
      room.delete(peerId);
      if (room.size === 0) {
        rooms.delete(roomId);
      }
    }
  });

  peers.delete(peerId);
  console.log(`🔌 Peer disconnected: ${peerId}`);
}

// Health check: Remove stale connections
const healthCheckInterval = setInterval(() => {
  const staleThreshold = 60000; // 60 seconds
  const now = new Date();
  
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      console.log('🔍 Terminating stale connection');
      ws.terminate();
      return;
    }

    ws.isAlive = false;
    ws.ping();
  });
  
  // Clean up stale peer records
  for (const [peerId, peer] of peers.entries()) {
    if (now - peer.lastSeen > staleThreshold) {
      console.log(`🧹 Cleaning up stale peer: ${peerId}`);
      handlePeerDisconnection(peerId);
    }
  }
}, 30000); // Check every 30 seconds

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  clearInterval(healthCheckInterval);
  
  wss.clients.forEach((ws) => {
    ws.close(1000, 'Server shutting down');
  });
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 BitComm WebRTC Signaling Server v${SIGNALING_VERSION}`);
  console.log(`📡 Listening on port ${PORT}`);
  console.log(`🌐 Ready to handle WebRTC peer connections`);
});

