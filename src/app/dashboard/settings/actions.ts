'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

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

const campaignSettingsSchema = z.object({
  welcome_reminder_enabled: z.boolean(),
  birthday_campaign_enabled: z.boolean(),
  winback_campaign_enabled: z.boolean(),
  expiry_reminder_enabled: z.boolean(),
  welcome_reminder_days: z.number().int().min(1).max(90),
  winback_days: z.number().int().min(1).max(180),
  expiry_reminder_days: z.number().int().min(1).max(7),
  whatsapp_prefill_message: z.string().max(200),
})

export async function updateCampaignSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = campaignSettingsSchema.parse({
    welcome_reminder_enabled: formData.get('welcome_reminder_enabled') === 'on',
    birthday_campaign_enabled: formData.get('birthday_campaign_enabled') === 'on',
    winback_campaign_enabled: formData.get('winback_campaign_enabled') === 'on',
    expiry_reminder_enabled: formData.get('expiry_reminder_enabled') === 'on',
    welcome_reminder_days: Number(formData.get('welcome_reminder_days')),
    winback_days: Number(formData.get('winback_days')),
    expiry_reminder_days: Number(formData.get('expiry_reminder_days')),
    whatsapp_prefill_message: String(
      formData.get('whatsapp_prefill_message') ?? 'Hi, I would like to join your loyalty club!'
    ),
  })

  const { error } = await supabase
    .from('restaurants')
    .update(parsed)
    .eq('owner_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/settings')
}
