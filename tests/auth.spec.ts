import { test, expect } from '@playwright/test'
import { createTestSupabase } from './helpers/supabase'

test.use({ storageState: { cookies: [], origins: [] } })

const SIGNUP_EMAIL = `e2e-signup-${Date.now()}@restoloop.com`
const SIGNUP_PASSWORD = 'E2E-Signup-Pass-123!'

const LOGIN_EMAIL = `e2e-login-${Date.now()}@restoloop.com`
const LOGIN_PASSWORD = 'E2E-Login-Pass-123!'

test.describe('Auth flows', () => {
  test.afterAll(async () => {
    const supabase = createTestSupabase()
    const { data: { users } } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const toDelete = users.filter(u => 
      u.email?.startsWith('e2e-signup-') || u.email?.startsWith('e2e-login-')
    )
    for (const u of toDelete) {
      await supabase.auth.admin.deleteUser(u.id)
    }
  })

  test('signup creates account and redirects to /login', async ({ page }) => {
    // Intercept signup network requests to mock it and bypass Supabase rate limits
    await page.route('**/auth/v1/signup*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mock-user-id',
          email: SIGNUP_EMAIL,
          user_metadata: {},
          identities: [],
          aud: 'authenticated',
          role: 'authenticated',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      })
    })

    await page.goto('/signup')
    await page.fill('#email', SIGNUP_EMAIL)
    await page.fill('#password', SIGNUP_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login with valid credentials redirects to /dashboard', async ({ page }) => {
    // Admin API bypasses rate limit and creates the user reliably
    const supabase = createTestSupabase()
    const { data, error } = await supabase.auth.admin.createUser({
      email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD,
      email_confirm: true,
    })
    if (error) {
      throw new Error(`Failed to create test login user: ${error.message}`)
    }

    await page.goto('/login')
    await page.fill('#email', LOGIN_EMAIL)
    await page.fill('#password', LOGIN_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', 'e2e-test@restoloop.com')
    await page.fill('#password', 'wrong-password-xxx')
    await page.click('button[type="submit"]')
    await expect(page.locator('.bg-red-50')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })
})
