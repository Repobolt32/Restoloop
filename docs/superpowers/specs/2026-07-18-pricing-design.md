# Pricing Design — Restoloop

**Status:** Decided. Ready for implementation plan.

---

## Business Model

- Revenue comes from **credits** (1 credit = 1 WhatsApp message sent)
- You charge restaurants **₹3/credit**
- Meta charges you **₹0.85/credit**
- Your net margin: **₹2.15/credit**

---

## Plans

| Plan | Price | Base Credits/month | Target Restaurant |
|---|---|---|---|
| **Trial** | ₹599 one-time | Unlimited (21 days) | Any new signup |
| **Pro** | ₹999/month | 300 credits | ~50 customers/day |
| **Max** | ₹1,999/month | 700 credits | ~100–150 customers/day |
| **Ultra** | ₹2,999/month | 1,500 credits | ~200–300+ customers/day |

---

## Recharge Packs

Available only when restaurant has an active paid plan:

| Pack | Credits | Price |
|---|---|---|
| Starter | 500 | ₹1,500 |
| Growth | 1,000 | ₹3,000 |
| Power | 2,000 | ₹6,000 |

Rate: ₹3/credit flat. No bulk discount.

---

## Rules & Business Logic

1. **Manual renewals only** — no auto-debit/recurring. Each payment extends `plan_expires_at` by 30 days.
2. **Credits roll over** — unused credits persist across months, never wiped.
3. **Recharge requires active plan** — a restaurant must have `pro`/`max`/`ultra`/`trial` with `plan_expires_at > now()` to buy a recharge pack. `free` and `expired` cannot top up.
4. **When credits hit 0** — hard stop. Automated campaigns are blocked and logged as `blocked_no_credits`. No grace buffer.
5. **Trial plan** — unlimited messaging for 21 days. Credits not consumed. After trial expires, plan becomes `expired`.
6. **Expiry** — credits wallet is preserved even when plan expires. Campaigns are blocked. Restaurant must renew to resume.

---

## Database Changes Required

### `restaurants` table additions:
- `plan` — enum: `free | trial | pro | max | ultra | expired` (already exists, verify values)
- `plan_expires_at` — `timestamptz` (when current month or trial ends)
- `credits` — `integer` (already exists)

### New migration needed:
- Add `plan_expires_at` column if not present
- Add credit-deduction guard: check `credits > 0` before sending (already partially done via `deduct_credit` RPC)
- Recharge pack payment route: Razorpay order → webhook → `UPDATE restaurants SET credits = credits + N`

---

## UI Decisions

### Header Widget
- Show: `🪙 150` (no "cr" suffix — **remove "cr" from all UI**)
- Trial mode: `⚡ 21d` (days remaining)
- Warning: orange if `credits < 50`, red if `credits = 0`

### Billing UI Location
- `/dashboard/settings#billing` — primary in-app upgrade/recharge location
- `/pricing` — public landing page section (linked from marketing site)

### Settings Billing Section (3 cards):
1. **Current Plan card** — plan name, status, expiry date, credit balance, Upgrade + Buy Credits buttons
2. **Change Plan card** — Pro / Max / Ultra plan cards, current plan highlighted, clicking triggers Razorpay payment
3. **Recharge Credits card** — 3 pack buttons (500 / 1000 / 2000 credits). Disabled with tooltip if plan is `free` or `expired`.

### Plan Expired Banner (dashboard):
> *"Your [Plan] plan expired. Renew to keep campaigns running."* → **[Renew ₹999]**

### Public `/pricing` Page:
- 4-column comparison table (Trial / Pro / Max / Ultra)
- Note: *"Need more? Top up anytime from ₹1,500 for 500 messages."*

---

## What's NOT in scope (for now)
- Annual billing / discount
- Per-outlet multi-location pricing
- Automatic recurring subscriptions (UPI autopay)
- Credit expiry dates

---

## Next Steps (for implementation session)
1. Write migration: add `plan_expires_at`, verify `plan` enum values
2. Update `deduct_credit` logic to respect `trial` plan (skip deduction)
3. Build Razorpay routes for plan purchase + recharge pack purchase
4. Build `/dashboard/settings#billing` UI
5. Build `/pricing` public page
6. Update header widget to remove "cr" suffix
7. Add expired-plan banner to dashboard layout
