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

test.describe('Slice 7: Credits and Razorpay Sandbox Integration', () => {
  let restaurantId: string
  let restaurantSlug: string
  let ownerId: string
  let testUserEmail: string
  let testUserPassword: string

  test.beforeAll(async () => {
    testUserEmail = `test-owner-slice7-${Date.now()}@restoloop.dev`
    testUserPassword = 'testpass123'

    // Create a real test user
    const { data: userResp, error: userError } = await supabase.auth.admin.createUser({
      email: testUserEmail,
      password: testUserPassword,
      email_confirm: true
    })

    if (userError || !userResp.user) {
      throw new Error(`Failed to create test user: ${userError?.message || 'unknown error'}`)
    }

    ownerId = userResp.user.id

    // Create a restaurant for the user
    restaurantSlug = 'test-rest-slice7-' + Date.now()
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .insert({
        owner_id: ownerId,
        name: 'Slice 7 Test Diner',
        slug: restaurantSlug,
        whatsapp_number: uniquePhone(),
        welcome_discount_cents: 5000,
        birthday_discount_cents: 3500,
        winback_discount_cents: 3000,
        credits: 1000,
        plan: 'pro',
        plan_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create test restaurant: ${error.message}`)
    }

    restaurantId = restaurant.id
  })

  test.afterAll(async () => {
    // Clean up test data
    if (restaurantId) {
      await supabase.from('restaurants').delete().eq('id', restaurantId)
    }
    if (ownerId) {
      await supabase.auth.admin.deleteUser(ownerId)
    }
  })

  test('Settings page and quick-nav navigation', async ({ page }) => {
    // Log in
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill(testUserEmail)
    await page.getByLabel('Password').fill(testUserPassword)
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)

    // Click quick nav card
    await page.click('text=Settings')
    await expect(page).toHaveURL(/.*settings/)

    // Check basic parameters
    await expect(page.getByTestId('settings-restaurant-name')).toContainText('Slice 7 Test Diner')
    await expect(page.getByTestId('credits-value')).toContainText('1000')
    await expect(page.getByTestId('recharge-starter')).toBeVisible()
  })

  test('Top-up flow sandbox simulator (success outcome)', async ({ page }) => {
    // Log in and navigate to settings
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill(testUserEmail)
    await page.getByLabel('Password').fill(testUserPassword)
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)
    await page.goto('http://localhost:3000/dashboard/settings')

    // Click top-up button
    await page.getByTestId('recharge-starter').click()

    // Assert sandbox modal opens
    await expect(page.getByTestId('sandbox-modal')).toBeVisible()

    // Simulate successful payment
    await page.getByTestId('sandbox-simulate-success').click()

    // Assert sandbox modal closes and success alert displays
    await expect(page.getByTestId('sandbox-modal')).not.toBeVisible()
    await expect(page.getByTestId('payment-success-alert')).toContainText(/successfully purchased 500 credits/i)

    // Assert credits value updated in UI (1000 + 500 = 1500)
    await expect(page.getByTestId('credits-value')).toContainText('1500')
  })

  test('Top-up flow sandbox simulator (cancel outcome)', async ({ page }) => {
    // Log in and navigate to settings
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill(testUserEmail)
    await page.getByLabel('Password').fill(testUserPassword)
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)
    await page.goto('http://localhost:3000/dashboard/settings')

    // Click top-up button
    await page.getByTestId('recharge-growth').click()

    // Assert sandbox modal opens
    await expect(page.getByTestId('sandbox-modal')).toBeVisible()

    // Simulate cancel
    await page.getByTestId('sandbox-simulate-fail').click()

    // Assert sandbox modal closes and error alert displays
    await expect(page.getByTestId('sandbox-modal')).not.toBeVisible()
    await expect(page.getByTestId('payment-error-alert')).toContainText(/payment cancelled by user/i)
  })

  test('Direct Webhook POST triggers database update in mock mode', async ({ request }) => {
    const payload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_webhook_test_${Date.now()}`,
            amount: 150000,
            currency: 'INR',
            notes: {
              credits: '500',
              userId: ownerId
            }
          }
        }
      }
    }

    const response = await request.post('http://localhost:3000/api/razorpay/webhook', {
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'sig_mock'
      },
      data: JSON.stringify(payload)
    })

    expect(response.ok()).toBe(true)

    // Query DB directly to check if credits incremented (was 1500 after previous test + 500 = 2000)
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('credits')
      .eq('id', restaurantId)
      .single()

    expect(restaurant).not.toBeNull()
    expect(restaurant!.credits).toBe(2000)
  })
})
