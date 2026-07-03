'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const schema = z.object({
  name: z.string().min(1),
  whatsappNumber: z.string().regex(/^91\d{10}$/),
  welcomeDiscount: z.coerce.number().int().positive(),
  birthdayDiscount: z.coerce.number().int().positive(),
  winbackDiscount: z.coerce.number().int().positive(),
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

  const parsed = schema.parse({
    name: formData.get('name'),
    whatsappNumber: formData.get('whatsappNumber'),
    welcomeDiscount: formData.get('welcomeDiscount'),
    birthdayDiscount: formData.get('birthdayDiscount'),
    winbackDiscount: formData.get('winbackDiscount'),
  })

  let slug = slugify(parsed.name)

  // Check for slug collision across all tenants using admin client to bypass RLS
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

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
    name: parsed.name,
    slug,
    whatsapp_number: parsed.whatsappNumber,
    welcome_discount_cents: parsed.welcomeDiscount * 100,
    birthday_discount_cents: parsed.birthdayDiscount * 100,
    winback_discount_cents: parsed.winbackDiscount * 100,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
