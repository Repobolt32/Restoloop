# Dashboard Activation — Design Spec

> **Status:** Approved (brainstormed 2026-07-01)
> **Predecessor:** `2026-06-28-restoloop-design.md` (slices 1-8, shipped)
> **Scope:** Slices 9-16. Adds the product layer on top of the working engine.

## Goal

The backend (slices 1-8) is functional: WhatsApp webhook, 3 automated campaigns via cron, coupon generation, credit deduction, Razorpay billing. The dashboard is a sparse shell — no campaign visibility, no QR enrollment, no analytics, no coupon control. This spec adds the product layer that makes the app usable by a restaurant owner.

## Architecture

No new services, no new infrastructure. All slices use existing Next.js App Router + Supabase + Vercel cron stack. Changes are: 1 new static page, 4 new dashboard pages, 1 DB migration (campaign toggle flags + coupon `enabled` column + configurable timing), updates to campaign engine logging, and targeted UI additions to existing pages (settings, customers, dashboard home, webhook handler).

## Tech Stack

Next.js 16 (App Router, Turbopack), Supabase (Postgres + RLS + Auth), Tailwind CSS v4, `qrcode` (new), `lucide-react` (new — replaces inline SVGs). No chart library — CSS/SVG bars only.

## Design System (Merged from Goodrest POS + Restoloop Identity)

Inspired by the Goodrest owner dashboard UI report. Merges Goodrest's clean, data-dense dashboard patterns with Restoloop's warm restaurant identity.

### Colors

| Token | Hex | Source | Notes |
|-------|-----|--------|-------|
| `--color-background` | `#FEF2F2` | Restoloop | Warm rose cream — keep |
| `--color-foreground` | `#450A0A` | Restoloop | Deep maroon — keep |
| `--color-primary` | `#DC2626` | Restoloop | Crimson red — keep |
| `--color-on-primary` | `#FFFFFF` | both | White |
| `--color-secondary` | `#F87171` | Restoloop | Coral — keep |
| `--color-accent` | `#A16207` | Restoloop | Saffron gold CTAs — keep |
| `--color-muted` | `#E6E3E7` | POS | Card wells, subtle bg |
| `--color-border` | `#FECACA` | Restoloop | Soft pink borders — keep |
| `--color-surface` | `#FFFFFF` | Goodrest | Card backgrounds |
| `--color-surface-muted` | `#f8fafc` | Goodrest | Main content bg (replaces old grey) |

**Grey palette (from Goodrest, darkened ~5% for contrast):**

| Token | Hex | Replaces |
|-------|-----|----------|
| `--color-grey-50` | `#eef1f5` | slate-50 `#f8fafc` |
| `--color-grey-100` | `#e4e8ed` | slate-100 `#f1f5f9` |

### Typography

| Token | Value | Source |
|-------|-------|--------|
| `--font-display` | `'Playfair Display SC', serif` | Restoloop — brand identity |
| `--font-body` | `'Karla', sans-serif` | Restoloop — warm feel |
| `--font-mono` | `'Fira Code', monospace` | Goodrest — for codes, IDs, amounts |

**Type scale (from Goodrest):**
- Page title: `text-3xl font-black tracking-tight`
- Section header: `text-sm font-black uppercase tracking-[0.2em]`
- Card title: `text-sm font-black`
- Card meta: `text-[10px] font-bold`
- Status badge: `text-[9px] font-black uppercase tracking-widest`
- Label (tiny): `text-[9px] font-black uppercase tracking-widest text-slate-400`
- Table header: `text-[10px] font-black uppercase tracking-widest`
- Button text: `text-[10px] font-black uppercase tracking-widest`

**Key pattern:** Nearly all labels/headers are uppercase with wide letter-spacing. Font-black (900) for emphasis, font-bold (700) for data.

### Layout

```
┌──────────────────────────────────────────┐
│  Sidebar (w-60)  │  Main Content         │
│  bg #EDEEF0      │  bg #FEF2F2           │
│  sticky           │  flex-1               │
│  border-r         │  max-w-7xl mx-auto    │
│  p-6              │  p-4 md:p-8           │
└──────────────────────────────────────────┘
```

### Components

**Glass Card (from Goodrest):**
```css
background: white;
border: 1px solid var(--color-grey-100);
border-radius: 1rem;
box-shadow: var(--shadow-sm);
```

**Status badges (bg/text/border triple):**
- Sent/success: bg `#DCFCE7`, text `#166534`, border `#BBF7D0`
- Failed: bg `#FEE2E2`, text `#991B1B`, border `#FECACA`
- Pending: bg `#FEF9C3`, text `#854D0E`, border `#FDE68A`
- Blocked: bg `#F3E8FF`, text `#6B21A8`, border `#E9D5FF`

**Type badges:**
- Welcome: bg `#DBEAFE`, text `#1E40AF`
- Birthday: bg `#FEF3C7`, text `#92400E`
- Winback: bg `#F3E8FF`, text `#6B21A8`
- Expiry: bg `#FFEDD5`, text `#9A3412`

**Toggle switch (for campaign on/off, from Goodrest):**
```
w-12 h-6 rounded-full
ON:  bg-green-500
OFF: bg-slate-300
Knob: w-4 h-4 bg-white rounded-full shadow-sm
```

**Border radius:**
- Cards: `rounded-2xl` (16px)
- Badges: `rounded-full`
- Buttons: `rounded-xl` (12px)
- Inputs: `rounded-lg` (8px)
- Sidebar nav items: `rounded-xl`

**Icons:** `lucide-react` (20px default). Replace all inline SVGs.

**Responsive:**
- `< lg`: Sidebar hidden, hamburger menu, stacked layout
- `lg+`: Sidebar sticky, grid layouts
- `md+`: Larger padding, side-by-side layouts

## Slice Map

| Slice | Name | Key Deliverable |
|-------|------|-----------------|
| 9 | Front Door + QR | Landing page at `/` + downloadable QR code on settings |
| 10 | Onboarding Fix | Form marks customer `opted_in`; webhook sends coupon immediately (no YES step) |
| 11 | Campaign Visibility | Fix campaign logging `type` values + new `/dashboard/campaigns` page |
| 12 | Dashboard Upgrade | 4 stat cards + campaign performance summary + rich activity feed |
| 13 | Analytics | New `/dashboard/analytics` page with growth graph + breakdown table + customer health |
| 14 | Coupon Management | Create/disable/delete coupons + editable discount % in settings |
| 15 | Campaign Control + Expiry | Auto-campaign toggles + configurable timing + new expiry reminder campaign |
| 16 | Customer Segments | Filter chips on customers page (New/Active/At-risk/Lapsed/Birthday/Opted out) |

---

## Slice 9: Front Door + QR

### 9.1 Landing Page (`src/app/page.tsx`)

**What:** Static marketing page at root URL (currently 404).

**Sections:**
1. **Hero** — Headline + subheadline + two CTAs: "Get Started" → `/signup`, "Log In" → `/login`
2. **How It Works** — 3 steps: Scan QR → Fill form on WhatsApp → Get coupons automatically
3. **Features** — 3 cards: Automated Campaigns (birthday, winback, expiry reminders), WhatsApp-First (no app download for customers), No POS Needed (works standalone)
4. **Pricing note** — Simple one-liner (₹1 per message credit, pay as you go)
5. **Footer** — Restoloop branding, year

**Constraints:**
- Pure static server component. No DB calls, no auth.
- Use existing design tokens. Color palette overhaul deferred to a later pass — use current tokens for now (Crimson #DC2626, Saffron #A16207, Playfair Display SC headers, Karla body).
- **Reference design:** User will provide a sample design before implementation. Ask for it before starting this slice.
- Mobile-responsive (single column on small screens, grid on md+).

### 9.2 QR Code (on settings page)

**What:** Downloadable QR code that encodes the public form URL.

**Encoded URL:** `{origin}/form/{slug}`

**Customer flow (the enrollment loop):**
1. Customer scans QR → opens `/form/{slug}` in browser
2. Fills: name, phone (with country code), birthday month/day, food preference
3. Clicks "Get WhatsApp Coupon"
4. Form creates customer as `opted_in` + creates welcome coupon + redirects to `wa.me/{whatsapp_number}?text={pre-written message}`
5. Customer taps send on WhatsApp
6. Webhook receives it → bot replies: "Hey {name}! Welcome to {restaurant}. Your coupon: {code}. Valid till {date}."
7. Customer saves coupon

**UI (settings page addition):**
- New section "Enrollment QR Code" on `/dashboard/settings`
- Live QR preview (rendered client-side via `qrcode` npm package — generates to `<canvas>`)
- "Download PNG" button (canvas → blob → download)
- "Print" button (`window.print()` with print CSS — hides everything except QR + restaurant name + "Scan to join")
- Editable pre-filled WhatsApp message text (stored on restaurant row — see Slice 15 migration)

**Tech:**
- `npm install qrcode @types/qrcode`
- QR generation is client-side, deterministic, no backend calls
- Settings page is already a client component — add QR section there

**Files:**
- Modify: `src/app/dashboard/settings/page.tsx` (add QR section)
- Modify: `src/app/form/[slug]/page.tsx` (no change — already renders form)
- Modify: `src/app/form/[slug]/actions.ts` (Slice 10 changes opt_in_status)

---

## Slice 10: Onboarding Fix

### 10.1 Form Submission = Implicit Opt-in

**Current (broken) flow:**
1. Form creates customer as `pending`
2. Customer redirected to WhatsApp, sends message
3. Bot asks "Reply YES to receive coupons"
4. Customer replies YES
5. Bot sends coupon

**Fixed flow:**
1. Form creates customer as `opted_in` + creates welcome coupon
2. Customer redirected to WhatsApp, sends pre-written message
3. Webhook sees customer is `opted_in` → immediately replies with welcome message containing coupon
4. Done. No YES step.

**Edge case — direct WhatsApp message (no form):**
- Someone messages the restaurant's WhatsApp number directly without filling the form
- Webhook creates them as `pending` → asks for YES (current behavior preserved)
- This is the fallback for walk-in customers who don't scan QR

**Files:**
- Modify: `src/app/form/[slug]/actions.ts` — change `opt_in_status: 'pending'` to `opt_in_status: 'opted_in'`
- Modify: `src/app/api/whatsapp/route.ts` — when customer is `opted_in` and sends first message, look up existing welcome coupon and send it immediately (don't ask for YES)

### 10.2 Welcome Message Personalization

**Current message:** `"Welcome! Your coupon code is {code} for ₹{discount} OFF. Reply STOP to opt out."`

**Fixed message:** `"Hey {name}! Welcome to {restaurant}. Your coupon: {code} for ₹{discount} OFF. Valid till {date}. Reply STOP to opt out."`

- Uses customer name from form submission
- Includes expiry date (30 days from creation)
- Friendly, not robotic

---

## Slice 11: Campaign Visibility

### 11.1 Fix Campaign Logging (Bug Fix)

**Current bug:** All 3 campaign functions in `src/lib/campaigns/index.ts` log to `message_logs` with `type: 'campaign'`. Cannot distinguish which campaign fired.

**Fix:**
- `runWelcomeReminders()` → logs as `type: 'welcome_reminder'`
- `runBirthdayCampaigns()` → logs as `type: 'birthday_campaign'`
- `runWinbackCampaigns()` → logs as `type: 'winback_campaign'`
- When a coupon is created/sent, also store `coupon_id` in the log (requires adding `coupon_id` column to `message_logs` — see migration in Slice 15)

**File:** Modify `src/lib/campaigns/index.ts` (3 `type` value changes + coupon_id linking)

### 11.2 New Page: `/dashboard/campaigns`

**What:** Filterable campaign log with summary stats.

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  CAMPAIGNS                                                          │
│  [All] [Welcome] [Birthday] [Winback]                              │
│                                                                     │
│  SUMMARY CARDS                                                      │
│  Sent: 55   Delivered: 52   Failed: 3   Blocked: 0                 │
│  Coupons Created: 55   Redeemed: 15   Redemption Rate: 27%        │
│  Revenue Attributed: ₹570                                         │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Customer        │ Campaign  │ Status  │ Coupon    │ Date     │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │ 9876****10      │ Birthday  │ Sent    │ BDAY30-XM │ Jul 1    │  │
│  │ 9876****25      │ Winback   │ Sent    │ WB20-KL   │ Jul 1    │  │
│  │ 9876****10      │ Welcome   │ Failed  │ —         │ Jun 30   │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

**Tech:**
- Server component
- Queries `message_logs` where `type IN ('welcome_reminder', 'birthday_campaign', 'winback_campaign')` and `restaurant_id` matches
- Filter chips change query param (server-side filtering)
- Summary cards: aggregate counts on the filtered set
- Revenue attributed: `SUM(discount_cents) FROM coupons WHERE status='redeemed' AND type = campaign_type`
- Table: masked phone, campaign type badge, status badge, coupon code (if linked), date

**Files:**
- Create: `src/app/dashboard/campaigns/page.tsx`
- Modify: `src/app/dashboard/layout.tsx` (add "Campaigns" to sidebar nav)

---

## Slice 12: Dashboard Home Upgrade

### 12.1 Four Stat Cards

Replace the current 2 cards (Total Guests, Credits) with 4:

| Card | Value | Subtitle |
|------|-------|----------|
| Total Guests | `count(customers)` | `+X this week` |
| Active (30d) | `count(customers WHERE last_visit_at > now() - 30d OR created_at > now() - 30d)` | `X% active` |
| Coupons Redeemed | `count(coupons WHERE status='redeemed')` | `X% redemption` |
| Revenue Driven | `SUM(discount_cents) FROM coupons WHERE status='redeemed'` | `this month` |

**Queries (all in `dashboard/page.tsx`):**
```sql
-- Total guests + new this week
SELECT count(*) as total,
       count(*) FILTER (WHERE created_at > now() - interval '7 days') as new_this_week
FROM customers WHERE restaurant_id = $1

-- Active (30d)
SELECT count(*) FROM customers
WHERE restaurant_id = $1
  AND (last_visit_at > now() - interval '30 days' OR created_at > now() - interval '30 days')

-- Coupons redeemed + redemption rate + revenue
SELECT count(*) as total,
       count(*) FILTER (WHERE status = 'redeemed') as redeemed,
       COALESCE(SUM(discount_cents) FILTER (WHERE status = 'redeemed'), 0) as revenue
FROM coupons WHERE restaurant_id = $1
```

### 12.2 Campaign Performance Summary

Section below stat cards showing last 30 days:

```
CAMPAIGN PERFORMANCE (Last 30 days)
  Welcome     ████████████ 24 sent    ████ 8 redeemed (33%)   ₹400
  Birthday    ██████ 12 sent          ███ 3 redeemed (25%)    ₹90
  Winback     ███████████ 19 sent     ██ 4 redeemed (21%)     ₹80

[View All Campaigns →]
```

- CSS bar charts (divs with percentage widths — no chart library)
- Each row: campaign type, sent count, redeemed count, redemption rate, revenue
- Links to `/dashboard/campaigns`

### 12.3 Rich Activity Feed

Replace the current 5-item log with a richer feed showing last 10 events:

```
RECENT ACTIVITY
  Rahul Kumar enrolled via WhatsApp            2 min ago
  Coupon WELCOME50-RK4X2 redeemed              1 hour ago
  Birthday campaign sent to Priya Sharma       3 hours ago
  Winback campaign sent to Amit Patel          5 hours ago
  New customer opted in: Amit Patel            1 day ago
```

- Joins `message_logs` with `customers` (for name) and `coupons` (for code)
- Human-readable event descriptions (not raw `type` values)
- Last 10 items

**File:** Modify `src/app/dashboard/page.tsx`

---

## Slice 13: Analytics Page

### 13.1 New Page: `/dashboard/analytics`

**What:** Trends and deeper metrics, separate from campaigns page.

**Sections:**

**1. Customer Growth Graph (last 8 weeks)**
```
CUSTOMER GROWTH (Last 8 weeks)
  Wk 1 ██ (5)
  Wk 2 ███ (8)
  Wk 3 █████ (12)
  Wk 4 ██████ (15)
  Wk 5 ████████ (20)
  Wk 6 █████████ (22)
  Wk 7 ███████████ (28)
  Wk 8 ██████████ (25)
```
- CSS/SVG bar chart (no chart library)
- Query: `SELECT date_trunc('week', created_at), count(*) FROM customers WHERE restaurant_id = $1 GROUP BY 1 ORDER BY 1 DESC LIMIT 8`

**2. Campaign Breakdown Table**
```
┌─────────────┬──────┬──────┬──────────┬──────────┐
│ Type        │ Sent │ Red. │ Red. Rate│ Revenue  │
├─────────────┼──────┼──────┼──────────┼──────────┤
│ Welcome     │  45  │  15  │   33%    │  ₹750    │
│ Birthday    │  12  │   3  │   25%    │  ₹90     │
│ Winback     │  19  │   4  │   21%    │  ₹80     │
└─────────────┴──────┴──────┴──────────┴──────────┘
```
- Per campaign type: sent, redeemed, redemption rate, revenue
- All-time data (not just 30 days)

**3. Customer Health**
```
CUSTOMER HEALTH
  Active (visited <30d):    84 (66%)
  At-risk (30-60d):         25 (20%)
  Lapsed (60d+):            18 (14%)
  Opted out:                 4 (3%)
```
- Segments computed from existing data (no new columns)

**Files:**
- Create: `src/app/dashboard/analytics/page.tsx`
- Modify: `src/app/dashboard/layout.tsx` (add "Analytics" to sidebar nav)

---

## Slice 14: Coupon Management

### 14.1 Editable Discount % (Settings)

**What:** Owner can edit welcome/birthday/winback discount % after restaurant creation.

**UI (settings page addition):**
```
COUPON DISCOUNTS
  Welcome Discount:  [ 50 ] %    [Save]
  Birthday Discount: [ 30 ] %    [Save]
  Winback Discount:  [ 20 ] %    [Save]

  Note: Changes apply to new coupons only.
  Existing coupons keep their discount.
```

**Tech:**
- Server action: `updateDiscounts(formData)` — updates `welcome_discount_cents`, `birthday_discount_cents`, `winback_discount_cents` on restaurant
- Values stored as cents (percentage × 100)

**Files:**
- Modify: `src/app/dashboard/settings/page.tsx` (add discounts section)
- Create: `src/app/dashboard/settings/actions.ts` (server action)

### 14.2 Create Coupon Manually

**What:** Owner can create a coupon for any customer.

**UI (coupons page addition):**
- "Create Coupon" button → inline form (expands at top of page, no modal — simpler, matches existing patterns)
- Fields: Customer (dropdown of restaurant's customers), Type (welcome/birthday/winback), Discount (₹, pre-filled from restaurant's default for that type), Expiry (days, default 30)
- On submit: insert coupon with generated code, status `sent`, `enabled = true`
- Form uses server action, page revalidates after submission

**Files:**
- Modify: `src/app/dashboard/coupons/page.tsx` (add create button + form)
- Create: `src/app/dashboard/coupons/actions.ts` (server action: `createCoupon`)

### 14.3 Disable / Delete Coupons

**What:** Owner can toggle coupon `enabled` flag and delete coupons.

**DB migration:**
```sql
alter table coupons add column enabled boolean not null default true;
```

**UI:**
- Each coupon row gets a toggle (enabled/disabled)
- Each coupon row gets a delete button (with confirm)
- Disabled coupons cannot be redeemed at validation

**Files:**
- Modify: `src/app/dashboard/coupons/page.tsx` (toggle + delete buttons)
- Modify: `src/app/dashboard/validate/actions.ts` (check `enabled` flag — reject if disabled)
- Create: `src/app/dashboard/coupons/actions.ts` (server actions: `toggleCoupon`, `deleteCoupon`)

---

## Slice 15: Campaign Control + Expiry Reminder

### 15.1 DB Migration

```sql
-- Campaign toggles + configurable timing
alter table restaurants
  add column welcome_reminder_enabled boolean not null default true,
  add column birthday_campaign_enabled boolean not null default true,
  add column winback_campaign_enabled boolean not null default true,
  add column expiry_reminder_enabled boolean not null default true,
  add column welcome_reminder_days integer not null default 25,
  add column winback_days integer not null default 40,
  add column expiry_reminder_days integer not null default 1,
  add column whatsapp_prefill_message text default 'Hi, I would like to join your loyalty club!';

-- Coupon enabled flag (for Slice 14)
alter table coupons add column enabled boolean not null default true;

-- Coupon ID linking on message_logs (for campaign visibility)
alter table message_logs add column coupon_id uuid references coupons(id);
```

**File:** Create `supabase/migrations/004_campaign_settings.sql`

### 15.2 Expiry Reminder Campaign

**What:** New campaign that reminds customers 1 day before their coupon expires.

**Logic:**
- Find coupons where `status = 'sent'` and `expires_at` is between now and `expiry_reminder_days` (default 1) days from now
- Customer must be `opted_in`
- Restaurant must have `expiry_reminder_enabled = true`
- Don't send if already reminded for this coupon (check `message_logs` where `type = 'expiry_reminder'` and `coupon_id` matches)
- Deduct 1 credit per send

**Message:** `"Hey {name}, your coupon {code} expires tomorrow! Don't miss out on ₹{discount} OFF at {restaurant}."`

**Files:**
- Modify: `src/lib/campaigns/index.ts` (add `runExpiryReminders()`)
- Modify: `src/app/api/cron/welcome-reminder/route.ts` (call `runExpiryReminders()`)

### 15.3 Campaign Settings UI

**What:** Settings page section for campaign toggles + timing.

```
CAMPAIGN SETTINGS
  Welcome Reminder    [ON/OFF]  Send after [25] days
  Birthday Campaign   [ON/OFF]  (sends on customer's birthday)
  Winback Campaign    [ON/OFF]  Trigger after [40] days inactive
  Expiry Reminder     [ON/OFF]  Send [1] day before expiry
```

**Files:**
- Modify: `src/app/dashboard/settings/page.tsx` (add campaign settings section)
- Modify: `src/app/dashboard/settings/actions.ts` (add `updateCampaignSettings` server action)

### 15.4 Update Campaign Functions

**What:** Each campaign function checks enabled flag + uses configurable days.

- `runWelcomeReminders()`: skip if `welcome_reminder_enabled = false`; use `welcome_reminder_days` instead of hardcoded `25`
- `runBirthdayCampaigns()`: skip if `birthday_campaign_enabled = false`
- `runWinbackCampaigns()`: skip if `winback_campaign_enabled = false`; use `winback_days` instead of hardcoded `40`
- `runExpiryReminders()`: skip if `expiry_reminder_enabled = false`; use `expiry_reminder_days` instead of hardcoded `1`

**File:** Modify `src/lib/campaigns/index.ts`

---

## Slice 16: Customer Segments

### 16.1 Filter Chips on Customers Page

**What:** Add filter chips to `/dashboard/customers` (same pattern as coupons page).

**Segments (computed from existing data):**

| Chip | Filter |
|------|--------|
| All | No filter |
| New | `created_at > now() - 7 days` |
| Active | `last_visit_at > now() - 30 days` OR `created_at > now() - 30 days` |
| At-risk | `last_visit_at` between 30-60 days ago |
| Lapsed | `last_visit_at > 60 days ago` OR `last_visit_at IS NULL` (and created > 60 days ago) |
| Birthday | `birthday_month = current month` |
| Opted out | `opt_in_status = 'opted_out'` |

**UI:**
- Filter chips with count badges: `New (12)`, `Active (84)`, etc.
- Table updates based on selected filter (server-side query param or client-side filter)
- Count badges show how many customers match each segment

**Files:**
- Modify: `src/app/dashboard/customers/page.tsx` (add filter chips + count queries)

---

## Global Constraints

- **Design system:** Merged Goodrest POS + Restoloop identity (see Design System section above). Applied to `globals.css` in Slice 9. All new pages/components follow this system.
- **New dependencies:** `qrcode` + `@types/qrcode` (QR generation), `lucide-react` (icons). No chart library — CSS/SVG bars only.
- **No new services.** All slices use existing Next.js App Router + Supabase + Vercel cron.
- **RLS respected.** All owner-facing queries go through the Supabase SSR client (user-scoped). Campaign cron uses service client (bypasses RLS).
- **Tailwind v4 CSS-native config.** No `tailwind.config.js`. Tokens in `globals.css` `@theme` block.
- **Server components by default.** Client components only where interactivity requires it (settings toggles, coupon create form, QR canvas).
- **Ponytail principle.** Shortest working diff. No abstractions for single use cases. No boilerplate.

## Out of Scope (Deferred)

- WhatsApp conversational AI agent (LLM-powered human-like conversation) — deferred to v1.5
- POS integration — out of scope per PRD
- Referral program — out of scope per PRD
- Feedback/NPS — out of scope per PRD
- Google review automation — out of scope per PRD

## Slice Dependencies

```
Slice 9 (Front Door + QR) → independent
Slice 10 (Onboarding Fix) → depends on Slice 9 QR (form URL)
Slice 11 (Campaign Visibility) → independent (just logging fix + new page)
Slice 12 (Dashboard Upgrade) → benefits from Slice 11 (campaign types fixed)
Slice 13 (Analytics) → benefits from Slice 11 (campaign types fixed)
Slice 14 (Coupon Management) → depends on Slice 15 migration (enabled column)
Slice 15 (Campaign Control + Expiry) → independent (migration + campaign functions)
Slice 16 (Customer Segments) → independent
```

**Suggested build order:** 9 → 10 → 11 → 15 → 14 → 12 → 13 → 16

- 9 and 10 first: fix the front door and enrollment (owner can actually use the app)
- 11 next: fix the data layer so campaign visibility works
- 15 before 14: the migration adds `enabled` column that 14 needs
- 12 and 13 after 11: they depend on correct campaign types for stats
- 16 last: nice-to-have filtering
