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

test.describe('Slice 5: Birthday + Winback Campaigns', () => {
  let restaurantId: string
  let restaurantSlug: string
  let ownerId: string
  const cronSecret = process.env.CRON_SECRET || 'test-cron-secret-123'

  test.beforeAll(async () => {
    // Create owner
    const { data: userResp } = await supabase.auth.admin.createUser({
      email: `test-owner-slice5-${Date.now()}@restoloop.dev`,
      password: 'testpass123',
      email_confirm: true
    })
    ownerId = userResp.user!.id

    // Create restaurant
    restaurantSlug = 'test-rest-slice5-' + Date.now()
    const { data: restaurant } = await supabase
      .from('restaurants')
      .insert({
        owner_id: ownerId,
        name: 'Slice 5 Campaign Diner',
        slug: restaurantSlug,
        whatsapp_number: uniquePhone(),
        credits: 10,
        birthday_discount_cents: 3500,
        winback_discount_cents: 2500,
      })
      .select()
      .single()

    restaurantId = restaurant!.id
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

  test('Cron endpoint blocks unauthorized requests', async ({ request }) => {
    const resNoAuth = await request.get('http://localhost:3000/api/cron/welcome-reminder')
    expect(resNoAuth.status()).toBe(401)
  })

  test('Birthday campaign triggers, creates coupon, logs, and deducts credit', async ({ request }) => {
    const phone = uniquePhone()

    // 1. Seed customer with birthday today
    const kolkataDateStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    const today = new Date(kolkataDateStr)
    const month = today.getMonth() + 1
    const day = today.getDate()

    const { data: customer } = await supabase
      .from('customers')
      .insert({
        restaurant_id: restaurantId,
        name: 'Birthday Guest',
        phone: phone,
        opt_in_status: 'opted_in',
        birthday_month: month,
        birthday_day: day,
      })
      .select()
      .single()

    // 2. Trigger cron job
    const cronRes = await request.get('http://localhost:3000/api/cron/welcome-reminder', {
      headers: {
        'Authorization': `Bearer ${cronSecret}`
      }
    })
    expect(cronRes.status()).toBe(200)

    // 3. Verify birthday coupon was created
    const { data: coupons } = await supabase
      .from('coupons')
      .select('*')
      .eq('customer_id', customer!.id)
      .eq('type', 'birthday')

    expect(coupons).not.toBeNull()
    expect(coupons!.length).toBe(1)
    expect(coupons![0].discount_cents).toBe(3500)
    expect(coupons![0].status).toBe('sent')

    // 4. Verify message log inserted
    const { data: logs } = await supabase
      .from('message_logs')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('customer_id', customer!.id)
      .eq('type', 'campaign')

    expect(logs).not.toBeNull()
    expect(logs!.length).toBe(1)
    expect(logs![0].status).toBe('sent')

    // 5. Verify credit was deducted (from 10 to 9)
    const { data: updatedRestaurant } = await supabase
      .from('restaurants')
      .select('credits')
      .eq('id', restaurantId)
      .single()

    expect(updatedRestaurant!.credits).toBe(9)

    // 6. Verify duplicate cron run does not create a new birthday coupon
    const cronRes2 = await request.get('http://localhost:3000/api/cron/welcome-reminder', {
      headers: {
        'Authorization': `Bearer ${cronSecret}`
      }
    })
    expect(cronRes2.status()).toBe(200)

    const { data: couponsAfter } = await supabase
      .from('coupons')
      .select('*')
      .eq('customer_id', customer!.id)
      .eq('type', 'birthday')

    expect(couponsAfter!.length).toBe(1)
  })

  test('Winback campaign triggers, creates coupon, logs, and deducts credit', async ({ request }) => {
    const phone = uniquePhone()

    // 1. Seed customer with last_visit_at 41 days ago
    const lastVisit = new Date(Date.now() - 41 * 24 * 60 * 60 * 1000)
    const { data: customer } = await supabase
      .from('customers')
      .insert({
        restaurant_id: restaurantId,
        name: 'Winback Guest',
        phone: phone,
        opt_in_status: 'opted_in',
        last_visit_at: lastVisit.toISOString(),
      })
      .select()
      .single()

    // 2. Trigger cron job
    const cronRes = await request.get('http://localhost:3000/api/cron/welcome-reminder', {
      headers: {
        'Authorization': `Bearer ${cronSecret}`
      }
    })
    expect(cronRes.status()).toBe(200)

    // 3. Verify winback coupon was created
    const { data: coupons } = await supabase
      .from('coupons')
      .select('*')
      .eq('customer_id', customer!.id)
      .eq('type', 'winback')

    expect(coupons).not.toBeNull()
    expect(coupons!.length).toBe(1)
    expect(coupons![0].discount_cents).toBe(2500)

    // 4. Verify message log inserted
    const { data: logs } = await supabase
      .from('message_logs')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('customer_id', customer!.id)
      .eq('type', 'campaign')

    expect(logs).not.toBeNull()
    expect(logs!.length).toBe(1)
    expect(logs![0].status).toBe('sent')

    // 5. Verify credit was deducted (from 9 to 8)
    const { data: updatedRestaurant } = await supabase
      .from('restaurants')
      .select('credits')
      .eq('id', restaurantId)
      .single()

    expect(updatedRestaurant!.credits).toBe(8)

    // 6. Verify duplicate cron run does not create a new winback coupon within 7 days
    const cronRes2 = await request.get('http://localhost:3000/api/cron/welcome-reminder', {
      headers: {
        'Authorization': `Bearer ${cronSecret}`
      }
    })
    expect(cronRes2.status()).toBe(200)

    const { data: couponsAfter } = await supabase
      .from('coupons')
      .select('*')
      .eq('customer_id', customer!.id)
      .eq('type', 'winback')

    expect(couponsAfter!.length).toBe(1)
  })

  test('Campaign is blocked with blocked_no_credits status when restaurant runs out of credits', async ({ request }) => {
    // 1. Manually set credits to 0
    await supabase
      .from('restaurants')
      .update({ credits: 0 })
      .eq('id', restaurantId)

    const phone = uniquePhone()

    // 2. Seed customer with birthday today
    const kolkataDateStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    const today = new Date(kolkataDateStr)
    const month = today.getMonth() + 1
    const day = today.getDate()

    const { data: customer } = await supabase
      .from('customers')
      .insert({
        restaurant_id: restaurantId,
        name: 'Poor Guest',
        phone: phone,
        opt_in_status: 'opted_in',
        birthday_month: month,
        birthday_day: day,
      })
      .select()
      .single()

    // 3. Trigger cron job
    const cronRes = await request.get('http://localhost:3000/api/cron/welcome-reminder', {
      headers: {
        'Authorization': `Bearer ${cronSecret}`
      }
    })
    expect(cronRes.status()).toBe(200)

    // 4. Verify birthday coupon was NOT created
    const { data: coupons } = await supabase
      .from('coupons')
      .select('*')
      .eq('customer_id', customer!.id)
      .eq('type', 'birthday')

    expect(coupons).not.toBeNull()
    expect(coupons!.length).toBe(0)

    // 5. Verify message log has status 'blocked_no_credits'
    const { data: logs } = await supabase
      .from('message_logs')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('customer_id', customer!.id)
      .eq('type', 'campaign')

    expect(logs).not.toBeNull()
    expect(logs!.length).toBe(1)
    expect(logs![0].status).toBe('blocked_no_credits')
  })
})
