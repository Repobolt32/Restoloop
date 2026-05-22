# Restoloop MakerKit Obliteration — Design Spec

**Date:** 2026-05-22  
**Scope:** `nextjs-saas-starter-kit-lite/apps/web/`  
**Goal:** Eliminate every `@kit/*` runtime dependency, MakerKit pattern, and sci-fi copy from the frontend. Keep backend, APIs, cron engine, and already-cleaned owner pages untouched.

---

## 1. Context

Restoloop began as a MakerKit Next.js SaaS starter kit. The backend (Supabase schema, cron campaigns, WhatsApp sender, public intake form, dashboard stats API) is solid. The frontend still runs on MakerKit bones: `@kit/auth` components, `@kit/supabase` wrappers, `@kit/i18n` infrastructure, and sci-fi UI copy (`Access Portal`, `SYSTEM: ONLINE`). This spec defines how to replace all of it with first-party Supabase tooling and plain React.

---

## 2. What Stays Untouched

| Area | Files / Reason |
|------|----------------|
| Database schema | `supabase/migrations/20260308_restoloop_v1_schema.sql` |
| Cron campaign engine | `app/api/cron/process-campaigns/route.ts` |
| Dashboard stats API | `app/api/dashboard/stats/route.ts` |
| Coupon validation API | `app/api/coupons/validate/route.ts` |
| Public intake form | `app/form/[slug]/page.tsx`, `CustomerForm.tsx` |
| Owner pages already cleaned | `app/home/page.tsx`, `app/home/dashboard/page.tsx`, `app/home/restaurant-profile/page.tsx` |
| Leads API, admin panel | Any working API routes under `app/api/` |
| `lib/tenant.ts`, `lib/slug.ts`, `lib/restoloop.types.ts` | Restoloop-specific utilities |

---

## 3. What Gets Destroyed

### 3.1 Packages (delete from monorepo)
- `packages/auth` — entire directory
- `packages/supabase` — entire directory
- `packages/i18n` — entire directory

### 3.2 Dependencies (remove from `apps/web/package.json`)
- `@kit/auth`
- `@kit/supabase`
- `@kit/i18n`

### 3.3 Dev-only packages (remove later or re-home)
- `@kit/eslint-config`
- `@kit/prettier-config`
- `@kit/tsconfig`

### 3.4 Patterns to erase
- `withI18n` HOC on every page
- `I18nProvider` in `root-providers.tsx`
- All imports from `@kit/auth/*`, `@kit/supabase/*`, `@kit/i18n/*`
- `common.json` / `auth.json` locale files (or strip to only keys we need)
- `lib/i18n/` directory
- MakerKit auth config `config/auth.config.ts` with 20 OAuth providers
- MakerKit path config `config/paths.config.ts`
- MakerKit navigation config `config/navigation.config.tsx`

### 3.5 Sci-fi copy (replace immediately)
| Old | New |
|-----|-----|
| `Access Portal` | `Sign In` |
| `Initialize Account` | `Create Account` |
| `SYSTEM: ONLINE` | delete |
| `SECURE PROTOCOL ACTIVE` | delete |
| `REQUEST ACCESS` | `Forgot password?` |
| `ACCESS EXISTING PORTAL` | `Already have an account? Sign in` |
| `Active Instances` | `Active Users` |
| `Circulating Value` | `Total Coupons Sent` |
| `Platform Treasury` | `Platform Credits` |
| `[Multi-Tenant Node]` | `[Tenant]` |

---

## 4. Replacement Architecture

### 4.1 New dependency
- `@supabase/ssr` — official Supabase SSR package for Next.js App Router. Replaces all `@kit/supabase` wrappers.

### 4.2 New files (~250 lines total)

```
apps/web/lib/supabase/client.ts      # createBrowserClient
apps/web/lib/supabase/server.ts      # createServerClient with cookies()
apps/web/middleware.ts               # session refresh via createServerClient
apps/web/app/auth/sign-in/actions.ts # server action: signInWithPassword
apps/web/app/auth/sign-up/actions.ts # server action: signUp
apps/web/app/auth/password-reset/actions.ts # server action: resetPasswordForEmail
```

### 4.3 Auth pages (plain React, no MakerKit containers)
- `app/auth/sign-in/page.tsx` — email + password form, calls `sign-in/actions.ts`
- `app/auth/sign-up/page.tsx` — email + password form, calls `sign-up/actions.ts`
- `app/auth/password-reset/page.tsx` — email form, calls `password-reset/actions.ts`
- `app/auth/callback/route.ts` — email confirmation redirect (inline, no `@kit/supabase`)
- `app/update-password/page.tsx` — new password form (inline)

### 4.4 Sidebar auth
- Replace `useSignOut` from `@kit/supabase/hooks/use-sign-out` with direct `supabase.auth.signOut()` + `useRouter()`
- Replace `useUser` from `@kit/supabase/hooks/use-user` with direct `supabase.auth.getUser()` or server-session check

### 4.5 i18n
- Delete `lib/i18n/` directory
- Remove `I18nProvider` from `root-providers.tsx`
- Remove `withI18n` from all pages
- Replace `t('common:key')` calls with plain strings directly in JSX
- Keep `public/locales/en/common.json` only if we want to keep minimal translations, otherwise delete entirely

---

## 5. File Migration Map

| Old (MakerKit) | New (Our Code) |
|----------------|----------------|
| `@kit/auth/sign-in` `SignInMethodsContainer` | `app/auth/sign-in/page.tsx` inline form |
| `@kit/auth/sign-up` `SignUpMethodsContainer` | `app/auth/sign-up/page.tsx` inline form |
| `@kit/auth/password-reset` `PasswordResetRequestContainer` | `app/auth/password-reset/page.tsx` inline form |
| `@kit/auth/password-reset` `UpdatePasswordForm` | `app/update-password/page.tsx` inline form |
| `@kit/auth/shared` `AuthLayoutShell` | Simple wrapper div or `StitchPortal` |
| `@kit/auth/resend-email-link` `ResendAuthLinkForm` | Inline in `app/auth/callback/error/page.tsx` or remove |
| `@kit/supabase/hooks/use-sign-out` | `lib/supabase/client.ts` + `auth.signOut()` |
| `@kit/supabase/hooks/use-user` | `lib/supabase/server.ts` + `auth.getUser()` |
| `@kit/supabase/hooks/use-auth-change-listener` | Remove; Next.js + Supabase SSR handles sessions natively |
| `@kit/supabase/middleware-client` | `middleware.ts` using `createServerClient` from `@supabase/ssr` |
| `@kit/supabase/server-client` | `lib/supabase/server.ts` |
| `@kit/supabase/server-admin-client` | `lib/supabase/server.ts` with service role key |
| `@kit/supabase/require-user` | Inline `const { data: { user } } = await supabase.auth.getUser()` |
| `@kit/i18n/server` `initializeServerI18n` | Delete |
| `@kit/i18n` `createI18nSettings` | Delete |
| `@kit/i18n/provider` `I18nProvider` | Delete from `root-providers.tsx` |
| `lib/i18n/with-i18n.tsx` | Delete |
| `lib/i18n/i18n.resolver.ts` | Delete |
| `lib/i18n/i18n.server.ts` | Delete |
| `lib/i18n/i18n.settings.ts` | Delete |

---

## 6. Build Order

1. **Install** `npm install @supabase/ssr` in `apps/web/`
2. **Create** `lib/supabase/client.ts` and `lib/supabase/server.ts`
3. **Rewrite** `middleware.ts` with `createServerClient`
4. **Rewrite** auth pages:
   - sign-in page + action
   - sign-up page + action
   - password-reset page + action
   - update-password page
   - auth callback route
5. **Fix** `StitchSidebar.tsx` auth hooks (sign-out + user)
6. **Strip** i18n:
   - Delete `lib/i18n/`
   - Remove `I18nProvider` from `root-providers.tsx`
   - Remove `withI18n` from all pages
7. **Clean** copy on auth pages + admin page
8. **Delete** `packages/auth`, `packages/supabase`, `packages/i18n`
9. **Remove** `@kit/auth`, `@kit/supabase`, `@kit/i18n` from `apps/web/package.json`
10. **Remove** from root `package.json` workspace list
11. **Update** `next.config.mjs` `transpilePackages` and `tsconfig.json` extends
12. **Build green** (`pnpm build` in `apps/web`) → done

---

## 7. Rollback Plan

- Do NOT delete `packages/*` until `pnpm build` passes with the new local code.
- Keep a branch (`feat/obliterate-makerkit`) so we can bail out if something breaks.
- If `@supabase/ssr` has an API change, lock the version in `package.json`.

---

## 8. Out of Scope (next session or later)

- Full custom auth UI redesign (shadcn/ui, fancy forms) — this session is structural obliteration only.
- Replacing `@kit/eslint-config`, `@kit/prettier-config`, `@kit/tsconfig` — dev-only, low priority.
- OAuth providers — we only need email+password for Restoloop MVP.
- Deep UI/UX redesign of auth pages — plain forms are enough for now.

---

*Spec self-review: no TBDs, no contradictions, scope is single-session focused on structural elimination. Ready for implementation plan.*
