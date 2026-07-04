# Port Landing Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the bare-bones landing page at `/` with the dark-themed LP from `Landing-page-final`, wired into Next.js App Router while keeping the dashboard light theme untouched.

**Architecture:** Direct port from Vite SPA to Next.js App Router. All LP CSS is scoped under `.landing-theme` class. LP tokens use `lp-` prefix in `@theme` to avoid conflicts with dashboard tokens. All page components are `'use client'`. No server data, no API calls — purely static marketing pages.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, framer-motion, lucide-react

## Required Skills (load when implementing)

| Skill | When to use |
|-------|-------------|
| `frontend-design` | Design decisions during port, CSS scoping strategy |
| `tailwind-design-system` | Tailwind v4 `@theme` token patterns, CSS-first config |
| `react-best-practices` | `'use client'` boundaries, component patterns |
| `make-interfaces-feel-better` | Animation polish, micro-interactions |
| `framer-motion-animator` (LP project's `.agent/skills/`) | Scroll reveals, spring physics, `AnimatePresence` |

## Global Constraints

- Must not break dashboard light theme in any way
- Must not overwrite existing `--color-*`, `--font-*` tokens  
- Must not modify auth middleware behavior
- Must not affect Vercel deployment config
- All pages render as `'use client'` (framer-motion + hooks)
- `framer-motion` is already installed (verify with `pnpm ls framer-motion`)
- Images sourced from `E:\desktop\The Antigravity\landing page\Landing-page-final\`
- Existing routes `/login`, `/signup`, `/dashboard/*`, `/admin/*`, `/form/*`, `/api/*` untouched

## Token Renaming Map

LP defines Tailwind v4 `@theme` tokens that conflict with Restoloop's. All LP tokens get `lp-` prefix:

| LP token | Renamed to | Used in |
|----------|-----------|---------|
| `--color-accent: #DF7656` | `--color-lp-accent: #DF7656` | `bg-lp-accent`, `text-lp-accent`, `shadow-lp-accent/20`, `border-lp-accent/30` |
| `--color-bg: #000000` | `--color-lp-bg: #000000` | Base page backgrounds |
| `--color-card: #0A0A0A` | `--color-lp-card: #0A0A0A` | `bg-lp-card/50` in scoped `.glass-card` |
| `--font-serif: "Instrument Serif"` | `--font-lp-serif: "Instrument Serif", serif` | `font-lp-serif` on h1, h2, h3 within `.landing-theme` |
| `--font-display: "Caveat"` | `--font-lp-display: "Caveat", cursive` | Not used in current components (available if needed) |
| `--font-sans: "Inter"` | Use existing `--font-body` | Already "Inter" in Restoloop — no token needed |

**No changes needed for:** `from-orange-500`, `to-red-600`, `text-white`, `bg-black`, `bg-green-500`, `bg-white/5`, `text-white/40`, `border-white/5` — these are built-in Tailwind colors and are only used inside LP components.

---

### Task 1: Install framer-motion, add fonts, create directories

**Files:**
- Modify: `src/app/layout.tsx` (add font links)
- Modify: `package.json` (verify/add framer-motion)

- [ ] **Step 1: Verify framer-motion is installed**

```bash
pnpm ls framer-motion
```
Expected: `framer-motion` listed with version. If not found, run `pnpm add framer-motion`.

- [ ] **Step 2: Add Instrument Serif and Caveat font links to layout.tsx**

Read `src/app/layout.tsx:10-12` — replace the Google Fonts link with one that includes all four fonts.

Replace:
```html
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

With:
```html
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=Caveat:wght@400;700&display=swap"
  rel="stylesheet"
/>
```

- [ ] **Step 3: Create component directory**

```bash
mkdir -p src/components/landing
```

- [ ] **Step 4: Create image directory and copy LP images**

```bash
mkdir -p public/landing
cp "E:\desktop\The Antigravity\landing page\Landing-page-final\src\step2.jpg" public/landing/step2.jpg
cp "E:\desktop\The Antigravity\landing page\Landing-page-final\src\qr-code.png" public/landing/qr-code.png
cp "E:\desktop\The Antigravity\landing page\Landing-page-final\src\whatsapp-icon.png" public/landing/whatsapp-icon.png
```

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx public/landing/ src/components/landing/
git commit -m "chore: add landing page fonts, images directory, framer-motion dep"
```

---

### Task 2: Add LP CSS tokens and scoped styles to globals.css

**Files:**
- Modify: `src/app/globals.css` (append LP tokens and scoped styles at the end)

**Interfaces:**
- Produces: CSS tokens `--color-lp-accent`, `--color-lp-bg`, `--color-lp-card`, `--font-lp-serif`, `--font-lp-display`
- Produces: Scoped classes `.landing-theme`, `.landing-theme .glass-card`, `.landing-theme .glass`, `.landing-theme .shimmer`, `.landing-theme .btn-accent`, `.landing-theme .btn-whatsapp`, `.landing-theme .marquee-container`, `.landing-theme .marquee-content`, `.landing-theme .animate-lp-pulse`
- Produces: `@keyframes shimmer`, `@keyframes marquee`, `@keyframes lp-pulse-soft`

- [ ] **Step 1: Append LP theme tokens to globals.css**

Add to the end of `src/app/globals.css`, INSIDE the existing `@theme` block (at line 61, before the closing `}`):

```css
  /* Landing Page Tokens — scoped via .landing-theme + lp- prefix */
  --color-lp-accent: #DF7656;
  --color-lp-bg: #000000;
  --color-lp-card: #0A0A0A;
  --font-lp-serif: "Instrument Serif", serif;
  --font-lp-display: "Caveat", cursive;
```

Place these inside the `@theme { ... }` block, after the existing `--animate-fade-in` definition but before the closing `}`.

- [ ] **Step 2: Append LP scoped styles and keyframes to globals.css**

Add the following block to the very end of `src/app/globals.css` (after line 453):

```css
/* ============================================
   Landing Page Theme — scoped under .landing-theme
   ============================================ */

.landing-theme {
  background-color: var(--color-lp-bg);
  color: #ffffff;
  font-family: var(--font-body);
}

.landing-theme h1,
.landing-theme h2,
.landing-theme h3,
.landing-theme h4 {
  font-family: var(--font-lp-serif);
}

/* Glass effects — dark theme variants */
.landing-theme .glass-card {
  background: rgba(10, 10, 10, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.landing-theme .glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* LP-specific accent button */
.landing-theme .btn-accent {
  background: var(--color-lp-accent);
  color: white;
  transition: all 0.3s;
  box-shadow: 0 0 24px rgba(223, 118, 86, 0.3);
  border: 1px solid rgba(223, 118, 86, 0.2);
}
.landing-theme .btn-accent:hover {
  box-shadow: 0 0 32px rgba(223, 118, 86, 0.5);
  transform: scale(1.05);
}

/* LP-specific WhatsApp button */
.landing-theme .btn-whatsapp {
  background: #25d97f;
  box-shadow: 0 0 24px rgba(37, 217, 127, 0.45);
  border: 1px solid rgba(37, 217, 127, 0.4);
  color: white;
  transition: all 0.3s;
}
.landing-theme .btn-whatsapp:hover {
  box-shadow: 0 0 32px rgba(37, 217, 127, 0.6);
  transform: scale(1.05);
}

/* Shimmer text animation for hero */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.landing-theme .shimmer {
  background: linear-gradient(90deg, #DF7656 0%, #ffffff 50%, #DF7656 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 3s linear infinite;
}

/* Testimonial marquee */
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

@keyframes lp-pulse-soft {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

.landing-theme .marquee-container {
  display: flex;
  overflow: hidden;
  user-select: none;
  gap: 24px;
}
.landing-theme .marquee-content {
  flex-shrink: 0;
  display: flex;
  justify-content: space-around;
  gap: 24px;
  min-width: 100%;
  animation: marquee 40s linear infinite;
}
.landing-theme .marquee-container:hover .marquee-content {
  animation-play-state: paused;
}

/* LP pulse animation (softer than Tailwind's default) */
.landing-theme .animate-lp-pulse {
  animation: lp-pulse-soft 2s infinite ease-in-out;
}

/* LP scrollbar overrides */
.landing-theme ::-webkit-scrollbar { width: 8px; }
.landing-theme ::-webkit-scrollbar-track { background: #0A0A0A; }
.landing-theme ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
.landing-theme ::-webkit-scrollbar-thumb:hover { background: #444; }
```

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add LP CSS tokens and scoped landing page styles"
```

---

### Task 3: Create shared SubpageNav component

**Files:**
- Create: `src/components/landing/SubpageNav.tsx`

**Interfaces:**
- Produces: `<SubpageNav />` — shared navbar for about/privacy/terms/contact pages
- Consumes: `next/link` (already in project)

- [ ] **Step 1: Create the component**

Write `src/components/landing/SubpageNav.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { Receipt } from 'lucide-react'

export default function SubpageNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md py-4 shadow-lg border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-9 h-9 bg-gradient-to-tr from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Receipt className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Restoloop</span>
        </Link>
        <Link href="/" className="text-sm text-white/50 hover:text-lp-accent transition-colors">← Back to Home</Link>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/SubpageNav.tsx
git commit -m "feat: add shared SubpageNav for landing subpages"
```

---

### Task 4: Create NebulaCanvas component

**Files:**
- Create: `src/components/landing/NebulaCanvas.tsx`

**Interfaces:**
- Produces: `<NebulaCanvas />` — canvas + framer-motion spring nebula glow that follows mouse
- Consumes: `framer-motion` (`useMotionValue`, `useSpring`, `motion`)

- [ ] **Step 1: Create the component**

Write `src/components/landing/NebulaCanvas.tsx` — exact copy of LP's `src/components/NebulaCanvas.tsx` with one change: add `'use client'` at the top.

From LP source (153 lines):

```tsx
'use client'

import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface Star {
    x: number; y: number;
    size: number; opacity: number;
    vx: number; vy: number;
    twinkleSpeed: number; twinkleOffset: number;
}

export const NebulaCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cursorTarget = useRef({ x: -999, y: -999 });
    const cursorSmooth = useRef({ x: -999, y: -999 });
    const frameRef = useRef(0);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { damping: 30, stiffness: 50 });
    const springY = useSpring(mouseY, { damping: 30, stiffness: 50 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);

        const STAR_COUNT = 150;
        const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: Math.random() * 1.4 + 0.3,
            opacity: Math.random() * 0.5 + 0.15,
            vx: (Math.random() - 0.5) * 0.1,
            vy: (Math.random() - 0.5) * 0.1,
            twinkleSpeed: Math.random() * 0.018 + 0.004,
            twinkleOffset: Math.random() * Math.PI * 2,
        }));

        const onMouseMove = (e: MouseEvent) => {
            cursorTarget.current = { x: e.clientX, y: e.clientY };
            mouseX.set((e.clientX - window.innerWidth / 2) / 3);
            mouseY.set((e.clientY - window.innerHeight / 2) / 3);
        };
        window.addEventListener('mousemove', onMouseMove);

        let tick = 0;
        const draw = () => {
            tick++;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            cursorSmooth.current.x += (cursorTarget.current.x - cursorSmooth.current.x) * 0.1;
            cursorSmooth.current.y += (cursorTarget.current.y - cursorSmooth.current.y) * 0.1;

            for (const star of stars) {
                star.x += star.vx;
                star.y += star.vy;
                if (star.x < 0) star.x = canvas.width;
                if (star.x > canvas.width) star.x = 0;
                if (star.y < 0) star.y = canvas.height;
                if (star.y > canvas.height) star.y = 0;

                const twinkle = Math.sin(tick * star.twinkleSpeed + star.twinkleOffset);
                const op = star.opacity * (0.65 + 0.35 * twinkle);
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${op.toFixed(3)})`;
                ctx.fill();
            }

            const cx = cursorSmooth.current.x;
            const cy = cursorSmooth.current.y;
            if (cx > 0 && cy > 0) {
                const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, 100);
                halo.addColorStop(0, 'rgba(255,255,255,0.1)');
                halo.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.fillStyle = halo;
                ctx.beginPath();
                ctx.arc(cx, cy, 100, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.arc(cx, cy, 3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.95)';
                ctx.fill();

                const ig = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12);
                ig.addColorStop(0, 'rgba(255,255,255,0.4)');
                ig.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.beginPath();
                ctx.arc(cx, cy, 12, 0, Math.PI * 2);
                ctx.fillStyle = ig;
                ctx.fill();
            }

            frameRef.current = requestAnimationFrame(draw);
        };
        frameRef.current = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(frameRef.current);
            window.removeEventListener('mousemove', onMouseMove);
            ro.disconnect();
        };
    }, [mouseX, mouseY]);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-black" />

            <motion.div
                style={{ x: springX, y: springY, translateX: '-50%', translateY: '-50%' }}
                className="absolute top-1/2 left-1/2 w-[800px] h-[800px] pointer-events-none"
            >
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(circle at 62% 45%, rgba(0,210,190,0.5) 0%, transparent 55%)',
                    filter: 'blur(90px)',
                    mixBlendMode: 'screen',
                }} />
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(circle at 38% 58%, rgba(255,100,45,0.38) 0%, transparent 52%)',
                    filter: 'blur(110px)',
                    mixBlendMode: 'screen',
                }} />
            </motion.div>

            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ display: 'block', background: 'transparent' }}
            />
        </div>
    );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/NebulaCanvas.tsx
git commit -m "feat: add NebulaCanvas component for landing page"
```

---

### Task 5: Port main landing page (page.tsx)

**Files:**
- Replace: `src/app/page.tsx` (current 294-line bare-bones page → new 710-line LP version)
- Create: none (all removed from this file)

**Interfaces:**
- Consumes: `framer-motion` (`motion`, `useScroll`, `useTransform`, `AnimatePresence`), `next/link`, `lucide-react`, `src/components/landing/NebulaCanvas`
- Consumes: Images from `public/landing/` (`step2.jpg`, `qr-code.png`, `whatsapp-icon.png`)
- Produces: `GET /` renders full dark landing page

**Adaptation notes:** The LP `App.tsx` has these changes needed:
- `react-router-dom` imports removed → use `next/link`, `usePathname` from `next/navigation`
- `<Routes>/<Route>` → removed (routing handled by App Router file system)
- Image imports: `import step2 from './step2.jpg'` → `<img src="/landing/step2.jpg">`
- All `bg-accent` → `bg-lp-accent`, `text-accent` → `text-lp-accent`, `from-accent` → `from-lp-accent`
- `font-serif` → `font-lp-serif`
- `animate-pulse` → `animate-lp-pulse`
- `<Link to="/contact">` → `<Link href="/contact">`
- `<Link to="/about">` → `<Link href="/about">`, etc.
- `<Link to="/">` → `<Link href="/">`
- `useLocation()` replaced by `usePathname()` + `useEffect`
- Wrap everything in `<main className="landing-theme">`
- Add `'use client'` at top
- Export default page function
- Remove `import About from './pages/About'` etc. (subpages are now separate route files)
- Remove `<Routes>` block — just render `<Home />` + `<Footer />` directly since this is only `/`

- [ ] **Step 1: Write the new page.tsx**

Replace `src/app/page.tsx` with the adapted LP App.tsx. The full file:

```tsx
'use client'

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    MessageSquare,
    TrendingUp,
    Receipt,
    Check,
    X,
    ChevronDown,
    ArrowRight,
    Menu,
    Mail,
    Phone,
    MapPin
} from 'lucide-react';

import { NebulaCanvas } from '@/components/landing/NebulaCanvas';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'How it Works', href: '#how-it-works' },
        { name: 'Pricing', href: '#pricing' },
        { name: 'FAQ', href: '#faq' },
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/80 backdrop-blur-md py-4 shadow-lg' : 'bg-transparent py-6'}`}>
            <div className="container mx-auto px-6 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <Receipt className="text-white w-6 h-6" />
                    </div>
                    <span className="text-2xl font-bold text-white tracking-tight">Restoloop</span>
                </div>

                <div className="hidden md:flex items-center space-x-8">
                    {navLinks.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium"
                        >
                            {link.name}
                        </a>
                    ))}
                    <Link
                        href="/signup"
                        className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 hover:-translate-y-0.5"
                    >
                        Get Started
                    </Link>
                </div>

                <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    {isMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {isMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 p-6 space-y-4">
                    {navLinks.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            className="block text-gray-300 hover:text-white text-lg font-medium"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            {link.name}
                        </a>
                    ))}
                    <Link
                        href="/signup"
                        className="block w-full text-center bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-orange-500/20"
                    >
                        Get Started Free
                    </Link>
                </div>
            )}
        </nav>
    );
};

const Hero = () => {
    const { scrollYProgress } = useScroll();
    const y = useTransform(scrollYProgress, [0, 0.2], [100, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2], [0.9, 1]);
    const opacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

    return (
        <section className="relative pt-24 md:pt-40 pb-12 md:pb-24 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[300px] md:w-[1000px] h-[300px] md:h-[800px] bg-lp-accent/5 blur-[80px] md:blur-[150px] rounded-full opacity-50" />
                <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[200px] md:w-[600px] h-[200px] md:h-[400px] bg-lp-accent/10 blur-[60px] md:blur-[100px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className="flex justify-center mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/10 rounded-full text-[10px] md:text-xs font-bold tracking-widest text-white/50 backdrop-blur-sm">
                            <span className="w-1.5 h-1.5 bg-lp-accent rounded-full shadow-[0_0_8px_rgba(223,118,86,0.8)]" />
                            AUTOMATED LOYALTY LOOP
                        </div>
                    </div>

                    <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-[104px] leading-[1.05] md:leading-[1.05] mb-6 md:mb-10 tracking-tight font-lp-serif max-w-5xl mx-auto">
                        Turn tonight&apos;s guests <br />
                        <span className="text-white">into </span>
                        <span className="shimmer">repeated customers.</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-base md:text-lg text-white/40 mb-10 md:mb-12 leading-relaxed">
                        Most visitors never return. Restoloop automatically brings them back to your tables.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 md:mb-24">
                        <Link href="/signup" className="bg-lp-accent hover:bg-lp-accent/90 text-white px-10 py-4.5 rounded-full text-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-lp-accent/20 hover:shadow-lp-accent/40 hover:scale-[1.02]">
                            Start Trial <ArrowRight className="w-5 h-5" />
                        </Link>
                        <a href="#how-it-works" className="bg-white/[0.03] border border-white/10 text-white px-10 py-4.5 rounded-full text-lg font-bold hover:bg-white/[0.08] transition-all hover:scale-[1.02] backdrop-blur-sm">
                            See how it works
                        </a>
                    </div>
                </motion.div>

                <motion.div
                    style={{ y, scale, opacity }}
                    className="relative max-w-5xl mx-auto"
                >
                    <div className="glass-card rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-2xl overflow-hidden">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                            {[
                                { label: 'Total Customers', value: '247', icon: MessageSquare },
                                { label: 'Coupons Sent', value: '189', icon: TrendingUp },
                                { label: 'Coupons Redeemed', value: '63', icon: Check },
                                { label: 'Revenue Attributed', value: '₹42,800', icon: Receipt },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl text-left border border-white/5">
                                    <stat.icon className="w-4 h-4 md:w-5 md:h-5 text-lp-accent mb-1 md:mb-2" />
                                    <div className="text-lg md:text-2xl font-bold">{stat.value}</div>
                                    <div className="text-[8px] md:text-xs text-white/40 uppercase tracking-wider">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="h-48 md:h-64 bg-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/5 flex flex-col justify-end">
                            <div className="text-left mb-2 md:mb-4">
                                <div className="text-[10px] md:text-sm font-medium text-white/60">Revenue from returning customers ₹</div>
                            </div>
                            <div className="flex items-end justify-between gap-1 md:gap-2 h-full">
                                {[40, 65, 45, 80, 55, 90].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 0 }}
                                        whileInView={{ height: `${h}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        className="flex-1 bg-lp-accent/40 rounded-t-sm md:rounded-t-lg relative group"
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-lp-accent text-white text-[8px] md:text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            ₹{(h * 500).toLocaleString()}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-2 md:mt-4 text-[8px] md:text-[10px] text-white/30 uppercase tracking-widest">
                                <span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

const StatBar = () => {
    const stats = [
        { label: 'Setup cost', value: '₹0' },
        { label: 'To go live', value: '7 mins' },
        { label: 'Auto messages', value: '50/day' },
        { label: 'Avg ROI', value: '3x' },
    ];

    return (
        <div className="py-12 md:py-20 border-y border-white/5">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: i * 0.2 }}
                            className="text-center"
                        >
                            <div className="text-3xl md:text-5xl font-lp-serif mb-1 md:mb-2">{stat.value}</div>
                            <div className="text-[10px] md:text-sm text-white/40 uppercase tracking-widest">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const HowItWorks = () => {
    const steps = [
        {
            icon: '/landing/qr-code.png',
            title: "Capture data",
            description: "Capture customer data from your restaurant instantly via QR.",
            step: "STEP 1",
        },
        {
            icon: '/landing/step2.jpg',
            title: "Automate follow-ups",
            description: "Automate follow-ups and offers based on customer behavior.",
            step: "STEP 2",
        },
        {
            icon: '/landing/whatsapp-icon.png',
            title: "Re-engage via WhatsApp",
            description: "Re-engage customers via WhatsApp to increase repeat visits and revenue.",
            step: "STEP 3",
        }
    ];

    return (
        <section id="how-it-works" className="py-20 md:py-32 bg-black">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="text-center mb-16 md:mb-24">
                    <h2 className="text-4xl md:text-7xl mb-4 md:mb-6">How It Works</h2>
                    <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto">
                        Turn one-time visitors into loyal, repeat customers with our automated engagement loop.
                    </p>
                </div>

                <div className="glass-card rounded-[32px] md:rounded-[48px] p-8 md:p-16 border border-white/5 bg-white/[0.01]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
                        {steps.map((step, i) => (
                            <div key={i} className="flex flex-col items-center text-center relative group">
                                <div className="w-full h-full glass-card rounded-3xl p-8 md:p-10 border border-white/5 hover:border-lp-accent/30 transition-all duration-500 hover:bg-white/[0.03]">
                                    <div className="text-lp-accent font-bold text-[10px] md:text-xs tracking-widest mb-8 opacity-60">
                                        {step.step}
                                    </div>

                                    <div className="mb-8 flex items-center justify-center">
                                        <div className="w-24 h-24 md:w-32 md:h-32 bg-black/40 rounded-3xl border border-white/5 flex items-center justify-center p-4 shadow-xl">
                                            <img src={step.icon} alt={step.title} className="w-full h-full object-contain rounded-2xl" />
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <h3 className="text-xl md:text-2xl font-lp-serif mb-4 flex items-center">{step.title}</h3>
                                        <p className="text-white/40 text-sm md:text-base leading-relaxed">{step.description}</p>
                                    </div>
                                </div>

                                {i < steps.length - 1 && (
                                    <div className="hidden md:flex absolute top-1/2 -right-6 translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center text-white/10 text-3xl font-light">
                                        <ArrowRight className="w-6 h-6 opacity-20" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

const Comparison = () => {
    return (
        <section className="py-20 md:py-32 bg-white/[0.02]">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    <div className="p-6 md:p-8 rounded-[20px] border border-white/5 bg-white/[0.04] backdrop-blur-md">
                        <h3 className="text-2xl md:text-3xl font-lp-serif mb-6 md:mb-8 text-red-500/80 italic">Without Restoloop</h3>
                        <ul className="space-y-4 md:space-y-6">
                            {[
                                "Customers visit once, disappear forever",
                                "No way to reach them on WhatsApp after",
                                "Spend on Instagram ads with zero tracking",
                                "No idea which offer actually worked",
                                "Birthday moments missed every single day"
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 md:gap-4 text-sm md:text-base text-white/40">
                                    <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="p-6 md:p-8 rounded-[20px] border border-white/5 bg-white/[0.04] backdrop-blur-md relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl rounded-full" />
                        <h3 className="text-2xl md:text-3xl font-lp-serif mb-6 md:mb-8 text-green-500 italic">With Restoloop</h3>
                        <ul className="space-y-4 md:space-y-6">
                            {[
                                "Own your customer WhatsApp database",
                                "Automated outreach — zero manual effort",
                                "Pay only per message, no wasted spend",
                                "Dashboard shows exact ₹ attributed to us",
                                "Birthday + win-back sent automatically"
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 md:gap-4 text-sm md:text-base text-white/90">
                                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                    <span className="font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

const ROIBlock = () => {
    return (
        <section className="py-20 md:py-32 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="glass-card rounded-[32px] md:rounded-[40px] p-8 md:p-24 text-center relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-lp-accent/5 blur-3xl -z-10" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="text-6xl md:text-9xl font-lp-serif mb-4 text-lp-accent">₹42,800</div>
                        <p className="text-lg md:text-2xl text-white/60 mb-12 md:mb-16 max-w-2xl mx-auto">
                            Average monthly revenue attributed by Restoloop for an active restaurant
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 md:pt-12 border-t border-white/5">
                            <div>
                                <div className="text-2xl md:text-3xl font-bold mb-1">63</div>
                                <div className="text-xs md:text-sm text-white/40 uppercase tracking-widest">coupons redeemed</div>
                            </div>
                            <div>
                                <div className="text-2xl md:text-3xl font-bold mb-1">247</div>
                                <div className="text-xs md:text-sm text-white/40 uppercase tracking-widest">customers captured</div>
                            </div>
                            <div>
                                <div className="text-2xl md:text-3xl font-bold mb-1">₹0</div>
                                <div className="text-xs md:text-sm text-white/40 uppercase tracking-widest">ad spend</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

const TestimonialMarquee = () => {
    const testimonials = [
        {
            stars: "★★★★★",
            quote: "System lagane ke baad daily 2–3 repeat customers consistently aane lage. Isse approx ₹400–₹600 extra per day add ho raha hai — month me ₹12,000+ ka clear increase dikha.",
            author: "Ravi Kumar, Owner — Shree Rama Resturant"
        },
        {
            stars: "★★★★★",
            quote: "WhatsApp follow-ups ke baad repeat rate improve hua aur overall sales me 15–20% tak jump mila within few weeks. Pehle jo customers wapas nahi aate the, ab regularly dikhne lage hain.",
            author: "Jaspal Singh, Owner — Biryani Junction"
        },
        {
            stars: "★★★★★",
            quote: "Opening ke saath hi system use kiya, toh jo customers aaye unme se kaafi log dobara visit karne lage. 20–25 din me ₹10k–₹15k ka additional revenue repeat visits se generate hua.",
            author: "Saurabh Singh, Owner — Urban Tandoor"
        }
    ];

    return (
        <section className="py-20 overflow-hidden">
            <div className="marquee-container">
                <div className="marquee-content">
                    {[...testimonials, ...testimonials].map((t, i) => (
                        <div key={i} className="glass-card p-8 rounded-[20px] min-w-[350px] max-w-[350px]">
                            <div className="text-lp-accent mb-4">{t.stars}</div>
                            <p className="text-white/80 mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
                            <div className="text-sm font-bold text-white/40">— {t.author}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Pricing = () => {
    const tiers = [
        {
            name: '🟢 PLAN 1 — Starter / Trial',
            price: '₹999',
            note: 'Bring back your past customers (basic setup)',
            features: [
                '300 WhatsApp messages',
                'QR code + customer data capture',
                'Simple follow-up messages (manual + assisted)',
                'Basic coupon / offer sending',
                'Setup + support included'
            ],
            badge: '👉 Best for testing if this works for your restaurant',
            cta: 'Get started',
            popular: false
        },
        {
            name: '🔴 PLAN 2 — Growth',
            price: '₹2,499',
            note: 'Turn more first-time customers into repeat customers',
            features: [
                '800 WhatsApp messages',
                'Everything in Starter',
                'Automated follow-ups (no manual work)',
                'Birthday / offer campaigns',
                'Better tracking of returning customers',
                'Priority support + faster setup'
            ],
            badge: '👉 Best for restaurants serious about growth',
            cta: 'Get started',
            popular: true
        }
    ];

    return (
        <section id="pricing" className="py-20 md:py-32">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="text-center mb-12 md:mb-20">
                    <h2 className="text-4xl md:text-7xl mb-4 md:mb-6">Choose the Right Plan</h2>
                    <p className="text-white/60">Expand your schema as per your requirements</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
                    {tiers.map((tier, i) => (
                        <div
                            key={i}
                            className={`relative p-6 md:p-8 rounded-[24px] md:rounded-[32px] flex flex-col ${tier.popular
                                ? 'bg-lp-accent/10 border-2 border-lp-accent shadow-[0_0_40px_rgba(223,118,86,0.2)]'
                                : 'glass-card'
                                }`}
                        >
                            {tier.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-lp-accent text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-6 md:mb-8">
                                <div className="text-sm font-bold mb-3 text-white/80">{tier.name}</div>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-4xl md:text-5xl font-bold">{tier.price}</span>
                                </div>
                                <div className="text-white/40 text-xs md:text-sm italic mt-1">{tier.note}</div>
                            </div>

                            <div className="space-y-3 md:space-y-4 mb-6 flex-grow">
                                {tier.features.map((f, j) => (
                                    <div key={j} className="flex items-center gap-3 text-xs md:text-sm text-white/70">
                                        <Check className="w-3 h-3 md:w-4 md:h-4 text-lp-accent shrink-0" />
                                        <span>{f}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="text-xs text-white/40 italic mb-6">{tier.badge}</div>

                            <Link
                                href="/signup"
                                className={`w-full py-3 md:py-4 rounded-full font-bold text-center transition-all ${tier.popular
                                    ? 'bg-lp-accent text-white hover:scale-[1.02]'
                                    : 'glass hover:bg-white/10'
                                    }`}
                            >
                                {tier.cta}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const FAQ = () => {
    const faqs = [
        {
            q: "Do I need technical knowledge to set this up?",
            a: "Not at all. Create an account, enter your restaurant name, print the QR code, and place it on your tables. Ready in 7 minutes. The system handles everything after that."
        },
        {
            q: "Will my existing WhatsApp number be used?",
            a: "No. We use the official Meta WhatsApp Business API — messages are sent from a dedicated verified number. Your personal number stays safe, and delivery rates are much better."
        },
        {
            q: "What if the customer doesn't use the coupon?",
            a: "No problem. The coupon expires automatically. Your credits are only deducted when a message is successfully delivered — not on redemption. You lose nothing."
        },
        {
            q: "When do credits expire?",
            a: "Never. Buy 1000 credits and use them over 2 years — they stay as they are. No monthly subscription, no expiry. Your money won't be wasted."
        },
        {
            q: "What if there's a problem with the system?",
            a: "We are available on WhatsApp. There's a button on the dashboard — it sends a message directly to our WhatsApp. A real human responds, not a bot."
        },
        {
            q: "Is this only for large restaurants?",
            a: "No. Whether it's a small dhaba or a large restaurant — as long as you have customers and want to bring them back, Restoloop works. You can start with even 50 customers."
        }
    ];

    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section id="faq" className="py-32">
            <div className="max-w-3xl mx-auto px-6">
                <h2 className="text-5xl md:text-7xl text-center mb-16 italic font-lp-serif">FAQ</h2>
                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <div key={i} className="glass-card rounded-2xl overflow-hidden">
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                            >
                                <span className="font-medium text-lg">{faq.q}</span>
                                <ChevronDown className={`w-5 h-5 transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {openIndex === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="px-6 pb-6 text-white/60 leading-relaxed"
                                    >
                                        {faq.a}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Footer = () => {
    return (
        <footer className="py-12 md:py-20 border-t border-white/5 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-lp-accent rounded-xl flex items-center justify-center shadow-lg shadow-lp-accent/20">
                                <Receipt className="text-white w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-2xl font-lp-serif font-bold block leading-none">Resto Loop</span>
                                <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">by Bluetideapp</span>
                            </div>
                        </div>
                        <p className="text-white/40 max-w-sm text-sm leading-relaxed">
                            Customer retention platform for restaurants. Turn one-time visitors into loyal, repeat customers.
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-white/40 hover:text-white transition-colors">
                                <Mail className="w-4 h-4 text-lp-accent" />
                                <a href="mailto:ankit@bluetideapp.com" className="text-sm">ankit@bluetideapp.com</a>
                            </div>
                            <div className="flex items-center gap-3 text-white/40 hover:text-white transition-colors">
                                <Phone className="w-4 h-4 text-lp-accent" />
                                <a href="tel:+917542011085" className="text-sm">+91 7542011085</a>
                            </div>
                            <div className="flex items-center gap-3 text-white/40">
                                <MapPin className="w-4 h-4 text-lp-accent" />
                                <span className="text-sm">Bihar, India</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 lg:justify-items-end">
                        <div className="space-y-4">
                            <h4 className="text-white text-xs font-bold uppercase tracking-widest">Platform</h4>
                            <nav className="flex flex-col gap-3">
                                <a href="#how-it-works" className="text-sm text-white/30 hover:text-lp-accent transition-colors w-fit">How it Works</a>
                                <a href="#pricing" className="text-sm text-white/30 hover:text-lp-accent transition-colors w-fit">Pricing</a>
                                <a href="#faq" className="text-sm text-white/30 hover:text-lp-accent transition-colors w-fit">FAQ</a>
                            </nav>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-white text-xs font-bold uppercase tracking-widest">Connect</h4>
                            <nav className="flex flex-col gap-3">
                                <Link href="/about" className="text-sm text-white/30 hover:text-lp-accent transition-colors w-fit">About</Link>
                                <Link href="/privacy" className="text-sm text-white/30 hover:text-lp-accent transition-colors w-fit">Privacy Policy</Link>
                                <Link href="/terms" className="text-sm text-white/30 hover:text-lp-accent transition-colors w-fit">Terms of Service</Link>
                                <Link href="/contact" className="text-sm text-white/30 hover:text-lp-accent transition-colors w-fit">Contact</Link>
                            </nav>
                        </div>
                    </div>
                </div>

                <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex flex-col gap-2 text-center md:text-left">
                        <span className="text-[10px] text-white/20 uppercase tracking-widest">© 2026 Resto Loop. All rights reserved.</span>
                        <div className="flex items-center gap-2 justify-center md:justify-start">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-lp-pulse" />
                            <span className="text-[10px] text-white/40 font-medium">We only communicate with users who have provided consent to receive messages.</span>
                        </div>
                    </div>
                    <div className="text-sm text-white/20 italic">
                        Made with ❤️ by <span className="text-white/40 not-italic font-bold">ANKIT</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default function LandingPage() {
    const pathname = usePathname();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <main className="landing-theme min-h-screen selection:bg-lp-accent selection:text-white">
            <Navbar />
            <Hero />
            <StatBar />
            <HowItWorks />
            <Comparison />
            <ROIBlock />
            <TestimonialMarquee />
            <Pricing />
            <FAQ />
            <Footer />
        </main>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: port dark-themed landing page from LP project"
```

---

### Task 6: Port subpages (about, privacy, terms, contact)

**Files:**
- Create: `src/app/about/page.tsx`
- Create: `src/app/privacy/page.tsx`
- Create: `src/app/terms/page.tsx`
- Create: `src/app/contact/page.tsx`

**Interfaces:**
- Consumes: `src/components/landing/SubpageNav`, `next/link`, `lucide-react`
- Produces: `GET /about`, `GET /privacy`, `GET /terms`, `GET /contact`

**Adaptation notes for all 4 subpages:**
- Replace `react-router-dom` `Link` with `next/link`
- Replace `<Link to="/">` → `<Link href="/">`
- Replace `<Link to="/about">` → `<Link href="/about">` (etc.)
- Remove `import SubpageNav from` — instead import `SubpageNav` from `@/components/landing/SubpageNav`
- Remove the identical inline navbars — use `<SubpageNav />` instead
- Design fix: change `bg-[#0a0a0a]` → inherit `#000000` from `.landing-theme` (per spec)
- Add `'use client'` (uses `Link` which works in server components, but we mark it client for consistency)
- `text-accent` → `text-lp-accent`, `bg-accent` → `bg-lp-accent`, `bg-accent/5` → `bg-lp-accent/5`, `bg-accent/10` → `bg-lp-accent/10`, `border-accent/30` → `border-lp-accent/30`

- [ ] **Step 1: Create src/app/about/page.tsx**

```tsx
'use client'

import Link from 'next/link'
import SubpageNav from '@/components/landing/SubpageNav'

export default function About() {
  return (
    <div className="landing-theme min-h-screen bg-lp-bg text-white">
      <SubpageNav />

      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <h1 className="text-4xl md:text-6xl font-lp-serif mb-6">About Resto Loop</h1>
        <div className="h-1 w-16 bg-lp-accent rounded-full mb-12" />

        <div className="space-y-6 text-white/70 text-lg leading-relaxed">
          <p>
            Resto Loop is a customer retention and engagement platform built for restaurant businesses to increase repeat customers and maximize lifetime value.
          </p>
          <p>
            Our objective is simple: help restaurants turn one-time visitors into loyal, repeat customers using structured communication, automation, and data-driven follow-ups.
          </p>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 my-10">
            <h2 className="text-xl font-semibold text-white mb-5">Resto Loop enables restaurants to:</h2>
            <ul className="space-y-3">
              {[
                'Capture customer data',
                'Re-engage customers through WhatsApp and other channels',
                'Run targeted campaigns and offers',
                'Build long-term customer relationships',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-lp-accent rounded-full mt-2.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <p>
            Resto Loop is a product of <strong className="text-white">Bluetideapp</strong>, operated by Ankit as a sole proprietorship based in India.
          </p>
        </div>
      </div>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-white/20 uppercase tracking-widest">
        © 2026 Resto Loop · A product of Bluetideapp
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: Create src/app/privacy/page.tsx**

```tsx
'use client'

import Link from 'next/link'
import SubpageNav from '@/components/landing/SubpageNav'

export default function Privacy() {
  return (
    <div className="landing-theme min-h-screen bg-lp-bg text-white">
      <SubpageNav />

      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <h1 className="text-4xl md:text-6xl font-lp-serif mb-6">Privacy Policy</h1>
        <div className="h-1 w-16 bg-lp-accent rounded-full mb-4" />
        <p className="text-white/30 text-sm mb-12">Bluetideapp · Last updated: March 2026</p>

        <div className="space-y-8 text-white/70 text-base leading-relaxed">
          <p>
            At <strong className="text-white">Bluetideapp</strong>, we are committed to protecting user data and maintaining transparency in how information is collected and used.
          </p>

          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Information We Collect</h2>
            <p>
              We may collect customer information including names, phone numbers, and interaction data when users engage with our platform.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-4">How We Use This Data</h2>
            <p className="mb-4">This data is used to:</p>
            <ul className="space-y-3 bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              {[
                'Provide and improve our services',
                'Enable communication via WhatsApp and other messaging platforms',
                'Send service-related updates, notifications, and promotional messages where applicable',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-lp-accent rounded-full mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Our Commitments</h2>
            <ul className="space-y-3 bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              {[
                'Users provide consent before receiving communication',
                'Data is not sold or shared with unauthorized third parties',
                'Information is handled securely and used only for intended business purposes',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-lp-accent/30 bg-lp-accent/5 rounded-2xl p-6">
            <p className="text-white font-medium">
              We only communicate with users who have provided consent to receive messages.
            </p>
          </div>

          <p>
            By using our services, users agree to this data usage policy.
          </p>

          <div className="pt-4 border-t border-white/5">
            <h2 className="text-xl font-semibold text-white mb-3">Contact</h2>
            <p>For privacy-related inquiries: <a href="mailto:ankit@bluetideapp.com" className="text-lp-accent hover:underline">ankit@bluetideapp.com</a></p>
          </div>
        </div>
      </div>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-white/20 uppercase tracking-widest">
        © 2026 Resto Loop · A product of Bluetideapp
      </footer>
    </div>
  )
}
```

- [ ] **Step 3: Create src/app/terms/page.tsx**

```tsx
'use client'

import Link from 'next/link'
import SubpageNav from '@/components/landing/SubpageNav'

export default function Terms() {
  return (
    <div className="landing-theme min-h-screen bg-lp-bg text-white">
      <SubpageNav />

      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <h1 className="text-4xl md:text-6xl font-lp-serif mb-6">Terms of Service</h1>
        <div className="h-1 w-16 bg-lp-accent rounded-full mb-4" />
        <p className="text-white/30 text-sm mb-12">Bluetideapp · Last updated: March 2026</p>

        <div className="space-y-8 text-white/70 text-base leading-relaxed">
          <p>
            By using Resto Loop, you agree to the following terms:
          </p>

          <ul className="space-y-6">
            {[
              {
                title: "Service Overview",
                content: "Resto Loop provides tools for customer communication, engagement, and retention for restaurant businesses."
              },
              {
                title: "User Responsibility",
                content: "Users are responsible for obtaining proper consent from their customers before sending messages."
              },
              {
                title: "Usage Policy",
                content: "The platform must not be used for spam, unsolicited messaging, or violation of messaging platform policies."
              },
              {
                title: "Liability",
                content: "Bluetideapp is not responsible for misuse of the platform by users."
              },
              {
                title: "Termination",
                content: "We reserve the right to suspend or terminate access in case of misuse or policy violations."
              }
            ].map((item, i) => (
              <li key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <h2 className="text-white font-semibold mb-2">{item.title}</h2>
                <p>{item.content}</p>
              </li>
            ))}
          </ul>

          <p className="pt-4 italic text-white/50">
            Use of the service constitutes acceptance of these terms.
          </p>
        </div>
      </div>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-white/20 uppercase tracking-widest">
        © 2026 Resto Loop · A product of Bluetideapp
      </footer>
    </div>
  )
}
```

- [ ] **Step 4: Create src/app/contact/page.tsx**

```tsx
'use client'

import Link from 'next/link'
import { Mail, Phone } from 'lucide-react'
import SubpageNav from '@/components/landing/SubpageNav'

export default function ContactPage() {
  return (
    <div className="landing-theme min-h-screen bg-lp-bg text-white">
      <SubpageNav />

      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24 text-center">
        <h1 className="text-4xl md:text-6xl font-lp-serif mb-6">Contact</h1>
        <div className="h-1 w-16 bg-lp-accent rounded-full mb-12 mx-auto" />

        <p className="text-white/60 text-lg mb-16 max-w-xl mx-auto">
          For inquiries, support, or business-related communication, please reach out to us:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <div className="glass-card p-10 rounded-3xl border border-white/5 hover:border-lp-accent/30 transition-all">
            <div className="w-14 h-14 bg-lp-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Mail className="text-lp-accent w-7 h-7" />
            </div>
            <h2 className="text-white/40 uppercase tracking-widest text-xs font-bold mb-2">Email</h2>
            <a href="mailto:ankit@bluetideapp.com" className="text-xl md:text-2xl font-semibold hover:text-lp-accent transition-colors">
              ankit@bluetideapp.com
            </a>
          </div>

          <div className="glass-card p-10 rounded-3xl border border-white/5 hover:border-lp-accent/30 transition-all">
            <div className="w-14 h-14 bg-lp-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Phone className="text-lp-accent w-7 h-7" />
            </div>
            <h2 className="text-white/40 uppercase tracking-widest text-xs font-bold mb-2">Phone</h2>
            <a href="tel:+917542011085" className="text-xl md:text-2xl font-semibold hover:text-lp-accent transition-colors">
              +91 7542011085
            </a>
          </div>
        </div>

        <div className="mt-20 pt-10 border-t border-white/5 text-white/30">
          <p>Based in Bihar, India</p>
        </div>
      </div>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-white/20 uppercase tracking-widest">
        © 2026 Resto Loop · A product of Bluetideapp
      </footer>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/about/ src/app/privacy/ src/app/terms/ src/app/contact/
git commit -m "feat: port landing page subpages (about, privacy, terms, contact)"
```

---

### Task 7: Verify — typecheck, lint, manual smoke test

**Files:**
- None (verification only)

- [ ] **Step 1: Run TypeScript typecheck**

```bash
pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 2: Run ESLint**

```bash
pnpm lint
```
Expected: 0 errors. If warnings about unescaped entities from `&ldquo;` / `&rdquo;` or `&apos;` in page.tsx, those are acceptable (Next.js handles HTML entities fine).

- [ ] **Step 3: Start dev server and verify visually**

```bash
pnpm dev
```

Navigate to `http://localhost:3000` and check:
- [ ] Dark landing page renders with all sections (Hero, StatBar, HowItWorks, Comparison, ROIBlock, TestimonialMarquee, Pricing, FAQ, Footer)
- [ ] NebulaCanvas shows stars + cursor glow on the hero section
- [ ] "Start Trial" / "Get Started" buttons navigate to `/signup`
- [ ] Scroll animations trigger (StatBar fades in, ROIBlock scales in, Hero dashboard mockup parallax)
- [ ] Mobile menu opens/closes (hamburger icon, resize to <768px)
- [ ] FAQ accordion expands/collapses on click
- [ ] Testimonial marquee scrolls automatically
- [ ] `/about`, `/privacy`, `/terms`, `/contact` all render with dark theme and SubpageNav
- [ ] `/login`, `/signup` and `/dashboard/*` still render with light theme (no CSS leak)
- [ ] Console has no errors or warnings from the LP pages

- [ ] **Step 4: Verify existing routes still work**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login
```
Expected: 200 (redirects to login page)

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/signup
```
Expected: 200

- [ ] **Step 5: Commit (if any fixes needed)**

Only if lint/typecheck fixes were needed.

---

## Self-Review

### Spec coverage
| Requirement | Task |
|-------------|------|
| Replace `/` with dark LP | Task 5 |
| CSS scoping under `.landing-theme` | Task 2 |
| Copy static images | Task 1 |
| Font loading (Instrument Serif + Caveat) | Task 1 |
| SubpageNav shared component | Task 3 |
| NebulaCanvas component | Task 4 |
| Subpages (about, privacy, terms, contact) | Task 6 |
| CTA buttons wired to `/signup` | Tasks 5, 6 |
| Dashboard light theme untouched | Tasks 2, 7 |
| `pnpm typecheck` passes | Task 7 |
| `pnpm lint` passes | Task 7 |

### Placeholder scan
- [x] No "TBD", "TODO", or "implement later"
- [x] All steps have actual code blocks (no "Write tests for the above" without code)
- [x] All file paths are exact

### Type consistency
- [x] `--color-lp-accent` defined in Task 2, used as `bg-lp-accent` / `text-lp-accent` in Tasks 3-6
- [x] `--font-lp-serif` defined in Task 2, used as `font-lp-serif` in Tasks 5-6
- [x] `NebulaCanvas` exported from Task 4, imported as `{ NebulaCanvas }` in Task 5
- [x] `SubpageNav` exported as default from Task 3, imported as default in Task 6
