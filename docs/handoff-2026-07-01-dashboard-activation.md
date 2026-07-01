# Restoloop Dashboard Activation Handoff — 2026-07-01

> **Session:** Deep design review + spec approval. Next session: write implementation plan for Slice 9, then execute slice by slice.

---

## Where We Are

✅ **Deep code review complete** — Playwright screenshots, all pages tested, competitor analysis reviewed
✅ **Design spec approved** — `docs/superpowers/specs/2026-07-01-dashboard-activation-design.md`
✅ **Goodrest design system adopted** — old Restoloop UI killed entirely
✅ **8 slices defined** — spec covers slices 9-16

❌ **No implementation plan written yet** — doing slice by slice, not all at once
❌ **No code changes started** — only the spec and design system tokens are committed

---

## What Happened This Session

1. **User reported:** "The app looks absolutely useless. No campaigns, no way to do anything. UI is trash."
2. **Spawned explorers** to map the full codebase (dashboard pages, DB schema, API routes, styles)
3. **Playwright tested** the app — confirmed it compiles and runs, but:
   - `/` returns 404 (no landing page)
   - Dashboard works but is sparse (2 stat cards, empty lists)
   - No campaign visibility, no QR code, no analytics, no coupon management
4. **Read competitor findings** (`E:\desktop\skills\findings.md`) — Batao.ai and GoLoyal have campaign builders, analytics, segments, QR codes
5. **Read PRD and design spec** — discovered the app IS designed correctly per spec (automated campaigns, simple dashboard). The issue is the dashboard doesn't expose the working backend.
6. **Identified 6 gaps:** No landing page, no QR, no campaign visibility, no analytics, no campaign toggles, no customer segments
7. **User corrected QR flow:** QR → form → fill data → redirect to WhatsApp → bot sends coupon. No conversational AI (deferred to v1.5).
8. **User corrected campaign/analytics:** Keep them as SEPARATE pages (not merged).
9. **User provided Goodrest POS design system** — wants it adopted entirely, killing old Restoloop UI.
10. **Spec written and approved** — 8 slices, build order 9→10→11→15→14→12→13→16

---

## Locked Decisions

### Design System (from Goodrest POS — COMPLETE REPLACEMENT)

| Token | Value | Replaces |
|-------|-------|----------|
| Primary | `#E11D48` (Rose 600) | `#DC2626` (Crimson) |
| Background | `#F8F9FA` (near-white) | `#FEF2F2` (warm cream) |
| Font body | Inter, system-ui | Karla |
| Font display | Inter (same as body) | Playfair Display SC |
| Font mono | Fira Code | (none) |
| Sidebar bg | `#FFFFFF` | `#EDEEF0` |
| Border | `#e4e8ed` (grey-100) | `#FECACA` (pink) |
| Accent | `#10B981` (Emerald) | `#A16207` (Saffron) |
| Cards | White, `border-grey-100`, `rounded-2xl` | White, pink border, `rounded-xl` |
| Typography | Uppercase, `tracking-widest`, `font-black` | Mixed case, normal weight |
| Icons | `lucide-react` | Inline SVGs |
| CTA buttons | `bg-black hover:bg-gray-800 text-white` | `bg-accent text-white` |

**14 files to restyle in Slice 9:**
- `src/app/globals.css` (all tokens replaced)
- `src/app/layout.tsx` (fonts: Inter + Fira Code)
- `src/app/dashboard/layout.tsx` (sidebar: white bg, w-72, rounded-2xl nav)
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/customers/page.tsx`
- `src/app/dashboard/coupons/page.tsx`
- `src/app/dashboard/validate/page.tsx`
- `src/app/dashboard/create/page.tsx`
- `src/app/dashboard/settings/page.tsx`
- `src/app/login/page.tsx`
- `src/app/signup/page.tsx`
- `src/app/form/[slug]/page.tsx` + `IntakeForm`
- `src/app/admin/page.tsx`
- `src/app/admin/[id]/page.tsx`

### 8 Slices (Build Order: 9→10→11→15→14→12→13→16)

| Slice | Name | What |
|-------|------|------|
| **9** | Front Door + QR | Landing page `/` + UI reset (all 14 files) + QR code on settings + `qrcode`/`lucide-react` deps |
| **10** | Onboarding Fix | Form marks `opted_in` (not pending) + webhook sends coupon immediately (no YES step) |
| **11** | Campaign Visibility | Fix logging types (`welcome_reminder`/`birthday_campaign`/`winback_campaign`) + new `/dashboard/campaigns` page |
| **15** | Campaign Control + Expiry | DB migration (toggles, timing, coupon enabled, whatsapp_prefill_message) + expiry reminder campaign + settings toggles |
| **14** | Coupon Management | Create/disable/delete coupons + editable discount % in settings |
| **12** | Dashboard Upgrade | 4 stat cards + campaign performance summary + rich activity feed |
| **13** | Analytics | New `/dashboard/analytics` page: growth graph + campaign breakdown + customer health |
| **16** | Customer Segments | Filter chips on customers page (New/Active/At-risk/Lapsed/Birthday/Opted out) |

### QR + Onboarding Flow (Final)

```
1. Owner prints QR (from settings)
2. QR encodes: {origin}/form/{slug}
3. Customer scans → opens form
4. Fills: name, phone, birthday, food preference
5. Clicks "Get WhatsApp Coupon"
6. Redirected to wa.me/{number}?text={pre-written message}
7. Customer taps send on WhatsApp
8. Bot replies: "Hey {name}! Welcome to {restaurant}. Your coupon: {code}. Valid till {date}."
9. Done.

Later (1 day before expiry):
10. Bot reminds: "Hey {name}, your coupon {code} expires tomorrow!"
```

**Key fix:** Form creates customer as `opted_in` (not `pending`). Webhook sees `opted_in` → sends coupon immediately. No YES step for form-originated customers. YES flow preserved for direct WhatsApp messages (no form).

### Campaign Logging Fix (Bug)

Current: all 3 campaigns log `type: 'campaign'` — cannot distinguish.
Fixed:
- `runWelcomeReminders()` → `type: 'welcome_reminder'`
- `runBirthdayCampaigns()` → `type: 'birthday_campaign'`
- `runWinbackCampaigns()` → `type: 'winback_campaign'`
- New `runExpiryReminders()` → `type: 'expiry_reminder'`

### DB Migration (Slice 15)

```sql
alter table restaurants
  add column welcome_reminder_enabled boolean not null default true,
  add column birthday_campaign_enabled boolean not null default true,
  add column winback_campaign_enabled boolean not null default true,
  add column expiry_reminder_enabled boolean not null default true,
  add column welcome_reminder_days integer not null default 25,
  add column winback_days integer not null default 40,
  add column expiry_reminder_days integer not null default 1,
  add column whatsapp_prefill_message text default 'Hi, I would like to join your loyalty club!';

alter table coupons add column enabled boolean not null default true;

alter table message_logs add column coupon_id uuid references coupons(id);
```

---

## Current Codebase State

**What works (slices 1-8, shipped):**
- Auth (signup/login) ✅
- Restaurant creation ✅
- WhatsApp webhook (opt-in/out flow) ✅
- 3 automated campaigns via cron (welcome 25d, birthday, winback 40d) ✅
- Coupon generation + validation + redemption ✅
- Razorpay credit top-up ✅
- Admin panel ✅
- Public intake form ✅
- RLS data isolation ✅

**What's broken/missing:**
- 404 on `/` (no landing page)
- Dashboard is sparse (2 stat cards, empty lists)
- No campaign visibility (cron runs blindly)
- No QR code (page says "share your QR code" but there's none)
- No analytics
- No coupon management (create/disable/delete)
- No campaign toggles (can't enable/disable)
- No customer segments
- All 3 campaigns log as same `type: 'campaign'`
- Onboarding requires 2 steps (YES then coupon) instead of 1

**Known test credentials:**
- Email: `iamkumarankit1502@gmail.com`
- Password: `Ankit@2032`
- Restaurant: "Spice Garden" (slug: `spice-garden`, 1000 credits)

---

## What To Do Next

**Approach:** Write implementation plan slice by slice (not all at once).

1. **Start with Slice 9** — write plan, then execute:
   - Install `qrcode`, `@types/qrcode`, `lucide-react`
   - Replace `globals.css` entirely (Goodrest tokens)
   - Update `layout.tsx` fonts (Inter + Fira Code)
   - Restyle all 14 existing pages
   - Create landing page `/`
   - Add QR code to settings

2. **Then Slice 10** — onboarding fix
3. **Then Slice 11** — campaign visibility
4. **Then Slice 15** — migration + campaign control
5. **Then Slice 14** — coupon management
6. **Then Slice 12** — dashboard upgrade
7. **Then Slice 13** — analytics page
8. **Then Slice 16** — customer segments

**For each slice:** Write plan → execute → verify → commit → move to next.

**Landing page design:** User will provide a reference design before Slice 9 implementation. Ask for it first.

---

## Skills to Load Per Slice

| Slice | Skills |
|-------|--------|
| 9 (UI reset + landing + QR) | `frontend-design`, `tailwind-design-system`, `web-design-guidelines`, `playwright-visual-testing` |
| 10 (Onboarding fix) | `server-actions`, `zod` |
| 11 (Campaign visibility) | `server-actions`, `supabase-postgres-best-practices` |
| 15 (Migration + campaign control) | `supabase-postgres-best-practices`, `zod`, `vercel-functions` |
| 14 (Coupon management) | `server-actions`, `zod`, `supabase-postgres-best-practices` |
| 12 (Dashboard upgrade) | `frontend-design`, `supabase-postgres-best-practices` |
| 13 (Analytics) | `frontend-design`, `supabase-postgres-best-practices` |
| 16 (Customer segments) | `frontend-design`, `supabase-postgres-best-practices` |

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `docs/superpowers/specs/2026-07-01-dashboard-activation-design.md` | Approved design spec (slices 9-16) |
| `docs/superpowers/specs/2026-06-28-restoloop-design.md` | Original design spec (slices 1-8) |
| `docs/BUSINESS_RULES.md` | Business requirements |
| `docs/DEVELOPER_GUIDE.md` | Dev reference + 6 known bugs |
| `src/app/globals.css` | Design tokens (to be replaced in Slice 9) |
| `src/app/dashboard/layout.tsx` | Sidebar layout |
| `src/lib/campaigns/index.ts` | Campaign engine (3 campaigns) |
| `src/app/api/whatsapp/route.ts` | WhatsApp webhook |
| `src/app/api/cron/welcome-reminder/route.ts` | Cron endpoint |
| `supabase/migrations/001_initial_schema.sql` | DB schema |
| `supabase/migrations/002_rls_policies.sql` | RLS policies |
| `supabase/migrations/003_deduct_credit.sql` | Credit function |
