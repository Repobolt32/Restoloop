# Slice 12: Dashboard Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade dashboard home from 2 sparse stat cards to 4 rich stat cards (guests, credits, coupons sent, redemption rate), campaign performance summary, and richer activity feed.

**Architecture:** Modify `src/app/dashboard/page.tsx` — expanded Supabase queries + enhanced UI. Server Component, no client state.

**Tech Stack:** Next.js 16, Supabase, Tailwind CSS v4, `lucide-react`.

**Required Skills (load before coding):**
- `server-actions` — Server Components, data fetching
- `supabase-postgres-best-practices` — DB queries
- `tailwind-design-system` — Tailwind v4 patterns
- `frontend-design` + `ui-ux-pro-max` — UI/UX direction
- `playwright-best-practices` — E2E tests
- `karpathy-guidelines` — code quality

**Context7 MCP:** Use `context7_resolve-library-id` + `context7_query-docs` for latest docs on: Next.js, Supabase, Tailwind CSS, lucide-react, Playwright.

## Global Constraints

- Goodrest POS design system. No new files.
- Stat cards: `bg-white border border-[--color-grey-100] rounded-2xl p-6 shadow-sm`.
- Labels: `text-[10px] font-black uppercase tracking-[0.2em] text-[--color-grey-400]`.
- Values: `text-3xl font-black font-mono`.

---

### Task 1: Upgrade Dashboard Page

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Expand data queries**

Replace the existing `Promise.all` with:

```typescript
import { Users, Zap, Gift, TrendingUp } from 'lucide-react'

// Inside the component, after fetching restaurant:
const [{ data: customers }, { data: recentLogs }, { data: allCoupons }] = await Promise.all([
  supabase
    .from('customers')
    .select('id, opt_in_status, last_visit_at')
    .eq('restaurant_id', restaurant.id),
  supabase
    .from('message_logs')
    .select('id, type, status, direction, created_at, customers(name, phone)')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false })
    .limit(10),
  supabase
    .from('coupons')
    .select('id, type, status')
    .eq('restaurant_id', restaurant.id),
])

const customerCount = customers?.length ?? 0
const credits = restaurant.credits ?? 0
const totalCoupons = allCoupons?.length ?? 0
const redeemedCoupons = allCoupons?.filter(c => c.status === 'redeemed').length ?? 0
const redemptionRate = totalCoupons > 0 ? Math.round((redeemedCoupons / totalCoupons) * 100) : 0
const activeCustomers = customers?.filter(c => {
  if (!c.last_visit_at) return false
  return new Date(c.last_visit_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
}).length ?? 0
```

- [ ] **Step 2: Replace stat cards and layout**

Replace the entire page return with Goodrest-styled layout:

```tsx
return (
  <div className="p-8 max-w-6xl mx-auto">
    <h1 className="text-3xl font-black tracking-tight text-[--color-grey-900] mb-1">
      {restaurant.name}
    </h1>
    <p className="text-sm text-[--color-grey-400] mb-8">Dashboard Overview</p>

    {/* 4 Stat Cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard label="Total Guests" value={String(customerCount)} sub={`${activeCustomers} active (30d)`} href="/dashboard/customers" icon={<Users className="w-5 h-5" />} />
      <StatCard label="Credits" value={String(credits)} sub="/ 1000" href="/dashboard/settings" icon={<Zap className="w-5 h-5" />} />
      <StatCard label="Coupons Sent" value={String(totalCoupons)} sub={`${redeemedCoupons} redeemed`} href="/dashboard/coupons" icon={<Gift className="w-5 h-5" />} />
      <StatCard label="Redemption Rate" value={`${redemptionRate}%`} sub="of all coupons" href="/dashboard/coupons" icon={<TrendingUp className="w-5 h-5" />} />
    </div>

    {/* Quick Nav */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <QuickNav href="/dashboard/customers" title="Guests" desc="View customers" />
      <QuickNav href="/dashboard/coupons" title="Coupons" desc="Manage coupons" />
      <QuickNav href="/dashboard/validate" title="Validate" desc="Redeem coupons" />
      <QuickNav href="/dashboard/settings" title="Settings" desc="Restaurant config" />
    </div>

    {/* Campaign Performance */}
    <div className="bg-white border border-[--color-grey-100] rounded-2xl p-6 shadow-md mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[--color-grey-400]">Campaign Performance</h2>
        <Link href="/dashboard/campaigns" className="text-[10px] font-black uppercase tracking-widest text-[--color-primary] hover:underline cursor-pointer">View All</Link>
      </div>
      <div className="grid grid-cols-4 gap-4 text-center">
        {['welcome_reminder', 'birthday_campaign', 'winback_campaign', 'expiry_reminder'].map(type => {
          const count = (recentLogs || []).filter(l => l.type === type).length
          const labels: Record<string, string> = { welcome_reminder: 'Welcome', birthday_campaign: 'Birthday', winback_campaign: 'Winback', expiry_reminder: 'Expiry' }
          return (
            <div key={type}>
              <p className="text-2xl font-black font-mono text-[--color-grey-800]">{count}</p>
              <p className="text-[10px] font-bold text-[--color-grey-400]">{labels[type]}</p>
            </div>
          )
        })}
      </div>
    </div>

    {/* Activity Feed */}
    <div className="bg-white border border-[--color-grey-100] rounded-2xl p-6 shadow-md" data-testid="recent-activity">
      <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[--color-grey-400] mb-4">Recent Activity</h2>
      {!recentLogs || recentLogs.length === 0 ? (
        <p className="text-sm text-[--color-grey-400]">No activity yet.</p>
      ) : (
        <ul className="space-y-0">
          {recentLogs.map((log) => {
            const customer = log.customers as unknown as { name: string | null; phone: string } | null
            const isOutbound = log.direction === 'outbound'
            return (
              <li key={log.id} className="flex items-center gap-3 py-3 border-b border-[--color-grey-100] last:border-0">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isOutbound ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {isOutbound ? '↑' : '↓'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[--color-grey-800] truncate">{customer?.phone ? maskPhone(customer.phone) : 'Unknown'}</p>
                  <p className="text-[10px] text-[--color-grey-400]">{log.type.replace(/_/g, ' ')}</p>
                </div>
                <StatusBadge status={log.status} />
                <span className="text-[10px] font-bold text-[--color-grey-400] whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  </div>
)
```

- [ ] **Step 3: Replace helper components**

```tsx
function StatCard({ label, value, sub, href, icon }: { label: string; value: string; sub: string; href: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="bg-white border border-[--color-grey-100] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer block">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-grey-400]">{label}</span>
        <span className="text-[--color-grey-300]">{icon}</span>
      </div>
      <p className="text-3xl font-black font-mono text-[--color-grey-800]">{value}</p>
      <p className="text-[10px] font-bold text-[--color-grey-400] mt-1">{sub}</p>
    </Link>
  )
}

function QuickNav({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="bg-[--color-grey-50] border border-[--color-grey-100] rounded-2xl p-4 hover:shadow-sm transition-shadow cursor-pointer block">
      <p className="text-sm font-black text-[--color-grey-800]">{title}</p>
      <p className="text-[10px] text-[--color-grey-400]">{desc}</p>
    </Link>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    sent: 'bg-emerald-100 text-emerald-800',
    failed: 'bg-red-100 text-red-800',
    blocked_no_credits: 'bg-purple-100 text-purple-800',
    redeemed: 'bg-emerald-100 text-emerald-800',
  }
  return (
    <span className={`${styles[status] || 'bg-gray-100 text-gray-800'} text-[9px] font-black uppercase tracking-widest rounded-full px-2.5 py-0.5`}>
      {status}
    </span>
  )
}
```

- [ ] **Step 4: Run typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: upgrade dashboard with 4 stat cards, campaign summary, rich activity feed"
```

---

### Task 2: E2E Test

**Files:**
- Create: `tests/slice-12.spec.ts`

- [ ] **Step 1: Write E2E test**

```typescript
import { test, expect } from '@playwright/test'

test.describe('Slice 12: Dashboard Upgrade', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill('iamkumarankit1502@gmail.com')
    await page.getByLabel('Password').fill('Ankit@2032')
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('Dashboard shows 4 stat cards', async ({ page }) => {
    await expect(page.getByText('Total Guests')).toBeVisible()
    await expect(page.getByText('Credits')).toBeVisible()
    await expect(page.getByText('Coupons Sent')).toBeVisible()
    await expect(page.getByText('Redemption Rate')).toBeVisible()
  })

  test('Dashboard shows campaign performance', async ({ page }) => {
    await expect(page.getByText('Campaign Performance')).toBeVisible()
  })

  test('Dashboard shows activity feed', async ({ page }) => {
    const activity = page.getByTestId('recent-activity')
    await expect(activity).toBeVisible()
  })
})
```

- [ ] **Step 2: Run test + commit**

```bash
pnpm test:e2e tests/slice-12.spec.ts
git add tests/slice-12.spec.ts
git commit -m "test: add E2E tests for dashboard upgrade"
```

---

## Verification Plan

1. Navigate to `/dashboard` — 4 stat cards visible with real data
2. Campaign Performance section shows counts per type
3. Activity feed shows last 10 messages with direction arrows and type labels
4. All stat cards link to correct pages
