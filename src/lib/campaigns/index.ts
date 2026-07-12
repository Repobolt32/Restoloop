import { createServiceClient } from '@/lib/supabase/server'
import { createWhatsAppAdapter } from '@/lib/whatsapp/adapter'
import { resolveSpintax } from '@/lib/whatsapp/spintax'

// ponytail: UTC date string for today-dedup check
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10) // "YYYY-MM-DD"
}

function generateCampaignCouponCode(): string {
  const allowed = '23456789ABCDEFGHJKLMNPQRSTUVWXYZZ'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += allowed.charAt(Math.floor(Math.random() * allowed.length))
  }
  return code
}

async function deductCredit(supabase: any, restaurantId: string) {
  const { error } = await supabase.rpc('deduct_credit', { restaurant_id: restaurantId })
  if (error) {
    // Fallback if RPC function is not defined in Postgres
    const { data: current } = await supabase
      .from('restaurants')
      .select('credits')
      .eq('id', restaurantId)
      .single()
    if (current && current.credits > 0) {
      await supabase
        .from('restaurants')
        .update({ credits: current.credits - 1 })
        .eq('id', restaurantId)
    }
  }
}

export async function runWelcomeReminders() {
  const supabase = createServiceClient()
  const adapter = createWhatsAppAdapter()

  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name, credits, welcome_reminder_days')
    .eq('welcome_reminder_enabled', true)
    .eq('is_suspended', false)

  for (const restaurant of restaurants ?? []) {
    const days = restaurant.welcome_reminder_days ?? 25
    const gteDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const lteDate = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString()

    const { data: customers } = await supabase
      .from('customers')
      .select('*, coupons(*)')
      .eq('restaurant_id', restaurant.id)
      .eq('opt_in_status', 'opted_in')
      .filter('created_at', 'gte', gteDate)
      .filter('created_at', 'lte', lteDate)
      .limit(5)  // ponytail: hourly batch cap, spreads load across the day

    for (const customer of customers ?? []) {
      const welcomeCoupon = customer.coupons?.find(
        (c: any) => c.type === 'welcome' && c.status === 'sent'
      )
      if (!welcomeCoupon) continue

      // Prior-interaction check
      const { data: inbound } = await supabase
        .from('message_logs')
        .select('id')
        .eq('customer_id', customer.id)
        .eq('direction', 'inbound')
        .limit(1)
        .maybeSingle()
      if (!inbound) {
        await supabase.from('message_logs').insert({
          restaurant_id: restaurant.id,
          customer_id: customer.id,
          direction: 'outbound',
          type: 'welcome_reminder',
          status: 'blocked_no_prior_interaction',
        })
        continue
      }

      // Today dedup check
      const todayStart = `${todayUTC()}T00:00:00.000Z`
      const { data: sentToday } = await supabase
        .from('message_logs')
        .select('id')
        .eq('customer_id', customer.id)
        .eq('type', 'welcome_reminder')
        .gte('created_at', todayStart)
        .limit(1)
        .maybeSingle()
      if (sentToday) continue

      if (restaurant.credits <= 0) {
        await supabase.from('message_logs').insert({
          restaurant_id: restaurant.id,
          customer_id: customer.id,
          direction: 'outbound',
          type: 'welcome_reminder',
          status: 'blocked_no_credits',
        })
        continue
      }

      const msg = resolveSpintax(
        `{Hey|Hi|Hello} ${customer.name || 'there'}! {Your coupon|Reminder: your coupon} ${welcomeCoupon.code} for ${restaurant.name} is {still active|waiting for you}! Reply STOP to opt out.`
      )
      const result = await adapter.sendText(customer.phone, msg)

      await supabase.from('message_logs').insert({
        restaurant_id: restaurant.id,
        customer_id: customer.id,
        direction: 'outbound',
        type: 'welcome_reminder',
        status: result.success ? 'sent' : 'failed',
        error: result.error ?? null,
        provider_message_id: result.messageId ?? null,
      })

      if (result.success) {
        await deductCredit(supabase, restaurant.id)
      }
    }
  }
}

export async function runBirthdayCampaigns() {
  const supabase = createServiceClient()
  const adapter = createWhatsAppAdapter()

  const kolkataDateStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
  const today = new Date(kolkataDateStr)
  const month = today.getMonth() + 1
  const day = today.getDate()
  const yearStart = new Date(today.getFullYear(), 0, 1)

  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name, credits, birthday_discount_percent')
    .eq('birthday_campaign_enabled', true)
    .eq('is_suspended', false)

  for (const restaurant of restaurants ?? []) {
    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('opt_in_status', 'opted_in')
      .eq('birthday_month', month)
      .eq('birthday_day', day)
      .limit(5)  // ponytail: hourly batch cap, spreads load across the day

    for (const customer of customers ?? []) {
      const { data: existing } = await supabase
        .from('coupons')
        .select('id')
        .eq('customer_id', customer.id)
        .eq('type', 'birthday')
        .gte('created_at', yearStart.toISOString())
        .maybeSingle()

      if (existing) continue

      // Prior-interaction check
      const { data: inbound } = await supabase
        .from('message_logs')
        .select('id')
        .eq('customer_id', customer.id)
        .eq('direction', 'inbound')
        .limit(1)
        .maybeSingle()
      if (!inbound) {
        await supabase.from('message_logs').insert({
          restaurant_id: restaurant.id,
          customer_id: customer.id,
          direction: 'outbound',
          type: 'birthday_campaign',
          status: 'blocked_no_prior_interaction',
        })
        continue
      }

      // Today dedup check
      const todayStart = `${todayUTC()}T00:00:00.000Z`
      const { data: sentToday } = await supabase
        .from('message_logs')
        .select('id')
        .eq('customer_id', customer.id)
        .eq('type', 'birthday_campaign')
        .gte('created_at', todayStart)
        .limit(1)
        .maybeSingle()
      if (sentToday) continue

      if (restaurant.credits <= 0) {
        await supabase.from('message_logs').insert({
          restaurant_id: restaurant.id,
          customer_id: customer.id,
          direction: 'outbound',
          type: 'birthday_campaign',
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
        discount_percent: restaurant.birthday_discount_percent,
        discount_cents: 0,
        status: 'sent',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })

      if (couponError) continue

      const msg = resolveSpintax(
        `{Happy Birthday|Happy Birthday 🎂|Wishing you a great birthday}, ${customer.name || 'there'}! {Enjoy|Celebrate with} ${restaurant.birthday_discount_percent}% OFF at ${restaurant.name}. Code: ${couponCode}. Reply STOP to opt out.`
      )
      const result = await adapter.sendText(customer.phone, msg)

      await supabase.from('message_logs').insert({
        restaurant_id: restaurant.id,
        customer_id: customer.id,
        direction: 'outbound',
        type: 'birthday_campaign',
        status: result.success ? 'sent' : 'failed',
        error: result.error ?? null,
        provider_message_id: result.messageId ?? null,
      })

      if (result.success) {
        await deductCredit(supabase, restaurant.id)
      }
    }
  }
}

export async function runWinbackCampaigns() {
  const supabase = createServiceClient()
  const adapter = createWhatsAppAdapter()

  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name, credits, winback_discount_percent, winback_days')
    .eq('winback_campaign_enabled', true)
    .eq('is_suspended', false)

  for (const restaurant of restaurants ?? []) {
    const days = restaurant.winback_days ?? 40
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('opt_in_status', 'opted_in')
      .lte('last_visit_at', cutoff.toISOString())
      .limit(5)  // ponytail: hourly batch cap, spreads load across the day

    for (const customer of customers ?? []) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const { data: recent } = await supabase
        .from('coupons')
        .select('id')
        .eq('customer_id', customer.id)
        .eq('type', 'winback')
        .gte('created_at', sevenDaysAgo.toISOString())
        .maybeSingle()

      if (recent) continue

      // Prior-interaction check
      const { data: inbound } = await supabase
        .from('message_logs')
        .select('id')
        .eq('customer_id', customer.id)
        .eq('direction', 'inbound')
        .limit(1)
        .maybeSingle()
      if (!inbound) {
        await supabase.from('message_logs').insert({
          restaurant_id: restaurant.id,
          customer_id: customer.id,
          direction: 'outbound',
          type: 'winback_campaign',
          status: 'blocked_no_prior_interaction',
        })
        continue
      }

      // Today dedup check
      const todayStart = `${todayUTC()}T00:00:00.000Z`
      const { data: sentToday } = await supabase
        .from('message_logs')
        .select('id')
        .eq('customer_id', customer.id)
        .eq('type', 'winback_campaign')
        .gte('created_at', todayStart)
        .limit(1)
        .maybeSingle()
      if (sentToday) continue

      if (restaurant.credits <= 0) {
        await supabase.from('message_logs').insert({
          restaurant_id: restaurant.id,
          customer_id: customer.id,
          direction: 'outbound',
          type: 'winback_campaign',
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
        discount_percent: restaurant.winback_discount_percent,
        discount_cents: 0,
        status: 'sent',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })

      if (couponError) continue

      const msg = resolveSpintax(
        `{We miss you|It's been a while}, ${customer.name || 'there'}! {Come back for|Enjoy} ${restaurant.winback_discount_percent}% OFF at ${restaurant.name}. Code: ${couponCode}. Reply STOP to opt out.`
      )
      const result = await adapter.sendText(customer.phone, msg)

      await supabase.from('message_logs').insert({
        restaurant_id: restaurant.id,
        customer_id: customer.id,
        direction: 'outbound',
        type: 'winback_campaign',
        status: result.success ? 'sent' : 'failed',
        error: result.error ?? null,
        provider_message_id: result.messageId ?? null,
      })

      if (result.success) {
        await deductCredit(supabase, restaurant.id)
      }
    }
  }
}

export async function runExpiryReminders() {
  const supabase = createServiceClient()
  const adapter = createWhatsAppAdapter()

  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name, credits, expiry_reminder_days')
    .eq('expiry_reminder_enabled', true)
    .eq('is_suspended', false)

  for (const restaurant of restaurants ?? []) {
    const days = restaurant.expiry_reminder_days ?? 1
    const expiryStart = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    const expiryEnd = new Date(expiryStart.getTime() + 24 * 60 * 60 * 1000)

    const { data: coupons } = await supabase
      .from('coupons')
      .select('*, customers(*)')
      .eq('restaurant_id', restaurant.id)
      .eq('status', 'sent')
      .eq('enabled', true)
      .gte('expires_at', expiryStart.toISOString())
      .lt('expires_at', expiryEnd.toISOString())
      .limit(5)  // ponytail: hourly batch cap, spreads load across the day

    for (const coupon of coupons ?? []) {
      const customer = coupon.customers as unknown as {
        id: string; phone: string; name: string | null; opt_in_status: string
      }
      if (!customer || customer.opt_in_status !== 'opted_in') continue

      // Prior-interaction check
      const { data: inbound } = await supabase
        .from('message_logs')
        .select('id')
        .eq('customer_id', customer.id)
        .eq('direction', 'inbound')
        .limit(1)
        .maybeSingle()
      if (!inbound) {
        await supabase.from('message_logs').insert({
          restaurant_id: restaurant.id,
          customer_id: customer.id,
          direction: 'outbound',
          type: 'expiry_reminder',
          status: 'blocked_no_prior_interaction',
          coupon_id: coupon.id,
        })
        continue
      }

      // Today dedup check
      const todayStart = `${todayUTC()}T00:00:00.000Z`
      const { data: sentToday } = await supabase
        .from('message_logs')
        .select('id')
        .eq('customer_id', customer.id)
        .eq('type', 'expiry_reminder')
        .gte('created_at', todayStart)
        .limit(1)
        .maybeSingle()
      if (sentToday) continue

      if (restaurant.credits <= 0) {
        await supabase.from('message_logs').insert({
          restaurant_id: restaurant.id,
          customer_id: customer.id,
          direction: 'outbound',
          type: 'expiry_reminder',
          status: 'blocked_no_credits',
          coupon_id: coupon.id,
        })
        continue
      }

      const msg = resolveSpintax(
        `{Hey|Hi} ${customer.name || 'there'}! {Don't miss out|Heads up} — your coupon ${coupon.code} at ${restaurant.name} {expires in|is expiring in} ${days} day(s). Reply STOP to opt out.`
      )
      const result = await adapter.sendText(customer.phone, msg)

      await supabase.from('message_logs').insert({
        restaurant_id: restaurant.id,
        customer_id: customer.id,
        direction: 'outbound',
        type: 'expiry_reminder',
        status: result.success ? 'sent' : 'failed',
        error: result.error ?? null,
        coupon_id: coupon.id,
        provider_message_id: result.messageId ?? null,
      })

      if (result.success) {
        await deductCredit(supabase, restaurant.id)
      }
    }
  }
}

export async function runAllCampaignsForRestaurant(restaurantId: string) {
  const supabase = createServiceClient()
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('id', restaurantId)
    .eq('is_suspended', false)
    .single()

  if (!restaurant) {
    throw new Error('Restaurant not found or is suspended')
  }

  await runWelcomeReminders()
  await runBirthdayCampaigns()
  await runWinbackCampaigns()
  await runExpiryReminders()
}
