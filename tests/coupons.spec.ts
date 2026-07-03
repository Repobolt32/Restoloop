import { test, expect } from '@playwright/test'
import { createTestRestaurant, createTestCustomer, cleanupRestaurant } from './helpers/supabase'

test.describe('Coupon CRUD flow', () => {
  let restaurantId: string
  let customerId: string

  test.beforeAll(async () => {
    const restaurant = await createTestRestaurant(`E2E-Coupons-${Date.now()}`)
    restaurantId = restaurant.id
    const customer = await createTestCustomer(restaurantId, '919999900001')
    customerId = customer.id
  })

  test.afterAll(async () => {
    await cleanupRestaurant(restaurantId)
  })

  test('create, disable, and delete a coupon', async ({ page }) => {
    await page.goto('/dashboard/coupons')

    await expect(page.getByTestId('coupons-heading')).toBeVisible()

    await page.fill('input[name="customer_id"]', customerId)
    await page.fill('input[name="discount_cents"]', '50')
    await page.click('button[type="submit"]')

    const couponsTable = page.getByTestId('coupons-table')
    await expect(couponsTable).toBeVisible()

    const firstRow = couponsTable.locator('tbody tr').first()
    const codeCell = firstRow.locator('td').first()
    const couponCode = await codeCell.textContent()
    expect(couponCode).toBeTruthy()

    const disableBtn = page.getByTestId(`disable-coupon-${couponCode}`)
    await expect(disableBtn).toBeVisible()
    await disableBtn.click()

    await expect(firstRow).toContainText('Disabled')

    await page.fill('input[name="customer_id"]', customerId)
    await page.fill('input[name="discount_cents"]', '100')
    await page.click('button[type="submit"]')

    // Wait for the new coupon to be listed (there should now be 2 rows)
    await expect(couponsTable.locator('tbody tr')).toHaveCount(2)
    const rows = couponsTable.locator('tbody tr')
    const rowCount = await rows.count()

    let deleted = false
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i)
      const code = await row.locator('td').first().textContent()
      const deleteBtn = page.getByTestId(`delete-coupon-${code}`)
      if (await deleteBtn.isVisible().catch(() => false)) {
        await deleteBtn.click()
        await expect(page.getByTestId(`delete-coupon-${code}`)).toHaveCount(0)
        deleted = true
        break
      }
    }
    expect(deleted).toBe(true)
  })
})
