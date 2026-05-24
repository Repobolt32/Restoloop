# Component Contracts: Restoloop Frontend

**Phase 1 — Design & Contracts**  
**Date**: 2026-05-24

## KPI Card

```typescript
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { direction: 'up' | 'down' | 'neutral'; label: string };
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}
```

**States**: Loading (skeleton pulse), Loaded (value displayed), Error (retry button)
**Layout**: Card with title, large value text, optional subtitle and trend indicator

---

## Activity Feed

```typescript
interface ActivityItem {
  id: string;
  type: 'birthday' | 'coupon_sent' | 'low_credit';
  customerName?: string;
  couponCode?: string;
  timestamp?: string;
  message: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}
```

**States**: Loading (skeleton list), Empty (no recent activity), Loaded, Error
**Low credit**: Rendered as prominent alert (orange accent) when present

---

## Customer Table

```typescript
interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  birthday: string | null;
  lastVisit: string;
  visitCount: number;
  customerSince: string;
}

type SortField = keyof CustomerRow;
type SortDirection = 'asc' | 'desc';

interface CustomerTableProps {
  data: CustomerRow[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}
```

**Internal state** (component-managed):
- `searchQuery: string`
- `sortField: SortField` (default: `name`)
- `sortDirection: SortDirection` (default: `asc`)

**Sortable columns**: All columns
**Search**: Client-side filter on `name` OR `phone` ILIKE query

---

## Coupon List

```typescript
type CouponType = 'welcome' | 'bday' | 'winback';

interface CouponRow {
  id: string;
  code: string;
  type: CouponType;
  discount: number;
  status: 'pending' | 'sent' | 'redeemed' | 'expired';
  sentDate: string;
  customerName: string;
}

interface CouponListProps {
  data: CouponRow[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}
```

**Internal state**:
- `typeFilter: CouponType | 'all'` (default: `'all'`)

**Type display map**:
- `welcome` → "Welcome"
- `bday` → "Birthday"
- `winback` → "Winback"

---

## Profile Form

```typescript
interface ProfileFormData {
  name: string;
  address: string;
  phone: string;
  email: string;
  couponWelcome: number;
  couponBday: number;
  couponWinback: number;
}

interface ProfileFormProps {
  initialData: ProfileFormData;
  onSave: (data: ProfileFormData) => Promise<void>;
}
```

**Validation rules**:
- `name`: required, non-empty
- `phone`: required, matches Indian mobile pattern
- `couponWelcome`, `couponBday`, `couponWinback`: required, positive numbers
- `email`: read-only (managed by auth system)
- `address`: optional

**States**: Editing, Saving, Saved (success), Error

---

## Intake Form

```typescript
interface IntakeFormData {
  name: string;
  phone: string;
  birthday?: string;
  favoriteDish?: string;
}

interface IntakeFormProps {
  restaurantName: string;
  restaurantSlug: string;
}

interface IntakeFormResult {
  success: boolean;
  couponCode?: string;
  error?: string;
  errorCode?: 'INVALID_INPUT' | 'NO_CREDITS' | 'SERVER_ERROR';
}
```

**Validation rules**:
- `name`: required, non-empty, max 100 chars
- `phone`: required, 10-digit Indian mobile format
- `birthday`: optional, valid date, not in future
- `favoriteDish`: optional, max 200 chars

**States**: Filling, Validating, Submitting, Success (coupon display), NoCredits, Error
