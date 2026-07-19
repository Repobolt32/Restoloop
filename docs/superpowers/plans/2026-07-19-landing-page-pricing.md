# Landing Page Pricing Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the `Pricing` component in `src/app/page.tsx` to match the official SaaS pricing tiers (Trial ₹599, Pro ₹999, Max ₹1,999, Ultra ₹2,999) and Recharge Packs callout box.

**Architecture:** Update `Pricing` component in `src/app/page.tsx` to render the 4 pricing tiers matching `src/app/pricing/page.tsx` and a Recharge Packs highlight box.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Lucide React icons.

## Global Constraints

- **Theme**: Crimson & Warm Saffron light mode / dark glassmorphism on landing page (`landing-theme`).
- **Paths**: `@/*` maps to `./src/*`.
- **CTA**: All plan CTA buttons point to `/signup`.

---

### Task 1: Update Pricing Component in Landing Page

**Files:**
- Modify: `src/app/page.tsx:413-505`

**Interfaces:**
- Consumes: Tailwind CSS classes & Lucide React icons (`Check`, `Receipt`, `Zap`, `Sparkles`)
- Produces: Updated `Pricing` component rendering Trial (₹599), Pro (₹999), Max (₹1,999), Ultra (₹2,999), and Recharge Packs callout box.

- [ ] **Step 1: Update `Pricing` component array and layout in `src/app/page.tsx`**

Update `Pricing` component to feature:
1. Header with title "Choose the Right Plan" and subtitle "No hidden fees, no auto-billing. Pay for what you need to run your campaign automations seamlessly."
2. Grid of 4 tiers: Trial (₹599/21d), Pro (₹999/mo, popular), Max (₹1,999/mo), Ultra (₹2,999/mo).
3. Recharge Packs callout card (Starter ₹1,500, Growth ₹3,000, Power ₹6,000).

- [ ] **Step 2: Verify typecheck and linting**

Run: `pnpm typecheck && pnpm lint`
Expected: 0 errors

- [ ] **Step 3: Verify Playwright landing page pricing test**

Run: `npx playwright test tests/pricing.spec.ts`
Expected: PASS
