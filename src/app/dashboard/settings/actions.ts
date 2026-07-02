'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateDiscountsAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const welcomeCents = Math.round(Number(formData.get('welcome_discount')) * 100)
  const birthdayCents = Math.round(Number(formData.get('birthday_discount')) * 100)
  const winbackCents = Math.round(Number(formData.get('winback_discount')) * 100)

  if ([welcomeCents, birthdayCents, winbackCents].some(v => isNaN(v) || v < 0)) {
    throw new Error('Invalid discount amounts')
  }

  const { error } = await supabase
    .from('restaurants')
    .update({
      welcome_discount_cents: welcomeCents,
      birthday_discount_cents: birthdayCents,
      winback_discount_cents: winbackCents,
    })
    .eq('owner_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/settings')
}
