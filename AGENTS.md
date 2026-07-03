# AGENTS.md

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
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

Run `typecheck` + `lint` before claiming code works.

## Path Alias

`@/*` maps to `./src/*`. Use it: `import { createClient } from '@/lib/supabase/server'`

## Skills

Before implementing any slice, invoke relevant skills:

- **Server-side:** `server-actions`, `route-handlers`, `vercel-functions`
- **Database:** `supabase-postgres-best-practices`, `zod`
- **UI:** `frontend-design`, `tailwind-design-system`, `web-design-guidelines`
- **Testing:** `playwright-best-practices`, `playwright-visual-testing`
- **Billing:** `razorpay`
- **Guidelines:** `karpathy-guidelines`
- **Coding:** `ponytail` (lazy, minimal, YAGNI-first)
- **Deploy:** `deploy-to-vercel`

## Source of Truth

- `docs/BUSINESS_RULES.md` — business requirements (flexible, not law)
- `docs/superpowers/specs/2026-06-28-restoloop-design.md` — design spec
- `docs/superpowers/plans/` — slice implementation plans
- Never refer to `docs/Doc-Restoloop.md` (old, dead)
- Never mention old framework brand name

## Search & Navigation

**Default: graphify MCP.** Before `grep`/`glob`/`read`, query graphify:

| Task | Tool |
|------|------|
| Find where a concept/function lives | `query_graph` |
| Understand connections between modules | `get_neighbors` / `shortest_path` |
| Find files by glob pattern | `glob` |
| Search exact string/regex | `grep` |
| Read a known file | `read` |

Dispatch explorer agents when searching 5+ files, exploring unfamiliar areas, or finding everything related to X.

## Code Rules

- Follow existing patterns. Match style of neighboring files.
- No premature abstractions. No comments unless asked.
- **Theme:** Crimson & Warm Saffron light mode from `design-system/restoloop/MASTER.md`. No dark mode.
- Fetch current API docs via Context7 MCP before relying on memory.
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

## WhatsApp (Current State)

Two separate code paths needing unification:
- **Meta Cloud API:** Template sends (welcome, birthday, winback) via `graph.facebook.com/v20.0`
- **Third-party:** Free-text sends (welcome reminders) via ultramsg/evolution/waha
- **Target:** OpenWA adapter (`WHATSAPP_PROVIDER=openwa|meta`), one interface, two impls

## Security

- Never commit secrets or API keys. Never log secrets.
- RLS policies on every table.
- Input validation with Zod at trust boundaries.
- Cron endpoint uses `Authorization: Bearer <CRON_SECRET>` header.

## Testing

### Vitest Unit Tests (Mocked)
Run: `pnpm test`
Config: `vitest` (built into package.json scripts)

| File | Tests |
|------|-------|
| `src/app/auth/callback/route.test.ts` | 4 |
| `src/app/dashboard/coupons/actions.test.ts` | 9 |
| `src/app/dashboard/settings/actions.test.ts` | 9 |
| `src/app/dashboard/validate/actions.test.ts` | 8 |
| `src/app/dashboard/create/actions.test.ts` | 9 |
| `src/app/form/[slug]/actions.test.ts` | 8 |
| `src/app/admin/[id]/actions.test.ts` | 7 |
| `src/app/api/whatsapp/route.test.ts` | 8 |
| `src/app/api/razorpay/create-order/route.test.ts` | 5 |
| `src/app/api/razorpay/webhook/route.test.ts` | 6 |
| `src/app/api/cron/welcome-reminder/route.test.ts` | 6 |
| `src/lib/campaigns/index.test.ts` | 16 |
| `src/lib/whatsapp/openwa.test.ts` | 10 |
| `src/lib/whatsapp/adapter.test.ts` | 3 |
| `src/lib/utils.test.ts` | 6 |
| **Total** | **114** |

### Playwright E2E Tests (Real-World)
Run: `npx playwright test`
Config: `playwright.config.ts`
Setup: `npx playwright test --project=setup` (auto-creates test users in Supabase)

| File | Tests |
|------|-------|
| `tests/auth.setup.ts` | 2 (setup) |
| `tests/auth.spec.ts` | 3 |
| `tests/restaurant.spec.ts` | 1 |
| `tests/coupons.spec.ts` | 1 |
| `tests/validate.spec.ts` | 3 |
| `tests/admin.spec.ts` | 1 |
| `tests/intake-form.spec.ts` | 3 |
| **Total** | **14** |

Helpers: `tests/helpers/supabase.ts`
Auth state: `tests/.auth/` (gitignored)
