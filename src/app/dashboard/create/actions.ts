'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { normalizePhone } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(1, { message: 'Restaurant name is required' }),
  whatsappNumber: z.string().regex(/^91\d{10}$/, { message: 'WhatsApp number must be 91 followed by a 10-digit number' }),
  welcomeDiscount: z.coerce.number().int().positive({ message: 'Welcome discount must be a positive integer' }),
  birthdayDiscount: z.coerce.number().int().positive({ message: 'Birthday discount must be a positive integer' }),
  winbackDiscount: z.coerce.number().int().positive({ message: 'Winback discount must be a positive integer' }),
})

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function createRestaurant(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: existingRestaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .limit(1)
    .maybeSingle()

  if (existingRestaurant) {
    redirect('/dashboard')
  }

  const rawPhone = (formData.get('whatsappNumber') as string) || ''
  const parsed = schema.safeParse({
    name: formData.get('name'),
    whatsappNumber: normalizePhone(rawPhone),
    welcomeDiscount: formData.get('welcomeDiscount'),
    birthdayDiscount: formData.get('birthdayDiscount'),
    winbackDiscount: formData.get('winbackDiscount'),
  })

  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map(e => e.message).join(', ')
    redirect(`/dashboard/create?error=${encodeURIComponent(errorMsg)}`)
  }

  let slug = slugify(parsed.data.name)

  // Check for slug collision across all tenants using admin client to bypass RLS
  const adminClient = createServiceClient()

  let isUnique = false
  let attempts = 0
  const maxAttempts = 10

  while (!isUnique && attempts < maxAttempts) {
    const checkSlug = attempts === 0 ? slug : `${slug}-${Math.random().toString(36).slice(2, 6)}`
    const { data: existing } = await adminClient
      .from('restaurants')
      .select('id')
      .eq('slug', checkSlug)
      .maybeSingle()

    if (!existing) {
      slug = checkSlug
      isUnique = true
    }
    attempts++
  }

  const { error } = await supabase.from('restaurants').insert({
    owner_id: user.id,
    name: parsed.data.name,
    slug,
    whatsapp_number: parsed.data.whatsappNumber,
    welcome_discount_percent: parsed.data.welcomeDiscount,
    welcome_discount_cents: parsed.data.welcomeDiscount * 100,
    birthday_discount_percent: parsed.data.birthdayDiscount,
    birthday_discount_cents: parsed.data.birthdayDiscount * 100,
    winback_discount_percent: parsed.data.winbackDiscount,
    winback_discount_cents: parsed.data.winbackDiscount * 100,
  })

  if (error) {
    redirect(`/dashboard/create?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
