'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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

  if (!user || user.email !== 'admin@restoloop.com') {
    throw new Error('Unauthorized')
  }

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

  if (!user || user.email !== 'admin@restoloop.com') {
    throw new Error('Unauthorized')
  }

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
  redirect(`/admin/${restaurantId}?success=true`)
}

