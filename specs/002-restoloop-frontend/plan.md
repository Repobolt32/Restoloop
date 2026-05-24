# Implementation Plan: Restoloop Frontend

**Branch**: `002-restoloop-frontend` | **Date**: 2026-05-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-restoloop-frontend/spec.md`

## Summary

Frontend rebuild of Restoloop — WhatsApp-first customer outreach SaaS for Indian restaurants. Deliver 6 user stories: auth (email/password sign-up, sign-in, password reset), dashboard (KPIs + activity feed), customer list (sortable, searchable table), coupon history (read-only, filterable), restaurant profile (editable form), and public intake form (unauthenticated, per-tenant via slug). Zero backend changes. Mobile-responsive from 375px up (desktop-primary per owner clarification). Stack: Next.js 15.5 App Router, React 19.2, TypeScript 5.9 strict, Tailwind CSS 4, shadcn/ui, TanStack Query 5, Supabase SSR.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode)
**Primary Dependencies**: Next.js 15.5 (App Router), React 19.2, Tailwind CSS 4, shadcn/ui, TanStack Query 5, @supabase/ssr, pnpm 10, Turborepo 2.5
**Storage**: Supabase (PostgreSQL) — read-only access, no schema changes
**Testing**: Vitest (unit), Playwright (E2E)
**Target Platform**: Web — modern browsers (last 2 Chrome, Safari, Firefox), responsive 375px–1920px
**Project Type**: Web application (Next.js monorepo)
**Performance Goals**: Page load <2s on 3G, dashboard KPI render <2s, intake form submit <3s on 3G
**Constraints**: Zero backend changes, WCAG 2.1 AA, mobile-first responsive, no PWA
**Scale/Scope**: ~500 customers per restaurant, 6 pages, 30 functional requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution template not yet filled (branch 001-constitution-config pending). Using project CLAUDE.md hard gates instead:

| Gate | Status | Notes |
|------|--------|-------|
| Ref-context verification | PASS | Research phase covers Supabase SSR, Next.js App Router, TanStack Query patterns |
| TDD: test before code | PASS | Vitest unit tests + Playwright E2E tests specified per user story |
| Plan before code (>2 files) | PASS | This plan covers all 6 user stories |
| Verify before claiming done | PASS | Verification checklist per story |
| Backend locked | PASS | No Supabase schema, API, or cron changes |
| Mobile-first (375px) | PASS | All layouts designed 375px up; desktop-primary per owner feedback |
| Light mode only | PASS | Orange #F97316 primary, Inter font |
| Commit at phase gates | PASS | After each user story implementation |

## Project Structure

### Documentation (this feature)

```text
specs/002-restoloop-frontend/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output — UI contracts
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/apps/web/
├── app/
│   ├── layout.tsx                    # Root layout (providers, fonts)
│   ├── page.tsx                      # Landing / redirect
│   ├── auth/
│   │   ├── layout.tsx                # Auth layout
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   ├── password-reset/
│   │   ├── confirm/                  # Email confirmation
│   │   └── callback/                 # Auth callback
│   ├── (home)/
│   │   ├── layout.tsx                # Authenticated layout (sidebar/nav)
│   │   ├── page.tsx                  # Dashboard (/home)
│   │   ├── customers/
│   │   │   └── page.tsx              # Customer list
│   │   ├── coupons/
│   │   │   └── page.tsx              # Coupon history
│   │   └── profile/
│   │       └── page.tsx              # Restaurant profile
│   ├── admin/
│   │   └── page.tsx                  # Admin panel (existing)
│   ├── form/
│   │   └── [slug]/
│   │       └── page.tsx              # Public intake form
│   └── api/                          # API routes (if needed)
├── components/
│   ├── ui/                           # shadcn/ui primitives
│   ├── kpi-card.tsx                  # Dashboard KPI card
│   ├── activity-feed.tsx             # Dashboard activity feed
│   ├── customer-table.tsx            # Sortable/searchable table
│   ├── coupon-list.tsx               # Filterable coupon list
│   ├── profile-form.tsx              # Editable profile form
│   ├── intake-form.tsx               # Public intake form
│   ├── app-logo.tsx                  # Existing
│   ├── react-query-provider.tsx      # Existing
│   └── root-providers.tsx            # Existing
├── lib/
│   ├── restoloop.types.ts            # TypeScript types (source of truth)
│   ├── server/                       # Server-side Supabase queries
│   ├── supabase/                     # Supabase client config
│   ├── utils.ts                      # Utilities
│   └── fonts.ts                      # Font config
├── supabase/
│   └── migrations/                   # Database schema (read-only)
└── config/
    └── auth.config.ts                # Auth configuration
```

**Structure Decision**: Single Next.js app (`src/apps/web/`) inside pnpm monorepo. Feature pages already scaffolded (auth/, (home)/, form/[slug]/). Plan fills in missing components and page implementations. No new workspaces needed.

## Complexity Tracking

> No violations. All gates pass.
