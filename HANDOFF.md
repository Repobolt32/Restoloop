# HANDOFF — Auth System: Complete Issue Report

## Overview

Restoloop is a Next.js 16 + Supabase + Vercel app. The auth system uses Supabase Auth (`@supabase/ssr` + `@supabase/supabase-js`). There are 9 known issues with the current auth implementation, ranging from critical (broken signup flow) to minor (hardcoded admin email).

**Production URL:** `https://restoloop-owner.vercel.app`
**Supabase Project:** `oggwcgygkwxywmjdnaef.supabase.co`

---

## ISSUE 1: Signup Uses Admin API Instead of Standard Auth Flow

**Severity:** Critical
**File:** `src/app/signup/actions.ts` (lines 11-17)
**Status:** BROKEN — causes orphan users and bypasses email verification

### Current Code

```typescript
'use server'
import { createServiceClient } from '@/lib/supabase/server'

export async function signUpUser({ email, password }: { email: string; password: string }) {
  if (!email || !password) {
    return { error: 'Email and password are required' }
  }
  try {
    const supabase = createServiceClient()  // ← SERVICE ROLE KEY (admin access)
    
    const { error } = await supabase.auth.admin.createUser({  // ← ADMIN API
      email,
      password,
      email_confirm: true,  // ← AUTO-CONFIRMS EMAIL (no verification)
    })

    if (error) {
      if (error.status === 422 && error.code === 'email_exists') {
        return { error: 'Email already registered. Try logging in instead.' }
      }
      return { error: 'Failed to create account. Please try again.' }
    }
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Failed to sign up' }
  }
}
```

### What's Wrong

1. **Uses `createServiceClient()`** — This creates a Supabase client with the `SUPABASE_SERVICE_ROLE_KEY`, which has full admin access to the Supabase project. Service role key should NEVER be used for user-facing operations. It bypasses all RLS and has god-mode access.

2. **Uses `auth.admin.createUser()`** — This is the Admin API for creating users. It's meant for server-side admin operations (like creating users from a CLI or admin panel), NOT for user signup. The correct method for user signup is `auth.signUp()` using the anon key (browser client).

3. **`email_confirm: true`** — This auto-confirms the user's email without sending a verification email. The user never proves they own the email address. Anyone can sign up with any email (e.g., `ceo@google.com`) and it will work.

4. **Creates orphan users** — Because `email_confirm: true` skips verification, the user is created in `auth.users` but never goes through the proper signup flow. If the user later tries to sign up again (e.g., they forgot they signed up), Supabase returns `email_exists` (422) because the user already exists. The user is stuck — they can't sign up again and they may not know their password.

### What Should Happen

The signup page (`src/app/signup/page.tsx`) is a client component. It should use the browser Supabase client (anon key) with `auth.signUp()`:

```typescript
// In the client component (page.tsx), NOT a server action
const supabase = createClient()  // browser client, anon key
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/confirm`,
  },
})
```

This sends a verification email. The user clicks the link, which goes to `/auth/confirm` (see Issue 2). Only after verification does the user become confirmed.

### How the Signup Page Currently Works

**File:** `src/app/signup/page.tsx` (lines 14-23)

```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  setError('')
  const result = await signUpUser({ email, password })  // ← calls server action
  if (result.error) {
    setError(result.error)
    return
  }
  router.push('/login')  // ← redirects to login after signup
}
```

The page calls the `signUpUser` server action (Issue 1 above), then redirects to `/login`. This means after signup, the user has to log in separately. With the correct `auth.signUp()` flow, the user would be auto-signed-in after signup (or after email verification).

### How `createServiceClient()` Works

**File:** `src/lib/supabase/server.ts` (lines 30-35)

```typescript
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // ← admin key, full access
  )
}
```

This creates a Supabase client with the service role key. It bypasses all RLS policies and has full access to the Supabase project. It's used correctly in other parts of the app (campaigns, webhooks, admin actions), but should NOT be used for user signup.

### How `createClient()` Works (Browser)

**File:** `src/lib/supabase/client.ts` (lines 1-12)

```typescript
import { createBrowserClient } from '@supabase/ssr'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars')
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  // ← anon key, limited access
  )
}
```

This is the correct client for user-facing auth operations. It uses the anon key which has limited access (respecting RLS).

---

## ISSUE 2: No Email Verification Route

**Severity:** Critical
**File:** MISSING — should be at `src/app/auth/confirm/route.ts`
**Status:** Not implemented

### What's Missing

Supabase sends a verification email after `auth.signUp()` with a link like:
```
https://restoloop-owner.vercel.app/auth/confirm?token_hash=abc123&type=email
```

This route does not exist. Clicking the verification link in the email goes to a 404.

### What's Needed

A Next.js route handler at `src/app/auth/confirm/route.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirect(next);
    } else {
      redirect(`/auth/error?error=${error?.message}`);
    }
  }
  redirect(`/auth/error?error=No token hash or type`);
}
```

### Existing Auth Callback (Different Route)

There IS an existing auth callback at `src/app/auth/callback/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
// ... handles OAuth callbacks
```

This is for OAuth (social login), NOT for email verification. The email verification route is separate.

---

## ISSUE 3: Orphan Users Block Re-registration

**Severity:** High
**File:** Supabase Dashboard → Auth → Users
**Status:** Temporarily fixed by manual deletion, will recur

### What Happened

1. User `vibab43427@heavty.com` signed up on July 3, 2026 via the old client-side `auth.signUp()` (before the signup page was wired to the server action).
2. The email was never confirmed (no verification email was sent, or the user didn't click the link).
3. The user was created in Supabase's `auth.users` table with `email_confirmed_at = NULL`.
4. Later, trying to sign up again with the same email, Supabase returned `email_exists` (422) because the user already exists.
5. The user couldn't sign up again and didn't know their password.

### Temporary Fix

Manually deleted the orphan user from Supabase Dashboard → Auth → Users. Then signup worked again.

### Root Cause

The admin API (`auth.admin.createUser()` with `email_confirm: true`) creates users without proper verification. Even the old client-side `auth.signUp()` can create orphans if the verification email is never sent or never clicked.

### Proper Fix

Use `auth.signUp()` (anon key) which sends a verification email. If the user doesn't verify, they can try again (Supabase handles this — it either resends the verification email or returns a specific error that can be handled).

---

## ISSUE 4: Vercel Environment Variable Mismatch (FIXED)

**Severity:** Critical (was)
**File:** Vercel Dashboard → Settings → Environment Variables
**Status:** RESOLVED

### What Happened

Login and signup on production (`restoloop-owner.vercel.app`) returned "Invalid API key" errors from Supabase.

### Root Cause

`NEXT_PUBLIC_SUPABASE_ANON_KEY` on Vercel was wrong — it didn't match the local `.env.local` value. The key was either truncated, from a different Supabase project, or from an old key rotation.

### How It Was Found

Created a debug route `/api/debug-env` that hashed the env vars and compared local vs production. SHA-256 hashes didn't match for the anon key.

### Fix Applied

Updated the anon key on Vercel to match `.env.local`. Redeployed. Auth started working.

### Bug Report

Full details in `docs/BUG_auth-invalid-api-key-vercel.md`

### Environment Variables (Current, Correct)

**File:** `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=https://oggwcgygkwxywmjdnaef.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nZ3djZ3lna3d4eXdtamRuYWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4Nzc3NDMsImV4cCI6MjA4ODQ1Mzc0M30.ebxsZBU4Zn5lMc8YU35mFLj3r3D7MrIwhgDE3oFq7n4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nZ3djZ3lna3d4eXdtamRuYWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjg3Nzc0MywiZXhwIjoyMDg4NDUzNzQzfQ.mMfcUalFBuGlTfQeJffTc8QWEbivkhG-wCWpq_mqM2k
SUPABASE_DB_PASSWORD=Restoloop@2032
```

These must match on Vercel (Production environment).

---

## ISSUE 5: Login Error Messages

**Severity:** Low
**File:** `src/app/login/page.tsx` (line 20)
**Status:** Partially fixed

### Current Code

```typescript
const { data, error } = await supabase.auth.signInWithPassword({ email, password })
if (error) {
  setError('Invalid email or password')  // ← masked, but minimal
  return
}
```

### What's Wrong

The raw Supabase error is masked to "Invalid email or password". This is better than showing the raw error, but it doesn't distinguish between:
- Wrong password
- User doesn't exist
- Email not confirmed
- Rate limiting
- Network error
- Account suspended

### What Should Happen

Different error messages for different scenarios:
- `invalid_credentials` → "Invalid email or password"
- `email_not_confirmed` → "Please verify your email first"
- `too_many_requests` → "Too many attempts. Try again later."
- Network error → "Connection error. Check your internet."

---

## ISSUE 6: Signup Error Messages

**Severity:** Low
**File:** `src/app/signup/actions.ts` (lines 19-23)
**Status:** Partially fixed

### Current Code

```typescript
if (error) {
  if (error.status === 422 && error.code === 'email_exists') {
    return { error: 'Email already registered. Try logging in instead.' }
  }
  return { error: 'Failed to create account. Please try again.' }
}
```

### What's Wrong

The `email_exists` case is handled specifically, but all other errors get a generic message. Doesn't handle:
- Rate limiting
- Weak password
- Network errors
- Invalid email format

---

## ISSUE 7: Proxy Uses Hardcoded Admin Email

**Severity:** Medium
**File:** `src/proxy.ts` (lines 35-42)
**Status:** Working but fragile

### Current Code

```typescript
// Admin user trying to access merchant dashboard → redirect to /admin
if (user?.email === 'admin@restoloop.com' && path.startsWith('/dashboard')) {
  return NextResponse.redirect(new URL('/admin', request.url))
}

// Non-admin user trying to access /admin → redirect to /dashboard
if (user && user.email !== 'admin@restoloop.com' && path.startsWith('/admin')) {
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

### What's Wrong

1. **Hardcoded email** — Admin check is `user.email === 'admin@restoloop.com'`. If the admin email changes, or if there are multiple admins, this breaks.
2. **No role field** — Should check a `role` column in the `restaurants` table or a separate `users` table instead of comparing email strings.
3. **Login page also hardcodes admin email** — `src/app/login/page.tsx` line 23: `if (data.user?.email === 'admin@restoloop.com')` redirects to `/admin`.

### What Should Happen

Check a `role` field in the database:
```typescript
const { data: restaurant } = await supabase
  .from('restaurants')
  .select('role')
  .eq('owner_id', user.id)
  .single()

if (restaurant?.role === 'superadmin') {
  // redirect to /admin
}
```

---

## ISSUE 8: No Password Reset Flow

**Severity:** Medium
**File:** MISSING
**Status:** Not implemented

### What's Missing

No `/forgot-password` or `/reset-password` routes exist. Users who forget their password have no way to recover their account. They're locked out permanently.

### What's Needed

1. `/forgot-password` page — email input, sends reset link via `supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/reset-password` })`
2. `/reset-password` page — new password input, calls `supabase.auth.updateUser({ password })`
3. Link in login page: "Forgot your password?"

---

## ISSUE 9: No Sign-Out Functionality

**Severity:** Medium
**File:** MISSING (need to verify)
**Status:** Not confirmed

### What to Check

Search the dashboard layout for a sign-out button. The login page has no "Sign out" link. The dashboard may have one in the header/sidebar, but it needs verification.

### What's Needed

A sign-out button that calls:
```typescript
const supabase = createClient()
await supabase.auth.signOut()
router.push('/login')
```

---

## Database Schema (Auth-Related)

### `restaurants` table

**File:** `supabase/migrations/001_initial_schema.sql` (lines 1-17)

```sql
create table restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users not null,  -- ← FK to Supabase Auth users
  name text not null,
  -- ... other columns
);
```

The `owner_id` column references `auth.users(id)`. This is a foreign key to Supabase's auth user table. If the auth system changes, this FK must be updated.

### RLS Policies

**File:** `supabase/migrations/002_rls_policies.sql` (all 60 lines)

All RLS policies use `auth.uid()`:

```sql
-- Restaurants
create policy "Owners can view own restaurants"
  on restaurants for select to authenticated
  using (owner_id = auth.uid());

create policy "Owners can insert own restaurants"
  on restaurants for insert to authenticated
  with check (owner_id = auth.uid());

-- Customers (via restaurants)
create policy "Owners can view customers"
  on customers for select to authenticated
  using (restaurant_id in (select id from restaurants where owner_id = auth.uid()));

-- Coupons (via restaurants)
create policy "Owners can view coupons"
  on coupons for select to authenticated
  using (restaurant_id in (select id from restaurants where owner_id = auth.uid()));
```

`auth.uid()` is a Supabase Auth function that returns the current user's UUID from the JWT token. If the auth system changes, all these policies break.

---

## Files Using Supabase Auth (Complete List)

### Direct Auth Calls

| File | What It Does |
|------|-------------|
| `src/app/signup/actions.ts` | `auth.admin.createUser()` — ISSUE 1 |
| `src/app/login/page.tsx` | `auth.signInWithPassword()` — correct |
| `src/app/auth/callback/route.ts` | OAuth callback — correct |
| `src/proxy.ts` | `auth.getUser()` — correct |
| `src/app/admin/[id]/impersonate/route.ts` | `auth.admin.getUserById()`, `auth.admin.generateLink()` — admin only |
| `src/app/admin/return/route.ts` | `auth.admin.generateLink()` — admin only |

### Supabase Client Usage (Non-Auth)

| File | Client Used |
|------|-------------|
| `src/app/dashboard/customers/actions.ts` | `createClient()` (anon) |
| `src/app/dashboard/coupons/actions.ts` | `createClient()` (anon) |
| `src/app/dashboard/validate/actions.ts` | `createClient()` (anon) |
| `src/app/dashboard/settings/actions.ts` | `createClient()` (anon) |
| `src/app/dashboard/create/actions.ts` | `createClient()` (anon) |
| `src/app/dashboard/campaigns/actions.ts` | `createClient()` (anon) |
| `src/app/form/[slug]/actions.ts` | `createServiceClient()` (service) |
| `src/app/api/whatsapp/route.ts` | `createServiceClient()` (service) |
| `src/app/api/razorpay/create-order/route.ts` | `createClient()` (anon) |
| `src/app/api/razorpay/webhook/route.ts` | `createServiceClient()` (service) |
| `src/lib/campaigns/index.ts` | `createServiceClient()` (service) |

---

## Test Accounts

| Email | Password | Role | Status |
|-------|----------|------|--------|
| admin@restoloop.com | E2E-Admin-Pass-123! | superadmin | Working |
| livecheck2026@restoloop.com | LiveCheck2026! | owner | Working |
| testcreate214241@restoloop.com | (unknown) | owner | Working |
| vibab43427@heavty.com | VibabTest123! | owner | Re-created after orphan delete |

---

## Commands

```bash
pnpm dev          # start dev server (localhost:3000)
pnpm build        # production build
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint (next/core-web-vitals)
pnpm test         # vitest run --passWithNoTests
pnpm test:watch   # vitest watch
pnpm test:e2e     # playwright test
```

---

## Priority Order

1. **ISSUE 1** — Fix signup to use `auth.signUp()` instead of `auth.admin.createUser()`
2. **ISSUE 2** — Add `/auth/confirm` email verification route
3. **ISSUE 3** — Will be fixed by Issues 1+2 (proper signup flow prevents orphans)
4. **ISSUE 7** — Replace hardcoded admin email with DB role check
5. **ISSUE 8** — Add password reset flow
6. **ISSUE 9** — Add sign-out functionality
7. **ISSUE 5** — Improve login error messages
8. **ISSUE 6** — Improve signup error messages
9. **ISSUE 4** — Already fixed
