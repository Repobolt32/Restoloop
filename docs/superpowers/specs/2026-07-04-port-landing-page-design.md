# Port Landing Page — Design Spec

**Date:** 2026-07-04
**Source:** `E:\desktop\The Antigravity\landing page\Landing-page-final` (Vite + React 19 + react-router-dom)
**Target:** `E:\desktop\Restoloop` (Next.js 16 App Router + React 19 + Tailwind CSS v4)

## 1. Goal

Replace the current bare-bones landing page at `/` with the full dark-themed LP the user built. Keep the exact visual identity (dark bg, glass morphism, nebula cursor, Instrument Serif fonts, framer-motion animations) while wiring it into the Next.js SaaS app. The dashboard (`/dashboard/*`) stays light-themed and untouched.

## 2. Architecture

### Approach

**Direct port.** Copy the LP's source files into the Next.js project, adapting only framework boundaries. The LP is a purely static marketing page — no server data, no auth, no API calls. It's entirely client-side rendering with framer-motion animations.

### Component Tree

```
layout.tsx (server — provides fonts + globals.css)
└─ page.tsx (client — `'use client'`, wraps everything in `.landing-theme`)
   ├─ Navbar (client — scroll detection, mobile menu, CTA links)
   ├─ Hero (client — scroll-driven parallax via useScroll/useTransform)
   │  └─ NebulaCanvas (client — canvas + framer-motion spring glow)
   ├─ StatBar (client — fade-in on scroll)
   ├─ HowItWorks (client — 3-step cards with images)
   ├─ Comparison (client — static with/without lists)
   ├─ ROIBlock (client — scale-on-scroll reveal)
   ├─ TestimonialMarquee (client — CSS marquee animation)
   ├─ Pricing (client — 2-tier cards, "Most Popular" badge)
   ├─ FAQ (client — accordion with AnimatePresence)
   └─ Footer (client — links, contact info)
```

Subpages follow the same pattern — each is a standalone client component with its own mini-nav.

```
src/app/about/page.tsx     (client — static content)
src/app/privacy/page.tsx   (client — static content)
src/app/terms/page.tsx     (client — static content)
src/app/contact/page.tsx   (client — static content)
```

### File Mapping

| LP Source | Next.js Destination | Action |
|---|---|---|
| `src/index.css` | `src/app/globals.css` (append) | Merge LP styles scoped under `.landing-theme` |
| `src/App.tsx` | `src/app/page.tsx` | Convert router imports, add `'use client'`, replace image imports |
| `src/components/NebulaCanvas.tsx` | `src/components/landing/NebulaCanvas.tsx` | Extract, add `'use client'` |
| — (new) | `src/components/landing/SubpageNav.tsx` | Shared navbar for subpages |
| `src/pages/About.tsx` | `src/app/about/page.tsx` | Convert router, add `'use client'`, use SubpageNav |
| `src/pages/Privacy.tsx` | `src/app/privacy/page.tsx` | Convert router, add `'use client'`, use SubpageNav |
| `src/pages/Terms.tsx` | `src/app/terms/page.tsx` | Convert router, add `'use client'`, use SubpageNav |
| `src/pages/Contact.tsx` | `src/app/contact/page.tsx` | Convert router, add `'use client'`, use SubpageNav |
| Static images (step2.jpg, qr-code.png, etc.) | `public/landing/` | Copy as-is |

**Skipped LP files** (not imported anywhere in App.tsx): `ScrollReveal.tsx`, `GlowCard.tsx`, `FloatingBadge.tsx`, `SpringReveal.tsx`, `GlobalBackground.tsx`, `ErrorBoundary.tsx`.

**Design fixes applied during port:**
- Subpages originally hardcoded `bg-[#0a0a0a]` on their root div. Normalized to inherit `#000000` from `.landing-theme` (matches the main landing page).
- Subpage navbar extracted as shared `SubpageNav` component (4 pages had identical 15-line navbars).

### Routing

```
GET /              → LandingPage (all sections)
GET /about         → About page
GET /privacy       → Privacy Policy page
GET /terms         → Terms of Service page
GET /contact       → Contact page
```

Existing routes untouched: `/login`, `/signup`, `/auth/*`, `/dashboard/*`, `/admin/*`, `/form/*`, `/api/*`.

## 3. Data Flow

**None.** This is a static marketing page. No server components, no data fetching, no forms, no API calls.

- CTAs are dead links that point to `/signup` or `/login` (auth routes that already exist)
- Contact info in the footer is hardcoded (`ankit@bluetideapp.com`, `+91 7542011085`)
- Pricing is hardcoded — will be updated later when actual billing is integrated
- "Get Started" buttons navigate to `/signup` via `next/link`

## 4. CSS Scoping Strategy

This is the critical design decision. Two design systems must coexist in one CSS file.

**Problem:** Dashboard CSS sets Tailwind v4 `@theme` tokens (light mode: `#FF8C00`, `#F8F9FA` bg, `Inter`, `Poppins`). LP CSS uses a completely different theme (dark: `#DF7656`, `#000000` bg, `Instrument Serif`). Overwriting `@theme` globally would break the dashboard.

**Solution:** Scope LP styles under `.landing-theme` class.

Every LP page wraps its root in `<main className="landing-theme">`. All LP-specific CSS selectors are prefixed with `.landing-theme`. Dashboard pages don't have this class, so they continue using the default light theme.

```css
/* Dashboard (unscoped, global) */
body { background: #F8F9FA; color: #1E1E1E; }
h1, h2, h3 { font-family: 'Poppins'; }

/* Landing (scoped) */
.landing-theme {
  background-color: #000000;
  color: #ffffff;
  font-family: 'Inter';
}
.landing-theme h1, .landing-theme h2, .landing-theme h3 {
  font-family: 'Instrument Serif';
}
.landing-theme .glass-card {
  background: rgba(10,10,10,0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.05);
}
.landing-theme .shimmer { /* gradient text animation */ }
.landing-theme .marquee-content { /* scroll animation */ }
.landing-theme .btn-accent { /* LP-specific accent button */ }
```

What gets scoped:
- `.landing-theme` base (colors, fonts)
- `.shimmer` (hero gradient animation)
- `.glass-card` (dark glass effect — differs from dashboard's `.glass-card`)
- `.glass` (dark glass effect)
- `.btn-accent` (LP's coral #DF7656 button — differs from dashboard's `.btn-accent`)
- `.marquee-container` / `.marquee-content` (testimonial carousel)
- `@keyframes shimmer` (hero text gradient)
- `@keyframes marquee` (testimonial scroll)

What stays global (dashboard already uses these, LP doesn't conflict):
- All `--color-*` tokens (dashboard's light theme)
- All `.badge-*` classes
- All `.dash-*` classes
- All `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.filter-chip`
- All `.toggle-*` classes

## 5. Framework Conversion

### react-router-dom → Next.js

| react-router-dom | Next.js equivalent |
|---|---|
| `<BrowserRouter>` / `<Routes>` / `<Route>` | App Router file-based routing (no code — just folders) |
| `<Link to="/about">` | `<Link href="/about">` from `next/link` |
| `useLocation().pathname` | `usePathname()` from `next/navigation` |
| `<Route path="/" element={<Home />} />` | `src/app/page.tsx` |

### Vite SPA → Next.js App Router

| Vite/React SPA | Next.js App Router |
|---|---|
| `main.tsx` (root render) | `layout.tsx` (root layout) |
| `index.html` (HTML shell) | `layout.tsx` (already exists) |
| `vite.config.ts` (build config) | `next.config.ts` (already exists) |
| Module-scoped images (`import img from './x.jpg'`) | Public dir images (`<img src="/landing/x.jpg">`) |

### Client directives

Every page file needs `'use client'` at the top because they all use:
- `useState` (mobile menu, FAQ accordion, scroll state)
- `useEffect` (scroll listeners, pathname scroll-to-top)
- `framer-motion` hooks (`useScroll`, `useTransform`, `useMotionValue`, `useSpring`, `useAnimationFrame`)
- `usePathname` (client-only hook)

The `NebulaCanvas` component also needs `'use client'` for `useRef`, `useEffect`, canvas operations, and framer-motion spring.

## 6. Font Loading

**Current** (in `layout.tsx`): Inter + Poppins (dashboard)
**After port:** Inter + Poppins + Instrument Serif + Caveat

```
layout.tsx head links:
  Inter:wght@300;400;500;600;700
  Poppins:wght@400;500;600;700
  Instrument+Serif:ital@0;1       ← NEW
  Caveat:wght@400;700              ← NEW
```

Dashboard uses Poppins (headings) + Inter (body) → unchanged.
LP uses Instrument Serif (headings) + Inter (body) + Caveat (display/decoration) → scoped under `.landing-theme`.

## 7. CTAs

| LP Button | Currently does | Wire to |
|---|---|---|
| Nav "Get Started" | Dead button | `/signup` |
| Hero "Start Trial" | Dead button | `/signup` |
| Hero "See how it works" | `#how-it-works` anchor | Keep as hash link |
| Mobile "Get Started Free" | Dead button | `/signup` |
| Pricing "Get started" x2 | Dead button | `/signup` |
| Footer nav links | Hash anchors + router links | Hash anchors + `/about` etc. |

## 8. Dependencies

**Add:** `framer-motion` (already installed in the Next.js project now)

No other new deps. The LP uses `react-router-dom` which is REMOVED (replaced by Next.js built-in routing). `lucide-react` and `tailwindcss` are already present in the SaaS app at compatible versions.

## 9. Error Handling

No data fetching, no API calls, no user input — so there's nothing to error on at the landing page level. If framer-motion fails to load, the page renders static text without animations (graceful degradation inherent in the library).

## 10. Testing

No unit tests needed for a static marketing page. Manual verification checklist:

- [ ] `localhost:3000` renders the dark landing page with all sections
- [ ] Nebula canvas shows stars + cursor glow
- [ ] "Start Trial" / "Get Started" navigate to `/signup`
- [ ] Scroll animations trigger correctly
- [ ] Mobile menu opens/closes
- [ ] FAQ accordion expands/collapses
- [ ] `/about`, `/privacy`, `/terms`, `/contact` all render
- [ ] `/login`, `/signup` and `/dashboard/*` still render with light theme (no CSS leak)
- [ ] TypeScript compiles (`pnpm typecheck`)
- [ ] ESLint passes (`pnpm lint`)

## 11. Constraints

- Must not break dashboard light theme in any way
- Must not change dashboard `.glass-card`, `.btn-accent`, or any `.dash-*` classes
- Must not modify existing `@theme` tokens
- Must not alter auth middleware behavior
- Must not affect Vercel deployment config
