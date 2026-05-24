# Tasks: Restoloop Frontend

**Input**: Design documents from `/specs/002-restoloop-frontend/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Reality check**: Codebase audit done. Auth, intake form, profile, customers page, admin panel, backend services, API routes — all already built. Task list focuses on: Stitch eradication, dashboard wiring, coupons page, sign-out, cleanup.

**Tests**: TDD gate enforced. Vitest + Playwright per CLAUDE.md.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Exact file paths in descriptions

---

## Phase 1: Stitch Eradication (Blocking Prerequisites)

**Purpose**: App won't compile with missing StitchPortal/StitchCard/StitchButton/StitchInput references. Replace all with existing shadcn/ui components or plain Tailwind. EVERY task depends on this.

**CRITICAL**: No other work until this phase completes.

- [ ] T001 Replace StitchCard + StitchPortal in `src/apps/web/app/home/layout.tsx` — StitchPortal → `<div>`, keep LowCreditsBanner, keep children wrapper
- [ ] T002 [P] Replace StitchCard in `src/apps/web/app/home/page.tsx` — 3 nav cards → plain `<div>` with same Tailwind classes (bg-neutral-900/40 border-white/5 rounded-xl p-8 etc.), keep Link wrappers and icons
- [ ] T003 [P] Replace StitchCard in `src/apps/web/app/admin/page.tsx` — replace import, use plain `<div>` with same styling for stat cards and tenant table wrapper
- [ ] T004 [P] Replace StitchCard + StitchInput + StitchButton in `src/apps/web/app/home/restaurant-profile/_components/ProfileForm.tsx` — StitchCard → `<div>` with same classes, StitchInput → shadcn `<Input>` (already imported), StitchButton → shadcn `<Button>` (already imported) with variant="default" size="lg"
- [ ] T005 [P] Replace StitchPortal in `src/apps/web/app/home/restaurant-profile/page.tsx` — StitchPortal → `<div>` or `<>` fragment
- [ ] T006 [P] Clean up stitch tokens from `src/apps/web/styles/theme.css` — remove lines 64-75 (--color-stitch-*, --stitch-glow-*), replace `bg-stitch-orange` reference in `src/apps/web/components/app-logo.tsx` line 10 with `bg-[#F97316]`
- [ ] T007 [P] Remove old spec docs referencing Stitch — delete or update `src/docs/superpowers/specs/2026-05-18-qr-flyer-generator-design.md` and `src/docs/superpowers/plans/2026-05-18-qr-flyer-generator-plan.md` if still present (Stitch references in design docs)

**Checkpoint**: App compiles. `pnpm typecheck && pnpm build` passes. No Stitch references remain.

---

## Phase 2: Dashboard — Real Data Wiring (Priority: P1)

**Goal**: Dashboard at `/home/dashboard` shows real KPIs and activity feed instead of `--` placeholders. API `/api/dashboard/stats` already exists and returns all needed data.

**Independent Test**: Sign in. Navigate to `/home/dashboard`. KPI cards show real numbers. Activity feed shows recent customer signups.

### Tests for Dashboard

- [ ] T008 [P] [US2] [TDD] Vitest unit test for dashboard page — loading state, data display, error state in `src/apps/web/__tests__/dashboard/page.test.tsx`
- [ ] T009 [P] [US2] [TDD] Playwright E2E test — dashboard loads with real KPIs, activity feed populated, low-credit banner appears when credits < 50 in `e2e/dashboard.spec.ts`

### Implementation

- [ ] T010 [US2] [SUBAGENT] [REF:next.js,tanstack-query] [VERIFY:pnpm typecheck] Convert `src/apps/web/app/home/dashboard/page.tsx` to client component — fetch from `/api/dashboard/stats`, display 3 KPI cards (Total Customers, Coupons Sent, Credits Remaining) using real data, replace `--` placeholders
- [ ] T011 [US2] [SUBAGENT] [REF:next.js] Add activity feed section below KPIs — show recent customer signups from API response (`recentActivity` array), format time-ago labels
- [ ] T012 [US2] Add coupon stats breakdown — welcome/birthday/winback sent/redeemed counts from API response (`couponStats`)
- [ ] T013 [US2] [SUBAGENT] [REF:next.js,react] Fix `LowCreditsBanner` in `src/apps/web/app/home/layout.tsx` — change threshold from `< 100` to `< 50` per spec, restyle from red to orange (#F97316) accent, keep WhatsApp link

**Checkpoint**: [CHKPT] Dashboard functional. Owner sees real KPIs, activity, and low-credit warning.

---

## Phase 3: Coupons History Page (Priority: P2)

**Goal**: `/home/coupons` page exists (currently 404). Shows read-only list of all coupons with type filter. No create/edit controls.

**Independent Test**: Navigate to `/home/coupons`. See coupon list with Code, Type, Discount, Status, Sent Date, Customer. Filter by type. No create/edit buttons.

### Tests for Coupons

- [ ] T014 [P] [US4] [TDD] Vitest unit test for coupon list — type filter, display mapping, empty state in `src/apps/web/__tests__/coupons/page.test.tsx`
- [ ] T015 [P] [US4] [TDD] Playwright E2E test — navigate to coupons, filter by type, verify read-only in `e2e/coupons.spec.ts`

### Implementation

- [ ] T016 [US4] [SUBAGENT] [REF:next.js,supabase] [VERIFY:pnpm typecheck] Create `src/apps/web/app/home/coupons/page.tsx` — server component, fetch all coupons for tenant with customer name join, render table: Code, Type (badge), Discount, Status, Sent Date, Customer Name
- [ ] T017 [US4] [SUBAGENT] [REF:next.js] Add type filter — client component wrapper or searchParams, filter by welcome/bday/winback/all
- [ ] T018 [US4] [SUBAGENT] [REF:next.js] Add empty state — "No coupons sent yet" when list is empty, "No coupons match filter" when filter returns empty
- [ ] T019 [US4] [SUBAGENT] [REF:next.js] Add loading state in `src/apps/web/app/home/coupons/loading.tsx` — skeleton table

**Checkpoint**: [CHKPT] Coupons page functional. Owner can view and filter coupon history.

---

## Phase 4: Sign-Out & Navigation Polish (Priority: P1)

**Goal**: Owner can sign out from any authenticated page. Navigation between pages is clear.

**Independent Test**: Click sign-out from dashboard. Session ends, redirected to sign-in.

### Implementation

- [ ] T020 [US1] [SUBAGENT] [REF:next.js,supabase] [VERIFY:pnpm typecheck] Create `src/apps/web/components/sign-out-button.tsx` — server action calling `supabase.auth.signOut()`, redirect to `/auth/sign-in`, styled button
- [ ] T021 [US1] [SUBAGENT] [REF:next.js] Add sign-out button to `src/apps/web/app/home/layout.tsx` — place in top-right or bottom of sidebar area
- [ ] T022 [US1] Add simple navigation between pages — ensure home page cards link correctly: Dashboard (`/home/dashboard`), Active Guests (`/home/customers`), Coupons (`/home/coupons`), Profile (`/home/restaurant-profile`)

**Checkpoint**: [CHKPT] Navigation complete. Owner can move between all pages and sign out.

---

## Phase 5: Customer List — Align with Spec (Priority: P2)

**Goal**: `/home/customers` currently shows "Active Guests" (active coupons). Spec requires customer list with Name, Phone, Birthday, Last Visit, Visit Count, Customer Since. Transform or add proper customer table view while keeping active guest view as useful.

**Decision**: Keep existing "Active Guests" as is (it works, provides value). Add proper customer list at same route with tab or section toggle. If too complex, just add columns to existing table.

**Independent Test**: Navigate to `/home/customers`. See all customers with full details. Sort by name. Search by name/phone.

### Tests for Customer List

- [ ] T023 [P] [US3] [TDD] Vitest unit test for customer table — sort, search, empty state in `src/apps/web/__tests__/customers/page.test.tsx`
- [ ] T024 [P] [US3] [TDD] Playwright E2E test — navigate to customers, sort, search, verify view-only in `e2e/customers.spec.ts`

### Implementation

- [ ] T025 [US3] [SUBAGENT] [REF:next.js,supabase] [VERIFY:pnpm typecheck] Refactor `src/apps/web/app/home/customers/page.tsx` — fetch all customers (not just active coupons), display columns: Name, Phone, Birthday, Last Visit, Visit Count, Customer Since. Keep simple. Server component.
- [ ] T026 [US3] [SUBAGENT] [REF:next.js] Add sort by column headers — click Name/Phone/Birthday to toggle asc/desc via searchParams, server-side sort
- [ ] T027 [US3] [SUBAGENT] [REF:next.js,supabase] Add search input — searchParams-based server-side filter by name or phone ILIKE
- [ ] T028 [US3] [SUBAGENT] [REF:next.js] Add empty and no-results states

**Checkpoint**: [CHKPT] Customer list matches spec. Searchable, sortable, view-only.

---

## Phase 6: Polish & Final Validation

- [ ] T029 [P] [VERIFY:pnpm dev] Verify all pages render at 375px viewport — no horizontal scroll, readable text
- [ ] T030 [P] [VERIFY:pnpm lint] WCAG 2.1 AA check — color contrast (orange #F97316 on white), keyboard navigation, form labels
- [ ] T031 [VERIFY:pnpm test && pnpm exec playwright test] Run full test suite, all must pass
- [ ] T032 [VERIFY:pnpm typecheck && pnpm lint && pnpm build] Run typecheck + lint + build, zero errors
- [ ] T033 [CHKPT] Run quickstart.md validation — `pnpm install && pnpm dev`, confirm all pages load

---

## Dependencies & Execution Order

```
Phase 1 (Stitch Eradication) ← BLOCKS EVERYTHING
    ↓
Phase 2 (Dashboard) ← can run parallel with Phase 3, 4, 5
Phase 3 (Coupons)   ← independent
Phase 4 (Sign-Out)  ← independent
Phase 5 (Customers) ← independent
    ↓
Phase 6 (Polish)
```

**Phase 1 must complete first** — app won't compile until Stitch references are gone. Phases 2-5 can then run in any order or parallel.

---

## Parallel Execution Example

```bash
# After Phase 1 completes, launch all feature phases in parallel:
Task: "Wire dashboard page to /api/dashboard/stats"
Task: "Create coupons history page"
Task: "Create sign-out button + nav links"
Task: "Refactor customers page to show customer list"
```

---

## Implementation Strategy

### MVP (Minimal)

1. Phase 1: Stitch eradication → app compiles
2. Phase 2: Dashboard wiring → real data on home screen
3. Phase 4: Sign-out + nav → usable navigation
4. **STOP**: Deployable — owners can sign in, see dashboard, navigate, sign out

### Full

5. Phase 3: Coupons history → visibility into sent coupons
6. Phase 5: Customer list → proper customer browsing
7. Phase 6: Polish → responsive + a11y + tests green

---

## Notes

- Zero backend changes — all APIs, services, triggers already exist and work
- No new dependencies — use existing shadcn/ui (Button, Input already installed), plain Tailwind for cards
- Keep existing working pages intact — only touch files that reference Stitch or need data wiring
- Don't over-engineer — plain `<div>` with Tailwind > new component abstraction
- Light mode spec says orange #F97316 primary — but existing code is dark theme. Keep existing dark theme (it works, looks good). Don't redesign.
- Commit at each phase gate: `type(scope): description`
