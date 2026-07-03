# E2E Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Playwright E2E test suite that exercises real user flows against a running Next.js dev server + dev Supabase instance.

**Architecture:** Storage-state pattern — a setup spec auto-creates test users via Supabase Admin API, logs in via browser UI, saves auth sessions to JSON files. All authenticated specs reuse those sessions. Each spec creates its own test data via direct Supabase API calls (service role key) in `beforeAll`, cleans up in `afterAll`.

**Tech Stack:** Playwright 1.61, @supabase/supabase-js (service role), dotenv, Next.js 16 dev server, Supabase (dev instance)

## Global Constraints

- Test dir: `./tests/` (already configured in `playwright.config.ts`)
- Dev server auto-starts via `webServer` config (`pnpm dev`, waits for `http://localhost:3000/login`)
- Env vars loaded from `.env.local` via `dotenv` in `playwright.config.ts`
- Supabase URL: `process.env.NEXT_PUBLIC_SUPABASE_URL`
- Supabase service role key: `process.env.SUPABASE_SERVICE_ROLE_KEY`
- Supabase anon key: `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Test user email: `e2e-test@restoloop.com` (auto-created, password: `E2E-Test-Pass-123!`)
- Admin user email: `admin@restoloop.com` (auto-created, password: `E2E-Admin-Pass-123!`)
- App's admin gate: `user.email !== 'admin@restoloop.com'` (hardcoded in `src/app/admin/[id]/page.tsx:23` and `src/app/admin/page.tsx:13`)
- All test data uses prefix `E2E-` in restaurant names for easy identification
- Cleanup order: coupons -> customers -> message_logs -> restaurants (FK constraints, no ON DELETE CASCADE)
- DB schema (from `supabase/migrations/001_initial_schema.sql`):
  - `restaurants`: id, owner_id, name, slug, whatsapp_number, welcome_discount_cents, birthday_discount_cents, winback_discount_cents, credits, plan, created_at, updated_at + campaign columns (migration 005)
  - `customers`: id, restaurant_id, phone, name, opt_in_status, birthday_month, birthday_day, food_preference, last_visit_at
  - `coupons`: id, restaurant_id, customer_id, type, code, discount_cents, status, expires_at, redeemed_at, enabled (migration 004)
  - `message_logs`: id, restaurant_id, customer_id, direction, type, status, coupon_id
- No logout button exists in the app — auth spec tests signup + login only
- `pnpm test:e2e` runs the suite (already in package.json)
- Existing Vitest unit tests (`pnpm test`) must still pass — do not touch `*.test.ts` files
- The coupons page delete button only shows when `status === 'sent' && enabled !== false` (see `src/app/dashboard/coupons/page.tsx:197`)

---

## File Structure

```
tests/
├── helpers/
│   └── supabase.ts          # Service-role Supabase client + test data CRUD helpers
├── .auth/                    # Gitignored — stores browser auth sessions
│   ├── user.json             # Saved by auth.setup.ts
│   └── admin.json            # Saved by auth.setup.ts
├── auth.setup.ts             # Auto-creates users, logs in, saves storageState
├── auth.spec.ts              # Signup + login flows (no pre-existing auth)
├── restaurant.spec.ts        # Create restaurant via UI (uses user auth)
├── coupons.spec.ts           # Coupon create/disable/delete (uses user auth)
├── validate.spec.ts          # Coupon validation (uses user auth)
├── admin.spec.ts             # Admin add credits (uses admin auth)
└── intake-form.spec.ts       # Public form submission (no auth)
```

---

### Task 1: Test Helpers + Playwright Config + Gitignore

**Files:**
- Create: `tests/helpers/supabase.ts`
- Modify: `playwright.config.ts` (replace entire file)
- Create: `tests/.gitignore`

**Interfaces:**
- Produces: `createTestSupabase()` -> returns service-role Supabase client
- Produces: `createTestRestaurant(name)` -> inserts restaurant, returns `{ id, slug, owner_id }`
- Produces: `createTestCustomer(restaurantId, phone)` -> inserts customer, returns `{ id, phone }`
- Produces: `createTestCoupon(restaurantId, customerId, code, opts?)` -> inserts coupon, returns `{ id, code }`
- Produces: `cleanupRestaurant(restaurantId)` -> deletes coupons, customers, message_logs, restaurant by id
- Produces: `getCouponByCode(code)` -> queries coupon by code, returns coupon row or null
- Produces: `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`, `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD` constants

- [ ] **Step 1: Create `tests/helpers/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'

export const TEST_USER_EMAIL = 'e2e-test@restoloop.com'
export const TEST_USER_PASSWORD = 'E2E-Test-Pass-123!'
export const TEST_ADMIN_EMAIL = 'admin@restoloop.com'
export const TEST_ADMIN_PASSWORD = 'E2E-Admin-Pass-123!'

export function createTestSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function createTestRestaurant(name: string) {
  const supabase = createTestSupabase()
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const testUser = users.find(u => u.email === TEST_USER_EMAIL)
  if (!testUser) throw new Error('Test user not found. Run auth.setup.ts first.')

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const { data, error } = await supabase.from('restaurants').insert({
    owner_id: testUser.id,
    name,
    slug,
    whatsapp_number: '919999900000',
    welcome_discount_cents: 1000,
    birthday_discount_cents: 500,
    winback_discount_cents: 300,
    credits: 1000,
    plan: 'free',
  }).select().single()
  if (error) throw new Error(`Failed to create test restaurant: ${error.message}`)
  return data as { id: string; slug: string; owner_id: string }
}

export async function createTestCustomer(restaurantId: string, phone: string) {
  const supabase = createTestSupabase()
  const { data, error } = await supabase.from('customers').insert({
    restaurant_id: restaurantId,
    phone,
    name: 'E2E Test Customer',
    opt_in_status: 'opted_in',
  }).select().single()
  if (error) throw new Error(`Failed to create test customer: ${error.message}`)
  return data as { id: string; phone: string }
}

export async function createTestCoupon(
  restaurantId: string,
  customerId: string,
  code: string,
  opts?: { status?: string; enabled?: boolean; discountCents?: number }
) {
  const supabase = createTestSupabase()
  const { data, error } = await supabase.from('coupons').insert({
    restaurant_id: restaurantId,
    customer_id: customerId,
    type: 'manual',
    code,
    discount_cents: opts?.discountCents ?? 500,
    status: opts?.status ?? 'sent',
    enabled: opts?.enabled ?? true,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }).select().single()
  if (error) throw new Error(`Failed to create test coupon: ${error.message}`)
  return data as { id: string; code: string }
}

export async function cleanupRestaurant(restaurantId: string) {
  const supabase = createTestSupabase()
  await supabase.from('coupons').delete().eq('restaurant_id', restaurantId)
  await supabase.from('message_logs').delete().eq('restaurant_id', restaurantId)
  await supabase.from('customers').delete().eq('restaurant_id', restaurantId)
  await supabase.from('restaurants').delete().eq('id', restaurantId)
}

export async function getCouponByCode(code: string) {
  const supabase = createTestSupabase()
  const { data } = await supabase.from('coupons').select('*').eq('code', code).maybeSingle()
  return data
}
```

- [ ] **Step 2: Create `tests/.gitignore`**

```
.auth/
```

- [ ] **Step 3: Replace `playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test'
import { config } from 'dotenv'

config({ path: '.env.local' })

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000/login',
    reuseExistingServer: true,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
})
```

- [ ] **Step 4: Verify config parses**

Run: `npx playwright test --list`
Expected: Lists 0 tests but does NOT error. If it errors on config parse, fix the config.

- [ ] **Step 5: Commit**

```bash
git add tests/helpers/supabase.ts tests/.gitignore playwright.config.ts
git commit -m "test: e2e helpers, config, gitignore for auth state"
```

---

### Task 2: Auth Setup — Auto-Create Users + Login + Save StorageState

**Files:**
- Create: `tests/auth.setup.ts`

**Interfaces:**
- Consumes: `createTestSupabase()`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`, `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD` from `tests/helpers/supabase.ts`
- Produces: `tests/.auth/user.json` (browser storage state for test user)
- Produces: `tests/.auth/admin.json` (browser storage state for admin user)

**Context:**
- Login page (`src/app/login/page.tsx`): `#email` (type=email), `#password` (type=password, minLength=8), `button[type="submit"]` text "Log In", on success `router.push('/dashboard')`
- Signup page (`src/app/signup/page.tsx`): same structure, button text "Sign Up", on success redirect to `/login`
- Supabase Auth signUp may require email confirmation. Auto-create users via Admin API with `email_confirm: true` to bypass.
- Admin gate is email-based: `user.email !== 'admin@restoloop.com'` in `src/app/admin/page.tsx:13`

- [ ] **Step 1: Create `tests/auth.setup.ts`**

```typescript
import { test as setup, expect } from '@playwright/test'
import { createTestSupabase, TEST_USER_EMAIL, TEST_USER_PASSWORD, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from './helpers/supabase'

async function ensureUser(email: string, password: string) {
  const supabase = createTestSupabase()
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const existing = users.find(u => u.email === email)

  if (existing) {
    await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    })
    return
  }

  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw new Error(`Failed to create user ${email}: ${error.message}`)
}

setup('create test users + login as test user', async ({ page }) => {
  await ensureUser(TEST_USER_EMAIL, TEST_USER_PASSWORD)
  await ensureUser(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)

  await page.goto('/login')
  await page.fill('#email', TEST_USER_EMAIL)
  await page.fill('#password', TEST_USER_PASSWORD)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/dashboard/)
  await page.context().storageState({ path: 'tests/.auth/user.json' })
})

setup('login as admin user', async ({ page }) => {
  await page.goto('/login')
  await page.fill('#email', TEST_ADMIN_EMAIL)
  await page.fill('#password', TEST_ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/dashboard/)
  await page.context().storageState({ path: 'tests/.auth/admin.json' })
})
```

- [ ] **Step 2: Run the setup**

Run: `npx playwright test --project=setup`
Expected: 2 tests pass. Files `tests/.auth/user.json` and `tests/.auth/admin.json` are created.
If login fails with "Email not confirmed", verify `email_confirm: true` was set — check Supabase dashboard -> Authentication -> Users.

- [ ] **Step 3: Commit**

```bash
git add tests/auth.setup.ts
git commit -m "test: e2e auth setup — auto-create users, save storageState"
```

---

### Task 3: auth.spec.ts — Signup + Login

**Files:**
- Create: `tests/auth.spec.ts`

**Interfaces:**
- Consumes: storageState from setup (overridden to `undefined` — starts fresh)
- Produces: nothing (signup test uses throwaway email, cleaned up via Admin API)

**Context:**
- Signup page (`/signup`): `#email`, `#password` (minLength 8), submit button text "Sign Up", on success -> redirect to `/login`
- Login page (`/login`): `#email`, `#password`, submit button text "Log In", on success -> redirect to `/dashboard`
- No logout button exists anywhere in the app
- Signup creates a real Supabase Auth user — use unique email per run to avoid "user already exists". Clean up via Admin API in `afterAll`.
- Error box on both pages: `div.bg-red-50` with error text

- [ ] **Step 1: Create `tests/auth.spec.ts`**

```typescript
import { test, expect } from '@playwright/test'
import { createTestSupabase } from './helpers/supabase'

// Auth spec starts with no stored session
test.use({ storageState: undefined })

const SIGNUP_EMAIL = `e2e-signup-${Date.now()}@restoloop.com`
const SIGNUP_PASSWORD = 'E2E-Signup-Pass-123!'

test.describe('Auth flows', () => {
  test.afterAll(async () => {
    const supabase = createTestSupabase()
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const toDelete = users.filter(u => u.email?.startsWith('e2e-signup-'))
    for (const u of toDelete) {
      await supabase.auth.admin.deleteUser(u.id)
    }
  })

  test('signup creates account and redirects to /login', async ({ page }) => {
    await page.goto('/signup')
    await page.fill('#email', SIGNUP_EMAIL)
    await page.fill('#password', SIGNUP_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login with valid credentials redirects to /dashboard', async ({ page }) => {
    // Confirm the signup email first via Admin API
    const supabase = createTestSupabase()
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const user = users.find(u => u.email === SIGNUP_EMAIL)
    if (user) {
      await supabase.auth.admin.updateUserById(user.id, { email_confirm: true })
    }

    await page.goto('/login')
    await page.fill('#email', SIGNUP_EMAIL)
    await page.fill('#password', SIGNUP_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', 'e2e-test@restoloop.com')
    await page.fill('#password', 'wrong-password-xxx')
    await page.click('button[type="submit"]')
    await expect(page.locator('.bg-red-50')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })
})
```

- [ ] **Step 2: Run the spec**

Run: `npx playwright test tests/auth.spec.ts`
Expected: 3 tests pass. Signup redirects to `/login`, login redirects to `/dashboard`, wrong password shows error.

- [ ] **Step 3: Commit**

```bash
git add tests/auth.spec.ts
git commit -m "test: e2e auth spec — signup, login, error cases"
```

---

### Task 4: restaurant.spec.ts — Create Restaurant via UI

**Files:**
- Create: `tests/restaurant.spec.ts`

**Interfaces:**
- Consumes: `tests/.auth/user.json` storageState (default from project config)
- Consumes: `createTestSupabase()`, `cleanupRestaurant()` from `tests/helpers/supabase.ts`
- Produces: nothing (creates restaurant via UI, cleans up via API)

**Context:**
- Create restaurant page (`/dashboard/create`): form with `input[name="name"]`, `input[name="whatsappNumber"]` (placeholder `919876543210`), `input[name="welcomeDiscount"]` (number, min 1), `input[name="birthdayDiscount"]` (number), `input[name="winbackDiscount"]` (number), submit button text "Create Restaurant"
- Form uses Server Action `createRestaurant` in `src/app/dashboard/create/actions.ts`
- On success: redirect to `/dashboard`
- Slug auto-generated from name via `slugify()` — `name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')`
- Dashboard layout (`src/app/dashboard/layout.tsx`): `data-testid="dashboard-sidebar"` shows restaurant name in sidebar
- Dashboard page (`src/app/dashboard/page.tsx`): `data-testid="restaurant-name"` shows restaurant name as heading
- If user has no restaurant, `/dashboard` redirects to `/dashboard/create`
- WhatsApp number must match `/^91\d{10}$/` (Zod validation in `src/app/dashboard/create/actions.ts:10`)

- [ ] **Step 1: Create `tests/restaurant.spec.ts`**

```typescript
import { test, expect } from '@playwright/test'
import { createTestSupabase, cleanupRestaurant } from './helpers/supabase'

test.describe('Create restaurant flow', () => {
  let createdRestaurantId: string | null = null

  test.afterAll(async () => {
    if (createdRestaurantId) {
      await cleanupRestaurant(createdRestaurantId)
    }
  })

  test('owner creates a restaurant and lands on dashboard', async ({ page }) => {
    await page.goto('/dashboard/create')

    await expect(page.getByRole('heading', { name: 'Create Your Restaurant' })).toBeVisible()

    const restaurantName = `E2E-Restaurant-${Date.now()}`

    await page.fill('input[name="name"]', restaurantName)
    await page.fill('input[name="whatsappNumber"]', '919999900000')
    await page.fill('input[name="welcomeDiscount"]', '10')
    await page.fill('input[name="birthdayDiscount"]', '5')
    await page.fill('input[name="winbackDiscount"]', '3')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/dashboard$/)

    await expect(page.getByTestId('restaurant-name')).toHaveText(restaurantName)
    await expect(page.getByTestId('dashboard-sidebar')).toContainText(restaurantName)

    const supabase = createTestSupabase()
    const { data } = await supabase
      .from('restaurants')
      .select('id')
      .eq('name', restaurantName)
      .single()
    createdRestaurantId = data?.id ?? null
    expect(createdRestaurantId).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run the spec**

Run: `npx playwright test tests/restaurant.spec.ts`
Expected: 1 test passes. Restaurant created via UI, visible on dashboard, cleaned up via API.

- [ ] **Step 3: Commit**

```bash
git add tests/restaurant.spec.ts
git commit -m "test: e2e restaurant create spec"
```

---

### Task 5: coupons.spec.ts — Coupon Create / Disable / Delete

**Files:**
- Create: `tests/coupons.spec.ts`

**Interfaces:**
- Consumes: `tests/.auth/user.json` storageState
- Consumes: `createTestRestaurant()`, `createTestCustomer()`, `cleanupRestaurant()` from `tests/helpers/supabase.ts`
- Produces: nothing (creates test restaurant+customer via API, tests coupon CRUD via UI, cleans up)

**Context:**
- Coupons page (`/dashboard/coupons`): `data-testid="coupons-heading"` heading, `data-testid="coupons-table"` table
- Create coupon form: `input[name="customer_id"]` (text, placeholder "Paste customer UUID"), `input[name="discount_cents"]` (number, min 1, placeholder "50"), submit button text "Create Coupon"
- Coupon code auto-generated by `generateCode()` in `src/app/dashboard/coupons/actions.ts:7` — 8 chars from `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`
- Each coupon row: `data-testid="disable-coupon-{code}"` and `data-testid="delete-coupon-{code}"` buttons — only visible when `status === 'sent' && enabled !== false`
- Disabled coupons show "Disabled" text instead of action buttons
- Filter chips: `data-testid="filter-{type}"` for all/welcome/birthday/winback/manual
- Coupons page requires user to have a restaurant (redirects to `/dashboard/create` if none — `src/app/dashboard/coupons/actions.ts:27`)
- **Important UI behavior:** After disabling a coupon (enabled=false), neither Disable nor Delete buttons show. To test Delete, create a SECOND coupon that remains enabled.

- [ ] **Step 1: Create `tests/coupons.spec.ts`**

```typescript
import { test, expect } from '@playwright/test'
import { createTestRestaurant, createTestCustomer, cleanupRestaurant } from './helpers/supabase'

test.describe('Coupon CRUD flow', () => {
  let restaurantId: string
  let customerId: string

  test.beforeAll(async () => {
    const restaurant = await createTestRestaurant(`E2E-Coupons-${Date.now()}`)
    restaurantId = restaurant.id
    const customer = await createTestCustomer(restaurantId, '919999900001')
    customerId = customer.id
  })

  test.afterAll(async () => {
    await cleanupRestaurant(restaurantId)
  })

  test('create, disable, and delete a coupon', async ({ page }) => {
    await page.goto('/dashboard/coupons')

    await expect(page.getByTestId('coupons-heading')).toBeVisible()

    // Create a coupon
    await page.fill('input[name="customer_id"]', customerId)
    await page.fill('input[name="discount_cents"]', '50')
    await page.click('button[type="submit"]')

    // Wait for the coupon to appear in the table
    const couponsTable = page.getByTestId('coupons-table')
    await expect(couponsTable).toBeVisible()

    // Get the coupon code from the first row
    const firstRow = couponsTable.locator('tbody tr').first()
    const codeCell = firstRow.locator('td').first()
    const couponCode = await codeCell.textContent()
    expect(couponCode).toBeTruthy()

    // Verify the disable button exists for this coupon
    const disableBtn = page.getByTestId(`disable-coupon-${couponCode}`)
    await expect(disableBtn).toBeVisible()

    // Disable the coupon
    await disableBtn.click()

    // After disabling, the row should show "Disabled" text
    await expect(firstRow).toContainText('Disabled')

    // Create another coupon for the delete test
    // (delete button only shows when status === 'sent' && enabled !== false)
    await page.fill('input[name="customer_id"]', customerId)
    await page.fill('input[name="discount_cents"]', '100')
    await page.click('button[type="submit"]')

    // Wait for table to refresh
    await page.waitForTimeout(1000)
    const rows = couponsTable.locator('tbody tr')
    const rowCount = await rows.count()

    // Find a row with a delete button (the newly created, still-enabled coupon)
    let deleted = false
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i)
      const code = await row.locator('td').first().textContent()
      const deleteBtn = page.getByTestId(`delete-coupon-${code}`)
      if (await deleteBtn.isVisible().catch(() => false)) {
        await deleteBtn.click()
        await expect(page.getByTestId(`delete-coupon-${code}`)).toHaveCount(0)
        deleted = true
        break
      }
    }
    expect(deleted).toBe(true)
  })
})
```

- [ ] **Step 2: Run the spec**

Run: `npx playwright test tests/coupons.spec.ts`
Expected: 1 test passes. Coupon created, disabled (shows "Disabled"), second coupon created and deleted.

- [ ] **Step 3: Commit**

```bash
git add tests/coupons.spec.ts
git commit -m "test: e2e coupons spec — create, disable, delete"
```

---

### Task 6: validate.spec.ts — Coupon Validation

**Files:**
- Create: `tests/validate.spec.ts`

**Interfaces:**
- Consumes: `tests/.auth/user.json` storageState
- Consumes: `createTestRestaurant()`, `createTestCustomer()`, `createTestCoupon()`, `cleanupRestaurant()`, `getCouponByCode()` from `tests/helpers/supabase.ts`
- Produces: nothing (creates test data via API, validates via UI, cleans up)

**Context:**
- Validate page (`/dashboard/validate`): heading "Validate Coupon", `input#coupon-code` (name="code"), submit button text "Validate & Redeem"
- On success: green box with "Coupon Redeemed!" text, shows code, customer name, discount
- On error: red box with error message text
- Validate action (`src/app/dashboard/validate/actions.ts`) checks:
  - User logged in (redirect to `/login`)
  - User has restaurant (redirect to `/dashboard/create`)
  - Coupon code trimmed + uppercased
  - Coupon must exist (error: "Coupon not found")
  - Coupon must belong to user's restaurant (error: "Wrong restaurant")
  - Coupon must not be already redeemed (error: "Already redeemed")
  - Coupon must not be expired (error: "Expired")
  - On success: marks `status: 'redeemed'`, sets `redeemed_at`, updates `customer.last_visit_at`
- Validate page has a back link to `/dashboard`

- [ ] **Step 1: Create `tests/validate.spec.ts`**

```typescript
import { test, expect } from '@playwright/test'
import {
  createTestRestaurant,
  createTestCustomer,
  createTestCoupon,
  cleanupRestaurant,
  getCouponByCode,
} from './helpers/supabase'

test.describe('Coupon validation flow', () => {
  let restaurantId: string
  let customerId: string
  const validCode = `VALID${Date.now().toString(36).toUpperCase()}`.slice(0, 12)
  const redeemedCode = `REDEM${Date.now().toString(36).toUpperCase()}`.slice(0, 12)
  const notFoundCode = `NOPE${Date.now().toString(36).toUpperCase()}`.slice(0, 12)

  test.beforeAll(async () => {
    const restaurant = await createTestRestaurant(`E2E-Validate-${Date.now()}`)
    restaurantId = restaurant.id
    const customer = await createTestCustomer(restaurantId, '919999900002')
    customerId = customer.id

    await createTestCoupon(restaurantId, customerId, validCode, { status: 'sent' })
    await createTestCoupon(restaurantId, customerId, redeemedCode, { status: 'redeemed' })
  })

  test.afterAll(async () => {
    await cleanupRestaurant(restaurantId)
  })

  test('valid coupon is redeemed successfully', async ({ page }) => {
    await page.goto('/dashboard/validate')

    await page.fill('#coupon-code', validCode)
    await page.click('button[type="submit"]')

    // Success box appears
    await expect(page.getByText('Coupon Redeemed!')).toBeVisible()
    await expect(page.getByText(validCode, { exact: false })).toBeVisible()

    // Verify DB: coupon status changed to 'redeemed'
    const coupon = await getCouponByCode(validCode)
    expect(coupon?.status).toBe('redeemed')
    expect(coupon?.redeemed_at).not.toBeNull()
  })

  test('already redeemed coupon shows error', async ({ page }) => {
    await page.goto('/dashboard/validate')

    await page.fill('#coupon-code', redeemedCode)
    await page.click('button[type="submit"]')

    await expect(page.getByText('Already redeemed')).toBeVisible()
  })

  test('nonexistent coupon code shows error', async ({ page }) => {
    await page.goto('/dashboard/validate')

    await page.fill('#coupon-code', notFoundCode)
    await page.click('button[type="submit"]')

    await expect(page.getByText('Coupon not found')).toBeVisible()
  })
})
```

- [ ] **Step 2: Run the spec**

Run: `npx playwright test tests/validate.spec.ts`
Expected: 3 tests pass. Valid coupon redeemed (DB verified), already-redeemed shows error, nonexistent code shows error.

- [ ] **Step 3: Commit**

```bash
git add tests/validate.spec.ts
git commit -m "test: e2e validate spec — redeem, already-redeemed, not-found"
```

---

### Task 7: admin.spec.ts — Admin Add Credits

**Files:**
- Create: `tests/admin.spec.ts`

**Interfaces:**
- Consumes: `tests/.auth/admin.json` storageState (overrides project default)
- Consumes: `createTestRestaurant()`, `cleanupRestaurant()` from `tests/helpers/supabase.ts`
- Produces: nothing (creates test restaurant via API, adds credits via UI, cleans up)

**Context:**
- Admin page (`/admin`): lists all restaurants in a table, each row has `data-testid="restaurant-row-{slug}"` and `data-testid="manage-btn-{slug}"` link to `/admin/{id}`
- Admin detail page (`/admin/[id]`): `data-testid="admin-restaurant-name"` heading, `data-testid="admin-credits-display"` showing credits number, three forms with `data-testid="add-100-btn"`, `data-testid="add-500-btn"`, `data-testid="add-1000-btn"`
- After adding credits: redirect to `/admin/{id}?success=true&added={amount}`, shows `data-testid="success-alert"` banner with text "Successfully added {amount} credits to {name}!"
- Admin action (`src/app/admin/[id]/actions.ts`): checks `user.email !== 'admin@restoloop.com'`, throws "Unauthorized" if not admin
- Admin page redirect: non-admin users redirected to `/dashboard` (`src/app/admin/page.tsx:13`)

- [ ] **Step 1: Create `tests/admin.spec.ts`**

```typescript
import { test, expect } from '@playwright/test'
import { createTestRestaurant, cleanupRestaurant, createTestSupabase } from './helpers/supabase'

// Admin spec uses admin auth state, not the default user state
test.use({ storageState: 'tests/.auth/admin.json' })

test.describe('Admin add credits flow', () => {
  let restaurantId: string
  let restaurantSlug: string

  test.beforeAll(async () => {
    const restaurant = await createTestRestaurant(`E2E-Admin-${Date.now()}`)
    restaurantId = restaurant.id
    restaurantSlug = restaurant.slug
  })

  test.afterAll(async () => {
    await cleanupRestaurant(restaurantId)
  })

  test('admin adds 100 credits to a restaurant', async ({ page }) => {
    await page.goto('/admin')

    // Verify restaurant appears in the list
    const row = page.getByTestId(`restaurant-row-${restaurantSlug}`)
    await expect(row).toBeVisible()

    // Click Manage button
    await page.getByTestId(`manage-btn-${restaurantSlug}`).click()
    await expect(page).toHaveURL(new RegExp(`/admin/${restaurantId}`))

    // Note current credits
    const creditsDisplay = page.getByTestId('admin-credits-display')
    const initialCredits = parseInt(await creditsDisplay.textContent() || '0', 10)

    // Click +100
    await page.getByTestId('add-100-btn').click()

    // Should redirect with success params
    await expect(page).toHaveURL(new RegExp(`/admin/${restaurantId}\\?success=true&added=100`))

    // Success banner appears
    await expect(page.getByTestId('success-alert')).toBeVisible()
    await expect(page.getByTestId('success-alert')).toContainText('Successfully added 100 credits')

    // Credits increased by 100
    const newCredits = parseInt(await page.getByTestId('admin-credits-display').textContent() || '0', 10)
    expect(newCredits).toBe(initialCredits + 100)
  })
})
```

- [ ] **Step 2: Run the spec**

Run: `npx playwright test tests/admin.spec.ts`
Expected: 1 test passes. Admin sees restaurant, clicks Manage, adds 100 credits, sees success banner, credits increased by 100.

- [ ] **Step 3: Commit**

```bash
git add tests/admin.spec.ts
git commit -m "test: e2e admin spec — add credits"
```

---

### Task 8: intake-form.spec.ts — Public Form Submission

**Files:**
- Create: `tests/intake-form.spec.ts`

**Interfaces:**
- Consumes: `createTestRestaurant()`, `cleanupRestaurant()`, `createTestSupabase()` from `tests/helpers/supabase.ts`
- Produces: nothing (creates test restaurant via API, submits form via UI, cleans up)
- Does NOT use storageState (public page, no auth needed)

**Context:**
- Intake form page (`/form/[slug]`): server component fetches restaurant by slug, renders `IntakeForm` client component
- If restaurant not found: 404 (notFound())
- Form fields: `input#name` (name="name"), `input#phone` (name="phone", pattern `^\+91\d{10}$`, placeholder `+919876543210`), `select#birthdayMonth` (name="birthdayMonth"), `select#birthdayDay` (name="birthdayDay"), `select#foodPreference` (name="foodPreference")
- Submit button text: "Get WhatsApp Coupon"
- Phone validation: client-side regex `/^\+91\d{10}$/` — error "WhatsApp number must start with +91 followed by 10 digits."
- On success: shows "You're Registered!" heading with WhatsApp link button "Open WhatsApp"
- The submit action (`src/app/form/[slug]/actions.ts`) creates a customer (opt_in_status: 'opted_in') and a welcome coupon, returns `{ success: true, waUrl }`
- If customer already exists (unique constraint on restaurant_id+phone): returns success with waUrl (no duplicate)
- Phone is stored without the `+` prefix (`.replace('+', '')`)
- Welcome coupon code format: `W{welcome_discount_cents/100}-{random6}`

- [ ] **Step 1: Create `tests/intake-form.spec.ts`**

```typescript
import { test, expect } from '@playwright/test'
import { createTestRestaurant, cleanupRestaurant, createTestSupabase } from './helpers/supabase'

// Public form — no auth needed
test.use({ storageState: undefined })

test.describe('Public intake form flow', () => {
  let restaurantId: string
  let restaurantSlug: string

  test.beforeAll(async () => {
    const restaurant = await createTestRestaurant(`E2E-Intake-${Date.now()}`)
    restaurantId = restaurant.id
    restaurantSlug = restaurant.slug
  })

  test.afterAll(async () => {
    await cleanupRestaurant(restaurantId)
  })

  test('customer submits intake form and sees success', async ({ page }) => {
    await page.goto(`/form/${restaurantSlug}`)

    // Verify we're on the form page
    await expect(page.getByRole('heading', { name: 'Join the Club' })).toBeVisible()

    // Fill the form
    await page.fill('#name', 'E2E Test Customer')
    await page.fill('#phone', '+919999900099')
    await page.selectOption('#birthdayMonth', '6')
    await page.selectOption('#birthdayDay', '15')
    await page.selectOption('#foodPreference', 'Veg')

    // Submit
    await page.click('button[type="submit"]')

    // Success screen
    await expect(page.getByRole('heading', { name: 'You\'re Registered!' })).toBeVisible()
    await expect(page.getByText('Open WhatsApp')).toBeVisible()

    // Verify customer was created in DB
    const supabase = createTestSupabase()
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('phone', '919999900099')
      .maybeSingle()

    expect(customer).not.toBeNull()
    expect(customer?.name).toBe('E2E Test Customer')
    expect(customer?.opt_in_status).toBe('opted_in')
    expect(customer?.birthday_month).toBe(6)
    expect(customer?.birthday_day).toBe(15)
    expect(customer?.food_preference).toBe('Veg')

    // Verify welcome coupon was created
    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('customer_id', customer!.id)
      .eq('type', 'welcome')
      .maybeSingle()

    expect(coupon).not.toBeNull()
    expect(coupon?.status).toBe('sent')
    expect(coupon?.discount_cents).toBe(1000) // welcome_discount_cents from createTestRestaurant
  })

  test('invalid phone shows client-side error', async ({ page }) => {
    await page.goto(`/form/${restaurantSlug}`)

    await page.fill('#name', 'Bad Phone Customer')
    await page.fill('#phone', '12345') // Invalid format
    await page.click('button[type="submit"]')

    // Client-side error appears
    await expect(page.getByText('WhatsApp number must start with +91')).toBeVisible()

    // Should NOT show success
    await expect(page.getByRole('heading', { name: 'You\'re Registered!' })).toHaveCount(0)
  })

  test('nonexistent slug shows 404', async ({ page }) => {
    const response = await page.goto('/form/nonexistent-slug-xyz')
    expect(response?.status()).toBe(404)
  })
})
```

- [ ] **Step 2: Run the spec**

Run: `npx playwright test tests/intake-form.spec.ts`
Expected: 3 tests pass. Customer submits form -> success + DB verified. Invalid phone -> client error. Nonexistent slug -> 404.

- [ ] **Step 3: Commit**

```bash
git add tests/intake-form.spec.ts
git commit -m "test: e2e intake form spec — submit, validation, 404"
```

---

### Task 9: Full Suite Run + Final Verification

**Files:**
- No new files

- [ ] **Step 1: Run the full E2E suite**

Run: `pnpm test:e2e`
Expected: All specs pass (setup: 2, auth: 3, restaurant: 1, coupons: 1, validate: 3, admin: 1, intake-form: 3 = 14 tests total).

- [ ] **Step 2: Verify existing unit tests still pass**

Run: `pnpm test`
Expected: 15 files, 114 tests pass (unchanged from before).

- [ ] **Step 3: Commit (if any fixups were needed)**

If any specs needed adjustments during the full run:

```bash
git add tests/
git commit -m "test: e2e fixups after full suite run"
```

---

## Self-Review Notes

1. **Spec coverage:** All 5 approved flows are covered: auth (Task 3), restaurant create (Task 4), coupon CRUD (Task 5), validate (Task 6), admin add credits (Task 7), intake form (Task 8). Plus setup infrastructure (Tasks 1-2).

2. **Cleanup safety:** Every spec that creates data has an `afterAll` that calls `cleanupRestaurant()` which deletes in FK-safe order: coupons -> message_logs -> customers -> restaurants. Auth spec cleans up Supabase Auth users by email prefix.

3. **Test isolation:** Each spec creates its own test restaurant with a unique name (timestamp suffix). No spec depends on another spec's data (except auth setup which creates the shared auth session).

4. **storageState overrides:**
   - `auth.spec.ts`: `test.use({ storageState: undefined })` — starts fresh
   - `intake-form.spec.ts`: `test.use({ storageState: undefined })` — public page
   - `admin.spec.ts`: `test.use({ storageState: 'tests/.auth/admin.json' })` — admin session
   - All others: default `tests/.auth/user.json` from project config

5. **Potential flakiness:** The coupons spec uses `page.waitForTimeout(1000)` after creating a second coupon. If flaky, replace with `await expect(couponsTable.locator('tbody tr')).toHaveCount(2)` or similar auto-wait.
