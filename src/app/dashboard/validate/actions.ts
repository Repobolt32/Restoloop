'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function validateCoupon(code: string) {
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
    .single()

  if (!restaurant) {
    redirect('/dashboard/create')
  }

  const sanitizedCode = code.trim().toUpperCase()

  // 2. Query coupon with matching code, and join customer details
  // ponytail: standard join to fetch customer phone/name details simultaneously
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

  // 3. Mark as redeemed
  const { error: updateCouponError } = await supabase
    .from('coupons')
    .update({
      status: 'redeemed',
      redeemed_at: new Date().toISOString(),
    })
    .eq('id', coupon.id)

  if (updateCouponError) {
    return { error: 'Failed to redeem coupon' }
  }

  // 4. Update customer last_visit_at
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
    discount: coupon.discount_cents,
    code: coupon.code,
  }
}
