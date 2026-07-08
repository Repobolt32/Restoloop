import { createServiceClient } from '@/lib/supabase/server'
import { createWhatsAppAdapter } from '@/lib/whatsapp/adapter'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-signature') || ''

  const adapter = createWhatsAppAdapter()
  const event = adapter.validateWebhook(rawBody, signature)

  if (!event) {
    return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Dedupe: check if message already processed
  const { data: existing } = await supabase
    .from('message_logs')
    .select('id')
    .eq('provider_message_id', event.messageId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ status: 'duplicate' })
  }

  let fromPhone = event.from.replace('@c.us', '').replace(/\D/g, '')
  const replyTo = event.from.includes('@lid') ? event.from : fromPhone

  let lidResolved = false
  if (event.from.endsWith('@lid') || event.from.includes('@lid')) {
    if (event.senderPhone) {
      fromPhone = event.senderPhone.replace(/\D/g, '')
      lidResolved = true
    } else {
      const resolved = adapter.resolveLidPhone
        ? await adapter.resolveLidPhone(event.from)
        : null
      if (resolved) {
        fromPhone = resolved
        lidResolved = true
      }
    }
  }

  const toPhone = (event.to || '').replace('@c.us', '').replace(/\D/g, '')

  let restaurant = null

  // 1. Try lookup by recipient number (to)
  if (toPhone) {
    const { data } = await supabase
      .from('restaurants')
      .select('*')
      .eq('whatsapp_number', toPhone)
      .maybeSingle()
    restaurant = data
  }

  // 2. Try lookup by sender number (from) - fallback/compatibility with implementation plan's code
  if (!restaurant) {
    const { data } = await supabase
      .from('restaurants')
      .select('*')
      .eq('whatsapp_number', fromPhone)
      .maybeSingle()
    restaurant = data
  }

  // Lookup customer
  let { data: customer } = restaurant
    ? await supabase
        .from('customers')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('phone', fromPhone)
        .maybeSingle()
    : { data: null }

  // 3. Try lookup by existing customer's restaurant if not found yet
  if (!restaurant && fromPhone) {
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('restaurant_id')
      .eq('phone', fromPhone)
      .limit(1)
      .maybeSingle()

    if (existingCustomer) {
      const { data: restData } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', existingCustomer.restaurant_id)
        .maybeSingle()
      
      if (restData) {
        restaurant = restData
        // Re-query customer with restaurant context
        const { data: custData } = await supabase
          .from('customers')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .eq('phone', fromPhone)
          .maybeSingle()
        customer = custData
      }
    }
  }

  // 4. Coupon-code join fallback (LID unresolved or phone lookup missed)
  //    Form embeds the welcome coupon code in the prefilled wa.me message body.
  //    Scan for it and join through the coupon to find the customer.
  const isLid = event.from.endsWith('@lid') || event.from.includes('@lid')
  if (isLid && !customer && event.body) {
    const codeMatch = event.body.match(/W\d+-[A-Z0-9]{6}/i)
    if (codeMatch) {
      const code = codeMatch[0].toUpperCase()
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*, customers(*)')
        .eq('code', code)
        .eq('type', 'welcome')
        .maybeSingle()

      if (coupon) {
        const couponCustomer = (coupon as any).customers
        if (couponCustomer) {
          customer = couponCustomer
          if (!restaurant) {
            const { data: restData } = await supabase
              .from('restaurants')
              .select('*')
              .eq('id', couponCustomer.restaurant_id)
              .maybeSingle()
            if (restData) restaurant = restData
          }
        }
      }
    }
  }

  // Log inbound message
  await supabase.from('message_logs').insert({
    restaurant_id: restaurant?.id || null,
    customer_id: customer?.id || null,
    direction: 'inbound',
    type: 'incoming_message',
    status: 'sent',
    provider_message_id: event.messageId,
  })

  if (!restaurant) {
    return NextResponse.json({ status: 'unknown_restaurant' })
  }

  if (!customer) {
    // New customer: send opt-in prompt
    const optInMessage = `Reply YES to receive exclusive coupons from ${restaurant.name}. Reply STOP to opt out.`
    const result = await adapter.sendText(replyTo, optInMessage)

    // Create pending customer
    const { data: newCustomer } = await supabase
      .from('customers')
      .insert({
        restaurant_id: restaurant.id,
        phone: fromPhone,
        opt_in_status: 'pending',
      })
      .select()
      .single()

    // Log outbound message
    await supabase.from('message_logs').insert({
      restaurant_id: restaurant.id,
      customer_id: newCustomer?.id,
      direction: 'outbound',
      type: 'opt_in_prompt',
      status: result.success ? 'sent' : 'failed',
      error: result.error || null,
      provider_message_id: result.messageId || null,
    })
  } else {
    // Existing customer: handle opt-in/out
    const body = event.body.trim().toUpperCase()

    // Form-originated customers (opted_in) — send coupon if not yet confirmed
    if (customer.opt_in_status === 'opted_in') {
      const { data: confirmLog } = await supabase
        .from('message_logs')
        .select('id')
        .eq('customer_id', customer.id)
        .eq('direction', 'outbound')
        .eq('type', 'opt_in_confirm')
        .limit(1)
        .maybeSingle()

      if (!confirmLog) {
        // Find the welcome coupon
        const { data: welcomeCoupon } = await supabase
          .from('coupons')
          .select('*')
          .eq('customer_id', customer.id)
          .eq('type', 'welcome')
          .maybeSingle()

        if (welcomeCoupon) {
          const discountPercent = welcomeCoupon.discount_percent || restaurant.welcome_discount_percent
          const welcomeMessage = `Hey ${customer.name || 'there'}! Welcome to ${restaurant.name}. Your coupon: ${welcomeCoupon.code} for ${discountPercent}% OFF. Valid till ${new Date(welcomeCoupon.expires_at).toLocaleDateString('en-IN')}. Reply STOP to opt out.`
          const result = await adapter.sendText(replyTo, welcomeMessage)

          await supabase.from('message_logs').insert({
            restaurant_id: restaurant.id,
            customer_id: customer.id,
            direction: 'outbound',
            type: 'opt_in_confirm',
            status: result.success ? 'sent' : 'failed',
            error: result.error || null,
            provider_message_id: result.messageId || null,
          })

          return NextResponse.json({ status: 'ok' })
        }
      }
    }

    if (body === 'YES') {
      await supabase
        .from('customers')
        .update({ opt_in_status: 'opted_in' })
        .eq('id', customer.id)

      // Retrieve existing welcome coupon or create new one
      let couponCode = ''
      const { data: existingCoupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('customer_id', customer.id)
        .eq('type', 'welcome')
        .maybeSingle()

      if (existingCoupon) {
        couponCode = existingCoupon.code
      } else {
        couponCode = `W${restaurant.welcome_discount_percent}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        await supabase.from('coupons').insert({
          restaurant_id: restaurant.id,
          customer_id: customer.id,
          type: 'welcome',
          code: couponCode,
          discount_percent: restaurant.welcome_discount_percent,
          discount_cents: 0,
          status: 'sent',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
      }

      const welcomeMessage = `Welcome! Your coupon code is ${couponCode} for ${restaurant.welcome_discount_percent}% OFF. Reply STOP to opt out.`
      const result = await adapter.sendText(replyTo, welcomeMessage)

      await supabase.from('message_logs').insert({
        restaurant_id: restaurant.id,
        customer_id: customer.id,
        direction: 'outbound',
        type: 'opt_in_confirm',
        status: result.success ? 'sent' : 'failed',
        error: result.error || null,
        provider_message_id: result.messageId || null,
      })
    } else if (body === 'STOP') {
      await supabase
        .from('customers')
        .update({ opt_in_status: 'opted_out' })
        .eq('id', customer.id)

      await supabase.from('message_logs').insert({
        restaurant_id: restaurant.id,
        customer_id: customer.id,
        direction: 'inbound',
        type: 'opt_out',
        status: 'sent',
      })
    } else if (customer.opt_in_status === 'pending') {
      // Re-send opt-in prompt if they reply anything else while pending
      const optInMessage = `Reply YES to receive exclusive coupons from ${restaurant.name}. Reply STOP to opt out.`
      const result = await adapter.sendText(replyTo, optInMessage)

      await supabase.from('message_logs').insert({
        restaurant_id: restaurant.id,
        customer_id: customer.id,
        direction: 'outbound',
        type: 'opt_in_prompt',
        status: result.success ? 'sent' : 'failed',
        error: result.error || null,
        provider_message_id: result.messageId || null,
      })
    }
  }

  return NextResponse.json({ status: 'ok' })
}
