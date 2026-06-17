# AGENTS.md

> Compact context for AI agents working in this repo.

## What This Is

Restoloop — multi-tenant SaaS for restaurant customer retention. QR intake → WhatsApp coupon campaigns (welcome, birthday, win-back).

## Commands

```bash
pnpm dev                    # Start dev server (turbopack)
pnpm build                  # Production build (needs NEXT_PUBLIC_CI=1 locally)
pnpm typecheck              # TypeScript check (tsc --noEmit)
pnpm lint                   # ESLint
pnpm format                 # Prettier check
pnpm test                   # Vitest unit tests
pnpm test:watch             # Vitest watch mode
```

**Build gotcha**: Zod validates `NEXT_PUBLIC_SITE_URL` must be HTTPS in production. For local builds:
```bash
NEXT_PUBLIC_CI=1 pnpm build
```

## Verified Commands

| Command | What it does | Notes |
|---------|--------------|-------|
| `pnpm test` | Runs Vitest | Tests in `__tests__/` |
| `pnpm test __tests__/dashboard/page.test.tsx` | Single test file | Path relative to root |
| `pnpm typecheck` | TypeScript strict check | 0 errors expected |
| `pnpm lint` | ESLint flat config | Has known warnings (~17 `no-unused-vars`) |
| `supabase migration new <name>` | Create new migration | Edit SQL, then `supabase db push` |

## Not Installed

- **Playwright**: `@playwright/test` is NOT in package.json. E2E tests exist in `__tests__/e2e/` but cannot run.
- Don't run `npx playwright test` — it will fail.

## Project Structure

```
app/           # Next.js App Router pages
  auth/        # Sign-in, sign-up, password reset
  home/        # Protected dashboard (sidebar layout)
  form/[slug]/ # Public intake form (per restaurant)
  admin/       # Super admin panel
  api/         # API routes
lib/           # Business logic (see Key Files below)
config/        # Zod-validated config
supabase/      # SQL migrations
__tests__/     # Unit tests (vitest) + e2e (playwright, broken)
docs/          # Documentation
```

## Key Files

### Business Logic

| File | What it does |
|------|--------------|
| `lib/campaigns.ts` | Campaign engine — winback (45d), birthday, 15-day welcome reminder |
| `lib/coupons.ts` | 8-char code generation (no I/O/0/1), expiry dates |
| `lib/whatsapp.ts` | Meta Cloud API + 3rd party (ultramsg/evolution/waha) |
| `lib/tenant.ts` | `getTenantForUser()` — tenant lookup |
| `lib/slug.ts` | URL slug generation |
| `lib/restoloop.types.ts` | All domain types (Tenant, Customer, Coupon, MessageLog, PlatformCredits) |

### API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/leads` | POST | None (service-role) | Customer intake, welcome coupon |
| `/api/coupons/validate` | POST | Session cookie | Validate coupon at restaurant |
| `/api/cron/process-campaigns` | GET | Bearer token | Run all campaigns |

### Config

| File | What it does |
|------|--------------|
| `config/app.config.ts` | Zod schema for env vars — validates at build time |
| `config/navigation.config.tsx` | Sidebar nav items |
| `config/paths.config.ts` | Route path constants |

## Database

### Client Selection

```typescript
import { createClient } from '~/lib/supabase/server';      // Respects RLS
import { createServiceClient } from '~/lib/supabase/server'; // Bypasses RLS
```

Use `createServiceClient()` for: public forms, admin, campaign processing.
Use `createClient()` for: user-facing dashboard operations.

### Schema Changes

1. Create migration: `supabase migration new add_column_name`
2. Update `lib/restoloop.types.ts`
3. Run `supabase db push`

Migrations are in `supabase/migrations/`. Current tables: `tenants`, `customers`, `coupons`, `message_log`, `platform_credits`, `accounts`.

## Environment Variables

### Required for build

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | |
| `SUPABASE_SERVICE_ROLE_KEY` | |
| `NEXT_PUBLIC_SITE_URL` | Must be HTTPS in prod. Set `NEXT_PUBLIC_CI=1` to bypass locally. |
| `CRON_SECRET` | Bearer token for cron endpoint |

### Optional (WhatsApp)

| Variable | Notes |
|----------|-------|
| `WA_PHONE_ID` | Falls back to simulation if missing |
| `WA_TOKEN` | Falls back to simulation if missing |
| `WHATSAPP_PROVIDER` | `ultramsg`, `evolution`, or `waha` |
| `WHATSAPP_API_URL` | |
| `WHATSAPP_API_KEY` | |
| `WHATSAPP_INSTANCE_ID` | |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | For Click-to-Chat URL in intake form |

## Testing

- Unit tests: Vitest with `@testing-library/react`
- E2E tests: **Not functional** — Playwright not installed, config points to wrong directory
- Tests that use Next.js hooks need `NextRouterProvider` wrapper
- Run `pnpm typecheck` before commits — strict TypeScript mode

## Multi-Tenancy

- RLS enforced at DB level — users can only see their own tenant's data
- Public routes (intake form, cron) use `createServiceClient()` to bypass RLS
- Tenant = restaurant. One user can own multiple tenants.

## Documentation

| File | Audience |
|------|----------|
| `docs/BUSINESS_RULES.md` | Non-technical stakeholders |
| `docs/ARCHITECTURE.md` | Developers |
| `docs/API_REFERENCE.md` | API consumers |
| `docs/DATABASE_SCHEMA.md` | DB schema reference |
| `docs/DEVELOPER_GUIDE.md` | New contributors |

---

*Verified against codebase. Last updated: June 2026.*
