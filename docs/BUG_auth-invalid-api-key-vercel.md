# Bug Report: "Invalid API key" on Vercel Production

**Date:** 2026-07-06
**Status:** Partially resolved — signup wired to server action, service role key updated on Vercel, redeployed 3x but still failing. Root cause likely Supabase-side project config or key mismatch.

---

## Symptom

Login and signup both fail on `https://restoloop-owner.vercel.app` with "Invalid API" / "Invalid API key" errors from Supabase.

---

## Investigation

### 1. Login page leaked raw Supabase errors

**File:** `src/app/login/page.tsx:20`
- `setError(error.message)` — showed raw Supabase error to the user
- **Fixed:** Changed to `"Invalid email or password"`

### 2. Signup page used client-side auth (anon key), not server action

**File:** `src/app/signup/page.tsx:17-18`
- Called `supabase.auth.signUp()` via browser client (anon key)
- Hit `POST /auth/v1/signup` → 401 `sb-error-code: UNAUTHORIZED_INVALID_API_KEY`
- The server action `signUpUser()` in `actions.ts` existed but was completely unused
- **Fixed:** Wired `page.tsx` to call `signUpUser()` server action, which uses `createServiceClient()` (service role key)

### 3. Signup server action also leaked raw errors

**File:** `src/app/signup/actions.ts:21`
- `return { error: error.message }` — leaked "Invalid API key" to user
- **Fixed:** Changed to `"Failed to create account. Please try again."`

### 4. Service role key was wrong/missing on Vercel

**What I did:**
- Removed `SUPABASE_SERVICE_ROLE_KEY` from Vercel production env
- Re-added it with the correct value from `.env.local`
- Verified the local key works: direct curl to `POST /auth/v1/admin/users` created a user with 200
- Deployed 3x (`vercel --prod --yes`)
- **Still fails** after all 3 deploys

### 5. Anon key may also be wrong on Vercel

- Login (`POST /auth/v1/token?grant_type=password`) returns 401 — this could be either "Invalid login credentials" OR "Invalid API key" (we masked it)
- Signup (`POST /auth/v1/signup`) returned 401 with explicit `sb-error-code: UNAUTHORIZED_INVALID_API_KEY`
- Both use the anon key from `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- The anon key visible in browser request headers MATCHES `.env.local`, yet Supabase still rejects it for `/auth/v1/signup`

### 6. Supabase project ID confirmed

- Production hits: `https://oggwcgygkwxywmjdnaef.supabase.co`
- Local `.env.local` uses same project ID
- URL is NOT the issue

---

## Hypothesis

**Most likely:** The Supabase project (`oggwcgygkwxywmjdnaef`) is either:
- **Paused** (free tier auto-pause after inactivity)
- **Has "Enable Sign Up" turned off** in Authentication → Settings
- **API keys were rotated** after `.env.local` was written (keys in `.env.local` may be stale even though they pass local tests)

**Less likely but possible:**
- Vercel env var propagation delay (though 3 redeploys should have picked it up)
- Supabase project-level IP restrictions blocking Vercel IPs
- Supabase project deleted or moved to a different org

---

## Code Changes Made

| File | Change |
|------|--------|
| `src/app/login/page.tsx:20` | `setError(error.message)` → `setError('Invalid email or password')` |
| `src/app/signup/page.tsx:14-23` | Switched from client-side `supabase.auth.signUp()` to server action `signUpUser()` |
| `src/app/signup/actions.ts:21` | `error.message` → `'Failed to create account. Please try again.'` |
| `src/lib/supabase/client.ts:3-5` | Added guard: throws clear error if env vars are missing |
| `package.json` | Added missing `framer-motion` dependency |

---

## Next Steps

1. **Check Supabase dashboard** — verify project `oggwcgygkwxywmjdnaef` is active (not paused), "Enable Sign Up" is ON
2. **Rotate keys** — generate fresh anon + service role keys from Supabase dashboard and update both in Vercel
3. **Check Vercel env** — verify `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are all set to Production
4. **Test locally against production Supabase** — `pnpm dev` with prod keys to isolate Vercel-specific vs Supabase-specific issue
