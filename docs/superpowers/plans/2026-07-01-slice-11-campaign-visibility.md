# Slice 11: Campaign Visibility — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix campaign logging types (all 3 campaigns currently log as `type: 'campaign'`) and create a `/dashboard/campaigns` page that shows campaign history with type-specific badges and filtering.

**Architecture:** Modify `src/lib/campaigns/index.ts` to use specific log types (`welcome_reminder`, `birthday_campaign`, `winback_campaign`). Create a new server component at `src/app/dashboard/campaigns/page.tsx` that queries `message_logs` filtered to campaign types. Sidebar nav link already exists.

**Tech Stack:** Next.js 16 (App Router, Server Components), Supabase, Tailwind CSS v4.

**Required Skills (load before coding):**
- `server-actions` — Server Components, data fetching
- `supabase-postgres-best-practices` — DB queries
- `tailwind-design-system` — Tailwind v4 patterns
- `frontend-design` + `ui-ux-pro-max` — UI/UX direction
- `playwright-best-practices` — E2E tests
- `karpathy-guidelines` — code quality

**Context7 MCP:** Use `context7_resolve-library-id` + `context7_query-docs` for latest docs on: Next.js, Supabase, Tailwind CSS, lucide-react, Playwright.

## Global Constraints

- Goodrest POS design system.
- No new tables, no new migrations.
- Campaign types: `welcome_reminder`, `birthday_campaign`, `winback_campaign`. (Slice 15 adds `expiry_reminder`.)
- Sidebar already has `/dashboard/campaigns` nav link.
- Table header: `text-[10px] font-black uppercase tracking-widest`. Badge: `text-[9px] font-black uppercase tracking-widest rounded-full`.

---

### Task 1: Fix Campaign Logging Types

**Files:**
- Modify: `src/lib/campaigns/index.ts`

**Interfaces:**
- Produces: Specific `type` values in `message_logs` inserts: `welcome_reminder`, `birthday_campaign`, `winback_campaign`

- [ ] **Step 1: Change logging types in `runWelcomeReminders()`**

In `src/lib/campaigns/index.ts`, in `runWelcomeReminders()`, change all `type: 'campaign'` to `type: 'welcome_reminder'`:

```typescript
// Before (appears twice in runWelcomeReminders):
type: 'campaign',

// After:
type: 'welcome_reminder',
```

There are 2 occurrences in `runWelcomeReminders()`:
1. The `blocked_no_credits` log
2. The success/failure log

- [ ] **Step 2: Change logging types in `runBirthdayCampaigns()`**

Same change — replace `type: 'campaign'` with `type: 'birthday_campaign'` (2 occurrences).

- [ ] **Step 3: Change logging types in `runWinbackCampaigns()`**

Same change — replace `type: 'campaign'` with `type: 'winback_campaign'` (2 occurrences).

- [ ] **Step 4: Verify no remaining `type: 'campaign'` in campaigns engine**

```bash
grep -n "type: 'campaign'" src/lib/campaigns/index.ts
```

Expected: No matches (all 6 occurrences should be replaced).

- [ ] **Step 5: Run typecheck**

```bash
pnpm typecheck
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/campaigns/index.ts
git commit -m "fix: use specific campaign types in message_logs (welcome_reminder, birthday_campaign, winback_campaign)"
```

---

### Task 2: Create Campaigns Page

**Files:**
- Create: `src/app/dashboard/campaigns/page.tsx`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/server`, `message_logs` table with campaign types
- Produces: Server component at `/dashboard/campaigns` showing campaign history

- [ ] **Step 1: Create the campaigns page**

Create `src/app/dashboard/campaigns/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  MessageSquare,
  Cake,
  RotateCcw,
  AlertCircle,
} from 'lucide-react'

type CampaignType = 'welcome_reminder' | 'birthday_campaign' | 'winback_campaign' | 'expiry_reminder'

const CAMPAIGN_TYPES: CampaignType[] = ['welcome_reminder', 'birthday_campaign', 'winback_campaign']

const TYPE_META: Record<CampaignType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  welcome_reminder: {
    label: 'Welcome Reminder',
    color: 'text-blue-800',
    bg: 'bg-blue-100',
    icon: <MessageSquare className="w-3.5 h-3.5" />,
  },
  birthday_campaign: {
    label: 'Birthday',
    color: 'text-amber-800',
    bg: 'bg-amber-100',
    icon: <Cake className="w-3.5 h-3.5" />,
  },
  winback_campaign: {
    label: 'Winback',
    color: 'text-purple-800',
    bg: 'bg-purple-100',
    icon: <RotateCcw className="w-3.5 h-3.5" />,
  },
  expiry_reminder: {
    label: 'Expiry',
    color: 'text-orange-800',
    bg: 'bg-orange-100',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
}

function maskPhone(phone: string) {
  return phone.slice(0, -4) + '****'
}

export default async function CampaignsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!restaurant) redirect('/dashboard/create')

  // Fetch campaign message logs with customer data
  const { data: logs } = await supabase
    .from('message_logs')
    .select('id, type, status, error, created_at, customer_id, customers(name, phone)')
    .eq('restaurant_id', restaurant.id)
    .eq('direction', 'outbound')
    .in('type', CAMPAIGN_TYPES)
    .order('created_at', { ascending: false })
    .limit(100)

  // Compute stats
  const stats = CAMPAIGN_TYPES.map((type) => {
    const typeLogs = (logs || []).filter((l) => l.type === type)
    const sent = typeLogs.filter((l) => l.status === 'sent').length
    const failed = typeLogs.filter((l) => l.status === 'failed').length
    const blocked = typeLogs.filter((l) => l.status === 'blocked_no_credits').length
    return { type, total: typeLogs.length, sent, failed, blocked }
  })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black tracking-tight text-[--color-grey-900] mb-1">
        Campaigns
      </h1>
      <p className="text-sm text-[--color-grey-400] mb-8">
        Automated WhatsApp campaign history and performance.
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((s) => {
          const meta = TYPE_META[s.type]
          return (
            <div
              key={s.type}
              className="bg-white border border-[--color-grey-100] rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`${meta.bg} ${meta.color} w-8 h-8 rounded-lg flex items-center justify-center`}>
                  {meta.icon}
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-grey-400]">
                  {meta.label}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-[--color-grey-800]">{s.total}</span>
                <span className="text-[10px] font-bold text-[--color-grey-400]">sent</span>
              </div>
              <div className="flex gap-3 mt-2">
                <span className="text-[10px] font-bold text-emerald-600">{s.sent} delivered</span>
                {s.failed > 0 && <span className="text-[10px] font-bold text-red-600">{s.failed} failed</span>}
                {s.blocked > 0 && <span className="text-[10px] font-bold text-purple-600">{s.blocked} blocked</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Campaign Log Table */}
      <div className="bg-white border border-[--color-grey-100] rounded-2xl overflow-hidden shadow-md">
        <div className="px-6 py-4 border-b border-[--color-grey-100]">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[--color-grey-400]">
            Recent Campaign Activity
          </h2>
        </div>

        {!logs || logs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-[--color-grey-400]">
              No campaigns have run yet. Campaigns fire daily at 10:00 AM IST.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[--color-grey-100] bg-[--color-grey-50]">
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[--color-grey-400]">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[--color-grey-400]">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[--color-grey-400]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[--color-grey-400]">
                    Sent
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const meta = TYPE_META[log.type as CampaignType] || TYPE_META.welcome_reminder
                  const customer = log.customers as unknown as { name: string | null; phone: string } | null
                  return (
                    <tr
                      key={log.id}
                      className={`border-b border-[--color-grey-100] hover:bg-[--color-grey-50] transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[--color-grey-50]/30'}`}
                    >
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 ${meta.bg} ${meta.color} text-[9px] font-black uppercase tracking-widest rounded-full px-2.5 py-0.5`}>
                          {meta.icon}
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold font-mono text-[--color-grey-600]">
                        {customer?.phone ? maskPhone(customer.phone) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-[--color-grey-400]">
                        {new Date(log.created_at).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string }> = {
    sent: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    failed: { bg: 'bg-red-100', text: 'text-red-800' },
    blocked_no_credits: { bg: 'bg-purple-100', text: 'text-purple-800' },
  }
  const s = styles[status] || { bg: 'bg-gray-100', text: 'text-gray-800' }
  return (
    <span className={`${s.bg} ${s.text} text-[9px] font-black uppercase tracking-widest rounded-full px-2.5 py-0.5`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
```

- [ ] **Step 2: Verify campaigns page renders**

```bash
pnpm dev
```

Navigate to `http://localhost:3000/dashboard/campaigns`. Expected: page renders with 3 stat cards and a campaign log table. If no campaigns have run, shows empty state.

- [ ] **Step 3: Run typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/campaigns/page.tsx
git commit -m "feat: add /dashboard/campaigns page with type-specific badges and stats"
```

---

### Task 3: E2E Test — Campaigns Page

**Files:**
- Create: `tests/slice-11.spec.ts`

- [ ] **Step 1: Write E2E test**

Create `tests/slice-11.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Slice 11: Campaign Visibility', () => {
  test('Campaigns page renders with stats and table', async ({ page }) => {
    // Login as test owner
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill('iamkumarankit1502@gmail.com')
    await page.getByLabel('Password').fill('Ankit@2032')
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)

    // Navigate to campaigns
    await page.goto('http://localhost:3000/dashboard/campaigns')

    // Verify page title
    await expect(page.getByText('Campaigns')).toBeVisible()

    // Verify stat cards are present (3 campaign types)
    await expect(page.getByText('Welcome Reminder')).toBeVisible()
    await expect(page.getByText('Birthday')).toBeVisible()
    await expect(page.getByText('Winback')).toBeVisible()

    // Verify table or empty state is present
    const table = page.locator('table')
    const emptyState = page.getByText('No campaigns have run yet')
    await expect(table.or(emptyState)).toBeVisible()
  })

  test('Sidebar has campaigns link', async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill('iamkumarankit1502@gmail.com')
    await page.getByLabel('Password').fill('Ankit@2032')
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)

    const sidebar = page.getByTestId('dashboard-sidebar')
    await expect(sidebar.getByText('Campaigns')).toBeVisible()
  })
})
```

- [ ] **Step 2: Run E2E test**

```bash
pnpm test:e2e tests/slice-11.spec.ts
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/slice-11.spec.ts
git commit -m "test: add E2E tests for campaigns page"
```

---

## Verification Plan

### Automated Tests
```bash
pnpm typecheck && pnpm lint && pnpm test:e2e tests/slice-11.spec.ts
```

### Manual Verification
1. Navigate to `/dashboard/campaigns` — page renders with 3 stat cards
2. If campaigns have run: table shows logs with correct type badges (Welcome Reminder, Birthday, Winback)
3. If no campaigns: empty state message visible
4. Sidebar "Campaigns" link navigates correctly
5. Campaign log types in database are specific (`welcome_reminder`, not `campaign`)

### Commit Summary
1. `fix: use specific campaign types in message_logs (welcome_reminder, birthday_campaign, winback_campaign)`
2. `feat: add /dashboard/campaigns page with type-specific badges and stats`
3. `test: add E2E tests for campaigns page`
