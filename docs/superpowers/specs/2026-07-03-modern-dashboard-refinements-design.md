# Design Specification: Dashboard Refinements & Discount Percentage Migration

**Date:** 2026-07-03  
**Status:** Under Review  
**Topic:** Relocating campaign settings, shifting discounts to percentages, adding revenue metrics, billing-centric validation, manual guest management, and visual polish.

---

## 1. Goal Description

This specification addresses a series of enhancements to the Restoloop owner journey. By transitioning from flat-rupee discounts to percentage-based ones, introducing billing logic, clean dashboard metrics, manual guest controls, and orange-accented active states, we elevate the SaaS app to feel premium and fit real-world restaurant workflows.

---

## 2. Component Design & User Flows

### 2.1 Campaigns Page Relocation & Layout
- **Path:** `/dashboard/campaigns`
- **Tabs:**
  1. **Performance / History (Default):** Stat blocks showing sent/delivered counts per campaign and the chronological message log list.
  2. **Campaign Settings:** Toggles (on/off) and delay offsets (days) for Welcome, Birthday, Winback, and Expiry campaigns, the WhatsApp prefill message editor, and the percentage configuration for all 3 campaigns.
- **Main Settings Page:** Focused purely on Restaurant Details, public URL, QR code download, and Razorpay credit packages.

### 2.2 Percentage-Based Discounts & DB Changes
- **Migration:** `supabase/migrations/005_discount_percentage.sql`
- **Toggles & Discounts:**
  - `restaurants.welcome_discount_percent` (int, default 10)
  - `restaurants.birthday_discount_percent` (int, default 15)
  - `restaurants.winback_discount_percent` (int, default 20)
  - `coupons.discount_percent` (int, default 10)
  - `coupons.bill_amount_cents` (int, nullable) - Stores the total POS bill when redeemed
  - `coupons.discount_amount_cents` (int, nullable) - Stores the calculated discount amount when redeemed
- **Coupon Code Gen:** Prefixed code structure changes: `W[Percent]-[Code]` (e.g. `W10-XF4Y`).

### 2.3 Dashboard Metric Overhauls
- **Overview Stat Cards:**
  1. **Retained Customers:** Total count of customers where `id` has at least one coupon with `status = 'redeemed'`.
  2. **Revenue This Month:** Total final paid revenue (sum of `bill_amount_cents - discount_amount_cents`) of all coupons redeemed in the current calendar month.
  3. **Coupons Sent:** Total count of coupons issued.
  4. **Redemption Rate:** Percentage of redeemed coupons over total sent.

### 2.4 Validate Coupon Page $\rightarrow$ Minimal POS Billing Flow
- **Fields:**
  - **POS Bill Amount (₹):** Numeric input (converted to cents internally).
  - **Coupon Code:** Text input.
- **Dynamic Breakdown:**
  - Original Price: ₹XXX.XX
  - Discount Applied: XX% (₹YY.YY)
  - Final Bill: ₹ZZ.ZZ
- **Redemption action:** Saves coupon's `bill_amount_cents` and `discount_amount_cents`.

### 2.5 Active Nav State & Card Hover Uplift
- **Sidebar Nav:** Highlighting active routes using a solid orange background (`#FF8C00`) with white text.
- **Interactive Chips / Buttons:** Selected filters on Coupons & Customers page apply solid orange styling (`bg-[--color-primary] text-white`).
- **Cards:** Lift transform `translateY(-4px)` with standard soft shadow transition.

### 2.6 Manual Guest Controls (Add, Search, Delete)
- **Add Guest Button:** Opens a modal. Validates: E.164 phone formats (91XXXXXXXXXX) and optionally birthday details.
- **Search Bar:** Real-time filter matching client-side or server-side by name/phone.
- **Delete Action:** Standard list action prompting confirmation, calling `deleteCustomerAction` which cascades or safely nullifies relations.

### 2.7 Professional Login Page
- Clean, focused form design.
- Inline Eye icon button toggling `type="password"` vs `type="text"`.

---

## 3. Required Tech Skills

- **supabase-postgres-best-practices:** DB migrations, schema fields, and RLS integrity.
- **server-actions:** Creating and refactoring mutations (add guest, delete guest, update discounts).
- **typescript-best-practices:** Enforcing strict type checks for new columns.
- **ui-ux-pro-max / frontend-design:** Vibrant soft-UI styling and interactive states.
