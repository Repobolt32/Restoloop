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

test.describe('Slice 11: Campaign Visibility', () => {
  let restaurantId: string
  let restaurantSlug: string
  let ownerId: string
  let testUserEmail: string
  let testUserPassword: string

  test.beforeAll(async () => {
    testUserEmail = `test-owner-slice11-${Date.now()}@restoloop.dev`
    testUserPassword = 'testpass123'

    const { data: userResp, error: userError } = await supabase.auth.admin.createUser({
      email: testUserEmail,
      password: testUserPassword,
      email_confirm: true
    })

    if (userError || !userResp.user) {
      throw new Error(`Failed to create test user: ${userError?.message || 'unknown error'}`)
    }

    ownerId = userResp.user.id

    restaurantSlug = 'test-rest-slice11-' + Date.now()
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .insert({
        owner_id: ownerId,
        name: 'Slice 11 Test Bistro',
        slug: restaurantSlug,
        whatsapp_number: uniquePhone(),
        welcome_discount_cents: 4000,
        credits: 1000,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create test restaurant: ${error.message}`)
    }

    restaurantId = restaurant.id
  })

  test.afterAll(async () => {
    if (restaurantId) {
      await supabase.from('message_logs').delete().eq('restaurant_id', restaurantId)
      await supabase.from('coupons').delete().eq('restaurant_id', restaurantId)
      await supabase.from('customers').delete().eq('restaurant_id', restaurantId)
      await supabase.from('restaurants').delete().eq('id', restaurantId)
    }
    if (ownerId) {
      await supabase.auth.admin.deleteUser(ownerId)
    }
  })

  test('Campaigns page renders stats and table/empty state', async ({ page }) => {
    // 1. Log in
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill(testUserEmail)
    await page.getByLabel('Password').fill(testUserPassword)
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)

    // 2. Navigate to campaigns
    await page.goto('http://localhost:3000/dashboard/campaigns')

    // 3. Verify title and metadata
    await expect(page.locator('h1')).toContainText('Campaigns')

    // 4. Verify stats cards
    await expect(page.getByText('Welcome Reminder')).toBeVisible()
    await expect(page.getByText('Birthday')).toBeVisible()
    await expect(page.getByText('Winback')).toBeVisible()

    // 5. Verify empty state since no campaigns have run yet
    await expect(page.getByText('No campaigns have run yet')).toBeVisible()
  })

  test('Sidebar has campaigns link', async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill(testUserEmail)
    await page.getByLabel('Password').fill(testUserPassword)
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)

    const sidebar = page.getByTestId('dashboard-sidebar')
    await expect(sidebar.getByText('Campaigns')).toBeVisible()
  })
})
