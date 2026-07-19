import { createClient } from '@/lib/supabase/server'
import { razorpay } from '@/lib/razorpay'
import { NextRequest, NextResponse } from 'next/server'

const PLAN_MAP = {
  pro: { amountPaise: 99900, credits: 300 },
  max: { amountPaise: 199900, credits: 700 },
  ultra: { amountPaise: 299900, credits: 1500 },
} as const

const RECHARGE_MAP = {
  starter: { amountPaise: 150000, credits: 500 },
  growth: { amountPaise: 300000, credits: 1000 },
  power: { amountPaise: 600000, credits: 2000 },
} as const

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { purchaseType } = body

    if (!['trial', 'plan', 'recharge'].includes(purchaseType)) {
      return NextResponse.json({ error: 'Invalid purchase type' }, { status: 400 })
    }

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id, trial_activated_at, plan, plan_expires_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    if (purchaseType === 'trial') {
      if (restaurant.trial_activated_at) {
        return NextResponse.json({ error: 'Trial already activated' }, { status: 400 })
      }
    } else if (purchaseType === 'recharge') {
      // Recharge requires active plan (trial, pro, max, ultra and not expired)
      const now = new Date()
      const hasActivePlan = restaurant.plan !== 'free' && restaurant.plan !== 'expired' &&
                            restaurant.plan_expires_at && new Date(restaurant.plan_expires_at) > now
      if (!hasActivePlan) {
        return NextResponse.json({ error: 'Recharge requires an active plan' }, { status: 400 })
      }
    }

    let orderId: string
    let orderAmountPaise: number
    let orderReceipt: string
    let orderNotes: any

    if (purchaseType === 'trial') {
      orderAmountPaise = 59900
      orderReceipt = `trial_${user.id}_${Date.now()}`
      orderNotes = {
        purchaseType: 'trial',
        userId: user.id,
      }
    } else if (purchaseType === 'plan') {
      const planName = body.planName as keyof typeof PLAN_MAP
      if (!PLAN_MAP[planName]) {
        return NextResponse.json({ error: 'Invalid plan name' }, { status: 400 })
      }
      const config = PLAN_MAP[planName]
      orderAmountPaise = config.amountPaise
      orderReceipt = `plan_${planName}_${user.id}_${Date.now()}`
      orderNotes = {
        purchaseType: 'plan',
        planName,
        credits: config.credits.toString(),
        userId: user.id,
      }
    } else { // recharge
      const packName = body.packName as keyof typeof RECHARGE_MAP
      if (!RECHARGE_MAP[packName]) {
        return NextResponse.json({ error: 'Invalid pack name' }, { status: 400 })
      }
      const config = RECHARGE_MAP[packName]
      orderAmountPaise = config.amountPaise
      orderReceipt = `recharge_${packName}_${user.id}_${Date.now()}`
      orderNotes = {
        purchaseType: 'recharge',
        packName,
        credits: config.credits.toString(),
        userId: user.id,
      }
    }

    if (!razorpay) {
      orderId = `order_mock_${Date.now()}`
    } else {
      const order = await razorpay.orders.create({
        amount: orderAmountPaise,
        currency: 'INR',
        receipt: orderReceipt,
        notes: orderNotes,
      })
      orderId = order.id
    }

    return NextResponse.json({ orderId })
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
