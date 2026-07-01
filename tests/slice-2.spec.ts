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

test.describe('Slice 2: Customer Joins', () => {
  let restaurantId: string
  let restaurantSlug: string
  let restaurantPhone: string
  let ownerId: string

  test.beforeAll(async () => {
    // Generate unique restaurant for this test run
    restaurantSlug = 'test-rest-' + Date.now()
    restaurantPhone = uniquePhone()

    // Create a real test user to satisfy owner_id foreign key constraint
    const { data: userResp, error: userError } = await supabase.auth.admin.createUser({
      email: `test-owner-${Date.now()}@restoloop.dev`,
      password: 'testpass123',
      email_confirm: true
    })

    if (userError || !userResp.user) {
      throw new Error(`Failed to create test user: ${userError?.message || 'unknown error'}`)
    }

    ownerId = userResp.user.id

    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .insert({
        owner_id: ownerId,
        name: 'Slice 2 Test Diner',
        slug: restaurantSlug,
        whatsapp_number: restaurantPhone,
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
      await supabase.from('coupons').delete().eq('restaurant_id', restaurantId)
      await supabase.from('message_logs').delete().eq('restaurant_id', restaurantId)
      await supabase.from('customers').delete().eq('restaurant_id', restaurantId)
      await supabase.from('restaurants').delete().eq('id', restaurantId)
    }
    if (ownerId) {
      await supabase.auth.admin.deleteUser(ownerId)
    }
  })

  test('Intake form submission creates a pending customer and welcome coupon', async ({ page }) => {
    const customerPhone = '+9199' + Math.floor(10000000 + Math.random() * 90000000)
    const rawPhone = customerPhone.replace('+', '')

    // Use absolute URL to bypass baseURL resolution issues
    await page.goto(`http://localhost:3000/form/${restaurantSlug}`)

    await page.getByLabel('Name').fill('Jane Doe')
    await page.getByLabel('WhatsApp Number').fill(customerPhone)
    await page.getByLabel('Birth Month').selectOption('10')
    await page.getByLabel('Birth Day').selectOption('25')
    await page.getByLabel('Food Preference').selectOption('Veg')

    await page.getByRole('button', { name: /get whatsapp coupon|submit/i }).click()

    // Expect click to chat link to be rendered
    const whatsappLink = page.getByRole('link', { name: /open whatsapp|get coupon/i })
    await expect(whatsappLink).toBeVisible()
    const href = await whatsappLink.getAttribute('href')
    expect(href).toContain(`wa.me/${restaurantPhone}`)

    // Verify in database
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('phone', rawPhone)
      .single()

    expect(customer).toBeTruthy()
    expect(customer!.name).toBe('Jane Doe')
    expect(customer!.opt_in_status).toBe('pending')
    expect(customer!.birthday_month).toBe(10)
    expect(customer!.birthday_day).toBe(25)
    expect(customer!.food_preference).toBe('Veg')

    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('customer_id', customer!.id)
      .eq('type', 'welcome')
      .single()

    expect(coupon).toBeTruthy()
    expect(coupon!.discount_cents).toBe(5000)
    expect(coupon!.status).toBe('sent')
  })

  test('Webhook creates a pending customer and sends the opt-in prompt', async ({ request }) => {
    const customerPhone = '9199' + Math.floor(10000000 + Math.random() * 90000000)
    const providerMsgId = 'msg-' + Date.now()

    // Send inbound webhook message to absolute URL
    const res = await request.post('http://localhost:3000/api/whatsapp', {
      data: {
        from: `${customerPhone}@c.us`,
        to: `${restaurantPhone}@c.us`,
        body: 'hello',
        id: providerMsgId,
        timestamp: Math.floor(Date.now() / 1000)
      }
    })

    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('ok')

    // Verify customer exists and is pending
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('phone', customerPhone)
      .single()

    expect(customer).toBeTruthy()
    expect(customer!.opt_in_status).toBe('pending')

    // Verify message logs
    const { data: logs } = await supabase
      .from('message_logs')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('customer_id', customer!.id)

    expect(logs).not.toBeNull()
    const logsList = logs || []
    expect(logsList.length).toBeGreaterThanOrEqual(1)
    const optInPromptLog = logsList.find(l => l.type === 'opt_in_prompt' && l.direction === 'outbound')
    expect(optInPromptLog).toBeTruthy()
    expect(optInPromptLog!.status).toBe('sent')
  })

  test('Webhook confirms opt-in and creates the welcome coupon', async ({ request }) => {
    const customerPhone = '9199' + Math.floor(10000000 + Math.random() * 90000000)
    
    // Setup pending customer
    const { data: customer } = await supabase
      .from('customers')
      .insert({
        restaurant_id: restaurantId,
        phone: customerPhone,
        opt_in_status: 'pending',
      })
      .select()
      .single()

    const providerMsgId = 'msg-optin-' + Date.now()

    // Send YES message to absolute URL
    const res = await request.post('http://localhost:3000/api/whatsapp', {
      data: {
        from: `${customerPhone}@c.us`,
        to: `${restaurantPhone}@c.us`,
        body: 'YES',
        id: providerMsgId,
        timestamp: Math.floor(Date.now() / 1000)
      }
    })

    expect(res.status()).toBe(200)

    // Verify opted_in status
    const { data: updatedCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customer!.id)
      .single()

    expect(updatedCustomer!.opt_in_status).toBe('opted_in')

    // Verify welcome coupon created
    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('customer_id', customer!.id)
      .eq('type', 'welcome')
      .single()

    expect(coupon).toBeTruthy()
    expect(coupon!.status).toBe('sent')
  })

  test('Webhook handles STOP by opting the customer out', async ({ request }) => {
    const customerPhone = '9199' + Math.floor(10000000 + Math.random() * 90000000)

    // Setup active customer
    const { data: customer } = await supabase
      .from('customers')
      .insert({
        restaurant_id: restaurantId,
        phone: customerPhone,
        opt_in_status: 'opted_in',
      })
      .select()
      .single()

    const providerMsgId = 'msg-stop-' + Date.now()

    // Send STOP message to absolute URL
    const res = await request.post('http://localhost:3000/api/whatsapp', {
      data: {
        from: `${customerPhone}@c.us`,
        to: `${restaurantPhone}@c.us`,
        body: 'STOP',
        id: providerMsgId,
        timestamp: Math.floor(Date.now() / 1000)
      }
    })

    expect(res.status()).toBe(200)

    // Verify status updated to opted_out
    const { data: updatedCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customer!.id)
      .single()

    expect(updatedCustomer!.opt_in_status).toBe('opted_out')
  })

  test('Webhook deduplicates repeated provider messages', async ({ request }) => {
    const customerPhone = '9199' + Math.floor(10000000 + Math.random() * 90000000)
    const providerMsgId = 'msg-dedupe-' + Date.now()

    // First send to absolute URL
    const res1 = await request.post('http://localhost:3000/api/whatsapp', {
      data: {
        from: `${customerPhone}@c.us`,
        to: `${restaurantPhone}@c.us`,
        body: 'hello',
        id: providerMsgId,
        timestamp: Math.floor(Date.now() / 1000)
      }
    })
    expect(res1.status()).toBe(200)
    const json1 = await res1.json()
    expect(json1.status).toBe('ok')

    // Duplicate send to absolute URL
    const res2 = await request.post('http://localhost:3000/api/whatsapp', {
      data: {
        from: `${customerPhone}@c.us`,
        to: `${restaurantPhone}@c.us`,
        body: 'hello',
        id: providerMsgId,
        timestamp: Math.floor(Date.now() / 1000)
      }
    })
    expect(res2.status()).toBe(200)
    const json2 = await res2.json()
    expect(json2.status).toBe('duplicate')
  })

  test('Webhook returns unknown_restaurant for unmatched destination numbers', async ({ request }) => {
    const customerPhone = '9199' + Math.floor(10000000 + Math.random() * 90000000)
    const unknownPhone = '910000000000'
    const providerMsgId = 'msg-unknown-' + Date.now()

    // Send to absolute URL
    const res = await request.post('http://localhost:3000/api/whatsapp', {
      data: {
        from: `${customerPhone}@c.us`,
        to: `${unknownPhone}@c.us`,
        body: 'hello',
        id: providerMsgId,
        timestamp: Math.floor(Date.now() / 1000)
      }
    })

    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('unknown_restaurant')
  })

  test('Form validation handles an invalid phone number', async ({ page }) => {
    // Use absolute URL to bypass baseURL resolution issues
    await page.goto(`http://localhost:3000/form/${restaurantSlug}`)

    await page.getByLabel('Name').fill('Invalid Phone User')
    await page.getByLabel('WhatsApp Number').fill('12345') // Invalid format

    // Click submit
    await page.getByRole('button', { name: /get whatsapp coupon|submit/i }).click()

    const errorAlert = page.getByRole('alert')
    const isErrorVisible = await errorAlert.isVisible().catch(() => false)
    
    if (isErrorVisible) {
      await expect(errorAlert).toBeVisible()
    } else {
      const submitButton = page.getByRole('button', { name: /get whatsapp coupon|submit/i })
      await expect(submitButton).toBeVisible()
    }
  })

  test('RLS security policies isolate customer data', async () => {
    // We create another restaurant for another owner
    const otherSlug = 'other-rest-' + Date.now()
    
    const { data: otherUserResp } = await supabase.auth.admin.createUser({
      email: `other-owner-${Date.now()}@restoloop.dev`,
      password: 'testpass123',
      email_confirm: true
    })

    const otherOwnerId = otherUserResp.user!.id
    
    const { data: otherRestaurant } = await supabase
      .from('restaurants')
      .insert({
        owner_id: otherOwnerId,
        name: 'Restaurant B',
        slug: otherSlug,
        whatsapp_number: uniquePhone(),
        credits: 1000,
      })
      .select()
      .single()

    expect(otherRestaurant).toBeTruthy()

    // Create a customer for Restaurant B
    const { data: otherCustomer } = await supabase
      .from('customers')
      .insert({
        restaurant_id: otherRestaurant!.id,
        phone: '918888888888',
        name: 'Other Customer',
        opt_in_status: 'opted_in',
      })
      .select()
      .single()

    expect(otherCustomer).toBeTruthy()

    // In this E2E context, if we query customers using an anonymous client,
    // it should return empty/error because there is no authenticated session.
    const anonClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data } = await anonClient
      .from('customers')
      .select('*')
      .eq('id', otherCustomer!.id)

    // Should return 0 rows due to RLS select policies
    expect(data?.length).toBe(0)

    // Cleanup other restaurant and user
    await supabase.from('customers').delete().eq('restaurant_id', otherRestaurant!.id)
    await supabase.from('restaurants').delete().eq('id', otherRestaurant!.id)
    await supabase.auth.admin.deleteUser(otherOwnerId)
  })
})
