import { test, expect } from '@playwright/test'

test.describe('CHMetrics Admin', () => {
  test('should load the login page', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Anmeldung')
  })

  test('should show dashboard after login', async ({ page }) => {
    // Skip for now - requires Supabase setup
  })
})
