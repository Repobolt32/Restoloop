# Slice 6: Coupon Redemption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide restaurant owners with a secure interface to validate and redeem customer coupons (updating status to `redeemed` and setting `redeemed_at`), while updating the customer's `last_visit_at` timestamp.

**Architecture:**
- **Server Action:** [actions.ts](file:///e:/desktop/Restoloop/src/app/dashboard/validate/actions.ts) will query and update the coupon and customer tables under the authenticated owner's context.
- **Interactive Validation Form:** [page.tsx](file:///e:/desktop/Restoloop/src/app/dashboard/validate/page.tsx) handles real-time input validation, transitions, loading spinners, and readable status alerts following the project's light mode theme.
- **E2E Playwright Tests:** [slice-6.spec.ts](file:///e:/desktop/Restoloop/tests/slice-6.spec.ts) will verify user auth flow, positive coupon redemptions, and error states.

## User Review Required

> [!IMPORTANT]
> - **Case Insensitivity:** Coupon codes will be trimmed and converted to uppercase (`code.trim().toUpperCase()`) before querying to avoid casing mismatch errors.
> - **Authentication Guard:** The validation page is under the `/dashboard/*` path, which is fully protected by the dashboard layout auth guard. The server action also performs its own user-session check.

## Open Questions

None at this stage. The requirements are fully detailed in [slice-6.md](file:///e:/desktop/Restoloop/docs/superpowers/plans/slice-6.md).

---

## Proposed Changes

### Component 1: Server Action & Business Logic

#### [NEW] [actions.ts](file:///e:/desktop/Restoloop/src/app/dashboard/validate/actions.ts)
- Implement `validateCoupon(code: string)` server action.
- Verify user session and ownership of the restaurant.
- Query coupon matching the code (and join customer details).
- Perform validations: existence, restaurant ownership, already redeemed status, expiration.
- Update coupon status to `redeemed` and set `redeemed_at`.
- Update customer `last_visit_at` timestamp.

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function validateCoupon(code: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Get restaurant owned by this user
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!restaurant) {
    redirect('/dashboard/create')
  }

  const sanitizedCode = code.trim().toUpperCase()

  // 2. Query coupon with matching code, and join customer details
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*, customers(*)')
    .eq('code', sanitizedCode)
    .maybeSingle()

  if (error || !coupon) {
    return { error: 'Coupon not found' }
  }

  if (coupon.restaurant_id !== restaurant.id) {
    return { error: 'Wrong restaurant' }
  }

  if (coupon.status === 'redeemed') {
    return { error: 'Already redeemed' }
  }

  if (new Date(coupon.expires_at) < new Date()) {
    return { error: 'Expired' }
  }

  // 3. Mark as redeemed
  const { error: updateCouponError } = await supabase
    .from('coupons')
    .update({
      status: 'redeemed',
      redeemed_at: new Date().toISOString(),
    })
    .eq('id', coupon.id)

  if (updateCouponError) {
    return { error: 'Failed to redeem coupon' }
  }

  // 4. Update customer last_visit_at
  const { error: updateCustomerError } = await supabase
    .from('customers')
    .update({ last_visit_at: new Date().toISOString() })
    .eq('id', coupon.customer_id)

  if (updateCustomerError) {
    console.error('Failed to update customer last_visit_at:', updateCustomerError)
  }

  return {
    success: true,
    customer: coupon.customers,
    discount: coupon.discount_cents,
    code: coupon.code,
  }
}
```

---

### Component 2: Dashboard UI & Navigation

#### [NEW] [page.tsx](file:///e:/desktop/Restoloop/src/app/dashboard/validate/page.tsx)
- Create client component containing the coupon validation form.
- Use `useTransition` to handle validation status without blocking interactions.
- Apply inline styles matching the **Crimson & Saffron** palette and fonts (`Playfair Display SC` and `Karla`).
- Ensure full accessibility: input-associated `<label>`, visible focus indicators, `aria-live="polite"` region for updates, and disabled spellchecking.

```typescript
'use client'

import { validateCoupon } from './actions'
import { useState, useTransition } from 'react'
import Link from 'next/link'

export default function ValidatePage() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState<{
    success?: boolean
    error?: string
    customer?: { name: string | null; phone: string } | null
    discount?: number
    code?: string
  } | null>(null)

  const [isPending, startTransition] = useTransition()

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault()
    if (isPending) return

    startTransition(async () => {
      const res = await validateCoupon(code)
      setResult(res)
      if (res.success) {
        setCode('')
      }
    })
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      {/* Back link */}
      <Link
        href="/dashboard"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--color-primary)',
          textDecoration: 'none',
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
          fontWeight: 600,
          marginBottom: '1.5rem',
          cursor: 'pointer',
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to Dashboard
      </Link>

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          color: 'var(--color-foreground)',
          marginBottom: '0.25rem',
          textWrap: 'balance',
        }}
      >
        Validate Coupon
      </h1>
      <p
        style={{
          color: 'var(--color-foreground)',
          opacity: 0.6,
          marginBottom: '2rem',
          fontFamily: 'var(--font-body)',
        }}
      >
        Scan or enter a guest's coupon code to redeem it.
      </p>

      {/* Form card container */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <form onSubmit={handleValidate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label
              htmlFor="coupon-code"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-foreground)',
              }}
            >
              Coupon Code
            </label>
            <input
              id="coupon-code"
              name="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., WELCOME10…"
              required
              disabled={isPending}
              autoComplete="off"
              spellCheck={false}
              style={{
                padding: '12px 16px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '1rem',
                fontFamily: 'monospace',
                letterSpacing: '0.05em',
                transition: 'border-color 200ms ease, box-shadow 200ms ease',
                color: 'var(--color-foreground)',
                background: '#FFFFFF',
                width: '100%',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)'
                e.target.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.15)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-border)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            style={{
              background: 'var(--color-accent)',
              color: '#FFFFFF',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              fontSize: '1rem',
              border: 'none',
              cursor: isPending ? 'not-allowed' : 'pointer',
              transition: 'opacity 200ms, transform 200ms',
              opacity: isPending ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
            onMouseEnter={(e) => {
              if (!isPending) {
                e.currentTarget.style.opacity = '0.9'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isPending) {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.transform = 'none'
              }
            }}
          >
            {isPending ? 'Validating…' : 'Validate & Redeem'}
          </button>
        </form>

        {/* Live Region for Screen Readers & Announcements */}
        <div aria-live="polite" style={{ marginTop: '1.5rem' }}>
          {result?.error && (
            <div
              style={{
                background: '#FEE2E2',
                border: '1px solid #FCA5A5',
                padding: '1rem',
                borderRadius: '8px',
                color: '#991B1B',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{result.error}</span>
            </div>
          )}

          {result?.success && (
            <div
              style={{
                background: '#DCFCE7',
                border: '1px solid #BBF7D0',
                padding: '1.25rem',
                borderRadius: '8px',
                color: '#166534',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>Coupon Redeemed!</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem', paddingLeft: '1.75rem' }}>
                <p><strong>Code:</strong> <span style={{ fontFamily: 'monospace' }}>{result.code}</span></p>
                <p><strong>Customer:</strong> {result.customer?.name || 'Anonymous'}</p>
                <p><strong>Discount Applied:</strong> ₹{(result.discount! / 100).toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

#### [MODIFY] [page.tsx](file:///e:/desktop/Restoloop/src/app/dashboard/page.tsx)
- Add a new card in the `Quick nav cards` section to point to `/dashboard/validate`.
- Line 67-71 modification:
```diff
       {/* Quick nav cards */}
       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
         <QuickNavCard href="/dashboard/customers" title="Active Guests" description="View all registered customers" />
         <QuickNavCard href="/dashboard/coupons" title="Coupons" description="Manage issued coupons" />
+        <QuickNavCard href="/dashboard/validate" title="Validate Coupon" description="Redeem and validate customer coupons" />
       </div>
```

#### [MODIFY] [layout.tsx](file:///e:/desktop/Restoloop/src/app/dashboard/layout.tsx)
- Add the `Validate Coupon` navigation link to the persistent sidebar menu.
- Line 55-59 modification:
```diff
         {/* Nav */}
         <nav style={{ flex: 1, padding: '16px 12px' }}>
           <NavLink href="/dashboard" label="Overview" />
           <NavLink href="/dashboard/customers" label="Guests" />
           <NavLink href="/dashboard/coupons" label="Coupons" />
+          <NavLink href="/dashboard/validate" label="Validate Coupon" />
         </nav>
```

---

### Component 3: E2E Playwright Tests

#### [NEW] [slice-6.spec.ts](file:///e:/desktop/Restoloop/tests/slice-6.spec.ts)
- Create comprehensive E2E test file verifying validation page flows:
  - Unauthorized redirect to `/login` if trying to access `/dashboard/validate` directly.
  - Successfully redeem a valid coupon (checking database status mutation, last_visit_at update, and success message).
  - Validation failures for non-existent coupon codes.
  - Validation failures for already redeemed coupon codes.
  - Validation failures for expired coupon codes.
  - Validation failures for wrong restaurant coupons.
  - DB cleanups of test restaurants, users, and coupons in `afterAll`.

```typescript
import { test, expect } from '@playwright/test'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function uniquePhone() {
  return '91' + Math.floor(1000000000 + Math.random() * 9000000000)
}

test.describe('Slice 6: Coupon Redemption', () => {
  let restaurantId: string
  let restaurantSlug: string
  let ownerId: string
  let testUserEmail: string
  let testUserPassword: string
  let customerId: string
  let validCouponCode = 'WELCOME10_S6'
  let expiredCouponCode = 'EXPIRED_S6'
  let redeemedCouponCode = 'REDEEMED_S6'
  let wrongRestaurantCouponCode = 'WRONG_REST_S6'
  let wrongRestaurantId: string

  test.beforeAll(async () => {
    testUserEmail = `test-owner-slice6-${Date.now()}@restoloop.dev`
    testUserPassword = 'testpass123'

    // 1. Create a real test user
    const { data: userResp, error: userError } = await supabase.auth.admin.createUser({
      email: testUserEmail,
      password: testUserPassword,
      email_confirm: true
    })

    if (userError || !userResp.user) {
      throw new Error(`Failed to create test user: ${userError?.message || 'unknown error'}`)
    }

    ownerId = userResp.user.id

    // 2. Create the primary restaurant
    restaurantSlug = 'test-rest-slice6-' + Date.now()
    const { data: restaurant } = await supabase
      .from('restaurants')
      .insert({
        owner_id: ownerId,
        name: 'Slice 6 Test Diner',
        slug: restaurantSlug,
        whatsapp_number: uniquePhone(),
        credits: 100,
      })
      .select()
      .single()

    restaurantId = restaurant!.id

    // 3. Create a second restaurant to test wrong-restaurant coupon ownership
    const { data: otherRest } = await supabase
      .from('restaurants')
      .insert({
        owner_id: ownerId, // Shared owner, but separate entity
        name: 'Wrong Restaurant',
        slug: 'wrong-rest-' + Date.now(),
        whatsapp_number: uniquePhone(),
        credits: 10,
      })
      .select()
      .single()

    wrongRestaurantId = otherRest!.id

    // 4. Create a customer
    const { data: customer } = await supabase
      .from('customers')
      .insert({
        restaurant_id: restaurantId,
        name: 'Slice 6 Customer',
        phone: uniquePhone(),
        opt_in_status: 'opted_in',
      })
      .select()
      .single()

    customerId = customer!.id

    // 5. Seed coupons
    await supabase.from('coupons').insert([
      {
        restaurant_id: restaurantId,
        customer_id: customerId,
        type: 'welcome',
        code: validCouponCode,
        discount_cents: 5000,
        status: 'sent',
        expires_at: new Date(Date.now() + 86400000).toISOString()
      },
      {
        restaurant_id: restaurantId,
        customer_id: customerId,
        type: 'welcome',
        code: expiredCouponCode,
        discount_cents: 3000,
        status: 'sent',
        expires_at: new Date(Date.now() - 86400000).toISOString() // Past expiry
      },
      {
        restaurant_id: restaurantId,
        customer_id: customerId,
        type: 'welcome',
        code: redeemedCouponCode,
        discount_cents: 4000,
        status: 'redeemed',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        redeemed_at: new Date().toISOString()
      },
      {
        restaurant_id: wrongRestaurantId,
        customer_id: customerId, // (Belongs to different restaurant, but same customer for testing simplicity)
        type: 'welcome',
        code: wrongRestaurantCouponCode,
        discount_cents: 2000,
        status: 'sent',
        expires_at: new Date(Date.now() + 86400000).toISOString()
      }
    ])
  })

  test.afterAll(async () => {
    if (restaurantId) {
      await supabase.from('coupons').delete().eq('restaurant_id', restaurantId)
      await supabase.from('customers').delete().eq('restaurant_id', restaurantId)
      await supabase.from('restaurants').delete().eq('id', restaurantId)
    }
    if (wrongRestaurantId) {
      await supabase.from('coupons').delete().eq('restaurant_id', wrongRestaurantId)
      await supabase.from('restaurants').delete().eq('id', wrongRestaurantId)
    }
    if (ownerId) {
      await supabase.auth.admin.deleteUser(ownerId)
    }
  })

  test('Redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/validate')
    await expect(page).toHaveURL(/.*login/)
  })

  test('Validates and redeems a valid coupon', async ({ page }) => {
    // 1. Log in
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill(testUserEmail)
    await page.getByLabel('Password').fill(testUserPassword)
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)

    // 2. Navigate to Validate Coupon Page
    await page.goto('http://localhost:3000/dashboard/validate')

    // 3. Submit valid coupon code
    await page.getByLabel('Coupon Code').fill(validCouponCode)
    await page.getByRole('button', { name: /validate & redeem/i }).click()

    // 4. Verify success display
    await expect(page.getByText('Coupon Redeemed!')).toBeVisible()
    await expect(page.getByText('Slice 6 Customer')).toBeVisible()
    await expect(page.getByText('₹50.00')).toBeVisible()

    // 5. Verify database changes
    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', validCouponCode)
      .single()

    expect(coupon!.status).toBe('redeemed')
    expect(coupon!.redeemed_at).not.toBeNull()

    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single()

    expect(customer!.last_visit_at).not.toBeNull()
  })

  test('Handles non-existent coupon error', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/validate')
    await page.getByLabel('Coupon Code').fill('NON_EXISTENT_CODE')
    await page.getByRole('button', { name: /validate & redeem/i }).click()

    await expect(page.getByText('Coupon not found')).toBeVisible()
  })

  test('Handles already redeemed coupon error', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/validate')
    await page.getByLabel('Coupon Code').fill(redeemedCouponCode)
    await page.getByRole('button', { name: /validate & redeem/i }).click()

    await expect(page.getByText('Already redeemed')).toBeVisible()
  })

  test('Handles expired coupon error', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/validate')
    await page.getByLabel('Coupon Code').fill(expiredCouponCode)
    await page.getByRole('button', { name: /validate & redeem/i }).click()

    await expect(page.getByText('Expired')).toBeVisible()
  })

  test('Handles wrong restaurant coupon error', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/validate')
    await page.getByLabel('Coupon Code').fill(wrongRestaurantCouponCode)
    await page.getByRole('button', { name: /validate & redeem/i }).click()

    await expect(page.getByText('Wrong restaurant')).toBeVisible()
  })
})
```

---

## Verification Plan

### Automated Tests
We will verify the implementation using:
- **E2E Tests:** `pnpm test:e2e tests/slice-6.spec.ts`
- **Type Checking:** `pnpm typecheck`
- **Linting:** `pnpm lint`

```bash
# Verify new E2E tests pass
pnpm test:e2e tests/slice-6.spec.ts

# Run the project-wide type checking and linting
pnpm typecheck
pnpm lint
```

### Manual Verification
1. Log in to the restaurant owner dashboard.
2. Click the new "Validate Coupon" quick link on the overview screen or in the sidebar.
3. Validate and submit a test code. Ensure clean UI transitions and clear color coding of results (crimson/rose for errors, gold accents/green borders for success).
