# Restoloop Bug Audit Report

**Date:** 2026-05-18
**Scope:** Full-stack audit — API routes, UI navigation, auth flows, data edge cases, multi-tenant RLS isolation
**Tester:** Systematic parallel testing protocol
**Server:** `http://localhost:3000`
**Tenant:** `antigravity-pizza` (`571a323b-9c8d-42af-9d64-655799017362`)

---

## Executive Summary

| Category | Count |
|----------|-------|
| CRITICAL | 0 |
| BUG | 3 |
| POLISH | 1 |
| PASS | 14 |

**All auth gates, RLS policies, data validation, and edge-case handlers are working correctly.** The 3 bugs are UX/dead-link issues, not security or data-integrity problems.

---

## BUG Findings

### BUG-1: `/api/version` Endpoint Missing

| | |
|---|---|
| **Severity** | BUG |
| **Location** | `apps/web/app/api/version/` — route does not exist |
| **Description** | Calling `GET /api/version` returns HTTP 404. No `route.ts` file exists for this path. |
| **Repro** | `curl http://localhost:3000/api/version` |
| **Expected** | JSON version string (e.g., `{ "version": "1.0.0" }`) |
| **Actual** | HTTP 404 |
| **Fix** | Create `apps/web/app/api/version/route.ts` or remove any frontend references to this endpoint. |

---

### BUG-2: Logout Button Does Not Redirect

| | |
|---|---|
| **Severity** | BUG |
| **Location** | `apps/web/components/stitch/StitchSidebar.tsx:97`<br>`apps/web/components/personal-account-dropdown-container.tsx:34` |
| **Description** | Clicking Logout calls `signOut.mutate()` which clears the Supabase session, but no client-side redirect follows. The user remains on the authenticated page (e.g., `/home/restaurant-profile`) until they manually refresh. |
| **Repro** | Log in → navigate to any `/home/*` page → click Logout button in sidebar |
| **Expected** | Redirect to `/auth/sign-in` immediately after successful sign-out |
| **Actual** | Page stays on `/home/restaurant-profile`; auth state drops silently |
| **Fix** | Wrap `signOut.mutate()` with `onSuccess` callback that calls `router.push('/auth/sign-in')` or reloads the page to trigger middleware redirect. |

---

### BUG-3: Settings Sidebar Link is Dead (404)

| | |
|---|---|
| **Severity** | BUG |
| **Location** | `apps/web/components/stitch/StitchSidebar.tsx:28` |
| **Description** | The sidebar includes a "Settings" nav item linking to `/home/settings`, but no page file exists at `apps/web/app/home/settings/page.tsx`. Clicking it renders a Next.js 404. |
| **Repro** | Navigate to any authenticated page → click "Settings" in sidebar |
| **Expected** | Settings page renders |
| **Actual** | Next.js 404 page |
| **Fix** | Either create `apps/web/app/home/settings/page.tsx` or remove the Settings link from `CORE_ITEMS` until the feature is built. |

---

## POLISH Finding

### POLISH-1: Multi-Tenant Helper Returns Oldest Tenant Only

| | |
|---|---|
| **Severity** | POLISH |
| **Location** | `apps/web/lib/tenant.ts:9-25` |
| **Description** | `getTenantForUser` silently returns the oldest tenant if a user owns multiple tenants. There is no UI to switch tenants, which could confuse restaurant owners managing multiple locations. |
| **Expected** | Either explicit tenant selector or at least a warning banner when multiple tenants exist. |
| **Actual** | Console warning only (`console.warn`). User sees data from oldest tenant with no indication. |
| **Fix** | Add tenant-switcher dropdown in sidebar, or block multi-tenant creation at the profile level. |

---

## Verified PASS — No Bugs Found

### API Endpoints

| Endpoint | Test | Result |
|----------|------|--------|
| `POST /api/leads` | Happy path with valid payload | 200, `{ success: true, couponCode: ... }` |
| `POST /api/leads` | Duplicate phone (`+919999999999`) | 400, `"You have already signed up for this restaurant."` — **gracefully handled, not raw 23505** |
| `POST /api/leads` | Malformed payload (short name, bad phone) | 400, structured Zod validation errors |
| `POST /api/coupons/validate` | No auth cookie | 401, `"Must be signed in to validate coupons."` |
| `POST /api/billing/confirm` | No auth cookie | 401, `"Must be signed in to confirm billing."` |
| `GET /api/dashboard/stats` | No auth cookie | 401, `"Unauthorized"` |
| `GET /api/cron/process-campaigns` | No `Authorization: Bearer` header | 401, `"Unauthorized"` |
| `POST /api/billing/confirm` | Empty `items` array | 400, `"Positive bill amount and at least one item are required."` |

### Auth & Middleware

| Test | Result |
|------|--------|
| Unauthenticated `GET /home` | Redirects to `/auth/sign-in?next=/home` (middleware working) |
| `/auth/sign-in` page load | Renders correctly with email/password form |

### Public Form

| Test | Result |
|------|--------|
| Valid slug `/form/antigravity-pizza` | Renders intake form correctly |
| Invalid slug `/form/nonexistent-slug-xyz123` | Renders custom 404: "Restaurant not found" with sign-up link |

### UI Navigation

| Test | Result |
|------|--------|
| Dashboard cards (Manual Add, Form Terminal, Billing System) | All navigate to correct routes (`/home/restaurant-profile`, `/home/billing`) |
| QR Flyer button on `/home/restaurant-profile` | Present and clickable |
| Sidebar active state highlight | `bg-orange-500/10` applied correctly to active nav item |

### Data Edge Cases

| Test | Result |
|------|--------|
| Dashboard stats with null `allCoupons` / `allBills` | Zero-filled arrays and `0` counts returned safely |
| Coupon validation with invalid code | 404 `"Invalid coupon code or does not belong to this restaurant."` |
| Coupon validation with redeemed code | 400 `"This coupon has already been redeemed."` |
| Cron secret enforcement | `Authorization: Bearer dev-cron-secret` required correctly |

### Multi-Tenant RLS Isolation

| Table | RLS Status | Policy Scope |
|-------|------------|--------------|
| `tenants` | Enabled | `owner_id = auth.uid()` |
| `customers` | Enabled | `tenant_id IN (user's tenants)` |
| `coupons` | Enabled | `tenant_id IN (user's tenants)` |
| `bills` | Enabled | `tenant_id IN (user's tenants)` |
| `message_log` | Enabled | `tenant_id IN (user's tenants)` |
| `platform_credits` | Enabled | No user policies (service-role only) |

**Security note:** A public-read coupon policy (`coupons_public_validate`) existed in the original v1 schema but was **dropped** via migration `20260318_drop_leaking_coupon_policy.sql`. No cross-tenant data leakage vectors detected in API code — all queries include `.eq('tenant_id', tenant.id)` or use `getTenantForUser` scoped lookups.

---

## Recommendations

1. **Fix BUG-2 (Logout redirect) first** — it's the most visible UX breakage.
2. **Create `/home/settings/page.tsx` or hide the link** — dead links erode trust.
3. **Decide on `/api/version`** — either implement it or remove frontend references.
4. **Consider POLISH-1** — if multi-tenant ownership is expected, build a tenant switcher; otherwise, enforce single-tenant per user.

---

*Report generated by systematic Restoloop testing protocol. All tests executed against local dev server at `http://localhost:3000`.*
