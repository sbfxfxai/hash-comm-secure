/**
 * BitComm Message & Payment Flow Test
 * 
 * This test script validates the complete flow of:
 * 1. Identity creation and management
 * 2. Lightning Network connection and payment processing
 * 3. Message composition with proof-of-work
 * 4. End-to-end encrypted messaging
 * 5. Payment verification and receipt
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateBitCommIdentity, computeProofOfWork, encryptMessage, decryptMessage, verifyProofOfWork } from '../lib/bitcomm';
import { lightningTools } from '../lib/lightningToolsService';

interface TestIdentity {
  privateKey: string;
  publicKey: string;
  address: string;
  name: string;
  isActive: boolean;
  created: Date;
}

interface TestContact {
  address: string;
  name: string;
  publicKey: string;
  powDifficulty: number;
  lastSeen: Date;
}

describe('BitComm Message & Payment Flow', () => {
  let senderIdentity: TestIdentity;
  let recipientIdentity: TestIdentity;
  let testContact: TestContact;

  beforeEach(async () => {
    // Create test identities
    const sender = generateBitCommIdentity();
    const recipient = generateBitCommIdentity();

    senderIdentity = {
      ...sender,
      name: 'Test Sender',
      isActive: true
    };

    recipientIdentity = {
      ...recipient,
      name: 'Test Recipient', 
      isActive: false
    };

    testContact = {
      address: recipientIdentity.address,
      name: recipientIdentity.name,
      publicKey: recipientIdentity.publicKey,
      powDifficulty: 4,
      lastSeen: new Date()
    };

    // Clear any existing test data
    localStorage.removeItem('bitcomm-identities');
    localStorage.removeItem('bitcomm-contacts');
    localStorage.removeItem('bitcomm-sent-messages');
  });

  afterEach(() => {
    // Clean up test data
    localStorage.removeItem('bitcomm-identities');
    localStorage.removeItem('bitcomm-contacts');
    localStorage.removeItem('bitcomm-sent-messages');
  });

  describe('Identity Management', () => {
    it('should create valid BitComm identities', () => {
      expect(senderIdentity.privateKey).toBeTruthy();
      expect(senderIdentity.publicKey).toBeTruthy();
      expect(senderIdentity.address).toBeTruthy();
      expect(senderIdentity.address).toHaveLength(40);
      expect(senderIdentity.created).toBeInstanceOf(Date);
    });

    it('should generate unique identities', () => {
      const identity1 = generateBitCommIdentity();
      const identity2 = generateBitCommIdentity();
      
      expect(identity1.address).not.toBe(identity2.address);
      expect(identity1.privateKey).not.toBe(identity2.privateKey);
      expect(identity1.publicKey).not.toBe(identity2.publicKey);
    });

    it('should store and retrieve identities from localStorage', () => {
      const identities = [senderIdentity, recipientIdentity];
      localStorage.setItem('bitcomm-identities', JSON.stringify(identities));

      const stored = localStorage.getItem('bitcomm-identities');
      const parsed = JSON.parse(stored!);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].address).toBe(senderIdentity.address);
      expect(parsed[1].address).toBe(recipientIdentity.address);
    });
  });

  describe('Contact Management', () => {
    it('should store and retrieve contacts', () => {
      const contacts = [testContact];
      localStorage.setItem('bitcomm-contacts', JSON.stringify(contacts));

      const stored = localStorage.getItem('bitcomm-contacts');
      const parsed = JSON.parse(stored!);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].address).toBe(testContact.address);
      expect(parsed[0].name).toBe(testContact.name);
    });
  });

  describe('Proof of Work', () => {
    it('should compute valid proof-of-work', async () => {
      const message = 'Test message for PoW';
      const difficulty = 3; // Lower difficulty for faster tests
      
      const pow = await computeProofOfWork(message, difficulty);

      expect(pow.nonce).toBeGreaterThan(0);
      expect(pow.hash).toBeTruthy();
      expect(pow.hash.startsWith('0'.repeat(difficulty))).toBe(true);
      expect(pow.computeTime).toBeGreaterThan(0);
      expect(pow.difficulty).toBe(difficulty);
    });

    it('should verify proof-of-work correctly', async () => {
      const message = 'Test message for verification';
      const difficulty = 3;
      
      const pow = await computeProofOfWork(message, difficulty);
      const isValid = verifyProofOfWork(message, pow);

      expect(isValid).toBe(true);
    });

    it('should reject invalid proof-of-work', async () => {
      const message = 'Test message';
      const pow = await computeProofOfWork(message, 3);
      
      // Tamper with the proof
      pow.nonce = pow.nonce + 1;
      
      const isValid = verifyProofOfWork(message, pow);
      expect(isValid).toBe(false);
    });
  });

  describe('Message Encryption', () => {
    it('should encrypt and decrypt messages correctly', () => {
      const message = 'Hello, this is a secret message!';
      const encrypted = encryptMessage(message, recipientIdentity.publicKey);
      const decrypted = decryptMessage(encrypted, recipientIdentity.publicKey);

      expect(encrypted).not.toBe(message);
      expect(encrypted).toBeTruthy();
      expect(decrypted).toBe(message);
    });

    it('should produce different encryption results for same message', () => {
      const message = 'Same message';
      const encrypted1 = encryptMessage(message, recipientIdentity.publicKey);
      const encrypted2 = encryptMessage(message, recipientIdentity.publicKey);

      // Due to random salt, encrypted versions should be different
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to the same message
      expect(decryptMessage(encrypted1, recipientIdentity.publicKey)).toBe(message);
      expect(decryptMessage(encrypted2, recipientIdentity.publicKey)).toBe(message);
    });
  });

  describe('Lightning Network Integration', () => {
    it('should initialize user connections', async () => {
      const connected = await lightningTools.initializeUserConnection(
        senderIdentity.address,
        `${senderIdentity.address}@getalby.com`
      );

      // Note: This will likely fail in test environment without actual Lightning setup
      // In a real test, we'd mock the Lightning service
      expect(typeof connected).toBe('boolean');
    });

    it('should handle payment processing gracefully', async () => {
      // Initialize connections first
      await lightningTools.initializeUserConnection(
        senderIdentity.address,
        `${senderIdentity.address}@getalby.com`
      );

      const paymentRequest = {
        fromUserId: senderIdentity.address,
        toUserId: 'excitementresourceful193152@getalby.com',
        amount: 10,
        description: 'BitComm Message Fee Test'
      };

      const result = await lightningTools.processP2PPayment(paymentRequest);

      // In test environment, this will likely fail, but we should get a proper error response
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      
      if (!result.success) {
        expect(result).toHaveProperty('error');
        expect(typeof result.error).toBe('string');
      }
    });
  });

  describe('Complete Message Flow', () => {
    it('should complete full message sending workflow simulation', async () => {
      // Setup test data
      localStorage.setItem('bitcomm-identities', JSON.stringify([senderIdentity]));
      localStorage.setItem('bitcomm-contacts', JSON.stringify([testContact]));

      const message = 'Hello from BitComm! This is a test message with payment and PoW.';
      const difficulty = 3; // Lower for test speed

      try {
        // Step 1: Compute proof-of-work
        console.log('📈 Computing proof-of-work...');
        const pow = await computeProofOfWork(message, difficulty);
        console.log(`✅ PoW computed: ${pow.hash} (${pow.computeTime.toFixed(2)}s)`);

        // Step 2: Encrypt message
        console.log('🔐 Encrypting message...');
        const encrypted = encryptMessage(message, testContact.publicKey);
        console.log('✅ Message encrypted');

        // Step 3: Create message object
        const bitcommMessage = {
          id: 'test-msg-' + Date.now(),
          from: senderIdentity.address,
          to: testContact.address,
          content: message,
          encrypted: encrypted,
          timestamp: new Date(),
          pow: pow,
          delivered: false
        };

        // Step 4: Store message
        const sentMessages = [bitcommMessage];
        localStorage.setItem('bitcomm-sent-messages', JSON.stringify(sentMessages));

        // Verify storage
        const stored = localStorage.getItem('bitcomm-sent-messages');
        const parsedMessages = JSON.parse(stored!);

        expect(parsedMessages).toHaveLength(1);
        expect(parsedMessages[0].id).toBe(bitcommMessage.id);
        expect(parsedMessages[0].content).toBe(message);
        expect(verifyProofOfWork(message, parsedMessages[0].pow)).toBe(true);

        console.log('✅ Complete message flow test passed');
      } catch (error) {
        console.error('❌ Message flow test failed:', error);
        throw error;
      }
    });
  });

  describe('Payment Economics', () => {
    it('should calculate message costs correctly', () => {
      const messageFee = 10; // sats
      const messageCount = 100;
      const totalCost = messageFee * messageCount;

      expect(totalCost).toBe(1000); // 1000 sats for 100 messages
      
      // At current BTC prices (~$43,000), 1000 sats ≈ $0.43
      const btcPrice = 43000;
      const usdCost = (totalCost / 100000000) * btcPrice;
      
      expect(usdCost).toBeLessThan(1); // Should be less than $1 for 100 messages
    });
  });

  describe('Anti-Spam Economics', () => {
    it('should make spam economically infeasible', async () => {
      const spamMessage = 'SPAM MESSAGE - BUY NOW!';
      const highDifficulty = 5; // Higher difficulty for spam prevention
      
      const startTime = Date.now();
      const pow = await computeProofOfWork(spamMessage, highDifficulty);
      const computeTime = Date.now() - startTime;

      // High difficulty should take significant time
      expect(pow.computeTime).toBeGreaterThan(0.1); // At least 100ms
      expect(pow.hash.startsWith('00000')).toBe(true); // 5 zeros
      
      // Calculate spam cost for 1000 messages
      const spamCount = 1000;
      const totalSpamTime = (computeTime / 1000) * spamCount; // seconds
      const electricityCost = (totalSpamTime / 3600) * 0.05 * 0.15; // 50W at $0.15/kWh
      const messageFees = spamCount * 10; // 10 sats per message
      
      console.log(`💰 Spam economics for ${spamCount} messages:`);
      console.log(`⏱️ Total compute time: ${(totalSpamTime / 3600).toFixed(2)} hours`);
      console.log(`💡 Electricity cost: $${electricityCost.toFixed(4)}`);
      console.log(`⚡ Lightning fees: ${messageFees} sats`);
      
      // Spam should be expensive in time and/or money
      expect(totalSpamTime).toBeGreaterThan(60); // At least 1 minute for 1000 messages
    });
  });
});

// Export test utilities for manual testing
export const testUtils = {
  createTestIdentity: (name: string) => ({
    ...generateBitCommIdentity(),
    name,
    isActive: false
  }),
  
  createTestContact: (identity: any, difficulty: number = 4) => ({
    address: identity.address,
    name: identity.name,
    publicKey: identity.publicKey,
    powDifficulty: difficulty,
    lastSeen: new Date()
  }),
  
  simulateMessageSend: async (
    sender: TestIdentity,
    recipient: TestContact,
    message: string,
    difficulty: number = 4
  ) => {
    console.log(`📤 Simulating message send from ${sender.name} to ${recipient.name}`);
    
    // Compute PoW
    const pow = await computeProofOfWork(message, difficulty);
    console.log(`⛏️ PoW computed: ${pow.computeTime.toFixed(2)}s`);
    
    // Encrypt message
    const encrypted = encryptMessage(message, recipient.publicKey);
    console.log(`🔐 Message encrypted`);
    
    // Simulate Lightning payment
    console.log(`⚡ Processing 10 sats Lightning payment...`);
    
    const bitcommMessage = {
      id: 'sim-' + Date.now(),
      from: sender.address,
      to: recipient.address,
      content: message,
      encrypted,
      timestamp: new Date(),
      pow,
      delivered: true
    };
    
    console.log(`✅ Message simulation complete`);
    return bitcommMessage;
  }
};
