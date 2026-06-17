import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';

import { createClient } from '~/lib/supabase/server';
import pathsConfig from '~/config/paths.config';

/**
 * Require the user to be authenticated in a server component.
 * Cached so data is only fetched once per request.
 */
export const requireUserInServerComponent = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect(pathsConfig.auth.signIn);
  }

  return data.user;
});
