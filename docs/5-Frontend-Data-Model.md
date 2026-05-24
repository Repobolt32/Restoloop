# Frontend Data Model

## React Query Keys

| Feature | Query Key | API Endpoint | staleTime |
|---------|-----------|--------------|-----------|
| Dashboard stats | `['dashboard', 'stats']` | `GET /api/dashboard/stats` | 30s |
| Customers list | `['customers', 'list', filters]` | `GET /api/customers` | 60s |
| Coupons list | `['coupons', 'list', filters]` | `GET /api/coupons` | 60s |
| Profile | `['profile']` | `GET /api/profile` | 5min |

**Filter shapes:**
```typescript
interface CustomerFilters {
  search?: string;
  sort?: 'name' | 'phone' | 'birthday' | 'last_visit' | 'visit_count' | 'created_at';
  order?: 'asc' | 'desc';
}

interface CouponFilters {
  type?: 'welcome' | 'birthday' | 'winback';
}
```

## TypeScript Interfaces

### Customer
```typescript
interface Customer {
  id: string;
  name: string;
  phone: string;
  birthday: string | null; // "MM-DD" format
  last_visit: string | null; // ISO date
  visit_count: number;
  created_at: string; // ISO date
}
```

### Coupon
```typescript
type CouponType = 'welcome' | 'birthday' | 'winback';

interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  discount_value: string; // e.g. "10%"
  status: 'active' | 'expired' | 'used';
  sent_at: string; // ISO date
  customer_name: string;
}
```

### Dashboard Stats
```typescript
interface DashboardStats {
  total_customers: number;
  coupons_sent_this_month: number;
  credits_remaining: number;
  recent_activity: ActivityEvent[];
  daily_sends?: DailySend[]; // optional for chart
}

interface ActivityEvent {
  type: 'welcome' | 'birthday' | 'winback' | 'low_credit';
  customer_name?: string;
  message?: string;
  sent_at: string;
}

interface DailySend {
  date: string; // "YYYY-MM-DD"
  count: number;
}
```

### Profile
```typescript
interface Profile {
  restaurant_name: string;
  address: string;
  phone: string;
  email: string;
  welcome_coupon_value: string;
  birthday_coupon_value: string;
}

type ProfileUpdate = Partial<Profile>;
```

### Intake Form
```typescript
interface IntakeFormData {
  slug: string;
  name: string;
  phone: string;
  birthday?: string; // "YYYY-MM-DD"
  favorite_dish?: string;
}

interface IntakeFormResponse {
  success: boolean;
  coupon_code?: string;
  message?: string;
  error?: string;
}
```

## Form Validation Schemas (Zod)

### Auth
```typescript
const signInSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
```

### Profile
```typescript
const profileSchema = z.object({
  restaurant_name: z.string().min(1, 'Restaurant name required'),
  address: z.string().min(1, 'Address required'),
  phone: z.string().regex(/^\+91[0-9]{10}$/, 'Invalid Indian phone number'),
  email: z.string().email('Invalid email'),
  welcome_coupon_value: z.string().min(1),
  birthday_coupon_value: z.string().min(1),
});
```

### Intake Form
```typescript
const intakeSchema = z.object({
  name: z.string().min(1, 'Name required'),
  phone: z.string().regex(/^\+91[0-9]{10}$/, 'Invalid phone number'),
  birthday: z.string().optional(),
  favorite_dish: z.string().optional(),
});
```

## Supabase Table Mapping

| Frontend Entity | Supabase Table | Key Fields |
|-----------------|----------------|------------|
| Customer | `customers` | `id`, `name`, `phone`, `birthday`, `last_visit`, `visit_count`, `created_at`, `tenant_id` |
| Coupon | `coupons` | `id`, `code`, `type`, `discount_value`, `status`, `sent_at`, `customer_id`, `tenant_id` |
| Profile | `tenants` | `id`, `restaurant_name`, `address`, `phone`, `email`, `welcome_coupon_value`, `birthday_coupon_value` |
| Activity | `message_log` | `id`, `type`, `customer_id`, `sent_at`, `status`, `tenant_id` |
| Credits | `platform_credits` | `tenant_id`, `credits_remaining` |

**Note:** Frontend does not query Supabase directly. All data flows through Next.js API routes (Server Actions or Route Handlers) for SSR compatibility and security.

## Caching Strategy

- **Dashboard stats**: 30s staleTime, refetch on window focus disabled
- **Customers/Coupons**: 60s staleTime, manual refetch after mutations
- **Profile**: 5min staleTime, invalidate on update
- **Intake form**: No caching (mutation only)

## State Management

No global state library (Redux/Zustand). TanStack Query handles server state. Local UI state uses React `useState`:
- Search input value (debounced before query)
- Sort column/direction
- Filter dropdown selection
- Modal open/close
- Form field touched states
