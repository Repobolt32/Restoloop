import { test, expect } from '@playwright/test'
import {
  createTestRestaurant,
  createTestCustomer,
  createTestCoupon,
  cleanupRestaurant,
  getCouponByCode,
} from './helpers/supabase'

test.describe('Coupon validation flow', () => {
  let restaurantId: string
  let customerId: string
  const validCode = `VALID${Date.now().toString(36).toUpperCase()}`.slice(0, 12)
  const redeemedCode = `REDEM${Date.now().toString(36).toUpperCase()}`.slice(0, 12)
  const notFoundCode = `NOPE${Date.now().toString(36).toUpperCase()}`.slice(0, 12)

  test.beforeAll(async () => {
    const restaurant = await createTestRestaurant(`E2E-Validate-${Date.now()}`)
    restaurantId = restaurant.id
    const customer = await createTestCustomer(restaurantId, '919999900002')
    customerId = customer.id

    await createTestCoupon(restaurantId, customerId, validCode, { status: 'sent' })
    await createTestCoupon(restaurantId, customerId, redeemedCode, { status: 'redeemed' })
  })

  test.afterAll(async () => {
    await cleanupRestaurant(restaurantId)
  })

  test('valid coupon is redeemed successfully', async ({ page }) => {
    await page.goto('/dashboard/validate')

    await page.fill('#coupon-code', validCode)
    await page.click('button[type="submit"]')

    await expect(page.getByText('Coupon Redeemed!')).toBeVisible()
    await expect(page.getByText(validCode, { exact: false })).toBeVisible()

    const coupon = await getCouponByCode(validCode)
    expect(coupon?.status).toBe('redeemed')
    expect(coupon?.redeemed_at).not.toBeNull()
  })

  test('already redeemed coupon shows error', async ({ page }) => {
    await page.goto('/dashboard/validate')

    await page.fill('#coupon-code', redeemedCode)
    await page.click('button[type="submit"]')

    await expect(page.getByText('Already redeemed')).toBeVisible()
  })

  test('nonexistent coupon code shows error', async ({ page }) => {
    await page.goto('/dashboard/validate')

    await page.fill('#coupon-code', notFoundCode)
    await page.click('button[type="submit"]')

    await expect(page.getByText('Coupon not found')).toBeVisible()
  })
})
