import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to auth page or ensure logged out state
    await page.goto('/')
  })

  test('should display login form', async ({ page }) => {
    // Navigate to login page (adjust path based on your routing)
    await page.goto('/login')
    
    // Check for login form elements
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible()
    await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('should show validation errors for invalid login', async ({ page }) => {
    await page.goto('/login')
    
    // Try to submit empty form
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Check for validation messages
    // Adjust selectors based on your form validation implementation
    await expect(page.getByText(/email is required/i)).toBeVisible()
  })

  test('should redirect to dashboard after successful login', async ({ page }) => {
    await page.goto('/login')
    
    // Fill in valid test credentials (use test account)
    await page.getByRole('textbox', { name: /email/i }).fill('test@example.com')
    await page.getByRole('textbox', { name: /password/i }).fill('testpassword')
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('should allow user to logout', async ({ page }) => {
    // This test assumes user is logged in
    // You might want to use a setup script to log in first
    await page.goto('/dashboard')
    
    // Find and click logout button
    await page.getByRole('button', { name: /logout/i }).click()
    
    // Should redirect to home or login page
    await expect(page).toHaveURL(/\/(login)?$/)
  })
}) 