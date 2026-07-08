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

*   **Unit Tests**: **139/139 passed** (`pnpm test` via Vitest).
*   **E2E Tests**: Playwright suite (`pnpm test:e2e` / `npx playwright test`) covers full flows for authentication, intake forms, coupon validation, credits/gating, and admin controls.

---

## ✅ Completed Task: WhatsApp Delivery Fix (2026-07-08)

### Root Cause Fixed
`rock-testing` was missing commit `2138724` ("fix: handle LID JIDs and coupon-code join fallback in WhatsApp webhook"). Modern WhatsApp delivers inbound messages with LID JIDs (`xxx@lid`), not phone JIDs. Without this commit, the webhook was resolving LIDs to garbage phone numbers → messages sent to non-existent chats → silently dropped.

### What Was Done
1. **Stashed** the wrong uncommitted fix (`sendText` in `actions.ts` — wrong layer, wrong approach).
2. **Fast-forward merged** `origin/main` into `rock-testing` (brought in `2138724` cleanly, no conflicts).
3. **Dropped** the stash permanently — the webhook is the sender, never the form.
4. **Auth-gated** `src/app/api/debug/whatsapp-status/route.ts` behind `CRON_SECRET` bearer token (was unauthenticated).

### Architecture: Welcome Coupon is WEBHOOK-triggered (not form-triggered)
1. **Form** (`src/app/form/[slug]/actions.ts`): creates `opted_in` customer + welcome coupon → returns a `wa.me` link with coupon code embedded in prefilled message.
2. **Customer** taps link → sends prefilled message to restaurant WhatsApp.
3. **OpenWA** forwards inbound to `POST /api/whatsapp`.
4. **Webhook** (`src/app/api/whatsapp/route.ts`): correlates LID → customer → sends welcome coupon message.

### Verification Evidence
- `pnpm typecheck` → ✅ 0 errors
- `pnpm lint` → ✅ 0 errors (3 pre-existing warnings)
- `pnpm test` → ✅ **139/139 passed**
- `pnpm build` → ✅ clean production build

### Ops Triage (recurring-symptom checklist)
1. `GET /api/debug/whatsapp-status` with `Authorization: Bearer $CRON_SECRET` → is session `ready`? If not → recreate session (scan QR, update `OPENWA_SESSION_ID`).
2. Is OpenWA's webhook URL pointing at the **stable Vercel deploy URL** (not ephemeral ngrok)? ngrok URLs rotate on restart.
3. In Supabase: is there an **inbound** `message_logs` row for the customer message? If no → inbound never reached webhook (OpenWA config/session). If yes but no outbound `opt_in_confirm` → LID correlation failed (verify `2138724` is in HEAD: `git log --oneline | head`).
4. **Never** add `sendText` to the intake form. The webhook sends.

---

## 📅 Next Steps
*   Live end-to-end test (Task 6): submit intake form → tap wa.me link → confirm welcome message arrives.
*   Verify OpenWA webhook URL in OpenWA admin points to stable Vercel production URL (not ngrok).
*   Optional: store outbound `messageId` in `message_logs.provider_message_id` for delivery-receipt correlation (Task 5C).

