import { test, expect } from '@playwright/test'

test.describe('Slice 13: Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', process.env.TEST_OWNER_EMAIL ?? 'test@restoloop.com')
    await page.fill('#password', process.env.TEST_OWNER_PASSWORD ?? 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('analytics nav link exists and page loads', async ({ page }) => {
    await page.click('a[href="/dashboard/analytics"]')
    await page.waitForURL('/dashboard/analytics')
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible()
  })

  test('shows metric stat cards', async ({ page }) => {
    await page.goto('/dashboard/analytics')
    const cards = page.locator('.glass-card')
    await expect(cards.first()).toBeVisible()
    await expect(page.getByText('Total Customers', { exact: true })).toBeVisible()
    await expect(page.getByText('Coupons Issued', { exact: true })).toBeVisible()
    await expect(page.getByText('Campaigns Sent', { exact: true })).toBeVisible()
    await expect(page.getByText('Redemption Rate', { exact: true })).toBeVisible()
  })

  test('shows customer growth chart section', async ({ page }) => {
    await page.goto('/dashboard/analytics')
    await expect(page.getByRole('heading', { name: 'Customer Growth' })).toBeVisible()
  })

  test('shows campaign breakdown section', async ({ page }) => {
    await page.goto('/dashboard/analytics')
    await expect(page.getByRole('heading', { name: 'Campaign Breakdown' })).toBeVisible()
  })

  test('shows customer health section', async ({ page }) => {
    await page.goto('/dashboard/analytics')
    await expect(page.getByRole('heading', { name: 'Customer Health' })).toBeVisible()
    await expect(page.getByText(/active/i).first()).toBeVisible()
  })

  test('shows coupon performance section', async ({ page }) => {
    await page.goto('/dashboard/analytics')
    await expect(page.getByRole('heading', { name: 'Coupon Performance' })).toBeVisible()
  })

  test('dashboard overview links to analytics', async ({ page }) => {
    await page.goto('/dashboard')
    const analyticsCard = page.locator('a.dash-quick-card[href="/dashboard/analytics"]')
    await expect(analyticsCard).toBeVisible()
    await analyticsCard.click()
    await page.waitForURL('/dashboard/analytics')
  })
})
