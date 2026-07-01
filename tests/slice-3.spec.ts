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

test.describe('Slice 3: Owner Sees Activity', () => {
  let restaurantId: string
  let restaurantSlug: string
  let ownerId: string
  let testUserEmail: string
  let testUserPassword: string

  test.beforeAll(async () => {
    testUserEmail = `test-owner-slice3-${Date.now()}@restoloop.dev`
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
    restaurantSlug = 'test-rest-slice3-' + Date.now()
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .insert({
        owner_id: ownerId,
        name: 'Slice 3 Test Diner',
        slug: restaurantSlug,
        whatsapp_number: uniquePhone(),
        welcome_discount_cents: 5000,
        birthday_discount_cents: 3500,
        winback_discount_cents: 3000,
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
    // Clean up test data
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

  test('Unauthenticated redirect to login from /dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')
    await expect(page).toHaveURL(/.*login/)
  })

  test('Unauthenticated redirect to login from /dashboard/customers', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/customers')
    await expect(page).toHaveURL(/.*login/)
  })

  test('Unauthenticated redirect to login from /dashboard/coupons', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/coupons')
    await expect(page).toHaveURL(/.*login/)
  })

  test('Authenticated dashboard overview', async ({ page }) => {
    // Log in via UI
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill(testUserEmail)
    await page.getByLabel('Password').fill(testUserPassword)
    await page.getByRole('button', { name: /log in/i }).click()

    await expect(page).toHaveURL(/.*dashboard/)
    
    // Check dashboard elements
    await expect(page.getByTestId('restaurant-name')).toContainText('Slice 3 Test Diner')
    await expect(page.getByTestId('recent-activity')).toBeVisible()
    
    // Check for stat cards
    await expect(page.getByText('Total Guests')).toBeVisible()
    await expect(page.getByText('Credits Remaining')).toBeVisible()
  })

  test('Active customers list and masking', async ({ page }) => {
    // Log in
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill(testUserEmail)
    await page.getByLabel('Password').fill(testUserPassword)
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)

    // Seed a customer *before* navigating to the page
    const phone = uniquePhone()
    await supabase.from('customers').insert({
      restaurant_id: restaurantId,
      name: 'Test Customer',
      phone: phone,
      opt_in_status: 'opted_in'
    })

    // Navigate to customers
    await page.goto('http://localhost:3000/dashboard/customers')
    await expect(page.getByTestId('customers-heading')).toContainText('Active Guests')
    await expect(page.getByTestId('customers-table')).toBeVisible()

    const maskedPhone = phone.slice(0, -4) + '****'
    await expect(page.getByText('Test Customer')).toBeVisible()
    await expect(page.getByText(maskedPhone)).toBeVisible()
  })

  test('Coupons list and filter chips', async ({ page }) => {
    // Log in
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill(testUserEmail)
    await page.getByLabel('Password').fill(testUserPassword)
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)

    // Seed coupons
    const { data: customer } = await supabase.from('customers').insert({ 
      restaurant_id: restaurantId, 
      phone: uniquePhone(), 
      name: 'Coupon Tester' 
    }).select().single()
    
    await supabase.from('coupons').insert([
      { 
        restaurant_id: restaurantId, 
        customer_id: customer!.id, 
        code: 'WELCOME10', 
        type: 'welcome', 
        status: 'sent', 
        discount_cents: 5000, 
        expires_at: new Date(Date.now() + 86400000).toISOString() 
      },
      { 
        restaurant_id: restaurantId, 
        customer_id: customer!.id, 
        code: 'BIRTHDAY20', 
        type: 'birthday', 
        status: 'sent', 
        discount_cents: 3500, 
        expires_at: new Date(Date.now() + 86400000).toISOString() 
      }
    ])

    await page.goto('http://localhost:3000/dashboard/coupons')
    await expect(page.getByTestId('coupons-heading')).toContainText('Coupons')
    await expect(page.getByTestId('coupons-table')).toBeVisible()
    await expect(page.getByTestId('filter-chips')).toBeVisible()

    // Filter Welcome
    await page.getByTestId('filter-welcome').click()
    await expect(page.getByTestId('coupons-table')).toContainText('WELCOME10')
    await expect(page.getByTestId('coupons-table')).not.toContainText('BIRTHDAY20')

    // Filter Birthday
    await page.getByTestId('filter-birthday').click()
    await expect(page.getByTestId('coupons-table')).toContainText('BIRTHDAY20')
    await expect(page.getByTestId('coupons-table')).not.toContainText('WELCOME10')

    // Filter All
    await page.getByTestId('filter-all').click()
    await expect(page.getByTestId('coupons-table')).toContainText('WELCOME10')
    await expect(page.getByTestId('coupons-table')).toContainText('BIRTHDAY20')
  })

  test('Recent activity feed', async ({ page }) => {
    // Log in
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill(testUserEmail)
    await page.getByLabel('Password').fill(testUserPassword)
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)

    // Seed message logs
    const { data: customer } = await supabase.from('customers').insert({ 
      restaurant_id: restaurantId, 
      phone: uniquePhone(), 
      name: 'Activity Tester' 
    }).select().single()
    
    await supabase.from('message_logs').insert([
      { 
        restaurant_id: restaurantId, 
        customer_id: customer!.id, 
        type: 'welcome', 
        status: 'sent', 
        direction: 'outbound' 
      },
      { 
        restaurant_id: restaurantId, 
        customer_id: customer!.id, 
        type: 'birthday', 
        status: 'failed', 
        direction: 'outbound' 
      }
    ])

    await page.goto('http://localhost:3000/dashboard')
    
    const activity = page.getByTestId('recent-activity')
    await expect(activity).toContainText('welcome')
    await expect(activity).toContainText('sent')
    await expect(activity).toContainText('birthday')
    await expect(activity).toContainText('failed')
  })
})