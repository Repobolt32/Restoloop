'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits
  if (digits.length === 11 && digits.startsWith('0')) return '91' + digits.slice(1)
  return digits
}

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

  const raw = formData.get('whatsappNumber') as string
  const parsed = schema.safeParse({
    name: formData.get('name'),
    whatsappNumber: normalizePhone(raw),
    welcomeDiscount: formData.get('welcomeDiscount'),
    birthdayDiscount: formData.get('birthdayDiscount'),
    winbackDiscount: formData.get('winbackDiscount'),
  })

  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => i.message).join(', ')
    redirect(`/dashboard/create?error=${encodeURIComponent(issues)}`)
  }

  let slug = slugify(parsed.data.name)

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
    name: parsed.data.name,
    slug,
    whatsapp_number: parsed.data.whatsappNumber,
    welcome_discount_cents: parsed.data.welcomeDiscount * 100,
    birthday_discount_cents: parsed.data.birthdayDiscount * 100,
    winback_discount_cents: parsed.data.winbackDiscount * 100,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
