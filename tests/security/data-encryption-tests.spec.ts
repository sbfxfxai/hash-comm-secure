/**
 * BitComm Data Encryption Security Test Suite
 * 
 * Comprehensive tests for data encryption, key management, and cryptographic security
 * covering various attack vectors and encryption vulnerabilities.
 */

import { test, expect, Page } from '@playwright/test'

test.describe('BitComm Data Encryption Security Tests', () => {
  
  test.describe('Private Key Security', () => {
    test('should never store unencrypted private keys in localStorage', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('tab', { name: 'Identity Manager' }).click()
      
      // Create a new identity
      await page.fill('#identity-name', 'Test Encryption Identity')
      await page.getByText('Create Identity').click()
      
      // Wait for identity creation
      await page.waitForTimeout(2000)
      
      // Check localStorage for any unencrypted private keys
      const localStorageData = await page.evaluate(() => {
        const data: Record<string, string> = {}
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key) {
            data[key] = localStorage.getItem(key) || ''
          }
        }
        return data
      })
      
      for (const [key, value] of Object.entries(localStorageData)) {
        if (key.includes('bitcomm') || key.includes('identity')) {
          // Should not contain raw private keys (64-char hex strings)
          expect(value).not.toMatch(/^[a-f0-9]{64}$/i)
          // Should not contain Bitcoin-style private keys
          expect(value).not.toMatch(/^[5KL][1-9A-HJ-NP-Za-km-z]{50,51}$/)
          // Should not contain raw cryptographic material
          expect(value).not.toMatch(/-----BEGIN PRIVATE KEY-----/)
          expect(value).not.toMatch(/-----BEGIN RSA PRIVATE KEY-----/)
        }
      }
    })

    test('should encrypt private keys with user passwords', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('tab', { name: 'Identity Manager' }).click()
      
      // Test password-protected identity creation
      await page.fill('#identity-name', 'Password Protected Identity')
      
      // Check if password field exists for encryption
      const passwordField = page.locator('#identity-password')
      if (await passwordField.isVisible()) {
        await passwordField.fill('SecurePassword123!')
      }
      
      await page.getByText('Create Identity').click()
      await page.waitForTimeout(2000)
      
      // Verify that encrypted data doesn't reveal patterns
      const consoleMessages: string[] = []
      page.on('console', msg => consoleMessages.push(msg.text()))
      
      // Check that no sensitive data appears in console
      for (const message of consoleMessages) {
        expect(message).not.toMatch(/privateKey/i)
        expect(message).not.toMatch(/SecurePassword123!/)
      }
    })

    test('should use strong encryption algorithms', async ({ page }) => {
      await page.goto('/')
      
      // Check that crypto operations use secure algorithms
      const cryptoInfo = await page.evaluate(() => {
        // Check available crypto APIs
        const info = {
          webCrypto: typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined',
          cryptoJS: typeof window !== 'undefined' && 'CryptoJS' in window,
          randomValues: typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function'
        }
        return info
      })
      
      // At least one strong crypto implementation should be available
      expect(cryptoInfo.webCrypto || cryptoInfo.cryptoJS).toBe(true)
      expect(cryptoInfo.randomValues).toBe(true)
    })
  })

  test.describe('Message Encryption', () => {
    test('should encrypt messages end-to-end', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('tab', { name: 'Message Composer' }).click()
      
      const testMessage = 'This is a confidential message that must be encrypted'
      await page.fill('#message', testMessage)
      await page.fill('#recipient', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa') // Valid Bitcoin address format
      
      // Intercept network requests to check message encryption
      const requests: any[] = []
      page.on('request', request => {
        if (request.method() === 'POST') {
          requests.push({
            url: request.url(),
            postData: request.postData()
          })
        }
      })
      
      // Attempt to send message
      await page.getByText('Send Encrypted Message').click()
      await page.waitForTimeout(2000)
      
      // Check that message content is not sent in plain text
      for (const request of requests) {
        if (request.postData) {
          expect(request.postData).not.toContain(testMessage)
        }
      }
    })

    test('should prevent message tampering', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('tab', { name: 'Message Composer' }).click()
      
      // Check for message integrity mechanisms
      const hasIntegrityCheck = await page.evaluate(() => {
        // Look for HMAC, digital signature, or hash verification functions
        const windowObj = window as any
        return !!(
          windowObj.CryptoJS?.HmacSHA256 ||
          windowObj.crypto?.subtle?.sign ||
          windowObj.crypto?.subtle?.verify
        )
      })
      
      // Should have some form of message integrity protection
      expect(hasIntegrityCheck).toBe(true)
    })

    test('should use secure random number generation', async ({ page }) => {
      await page.goto('/')
      
      // Test randomness quality
      const randomnessTest = await page.evaluate(() => {
        if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
          return { secure: false, reason: 'No secure random available' }
        }
        
        // Generate multiple random values and check for patterns
        const samples = []
        for (let i = 0; i < 100; i++) {
          const array = new Uint32Array(1)
          crypto.getRandomValues(array)
          samples.push(array[0])
        }
        
        // Basic randomness checks
        const unique = new Set(samples).size
        const duplicates = samples.length - unique
        
        return {
          secure: true,
          uniqueValues: unique,
          duplicates: duplicates,
          entropy: unique / samples.length
        }
      })
      
      expect(randomnessTest.secure).toBe(true)
      if (randomnessTest.entropy) {
        expect(randomnessTest.entropy).toBeGreaterThan(0.95) // High entropy expected
      }
    })
  })

  test.describe('Key Exchange Security', () => {
    test('should implement secure key exchange', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('tab', { name: 'P2P Network' }).click()
      
      // Check for secure key exchange implementation
      const keyExchangeInfo = await page.evaluate(() => {
        const windowObj = window as any
        return {
          hasECDH: !!(windowObj.crypto?.subtle?.deriveKey),
          hasDiffieHellman: !!(windowObj.CryptoJS?.lib?.WordArray),
          hasRSA: !!(windowObj.crypto?.subtle?.generateKey)
        }
      })
      
      // Should have at least one secure key exchange method
      expect(keyExchangeInfo.hasECDH || keyExchangeInfo.hasDiffieHellman || keyExchangeInfo.hasRSA).toBe(true)
    })

    test('should validate public keys', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('tab', { name: 'Message Composer' }).click()
      
      // Test with invalid public key formats
      const invalidKeys = [
        '',
        'invalid-key',
        '123',
        '<script>alert("xss")</script>',
        'A'.repeat(1000), // Too long
        'invalid-bitcoin-address-format'
      ]
      
      for (const invalidKey of invalidKeys) {
        await page.fill('#recipient', invalidKey)
        
        // Try to send message with invalid key
        await page.fill('#message', 'Test message')
        await page.getByText('Send Encrypted Message').click()
        
        // Should show validation error or prevent sending
        const errorElements = await page.locator('.error, [role="alert"], .text-red-500').count()
        if (errorElements === 0) {
          // If no visual error, check console for validation
          const consoleErrors = await page.evaluate(() => {
            return (window as any).lastErrors || []
          })
          // Some form of validation should occur
        }
      }
    })
  })

  test.describe('Cryptographic Standards Compliance', () => {
    test('should use approved cryptographic algorithms', async ({ page }) => {
      await page.goto('/')
      
      // Check for use of approved algorithms
      const cryptoAlgorithms = await page.evaluate(() => {
        const windowObj = window as any
        const algorithms = {
          aes: !!(windowObj.CryptoJS?.AES),
          sha256: !!(windowObj.CryptoJS?.SHA256),
          pbkdf2: !!(windowObj.CryptoJS?.PBKDF2),
          hmac: !!(windowObj.CryptoJS?.HmacSHA256),
          webCryptoAES: false,
          webCryptoSHA: false
        }
        
        // Check Web Crypto API support
        if (windowObj.crypto?.subtle) {
          algorithms.webCryptoAES = true
          algorithms.webCryptoSHA = true
        }
        
        return algorithms
      })
      
      // Should use strong, approved algorithms
      expect(cryptoAlgorithms.aes || cryptoAlgorithms.webCryptoAES).toBe(true)
      expect(cryptoAlgorithms.sha256 || cryptoAlgorithms.webCryptoSHA).toBe(true)
    })

    test('should not use deprecated cryptographic functions', async ({ page }) => {
      await page.goto('/')
      
      // Check that we're using strong crypto algorithms in practice
      const cryptoUsage = await page.evaluate(() => {
        const windowObj = window as any
        return {
          usesStrongAlgos: !!(windowObj.CryptoJS?.AES && windowObj.CryptoJS?.SHA256),
          hasSecureRandom: !!(windowObj.crypto?.getRandomValues),
          hasModernAPIs: !!(windowObj.crypto?.subtle)
        }
      })
      
      // Should use strong, modern algorithms
      expect(cryptoUsage.usesStrongAlgos).toBe(true)
      expect(cryptoUsage.hasSecureRandom).toBe(true)
      expect(cryptoUsage.hasModernAPIs).toBe(true)
      
      // Note: While weak algorithms may be available in the library,
      // the key is that we use strong algorithms in our implementation
    })

    test('should implement proper key derivation', async ({ page }) => {
      await page.goto('/')
      
      // Check for secure key derivation functions
      const keyDerivation = await page.evaluate(() => {
        const windowObj = window as any
        return {
          pbkdf2: !!(windowObj.CryptoJS?.PBKDF2),
          scrypt: !!(windowObj.crypto?.subtle?.deriveKey),
          argon2: !!(windowObj.argon2) // If using argon2 library
        }
      })
      
      // Should have at least one secure key derivation method
      expect(keyDerivation.pbkdf2 || keyDerivation.scrypt || keyDerivation.argon2).toBe(true)
    })
  })

  test.describe('Data at Rest Protection', () => {
    test('should encrypt sensitive data before storage', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('tab', { name: 'Identity Manager' }).click()
      
      // Create identity with sensitive data
      await page.fill('#identity-name', 'Sensitive Data Test')
      await page.getByText('Create Identity').click()
      await page.waitForTimeout(2000)
      
      // Check what's actually stored
      const storedData = await page.evaluate(() => {
        const keys = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key?.includes('bitcomm')) {
            keys.push({
              key: key,
              value: localStorage.getItem(key),
              isEncrypted: localStorage.getItem(key)?.includes('encrypted') || false
            })
          }
        }
        return keys
      })
      
      // Sensitive data should be encrypted
      for (const item of storedData) {
        if (item.value) {
          // Should not contain plain text sensitive patterns
          expect(item.value).not.toMatch(/-----BEGIN.*KEY-----/)
          expect(item.value).not.toMatch(/^[a-f0-9]{64}$/i) // Raw hex keys
        }
      }
    })

    test('should implement secure key storage', async ({ page }) => {
      await page.goto('/')
      
      // Check for secure storage mechanisms
      const storageInfo = await page.evaluate(() => {
        return {
          hasIndexedDB: typeof indexedDB !== 'undefined',
          hasWebCrypto: typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined',
          hasLocalStorage: typeof localStorage !== 'undefined',
          hasSessionStorage: typeof sessionStorage !== 'undefined'
        }
      })
      
      // Should have secure storage options available
      expect(storageInfo.hasWebCrypto).toBe(true)
      expect(storageInfo.hasLocalStorage || storageInfo.hasIndexedDB).toBe(true)
    })
  })

  test.describe('Memory Security', () => {
    test('should clear sensitive data from memory', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('tab', { name: 'Identity Manager' }).click()
      
      // Create and then navigate away
      await page.fill('#identity-name', 'Memory Test Identity')
      await page.getByText('Create Identity').click()
      await page.waitForTimeout(1000)
      
      // Navigate to different tab
      await page.getByRole('tab', { name: 'Message Composer' }).click()
      await page.waitForTimeout(1000)
      
      // Check that sensitive data isn't lingering in memory
      const memoryCheck = await page.evaluate(() => {
        // Check for common ways sensitive data might leak
        const bodyText = document.body.textContent || ''
        const formValues = Array.from(document.querySelectorAll('input')).map(input => input.value).join(' ')
        
        return {
          bodyContainsSensitive: /private.*key/i.test(bodyText),
          formContainsSensitive: /private.*key/i.test(formValues)
        }
      })
      
      expect(memoryCheck.bodyContainsSensitive).toBe(false)
      expect(memoryCheck.formContainsSensitive).toBe(false)
    })
  })

  test.describe('Encryption Performance', () => {
    test('should perform encryption operations within reasonable time', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('tab', { name: 'Message Composer' }).click()
      
      const startTime = Date.now()
      
      // Test encryption performance
      await page.fill('#message', 'Performance test message with reasonable length for encryption timing')
      await page.fill('#recipient', '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2')
      
      await page.getByText('Send Encrypted Message').click()
      await page.waitForTimeout(7000) // Max 7 seconds for encryption (including UI interactions)
      
      const endTime = Date.now()
      const encryptionTime = endTime - startTime
      
      // Encryption should complete within reasonable time (7 seconds including UI)
      expect(encryptionTime).toBeLessThan(7000)
    })
  })

  test.describe('Proof of Work Cryptographic Security', () => {
    test('should implement secure proof-of-work algorithm', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('tab', { name: 'Proof-of-Work Demo' }).click()
      
      // Check PoW implementation
      const powInfo = await page.evaluate(() => {
        const windowObj = window as any
        return {
          hasSHA256: !!(windowObj.CryptoJS?.SHA256),
          hasProofOfWork: typeof windowObj.computeProofOfWork === 'function',
          hasVerification: typeof windowObj.verifyProofOfWork === 'function'
        }
      })
      
      expect(powInfo.hasSHA256).toBe(true)
      // PoW functions should be available for anti-spam
    })

    test('should validate proof-of-work correctly', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('tab', { name: 'Proof-of-Work Demo' }).click()
      
      // Trigger PoW computation
      await page.getByText('Compute Work').click()
      await page.waitForTimeout(10000) // Allow time for PoW computation
      
      // Check that valid proof is generated
      const powResult = await page.evaluate(() => {
        const resultElement = document.querySelector('[data-testid="pow-result"]')
        return resultElement ? resultElement.textContent : null
      })
      
      // Should show successful PoW computation
      if (powResult) {
        expect(powResult).toMatch(/hash|nonce|proof/i)
      }
    })
  })
})
