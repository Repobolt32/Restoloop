import { createClient } from '@supabase/supabase-js'

export const TEST_USER_EMAIL = 'e2e-test@restoloop.com'
export const TEST_USER_PASSWORD = 'E2E-Test-Pass-123!'
export const TEST_ADMIN_EMAIL = 'admin@restoloop.com'
export const TEST_ADMIN_PASSWORD = 'E2E-Admin-Pass-123!'

export function createTestSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function createTestRestaurant(name: string) {
  const supabase = createTestSupabase()
  const { data: { users } } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const testUser = users.find(u => u.email === TEST_USER_EMAIL)
  if (!testUser) throw new Error('Test user not found. Run auth.setup.ts first.')

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const { data, error } = await supabase.from('restaurants').insert({
    owner_id: testUser.id,
    name,
    slug,
    whatsapp_number: '919999900000',
    welcome_discount_cents: 1000,
    birthday_discount_cents: 500,
    winback_discount_cents: 300,
    credits: 1000,
    plan: 'free',
  }).select().single()
  if (error) throw new Error(`Failed to create test restaurant: ${error.message}`)
  return data as { id: string; slug: string; owner_id: string }
}

export async function createTestCustomer(restaurantId: string, phone: string) {
  const supabase = createTestSupabase()
  const { data, error } = await supabase.from('customers').insert({
    restaurant_id: restaurantId,
    phone,
    name: 'E2E Test Customer',
    opt_in_status: 'opted_in',
  }).select().single()
  if (error) throw new Error(`Failed to create test customer: ${error.message}`)
  return data as { id: string; phone: string }
}

export async function createTestCoupon(
  restaurantId: string,
  customerId: string,
  code: string,
  opts?: { status?: string; enabled?: boolean; discountCents?: number }
) {
  const supabase = createTestSupabase()
  const { data, error } = await supabase.from('coupons').insert({
    restaurant_id: restaurantId,
    customer_id: customerId,
    type: 'manual',
    code,
    discount_cents: opts?.discountCents ?? 500,
    status: opts?.status ?? 'sent',
    enabled: opts?.enabled ?? true,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }).select().single()
  if (error) throw new Error(`Failed to create test coupon: ${error.message}`)
  return data as { id: string; code: string }
}

export async function cleanupRestaurant(restaurantId: string) {
  const supabase = createTestSupabase()
  await supabase.from('coupons').delete().eq('restaurant_id', restaurantId)
  await supabase.from('message_logs').delete().eq('restaurant_id', restaurantId)
  await supabase.from('customers').delete().eq('restaurant_id', restaurantId)
  await supabase.from('restaurants').delete().eq('id', restaurantId)
}

export async function getCouponByCode(code: string) {
  const supabase = createTestSupabase()
  const { data } = await supabase.from('coupons').select('*').eq('code', code).maybeSingle()
  return data
}
