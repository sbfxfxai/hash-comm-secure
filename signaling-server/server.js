require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({
    server,
    maxPayload: 16 * 1024, // 16KB max message size
    clientTracking: true
});

const PORT = process.env.PORT || 8080;
const SIGNALING_VERSION = '1.0.1';
const MAX_PEERS_PER_ADDRESS = 10;
const MAX_MESSAGE_RATE = 100; // messages per minute per peer

// Enhanced middleware
app.use(helmet({
    contentSecurityPolicy: false, // Allow WebSocket connections
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'https://bitcomm.email'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP'
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));

// Enhanced peer storage with rate limiting
const peers = new Map();
const rooms = new Map();
const peerMessageRates = new Map(); // Track message rates per peer

// Utility functions
function isValidBitCommAddress(address) {
    // Basic validation - adjust based on your address format
    return typeof address === 'string' &&
        address.length >= 20 &&
        address.length <= 100 &&
        /^[a-zA-Z0-9]+$/.test(address);
}

function rateLimitCheck(peerId) {
    const now = Date.now();
    const windowMs = 60000; // 1 minute

    if (!peerMessageRates.has(peerId)) {
        peerMessageRates.set(peerId, { count: 1, windowStart: now });
        return true;
    }

    const rateData = peerMessageRates.get(peerId);

    // Reset window if expired
    if (now - rateData.windowStart > windowMs) {
        rateData.count = 1;
        rateData.windowStart = now;
        return true;
    }

    // Check if under limit
    if (rateData.count < MAX_MESSAGE_RATE) {
        rateData.count++;
        return true;
    }

    return false;
}

// Enhanced REST API endpoints
app.get('/health', (req, res) => {
    const memUsage = process.memoryUsage();
    res.json({
        status: 'healthy',
        version: SIGNALING_VERSION,
        connectedPeers: peers.size,
        activeRooms: rooms.size,
        uptime: Math.floor(process.uptime()),
        memory: {
            used: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
            total: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB'
        }
    });
});

app.get('/stats', (req, res) => {
    const roomStats = Array.from(rooms.entries()).map(([address, peerSet]) => ({
        address: address.substring(0, 8) + '...', // Privacy: only show first 8 chars
        peerCount: peerSet.size
    }));

    res.json({
        totalPeers: peers.size,
        activeRooms: rooms.size,
        serverUptime: Math.floor(process.uptime()),
        version: SIGNALING_VERSION,
        roomDistribution: roomStats.slice(0, 10), // Top 10 rooms only
        averagePeersPerRoom: rooms.size > 0 ? Math.round(peers.size / rooms.size * 100) / 100 : 0
    });
});

// Admin endpoint (with basic auth)
app.get('/admin/rooms', (req, res) => {
    const authHeader = req.headers.authorization;
    const adminToken = process.env.ADMIN_TOKEN;

    if (!adminToken || authHeader !== `Bearer ${adminToken}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const detailedRooms = Array.from(rooms.entries()).map(([address, peerSet]) => ({
        address,
        peers: Array.from(peerSet).map(peerId => {
            const peer = peers.get(peerId);
            return {
                id: peerId,
                joinedAt: peer?.joinedAt,
                lastSeen: peer?.lastSeen
            };
        })
    }));

    res.json(detailedRooms);
});

// WebSocket connection handling with enhanced security
wss.on('connection', (ws, req) => {
    const peerId = uuidv4();
    const clientIP = req.socket.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';

    const peerInfo = {
        id: peerId,
        ws: ws,
        bitcommAddress: null,
        joinedAt: new Date(),
        lastSeen: new Date(),
        rooms: new Set(),
        clientIP: clientIP,
        messageCount: 0
    };

    peers.set(peerId, peerInfo);
    console.log(`🔗 Peer connected: ${peerId} from ${clientIP}`);

    // Send welcome message with peer ID and server capabilities
    ws.send(JSON.stringify({
        type: 'welcome',
        peerId: peerId,
        serverVersion: SIGNALING_VERSION,
        capabilities: {
            maxPeersPerAddress: MAX_PEERS_PER_ADDRESS,
            messageRateLimit: MAX_MESSAGE_RATE
        }
    }));

    ws.on('message', async (message) => {
        try {
            // Rate limiting check
            if (!rateLimitCheck(peerId)) {
                ws.send(JSON.stringify({
                    type: 'error',
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Message rate limit exceeded. Please slow down.'
                }));
                return;
            }

            const data = JSON.parse(message);

            // Update message count and last seen
            peerInfo.messageCount++;
            peerInfo.lastSeen = new Date();

            await handleSignalingMessage(peerId, data);
        } catch (error) {
            console.error(`❌ Failed to process message from ${peerId}:`, error);
            ws.send(JSON.stringify({
                type: 'error',
                code: 'INVALID_MESSAGE',
                message: 'Invalid message format'
            }));
        }
    });

    ws.on('close', (code, reason) => {
        console.log(`🔌 Peer ${peerId} disconnected: ${code} ${reason}`);
        handlePeerDisconnection(peerId);
    });

    ws.on('error', (error) => {
        console.error(`⚠️ WebSocket error for peer ${peerId}:`, error);
        handlePeerDisconnection(peerId);
    });

    // Enhanced ping-pong for connection health
    ws.isAlive = true;
    ws.on('pong', () => {
        ws.isAlive = true;
        if (peers.has(peerId)) {
            peers.get(peerId).lastSeen = new Date();
        }
    });
});

// Enhanced signaling message handling
async function handleSignalingMessage(fromPeerId, data) {
    const peer = peers.get(fromPeerId);
    if (!peer) return;

    // Validate message structure
    if (!data.type || typeof data.type !== 'string') {
        peer.ws.send(JSON.stringify({
            type: 'error',
            code: 'INVALID_MESSAGE_TYPE',
            message: 'Message must have a valid type field'
        }));
        return;
    }

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
            peer.ws.send(JSON.stringify({
                type: 'pong',
                timestamp: Date.now(),
                serverTime: new Date().toISOString()
            }));
            break;

        case 'leave-room':
            await handleLeaveRoom(fromPeerId, data);
            break;

        default:
            console.warn(`🤔 Unknown message type from ${fromPeerId}:`, data.type);
            peer.ws.send(JSON.stringify({
                type: 'error',
                code: 'UNKNOWN_MESSAGE_TYPE',
                message: `Unknown message type: ${data.type}`
            }));
    }
}

// Enhanced peer registration with validation
async function handlePeerRegistration(peerId, data) {
    const peer = peers.get(peerId);
    if (!peer) return;

    const { bitcommAddress } = data;

    // Validation
    if (!bitcommAddress || !isValidBitCommAddress(bitcommAddress)) {
        peer.ws.send(JSON.stringify({
            type: 'error',
            code: 'INVALID_ADDRESS',
            message: 'Valid BitComm address required for registration'
        }));
        return;
    }

    // Check if room is at capacity
    const existingRoom = rooms.get(bitcommAddress);
    if (existingRoom && existingRoom.size >= MAX_PEERS_PER_ADDRESS) {
        peer.ws.send(JSON.stringify({
            type: 'error',
            code: 'ROOM_FULL',
            message: `Maximum ${MAX_PEERS_PER_ADDRESS} peers allowed per address`
        }));
        return;
    }

    // Unregister from previous address if any
    if (peer.bitcommAddress && peer.bitcommAddress !== bitcommAddress) {
        const oldRoom = rooms.get(peer.bitcommAddress);
        if (oldRoom) {
            oldRoom.delete(peerId);
            if (oldRoom.size === 0) {
                rooms.delete(peer.bitcommAddress);
            }
        }
        peer.rooms.delete(peer.bitcommAddress);
    }

    peer.bitcommAddress = bitcommAddress;

    // Add to room for this address
    if (!rooms.has(bitcommAddress)) {
        rooms.set(bitcommAddress, new Set());
    }
    rooms.get(bitcommAddress).add(peerId);
    peer.rooms.add(bitcommAddress);

    console.log(`📝 Peer ${peerId} registered with address: ${bitcommAddress.substring(0, 8)}...`);

    peer.ws.send(JSON.stringify({
        type: 'registered',
        bitcommAddress: bitcommAddress,
        peerId: peerId,
        roomSize: rooms.get(bitcommAddress).size
    }));
}

// Enhanced peer discovery with more metadata
async function handlePeerDiscovery(peerId, data) {
    const peer = peers.get(peerId);
    if (!peer) return;

    const { targetAddress } = data;

    if (!targetAddress || !isValidBitCommAddress(targetAddress)) {
        peer.ws.send(JSON.stringify({
            type: 'error',
            code: 'INVALID_TARGET_ADDRESS',
            message: 'Valid target address required for peer discovery'
        }));
        return;
    }

    const targetPeers = rooms.get(targetAddress);
    if (!targetPeers || targetPeers.size === 0) {
        peer.ws.send(JSON.stringify({
            type: 'peers-found',
            targetAddress: targetAddress,
            peers: [],
            timestamp: Date.now()
        }));
        return;
    }

    // Return list of online peers for this address (excluding self)
    const availablePeers = Array.from(targetPeers)
        .filter(pId => pId !== peerId && peers.has(pId))
        .map(pId => {
            const targetPeer = peers.get(pId);
            return {
                peerId: pId,
                lastSeen: targetPeer.lastSeen.toISOString(),
                joinedAt: targetPeer.joinedAt.toISOString(),
                isOnline: Date.now() - targetPeer.lastSeen.getTime() < 30000 // Online if seen in last 30s
            };
        })
        .slice(0, 5); // Limit to 5 peers for performance

    console.log(`🔍 Peer discovery: ${peerId} found ${availablePeers.length} peers for ${targetAddress.substring(0, 8)}...`);

    peer.ws.send(JSON.stringify({
        type: 'peers-found',
        targetAddress: targetAddress,
        peers: availablePeers,
        timestamp: Date.now()
    }));
}

// Enhanced signaling relay with validation
async function relaySignalingMessage(fromPeerId, data) {
    const { targetPeerId, ...messageData } = data;

    if (!targetPeerId || !peers.has(targetPeerId)) {
        const peer = peers.get(fromPeerId);
        if (peer) {
            peer.ws.send(JSON.stringify({
                type: 'error',
                code: 'TARGET_PEER_NOT_FOUND',
                message: 'Target peer not found or offline',
                targetPeerId: targetPeerId
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

    // Validate message size
    const messageStr = JSON.stringify(relayedMessage);
    if (messageStr.length > 16384) { // 16KB limit
        const peer = peers.get(fromPeerId);
        if (peer) {
            peer.ws.send(JSON.stringify({
                type: 'error',
                code: 'MESSAGE_TOO_LARGE',
                message: 'Message exceeds size limit'
            }));
        }
        return;
    }

    try {
        targetPeer.ws.send(messageStr);
        console.log(`📡 Relayed ${data.type} from ${fromPeerId} to ${targetPeerId}`);
    } catch (error) {
        console.error(`❌ Failed to relay message:`, error);
        // Target peer might be disconnected
        handlePeerDisconnection(targetPeerId);
    }
}

// Handle leaving a room
async function handleLeaveRoom(peerId, data) {
    const peer = peers.get(peerId);
    if (!peer) return;

    const { bitcommAddress } = data;

    if (bitcommAddress && rooms.has(bitcommAddress)) {
        const room = rooms.get(bitcommAddress);
        room.delete(peerId);
        peer.rooms.delete(bitcommAddress);

        if (room.size === 0) {
            rooms.delete(bitcommAddress);
        }

        if (peer.bitcommAddress === bitcommAddress) {
            peer.bitcommAddress = null;
        }

        peer.ws.send(JSON.stringify({
            type: 'left-room',
            bitcommAddress: bitcommAddress
        }));
    }
}

// Enhanced peer disconnection handling
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

    // Clean up rate limiting data
    peerMessageRates.delete(peerId);

    peers.delete(peerId);
    console.log(`🔌 Peer disconnected: ${peerId} (total messages: ${peer.messageCount})`);
}

// Enhanced health check with metrics
const healthCheckInterval = setInterval(() => {
    const staleThreshold = 60000; // 60 seconds
    const now = new Date();
    let terminatedConnections = 0;
    let cleanedPeers = 0;

    wss.clients.forEach((ws) => {
        if (!ws.isAlive) {
            console.log('🔍 Terminating stale connection');
            ws.terminate();
            terminatedConnections++;
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
            cleanedPeers++;
        }
    }

    // Clean up old rate limiting data
    const rateCleanupThreshold = 5 * 60 * 1000; // 5 minutes
    for (const [peerId, rateData] of peerMessageRates.entries()) {
        if (now.getTime() - rateData.windowStart > rateCleanupThreshold) {
            peerMessageRates.delete(peerId);
        }
    }

    // Log health check results if any cleanup occurred
    if (terminatedConnections > 0 || cleanedPeers > 0) {
        console.log(`🏥 Health check: terminated ${terminatedConnections} connections, cleaned ${cleanedPeers} peers`);
    }
}, 30000); // Check every 30 seconds

// Enhanced graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
    console.log('🛑 Shutdown signal received, closing server gracefully...');
    clearInterval(healthCheckInterval);

    // Notify all connected peers
    const shutdownMessage = JSON.stringify({
        type: 'server-shutdown',
        message: 'Server is shutting down',
        timestamp: Date.now()
    });

    wss.clients.forEach((ws) => {
        try {
            ws.send(shutdownMessage);
            ws.close(1000, 'Server shutting down');
        } catch (error) {
            ws.terminate();
        }
    });

    server.close(() => {
        console.log('✅ Server closed gracefully');
        process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
        console.log('⚠️ Forcing server close');
        process.exit(1);
    }, 10000);
}

server.listen(PORT, () => {
    console.log(`🚀 Enhanced BitComm WebRTC Signaling Server v${SIGNALING_VERSION}`);
    console.log(`📡 Listening on port ${PORT}`);
    console.log(`🌐 Ready to handle WebRTC peer connections`);
    console.log(`⚙️ Configuration:`);
    console.log(`   - Max peers per address: ${MAX_PEERS_PER_ADDRESS}`);
    console.log(`   - Message rate limit: ${MAX_MESSAGE_RATE}/minute`);
    console.log(`   - Max message size: 16KB`);
});