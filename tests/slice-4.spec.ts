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

test.describe('Slice 4: First Campaign Fires (Welcome Reminder)', () => {
  let restaurantId: string
  let restaurantSlug: string
  let ownerId: string
  const cronSecret = process.env.CRON_SECRET || 'test-cron-secret-123'

  test.beforeAll(async () => {
    // Create owner
    const { data: userResp } = await supabase.auth.admin.createUser({
      email: `test-owner-slice4-${Date.now()}@restoloop.dev`,
      password: 'testpass123',
      email_confirm: true
    })
    ownerId = userResp.user!.id

    // Create restaurant
    restaurantSlug = 'test-rest-slice4-' + Date.now()
    const { data: restaurant } = await supabase
      .from('restaurants')
      .insert({
        owner_id: ownerId,
        name: 'Slice 4 Campaign Diner',
        slug: restaurantSlug,
        whatsapp_number: uniquePhone(),
        credits: 10,
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

    const resWrongAuth = await request.get('http://localhost:3000/api/cron/welcome-reminder', {
      headers: {
        'Authorization': 'Bearer wrong-secret'
      }
    })
    expect(resWrongAuth.status()).toBe(401)
  })

  test('Welcome reminder triggers, deducts credits, and logs status', async ({ request }) => {
    const phone = uniquePhone()

    // 1. Seed customer with created_at set to exactly 25 days ago
    const twentyFiveDaysAgo = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000 - 60 * 1000) // 25 days and 1 minute ago
    const { data: customer } = await supabase
      .from('customers')
      .insert({
        restaurant_id: restaurantId,
        name: 'Slice 4 Guest',
        phone: phone,
        opt_in_status: 'opted_in',
        created_at: twentyFiveDaysAgo.toISOString()
      })
      .select()
      .single()

    // Explicitly update created_at via service role to bypass default client override if any
    await supabase
      .from('customers')
      .update({ created_at: twentyFiveDaysAgo.toISOString() })
      .eq('id', customer!.id)

    // 2. Seed welcome coupon
    await supabase.from('coupons').insert({
      restaurant_id: restaurantId,
      customer_id: customer!.id,
      type: 'welcome',
      code: 'W50-CAMPAIGN',
      discount_cents: 5000,
      status: 'sent',
      expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    })

    // 3. Trigger cron job
    const cronRes = await request.get('http://localhost:3000/api/cron/welcome-reminder', {
      headers: {
        'Authorization': `Bearer ${cronSecret}`
      }
    })
    expect(cronRes.status()).toBe(200)
    const body = await cronRes.json()
    expect(body.status).toBe('ok')

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
    expect(logs![0].direction).toBe('outbound')

    // 5. Verify credit deducted
    const { data: updatedRestaurant } = await supabase
      .from('restaurants')
      .select('credits')
      .eq('id', restaurantId)
      .single()

    expect(updatedRestaurant).not.toBeNull()
    expect(updatedRestaurant!.credits).toBe(9) // From 10 to 9
  })
})
