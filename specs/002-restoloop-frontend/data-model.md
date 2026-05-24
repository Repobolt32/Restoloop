# Data Model: Restoloop Frontend

**Phase 1 — Design & Contracts**  
**Date**: 2026-05-24

## Entities (from existing Supabase schema)

### Tenant (Restaurant)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | uuid | yes | Primary key |
| owner_id | uuid | yes | FK → auth.users |
| name | text | yes | Restaurant name |
| slug | text | yes | Unique, URL-safe identifier |
| credits_balance | number | yes | Current credit balance |
| coupon_welcome | number | yes | Welcome coupon discount value |
| coupon_bday | number | yes | Birthday coupon discount value |
| coupon_winback | number | yes | Winback coupon discount value |
| address | text | no | Physical address |
| email | text | no | Contact email |
| phone | text | no | Contact phone |
| created_at | timestamptz | yes | Registration date |

**Validation**:
- `name`: required, non-empty
- `phone`: required for profile save, valid Indian phone format (10 digits)
- `coupon_*`: must be positive numbers

### Customer

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | uuid | yes | Primary key |
| tenant_id | uuid | yes | FK → tenant.id |
| name | text | yes | Customer name |
| phone | text | yes | Unique per tenant |
| birthday | date | no | Optional, for birthday coupons |
| last_visit | timestamptz | yes | Auto-updated |
| created_at | timestamptz | yes | Customer since |

**Validation**:
- `name`: required, non-empty
- `phone`: required, valid phone format
- Deduplication key: `(tenant_id, phone)` — unique per restaurant

**Display fields** (derived):
- Visit Count: count of visits (from backend/triggers)
- Customer Since: `created_at` formatted as date

### Coupon

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | uuid | yes | Primary key |
| tenant_id | uuid | yes | FK → tenant.id |
| customer_id | uuid | yes | FK → customer.id |
| type | enum | yes | `welcome`, `bday`, `winback` |
| code | text | yes | Unique coupon code |
| discount | number | yes | Discount value |
| status | enum | yes | `pending`, `sent`, `redeemed`, `expired` |
| created_at | timestamptz | yes | Sent date |
| expires_at | timestamptz | yes | Expiry date |
| redeemed_at | timestamptz | no | Redemption timestamp |

**Type display mapping**:
- `welcome` → "Welcome"
- `bday` → "Birthday"
- `winback` → "Winback"

**Status display mapping**:
- `pending` → "Pending"
- `sent` → "Sent"
- `redeemed` → "Redeemed"
- `expired` → "Expired"

### MessageLog

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | uuid | yes | Primary key |
| tenant_id | uuid | yes | FK → tenant.id |
| customer_id | uuid | yes | FK → customer.id |
| coupon_id | uuid | no | FK → coupon.id |
| wa_message_id | text | no | WhatsApp message ID |
| status | enum | yes | `sent`, `failed`, `delivered`, `blocked` |
| sent_at | timestamptz | yes | Send timestamp |

### PlatformCredits

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | uuid | yes | Primary key |
| balance | number | yes | Current credit balance |
| updated_at | timestamptz | yes | Last update |

## Relationships

```
Tenant (1) ──────── (N) Customer
Tenant (1) ──────── (N) Coupon
Tenant (1) ──────── (N) MessageLog
Customer (1) ────── (N) Coupon
Customer (1) ────── (N) MessageLog
Coupon (1) ───────── (N) MessageLog
```

## State Transitions

### Coupon Status
```
pending → sent → redeemed
              → expired
```

### Intake Form Submission
```
Visitor fills form → Validate → Create Customer (or find existing by phone)
                             → Generate Welcome Coupon (backend trigger)
                             → Send WhatsApp message (backend trigger)
                             → Return success with coupon code
```

## Data Access Patterns

| Page | Query | Access |
|------|-------|--------|
| Dashboard KPIs | `SELECT COUNT(*) FROM customers WHERE tenant_id = ?` | Server / TanStack Query |
| Dashboard KPIs | `SELECT COUNT(*) FROM coupons WHERE tenant_id = ? AND created_at > month_start` | Server / TanStack Query |
| Dashboard KPIs | `SELECT credits_balance FROM tenant WHERE id = ?` | Server / TanStack Query |
| Customers | `SELECT * FROM customers WHERE tenant_id = ? ORDER BY [column]` | TanStack Query |
| Customers search | `SELECT * FROM customers WHERE tenant_id = ? AND (name ILIKE ? OR phone ILIKE ?)` | TanStack Query |
| Coupons | `SELECT * FROM coupons WHERE tenant_id = ? [AND type = ?] ORDER BY created_at DESC` | TanStack Query |
| Profile | `SELECT * FROM tenant WHERE id = ?` | TanStack Query |
| Profile save | `UPDATE tenant SET ... WHERE id = ?` | Server Action |
| Intake form | `INSERT INTO customers ... RETURNING *` | Server Action |
| Intake form | Lookup tenant by slug | Server |

All queries are scoped to the authenticated tenant via Supabase RLS policies.
