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
