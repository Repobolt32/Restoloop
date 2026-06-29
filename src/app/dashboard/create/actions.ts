'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  whatsappNumber: z.string().regex(/^91\d{10}$/),
  welcomeDiscountCents: z.coerce.number().int().positive(),
  birthdayDiscountCents: z.coerce.number().int().positive(),
  winbackDiscountCents: z.coerce.number().int().positive(),
})

export async function createRestaurant(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const validated = schema.parse({
    name: formData.get('name'),
    address: formData.get('address'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    whatsappNumber: formData.get('whatsappNumber'),
    welcomeDiscountCents: formData.get('welcomeDiscountCents'),
    birthdayDiscountCents: formData.get('birthdayDiscountCents'),
    winbackDiscountCents: formData.get('winbackDiscountCents'),
  })

  const slug = validated.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const { error } = await supabase.from('restaurants').insert({
    owner_id: user.id,
    name: validated.name,
    address: validated.address || null,
    phone: validated.phone || null,
    email: validated.email || null,
    slug,
    whatsapp_number: validated.whatsappNumber,
    welcome_discount_cents: validated.welcomeDiscountCents,
    birthday_discount_cents: validated.birthdayDiscountCents,
    winback_discount_cents: validated.winbackDiscountCents,
  })

  if (error) throw new Error(error.message)
  redirect('/dashboard')
}
