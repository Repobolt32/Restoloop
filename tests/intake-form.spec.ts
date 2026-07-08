import { test, expect } from '@playwright/test'
import { createTestRestaurant, cleanupRestaurant, createTestSupabase } from './helpers/supabase'

test.use({ storageState: undefined })

test.describe('Public intake form flow', () => {
  let restaurantId: string
  let restaurantSlug: string

  test.beforeAll(async () => {
    const restaurant = await createTestRestaurant(`E2E-Intake-${Date.now()}`)
    restaurantId = restaurant.id
    restaurantSlug = restaurant.slug
  })

  test.afterAll(async () => {
    await cleanupRestaurant(restaurantId)
  })

  test('customer submits intake form and sees success', async ({ page }) => {
    await page.goto(`/form/${restaurantSlug}`)

    await expect(page.getByRole('heading', { name: 'Join the Club' })).toBeVisible()

    await page.fill('#name', 'E2E Test Customer')
    await page.fill('#phone', '+919999900099')
    await page.selectOption('#birthdayMonth', '6')
    await page.selectOption('#birthdayDay', '15')
    await page.selectOption('#foodPreference', 'Veg')

    await page.click('button[type="submit"]')

    await expect(page.getByRole('heading', { name: 'You\'re Registered!' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Open WhatsApp' })).toBeVisible()

    const supabase = createTestSupabase()
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('phone', '919999900099')
      .maybeSingle()

    expect(customer).not.toBeNull()
    expect(customer?.name).toBe('E2E Test Customer')
    expect(customer?.opt_in_status).toBe('opted_in')
    expect(customer?.birthday_month).toBe(6)
    expect(customer?.birthday_day).toBe(15)
    expect(customer?.food_preference).toBe('Veg')

    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('customer_id', customer!.id)
      .eq('type', 'welcome')
      .maybeSingle()

    expect(coupon).not.toBeNull()
    expect(coupon?.status).toBe('sent')
    expect(coupon?.discount_percent).toBe(10)
  })

  test('invalid phone shows client-side error', async ({ page }) => {
    await page.goto(`/form/${restaurantSlug}`)

    await page.fill('#name', 'Bad Phone Customer')
    await page.fill('#phone', '12345')
    await page.click('button[type="submit"]')

    await expect(page.getByText('WhatsApp number must start with +91', { exact: false })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'You\'re Registered!' })).toHaveCount(0)
  })

  test('nonexistent slug shows 404', async ({ page }) => {
    const response = await page.goto('/form/nonexistent-slug-xyz')
    expect(response?.status()).toBe(404)
  })
})
