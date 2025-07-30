import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth')
  })

  test('should show sign-in form', async ({ page }) => {
    await expect(page.getByLabelText('Email address')).toBeVisible()
    await expect(page.getByLabelText('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('should sign in with valid credentials', async ({ page }) => {
    // Mock success response
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Check for successful sign-in indication
    await expect(page.locator('text=Welcome, Test User')).toBeVisible()
  })

  test('should show error on invalid credentials', async ({ page }) => {
    // Mock error response
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Check for error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible()
  })

  test('should navigate to sign-up', async ({ page }) => {
    await page.click('text=Don\'t have an account? Sign Up')
    await expect(page.locator('text=Create a new account')).toBeVisible()
  })
})
