# Research: Restoloop Frontend

**Phase 0 — Outline & Research**  
**Date**: 2026-05-24

## Research Topics

### 1. Supabase SSR with Next.js 15 App Router

**Decision**: Use `@supabase/ssr` with cookie-based session management as already configured in the project.
**Rationale**: Project already has `@supabase/ssr` configured. Auth callback, middleware, and server-client patterns are already in place under `src/apps/web/lib/supabase/` and `src/apps/web/app/auth/`.
**Alternatives considered**: None — existing setup is proven and matches Supabase best practices for Next.js 15.

### 2. TanStack Query 5 Data Fetching Pattern

**Decision**: Use TanStack Query 5 for all client-side data fetching (dashboard KPIs, customers, coupons, profile). Server Components for initial data hydration where possible.
**Rationale**: Project already has `react-query-provider.tsx`. TanStack Query provides caching, refetching, and loading/error states out of the box. Server Components for static/initial data, TanStack Query for interactive filtering/sorting.
**Alternatives considered**: SWR — less feature-rich than TanStack Query for this use case. Pure Server Components — insufficient for interactive sorting/filtering without full page reloads.

### 3. shadcn/ui Component Selection

**Decision**: Use shadcn/ui for Table, Card, Input, Button, Select, Badge primitives. Compose into feature components.
**Rationale**: Project already uses shadcn/ui (button.tsx, input.tsx exist). Table component needed for customer list. Card for KPIs. Badge for coupon status/type. Select for coupon type filter.
**Alternatives considered**: Custom components from scratch — unnecessary duplication. Headless UI — more work for same result.

### 4. Form Validation

**Decision**: Use native HTML validation (required, pattern, type) plus server-side validation. No additional form library for MVP.
**Rationale**: PRD specifies "Plain HTML forms, no fancy containers." Forms are simple (login: 2 fields, intake: 4 fields, profile: ~6 fields). Native validation sufficient for MVP.
**Alternatives considered**: React Hook Form — overkill for 3 simple forms. Zod — adds dependency without significant benefit at this scale.

### 5. Mobile-First Responsive Strategy

**Decision**: Tailwind CSS 4 responsive utilities. Desktop-primary layout with breakpoints: 375px (mobile), 768px (tablet), 1024px (desktop). Sidebar collapses to bottom nav or hamburger on mobile.
**Rationale**: Owner clarified desktop-primary usage. PRD mandates mobile-friendly (375px). Tailwind's `sm:`, `md:`, `lg:` prefixes handle this cleanly.
**Alternatives considered**: Separate mobile layouts — unnecessary with Tailwind responsive utilities.

### 6. Component Architecture

**Decision**: Feature components in `src/apps/web/components/` with Server Component wrappers where needed. Client Components (`'use client'`) only for interactive elements (search, sort, filter, forms).
**Rationale**: Next.js 15 App Router best practice — Server Components by default, Client Components only when needed for interactivity. Reduces JS bundle size.
**Alternatives considered**: All Client Components — worse performance, larger bundles.

### 7. Testing Strategy

**Decision**: Vitest for unit/component tests, Playwright for E2E flows. Test each user story independently per spec.
**Rationale**: Vitest is fast, integrates with the project's existing setup. Playwright covers real browser scenarios including mobile viewport (375px) testing. Each user story is independently testable.
**Alternatives considered**: Jest — slower, more config overhead. Cypress — Playwright preferred for multi-browser support.

### 8. Coupon Type Naming Mismatch

**Decision**: Use database values (`welcome`, `bday`, `winback`) internally. Display as human-readable labels (`Birthday` for `bday`).
**Rationale**: Existing types in `restoloop.types.ts` use `CouponType = 'welcome' | 'bday' | 'winback'`. PRD uses "birthday" for display. Map internal types to display labels at the presentation layer.
**Alternatives considered**: Rename database values — not allowed (backend locked).

## Resolved Clarifications

| Original Unknown | Resolution |
|-----------------|------------|
| Desktop vs mobile primary | Desktop-primary, responsive down to 375px |
| Form library | Native HTML validation only |
| Table pagination | None for MVP (<500 customers) |
