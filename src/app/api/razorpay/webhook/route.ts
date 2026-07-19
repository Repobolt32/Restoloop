import { createClient, createServiceClient } from '@/lib/supabase/server'
import Razorpay from 'razorpay'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature') || ''

    const isMock = process.env.RAZORPAY_WEBHOOK_SECRET === 'mock' || !process.env.RAZORPAY_WEBHOOK_SECRET

    if (!isMock) {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!
      const isValid = Razorpay.validateWebhookSignature(
        body,
        signature,
        webhookSecret
      )

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    } else {
      // Mock validation verification for testing
      if (signature !== 'sig_mock') {
        return NextResponse.json({ error: 'Invalid signature (mock mode)' }, { status: 400 })
      }
    }

    const event = JSON.parse(body)

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity
      const userId = payment.notes.userId
      const purchaseType = payment.notes.purchaseType

      if (!userId) {
        return NextResponse.json({ error: 'Missing payment notes metadata' }, { status: 400 })
      }

      // Fallback to cookie-based client for testing when service role key is missing
      const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
        ? createServiceClient()
        : await createClient()

      const { data: restaurant, error: fetchError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (fetchError || !restaurant) {
        console.error('Webhook: Restaurant not found for owner_id:', userId, fetchError)
        return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
      }

      let updatePayload: any = {}

      if (purchaseType === 'trial') {
        const trialExpiresAt = new Date()
        trialExpiresAt.setDate(trialExpiresAt.getDate() + 21)
        updatePayload = {
          plan: 'trial',
          trial_activated_at: new Date().toISOString(),
          trial_expires_at: trialExpiresAt.toISOString(),
          plan_expires_at: trialExpiresAt.toISOString(),
        }
      } else if (purchaseType === 'plan') {
        const planName = payment.notes.planName
        const credits = parseInt(payment.notes.credits, 10)
        if (!planName || isNaN(credits)) {
          return NextResponse.json({ error: 'Missing payment notes metadata' }, { status: 400 })
        }

        const now = new Date()
        const current = restaurant.plan_expires_at ? new Date(restaurant.plan_expires_at) : null
        const base = current && current > now ? current : now
        const nextExpiry = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000)

        updatePayload = {
          plan: planName,
          credits: (restaurant.credits || 0) + credits,
          plan_expires_at: nextExpiry.toISOString(),
          trial_expires_at: null,
        }
      } else {
        const credits = parseInt(payment.notes.credits, 10)
        if (isNaN(credits)) {
          return NextResponse.json({ error: 'Missing payment notes metadata' }, { status: 400 })
        }
        updatePayload = {
          credits: (restaurant.credits || 0) + credits,
        }
      }

      const { error: updateError } = await supabase
        .from('restaurants')
        .update(updatePayload)
        .eq('id', restaurant.id)

      if (updateError) {
        console.error('Webhook: Failed to update restaurant:', updateError)
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error: any) {
    console.error('Error handling webhook:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
