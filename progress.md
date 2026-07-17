# Restoloop Project Progress

## ⚠️ MANDATORY STARTUP RULES FOR ALL AGENTS
1. **Check Status Instantly**: At the start of every session/turn, the very first file you must read is [progress.md](file:///e:/desktop/Restoloop/progress.md). Do not guess the project status or waste tokens querying multiple directories.
2. **Invoke Superpowers Skill**: Before responding or taking any action, you must check and load the `using-superpowers` skill (located in `.agents/skills/using-superpowers/SKILL.md` or as a registered skill) to identify and activate any relevant technical skills (e.g., `frontend-design`, `route-handlers`, `ponytail`, etc.).
3. **Keep This File Updated**: Before concluding any slice, feature, or session, you MUST update this [progress.md](file:///e:/desktop/Restoloop/progress.md) file with the latest completed features, verification evidence, and next steps.

---

## 🛠️ Completed Slices & Features

All core functionality (Slices 1 to 17) has been fully built, verified, and integrated:

### 1. Core Platform & Multi-Tenant Dashboard
*   **Authentication (S1, S10, S18)**: Secure signup/login with email, password, and fast onboarding redirect to the dashboard. Integrated "Continue with Google" OAuth support using Supabase Auth with Google provider.
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

*   **Unit Tests**: **155/155 passed** (`pnpm test` via Vitest).
*   **E2E Tests**: Playwright suite (`pnpm test:e2e` / `npx playwright test`) covers full flows for authentication (including Google OAuth buttons), intake forms, coupon validation, credits/gating, and admin controls. All E2E tests pass successfully.

---

## ✅ Completed Task: Google Supabase OAuth Login (2026-07-18)

### What Was Done
1. **Google Login button on Login Page**: Added a "Continue with Google" button to `/login` page with proper styling matching our Crimson & Saffron theme.
2. **Google Signup button on Signup Page**: Added the corresponding "Continue with Google" button to `/signup` page.
3. **Authentication Callback Error Handling**: Updated `/auth/callback/route.ts` to redirect to `/login?error=auth_failed` in the event of an exchange failure, with associated test coverage.
4. **Isolated Merge**: Performed the merge cleanly without bringing in any subscription plans, gating utilities, or schema migrations.
5. **E2E verification tests**: Created `tests/oauth.spec.ts` which runs on Playwright and verifies button visibility and correct text rendering.

### Verification Evidence
- `pnpm typecheck` -> ✅ 0 errors
- `pnpm lint` -> ✅ 0 errors (3 warnings)
- `pnpm test` -> ✅ 155/155 passed
- `npx playwright test tests/oauth.spec.ts` -> ✅ 3/3 passed

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

## ✅ Completed Task: WhatsApp LID-JID Code Review Fixes (2026-07-09)

### Issues Found & Fixed
Review of commits `2138724` + `63558f6` found 2 HIGH, 5 MEDIUM, 4 LOW issues. Fixed 7; skipped 4 (cosmetic or pre-existing/out-of-scope).

**Fixed:**
1. **[HIGH]** `actions.ts` duplicate-customer path now embeds existing welcome coupon code in `wa.me` prefilled message (was generic, broke LID fallback for returning customers).
2. **[HIGH]** `route.test.ts` coupon-fallback test mock fixed — `customers` now returns null for initial phone lookup so the coupon-code join fallback is actually exercised (was false-positive: customer found via normal path, fallback never reached).
3. **[MEDIUM]** `openwa.ts` `resolveLidPhone` — defensive multi-field parse (`data.phone || data.phoneNumber || data.number`) + logs unexpected response shape for runtime diagnosis.
4. **[MEDIUM]** `openwa.ts` `getStatus()` — checks `data.session?.status || data.status` to handle both wrapped and unwrapped OpenWA response shapes.
5. **[MEDIUM]** `route.ts` — removed dead `lidResolved` variable (set but never read).
6. **[MEDIUM]** `route.ts` — new LID customers now store raw `@lid` JID as phone (was LID digits → campaigns sent to invalid `@c.us` address).
7. **[LOW]** `route.ts` — simplified redundant `endsWith('@lid') || includes('@lid')` to `includes('@lid')`.

**Skipped (not needed):**
- `(coupon as any)` type bypass — cosmetic, works fine.
- Debug route dead catch block — harmless.
- `encodeURIComponent` on LID JID — Express decodes path params, works in practice.
- `validateWebhook` ignores signature — pre-existing, requires OpenWA webhook secret infra config, out of scope.

### Verification Evidence
- `pnpm exec tsc --noEmit --skipLibCheck` → ✅ 0 source errors
- `pnpm lint` → ✅ 0 errors (3 pre-existing warnings)
- `pnpm test` → ✅ **139/139 passed**

---

## ✅ E2E Testing Results (2026-07-09) — Phases A, B, E, F

All phases that don't require OpenWA gateway verified.

### Phase A — Static & Unit ✅
- `tsc --noEmit --skipLibCheck` → ✅ 0 source errors (only pre-existing `.next/dev/types/` auto-gen errors)
- `pnpm lint` → ✅ 0 errors, 3 pre-existing warnings
- `pnpm test` → ✅ **139/139 passed** (16 files)
- Key tests confirmed passing: LID+coupon fallback, resolveLidPhone suite, duplicate-phone path

### Phase B — Database Seed ✅
- Created restaurant `test-spice` in cloud Supabase (`oggwcgygkwxywmjdnaef`)
- ID: `0c100ea9-15f2-4d7a-998f-66667e0090a6`, `plan: trial`, `credits: 1000`, `is_suspended: false`
- whatsapp_number placeholder: `919999999999` (needs real OpenWA phone number)

### Phase E — Duplicate-Customer Form Path ✅
- Submitted form via browser with phone `+919876543211` → new customer + coupon `W10-DHYNIH` created
- Submitted same phone again → success page with wa.me link containing `W10-DHYNIH` (existing coupon)
- **Code verified at `actions.ts:68-78`**: duplicate 23505 branch queries existing coupon and embeds it in prefilled message
- DB confirms: 1 customer row, 1 coupon row (no duplicate)

### Phase F — Debug Status Route Auth Gate ✅
- **F1** — GET `/api/debug/whatsapp-status` without auth → **HTTP 401** `{"error":"unauthorized"}`
- **F2** — GET with `Bearer test-cron-secret-123` → **HTTP 200** with provider/session info (OpenWA reports fetch error because gateway is down, but route works correctly)

## ✅ OpenWA Gateway Running (2026-07-09)

OpenWA v0.8.8 is running at `http://localhost:2785/api` with session `restoloop` authenticated and `ready`.

### Running Services
```
OpenWA Gateway   -> http://localhost:2785/api   (status: ready, phone: 917542011085)
Next.js Dev      -> http://localhost:3000
ngrok Tunnel     -> https://selenious-adenophyllous-velva.ngrok-free.dev -> localhost:3000
```

### OpenWA API Key
```
X-API-Key: owa_k1_restoloop_real_2026
```

### Webhook Configured
- URL: `https://selenious-adenophyllous-velva.ngrok-free.dev/api/whatsapp`
- Events: `message.received`
- Retry: 3 attempts

### Test Restaurant Updated
- Slug: `test-spice`
- whatsapp_number: `917542011085` (OpenWA session's phone)

### Verified
- Text send via OpenWA API → ✅ `messageId: true_161258842124526@lid_3EB0F4D4EE001F780E7AAF_out`
- Debug route via ngrok → ✅ `status: "ready"`

### Ready for Phases C/D/G/H
The gateway, ngrok tunnel, webhook, and seed data are all set. Test flow:
1. Customer submits form at `/form/test-spice`
2. Taps wa.me link to `917542011085`
3. OpenWA forwards inbound to ngrok → webhook → sends welcome coupon back

---

## ✅ Completed Task: VPS OpenWA Gateway Deployment (2026-07-12)

### What Was Done
1. **Started Stack on VPS**: Logged into the AWS EC2 instance (`13.207.182.132`) and started the Docker Compose stack (`openwa-docker-proxy`, `openwa-api`, `openwa-caddy`).
2. **Resolved Caddy SSL Challenge Timeout**: Diagnosed a connection timeout in Caddy logs. Identified that ports 80 and 443 were blocked at the AWS Security Group level. Instructed the user to open these ports to `0.0.0.0/0` in the AWS console. Connection test succeeded, and Caddy successfully generated the SSL certificate for `https://wa.bluetideorg.com`.
3. **Resolved Chromium ARM64 Launch Failure**:
   - The `openwa-api` container was failing to launch the Puppeteer Chromium browser on the ARM64 Neoverse-N1 instance, returning `Failed to launch the browser process: Code: null`.
   - Permissions on `/root/.cache/puppeteer` were restricted (`drwx------` on `/root`).
   - We updated the local `docker-compose.yml` to set `read_only: false`, uploaded it to the VPS, recreated the containers, and ran `chmod 755 /root` inside the container.
   - To completely bypass any future Chromium stability issues on ARM64, we switched the OpenWA engine to `baileys` (a lightweight, native Node.js engine for WhatsApp) in `docker-compose.yml`.
4. **Created and Started Session**: Successfully created and initialized session `0b328bcd-5e4f-4110-9094-ea742bccc393` over HTTPS. The session generated its QR code and transitioned to status `qr_ready`.
5. **Wired Local Next.js**: Updated `.env.local` with:
   - `OPENWA_BASE_URL=https://wa.bluetideorg.com/api`
   - `OPENWA_SESSION_ID=49888e49-9620-48d2-96f8-aade09c6d302` (the DB UUID required by NestJS endpoints)
   - `OPENWA_API_KEY=owa_k1_bluetide_a7d8c6b4e9f02b3c`
6. **Verified Build & Tests**: Ran `pnpm typecheck` (0 errors), `pnpm lint` (0 errors, 3 warnings), and `pnpm test` (139/139 unit tests passed).

---

## ✅ Completed Task: WhatsApp Ban Prevention (2026-07-12)

### What Was Done
Implemented five layered defense mechanisms to prevent WhatsApp phone number bans:
1. **Double-Opt-In Hook**: restoran intake form now returns a `wa.me` link. When a customer messages the webhook, they receive a warm greeting + YES/Y prompt first. The actual coupon is only delivered after the customer replies YES or Y, removing the "Block/Report" banner from their screen.
2. **Opt-Out Gate**: If a customer's state in the database is `opted_out`, the intake form rejects their submission, preventing spam complaints.
3. **Dynamic Spintax Variation**: Created a pure `resolveSpintax` utility to inject randomized phrase variations (e.g. `{Hi|Hey|Hello}`) on all outbound messages (welcome, birthday, winback, expiry).
4. **Human-like Jitter via after()**: Restructured webhook handling to return `200 OK` instantly and schedule message sending inside Next.js `after()` with a 5-8 second randomized delay.
5. **Prior-Interaction Campaign Check**: All automated campaign jobs now verify that a customer has sent at least one inbound message to the restaurant WhatsApp (`direction = 'inbound'`) before triggering campaign sends.
6. **Hourly Batch Cron Schedule**: Spreads outbound campaigns by running Vercel Cron hourly instead of daily, processing a maximum batch size of 5 customers per restaurant per run, and deduping campaign sends daily.
7. **Verified Build & Tests**: Ran `pnpm typecheck` (0 errors), `pnpm lint` (0 errors, 3 warnings), and `pnpm test` (148/148 unit tests passed).

---

## ✅ Completed Task: Campaign Cron Fan-Out Dispatcher (2026-07-12)

### What Was Done
Converted the cron route handler at `src/app/api/cron/welcome-reminder/route.ts` from a single monolithic invocation to a self-invoking fan-out pattern:

- **Dispatcher mode** (no `restaurant_id`): Fetches all non-suspended restaurant IDs from Supabase, fires parallel `fetch()` self-invocations with each ID, returns immediately after `Promise.allSettled` (ensuring HTTP requests leave the process before Vercel terminates the function).
- **Worker mode** (`?restaurant_id=<id>`): Runs all four campaigns (welcome, birthday, winback, expiry) for that single restaurant — same logic as before, now isolated in its own serverless invocation with its own 300s timeout.
- Added `getBaseUrl()` helper (prefers `VERCEL_URL`, falls back to `NEXT_PUBLIC_SITE_URL`).
- Added `export const maxDuration = 300` to the route module.
- Updated `vercel.json` with `functions` config to grant explicit 300s timeout.
- Rewrote `route.test.ts` with 8 tests covering both modes (auth, worker success/error/order, dispatcher fan-out/empty/db-error).

### Verification Evidence
- `pnpm typecheck` → ✅ 0 errors
- `pnpm lint` → ✅ 0 errors (3 pre-existing warnings)
- `pnpm test` → ✅ **150/150 passed** (17 files)
- `pnpm build` → ✅ clean production build (24 routes)
- Committed: `rock-testing 1d802e5` — _feat: fan-out cron dispatcher — each restaurant gets its own serverless invocation_

---

## ✅ Completed Task: WhatsApp Delivery & LID JID Routing Fix (2026-07-13)

### What Was Done
Fixed silent message delivery failures caused by Baileys/WhatsApp API gateway dropping outbound messages sent to raw `@lid` JIDs:
- **Webhook Reply Routing (`src/app/api/whatsapp/route.ts`)**: Modified `replyTo` resolution to reply directly to the resolved standard `@c.us` phone JID (`fromPhone`) instead of the raw `@lid` JID whenever the sender's phone number can be successfully resolved. Falls back to raw LID JID only when the phone number cannot be resolved.
- **Unit Tests (`src/app/api/whatsapp/route.test.ts`)**: Updated the webhook route tests to assert that it correctly replies to the resolved phone number (`919876543210`) when the LID JID is successfully resolved via `senderPhone` or `resolveLidPhone`.

---

## ✅ Completed Task: Phone Normalization Across Forms (2026-07-13)

### What Was Done
Standardized phone input across all tenant and guest forms to accept raw 10-digit inputs (e.g. `9876543210`) as well as formats with `+91`, `91`, etc., and automatically normalize them to the `91` + 10-digit database format:
1. **Customer Intake Form (`src/app/form/[slug]/IntakeForm.tsx` & `actions.ts`)**:
   - Updated client-side validation regex to `/^(?:\+91|91)?\d{10}$/` and updated label/placeholder to `9876543210`.
   - Updated server-side Zod schema to validate `91\d{10}` format and run `normalizePhone()` on the input prior to parsing.
2. **Dashboard Add Guest Form (`src/app/dashboard/customers/page.tsx` & `actions.ts`)**:
   - Changed label to `WhatsApp Number *` and placeholder to `9876543210`. Increased input `maxLength` to `15` to support code prefixes.
   - Updated server-side action to run `normalizePhone()` before schema parsing.
3. **Create Restaurant Form (`src/app/dashboard/create/page.tsx`)**:
   - Updated number placeholder from `919876543210` to `9876543210` (server action already normalized phone inputs).
## ✅ Completed Task: WhatsApp Delivery & LID JID Routing Fix (2026-07-13)

### What Was Done
Fixed silent message delivery failures caused by Baileys/WhatsApp API gateway dropping outbound messages sent to raw `@lid` JIDs:
- **Webhook Reply Routing (`src/app/api/whatsapp/route.ts`)**: Modified `replyTo` resolution to reply directly to the resolved standard `@c.us` phone JID (`fromPhone`) instead of the raw `@lid` JID whenever the sender's phone number can be successfully resolved. Falls back to raw LID JID only when the phone number cannot be resolved.
- **Unit Tests (`src/app/api/whatsapp/route.test.ts`)**: Updated the webhook route tests to assert that it correctly replies to the resolved phone number (`919876543210`) when the LID JID is successfully resolved via `senderPhone` or `resolveLidPhone`.

---

## ✅ Completed Task: Phone Normalization Across Forms (2026-07-13)

### What Was Done
Standardized phone input across all tenant and guest forms to accept raw 10-digit inputs (e.g. `9876543210`) as well as formats with `+91`, `91`, etc., and automatically normalize them to the `91` + 10-digit database format:
1. **Customer Intake Form (`src/app/form/[slug]/IntakeForm.tsx` & `actions.ts`)**:
   - Updated client-side validation regex to `/^(?:\+91|91)?\d{10}$/` and updated label/placeholder to `9876543210`.
   - Updated server-side Zod schema to validate `91\d{10}` format and run `normalizePhone()` on the input prior to parsing.
2. **Dashboard Add Guest Form (`src/app/dashboard/customers/page.tsx` & `actions.ts`)**:
   - Changed label to `WhatsApp Number *` and placeholder to `9876543210`. Increased input `maxLength` to `15` to support code prefixes.
   - Updated server-side action to run `normalizePhone()` before schema parsing.
3. **Create Restaurant Form (`src/app/dashboard/create/page.tsx`)**:
   - Updated number placeholder from `919876543210` to `9876543210` (server action already normalized phone inputs).
4. **Unit Tests**:
   - Updated `src/app/form/[slug]/actions.test.ts` to assert against the new 10-digit input format and test normalization correctly.

---

## ✅ Completed Task: Webhook Resilience + Session Diagnostics (2026-07-13)

### Root Cause Found
Live debugging revealed the OpenWA Baileys session on VPS transitioned from `ready` → `qr_ready` (session expired/kicked) between 11:21 and 17:00 IST. During this window:
- The webhook URL was correct ✅
- The DB restaurant phone `919472673183` matched VPS session ✅  
- But the session lost auth → Baileys stopped forwarding inbound messages → zero webhook hits

### What Was Fixed
1. **`route.ts` — Webhook Diagnostic Logging**: Added `console.log('[WA-WEBHOOK]')` on every incoming event showing `from/to/fromPhone/toPhone/body` so the exact Baileys payload shape is visible in the Next.js dev terminal.
2. **`route.ts` — `OPENWA_SESSION_PHONE` fallback**: Added a 3rd restaurant lookup using `process.env.OPENWA_SESSION_PHONE` for cases where Baileys omits `event.to` (seen in group/broadcast contexts). DB lookup chain: `toPhone` → `fromPhone` → `OPENWA_SESSION_PHONE`.
3. **`.env.local`**: Added `OPENWA_SESSION_PHONE=919472673183`.
4. **`openwa-qr.html`**: Rebuilt as a live polling dashboard — auto-fetches VPS session status + QR every 5s, shows green "Connected" state with phone number when session is ready.

### Verification
- Local webhook test with `to: "919472673183@c.us"` → DB shows `inbound` + `outbound opt_in_prompt` logs ✅
- `pnpm typecheck` → 0 errors ✅

### Ops Runbook — Session Expired Recovery
1. Open `openwa-qr.html` in browser
2. Scan QR with WhatsApp (the phone holding `919472673183`)
3. Page turns green → session `ready` → messages flow again

---

## ✅ Completed Task: OpenWA → Meta Cloud API Migration (2026-07-13)

### What Was Done
Full eradication of OpenWA/Baileys and migration to the official **Meta WhatsApp Cloud API**:

1. **Deleted** `openwa.ts`, `openwa.test.ts`, `openwa-mock/` directory, `openwa-qr.html`
2. **Implemented** `meta.ts` — full `MetaAdapter`:
   - `sendText` → `POST graph.facebook.com/v20.0/{phoneNumberId}/messages` with `type: "text"`
   - `sendTemplate` → sends proper Meta template with `components` params
   - `validateWebhook` → HMAC-SHA256 via `x-hub-signature-256` header + parses nested Meta payload shape
   - `parseInbound` → extracts `from/body/messageId` from Meta's `entry[].changes[].value.messages[]`
   - `getStatus` → `GET /v20.0/{phoneNumberId}?fields=...` phone status check
   - `verifyWebhookChallenge` → GET verification handshake for Meta webhook setup
3. **Created** `meta.test.ts` — 19 tests covering all methods
4. **Updated** `adapter.ts` — default now `MetaAdapter`, no OpenWA fallback
5. **Updated** `types.ts` — removed `resolveLidPhone?` (LID is an OpenWA/Baileys concept, Meta gives real E.164 phones)
6. **Rewrote** `/api/whatsapp/route.ts`:
   - Stripped all `@lid` JID branching (40+ lines removed)
   - Removed `OPENWA_SESSION_PHONE` env fallback
   - Added `GET` handler for Meta webhook verification challenge
   - Updated signature header to `x-hub-signature-256`
7. **Updated** `/api/debug/whatsapp-status/route.ts` — reads `META_PHONE_NUMBER_ID` now
8. **Updated** `.env.local` — `OPENWA_*` → `META_*` env vars

### Env vars to fill in
Add to Vercel + `.env.local`:
- `META_PHONE_NUMBER_ID` — from Meta App > WhatsApp > API Setup
- `META_ACCESS_TOKEN` — permanent system user token
- `META_APP_SECRET` — from Meta App > Settings > Basic
- `META_VERIFY_TOKEN` — any random string, set same in Meta webhook config

### Verification Evidence
- `pnpm typecheck` → ✅ 0 errors
- `pnpm lint` → ✅ 0 errors (3 pre-existing warnings)
- `pnpm test` → ✅ **155/155 passed** (17 files)

---

## ✅ Completed Task: WhatsApp Meta Campaign Templates Setup (2026-07-14)

### What Was Done
1. **Configured template-based messaging** for campaigns in `src/lib/campaigns/index.ts`. Since Meta blocks free-text messages sent outside the 24-hour window from the user's last inbound message, campaigns initiated by cron (Birthday, Winback, Expiry, and Welcome Reminder) are updated to dynamically call `adapter.sendTemplate` instead of `adapter.sendText` when `WHATSAPP_PROVIDER === 'meta'`.
2. **Added comprehensive tests** in `src/lib/campaigns/index.test.ts` to assert that when in Meta mode, templates are successfully sent with their respective parameters, while other modes still use free-text `sendText`.
3. **Documented setup steps** and final copy variations for templates (`welcome_coupon`, `welcome_reminder`, `birthday_campaign`, `winback_campaign`, `expiry_reminder`) in [2026-07-14-whatsapp-meta-setup.md](file:///e:/desktop/Restoloop/docs/superpowers/plans/2026-07-14-whatsapp-meta-setup.md) and [campaign_Template.md](file:///e:/desktop/Restoloop/docs/campaign_Template.md).

### Verification Evidence
- `pnpm typecheck` → ✅ 0 errors
- `pnpm lint` → ✅ 0 errors (3 warnings)
- `pnpm test` → ✅ **159/159 passed**

---

## 📅 Next Steps

1. **Add Meta Credentials**: Fill in `META_PHONE_NUMBER_ID`, `META_ACCESS_TOKEN`, `META_APP_SECRET`, `META_VERIFY_TOKEN` in Vercel env vars and `.env.local`.
2. **Configure Meta Webhook**: In Meta App > WhatsApp > Configuration, set webhook URL to `https://<your-domain>/api/whatsapp` and verify token to `META_VERIFY_TOKEN`. Subscribe to `messages` events.
3. **Vercel Deployment**: Deploy latest branch with Meta migration to Vercel production.
