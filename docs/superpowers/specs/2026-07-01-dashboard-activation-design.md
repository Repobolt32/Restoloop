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

## Design System (Adopted from Goodrest POS — Complete Replacement)

**The old Restoloop UI is dead.** No Playfair Display SC, no Karla, no warm cream background, no saffron accent, no pink borders. The Goodrest POS design system replaces it entirely. All existing dashboard pages, layout, login, signup, and form pages will be restyled to match.

### Colors

**Brand colors (from Goodrest):**

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#E11D48` | Rose 600 — buttons, accents, badges, active nav |
| `--color-primary-dark` | `#BE123C` | Rose 700 — hover states |
| `--color-primary-light` | `#FB7185` | Rose 400 — light tints |
| `--color-accent` | `#10B981` | Emerald 500 — success, settled badges |
| `--color-accent-dark` | `#059669` | Emerald 600 — accent hover |

**Neutral / Grey palette (slate-*, darkened ~5% for contrast):**

| Token | Hex | Role |
|-------|-----|------|
| `--color-surface` | `#FFFFFF` | Card backgrounds |
| `--color-surface-muted` | `#eef1f5` | Main content bg, table alt rows, empty states |
| `--color-grey-50` | `#eef1f5` | Card wells, toggle bg |
| `--color-grey-100` | `#e4e8ed` | Borders, dividers, sidebar border |
| `--color-grey-200` | `#e2e8f0` | Input borders, skeleton loaders |
| `--color-grey-300` | `#cbd5e1` | Disabled icons, chevrons |
| `--color-grey-400` | `#94a3b8` | Section headers, labels, timestamps |
| `--color-grey-500` | `#64748b` | Secondary text, nav inactive |
| `--color-grey-600` | `#475569` | Table cell text, tags |
| `--color-grey-800` | `#1e293b` | Primary text, headings |
| `--color-grey-900` | `#0f172a` | Darkest text |
| `--background` | `#F8F9FA` | Page background (near-white) |
| `--foreground` | `#0f172a` | Main text color |

**Status colors (bg/text/border triples):**

| Status | Background | Text | Border |
|--------|------------|------|--------|
| sent/success/redeemed | `#DCFCE7` | `#166534` | `#BBF7D0` |
| failed | `#FEE2E2` | `#991B1B` | `#FECACA` |
| pending | `#FEF9C3` | `#854D0E` | `#FDE68A` |
| blocked | `#F3E8FF` | `#6B21A8` | `#E9D5FF` |

**Type badges:**

| Type | Background | Text |
|------|------------|------|
| Welcome | `#DBEAFE` | `#1E40AF` |
| Birthday | `#FEF3C7` | `#92400E` |
| Winback | `#F3E8FF` | `#6B21A8` |
| Expiry | `#FFEDD5` | `#9A3412` |

**Auth/CTA buttons:** `bg-black hover:bg-gray-800 text-white`

### Typography

| Token | Value |
|-------|-------|
| `--font-sans` | `Inter, system-ui, sans-serif` |
| `--font-mono` | `'Fira Code', monospace` |

**Type scale:**
- Page title: `text-3xl font-black tracking-tight`
- Section header: `text-sm font-black uppercase tracking-[0.2em]`
- Card title: `text-sm font-black`
- Card meta: `text-[10px] font-bold`
- Status badge: `text-[9px] font-black uppercase tracking-widest`
- Label (tiny): `text-[9px] font-black uppercase tracking-widest text-slate-400`
- Table header: `text-[10px] font-black uppercase tracking-widest`
- Table cell: `text-sm font-bold` or `text-xs font-bold`
- Button text: `text-[10px] font-black uppercase tracking-widest`

**Key pattern:** Nearly all text is uppercase with wide letter-spacing. Font-black (900) for headers/badges, font-bold (700) for body/data. Mono font for: coupon codes, price amounts, table data.

### Layout

```
+----------------------------------------------+
|  Sidebar (w-72)  |  Main Content             |
|  bg white        |  bg #F8F9FA               |
|  fixed/sticky    |  flex-1                   |
|  border-r        |  max-w-7xl mx-auto        |
|  p-6             |  p-4 md:p-10              |
+----------------------------------------------+
```

### Components

**Glass Card (.glass-card):**
```css
background: white;
border: 1px solid #e4e8ed;
border-radius: 1.5rem;
box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
```

**Toggle Switch (for campaign on/off):**
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
- Sidebar nav items: `rounded-2xl` (16px)
- Empty states: `rounded-[2.5rem]` (40px)

**Icons:** `lucide-react` (20px default). Replaces all inline SVGs.

**Shadows:**
- `shadow-md` — Cards, sidebar elements
- `shadow-xl shadow-primary/20` — Active nav item
- `shadow-xl shadow-slate-200/80` — Dropdowns
- `shadow-2xl shadow-red-500/10` — Popups

**Animations:**
- Page transitions: `opacity: 0->1, y: 10->0`
- Pulse: `animate-pulse` on urgent items
- Spin: `animate-spin` on loading

**Responsive:**
- `< lg`: Sidebar hidden, hamburger menu, stacked layout
- `lg+`: Sidebar sticky, grid layouts
- `sm+`: Status labels visible, side-by-side layouts
- `md+`: Larger padding, header controls spread
- `xl+`: Full table columns visible

### What Gets Killed (Complete UI Replacement)

All existing pages will be restyled to the Goodrest system:

| File | What Changes |
|------|-------------|
| `src/app/globals.css` | All tokens replaced. No Playfair, no Karla, no cream bg, no pink borders. |
| `src/app/layout.tsx` | Google Fonts link: Inter + Fira Code (not Playfair + Karla) |
| `src/app/dashboard/layout.tsx` | Sidebar: white bg, w-72, rounded-2xl nav items, Inter font |
| `src/app/dashboard/page.tsx` | Restyle all cards, stat cards, activity feed |
| `src/app/dashboard/customers/page.tsx` | Restyle table, badges, empty states |
| `src/app/dashboard/coupons/page.tsx` | Restyle table, badges, filter chips |
| `src/app/dashboard/validate/page.tsx` | Restyle form, alerts |
| `src/app/dashboard/create/page.tsx` | Restyle form |
| `src/app/dashboard/settings/page.tsx` | Restyle everything |
| `src/app/login/page.tsx` | Restyle form, bg-black CTA |
| `src/app/signup/page.tsx` | Restyle form, bg-black CTA |
| `src/app/form/[slug]/page.tsx` | Restyle intake form |
| `src/app/admin/page.tsx` | Restyle admin panel |
| `src/app/admin/[id]/page.tsx` | Restyle admin detail |

This UI replacement happens as part of Slice 9 (the first slice built), before any new pages are added.

## Global Constraints

- **Design system:** Goodrest POS design system adopted entirely (see Design System section above). Old Restoloop UI (Playfair, Karla, cream bg, saffron, pink borders) is killed. Applied to `globals.css` + all existing pages in Slice 9.
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
