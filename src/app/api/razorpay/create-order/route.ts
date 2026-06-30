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

    const { amount, credits } = await request.json()

    if (!amount || !credits || amount <= 0 || credits <= 0) {
      return NextResponse.json({ error: 'Invalid order parameters' }, { status: 400 })
    }

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    let orderId: string

    if (!razorpay) {
      // Mock order creation for sandbox testing
      orderId = `order_mock_${Date.now()}`
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

    return NextResponse.json({ orderId })
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
