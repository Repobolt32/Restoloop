# Slice 7 - "Credits Work" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement self-serve billing integration using Razorpay so that restaurant owners can purchase additional WhatsApp message credits directly from their settings page.

**Architecture:** A client-side Razorpay payment checkout script is loaded dynamically on the Settings page. This page communicates with a local order creation API route, which secures orders with Razorpay's API. When the payment completes, Razorpay triggers a webhook on our secure route, which verifies signatures and updates the database using the service client.

**Tech Stack:** Next.js Route Handlers, Razorpay Node.js SDK, Supabase SSR client + Service Role Client, Karla & Playfair Display SC typography styling, Playwright E2E.

## Global Constraints
* Global Styling Rule: Strictly follow the Crimson & Warm Saffron light mode theme defined in MASTER.md across the entire application (including login, signup, intake forms, dashboard, and all future pages). No dark mode is allowed, and all styling must use the defined Tailwind variables/CSS variables for colors, typography (Playfair Display SC / Karla), and spacing.
* No emojis as icons (use inline SVGs).
* All money amounts in cents (paise in Razorpay).
* Always run typecheck + lint before claiming code works.

---

### Task 1: Setup and Razorpay Client Setup

**Files:**
* Create: `src/lib/razorpay.ts`

**Interfaces:**
* Consumes: environment variables `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
* Produces: `razorpay` initialized client export.

- [ ] **Step 1: Install razorpay NPM package**
  Run: `pnpm install razorpay`
  Expected: Successful installation.

- [ ] **Step 2: Create razorpay client wrapper**
  Create `src/lib/razorpay.ts`:
  ```typescript
  import Razorpay from 'razorpay'

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Missing Razorpay API credentials in environment variables.')
  }

  export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
  ```

- [ ] **Step 3: Run typecheck to verify compiling**
  Run: `pnpm typecheck`
  Expected: PASS

- [ ] **Step 4: Commit setup**
  Run:
  ```bash
  git add package.json pnpm-lock.yaml src/lib/razorpay.ts
  git commit -m "feat: install razorpay and initialize SDK client wrapper"
  ```

---

### Task 2: Backend API Routes

**Files:**
* Create: `src/app/api/razorpay/create-order/route.ts`
* Create: `src/app/api/razorpay/webhook/route.ts`

**Interfaces:**
* Consumes: `razorpay` from `@/lib/razorpay`, `createClient` and `createServiceClient` from `@/lib/supabase/server`.
* Produces: `/api/razorpay/create-order` endpoint, `/api/razorpay/webhook` endpoint.

- [ ] **Step 1: Implement order creation endpoint**
  Create `src/app/api/razorpay/create-order/route.ts`:
  ```typescript
  import { createClient } from '@/lib/supabase/server'
  import { razorpay } from '@/lib/razorpay'
  import { NextRequest, NextResponse } from 'next/server'

  export async function POST(request: NextRequest) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { amount, credits } = await request.json()

      if (!amount || !credits || amount <= 0 || credits <= 0) {
        return NextResponse.json({ error: 'Invalid order parameters' }, { status: 400 })
      }

      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (!restaurant) {
        return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
      }

      const order = await razorpay.orders.create({
        amount: amount * 100, // Razorpay expects amount in paise (1 INR = 100 paise)
        currency: 'INR',
        receipt: `credits_${user.id}_${Date.now()}`,
        notes: {
          credits: credits.toString(),
          userId: user.id,
        },
      })

      return NextResponse.json({ orderId: order.id })
    } catch (error: any) {
      console.error('Error creating order:', error)
      return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
  }
  ```

- [ ] **Step 2: Implement webhook handler endpoint**
  Create `src/app/api/razorpay/webhook/route.ts`:
  ```typescript
  import { createServiceClient } from '@/lib/supabase/server'
  import Razorpay from 'razorpay'
  import { NextRequest, NextResponse } from 'next/server'

  export async function POST(request: NextRequest) {
    try {
      const body = await request.text()
      const signature = request.headers.get('x-razorpay-signature') || ''

      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
      if (!webhookSecret) {
        console.error('Webhook secret not defined.')
        return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
      }

      const isValid = Razorpay.validateWebhookSignature(
        body,
        signature,
        webhookSecret
      )

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }

      const event = JSON.parse(body)

      if (event.event === 'payment.captured') {
        const payment = event.payload.payment.entity
        const userId = payment.notes.userId
        const credits = parseInt(payment.notes.credits, 10)

        if (!userId || isNaN(credits)) {
          return NextResponse.json({ error: 'Missing payment notes metadata' }, { status: 400 })
        }

        const supabase = createServiceClient()

        const { data: restaurant, error: fetchError } = await supabase
          .from('restaurants')
          .select('credits')
          .eq('owner_id', userId)
          .maybeSingle()

        if (fetchError || !restaurant) {
          console.error('Webhook: Restaurant not found for owner_id:', userId, fetchError)
          return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
        }

        const newCredits = (restaurant.credits || 0) + credits

        const { error: updateError } = await supabase
          .from('restaurants')
          .update({ credits: newCredits })
          .eq('owner_id', userId)

        if (updateError) {
          console.error('Webhook: Failed to update credits:', updateError)
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
        }
      }

      return NextResponse.json({ status: 'ok' })
    } catch (error: any) {
      console.error('Error handling webhook:', error)
      return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
  }
  ```

- [ ] **Step 3: Run typecheck and lint**
  Run: `pnpm typecheck && pnpm lint`
  Expected: PASS

- [ ] **Step 4: Commit API routes**
  Run:
  ```bash
  git add src/app/api/razorpay/
  git commit -m "feat: implement order creation and webhook verification API routes"
  ```

---

### Task 3: Settings Page UI & Dashboard Integration

**Files:**
* Create: `src/app/dashboard/settings/page.tsx`
* Modify: `src/app/dashboard/layout.tsx`
* Modify: `src/app/dashboard/page.tsx`

**Interfaces:**
* Consumes: `createClient` from `@/lib/supabase/client`, dynamic script checkout script.
* Produces: Settings page at `/dashboard/settings`, navigation items.

- [ ] **Step 1: Create Settings Page Client Component**
  Create `src/app/dashboard/settings/page.tsx`:
  ```typescript
  'use client'

  import { createClient } from '@/lib/supabase/client'
  import { useState, useEffect, useTransition } from 'react'
  import Script from 'next/script'
  import Link from 'next/link'

  export default function SettingsPage() {
    const [restaurant, setRestaurant] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null)
    const [paymentError, setPaymentError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [isPending, startTransition] = useTransition()
    const supabase = createClient()

    useEffect(() => {
      fetchRestaurant()
    }, [])

    const fetchRestaurant = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle()
          
        if (data) {
          setRestaurant(data)
        }
      } catch (err) {
        console.error('Error fetching restaurant:', err)
      } finally {
        setLoading(false)
      }
    }

    const handleTopUp = async (credits: number) => {
      setPaymentSuccess(null)
      setPaymentError(null)
      
      startTransition(async () => {
        try {
          const amount = credits * 1 // ₹1 per credit
          
          const res = await fetch('/api/razorpay/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, credits }),
          })
          
          if (!res.ok) {
            const errData = await res.json()
            throw new Error(errData.error || 'Failed to create order')
          }
          
          const { orderId } = await res.json()
          
          const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: amount * 100, // paise
            currency: 'INR',
            name: 'Restoloop',
            description: `${credits} credits top-up`,
            order_id: orderId,
            handler: async (response: any) => {
              setPaymentSuccess(`Successfully purchased ${credits} credits!`)
              fetchRestaurant()
            },
            prefill: {
              email: restaurant?.email || '',
            },
            theme: {
              color: '#A16207', // Saffron Accent CTA color
            },
            modal: {
              ondismiss: function() {
                setPaymentError('Payment cancelled by user.')
              }
            }
          }
          
          const rzp = new (window as any).Razorpay(options)
          rzp.open()
        } catch (err: any) {
          console.error('Razorpay checkout error:', err)
          setPaymentError(err.message || 'Payment initiation failed.')
        }
      })
    }

    const handleCopyUrl = () => {
      if (!restaurant) return
      const url = `${window.location.origin}/form/${restaurant.slug}`
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }

    if (loading) {
      return (
        <div className="p-8 max-w-4xl mx-auto flex items-center justify-center min-h-[50vh]">
          <p className="text-foreground/60 font-body animate-pulse">Loading settings…</p>
        </div>
      )
    }

    if (!restaurant) {
      return (
        <div className="p-8 max-w-4xl mx-auto font-body">
          <p className="text-foreground">No restaurant found. Please create one first.</p>
        </div>
      )
    }

    const creditPct = Math.min(100, Math.round((restaurant.credits / 1000) * 100))

    return (
      <div className="p-8 max-w-4xl mx-auto font-body">
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-primary font-semibold text-sm mb-6 hover:underline cursor-pointer"
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

        <h1 className="font-display text-3xl font-bold text-foreground mb-1 text-wrap-balance">
          Settings
        </h1>
        <p className="text-foreground/60 mb-8">
          Manage your restaurant account and top up message credits.
        </p>

        {/* Stateful status notifications */}
        <div aria-live="polite" className="mb-6">
          {paymentSuccess && (
            <div data-testid="payment-success-alert" className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg text-emerald-800 text-sm font-medium flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{paymentSuccess}</span>
            </div>
          )}
          {paymentError && (
            <div data-testid="payment-error-alert" className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-800 text-sm font-medium flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{paymentError}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Credits Management Card */}
          <div className="bg-white border border-border rounded-xl p-8 shadow-md flex flex-col justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-4">Message Credits</h2>
              <div className="flex justify-between items-baseline mb-4">
                <span className="text-3xl font-extrabold text-foreground" data-testid="credits-value">{restaurant.credits}</span>
                <span className="text-foreground/50 text-sm">/ 1000 credits</span>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <svg width="100%" height="8" role="progressbar" aria-valuenow={restaurant.credits} aria-valuemin={0} aria-valuemax={1000} aria-label={`${restaurant.credits} of 1000 credits`}>
                  <rect x="0" y="0" width="100%" height="8" rx="4" fill="var(--color-border)" />
                  <rect x="0" y="0" width={`${creditPct}%`} height="8" rx="4" fill="#22C55E" style={{ transition: 'width 600ms ease' }} />
                </svg>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-foreground/60">Choose a package to top up (₹1 per credit):</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  data-testid="top-up-100"
                  onClick={() => handleTopUp(100)}
                  disabled={isPending}
                  className="bg-accent text-white py-2 px-3 rounded-lg font-semibold text-xs border-0 cursor-pointer transition-all hover:opacity-90 disabled:opacity-50"
                >
                  100 cr<br />(₹100)
                </button>
                <button
                  data-testid="top-up-500"
                  onClick={() => handleTopUp(500)}
                  disabled={isPending}
                  className="bg-accent text-white py-2 px-3 rounded-lg font-semibold text-xs border-0 cursor-pointer transition-all hover:opacity-90 disabled:opacity-50"
                >
                  500 cr<br />(₹500)
                </button>
                <button
                  data-testid="top-up-1000"
                  onClick={() => handleTopUp(1000)}
                  disabled={isPending}
                  className="bg-accent text-white py-2 px-3 rounded-lg font-semibold text-xs border-0 cursor-pointer transition-all hover:opacity-90 disabled:opacity-50"
                >
                  1000 cr<br />(₹1000)
                </button>
              </div>
            </div>
          </div>

          {/* Restaurant Details Card */}
          <div className="bg-white border border-border rounded-xl p-8 shadow-md">
            <h2 className="font-display text-xl font-bold text-foreground mb-4">Restaurant Details</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-foreground/50 font-semibold text-xs uppercase tracking-wider">Name</p>
                <p className="text-foreground font-semibold mt-0.5" data-testid="settings-restaurant-name">{restaurant.name}</p>
              </div>
              <div>
                <p className="text-foreground/50 font-semibold text-xs uppercase tracking-wider">WhatsApp Number</p>
                <p className="text-foreground font-mono mt-0.5">{restaurant.whatsapp_number}</p>
              </div>
              <div>
                <p className="text-foreground/50 font-semibold text-xs uppercase tracking-wider">Public Intake Form URL</p>
                <div className="flex gap-2 items-center mt-1">
                  <input
                    type="text"
                    readOnly
                    data-testid="public-form-url"
                    value={`${window.location.origin}/form/${restaurant.slug}`}
                    className="bg-muted text-foreground/70 font-mono text-xs px-3 py-2 rounded-lg border border-border flex-1 outline-none"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="px-3 py-2 bg-foreground text-white rounded-lg text-xs font-semibold hover:opacity-90 cursor-pointer transition-all"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 2: Update Sidebar layout menu**
  Modify `src/app/dashboard/layout.tsx` to add settings option in nav list.
  Target Content:
  ```typescript
        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          <NavLink href="/dashboard" label="Overview" />
          <NavLink href="/dashboard/customers" label="Guests" />
          <NavLink href="/dashboard/coupons" label="Coupons" />
          <NavLink href="/dashboard/validate" label="Validate Coupon" />
        </nav>
  ```
  Replacement Content:
  ```typescript
        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          <NavLink href="/dashboard" label="Overview" />
          <NavLink href="/dashboard/customers" label="Guests" />
          <NavLink href="/dashboard/coupons" label="Coupons" />
          <NavLink href="/dashboard/validate" label="Validate Coupon" />
          <NavLink href="/dashboard/settings" label="Settings" />
        </nav>
  ```

- [ ] **Step 3: Update Dashboard Overview quick cards**
  Modify `src/app/dashboard/page.tsx` to link to settings.
  Target Content:
  ```typescript
      {/* Quick nav cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <QuickNavCard href="/dashboard/customers" title="Active Guests" description="View all registered customers" />
        <QuickNavCard href="/dashboard/coupons" title="Coupons" description="Manage issued coupons" />
        <QuickNavCard href="/dashboard/validate" title="Validate Coupon" description="Redeem and validate customer coupons" />
      </div>
  ```
  Replacement Content:
  ```typescript
      {/* Quick nav cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <QuickNavCard href="/dashboard/customers" title="Active Guests" description="View all registered customers" />
        <QuickNavCard href="/dashboard/coupons" title="Coupons" description="Manage issued coupons" />
        <QuickNavCard href="/dashboard/validate" title="Validate Coupon" description="Redeem and validate customer coupons" />
        <QuickNavCard href="/dashboard/settings" title="Settings" description="Manage restaurant and buy credits" />
      </div>
  ```

- [ ] **Step 4: Run typecheck and lint**
  Run: `pnpm typecheck && pnpm lint`
  Expected: PASS

- [ ] **Step 5: Commit UI updates**
  Run:
  ```bash
  git add src/app/dashboard/settings/page.tsx src/app/dashboard/layout.tsx src/app/dashboard/page.tsx
  git commit -m "feat: implement premium SettingsPage and integrate dashboard navigation"
  ```

---

### Task 4: E2E and Webhook Verification Tests

**Files:**
* Create: `tests/slice-7.spec.ts`

**Interfaces:**
* Consumes: `/api/razorpay/create-order`, `/api/razorpay/webhook`, `/dashboard/settings`.
* Produces: complete Playwright E2E test verification suite.

- [ ] **Step 1: Write E2E and webhook verification test**
  Create `tests/slice-7.spec.ts`:
  ```typescript
  import { test, expect } from '@playwright/test'
  import { createClient as createSupabaseClient } from '@supabase/supabase-js'
  import dotenv from 'dotenv'
  import path from 'path'
  import crypto from 'crypto'

  dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  function uniquePhone() {
    return '91' + Math.floor(1000000000 + Math.random() * 9000000000)
  }

  test.describe('Slice 7: Credits and Razorpay Integration', () => {
    let restaurantId: string
    let restaurantSlug: string
    let ownerId: string
    let testUserEmail: string
    let testUserPassword: string

    test.beforeAll(async () => {
      testUserEmail = `test-owner-slice7-${Date.now()}@restoloop.dev`
      testUserPassword = 'testpass123'

      // Create a test user
      const { data: userResp, error: userError } = await supabase.auth.admin.createUser({
        email: testUserEmail,
        password: testUserPassword,
        email_confirm: true
      })

      if (userError || !userResp.user) {
        throw new Error(`Failed to create test user: ${userError?.message || 'unknown error'}`)
      }

      ownerId = userResp.user.id

      // Create a restaurant
      restaurantSlug = 'test-rest-slice7-' + Date.now()
      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .insert({
          owner_id: ownerId,
          name: 'Slice 7 Test Diner',
          slug: restaurantSlug,
          whatsapp_number: uniquePhone(),
          welcome_discount_cents: 5000,
          birthday_discount_cents: 3500,
          winback_discount_cents: 3000,
          credits: 1000,
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create test restaurant: ${error.message}`)
      }

      restaurantId = restaurant.id
    })

    test.afterAll(async () => {
      if (restaurantId) {
        await supabase.from('restaurants').delete().eq('id', restaurantId)
      }
      if (ownerId) {
        await supabase.auth.admin.deleteUser(ownerId)
      }
    })

    test('Razorpay client script and settings UI load successfully', async ({ page }) => {
      // Login
      await page.goto('http://localhost:3000/login')
      await page.getByLabel('Email').fill(testUserEmail)
      await page.getByLabel('Password').fill(testUserPassword)
      await page.getByRole('button', { name: /log in/i }).click()
      await expect(page).toHaveURL(/.*dashboard/)

      // Click settings quick card
      await page.click('text=Settings')
      await expect(page).toHaveURL(/.*settings/)

      await expect(page.getByTestId('settings-restaurant-name')).toContainText('Slice 7 Test Diner')
      await expect(page.getByTestId('credits-value')).toContainText('1000')
      await expect(page.getByTestId('top-up-100')).toBeVisible()
    })

    test('Purchase action calls create-order and opens Razorpay checkout (stubbed)', async ({ page }) => {
      // Login and navigate
      await page.goto('http://localhost:3000/login')
      await page.getByLabel('Email').fill(testUserEmail)
      await page.getByLabel('Password').fill(testUserPassword)
      await page.getByRole('button', { name: /log in/i }).click()
      await page.goto('http://localhost:3000/dashboard/settings')

      // Stub Razorpay constructor
      await page.addInitScript(() => {
        (window as any).Razorpay = function(options: any) {
          return {
            open: () => {
              // Immediately call success callback handler with mock payment data
              options.handler({
                razorpay_payment_id: 'pay_mock123',
                razorpay_order_id: options.order_id,
                razorpay_signature: 'sig_mock123'
              });
            }
          };
        };
      });

      // Intercept the post request
      const orderPromise = page.waitForResponse(response => 
        response.url().includes('/api/razorpay/create-order') && response.status() === 200
      )

      await page.getByTestId('top-up-100').click()

      // Confirm order request fired and mock checkout triggered
      await orderPromise
      await expect(page.getByTestId('payment-success-alert')).toContainText(/Successfully purchased 100 credits/i)
    })

    test('Razorpay webhook validates signature and updates credits in database', async ({ request }) => {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test-secret'
      
      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_webhook_test_123',
              amount: 10000,
              currency: 'INR',
              notes: {
                credits: '100',
                userId: ownerId
              }
            }
          }
        }
      }

      const body = JSON.stringify(payload)
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex')

      const response = await request.post('http://localhost:3000/api/razorpay/webhook', {
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': signature
        },
        data: body
      })

      expect(response.ok()).toBe(true)

      // Query DB directly to verify credits incremented by 100 (1000 initial + 100 = 1100)
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('credits')
        .eq('id', restaurantId)
        .single()

      expect(restaurant.credits).toBe(1100)
    })
  })
  ```

- [ ] **Step 2: Run typecheck, lint, and E2E tests**
  Run: `pnpm typecheck && pnpm lint && pnpm test:e2e tests/slice-7.spec.ts`
  Expected: PASS

- [ ] **Step 3: Commit verification tests**
  Run:
  ```bash
  git add tests/slice-7.spec.ts
  git commit -m "test: add E2E integration tests for credits top-up and webhook"
  ```
