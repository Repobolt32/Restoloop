# Slice 13: Analytics — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a `/dashboard/analytics` page showing customer growth over time (CSS/SVG bar chart), campaign breakdown, and customer health segments. No chart library — CSS bars only.

**Architecture:** New server component at `src/app/dashboard/analytics/page.tsx`. Queries `customers`, `coupons`, `message_logs` for aggregated stats. Sidebar link already exists.

**Tech Stack:** Next.js 16, Supabase, Tailwind CSS v4, `lucide-react`.

**Required Skills (load before coding):**
- `server-actions` — Server Components, data fetching
- `supabase-postgres-best-practices` — DB queries, aggregation
- `tailwind-design-system` — Tailwind v4 patterns
- `frontend-design` + `ui-ux-pro-max` — UI/UX direction, CSS charts
- `playwright-best-practices` — E2E tests
- `karpathy-guidelines` — code quality

**Context7 MCP:** Use `context7_resolve-library-id` + `context7_query-docs` for latest docs on: Next.js, Supabase, Tailwind CSS, lucide-react, Playwright.

## Global Constraints

- Goodrest POS design system. No chart library — CSS/SVG bars only.
- Sidebar already has `/dashboard/analytics` nav link.
- Data is per-restaurant (RLS scoped).

---

### Task 1: Create Analytics Page

**Files:**
- Create: `src/app/dashboard/analytics/page.tsx`

- [ ] **Step 1: Create the analytics page**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Gift, MessageSquare, TrendingUp } from 'lucide-react'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!restaurant) redirect('/dashboard/create')

  // Fetch all data
  const [{ data: customers }, { data: coupons }, { data: logs }] = await Promise.all([
    supabase.from('customers').select('id, opt_in_status, created_at, last_visit_at').eq('restaurant_id', restaurant.id),
    supabase.from('coupons').select('id, type, status, created_at').eq('restaurant_id', restaurant.id),
    supabase.from('message_logs').select('id, type, status, direction, created_at').eq('restaurant_id', restaurant.id),
  ])

  // ── Customer Growth (last 6 months, by month) ──
  const months: { label: string; start: Date; end: Date }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    months.push({
      label: start.toLocaleString('en-IN', { month: 'short' }),
      start,
      end,
    })
  }

  const growthData = months.map(m => ({
    label: m.label,
    count: (customers || []).filter(c => {
      const d = new Date(c.created_at)
      return d >= m.start && d <= m.end
    }).length,
  }))

  const maxGrowth = Math.max(...growthData.map(d => d.count), 1)

  // ── Campaign Breakdown ──
  const campaignTypes = ['welcome_reminder', 'birthday_campaign', 'winback_campaign', 'expiry_reminder']
  const campaignBreakdown = campaignTypes.map(type => {
    const typeLogs = (logs || []).filter(l => l.type === type)
    return {
      type,
      label: { welcome_reminder: 'Welcome', birthday_campaign: 'Birthday', winback_campaign: 'Winback', expiry_reminder: 'Expiry' }[type] || type,
      sent: typeLogs.filter(l => l.status === 'sent').length,
      failed: typeLogs.filter(l => l.status === 'failed').length,
    }
  })

  const totalCampaignSent = campaignBreakdown.reduce((sum, c) => sum + c.sent, 0)

  // ── Customer Health ──
  const now = Date.now()
  const segments = {
    active: (customers || []).filter(c => c.last_visit_at && (now - new Date(c.last_visit_at).getTime()) < 30 * 86400000).length,
    atRisk: (customers || []).filter(c => c.last_visit_at && (now - new Date(c.last_visit_at).getTime()) >= 30 * 86400000 && (now - new Date(c.last_visit_at).getTime()) < 60 * 86400000).length,
    lapsed: (customers || []).filter(c => c.last_visit_at && (now - new Date(c.last_visit_at).getTime()) >= 60 * 86400000).length,
    neverVisited: (customers || []).filter(c => !c.last_visit_at).length,
  }

  // ── Coupon Stats ──
  const couponStats = {
    total: coupons?.length ?? 0,
    redeemed: coupons?.filter(c => c.status === 'redeemed').length ?? 0,
    expired: coupons?.filter(c => c.status === 'expired' || new Date(c.expires_at) < new Date()).length ?? 0,
    active: coupons?.filter(c => c.status === 'sent' && new Date(c.expires_at) >= new Date()).length ?? 0,
  }

  const redemptionRate = couponStats.total > 0 ? Math.round((couponStats.redeemed / couponStats.total) * 100) : 0

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black tracking-tight text-[--color-grey-900] mb-1">Analytics</h1>
      <p className="text-sm text-[--color-grey-400] mb-8">Customer growth, campaign performance, and health overview.</p>

      {/* Top Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <MiniStat icon={<Users className="w-4 h-4" />} label="Total Customers" value={String(customers?.length ?? 0)} />
        <MiniStat icon={<Gift className="w-4 h-4" />} label="Coupons Issued" value={String(couponStats.total)} />
        <MiniStat icon={<MessageSquare className="w-4 h-4" />} label="Campaigns Sent" value={String(totalCampaignSent)} />
        <MiniStat icon={<TrendingUp className="w-4 h-4" />} label="Redemption Rate" value={`${redemptionRate}%`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Customer Growth Bar Chart */}
        <div className="bg-white border border-[--color-grey-100] rounded-2xl p-6 shadow-md">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[--color-grey-400] mb-6">Customer Growth</h2>
          <div className="flex items-end gap-3 h-48">
            {growthData.map(d => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-black text-[--color-grey-800]">{d.count}</span>
                <div className="w-full bg-[--color-primary]/10 rounded-t-lg relative" style={{ height: `${(d.count / maxGrowth) * 160}px`, minHeight: '4px' }}>
                  <div className="absolute inset-0 bg-[--color-primary] rounded-t-lg" />
                </div>
                <span className="text-[10px] font-bold text-[--color-grey-400]">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Breakdown */}
        <div className="bg-white border border-[--color-grey-100] rounded-2xl p-6 shadow-md">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[--color-grey-400] mb-6">Campaign Breakdown</h2>
          <div className="space-y-4">
            {campaignBreakdown.map(c => {
              const pct = totalCampaignSent > 0 ? Math.round((c.sent / totalCampaignSent) * 100) : 0
              return (
                <div key={c.type}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-bold text-[--color-grey-600]">{c.label}</span>
                    <span className="text-xs font-bold font-mono text-[--color-grey-800]">{c.sent} sent</span>
                  </div>
                  <div className="h-2 bg-[--color-grey-100] rounded-full overflow-hidden">
                    <div className="h-full bg-[--color-primary] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Customer Health */}
        <div className="bg-white border border-[--color-grey-100] rounded-2xl p-6 shadow-md">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[--color-grey-400] mb-6">Customer Health</h2>
          <div className="space-y-3">
            <HealthRow label="Active (< 30 days)" count={segments.active} color="bg-emerald-500" total={customers?.length ?? 0} />
            <HealthRow label="At Risk (30-60 days)" count={segments.atRisk} color="bg-amber-500" total={customers?.length ?? 0} />
            <HealthRow label="Lapsed (60+ days)" count={segments.lapsed} color="bg-red-500" total={customers?.length ?? 0} />
            <HealthRow label="Never Visited" count={segments.neverVisited} color="bg-[--color-grey-300]" total={customers?.length ?? 0} />
          </div>
        </div>

        {/* Coupon Stats */}
        <div className="bg-white border border-[--color-grey-100] rounded-2xl p-6 shadow-md">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[--color-grey-400] mb-6">Coupon Performance</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-[--color-grey-50] rounded-xl">
              <p className="text-2xl font-black font-mono text-[--color-grey-800]">{couponStats.active}</p>
              <p className="text-[10px] font-bold text-[--color-grey-400]">Active</p>
            </div>
            <div className="text-center p-4 bg-[--color-grey-50] rounded-xl">
              <p className="text-2xl font-black font-mono text-emerald-600">{couponStats.redeemed}</p>
              <p className="text-[10px] font-bold text-[--color-grey-400]">Redeemed</p>
            </div>
            <div className="text-center p-4 bg-[--color-grey-50] rounded-xl">
              <p className="text-2xl font-black font-mono text-red-600">{couponStats.expired}</p>
              <p className="text-[10px] font-bold text-[--color-grey-400]">Expired</p>
            </div>
            <div className="text-center p-4 bg-[--color-grey-50] rounded-xl">
              <p className="text-2xl font-black font-mono text-[--color-primary]">{redemptionRate}%</p>
              <p className="text-[10px] font-bold text-[--color-grey-400]">Redemption</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white border border-[--color-grey-100] rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-2 text-[--color-grey-300]">{icon}</div>
      <p className="text-2xl font-black font-mono text-[--color-grey-800]">{value}</p>
      <p className="text-[10px] font-bold text-[--color-grey-400]">{label}</p>
    </div>
  )
}

function HealthRow({ label, count, color, total }: { label: string; count: number; color: string; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs font-bold text-[--color-grey-600]">{label}</span>
        <span className="text-xs font-bold font-mono text-[--color-grey-800]">{count} ({pct}%)</span>
      </div>
      <div className="h-2 bg-[--color-grey-100] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify analytics page renders**

```bash
pnpm dev
```

Navigate to `/dashboard/analytics`. Expected: 4 top stats, growth bar chart, campaign breakdown bars, customer health segments, coupon performance grid.

- [ ] **Step 3: Run typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/analytics/page.tsx
git commit -m "feat: add /dashboard/analytics page with growth chart, campaign breakdown, customer health"
```

---

### Task 2: E2E Test

**Files:**
- Create: `tests/slice-13.spec.ts`

- [ ] **Step 1: Write E2E test**

```typescript
import { test, expect } from '@playwright/test'

test.describe('Slice 13: Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill('iamkumarankit1502@gmail.com')
    await page.getByLabel('Password').fill('Ankit@2032')
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('Analytics page renders all sections', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/analytics')

    await expect(page.getByText('Analytics')).toBeVisible()
    await expect(page.getByText('Total Customers')).toBeVisible()
    await expect(page.getByText('Customer Growth')).toBeVisible()
    await expect(page.getByText('Campaign Breakdown')).toBeVisible()
    await expect(page.getByText('Customer Health')).toBeVisible()
    await expect(page.getByText('Coupon Performance')).toBeVisible()
  })

  test('Sidebar has analytics link', async ({ page }) => {
    const sidebar = page.getByTestId('dashboard-sidebar')
    await expect(sidebar.getByText('Analytics')).toBeVisible()
  })
})
```

- [ ] **Step 2: Run test + commit**

```bash
pnpm test:e2e tests/slice-13.spec.ts
git add tests/slice-13.spec.ts
git commit -m "test: add E2E tests for analytics page"
```

---

## Verification Plan

1. Navigate to `/dashboard/analytics` — all sections render
2. Customer Growth: bar chart shows 6 months of data
3. Campaign Breakdown: horizontal bars per campaign type
4. Customer Health: segments (Active, At Risk, Lapsed, Never Visited) with percentages
5. Coupon Performance: 4 stat boxes (Active, Redeemed, Expired, Redemption %)
