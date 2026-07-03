# Slice 10: Onboarding Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the customer onboarding flow so form-originated customers are marked `opted_in` (not `pending`), the wa.me link uses a real pre-written message, and the webhook sends the welcome coupon immediately — no YES step required.

**Architecture:** Modify the form server action to set `opt_in_status = 'opted_in'`. Modify the webhook handler to detect opted_in customers with an unredeemed welcome coupon and send the coupon code immediately. The YES flow is preserved for direct WhatsApp messages (no form).

**Tech Stack:** Next.js 16 (App Router, Server Actions), Supabase, WhatsApp adapter.

**Required Skills (load before coding):**
- `server-actions` — form actions, revalidatePath
- `supabase-postgres-best-practices` — DB queries
- `openwa-skill` — WhatsApp adapter integration
- `playwright-best-practices` — E2E tests
- `karpathy-guidelines` — code quality

**Context7 MCP:** Use `context7_resolve-library-id` + `context7_query-docs` for latest docs on: Next.js Server Actions, Supabase, Playwright.

## Global Constraints

- Goodrest POS design system (applied in Slice 9).
- RLS respected. Form uses service client (public route). Webhook uses service client.
- No new tables, no new migrations.
- wa.me prefill message: `"Hi! I just signed up for your loyalty club."` (hardcoded; configurable in Slice 15 via `whatsapp_prefill_message` column).

---

### Task 1: Form Creates `opted_in` Customer + Prefilled wa.me Link

**Files:**
- Modify: `src/app/form/[slug]/actions.ts`
- Modify: `src/app/form/[slug]/IntakeForm.tsx`

**Interfaces:**
- Produces: `{ success: true, waUrl: string }` — waUrl uses prefilled message instead of "hello"

- [ ] **Step 1: Modify form action — change `opt_in_status` to `opted_in`**

In `src/app/form/[slug]/actions.ts`, change the customer insert from `'pending'` to `'opted_in'`:

```typescript
// Before (line ~48):
opt_in_status: 'pending',

// After:
opt_in_status: 'opted_in',
```

Also change the wa.me URL to use a real pre-written message:

```typescript
// Before (line ~63 and ~73):
const waUrl = `https://wa.me/${restaurant.whatsapp_number}?text=hello`

// After:
const prefilledMessage = encodeURIComponent('Hi! I just signed up for your loyalty club.')
const waUrl = `https://wa.me/${restaurant.whatsapp_number}?text=${prefilledMessage}`
```

Apply the same change to both waUrl constructions (the success path and the duplicate-customer path).

- [ ] **Step 2: Update IntakeForm success message**

In `src/app/form/[slug]/IntakeForm.tsx`, update the success state text to reflect the new flow:

```tsx
// In the waUrl success state, update the description text:
<p className="text-slate-400 text-sm mb-8 leading-relaxed">
  Tap the button below to open WhatsApp and claim your welcome discount code at <strong className="text-white">{restaurantName}</strong>.
</p>
```

(This is already correct — no change needed. The button text "Open WhatsApp" is fine.)

- [ ] **Step 3: Verify form flow**

```bash
pnpm dev
```

1. Navigate to `http://localhost:3000/form/spice-garden`
2. Fill form: name, +91XXXXXXXXXX, birthday, food preference
3. Click "Get WhatsApp Coupon"
4. Success state shows "Open WhatsApp" button
5. Inspect the `href` — should contain `?text=Hi%21%20I%20just%20signed...` (not `?text=hello`)

- [ ] **Step 4: Commit**

```bash
git add src/app/form/
git commit -m "fix: form creates opted_in customer with prefilled wa.me message"
```

---

### Task 2: Webhook Sends Coupon Immediately for Form-Originated Customers

**Files:**
- Modify: `src/app/api/whatsapp/route.ts`

**Interfaces:**
- Consumes: `customer.opt_in_status`, `customer.coupons` (welcome coupon), `message_logs` (for dedupe)
- Produces: Immediate coupon delivery message via WhatsApp adapter

**Logic:**
When the webhook receives a message from an existing customer who is `opted_in`:
1. Check if there's an `opt_in_confirm` outbound message log for this customer (meaning we already sent them the coupon via WhatsApp).
2. If NO `opt_in_confirm` log exists AND the customer has a welcome coupon → send the coupon code + log as `opt_in_confirm`.
3. If `opt_in_confirm` already exists → treat as normal conversation (no action for now).

This replaces the current behavior where opted_in customers who send non-YES/STOP messages get no response.

- [ ] **Step 1: Modify webhook existing-customer branch**

In `src/app/api/whatsapp/route.ts`, in the `else` block (existing customer), add a new condition BEFORE the existing YES/STOP/pending checks:

```typescript
// Existing customer: handle opt-in/out
const body = event.body.trim().toUpperCase()

// NEW: Form-originated customers (opted_in) — send coupon if not yet confirmed
if (customer.opt_in_status === 'opted_in') {
  // Check if we already sent the coupon via WhatsApp
  const { data: confirmLog } = await supabase
    .from('message_logs')
    .select('id')
    .eq('customer_id', customer.id)
    .eq('direction', 'outbound')
    .eq('type', 'opt_in_confirm')
    .limit(1)
    .maybeSingle()

  if (!confirmLog) {
    // Find the welcome coupon
    const { data: welcomeCoupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('type', 'welcome')
      .maybeSingle()

    if (welcomeCoupon) {
      const welcomeMessage = `Hey ${customer.name || 'there'}! Welcome to ${restaurant.name}. Your coupon: ${welcomeCoupon.code} for ₹${restaurant.welcome_discount_cents / 100} OFF. Valid till ${new Date(welcomeCoupon.expires_at).toLocaleDateString('en-IN')}. Reply STOP to opt out.`
      const result = await adapter.sendText(fromPhone, welcomeMessage)

      await supabase.from('message_logs').insert({
        restaurant_id: restaurant.id,
        customer_id: customer.id,
        direction: 'outbound',
        type: 'opt_in_confirm',
        status: result.success ? 'sent' : 'failed',
        error: result.error || null,
      })

      return NextResponse.json({ status: 'ok' })
    }
  }

  // Already confirmed — fall through to YES/STOP handling below
}

// EXISTING: YES handling...
if (body === 'YES') {
  // ... existing code unchanged
}
```

- [ ] **Step 2: Verify webhook flow**

Test the complete flow:
1. Create a customer via the form (opted_in + welcome coupon created)
2. Simulate a webhook POST from that customer's phone
3. Verify: webhook sends the coupon code message
4. Simulate another webhook POST from the same customer
5. Verify: webhook does NOT re-send the coupon (confirmLog exists)

- [ ] **Step 3: Run typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/api/whatsapp/route.ts
git commit -m "fix: webhook sends coupon immediately for form-originated opted_in customers"
```

---

### Task 3: E2E Test — Onboarding Flow

**Files:**
- Create: `tests/slice-10.spec.ts`

- [ ] **Step 1: Write E2E test**

Create `tests/slice-10.spec.ts`:

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

test.describe('Slice 10: Onboarding Fix', () => {
  test('Form creates opted_in customer with prefilled wa.me link', async ({ page }) => {
    const testPhone = `+91${Date.now().toString().slice(-10)}`
    const testName = `Test User ${Date.now()}`

    await page.goto('http://localhost:3000/form/spice-garden')

    // Fill the form
    await page.getByLabel('Name').fill(testName)
    await page.getByLabel('WhatsApp Number').fill(testPhone)
    await page.getByRole('button', { name: /get whatsapp coupon/i }).click()

    // Wait for success state
    await expect(page.getByText("You're Registered!")).toBeVisible()

    // Verify the wa.me link has a prefilled message (not "hello")
    const waLink = page.getByRole('link', { name: /open whatsapp/i })
    const href = await waLink.getAttribute('href')
    expect(href).toContain('wa.me/')
    expect(href).not.toContain('text=hello')
    expect(href).toContain('text=')

    // Verify customer is opted_in in database
    const phone = testPhone.replace('+', '')
    const { data: customer } = await supabase
      .from('customers')
      .select('opt_in_status')
      .eq('phone', phone)
      .eq('restaurant_id', (await supabase.from('restaurants').select('id').eq('slug', 'spice-garden').single()).data?.id)
      .single()

    expect(customer?.opt_in_status).toBe('opted_in')

    // Cleanup
    if (customer) {
      await supabase.from('customers').delete().eq('phone', phone)
    }
  })
})
```

- [ ] **Step 2: Run E2E test**

```bash
pnpm test:e2e tests/slice-10.spec.ts
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/slice-10.spec.ts
git commit -m "test: add E2E test for onboarding flow"
```

---

## Verification Plan

### Automated Tests
```bash
pnpm typecheck && pnpm lint && pnpm test:e2e tests/slice-10.spec.ts
```

### Manual Verification
1. Navigate to `/form/spice-garden`, fill form, submit
2. Success state shows "Open WhatsApp" button with prefilled message URL (not `?text=hello`)
3. Database: customer has `opt_in_status = 'opted_in'` (not `pending`)
4. Database: welcome coupon exists for the customer
5. Webhook: when an opted_in customer sends a message, bot replies with coupon code immediately (no "Reply YES" prompt)
6. Direct WhatsApp flow (no form): customer messages → gets opt-in prompt → replies YES → gets coupon (unchanged)

### Commit Summary
1. `fix: form creates opted_in customer with prefilled wa.me message`
2. `fix: webhook sends coupon immediately for form-originated opted_in customers`
3. `test: add E2E test for onboarding flow`
