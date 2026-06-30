import { test, expect } from '@playwright/test'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function uniquePhone() {
  return '91' + Math.floor(1000000000 + Math.random() * 9000000000)
}

test.describe('Slice 6: Coupon Redemption', () => {
  let restaurantId: string
  let restaurantSlug: string
  let ownerId: string
  let testUserEmail: string
  let testUserPassword: string
  let customerId: string
  let validCouponCode: string
  let expiredCouponCode: string
  let redeemedCouponCode: string
  let wrongRestaurantCouponCode: string
  let wrongRestaurantId: string
  let wrongOwnerId: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    validCouponCode = `VAL_S6_${timestamp}`
    expiredCouponCode = `EXP_S6_${timestamp}`
    redeemedCouponCode = `RED_S6_${timestamp}`
    wrongRestaurantCouponCode = `WRG_S6_${timestamp}`

    testUserEmail = `test-owner-slice6-${timestamp}@restoloop.dev`
    testUserPassword = 'testpass123'

    // 1. Create a real test user
    const { data: userResp, error: userError } = await supabase.auth.admin.createUser({
      email: testUserEmail,
      password: testUserPassword,
      email_confirm: true
    })

    if (userError || !userResp.user) {
      throw new Error(`Failed to create test user: ${userError?.message || 'unknown error'}`)
    }

    ownerId = userResp.user.id

    // Create a second test user for the wrong restaurant
    const { data: wrongUserResp, error: wrongUserError } = await supabase.auth.admin.createUser({
      email: `test-owner-slice6-wrong-${timestamp}@restoloop.dev`,
      password: 'testpass123',
      email_confirm: true
    })

    if (wrongUserError || !wrongUserResp.user) {
      throw new Error(`Failed to create second test user: ${wrongUserError?.message || 'unknown error'}`)
    }

    wrongOwnerId = wrongUserResp.user.id

    // 2. Create the primary restaurant
    restaurantSlug = 'test-rest-slice6-' + timestamp
    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .insert({
        owner_id: ownerId,
        name: 'Slice 6 Test Diner',
        slug: restaurantSlug,
        whatsapp_number: uniquePhone(),
        credits: 100,
      })
      .select()
      .single()

    if (restError || !restaurant) {
      throw new Error(`Failed to create test restaurant: ${restError?.message || 'unknown error'}`)
    }

    restaurantId = restaurant.id

    // 3. Create a second restaurant to test wrong-restaurant coupon ownership
    const { data: otherRest, error: otherRestError } = await supabase
      .from('restaurants')
      .insert({
        owner_id: wrongOwnerId, // Owned by second user
        name: 'Wrong Restaurant',
        slug: 'wrong-rest-' + timestamp,
        whatsapp_number: uniquePhone(),
        credits: 10,
      })
      .select()
      .single()

    if (otherRestError || !otherRest) {
      throw new Error(`Failed to create second test restaurant: ${otherRestError?.message || 'unknown error'}`)
    }

    wrongRestaurantId = otherRest.id

    // 4. Create a customer
    const { data: customer, error: custError } = await supabase
      .from('customers')
      .insert({
        restaurant_id: restaurantId,
        name: 'Slice 6 Customer',
        phone: uniquePhone(),
        opt_in_status: 'opted_in',
      })
      .select()
      .single()

    if (custError || !customer) {
      throw new Error(`Failed to create test customer: ${custError?.message || 'unknown error'}`)
    }

    customerId = customer.id

    // 5. Seed coupons
    const { error: couponsError } = await supabase.from('coupons').insert([
      {
        restaurant_id: restaurantId,
        customer_id: customerId,
        type: 'welcome',
        code: validCouponCode,
        discount_cents: 5000,
        status: 'sent',
        expires_at: new Date(Date.now() + 86400000).toISOString()
      },
      {
        restaurant_id: restaurantId,
        customer_id: customerId,
        type: 'welcome',
        code: expiredCouponCode,
        discount_cents: 3000,
        status: 'sent',
        expires_at: new Date(Date.now() - 86400000).toISOString() // Past expiry
      },
      {
        restaurant_id: restaurantId,
        customer_id: customerId,
        type: 'welcome',
        code: redeemedCouponCode,
        discount_cents: 4000,
        status: 'redeemed',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        redeemed_at: new Date().toISOString()
      },
      {
        restaurant_id: wrongRestaurantId,
        customer_id: customerId, // Shared customer in primary restaurant for simple E2E mock setup
        type: 'welcome',
        code: wrongRestaurantCouponCode,
        discount_cents: 2000,
        status: 'sent',
        expires_at: new Date(Date.now() + 86400000).toISOString()
      }
    ])

    if (couponsError) {
      throw new Error(`Failed to create test coupons: ${couponsError.message}`)
    }
  })

  test.afterAll(async () => {
    // ponytail: clean up test references in order of DB constraint dependencies
    if (restaurantId) {
      await supabase.from('coupons').delete().eq('restaurant_id', restaurantId)
      await supabase.from('customers').delete().eq('restaurant_id', restaurantId)
      await supabase.from('restaurants').delete().eq('id', restaurantId)
    }
    if (wrongRestaurantId) {
      await supabase.from('coupons').delete().eq('restaurant_id', wrongRestaurantId)
      await supabase.from('restaurants').delete().eq('id', wrongRestaurantId)
    }
    if (ownerId) {
      await supabase.auth.admin.deleteUser(ownerId)
    }
    if (wrongOwnerId) {
      await supabase.auth.admin.deleteUser(wrongOwnerId)
    }
  })

  test('Redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/validate')
    await expect(page).toHaveURL(/.*login/)
  })

  test.describe('Authenticated flows', () => {
    test.beforeEach(async ({ page }) => {
      // 1. Log in via UI
      await page.goto('http://localhost:3000/login')
      await page.getByLabel('Email').fill(testUserEmail)
      await page.getByLabel('Password').fill(testUserPassword)
      await page.getByRole('button', { name: /log in/i }).click()
      await expect(page).toHaveURL(/.*dashboard/)
    })

    test('Validates and redeems a valid coupon', async ({ page }) => {
      // 2. Navigate to Validate Coupon Page
      await page.goto('http://localhost:3000/dashboard/validate')

      // 3. Submit valid coupon code
      await page.getByLabel('Coupon Code').fill(validCouponCode)
      await page.getByRole('button', { name: /validate & redeem/i }).click()

      // 4. Verify success display
      await expect(page.getByText('Coupon Redeemed!')).toBeVisible()
      await expect(page.getByText('Slice 6 Customer')).toBeVisible()
      await expect(page.getByText('₹50.00')).toBeVisible()

      // 5. Verify database changes
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', validCouponCode)
        .single()

      expect(coupon!.status).toBe('redeemed')
      expect(coupon!.redeemed_at).not.toBeNull()

      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single()

      expect(customer!.last_visit_at).not.toBeNull()
    })

    test('Handles non-existent coupon error', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/validate')
      await page.getByLabel('Coupon Code').fill('NON_EXISTENT_CODE')
      await page.getByRole('button', { name: /validate & redeem/i }).click()

      await expect(page.getByText('Coupon not found')).toBeVisible()
    })

    test('Handles already redeemed coupon error', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/validate')
      await page.getByLabel('Coupon Code').fill(redeemedCouponCode)
      await page.getByRole('button', { name: /validate & redeem/i }).click()

      await expect(page.getByText('Already redeemed')).toBeVisible()
    })

    test('Handles expired coupon error', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/validate')
      await page.getByLabel('Coupon Code').fill(expiredCouponCode)
      await page.getByRole('button', { name: /validate & redeem/i }).click()

      await expect(page.getByText('Expired')).toBeVisible()
    })

    test('Handles wrong restaurant coupon error', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/validate')
      await page.getByLabel('Coupon Code').fill(wrongRestaurantCouponCode)
      await page.getByRole('button', { name: /validate & redeem/i }).click()

      await expect(page.getByText('Coupon not found')).toBeVisible()
    })
  })
})
