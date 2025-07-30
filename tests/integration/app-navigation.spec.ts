import { test, expect } from '@playwright/test'

test.describe('App Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load the homepage', async ({ page }) => {
await expect(page).toHaveTitle(/hash-comm-secure/)
    await expect(page.getByText('BitComm')).toBeVisible()
  })

  test('should navigate between tabs', async ({ page }) => {
    // Check initial state - P2P Network tab should be default
    await expect(page.getByText('P2P Network Layer')).toBeVisible()

    // Navigate to Message Composer tab
    await page.getByRole('tab', { name: 'Message Composer' }).click()
    await expect(page.getByText('Send Encrypted Messages')).toBeVisible()

    // Navigate to Proof-of-Work Demo tab
    await page.getByRole('tab', { name: 'Proof-of-Work Demo' }).click()
    await expect(page.getByText('Experience Bitcoin\'s Anti-Spam Power')).toBeVisible()

    // Navigate to Identity Manager tab
    await page.getByRole('tab', { name: 'Identity Manager' }).click()
    await expect(page.getByText('Decentralized Identity Management')).toBeVisible()

    // Navigate to Enterprise tab
    await page.getByRole('tab', { name: 'Enterprise' }).click()
    await expect(page.getByText('Enterprise Dashboard')).toBeVisible()

    // Navigate to Profile tab
    await page.getByRole('tab', { name: 'Profile' }).click()
    await expect(page.getByText('User Profile')).toBeVisible()

    // Navigate back to P2P Network tab
    await page.getByRole('tab', { name: 'P2P Network' }).click()
    await expect(page.getByText('P2P Network Layer')).toBeVisible()
  })


  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    await expect(page.getByText('P2P Network Layer')).toBeVisible()
    
    // Test mobile navigation
    await page.getByRole('tab', { name: 'Identity Manager' }).click()
    await expect(page.getByText('Decentralized Identity Management')).toBeVisible()
  })
})

test.describe('App Content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display main content sections', async ({ page }) => {
    // Test P2P Network section (default tab)
    await expect(page.getByText('P2P Network Layer')).toBeVisible()
    await expect(page.getByText('Connect to the decentralized BitComm network')).toBeVisible()
    
    // Test Sign In button for unauthenticated users
    await expect(page.getByText('Sign In')).toBeVisible()
  })

  test('should display tabs and sections', async ({ page }) => {
    // Verify all tabs are visible
    await expect(page.getByRole('tab', { name: 'P2P Network' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Message Composer' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Proof-of-Work Demo' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Identity Manager' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Enterprise' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Profile' })).toBeVisible()
  })
})
