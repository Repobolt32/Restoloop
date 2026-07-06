'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function requireAdmin(supabase: any, userId: string) {
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single()

  if (roleData?.role !== 'superadmin') {
    throw new Error('Unauthorized')
  }
}

export async function addCreditsAction(formData: FormData) {
  const restaurantId = formData.get('restaurantId') as string
  const amountStr = formData.get('amount') as string
  const credits = parseInt(amountStr, 10)

  if (!restaurantId || isNaN(credits)) {
    throw new Error('Invalid action parameters')
  }

  // 1. Authenticate user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }
  await requireAdmin(supabase, user.id)

  // 2. Add credits atomically (Fetch + Update)
  const serviceSupabase = createServiceClient()
  const { data: restaurant, error: fetchError } = await serviceSupabase
    .from('restaurants')
    .select('credits')
    .eq('id', restaurantId)
    .single()

  if (fetchError || !restaurant) {
    throw new Error('Restaurant not found')
  }

  const newCredits = (restaurant.credits || 0) + credits

  const { error: updateError } = await serviceSupabase
    .from('restaurants')
    .update({ credits: newCredits })
    .eq('id', restaurantId)

  if (updateError) {
    throw new Error('Database update failed')
  }

  // 3. Revalidate paths
  revalidatePath('/admin')
  revalidatePath(`/admin/${restaurantId}`)

  // 4. Redirect to details view with success indicator
  redirect(`/admin/${restaurantId}?success=true&added=${credits}`)
}

export async function addCreditsWithLogAction(formData: FormData) {
  const restaurantId = formData.get('restaurantId') as string
  const amountStr = formData.get('amount') as string
  const reason = (formData.get('reason') as string || '').trim()
  const credits = parseInt(amountStr, 10)

  if (!restaurantId || isNaN(credits)) {
    throw new Error('Invalid action parameters')
  }

  if (!reason) {
    throw new Error('Reason is required')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }
  await requireAdmin(supabase, user.id)

  const serviceSupabase = createServiceClient()
  const { data: restaurant, error: fetchError } = await serviceSupabase
    .from('restaurants')
    .select('credits')
    .eq('id', restaurantId)
    .single()

  if (fetchError || !restaurant) {
    throw new Error('Restaurant not found')
  }

  const newCredits = Math.max(0, (restaurant.credits || 0) + credits)

  const { error: updateError } = await serviceSupabase
    .from('restaurants')
    .update({ credits: newCredits })
    .eq('id', restaurantId)

  if (updateError) {
    throw new Error('Database update failed')
  }

  await serviceSupabase.from('admin_credit_logs').insert({
    restaurant_id: restaurantId,
    admin_user_id: user.id,
    amount: credits,
    reason,
  })

  revalidatePath('/admin')
  revalidatePath(`/admin/${restaurantId}`)
  redirect(`/admin/${restaurantId}?success=true&added=${credits}`)
}

export async function updatePlanAction(formData: FormData) {
  const restaurantId = formData.get('restaurantId') as string
  const plan = formData.get('plan') as string
  const trialExpiresAtStr = formData.get('trialExpiresAt') as string

  if (!restaurantId || !plan) {
    throw new Error('Invalid action parameters')
  }

  // 1. Authenticate user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }
  await requireAdmin(supabase, user.id)

  // 2. Fetch current restaurant details
  const serviceSupabase = createServiceClient()
  const { data: restaurant, error: fetchError } = await serviceSupabase
    .from('restaurants')
    .select('plan, trial_activated_at')
    .eq('id', restaurantId)
    .single()

  if (fetchError || !restaurant) {
    throw new Error('Restaurant not found')
  }

  const updatePayload: any = {
    plan,
  }

  if (plan === 'trial') {
    updatePayload.trial_expires_at = trialExpiresAtStr ? new Date(trialExpiresAtStr).toISOString() : null
    if (!restaurant.trial_activated_at) {
      updatePayload.trial_activated_at = new Date().toISOString()
    }
  } else {
    updatePayload.trial_expires_at = null
  }

  const { error: updateError } = await serviceSupabase
    .from('restaurants')
    .update(updatePayload)
    .eq('id', restaurantId)

  if (updateError) {
    throw new Error('Database update failed')
  }

  // 3. Revalidate paths
  revalidatePath('/admin')
  revalidatePath(`/admin/${restaurantId}`)

  // 4. Redirect to details view with success indicator
  redirect(`/admin/${restaurantId}?success=true&action=update-plan`)
}

export async function toggleSuspensionAction(formData: FormData) {
  const restaurantId = formData.get('restaurantId') as string
  const suspend = formData.get('suspend') === 'true'

  if (!restaurantId) {
    throw new Error('Invalid action parameters')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }
  await requireAdmin(supabase, user.id)

  const serviceSupabase = createServiceClient()
  const { error } = await serviceSupabase
    .from('restaurants')
    .update({ is_suspended: suspend })
    .eq('id', restaurantId)

  if (error) {
    throw new Error('Database update failed')
  }

  revalidatePath('/admin')
  revalidatePath(`/admin/${restaurantId}`)
  redirect(`/admin/${restaurantId}?success=true&action=toggle-suspension`)
}

export async function triggerCronAction(formData: FormData) {
  const restaurantId = formData.get('restaurantId') as string

  if (!restaurantId) throw new Error('Invalid action parameters')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  await requireAdmin(supabase, user.id)

  const { runAllCampaignsForRestaurant } = await import('@/lib/campaigns')
  await runAllCampaignsForRestaurant(restaurantId)

  revalidatePath(`/admin/${restaurantId}`)
  redirect(`/admin/${restaurantId}?success=true&action=trigger-cron`)
}

export async function resetWhatsAppSessionAction(formData: FormData) {
  const restaurantId = formData.get('restaurantId') as string

  if (!restaurantId) throw new Error('Invalid action parameters')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  await requireAdmin(supabase, user.id)

  const serviceSupabase = createServiceClient()
  const { error } = await serviceSupabase
    .from('restaurants')
    .update({ whatsapp_session_data: null })
    .eq('id', restaurantId)

  if (error) throw new Error('Database update failed')

  revalidatePath(`/admin/${restaurantId}`)
  redirect(`/admin/${restaurantId}?success=true&action=reset-whatsapp`)
}

