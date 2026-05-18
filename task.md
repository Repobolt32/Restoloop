# Restoloop QA Master Automation Checklist (`task.md`)

## 1. Prerequisites & Environment Verification
- [x] Verify dev server status (HTTP 200/302 on `http://localhost:3000`).
- [x] Fetch active test tenant context (`GET /rest/v1/tenants?limit=1`) via service key.

## 2. API Endpoints Comprehensive Verification
- [x] **GET /version:** Assert HTTP 200 OK and text/plain response.
- [x] **GET /api/cron/process-campaigns:**
  - [x] Unauthenticated: Assert HTTP 401 Unauthorized.
  - [x] Authenticated (Bearer dev-cron-secret): Assert HTTP 200 OK & `{ success: true }`.
- [x] **POST /api/leads:**
  - [x] Malformed Payload (`{}`): Assert HTTP 400 Bad Request & Zod error structure.
  - [x] Valid Payload (`{ tenantId, name, phone }`): Assert HTTP 200 OK & `{ success: true }`.
  - [x] Idempotency Check (exact duplicate phone): Assert HTTP 400 Bad Request & "already signed up".
- [x] **POST /api/coupons/validate:**
  - [x] Unauthenticated firewall check: Assert HTTP 401 Unauthorized.
  - [x] Authenticated valid coupon: Assert HTTP 200 OK & return discount, customer, tax details.
- [x] **POST /api/billing/confirm:**
  - [x] Unauthenticated firewall check: Assert HTTP 401 Unauthorized.
  - [x] Authenticated valid billing transaction: Assert HTTP 200 OK & database record creation.
- [x] **GET /api/dashboard/stats:**
  - [x] Unauthenticated firewall check: Assert HTTP 401 Unauthorized.
  - [x] Authenticated: Assert HTTP 200 OK & return revenue, customer count, charts.

## 3. UI Routes & Authentication Flows
- [x] **Security Firewall Checks (Negative Test):**
  - [x] Unauthenticated access to `/home`: Verify redirect to `/auth/sign-in`.
  - [x] Unauthenticated access to `/admin`: Verify redirect to `/auth/sign-in`.
- [x] **Public Intake Portal (`/form/[slug]`):**
  - [x] Render intake form without SSR errors (HTTP 200 OK).
  - [x] Complete E2E customer lead submission & verify success screen ("You're In!").
- [x] **Authenticated Core Workflows (`/home`, `/home/dashboard`, `/home/restaurant-profile`, `/admin`):**
  - [x] Sign in via UI (`dev@restoloop.com`).
  - [x] Assert Mission Control Home mounts correctly.
  - [x] Assert Dashboard Analytics page mounts correctly.
  - [x] Assert Restaurant Profile page mounts correctly (verifying multi-tenant `.single()` resilience).
  - [x] Assert Admin Control page mounts correctly.

## 4. POS Billing Operations & Multi-Tenant RLS Boundaries
- [x] **POS Billing Terminal E2E (`/home/billing`):**
  - [x] Mount POS Billing Terminal.
  - [x] Click "Add Entry" and input item pricing.
  - [x] Input coupon code (`WELCOME50`) & click "Verify".
  - [x] Intercept network response & assert HTTP 200 OK with accurate 50% discount.
  - [x] Click "Confirm Bill", intercept confirmation response, and verify success banner.
  - [x] Query Postgres `bills` table to verify actual database record creation with exact financial totals.
- [x] **Multi-Tenant Zero-Trust RLS Isolation:**
  - [x] Assert missing apikey header throws 401.
  - [x] Assert unauthenticated anon request returns empty array `[]` (zero rows leaked).
  - [x] Assert authenticated JWT returns strictly owned rows in `customers` and `coupons`.

## 5. Launch Finalization & Outreach Roadmap (Completed & Pending)
- [x] **Option B WhatsApp Click-to-Chat Flow (Intake UI & Redirect):**
  - [x] Update `/api/leads` to issue welcome coupons as `'pending'` and generate a WhatsApp `waUrl` containing a prefilled greeting message + the coupon code.
  - [x] Redesign `PublicIntakeForm` success screen to display a gorgeous, pulsating green `[💬 Save & Activate Coupon on WhatsApp]` button instead of the raw code.
- [x] **15-Day Welcome Coupon Outreach Campaign (Cron & 3rd Party API):**
  - [x] Implement a 15-day signup check in the daily cron campaign engine: trigger a reminder if the welcome coupon is still `pending` or `sent` (not yet `redeemed`).
  - [x] Build a 3rd-party WhatsApp Web API gateway interface in `lib/whatsapp.ts` to send raw, emoji-rich, template-free background campaign reminders.
  - [x] Exclude Birthday and 45-day Winback campaigns from reminders in v1.
- [ ] **Razorpay Credit Packages Billing Flow:**
  - [ ] Create `/home/billing/buy-credits` or `/home/credits` dashboard interface displaying Starter, Popular, and Growth pricing tiers.
  - [ ] Build `/api/billing/razorpay-order` to generate secure payment orders.
  - [ ] Build `/api/billing/razorpay-confirm` utilizing native `crypto` HMAC-SHA256 signature verification to securely credit the database `credits_balance`.
- [ ] **Printable Table QR Code Flyer Generator:**
  - [ ] Design a clean, custom QR code flyer download component in `/home/restaurant-profile`.
  - [ ] Generate print-ready PDF flyers dynamically containing the restaurant name, welcome coupon value, and high-res QR scanning link.
- [ ] **Production Marketing Landing Page:**
  - [ ] Replace root `/` shell with a stunning, premium dark-themed marketing landing page to recruit restaurant owners, detailing product loops and pricing tiers.

