'use server';

import { redirect } from 'next/navigation';

import { createClient } from '~/lib/supabase/server';

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect('/auth/sign-up?error=' + encodeURIComponent(error.message));
  }

  redirect('/auth/sign-in?message=' + encodeURIComponent('Check your email to confirm your account.'));
}
