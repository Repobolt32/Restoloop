import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '~/lib/database.types';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookies) {
          try {
            for (const { name, value, options } of cookies) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll called from Server Component — safe to ignore
            // if middleware refreshes sessions.
          }
        },
      },
    },
  );
}

export async function createServiceClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Service role client never needs to write auth cookies
        },
      },
    },
  );
}
