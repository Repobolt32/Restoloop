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
    *   **Bug Fixes**: Context-aware success banners for detail page actions (credits, plan, suspension, campaign run, WhatsApp reset) and main table layout alignment with Status capsules (Active/Suspended).

---

## 🚦 Verification Status

*   **Unit Tests**: **128/128 passed** (`pnpm test` via Vitest).
*   **E2E Tests**: Playwright suite (`pnpm test:e2e` / `npx playwright test`) covers full flows for authentication, intake forms, coupon validation, credits/gating, and admin controls.

---

## 📅 Active Task: Manual Campaign Testing & Seeding Verification
*   **Goal**: Provide the database seeding scripts, SQL triggers, and instructions to help manually test the Welcome, Birthday, Winback, and Expiry automated campaigns locally using the mock OpenWA provider.
*   **Next Steps**:
    1.  Document precise SQL updates for customer records (e.g. altering birthdates or sign-up dates) to simulate campaign trigger conditions.
    2.  Provide the cURL or route execution command to trigger the daily cron campaign run locally.
    3.  Verify outbound messages are correctly logged to the terminal window running `pnpm dev`.
