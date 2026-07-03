# Slice 15: Campaign Control + Expiry — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add campaign toggle flags and configurable timing to restaurants, add an expiry reminder campaign, make all 4 campaigns respect toggle flags, and add campaign control UI to settings.

**Architecture:** New migration `004_campaign_control.sql` adds toggle/timing columns to `restaurants`, `enabled` column to `coupons`, and `coupon_id` FK to `message_logs`. Add `runExpiryReminders()` to campaigns engine. Modify existing campaign functions to check toggle flags. Add toggle switches to settings page.

**Tech Stack:** Next.js 16 (App Router, Server Components + Client Components), Supabase (Postgres + RLS), Tailwind CSS v4, Zod.

**Required Skills (load before coding):**
- `server-actions` — form actions, revalidatePath
- `react-dev` — Client Components, hooks
- `supabase-postgres-best-practices` — DB migrations, RLS
- `zod` — schema validation
- `tailwind-design-system` — Tailwind v4 patterns
- `frontend-design` + `ui-ux-pro-max` — UI/UX direction
- `vercel-functions` — cron route handler
- `playwright-best-practices` — E2E tests
- `karpathy-guidelines` — code quality

**Context7 MCP:** Use `context7_resolve-library-id` + `context7_query-docs` for latest docs on: Next.js (Server + Client Components), Supabase, Zod, Tailwind CSS, Vercel Cron, Playwright.

## Global Constraints

- Goodrest POS design system.
- Migration 004 is additive only (ALTER TABLE ADD COLUMN). No destructive changes.
- All campaigns check `*_enabled` flag before running. Default: all enabled.
- Expiry reminder: sends 1 day before coupon expiry (configurable via `expiry_reminder_days`).
- Toggle switches: `w-12 h-6 rounded-full` with green/slate states.
- Settings page is a client component — toggle changes saved via server action.

---

### Task 1: Database Migration — Campaign Control Columns

**Files:**
- Create: `supabase/migrations/004_campaign_control.sql`

**Interfaces:**
- Produces: New columns on `restaurants`, `coupons`, `message_logs`

- [ ] **Step 1: Create migration file**

Create `supabase/migrations/004_campaign_control.sql`:

```sql
-- Campaign toggle flags (all enabled by default)
alter table restaurants
  add column if not exists welcome_reminder_enabled boolean not null default true,
  add column if not exists birthday_campaign_enabled boolean not null default true,
  add column if not exists winback_campaign_enabled boolean not null default true,
  add column if not exists expiry_reminder_enabled boolean not null default true;

-- Configurable timing
alter table restaurants
  add column if not exists welcome_reminder_days integer not null default 25,
  add column if not exists winback_days integer not null default 40,
  add column if not exists expiry_reminder_days integer not null default 1;

-- WhatsApp prefill message for intake form
alter table restaurants
  add column if not exists whatsapp_prefill_message text default 'Hi, I would like to join your loyalty club!';

-- Coupon enabled flag (for disable/delete without destroying data)
alter table coupons
  add column if not exists enabled boolean not null default true;

-- Link message_logs to coupons for tracking
alter table message_logs
  add column if not exists coupon_id uuid references coupons(id);
```

- [ ] **Step 2: Run migration**

```bash
supabase db push
```

Expected: Migration applied successfully.

- [ ] **Step 3: Verify columns exist**

```bash
psql $DATABASE_URL -c "\d restaurants" | grep -E "enabled|days|prefill"
```

Expected: All new columns visible.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/004_campaign_control.sql
git commit -m "feat: add campaign control columns (toggles, timing, prefill, coupon enabled)"
```

---

### Task 2: Expiry Reminder Campaign + Toggle Respect

**Files:**
- Modify: `src/lib/campaigns/index.ts`
- Modify: `src/app/api/cron/welcome-reminder/route.ts`

**Interfaces:**
- Produces: `runExpiryReminders()` function (type: `expiry_reminder`)
- Modifies: `runWelcomeReminders()`, `runBirthdayCampaigns()`, `runWinbackCampaigns()` to check toggle flags

- [ ] **Step 1: Add toggle checks to `runWelcomeReminders()`**

In `src/lib/campaigns/index.ts`, at the start of `runWelcomeReminders()`, fetch the restaurant and check the toggle:

```typescript
export async function runWelcomeReminders() {
  const supabase = createServiceClient()
  const adapter = createWhatsAppAdapter()

  // Fetch all restaurants with welcome_reminder_enabled
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, welcome_reminder_days')
    .eq('welcome_reminder_enabled', true)

  if (!restaurants || restaurants.length === 0) return

  for (const restaurant of restaurants) {
    const days = restaurant.welcome_reminder_days || 25
    const gteDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const lteDate = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString()

    const { data: customers } = await supabase
      .from('customers')
      .select('*, coupons(*)')
      .eq('restaurant_id', restaurant.id)
      .eq('opt_in_status', 'opted_in')
      .filter('created_at', 'gte', gteDate)
      .filter('created_at', 'lte', lteDate)

    // ... rest of the loop (same as before, but scoped to this restaurant)
  }
}
```

Apply the same pattern to `runBirthdayCampaigns()` (check `birthday_campaign_enabled`) and `runWinbackCampaigns()` (check `winback_campaign_enabled`, use `winback_days`).

- [ ] **Step 2: Add `runExpiryReminders()` function**

Add to `src/lib/campaigns/index.ts`:

```typescript
export async function runExpiryReminders() {
  const supabase = createServiceClient()
  const adapter = createWhatsAppAdapter()

  // Fetch restaurants with expiry_reminder_enabled
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, expiry_reminder_days, name')
    .eq('expiry_reminder_enabled', true)

  if (!restaurants || restaurants.length === 0) return

  for (const restaurant of restaurants) {
    const days = restaurant.expiry_reminder_days || 1
    // Find coupons expiring in `days` day(s)
    const expiryStart = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    const expiryEnd = new Date(expiryStart.getTime() + 24 * 60 * 60 * 1000)

    const { data: coupons } = await supabase
      .from('coupons')
      .select('*, customers(*)')
      .eq('restaurant_id', restaurant.id)
      .eq('status', 'sent')
      .eq('enabled', true)
      .gte('expires_at', expiryStart.toISOString())
      .lt('expires_at', expiryEnd.toISOString())

    for (const coupon of coupons || []) {
      const customer = coupon.customers as unknown as { id: string; phone: string; name: string | null; opt_in_status: string }
      if (!customer || customer.opt_in_status !== 'opted_in') continue

      // Check credits
      const { data: rest } = await supabase
        .from('restaurants')
        .select('credits')
        .eq('id', restaurant.id)
        .single()

      if (!rest || rest.credits <= 0) {
        await supabase.from('message_logs').insert({
          restaurant_id: restaurant.id,
          customer_id: customer.id,
          direction: 'outbound',
          type: 'expiry_reminder',
          status: 'blocked_no_credits',
          coupon_id: coupon.id,
        })
        continue
      }

      const message = `Hey ${customer.name || 'there'}! Your coupon ${coupon.code} at ${restaurant.name} expires tomorrow! Don't miss out. Reply STOP to opt out.`
      const result = await adapter.sendText(customer.phone, message)

      await supabase.from('message_logs').insert({
        restaurant_id: restaurant.id,
        customer_id: customer.id,
        direction: 'outbound',
        type: 'expiry_reminder',
        status: result.success ? 'sent' : 'failed',
        error: result.error || null,
        coupon_id: coupon.id,
      })

      if (result.success) {
        await supabase.rpc('deduct_credit', { restaurant_id: restaurant.id })
      }
    }
  }
}
```

- [ ] **Step 3: Wire `runExpiryReminders()` into cron route**

In `src/app/api/cron/welcome-reminder/route.ts`, add:

```typescript
import { runWelcomeReminders, runBirthdayCampaigns, runWinbackCampaigns, runExpiryReminders } from '@/lib/campaigns'

// In the GET handler, add:
await runExpiryReminders()
```

- [ ] **Step 4: Run typecheck**

```bash
pnpm typecheck
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/campaigns/index.ts src/app/api/cron/welcome-reminder/route.ts
git commit -m "feat: add expiry reminder campaign + toggle respect for all campaigns"
```

---

### Task 3: Campaign Control UI in Settings

**Files:**
- Modify: `src/app/dashboard/settings/page.tsx`

**Interfaces:**
- Consumes: Restaurant data with toggle/timing columns
- Produces: Toggle switches + timing inputs + prefill message editor

- [ ] **Step 1: Add campaign settings server action**

Create `src/app/dashboard/settings/actions.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const settingsSchema = z.object({
  welcome_reminder_enabled: z.boolean(),
  birthday_campaign_enabled: z.boolean(),
  winback_campaign_enabled: z.boolean(),
  expiry_reminder_enabled: z.boolean(),
  welcome_reminder_days: z.number().int().min(1).max(90),
  winback_days: z.number().int().min(1).max(180),
  expiry_reminder_days: z.number().int().min(1).max(7),
  whatsapp_prefill_message: z.string().max(200),
})

export async function updateCampaignSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!restaurant) redirect('/dashboard/create')

  const parsed = settingsSchema.parse({
    welcome_reminder_enabled: formData.get('welcome_reminder_enabled') === 'on',
    birthday_campaign_enabled: formData.get('birthday_campaign_enabled') === 'on',
    winback_campaign_enabled: formData.get('winback_campaign_enabled') === 'on',
    expiry_reminder_enabled: formData.get('expiry_reminder_enabled') === 'on',
    welcome_reminder_days: Number(formData.get('welcome_reminder_days')),
    winback_days: Number(formData.get('winback_days')),
    expiry_reminder_days: Number(formData.get('expiry_reminder_days')),
    whatsapp_prefill_message: formData.get('whatsapp_prefill_message') || 'Hi, I would like to join your loyalty club!',
  })

  await supabase
    .from('restaurants')
    .update(parsed)
    .eq('id', restaurant.id)

  revalidatePath('/dashboard/settings')
}
```

- [ ] **Step 2: Add campaign settings section to settings page**

In `src/app/dashboard/settings/page.tsx`, add a new card after the Restaurant Details card:

```tsx
{/* Campaign Settings Card */}
<div className="bg-white border border-[--color-grey-100] rounded-2xl p-8 shadow-md">
  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[--color-grey-400] mb-6">
    Campaign Settings
  </h2>
  <form action={updateCampaignSettings} className="space-y-6">
    {/* Toggle switches */}
    <div className="space-y-4">
      <ToggleRow
        name="welcome_reminder_enabled"
        label="Welcome Reminder"
        description={`Sends ${restaurant.welcome_reminder_days || 25} days after signup`}
        defaultChecked={restaurant.welcome_reminder_enabled ?? true}
      />
      <ToggleRow
        name="birthday_campaign_enabled"
        label="Birthday Campaign"
        description="Sends on customer's birthday"
        defaultChecked={restaurant.birthday_campaign_enabled ?? true}
      />
      <ToggleRow
        name="winback_campaign_enabled"
        label="Winback Campaign"
        description={`Sends after ${restaurant.winback_days || 40} days of inactivity`}
        defaultChecked={restaurant.winback_campaign_enabled ?? true}
      />
      <ToggleRow
        name="expiry_reminder_enabled"
        label="Expiry Reminder"
        description={`Sends ${restaurant.expiry_reminder_days || 1} day(s) before coupon expiry`}
        defaultChecked={restaurant.expiry_reminder_enabled ?? true}
      />
    </div>

    {/* Timing inputs */}
    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[--color-grey-100]">
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-[--color-grey-400] mb-1 block">
          Welcome (days)
        </label>
        <input
          type="number"
          name="welcome_reminder_days"
          defaultValue={restaurant.welcome_reminder_days || 25}
          min={1}
          max={90}
          className="w-full border border-[--color-grey-200] rounded-lg px-3 py-2 text-sm font-bold focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10"
        />
      </div>
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-[--color-grey-400] mb-1 block">
          Winback (days)
        </label>
        <input
          type="number"
          name="winback_days"
          defaultValue={restaurant.winback_days || 40}
          min={1}
          max={180}
          className="w-full border border-[--color-grey-200] rounded-lg px-3 py-2 text-sm font-bold focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10"
        />
      </div>
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-[--color-grey-400] mb-1 block">
          Expiry (days before)
        </label>
        <input
          type="number"
          name="expiry_reminder_days"
          defaultValue={restaurant.expiry_reminder_days || 1}
          min={1}
          max={7}
          className="w-full border border-[--color-grey-200] rounded-lg px-3 py-2 text-sm font-bold focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10"
        />
      </div>
    </div>

    {/* Prefill message */}
    <div className="pt-4 border-t border-[--color-grey-100]">
      <label className="text-[10px] font-black uppercase tracking-widest text-[--color-grey-400] mb-1 block">
        WhatsApp Prefill Message
      </label>
      <p className="text-xs text-[--color-grey-400] mb-2">
        Pre-written message customers send when they scan your QR code.
      </p>
      <input
        type="text"
        name="whatsapp_prefill_message"
        defaultValue={restaurant.whatsapp_prefill_message || 'Hi, I would like to join your loyalty club!'}
        maxLength={200}
        className="w-full border border-[--color-grey-200] rounded-lg px-4 py-3 text-sm font-bold focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10"
      />
    </div>

    <button
      type="submit"
      className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer"
    >
      Save Campaign Settings
    </button>
  </form>
</div>
```

Add the `ToggleRow` helper component:

```tsx
function ToggleRow({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string
  label: string
  description: string
  defaultChecked: boolean
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <div>
        <p className="text-sm font-bold text-[--color-grey-800]">{label}</p>
        <p className="text-xs text-[--color-grey-400]">{description}</p>
      </div>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="sr-only peer"
      />
      <div className="w-12 h-6 bg-[--color-grey-300] rounded-full peer-checked:bg-emerald-500 transition-colors relative">
        <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-6" />
      </div>
    </label>
  )
}
```

Note: The toggle needs `peer-checked:` Tailwind to work. The `peer` class on the hidden checkbox + `peer-checked:` on the knob div handles the state. This is a CSS-only toggle — no JS state needed.

- [ ] **Step 3: Fetch new columns in settings data fetch**

In the `fetchRestaurant` callback, ensure the new columns are included:

```typescript
const { data, error } = await supabase
  .from('restaurants')
  .select('*')  // already selects all columns
  .eq('owner_id', user.id)
  .maybeSingle()
```

Since it uses `select('*')`, the new columns are automatically included. No change needed.

- [ ] **Step 4: Update form action import**

Add import at top of settings page:

```typescript
import { updateCampaignSettings } from './actions'
```

- [ ] **Step 5: Run typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/settings/
git commit -m "feat: add campaign toggle controls and timing settings to dashboard"
```

---

### Task 4: E2E Test — Campaign Control

**Files:**
- Create: `tests/slice-15.spec.ts`

- [ ] **Step 1: Write E2E test**

Create `tests/slice-15.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Slice 15: Campaign Control', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill('iamkumarankit1502@gmail.com')
    await page.getByLabel('Password').fill('Ankit@2032')
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('Settings page shows campaign toggles', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/settings')

    // Verify campaign settings section exists
    await expect(page.getByText('Campaign Settings')).toBeVisible()
    await expect(page.getByText('Welcome Reminder')).toBeVisible()
    await expect(page.getByText('Birthday Campaign')).toBeVisible()
    await expect(page.getByText('Winback Campaign')).toBeVisible()
    await expect(page.getByText('Expiry Reminder')).toBeVisible()

    // Verify timing inputs exist
    await expect(page.getByLabel('Welcome (days)')).toBeVisible()
    await expect(page.getByLabel('Winback (days)')).toBeVisible()

    // Verify prefill message input exists
    await expect(page.getByLabel('WhatsApp Prefill Message')).toBeVisible()
  })

  test('Campaign settings can be saved', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/settings')

    // Change welcome reminder days
    const welcomeDaysInput = page.getByLabel('Welcome (days)')
    await welcomeDaysInput.clear()
    await welcomeDaysInput.fill('20')

    // Save
    await page.getByRole('button', { name: /save campaign settings/i }).click()

    // Verify page reloads (revalidatePath)
    await page.waitForLoadState('networkidle')

    // Verify the value persisted
    await expect(welcomeDaysInput).toHaveValue('20')
  })
})
```

- [ ] **Step 2: Run E2E test**

```bash
pnpm test:e2e tests/slice-15.spec.ts
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/slice-15.spec.ts
git commit -m "test: add E2E tests for campaign control settings"
```

---

## Verification Plan

### Automated Tests
```bash
pnpm typecheck && pnpm lint && pnpm test:e2e tests/slice-15.spec.ts
```

### Manual Verification
1. Migration applied: `restaurants` table has toggle/timing columns, `coupons` has `enabled`, `message_logs` has `coupon_id`
2. Settings page shows campaign toggles (4 switches), timing inputs (3 number fields), prefill message input
3. Toggle a campaign off → save → verify DB column updated
4. Cron: campaigns respect toggle flags (disabled campaigns don't fire)
5. Expiry reminder: sends message 1 day before coupon expiry
6. Campaign types in message_logs: `expiry_reminder` for new campaign

### Commit Summary
1. `feat: add campaign control columns (toggles, timing, prefill, coupon enabled)`
2. `feat: add expiry reminder campaign + toggle respect for all campaigns`
3. `feat: add campaign toggle controls and timing settings to dashboard`
4. `test: add E2E tests for campaign control settings`
