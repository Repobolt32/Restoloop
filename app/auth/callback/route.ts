import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

import { createClient } from '~/lib/supabase/server';
import pathsConfig from '~/config/paths.config';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? pathsConfig.app.home;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return redirect(`${origin}/auth/callback/error`);
}
