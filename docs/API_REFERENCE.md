# Restoloop API Reference

> Complete reference for all API endpoints.

---

## Base URL

```
Production: https://restoloop.app
Development: http://localhost:3000
```

---

## Authentication

### API Key Authentication (Cron Jobs)

```http
Authorization: Bearer <CRON_SECRET>
```

### Session Authentication (User Endpoints)

All user-facing endpoints require a valid Supabase session cookie. The session is managed automatically by the Supabase client.

---

## Endpoints

### 1. POST `/api/leads`

Capture a new customer lead from the public intake form.

#### Request

**Headers**
```http
Content-Type: application/json
```

**Body**
```json
{
  "tenantId": "uuid",
  "name": "John Doe",
  "phone": "+919876543210",
  "birthday": "1990-05-15",
  "favouriteDish": "Butter Chicken"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `tenantId` | string (UUID) | Yes | Must be a valid UUID |
| `name` | string | Yes | Minimum 2 characters |
| `phone` | string | Yes | Must match `+91` followed by 10 digits |
| `birthday` | string | No | ISO date string |
| `favouriteDish` | string | No | Any string |

#### Response

**Success (200)**
```json
{
  "success": true,
  "message": "Lead captured completely",
  "waUrl": "https://wa.me/919999999999?text=...",
  "couponCode": "W50-ABC123",
  "discount": 50
}
```

> The `couponCode` uses format `W{amount}-{6 random chars}` (e.g., `W50-ABC123`). No WhatsApp push message is sent — the client is responsible for opening the `waUrl` Click-to-Chat link. No credits are deducted for welcome messages.

**Validation Error (400)**
```json
{
  "error": "Invalid data",
  "details": [
    {
      "code": "too_small",
      "message": "Name is too short",
      "path": ["name"]
    }
  ]
}
```

**Duplicate Customer (400)**
```json
{
  "error": "You have already signed up for this restaurant."
}
```

**Server Error (500)**
```json
{
  "error": "Database error"
}
```

#### Business Logic

1. Validates input using Zod schema
2. Inserts customer record (deduplicates on `tenant_id` + `phone`)
3. Fetches tenant's welcome coupon amount (default ₹50)
4. Generates welcome coupon code in format `W{amount}-{random}`
5. Creates coupon with default 30-day expiry
6. Returns WhatsApp Click-to-Chat URL with prefilled message (no push delivery)

---

### 2. POST `/api/coupons/validate`

Validate a coupon code at the restaurant.

#### Request

**Headers**
```http
Content-Type: application/json
Cookie: sb-<project-ref>-auth-token=<session-token>
```

**Body**
```json
{
  "code": "W50-ABC123"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `code` | string | Yes | Non-empty, trimmed and uppercased |

#### Response

**Success (200)**
```json
{
  "id": "uuid",
  "code": "W50-ABC123",
  "discount": 50,
  "customerName": "John Doe",
  "customerPhone": "+919876543210"
}
```

**Missing Code (400)**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Coupon code is required."
}
```

**Unauthorized (401)**
```json
{
  "error": "UNAUTHORIZED",
  "message": "Must be signed in to validate coupons."
}
```

**Restaurant Not Found (404)**
```json
{
  "error": "NOT_FOUND",
  "message": "Restaurant profile not found."
}
```

**Invalid Coupon (404)**
```json
{
  "error": "NOT_FOUND",
  "message": "Invalid coupon code or does not belong to this restaurant."
}
```

**Already Redeemed (400)**
```json
{
  "error": "COUPON_REDEEMED",
  "message": "This coupon has already been redeemed."
}
```

**Expired (400)**
```json
{
  "error": "COUPON_EXPIRED",
  "message": "This coupon has expired (date passed)."
}
```

#### Business Logic

1. Verifies user authentication
2. Retrieves tenant for authenticated user
3. Looks up coupon by code (scoped to tenant)
4. Validates coupon status (not redeemed, not expired)
5. Validates expiry date
6. Returns coupon details with customer info

---

### 3. GET `/api/cron/process-campaigns`

Process all automated campaigns for all tenants.

#### Request

**Headers**
```http
Authorization: Bearer <CRON_SECRET>
```

#### Response

**Success (200)**
```json
{
  "success": true,
  "results": {
    "winbackSent": 5,
    "bdaySent": 3,
    "reminderSent": 12,
    "errors": 1
  }
}
```

**Unauthorized (401)**
```json
{
  "error": "Unauthorized"
}
```

**Server Error (500)**
```json
{
  "error": "Internal Server Error",
  "message": "Error message",
  "stack": "Error stack trace"
}
```

#### Business Logic

1. Validates Bearer token against `CRON_SECRET`
2. Calls `processCampaigns()` function
3. Returns summary of all campaign results

#### Campaign Processing Details

For each tenant:

| Campaign | Trigger | Condition | Action |
|----------|---------|-----------|--------|
| **Win-back** | 45 days since last visit | No recent winback coupon | Generate coupon + Send Meta template |
| **Birthday** | Today matches birthday | No birthday coupon this year | Generate coupon + Send Meta template |
| **Welcome Reminder** | 15 days after signup | Welcome coupon not redeemed | Send free-text reminder via 3rd party |

#### Credit Deduction

- Each successful message: -1 credit from tenant
- Each successful message: -1 credit from platform wallet
- If no credits: Message logged as "blocked"

---

## Server Actions

Server Actions are Next.js functions that can be called directly from client components using `useFormState` or `useActionState`. They receive `(prevState, formData)`.

### 1. `updateRestaurantProfile`

Update the restaurant profile.

**Location**: `app/home/restaurant-profile/_actions/update-profile.ts`

**Parameters** (extracted from FormData)
```typescript
{
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  coupon_welcome?: number;   // default 50
  coupon_bday?: number;       // default 38
  coupon_winback?: number;    // default 30
}
```

> Note: `tax_cgst` and `tax_sgst` are stored in the database but not currently editable through this action.

**Returns**
```typescript
{
  success?: boolean;
  error?: string;
  slug?: string;
}
```

---

### 2. `addCredits`

Add credits to a tenant (admin only).

**Location**: `app/admin/_lib/server-actions.ts`

**Parameters**
```typescript
(tenantId: string, amount: number)
```

**Returns**
```typescript
{
  success: true;
  newBalance: number;
}
```

On failure, throws an Error.

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `COUPON_REDEEMED` | 400 | Coupon already used |
| `COUPON_EXPIRED` | 400 | Coupon has expired |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `23505` | 400 | PostgreSQL unique constraint violation |

---

## Rate Limiting

Currently, no rate limiting is implemented on API endpoints. Consider adding rate limiting for:

- `/api/leads` - Prevent spam submissions
- `/api/coupons/validate` - Prevent brute force attempts

---

## Webhooks

### WhatsApp Delivery Status

Meta Cloud API can send delivery status webhooks. These are not currently implemented.

**Potential Implementation**
- Update `message_log.status` when delivery status changes
- Track: sent → delivered → read

---

## Cron Job Setup

### Vercel Cron

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/process-campaigns",
      "schedule": "0 10 * * *"
    }
  ]
}
```

### External Cron Service

Use any cron service (e.g., cron-job.org, EasyCron) to hit:
```
GET https://restoloop.app/api/cron/process-campaigns
Authorization: Bearer <CRON_SECRET>
```

### Schedule Recommendation

- Run daily at 10:00 AM IST
- Processes all campaigns for all tenants
- Idempotent - safe to run multiple times

---

*Document generated from codebase analysis. Last updated: June 2026.*
