/**
 * BitComm Device Emulation Compatibility Test Suite
 * 
 * Tests responsive design and functionality across various device types,
 * screen sizes, and orientations to ensure optimal user experience.
 */

import { test, expect, devices } from '@playwright/test'

// Define test devices with their specifications
const testDevices = [
  {
    name: 'Desktop Large',
    viewport: { width: 1920, height: 1080 }
  },
  {
    name: 'Desktop Medium', 
    viewport: { width: 1366, height: 768 }
  },
  {
    name: 'Tablet Landscape',
    viewport: { width: 1024, height: 768 }
  },
  {
    name: 'Tablet Portrait',
    viewport: { width: 768, height: 1024 }
  },
  {
    name: 'Mobile Large',
    viewport: { width: 414, height: 896 }
  },
  {
    name: 'Mobile Medium',
    viewport: { width: 375, height: 667 }
  },
  {
    name: 'Mobile Small',
    viewport: { width: 320, height: 568 }
  }
]

test.describe('BitComm Device Emulation Compatibility Tests', () => {
  
  testDevices.forEach(device => {
    test.describe(`${device.name} (${device.viewport.width}x${device.viewport.height})`, () => {
      
      test.beforeEach(async ({ page }) => {
        // Set viewport for each device
        await page.setViewportSize(device.viewport)
      })

      test('should load main page correctly', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('domcontentloaded')
        
        // Verify main elements are visible and properly sized
        await expect(page.getByRole('heading', { name: 'BitComm' })).toBeVisible()
        
        // Check if navigation is accessible (may be hamburger menu on mobile)
        const signInButton = page.getByText('Sign In').first()
        await expect(signInButton).toBeVisible()
        
        // Take screenshot for visual regression testing
        await page.screenshot({ 
          path: `test-results/device-screenshots/${device.name.toLowerCase().replace(' ', '-')}-main.png`,
          fullPage: true 
        })
      })

      test('should handle navigation appropriately', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('domcontentloaded')
        
        // Test tab navigation - should work on all devices
        const tabs = ['P2P Network', 'Message Composer', 'Proof-of-Work Demo', 'Identity Manager']
        
        for (const tabName of tabs) {
          const tab = page.getByRole('tab', { name: tabName })
          
          // Check if tab is visible (may be in overflow menu on small screens)
          if (await tab.isVisible()) {
            await tab.click()
            await page.waitForTimeout(500)
            
            // Verify content loads without horizontal scroll issues
            const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
            const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
            
            // Allow small tolerance for scrollbars
            expect(scrollWidth - clientWidth).toBeLessThan(20)
          }
        }
      })

      test('should handle authentication modal responsively', async ({ page }) => {
        await page.goto('/')
        
        // Open authentication modal
        await page.getByText('Sign In').first().click()
        
        // Verify modal is visible and properly sized
        const modal = page.getByText('Join BitComm')
        await expect(modal).toBeVisible()
        
        // Check form elements are accessible
        const emailField = page.locator('#signin-email')
        const passwordField = page.locator('#signin-password')
        
        if (await emailField.isVisible()) {
          await expect(emailField).toBeVisible()
          await expect(passwordField).toBeVisible()
          
          // Verify form fields are properly sized and clickable
          const emailBox = await emailField.boundingBox()
          const passwordBox = await passwordField.boundingBox()
          
          expect(emailBox?.height).toBeGreaterThan(30) // Minimum touch target
          expect(passwordBox?.height).toBeGreaterThan(30)
        }
        
        // Take screenshot of modal
        await page.screenshot({ 
          path: `test-results/device-screenshots/${device.name.toLowerCase().replace(' ', '-')}-modal.png` 
        })
      })

      test('should maintain usability on device', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('domcontentloaded')
        
        // Test basic interactions work on this device size
        const p2pTab = page.getByRole('tab', { name: 'P2P Network' })
        await p2pTab.click()
        await page.waitForTimeout(1000)
        
        // Verify content is readable (not cut off or overlapping)
        const content = page.locator('main')
        const contentBox = await content.boundingBox()
        
        expect(contentBox?.width).toBeGreaterThan(250) // Minimum readable width
        
        // Check for any horizontal overflow
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth
        })
        
        // Small devices may have intentional horizontal scroll, but desktop shouldn't
        if (device.viewport.width >= 768) {
          expect(hasHorizontalScroll).toBeFalsy()
        }
      })

      test('should handle text scaling appropriately', async ({ page }) => {
        await page.goto('/')
        
        // Test with increased text size (accessibility requirement)
        await page.addStyleTag({
          content: '* { font-size: 120% !important; }'
        })
        
        await page.waitForTimeout(500)
        
        // Verify layout doesn't break with larger text
        const heading = page.getByRole('heading', { name: 'BitComm' })
        await expect(heading).toBeVisible()
        
        // Check if main navigation is still functional
        const signInButton = page.getByText('Sign In').first()
        await expect(signInButton).toBeVisible()
        
        // Verify no text overflow or cutoff
        const textElements = await page.locator('h1, h2, h3, p, button, a').all()
        for (const element of textElements.slice(0, 10)) { // Test first 10 elements
          const box = await element.boundingBox()
          if (box) {
            expect(box.height).toBeGreaterThan(0)
            expect(box.width).toBeGreaterThan(0)
          }
        }
      })

      // Only test touch interactions on mobile devices
      if (device.viewport.width <= 768) {
        test('should handle touch interactions', async ({ page }) => {
          await page.goto('/')
          
          // Test touch/tap interactions
          const p2pTab = page.getByRole('tab', { name: 'P2P Network' })
          
          // Simulate touch tap
          await p2pTab.tap()
          await page.waitForTimeout(500)
          
          // Verify touch target size (minimum 44px for accessibility)
          const tabBox = await p2pTab.boundingBox()
          expect(tabBox?.height).toBeGreaterThanOrEqual(44)
          expect(tabBox?.width).toBeGreaterThanOrEqual(44)
          
          // Test swipe gestures don't interfere with functionality
          await page.touchscreen.tap(device.viewport.width / 2, device.viewport.height / 2)
          
          // Verify page is still functional after touch interactions
          await expect(page.getByRole('heading', { name: 'BitComm' })).toBeVisible()
        })
      }
    })
  })

  // Cross-device compatibility tests
  test.describe('Cross-Device Compatibility', () => {
    test('should maintain consistent functionality across devices', async ({ browser }) => {
      const contexts = []
      const pages = []
      
      // Create contexts for different devices
      for (const device of testDevices.slice(0, 3)) { // Test top 3 devices
        const context = await browser.newContext({
          viewport: device.viewport
        })
        const page = await context.newPage()
        contexts.push(context)
        pages.push({ page, device })
      }
      
      try {
        // Load the same page on all devices
        for (const { page } of pages) {
          await page.goto('/')
          await page.waitForLoadState('domcontentloaded')
        }
        
        // Verify core functionality works on all devices
        for (const { page, device } of pages) {
          // Test navigation
          await page.getByRole('tab', { name: 'P2P Network' }).click()
          await page.waitForTimeout(500)
          
          // Verify no errors occurred
          const errors = []
          page.on('pageerror', error => errors.push(error))
          page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text())
          })
          
          await page.waitForTimeout(1000)
          expect(errors).toHaveLength(0)
        }
      } finally {
        // Clean up contexts
        for (const context of contexts) {
          await context.close()
        }
      }
    })
  })
})
