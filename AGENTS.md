# Restoloop

Customer retention platform for restaurants — QR-based intake, coupon engine, billing terminal, and guest analytics.

## Tech Stack

- Next.js 15 (App Router) + React 19
- TypeScript strict mode
- Supabase (auth, database, storage, RLS)
- TailwindCSS v4 + Shadcn UI
- Vitest + Playwright
- pnpm

## Commands

### Fast feedback (preferred)
```bash
pnpm typecheck
pnpm lint
pnpm test __tests__/path/to/specific.test.ts
```

### Full suite (only when requested)
```bash
pnpm test
pnpm build
npx playwright test
```

### Dev
```bash
pnpm run dev
```

### Supabase
```bash
supabase db reset
supabase gen types typescript --local > ./lib/database.types.ts
```

## Architecture

```
app/
├── auth/           Auth pages (sign-in, sign-up, callback, password-reset)
├── home/           Protected pages (dashboard, coupons, customers, restaurant-profile)
├── form/           Public intake forms (QR-based customer entry)
├── api/coupons/    Coupon validation endpoint
├── api/cron/       Scheduled jobs (campaign processing)
└── api/leads/      Lead capture

lib/
├── whatsapp.ts     WhatsApp messaging (Meta Cloud API + 3rd party: ultramsg, evolution, waha)
├── campaigns.ts    Campaign engine (winback @45d, birthday, 15d welcome reminders)
├── coupons.ts      Code generation + validation
├── tenant.ts       Tenant resolution helpers
├── supabase/       Supabase client (server + browser)
└── database.types.ts  Auto-generated (supabase gen types)

components/
└── ui/             Shadcn UI components

supabase/migrations/   SQL migrations (canonical source of truth)
__tests__/             Unit tests (Vitest)
.opencode/             OpenCode config (agents, skills, commands)
```

## Database

- `tenants` — restaurant owners (owner_id → auth.users, credits_balance)
- `customers` — (tenant_id, name, phone, birthday, last_visit)
- `coupons` — (type: welcome|bday|winback, status: pending|sent|redeemed|expired)
- `message_log` — WhatsApp delivery tracking
- `platform_credits` — super-admin wallet (single row, service-role only)

## Code Conventions

- Types derived from `Tables<'table_name'>` via `database.types.ts`
- Server components use `createClient()` from `~/lib/supabase/server`
- Client components use `'use client'` directive
- API routes use service client for elevated access
- RLS enforces tenant isolation (owner_id = auth.uid())
- `~/*` path alias maps to project root
- Tailwind for styling, no CSS modules
- No default exports except page.tsx and layout.tsx

## Rules

- File-scoped tests/lint/typecheck first, full suite only when asked
- Never commit unless explicitly asked
- Always check HANDOFF.md for current tasks before starting work
- Never modify `supabase/migrations/` without explicit request
- Never commit `.env` files or credentials
- Keep handlers thin, delegate business logic to lib/
