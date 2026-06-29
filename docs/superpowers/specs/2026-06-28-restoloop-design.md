# Restoloop Design Spec — 2026-06-28

> WhatsApp-first customer winback engine for Indian restaurants. Tier-2/3 target, owner-operated, "set and forget".

---

## 1. Architecture & Modules

**Stack:** Next.js (App Router) + Supabase (Postgres + auth + RLS) + Vercel cron

**Architecture:** Monolith — Server Actions + Route Handlers, single repo, single deploy

**WhatsApp:** OpenWA self-host (dev) → Meta Cloud API (prod) via adapter pattern. Swap via `WHATSAPP_PROVIDER=openwa|meta` env var.

**Monetization:** Monthly subscription tiers (not pay-per-credit). Owner self-serve top-up via Razorpay.

### Modules

| Module | Purpose |
|--------|---------|
| `auth` | Supabase auth (email/password, Google OAuth) |
| `restaurants` | Owner profile, restaurant settings, credits, plan |
| `customers` | Per-restaurant customer list, opt-in status, visit history |
| `coupons` | Campaign-generated codes, validation, redemption tracking |
| `campaigns` | Cron-driven triggers (welcome reminder, birthday, winback) |
| `whatsapp` | Adapter pattern (OpenWA / Meta), webhook handler, message logging |
| `billing` | Razorpay integration, credit top-up, webhook handler |
| `admin` | Super admin panel (restaurant list, credit management) |

---

## 2. Data Model

### 4 Core Tables

**restaurants**
- `id` (uuid, PK)
- `owner_id` (uuid, FK auth.users)
- `name`, `address`, `phone`, `email`
- `slug` (auto-generate from name, owner can edit, UNIQUE)
- `whatsapp_number` (E.164 format `91xxx`, no `+`)
- `welcome_discount_cents`, `birthday_discount_cents`, `winback_discount_cents`
- `credits` (integer, starts at 1000 free)
- `plan` (free / starter / pro)
- `created_at`, `updated_at`

**customers**
- `id` (uuid, PK)
- `restaurant_id` (uuid, FK)
- `phone` (E.164 format `91xxx`, no `+`)
- `name` (nullable)
- `opt_in_status` (pending / opted_in / opted_out)
- `birthday_month` (int, nullable), `birthday_day` (int, nullable)
- `food_preference` (nullable)
- `last_visit_at` (timestamp, nullable)
- `created_at`, `updated_at`
- UNIQUE (`restaurant_id`, `phone`)

**coupons**
- `id` (uuid, PK)
- `restaurant_id` (uuid, FK)
- `customer_id` (uuid, FK)
- `type` (welcome / birthday / winback)
- `code` (UNIQUE, format varies by type)
- `discount_cents` (integer)
- `status` (sent / redeemed / expired)
- `expires_at` (timestamp)
- `redeemed_at` (timestamp, nullable)
- `created_at`

**message_logs**
- `id` (uuid, PK)
- `restaurant_id` (uuid, FK, nullable)
- `customer_id` (uuid, FK, nullable)
- `direction` (inbound / outbound)
- `type` (opt_in_prompt / opt_in_confirm / opt_out / campaign / manual)
- `status` (sent / failed / blocked_no_credits / parse_error)
- `provider_message_id` (UNIQUE, dedupe webhooks)
- `error` (nullable)
- `created_at`

### Key Design Choices
- All money in `cents` (integer) — no float bugs
- Phone E.164 format `919876543210` (no `+`)
- `customers.last_visit_at` drives winback 40-day timer, updated on coupon redeem
- `birthday` as MM-DD — year optional, cron matches regardless
- RLS enforced at DB level (`owner_id = auth.uid()`)
- Same phone can be customer at 2 restaurants (UNIQUE per `restaurant_id`)
- `restaurants.slug` powers public `/form/[slug]` intake fallback URL

---

## 3. Webhook Flow + Campaign Engine

### WhatsApp Opt-In Flow

1. Customer scans QR → opens WhatsApp DM with restaurant number → sends any message
2. Webhook receives → lookup restaurant by `whatsapp_number`
3. If unknown restaurant → log `restaurant_id = null`, return 200 OK, no reply
4. If valid restaurant → auto-reply opt-in prompt:
   > "Reply YES to receive exclusive coupons from [Restaurant]. Reply STOP to opt out."
5. Customer replies "YES" → update `opt_in_status = opted_in` → send welcome coupon immediately
6. Customer replies "STOP" → update `opt_in_status = opted_out` → skip in all future campaigns
7. Customer can rejoin by replying "YES" again

### Campaign Triggers (Daily Cron)

**Schedule:** 10am IST = 04:30 UTC daily

**Welcome Reminder (25 days)**
- Trigger: `created_at` is 25 days ago
- Condition: Welcome coupon exists with `status = sent`, not redeemed
- Action: Send reminder message with coupon code
- Expiry: 30 days from creation

**Birthday (today)**
- Trigger: `birthday_month` + `birthday_day` matches today
- Condition: No birthday coupon for this customer this year (check `coupons` table)
- Action: Generate coupon + send message
- Expiry: 7 days

**Winback (40 days)**
- Trigger: `last_visit_at` is 40+ days ago (or null = never visited)
- Condition: No winback coupon for this customer in last 7 days
- Action: Generate coupon + send message
- Expiry: 7 days

### Coupon Code Format
- **Welcome:** `W{amount}-{6 chars}` (e.g., `W50-ABC123`)
- **Campaign (birthday/winback):** 8 chars, uppercase + digits, excluding I/O/0/1 (visual confusion)
- All codes UNIQUE across system (DB constraint)

### Credit Logic
- Welcome coupon send: 0 credits (free onboarding)
- Campaign send (birthday/winback/reminder): 1 credit
- Before send: `SELECT credits FROM restaurants WHERE id = $1 FOR UPDATE`
- If `credits > 0`: deduct, send, log `sent`
- If `credits = 0`: log `blocked_no_credits`, no send
- Never go negative

### Opt-Out Link (Every Message)
Every outbound message includes opt-out link to reduce WhatsApp ban risk:
> "Reply STOP to stop receiving messages from [Restaurant]"

### Webhook Dedupe
- Adapter extracts `provider_message_id` from raw webhook payload
- INSERT into `message_logs` with UNIQUE constraint on `provider_message_id`
- Duplicate INSERT fails → return 200 OK, no double-send
- No app-level idempotency table needed

---

## 4. Dashboard UI

**Mobile-first** (owner checks during service on phone). No native app.

### 5 Surfaces

**1. Login/Signup** (`/login`, `/signup`)
- Email + password (Supabase auth)
- Signup flow: account → restaurant profile → dashboard (3 steps)

**2. Dashboard Hub** (`/dashboard`)
- 3 quick-action cards: **Add Customer**, **Active Guests**, **Coupons**
- Top: credit balance (X / 1000 free) with low-credit warning under 100
- Recent activity feed (last 5 sends)

**3. Active Guests** (`/dashboard/customers`)
- Table: customers with `opted_in` status + unredeemed coupon
- Columns: name, phone (masked last 4 digits), last visit, active coupon code, status
- Tap row → customer detail
- Search by name/phone

**4. Coupons** (`/dashboard/coupons`)
- Table: all coupons ever issued
- Filter chips: All / Welcome / Birthday / Winback
- Columns: code, customer (masked phone), discount, status, created, expires
- Tap → detail

**5. Settings** (`/dashboard/settings`)
- Restaurant profile edit (name, address, phone, email)
- Coupon amounts (welcome/birthday/winback in ₹)
- Public intake URL display + copy button
- Opt-out message template (editable)
- WhatsApp number
- Slug (auto-generated, owner can edit)
- Plan info + "Buy more credits" button (Razorpay checkout)
- Stats: total customers, total coupons sent, redemption rate %, active customers (last 30d)

### Public Intake Form
**URL:** `/form/[slug]` (e.g., `/form/the-golden`)
- No auth
- 4 fields: name (required), WhatsApp number (required, +91), birthday MM-DD (optional), food preference (optional)
- On submit: create `pending` customer + welcome coupon, return Click-to-Chat link with prefilled "hello" message
- Tap link → opens WhatsApp DM → starts opt-in flow

### Super Admin
**URL:** `/admin`
- List all restaurants (name, credits, plan, signup date)
- Tap → detail
- "Add credits" button (comp credits, no payment)
- No customer-level access (privacy)
- Same shell as owner dashboard, different nav

### Coupon Validation
**URL:** `/dashboard/validate` or `/v/[code]`
- Staff enters coupon code
- System verifies: exists, belongs to restaurant, not redeemed, not expired
- Confirm screen → mark `redeemed` + update `last_visit_at`
- Optimized for speed (4 taps max)

### Customer Detail
**URL:** `/dashboard/customers/[id]`
- Full history: messages sent, coupons, opt-in status
- Edit fields: birthday, name
- "Send manual coupon" action (uses 1 credit)

### Coupon Detail
**URL:** `/dashboard/coupons/[id]`
- Code, customer, type, amount, status, created, expires, redeemed_at

### Decisions
- **Mask phone** in tables (last 4 digits only) for privacy
- **Optimistic UI** on credit add / coupon send, rollback on error
- **No charts/analytics MVP** — just tables + counters
- **Settings split** from dashboard to avoid 12-field wall
- **Visual design** deferred to `ui-ux-pro-max` + `frontend-design` skills at implementation time (user rejects old coral/navy/Inter/Stitch system)

---

## 5. Error Handling

### 8 Scenarios

**1. Webhook send fails** (WhatsApp API down/rejects)
- Log `message_logs.status = failed` with error
- Don't deduct credit
- Owner sees "send failed" in message log
- No retry (avoids spam risk)
- If permanent fail (number blocked) → mark customer `opted_out`

**2. Webhook receives for unknown restaurant** (wrong number)
- Log `message_logs` with `restaurant_id = null`
- Return 200 OK to provider
- Send no reply
- Don't crash, don't leak data

**3. Webhook malformed payload** (provider bug, MITM)
- Validate via adapter's `validateWebhook()`
- Signature fail → return 401, no log
- Shape invalid → return 200, log as `parse_error`, alert owner via dashboard banner

**4. Cron job crashes mid-run** (DB timeout, OOM)
- Vercel cron retries on failure
- Each campaign processed in own transaction
- Partial run = some customers got coupons, some didn't
- Next day's run picks up rest (idempotency via UNIQUE constraint per customer + campaign_type + day)

**5. Customer redeems expired/invalid coupon** at counter
- Validation screen shows specific reason: "expired" / "not found" / "already redeemed" / "wrong restaurant"
- No partial redeem
- Log attempt

**6. Credit deduction race** (2 sends at once, owner has 1 credit)
- DB transaction with `SELECT ... FOR UPDATE` on `restaurants.credits`
- Whichever wins gets deducted, other fails with `insufficient_credits`
- Log `blocked_no_credits`
- Never go negative

**7. OpenWA ban / Meta number blocked**
- Admin alert via dashboard banner
- Owner can switch to alternate provider (env flip)
- All queued sends marked `failed_provider_blocked`

**8. Razorpay payment webhook fails signature**
- Return 400, no credit add
- Log alert
- Failed but legit payment → owner contacts support with order ID

### Guiding Decisions
- **No automatic retries** on outbound sends (WhatsApp bans)
- **Idempotency at DB level** (UNIQUE constraints), not app level
- **All errors logged**, all errors visible somewhere
- **No silent failures** — every fail path has user-visible signal

---

## 6. Testing Strategy

**Approach:** Defer testing for MVP. Build first, test later.

**When to test:**
- After shipping core features (webhook, campaigns, dashboard)
- When bugs appear in production
- Before scaling to 100+ restaurants

**What to test first (high-risk paths):**
- Campaign trigger logic (date math, dedupe)
- Credit deduction (race conditions)
- Webhook handler (dedupe, unknown restaurant, malformed payload)
- RLS isolation (Restaurant A can't see Restaurant B's data)

**What to defer:**
- Dashboard UI (smoke tests only, Playwright)
- Coupon validation (manual QA until first bug)
- Billing (Razorpay has sandbox, test manually)

**Rationale:**
- Solo dev, <100 restaurants MVP
- Faster time-to-first-customer
- Clean code = easy to add tests later
- Bugs in production = fast manual fixes at this scale

---

## 7. Locked Decisions Summary

| Decision | Value |
|----------|-------|
| Target | Tier-2/3 small Indian restaurants (no POS, owner-operated) |
| Stack | Next.js (App Router) + Supabase + Vercel cron |
| Architecture | Monolith (Server Actions + Route Handlers) |
| WhatsApp | OpenWA (dev) → Meta Cloud API (prod), adapter pattern |
| Monetization | Monthly subscription tiers + Razorpay self-serve top-up |
| Slug | Auto-generate from name, owner can edit |
| Birthday | MM-DD, year optional |
| Initial credits | 1000 free on signup |
| Webhook dedupe | UNIQUE on `message_logs.provider_message_id` |
| Cron schedule | 10am IST = 04:30 UTC daily |
| Payment provider | Razorpay (India-native, UPI/cards) |
| Opt-out link | Every outbound message (reduce ban risk) |
| Stats | Show on owner profile page, no dedicated analytics screen |
| Testing | Defer for MVP, test high-risk paths after shipping |
| Visual design | Deferred to `ui-ux-pro-max` + `frontend-design` skills |

---

## 8. Out of Scope (MVP)

- SMS or email channels
- Advanced analytics (charts, funnels, cohort analysis)
- Native mobile app
- Multi-location support per tenant
- Staff or team accounts
- Advanced coupon rules (usage limits, stacking, minimum order)
- POS integration or billing module
- Public API for third-party integrations
- Load testing
- Automated test suite (deferred, see Section 6)

---

**Spec written 2026-06-28. Ready for user review.**
