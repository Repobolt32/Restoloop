'use server';

import { redirect } from 'next/navigation';

import { createClient } from '~/lib/supabase/server';

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error('Sign-in error:', error);
    redirect('/auth/sign-in?error=' + encodeURIComponent('Authentication failed. Please check your credentials.'));
  }

  redirect('/home');
}
