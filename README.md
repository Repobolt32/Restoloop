# Restoloop

Customer retention platform for restaurants — QR-based intake, coupon engine, billing terminal, and guest analytics.

## Tech Stack

- Next.js 15 + Turborepo monorepo
- Supabase (auth, database, storage)
- TailwindCSS v4 + Shadcn UI
- Playwright E2E tests
- TypeScript strict mode

## Project Structure

```
apps/
├── web/                  # Next.js application
│   ├── app/             # App Router pages
│   │   ├── auth/        # Authentication pages
│   │   ├── home/        # Protected app pages
│   │   └── form/        # Public intake forms
│   ├── supabase/        # Database & migrations
│   └── config/          # App configuration
└── e2e/                 # Playwright E2E tests
```

## Getting Started

### Prerequisites

- Node.js 18.x+
- PNPM
- Supabase project (remote or local with Docker)

### Installation

```bash
pnpm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp apps/web/.env.example apps/web/.env.local
```

### Development

```bash
pnpm run dev
```

App runs at http://localhost:3000.

### E2E Tests

```bash
cd apps/e2e
npx playwright install
npx playwright test
```

### Code Health

```bash
pnpm run format:fix   # Format
pnpm run lint          # Lint
pnpm run typecheck     # Type check
```

## License

MIT License. See [LICENSE](LICENSE).
