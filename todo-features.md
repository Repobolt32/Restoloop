# To-Do Features: 21-Day Unlimited Trial (₹599) & Onboarding Flow

This file lists the checklist and technical specifications for implementing the low-friction account-first trial activation and payment integration for Restoloop.

---

## 0. Account-First Flow (Onboarding Foundation)
* [ ] **Low-Friction Signup:** Keep the signup flow simple. Once the user submits email, password, and restaurant details, log them in and redirect them directly to the main dashboard `/dashboard`.
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
  * Restoloop already has an established payment flow. We will integrate the ₹599 trial into the existing order creation, SDK overlay, and webhook handlers.
* [ ] **Order Creation API (`/api/razorpay/create-order`):**
  * Support the `'trial'` package with a price of `₹599` (59900 paise).
  * Check if the user has already activated a trial (`has_used_trial === true`). If so, throw an error to prevent re-purchasing.
* [ ] **Webhook Signature Handler (`/api/razorpay/webhook`):**
  * For a successful `'trial'` payment:
    * Update the restaurant row in the database:
      * `plan = 'trial'`
      * `has_used_trial = true`
      * `trial_activated_at = now()`
      * `trial_ends_at = now() + 21 days`
* [ ] **Sandbox Mode Support:**
  * Support testing in localhost by checking if keys are set to `'mock'` inside `.env.local`. 
  * Open the Sandbox Payment Simulator overlay on `/dashboard` when clicking `Claim Trial (₹599)`.
  * Trigger mock signatures (`sig_mock`) on the webhook route just like the existing settings flow.

---

## 3. Circular Credit Progress Indicator (Header Widget)
* [ ] **Top-Right Header Component:**
  * Add a circular credit balance indicator to the top-right corner of the dashboard sidebar/header layout.
* [ ] **SVG Circular Chart:**
  * Draw a clean SVG circular progress ring indicating remaining credits as a percentage of 1000 credits (or total capacity).
  * Display the raw number of credits in the center of the ring.
* [ ] **Warning State (Credits < 200):**
  * If credits fall below **200**, dynamically change the circle stroke color to **orange/red** (`text-amber-500` or `text-red-500`).
  * Display a clear tooltip/badge alongside it: **"please top up"** to catch the owner's attention.
  * Make the widget clickable—clicking it redirects the user directly to the Settings page (`/dashboard/settings`) where they can top up credits.
* [ ] **Trial Mode State:**
  * If the trial is active (`plan === 'trial'`), show an icon representing "Unlimited" (infinity symbol `∞`) inside the circle or bypass the warning.

---

## 4. Database Schema Upgrades
* [ ] **SQL Migration:**
  * Create `supabase/migrations/007_trial_state.sql` to add:
    * `has_used_trial` (boolean, default false)
    * `trial_ends_at` (timestamp with time zone)
    * `trial_activated_at` (timestamp with time zone)
  * Set default value of `credits` for new registrations to `0`.
