/**
 * Manual Transaction Test for BitComm
 * 
 * This script tests a real Lightning Network transaction:
 * - From: 263b35fa85d223106ceb01a15d942585a9c8b10a
 * - To: ec036679a632a87e74c8244c7b4b1f63cc7eb7e9
 * - Payment: 10 sats to excitementresourceful193152@getalby.com
 */

import { generateBitCommIdentity, computeProofOfWork, encryptMessage, verifyProofOfWork } from '../lib/bitcomm';
import { lightningTools } from '../lib/lightningToolsService';

// Test identities (using your provided addresses)
const senderIdentity = {
  privateKey: 'test-private-key-sender',
  publicKey: 'test-public-key-sender',
  address: '263b35fa85d223106ceb01a15d942585a9c8b10a',
  name: 'Test Sender',
  isActive: true,
  created: new Date()
};

const recipientIdentity = {
  privateKey: 'test-private-key-recipient',
  publicKey: 'test-public-key-recipient', 
  address: 'ec036679a632a87e74c8244c7b4b1f63cc7eb7e9',
  name: 'Test Recipient',
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

// Test message
const testMessage = 'Hello! This is a test message from BitComm with real Lightning payment. The future of communication is here! 🚀⚡';

export async function runManualTransactionTest() {
  console.log('🧪 Starting Manual BitComm Transaction Test');
  console.log('=====================================');
  console.log(`📤 From: ${senderIdentity.address}`);
  console.log(`📥 To: ${recipientIdentity.address}`);
  console.log(`💰 Payment Destination: excitementresourceful193152@getalby.com`);
  console.log(`⚡ Amount: 10 sats`);
  console.log(`💬 Message: "${testMessage}"`);
  console.log('=====================================\n');

  try {
    // Step 1: Initialize Lightning connection for sender
    console.log('🔗 Step 1: Initializing Lightning connection...');
    const senderConnected = await lightningTools.initializeUserConnection(
      senderIdentity.address,
      `${senderIdentity.address}@getalby.com`
    );

    if (!senderConnected) {
      throw new Error('Failed to connect sender to Lightning network');
    }
    console.log('✅ Sender Lightning connection established');

    // Step 2: Process Lightning payment (10 sats to platform)
    console.log('\n⚡ Step 2: Processing Lightning payment...');
    const paymentResult = await lightningTools.processP2PPayment({
      fromUserId: senderIdentity.address,
      toUserId: 'excitementresourceful193152@getalby.com',
      amount: 10,
      description: 'BitComm Message Fee - Manual Test'
    });

    if (!paymentResult.success) {
      throw new Error(`Payment failed: ${paymentResult.error}`);
    }

    console.log('✅ Lightning payment successful!');
    console.log(`📄 Invoice: ${paymentResult.invoice}`);
    console.log(`🔐 Payment Hash: ${paymentResult.paymentHash}`);
    console.log(`✨ Preimage: ${paymentResult.preimage}`);

    // Step 3: Compute proof-of-work
    console.log('\n⛏️ Step 3: Computing proof-of-work...');
    const powStartTime = Date.now();
    const pow = await computeProofOfWork(testMessage, testContact.powDifficulty, (nonce, hash) => {
      if (nonce % 10000 === 0) {
        console.log(`   Computing... nonce: ${nonce}, hash: ${hash.substring(0, 16)}...`);
      }
    });
    
    const powDuration = Date.now() - powStartTime;
    console.log('✅ Proof-of-work completed!');
    console.log(`🎯 Hash: ${pow.hash}`);
    console.log(`🔢 Nonce: ${pow.nonce}`);
    console.log(`📊 Difficulty: ${pow.difficulty} zeros`);
    console.log(`⏱️ Compute time: ${pow.computeTime.toFixed(2)}s`);

    // Step 4: Verify proof-of-work
    console.log('\n🔍 Step 4: Verifying proof-of-work...');
    const isValidPow = verifyProofOfWork(testMessage, pow);
    if (!isValidPow) {
      throw new Error('Proof-of-work verification failed');
    }
    console.log('✅ Proof-of-work verified successfully');

    // Step 5: Encrypt message
    console.log('\n🔐 Step 5: Encrypting message...');
    const encryptedMessage = encryptMessage(testMessage, testContact.publicKey);
    console.log('✅ Message encrypted successfully');
    console.log(`📦 Encrypted length: ${encryptedMessage.length} characters`);

    // Step 6: Create BitComm message object
    console.log('\n📝 Step 6: Creating BitComm message...');
    const bitcommMessage = {
      id: 'manual-test-' + Date.now(),
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

    console.log('✅ BitComm message created successfully');
    console.log(`🆔 Message ID: ${bitcommMessage.id}`);

    // Step 7: Store message locally (simulate sending)
    console.log('\n💾 Step 7: Storing message...');
    const existingMessages = JSON.parse(localStorage.getItem('bitcomm-sent-messages') || '[]');
    const updatedMessages = [bitcommMessage, ...existingMessages];
    localStorage.setItem('bitcomm-sent-messages', JSON.stringify(updatedMessages));
    console.log('✅ Message stored in local storage');

    // Step 8: Calculate economics
    console.log('\n💰 Step 8: Transaction Economics Summary');
    console.log('=====================================');
    console.log(`⚡ Lightning fee: 10 sats`);
    console.log(`⛏️ PoW compute time: ${pow.computeTime.toFixed(2)}s`);
    console.log(`🔋 Estimated energy cost: ${(pow.computeTime * 50 / 3600 * 0.15).toFixed(6)} USD`);
    console.log(`📊 Anti-spam effectiveness: ${Math.pow(16, pow.difficulty)} expected attempts`);
    console.log(`🎯 Message priority: High (payment + PoW)`);

    // Final success message
    console.log('\n🎉 TRANSACTION TEST COMPLETED SUCCESSFULLY! 🎉');
    console.log('==========================================');
    console.log('✅ Lightning payment processed');
    console.log('✅ Proof-of-work computed and verified');
    console.log('✅ Message encrypted and stored');
    console.log('✅ Anti-spam mechanisms active');
    console.log('✅ BitComm transaction complete');
    console.log('\n🚀 The future of decentralized communication is here!');

    return {
      success: true,
      messageId: bitcommMessage.id,
      paymentHash: paymentResult.paymentHash,
      paymentPreimage: paymentResult.preimage,
      powHash: pow.hash,
      powNonce: pow.nonce,
      computeTime: pow.computeTime,
      encryptedLength: encryptedMessage.length
    };

  } catch (error) {
    console.error('\n❌ TRANSACTION TEST FAILED');
    console.error('==========================');
    console.error(`Error: ${error.message}`);
    console.error('Full error:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Export for manual execution in browser console
export async function testInBrowser() {
  // This function can be called directly in the browser console
  return await runManualTransactionTest();
}

// If running in Node.js environment
if (typeof window === 'undefined') {
  runManualTransactionTest().then(result => {
    console.log('\n📋 Final Result:', result);
    process.exit(result.success ? 0 : 1);
  });
}
