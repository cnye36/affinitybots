import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should load and display the main page', async ({ page }) => {
    await page.goto('/')
    
    // Check that the page loads successfully
    await expect(page).toHaveTitle(/AffinityBots/)
    
    // Check for essential elements
    // Add specific checks based on your home page content
    // Example: await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible()
  })

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/')
    
    // Check meta tags for SEO
    const metaDescription = page.locator('meta[name="description"]')
    await expect(metaDescription).toHaveAttribute('content', /.+/)
  })

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Check that the page is still functional on mobile
    await expect(page).toHaveTitle(/AffinityBots/)
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/')
    
    await expect(page).toHaveTitle(/AffinityBots/)
  })
}) 