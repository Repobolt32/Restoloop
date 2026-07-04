# Slice 17: Trial Onboarding, Payments & Gating — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement low-friction onboarding (new restaurants default to `plan = 'free'` and `0` credits), ₹599 Razorpay trial activation with countdown banners, clickable header widgets, gated QR downloads, and admin override controls.

**Architecture:** Create DB migration to support trial columns and reset defaults. Extend existing Razorpay order/webhook endpoints to handle `purchaseType: 'trial'`. Add status banners, dynamic header widget, and blur filter UI for QR download card. Provide datetime-local admin overrides.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4, Supabase (@supabase/ssr), Razorpay SDK.

**Required Skills (load before coding):**
- `ponytail` — YAGNI first, lazy minimal changes
- `route-handlers` — Next.js API endpoints
- `frontend-design` — Crimson & Warm Saffron light mode style
- `tailwind-design-system` — Tailwind styling
- `e2e-testing-patterns` — Playwright testing

---

## Global Constraints

- Design System: Crimson & Warm Saffron light mode from `design-system/restoloop/MASTER.md`. No dark mode.
- Money: All amounts in cents (integer). No floats.
- Auth middleware redirects unauthenticated users to `/login`.
- Run `pnpm typecheck` + `pnpm lint` + `pnpm test` before declaring code works.

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/007_trial_onboarding.sql`

- [ ] **Step 1: Create migration script**
  Write to `supabase/migrations/007_trial_onboarding.sql`:
  ```sql
  -- Add trial tracking columns to restaurants
  ALTER TABLE restaurants
    ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS trial_activated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

  -- Update credits default value to 0 for new registrations
  ALTER TABLE restaurants 
    ALTER COLUMN credits SET DEFAULT 0;
  ```

- [ ] **Step 2: Commit database migration**
  ```bash
  git add supabase/migrations/007_trial_onboarding.sql
  git commit -m "migration: add trial tracking columns and set initial credits default to 0"
  ```

---

### Task 2: Razorpay API Integration

**Files:**
- Modify: `src/app/api/razorpay/create-order/route.ts`
- Modify: `src/app/api/razorpay/webhook/route.ts`
- Modify: `src/app/api/razorpay/create-order/route.test.ts`
- Modify: `src/app/api/razorpay/webhook/route.test.ts`

- [ ] **Step 1: Update create-order route and test**
  Extend `src/app/api/razorpay/create-order/route.ts` to accept `purchaseType`:
  * If `purchaseType === 'trial'`, query DB to ensure `trial_activated_at` is null. If not, return 400.
  * Force amount to 599 (paise `59900`).
  * Set notes: `{ "purchaseType": "trial", "userId": user.id }`.
  Update `src/app/api/razorpay/create-order/route.test.ts` to cover the new test cases.
  Run `pnpm test` to verify.

- [ ] **Step 2: Update webhook route and test**
  Extend `src/app/api/razorpay/webhook/route.ts`:
  * If `purchaseType === 'trial'`, update restaurant settings: `plan: 'trial'`, `trial_activated_at: now()`, `trial_expires_at: now() + 21 days`.
  Update `src/app/api/razorpay/webhook/route.test.ts` to verify the webhook handler works with mock signatures and payloads.
  Run `pnpm test` to verify.

- [ ] **Step 3: Commit changes**
  ```bash
  git add src/app/api/razorpay
  git commit -m "feat: extend Razorpay order creation and webhooks to support trial plan activation"
  ```

---

### Task 3: Dashboard Banner and Clickable Header Widget

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/dashboard/layout.tsx`

- [ ] **Step 1: Add Premium Membership Banner on Dashboard**
  Update `src/app/dashboard/page.tsx` to display a banner with a Crimson-Saffron gradient:
  * Free plan (`plan = 'free'` and `trial_activated_at` is null) -> Show: "Claim your 21-Day Unlimited Growth Trial for ₹599 to unlock campaigns & table QR code!" + "Claim Unlimited Trial" button.
  * Active trial (`plan = 'trial'` and in future) -> Show countdown: "Trial active. {daysLeft} days remaining. Campaign messages are running."
  * Expired trial (`plan = 'trial'` and in past) -> Show: "Trial expired. Campaign messages are paused. Select a plan to continue."
  * Load Razorpay checkout script and handle button action on the dashboard page.

- [ ] **Step 2: Add clickable header widget in layout**
  Update `src/app/dashboard/layout.tsx`:
  * Place a clickable button widget in the top-right of the dashboard content area.
  * Link the widget to `/dashboard/settings`.
  * Display trial days remaining if on trial (e.g., `⚡ 21d left`). Otherwise, display remaining credits (e.g., `🪙 150 cr`).
  * Add orange/red color styling and warning caption if credits drop below 200.

- [ ] **Step 3: Commit visual updates**
  ```bash
  git add src/app/dashboard/page.tsx src/app/dashboard/layout.tsx
  git commit -m "feat: add conditional premium banner and layout header progress widget"
  ```

---

### Task 4: QR Code Download Gating and Sandbox Updates

**Files:**
- Modify: `src/app/dashboard/settings/page.tsx`

- [ ] **Step 1: Gate QR code card and integrate trial checkout**
  Update `src/app/dashboard/settings/page.tsx`:
  * Determine gating: `isGated = plan === 'free' || (plan === 'trial' && new Date(trial_expires_at) < new Date())`.
  * If gated, apply `blur-sm` style overlay to QR code image and download button.
  * Render overlay container containing CTA: *"Pay ₹599 to unlock unlimited campaign sends and get your table QR Code."* and a **"Pay to unlock"** button.
  * Make **"Pay to unlock"** trigger Razorpay trial checkout order creation and modal activation.
  * Modify Sandbox simulator modal configuration to handle both trial and credits packages, matching pricing and details.

- [ ] **Step 2: Commit Settings changes**
  ```bash
  git add src/app/dashboard/settings/page.tsx
  git commit -m "feat: gate QR download card on Settings and update Sandbox modal for trial topups"
  ```

---

### Task 5: Admin Details Plan & Trial Override

**Files:**
- Modify: `src/app/admin/[id]/page.tsx`
- Modify: `src/app/admin/[id]/actions.ts`
- Modify: `src/app/admin/[id]/actions.test.ts`

- [ ] **Step 1: Implement Update Plan server action**
  Add `updatePlanAction(formData: FormData)` in `src/app/admin/[id]/actions.ts`:
  * Ensure user authentication is admin (`admin@restoloop.com`).
  * Save the selected plan and custom datetime.
  * If plan is set to `trial` and `trial_activated_at` is null, set it to `now()`.
  * Revalidate `/admin` and `/admin/${restaurantId}` paths and redirect.
  Update unit tests in `src/app/admin/[id]/actions.test.ts` to assert functionality.

- [ ] **Step 2: Implement Plan & Trial Override form**
  Modify `src/app/admin/[id]/page.tsx`:
  * Add a form card with layout dropdown select (`Free`, `Trial`, `Starter`, `Pro`) and `datetime-local` input for `trial_expires_at`.
  * Pre-fill inputs with active restaurant settings.

- [ ] **Step 3: Commit Admin override updates**
  ```bash
  git add src/app/admin/[id]
  git commit -m "feat: add admin controls for plan tier and trial expiry override"
  ```

---

### Task 6: E2E and Validation Testing

**Files:**
- Create: `tests/slice-17.spec.ts`

- [ ] **Step 1: Write E2E Playwright tests**
  Create `tests/slice-17.spec.ts` to assert:
  * Unpaid restaurant (credits = 0, plan = 'free') sees the dashboard banner invitation and settings QR code gating.
  * Purchasing trial via Sandbox updates status to Active Trial and displays countdown banner and unlocks QR download.
  * Expiry of trial gates feature again and updates countdown banner status.
  * Super-admin page can override plan back to Trial with custom dates.
  Verify code style with `pnpm typecheck` + `pnpm lint` + `pnpm test` + `pnpm test:e2e`.

- [ ] **Step 2: Commit E2E test suite**
  ```bash
  git add tests/slice-17.spec.ts
  git commit -m "test: add Playwright E2E suite for trial onboarding, payments, gating, and admin override"
  ```

---

## Verification Plan

1. **Local Signup Flow**: Register a new user. Verify they end up directly on `/dashboard` and initial state has `plan = 'free'` and `credits = 0`.
2. **Dashboard Promo Banner**: Verify banner invites free user to claim the ₹599 21-day trial.
3. **QR Code Gating**: Navigate to Settings page. Ensure QR code card is blurred and blocked with "Pay to unlock" CTA.
4. **Trial Activation (Sandbox)**: Trigger purchase from dashboard or settings. Simulate success via sandbox. Verify user transitions to `plan = 'trial'` with active countdown banner, clickable header progress widget, and unblurred QR download button.
5. **Admin Details Panel**: Log in as admin (`admin@restoloop.com`). Navigate to `/admin/[id]`. Edit plan status to `starter` or custom `trial` expiry date. Confirm updates reflect on the restaurant owner's view.
