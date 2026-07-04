# To-Do Features: 21-Day Unlimited Trial (₹599) & Onboarding Flow

This file lists the checklist and technical specifications for implementing the low-friction account-first trial activation, payment integration, and UI warning widgets for Restoloop.

---

## 0. Account-First Flow (Onboarding Foundation)
* [ ] **Low-Friction Signup:** Keep the signup flow simple. Once the user submits email, password, and restaurant details, log them in and redirect them directly to the main dashboard page at `/dashboard`.
* [ ] **Exploratory Access:** Enable the user to view all dashboard tabs (Guests, Coupons, Campaigns, Settings) but gate core execution actions (like downloading the table QR code) until the trial is active.
* [ ] **Restaurant Default State:** Initialize new restaurants with `plan = 'free'`, `credits = 0`, and `has_used_trial = false`.

---

## 1. The "Premium Membership Card" Banner (Dashboard CTA)
* [ ] **Visual Mockup Card:** Place a glassmorphic banner at the top of the dashboard (`/dashboard`) using a crimson-to-saffron gradient.
  * **Exploratory State (`has_used_trial === false`):**
    * Display Title: **🎁 Claim 21-Day Unlimited Growth Trial**
    * Display Description: *"Start capturing customer contacts, auto-send coupons on WhatsApp, and bring back 4-5 guests in your first week for ₹599. Pay securely with UPI/Card."*
    * Display Button: **Claim Trial (₹599) 🚀**
  * **Active Trial State (`has_used_trial === true` and `trial_ends_at > now()`):**
    * Render an elegant SVG **Circular Countdown Dial** showing the remaining trial days (e.g., `18 Days Left`).
    * Display status: *"Unlimited WhatsApp campaigns active."*
  * **Expired Trial State (`has_used_trial === true` and `trial_ends_at < now()`):**
    * Show warning banner: *"Your trial has ended. Please choose a subscription plan to continue sending campaigns."*
    * Hide the ₹599 trial button so they cannot abuse or re-claim it.
* [ ] **Table QR Code Gating:**
  * When in Exploratory or Expired state, apply a blurred overlay on the QR code download card in Settings, with a prompt: *"Unlock QR code by activating your 21-day trial."*

---

## 2. Payment Integration Layer
* [ ] **Reuse Existing Razorpay Integration:**
  * Build directly on top of the current Razorpay implementation to leverage existing client scripts, backend order generation, and signature-verified webhook handlers.
* [ ] **Trial Order Creation Gating (`/api/razorpay/create-order`):**
  * Support the `'trial'` plan type in the request payload: `{ "amount": 599, "plan": "trial" }`.
  * Validate against the database first. If the restaurant has `has_used_trial === true`, reject the order with a `400 Bad Request` error to prevent abuse.
  * Set the order amount to `59900` (paise) and add metadata notes: `notes: { "userId": user.id, "plan": "trial" }`.
* [ ] **Webhook Trial Handler (`/api/razorpay/webhook`):**
  * When a `payment.captured` event arrives containing `"plan": "trial"` in the notes, intercept the flow to activate the trial in Supabase:
    * Set `plan = 'trial'`
    * Set `has_used_trial = true`
    * Set `trial_activated_at = now()`
    * Set `trial_ends_at = now() + 21 days`
* [ ] **Sandbox Mode Support:**
  * Support testing in localhost by checking if keys are set to `'mock'` inside `.env.local`. 
  * Open the Sandbox Payment Simulator overlay on the main dashboard `/dashboard` when clicking `Claim Trial (₹599)`.
  * Trigger mock webhook callback to `/api/razorpay/webhook` with signature `sig_mock` to update database state locally during development.

---

## 3. Circular Credit Progress Indicator (Header Widget)
* [ ] **Top-Right Header Component:**
  * Add a circular credit balance indicator to the top-right corner of the dashboard sidebar/header layout.
* [ ] **SVG Circular Chart:**
  * Draw a clean, compact SVG circular progress ring indicating remaining credits as a percentage of standard credit capacity (1000 credits).
  * Display the raw number of credits in the center of the ring.
  * Clicking the circular indicator redirects the user directly to the Settings page (`/dashboard/settings`).
* [ ] **Threshold States & Warnings:**
  * **Safe State ($\ge$ 200 credits):** Stroke is green or warm saffron (`text-[--color-accent]`). No warning shown.
  * **Warning State ($<$ 200 credits):** Progress stroke turns red/orange (`text-red-500`), and a pulsing pill badge is rendered next to the circle with the text: **`please top up`**.
* [ ] **Active Trial Mode State (Option 2B):**
  * If the trial is active (`plan === 'trial'`), the header widget displays the **number of days left in the trial** (e.g., `21d`, `18d`) with a green border and no warning badge.

---

## 4. Super-Admin Fallback & Control Center
* [ ] **Plan & Trial Override:**
  * Add a manual selection dropdown on the restaurant detail page (`/admin/[id]`) to switch plans (`free`, `trial`, `starter`, `pro`).
  * Add a date-picker or relative input to set/extend the trial expiry date (`trial_ends_at`).
* [ ] **Account Suspension Toggle:**
  * Add an `active` / `suspended` toggle.
  * If a restaurant is suspended, gate their public intake form at `/form/[slug]` with an administrative warning, and exclude their customers/campaigns from the daily campaign execution cron.
* [ ] **Support Impersonation ("Login-As"):**
  * Implement a button on the restaurant details page to securely authenticate and redirect the super-admin session to that restaurant's dashboard as a virtual owner session.
* [ ] **Manual Cron Trigger:**
  * Add a button on `/admin/[id]` to manually run the daily campaign generator (welcome, birthday, winback check) for that restaurant immediately.
* [ ] **WhatsApp Session Reset:**
  * Provide a button to clear/reset the restaurant's WhatsApp provider credentials or token metadata if their instance status is stuck.
* [ ] **Global Coupon Override Validator:**
  * Add a simple search field on the main admin page `/admin` to look up *any* coupon code globally and manually force-redeem or reactivate it if needed.
