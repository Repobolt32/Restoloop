import { createServiceClient } from '@/lib/supabase/server'
import { createWhatsAppAdapter } from '@/lib/whatsapp/adapter'
import { resolveSpintax } from '@/lib/whatsapp/spintax'
import { after } from 'next/server'
import { NextRequest, NextResponse } from 'next/server'

function jitter(minMs: number, maxMs: number): Promise<void> {
  return new Promise(resolve =>
    setTimeout(resolve, Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs)
  )
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode') ?? ''
  const token = searchParams.get('hub.verify_token') ?? ''
  const challenge = searchParams.get('hub.challenge') ?? ''

  const verifyToken = process.env.META_VERIFY_TOKEN ?? ''
  if (mode === 'subscribe' && token === verifyToken && challenge) {
    return new Response(challenge, { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

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
  const rawLidDigits = fromPhone

  if (event.from.includes('@lid')) {
    if (event.senderPhone) {
      fromPhone = event.senderPhone.replace(/\D/g, '')
    } else {
      const resolved = adapter.resolveLidPhone
        ? await adapter.resolveLidPhone(event.from)
        : null
      if (resolved) fromPhone = resolved
    }
  }

  const replyTo = (event.from.includes('@lid') && fromPhone === rawLidDigits)
    ? event.from
    : fromPhone

  const toPhone = (event.to || '').replace('@c.us', '').replace(/\D/g, '')

  let restaurant = null

  if (toPhone) {
    const { data } = await supabase
      .from('restaurants')
      .select('*')
      .eq('whatsapp_number', toPhone)
      .maybeSingle()
    restaurant = data
  }

  if (!restaurant) {
    const { data } = await supabase
      .from('restaurants')
      .select('*')
      .eq('whatsapp_number', fromPhone)
      .maybeSingle()
    restaurant = data
  }

  let { data: customer } = restaurant
    ? await supabase
        .from('customers')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('phone', fromPhone)
        .maybeSingle()
    : { data: null }

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

  // Coupon-code join fallback (LID unresolved)
  const isLid = event.from.includes('@lid')
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

  // Capture locals for after() closure
  const capturedRestaurant = restaurant
  const capturedCustomer = customer

  // Return 200 immediately — outbound logic runs in after()
  after(async () => {
    try {
      if (!capturedCustomer) {
        // Unknown customer: send opt-in prompt
        await jitter(5000, 8000)
        const optInMsg = resolveSpintax(
          `{Hi|Hey|Hello}! Welcome to ${capturedRestaurant.name}. Reply {YES|YES 👍} to join our loyalty club and receive exclusive coupons. Reply STOP to cancel.`
        )
        const result = await adapter.sendText(replyTo, optInMsg)

        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({
            restaurant_id: capturedRestaurant.id,
            phone: event.from.includes('@lid') ? event.from : fromPhone,
            opt_in_status: 'pending',
          })
          .select()
          .single()

        await supabase.from('message_logs').insert({
          restaurant_id: capturedRestaurant.id,
          customer_id: newCustomer?.id,
          direction: 'outbound',
          type: 'opt_in_prompt',
          status: result.success ? 'sent' : 'failed',
          error: result.error || null,
          provider_message_id: result.messageId || null,
        })
        return
      }

      const body = event.body.trim().toUpperCase()

      if (body === 'STOP') {
        await supabase
          .from('customers')
          .update({ opt_in_status: 'opted_out' })
          .eq('id', capturedCustomer.id)
        await supabase.from('message_logs').insert({
          restaurant_id: capturedRestaurant.id,
          customer_id: capturedCustomer.id,
          direction: 'inbound',
          type: 'opt_out',
          status: 'sent',
        })
        return
      }

      if (body === 'YES' || body === 'Y') {
        await supabase
          .from('customers')
          .update({ opt_in_status: 'opted_in' })
          .eq('id', capturedCustomer.id)

        let couponCode = ''
        const { data: existingCoupon } = await supabase
          .from('coupons')
          .select('*')
          .eq('customer_id', capturedCustomer.id)
          .eq('type', 'welcome')
          .maybeSingle()

        if (existingCoupon) {
          couponCode = existingCoupon.code
        } else {
          couponCode = `W${capturedRestaurant.welcome_discount_percent}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
          await supabase.from('coupons').insert({
            restaurant_id: capturedRestaurant.id,
            customer_id: capturedCustomer.id,
            type: 'welcome',
            code: couponCode,
            discount_percent: capturedRestaurant.welcome_discount_percent,
            discount_cents: 0,
            status: 'sent',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
        }

        await jitter(5000, 8000)
        const welcomeMsg = resolveSpintax(
          `{Great|Wonderful|Awesome}! {Here is|Here's} your coupon for ${capturedRestaurant.name}: ${couponCode} — ${capturedRestaurant.welcome_discount_percent}% OFF. Valid till ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}. {Enjoy|Use it on your next visit}! Reply STOP to opt out.`
        )
        const result = await adapter.sendText(replyTo, welcomeMsg)

        await supabase.from('message_logs').insert({
          restaurant_id: capturedRestaurant.id,
          customer_id: capturedCustomer.id,
          direction: 'outbound',
          type: 'opt_in_confirm',
          status: result.success ? 'sent' : 'failed',
          error: result.error || null,
          provider_message_id: result.messageId || null,
        })
        return
      }

      if (capturedCustomer.opt_in_status === 'opted_in') {
        // Check if coupon has already been delivered (opt_in_confirm log exists)
        const { data: confirmLog } = await supabase
          .from('message_logs')
          .select('id')
          .eq('customer_id', capturedCustomer.id)
          .eq('direction', 'outbound')
          .eq('type', 'opt_in_confirm')
          .limit(1)
          .maybeSingle()

        if (!confirmLog) {
          // First contact: send warm greeting + YES prompt instead of coupon
          await jitter(5000, 8000)
          const greetMsg = resolveSpintax(
            `{Hi|Hey|Hello} ${capturedCustomer.name || 'there'}! 🎁 Welcome to ${capturedRestaurant.name}. {Reply YES to confirm and|To receive} your ${capturedRestaurant.welcome_discount_percent}% discount coupon, {just reply YES|reply YES below}. Reply STOP to cancel.`
          )
          const result = await adapter.sendText(replyTo, greetMsg)
          await supabase.from('message_logs').insert({
            restaurant_id: capturedRestaurant.id,
            customer_id: capturedCustomer.id,
            direction: 'outbound',
            type: 'opt_in_prompt',
            status: result.success ? 'sent' : 'failed',
            error: result.error || null,
            provider_message_id: result.messageId || null,
          })
          return
        }
        // Coupon already sent — no further action for this message
        return
      }

      if (capturedCustomer.opt_in_status === 'pending') {
        // Re-send prompt for unrecognised reply while pending
        await jitter(5000, 8000)
        const optInMsg = resolveSpintax(
          `{Hi|Hey|Hello} ${capturedCustomer.name || 'there'}! {Please reply YES|Just reply YES} to join the loyalty club at ${capturedRestaurant.name} and receive your coupon. Reply STOP to cancel.`
        )
        const result = await adapter.sendText(replyTo, optInMsg)
        await supabase.from('message_logs').insert({
          restaurant_id: capturedRestaurant.id,
          customer_id: capturedCustomer.id,
          direction: 'outbound',
          type: 'opt_in_prompt',
          status: result.success ? 'sent' : 'failed',
          error: result.error || null,
          provider_message_id: result.messageId || null,
        })
      }
    } catch (e) {
      console.error('ERROR IN AFTER CALLBACK:', e);
    }
  })

  return NextResponse.json({ status: 'ok' })
}
