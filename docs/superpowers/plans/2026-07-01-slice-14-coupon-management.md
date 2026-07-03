# Slice 14: Coupon Management — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add coupon create, disable, and delete actions. Add editable discount amounts (welcome/birthday/winback) to settings. Depends on Slice 15's `coupons.enabled` column.

**Architecture:** New server actions for coupon CRUD. Modify coupons page to add create/disable/delete buttons. Add discount amount editor to settings page.

**Tech Stack:** Next.js 16 (App Router, Server Actions), Supabase, Zod, Tailwind CSS v4.

**Required Skills (load before coding):**
- `server-actions` — form actions, revalidatePath
- `supabase-postgres-best-practices` — DB queries
- `zod` — schema validation
- `tailwind-design-system` — Tailwind v4 patterns
- `frontend-design` + `ui-ux-pro-max` — UI/UX direction
- `playwright-best-practices` — E2E tests
- `karpathy-guidelines` — code quality

**Context7 MCP:** Use `context7_resolve-library-id` + `context7_query-docs` for latest docs on: Next.js Server Actions, Supabase, Zod, Tailwind CSS, Playwright.

## Global Constraints

- Goodrest POS design system.
- Depends on: `coupons.enabled` column (added in Slice 15 migration).
- Coupon types: `welcome`, `birthday`, `winback`. Manual coupons use type `manual`.
- Discount amounts in cents (integer). Default: welcome ₹50, birthday ₹38, winback ₹30.
- Disable sets `enabled = false` (soft delete). Delete removes the row.

---

### Task 1: Coupon Server Actions

**Files:**
- Create: `src/app/dashboard/coupons/actions.ts`

**Interfaces:**
- Produces: `createCouponAction(formData)`, `disableCouponAction(couponId)`, `deleteCouponAction(couponId)`

- [ ] **Step 1: Create server actions**

Create `src/app/dashboard/coupons/actions.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

function generateCode(): string {
  const allowed = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += allowed.charAt(Math.floor(Math.random() * allowed.length))
  }
  return code
}

export async function createCouponAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, welcome_discount_cents')
    .eq('owner_id', user.id)
    .single()

  if (!restaurant) redirect('/dashboard/create')

  const customerId = formData.get('customer_id') as string
  const type = formData.get('type') as string
  const discountCents = Number(formData.get('discount_cents'))

  if (!customerId || !type || !discountCents) {
    throw new Error('Missing required fields')
  }

  const code = generateCode()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const { error } = await supabase.from('coupons').insert({
    restaurant_id: restaurant.id,
    customer_id: customerId,
    type: type === 'manual' ? 'manual' : type,
    code,
    discount_cents: discountCents,
    status: 'sent',
    enabled: true,
    expires_at: expiresAt,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/coupons')
}

export async function disableCouponAction(couponId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!restaurant) redirect('/dashboard/create')

  await supabase
    .from('coupons')
    .update({ enabled: false })
    .eq('id', couponId)
    .eq('restaurant_id', restaurant.id)

  revalidatePath('/dashboard/coupons')
}

export async function deleteCouponAction(couponId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!restaurant) redirect('/dashboard/create')

  await supabase
    .from('coupons')
    .delete()
    .eq('id', couponId)
    .eq('restaurant_id', restaurant.id)
    .eq('status', 'sent') // only delete unredeemed coupons

  revalidatePath('/dashboard/coupons')
}
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/coupons/actions.ts
git commit -m "feat: add coupon create, disable, and delete server actions"
```

---

### Task 2: Coupon Management UI

**Files:**
- Modify: `src/app/dashboard/coupons/page.tsx`

**Interfaces:**
- Consumes: `createCouponAction`, `disableCouponAction`, `deleteCouponAction` from `./actions`
- Produces: Create button + disable/delete buttons in coupons table

- [ ] **Step 1: Add disable/delete buttons to coupons table**

In `src/app/dashboard/coupons/page.tsx`, add action buttons to each table row:

1. Import the new actions:

```typescript
import { disableCouponAction, deleteCouponAction } from './actions'
```

2. Add an "Actions" column to the table header:

```tsx
<th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[--color-grey-400]">
  Actions
</th>
```

3. Add action buttons to each row:

```tsx
<td className="px-4 py-3">
  {coupon.status === 'sent' && coupon.enabled !== false ? (
    <div className="flex gap-2">
      <form action={disableCouponAction.bind(null, coupon.id)}>
        <button
          type="submit"
          className="text-[10px] font-black uppercase tracking-widest text-amber-600 hover:text-amber-800 transition-colors cursor-pointer"
          data-testid={`disable-coupon-${coupon.code}`}
        >
          Disable
        </button>
      </form>
      <form action={deleteCouponAction.bind(null, coupon.id)}>
        <button
          type="submit"
          className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-800 transition-colors cursor-pointer"
          data-testid={`delete-coupon-${coupon.code}`}
        >
          Delete
        </button>
      </form>
    </div>
  ) : coupon.enabled === false ? (
    <span className="text-[9px] font-black uppercase tracking-widest text-[--color-grey-400]">
      Disabled
    </span>
  ) : null}
</td>
```

4. Add "enabled" to the query select:

```typescript
// Before:
.select('id, code, type, discount_cents, status, expires_at, customers(phone)')

// After:
.select('id, code, type, discount_cents, status, expires_at, enabled, customers(phone)')
```

5. Add `enabled` to the `CouponRow` type:

```typescript
type CouponRow = {
  id: string
  code: string
  type: string
  discount_cents: number
  status: string
  expires_at: string
  enabled: boolean
  customers: { phone: string } | null
}
```

6. Visual indicator for disabled coupons: add opacity to disabled rows:

```tsx
<tr
  key={coupon.id}
  className={`${coupon.enabled === false ? 'opacity-50' : ''} hover:bg-[--color-grey-50] transition-colors`}
>
```

- [ ] **Step 2: Add "Create Coupon" button (manual coupon)**

Add a button at the top of the coupons page that opens a simple inline form:

```tsx
{/* Create Manual Coupon */}
<div className="mb-6">
  <form action={createCouponAction} className="flex gap-4 items-end">
    <div>
      <label className="text-[10px] font-black uppercase tracking-widest text-[--color-grey-400] mb-1 block">
        Customer ID
      </label>
      <input
        type="text"
        name="customer_id"
        placeholder="Customer UUID"
        required
        className="border border-[--color-grey-200] rounded-lg px-3 py-2 text-sm font-mono focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10"
      />
    </div>
    <div>
      <label className="text-[10px] font-black uppercase tracking-widest text-[--color-grey-400] mb-1 block">
        Discount (₹)
      </label>
      <input
        type="number"
        name="discount_cents"
        placeholder="50"
        required
        min={1}
        className="border border-[--color-grey-200] rounded-lg px-3 py-2 text-sm font-bold focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10 w-24"
      />
    </div>
    <input type="hidden" name="type" value="manual" />
    <button
      type="submit"
      className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer"
    >
      Create Coupon
    </button>
  </form>
</div>
```

Note: This is a basic manual coupon creator. A full customer picker dropdown would require fetching customers — defer to a future iteration. For now, paste the customer UUID from the customers page.

- [ ] **Step 3: Run typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/coupons/
git commit -m "feat: add coupon create, disable, delete UI to coupons page"
```

---

### Task 3: Editable Discount Amounts in Settings

**Files:**
- Modify: `src/app/dashboard/settings/actions.ts` (extend existing)
- Modify: `src/app/dashboard/settings/page.tsx`

**Interfaces:**
- Produces: Editable fields for `welcome_discount_cents`, `birthday_discount_cents`, `winback_discount_cents`

- [ ] **Step 1: Extend settings server action**

In `src/app/dashboard/settings/actions.ts`, add discount fields to the schema:

```typescript
const settingsSchema = z.object({
  // ... existing fields from Slice 15
  welcome_discount_cents: z.number().int().min(100).max(10000),  // ₹1 to ₹100
  birthday_discount_cents: z.number().int().min(100).max(10000),
  winback_discount_cents: z.number().int().min(100).max(10000),
})
```

In the `updateCampaignSettings` function, add the discount fields to the parsed data:

```typescript
const parsed = settingsSchema.parse({
  // ... existing fields
  welcome_discount_cents: Number(formData.get('welcome_discount_cents')) * 100,  // convert ₹ to cents
  birthday_discount_cents: Number(formData.get('birthday_discount_cents')) * 100,
  winback_discount_cents: Number(formData.get('winback_discount_cents')) * 100,
})
```

- [ ] **Step 2: Add discount editor to settings page**

In `src/app/dashboard/settings/page.tsx`, add a discount amounts section:

```tsx
{/* Discount Amounts */}
<div className="pt-4 border-t border-[--color-grey-100]">
  <p className="text-[10px] font-black uppercase tracking-widest text-[--color-grey-400] mb-3">
    Coupon Discount Amounts (₹)
  </p>
  <div className="grid grid-cols-3 gap-4">
    <div>
      <label className="text-xs font-bold text-[--color-grey-600] mb-1 block">Welcome</label>
      <input
        type="number"
        name="welcome_discount_cents"
        defaultValue={(restaurant.welcome_discount_cents || 5000) / 100}
        min={1}
        max={100}
        className="w-full border border-[--color-grey-200] rounded-lg px-3 py-2 text-sm font-bold focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10"
      />
    </div>
    <div>
      <label className="text-xs font-bold text-[--color-grey-600] mb-1 block">Birthday</label>
      <input
        type="number"
        name="birthday_discount_cents"
        defaultValue={(restaurant.birthday_discount_cents || 3800) / 100}
        min={1}
        max={100}
        className="w-full border border-[--color-grey-200] rounded-lg px-3 py-2 text-sm font-bold focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10"
      />
    </div>
    <div>
      <label className="text-xs font-bold text-[--color-grey-600] mb-1 block">Winback</label>
      <input
        type="number"
        name="winback_discount_cents"
        defaultValue={(restaurant.winback_discount_cents || 3000) / 100}
        min={1}
        max={100}
        className="w-full border border-[--color-grey-200] rounded-lg px-3 py-2 text-sm font-bold focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10"
      />
    </div>
  </div>
</div>
```

- [ ] **Step 3: Run typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/settings/
git commit -m "feat: add editable discount amounts to settings page"
```

---

### Task 4: E2E Test — Coupon Management

**Files:**
- Create: `tests/slice-14.spec.ts`

- [ ] **Step 1: Write E2E test**

Create `tests/slice-14.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Slice 14: Coupon Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill('iamkumarankit1502@gmail.com')
    await page.getByLabel('Password').fill('Ankit@2032')
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('Coupons page shows disable/delete buttons for sent coupons', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/coupons')

    // Wait for table to load
    await page.waitForSelector('[data-testid="coupons-table"]', { timeout: 5000 }).catch(() => null)

    // Check if action buttons exist (or empty state)
    const table = page.locator('[data-testid="coupons-table"]')
    const emptyState = page.getByText('No coupons issued yet')
    const hasTable = await table.isVisible().catch(() => false)

    if (hasTable) {
      // Verify at least one disable button exists
      const disableButtons = page.locator('button:has-text("Disable")')
      const count = await disableButtons.count()
      expect(count).toBeGreaterThan(0)
    } else {
      await expect(emptyState).toBeVisible()
    }
  })

  test('Settings page shows discount amount editors', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/settings')

    await expect(page.getByText('Coupon Discount Amounts')).toBeVisible()
    await expect(page.getByLabel('Welcome')).toBeVisible()
    await expect(page.getByLabel('Birthday')).toBeVisible()
    await expect(page.getByLabel('Winback')).toBeVisible()
  })
})
```

- [ ] **Step 2: Run E2E test**

```bash
pnpm test:e2e tests/slice-14.spec.ts
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/slice-14.spec.ts
git commit -m "test: add E2E tests for coupon management"
```

---

## Verification Plan

### Automated Tests
```bash
pnpm typecheck && pnpm lint && pnpm test:e2e tests/slice-14.spec.ts
```

### Manual Verification
1. Coupons page: sent coupons show "Disable" and "Delete" buttons
2. Click "Disable" → coupon row gets `opacity-50`, button says "Disabled"
3. Click "Delete" → coupon removed from table (only unredeemed coupons can be deleted)
4. Create manual coupon: paste customer UUID + discount → new coupon appears in table
5. Settings: discount amounts editable (₹ values), saved correctly
6. New coupons use updated discount amounts

### Commit Summary
1. `feat: add coupon create, disable, and delete server actions`
2. `feat: add coupon create, disable, delete UI to coupons page`
3. `feat: add editable discount amounts to settings page`
4. `test: add E2E tests for coupon management`
