'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function validateCoupon(code: string, billAmountCents: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Get restaurant owned by this user
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!restaurant) {
    redirect('/dashboard/create')
  }

  const sanitizedCode = code.trim().toUpperCase()

  // 2. Query coupon with matching code, and join customer details
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*, customers(*)')
    .eq('code', sanitizedCode)
    .maybeSingle()

  if (error || !coupon) {
    return { error: 'Coupon not found' }
  }

  if (coupon.restaurant_id !== restaurant.id) {
    return { error: 'Wrong restaurant' }
  }

  if (coupon.status === 'redeemed') {
    return { error: 'Already redeemed' }
  }

  if (new Date(coupon.expires_at) < new Date()) {
    return { error: 'Expired' }
  }

  // 3. Calculate discount based on percentage
  const discountPercent = coupon.discount_percent || 10
  const discountAmountCents = Math.round(billAmountCents * (discountPercent / 100))

  // 4. Mark as redeemed with billing details
  const { error: updateCouponError } = await supabase
    .from('coupons')
    .update({
      status: 'redeemed',
      redeemed_at: new Date().toISOString(),
      bill_amount_cents: billAmountCents,
      discount_amount_cents: discountAmountCents,
    })
    .eq('id', coupon.id)

  if (updateCouponError) {
    return { error: 'Failed to redeem coupon' }
  }

  // 5. Update customer last_visit_at
  const { error: updateCustomerError } = await supabase
    .from('customers')
    .update({ last_visit_at: new Date().toISOString() })
    .eq('id', coupon.customer_id)

  if (updateCustomerError) {
    console.error('Failed to update customer last_visit_at:', updateCustomerError)
  }

  return {
    success: true,
    customer: coupon.customers,
    discountPercent,
    discountAmountCents,
    billAmountCents,
    code: coupon.code,
  }
}
