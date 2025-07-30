# BitComm Messaging System Guide

## Overview
The BitComm messaging system provides secure, encrypted, peer-to-peer communication with built-in anti-spam protection through proof-of-work mechanisms.

## Key Features
- **End-to-End Encryption**: All messages are encrypted using AES-256-GCM
- **Proof-of-Work Anti-Spam**: Computational requirements prevent spam
- **Decentralized Delivery**: Direct peer-to-peer message transmission
- **Contact Management**: Secure contact storage and organization
- **Message History**: Local storage of sent messages with metadata

## Sending Messages

### Prerequisites
1. **Active Identity**: Ensure you have created and activated an identity
2. **Contact Information**: Add recipients to your contact list
3. **Network Connection**: Stable internet connection for P2P communication

### Step-by-Step Process
1. **Navigate to Message Composer**: Click on the "Message Composer" tab
2. **Select Recipient**: Choose from your contacts or enter a BitComm address
3. **Compose Message**: Enter your message content (up to 5000 characters)
4. **Set Proof-of-Work Difficulty**: Choose difficulty level (3-6 zeros)
5. **Send Message**: Click "Send Encrypted Message" to initiate transmission

### Proof-of-Work Settings
- **Level 3**: ~15 seconds compute time, basic spam protection
- **Level 4**: ~60 seconds compute time, standard protection
- **Level 5**: ~240 seconds compute time, enhanced protection
- **Level 6**: ~960 seconds compute time, maximum protection

## Message Security

### Encryption Process
1. **Key Generation**: ECDH key exchange creates shared secret
2. **Message Encryption**: AES-256-GCM encrypts message content
3. **Metadata Protection**: Headers are encrypted to prevent analysis
4. **Signature Creation**: ECDSA signature ensures authenticity

### Verification Process
1. **Proof-of-Work Validation**: Receiving node verifies computational proof
2. **Signature Verification**: ECDSA signature confirms sender identity
3. **Decryption**: Message is decrypted using shared secret
4. **Integrity Check**: GCM tag ensures message hasn't been tampered

## Contact Management

### Adding Contacts
1. Click "Add Contact" in the Message Composer
2. Enter contact details:
   - **Name**: Display name for the contact
   - **BitComm Address**: 40-character hexadecimal address
   - **Public Key**: Contact's public key for encryption
3. Click "Add Contact" to save

### Contact Organization
- Contacts are sorted alphabetically by name
- Recent activity indicators show last communication
- Proof-of-Work difficulty is stored per contact
- Contact verification status is displayed

## Message History

### Sent Messages
- All sent messages are stored locally
- Message metadata includes:
  - Recipient address
  - Timestamp
  - Proof-of-work computation time
  - Delivery status
  - Message content (encrypted)

### Message States
- **Computing**: Proof-of-work calculation in progress
- **Sending**: Message transmission to recipient
- **Delivered**: Successfully delivered to recipient
- **Failed**: Delivery failed (retry available)

## Troubleshooting

### Common Issues

#### Message Not Sending
1. **Check Identity**: Ensure an identity is activated
2. **Verify Recipient**: Confirm recipient address is correct
3. **Network Status**: Check internet connection stability
4. **Retry Transmission**: Use retry button for failed messages

#### High Computation Time
1. **Lower Difficulty**: Reduce proof-of-work difficulty level
2. **Device Performance**: Consider device computational capabilities
3. **Background Processing**: Allow browser to run computations

#### Contact Issues
1. **Invalid Address**: Verify 40-character hexadecimal format
2. **Public Key Format**: Ensure public key is correctly formatted
3. **Duplicate Contacts**: Check for existing contacts with same address

## Best Practices

### Security
- **Verify Recipients**: Always confirm recipient addresses
- **Use Strong Identities**: Create unique identities for different contexts
- **Regular Backups**: Export and backup your identity data
- **Monitor Activity**: Review sent message history regularly

### Performance
- **Optimize Difficulty**: Balance security needs with computation time
- **Batch Messages**: Send multiple messages to same recipient efficiently
- **Cleanup History**: Regularly clean old message data

### Privacy
- **Contact Verification**: Verify contact public keys through secure channels
- **Identity Separation**: Use different identities for different purposes
- **Metadata Awareness**: Be aware that message timing/frequency may be observable

## Advanced Features

### Message Scheduling
- Set delivery times for messages
- Queue messages for batch processing
- Manage message priority levels

### Group Messaging (Coming Soon)
- Create encrypted group conversations
- Manage group membership
- Distribute group keys securely

### File Attachments (Coming Soon)
- Encrypt and send file attachments
- Support for multimedia content
- Distributed file storage

## API Integration

For developers building on BitComm:

```typescript
// Example message sending
const message = await bitcomm.sendMessage({
  to: recipientAddress,
  content: messageText,
  powDifficulty: 4,
  fromIdentity: activeIdentity
});
```

See [API Reference](../API.md) for complete documentation.

---

**Need Help?**
- Check the [FAQ](../FAQ.md)
- Join our [Discord Community](https://discord.gg/bitcomm)
- Report issues on [GitHub](https://github.com/bitcomm/bitcomm/issues)
