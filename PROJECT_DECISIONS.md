---
name: Product decisions post-competitor research
description: Detailed record of what was decided to build after analyzing 10 competitors and Reddit UX research.
type: project
---

## Date
2026-05-22

## Context
Restoloop is a restaurant customer outreach SaaS. Original frontend was built on a legacy starter kit with sci-fi branding, POS billing, i18n wrappers, and MakerKit patterns. Backend (Supabase schema, cron campaigns, WhatsApp sender) was solid. User wanted complete frontend rebuild inspired by competitor best practices.

## Competitor Research Conducted
Parallel agents researched 10 competitors + Reddit UX patterns:

1. **Reload** (reload.in) — WhatsApp messaging for Indian restaurants
2. **Dotpe** — QR ordering + CRM for restaurants
3. **Rize** — restaurant marketing automation
4. **TableSavo** — table management + CRM
5. **Posist** — restaurant POS + loyalty
6. **Petpooja** — restaurant tech stack
7. **Bikky** — restaurant CRM (US)
8. **Thanx** — loyalty + CRM for restaurants
9. **Square Marketing** — email/SMS campaigns
10. **LoyalTree** — restaurant loyalty platform

Plus: Reddit r/saas, r/webdev UX research on restaurant owner dashboards.

## Decisions Made

### Business Model
- **Paid only.** No free tier. No SMS. No Email. WhatsApp only.
- Pricing: Rs 500 testing pack = 200-300 WhatsApp messages.
- No subscriptions yet. Pay-as-you-go credit packs.

### Scope Locked to 4 Owner Pages
1. **Dashboard** — KPI cards, real stats, campaign performance
2. **Customers** — list/table of all customers with phone, birthday, last visit
3. **Coupons** — read-only list of sent coupons (owner needs visibility into what was sent)
4. **Profile** — restaurant name, address, coupon values, phone, email

Plus **Public Intake Form** at `/form/[slug]` — unauthenticated landing page where customers sign up, get welcome coupon, auto-sent via WhatsApp.

### What Was Destroyed
- POS billing page and API
- Tax config (CGST/SGST) from profile and coupon validation
- i18n wrappers (`withI18n`, `I18nProvider`, locale files)
- `next-sitemap` config
- Sci-fi copy: "Access Portal", "Initialize Account", "SYSTEM: ONLINE", "SECURE PROTOCOL ACTIVE", "Active Instances", "Circulating Value", "Platform Treasury"
- 7xl/9xl typography on auth and admin pages
- Fractal noise SVG overlays, glow effects
- `@kit/*` package dependencies (auth, supabase, i18n)
- All legacy packages deleted from monorepo

### Color Palette Decision
Research showed light-mode card-based UI dominates restaurant SaaS in 2026 (Tasty Station, V0 POS, Behance POS dashboards). RestroBit screenshot confirms: white cards, light gray bg, orange primary.

- **Primary:** `#F97316` (orange) — CTA buttons, active tabs, accents
- **Page bg:** `#F3F4F6` (light gray)
- **Card bg:** `#FFFFFF` (white)
- **Sidebar:** `#FFFFFF` (white)
- **Text:** `#111827` (slate-900) primary, `#6B7280` (gray-500) secondary
- **Border:** `#E5E7EB` (gray-200)
- **Shadow:** `0 1px 3px rgba(0,0,0,0.08)` — minimal
- **Success CTA:** `#22C55E` (green) for redeem/confirm actions
- **Danger:** `#EF4444` (red) for delete/remove

Old coral/navy dark-mode palette abandoned. Not applied anywhere yet.

### Layout Decision
- Left sidebar: 240px, white bg, icon + text nav
- Active nav item: light orange bg `#FFF7ED`, orange text `#F97316`
- Top toolbar: white, breadcrumb left, search center, avatar right
- Content: max-width 1200px, padding 24px
- Three-column layout where needed: content grid + sticky side panel

### Component Patterns
- **White cards**: rounded-lg, minimal shadow, clean borders
- **Category tabs/pills**: horizontal scroll, active tab orange bg + white text
- **Tables**: simple, no zebra striping, light headers, generous cell padding
- **CTA buttons**: orange primary, green for confirm/success, red for danger
- **Badges**: soft pastel pills (blue, pink, yellow, green) for types/tags
- **Forms**: white card container, 2-column grid on desktop, labeled inputs

### Typography Decision
- Inter (system fallback), no custom fonts
- Max heading: text-2xl (admin), text-xl (auth)
- Body: text-sm
- Labels: text-xs, medium weight

### Responsive Decision
- Tablet-first: 768px minimum usable width
- Sidebar collapses to hamburger on mobile
- Cards stack vertically on < 768px
- Tables horizontal scroll on mobile, no card flip

### Auth Decision
- Plain HTML forms, no fancy containers.
- Email + password only. No OAuth for MVP.
- No captcha for now.
- Sign in, Sign up, Password reset, Update password.
- Rebuilt with `@supabase/ssr` + Server Actions. No legacy auth components.

### Dashboard Decision
- 3 KPI cards: Total Customers, Coupons Sent This Month, Credits Remaining
- Simple line chart for message sends over last 30 days (if time permits, otherwise defer)
- Activity feed: recent sends, birthdays today, low credit alert
- No revenue charts (no billing module)

### Active Guests Page Decision
- Shows only customers with active (sent, not expired) coupons
- Top 10, sorted by expiry soonest — restaurant owner needs "who might walk in today"
- Columns: Name, Phone, Coupon Code, Discount, Expires In, Type
- No search needed — small, high-signal list
- Empty state: "No active coupons right now"
- Replaces generic "all customers" table which had low actionability

### Coupons Page Decision
- Read-only list: Code, Type (welcome/bday/winback), Discount, Status, Sent Date, Customer
- Filter by type
- No manual creation — all coupons are auto-generated by cron
- Owner needs visibility into what was sent to whom

### Public Intake Form Decision
- Simple: Name, Phone, Birthday (optional), Favorite Dish (optional)
- Auto-generates welcome coupon
- Sends WhatsApp message with coupon code
- No auth required
- Per-tenant via slug: `/form/[slug]`

## Out of Scope (intentionally deferred)
- OAuth providers
- SMS/Email channels
- Advanced analytics/charts
- Mobile app
- Multi-location per tenant
- Staff/team accounts
- Advanced coupon rules (usage limits, stacking)
- Subscription billing (still pay-per-credit)

## Backend Kept Untouched
- Supabase schema (tenants, customers, coupons, message_log, platform_credits)
- Cron campaign engine (winback 45d, birthday today, welcome reminder 15d)
- Meta Cloud WhatsApp API + 3rd-party fallback
- Credit-based messaging (tenant credits + platform credits)
- Dashboard stats API
- Coupon validation API
- Leads API
- Admin panel (tenant management, credit top-up)

## Next Steps (pending)
1. Wire Dashboard to `/api/dashboard/stats`
2. Build `/home/customers` page
3. Build `/home/coupons` read-only list
4. Apply color palette sitewide
5. Build public intake form improvements (QR code share, copy link)
6. Add error handling and loading states to new pages
7. Test auth flow end-to-end

## Competitor Insight Summary
Best practices from research:
- **Reload**: WhatsApp-first, simple dashboard, no clutter
- **Bikky**: Clean customer table, birthday highlight
- **Thanx**: Simple loyalty metrics, not overwhelming
- **Square**: Card-based dashboard, clear KPIs
- **Common pattern**: Restaurant owners want simple, fast, mobile-friendly. No learning curve.

**Design principle:** "If owner can't understand in 10 seconds, it's wrong." Every feature must justify itself. Default to removing, not adding.
