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

test.describe('Pricing Model & Billing Slice', () => {
  let restaurantId: string
  let restaurantSlug: string
  let ownerId: string
  let testUserEmail: string
  let testUserPassword: string

  test.beforeEach(async () => {
    testUserEmail = `test-owner-pricing-${Date.now()}@restoloop.dev`
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

    // Create a restaurant for the user starting on Free plan
    restaurantSlug = 'test-rest-pricing-' + Date.now()
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .insert({
        owner_id: ownerId,
        name: 'Pricing Test Cafe',
        slug: restaurantSlug,
        whatsapp_number: uniquePhone(),
        credits: 0,
        plan: 'free',
        plan_expires_at: null,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create test restaurant: ${error.message}`)
    }

    restaurantId = restaurant.id
  })

  test.afterEach(async () => {
    // Clean up test data
    if (restaurantId) {
      await supabase.from('restaurants').delete().eq('id', restaurantId)
    }
    if (ownerId) {
      await supabase.auth.admin.deleteUser(ownerId)
    }
  })

  test('Recharge buttons are disabled on Free plan', async ({ page }) => {
    // Log in
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill(testUserEmail)
    await page.getByLabel('Password').fill(testUserPassword)
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)

    // Go to settings
    await page.goto('http://localhost:3000/dashboard/settings')

    // Expect recharge button to be disabled
    const starterBtn = page.getByTestId('recharge-starter')
    await expect(starterBtn).toBeDisabled()
  })

  test('Purchases recharge credits via settings sandbox flow', async ({ page }) => {
    // Set plan to active pro plan in DB so recharge is allowed by backend
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    await supabase
      .from('restaurants')
      .update({ plan: 'pro', plan_expires_at: futureDate, credits: 100 })
      .eq('id', restaurantId)

    // Log in
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill(testUserEmail)
    await page.getByLabel('Password').fill(testUserPassword)
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)

    // Go to settings
    await page.goto('http://localhost:3000/dashboard/settings')

    // Click Buy Pack on Starter pack
    await page.getByTestId('recharge-starter').click()

    // Assert sandbox modal opens
    await expect(page.getByTestId('sandbox-modal')).toBeVisible()

    // Simulate success
    await page.getByTestId('sandbox-simulate-success').click()

    // Expect sandbox modal to close and success alert
    await expect(page.getByTestId('sandbox-modal')).not.toBeVisible()
    await expect(page.getByTestId('payment-success-alert')).toContainText(/purchased 500 credits/i)

    // Expect credits value to update to 600
    await expect(page.getByTestId('credits-value')).toContainText('600')
  })

  test('Shows renewal banner on dashboard when paid plan is expired', async ({ page }) => {
    // Set plan to expired in DB
    const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    await supabase
      .from('restaurants')
      .update({
        plan: 'pro',
        plan_expires_at: expiredDate,
      })
      .eq('id', restaurantId)

    // Log in
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill(testUserEmail)
    await page.getByLabel('Password').fill(testUserPassword)
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)

    // Expired banner is visible
    await expect(page.getByTestId('expired-plan-banner')).toBeVisible()
    await expect(page.getByTestId('expired-plan-banner')).toContainText(/your PRO plan expired/i)

    // Click renew button
    await page.getByTestId('renew-plan-btn').click()

    // Assert sandbox modal opens
    await expect(page.getByTestId('sandbox-modal')).toBeVisible()
    await page.getByTestId('sandbox-simulate-success').click()

    // Sandbox closes and banner should be gone (or trial banner state is updated)
    await expect(page.getByTestId('sandbox-modal')).not.toBeVisible()
  })

  test('Public /pricing page shows detailed plan options and FAQ list', async ({ page }) => {
    await page.goto('http://localhost:3000/pricing')
    
    // Header check
    await expect(page.locator('h1')).toContainText(/simple, transparent pricing/i)

    // Plan column check
    await expect(page.locator('text=Trial').first()).toBeVisible()
    await expect(page.locator('text=Pro').first()).toBeVisible()
    await expect(page.locator('text=Max').first()).toBeVisible()
    await expect(page.locator('text=Ultra').first()).toBeVisible()

    // FAQ check
    await expect(page.locator('text=Do unused credits expire?')).toBeVisible()
  })
})
