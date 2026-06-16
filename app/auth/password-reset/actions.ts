'use server';

import { redirect } from 'next/navigation';

import { createClient } from '~/lib/supabase/server';

export async function resetPassword(formData: FormData) {
  const email = formData.get('email') as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/update-password`,
  });

  if (error) {
    redirect('/auth/password-reset?error=' + encodeURIComponent(error.message));
  }

  redirect('/auth/sign-in?message=' + encodeURIComponent('Check your email for the password reset link.'));
}
