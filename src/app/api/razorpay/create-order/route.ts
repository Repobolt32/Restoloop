import { createClient } from '@/lib/supabase/server'
import { razorpay } from '@/lib/razorpay'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, credits, purchaseType } = await request.json()

    if (purchaseType === 'trial') {
      // Trial orders don't need credits/amount inputs from client as they are fixed
    } else {
      if (!amount || !credits || amount <= 0 || credits <= 0) {
        return NextResponse.json({ error: 'Invalid order parameters' }, { status: 400 })
      }
    }

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id, trial_activated_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    if (purchaseType === 'trial' && restaurant.trial_activated_at) {
      return NextResponse.json({ error: 'Trial already activated' }, { status: 400 })
    }

    let orderId: string

    if (!razorpay) {
      // Mock order creation for sandbox testing
      orderId = `order_mock_${Date.now()}`
    } else {
      if (purchaseType === 'trial') {
        const order = await razorpay.orders.create({
          amount: 59900, // ₹599 in paise (59900 paise)
          currency: 'INR',
          receipt: `trial_${user.id}_${Date.now()}`,
          notes: {
            purchaseType: 'trial',
            userId: user.id,
          },
        })
        orderId = order.id
      } else {
        const order = await razorpay.orders.create({
          amount: amount * 100, // paise
          currency: 'INR',
          receipt: `credits_${user.id}_${Date.now()}`,
          notes: {
            credits: credits.toString(),
            userId: user.id,
          },
        })
        orderId = order.id
      }
    }


    return NextResponse.json({ orderId })
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
