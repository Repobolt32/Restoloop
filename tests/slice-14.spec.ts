import { test, expect } from '@playwright/test'

test.describe('Slice 14: Coupon Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', process.env.TEST_OWNER_EMAIL ?? 'test@restoloop.com')
    await page.fill('#password', process.env.TEST_OWNER_PASSWORD ?? 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('coupons page renders with heading and filter chips', async ({ page }) => {
    await page.goto('/dashboard/coupons')
    await expect(page.getByTestId('coupons-heading')).toBeVisible()
    await expect(page.getByTestId('filter-chips')).toBeVisible()
    await expect(page.getByTestId('filter-all')).toBeVisible()
    await expect(page.getByTestId('filter-welcome')).toBeVisible()
    await expect(page.getByTestId('filter-birthday')).toBeVisible()
    await expect(page.getByTestId('filter-winback')).toBeVisible()
    await expect(page.getByTestId('filter-manual')).toBeVisible()
  })

  test('filter chips switch active state', async ({ page }) => {
    await page.goto('/dashboard/coupons')
    const welcomeChip = page.getByTestId('filter-welcome')
    await welcomeChip.click()
    await expect(welcomeChip).toHaveClass(/bg-\[--color-primary\]/)
  })

  test('coupons page shows create manual coupon form', async ({ page }) => {
    await page.goto('/dashboard/coupons')
    await expect(page.locator('#customer_id')).toBeVisible()
    await expect(page.locator('#discount_cents')).toBeVisible()
    await expect(page.getByRole('button', { name: /create coupon/i })).toBeVisible()
  })

  test('coupons table renders when coupons exist', async ({ page }) => {
    await page.goto('/dashboard/coupons')
    const table = page.getByTestId('coupons-table')
    const empty = page.getByText(/no coupons issued yet/i)
    const hasData = await table.isVisible()
    const isEmpty = await empty.isVisible()
    expect(hasData || isEmpty).toBe(true)
  })

  test('settings page shows campaign discount form', async ({ page }) => {
    await page.goto('/dashboard/settings')
    await expect(page.getByTestId('welcome-discount-input')).toBeVisible()
    await expect(page.getByTestId('birthday-discount-input')).toBeVisible()
    await expect(page.getByTestId('winback-discount-input')).toBeVisible()
    await expect(page.getByTestId('save-discounts-btn')).toBeVisible()
  })

  test('settings discount inputs have default values', async ({ page }) => {
    await page.goto('/dashboard/settings')
    const welcomeInput = page.getByTestId('welcome-discount-input')
    await expect(welcomeInput).toBeVisible()
    const value = await welcomeInput.inputValue()
    expect(parseFloat(value)).toBeGreaterThan(0)
  })
})
