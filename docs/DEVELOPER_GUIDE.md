# Restoloop Developer Guide

> Everything you need to contribute. Verified against actual code June 2026.

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18.x+ | Runtime |
| PNPM | 8.x+ | Package manager |
| Supabase CLI | 2.x+ | Database management |
| OpenWA | latest | WhatsApp gateway (self-hosted, port 2785) — target provider |
| Docker | Latest | Local Supabase (optional) |

---

## Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd Restoloop
pnpm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_PRODUCT_NAME=Restoloop
NEXT_PUBLIC_SITE_TITLE=Restoloop
NEXT_PUBLIC_SITE_DESCRIPTION=Customer retention for restaurants
NEXT_PUBLIC_DEFAULT_LOCALE=en

# WhatsApp — Meta Cloud API (current default for template messages)
WA_PHONE_ID=your_phone_id
WA_TOKEN=your_permanent_token

# WhatsApp — Third-party provider (current for free-text sends)
# Provider options: ultramsg | evolution | waha
WHATSAPP_PROVIDER=ultramsg
WHATSAPP_API_URL=https://api.ultramsg.com/instance123
WHATSAPP_API_KEY=your_api_key
WHATSAPP_INSTANCE_ID=instance123

# WhatsApp — OpenWA (target provider, not yet wired)
# OPENWA_URL=http://localhost:2785
# OPENWA_API_KEY=your-api-key
# OPENWA_SESSION_ID=default

# Cron
CRON_SECRET=dev-cron-secret

# Admin
SUPER_ADMIN_USER_ID=your-user-uuid

# Support
NEXT_PUBLIC_SUPPORT_WHATSAPP=919999999999

# CI (bypass HTTPS requirement in local builds)
NEXT_PUBLIC_CI=1
```

### 3. Start Development

```bash
pnpm dev
```

App runs at `http://localhost:3000`.

---

## Project Structure

```
Restoloop/
├── app/              # Next.js App Router pages
│   ├── auth/         # Sign-in, sign-up, callback, password reset
│   ├── home/         # Protected dashboard
│   │   ├── page.tsx              # Hub: 3 quick-action cards
│   │   ├── customers/page.tsx    # Active guests (customers with unredeemed coupons)
│   │   ├── coupons/page.tsx      # Coupon history (all coupons)
│   │   └── restaurant-profile/   # Profile + coupon amount settings
│   ├── form/[slug]/  # Public web intake form (fallback onboarding)
│   ├── admin/        # Super admin panel
│   └── api/          # API routes (leads, coupons/validate, cron, whatsapp/webhook)
├── components/       # Shared React components
├── config/           # Configuration files
├── lib/              # Business logic
│   ├── campaigns.ts  # Campaign engine (batch dedup, parallel sends, credit tracking)
│   ├── coupons.ts    # Coupon code generation (8-char, no I/O/0/1)
│   ├── whatsapp.ts   # WhatsApp messaging (Meta templates + third-party free-text)
│   ├── tenant.ts     # Multi-tenant resolution (oldest-first tiebreaking)
│   ├── restoloop.types.ts  # Type aliases
│   └── supabase/     # Supabase client setup (server + browser)
├── supabase/         # Database migrations
├── __tests__/        # Test files (Vitest)
├── docs/             # Documentation
└── graphify-out/     # Knowledge graph
```

---

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Follow code conventions below
- Write tests for new features
- Keep the knowledge graph updated: `graphify update .`

### 3. Run Quality Checks

```bash
pnpm typecheck    # Type check
pnpm lint         # Lint
pnpm test         # Unit tests (47 tests)
```

---

## Code Conventions

### TypeScript
- **Strict mode** enabled
- Types derived from `Tables<'table_name'>` via `lib/database.types.ts`
- Avoid `any` — use proper types or `unknown`
- Type aliases in `lib/restoloop.types.ts`

### React Components
- `'use client'` directive for client components
- Server components for data fetching — no client-side query library (no TanStack Query)
- No default exports except `page.tsx` and `layout.tsx`

### Path Aliases
```typescript
import { Button } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/server';
import type { Tenant } from '~/lib/restoloop.types';
```

### API Routes
- Named exports for HTTP methods: `export async function POST()`, `export async function GET()`
- Service role client for routes that need elevated access (cron, public forms)
- Zod for input validation

---

## WhatsApp Adapter (Current State)

The WhatsApp layer has two separate paths that need unification:

### Template Messages (Meta Cloud API)
`sendWelcomeMessage()`, `sendBirthdayMessage()`, `sendWinbackMessage()` all delegate to `sendMetaMessage()`, which calls `graph.facebook.com/v20.0/{phoneId}/messages`. Uses WhatsApp template names: `welcome_coupon`, `birthday_coupon`, `winback_coupon`. Configured via `WA_PHONE_ID` and `WA_TOKEN` env vars.

### Free-Text Messages (Third-Party)
`sendThirdPartyMessage()` dispatches to ultramsg, evolution, or waha based on `WHATSAPP_PROVIDER`. Used for welcome reminders in the campaign engine. Configured via `WHATSAPP_API_URL`, `WHATSAPP_API_KEY`, `WHATSAPP_INSTANCE_ID`.

### Target: OpenWA Adapter
The goal is a unified decoupled adapter where all sends route through a single provider — OpenWA for dev, Meta for production. The OpenWA API is:

```
POST /api/sessions/{sessionId}/messages/send-text
Headers: X-API-Key, Content-Type: application/json
Body: { "chatId": "919876543210@c.us", "text": "message" }
```

The adapter should expose a single `MessageResult` interface and select the provider via `WHATSAPP_PROVIDER=openwa|meta`.

---

## Testing

### Unit Tests (Vitest)

```bash
pnpm test                      # Run all (47 tests)
pnpm test __tests__/path/to/file.test.ts  # Run specific
pnpm test:watch                # Watch mode
```

### Testing WhatsApp Webhook

For local webhook testing, expose localhost with ngrok:

```bash
ngrok http 3000
# Configure OpenWA webhook to https://<ngrok-url>/api/whatsapp/webhook
```

---

## Database

```bash
supabase start                                    # Start local Supabase
supabase db reset                                 # Reset database
supabase gen types typescript --local > ./lib/database.types.ts  # Generate types
```

### Migration Conventions

- **Never modify existing migrations** — create new ones
- `supabase/migrations/0001_initial.sql` is the canonical schema — do not touch
- Run `supabase db push` after creating migrations

---

## Current Bugs (Priority Order)

| # | Bug | File | Effort |
|---|-----|------|--------|
| 1 | `last_visit` not updated on coupon redeem | `app/api/coupons/validate/route.ts` | ~3 lines |
| 2 | Winback at 45 days, should be 40 | `lib/campaigns.ts` — date calculation | 1 line |
| 3 | Welcome reminder at 15 days, should be 25 | `lib/campaigns.ts` — date calculation | 1 line |
| 4 | Credit charged on failed WhatsApp send | `lib/campaigns.ts` — `sendCampaign()` error handling | ~10 lines |
| 5 | WhatsApp: Meta hardcoded, no OpenWA wired in | `lib/whatsapp.ts` + `lib/campaigns.ts` | ~50 lines |
| 6 | No opt-in model (column + webhook) | Schema migration + `app/api/whatsapp/webhook/route.ts` | ~100 lines + migration |

---

## Common Tasks

### Adding a New API Route
1. Create `app/api/your-route/route.ts`
2. Export named functions for HTTP methods
3. Add authentication if needed
4. Validate input with Zod

### Adding a New Server Action
1. Create `app/your-feature/_actions/your-action.ts`
2. Add `'use server'` directive
3. Export async function

### Adding a New Component
1. Create `components/your-component.tsx`
2. Use TypeScript interfaces for props
3. Add to `components/ui/` if generic/reusable

---

## Debugging

| Issue | Solution |
|-------|----------|
| `NEXT_PUBLIC_SITE_URL` validation error | Set `NEXT_PUBLIC_CI=1` for local builds |
| OpenWA connection refused | OpenWA must be running on port 2785; check if it's started |
| WhatsApp send failing | Check `WA_PHONE_ID`/`WA_TOKEN` for Meta, or `WHATSAPP_PROVIDER`/`WHATSAPP_API_URL`/`WHATSAPP_API_KEY` for third-party |
| RLS errors on public routes | Use service role client (`createServiceClient()`) in API routes |
| `invariant expected app router` in tests | Wrap component in router provider for tests |
| Campaign cron auth failure | Ensure `Authorization: Bearer <CRON_SECRET>` header is set; cron path bypasses middleware auth |

---

## Deployment

### Vercel

1. Connect repository to Vercel
2. Set all environment variables
3. Deploy
4. Set up cron job for daily campaign processing

### Cron Setup

```
GET https://restoloop.app/api/cron/process-campaigns
Authorization: Bearer <CRON_SECRET>
Schedule: Daily at 10:00 AM IST (0 10 * * *)
```

Campaign processing is idempotent — safe to run multiple times.

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `NEXT_PUBLIC_SITE_URL` | Yes | Production URL (HTTPS); local with `NEXT_PUBLIC_CI=1` |
| `WA_PHONE_ID` | For Meta sends | Meta Cloud API phone ID |
| `WA_TOKEN` | For Meta sends | Meta Cloud API access token |
| `WHATSAPP_PROVIDER` | For third-party sends | `ultramsg`, `evolution`, or `waha` |
| `WHATSAPP_API_URL` | For third-party sends | Provider API base URL |
| `WHATSAPP_API_KEY` | For third-party sends | Provider API key |
| `WHATSAPP_INSTANCE_ID` | For third-party sends | Provider instance ID |
| `CRON_SECRET` | Yes | Bearer token for cron jobs |
| `SUPER_ADMIN_USER_ID` | No | UUID of super admin user |
| `NEXT_PUBLIC_CI` | No | Set to `1` to bypass HTTPS requirement in local builds |

---

*Last updated: June 2026 — verified against actual code.*
