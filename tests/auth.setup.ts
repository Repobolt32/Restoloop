import { test as setup, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { createTestSupabase, TEST_USER_EMAIL, TEST_USER_PASSWORD, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from './helpers/supabase'

async function ensureUser(email: string, password: string) {
  const admin = createTestSupabase()

  const { data: { users } } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const existing = users.find(u => u.email === email)

  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true })
    if (error) throw new Error(`Failed to update user ${email}: ${error.message}`)
    return
  }

  const { error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  })
  if (error) throw new Error(`Failed to create user ${email}: ${error.message}`)
}

setup('create test users + login as test user', async ({ page }) => {
  await ensureUser(TEST_USER_EMAIL, TEST_USER_PASSWORD)
  await ensureUser(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)

  await page.goto('/login')
  await page.fill('#email', TEST_USER_EMAIL)
  await page.fill('#password', TEST_USER_PASSWORD)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 })
  await page.context().storageState({ path: 'tests/.auth/user.json' })
})

setup('login as admin user', async ({ page }) => {
  await page.goto('/login')
  await page.fill('#email', TEST_ADMIN_EMAIL)
  await page.fill('#password', TEST_ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/admin/, { timeout: 30000 })
  await page.context().storageState({ path: 'tests/.auth/admin.json' })
})
