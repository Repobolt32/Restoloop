# Slice 8: Admin Sees All - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a secure admin panel at `/admin` and `/admin/[id]` for the super-admin (`admin@restoloop.com`) to manage all restaurants and add credits, styled with the Restoloop Crimson & Warm Saffron design system.

**Architecture:** Use server-side checking for super-admin credentials using the authenticated Supabase client (`createClient()`). If verified, perform data operations via the `createServiceClient()` client (which bypasses RLS and allows global SELECT and UPDATE on restaurants). Use Next.js 16 Server Components and Server Actions to fetch data and process top-ups securely and reactively.

**Tech Stack:** Next.js 16 App Router (Server Components & Server Actions), Supabase (`@supabase/ssr` + `@supabase/supabase-js`), Tailwind CSS v4, Playwright E2E.

## Global Constraints

- Strictly follow the Crimson & Warm Saffron light mode theme: background `#FEF2F2`, primary text/accent `#A16207` (accent) or `#DC2626` (primary), border `#FECACA`, and typography (Playfair Display SC for headings, Karla for body).
- All clickable elements must have `cursor:pointer` (or standard class `cursor-pointer`).
- Do not use emojis as icons (use Lucide/Heroicons SVG paths).
- Always use smooth transitions for hover effects (150-300ms).

---

## Proposed Changes

### Admin Panel Component & Layout

#### [NEW] [page.tsx](file:///e:/desktop/Restoloop/src/app/admin/page.tsx)
Create the main admin table view page. Uses server-side check and service client.

#### [NEW] [page.tsx](file:///e:/desktop/Restoloop/src/app/admin/[id]/page.tsx)
Create the restaurant detail and credit adjustment page. Uses server-side parameters resolution and forms for server actions.

#### [NEW] [actions.ts](file:///e:/desktop/Restoloop/src/app/admin/[id]/actions.ts)
Create the server action that validates admin credentials and executes the database update.

### Testing Suite

#### [NEW] [slice-8.spec.ts](file:///e:/desktop/Restoloop/tests/slice-8.spec.ts)
Create a Playwright E2E test file to verify the admin login redirection, list rendering, details viewing, and credit adjustment functionality.

---

### Task 1: Admin Panel List View Page

**Files:**
- Create: `src/app/admin/page.tsx`
- Test: `tests/slice-8.spec.ts`

**Interfaces:**
- Consumes: `createClient`, `createServiceClient` from `@/lib/supabase/server`

- [ ] **Step 1: Write the failing E2E test skeleton**
  Create `tests/slice-8.spec.ts` with initial describe block and setup to clear/create the test admin and normal user.
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

  test.describe('Slice 8: Admin Sees All', () => {
    let adminUserId: string
    let normalUserId: string
    let restaurantId: string
    let restaurantSlug: string

    test.beforeAll(async () => {
      // 1. Delete admin user if already exists to start clean
      const { data: users } = await supabase.auth.admin.listUsers()
      const existingAdmin = users.users.find(u => u.email === 'admin@restoloop.com')
      if (existingAdmin) {
        await supabase.auth.admin.deleteUser(existingAdmin.id)
      }

      // 2. Create admin user
      const { data: adminResp, error: adminErr } = await supabase.auth.admin.createUser({
        email: 'admin@restoloop.com',
        password: 'adminpassword123',
        email_confirm: true
      })
      if (adminErr || !adminResp.user) {
        throw new Error(`Failed to create admin user: ${adminErr?.message}`)
      }
      adminUserId = adminResp.user.id

      // 3. Create a normal user
      const normalEmail = `owner-slice8-${Date.now()}@restoloop.dev`
      const { data: normalResp, error: normalErr } = await supabase.auth.admin.createUser({
        email: normalEmail,
        password: 'testpass123',
        email_confirm: true
      })
      if (normalErr || !normalResp.user) {
        throw new Error(`Failed to create normal user: ${normalErr?.message}`)
      }
      normalUserId = normalResp.user.id

      // 4. Create restaurant for normal user
      restaurantSlug = `slice8-rest-${Date.now()}`
      const { data: rest, error: restErr } = await supabase
        .from('restaurants')
        .insert({
          owner_id: normalUserId,
          name: 'Slice 8 Gourmet Diner',
          slug: restaurantSlug,
          whatsapp_number: '919876543210',
          credits: 100
        })
        .select()
        .single()
      if (restErr || !rest) {
        throw new Error(`Failed to create restaurant: ${restErr?.message}`)
      }
      restaurantId = rest.id
    })

    test.afterAll(async () => {
      if (restaurantId) {
        await supabase.from('restaurants').delete().eq('id', restaurantId)
      }
      if (adminUserId) {
        await supabase.auth.admin.deleteUser(adminUserId)
      }
      if (normalUserId) {
        await supabase.auth.admin.deleteUser(normalUserId)
      }
    })

    test('Access is denied to unauthenticated users', async ({ page }) => {
      await page.goto('http://localhost:3000/admin')
      await expect(page).toHaveURL(/.*login/)
    })

    test('Access is denied to non-admin users', async ({ page }) => {
      // Login as normal user
      const { data: user } = await supabase.auth.admin.getUserById(normalUserId)
      await page.goto('http://localhost:3000/login')
      await page.getByLabel('Email').fill(user.user!.email!)
      await page.getByLabel('Password').fill('testpass123')
      await page.getByRole('button', { name: /log in/i }).click()
      await expect(page).toHaveURL(/.*dashboard/)

      await page.goto('http://localhost:3000/admin')
      await expect(page).toHaveURL(/.*dashboard/)
    })
  })
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `pnpm test:e2e tests/slice-8.spec.ts`
  Expected: Failure on page load of `/admin` because it returns a 404 (file doesn't exist).

- [ ] **Step 3: Implement `src/app/admin/page.tsx`**
  Write the page using Next.js Server Component architecture.
  ```typescript
  import { createClient, createServiceClient } from '@/lib/supabase/server'
  import { redirect } from 'next/navigation'
  import Link from 'next/link'

  export default async function AdminPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    if (user.email !== 'admin@restoloop.com') {
      redirect('/dashboard')
    }

    const serviceSupabase = createServiceClient()
    const { data: restaurants } = await serviceSupabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false })

    return (
      <div className="min-h-screen bg-[var(--color-background)] p-8 font-body text-[var(--color-foreground)]">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center border-b border-[var(--color-border)] pb-4">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-primary)]">
                Admin Panel
              </h1>
              <p className="text-sm text-[var(--color-foreground)] opacity-60 mt-1">
                Restoloop SaaS Administration Overview
              </p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 border border-[var(--color-primary)] text-[var(--color-primary)] rounded-lg text-sm font-semibold hover:bg-[var(--color-border)] transition-colors duration-200 cursor-pointer"
            >
              Go to Dashboard
            </Link>
          </div>

          {/* Restaurant List Section */}
          <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[var(--color-border)] bg-[var(--color-muted)]">
              <h2 className="font-display text-lg font-bold text-[var(--color-foreground)]">
                All Registered Restaurants
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)] font-display text-sm font-bold text-[var(--color-foreground)]">
                    <th className="p-4">Name</th>
                    <th className="p-4">Slug</th>
                    <th className="p-4">WhatsApp Number</th>
                    <th className="p-4">Credits</th>
                    <th className="p-4">Plan</th>
                    <th className="p-4">Registered On</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!restaurants || restaurants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-sm opacity-55">
                        No restaurants registered yet.
                      </td>
                    </tr>
                  ) : (
                    restaurants.map((restaurant) => (
                      <tr
                        key={restaurant.id}
                        data-testid={`restaurant-row-${restaurant.slug}`}
                        className="border-b border-[var(--color-border)] hover:bg-[var(--color-background)] transition-colors duration-150 text-sm"
                      >
                        <td className="p-4 font-semibold">{restaurant.name}</td>
                        <td className="p-4 text-xs font-mono">{restaurant.slug}</td>
                        <td className="p-4 font-mono">{restaurant.whatsapp_number}</td>
                        <td className="p-4 font-bold text-[var(--color-accent)]">
                          {restaurant.credits}
                        </td>
                        <td className="p-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--color-border)] text-[var(--color-foreground)] uppercase">
                            {restaurant.plan}
                          </span>
                        </td>
                        <td className="p-4 text-xs opacity-75">
                          {new Date(restaurant.created_at).toLocaleDateString('en-IN', {
                            dateStyle: 'medium',
                          })}
                        </td>
                        <td className="p-4 text-right">
                          <Link
                            href={`/admin/${restaurant.id}`}
                            data-testid={`manage-btn-${restaurant.slug}`}
                            className="inline-block px-3 py-1.5 bg-[var(--color-accent)] text-white rounded-lg text-xs font-bold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 cursor-pointer"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 4: Run E2E tests to verify list page authentication**
  Run: `pnpm test:e2e tests/slice-8.spec.ts`
  Expected: Redirect tests pass, list view renders successfully.

- [ ] **Step 5: Commit**
  ```bash
  git add src/app/admin/page.tsx tests/slice-8.spec.ts
  git commit -m "feat: add admin list panel page with authentication check"
  ```

---

### Task 2: Admin Detail and Credit Action Page

**Files:**
- Create: `src/app/admin/[id]/page.tsx`
- Create: `src/app/admin/[id]/actions.ts`
- Modify: `tests/slice-8.spec.ts`

**Interfaces:**
- Produces: `addCreditsAction` server action inside `src/app/admin/[id]/actions.ts`

- [ ] **Step 1: Write E2E test for credit top-ups**
  Append to `tests/slice-8.spec.ts` inside the `test.describe` block:
  ```typescript
    test('Super admin can view details and add credits', async ({ page }) => {
      // 1. Log in as Super Admin
      await page.goto('http://localhost:3000/login')
      await page.getByLabel('Email').fill('admin@restoloop.com')
      await page.getByLabel('Password').fill('adminpassword123')
      await page.getByRole('button', { name: /log in/i }).click()
      await expect(page).toHaveURL(/.*dashboard/)

      // 2. Navigate to admin panel
      await page.goto('http://localhost:3000/admin')
      await expect(page.getByTestId(`restaurant-row-${restaurantSlug}`)).toBeVisible()

      // 3. Click manage restaurant button
      await page.getByTestId(`manage-btn-${restaurantSlug}`).click()
      await expect(page).toHaveURL(new RegExp(`/admin/${restaurantId}`))

      // 4. Verify detail elements
      await expect(page.getByTestId('admin-restaurant-name')).toContainText('Slice 8 Gourmet Diner')
      await expect(page.getByTestId('admin-credits-display')).toContainText('100')

      // 5. Trigger add 100 credits action
      await page.getByTestId('add-100-btn').click()

      // 6. Verify credits update to 200 in UI and success banner appears
      await expect(page.getByTestId('admin-credits-display')).toContainText('200')
      await expect(page.getByTestId('success-alert')).toBeVisible()

      // 7. Verify in database directly
      const { data: dbRest } = await supabase
        .from('restaurants')
        .select('credits')
        .eq('id', restaurantId)
        .single()
      expect(dbRest!.credits).toBe(200)
    })
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `pnpm test:e2e tests/slice-8.spec.ts`
  Expected: Failure on clicking manage restaurant (results in 404).

- [ ] **Step 3: Implement server action `src/app/admin/[id]/actions.ts`**
  ```typescript
  'use server'

  import { createClient, createServiceClient } from '@/lib/supabase/server'
  import { revalidatePath } from 'next/cache'
  import { redirect } from 'next/navigation'

  export async function addCreditsAction(formData: FormData) {
    const restaurantId = formData.get('restaurantId') as string
    const amountStr = formData.get('amount') as string
    const credits = parseInt(amountStr, 10)

    if (!restaurantId || isNaN(credits)) {
      throw new Error('Invalid action parameters')
    }

    // 1. Authenticate user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== 'admin@restoloop.com') {
      throw new Error('Unauthorized')
    }

    // 2. Add credits atomically (Fetch + Update)
    const serviceSupabase = createServiceClient()
    const { data: restaurant, error: fetchError } = await serviceSupabase
      .from('restaurants')
      .select('credits')
      .eq('id', restaurantId)
      .single()

    if (fetchError || !restaurant) {
      throw new Error('Restaurant not found')
    }

    const newCredits = (restaurant.credits || 0) + credits

    const { error: updateError } = await serviceSupabase
      .from('restaurants')
      .update({ credits: newCredits })
      .eq('id', restaurantId)

    if (updateError) {
      throw new Error('Database update failed')
    }

    // 3. Revalidate paths
    revalidatePath('/admin')
    revalidatePath(`/admin/${restaurantId}`)

    // 4. Redirect to details view with success indicator
    redirect(`/admin/${restaurantId}?success=true&added=${credits}`)
  }
  ```

- [ ] **Step 4: Implement dynamic details page `src/app/admin/[id]/page.tsx`**
  ```typescript
  import { createClient, createServiceClient } from '@/lib/supabase/server'
  import { addCreditsAction } from './actions'
  import { notFound, redirect } from 'next/navigation'
  import Link from 'next/link'

  interface PageProps {
    params: Promise<{ id: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
  }

  export default async function AdminDetailPage({ params, searchParams }: PageProps) {
    const { id } = await params
    const sParams = await searchParams

    // 1. Check permissions
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    if (user.email !== 'admin@restoloop.com') {
      redirect('/dashboard')
    }

    // 2. Fetch restaurant data using Service Client (bypassing RLS)
    const serviceSupabase = createServiceClient()
    const { data: restaurant } = await serviceSupabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single()

    if (!restaurant) {
      notFound()
    }

    const showSuccess = sParams.success === 'true'
    const addedCredits = sParams.added

    return (
      <div className="min-h-screen bg-[var(--color-background)] p-8 font-body text-[var(--color-foreground)]">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb / Back Navigation */}
          <div className="mb-6">
            <Link
              href="/admin"
              className="inline-flex items-center text-sm font-semibold text-[var(--color-primary)] hover:opacity-85 transition-opacity cursor-pointer"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Restaurants
            </Link>
          </div>

          {/* Success Banner */}
          {showSuccess && (
            <div
              data-testid="success-alert"
              className="mb-6 p-4 rounded-xl border border-green-200 bg-green-50 text-green-800 text-sm flex items-center font-semibold"
            >
              <svg
                className="w-5 h-5 mr-3 text-green-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Successfully added {addedCredits} credits to {restaurant.name}!
            </div>
          )}

          {/* Restaurant Details Title */}
          <div className="mb-8 border-b border-[var(--color-border)] pb-4">
            <h1
              data-testid="admin-restaurant-name"
              className="font-display text-3xl font-bold tracking-tight text-[var(--color-primary)]"
            >
              {restaurant.name}
            </h1>
            <p className="text-sm text-[var(--color-foreground)] opacity-60 mt-1">
              Admin Credit & Information Panel
            </p>
          </div>

          {/* Credit Management Block */}
          <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm p-6 mb-6">
            <h2 className="font-display text-lg font-bold mb-2 text-[var(--color-foreground)]">
              Credit Balance
            </h2>
            <div className="flex items-baseline space-x-2 mb-6">
              <span
                data-testid="admin-credits-display"
                className="text-4xl font-extrabold font-mono text-[var(--color-accent)]"
              >
                {restaurant.credits}
              </span>
              <span className="text-sm opacity-60">credits</span>
            </div>

            <h3 className="text-sm font-bold mb-3 uppercase tracking-wider text-[var(--color-foreground)] opacity-70">
              Add Credits
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <form action={addCreditsAction}>
                <input type="hidden" name="restaurantId" value={restaurant.id} />
                <input type="hidden" name="amount" value="100" />
                <button
                  type="submit"
                  data-testid="add-100-btn"
                  className="w-full py-3 bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] rounded-lg font-bold hover:bg-[var(--color-border)] active:scale-[0.98] transition-all duration-150 cursor-pointer text-sm"
                >
                  +100 Credits
                </button>
              </form>

              <form action={addCreditsAction}>
                <input type="hidden" name="restaurantId" value={restaurant.id} />
                <input type="hidden" name="amount" value="500" />
                <button
                  type="submit"
                  data-testid="add-500-btn"
                  className="w-full py-3 bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] rounded-lg font-bold hover:bg-[var(--color-border)] active:scale-[0.98] transition-all duration-150 cursor-pointer text-sm"
                >
                  +500 Credits
                </button>
              </form>

              <form action={addCreditsAction}>
                <input type="hidden" name="restaurantId" value={restaurant.id} />
                <input type="hidden" name="amount" value="1000" />
                <button
                  type="submit"
                  data-testid="add-1000-btn"
                  className="w-full py-3 bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] rounded-lg font-bold hover:bg-[var(--color-border)] active:scale-[0.98] transition-all duration-150 cursor-pointer text-sm"
                >
                  +1000 Credits
                </button>
              </form>
            </div>
          </div>

          {/* General Metadata Details */}
          <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm p-6">
            <h2 className="font-display text-lg font-bold mb-4 text-[var(--color-foreground)]">
              General Details
            </h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="border-b border-[var(--color-muted)] pb-2">
                <dt className="opacity-60 text-xs font-semibold uppercase">Owner ID</dt>
                <dd className="font-mono mt-0.5 select-all text-xs">{restaurant.owner_id}</dd>
              </div>
              <div className="border-b border-[var(--color-muted)] pb-2">
                <dt className="opacity-60 text-xs font-semibold uppercase">Restaurant ID</dt>
                <dd className="font-mono mt-0.5 select-all text-xs">{restaurant.id}</dd>
              </div>
              <div className="border-b border-[var(--color-muted)] pb-2">
                <dt className="opacity-60 text-xs font-semibold uppercase">Slug</dt>
                <dd className="font-mono mt-0.5">{restaurant.slug}</dd>
              </div>
              <div className="border-b border-[var(--color-muted)] pb-2">
                <dt className="opacity-60 text-xs font-semibold uppercase">WhatsApp Contact</dt>
                <dd className="font-mono mt-0.5">{restaurant.whatsapp_number}</dd>
              </div>
              <div className="border-b border-[var(--color-muted)] pb-2 col-span-2">
                <dt className="opacity-60 text-xs font-semibold uppercase">Pricing Plan</dt>
                <dd className="font-bold text-[var(--color-primary)] uppercase mt-0.5">
                  {restaurant.plan}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 5: Run tests and verify the complete flow passes**
  Run: `pnpm test:e2e tests/slice-8.spec.ts`
  Expected: All E2E checks (list, detail view, credit adjustments) pass successfully.

- [ ] **Step 6: Run Typecheck and Lint**
  Run: `pnpm typecheck`
  Expected: PASS

  Run: `pnpm lint`
  Expected: PASS

- [ ] **Step 7: Commit final updates**
  ```bash
  git add src/app/admin/[id]/page.tsx src/app/admin/[id]/actions.ts tests/slice-8.spec.ts
  git commit -m "feat: implement admin details credit top-ups with server action"
  ```

---

## Verification Plan

### Automated Tests
Run the newly created E2E Playwright test:
```bash
pnpm test:e2e tests/slice-8.spec.ts
```

Also, verify full codebase compiles and passes lint/unit tests:
```bash
pnpm typecheck
pnpm lint
pnpm test
```

### Manual Verification
- Accessing `http://localhost:3000/admin` after logging in as `admin@restoloop.com` to see the tables.
- Accessing `http://localhost:3000/admin` when logged in as a normal restaurant user (e.g. `test-owner-slice7-...@restoloop.dev`) and checking that we are redirected back to the merchant dashboard `/dashboard`.
- Modifying restaurant credits from the detail view page and seeing the success banner and direct update to the credit counter.
