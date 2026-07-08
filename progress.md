# Restoloop Project Progress

## ⚠️ MANDATORY STARTUP RULES FOR ALL AGENTS
1. **Check Status Instantly**: At the start of every session/turn, the very first file you must read is [progress.md](file:///e:/desktop/Restoloop/progress.md). Do not guess the project status or waste tokens querying multiple directories.
2. **Invoke Superpowers Skill**: Before responding or taking any action, you must check and load the `using-superpowers` skill (located in `.agents/skills/using-superpowers/SKILL.md` or as a registered skill) to identify and activate any relevant technical skills (e.g., `frontend-design`, `route-handlers`, `ponytail`, etc.).
3. **Keep This File Updated**: Before concluding any slice, feature, or session, you MUST update this [progress.md](file:///e:/desktop/Restoloop/progress.md) file with the latest completed features, verification evidence, and next steps.

---

## 🛠️ Completed Slices & Features

All core functionality (Slices 1 to 17) has been fully built, verified, and integrated:

### 1. Core Platform & Multi-Tenant Dashboard
*   **Authentication (S1, S10)**: Secure signup/login with email, password, and fast onboarding redirect to the dashboard.
*   **Multi-Tenancy (S2)**: Automatic restaurant registration, dynamic URL slug generation (e.g., `/form/[slug]`), and owner-restricted table rows (using Postgres RLS).
*   **Create Restaurant Validation**: Resolved Next.js server crash during restaurant creation by adding phone normalization (handling `+91`, `0`, and 10-digit formats), using Zod `safeParse`, and implementing a clean validation error banner on the `/dashboard/create` page.
*   **Guest Intake Form (S3)**: Public-facing guest intake page for restaurant tables collecting names, phone numbers (E.164 verification), and birthdates.
*   **Guest & Coupon Management (S4, S5, S6)**: Interactive guest list table, coupon generation, and a dedicated Counter Coupon Validation screen at `/dashboard/validate` for cashier validation.
*   **Coupon Settings (S14)**: Configurable discount parameters (percentage/flat, minimum order value, validity days) in settings.
*   **Customer Segments (S16)**: Dynamic guest list filtering by segments: *All, New, Birthday, Win-back,* and *Opt-out*.
*   **Sidebar Styling**: Restored premium mockup styling for navigation buttons (rounded rectangle 12px corners, title case typography, solid active dark orange `#E65C00` state with white text/icons and right-aligned small white dot indicator).

### 2. Marketing & Automation Campaign Engine
*   **Campaign Engine (S15)**: Background message queues for Welcome, Birthday, Winback, and Expiry campaigns.
*   **Campaign Control (S15)**: Toggle switches to enable/disable specific campaigns and configurable delays (e.g., 2 hours for welcome reminder).
*   **Campaign Visibility (S11, S12)**: Beautiful dashboard views showing campaign stats (sent count, delivery status, templates).
*   **Analytics Charts (S13)**: Dynamic visual charts displaying message sends vs. coupon redemptions.
*   **WhatsApp Mock Provider (S15)**: Local mock WhatsApp server (`/api/test/openwa-mock`) simulating real-world Webhook and API message interactions.

### 3. Credits, Trial Activation & Gating (S7, S17)
*   **Trial Integration**: Low-friction account initialization starting on the Free plan with 0 credits.
*   **Payment Flow**: ₹599 Razorpay payment integration to activate a 21-day unlimited messaging trial.
*   **Gating**: Blur-gated table QR code card on the Settings page. Locked for Free/Expired accounts; automatically unlocked upon active Trial.
*   **Header Widget**: Clickable layout widget showing trial days left (`⚡ 21d`) or remaining credits (`🪙 150 cr`), alerting in orange/red if credits are low (< 200).

### 4. Admin controls & Impersonation (S8, S17)
*   **Super-Admin Suite**: Portal at `/admin/[id]` for support admins (`admin@restoloop.com`) allowing:
    *   Manual overrides of restaurant plans (Free, Trial, Starter, Pro) and trial expiration datetimes.
    *   Adding custom credits with log reasons.
    *   Account suspension (blocks intake form & daily campaign message sends).
    *   Support Impersonation ("Login-As") to access restaurant owner dashboards.
    *   Manual Cron Trigger to run automated campaigns immediately.
    *   **Bug Fixes**: Context-aware success banners for detail page actions (credits, plan, suspension, campaign run, WhatsApp reset) and main table layout alignment with Status capsules (Active/Suspended). Added safe fallbacks for missing Supabase environment variables (`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) to prevent synchronous client-initialization crashes during sandbox trial capture testing, falling back to the authenticated cookie-based client context when service role keys are missing.

---

## 🚦 Verification Status

*   **Unit Tests**: **133/133 passed** (`pnpm test` via Vitest).
*   **E2E & Webhook Integration**: Fully verified with a live OpenWA session. Handled nested `payload.data` parsing bug to resolve HTTP 500 crashes. Verified end-to-end: public customer intake -> prefilled chat send -> webhook callback -> coupon transmission.

---

## 📅 Active Task: Manual Campaign Testing & Seeding Verification
*   **Goal**: Provide the database seeding scripts, SQL triggers, and instructions to help manually test the Welcome, Birthday, Winback, and Expiry automated campaigns locally using the real OpenWA provider on ngrok.
*   **Completed (Ngrok & OpenWA Configuration)**:
    *   Exposed the local server using ngrok to test webhook flows (WhatsApp / Razorpay) and public customer intake forms on external/mobile devices.
    *   Flipped `WHATSAPP_PROVIDER` to `openwa`.
    *   Added `getStatus()` capability to all WhatsApp adapters.
    *   Built `/api/debug/whatsapp-status` debug helper endpoint.
    *   Linked WhatsApp device successfully via local OpenWA server UI.
    *   Fixed webhook payload parser for `message.received` event payload wrapping.
    *   Verified end-to-end flow with a real device (coupon sent/received successfully).
    *   Verified all unit tests (133/133) and lints pass clean.
*   **Next Steps**:
    1.  ~~Test cron/automated campaign triggers (Welcome, Birthday, Winback) under the real OpenWA gateway setup.~~
  2.  **[DONE] WhatsApp LID Fix**: Added early guard in `/api/whatsapp/route.ts` — when `event.from` ends with `@lid` (Click-to-Chat LID format), the handler logs the event and returns `{ status: 'lid_skipped' }` instead of doing a broken phone lookup. 134/134 tests pass, 0 lint errors, typecheck clean.
  3.  **[DONE] WhatsApp LID Coupon Delivery Fix (TDD)**: Replaced the silent `lid_skipped` bail with a robust 3-strategy LID resolution + coupon-code join fallback:
      - `sendText` now accepts raw JIDs (`@lid` passed through, bare phone still gets `@c.us` appended) — replies route over the channel the message arrived on.
      - `resolveLidPhone` logs failures (URL, HTTP status, error) instead of silent `null` — observability so failures are debuggable, not guessed.
      - `route.ts` LID branch: resolve via `senderPhone` → live API → if both fail or phone-lookup misses, **scan message body for a welcome coupon code** (`W\d+-[A-Z0-9]{6}`) and join through the coupon to the customer. Never silently bails.
      - `actions.ts` form action now embeds the generated coupon code in the prefilled `wa.me` message body — the coupon code becomes the form↔webhook join key that survives LID (phone number is no longer the only identity link).
      - TDD: 4 RED tests written first (sendText raw JID, resolveLidPhone 404 logging, resolveLidPhone network logging, LID + coupon-code join), watched fail, then GREEN. 139/139 tests pass, typecheck clean, 0 lint errors.
  4.  Test cron/automated campaign triggers (Welcome, Birthday, Winback) under the real OpenWA gateway setup.



