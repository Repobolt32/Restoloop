# Restoloop (Gemini/Antigravity Rules)

Multi-tenant SaaS for restaurant customer retention. Owner signs up, creates restaurant, manages customers/coupons via dashboard. Customers fill public intake form, get WhatsApp messages.

## Stack

- Next.js 16 (App Router) + TypeScript 6 + Tailwind CSS v4
- Supabase (Postgres + Auth + RLS) via `@supabase/ssr`
- Vercel deploy
- pnpm package manager

## Commands

```bash
pnpm dev          # start dev server
pnpm build        # production build
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint (next/core-web-vitals)
pnpm test         # vitest run --passWithNoTests
pnpm test:watch   # vitest watch
pnpm test:e2e     # playwright test (auto-starts dev server)
```

Always run `typecheck` + `lint` before claiming code works. If `build` fails, it's not done.

## Source of Truth

- `docs/BUSINESS_RULES.md` - business requirements (flexible, not law)
- `docs/superpowers/specs/2026-06-28-restoloop-design.md` - design spec
- `docs/superpowers/plans/` - directory containing individual slice implementation plans (e.g., `slice-1.md`, `2026-06-30-slice-7-credits.md`). When implementing a slice, the agent must load the required skill/sub-skill specified in the slice plan file.
- Never refer to `docs/Doc-Restoloop.md` (old, dead)
- `docs/DEVELOPER_GUIDE.md` has stale directory structure (references old `app/` at root, not `src/app/`)

## Directory Structure

```text
src/
|- app/
|  |- signup/        # auth: signup form
|  |- login/         # auth: login form
|  |- auth/          # auth callback
|  |- dashboard/     # owner dashboard (customers, coupons, validate, settings)
|  |- admin/         # super admin panel (future slice)
|  |- form/          # public customer intake form (future slice)
|  `- api/           # route handlers (future slices)
|- lib/
|  |- supabase/      # client.ts (browser) + server.ts (server)
|  `- whatsapp/      # WhatsApp adapter (future slice)
|- middleware.ts     # auth guard: redirects unauthenticated to /login
supabase/migrations/ # 001_initial_schema.sql, 002_rls_policies.sql
tests/               # Playwright E2E specs (slice-N.spec.ts) and supporting test files
docs/                # business rules, design spec, implementation plan
```

**Note:** `form/`, `admin/`, and `api/` routes are future slices (S2-S8). Only `signup/`, `login/`, `auth/`, and `dashboard/` exist now.

## Path Alias

`@/*` maps to `./src/*`. Use it: `import { createClient } from '@/lib/supabase/server'`

## Agent Loop (PM -> Coder -> Tester)

When asked to implement a slice ("Run S1", "do Slice 2"):

1. **PM** reads the slice plan from `docs/superpowers/plans/` (e.g., `docs/superpowers/plans/slice-1.md`), extracts concrete tasks, constraints, and expected behavior. It MUST load the required skill/sub-skill specified in the plan (e.g., `superpowers:subagent-driven-development` or `superpowers:executing-plans`). **Additionally, whenever making an implementation plan by reading a slice plan from `docs/superpowers/plans/`, the agent must read the tech-related skills specified in that slice plan and also mention/document those skills in the resulting `implementation_plan.md`.**
2. **PM** dispatches `coder` subagent with the slice tasks and relevant context.
3. **Coder** writes targeted tests for the requested behavior, then implements to pass.
4. **PM** dispatches `tester` subagent with the slice task description, spec path, and coder's summary.
5. **Tester** runs the relevant verification commands and audits whether the behavior matches the slice plan. Trivial or missing checks are BLOCKED, not PASS.
6. **PM** judges tester's evidence. All required behavior verified -> VERIFIED. Any FAIL -> re-dispatch coder. Max 3 retries.

## Code Rules

- Follow existing patterns. Match style of neighboring files.
- No premature abstractions. One implementation = no interface.
- No comments unless asked.
- Global Styling Rule: Strictly follow the Crimson & Warm Saffron light mode theme defined in [MASTER.md](file:///e:/desktop/Restoloop/design-system/restoloop/MASTER.md) across the entire application (including login, signup, intake forms, dashboard, and all future pages). No dark mode is allowed, and all styling must use the defined Tailwind variables/CSS variables for colors, typography (Playfair Display SC / Karla), and spacing.
- Load `ponytail` skill for all coding tasks - lazy, minimal, YAGNI-first
- Fetch current API docs via Context7 MCP before relying on memory for signatures

## Domain Conventions

- **Money:** All amounts in `cents` (integer). No floats.
- **Phone:** E.164 format `919876543210` (no `+` prefix).
- **Slug:** Auto-generated from restaurant name, owner can edit.
- **Birthday:** `date` type, year-agnostic MM-DD matching in cron.
- **RLS:** Every table has `owner_id = auth.uid()` or `tenant_id` policies.
- **Supabase helpers:** `createClient()` from `@lib/supabase/server` (server) or `@lib/supabase/client` (browser).
- **Auth middleware:** Unauthenticated users redirected to `/login` except `/login`, `/signup`, `/form`.
- **Unit tests:** Vitest, files at `src/**/*.test.{ts,tsx}`.
- **E2E tests:** Playwright, files at `tests/slice-N.spec.ts`. Cover the requested user-visible behavior for the slice. Auto-starts dev server via `playwright.config.ts`.

## WhatsApp (Current State)

Two separate code paths that need unification:
- **Meta Cloud API:** Template sends (welcome, birthday, winback) via `graph.facebook.com/v20.0`
- **Third-party:** Free-text sends (welcome reminders) via ultramsg/evolution/waha
- **Target:** OpenWA adapter (`WHATSAPP_PROVIDER=openwa|meta`), one interface, two impls

## Security

- Never commit secrets or API keys
- Never log secrets
- RLS policies on every table
- Input validation with Zod at trust boundaries
- Cron endpoint uses `Authorization: Bearer <CRON_SECRET>` header

## 8 Slices (Execution Order)

| Slice | Name | What It Ships |
|-------|------|---------------|
| S1 | Hello Restoloop | signup -> restaurant -> empty dashboard |
| S2 | Customer joins | QR -> WhatsApp opt-in -> welcome coupon |
| S3 | Owner sees activity | dashboard tables, recent activity feed |
| S4 | First campaign fires | cron, welcome reminder (25d) |
| S5 | Birthday + winback fire | remaining 2 campaign types |
| S6 | Coupon redemption | validation screen, last_visit_at update |
| S7 | Credits work | Razorpay self-serve top-up |
| S8 | Admin sees all | super admin panel |
