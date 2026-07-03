'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const campaignsSchema = z.object({
  welcome_reminder_enabled: z.boolean(),
  birthday_campaign_enabled: z.boolean(),
  winback_campaign_enabled: z.boolean(),
  expiry_reminder_enabled: z.boolean(),
  welcome_reminder_days: z.number().int().min(1).max(90),
  winback_days: z.number().int().min(1).max(180),
  expiry_reminder_days: z.number().int().min(1).max(7),
  whatsapp_prefill_message: z.string().max(200),
  welcome_discount_percent: z.number().int().min(1).max(100),
  birthday_discount_percent: z.number().int().min(1).max(100),
  winback_discount_percent: z.number().int().min(1).max(100),
})

export async function updateCampaignSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!restaurant) redirect('/dashboard/create')

  const parsed = campaignsSchema.parse({
    welcome_reminder_enabled: formData.get('welcome_reminder_enabled') === 'on',
    birthday_campaign_enabled: formData.get('birthday_campaign_enabled') === 'on',
    winback_campaign_enabled: formData.get('winback_campaign_enabled') === 'on',
    expiry_reminder_enabled: formData.get('expiry_reminder_enabled') === 'on',
    welcome_reminder_days: Number(formData.get('welcome_reminder_days')),
    winback_days: Number(formData.get('winback_days')),
    expiry_reminder_days: Number(formData.get('expiry_reminder_days')),
    whatsapp_prefill_message: String(
      formData.get('whatsapp_prefill_message') || 'Hi, I would like to join your loyalty club!'
    ),
    welcome_discount_percent: Number(formData.get('welcome_discount_percent')),
    birthday_discount_percent: Number(formData.get('birthday_discount_percent')),
    winback_discount_percent: Number(formData.get('winback_discount_percent')),
  })

  const { error } = await supabase
    .from('restaurants')
    .update(parsed)
    .eq('id', restaurant.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/campaigns')
}
