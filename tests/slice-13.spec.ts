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
    await expect(page.getByText(/total customers/i)).toBeVisible()
    await expect(page.getByText(/coupons issued/i)).toBeVisible()
    await expect(page.getByText(/campaigns sent/i)).toBeVisible()
    await expect(page.getByText(/redemption rate/i)).toBeVisible()
  })

  test('shows customer growth chart section', async ({ page }) => {
    await page.goto('/dashboard/analytics')
    await expect(page.getByText(/customer growth/i)).toBeVisible()
  })

  test('shows campaign breakdown section', async ({ page }) => {
    await page.goto('/dashboard/analytics')
    await expect(page.getByText(/campaign breakdown/i)).toBeVisible()
  })

  test('shows customer health section', async ({ page }) => {
    await page.goto('/dashboard/analytics')
    await expect(page.getByText(/customer health/i)).toBeVisible()
    await expect(page.getByText(/active/i)).toBeVisible()
  })

  test('shows coupon performance section', async ({ page }) => {
    await page.goto('/dashboard/analytics')
    await expect(page.getByText(/coupon performance/i)).toBeVisible()
  })

  test('dashboard overview links to analytics', async ({ page }) => {
    await page.goto('/dashboard')
    const analyticsCard = page.getByRole('link', { name: /analytics/i })
    await expect(analyticsCard).toBeVisible()
    await analyticsCard.click()
    await page.waitForURL('/dashboard/analytics')
  })
})
