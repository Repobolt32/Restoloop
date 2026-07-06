'use server'

import { createServiceClient } from '@/lib/supabase/server'

export async function signUpUser({ email, password }: { email: string; password: string }) {
  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  try {
    const supabase = createServiceClient()
    
    // Create and auto-confirm user
    const { error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (error) {
      return { error: 'Failed to create account. Please try again.' }
    }

    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Failed to sign up' }
  }
}
