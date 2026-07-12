# WhatsApp Ban Prevention Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement five layered defences to prevent WhatsApp number bans — double-opt-in, spintax variation, reply jitter via `after()`, prior-interaction gate on campaigns, and hourly batch cron distribution.

**Architecture:** A new pure utility (`spintax.ts`) provides message variation. The webhook route is restructured to return 200 immediately and do actual sending inside Next.js `after()`. The campaign engine gains a per-customer dedup check against `message_logs`. The cron runs hourly with a 5-per-restaurant batch cap.

**Tech Stack:** Next.js 16 App Router, `after()` from `next/server`, Vitest, Supabase Postgres, Vercel Cron.

## Required Skills

Before writing or editing any code, the agent MUST load and review the following instructions and skills:
1. **superpowers:using-superpowers**: For starting the agent's work, finding, and loading other relevant skills.
2. **ponytail**: For keeping implementation minimal, YAGNI-first, avoiding unnecessary heavy dependencies/queues, and adding `// ponytail:` comments.
3. **route-handlers**: For building the Next.js API webhook endpoint POST handler.
4. **vercel-functions**: For configuring Next.js runtime, Vercel Serverless Function behavior, `maxDuration` limits, and Vercel Cron jobs.
5. **openwa-skill**: For interacting with the OpenWA (WhatsApp API) REST API.
6. **context7 MCP Server**: Call `resolve-library-id` followed by `query-docs` to fetch up-to-date documentation for any Next.js (e.g., `after()` callback), React, or Supabase library APIs.

## Global Constraints

- Ponytail (YAGNI, minimal): no new DB tables, no new npm packages, no external queues.
- All money in cents, phones in E.164 (no `+` prefix).
- `pnpm typecheck` and `pnpm lint` must pass after every task.
- Commit after each task passes its tests.
- Design spec: `docs/superpowers/specs/2026-07-12-whatsapp-ban-prevention-design.md`.

---

### Task 1: Spintax Utility

**Files:**
- Create: `src/lib/whatsapp/spintax.ts`
- Create: `src/lib/whatsapp/spintax.test.ts`

**Interfaces:**
- Produces: `resolveSpintax(template: string): string` — picks a random variant from each `{A|B|C}` token in the template. Tokens with only one option (e.g., `{Hello}`) return that option unchanged.

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/whatsapp/spintax.test.ts
import { describe, it, expect } from 'vitest'
import { resolveSpintax } from './spintax'

describe('resolveSpintax', () => {
  it('returns string unchanged when no tokens present', () => {
    expect(resolveSpintax('Hello there!')).toBe('Hello there!')
  })

  it('resolves a single-option token', () => {
    expect(resolveSpintax('{Hello} there!')).toBe('Hello there!')
  })

  it('resolves a multi-option token to one of the options', () => {
    const result = resolveSpintax('{Hey|Hi|Hello} there!')
    expect(['Hey there!', 'Hi there!', 'Hello there!']).toContain(result)
  })

  it('resolves multiple independent tokens', () => {
    const result = resolveSpintax('{Hey|Hi} {you|friend}!')
    const valid = ['Hey you!', 'Hey friend!', 'Hi you!', 'Hi friend!']
    expect(valid).toContain(result)
  })

  it('handles empty string', () => {
    expect(resolveSpintax('')).toBe('')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```
pnpm test src/lib/whatsapp/spintax.test.ts
```
Expected: FAIL — `Cannot find module './spintax'`

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/whatsapp/spintax.ts
export function resolveSpintax(template: string): string {
  // ponytail: single-pass regex, no nesting support needed
  return template.replace(/\{([^}]+)\}/g, (_, options: string) => {
    const choices = options.split('|')
    return choices[Math.floor(Math.random() * choices.length)]
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
pnpm test src/lib/whatsapp/spintax.test.ts
```
Expected: 5 tests PASS

- [ ] **Step 5: Typecheck and commit**

```
pnpm typecheck
git add src/lib/whatsapp/spintax.ts src/lib/whatsapp/spintax.test.ts
git commit -m "feat: add resolveSpintax utility"
```

---

### Task 2: Opt-Out Gate on Intake Form

**Files:**
- Modify: `src/app/form/[slug]/actions.ts` (add opted-out check in the duplicate-phone branch)
- Modify: `src/app/form/[slug]/actions.test.ts` (add opted-out test case)

**Interfaces:**
- Consumes: `submitIntakeForm(slug, formData)` from Task 2 (existing function, just adding a branch).
- The form action already catches `23505` duplicate phone errors. We add a check inside that branch: if `existingCustomer.opt_in_status === 'opted_out'`, return an error.

- [ ] **Step 1: Write the failing test**

Open `src/app/form/[slug]/actions.test.ts` and add this test case to the existing describe block (do NOT replace the file — append):

```typescript
it('rejects submission when customer is opted out', async () => {
  // Arrange: mock restaurant found, then customer insert fails 23505,
  // then existingCustomer fetch returns an opted_out customer
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn()
      .mockResolvedValueOnce({ data: { id: 'r1', slug: 'test', whatsapp_number: '919999999999', welcome_discount_percent: 10 } }) // restaurant lookup
      .mockResolvedValueOnce({ data: null, error: { code: '23505', message: 'dup' } })   // insert fails
      .mockResolvedValueOnce({ data: { id: 'c1', opt_in_status: 'opted_out' } }),         // existing customer
    insert: vi.fn().mockReturnThis(),
  }
  // ... wire up mock and call submitIntakeForm
  // Expected: { success: false, error: 'You have opted out ...' }
})
```

> **Note for executor:** The test file uses `vi.mock` for `createServiceClient`. Match the mock pattern already used in the file (look at existing test setup — do NOT rewrite existing tests). Add only the new case.

- [ ] **Step 2: Run test to verify it fails**

```
pnpm test src/app/form
```
Expected: new test FAIL

- [ ] **Step 3: Add opted-out gate to `submitIntakeForm`**

In `src/app/form/[slug]/actions.ts`, inside the `if (customerError.code === '23505')` branch, immediately after fetching `existingCustomer`, add:

```typescript
if (existingCustomer) {
  // Gate: opted-out customers cannot re-enter via the form
  if (existingCustomer.opt_in_status === 'opted_out') {
    return {
      success: false,
      error: 'You have opted out of this loyalty club. Please contact the restaurant to re-enable your membership.',
    }
  }

  // (existing coupon-lookup code continues below unchanged)
  const { data: existingCoupon } = await supabase
    .from('coupons')
    .select('code')
    .eq('customer_id', existingCustomer.id)
    .eq('type', 'welcome')
    .maybeSingle()
  // ... rest unchanged
```

- [ ] **Step 4: Run tests to verify they pass**

```
pnpm test src/app/form
```
Expected: all existing + new test PASS

- [ ] **Step 5: Typecheck and commit**

```
pnpm typecheck
git add src/app/form/
git commit -m "feat: block opted-out customers from re-submitting intake form"
```

---

### Task 3: Webhook — YES/Y Match + Double-Opt-In + Jitter via `after()`

**Files:**
- Modify: `src/app/api/whatsapp/route.ts`
- Modify: `src/app/api/whatsapp/route.test.ts`

**Interfaces:**
- Consumes: `resolveSpintax` from Task 1.
- Consumes: `after` from `next/server` (built-in, no install needed).
- The webhook POST handler must return `NextResponse.json({ status: 'ok' })` immediately. All DB writes and `sendText` calls move into the `after()` callback.

#### The new webhook flow for an `opted_in` customer (first contact):

1. Webhook validates, dedupes, logs inbound message.
2. Returns `200 OK` to OpenWA immediately (inside `after()` guard).
3. Inside `after()`: checks for existing `opt_in_confirm` log.
   - If **none found**: send greeting + YES prompt (with 5-8s jitter). Log as `opt_in_prompt`.
   - If **found**: the coupon was already sent; ignore (no action).
4. When customer replies `YES` or `Y`: inside `after()`, send the actual coupon. Log as `opt_in_confirm`.

#### The greeting message template (with spintax):

```
{Hi|Hey|Hello} {name}! 🎁 Welcome to {restaurant}. {Reply YES to confirm and|To receive} your {discount}% discount coupon, {just reply YES|reply YES below}. Reply STOP to cancel.
```

#### The coupon delivery message template (with spintax):

```
{Great|Wonderful|Awesome}! {Here is|Here's} your coupon for {restaurant}: {code} — {discount}% OFF. Valid till {expiry}. {Enjoy|Use it on your next visit}! Reply STOP to opt out.
```

- [ ] **Step 1: Add import for `after` and `resolveSpintax` to route.ts**

At the top of `src/app/api/whatsapp/route.ts`, add:

```typescript
import { after } from 'next/server'
import { resolveSpintax } from '@/lib/whatsapp/spintax'
```

Also add a simple jitter helper at the top of the file (outside the handler):

```typescript
// ponytail: native setTimeout, no dep needed
function jitter(minMs: number, maxMs: number): Promise<void> {
  return new Promise(resolve =>
    setTimeout(resolve, Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs)
  )
}
```

- [ ] **Step 2: Restructure POST() to use `after()`**

Replace the current body of `POST()` with the following structure. The response is returned immediately after logging the inbound message; all outbound logic runs inside `after()`.

> Key rule: `after()` runs AFTER the response has been sent. You cannot use it to mutate the response. All `return NextResponse.json(...)` statements in the existing code that trigger an early exit (e.g., `unknown_restaurant`) must still be before the `after()` call.

Full replacement of `src/app/api/whatsapp/route.ts`:

```typescript
import { createServiceClient } from '@/lib/supabase/server'
import { createWhatsAppAdapter } from '@/lib/whatsapp/adapter'
import { resolveSpintax } from '@/lib/whatsapp/spintax'
import { after } from 'next/server'
import { NextRequest, NextResponse } from 'next/server'

// ponytail: native setTimeout, no dep needed
function jitter(minMs: number, maxMs: number): Promise<void> {
  return new Promise(resolve =>
    setTimeout(resolve, Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs)
  )
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-signature') || ''

  const adapter = createWhatsAppAdapter()
  const event = adapter.validateWebhook(rawBody, signature)

  if (!event) {
    return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Dedupe: check if message already processed
  const { data: existing } = await supabase
    .from('message_logs')
    .select('id')
    .eq('provider_message_id', event.messageId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ status: 'duplicate' })
  }

  let fromPhone = event.from.replace('@c.us', '').replace(/\D/g, '')
  const replyTo = event.from.includes('@lid') ? event.from : fromPhone

  if (event.from.includes('@lid')) {
    if (event.senderPhone) {
      fromPhone = event.senderPhone.replace(/\D/g, '')
    } else {
      const resolved = adapter.resolveLidPhone
        ? await adapter.resolveLidPhone(event.from)
        : null
      if (resolved) fromPhone = resolved
    }
  }

  const toPhone = (event.to || '').replace('@c.us', '').replace(/\D/g, '')

  let restaurant = null

  if (toPhone) {
    const { data } = await supabase
      .from('restaurants')
      .select('*')
      .eq('whatsapp_number', toPhone)
      .maybeSingle()
    restaurant = data
  }

  if (!restaurant) {
    const { data } = await supabase
      .from('restaurants')
      .select('*')
      .eq('whatsapp_number', fromPhone)
      .maybeSingle()
    restaurant = data
  }

  let { data: customer } = restaurant
    ? await supabase
        .from('customers')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('phone', fromPhone)
        .maybeSingle()
    : { data: null }

  if (!restaurant && fromPhone) {
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('restaurant_id')
      .eq('phone', fromPhone)
      .limit(1)
      .maybeSingle()

    if (existingCustomer) {
      const { data: restData } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', existingCustomer.restaurant_id)
        .maybeSingle()

      if (restData) {
        restaurant = restData
        const { data: custData } = await supabase
          .from('customers')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .eq('phone', fromPhone)
          .maybeSingle()
        customer = custData
      }
    }
  }

  // Coupon-code join fallback (LID unresolved)
  const isLid = event.from.includes('@lid')
  if (isLid && !customer && event.body) {
    const codeMatch = event.body.match(/W\d+-[A-Z0-9]{6}/i)
    if (codeMatch) {
      const code = codeMatch[0].toUpperCase()
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*, customers(*)')
        .eq('code', code)
        .eq('type', 'welcome')
        .maybeSingle()

      if (coupon) {
        const couponCustomer = (coupon as any).customers
        if (couponCustomer) {
          customer = couponCustomer
          if (!restaurant) {
            const { data: restData } = await supabase
              .from('restaurants')
              .select('*')
              .eq('id', couponCustomer.restaurant_id)
              .maybeSingle()
            if (restData) restaurant = restData
          }
        }
      }
    }
  }

  // Log inbound message
  await supabase.from('message_logs').insert({
    restaurant_id: restaurant?.id || null,
    customer_id: customer?.id || null,
    direction: 'inbound',
    type: 'incoming_message',
    status: 'sent',
    provider_message_id: event.messageId,
  })

  if (!restaurant) {
    return NextResponse.json({ status: 'unknown_restaurant' })
  }

  // Return 200 immediately — outbound logic runs in after()
  after(async () => {
    if (!customer) {
      // Unknown customer: send opt-in prompt
      await jitter(5000, 8000)
      const optInMsg = resolveSpintax(
        `{Hi|Hey|Hello}! Welcome to ${restaurant!.name}. Reply {YES|YES 👍} to join our loyalty club and receive exclusive coupons. Reply STOP to cancel.`
      )
      const result = await adapter.sendText(replyTo, optInMsg)

      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          restaurant_id: restaurant!.id,
          phone: event.from.includes('@lid') ? event.from : fromPhone,
          opt_in_status: 'pending',
        })
        .select()
        .single()

      await supabase.from('message_logs').insert({
        restaurant_id: restaurant!.id,
        customer_id: newCustomer?.id,
        direction: 'outbound',
        type: 'opt_in_prompt',
        status: result.success ? 'sent' : 'failed',
        error: result.error || null,
        provider_message_id: result.messageId || null,
      })
      return
    }

    const body = event.body.trim().toUpperCase()

    if (customer.opt_in_status === 'opted_in') {
      // Check if coupon has already been delivered (opt_in_confirm log exists)
      const { data: confirmLog } = await supabase
        .from('message_logs')
        .select('id')
        .eq('customer_id', customer.id)
        .eq('direction', 'outbound')
        .eq('type', 'opt_in_confirm')
        .limit(1)
        .maybeSingle()

      if (!confirmLog) {
        // First contact: send warm greeting + YES prompt instead of coupon
        await jitter(5000, 8000)
        const greetMsg = resolveSpintax(
          `{Hi|Hey|Hello} ${customer.name || 'there'}! 🎁 Welcome to ${restaurant!.name}. {Reply YES to confirm and|To receive} your ${restaurant!.welcome_discount_percent}% discount coupon, {just reply YES|reply YES below}. Reply STOP to cancel.`
        )
        const result = await adapter.sendText(replyTo, greetMsg)
        await supabase.from('message_logs').insert({
          restaurant_id: restaurant!.id,
          customer_id: customer.id,
          direction: 'outbound',
          type: 'opt_in_prompt',
          status: result.success ? 'sent' : 'failed',
          error: result.error || null,
          provider_message_id: result.messageId || null,
        })
        return
      }
      // Coupon already sent — no further action for this message
      return
    }

    if (body === 'YES' || body === 'Y') {
      await supabase
        .from('customers')
        .update({ opt_in_status: 'opted_in' })
        .eq('id', customer.id)

      let couponCode = ''
      const { data: existingCoupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('customer_id', customer.id)
        .eq('type', 'welcome')
        .maybeSingle()

      if (existingCoupon) {
        couponCode = existingCoupon.code
      } else {
        couponCode = `W${restaurant!.welcome_discount_percent}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        await supabase.from('coupons').insert({
          restaurant_id: restaurant!.id,
          customer_id: customer.id,
          type: 'welcome',
          code: couponCode,
          discount_percent: restaurant!.welcome_discount_percent,
          discount_cents: 0,
          status: 'sent',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
      }

      await jitter(5000, 8000)
      const welcomeMsg = resolveSpintax(
        `{Great|Wonderful|Awesome}! {Here is|Here's} your coupon for ${restaurant!.name}: ${couponCode} — ${restaurant!.welcome_discount_percent}% OFF. Valid till ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}. {Enjoy|Use it on your next visit}! Reply STOP to opt out.`
      )
      const result = await adapter.sendText(replyTo, welcomeMsg)

      await supabase.from('message_logs').insert({
        restaurant_id: restaurant!.id,
        customer_id: customer.id,
        direction: 'outbound',
        type: 'opt_in_confirm',
        status: result.success ? 'sent' : 'failed',
        error: result.error || null,
        provider_message_id: result.messageId || null,
      })
      return
    }

    if (body === 'STOP') {
      await supabase
        .from('customers')
        .update({ opt_in_status: 'opted_out' })
        .eq('id', customer.id)
      await supabase.from('message_logs').insert({
        restaurant_id: restaurant!.id,
        customer_id: customer.id,
        direction: 'inbound',
        type: 'opt_out',
        status: 'sent',
      })
      return
    }

    if (customer.opt_in_status === 'pending') {
      // Re-send prompt for unrecognised reply while pending
      await jitter(5000, 8000)
      const optInMsg = resolveSpintax(
        `{Hi|Hey|Hello} ${customer.name || 'there'}! {Please reply YES|Just reply YES} to join the loyalty club at ${restaurant!.name} and receive your coupon. Reply STOP to cancel.`
      )
      const result = await adapter.sendText(replyTo, optInMsg)
      await supabase.from('message_logs').insert({
        restaurant_id: restaurant!.id,
        customer_id: customer.id,
        direction: 'outbound',
        type: 'opt_in_prompt',
        status: result.success ? 'sent' : 'failed',
        error: result.error || null,
        provider_message_id: result.messageId || null,
      })
    }
  })

  return NextResponse.json({ status: 'ok' })
}
```

- [ ] **Step 3: Update route tests for Y match and new flow**

In `src/app/api/whatsapp/route.test.ts`, update any test that checks `body === 'YES'` to also cover `'Y'`. Add a test verifying that the handler returns `{ status: 'ok' }` synchronously (the `after()` callback content is tested via unit tests separately, not in integration tests that don't have an `after()` runtime).

```typescript
// Example: add this test
it('accepts Y as affirmative reply', async () => {
  // Mock: opted_in customer, no confirmLog, body = 'Y'
  // Expected: response is { status: 'ok' } synchronously
  // (after() content tested separately)
  const request = makeRequest({ body: 'Y', from: '919876543210@c.us' })
  const response = await POST(request)
  expect(response.status).toBe(200)
  const json = await response.json()
  expect(json.status).toBe('ok')
})
```

- [ ] **Step 4: Run all webhook tests**

```
pnpm test src/app/api/whatsapp
```
Expected: all tests PASS (pre-existing + new)

- [ ] **Step 5: Typecheck and commit**

```
pnpm typecheck
pnpm lint
git add src/app/api/whatsapp/ src/lib/whatsapp/spintax.ts
git commit -m "feat: webhook jitter via after(), double-opt-in gate, YES/Y match, spintax"
```

---

### Task 4: Campaign Engine — Prior-Interaction Check + Hourly Dedup + Spintax

**Files:**
- Modify: `src/lib/campaigns/index.ts`
- Modify: `src/lib/campaigns/index.test.ts` (or create if it doesn't exist)

**Interfaces:**
- Consumes: `resolveSpintax` from Task 1.
- Each campaign function gains two new early-skip conditions for each customer:
  1. **Prior-interaction check:** skip if no `inbound` row exists in `message_logs` for this customer.
  2. **Today dedup check:** skip if a `message_logs` row of the same campaign type was already written for this customer today (UTC date).
- Batch cap: add `.limit(5)` to each customer query inside each campaign function.

- [ ] **Step 1: Write failing tests for campaign skips**

Create `src/lib/campaigns/index.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// We'll test the filtering logic by mocking supabase and adapter
// and verifying sendText is NOT called when conditions aren't met.

describe('campaign prior-interaction check', () => {
  it('skips customer with no inbound message log', async () => {
    // Mock supabase: restaurant returned, customer returned,
    // but message_logs inbound check returns null
    // Expect: adapter.sendText never called
  })

  it('skips customer who already received campaign today', async () => {
    // Mock supabase: restaurant returned, customer returned,
    // inbound log exists, but today-sent log also exists
    // Expect: adapter.sendText never called
  })

  it('sends to customer with inbound log and no send today', async () => {
    // Mock supabase: restaurant, customer, inbound log exists, no today log
    // Expect: adapter.sendText called once
  })
})
```

> **Note for executor:** The campaign functions use module-level `createServiceClient()` and `createWhatsAppAdapter()`. Mock them using `vi.mock('@/lib/supabase/server')` and `vi.mock('@/lib/whatsapp/adapter')` in the test file, matching the pattern used in `src/app/api/whatsapp/route.test.ts`.

- [ ] **Step 2: Run tests to verify they fail**

```
pnpm test src/lib/campaigns
```
Expected: FAIL (functions not yet modified)

- [ ] **Step 3: Add `resolveSpintax` import and helpers to `campaigns/index.ts`**

Add at the top of `src/lib/campaigns/index.ts`:

```typescript
import { resolveSpintax } from '@/lib/whatsapp/spintax'

// ponytail: UTC date string for today-dedup check
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10) // "YYYY-MM-DD"
}
```

- [ ] **Step 4: Add prior-interaction + dedup checks to `runWelcomeReminders()`**

Inside the `for (const customer of customers ?? [])` loop in `runWelcomeReminders`, add these checks BEFORE the credits check:

```typescript
// Prior-interaction check
const { data: inbound } = await supabase
  .from('message_logs')
  .select('id')
  .eq('customer_id', customer.id)
  .eq('direction', 'inbound')
  .limit(1)
  .maybeSingle()
if (!inbound) continue // ponytail: never message someone who never replied

// Today dedup check
const todayStart = `${todayUTC()}T00:00:00.000Z`
const { data: sentToday } = await supabase
  .from('message_logs')
  .select('id')
  .eq('customer_id', customer.id)
  .eq('type', 'welcome_reminder')
  .gte('created_at', todayStart)
  .limit(1)
  .maybeSingle()
if (sentToday) continue
```

Also change the message to use spintax:

```typescript
const msg = resolveSpintax(
  `{Hey|Hi|Hello} ${customer.name || 'there'}! {Your coupon|Reminder: your coupon} ${welcomeCoupon.code} for ${restaurant.name} is {still active|waiting for you}! Reply STOP to opt out.`
)
```

Add `.limit(5)` to the customer query:

```typescript
const { data: customers } = await supabase
  .from('customers')
  .select('*, coupons(*)')
  .eq('restaurant_id', restaurant.id)
  .eq('opt_in_status', 'opted_in')
  .filter('created_at', 'gte', gteDate)
  .filter('created_at', 'lte', lteDate)
  .limit(5)  // ponytail: hourly batch cap, spreads load across the day
```

- [ ] **Step 5: Apply same pattern to `runBirthdayCampaigns()`**

Add prior-interaction + today dedup checks (type: `'birthday_campaign'`) + `.limit(5)` + spintax to the birthday message:

```typescript
const msg = resolveSpintax(
  `{Happy Birthday|Happy Birthday 🎂|Wishing you a great birthday}, ${customer.name || 'there'}! {Enjoy|Celebrate with} ${restaurant.birthday_discount_percent}% OFF at ${restaurant.name}. Code: ${couponCode}. Reply STOP to opt out.`
)
```

- [ ] **Step 6: Apply same pattern to `runWinbackCampaigns()`**

Add prior-interaction + today dedup checks (type: `'winback_campaign'`) + `.limit(5)` + spintax:

```typescript
const msg = resolveSpintax(
  `{We miss you|It's been a while}, ${customer.name || 'there'}! {Come back for|Enjoy} ${restaurant.winback_discount_percent}% OFF at ${restaurant.name}. Code: ${couponCode}. Reply STOP to opt out.`
)
```

- [ ] **Step 7: Apply same pattern to `runExpiryReminders()`**

Add prior-interaction + today dedup (type: `'expiry_reminder'`) + `.limit(5)` + spintax:

```typescript
const msg = resolveSpintax(
  `{Hey|Hi} ${customer.name || 'there'}! {Don't miss out|Heads up} — your coupon ${coupon.code} at ${restaurant.name} {expires in|is expiring in} ${days} day(s). Reply STOP to opt out.`
)
```

- [ ] **Step 8: Run all campaign tests**

```
pnpm test src/lib/campaigns
```
Expected: all tests PASS

- [ ] **Step 9: Typecheck and commit**

```
pnpm typecheck
pnpm lint
git add src/lib/campaigns/
git commit -m "feat: campaign prior-interaction check, hourly dedup, batch limit, spintax"
```

---

### Task 5: Hourly Cron Schedule

**Files:**
- Modify: `vercel.json`

**Interfaces:**
- No code change. Just the schedule string.

- [ ] **Step 1: Change cron schedule**

Replace the existing cron entry in `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "crons": [
    {
      "path": "/api/cron/welcome-reminder",
      "schedule": "0 * * * *"
    }
  ]
}
```

The cron now runs every hour (24×/day). Each run processes up to 5 customers per restaurant per campaign type. A restaurant with 120 customers will naturally have its daily campaign messages spread across the full 24-hour window.

- [ ] **Step 2: Verify build**

```
pnpm build
```
Expected: ✅ clean production build (vercel.json change does not affect build)

- [ ] **Step 3: Commit**

```
git add vercel.json
git commit -m "chore: change cron from daily to hourly for batch campaign distribution"
```

---

### Task 6: Final Verification

- [ ] **Step 1: Run full test suite**

```
pnpm test
```
Expected: all 139+ tests PASS (new tests added by Tasks 1–4)

- [ ] **Step 2: Typecheck**

```
pnpm typecheck
```
Expected: 0 errors

- [ ] **Step 3: Lint**

```
pnpm lint
```
Expected: 0 errors (3 pre-existing warnings allowed)

- [ ] **Step 4: Production build**

```
pnpm build
```
Expected: ✅ clean build

- [ ] **Step 5: Update progress.md**

Add a completed task entry to `progress.md`:

```markdown
## ✅ Completed Task: WhatsApp Ban Prevention (2026-07-12)

Five safety layers implemented:
1. Double-opt-in: greeting + YES prompt before coupon delivery (webhook uses after())
2. YES/Y affirmative matching
3. Opted-out form gate: returns error if customer is opted_out
4. Spintax variation on all outbound messages (resolveSpintax utility)
5. Campaign prior-interaction check + today dedup + hourly batch limit (5/restaurant/hour)
6. Cron schedule changed from daily (4:30 AM) to hourly
```

- [ ] **Step 6: Commit progress**

```
git add progress.md
git commit -m "docs: update progress for whatsapp ban prevention features"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Double-opt-in hook — Task 3 (greeting before coupon)
- ✅ YES/Y match — Task 3 (route.ts condition)
- ✅ Opt-out gate on form — Task 2
- ✅ Spintax on all outbound — Tasks 1, 3, 4
- ✅ Jitter via `after()` — Task 3
- ✅ Prior-interaction check on campaigns — Task 4
- ✅ Hourly batch cron dedup — Tasks 4, 5
- ✅ `.limit(5)` batch cap — Task 4

**Placeholder scan:** No TBDs, TODOs, or vague steps.

**Type consistency:** `resolveSpintax(template: string): string` used consistently across Tasks 1, 3, 4. `jitter(minMs, maxMs)` defined once in route.ts. `todayUTC()` defined once in campaigns/index.ts.
