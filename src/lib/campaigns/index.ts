import { createServiceClient } from '@/lib/supabase/server'
import { createWhatsAppAdapter } from '@/lib/whatsapp/adapter'

function generateCampaignCouponCode(): string {
  const allowed = '23456789ABCDEFGHJKLMNPQRSTUVWXYZZ'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += allowed.charAt(Math.floor(Math.random() * allowed.length))
  }
  return code
}

export async function runWelcomeReminders() {
  const supabase = createServiceClient()
  const adapter = createWhatsAppAdapter()

  // Define date bounds for exactly 25 days ago (24 to 25 days ago)
  const gteDate = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  const lteDate = new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString()

  // Find opted-in customers who signed up 25 days ago
  const { data: customers, error } = await supabase
    .from('customers')
    .select('*, coupons(*)')
    .eq('opt_in_status', 'opted_in')
    .filter('created_at', 'gte', gteDate)
    .filter('created_at', 'lte', lteDate)

  if (error) {
    console.error('Failed to fetch customers for campaigns:', error)
    throw error
  }

  for (const customer of customers || []) {
    // Find unredeemed welcome coupon
    const welcomeCoupon = customer.coupons?.find(
      (c: any) => c.type === 'welcome' && c.status === 'sent'
    )

    if (!welcomeCoupon) continue

    // Get restaurant info
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', customer.restaurant_id)
      .single()

    if (!restaurant) continue

    // Check credits before sending
    if (restaurant.credits <= 0) {
      await supabase.from('message_logs').insert({
        restaurant_id: restaurant.id,
        customer_id: customer.id,
        direction: 'outbound',
        type: 'campaign',
        status: 'blocked_no_credits',
      })
      continue
    }

    // Compose message with opt-out warning
    const reminderMessage = `Hey ${customer.name || 'there'}! Your coupon ${welcomeCoupon.code} for ${restaurant.name} is still active! Reply STOP to opt out.`

    // Send WhatsApp text message
    const result = await adapter.sendText(customer.phone, reminderMessage)

    // Log outbound message status
    await supabase.from('message_logs').insert({
      restaurant_id: restaurant.id,
      customer_id: customer.id,
      direction: 'outbound',
      type: 'campaign',
      status: result.success ? 'sent' : 'failed',
      error: result.error || null,
    })

    if (result.success) {
      const { error: rpcError } = await supabase.rpc('deduct_credit', { restaurant_id: restaurant.id })
      if (rpcError && rpcError.code === 'PGRST202') {
        // Fallback to direct update if RPC is not defined in the DB schema
        await supabase
          .from('restaurants')
          .update({ credits: restaurant.credits - 1 })
          .eq('id', restaurant.id)
      }
    }
  }
}

export async function runBirthdayCampaigns() {
  const supabase = createServiceClient()
  const adapter = createWhatsAppAdapter()

  // Kolkata time-aware today
  const kolkataDateStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
  const today = new Date(kolkataDateStr)
  const month = today.getMonth() + 1
  const day = today.getDate()

  const { data: customers, error } = await supabase
    .from('customers')
    .select('*')
    .eq('opt_in_status', 'opted_in')
    .eq('birthday_month', month)
    .eq('birthday_day', day)

  if (error) {
    console.error('Failed to fetch birthday customers:', error)
    throw error
  }

  const yearStart = new Date(today.getFullYear(), 0, 1)

  for (const customer of customers || []) {
    // Check if birthday coupon already sent this year
    const { data: existing, error: existingError } = await supabase
      .from('coupons')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('type', 'birthday')
      .gte('created_at', yearStart.toISOString())
      .maybeSingle()

    if (existingError) {
      console.error('Failed to check existing birthday coupon:', existingError)
      continue
    }

    if (existing) continue

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', customer.restaurant_id)
      .single()

    if (!restaurant) continue

    // Check credits before sending
    if (restaurant.credits <= 0) {
      await supabase.from('message_logs').insert({
        restaurant_id: restaurant.id,
        customer_id: customer.id,
        direction: 'outbound',
        type: 'campaign',
        status: 'blocked_no_credits',
      })
      continue
    }

    const couponCode = generateCampaignCouponCode()

    const { error: couponError } = await supabase.from('coupons').insert({
      restaurant_id: restaurant.id,
      customer_id: customer.id,
      type: 'birthday',
      code: couponCode,
      discount_cents: restaurant.birthday_discount_cents,
      status: 'sent',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })

    if (couponError) {
      console.error('Failed to insert birthday coupon:', couponError)
      continue
    }

    const birthdayMessage = `Happy Birthday ${customer.name || 'there'}! Enjoy ₹${restaurant.birthday_discount_cents / 100} OFF at ${restaurant.name}. Code: ${couponCode}. Reply STOP to opt out.`

    const result = await adapter.sendText(customer.phone, birthdayMessage)

    await supabase.from('message_logs').insert({
      restaurant_id: restaurant.id,
      customer_id: customer.id,
      direction: 'outbound',
      type: 'campaign',
      status: result.success ? 'sent' : 'failed',
      error: result.error || null,
    })

    if (result.success) {
      const { error: rpcError } = await supabase.rpc('deduct_credit', { restaurant_id: restaurant.id })
      if (rpcError && rpcError.code === 'PGRST202') {
        await supabase
          .from('restaurants')
          .update({ credits: restaurant.credits - 1 })
          .eq('id', restaurant.id)
      }
    }
  }
}

export async function runWinbackCampaigns() {
  const supabase = createServiceClient()
  const adapter = createWhatsAppAdapter()

  const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)

  const { data: customers, error } = await supabase
    .from('customers')
    .select('*')
    .eq('opt_in_status', 'opted_in')
    .lte('last_visit_at', fortyDaysAgo.toISOString())

  if (error) {
    console.error('Failed to fetch winback customers:', error)
    throw error
  }

  for (const customer of customers || []) {
    // Check if winback coupon sent in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const { data: recent, error: recentError } = await supabase
      .from('coupons')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('type', 'winback')
      .gte('created_at', sevenDaysAgo.toISOString())
      .maybeSingle()

    if (recentError) {
      console.error('Failed to check recent winback coupon:', recentError)
      continue
    }

    if (recent) continue

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', customer.restaurant_id)
      .single()

    if (!restaurant) continue

    // Check credits before sending
    if (restaurant.credits <= 0) {
      await supabase.from('message_logs').insert({
        restaurant_id: restaurant.id,
        customer_id: customer.id,
        direction: 'outbound',
        type: 'campaign',
        status: 'blocked_no_credits',
      })
      continue
    }

    const couponCode = generateCampaignCouponCode()

    const { error: couponError } = await supabase.from('coupons').insert({
      restaurant_id: restaurant.id,
      customer_id: customer.id,
      type: 'winback',
      code: couponCode,
      discount_cents: restaurant.winback_discount_cents,
      status: 'sent',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })

    if (couponError) {
      console.error('Failed to insert winback coupon:', couponError)
      continue
    }

    const winbackMessage = `We miss you ${customer.name || 'there'}! Come back for ₹${restaurant.winback_discount_cents / 100} OFF. Code: ${couponCode}. Reply STOP to opt out.`

    const result = await adapter.sendText(customer.phone, winbackMessage)

    await supabase.from('message_logs').insert({
      restaurant_id: restaurant.id,
      customer_id: customer.id,
      direction: 'outbound',
      type: 'campaign',
      status: result.success ? 'sent' : 'failed',
      error: result.error || null,
    })

    if (result.success) {
      const { error: rpcError } = await supabase.rpc('deduct_credit', { restaurant_id: restaurant.id })
      if (rpcError && rpcError.code === 'PGRST202') {
        await supabase
          .from('restaurants')
          .update({ credits: restaurant.credits - 1 })
          .eq('id', restaurant.id)
      }
    }
  }
}

