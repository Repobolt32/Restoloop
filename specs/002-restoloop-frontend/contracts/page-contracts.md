# Page Contracts: Restoloop Frontend

**Phase 1 — Design & Contracts**  
**Date**: 2026-05-24

## Auth Pages

### Sign Up — `/auth/sign-up`

- **Access**: Unauthenticated
- **Method**: GET (render form), POST (submit to Supabase)
- **Fields**: Email (required, type=email), Password (required, min 8 chars)
- **Success**: Redirect to `/home`
- **Error**: Inline error message above form
- **Edge cases**: Already-registered email → "Account already exists. Sign in instead."

### Sign In — `/auth/sign-in`

- **Access**: Unauthenticated
- **Method**: GET (render form), POST (submit to Supabase)
- **Fields**: Email (required), Password (required)
- **Success**: Redirect to `/home`
- **Error**: Generic "Invalid email or password" (don't reveal which is wrong)

### Password Reset — `/auth/password-reset`

- **Access**: Unauthenticated
- **Method**: GET (render form), POST (send reset email)
- **Fields**: Email (required)
- **Success**: "Check your email for a reset link" message
- **Error**: Generic "If that email exists, a reset link has been sent" (don't leak email existence)

---

## Authenticated Pages (`(home)` group)

All require authenticated session. Redirect to `/auth/sign-in` if unauthenticated.

### Dashboard — `/home`

- **Layout**: 3 KPI cards (top row), Activity feed (below)
- **Data dependencies**:
  - `tenant` — name, credits_balance
  - `customers` — COUNT for KPI
  - `coupons` — COUNT this month for KPI, recent sends for feed
  - `customers with birthday today` — for activity feed
- **States**: Loading (skeleton cards), Empty (zero state with CTA), Error (retry button), Loaded
- **Low credit alert**: Visible when `credits_balance < 50`

### Customers — `/home/customers`

- **Layout**: Search input + Table (Name, Phone, Birthday, Last Visit, Visit Count, Customer Since)
- **Data dependencies**: `customers[]` for current tenant
- **Interactions**: Sort by column click (toggle asc/desc), Search by name/phone (client-side filter for <500 rows)
- **States**: Loading (skeleton table), Empty ("No customers yet"), No-results ("No customers match your search"), Error, Loaded

### Coupons — `/home/coupons`

- **Layout**: Type filter (dropdown/tabs) + Table (Code, Type, Discount, Status, Sent Date, Customer)
- **Data dependencies**: `coupons[]` with joined `customer.name` for current tenant
- **Interactions**: Filter by type (welcome/birthday/winback/all)
- **States**: Loading, Empty, Filtered-empty, Error, Loaded
- **Read-only**: No create/edit/delete controls

### Profile — `/home/profile`

- **Layout**: Editable form (Restaurant name, Address, Phone, Email, Coupon values)
- **Data dependencies**: `tenant` for current user
- **Interactions**: Edit fields, Save button
- **Validation**: Name required, Phone required + format, Coupon values positive numbers
- **States**: Loading, Loaded (pre-filled), Saving (button disabled), Saved (success toast), Error (field-level + form-level)
- **Success**: "Profile updated" confirmation, data refreshed

---

## Public Pages

### Intake Form — `/form/[slug]`

- **Access**: Public (unauthenticated)
- **Params**: `slug` — restaurant identifier
- **Layout**: Restaurant name header + Form (Name, Phone, Birthday optional, Favorite Dish optional) + Submit button
- **Data dependencies**: `tenant` by slug lookup
- **Form submission**:
  1. Validate fields client-side
  2. POST to server action
  3. Upsert customer by phone (dedup)
  4. Backend generates welcome coupon + WhatsApp message
  5. Return coupon code
- **States**:
  - Loading (form skeleton while resolving slug)
  - Not-found ("Restaurant not found" for invalid/deactivated slug)
  - Form (ready to fill)
  - Validating (field errors shown inline)
  - Submitting (button disabled)
  - Success (coupon code displayed)
  - No-credits ("Restaurant not accepting submissions")
  - Error (retry message)
- **Validation**:
  - Name: required, non-empty
  - Phone: required, valid format (10-digit Indian mobile)
  - Birthday: optional, valid date if provided
  - Favorite Dish: optional, text
