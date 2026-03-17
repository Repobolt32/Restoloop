/**
 * Restoloop Supabase server client helpers.
 *
 * We delegate to the boilerplate's @kit/supabase package which
 * already wraps @supabase/ssr and @supabase/supabase-js correctly.
 * This keeps us aligned with Makerkit's dependency graph and avoids
 * importing @supabase/ssr directly in apps/web.
 */

export { getSupabaseServerClient as createSupabaseServerClient } from '@kit/supabase/server-client';
export { getSupabaseServerAdminClient as createSupabaseServiceClient } from '@kit/supabase/server-admin-client';
