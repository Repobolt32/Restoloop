# Restoloop Architecture

> Technical architecture reference for developers and architects.

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Browser (React 19 + Next.js 15 App Router)                     │
│  ├── Public Intake Form (/form/[slug])                          │
│  ├── Auth Pages (/auth/*)                                       │
│  ├── Dashboard (/home/*)                                        │
│  └── Admin Panel (/admin)                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        EDGE LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  Cloudflare Edge                                                │
│  ├── CSRF Protection (@edge-csrf/nextjs)                        │
│  └── Next.js Middleware (auth redirects, request ID)            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 15 Server (Node.js)                                    │
│  ├── Server Actions (form submissions, mutations)               │
│  ├── API Routes (/api/*)                                        │
│  └── Server Components (data fetching)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  lib/                                                           │
│  ├── campaigns.ts    (Campaign engine)                          │
│  ├── coupons.ts      (Coupon generation)                        │
│  ├── whatsapp.ts     (WhatsApp messaging)                       │
│  ├── tenant.ts       (Multi-tenant helper)                      │
│  └── slug.ts         (URL slug generation)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  Supabase                                                       │
│  ├── PostgreSQL Database (with RLS)                             │
│  ├── Supabase Auth (email/password)                             │
│  └── Row Level Security Policies                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
├─────────────────────────────────────────────────────────────────┤
│  ├── WhatsApp Meta Cloud API (template messages)                │
│  ├── WhatsApp 3rd Party (free-text messages)                    │
│  └── Cloudflare Turnstile (CAPTCHA)                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | Next.js | 15.5.9 | React framework with App Router |
| **Language** | TypeScript | 5.9.x | Type safety |
| **UI Library** | React | 19.2.1 | Component rendering |
| **Styling** | TailwindCSS | 4.1.14 | Utility-first CSS |
| **Components** | Shadcn UI | - | Pre-built UI components |
| **Database** | Supabase | 2.75.0 | PostgreSQL + Auth + RLS |
| **Validation** | Zod | 3.25.x | Schema validation |
| **Forms** | React Hook Form | 7.65.x | Form state management |
| **Testing** | Vitest | 3.1.x | Unit tests |
| **E2E Testing** | Playwright | - | End-to-end tests (not yet installed) |
| **Deployment** | Vercel | - | Serverless deployment |

---

## 3. Directory Structure

```
Restoloop/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (providers, fonts)
│   ├── page.tsx                 # Landing page (redirect to /home)
│   ├── robots.ts                # Robots.txt generation
│   ├── error.tsx                # Route-level error boundary
│   ├── global-error.tsx         # Global error boundary
│   ├── not-found.tsx            # 404 page
│   │
│   ├── auth/                    # Authentication pages
│   │   ├── sign-in/             # Sign in page + actions
│   │   ├── sign-up/             # Sign up page + actions
│   │   ├── callback/            # OAuth callback handler
│   │   ├── confirm/             # Email confirmation
│   │   ├── password-reset/      # Password reset flow
│   │   ├── update-password/     # Update password page
│   │   └── loading.tsx          # Auth loading state
│   │
│   ├── home/                    # Protected dashboard
│   │   ├── layout.tsx          # Dashboard layout (sidebar)
│   │   ├── page.tsx            # Home hub
│   │   ├── dashboard/          # Overview metrics
│   │   ├── customers/          # Active customers list
│   │   ├── coupons/            # Coupon management
│   │   └── restaurant-profile/ # Restaurant settings
│   │
│   ├── form/                    # Public intake forms
│   │   └── [slug]/             # Dynamic restaurant form
│   │
│   ├── admin/                   # Super admin panel
│   │   ├── page.tsx            # Admin dashboard
│   │   └── _components/        # Admin-specific components
│   │
│   └── api/                     # API routes
│       ├── coupons/validate/    # Coupon validation endpoint
│       ├── cron/                # Cron job endpoints
│       │   └── process-campaigns/
│       └── leads/               # Customer intake endpoint
│
├── components/                   # Shared React components
│   ├── ui/                      # Shadcn UI components
│   ├── app-logo.tsx             # App logo
│   └── root-providers.tsx       # Theme/context providers
│
├── config/                       # Configuration files
│   ├── app.config.ts            # App-wide config (Zod validated)
│   ├── auth.config.ts           # Auth providers config
│   ├── navigation.config.tsx     # Sidebar navigation
│   └── paths.config.ts          # Route paths
│
├── lib/                          # Business logic
│   ├── campaigns.ts             # Campaign processing engine
│   ├── coupons.ts               # Coupon code generation
│   ├── whatsapp.ts              # WhatsApp messaging
│   ├── tenant.ts                # Multi-tenant helper
│   ├── slug.ts                  # URL slug generation
│   ├── utils.ts                 # Utility functions (cn)
│   ├── fonts.ts                 # Font configuration
│   ├── restoloop.types.ts       # TypeScript type definitions
│   ├── supabase/                # Supabase client setup
│   │   ├── client.ts            # Browser client
│   │   └── server.ts            # Server client + service client
│   └── server/                  # Server utilities
│       └── require-user-in-server-component.ts
│
├── supabase/                     # Database
│   ├── migrations/              # SQL migration files
│   └── templates/               # Email templates
│
├── middleware.ts                  # Next.js middleware
├── instrumentation.ts            # Error tracking
├── global-setup.ts              # Playwright global setup
│
├── __tests__/                    # Test files
│   ├── coupons/                 # Coupon page tests
│   ├── customers/               # Customer page tests
│   ├── dashboard/               # Dashboard page tests
│   └── e2e/                     # Playwright E2E tests
│
├── public/                       # Static assets
│   └── images/                  # Images and favicons
│
├── styles/                       # Global styles
├── config files                  # Various configs
│   ├── next.config.mjs
│   ├── tailwind.config.ts (via postcss)
│   ├── vitest.config.ts
│   ├── playwright.config.ts
│   └── tsconfig.json
└── package.json
```

---

## 4. Authentication Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  User visits │────▶│  Middleware   │────▶│  Supabase    │
│  /auth/*     │     │  checks auth │     │  Auth        │
└──────────────┘     └──────────────┘     └──────────────┘
                              │                    │
                              ▼                    ▼
                     ┌──────────────┐     ┌──────────────┐
                     │  Redirect to │     │  Email/Pass  │
                     │  /home if    │     │  Login       │
                     │  authenticated│    └──────────────┘
                     └──────────────┘
```

### Middleware Rules

| Path | Auth Required | Behavior |
|------|---------------|----------|
| `/auth/*` | No | Redirect to `/home` if already authenticated |
| `/home/*` | Yes | Redirect to `/auth/sign-in` if not authenticated |
| `/admin` | Yes | Requires super admin role |
| `/form/[slug]` | No | Public, no auth required |
| `/api/cron/*` | Bearer Token | Protected by `CRON_SECRET` |

---

## 5. Multi-Tenancy Model

```
┌─────────────────────────────────────────────────────────┐
│                    Supabase RLS                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  User A ─────┬────▶ Tenant 1 (Restaurant A)             │
│              │      ├── customers                        │
│              │      ├── coupons                          │
│              │      └── message_log                      │
│              │                                           │
│  User B ─────┴────▶ Tenant 2 (Restaurant B)             │
│                     ├── customers                        │
│                     ├── coupons                          │
│                     └── message_log                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### RLS Policies

- Users can only access their own tenant's data
- Tenant lookup uses `owner_id = auth.uid()`
- Service role client bypasses RLS (for public forms and admin)

---

## 6. Campaign Engine

```
┌─────────────────────────────────────────────────────────┐
│                  Cron Job Trigger                        │
│               /api/cron/process-campaigns                │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                  processCampaigns()                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  For each tenant:                                        │
│  ├── 1. Win-back Campaign                               │
│  │   └── Find customers inactive for 45 days            │
│  │       └── Generate coupon + Send via Meta API        │
│  │                                                       │
│  ├── 2. Birthday Campaign                               │
│  │   └── Find customers with today's birthday           │
│  │       └── Generate coupon + Send via Meta API        │
│  │                                                       │
│  └── 3. 15-Day Welcome Reminder                         │
│      └── Find welcome coupons sent 15 days ago          │
│          └── Send free-text reminder via 3rd party      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 7. WhatsApp Integration

### 7.1 Meta Cloud API (Template Messages)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Campaign    │────▶│  WhatsApp    │────▶│  Customer    │
│  Engine      │     │  Meta API    │     │  Phone       │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │
       │                    ▼
       │           ┌──────────────┐
       │           │  Template    │
       │           │  Messages:   │
       │           │  - welcome   │
       │           │  - birthday  │
       │           │  - winback   │
       │           └──────────────┘
       │
       ▼
┌──────────────┐
│  Message Log │
│  (status)    │
└──────────────┘
```

### 7.2 Third-Party Providers (Free Text)

| Provider | API Endpoint | Auth Method |
|----------|--------------|-------------|
| Ultramsg | `/messages/chat` | Token in body |
| Evolution | `/message/sendText/{instanceId}` | API key header |
| WAHA | `/api/sendText` | Bearer token |

---

## 8. Data Flow

### 8.1 Customer Intake Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  QR     │───▶│  Form   │───▶│  API    │───▶│  Supa   │
│  Code   │    │  Submit │    │  /leads │    │  base   │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
                                    │
                                    ▼
                             ┌─────────────┐
                             │  1. Insert   │
                             │  customer    │
                             │  2. Create   │
                             │  coupon      │
                             │  3. Send WA  │
                             │  message     │
                             └─────────────┘
```

### 8.2 Coupon Validation Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│  Staff  │───▶│  Dashboard│──▶│  API    │
│  Enter  │    │  /coupons│    │  /validate│
│  Code   │    │          │    │         │
└─────────┘    └─────────┘    └─────────┘
                                    │
                                    ▼
                             ┌─────────────┐
                             │  1. Check   │
                             │  auth       │
                             │  2. Verify  │
                             │  coupon     │
                             │  3. Return  │
                             │  details    │
                             └─────────────┘
```

---

## 9. Security Architecture

### 9.1 Authentication

- **Provider**: Supabase Auth
- **Method**: Email/Password
- **Session**: JWT-based, stored in cookies
- **Middleware**: Checks auth status on every request

### 9.2 Authorization

- **Model**: Role-based (Restaurant Owner, Super Admin)
- **Enforcement**: Row Level Security (RLS) at database level
- **Service Role**: Bypasses RLS for public forms and admin operations

### 9.3 CSRF Protection

- **Library**: `@edge-csrf/nextjs`
- **Scope**: All state-changing operations
- **Implementation**: Edge middleware validates CSRF tokens

### 9.4 CAPTCHA

- **Provider**: Cloudflare Turnstile
- **Scope**: Public intake form
- **Component**: `@marsidev/react-turnstile`

---

## 10. Deployment

### 10.1 Platform

- **Provider**: Vercel
- **Runtime**: Node.js (serverless functions)
- **Edge**: Cloudflare (via Vercel Edge Network)

### 10.2 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `NEXT_PUBLIC_SITE_URL` | Yes | Production URL (HTTPS) |
| `WA_PHONE_ID` | No | WhatsApp Business phone ID (falls back to simulation if missing) |
| `WA_TOKEN` | No | WhatsApp Business API token (falls back to simulation if missing) |
| `WHATSAPP_PROVIDER` | No | 3rd party provider name (ultramsg/evolution/waha) |
| `WHATSAPP_API_URL` | No | 3rd party API URL |
| `WHATSAPP_API_KEY` | No | 3rd party API key |
| `WHATSAPP_INSTANCE_ID` | No | 3rd party instance ID |
| `CRON_SECRET` | Yes | Bearer token for cron jobs |
| `SUPER_ADMIN_USER_ID` | No | UUID of super admin user |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | No | Support WhatsApp number for Click-to-Chat |

### 10.3 Build

```bash
# Production build
pnpm build

# Requires NEXT_PUBLIC_CI=1 for local builds with HTTP URL
NEXT_PUBLIC_CI=1 pnpm build
```

---

## 11. Performance Considerations

### 11.1 Bundle Size

- Shared JS: ~102 KB
- Largest page: `/update-password` (48.6 KB)
- Most pages: < 5 KB

### 11.2 Caching

- Static pages: Pre-rendered at build time
- Dynamic pages: Server-rendered on demand
- API responses: No caching (real-time data)

### 11.3 Database Queries

- RLS policies add overhead (index-backed)
- Service role client used for public forms (bypasses RLS)
- Batch processing in campaign engine (per-tenant)

---

*Document generated from codebase analysis. Last updated: June 2026.*
