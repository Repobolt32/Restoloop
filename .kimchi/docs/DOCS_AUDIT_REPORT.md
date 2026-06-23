# Documentation Misalignment Report (2026-06-22)

Cross-reference of docs/ folder against actual Supabase migrations, lib/, and app/ code.

**Corrected**: 5 of original 12 claims were false positives — verified against actual code before accepting.

**Found 6 real issues** — 1 code bug, 3 type gaps, 2 doc inaccuracies.

---

## 1. `restoloop.types.ts` — Missing `food_pref` in `Customer` interface

**Type definition gap**: `food_pref` column was added to `customers` table via migration `20260319_add_food_pref_column.sql`, but `lib/restoloop.types.ts` `Customer` interface does not include it.

```typescript
// lib/restoloop.types.ts — Customer interface (line 25-33)
export interface Customer {
    id: string;
    tenant_id: string;
    name: string;
    phone: string;
    birthday: string | null;
    last_visit: string;
    created_at: string;
    // food_pref is MISSING
}
```

**Fix**: Add `food_pref?: string;` to `Customer` interface.

---

## 2. `restoloop.types.ts` — Missing `bill_items` in `Coupon` interface

**Type definition gap**: Migration `20260308_add_billing_columns.sql` adds `bill_items JSONB` to the coupons table, but `lib/restoloop.types.ts` `Coupon` interface doesn't include it.

```typescript
// lib/restoloop.types.ts — Coupon interface (line 38-50)
export interface Coupon {
    id: string;
    tenant_id: string;
    customer_id: string;
    type: CouponType;
    code: string;
    discount: number;
    status: CouponStatus;
    bill_amount: number | null;
    created_at: string;
    expires_at: string;
    redeemed_at: string | null;
    // bill_items is MISSING — should be bill_items?: unknown;
}
```

**Fix**: Add `bill_items?: unknown;` (or proper Json type) to `Coupon` interface.

---

## 3. `DATABASE_SCHEMA.md` — Claims "No explicit indexes defined" (OUTDATED)

**Outdated doc claim**: `DATABASE_SCHEMA.md` says "No explicit performance indexes are defined yet." But migration `20260618011209_atomic_decrement_and_indexes.sql` creates 9 explicit indexes.

```sql
-- In migration file
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_last_visit ON customers(last_visit);
CREATE INDEX IF NOT EXISTS idx_customers_birthday ON customers(birthday);
CREATE INDEX IF NOT EXISTS idx_coupons_tenant_id ON coupons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_coupons_customer_id ON coupons(customer_id);
CREATE INDEX IF NOT EXISTS idx_coupons_type_status ON coupons(type, status);
CREATE INDEX IF NOT EXISTS idx_coupons_created_at ON coupons(created_at);
CREATE INDEX IF NOT EXISTS idx_message_log_tenant_id ON message_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_message_log_coupon_id ON message_log(coupon_id);
```

**Fix**: Update DATABASE_SCHEMA.md "Indexes" section to reflect actual indexes.

---

## 4. `DATABASE_SCHEMA.md` — Missing `decrement_platform_credits()` function documentation

**Function not documented**: Migration `20260618011209_atomic_decrement_and_indexes.sql` creates a `decrement_platform_credits()` PL/pgSQL function for atomic credit deduction (prevents race conditions). `DATABASE_SCHEMA.md` doesn't document it.

```sql
-- In migration file
CREATE OR REPLACE FUNCTION decrement_platform_credits()
RETURNS TABLE(new_balance INTEGER) AS $$
BEGIN
    RETURN QUERY
    UPDATE platform_credits
    SET balance = balance - 1
    WHERE id = (SELECT id FROM platform_credits ORDER BY id LIMIT 1)
    AND balance > 0
    RETURNING balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Fix**: Add `decrement_platform_credits()` function to DATABASE_SCHEMA.md under a "Functions" section.

---

## 5. `app/api/leads/route.ts` — Welcome Coupon Code Hardcodes `W50-` (BUG)

**Code bug**: `BUSINESS_RULES.md` says welcome codes use format `W{amount}-{6 chars}` (e.g., `W50-ABC123`, `W100-XYZ789`). But the actual code **hardcodes `W50-` regardless of actual discount amount**:

```typescript
// app/api/leads/route.ts line ~62
const discountAmount = tenant?.coupon_welcome || 50;

// line ~69 — BUG: ignores discountAmount
const generatedCouponCode = `W50-${randomSuffix}`;
```

If a tenant's `coupon_welcome` is ₹100, the code still generates `W50-ABC123`. The docs are correct (describing intended format); the implementation is buggy.

**Fix**: Change line 69 to:
```typescript
const generatedCouponCode = `W${discountAmount}-${randomSuffix}`;
```

---

## 6. `DEVELOPER_GUIDE.md` — Missing `instrumentation.ts` Documentation

**Gap**: `ARCHITECTURE.md` mentions `instrumentation.ts` for error tracking, but `DEVELOPER_GUIDE.md` doesn't document it in the project structure or debugging section.

**Fix**: Add `instrumentation.ts` to the project structure in DEVELOPER_GUIDE.md and explain its purpose.

---

## Verified False (Original Claims That Were Wrong)

These were in my initial audit but are incorrect:

| # | My Claim | Why It's Wrong |
|---|----------|---------------|
| 6 | Platform credits not decremented for 15-day reminders | **False**. `campaigns.ts:234` computes `totalSent = winbackSent + bdaySent + reminderSent`, then loops `decrement_platform_credits` for all three. Reminders ARE included. |
| 7 | `customerPhone` not returned by validate endpoint | **False**. `validate/route.ts:101` returns `customerPhone: customerInfo?.phone \|\| 'Unknown'` |
| 8 | Stale path for `update-profile.ts` | **False**. File exists at exactly `app/home/restaurant-profile/_actions/update-profile.ts` |
| 9 | Directory structure paths in ARCHITECTURE.md are stale | **False**. Paths match actual structure |
| 11 | `withCsrfMiddleware` may not exist | **False**. Exists as a local function at `middleware.ts:76`, called at line 28 |

---

## Summary Table

| # | File | Issue | Severity | Type | Status |
|---|------|-------|----------|------|--------|
| 1 | `restoloop.types.ts` | Missing `food_pref` in `Customer` interface | Medium | Type gap | **Real** |
| 2 | `restoloop.types.ts` | Missing `bill_items` in `Coupon` interface | Medium | Type gap | **Real** |
| 3 | `DATABASE_SCHEMA.md` | Claims no explicit indexes exist (outdated) | Low | Doc inaccuracy | **Real** |
| 4 | `DATABASE_SCHEMA.md` | Missing `decrement_platform_credits()` function doc | Medium | Missing doc | **Real** |
| 5 | `app/api/leads/route.ts` | Welcome code hardcodes `W50-` instead of dynamic amount | **Bug** | Code bug | **Real** |
| 6 | `DEVELOPER_GUIDE.md` | Missing `instrumentation.ts` documentation | Low | Missing doc | **Real** |

---

## Recommended Actions

**Immediate (bugs to fix):**
- [ ] Fix `app/api/leads/route.ts` line 69 to use dynamic discount amount in coupon code

**This sprint:**
- [ ] Add missing `food_pref?: string;` to `Customer` interface in `restoloop.types.ts`
- [ ] Add missing `bill_items?: unknown;` to `Coupon` interface in `restoloop.types.ts`

**Next cleanup:**
- [ ] Update `DATABASE_SCHEMA.md` indexes section to reflect actual 9 indexes
- [ ] Add `decrement_platform_credits()` function documentation to `DATABASE_SCHEMA.md`
- [ ] Add `instrumentation.ts` to `DEVELOPER_GUIDE.md` project structure