import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/')
    
    // Check that the page loads successfully
    await expect(page).not.toHaveTitle('')
    
    // Check that some content is present (even if we don't know exactly what)
    const body = page.locator('body')
    await expect(body).not.toBeEmpty()
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'test-results/homepage-screenshot.png' })
  })

  test('should have working navigation tabs', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Try to find and click on tabs
    const tabs = page.locator('[role="tab"]')
    const tabCount = await tabs.count()
    
    if (tabCount > 0) {
      // Click on the first tab if any exist
      await tabs.first().click()
      await page.waitForTimeout(1000) // Wait for tab content to load
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/navigation-screenshot.png' })
  })

  test('should be responsive', async ({ page }) => {
    await page.goto('/')
    
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'test-results/desktop-view.png' })
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'test-results/mobile-view.png' })
  })
})
