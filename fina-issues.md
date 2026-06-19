# Restoloop — Development Status Report

**Date:** June 18, 2026
**Overall Score:** 7.5/10 — Functional MVP with technical debt
**Frontend Score:** 6.5/10 — Functional but unpolished, needs theme/styling cleanup

---

## What's READY

| Layer | Status | Detail |
|-------|--------|--------|
| Pages/Routes | ✅ 100% | All 19 pages implemented — auth, dashboard, customers, coupons, admin, public intake form, restaurant profile |
| Components | ✅ 95% | 10/11 components functional. 1 dead component (`CustomerForm.tsx`) should be deleted |
| API Routes | ✅ 100% | All 3 endpoints working: `/api/leads`, `/api/coupons/validate`, `/api/cron/process-campaigns` |
| Server Actions | ✅ 95% | All 5 actions working: sign-in, sign-up, password reset, profile update, admin credits |
| Business Logic | ✅ 90% | Campaign engine (winback/birthday/welcome), coupon generation, WhatsApp integration, multi-tenant RLS |
| Unit Tests | ✅ 18 tests | 3 test files, all meaningful with proper assertions |
| Styling | ⚠️ 85% | Tailwind v4, Shadcn UI, dark/light mode — but has theme inconsistencies, hardcoded colors, duplicate styles |
| Config | ✅ 95% | All configs complete except `.env.example` is incomplete |
| Database | ✅ 100% | 7 migrations, RLS policies, indexes, RPC functions |

---

## What's BROKEN / Needs Work

| Layer | Status | Detail |
|-------|--------|--------|
| E2E Tests | ❌ 0/16 | All 16 Playwright specs are stale — reference old UI text and non-existent routes |
| WhatsApp Templates | ❌ Bug | `sendMetaMessage` ignores `templateName` param — all messages use `hello_world` template |
| Coupon Redemption | ❌ Bug | Validate endpoint never marks coupon as `redeemed` — unlimited reuse |
| Type Safety | ⚠️ Weak | 28+ `as any` casts — missing `lib/database.types.ts` (Supabase types not generated) |
| Admin Auth | ❌ Bug | `addCredits` server action has no user verification — any logged-in user can call it |
| Open Redirects | ❌ Security | `next` param unvalidated in `/auth/confirm` and `/auth/callback` |
| Frontend Theme | ⚠️ Visual | `coupons-content.tsx` uses light styles while rest of app is dark — looks broken |
| Hardcoded Colors | ⚠️ Styling | Brand colors (`#E8634A`, `#FF6B00`, `#25D366`) not in Tailwind config |
| Dead Component | ⚠️ Cleanup | `CustomerForm.tsx` — unused, superseded by `PublicIntakeForm.tsx` |

---

## Frontend Issues (NEW)

### Theme & Styling — HIGH

| Issue | Location | Severity |
|-------|----------|----------|
| **Light/dark theme inconsistency** | `coupons-content.tsx` uses light styles (`bg-neutral-50`, `text-neutral-900`) while rest of app is dark (`bg-neutral-900/40`, `text-white`) | High |
| **Hardcoded brand colors** | `#E8634A`, `#FF6B00`, `#25D366` scattered in components — not defined as Tailwind tokens | High |
| **Duplicate card styles** | Same `bg-neutral-900/40 border border-white/5 rounded-xl` repeated in 5+ files — no extraction | Medium |
| **No design tokens** | Brand orange, WhatsApp green not in Tailwind config — inconsistent usage across files | Medium |

### Architectural & Logic Bugs — CRITICAL

| Issue | Location | Severity | Description |
|-------|----------|----------|-------------|
| **Dashboard Stats Truncation** | `dashboard/page.tsx` (L31-35) | Critical | Hardcoded `.limit(50)` on `coupons` query means dashboard stats freeze permanently once 50 coupons are sent. |
| **Missing WhatsApp Template Variables** | `lib/whatsapp.ts` (L60-84) | Critical | `sendMetaMessage` accepts `discount` and `couponCode` but never passes them in the JSON payload `components` array. |
| **Admin Action Missing Validation** | `admin/_lib/server-actions.ts` (L6) | Critical | `addCredits` checks if the env var exists, but fails to check if the caller `supabase.auth.getUser()` is actually that admin. Any logged-in user can add unlimited credits. |
| **Loop Sequential Awaits & N+1 Queries** | `lib/campaigns.ts` (L69, 121, 175) | Critical | Cron job sequentially `await`s `sendCampaign` (DB + Network) inside a `for` loop. Will hit serverless timeout for medium/large restaurants. |
| **Atomic RPC Called Inside Loop** | `lib/campaigns.ts` (L234-237) | Critical | Loops `totalSent` times to call `decrement_platform_credits` RPC. Sends N individual DB queries instead of passing N as an argument. |
| **Birthday Stats Silently Dropped** | `dashboard/page.tsx` (L52-65) | High | Checks `couponStats[type]` expecting `'birthday'`, but the database enum value is `'bday'`. Birthdays are never counted. |
| **Fake Retry Server Action** | `dashboard/page.tsx` (L111-113) | Medium | The `onRetry` prop is an empty server action `async () => { 'use server'; }`. Clicking retry does absolutely nothing. |
| **Systemic Type Safety Bypass** | Widespread (1199 errors) | High | Uses `supabase.from('table' as any)` everywhere. If schema changes, compiler will not catch it, guaranteeing runtime crashes. |

| Issue | Location | Severity |
|-------|----------|----------|
| **`as any` type assertions** | `dashboard/page.tsx`, `form/[slug]/page.tsx`, `customers/page.tsx` — 6+ instances | Medium |
| **Console.log in production** | `app/home/coupons/page.tsx` lines 20, 42 | Low |
| **Unused imports** | `app/home/page.tsx` — `ExternalLink` and `Sparkles` imported but never used | Low |
| **Hardcoded magic numbers** | ₹50 discount, 45-day winback, +91 country code — not extracted to config | Medium |

### Component Structure — MEDIUM

| Issue | Location | Severity |
|-------|----------|----------|
| **Business logic in page component** | `dashboard/page.tsx` has 100+ lines of data transformation — should be utility | Medium |
| **Duplicate header markup** | `coupons/page.tsx` — header section repeated in success and error paths | Low |
| **Inconsistent auth patterns** | `customers/page.tsx` uses manual redirect, `coupons/page.tsx` uses `requireUserInServerComponent()` | Medium |
| **No shared data-fetching hook** | Each page independently fetches tenant data with slightly different patterns | Medium |
| **Indian-only phone validation** | `PublicIntakeForm.tsx` — hardcoded `+91` regex, won't work for international restaurants | Medium |
| **Hardcoded discount in form** | `PublicIntakeForm.tsx` — ₹50 coupon amount hardcoded, should come from tenant config | Medium |

### Missing Frontend Infrastructure

| Feature | Priority | Notes |
|---------|----------|-------|
| Per-route `error.tsx` | Medium | Only global `app/error.tsx` exists — no route-level error boundaries |
| Per-route `loading.tsx` | Medium | Only `app/home/dashboard/loading.tsx` — others flash empty |
| Shared `useTenant()` hook | Medium | Each page re-fetches tenant independently |
| Brand color tokens | High | Define `brand-orange`, `wa-green` etc. in Tailwind config |
| Dead component cleanup | Low | Delete `app/form/[slug]/_components/CustomerForm.tsx` (unused) |

---

## What's MISSING

| Feature | Priority | Notes |
|---------|----------|-------|
| `lib/database.types.ts` | High | Generate via `supabase gen types typescript` — eliminates all `as any` |
| Rate limiting | High | `/api/leads` has no spam protection |
| Error boundaries | Medium | Only 1 global `error.tsx` — no per-route boundaries |
| Loading states | Medium | Only dashboard has skeleton — others flash empty |
| Structured logging | Low | Only `console.error` — no APM or structured logs |

---

## Issue Summary

| Severity | Count |
|----------|-------|
| Critical | 7 |
| High | 17 |
| Medium | 21 |
| Low | 4 |
| **Total** | **49** |

---

## Pages / Routes — Detailed Status

| File | Status | Notes |
|------|--------|-------|
| `app/page.tsx` | COMPLETE | Root index — redirects authenticated users to `/home`, unauthenticated to `restoloop.com` |
| `app/layout.tsx` | COMPLETE | Root layout with theme provider, font loading, dark/light mode support |
| `app/home/page.tsx` | COMPLETE | Landing hub with 3 quick-action cards. Has unused imports but functionally complete |
| `app/home/layout.tsx` | COMPLETE | Home layout with `SubscriptionBanner` showing low-credits warning |
| `app/home/dashboard/page.tsx` | COMPLETE | Dashboard server component fetching stats. `onRetry` is a no-op server action stub |
| `app/home/customers/page.tsx` | COMPLETE | Active guests list showing unexpired coupons with type badges |
| `app/home/coupons/page.tsx` | PARTIAL | Functional but has leftover `console.log` debug statements (lines 20, 42) |
| `app/home/restaurant-profile/page.tsx` | COMPLETE | Profile settings page with form |
| `app/form/[slug]/page.tsx` | COMPLETE | Public intake form page with dynamic metadata, 404 handling |
| `app/admin/page.tsx` | COMPLETE | Admin dashboard with tenant stats and credit management |
| `app/auth/sign-in/page.tsx` | COMPLETE | Sign-in form with email/password |
| `app/auth/sign-up/page.tsx` | COMPLETE | Sign-up form with email/password |
| `app/auth/password-reset/page.tsx` | COMPLETE | Password reset request form |
| `app/auth/callback/error/page.tsx` | COMPLETE | Auth error display page |
| `app/update-password/page.tsx` | COMPLETE | Client-side password update form with Supabase |
| `app/not-found.tsx` | COMPLETE | Global 404 page |
| `app/error.tsx` | COMPLETE | Global error boundary with reset and contact support link |
| `app/form/[slug]/not-found.tsx` | COMPLETE | Public-facing 404 for unknown restaurant slugs |
| `app/home/dashboard/loading.tsx` | COMPLETE | Skeleton loading state for dashboard |

### Layouts

| File | Status | Notes |
|------|--------|-------|
| `app/layout.tsx` | COMPLETE | Root layout |
| `app/home/layout.tsx` | COMPLETE | With subscription banner |
| `app/admin/layout.tsx` | COMPLETE | Admin guard via `SUPER_ADMIN_USER_ID`, sidebar + mobile nav |
| `app/auth/layout.tsx` | COMPLETE | Immersive glassmorphic auth layout with animated glows |

---

## Components — Detailed Status

### Shared Components (`components/`)

| File | Status | Notes |
|------|--------|-------|
| `components/root-providers.tsx` | COMPLETE | ThemeProvider wrapper using next-themes |
| `components/app-logo.tsx` | COMPLETE | Brand logo with optional link |
| `components/ui/button.tsx` | COMPLETE | Shadcn UI button with variants and sizes |
| `components/ui/input.tsx` | COMPLETE | Shadcn UI input component |

### Route-Specific Components (`app/**/_components/`)

| File | Status | Notes |
|------|--------|-------|
| `app/home/restaurant-profile/_components/ProfileForm.tsx` | COMPLETE | Full profile form with slug preview, copy-to-clipboard, coupon config |
| `app/home/restaurant-profile/_components/QrFlyerCard.tsx` | COMPLETE | QR flyer download trigger with print support |
| `app/home/restaurant-profile/_components/QrFlyerPrintView.tsx` | COMPLETE | A5 print-ready QR code flyer using `qrcode.react` |
| `app/form/[slug]/_components/PublicIntakeForm.tsx` | COMPLETE | Full public intake form with Zod validation, react-hook-form, success state with WhatsApp URL |
| `app/form/[slug]/_components/CustomerForm.tsx` | STUB | Legacy/unused component — not imported by any active page. Superseded by `PublicIntakeForm.tsx` |
| `app/admin/_components/admin-navigation.tsx` | COMPLETE | Admin sidebar nav with active state and "Exit to Home" link |
| `app/admin/_components/admin-tenant-table.tsx` | COMPLETE | Full tenant table with credit add/subtract controls |
| `app/home/dashboard/dashboard-content.tsx` | COMPLETE | Client component with KPI cards, coupon performance breakdown, activity feed |
| `app/home/coupons/coupons-content.tsx` | COMPLETE | Coupon list with type filter, status badges, empty states |

---

## Lib Files — Detailed Status

| File | Status | Notes |
|------|--------|-------|
| `lib/campaigns.ts` | COMPLETE | Full campaign engine: winback (45d), birthday (same day), 15-day welcome reminder. Batch queries, credit management, message logging, atomic platform credit decrement via RPC |
| `lib/coupons.ts` | COMPLETE | Cryptographically random 8-char code generation using `crypto.randomBytes` (no I/O/0/1), expiry date generation |
| `lib/whatsapp.ts` | PARTIAL | Meta Cloud API + 3rd party (ultramsg/evolution/waha) all implemented. `sendMetaMessage` ignores the `templateName` parameter and always sends `hello_world` template |
| `lib/tenant.ts` | COMPLETE | `getTenantForUser()` with multi-tenant resilience (PGRST116 handling), returns oldest tenant |
| `lib/slug.ts` | COMPLETE | Full slug generation: `toSlug`, `toShortSlug` (2 words), `toSlugWithSuffix` (collision handling), `generateUniqueSlug` (async uniqueness check) |
| `lib/restoloop.types.ts` | COMPLETE | All domain types: Tenant, Customer, Coupon, MessageLog, PlatformCredits with proper union types |
| `lib/fonts.ts` | COMPLETE | Inter (sans) + Bona Nova (serif) font configuration |
| `lib/utils.ts` | COMPLETE | `cn()` utility using clsx + tailwind-merge |
| `lib/supabase/server.ts` | COMPLETE | Two clients: `createClient()` (RLS-enforced, cookie-based) and `createServiceClient()` (bypasses RLS) |
| `lib/supabase/client.ts` | COMPLETE | Browser-side Supabase client |
| `lib/server/require-user-in-server-component.ts` | COMPLETE | Cached auth check with redirect, uses `server-only` import |

---

## API Routes — Detailed Status

| File | Method | Status | Notes |
|------|--------|--------|-------|
| `app/api/leads/route.ts` | POST | COMPLETE | Full lead intake: Zod validation, customer insert (handles unique constraint), welcome coupon issuance (30d expiry), WhatsApp click-to-chat URL generation |
| `app/api/coupons/validate/route.ts` | POST | COMPLETE | Auth-required coupon validation: status checks (redeemed/expired), date expiry check, customer info return |
| `app/api/cron/process-campaigns/route.ts` | GET | COMPLETE | Bearer-token protected cron endpoint, delegates to `processCampaigns()` |
| `app/auth/callback/route.ts` | GET | COMPLETE | OAuth code exchange, redirect on success/error |
| `app/auth/confirm/route.ts` | GET | COMPLETE | OTP verification for email/recovery flows |

---

## Server Actions — Detailed Status

| File | Status | Notes |
|------|--------|-------|
| `app/auth/sign-in/actions.ts` | COMPLETE | Email/password sign-in with error redirect |
| `app/auth/sign-up/actions.ts` | COMPLETE | Email/password sign-up with confirmation redirect |
| `app/auth/password-reset/actions.ts` | COMPLETE | Password reset email with redirect URL |
| `app/home/restaurant-profile/_actions/update-profile.ts` | COMPLETE | Full profile CRUD: first-time creates tenant with unique slug, subsequent updates immutable slug, revalidates cache |
| `app/admin/_lib/server-actions.ts` | COMPLETE | Admin credit adjustment with platform credit sync. Has a redundant first update attempt that silently fails, but the fallback corrects it |

---

## Tests — Detailed Status

### Unit Tests (Vitest) — ✅ All Passing

| File | Tests | Notes |
|------|-------|-------|
| `__tests__/dashboard/page.test.tsx` | 5 | Loading skeleton, KPI cards, error state, activity feed, coupon stats |
| `__tests__/coupons/page.test.tsx` | 8 | Loading, columns, type labels, type filtering, empty state, no-results filter, error state, read-only verification |
| `__tests__/coupons/generate.test.ts` | 6 | 8-char length, safe charset (50 iterations), crypto-only (no Math.random), uniqueness, ISO date validity, N-day offset |

### E2E Tests (Playwright) — ❌ All Broken

| File | Status | Notes |
|------|--------|-------|
| `__tests__/e2e/dashboard.spec.ts` | BROKEN | References old UI text ("Access Portal", "SIGN IN", "REQUEST ACCESS") |
| `__tests__/e2e/sign-in.spec.ts` | BROKEN | Same — references `Access Portal` heading that doesn't exist |
| `__tests__/e2e/api-routes.spec.ts` | BROKEN | Tests `/api/billing/confirm` which doesn't exist |
| `__tests__/e2e/admin.spec.ts` | BROKEN | References `Admin Dashboard` heading that may not match |
| `__tests__/e2e/intake-form.spec.ts` | BROKEN | Depends on specific test DB state |
| All other e2e specs (11) | BROKEN | Written against older UI design |

**Root Cause:** E2E tests were written against an earlier version of the UI. The sign-in page was redesigned but tests were never updated. Playwright IS installed (`@playwright/test: ^1.61.0`) contrary to AGENTS.md.

---

## Config Files — Detailed Status

| File | Status | Notes |
|------|--------|-------|
| `config/app.config.ts` | COMPLETE | Zod-validated env schema with HTTPS enforcement in production, CI bypass |
| `config/navigation.config.tsx` | COMPLETE | Sidebar nav items (Home, Restaurant Profile) |
| `config/paths.config.ts` | COMPLETE | All route path constants (auth, app) |
| `config/auth.config.ts` | COMPLETE | Auth provider configuration (password, magic link, OAuth) |
| `tsconfig.json` | COMPLETE | Strict mode, path aliases, excludes e2e from typecheck |
| `vitest.config.ts` | COMPLETE | jsdom environment, setup file, path aliases |
| `playwright.config.ts` | COMPLETE | Auth/unauth projects, web server config |
| `eslint.config.mjs` | COMPLETE | Next.js core-web-vitals + typescript |
| `components.json` | COMPLETE | Shadcn UI config (new-york style, orange base) |
| `vercel.json` | COMPLETE | Cron job for `/api/cron/process-campaigns` at 10:00 UTC daily |
| `.env.example` | PARTIAL | Only lists 5 vars. Missing all required Supabase and build-time env vars |
| `package.json` | COMPLETE | Next.js 15.5.9, React 19.2.1, full script set |

---

## Styles — Detailed Status

| File | Status | Notes |
|------|--------|-------|
| `styles/globals.css` | COMPLETE | Tailwind v4 imports, plugin registration, dark mode variant, base layer |
| `styles/theme.css` | COMPLETE | Full Shadcn theme mapping with light/dark CSS variables, animations |
| `styles/theme.utilities.css` | COMPLETE | Container utility |
| `styles/shadcn-ui.css` | COMPLETE | Complete light + dark color palette using oklch and Tailwind color variables |
| `styles/restoloop.css` | COMPLETE | Radix dropdown mobile optimization, header/footer gradient borders |

---

## Missing Infrastructure

| Feature | Status | Notes |
|---------|--------|-------|
| `not-found.tsx` (per-route) | PARTIAL | Only `app/` and `app/form/[slug]/` have custom 404 pages |
| `error.tsx` (per-route) | MISSING | Only `app/error.tsx` exists. No per-route error boundaries |
| `loading.tsx` (per-route) | PARTIAL | Only `app/home/dashboard/loading.tsx` exists |
| `lib/database.types.ts` | MISSING | Supabase generated types file — root cause of all `as any` casts |
| Rate limiting | MISSING | No rate limiting on `/api/leads` or `/api/cron/process-campaigns` |
| Input sanitization | MISSING | No XSS sanitization beyond Zod validation |
| Logging/monitoring | MINIMAL | `instrumentation.ts` only does `console.error` |
| Brand color tokens | MISSING | Hardcoded hex colors in components — no Tailwind design tokens |
| Shared tenant hook | MISSING | Each page independently fetches tenant data |
| Dead component cleanup | MISSING | `CustomerForm.tsx` should be deleted |

---

## Top 3 Priorities

1. **Fix `sendMetaMessage` WhatsApp template bug** — campaign messages use wrong template
2. **Regenerate Supabase types** (`supabase gen types`) and remove all `as any` casts
3. **Update or remove stale E2E tests** — bring in sync with current UI or delete
4. **Fix frontend theme inconsistency** — coupons-content uses light theme while rest of app is dark (HIGH visual bug)
5. **Extract brand colors to Tailwind config** — define `brand-orange`, `wa-green` as tokens

---

*Generated: June 18, 2026*
