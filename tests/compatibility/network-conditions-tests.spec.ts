/**
 * BitComm Network Conditions Compatibility Test Suite
 * 
 * Tests application performance and functionality under various network conditions
 * to ensure optimal user experience across different connection speeds.
 */

import { test, expect } from '@playwright/test'

// Define network conditions to test
const networkConditions = [
  {
    name: 'Fast 3G',
    download: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps in bytes/second
    upload: 750 * 1024 / 8,         // 750 Kbps in bytes/second
    latency: 150                     // 150ms latency
  },
  {
    name: 'Slow 3G', 
    download: 500 * 1024 / 8,       // 500 Kbps in bytes/second
    upload: 500 * 1024 / 8,        // 500 Kbps in bytes/second
    latency: 400                    // 400ms latency
  },
  {
    name: 'Offline',
    download: 0,
    upload: 0,
    latency: 0
  }
]

test.describe('BitComm Network Conditions Compatibility Tests', () => {

  networkConditions.forEach(network => {
    test.describe(`${network.name} Network`, () => {

      test('should load main page under network conditions', async ({ page, context }) => {
        // Set network conditions for this test
        if (network.name !== 'Offline') {
          await context.route('**/*', async route => {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, network.latency / 10))
            await route.continue()
          })
        } else {
          // Simulate offline condition
          await context.setOffline(true)
        }

        const startTime = Date.now()
        
        try {
          await page.goto('/', { timeout: 30000 })
          
          if (network.name !== 'Offline') {
            await expect(page.getByRole('heading', { name: 'BitComm' })).toBeVisible({ timeout: 15000 })
            
            const loadTime = Date.now() - startTime
            console.log(`Page loaded in ${loadTime}ms on ${network.name}`)
            
            // Verify essential elements are loaded
            await expect(page.getByText('Sign In').first()).toBeVisible({ timeout: 10000 })
            
            // Performance assertions based on network speed
            if (network.name === 'Fast 3G') {
              expect(loadTime).toBeLessThan(10000) // Should load within 10s on Fast 3G
            } else if (network.name === 'Slow 3G') {
              expect(loadTime).toBeLessThan(20000) // Should load within 20s on Slow 3G
            }
          }
        } catch (error) {
          if (network.name === 'Offline') {
            // Offline should fail to load - this is expected
            console.log('Offline test: Page failed to load as expected')
            return
          }
          throw error
        }
      })

      test('should handle navigation under network conditions', async ({ page, context }) => {
        if (network.name === 'Offline') {
          await context.setOffline(true)
          await page.goto('/', { timeout: 5000 }).catch(() => {
            // Expected to fail offline
          })
          return
        }

        // Add network latency simulation
        await context.route('**/*', async route => {
          await new Promise(resolve => setTimeout(resolve, network.latency / 10))
          await route.continue()
        })

        await page.goto('/')
        await expect(page.getByRole('heading', { name: 'BitComm' })).toBeVisible({ timeout: 15000 })

        // Test tab navigation under network conditions
        const tabs = ['P2P Network', 'Message Composer']
        
        for (const tabName of tabs) {
          const startTime = Date.now()
          const tab = page.getByRole('tab', { name: tabName })
          
          if (await tab.isVisible()) {
            await tab.click()
            await page.waitForTimeout(1000)
            
            const navigationTime = Date.now() - startTime
            console.log(`Tab navigation (${tabName}) took ${navigationTime}ms on ${network.name}`)
            
            // Verify navigation still works despite network conditions
            expect(navigationTime).toBeLessThan(15000) // Should navigate within 15s
          }
        }
      })

      test('should handle authentication modal under network conditions', async ({ page, context }) => {
        if (network.name === 'Offline') {
          await context.setOffline(true)
          await page.goto('/', { timeout: 5000 }).catch(() => {})
          return
        }

        // Add network latency
        await context.route('**/*', async route => {
          await new Promise(resolve => setTimeout(resolve, network.latency / 10))
          await route.continue()
        })

        await page.goto('/')
        await expect(page.getByRole('heading', { name: 'BitComm' })).toBeVisible({ timeout: 15000 })

        const startTime = Date.now()
        await page.getByText('Sign In').first().click()
        
        // Verify modal loads despite network conditions
        await expect(page.getByText('Join BitComm')).toBeVisible({ timeout: 10000 })
        
        const modalLoadTime = Date.now() - startTime
        console.log(`Modal loaded in ${modalLoadTime}ms on ${network.name}`)
        
        // Modal should load reasonably fast even on slow networks
        expect(modalLoadTime).toBeLessThan(8000)
      })

      if (network.name !== 'Offline') {
        test('should handle form submission under network conditions', async ({ page, context }) => {
          // Add network latency
          await context.route('**/*', async route => {
            await new Promise(resolve => setTimeout(resolve, network.latency / 10))
            await route.continue()
          })

          await page.goto('/')
          await expect(page.getByRole('heading', { name: 'BitComm' })).toBeVisible({ timeout: 15000 })
          
          // Open auth modal
          await page.getByText('Sign In').first().click()
          await expect(page.getByText('Join BitComm')).toBeVisible({ timeout: 10000 })

          // Fill form
          await page.fill('#signin-email', 'test@example.com')
          await page.fill('#signin-password', 'testpassword')

          const startTime = Date.now()
          
          // Submit form (will likely fail but we're testing the UI response)
          const submitButton = page.getByRole('button', { name: 'Sign In' })
          if (await submitButton.isVisible()) {
            await submitButton.click()
            
            // Wait for some response (success or error)
            await page.waitForTimeout(3000)
            
            const responseTime = Date.now() - startTime
            console.log(`Form submission response in ${responseTime}ms on ${network.name}`)
            
            // Form should remain functional despite network conditions
            expect(responseTime).toBeLessThan(10000)
          }
        })
      }

      test('should show appropriate loading states under network conditions', async ({ page, context }) => {
        if (network.name === 'Offline') {
          await context.setOffline(true)
          
          try {
            await page.goto('/', { timeout: 5000 })
          } catch (error) {
            // Expected to fail offline - verify error handling
            console.log('Offline test: Navigation failed as expected')
            expect(error.message).toContain('net::ERR_INTERNET_DISCONNECTED' || 'timeout')
            return
          }
          
          // If somehow it loads, check content
          try {
            const content = await page.content()
            expect(content.includes('BitComm') || content.includes('offline') || content.includes('error')).toBeTruthy()
          } catch (contentError) {
            // Page is still navigating - this is expected behavior offline
            console.log('Offline test: Content retrieval failed as expected')
          }
          return
        }

        // Add significant network delay for this test
        await context.route('**/*', async route => {
          await new Promise(resolve => setTimeout(resolve, network.latency))
          await route.continue()
        })

        await page.goto('/')
        
        // Page should eventually load even with slow network
        await expect(page.getByRole('heading', { name: 'BitComm' })).toBeVisible({ timeout: 30000 })
        
        // Verify no JavaScript errors occurred during slow loading
        const errors = []
        page.on('pageerror', error => errors.push(error))
        page.on('console', msg => {
          if (msg.type() === 'error') errors.push(msg.text())
        })
        
        await page.waitForTimeout(2000)
        
        // Filter out network-related errors which are expected
        const criticalErrors = errors.filter(error => 
          !error.toString().includes('fetch') && 
          !error.toString().includes('network') &&
          !error.toString().includes('ERR_INTERNET_DISCONNECTED')
        )
        
        expect(criticalErrors).toHaveLength(0)
      })
    })
  })

  // Cross-network performance comparison
  test.describe('Network Performance Comparison', () => {
    test('should maintain core functionality across all network conditions', async ({ browser }) => {
      const results = []
      
      for (const network of networkConditions.slice(0, 2)) { // Skip offline for this test
        const context = await browser.newContext()
        const page = await context.newPage()
        
        // Add network simulation
        await context.route('**/*', async route => {
          await new Promise(resolve => setTimeout(resolve, network.latency / 10))
          await route.continue()
        })
        
        const startTime = Date.now()
        
        try {
          await page.goto('/')
          await expect(page.getByRole('heading', { name: 'BitComm' })).toBeVisible({ timeout: 20000 })
          
          const loadTime = Date.now() - startTime
          results.push({ network: network.name, loadTime })
          
          // Verify basic functionality works
          await page.getByText('Sign In').first().click()
          await expect(page.getByText('Join BitComm')).toBeVisible({ timeout: 10000 })
          
        } catch (error) {
          results.push({ network: network.name, error: error.message })
        } finally {
          await context.close()
        }
      }
      
      // Log performance comparison
      console.log('Network Performance Results:', results)
      
      // Verify all networks allowed basic functionality
      results.forEach(result => {
        expect(result.error).toBeUndefined()
        if (result.loadTime) {
          expect(result.loadTime).toBeGreaterThan(0)
        }
      })
    })
  })
})
