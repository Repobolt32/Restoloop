# Quickstart: Restoloop Frontend

**Phase 1 — Design & Contracts**  
**Date**: 2026-05-24

## Prerequisites

- Node.js 20+
- pnpm 10+
- Supabase project (already configured)
- Git

## Setup

```bash
# Install dependencies
pnpm install

# Generate Supabase types (if schema changed)
pnpm supabase:web:typegen

# Start dev server
pnpm dev
```

## Project Structure Overview

```
src/apps/web/          # Next.js application
├── app/               # App Router pages
│   ├── auth/          # Sign-in, sign-up, password reset
│   ├── (home)/        # Authenticated: dashboard, customers, coupons, profile
│   ├── form/[slug]/   # Public intake form
│   └── admin/         # Admin panel
├── components/        # Shared UI components
├── lib/               # Types, server queries, utilities
├── supabase/          # Migrations (read-only)
└── config/            # Auth configuration
```

## Key Technologies

| Technology | Purpose |
|-----------|---------|
| Next.js 15.5 App Router | Server + client routing, Server Components |
| React 19.2 | UI components |
| TypeScript 5.9 (strict) | Type safety |
| Tailwind CSS 4 | Utility-first styling |
| shadcn/ui | Accessible UI primitives |
| TanStack Query 5 | Client-side data fetching, caching |
| @supabase/ssr | Authentication, database access |
| Vitest | Unit/component tests |
| Playwright | E2E tests |

## Development Workflow

1. **Write test first** (TDD per CLAUDE.md gate)
2. **Implement component/page**
3. **Run tests**: `pnpm test`
4. **Type check**: `pnpm typecheck`
5. **Lint**: `pnpm lint`
6. **Commit**: `type(scope): description`

## Design Tokens

- Primary color: `#F97316` (Orange)
- Font: Inter (from `lib/fonts.ts`)
- Border radius: shadcn/ui defaults
- Light mode only

## Responsive Breakpoints

- Base: 375px (mobile)
- `sm`: 640px
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)
- `xl`: 1280px

## Running Tests

```bash
# Unit/component tests
pnpm test

# E2E tests
pnpm exec playwright test

# E2E with UI
pnpm exec playwright test --ui
```

## Useful Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start dev server (all workspaces) |
| `pnpm build` | Production build |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | ESLint |
| `pnpm supabase:web:typegen` | Regenerate Supabase types |
