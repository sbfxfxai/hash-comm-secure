import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IdentityService, Identity } from '../identityService'

describe('IdentityService', () => {
  const mockIdentity: Identity = {
    id: 'test-id',
    name: 'test-identity',
    publicKey: 'mock-public-key',
    privateKey: 'mock-private-key',
    createdAt: new Date().toISOString(),
  }

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('generateKeyPair', () => {
    it('should generate a key pair', async () => {
      const result = await IdentityService.generateKeyPair()
      expect(result).toHaveProperty('publicKey')
      expect(result).toHaveProperty('privateKey')
      expect(typeof result.publicKey).toBe('string')
      expect(typeof result.privateKey).toBe('string')
    })
  })

  describe('encryptPrivateKey', () => {
    it('should encrypt private key', async () => {
      const privateKey = 'test-private-key'
      const encrypted = await IdentityService.encryptPrivateKey(privateKey)
      expect(encrypted).toBe('encrypted-' + privateKey)
    })

    it('should encrypt private key with password', async () => {
      const privateKey = 'test-private-key'
      const password = 'test-password'
      const encrypted = await IdentityService.encryptPrivateKey(privateKey, password)
      expect(encrypted).toBe('encrypted-' + privateKey)
    })
  })

  describe('decryptPrivateKey', () => {
    it('should decrypt private key', async () => {
      const encryptedKey = 'encrypted-test-private-key'
      const decrypted = await IdentityService.decryptPrivateKey(encryptedKey)
      expect(decrypted).toBe('test-private-key')
    })

    it('should decrypt private key with password', async () => {
      const encryptedKey = 'encrypted-test-private-key'
      const password = 'test-password'
      const decrypted = await IdentityService.decryptPrivateKey(encryptedKey, password)
      expect(decrypted).toBe('test-private-key')
    })
  })

  describe('generateWorkProof', () => {
    it('should generate proof of work', async () => {
      const data = 'test-data'
      const proof = await IdentityService.generateWorkProof(data)
      expect(proof).toBe('mock-proof-of-work')
      expect(typeof proof).toBe('string')
    })
  })

  describe('getStoredIdentities', () => {
    it('should return empty array when no identities stored', () => {
      const identities = IdentityService.getStoredIdentities()
      expect(identities).toEqual([])
    })

    it('should return stored identities', () => {
      const testIdentities = [mockIdentity]
      localStorage.setItem('bitcomm-identities', JSON.stringify(testIdentities))
      
      const identities = IdentityService.getStoredIdentities()
      expect(identities).toEqual(testIdentities)
    })

    it('should handle invalid JSON in localStorage', () => {
      localStorage.setItem('bitcomm-identities', 'invalid-json')
      
      const identities = IdentityService.getStoredIdentities()
      expect(identities).toEqual([])
    })
  })

  describe('saveIdentity', () => {
    it('should save identity to localStorage', () => {
      IdentityService.saveIdentity(mockIdentity)
      
      const stored = localStorage.getItem('bitcomm-identities')
      expect(stored).toBeTruthy()
      
      const parsed = JSON.parse(stored!)
      expect(parsed).toHaveLength(1)
      expect(parsed[0]).toEqual(mockIdentity)
    })

    it('should append to existing identities', () => {
      const existingIdentity = { ...mockIdentity, id: 'existing-id', name: 'existing' }
      localStorage.setItem('bitcomm-identities', JSON.stringify([existingIdentity]))
      
      IdentityService.saveIdentity(mockIdentity)
      
      const stored = localStorage.getItem('bitcomm-identities')
      const parsed = JSON.parse(stored!)
      expect(parsed).toHaveLength(2)
      expect(parsed[0]).toEqual(existingIdentity)
      expect(parsed[1]).toEqual(mockIdentity)
    })
  })

  describe('deleteIdentity', () => {
    it('should delete identity by id', () => {
      const identity1 = { ...mockIdentity, id: 'id1', name: 'identity1' }
      const identity2 = { ...mockIdentity, id: 'id2', name: 'identity2' }
      localStorage.setItem('bitcomm-identities', JSON.stringify([identity1, identity2]))
      
      IdentityService.deleteIdentity('id1')
      
      const stored = localStorage.getItem('bitcomm-identities')
      const parsed = JSON.parse(stored!)
      expect(parsed).toHaveLength(1)
      expect(parsed[0]).toEqual(identity2)
    })

    it('should handle deleting non-existent identity', () => {
      localStorage.setItem('bitcomm-identities', JSON.stringify([mockIdentity]))
      
      IdentityService.deleteIdentity('non-existent-id')
      
      const stored = localStorage.getItem('bitcomm-identities')
      const parsed = JSON.parse(stored!)
      expect(parsed).toHaveLength(1)
      expect(parsed[0]).toEqual(mockIdentity)
    })

    it('should handle empty identity list', () => {
      localStorage.setItem('bitcomm-identities', JSON.stringify([]))
      
      IdentityService.deleteIdentity('any-id')
      
      const stored = localStorage.getItem('bitcomm-identities')
      const parsed = JSON.parse(stored!)
      expect(parsed).toEqual([])
    })
  })
})
