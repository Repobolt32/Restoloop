# Slice 9: Front Door + QR — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a warm restaurant-themed landing page at `/`, apply the Goodrest POS design system across all existing dashboard/auth/form/admin pages, and add QR code generation to settings.

**Architecture:** Static landing page (Server Component) at `src/app/page.tsx`. UI restyle of existing pages using Goodrest tokens (already in `globals.css`). QR code via `qrcode` library rendered on settings page.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4, `qrcode` + `@types/qrcode` (new), `lucide-react` (new), Supabase.

**Required Skills (load before coding):**
- `tailwind-design-system` — Tailwind v4 patterns
- `frontend-design` + `ui-ux-pro-max` — UI/UX direction (reject old coral/navy)
- `supabase-postgres-best-practices` — DB queries
- `playwright-best-practices` — E2E tests
- `karpathy-guidelines` — code quality
- `server-actions` — if any server actions needed

**Context7 MCP:** Use `context7_resolve-library-id` + `context7_query-docs` for latest docs on: Next.js, Tailwind CSS, Supabase, lucide-react, qrcode, Playwright.

## Global Constraints

- Goodrest POS design system adopted entirely. Tokens already in `globals.css` (`--color-primary: #E11D48`, `--font-display: Inter`, etc.).
- Root layout already uses Inter + Fira Code fonts. Sidebar already has Goodrest styling.
- No chart library. No new services.
- Landing page uses Unsplash URLs for food photography (replace with production photos later).
- CTA buttons: `bg-black hover:bg-gray-800 text-white`. Secondary: `border border-[--color-grey-200]`.
- Typography: uppercase, `tracking-widest`, `font-black` for headers/badges. `font-bold` for body.
- Cards: `bg-white border border-[--color-grey-100] rounded-2xl shadow-md`.

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install qrcode and lucide-react**

```bash
pnpm add qrcode @types/qrcode lucide-react
```

- [ ] **Step 2: Verify types**

```bash
pnpm typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "deps: add qrcode, @types/qrcode, lucide-react for slice 9"
```

---

### Task 2: Landing Page at `/`

**Files:**
- Create: `src/app/page.tsx`

**Interfaces:**
- Consumes: `lucide-react` icons, Unsplash image URLs
- Produces: Static landing page with hero, features, how-it-works, about, CTA, footer

- [ ] **Step 1: Create the landing page**

Create `src/app/page.tsx`:

```tsx
import Link from 'next/link'
import {
  MessageSquare,
  QrCode,
  BarChart3,
  ArrowRight,
  Gift,
  Smartphone,
  Repeat,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[--background] text-[--foreground]">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-600/10 to-emerald-500/5" />
        <nav className="relative max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <span className="text-sm font-black uppercase tracking-[0.2em] text-[--color-primary]">
            Restoloop
          </span>
          <div className="flex gap-4">
            <Link href="/login" className="text-xs font-bold text-[--color-grey-500] hover:text-[--color-grey-800] transition-colors cursor-pointer">
              Log In
            </Link>
            <Link href="/signup" className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer">
              Sign Up Free
            </Link>
          </div>
        </nav>
        <div className="relative max-w-7xl mx-auto px-6 pt-12 pb-24 lg:pb-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-grey-400] mb-4">
                WhatsApp-First Loyalty for Restaurants
              </p>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-[--color-grey-900] mb-6 leading-tight">
                Bring Every Customer Back
              </h1>
              <p className="text-lg text-[--color-grey-500] mb-8 max-w-lg leading-relaxed">
                Automated WhatsApp campaigns that win back lapsed guests, celebrate birthdays, and keep your tables full — without lifting a finger.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/signup"
                  className="bg-black hover:bg-gray-800 text-white px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  Start Free — 1000 Credits
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="border border-[--color-grey-200] px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-[--color-grey-600] hover:bg-[--color-grey-50] transition-colors cursor-pointer"
                >
                  Log In
                </Link>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop"
                alt="Warm restaurant interior with ambient lighting"
                className="rounded-2xl shadow-xl object-cover w-full h-[400px]"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-lg p-4 border border-[--color-grey-100]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Gift className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider">Coupon Sent</p>
                    <p className="text-[10px] text-[--color-grey-400]">W50-ABC123 → +91****4321</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg p-4 border border-[--color-grey-100]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                    <Repeat className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider">Winback Sent</p>
                    <p className="text-[10px] text-[--color-grey-400]">3 customers today</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features / Menu Preview ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-grey-400] mb-2 text-center">
            What You Get
          </p>
          <h2 className="text-2xl font-black tracking-tight text-center mb-4">
            Everything to Keep Tables Full
          </h2>
          <p className="text-sm text-[--color-grey-400] text-center mb-12 max-w-lg mx-auto">
            Three automated campaigns, a smart dashboard, and WhatsApp delivery — all included free.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<MessageSquare className="w-5 h-5" />}
              title="Automated Campaigns"
              description="Welcome reminders at 25 days, birthday wishes, and winback messages at 40 days — all on autopilot."
              badge="3 Campaigns"
            />
            <FeatureCard
              icon={<QrCode className="w-5 h-5" />}
              title="QR Enrollment"
              description="Customers scan a QR code, fill a 30-second form, and join your loyalty club via WhatsApp."
              badge="Instant"
            />
            <FeatureCard
              icon={<BarChart3 className="w-5 h-5" />}
              title="Live Dashboard"
              description="See every guest, coupon, and campaign at a glance. Track redemption rates and active customers."
              badge="Real-Time"
            />
          </div>
        </div>
      </section>

      {/* ── How It Works / Reservation Flow ── */}
      <section className="py-20 bg-[--color-grey-50]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-grey-400] mb-2 text-center">
            How It Works
          </p>
          <h2 className="text-2xl font-black tracking-tight text-center mb-4">
            3 Steps. Zero Hassle.
          </h2>
          <p className="text-sm text-[--color-grey-400] text-center mb-12 max-w-lg mx-auto">
            Set it up once. It runs while you cook.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              icon={<QrCode className="w-6 h-6" />}
              title="Print Your QR"
              description="Generate a QR code from your dashboard. Print it on tables, receipts, or the entrance wall."
            />
            <StepCard
              number="2"
              icon={<Smartphone className="w-6 h-6" />}
              title="Customers Join"
              description="They scan, enter their name and phone, and get a welcome coupon on WhatsApp instantly."
            />
            <StepCard
              number="3"
              icon={<Repeat className="w-6 h-6" />}
              title="They Come Back"
              description="Automated reminders, birthday rewards, and winback offers bring them back month after month."
            />
          </div>
        </div>
      </section>

      {/* ── About / Chef Story ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <img
              src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop"
              alt="Beautifully plated food"
              className="rounded-2xl shadow-xl object-cover w-full h-[400px]"
            />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-grey-400] mb-4">
                Why Restoloop
              </p>
              <h2 className="text-2xl font-black tracking-tight mb-6">
                Built for the Owner Who Does It All
              </h2>
              <p className="text-[--color-grey-500] mb-4 leading-relaxed">
                You cook, you manage, you serve. You don&apos;t have time to chase customers with spreadsheets and manual texts.
              </p>
              <p className="text-[--color-grey-500] mb-8 leading-relaxed">
                Restoloop runs your loyalty on WhatsApp — the app your customers already use. No app to download, no POS to integrate. Set it up in 5 minutes and it works while you work.
              </p>
              <div className="grid grid-cols-3 gap-6">
                <StatBlock value="1000+" label="Free Credits" />
                <StatBlock value="3" label="Auto Campaigns" />
                <StatBlock value="₹0" label="Setup Fees" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-[--color-grey-900]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black tracking-tight text-white mb-4">
            Ready to Bring Them Back?
          </h2>
          <p className="text-[--color-grey-400] mb-8 text-sm">
            Join restaurants using Restoloop to keep their tables full. Start free — no credit card needed.
          </p>
          <Link
            href="/signup"
            className="bg-[--color-primary] hover:bg-[--color-primary-dark] text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 bg-[--color-grey-900] border-t border-[--color-grey-800]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[--color-grey-500]">
            Restoloop — Customer Retention for Restaurants
          </p>
          <div className="flex gap-6">
            <Link href="/login" className="text-[10px] font-bold text-[--color-grey-500] hover:text-white transition-colors cursor-pointer">
              Log In
            </Link>
            <Link href="/signup" className="text-[10px] font-bold text-[--color-grey-500] hover:text-white transition-colors cursor-pointer">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  badge,
}: {
  icon: React.ReactNode
  title: string
  description: string
  badge: string
}) {
  return (
    <div className="bg-[--color-grey-50] rounded-2xl p-6 border border-[--color-grey-100] hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-[--color-primary]/10 text-[--color-primary] rounded-xl flex items-center justify-center">
          {icon}
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-[--color-grey-400] bg-white px-2.5 py-1 rounded-full border border-[--color-grey-100]">
          {badge}
        </span>
      </div>
      <h3 className="text-sm font-black uppercase tracking-wider mb-2">{title}</h3>
      <p className="text-sm text-[--color-grey-500] leading-relaxed">{description}</p>
    </div>
  )
}

function StepCard({
  number,
  icon,
  title,
  description,
}: {
  number: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="text-center">
      <div className="relative inline-block mb-4">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-md border border-[--color-grey-100] flex items-center justify-center text-[--color-primary]">
          {icon}
        </div>
        <span className="absolute -top-2 -right-2 w-6 h-6 bg-[--color-primary] text-white rounded-full flex items-center justify-center text-[10px] font-black">
          {number}
        </span>
      </div>
      <h3 className="text-sm font-black uppercase tracking-wider mb-2">{title}</h3>
      <p className="text-sm text-[--color-grey-500] leading-relaxed max-w-xs mx-auto">{description}</p>
    </div>
  )
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-black text-[--color-primary]">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-wider text-[--color-grey-400]">{label}</p>
    </div>
  )
}
```

- [ ] **Step 2: Verify landing page renders**

```bash
pnpm dev
```

Navigate to `http://localhost:3000`. Expected: landing page with hero (food photo + headline), features (3 cards), how-it-works (3 steps), about (photo + stats), CTA (dark section), footer.

- [ ] **Step 3: Run typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add warm restaurant-themed landing page at /"
```

---

### Task 3: UI Reset — Dashboard Pages

Apply Goodrest POS styling to existing dashboard pages. The CSS tokens are already correct in `globals.css`; this task converts inline styles to Tailwind classes matching the Goodrest type scale and component patterns.

**Key Goodrest patterns:**
- Page title: `text-3xl font-black tracking-tight`
- Section header: `text-sm font-black uppercase tracking-[0.2em]`
- Card: `bg-white border border-[--color-grey-100] rounded-2xl shadow-md p-6`
- Badge: `text-[9px] font-black uppercase tracking-widest rounded-full px-2.5 py-0.5`
- Table header: `text-[10px] font-black uppercase tracking-widest text-[--color-grey-400]`
- Table cell: `text-sm font-bold`
- Empty state: `rounded-[2.5rem] bg-[--color-grey-50] border border-dashed border-[--color-grey-200]`
- Button CTA: `bg-black hover:bg-gray-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest`
- Button secondary: `border border-[--color-grey-200] rounded-xl text-[10px] font-black uppercase tracking-widest`
- Input: `border border-[--color-grey-200] rounded-lg px-4 py-3 text-sm focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10`
- Back link: `text-[10px] font-black uppercase tracking-widest text-[--color-grey-400] hover:text-[--color-primary]`

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/dashboard/customers/page.tsx`
- Modify: `src/app/dashboard/coupons/page.tsx`
- Modify: `src/app/dashboard/validate/page.tsx`
- Modify: `src/app/dashboard/create/page.tsx`
- Modify: `src/app/dashboard/settings/page.tsx`

- [ ] **Step 1: Restyle `dashboard/page.tsx`**

Convert all inline `style={{}}` to Tailwind classes. Key changes:
- `<h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', ... }}>` → `<h1 className="text-3xl font-black tracking-tight text-[--color-grey-900] mb-1">`
- StatCard: `style={{ background: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: '12px', ... }}` → `className="bg-white border border-[--color-grey-100] rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow"`
- StatCard label: `text-[10px] font-black uppercase tracking-[0.2em] text-[--color-grey-400]`
- StatCard value: `text-3xl font-black font-mono text-[--color-primary]`
- QuickNavCard: `className="bg-white border border-[--color-grey-100] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"`
- Credits progress: keep SVG, update wrapper to `bg-white border border-[--color-grey-100] rounded-2xl p-6 shadow-md`
- Activity feed: same card pattern, log items use `text-sm font-bold` and `text-[10px] text-[--color-grey-400]`
- Remove all `fontFamily: 'var(--font-display)'` and `fontFamily: 'var(--font-body)'` — global CSS handles this
- Remove all `var(--color-foreground)` opacity patterns — use `text-[--color-grey-400]` directly

- [ ] **Step 2: Restyle `dashboard/customers/page.tsx`**

Convert inline styles to Tailwind. Key changes:
- `<h1>` → `className="text-3xl font-black tracking-tight text-[--color-grey-900] mb-6"`
- Table wrapper: `className="bg-white border border-[--color-grey-100] rounded-2xl overflow-hidden shadow-md"`
- TH: `className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[--color-grey-400] bg-[--color-grey-50]"`
- TD: `className="px-4 py-3 text-sm font-bold"`
- OptInBadge: update to use `text-[9px] font-black uppercase tracking-widest rounded-full px-2.5 py-0.5`
- Empty state: `className="bg-[--color-grey-50] rounded-[2.5rem] border-2 border-dashed border-[--color-grey-200] p-12 text-center"`
- Remove all inline `style={{}}` objects

- [ ] **Step 3: Restyle `dashboard/coupons/page.tsx`**

Convert inline styles to Tailwind. Key changes:
- Same table/badge patterns as customers page
- Filter chips: `className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors"` with active/inactive variants
- TypeBadge: `text-[9px] font-black uppercase tracking-widest rounded-full px-2.5 py-0.5`
- CouponStatusBadge: same pattern
- Remove hover handlers (use Tailwind `hover:bg-[--color-grey-50]`)

- [ ] **Step 4: Minor updates to `dashboard/validate/page.tsx`**

Already mostly Goodrest. Minor changes:
- Back link: ensure `text-[10px] font-black uppercase tracking-widest`
- Card: ensure `rounded-2xl` (currently `rounded-xl`)
- Button: ensure `bg-[--color-accent]` (already correct)
- Input: ensure `rounded-lg` (already correct)

- [ ] **Step 5: Restyle `dashboard/create/page.tsx`**

Need to read this file first. Apply same card/input/button patterns.

- [ ] **Step 6: Minor updates to `dashboard/settings/page.tsx`**

Already mostly Goodrest. Minor changes:
- Card `rounded-xl` → `rounded-2xl`
- Section headers: ensure `text-[10px] font-black uppercase tracking-widest`
- Back link: ensure uppercase tracking pattern

- [ ] **Step 7: Run typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/app/dashboard/
git commit -m "style: apply Goodrest POS design to dashboard pages"
```

---

### Task 4: UI Reset — Auth, Form, and Admin Pages

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/signup/page.tsx`
- Modify: `src/app/form/[slug]/page.tsx`
- Modify: `src/app/form/[slug]/IntakeForm.tsx`
- Modify: `src/app/admin/page.tsx`
- Modify: `src/app/admin/[id]/page.tsx`
- Modify: `src/app/dashboard/layout.tsx`

- [ ] **Step 1: Restyle `login/page.tsx` and `signup/page.tsx`**

Apply Goodrest auth pattern:
- Background: `min-h-screen bg-[--background] flex items-center justify-center p-4`
- Card: `w-full max-w-md bg-white border border-[--color-grey-100] rounded-2xl p-8 shadow-md`
- Title: `text-2xl font-black tracking-tight text-[--color-grey-900]`
- Input: `border border-[--color-grey-200] rounded-lg px-4 py-3 text-sm focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10`
- CTA button: `bg-black hover:bg-gray-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest py-3`
- Link: `text-[10px] font-bold text-[--color-grey-400] hover:text-[--color-primary]`

- [ ] **Step 2: Restyle form pages (`form/[slug]/page.tsx` + `IntakeForm.tsx`)**

Convert dark theme (slate-900/slate-950) to Goodrest light theme:
- Background: `min-h-screen bg-[--background] flex items-center justify-center p-4`
- Card: `w-full max-w-md bg-white border border-[--color-grey-100] rounded-2xl p-8 shadow-md`
- Title: `text-2xl font-black tracking-tight text-[--color-grey-900]`
- Input: `border border-[--color-grey-200] rounded-lg px-4 py-3 text-sm focus:border-[--color-primary]`
- CTA button: `bg-[--color-primary] hover:bg-[--color-primary-dark] text-white rounded-xl text-[10px] font-black uppercase tracking-widest py-3`
- Success state: green emerald card (already correct pattern)
- WhatsApp button: `bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl`

- [ ] **Step 3: Minor updates to admin pages**

Already use Goodrest tokens. Minor changes:
- `rounded-xl` → `rounded-2xl` on cards
- Ensure uppercase tracking on section headers

- [ ] **Step 4: Verify `dashboard/layout.tsx`**

Already Goodrest. Verify sidebar nav items use `rounded-2xl` and active state uses `shadow-xl shadow-primary/20`. No changes expected.

- [ ] **Step 5: Run typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/login/ src/app/signup/ src/app/form/ src/app/admin/ src/app/dashboard/layout.tsx
git commit -m "style: apply Goodrest POS design to auth, form, and admin pages"
```

---

### Task 5: QR Code on Settings Page

**Files:**
- Modify: `src/app/dashboard/settings/page.tsx`

**Interfaces:**
- Consumes: `qrcode` library `toDataURL` function
- Produces: QR code display + download button on settings page

- [ ] **Step 1: Add QR code section to settings page**

In `src/app/dashboard/settings/page.tsx`, add after the Restaurant Details card:

1. Import `QRCodeSVG` or use `qrcode.toDataURL` in a `useEffect`:

```tsx
import { useEffect, useState } from 'react'
// ... existing imports

// Inside the component, add:
const [qrDataUrl, setQrDataUrl] = useState<string>('')

useEffect(() => {
  if (!restaurant) return
  const formUrl = `${window.location.origin}/form/${restaurant.slug}`
  import('qrcode').then((QRCode) => {
    QRCode.toDataURL(formUrl, {
      width: 256,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).then((url: string) => setQrDataUrl(url))
  })
}, [restaurant])
```

2. Add QR code card after Restaurant Details card:

```tsx
{/* QR Code Card */}
<div className="bg-white border border-[--color-grey-100] rounded-2xl p-8 shadow-md">
  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[--color-grey-400] mb-4">
    Enrollment QR Code
  </h2>
  <p className="text-sm text-[--color-grey-500] mb-6">
    Print this QR code on tables, receipts, or the entrance. Customers scan it to join your loyalty club.
  </p>
  <div className="flex flex-col items-center gap-4">
    {qrDataUrl ? (
      <img
        src={qrDataUrl}
        alt={`QR code for ${restaurant.name} intake form`}
        className="w-48 h-48 rounded-xl border border-[--color-grey-100]"
        data-testid="qr-code-image"
      />
    ) : (
      <div className="w-48 h-48 rounded-xl bg-[--color-grey-50] animate-pulse" />
    )}
    <a
      href={qrDataUrl}
      download={`${restaurant.slug}-qr.png`}
      className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer inline-flex items-center gap-2"
      data-testid="download-qr-btn"
    >
      Download QR Code
    </a>
  </div>
</div>
```

- [ ] **Step 2: Verify QR code renders**

```bash
pnpm dev
```

Navigate to Settings page. Expected: QR code image renders, download button works.

- [ ] **Step 3: Run typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/settings/page.tsx
git commit -m "feat: add QR code generation to settings page"
```

---

### Task 6: E2E Test — Landing Page + QR

**Files:**
- Create: `tests/slice-9.spec.ts`

- [ ] **Step 1: Write E2E test**

Create `tests/slice-9.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Slice 9: Front Door + QR', () => {
  test('Landing page renders with all sections', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Hero section
    await expect(page.getByText('Bring Every Customer Back')).toBeVisible()
    await expect(page.getByText('Start Free — 1000 Credits')).toBeVisible()

    // Features section
    await expect(page.getByText('Automated Campaigns')).toBeVisible()
    await expect(page.getByText('QR Enrollment')).toBeVisible()
    await expect(page.getByText('Live Dashboard')).toBeVisible()

    // How it works
    await expect(page.getByText('3 Steps. Zero Hassle.')).toBeVisible()

    // About section
    await expect(page.getByText('Built for the Owner Who Does It All')).toBeVisible()

    // CTA section
    await expect(page.getByText('Ready to Bring Them Back?')).toBeVisible()
  })

  test('Landing page signup link works', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.getByRole('link', { name: /start free/i }).first().click()
    await expect(page).toHaveURL(/.*signup/)
  })

  test('Landing page login link works', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.getByRole('link', { name: /log in/i }).first().click()
    await expect(page).toHaveURL(/.*login/)
  })
})
```

- [ ] **Step 2: Run E2E test**

```bash
pnpm test:e2e tests/slice-9.spec.ts
```

Expected: All 3 tests PASS

- [ ] **Step 3: Run full typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add tests/slice-9.spec.ts
git commit -m "test: add E2E tests for landing page"
```

---

## Verification Plan

### Automated Tests
```bash
pnpm typecheck && pnpm lint && pnpm test:e2e tests/slice-9.spec.ts
```

### Manual Verification
1. Navigate to `http://localhost:3000` — landing page renders with warm food photography, all 5 sections
2. Click "Start Free" → navigates to `/signup`
3. Navigate to `/dashboard` — pages use Goodrest styling (uppercase headers, rounded-2xl cards, black CTAs)
4. Navigate to `/dashboard/settings` — QR code renders, download works
5. Navigate to `/form/spice-garden` — form uses Goodrest light theme (not dark slate)
6. Navigate to `/admin` — admin pages use Goodrest styling
7. All sidebar nav links work (including campaigns/analytics — they'll 404 until slices 11/13, but the links should be present)

### Commit Summary
1. `deps: add qrcode, @types/qrcode, lucide-react for slice 9`
2. `feat: add warm restaurant-themed landing page at /`
3. `style: apply Goodrest POS design to dashboard pages`
4. `style: apply Goodrest POS design to auth, form, and admin pages`
5. `feat: add QR code generation to settings page`
6. `test: add E2E tests for landing page`
