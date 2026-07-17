import { test, expect } from '@playwright/test'

test.describe('Google OAuth Login and Signup Buttons', () => {
  test('Google OAuth login and signup buttons are present and have the correct text', async ({ page }) => {
    // 1. Visit signup page and check Google button
    await page.goto('/signup')
    const googleSignupBtn = page.locator('#google-signup-btn')
    await expect(googleSignupBtn).toBeVisible()
    await expect(googleSignupBtn).toContainText('Continue with Google')

    // 2. Visit login page and check Google button
    await page.goto('/login')
    const googleLoginBtn = page.locator('#google-login-btn')
    await expect(googleLoginBtn).toBeVisible()
    await expect(googleLoginBtn).toContainText('Continue with Google')
  })
})
