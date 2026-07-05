import { test, expect } from '@playwright/test'
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from './helpers/supabase'

test.describe('Admin Controls', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('admin@restoloop.com is redirected from /dashboard to /admin', async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill(TEST_ADMIN_EMAIL)
    await page.getByLabel('Password').fill(TEST_ADMIN_PASSWORD)
    await page.getByRole('button', { name: /log in/i }).click()

    await expect(page).toHaveURL(/.*admin/)
    await expect(page).not.toHaveURL(/.*dashboard/)
  })

  test('admin can suspend and reactivate a restaurant', async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill(TEST_ADMIN_EMAIL)
    await page.getByLabel('Password').fill(TEST_ADMIN_PASSWORD)
    await page.getByRole('button', { name: /log in/i }).click()

    await page.goto('http://localhost:3000/admin')
    const manageBtn = page.locator('[data-testid^="manage-btn-"]').first()
    await manageBtn.click()

    await expect(page.getByTestId('suspension-status')).toContainText('Active')

    await page.getByTestId('toggle-suspension-btn').click()
    await expect(page.getByTestId('suspension-status')).toContainText('Suspended')

    await page.getByTestId('toggle-suspension-btn').click()
    await expect(page.getByTestId('suspension-status')).toContainText('Active')
  })

  test('admin can add custom credits with reason', async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill(TEST_ADMIN_EMAIL)
    await page.getByLabel('Password').fill(TEST_ADMIN_PASSWORD)
    await page.getByRole('button', { name: /log in/i }).click()

    await page.goto('http://localhost:3000/admin')
    const manageBtn = page.locator('[data-testid^="manage-btn-"]').first()
    await manageBtn.click()

    await page.getByTestId('custom-credit-amount').fill('250')
    await page.getByTestId('custom-credit-reason').fill('Trial extension bonus')
    await page.getByTestId('custom-credit-btn').click()
    await expect(page.getByTestId('success-alert')).toBeVisible()
  })
})
