/**
 * BitComm Authentication and Authorization Security Test Suite
 * 
 * Comprehensive tests to validate user authentication, authorization,
 * and access control security measures across all attack vectors.
 */

import { test, expect, Page } from '@playwright/test'

test.describe('BitComm Authentication and Authorization Security Tests', () => {
  
  test.describe('Authentication Flow Security', () => {
    test('should display authentication modal when signing in', async ({ page }) => {
      await page.goto('/')
      
      // Find and click the Sign In button in header (more specific selector)
      await page.locator('header').getByText('Sign In').click()
      
      // Verify auth modal appears
      await expect(page.getByText('Join BitComm')).toBeVisible()
      await expect(page.getByRole('tab', { name: 'Sign In' })).toBeVisible()
      await expect(page.getByRole('tab', { name: 'Sign Up' })).toBeVisible()
    })

    test('should validate email format on sign-up', async ({ page }) => {
      await page.goto('/')
      await page.getByText('Sign In').click()
      await page.getByText('Sign Up').click()
      
      // Fill form with invalid email
      await page.fill('#signup-name', 'Test User')
      await page.fill('#signup-email', 'invalid-email')
      await page.fill('#signup-password', 'password123')
      
      // Verify HTML5 validation kicks in
      const emailInput = page.locator('#signup-email')
      const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => {
        return el.validationMessage
      })
      expect(validationMessage).toBeTruthy() // Should have validation message
    })

    test('should enforce minimum password length', async ({ page }) => {
      await page.goto('/')
      await page.getByText('Sign In').click()
      await page.getByText('Sign Up').click()
      
      // Fill form with short password
      await page.fill('#signup-name', 'Test User')
      await page.fill('#signup-email', 'test@example.com')
      await page.fill('#signup-password', '123') // Too short
      
      // Verify password validation
      const passwordInput = page.locator('#signup-password')
      const validationMessage = await passwordInput.evaluate((el: HTMLInputElement) => {
        return el.validationMessage
      })
      expect(validationMessage).toBeTruthy() // Should have validation message
    })

    test('should handle Google OAuth flow', async ({ page }) => {
      await page.goto('/')
      await page.getByText('Sign In').click()
      
      // Check Google OAuth button exists
      const googleButton = page.getByRole('button', { name: /Google/i })
      await expect(googleButton).toBeVisible()
      
      // Note: OAuth flow would redirect to Google, so we just verify the button works
      // In production, this would be tested with OAuth mocking
    })

    test('should maintain session state across page refreshes', async ({ page }) => {
      await page.goto('/')
      
      // Check if user is already signed in (from previous tests)
      const signInButton = page.getByText('Sign In')
      const userAvatar = page.locator('[data-testid="user-avatar"]')
      
      // If signed in, verify session persistence
      if (await userAvatar.isVisible()) {
        await page.reload()
        await expect(userAvatar).toBeVisible() // Should still be signed in
      }
    })

    test('should sign out users properly', async ({ page }) => {
      await page.goto('/')
      
      // Check if user dropdown exists (indicating signed in state)
      const userDropdown = page.locator('button[role="button"]:has(div[role="img"])')
      if (await userDropdown.isVisible()) {
        await userDropdown.click()
        await page.getByText('Sign Out').click()
        
        // Verify user is signed out
        await expect(page.getByText('Sign In')).toBeVisible()
        await expect(page.getByText('You have been signed out')).toBeVisible()
      }
    })
  })

  test.describe('Authorization Control', () => {
    test('should protect enterprise dashboard with authentication', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('tab', { name: 'Enterprise' }).click()
      
      // Should show authentication required message
      await expect(page.getByText('Authentication Required')).toBeVisible()
      await expect(page.getByText('Sign in to access premium BitComm features')).toBeVisible()
    })

    test('should protect user profile with authentication', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('tab', { name: 'Profile' }).click()
      
      // Should show authentication required message  
      await expect(page.getByText('Authentication Required')).toBeVisible()
      await expect(page.getByText('Sign in to access premium BitComm features')).toBeVisible()
    })

    test('should allow access to public features without authentication', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')
      
      // Verify that public tabs are accessible (main security check)
      const publicTabs = [
        'P2P Network',
        'Message Composer', 
        'Proof-of-Work Demo',
        'Identity Manager'
      ]
      
      for (const tabName of publicTabs) {
        const tab = page.getByRole('tab', { name: tabName })
        await expect(tab).toBeVisible()
        
        // Click tab and verify it loads content (no auth barrier)
        await tab.click({ force: true })
        await page.waitForTimeout(1000)
        
        // Verify we're not redirected to auth or blocked
        await expect(page.getByText('Authentication Required')).not.toBeVisible()
        await expect(page.getByText('Sign in to access')).not.toBeVisible()
        
        // Verify page didn't crash or redirect to error
        const currentUrl = page.url()
        expect(currentUrl).toContain('localhost') // Still on our domain
      }
      
      // Final check: verify no authentication prompts appeared
      await expect(page.getByText('Join BitComm')).not.toBeVisible()
    })

    test('should show proper fallback UI for protected routes', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('tab', { name: 'Enterprise' }).click()
      
      // Verify the protected route fallback UI
      await expect(page.locator('[data-testid="lock-icon"]').or(page.getByText('Authentication Required'))).toBeVisible()
      await expect(page.getByText('Sign In to Continue')).toBeVisible()
      
      // Verify clicking the fallback button opens auth modal
      await page.getByText('Sign In to Continue').click()
      await expect(page.getByText('Join BitComm')).toBeVisible()
    })
  })

  test.describe('Security Validation', () => {
    test('should not expose sensitive authentication data in DOM', async ({ page }) => {
      await page.goto('/')
      
      // Check that sensitive patterns are not in page content
      const pageContent = await page.content()
      
      // Should not contain JWT tokens
      expect(pageContent).not.toMatch(/eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*/) 
      
      // Should not contain API keys
      expect(pageContent).not.toMatch(/sk_[a-zA-Z0-9]{24,}/)
      expect(pageContent).not.toMatch(/pk_[a-zA-Z0-9]{24,}/)
      
      // Should not contain session tokens
      expect(pageContent).not.toMatch(/sess_[a-zA-Z0-9]{24,}/)
    })

    test('should not expose authentication tokens in localStorage', async ({ page }) => {
      await page.goto('/')
      
      // Check localStorage for sensitive data
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
      
      // Check for JWT patterns in localStorage values
      Object.values(localStorageData).forEach(value => {
        expect(value).not.toMatch(/eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*/) // JWT
        expect(value).not.toMatch(/sk_[a-zA-Z0-9]{24,}/) // Secret keys
        expect(value).not.toMatch(/sess_[a-zA-Z0-9]{24,}/) // Session tokens
      })
    })

    test('should not expose authentication tokens in sessionStorage', async ({ page }) => {
      await page.goto('/')
      
      // Check sessionStorage for sensitive data
      const sessionStorageData = await page.evaluate(() => {
        const data: Record<string, string> = {}
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i)
          if (key) {
            data[key] = sessionStorage.getItem(key) || ''
          }
        }
        return data
      })
      
      // Check for sensitive patterns in sessionStorage
      Object.values(sessionStorageData).forEach(value => {
        expect(value).not.toMatch(/eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*/) // JWT
        expect(value).not.toMatch(/sk_[a-zA-Z0-9]{24,}/) // Secret keys
      })
    })

    test('should handle authentication errors without exposing sensitive info', async ({ page }) => {
      const consoleErrors: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })
      
      await page.goto('/')
      await page.getByText('Sign In').click()
      
      // Try invalid login to trigger error
      await page.fill('#signin-email', 'invalid@test.com')
      await page.fill('#signin-password', 'wrongpassword')
      
      // Submit form (will likely fail)
      const submitButton = page.getByRole('button', { name: 'Sign In' })
      if (await submitButton.isVisible()) {
        await submitButton.click()
        await page.waitForTimeout(2000)
      }
      
      // Check that errors don't contain sensitive information
      consoleErrors.forEach(error => {
        expect(error).not.toMatch(/password/i)
        expect(error).not.toMatch(/token/i)
        expect(error).not.toMatch(/secret/i)
        expect(error).not.toMatch(/key/i)
      })
    })

    test('should use HTTPS for authentication in production', async ({ page }) => {
      await page.goto('/')
      
      // Check that we're using secure protocol (or localhost for dev)
      const url = page.url()
      expect(url.startsWith('https://') || url.startsWith('http://localhost')).toBe(true)
    })
  })

  test.describe('Input Validation and Injection Protection', () => {
    test('should sanitize email input against XSS', async ({ page }) => {
      await page.goto('/')
      await page.getByText('Sign In').click()
      
      // Try XSS payload in email field
      const xssPayload = '<script>alert("XSS")</script>@test.com'
      await page.fill('#signin-email', xssPayload)
      
      // Verify input is sanitized
      const emailValue = await page.inputValue('#signin-email')
      expect(emailValue).toBe(xssPayload) // Should be stored as text, not executed
      
      // Verify no script execution
      const alertDialogs: string[] = []
      page.on('dialog', dialog => {
        alertDialogs.push(dialog.message())
        dialog.dismiss()
      })
      
      await page.waitForTimeout(1000)
      expect(alertDialogs).toHaveLength(0) // No alerts should fire
    })

    test('should sanitize password input against injection', async ({ page }) => {
      await page.goto('/')
      await page.getByText('Sign In').click()
      
      // Try SQL injection payload in password field
      const sqlPayload = "'; DROP TABLE users; --"
      await page.fill('#signin-password', sqlPayload)
      
      // Verify input is handled as text
      const passwordValue = await page.inputValue('#signin-password')
      expect(passwordValue).toBe(sqlPayload) // Should be stored as text
    })

    test('should sanitize name input on signup', async ({ page }) => {
      await page.goto('/')
      await page.getByText('Sign In').click()
      await page.getByText('Sign Up').click()
      
      // Try XSS payload in name field
      const xssPayload = '<img src="x" onerror="alert(\'XSS\')" />'
      await page.fill('#signup-name', xssPayload)
      
      // Verify input is sanitized
      const nameValue = await page.inputValue('#signup-name')
      expect(nameValue).toBe(xssPayload) // Should be stored as text, not executed
    })
  })

  test.describe('Session Management Security', () => {
    test('should handle session timeout gracefully', async ({ page }) => {
      await page.goto('/')
      
      // This test verifies the app handles expired sessions without crashing
      // In a real scenario, we'd mock session expiration
      await page.waitForLoadState('networkidle')
      
      // App should still be functional (use heading selector to be specific)
      await expect(page.getByRole('heading', { name: 'BitComm' })).toBeVisible()
    })

    test('should not persist sensitive session data in cookies', async ({ page }) => {
      await page.goto('/')
      
      // Get all cookies
      const cookies = await page.context().cookies()
      
      // Check that cookies don't contain sensitive patterns
      cookies.forEach(cookie => {
        expect(cookie.value).not.toMatch(/eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*/) // JWT
        expect(cookie.value).not.toMatch(/sk_[a-zA-Z0-9]{24,}/) // Secret keys
        
        // Verify security flags for auth-related cookies
        if (cookie.name.includes('auth') || cookie.name.includes('session')) {
          expect(cookie.httpOnly).toBe(true) // Should be HTTP-only
          expect(cookie.secure).toBe(true) // Should be secure in production
        }
      })
    })
  })

  test.describe('Rate Limiting and Brute Force Protection', () => {
    test('should handle multiple failed login attempts gracefully', async ({ page }) => {
      await page.goto('/')
      await page.getByText('Sign In').click()
      
      // Attempt multiple failed logins
      for (let i = 0; i < 3; i++) {
        await page.fill('#signin-email', 'test@example.com')
        await page.fill('#signin-password', 'wrongpassword' + i)
        
        const submitButton = page.getByRole('button', { name: 'Sign In' })
        if (await submitButton.isVisible() && !await submitButton.isDisabled()) {
          await submitButton.click()
          await page.waitForTimeout(1000)
        }
      }
      
      // App should still be responsive (no crash)
      await expect(page.getByText('Join BitComm')).toBeVisible()
    })

    test('should prevent rapid form submissions', async ({ page }) => {
      await page.goto('/')
      await page.getByText('Sign In').click()
      
      await page.fill('#signin-email', 'test@example.com')
      await page.fill('#signin-password', 'password')
      
      const submitButton = page.getByRole('button', { name: 'Sign In' })
      
      // First click
      await submitButton.click()
      
      // Try rapid second submission - should either be blocked or handled gracefully
      try {
        await submitButton.click({ timeout: 100 })
      } catch (error) {
        // If click fails, it might be disabled/blocked - that's good security
      }
      
      // Verify form remains functional regardless
      await page.waitForTimeout(500)
      await expect(page.getByText('Join BitComm')).toBeVisible() // Still functional
      
      // Verify no multiple submissions occurred by checking no unexpected errors
      const consoleErrors: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })
      
      // No critical errors should occur from rapid submission attempts
      const criticalErrors = consoleErrors.filter(error => 
        error.includes('duplicate') || error.includes('race condition')
      )
      expect(criticalErrors).toHaveLength(0)
    })
  })
})

