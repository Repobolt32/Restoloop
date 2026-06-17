# Restoloop Developer Guide

> Everything you need to know to contribute to Restoloop.

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18.x+ | Runtime |
| PNPM | 8.x+ | Package manager |
| Supabase CLI | 2.x+ | Database management |
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

Edit `.env.local` with your Supabase credentials:

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
NEXT_PUBLIC_DEFAULT_THEME_MODE=dark
NEXT_PUBLIC_THEME_COLOR=#ffffff
NEXT_PUBLIC_THEME_COLOR_DARK=#0a0a0a

# WhatsApp (optional for dev)
WA_PHONE_ID=your_phone_id
WA_TOKEN=your_token

# Cron
CRON_SECRET=dev-cron-secret

# Admin
SUPER_ADMIN_USER_ID=your-user-uuid
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
├── components/       # Shared React components
├── config/           # Configuration files
├── lib/              # Business logic
├── supabase/         # Database migrations
├── __tests__/        # Test files
├── public/           # Static assets
└── docs/             # Documentation
```

---

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Follow the code conventions below
- Write tests for new features
- Update documentation if needed

### 3. Run Quality Checks

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests
pnpm test
```

### 4. Commit

```bash
git add .
git commit -m "feat: add your feature description"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

---

## Code Conventions

### TypeScript

- **Strict mode** enabled
- Use explicit types for function parameters and return values
- Avoid `any` - use proper types or `unknown`
- Use interfaces for object shapes

```typescript
// Good
interface Customer {
  id: string;
  name: string;
  phone: string;
}

function getCustomer(id: string): Promise<Customer | null> {
  // ...
}

// Bad
function getCustomer(id) {
  // ...
}
```

### React Components

- Use functional components with TypeScript
- Use `'use client'` directive for client components
- Use `'use server'` directive for server actions

```typescript
// Client Component
'use client';

import { useState } from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
}

export function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}
```

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `Button.tsx`, `UserProfile.tsx` |
| Pages | lowercase | `page.tsx`, `layout.tsx` |
| Utilities | camelCase | `utils.ts`, `slug.ts` |
| Config | camelCase | `app.config.ts` |
| Tests | `*.test.tsx` | `page.test.tsx` |
| E2E Tests | `*.spec.ts` | `admin.spec.ts` |

### Import Order

```typescript
// 1. React/Next.js imports
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party libraries
import { z } from 'zod';
import { useForm } from 'react-hook-form';

// 3. Internal components
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';

// 4. Internal utilities
import { cn } from '~/lib/utils';
import { generateCouponCode } from '~/lib/coupons';

// 5. Types
import type { Tenant } from '~/lib/restoloop.types';
```

### Path Aliases

```typescript
// Use ~ for app directory
import { Button } from '~/components/ui/button';

// Use ~/config for config
import appConfig from '~/config/app.config';

// Use ~/lib for business logic
import { createClient } from '~/lib/supabase/server';
```

---

## Testing

### Unit Tests (Vitest)

```bash
# Run all tests
pnpm test

# Run in watch mode
pnpm test:watch

# Run specific file
pnpm test __tests__/dashboard/page.test.tsx
```

### Writing Tests

```typescript
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { Button } from '~/components/ui/button';

it('renders button with label', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### E2E Tests (Playwright)

> **Note**: Playwright is not yet installed in this project. E2E test files exist but cannot run. Install with `pnpm add -D @playwright/test` and `npx playwright install` before using.

```bash
# Install Playwright (not yet done)
npx playwright install

# Run all E2E tests
npx playwright test

# Run specific test
npx playwright test __tests__/e2e/admin.spec.ts

# Run with UI
npx playwright test --ui
```

### Writing E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test('shows tenant list', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('text=Tenants')).toBeVisible();
  });
});
```

---

## Database

### Local Development

```bash
# Start local Supabase
supabase start

# Reset database
supabase db reset

# Run migrations
supabase db push

# Generate types
supabase gen types typescript --local > ./lib/database.types.ts
```

### Creating Migrations

```bash
# Create new migration
supabase migration new your_migration_name

# Edit the generated SQL file
# Then apply
supabase db push
```

### Database Testing

```bash
# Run pgTAP tests
pnpm supabase:test

# Lint database
pnpm supabase:db:lint
```

---

## Configuration

### App Config (`config/app.config.ts`)

Validated with Zod. All environment variables are required:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_PRODUCT_NAME` | App name |
| `NEXT_PUBLIC_SITE_TITLE` | Default title tag |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | Default description |
| `NEXT_PUBLIC_SITE_URL` | Production URL (HTTPS) |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | Default locale |
| `NEXT_PUBLIC_DEFAULT_THEME_MODE` | Theme (light/dark/system) |
| `NEXT_PUBLIC_THEME_COLOR` | Light theme color |
| `NEXT_PUBLIC_THEME_COLOR_DARK` | Dark theme color |

### Navigation Config (`config/navigation.config.tsx`)

Defines sidebar navigation items. Edit to add/remove pages.

---

## Common Tasks

### Adding a New Page

1. Create `app/your-page/page.tsx`
2. Add to navigation config if needed
3. Add RLS policies if it requires data access

### Adding a New API Route

1. Create `app/api/your-route/route.ts`
2. Export named functions for HTTP methods (GET, POST, etc.)
3. Add authentication if needed

### Adding a New Server Action

1. Create `app/your-feature/_actions/your-action.ts`
2. Add `'use server'` directive
3. Export async function

### Adding a New Component

1. Create `components/your-component.tsx`
2. Use TypeScript interfaces for props
3. Add to `components/ui/` if it's a generic UI component

---

## Debugging

### Common Issues

| Issue | Solution |
|-------|----------|
| `invariant expected app router to be mounted` | Wrap component in `NextRouterProvider` for tests |
| `NEXT_PUBLIC_SITE_URL` validation error | Set `NEXT_PUBLIC_CI=1` for local builds |
| WhatsApp API errors | Check `WA_PHONE_ID` and `WA_TOKEN` |
| RLS errors | Ensure service role client is used for public routes |

### Logging

```typescript
// Use console for debugging
console.log('Debug:', variable);

// Use console.error for errors
console.error('Error:', error);

// Use console.warn for warnings
console.warn('Warning:', message);
```

### Performance

```bash
# Analyze bundle size
pnpm analyze

# Check build output
pnpm build
```

---

## Deployment

### Vercel

1. Connect repository to Vercel
2. Set environment variables
3. Deploy

### Environment Variables for Production

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://restoloop.app` |
| `NEXT_PUBLIC_CI` | Not set (enforces HTTPS) |
| `CRON_SECRET` | Secure random string |
| `SUPER_ADMIN_USER_ID` | Admin user UUID |

### Cron Jobs

Configure in Vercel or use external cron service:

```
GET https://restoloop.app/api/cron/process-campaigns
Authorization: Bearer <CRON_SECRET>
```

Schedule: Daily at 10:00 AM IST

---

## Architecture Decisions

### Why Supabase?

- Built-in auth with RLS
- PostgreSQL with real-time subscriptions
- Easy to set up and deploy
- Good TypeScript support

### Why App Router?

- Server components for better performance
- Built-in loading and error states
- Parallel routes for complex layouts
- Better SEO with server rendering

### Why Tailwind CSS?

- Utility-first approach
- Consistent design system
- Small bundle size with purging
- Easy to maintain

---

## Getting Help

- Check existing documentation in `/docs`
- Review test files for examples
- Look at existing implementations for patterns
- Ask in team channels

---

*Document generated from codebase analysis. Last updated: June 2026.*
