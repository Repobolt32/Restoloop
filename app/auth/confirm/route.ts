import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '~/lib/supabase/server';
import { safeRedirectPath } from '~/lib/redirect-validator';
import pathsConfig from '~/config/paths.config';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as 'email' | 'recovery' | null;
  const next = safeRedirectPath(searchParams.get('next'), pathsConfig.app.home);

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(new URL('/auth/callback/error', request.url));
}
