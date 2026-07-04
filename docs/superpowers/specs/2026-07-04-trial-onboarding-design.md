# Design Spec: 21-Day Unlimited Trial (₹599) & Onboarding Flow

This specification covers the implementation of a 21-day unlimited messaging trial plan activated via Razorpay, including conditional dashboard banners, a header widget, gated QR code downloads, and admin override controls.

## 1. Requirements

### 1.1 Database State
* New restaurant accounts are initialized on the `free` plan with `0` credits.
* The owner has exploratory access: they can navigate the dashboard sections but cannot download the enrollment QR code or run active campaign messaging.

### 1.2 Trial Activation & Payment
* A one-time 21-Day Unlimited Growth Trial can be purchased for ₹599.
* A restaurant can only purchase the trial once. Subsequent attempts to purchase the trial are blocked.
* In a local/development environment, a simulator sandbox is supported to test the purchase flows.

### 1.3 UI Components
* **Promotional Banner**: Top-of-dashboard visual banner with a crimson-to-saffron gradient.
  * **Not Started Trial**: Prompts the user to activate the ₹599 trial. Contains an active payment button.
  * **Active Trial**: Displays countdown of days remaining and confirms campaign messaging is running.
  * **Expired Trial**: Displays warning that the trial has ended and campaigns are paused.
* **Header Widget**: Clickable badge in the top-right corner of the dashboard pages linking to `/dashboard/settings`.
  * If the trial is active: displays days remaining (e.g., `⚡ 18d remaining`).
  * If the trial is not active: displays credits remaining (e.g., `🪙 120 credits`). Displays red/orange warning state when credits fall below 200.
* **QR Code Gating**: In settings, if the plan is `free` or the trial is expired, the QR card is blurred and overlaid with a "Pay ₹599 to unlock" button.

### 1.4 Admin Controls
* **Plan & Trial Override**: Admin detail page at `/admin/[id]` has controls to change plan status (`free`, `trial`, `starter`, `pro`) and set custom `trial_expires_at` datetimes.

---

## 2. Technical Design

### 2.1 Database Migration (`supabase/migrations/007_trial_onboarding.sql`)
```sql
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trial_activated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Default credit balance to 0 for new restaurants
ALTER TABLE restaurants 
  ALTER COLUMN credits SET DEFAULT 0;
```

### 2.2 Razorpay API & Webhook Adapters

#### Order Creation Route (`src/app/api/razorpay/create-order/route.ts`)
* Add input parameter validation for `purchaseType?: 'trial' | 'credits'`.
* If `purchaseType === 'trial'`:
  * Fetch current restaurant details. Verify `trial_activated_at IS NULL` and `plan != 'trial'`. If already activated, return `400 Bad Request`.
  * Call Razorpay order API with `amount: 59900` (₹599.00), currency `INR`.
  * Inject metadata `notes: { purchaseType: 'trial', userId: user.id }`.
* If `purchaseType === 'credits'` (or empty/legacy):
  * Maintain existing top-up behavior.

#### Webhook Handler Route (`src/app/api/razorpay/webhook/route.ts`)
* Check `event.payload.payment.entity.notes.purchaseType`.
* If value is `'trial'`:
  * Set `plan = 'trial'`, `trial_activated_at = now()`, and `trial_expires_at = now() + 21 days`.
* If value is `'credits'` or missing:
  * Increment credit balance by the purchased amount as per existing logic.

### 2.3 Dashboard UI Modifications

#### Dashboard Page (`src/app/dashboard/page.tsx`)
* Calculate trial state:
  * **Not Started**: `plan === 'free' && trial_activated_at === null`
  * **Active**: `plan === 'trial' && new Date(trial_expires_at) > new Date()`
  * **Expired**: `plan === 'trial' && new Date(trial_expires_at) <= new Date()`
* Render the crimson-to-saffron gradient banner at the top based on the calculated state.
* Add Razorpay Script loading and payment trigger hook for the ₹599 purchase button.

#### Dashboard Layout (`src/app/dashboard/layout.tsx`)
* Replace sidebar credit indicator with a click-through header widget in the top-right corner of the content panel.
* If trial is active, display `⚡ [Days Left]d`.
* If not, display `🪙 [Credits]`. If `< 200` credits, show orange/red warning border/style.

#### Settings Page QR Code (`src/app/dashboard/settings/page.tsx`)
* Wrap the QR code container in a conditionally blurred div if `plan === 'free'` or trial is expired.
* Position an overlay card on top with "Pay to unlock" CTA.
* Wire the button to open the ₹599 Razorpay trial checkout modal.

### 2.4 Super-Admin Controls

#### Admin Detail Page (`src/app/admin/[id]/page.tsx`)
* Add a "Plan & Trial Override" card.
* Render a `<form>` containing:
  * Dropdown selector with options: `free`, `trial`, `starter`, `pro`.
  * Date/time picker for custom `trial_expires_at`.
* Action button triggers Server Action in `actions.ts`.

#### Admin Server Actions (`src/app/admin/[id]/actions.ts`)
* Implement server action `updatePlanAndTrialAction` with admin check (`user.email === 'admin@restoloop.com'`).
* Perform atomic update to `plan` and `trial_expires_at` in the `restaurants` table.
* If switching plan to `trial` and `trial_activated_at` is null, set `trial_activated_at = now()`.
* Revalidate paths and redirect back to `/admin/[id]`.
