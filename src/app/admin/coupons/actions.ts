'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (roleData?.role !== 'superadmin') {
    throw new Error('Unauthorized')
  }
  return user
}

export async function searchCouponsAction(query: string) {
  await requireAdmin()

  const serviceSupabase = createServiceClient()
  const { data, error } = await serviceSupabase
    .from('coupons')
    .select('*, customers(name, phone), restaurants(name, slug)')
    .ilike('code', `%${query}%`)
    .limit(50)

  if (error) throw new Error('Search failed')
  return data || []
}

export async function forceRedeemCouponAction(formData: FormData) {
  await requireAdmin()
  const couponId = formData.get('couponId') as string

  const serviceSupabase = createServiceClient()
  const { error } = await serviceSupabase
    .from('coupons')
    .update({ status: 'redeemed', redeemed_at: new Date().toISOString() })
    .eq('id', couponId)

  if (error) throw new Error('Update failed')

  revalidatePath('/admin/coupons')
  redirect('/admin/coupons?success=redeemed')
}

export async function reactivateCouponAction(formData: FormData) {
  await requireAdmin()
  const couponId = formData.get('couponId') as string

  const serviceSupabase = createServiceClient()
  const { error } = await serviceSupabase
    .from('coupons')
    .update({
      status: 'sent',
      redeemed_at: null,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq('id', couponId)

  if (error) throw new Error('Update failed')

  revalidatePath('/admin/coupons')
  redirect('/admin/coupons?success=reactivated')
}
