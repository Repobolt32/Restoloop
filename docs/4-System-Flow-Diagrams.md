# System Flow Diagrams

## Auth Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────┐
│  /auth      │     │   Server     │     │  Supabase   │     │ /home   │
│  /sign-in   │────▶│   Action     │────▶│   Auth      │────▶│         │
│  (form)     │     │  (validate)  │     │ (cookie)    │     │(redirect)│
└─────────────┘     └──────────────┘     └─────────────┘     └─────────┘
       │                   │
       │                   │ Invalid
       │                   ▼
       │            ┌──────────────┐
       └───────────▶│ Error message│
                    │  on form     │
                    └──────────────┘
```

**Steps:**
1. User enters email + password on `/auth/sign-in`
2. Client calls Server Action `signInWithPassword`
3. Server validates with Supabase, sets session cookie
4. Redirect to `/home`
5. Invalid: error returned to form, displayed inline

## Public Intake Form Flow

```
┌──────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Customer   │     │   Frontend  │     │   Backend   │     │  WhatsApp   │
│  (mobile)    │     │  /form/[slug]│     │   (/api)    │     │    API      │
└──────┬───────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                    │                   │                   │
       │ 1. Opens link      │                   │                   │
       │───────────────────▶│                   │                   │
       │                    │                   │                   │
       │ 2. Fills form      │                   │                   │
       │ (name, phone,      │                   │                   │
       │  birthday, dish)   │                   │                   │
       │───────────────────▶│                   │                   │
       │                    │                   │                   │
       │                    │ 3. POST /api/leads│                   │
       │                    │──────────────────▶│                   │
       │                    │                   │                   │
       │                    │                   │ 4. Creates:       │
       │                    │                   │    - customer     │
       │                    │                   │    - coupon       │
       │                    │                   │    - message_log  │
       │                    │                   │                   │
       │                    │                   │ 5. Trigger send   │
       │                    │                   │──────────────────▶│
       │                    │                   │                   │
       │                    │                   │ 6. Delivery       │
       │                    │                   │◀──────────────────│
       │                    │                   │                   │
       │                    │◀──────────────────│                   │
       │                    │ 7. Returns:       │                   │
       │                    │    { coupon_code }│                   │
       │                    │                   │                   │
       │ 8. Shows success   │                   │                   │
       │    with coupon     │                   │                   │
       │◀───────────────────│                   │                   │
       │                    │                   │                   │
```

**Steps:**
1. Customer opens `/form/biryani-house` (unauthenticated)
2. Fills intake form
3. Frontend POSTs to `/api/leads`
4. Backend creates customer record, generates welcome coupon, logs message
5. Backend triggers WhatsApp API send
6. WhatsApp API delivers message
7. Backend returns coupon code to frontend
8. Frontend displays success page with coupon code

## Cron Campaign Trigger Flow

```
┌──────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Cron    │     │  Campaign   │     │   Backend   │     │  WhatsApp   │
│ (daily)  │     │   Engine    │     │   (/api)    │     │    API      │
└────┬─────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
     │                  │                   │                   │
     │ 1. Trigger       │                   │                   │
     │ (scheduled)      │                   │                   │
     │─────────────────▶│                   │                   │
     │                  │                   │                   │
     │                  │ 2. Query:         │                   │
     │                  │    - winback 45d  │                   │
     │                  │    - birthday=today│                  │
     │                  │    - welcome 15d  │                   │
     │                  │                   │                   │
     │                  │ 3. POST campaign  │                   │
     │                  │──────────────────▶│                   │
     │                  │                   │                   │
     │                  │                   │ 4. Generate coupon │
     │                  │                   │    per customer  │
     │                  │                   │                   │
     │                  │                   │ 5. Batch send    │
     │                  │                   │──────────────────▶│
     │                  │                   │                   │
     │                  │                   │ 6. Log results   │
     │                  │                   │                   │
```

**Campaign Types:**
- **Winback**: Customers not visited in 45 days → discount coupon
- **Birthday**: Customers with birthday today → birthday coupon
- **Welcome reminder**: Customers who signed up 15 days ago, no visit → reminder

## Frontend State → Supabase Sync

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │     │   TanStack  │     │   Supabase   │
│  Component  │     │   Query     │     │   (backend)  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ 1. Mount          │                   │
       │──────────────────▶│                   │
       │                   │                   │
       │                   │ 2. Check cache    │
       │                   │ (queryKey)        │
       │                   │                   │
       │                   │ 3. Cache miss     │
       │                   │──────────────────▶│
       │                   │                   │
       │                   │ 4. Return data    │
       │                   │◀──────────────────│
       │                   │                   │
       │ 5. Render         │                   │
       │◀──────────────────│                   │
       │                   │                   │
       │ 6. User action    │                   │
       │    (edit profile) │                   │
       │──────────────────▶│                   │
       │                   │                   │
       │                   │ 7. mutation       │
       │                   │ (invalidate)      │
       │                   │──────────────────▶│
       │                   │                   │
       │                   │ 8. Refetch        │
       │                   │──────────────────▶│
       │                   │                   │
       │                   │ 9. New data       │
       │                   │◀──────────────────│
       │                   │                   │
       │ 10. Re-render     │                   │
       │◀──────────────────│                   │
       │                   │                   │
```

**Query Keys:**
- `['dashboard', 'stats']` → `/api/dashboard/stats`
- `['customers', 'list', { search, sort, order }]` → `/api/customers`
- `['coupons', 'list', { type }]` → `/api/coupons`
- `['profile']` → `/api/profile`

**Invalidation Rules:**
- Profile mutation → invalidate `['profile']`
- No manual invalidation for dashboard/customers/coupons (read-only mostly)
- Refetch interval: 30 seconds for dashboard stats (staleTime: 30s)
