# Open Issues — Restoloop

## Critical

| # | File | Issue |
|---|------|-------|
| 1 | `lib/whatsapp.ts:81` | Template name hardcoded to `"hello_world"`, ignores `templateName` param — all WhatsApp messages use wrong template |
| 2 | `app/admin/_lib/server-actions.ts` | `addCredits` has NO auth check — any user can add/remove credits from any tenant |
| 3 | `app/admin/_lib/server-actions.ts:29-38` | Platform credits double-update with wrong value — corrupts platform balance |
| 4 | `app/auth/confirm/route.ts` | Open redirect — `next` param not validated, attacker can redirect to `evil.com` |
| 5 | `app/auth/callback/route.ts` | Same open redirect vulnerability |
| 6 | `app/api/coupons/validate/route.ts` | Coupon never marked as redeemed — can be reused unlimited times |
| 7 | `app/api/leads/route.ts:39` | Inserts `visit_count: 1` but column doesn't exist in DB schema — customer insert fails |

## High

| # | File | Issue |
|---|------|-------|
| 8 | `lib/campaigns.ts:272` | Marks messages as `'sent'` even when WA credentials missing |
| 9 | `lib/whatsapp.ts:111` | Returns `success: true` for simulated sends — credits consumed for phantom messages |
| 10 | `app/home/coupons/coupons-content.tsx:154` | Discount shows `%` instead of `₹` |
| 11 | `app/home/dashboard/page.tsx:34` | `.limit(50)` makes dashboard stats wrong for large tenants |
| 12 | `app/home/dashboard/page.tsx:151` | Retry button is a no-op (empty server action) |
| 13 | `lib/campaigns.ts:235` | N+1 platform credit RPC calls instead of one batch call |
| 14 | `lib/campaigns.ts:68` | Race condition on tenant credits during concurrent cron runs |
| 15 | `middleware.ts:13` | API routes excluded from middleware — no session refresh |
| 16 | `lib/supabase/server.ts:31` | `createServiceClient` unnecessarily reads cookies |
| 17 | `app/auth/sign-in/actions.ts:14-15` | Error details leaked to client via URL param (`error.message` exposed) |
| 18 | `app/auth/sign-up/actions.ts:14-15` | Same — error details in URL |
| 19 | `app/auth/password-reset/actions.ts:15-16` | Same — error details in URL |
| 20 | `app/home/dashboard/page.tsx:58` | Type mismatch: dashboard uses `'birthday'` but DB stores `'bday'` — birthday stats always 0 |

## Medium

| # | File | Issue |
|---|------|-------|
| 21 | `lib/campaigns.ts:198` | `let` should be `const` |
| 22 | `middleware.ts:22` | `let` should be `const` |
| 23 | `app/api/leads/route.ts:5` | `sendWelcomeMessage` imported but never used |
| 24 | `app/home/layout.tsx:1` | `cookies` imported but never used |
| 25 | `lib/whatsapp.ts:78` | `replace('+','')` only removes first `+` sign |
| 26 | `lib/coupons.ts:17` | Modulo bias in coupon code (256 % 30 ≠ 0) |
| 27 | `lib/slug.ts:39` | `Math.random()` for slug suffix (not security-critical) |
| 28 | `app/home/dashboard/page.tsx:7` | Unnecessary `as any` cast |
| 29 | `app/auth/callback/error/page.tsx:17` | `callback` variable assigned but never used |
| 30 | `lib/campaigns.ts` | Extensive `as any` casts (20+ occurrences) |
| 31 | `app/form/[slug]/_components/CustomerForm.tsx` | Dead code — never imported, should be deleted |
| 32 | `app/home/restaurant-profile/_actions/update-profile.ts:89` | New tenants get `credits_balance: 0` — campaigns silently skip them forever |

---

## Removed (false positives)

| # | Original File | Why Removed |
|---|---------------|-------------|
| 6 | `CustomerForm.tsx:31` | Dead code — never imported. Page uses `PublicIntakeForm` which works correctly |
| 9 | `coupons/page.tsx:44` | `data.map()` is inside try/catch — Supabase returns `[]` not `null`, and catch block handles errors gracefully |
| 27 | `callback/route.ts:17` | `redirect()` from `next/navigation` is valid in route handlers — not a bug |

---

*Last updated: June 18, 2026*
