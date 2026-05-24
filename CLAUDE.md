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

