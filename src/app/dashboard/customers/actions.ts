'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { normalizePhone } from '@/lib/utils'

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().regex(/^91\d{10}$/, 'Phone number must be a valid 10-digit number (e.g. 9876543210)'),
  birthday_month: z.number().int().min(1).max(12).optional(),
  birthday_day: z.number().int().min(1).max(31).optional(),
})

export async function addCustomerAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!restaurant) redirect('/dashboard/create')

  const rawMonth = formData.get('birthday_month')
  const rawDay = formData.get('birthday_day')
  const rawPhone = (formData.get('phone') as string) || ''

  const result = customerSchema.safeParse({
    name: formData.get('name'),
    phone: normalizePhone(rawPhone),
    birthday_month: rawMonth ? Number(rawMonth) : undefined,
    birthday_day: rawDay ? Number(rawDay) : undefined,
  })

  if (!result.success) {
    return { error: result.error.issues[0]?.message || 'Invalid input' }
  }

  const parsed = result.data

  const { error } = await supabase.from('customers').insert({
    restaurant_id: restaurant.id,
    name: parsed.name,
    phone: parsed.phone,
    birthday_month: parsed.birthday_month || null,
    birthday_day: parsed.birthday_day || null,
    opt_in_status: 'opted_in',
  })

  if (error) {
    if (error.code === '23505') return { error: 'Phone number already registered' }
    return { error: error.message }
  }

  revalidatePath('/dashboard/customers')
  return { success: true }
}

export async function deleteCustomerAction(customerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/customers')
  return { success: true }
}
