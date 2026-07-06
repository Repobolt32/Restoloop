'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function generateCode(): string {
  const allowed = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += allowed.charAt(Math.floor(Math.random() * allowed.length))
  }
  return code
}

export async function createCouponAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

    if (!restaurant) redirect('/dashboard/create')

  const customerId = formData.get('customer_id') as string
  const discountPercent = Number(formData.get('discount_percent'))

  if (!customerId || !discountPercent) throw new Error('Missing required fields')

  const code = generateCode()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const { error } = await supabase.from('coupons').insert({
    restaurant_id: restaurant.id,
    customer_id: customerId,
    type: 'manual',
    code,
    discount_percent: discountPercent,
    discount_cents: 0,
    status: 'sent',
    enabled: true,
    expires_at: expiresAt,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/coupons')
}

export async function disableCouponAction(couponId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

    if (!restaurant) redirect('/dashboard/create')

  await supabase
    .from('coupons')
    .update({ enabled: false })
    .eq('id', couponId)
    .eq('restaurant_id', restaurant.id)

  revalidatePath('/dashboard/coupons')
}

export async function deleteCouponAction(couponId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

    if (!restaurant) redirect('/dashboard/create')

  await supabase
    .from('coupons')
    .delete()
    .eq('id', couponId)
    .eq('restaurant_id', restaurant.id)
    .eq('status', 'sent')

  revalidatePath('/dashboard/coupons')
}
