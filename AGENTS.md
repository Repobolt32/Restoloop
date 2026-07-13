# AGENTS.md

> **GRAPHIFY FIRST. ALWAYS. NO EXCEPTIONS.**
> Before any file read, grep, code edit, bug fix, architecture question, or search — run `graphify query` first.
> Never guess. Never rely on memory. Never read files cold. Query the graph.

Multi-tenant SaaS for restaurant customer retention. Owner signs up, creates restaurant, manages customers/coupons via dashboard. Customers fill public intake form, get WhatsApp messages.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
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

## Path Alias

`@/*` maps to `./src/*`. Example: `import { createClient } from '@/lib/supabase/server'`

## Source of Truth

- `progress.md` — **Primary status file**. Read at session start. Update before finishing any task.
- `docs/BUSINESS_RULES.md` — business requirements (flexible, not law)
- `docs/superpowers/specs/2026-06-28-restoloop-design.md` — design spec
- `docs/superpowers/plans/` — slice implementation plans
- `docs/TESTING.md` — full test file list (read only when writing tests)
- Never refer to `docs/Doc-Restoloop.md` (old, dead)
- `docs/DEVELOPER_GUIDE.md` has stale directory structure (references old `app/` at root, not `src/app/`)

## Directory Structure

```
src/
├── app/
│   ├── signup/     # auth: signup form
│   ├── login/      # auth: login form
│   ├── auth/       # auth callback
│   ├── dashboard/  # owner dashboard (customers, coupons, validate, settings)
│   ├── admin/      # super admin panel
│   ├── form/       # public customer intake form
│   └── api/        # route handlers (whatsapp webhook, cron, razorpay)
├── lib/
│   ├── supabase/   # client.ts (browser) + server.ts (server)
│   └── whatsapp/   # WhatsApp adapter (OpenWA + Meta)
├── middleware.ts    # auth guard: redirects unauthenticated to /login
supabase/migrations/ # SQL migrations
tests/               # Playwright E2E specs
docs/                # business rules, design spec, plans
```

## Search & Navigation — MANDATORY

**graphify is the ONLY way to start any task.** No exceptions.

| Situation | What to do |
|-----------|------------|
| Any bug fix | `graphify query "<symptom>"` before touching any file |
| Any feature | `graphify query "<feature area>"` to find related files |
| Any file edit | `graphify query "<file or concept>"` to understand connections first |
| Any grep/glob | Run `graphify query` first — only use grep if graph doesn't have the answer |
| Two related things | `graphify path "<A>" "<B>"` to trace the connection |
| Unknown area | `graphify explain "<concept>"` before reading any file |
| Broad architecture | Read `graphify-out/wiki/index.md` if it exists, else `GRAPH_REPORT.md` |

**NEVER:**
- Read a file cold without querying graphify first
- Grep before trying graphify
- Assume you know where something lives
- Fix a bug without tracing its full call path in the graph

After modifying any code: run `graphify update .` to keep graph current.

## Code Rules

- **Startup order**: (1) read `progress.md`, (2) check relevant skills, (3) `graphify query` before any code work, (4) answer.
- **Progress**: Update `progress.md` at end of every feature slice or session.
- Follow existing patterns. Match style of neighboring files.
- No premature abstractions. One implementation = no interface.
- No comments unless asked.
- **Theme**: Crimson & Warm Saffron light mode from `design-system/restoloop/MASTER.md`. No dark mode. Typography: Playfair Display SC / Karla.
- Load `ponytail` skill for all coding tasks — lazy, minimal, YAGNI-first.
- Fetch current API docs via Context7 MCP before relying on memory for signatures.
- Before making an implementation plan from a slice plan, read all tech skill `.md` files specified in that plan.

## Domain Conventions

- **Money:** All amounts in `cents` (integer). No floats.
- **Phone:** E.164 format `919876543210` (no `+` prefix).
- **Slug:** Auto-generated from restaurant name, owner can edit.
- **Birthday:** `date` type, year-agnostic MM-DD matching in cron.
- **RLS:** Every table has `owner_id = auth.uid()` or `tenant_id` policies.
- **Supabase helpers:** `createClient()` from `@/lib/supabase/server` (server) or `@/lib/supabase/client` (browser).
- **Auth middleware:** Unauthenticated users redirected to `/login` except `/login`, `/signup`, `/form`.
- **Unit tests:** Vitest, files at `src/**/*.test.{ts,tsx}`.
- **E2E tests:** Playwright, files at `tests/slice-N.spec.ts`.

## WhatsApp

Two separate code paths needing unification:
- **Meta Cloud API:** Template sends (welcome, birthday, winback) via `graph.facebook.com/v20.0`
- **Third-party:** Free-text sends (welcome reminders) via ultramsg/evolution/waha
- **Target:** OpenWA adapter (`WHATSAPP_PROVIDER=openwa|meta`), one interface, two impls

## Security

- Never commit secrets or API keys. Never log secrets.
- RLS policies on every table.
- Input validation with Zod at trust boundaries.
- Cron endpoint uses `Authorization: Bearer <CRON_SECRET>` header.

## Skills

Before implementing any slice, invoke relevant skills:

- **Server-side:** `server-actions`, `route-handlers`, `vercel-functions`
- **Database:** `supabase-postgres-best-practices`, `zod`
- **UI:** `frontend-design`, `tailwind-design-system`, `web-design-guidelines`
- **Testing:** `playwright-best-practices`, `playwright-visual-testing`
- **Billing:** `razorpay`
- **Coding:** `ponytail` (lazy, minimal, YAGNI-first)
- **Deploy:** `deploy-to-vercel`

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
