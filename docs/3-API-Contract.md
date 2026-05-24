# API Contract

## Existing Backend APIs (Frontend Consumes)

### Auth
Handled by `@supabase/ssr` Server Actions. No custom auth endpoints.

### Dashboard Stats
```
GET /api/dashboard/stats
Headers: Cookie (session)
```

**Response:**
```json
{
  "total_customers": 156,
  "coupons_sent_this_month": 42,
  "credits_remaining": 230,
  "recent_activity": [
    { "type": "welcome", "customer_name": "Rajesh", "sent_at": "2026-05-22T10:00:00Z" },
    { "type": "birthday", "customer_name": "Priya", "sent_at": "2026-05-21T08:30:00Z" },
    { "type": "low_credit", "message": "23 credits remaining", "sent_at": "2026-05-20T15:00:00Z" }
  ],
  "daily_sends": [
    { "date": "2026-04-23", "count": 3 },
    { "date": "2026-04-24", "count": 5 }
  ]
}
```

### Customers List
```
GET /api/customers?search={query}&sort={field}&order={asc|desc}
Headers: Cookie (session)
```

**Response:**
```json
{
  "customers": [
    {
      "id": "uuid",
      "name": "Rajesh Kumar",
      "phone": "+919876543210",
      "birthday": "03-12",
      "last_visit": "2026-05-20",
      "visit_count": 5,
      "created_at": "2024-01-15T00:00:00Z"
    }
  ]
}
```

### Coupons List
```
GET /api/coupons?type={welcome|birthday|winback}
Headers: Cookie (session)
```

**Response:**
```json
{
  "coupons": [
    {
      "id": "uuid",
      "code": "WEL-1234",
      "type": "welcome",
      "discount_value": "10%",
      "status": "active",
      "sent_at": "2026-05-22T10:00:00Z",
      "customer_name": "Rajesh Kumar"
    }
  ]
}
```

### Profile
```
GET /api/profile
Headers: Cookie (session)
```

**Response:**
```json
{
  "restaurant_name": "Biryani House",
  "address": "123 Main St, Mumbai",
  "phone": "+919876543210",
  "email": "owner@biryani.com",
  "welcome_coupon_value": "10%",
  "birthday_coupon_value": "20%"
}
```

```
PATCH /api/profile
Headers: Cookie (session), Content-Type: application/json
Body: { "restaurant_name": "...", "address": "...", ... }
```

**Response:** `200 OK` with updated profile object.

### Public Intake Form Submit
```
POST /api/leads
Headers: Content-Type: application/json
Body:
{
  "slug": "biryani-house",
  "name": "Rajesh Kumar",
  "phone": "+919876543210",
  "birthday": "1990-03-12",
  "favorite_dish": "Chicken Biryani"
}
```

**Response:**
```json
{
  "success": true,
  "coupon_code": "WEL-1234",
  "message": "Coupon sent via WhatsApp"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Phone number already registered"
}
```

## Frontend Needs → Backend Gap Analysis

| Frontend Need | Backend Status | Action |
|---------------|---------------|--------|
| Dashboard stats | Exists: `/api/dashboard/stats` | Wire frontend |
| Customers list | Exists: `/api/customers` | Wire frontend |
| Coupons list | Exists: `/api/coupons` | Wire frontend |
| Profile read/write | Exists: `/api/profile` | Wire frontend |
| Intake form submit | Exists: `/api/leads` | Wire frontend |
| Search customers | Needs query param support | Verify backend supports `search` param |
| Sort customers | Needs query param support | Verify backend supports `sort`/`order` params |
| Filter coupons by type | Needs query param support | Verify backend supports `type` param |

## No New Backend Endpoints Needed

All required APIs exist. Frontend-only task.

## Error Handling

| Status | Meaning | Frontend Action |
|--------|---------|---------------|
| 401 | Session expired | Redirect to `/auth/sign-in` |
| 403 | Not authorized | Show error toast, redirect home |
| 404 | Resource not found | Show 404 page |
| 422 | Validation error | Show field-level errors |
| 429 | Rate limited | Show "Too many requests, try later" |
| 500 | Server error | Show generic error toast, log to console |

## Request/Response Shapes Summary

All authenticated APIs use cookie-based session tokens (Supabase SSR).
All responses are JSON. All dates are ISO 8601 UTC.
Phone numbers stored with `+91` prefix, formatted for display as `+91 98XXX XXXXX`.
