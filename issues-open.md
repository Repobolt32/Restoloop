# Open Issues — Restoloop

## Critical

| # | File | Issue |
|---|------|-------|
| 1 | `lib/whatsapp.ts:81` | Template name hardcoded to `"hello_world"`, ignores `templateName` param — all WhatsApp messages use wrong template |
| 2 | `app/admin/_lib/server-actions.ts` | `addCredits` has NO auth check — any user can add/remove credits from any tenant |
| 3 | `app/admin/_lib/server-actions.ts:29-38` | Platform credits double-update with wrong value — corrupts platform balance |
| 4 | `app/auth/confirm/route.ts` | Open redirect — `next` param not validated, attacker can redirect to `evil.com` |
| 5 | `app/auth/callback/route.ts` | Same open redirect vulnerability |
| 6 | `app/form/[slug]/_components/CustomerForm.tsx:31` | Sends `slug` to API but API expects `tenantId` (UUID) — form completely broken |

## High

| # | File | Issue |
|---|------|-------|
| 7 | `lib/campaigns.ts:272` | Marks messages as `'sent'` even when WA credentials missing |
| 8 | `lib/whatsapp.ts:111` | Returns `success: true` for simulated sends — credits consumed for phantom messages |
| 9 | `app/home/coupons/page.tsx:44` | Potential null dereference on `data.map()` |
| 10 | `app/home/coupons/coupons-content.tsx:154` | Discount shows `%` instead of `₹` |
| 11 | `app/home/dashboard/page.tsx:34` | `.limit(50)` makes dashboard stats wrong for large tenants |
| 12 | `app/home/dashboard/page.tsx:151` | Retry button is a no-op (empty server action) |
| 13 | `lib/campaigns.ts:235` | N+1 platform credit RPC calls instead of one batch call |
| 14 | `lib/campaigns.ts:68` | Race condition on tenant credits during concurrent cron runs |
| 15 | `app/api/coupons/validate/route.ts` | Coupon never marked as redeemed — can be reused unlimited times |
| 16 | `middleware.ts:13` | API routes excluded from middleware — no session refresh |
| 17 | `lib/supabase/server.ts:31` | `createServiceClient` unnecessarily reads cookies |

## Medium

| # | File | Issue |
|---|------|-------|
| 18 | `lib/campaigns.ts:198` | `let` should be `const` |
| 19 | `middleware.ts:22` | `let` should be `const` |
| 20 | `app/api/leads/route.ts:5` | `sendWelcomeMessage` imported but never used |
| 21 | `app/home/layout.tsx:1` | `cookies` imported but never used |
| 22 | `lib/whatsapp.ts:78` | `replace('+','')` only removes first `+` sign |
| 23 | `lib/coupons.ts:17` | Modulo bias in coupon code (256 % 30 ≠ 0) |
| 24 | `app/form/[slug]/_components/CustomerForm.tsx:70` | Shows "Valid for 7 days" but coupon is valid 30 days |
| 25 | `lib/slug.ts:39` | `Math.random()` for slug suffix (not security-critical) |
| 26 | `app/home/dashboard/page.tsx:7` | Unnecessary `as any` cast |
| 27 | `app/auth/callback/route.ts:17` | `redirect()` used instead of `NextResponse.redirect()` |
| 28 | `app/auth/callback/error/page.tsx:17` | `callback` variable assigned but never used |
| 29 | `lib/campaigns.ts` | Extensive `as any` casts (20+ occurrences) |

---

*Last updated: June 18, 2026*
