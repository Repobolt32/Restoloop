# Design Spec: Low-Friction Account-First Onboarding, Trial Billing & Admin Override

This specification covers transitioning the Restoloop signup flow to a low-friction Account-First model, implementing the 21-Day Unlimited Trial (₹599) via Razorpay, gating the Enrollment QR Code download, and providing administrative overrides.

## 1. Onboarding Foundation (Account-First Flow)

* **Low-Friction Signup Flow**:
  * When an owner registers on `/signup`, they enter their email, password, and restaurant details.
  * On form submission, they are automatically logged in and redirected directly to the main dashboard page at `/dashboard`.
  * They should not be blocked by any mandatory upfront paywall during signup.
* **Default Database State**:
  * New registrations default to `plan = 'free'` and `credits = 0`.
  * The owner can navigate through all sections of the dashboard to explore features.

## 2. Database Schema Changes

A database migration `supabase/migrations/007_trial_onboarding.sql` will add trial tracking columns and update the initial credit default:

```sql
-- Add trial tracking columns to restaurants
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trial_activated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Update credits default value to 0 for new restaurants
ALTER TABLE restaurants 
  ALTER COLUMN credits SET DEFAULT 0;
```

* **`trial_activated_at`**: Tracks when the owner claimed their trial. Once set, they cannot purchase/activate a trial again (enforcing the one-time limit).
* **`trial_expires_at`**: Tracks when the unlimited campaign messaging trial ends.
* **`credits` default**: Changed from `1000` to `0` for new restaurants.

## 3. Razorpay Trial Payment Integration

* **Order Creation Endpoint (`POST /api/razorpay/create-order`)**:
  * Accept `purchaseType: 'trial' | 'credits'`.
  * If `purchaseType === 'trial'`:
    * Verify `trial_activated_at` is `NULL` in the database to prevent duplicate trials.
    * Enforce `amount = 599` (paise value `59900`).
    * Set `notes`: `{ "purchaseType": "trial", "userId": user.id }`.
* **Webhook Handler (`POST /api/razorpay/webhook`)**:
  * Parse metadata notes.
  * If `purchaseType === 'trial'`:
    * Update the restaurant table:
      * Set `plan = 'trial'`
      * Set `trial_activated_at = NOW()`
      * Set `trial_expires_at = NOW() + INTERVAL '21 days'` (or standard JavaScript equivalent on server/SQL).
  * If `purchaseType === 'credits'` (or default/missing):
    * Run existing credit top-up logic.
* **Mock / Sandbox Simulator**:
  * Update sandbox modal to display correct checkout context for Trial purchases.
  * Webhook testing will trigger the webhook endpoint with `{ "purchaseType": "trial" }` to update the DB.

## 4. UI Components & Gating

### A. Crimson-Saffron Premium Membership Banner (Dashboard top)
* Add a visual banner with a crimson-to-saffron gradient at the top of `/dashboard` with 3 states:
  * **Not Started Trial** (`plan = 'free'` and `trial_activated_at` is `NULL`): Display promotion to claim the 21-Day Unlimited Trial for ₹599. Includes a "Claim Unlimited Trial" button that opens Razorpay.
  * **Active Trial** (`plan = 'trial'` and `trial_expires_at` is in the future): Display countdown of remaining days (e.g., "14 days remaining") and confirmation that campaign messaging is running.
  * **Expired Trial** (`plan = 'trial'` and `trial_expires_at` is in the past): Display warning that the trial has ended and prompts the owner to top up / select a plan.

### B. Clickable Header Widget (`/dashboard/layout.tsx` Header)
* Add a clickable progress widget to the top right of the dashboard view:
  * **If Trial is active**: Display days remaining (e.g., `⚡ 21d remaining`).
  * **If Trial is not active**: Display remaining credits (e.g., `🪙 150 credits`).
  * **Low Credit Warning**: If not on trial and credits are `< 200`, highlight orange/red and show a top-up warning.
  * Clicking the widget redirects the user to `/dashboard/settings`.

### C. QR Code Download Gating (`/dashboard/settings`)
* If `plan = 'free'` OR (`plan = 'trial'` and `trial_expires_at` is in the past):
  * Apply a blurred styling lock overlay over the QR code image and download button.
  * Display a card overlay with the text: **"Pay ₹599 to unlock unlimited campaign sends and get your table QR Code."**
  * Include a **"Pay to unlock"** button that opens the ₹599 trial checkout directly.

## 5. Super-Admin Plan & Trial Override (`/admin/[id]`)

* **Admin UI Form**:
  * Add a "Plan & Trial Override" card to the restaurant details view.
  * Include a dropdown selector for `plan` (`free`, `trial`, `starter`, `pro`) and a datetime-local input for `trial_expires_at`.
  * Add a submit button **"Update Plan Status"**.
* **Server Action (`updatePlanAction`)**:
  * Ensure email is `admin@restoloop.com`.
  * Save the selected plan and custom datetime.
  * If plan is set to `trial` and `trial_activated_at` is `NULL`, set `trial_activated_at = NOW()`.
  * Revalidate dashboard layout, settings page, and admin detail page.
