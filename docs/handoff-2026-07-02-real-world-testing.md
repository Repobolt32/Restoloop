# Restoloop Real-World Testing Handoff — 2026-07-02

> Session ended after writing 64 unit/integration tests (mocked). Next session: write real-world integration tests against live Supabase DB.

---

## Where We Are

✅ **Slices 1–8 implemented** — core app working
✅ **Slice 9–16 plans written** — skill references + context7 MCP added to each
✅ **64 mocked tests written** — all passing (`pnpm test`)
✅ **8 test files committed** — colocated with source in `src/**/*.test.ts`

❌ **Real-world integration tests not written** — mocked tests don't verify actual DB behavior
❌ **RLS policies never tested** — mocked tests bypass RLS entirely
❌ **`deduct_credit` RPC never tested** — atomic deduction + race conditions unverified
❌ **DB constraints never tested** — unique violations, FK integrity unverified
❌ **WhatsApp adapter never tested against real OpenWA** — mocked `sendText` always returns success

---

## What We Have (Mocked Tests — 8 Files, 64 Tests)

| File | Tests | What it covers |
|------|-------|----------------|
| `src/lib/utils.test.ts` | 6 | `maskPhone` edge cases |
| `src/lib/whatsapp/openwa.test.ts` | 10 | `validateWebhook`, `sendTemplate`, `sendText` HTTP outcomes |
| `src/lib/whatsapp/adapter.test.ts` | 3 | Factory: meta vs openwa vs default |
| `src/lib/campaigns/index.test.ts` | 12 | All 3 campaigns: eligibility, credit guards, dedupe windows, RPC fallback |
| `src/app/form/[slug]/actions.test.ts` | 8 | Zod schema, `submitIntakeForm` flows |
| `src/app/dashboard/validate/actions.test.ts` | 8 | Coupon guards: not found, wrong restaurant, redeemed, expired, success |
| `src/app/dashboard/create/actions.test.ts` | 9 | `slugify`, Zod schema |
| `src/app/api/whatsapp/route.test.ts` | 8 | Webhook: duplicate, unknown restaurant, new customer, YES/STOP/pending flows |

**Run:** `pnpm test` — all 64 pass.

---

## What's Missing (Real-World Tests)

### Why mocked tests aren't enough

Mocked tests verify **application logic branching** but NOT:
- Actual Supabase query correctness (joins, filters, date math)
- RLS policy enforcement (Owner A can't see Owner B's data)
- `deduct_credit` RPC atomicity (row locking, race conditions)
- DB constraint enforcement (unique violations, FK cascades)
- Real WhatsApp message delivery
- Real coupon expiry against DB timestamps

### Real-world test files to create

```
tests/
  integration/
    setup.ts                        ← seed/cleanup helper (service role client)
    campaigns.real.test.ts          ← real DB: welcome, birthday, winback campaigns
    webhook.real.test.ts            ← real DB: full webhook flow end-to-end
    form.real.test.ts               ← real DB: form submission → customer + coupon
    validate.real.test.ts           ← real DB: coupon validation guards
    rls.real.test.ts                ← real DB: RLS policy enforcement
    deduct-credit.real.test.ts      ← real DB: RPC atomic deduction + error cases
    constraints.real.test.ts        ← real DB: unique violations, FK integrity
```

---

## Supabase Credentials (from `.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://oggwcgygkwxywmjdnaef.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<in .env.local>
SUPABASE_SERVICE_ROLE_KEY=<in .env.local>
```

**Test user:** `iamkumarankit1502@gmail.com` / `Ankit@2032` (existing owner)

**Test restaurant:** `slug: spice-garden` (existing, owner_id maps to test user)

---

## Database Schema (for reference)

### Tables
- **restaurants** — `id, owner_id, name, slug, whatsapp_number, credits, *_discount_cents, *_enabled, *_days`
- **customers** — `id, restaurant_id, phone, name, opt_in_status, birthday_month, birthday_day, last_visit_at` — UNIQUE(restaurant_id, phone)
- **coupons** — `id, restaurant_id, customer_id, type, code, discount_cents, status, enabled, expires_at, redeemed_at` — UNIQUE(code)
- **message_logs** — `id, restaurant_id, customer_id, direction, type, status, provider_message_id, error, coupon_id` — UNIQUE(provider_message_id)

### RLS Policies (from `002_rls_policies.sql`)
- Owners CRUD own restaurants: `owner_id = auth.uid()`
- Owners CRUD own customers: `restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())`
- Owners CRUD own coupons: same subquery pattern
- Owners view message_logs: same OR `restaurant_id IS NULL`
- System insert message_logs: `check(true)` — any authenticated user

### RPC Function (from `003_deduct_credit.sql`)
- `deduct_credit(restaurant_id uuid)` — `SELECT ... FOR UPDATE` row lock, decrements credits by 1
- Raises `restaurant_not_found` if UUID doesn't exist
- Raises `insufficient_credits` if credits <= 0

### DB Constraints
- `UNIQUE(restaurant_id, phone)` on customers — prevents duplicate phone per restaurant
- `UNIQUE(code)` on coupons — prevents coupon code collision
- `UNIQUE(provider_message_id)` on message_logs — dedupes webhook messages

---

## Test Helper Design (`setup.ts`)

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Seed: creates TEST_restaurant, TEST_customers, TEST_coupons
// All prefixed with "TEST_" for easy identification
// Returns: { restaurantId, customerId, couponCode, ownerId }

// Cleanup: deletes all rows where name/code/phone starts with "TEST_"
// Runs after each test via afterEach()
```

### Test data naming convention
- Restaurant name: `TEST_Restaurant_{timestamp}`
- Customer name: `TEST_Customer_{timestamp}`
- Phone: `+91TEST{timestamp.slice(-10)}`
- Coupon code: `TEST_{random}`
- Slug: `test-slug-{timestamp}`

---

## Real-World Test Scenarios

### 1. `campaigns.real.test.ts`
- Seed customer signed up 25 days ago with unredeemed welcome coupon
- Run `runWelcomeReminders()` against real DB
- Assert: message_log inserted with `type='welcome_reminder'`, `status='sent'`
- Assert: credits decremented by 1
- Seed customer with 0 credits → run → assert `blocked_no_credits` logged
- Seed birthday customer (today's date) → run `runBirthdayCampaigns()` → assert coupon created
- Seed customer with winback coupon sent 3 days ago → run → assert skipped (7-day dedupe)

### 2. `webhook.real.test.ts`
- Simulate inbound message from unknown number → assert customer created with `opt_in_status='pending'`
- Simulate YES from that customer → assert `opt_in_status='opted_in'`, welcome coupon exists
- Simulate duplicate `provider_message_id` → assert DB rejects (unique constraint)
- Simulate STOP → assert `opt_in_status='opted_out'`

### 3. `form.real.test.ts`
- Submit valid form → assert customer created with `opt_in_status='opted_in'`, welcome coupon created
- Submit duplicate phone → assert `23505` error handled, returns waUrl
- Submit invalid phone (no +91) → assert Zod rejects

### 4. `validate.real.test.ts`
- Validate valid coupon → assert `status='redeemed'`, `redeemed_at` set, customer `last_visit_at` updated
- Validate expired coupon → assert `{error: 'Expired'}`
- Validate already redeemed → assert `{error: 'Already redeemed'}`
- Validate coupon from different restaurant → assert `{error: 'Wrong restaurant'}`

### 5. `rls.real.test.ts`
- Create restaurant as Owner A
- Create customer + coupon for Owner A
- Authenticate as Owner B → query customers → assert empty result
- Authenticate as Owner B → query coupons → assert empty result
- Use service role → assert all data visible

### 6. `deduct-credit.real.test.ts`
- Create restaurant with credits=10 → call `deduct_credit` → assert credits=9
- Create restaurant with credits=0 → call `deduct_credit` → assert raises `insufficient_credits`
- Call with random UUID → assert raises `restaurant_not_found`
- Call twice rapidly → assert credits decremented by 2 (atomic, no race condition)

### 7. `constraints.real.test.ts`
- Insert customer with duplicate `(restaurant_id, phone)` → assert unique violation
- Insert coupon with duplicate `code` → assert unique violation
- Insert message_log with duplicate `provider_message_id` → assert unique violation
- Insert coupon with invalid `customer_id` → assert FK violation

---

## Skills to Invoke

| Skill | Why |
|-------|-----|
| `supabase-postgres-best-practices` | Real DB queries, RPC testing, RLS verification |
| `playwright-best-practices` | If E2E tests also needed |
| `karpathy-guidelines` | Keep tests minimal, no over-engineering |
| `verify-before-complete` | Don't claim done without `pnpm test` passing |

**Context7 MCP:** Use for latest Supabase JS SDK docs — `createClient`, `rpc()`, auth helpers.

---

## Execution Order

1. **Create `tests/integration/setup.ts`** — seed/cleanup helper
2. **Write `deduct-credit.real.test.ts`** — simplest, validates RPC works
3. **Write `constraints.real.test.ts`** — validates DB schema integrity
4. **Write `rls.real.test.ts`** — validates security model
5. **Write `form.real.test.ts`** — validates customer onboarding
6. **Write `validate.real.test.ts`** — validates coupon redemption
7. **Write `campaigns.real.test.ts`** — validates campaign engine
8. **Write `webhook.real.test.ts`** — validates full WhatsApp flow
9. **Run `pnpm test`** — all mocked + real tests pass
10. **Commit**

---

## Quick Start (Next Session)

```bash
cd E:\desktop\Restoloop

# 1. Read this file
# 2. Invoke skills: supabase-postgres-best-practices, karpathy-guidelines
# 3. Create tests/integration/setup.ts
# 4. Start with deduct-credit.real.test.ts
# 5. Run pnpm test after each file
# 6. Commit when all pass
```

---

## Notes

- **Test data cleanup is critical** — all test rows must be deleted after each test to avoid polluting the DB
- **Use service role for setup/cleanup** — bypasses RLS
- **Use anon key + auth context for RLS tests** — must verify policies actually block
- **OpenWA mock server** (`src/app/api/test/openwa-mock/`) may need to be running for WhatsApp tests
- **Razorpay is in mock mode** — `RAZORPAY_KEY_ID=mock`, so create-order returns `order_mock_*`
- **Cron secret:** `test-cron-secret-123` — use in Authorization header for cron route tests

---

**Ready to execute. Next session: write real-world integration tests.**
