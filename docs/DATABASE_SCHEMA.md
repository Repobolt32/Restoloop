# Restoloop Database Schema

> Complete reference for all database tables, columns, and relationships.

---

## Overview

Restoloop uses **Supabase (PostgreSQL)** with **Row Level Security (RLS)** for data isolation. The schema is built on top of the Makerkit SaaS Starter Kit.

### Tables

| Table | Purpose | RLS Enabled |
|-------|---------|-------------|
| `accounts` | User accounts (from Makerkit) | Yes |
| `tenants` | Restaurant profiles | Yes |
| `customers` | Registered diners | Yes |
| `coupons` | Issued discount codes | Yes |
| `message_log` | WhatsApp delivery tracking | Yes |
| `platform_credits` | Super-admin wallet | Yes (no user policies - service-role only) |

---

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│     accounts    │       │     tenants     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◀──┐   │ id (PK)         │
│ name            │   │   │ owner_id (FK)   │────▶ auth.users.id
│ email           │   │   │ name            │
│ picture_url     │   │   │ slug (UNIQUE)   │
│ created_at      │   │   │ credits_balance │
│ updated_at      │   │   │ coupon_welcome  │
└─────────────────┘   │   │ coupon_bday     │
                      │   │ coupon_winback  │
                      │   │ tax_cgst        │
                      │   │ tax_sgst        │
                      │   │ address         │
                      │   │ email           │
                      │   │ phone           │
                      │   │ created_at      │
                      │   └────────┬────────┘
                      │            │
                      │            │ 1:N
                      │            ▼
                      │   ┌─────────────────┐
                      │   │    customers    │
                      │   ├─────────────────┤
                      │   │ id (PK)         │
                      │   │ tenant_id (FK)  │────▶ tenants.id
                      │   │ name            │
                      │   │ phone           │
                      │   │ birthday        │
                      │   │ last_visit      │
                      │   │ food_pref       │
                      │   │ created_at      │
                      │   └────────┬────────┘
                      │            │
                      │            │ 1:N
                      │            ▼
                      │   ┌─────────────────┐
                      │   │    coupons      │
                      │   ├─────────────────┤
                      │   │ id (PK)         │
                      │   │ tenant_id (FK)  │────▶ tenants.id
                      │   │ customer_id (FK)│────▶ customers.id
                      │   │ type            │
                      │   │ code (UNIQUE)   │
                      │   │ discount        │
                      │   │ status          │
                      │   │ bill_amount     │
                      │   │ bill_items      │
                      │   │ expires_at      │
                      │   │ redeemed_at     │
                      │   │ created_at      │
                      │   └────────┬────────┘
                      │            │
                      │            │ 1:N
                      │            ▼
                      │   ┌─────────────────┐
                      │   │  message_log    │
                      │   ├─────────────────┤
                      │   │ id (PK)         │
                      │   │ tenant_id (FK)  │────▶ tenants.id
                      │   │ customer_id (FK)│────▶ customers.id
                      │   │ coupon_id (FK)  │────▶ coupons.id
                      │   │ wa_message_id   │
                      │   │ status          │
                      │   │ sent_at         │
                      │   └─────────────────┘
                      │
                      │
                      │   ┌─────────────────┐
                      │   │platform_credits │
                      │   ├─────────────────┤
                      │   │ id (PK)         │
                      │   │ balance         │
                      │   │ updated_at      │
                      │   └─────────────────┘
```

---

## Table Definitions

### 1. accounts

User accounts inherited from the Makerkit SaaS Starter Kit.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `auth.uid()` | Primary key, linked to Supabase Auth |
| `name` | text | Yes | NULL | Display name |
| `email` | text | Yes | NULL | Email address |
| `picture_url` | text | Yes | NULL | Profile picture URL |
| `created_at` | timestamptz | No | `now()` | Account creation timestamp |
| `updated_at` | timestamptz | No | `now()` | Last update timestamp |

**RLS Policies**: Users can only read/update their own account.

---

### 2. tenants

Restaurant profiles. Each tenant represents one restaurant.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `owner_id` | uuid | No | - | FK to `auth.users.id` |
| `name` | text | No | - | Restaurant name |
| `slug` | text | No | - | URL-safe unique identifier |
| `credits_balance` | integer | No | `0` | Available credits for WhatsApp messages |
| `coupon_welcome` | integer | No | `50` | Welcome coupon discount (₹) |
| `coupon_bday` | integer | No | `38` | Birthday coupon discount (₹) |
| `coupon_winback` | integer | No | `30` | Win-back coupon discount (₹) |
| `tax_rate` | numeric | No | `5.0` | **Deprecated** - Use tax_cgst/tax_sgst |
| `tax_cgst` | numeric | No | `2.50` | CGST tax rate (%) |
| `tax_sgst` | numeric | No | `2.50` | SGST tax rate (%) |
| `address` | text | Yes | NULL | Restaurant address |
| `email` | text | Yes | NULL | Restaurant contact email |
| `phone` | text | Yes | NULL | Restaurant contact phone |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |

**Indexes**:
- Implicit unique index on `slug` (from UNIQUE constraint)
- FK on `owner_id` (references `auth.users`)

**RLS Policies**:
- Owners can read/update their own tenant
- Service role can access all tenants

**Unique Constraints**:
- `slug` must be unique across all tenants

---

### 3. customers

Registered diners who have submitted the intake form.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `tenant_id` | uuid | No | - | FK to `tenants.id` |
| `name` | text | No | - | Customer name |
| `phone` | text | No | - | WhatsApp number (10 digits, no country code) |
| `birthday` | date | Yes | NULL | Customer's birthday |
| `last_visit` | timestamptz | No | `now()` | Last visit timestamp (updated on each intake) |
| `food_pref` | text | Yes | NULL | Favourite dish preference |
| `created_at` | timestamptz | No | `now()` | Registration timestamp |

**Indexes**:
- Implicit unique index on (`tenant_id`, `phone`) (from UNIQUE constraint)
- FK on `tenant_id` (references `tenants`)

**RLS Policies**:
- Tenant owners can read/update their own customers
- Service role can access all customers

**Unique Constraints**:
- `tenant_id` + `phone` combination is unique (one phone per restaurant)

---

### 4. coupons

Issued discount codes for customers.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `tenant_id` | uuid | No | - | FK to `tenants.id` |
| `customer_id` | uuid | No | - | FK to `customers.id` |
| `type` | text | No | - | Coupon type: `welcome`, `bday`, `winback` |
| `code` | text | No | - | Unique coupon code (8 chars) |
| `discount` | integer | No | - | Discount amount (₹) |
| `status` | text | No | `'sent'` | Status: `pending`, `sent`, `redeemed`, `expired` |
| `bill_amount` | numeric | Yes | NULL | Total bill amount when redeemed |
| `bill_items` | jsonb | Yes | NULL | Bill items (JSON array) |
| `expires_at` | timestamptz | No | - | Expiration timestamp |
| `redeemed_at` | timestamptz | Yes | NULL | Redemption timestamp |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |

**Indexes**:
- Implicit unique index on `code` (from UNIQUE constraint)
- FK on `tenant_id` (references `tenants`)
- FK on `customer_id` (references `customers`)

**RLS Policies**:
- Tenant owners can read/update their own coupons
- Service role can access all coupons

**Unique Constraints**:
- `code` must be unique across all coupons

**Check Constraints**:
- `type` must be one of: `welcome`, `bday`, `winback`
- `status` must be one of: `pending`, `sent`, `redeemed`, `expired`

---

### 5. message_log

WhatsApp message delivery tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `tenant_id` | uuid | No | - | FK to `tenants.id` |
| `customer_id` | uuid | No | - | FK to `customers.id` |
| `coupon_id` | uuid | Yes | NULL | FK to `coupons.id` (null for blocked messages) |
| `wa_message_id` | text | Yes | NULL | WhatsApp API message ID |
| `status` | text | No | `'sent'` | Status: `sent`, `failed`, `delivered`, `blocked` |
| `sent_at` | timestamptz | No | `now()` | Send timestamp |

**Indexes**:
- FK on `tenant_id` (references `tenants`)
- FK on `customer_id` (references `customers`)
- FK on `coupon_id` (references `coupons`)

**RLS Policies**:
- Tenant owners can read their own message logs
- Service role can access all message logs

**Status Values**:
- `sent`: Message accepted by WhatsApp API
- `failed`: Message rejected by WhatsApp API
- `delivered`: Message delivered to recipient (webhook)
- `blocked`: Message blocked due to insufficient credits

---

### 6. platform_credits

Super-admin wallet for managing platform-wide credits.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `balance` | integer | No | `1000` | Available credits (seeded with 1000) |
| `updated_at` | timestamptz | No | `now()` | Last update timestamp |

**RLS Policies**: RLS enabled but no user-level policies created. Only accessible via service-role client in server API routes.

**Notes**:
- Single-row table (only one record)
- Accessed via service-role client only
- Deducted when tenant credits are used

---

## Check Constraints

### Coupon Type

```sql
CHECK (type IN ('welcome', 'bday', 'winback'))
```

### Coupon Status

```sql
CHECK (status IN ('pending', 'sent', 'redeemed', 'expired'))
```

### Message Status

```sql
CHECK (status IN ('sent', 'failed', 'delivered', 'blocked'))
```

---

## Row Level Security (RLS) Policies

### tenants

```sql
-- Owners can read their own tenants
CREATE POLICY "tenants_select_own"
  ON tenants FOR SELECT
  USING (auth.uid() = owner_id);

-- Owners can update their own tenants
CREATE POLICY "tenants_update_own"
  ON tenants FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Owners can insert their own tenants
CREATE POLICY "tenants_insert_own"
  ON tenants FOR INSERT
  WITH CHECK (auth.uid() = owner_id);
```

### customers

```sql
-- Tenant owners can access their own customers (all operations)
CREATE POLICY "customers_tenant_all"
  ON customers FOR ALL
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );
```

### coupons

```sql
-- Tenant owners can access their own coupons (all operations)
CREATE POLICY "coupons_tenant_all"
  ON coupons FOR ALL
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );
```

### message_log

```sql
-- Tenant owners can access their own message logs (all operations)
CREATE POLICY "message_log_tenant_all"
  ON message_log FOR ALL
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );
```

### platform_credits

RLS enabled but no user-level policies. Accessible only via service-role client in server API routes.

---

## Migration Files

| File | Purpose |
|------|---------|
| `20241219010757_schema.sql` | Initial Makerkit schema |
| `20260308_add_billing_columns.sql` | Add billing columns to tenants |
| `20260308_restoloop_v1_schema.sql` | Restoloop v1 schema (tenants, customers, coupons) |
| `20260318_add_contact_info.sql` | Add contact info to tenants |
| `20260318_drop_leaking_coupon_policy.sql` | Remove insecure coupon validation policy |
| `20260319_add_food_pref_column.sql` | Add food_pref to customers |

---

## Indexes

Indexes are created implicitly via UNIQUE constraints and foreign keys. No explicit performance indexes are defined yet.

### Implicit Indexes (from constraints)

```sql
-- UNIQUE constraints create implicit indexes
-- tenants(slug)            — unique slug lookup
-- customers(tenant_id, phone) — deduplicate phone per tenant
-- coupons(code)            — unique coupon code lookup
```

### Recommended Future Indexes

```sql
-- Tenant lookups
CREATE INDEX idx_tenants_owner_id ON tenants(owner_id);

-- Customer lookups
CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);

-- Coupon lookups
CREATE INDEX idx_coupons_tenant_id ON coupons(tenant_id);
CREATE INDEX idx_coupons_customer_id ON coupons(customer_id);
CREATE INDEX idx_coupons_status ON coupons(status);
CREATE INDEX idx_coupons_type ON coupons(type);

-- Message log lookups
CREATE INDEX idx_message_log_tenant_id ON message_log(tenant_id);
CREATE INDEX idx_message_log_customer_id ON message_log(customer_id);
CREATE INDEX idx_message_log_coupon_id ON message_log(coupon_id);
CREATE INDEX idx_message_log_status ON message_log(status);
```

---

## Common Queries

### Get tenant by owner

```sql
SELECT * FROM tenants
WHERE owner_id = :user_id
ORDER BY created_at ASC
LIMIT 1;
```

### Get active customers for tenant

```sql
SELECT c.*, cp.code, cp.discount, cp.type, cp.expires_at
FROM customers c
JOIN coupons cp ON c.id = cp.customer_id
WHERE c.tenant_id = :tenant_id
  AND cp.status = 'sent'
  AND cp.expires_at > now()
ORDER BY cp.expires_at ASC;
```

### Get winback candidates

```sql
SELECT * FROM customers
WHERE tenant_id = :tenant_id
  AND last_visit >= :winback_start
  AND last_visit <= :winback_end;
```

### Get birthday candidates

```sql
SELECT * FROM customers
WHERE tenant_id = :tenant_id
  AND birthday IS NOT NULL
  AND to_char(birthday, 'MM-DD') = to_char(now(), 'MM-DD');
```

### Get platform credits

```sql
SELECT balance FROM platform_credits
LIMIT 1;
```

---

*Document generated from codebase analysis. Last updated: June 2026.*
