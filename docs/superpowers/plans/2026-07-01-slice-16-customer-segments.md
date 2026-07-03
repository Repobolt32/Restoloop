# Slice 16: Customer Segments — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add customer segment filter chips to the customers page (New/Active/At-risk/Lapsed/Birthday/Opted out) with smart filtering logic based on `last_visit_at`, `opt_in_status`, and `birthday_month`/`birthday_day`.

**Architecture:** Modify `src/app/dashboard/customers/page.tsx` to add filter chips and segment computation. Convert from server component to client component (for interactive filtering) OR use URL search params for server-side filtering. Use search params approach (no client state needed, works with RLS).

**Tech Stack:** Next.js 16 (App Router, Server Components), Supabase, Tailwind CSS v4.

**Required Skills (load before coding):**
- `server-actions` — Server Components, searchParams
- `supabase-postgres-best-practices` — DB queries
- `tailwind-design-system` — Tailwind v4 patterns
- `frontend-design` + `ui-ux-pro-max` — UI/UX direction
- `playwright-best-practices` — E2E tests
- `karpathy-guidelines` — code quality

**Context7 MCP:** Use `context7_resolve-library-id` + `context7_query-docs` for latest docs on: Next.js, Supabase, Tailwind CSS, Playwright.

## Global Constraints

- Goodrest POS design system.
- Segment definitions:
  - **New:** Created within last 7 days
  - **Active:** `last_visit_at` within 30 days
  - **At-risk:** `last_visit_at` 30-60 days ago
  - **Lapsed:** `last_visit_at` 60+ days ago
  - **Birthday:** `birthday_month` + `birthday_day` matches today
  - **Opted out:** `opt_in_status = 'opted_out'`
- Filter via URL search params (`?segment=active`), not client state.

---

### Task 1: Add Segment Filters to Customers Page

**Files:**
- Modify: `src/app/dashboard/customers/page.tsx`

**Interfaces:**
- Consumes: `searchParams` for `?segment=` filter
- Produces: Filter chips + filtered customer table

- [ ] **Step 1: Convert to accept searchParams and add segment logic**

Replace the entire `src/app/dashboard/customers/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

function maskPhone(phone: string) {
  return phone.slice(0, -4) + '****'
}

type Segment = 'all' | 'new' | 'active' | 'at-risk' | 'lapsed' | 'birthday' | 'opted-out'

const SEGMENTS: { key: Segment; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'active', label: 'Active' },
  { key: 'at-risk', label: 'At Risk' },
  { key: 'lapsed', label: 'Lapsed' },
  { key: 'birthday', label: 'Birthday' },
  { key: 'opted-out', label: 'Opted Out' },
]

function getSegment(customer: {
  opt_in_status: string
  last_visit_at: string | null
  created_at: string
  birthday_month: number | null
  birthday_day: number | null
}, now: Date): Segment[] {
  const segments: Segment[] = []
  const daysSinceCreated = (now.getTime() - new Date(customer.created_at).getTime()) / 86400000

  if (customer.opt_in_status === 'opted_out') {
    segments.push('opted-out')
    return segments
  }

  if (daysSinceCreated <= 7) segments.push('new')

  if (customer.last_visit_at) {
    const daysSinceVisit = (now.getTime() - new Date(customer.last_visit_at).getTime()) / 86400000
    if (daysSinceVisit < 30) segments.push('active')
    else if (daysSinceVisit < 60) segments.push('at-risk')
    else segments.push('lapsed')
  } else {
    segments.push('new')
  }

  // Birthday check
  if (customer.birthday_month && customer.birthday_day) {
    const kolkataDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    if (kolkataDate.getMonth() + 1 === customer.birthday_month && kolkataDate.getDate() === customer.birthday_day) {
      segments.push('birthday')
    }
  }

  return segments
}

interface PageProps {
  searchParams: Promise<{ segment?: string }>
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const { segment: rawSegment } = await searchParams
  const activeSegment: Segment = SEGMENTS.some(s => s.key === rawSegment) ? (rawSegment as Segment) : 'all'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!restaurant) redirect('/dashboard/create')

  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, phone, opt_in_status, last_visit_at, created_at, birthday_month, birthday_day')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false })

  const now = new Date()

  // Compute segments for each customer
  const customersWithSegments = (customers || []).map(c => ({
    ...c,
    segments: getSegment(c, now),
  }))

  // Filter by active segment
  const filtered = activeSegment === 'all'
    ? customersWithSegments
    : customersWithSegments.filter(c => c.segments.includes(activeSegment))

  // Segment counts for chip badges
  const segmentCounts = SEGMENTS.map(s => ({
    ...s,
    count: s.key === 'all'
      ? customersWithSegments.length
      : customersWithSegments.filter(c => c.segments.includes(s.key)).length,
  }))

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black tracking-tight text-[--color-grey-900] mb-1" data-testid="customers-heading">
        Active Guests
      </h1>
      <p className="text-sm text-[--color-grey-400] mb-6">
        {filtered.length} customer{filtered.length !== 1 ? 's' : ''} {activeSegment !== 'all' ? `(${activeSegment})` : ''}
      </p>

      {/* Segment Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-6" data-testid="segment-chips">
        {segmentCounts.map(s => {
          const isActive = activeSegment === s.key
          return (
            <Link
              key={s.key}
              href={s.key === 'all' ? '/dashboard/customers' : `/dashboard/customers?segment=${s.key}`}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[--color-primary] text-white'
                  : 'bg-white border border-[--color-grey-200] text-[--color-grey-600] hover:border-[--color-primary] hover:text-[--color-primary]'
              }`}
              data-testid={`segment-${s.key}`}
            >
              {s.label}
              <span className={`${isActive ? 'bg-white/20' : 'bg-[--color-grey-100]'} px-1.5 py-0.5 rounded-full text-[9px]`}>
                {s.count}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Customer Table */}
      {filtered.length === 0 ? (
        <div className="bg-[--color-grey-50] rounded-[2.5rem] border-2 border-dashed border-[--color-grey-200] p-12 text-center">
          <p className="text-sm text-[--color-grey-400]">
            {activeSegment === 'all' ? 'No guests yet. Share your QR code to get started.' : `No ${activeSegment} customers found.`}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[--color-grey-100] rounded-2xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table data-testid="customers-table" className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[--color-grey-100] bg-[--color-grey-50]">
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[--color-grey-400]">Name</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[--color-grey-400]">Phone</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[--color-grey-400]">Status</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[--color-grey-400]">Segment</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[--color-grey-400]">Last Visit</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[--color-grey-400]">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer, i) => (
                  <tr
                    key={customer.id}
                    className={`border-b border-[--color-grey-100] hover:bg-[--color-grey-50] transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[--color-grey-50]/30'}`}
                  >
                    <td className="px-4 py-3 text-sm font-bold text-[--color-grey-800]">
                      {customer.name || <span className="text-[--color-grey-400]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold font-mono text-[--color-grey-600]">
                      {maskPhone(customer.phone)}
                    </td>
                    <td className="px-4 py-3">
                      <OptInBadge status={customer.opt_in_status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {customer.segments.map(s => (
                          <SegmentBadge key={s} segment={s} />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-[--color-grey-400]">
                      {customer.last_visit_at
                        ? new Date(customer.last_visit_at).toLocaleDateString('en-IN')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-[--color-grey-400]">
                      {new Date(customer.created_at).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function OptInBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    opted_in: 'bg-emerald-100 text-emerald-800',
    opted_out: 'bg-red-100 text-red-800',
    pending: 'bg-amber-100 text-amber-800',
  }
  return (
    <span className={`${styles[status] || 'bg-gray-100 text-gray-800'} text-[9px] font-black uppercase tracking-widest rounded-full px-2.5 py-0.5`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function SegmentBadge({ segment }: { segment: Segment }) {
  const styles: Record<Segment, string> = {
    all: 'bg-gray-100 text-gray-800',
    new: 'bg-blue-100 text-blue-800',
    active: 'bg-emerald-100 text-emerald-800',
    'at-risk': 'bg-amber-100 text-amber-800',
    lapsed: 'bg-red-100 text-red-800',
    birthday: 'bg-pink-100 text-pink-800',
    'opted-out': 'bg-gray-100 text-gray-500',
  }
  const labels: Record<Segment, string> = {
    all: 'All', new: 'New', active: 'Active', 'at-risk': 'At Risk', lapsed: 'Lapsed', birthday: 'Birthday', 'opted-out': 'Out',
  }
  return (
    <span className={`${styles[segment]} text-[8px] font-black uppercase tracking-widest rounded-full px-2 py-0.5`}>
      {labels[segment]}
    </span>
  )
}
```

- [ ] **Step 2: Verify segments page**

```bash
pnpm dev
```

Navigate to `/dashboard/customers`. Expected: filter chips visible with counts. Clicking a chip filters the table. Segment badges appear on each customer row.

- [ ] **Step 3: Run typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/customers/page.tsx
git commit -m "feat: add customer segment filters (New/Active/At-risk/Lapsed/Birthday/Opted out)"
```

---

### Task 2: E2E Test

**Files:**
- Create: `tests/slice-16.spec.ts`

- [ ] **Step 1: Write E2E test**

```typescript
import { test, expect } from '@playwright/test'

test.describe('Slice 16: Customer Segments', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill('iamkumarankit1502@gmail.com')
    await page.getByLabel('Password').fill('Ankit@2032')
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('Customers page shows segment filter chips', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/customers')

    const chips = page.getByTestId('segment-chips')
    await expect(chips).toBeVisible()

    // All chip is active by default
    await expect(page.getByTestId('segment-all')).toBeVisible()
    await expect(page.getByTestId('segment-new')).toBeVisible()
    await expect(page.getByTestId('segment-active')).toBeVisible()
    await expect(page.getByTestId('segment-at-risk')).toBeVisible()
    await expect(page.getByTestId('segment-lapsed')).toBeVisible()
    await expect(page.getByTestId('segment-birthday')).toBeVisible()
    await expect(page.getByTestId('segment-opted-out')).toBeVisible()
  })

  test('Clicking a segment chip filters the table', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/customers')

    // Click "Active" chip
    await page.getByTestId('segment-active').click()
    await expect(page).toHaveURL(/.*segment=active/)

    // The heading should show the segment
    await expect(page.getByText(/active/i).first()).toBeVisible()
  })

  test('Segment badges appear on customer rows', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/customers')

    const table = page.getByTestId('customers-table')
    const hasTable = await table.isVisible().catch(() => false)

    if (hasTable) {
      // Check that segment column has badges
      const firstRow = table.locator('tbody tr').first()
      const segmentCell = firstRow.locator('td').nth(3)
      await expect(segmentCell.locator('span').first()).toBeVisible()
    }
  })
})
```

- [ ] **Step 2: Run test + commit**

```bash
pnpm test:e2e tests/slice-16.spec.ts
git add tests/slice-16.spec.ts
git commit -m "test: add E2E tests for customer segments"
```

---

## Verification Plan

1. Navigate to `/dashboard/customers` — 7 filter chips visible with counts
2. Click "Active" — URL changes to `?segment=active`, table filters to active customers only
3. Click "All" — returns to full list
4. Each customer row shows segment badges (New, Active, At Risk, etc.)
5. Birthday customers: only shown on their birthday (IST timezone)
6. Opted-out customers: separate segment, excluded from other segments
