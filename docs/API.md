# BitComm API Reference

## Overview
The BitComm API provides standardized interfaces for third-party integrations and internal module interactions. This document covers the primary classes, functions, and endpoints.

## Main Classes

### IdentityService
Manages decentralized identity operations.

- **generateKeyPair()**: Generates a new public/private key pair.
- **encryptPrivateKey(privateKey, password)**: Encrypts a private key with an optional password.
- **decryptPrivateKey(encryptedKey, password)**: Decrypts a previously encrypted private key.
- **getStoredIdentities()**: Retrieves identities from local storage.
- **saveIdentity(identity)**: Persists a new identity to local storage.
- **deleteIdentity(id)**: Removes an identity by its ID.

### MessageComposer
Facilitates message construction and sending.

- **sendMessage(options)**: Sends an encrypted message with proof-of-work requirements. Options:
  - `to`: Recipient address
  - `content`: Message text
  - `powDifficulty`: Proof-of-work level
  - `fromIdentity`: Identity to send from

### P2PNetwork
Manages peer-to-peer networking.

- **connect()**: Initiates a connection to the P2P network.
- **disconnect()**: Cleans up P2P connections and resources.
- **onMessage(callback)**: Registers a callback to run when a new message is received.

## Key Endpoints

### Authentication

- **POST /auth/login**: Authenticates a user using email and password.
- **POST /auth/register**: Registers a new user account.
- **POST /auth/logout**: Logs out the authenticated user.

### Identity

- **GET /identity/:id**: Fetches a specific identity by ID.
- **POST /identity**: Creates a new identity.
- **DELETE /identity/:id**: Deletes an identity by ID.

### Messaging

- **POST /messages/send**: Sends a message to a given recipient.
- **GET /messages/history**: Retrieves message history for the authenticated user.

## Data Models

### Identity
```json
{
  "id": "string",
  "name": "string",
  "publicKey": "string",
  "privateKey": "string",
  "createdAt": "timestamp"
}
```

### Message
```json
{
  "id": "string",
  "from": "string",
  "to": "string",
  "content": "string",
  "timestamp": "timestamp",
  "pow": {
    "difficulty": "int",
    "nonce": "int"
  },
  "status": "string"
}
```

## Usage Examples

### Sending a Message
```typescript
const messageService = new MessageComposer()

messageService.sendMessage({
  to: 'recipient-address',
  content: 'Hello, World!',
  powDifficulty: 4,
  fromIdentity: myActiveIdentity
})
.then(response => console.log('Message sent:', response))
.catch(error => console.error('Error sending message:', error))
```

### Creating an Identity
```typescript
const identityService = new IdentityService()

identityService.generateKeyPair().then(keys => {
  const newIdentity = {
    id: generateUniqueID(),
    name: 'My New Identity',
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
    createdAt: new Date().toISOString()
  }

  identityService.saveIdentity(newIdentity)
  console.log('Identity saved:', newIdentity)
})
.catch(error => console.error('Failed to create identity:', error))
```

---

For further information, refer to the full SDK documentation or contact the developer support team.
