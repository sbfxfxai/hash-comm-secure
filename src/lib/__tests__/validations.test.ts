import { describe, it, expect } from 'vitest'
import { signInSchema, signUpSchema, identitySchema, contactSchema } from '../validations'

describe('Validation Schemas', () => {
  describe('signInSchema', () => {
    it('should validate correct sign-in data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      }
      expect(() => signInSchema.parse(validData)).not.toThrow()
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      }
      expect(() => signInSchema.parse(invalidData)).toThrow()
    })

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123'
      }
      expect(() => signInSchema.parse(invalidData)).toThrow()
    })

    it('should reject empty fields', () => {
      const invalidData = {
        email: '',
        password: ''
      }
      expect(() => signInSchema.parse(invalidData)).toThrow()
    })
  })

  describe('signUpSchema', () => {
    it('should validate correct sign-up data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        fullName: 'Test User'
      }
      expect(() => signUpSchema.parse(validData)).not.toThrow()
    })

    it('should reject weak password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password',
        confirmPassword: 'password',
        fullName: 'Test User'
      }
      expect(() => signUpSchema.parse(invalidData)).toThrow()
    })

    it('should reject mismatched passwords', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
        fullName: 'Test User'
      }
      expect(() => signUpSchema.parse(invalidData)).toThrow()
    })

    it('should reject short full name', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        fullName: 'A'
      }
      expect(() => signUpSchema.parse(invalidData)).toThrow()
    })
  })

  describe('identitySchema', () => {
    it('should validate correct identity name', () => {
      const validData = {
        name: 'test-identity-123'
      }
      expect(() => identitySchema.parse(validData)).not.toThrow()
    })

    it('should reject invalid characters', () => {
      const invalidData = {
        name: 'test@identity!'
      }
      expect(() => identitySchema.parse(invalidData)).toThrow()
    })

    it('should reject short name', () => {
      const invalidData = {
        name: 'a'
      }
      expect(() => identitySchema.parse(invalidData)).toThrow()
    })

    it('should reject long name', () => {
      const invalidData = {
        name: 'a'.repeat(31)
      }
      expect(() => identitySchema.parse(invalidData)).toThrow()
    })
  })

  describe('contactSchema', () => {
    it('should validate correct contact form data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'This is a test message with sufficient length.'
      }
      expect(() => contactSchema.parse(validData)).not.toThrow()
    })

    it('should reject short message', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'Short'
      }
      expect(() => contactSchema.parse(invalidData)).toThrow()
    })

    it('should reject long message', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'a'.repeat(1001)
      }
      expect(() => contactSchema.parse(invalidData)).toThrow()
    })
  })
})
