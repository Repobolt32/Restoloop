# M001 Roadmap — Restoloop Production Readiness

## Slices by Product Feature

Each slice maps to a feature area from BUSINESS_RULES.md. When an issue comes in, match it to the slice → you know the context, the code, and the status.

---

### S01 — Restaurant Onboarding

**Business Rules:** Section 2.1, 8.2

**What it does:** Owner signs up, creates restaurant profile (name, address, phone, email), system generates unique slug and QR code, owner prints QR codes for the restaurant.

**Code Files:**
- `app/auth/sign-up/page.tsx` + `actions.ts`
- `app/home/restaurant-profile/page.tsx`
- `app/home/restaurant-profile/_components/ProfileForm.tsx`
- `app/home/restaurant-profile/_components/QrFlyerCard.tsx`
- `app/home/restaurant-profile/_components/QrFlyerPrintView.tsx`
- `app/home/restaurant-profile/_actions/update-profile.ts`
- `lib/tenant.ts`
- `lib/slug.ts`

**Status:** ✅ Working

**Known Issues:**
- New tenants get `credits_balance: 0` — campaigns silently skip them forever (fina #32)
- Profile form doesn't expose `tax_cgst`/`tax_sgst` editing

---

### S02 — Customer Intake

**Business Rules:** Section 2.2, 8.1, 8.3

**What it does:** Customer scans QR code, visits public URL (`/form/{slug}`), fills in name, WhatsApp number, birthday (optional), favourite dish (optional). System creates customer record, generates welcome coupon, returns WhatsApp Click-to-Chat URL.

**Code Files:**
- `app/form/[slug]/page.tsx`
- `app/form/[slug]/_components/PublicIntakeForm.tsx`
- `app/api/leads/route.ts`

**Status:** ⚠️ Partial

**Known Issues:**
- `favouriteDish` collected but never stored in DB (fina #31 implied)
- Welcome coupon hardcoded `W50-` — ignores tenant's `coupon_welcome` config
- `visit_count` column referenced but doesn't exist in schema (open #7)
- Hardcoded `+91` phone validation — won't work for international restaurants

---

### S03 — Automated Campaigns

**Business Rules:** Section 2.3, 3.4

**What it does:** Cron job runs daily, processes 3 campaign types per tenant:
- **Welcome Reminder** (15 days): reminder for unredeemed welcome coupons
- **Birthday** (same day): new coupon if birthday matches today
- **Win-back** (45 days inactive): new coupon if customer hasn't visited

**Code Files:**
- `lib/campaigns.ts`
- `app/api/cron/process-campaigns/route.ts`
- `vercel.json` (cron schedule)

**Status:** ⚠️ Partial

**Known Issues:**
- N+1 platform credit RPC calls instead of one batch call (fina #13)
- Race condition on tenant credits during concurrent cron runs (fina #14)
- Sequential `await` in loop — will hit serverless timeout for large restaurants (fina #59)
- Marks messages as `'sent'` even when WA credentials missing (open #8)

---

### S04 — Coupon System

**Business Rules:** Section 3.1, 3.2, 3.3, 2.4

**What it does:** Generates coupon codes (8-char, no I/O/0/1), tracks statuses (sent/redeemed/expired), validates coupons at restaurant, handles deduplication rules.

**Code Files:**
- `lib/coupons.ts`
- `app/api/coupons/validate/route.ts`
- `app/home/coupons/page.tsx`
- `app/home/coupons/coupons-content.tsx`

**Status:** ⚠️ Partial

**Known Issues:**
- Coupon never marked as redeemed — unlimited reuse (open #6)
- Discount shows `%` instead of `₹` (open #10)
- Modulo bias in coupon code generation (fina #26)

---

### S05 — WhatsApp Messaging

**Business Rules:** Section 5.1, 5.2, 5.3

**What it does:** Two channels:
- **Meta Cloud API** — template messages for birthday and win-back coupons
- **3rd Party** (ultramsg/evolution/waha) — free-text messages for welcome reminders
- Welcome coupon uses Click-to-Chat URL (no API call, no credit deduction)

**Code Files:**
- `lib/whatsapp.ts`

**Status:** ❌ Broken

**Known Issues:**
- `sendMetaMessage` ignores `templateName` param — always sends `hello_world` template (open #1)
- Returns `success: true` for simulated sends — credits consumed for phantom messages (open #9)
- `replace('+','')` only removes first `+` sign (fina #25)

---

### S06 — Credit System

**Business Rules:** Section 4.1, 4.2, 4.3, 12

**What it does:** Each tenant has `credits_balance`. Each WhatsApp message costs 1 credit. Credits deducted from both tenant and platform wallet. When credits exhausted, messages blocked. Admin manually adds credits.

**Code Files:**
- `app/admin/_lib/server-actions.ts`
- `supabase/migrations/` (credit columns, RPC functions)

**Status:** ❌ Broken

**Known Issues:**
- `addCredits` has NO auth check — any user can add/remove credits (open #2)
- Platform credits double-update with wrong value (open #3)
- Race condition on credits during concurrent operations (fina #14)

---

### S07 — Dashboard & Analytics

**Business Rules:** Section 9

**What it does:** Overview metrics (customers, coupons, revenue), active customers list, coupon history with filters, restaurant profile settings.

**Code Files:**
- `app/home/page.tsx`
- `app/home/dashboard/page.tsx`
- `app/home/dashboard/dashboard-content.tsx`
- `app/home/customers/page.tsx`
- `app/home/coupons/page.tsx`
- `app/home/coupons/coupons-content.tsx`

**Status:** ⚠️ Partial

**Known Issues:**
- Birthday stats use `'birthday'` but DB stores `'bday'` — always shows 0 (open #20)
- `.limit(50)` makes dashboard stats wrong for large tenants (open #11)
- Retry button is a no-op (open #12)
- Revenue always shows 0 (no revenue tracking)
- Coupons page uses light theme while rest of app is dark (fina frontend)
- Console.log debug statements left in production code (fina #68)

---

### S08 — Admin Panel

**Business Rules:** Section 6.2

**What it does:** Super admin accesses `/admin`, views all restaurants and credit balances, adds credits to tenants, manages platform-wide settings.

**Code Files:**
- `app/admin/page.tsx`
- `app/admin/_components/admin-tenant-table.tsx`
- `app/admin/_components/admin-navigation.tsx`
- `app/admin/layout.tsx`
- `app/admin/_lib/server-actions.ts`

**Status:** ⚠️ Partial

**Known Issues:**
- `addCredits` has no auth check — any logged-in user can call it (open #2)
- Platform credits double-update corrupts balance (open #3)

---

### S09 — Auth, Security & Infrastructure

**Business Rules:** Section 11

**What it does:** Supabase Auth (email/password), RLS on all tables, CSRF protection, CAPTCHA on public forms, tenant data isolation, middleware for auth redirects.

**Code Files:**
- `app/auth/sign-in/page.tsx` + `actions.ts`
- `app/auth/sign-up/page.tsx` + `actions.ts`
- `app/auth/password-reset/page.tsx` + `actions.ts`
- `app/auth/callback/route.ts`
- `app/auth/confirm/route.ts`
- `app/update-password/page.tsx`
- `middleware.ts`
- `lib/supabase/server.ts`
- `lib/supabase/client.ts`
- `lib/restoloop.types.ts`
- `lib/utils.ts`
- `lib/fonts.ts`
- `config/app.config.ts`
- `config/navigation.config.tsx`
- `config/paths.config.ts`
- `config/auth.config.ts`
- `styles/` (all CSS files)
- `components/` (shared UI)
- `__tests__/` (all test files)

**Status:** ⚠️ Partial

**Known Issues:**
- Open redirect in `/auth/confirm` — `next` param not validated (open #4)
- Open redirect in `/auth/callback` (open #5)
- Error details leaked to client via URL param (open #17-19)
- 28+ `as any` casts — missing `lib/database.types.ts` (fina #33)
- `createServiceClient` unnecessarily reads cookies (open #16)
- API routes excluded from middleware — no session refresh (open #15)
- Dead `CustomerForm.tsx` component (fina #31)
- E2E tests all broken — reference old UI text (fina e2e)
- Unused imports across multiple files

---

## How to Use This

### When a new issue comes in:

1. Read the issue description
2. Match it to one of the 9 slices above
3. Add it to that slice's "Known Issues" list
4. You now know: what the feature does, what code is involved, what else is broken in that area

### When fixing a bug:

1. Find which slice it belongs to
2. Read the slice's business rules reference
3. Check other known issues in the same slice (might be related)
4. Fix it, update the slice status

### When adding a feature:

1. Determine which slice it belongs to (or create a new one)
2. Add the feature to the slice description
3. Add code files to the slice's file list

---

*Created: 2026-06-21*
*Source: docs/BUSINESS_RULES.md*
