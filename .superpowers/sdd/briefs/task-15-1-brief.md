# Task 15-1 Brief: DB Migration — Campaign Control Columns

## Context
This is Task 1 of 6 in a 2-slice implementation (Slices 15 + 16) for Restoloop — a multi-tenant SaaS for restaurant customer retention. The project uses Next.js 16 (App Router), Supabase (Postgres + RLS), and Tailwind CSS v4.

## Your Job
Create and apply a new Supabase migration that adds campaign control columns to the `restaurants` table and a `coupon_id` FK to `message_logs`.

## Critical context
- `supabase/migrations/004_coupon_enabled.sql` ALREADY EXISTS and already adds `coupons.enabled boolean not null default true`. **Do NOT add this column again.**
- The new migration must be `005_campaign_control.sql` (next in sequence after `004`).
- Migration is additive only — `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` — no destructive changes.

## Files to create
- `supabase/migrations/005_campaign_control.sql`

## Exact migration SQL (use verbatim)

```sql
-- Campaign toggle flags (all enabled by default)
alter table restaurants
  add column if not exists welcome_reminder_enabled boolean not null default true,
  add column if not exists birthday_campaign_enabled boolean not null default true,
  add column if not exists winback_campaign_enabled  boolean not null default true,
  add column if not exists expiry_reminder_enabled   boolean not null default true;

-- Configurable timing
alter table restaurants
  add column if not exists welcome_reminder_days  integer not null default 25,
  add column if not exists winback_days           integer not null default 40,
  add column if not exists expiry_reminder_days   integer not null default 1;

-- WhatsApp prefill message for intake form QR
alter table restaurants
  add column if not exists whatsapp_prefill_message text default 'Hi, I would like to join your loyalty club!';

-- Link message_logs to specific coupon for tracking
alter table message_logs
  add column if not exists coupon_id uuid references coupons(id);
```

## Steps
1. Create the file with exactly the SQL above
2. Run `supabase db push` to apply it
3. Verify with `supabase db diff` (should show empty diff if already applied)
4. Run `pnpm typecheck` — Expected: PASS
5. Commit:
```bash
git add supabase/migrations/005_campaign_control.sql
git commit -m "feat(db): add campaign control columns (toggles, timing, prefill, coupon_id FK)"
```

## Report
Write your full report to: `e:\desktop\Restoloop\.superpowers\sdd\briefs\task-15-1-report.md`

Return only:
- Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
- Commit hash(es)
- One-line test summary
- Any concerns
