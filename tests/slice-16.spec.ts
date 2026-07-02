import { test, expect } from '@playwright/test'

test.describe('Slice 16: Customer Segments', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill('iamkumarankit1502@gmail.com')
    await page.getByLabel('Password').fill('Ankit@2032')
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('Customers page shows all 7 segment filter chips', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/customers')
    await expect(page.getByTestId('segment-chips')).toBeVisible()
    for (const key of ['all', 'new', 'active', 'at-risk', 'lapsed', 'birthday', 'opted-out']) {
      await expect(page.getByTestId(`segment-${key}`)).toBeVisible()
    }
  })

  test('Clicking Active chip updates URL to ?segment=active', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/customers')
    await page.getByTestId('segment-active').click()
    await expect(page).toHaveURL(/.*segment=active/)
  })

  test('Clicking All chip returns to base URL', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/customers?segment=active')
    await page.getByTestId('segment-all').click()
    await expect(page).toHaveURL('http://localhost:3000/dashboard/customers')
  })

  test('Customers heading is visible', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/customers')
    await expect(page.getByTestId('customers-heading')).toBeVisible()
  })

  test('Segment column shows badges when customers exist', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/customers')
    const table = page.getByTestId('customers-table')
    const hasTable = await table.isVisible().catch(() => false)
    if (hasTable) {
      const firstRow = table.locator('tbody tr').first()
      const segmentCell = firstRow.locator('td').nth(3)
      await expect(segmentCell.locator('span').first()).toBeVisible()
    }
  })
})
