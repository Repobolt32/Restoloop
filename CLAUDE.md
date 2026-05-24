# Restoloop

WhatsApp-first customer outreach SaaS for Indian restaurants. Frontend rebuild over existing Supabase + WhatsApp backend.

## Project Map

- `src/apps/web/app/layout.tsx` — root layout, providers, fonts
- `src/apps/web/app/(home)/` — authenticated dashboard & restaurant profile
- `src/apps/web/app/admin/` — admin panel (tenant management)
- `src/apps/web/app/form/[slug]/` — public customer intake form
- `src/apps/web/lib/restoloop.types.ts` — shared TypeScript types (source of truth)
- `src/apps/web/lib/server/` — server-side data access (Supabase queries)
- `src/apps/web/components/` — shared UI components
- `src/apps/web/supabase/migrations/` — database schema (read-only)
- `src/apps/web/config/auth.config.ts` — authentication configuration
- `src/package.json` — pnpm workspace root, scripts

## Tech Stack

Next.js 15.5 (App Router) · React 19.2 · TypeScript 5.9 (strict) · Tailwind CSS 4 · Supabase (auth, db) · shadcn/ui · TanStack Query 5 · Playwright (E2E) · pnpm 10 · Turbo 2.5

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start all workspaces in dev mode |
| `pnpm build` | Build production bundle |
| `pnpm typecheck` | TypeScript type checking (all workspaces) |
| `pnpm lint` | ESLint across all workspaces |
| `pnpm test` | Run tests across all workspaces |
| `pnpm supabase:web:typegen` | Generate Supabase types |

## Lifecycle (Superpowers Only)

```
brainstorming → writing-plans → subagent-driven-development
                                   ├─ test-driven-development
                                   ├─ verification-before-completion
                                   └─ requesting-code-review
                                          → finishing-a-development-branch
```

## Hard Gates

| Gate | Enforcement |
|------|-------------|
| Ref-context verification | `superpowers:brainstorming` + `superpowers:writing-plans` |
| TDD: test before code | `superpowers:test-driven-development` |
| Plan before code (>2 files) | Plan Mode required |
| Verify before claiming done | `superpowers:verification-before-completion` |

## Where Tech Skills Fit

| Phase | Tech Skill Usage |
|-------|-----------------|
| brainstorming | Research API patterns via tech skill + ref-context |
| writing-plans | Estimate task granularity, identify testable units |
| subagent-driven-development | Enforce Next.js, Tailwind, Supabase conventions |
| test-driven-development | Generate idiomatic Playwright + Vitest tests |

## Rules

1. Plan is the contract. Wrong plan → back to brainstorming.
2. Commit at phase gates. Format: `type(scope): description`
3. WHEN >2 files change → THEN Plan Mode.
4. Mobile-first: design from 375px up, tablet breakpoint 768px.
5. Light mode only. Orange #F97316 primary, Inter font.
6. Backend is locked — no Supabase schema, API, or cron changes.

## Quick Reference

| Need | Tool |
|------|------|
| Define scope | `superpowers:brainstorming` |
| Break into tasks | `superpowers:writing-plans` |
| Execute tasks | `superpowers:subagent-driven-development` |
| Write code | `superpowers:test-driven-development` |
| Debug | `superpowers:systematic-debugging` |
| Verify | `superpowers:verification-before-completion` |
| Review | `superpowers:requesting-code-review` |
| Finish branch | `superpowers:finishing-a-development-branch` |
| E2E tests | `@.claude/skills/playwright-generate-test/SKILL.md` |
| Design / UI | `@.claude/skills/ui-ux-pro-max/SKILL.md` |

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Restoloop**

A WhatsApp-first customer outreach SaaS for Indian restaurants. Restaurant owners collect customer data via a public intake form, auto-send WhatsApp coupons (welcome, birthday, winback), and track results through a simple, mobile-friendly dashboard. The backend (Supabase, cron campaigns, WhatsApp API) is built and stable — this project is a complete frontend rebuild.

**Core Value:** Owner understands their dashboard in 10 seconds. Every feature must justify itself — default to removing, not adding.

### Constraints

- **Backend**: Zero changes to Supabase schema, APIs, cron jobs, or WhatsApp integration
- **No new API endpoints**: All needed endpoints exist
- **Mobile-first**: All layouts designed from 375px up, tablet breakpoint at 768px
- **Performance**: Page load < 2s on 3G
- **Accessibility**: WCAG 2.1 AA minimum
- **Browser**: Last 2 Chrome, Safari, Firefox
- **Design**: Light mode only (RestroBit-inspired), Inter font, orange #F97316 primary
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

| Skill | Description | Path |
|-------|-------------|------|
| code-review-excellence | Master effective code review practices to provide constructive feedback, catch bugs early, and foster knowledge sharing while maintaining team morale. Use when reviewing pull requests, establishing review standards, or mentoring developers. | `.claude/skills/code-review-excellence/SKILL.md` |
| e2e-testing-patterns | Master end-to-end testing with Playwright and Cypress to build reliable test suites that catch bugs, improve confidence, and enable fast deployment. Use when implementing E2E tests, debugging flaky tests, or establishing testing standards. | `.claude/skills/e2e-testing-patterns/SKILL.md` |
| "playwright-generate-test" | "Rules for generating E2E Playwright Tests" | `.claude/skills/playwright-generate-test/SKILL.md` |
| ui-ux-pro-max | "UI/UX design intelligence. 67 styles, 96 palettes, 57 font pairings, 25 charts, 13 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, mobile app, .html, .tsx, .vue, .svelte. Elements: button, modal, navbar, sidebar, card, table, form, chart. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, flat design. Topics: color palette, accessibility, animation, layout, typography, font pairing, spacing, hover, shadow, gradient. Integrations: shadcn/ui MCP for component search and examples." | `.claude/skills/ui-ux-pro-max/SKILL.md` |
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
