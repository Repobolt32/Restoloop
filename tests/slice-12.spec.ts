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

test.describe('Slice 12: Dashboard Upgrade', () => {
  let restaurantId: string
  let restaurantSlug: string
  let ownerId: string
  let testUserEmail: string
  let testUserPassword: string

  test.beforeAll(async () => {
    testUserEmail = `test-owner-slice12-${Date.now()}@restoloop.dev`
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

    restaurantSlug = 'test-rest-slice12-' + Date.now()
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .insert({
        owner_id: ownerId,
        name: 'Slice 12 Test Diner',
        slug: restaurantSlug,
        whatsapp_number: uniquePhone(),
        welcome_discount_cents: 3000,
        credits: 950,
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

  test('Dashboard upgraded view displays 4 stat cards, performance, and activity list', async ({ page }) => {
    // 1. Log in
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill(testUserEmail)
    await page.getByLabel('Password').fill(testUserPassword)
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)

    // 2. Verify restaurant header
    await expect(page.getByTestId('restaurant-name')).toContainText('Slice 12 Test Diner')

    // 3. Verify the 4 upgraded stat cards are visible
    await expect(page.getByText('Total Guests')).toBeVisible()
    await expect(page.getByText('Credits Remaining')).toBeVisible()
    await expect(page.getByText('Coupons Sent')).toBeVisible()
    await expect(page.getByText('Redemption Rate')).toBeVisible()

    // Verify values match seeded credits
    await expect(page.getByText('950')).toBeVisible()

    // 4. Verify Campaign Performance summary is visible
    await expect(page.getByText('Campaign Performance')).toBeVisible()
    await expect(page.getByText('Welcome')).toBeVisible()
    await expect(page.getByText('Birthday')).toBeVisible()
    await expect(page.getByText('Winback')).toBeVisible()
    await expect(page.getByText('Expiry')).toBeVisible()

    // 5. Verify Recent Activity is visible
    await expect(page.getByTestId('recent-activity')).toBeVisible()
  })
})
