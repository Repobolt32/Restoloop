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

test.describe('Slice 10: Onboarding Fix', () => {
  let restaurantId: string
  let restaurantSlug: string
  let restaurantPhone: string
  let ownerId: string

  test.beforeAll(async () => {
    restaurantSlug = 'test-rest-s10-' + Date.now()
    restaurantPhone = uniquePhone()

    const { data: userResp, error: userError } = await supabase.auth.admin.createUser({
      email: `test-owner-s10-${Date.now()}@restoloop.dev`,
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
        name: 'Slice 10 Test Diner',
        slug: restaurantSlug,
        whatsapp_number: restaurantPhone,
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
      await supabase.from('coupons').delete().eq('restaurant_id', restaurantId)
      await supabase.from('message_logs').delete().eq('restaurant_id', restaurantId)
      await supabase.from('customers').delete().eq('restaurant_id', restaurantId)
      await supabase.from('restaurants').delete().eq('id', restaurantId)
    }
    if (ownerId) {
      await supabase.auth.admin.deleteUser(ownerId)
    }
  })

  test('Form creates opted_in customer + prefilled link & webhook sends welcome coupon immediately', async ({ page, request }) => {
    const customerPhone = '+9199' + Math.floor(10000000 + Math.random() * 90000000)
    const rawPhone = customerPhone.replace('+', '')

    // 1. Submit Intake Form
    await page.goto(`http://localhost:3000/form/${restaurantSlug}`)

    await page.getByLabel('Name').fill('Jane Doe S10')
    await page.getByLabel('WhatsApp Number').fill(customerPhone)
    await page.getByLabel('Birth Month').selectOption('11')
    await page.getByLabel('Birth Day').selectOption('15')
    await page.getByLabel('Food Preference').selectOption('Veg')

    await page.getByRole('button', { name: /get whatsapp coupon/i }).click()

    // Expect success screen
    await expect(page.getByText("You're Registered!")).toBeVisible()

    const whatsappLink = page.getByRole('link', { name: /open whatsapp/i })
    await expect(whatsappLink).toBeVisible()
    const href = await whatsappLink.getAttribute('href')
    
    // Expect correct prefilled message
    expect(href).toContain(`wa.me/${restaurantPhone}`)
    expect(href).toContain('text=Hi!%20I%20just%20signed%20up%20for%20your%20loyalty%20club.')

    // Verify in database that customer opt_in_status is opted_in
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('phone', rawPhone)
      .single()

    expect(customer).toBeTruthy()
    expect(customer!.name).toBe('Jane Doe S10')
    expect(customer!.opt_in_status).toBe('opted_in')

    // Find the welcome coupon created
    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('customer_id', customer!.id)
      .eq('type', 'welcome')
      .single()

    expect(coupon).toBeTruthy()
    expect(coupon!.discount_cents).toBe(4000)

    // 2. Simulate Webhook post from customer to trigger the instant welcome coupon
    const providerMsgId = 'msg-s10-' + Date.now()
    const res = await request.post('http://localhost:3000/api/whatsapp', {
      data: {
        from: `${rawPhone}@c.us`,
        to: `${restaurantPhone}@c.us`,
        body: 'Hi! I just signed up for your loyalty club.',
        id: providerMsgId,
        timestamp: Math.floor(Date.now() / 1000)
      }
    })

    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('ok')

    // Verify message_logs for opt_in_confirm sent
    const { data: logs } = await supabase
      .from('message_logs')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('customer_id', customer!.id)
      .eq('direction', 'outbound')
      .eq('type', 'opt_in_confirm')

    expect(logs).not.toBeNull()
    expect(logs!.length).toBe(1)
    expect(['sent', 'failed']).toContain(logs![0].status)
  })
})
