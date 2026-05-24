---
name: Active Guests Page Design
description: Replace generic customer list with high-actionability "Active Guests" — customers who have active coupons ready to redeem.
type: project
---

# Active Guests Page Design

## Problem
Original "Customers" page planned as generic database table (name, phone, birthday, last visit). Low actionability for restaurant owner. Owner doesn't need to browse 200 customers — they need to know "who has a coupon that might expire soon?"

## Solution
Page renamed "Active Guests". Shows only customers with `status='sent'` coupons that have not yet expired. Top 10, sorted by expiry soonest. Gives owner a daily actionable view.

## Data Model

Query joins `coupons` + `customers`:

```sql
SELECT
  c.id,
  c.code,
  c.discount,
  c.type,
  c.expires_at,
  cust.name,
  cust.phone
FROM coupons c
JOIN customers cust ON c.customer_id = cust.id
WHERE c.tenant_id = ?
  AND c.status = 'sent'
  AND c.expires_at > now()
ORDER BY c.expires_at ASC
LIMIT 10;
```

## UI

### Page: `/home/customers`

Server Component fetches data directly via `createClient()` + `getTenantForUser()`.

**Columns:**
| Column | Source | Format |
|--------|--------|--------|
| Name | `customers.name` | plain text |
| Phone | `customers.phone` | plain text |
| Code | `coupons.code` | monospace, bold |
| Discount | `coupons.discount` | `₹{discount} OFF` |
| Expires In | `coupons.expires_at` | "2 days", "5 hours" relative |
| Type | `coupons.type` | Badge: Welcome (blue), Birthday (pink), Winback (orange) |

**Empty state:** "No active coupons right now. Campaigns run daily — check back tomorrow."

**No search, no pagination, no sorting controls.** List is always ≤10 rows. Sort is fixed (expiry ascending).

## Sidebar & Navigation

- Sidebar label changed from "Customers" → "Active Guests"
- Home page card title changed from "Customers" → "Active Guests"
- Home page card description changed from "View and manage your customer database." → "See who's ready to redeem a coupon."

## Files Changed

| File | Change |
|------|--------|
| `app/home/customers/page.tsx` | New — Server Component with Supabase query |
| `app/home/page.tsx` | Card title + description |
| `components/stitch/StitchSidebar.tsx` | Nav label |
| `docs/2-UI-UX-Design-Spec.md` | Customers → Active Guests |
| `docs/6-Implementation-Plan.md` | M3 scope update |
| `PROJECT_DECISIONS.md` | Customers Page Decision → Active Guests |

## Out of Scope

- Full customer database search (deferred — low value for MVP)
- Pagination (not needed with ≤10 rows)
- Sorting controls (fixed sort by expiry)
- Inline editing
- API routes (Server Component queries Supabase directly)
