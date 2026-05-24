# Implementation Plan

## Build Order

1. Auth (sign-in / sign-up / reset)
2. Dashboard (`/home`)
3. Customers (`/home/customers`)
4. Coupons (`/home/coupons`)
5. Intake form (`/form/[slug]`)
6. Polish (color palette, error states, loading states)

## Milestones

| Milestone | Acceptance Criteria | Files |
|-----------|---------------------|-------|
| **M1: Auth** | Sign-up, sign-in, password reset, update password all work. Clean auth pages only. | `app/auth/**`, `lib/auth/**` |
| **M2: Dashboard** | 3 KPI cards render real data from `/api/dashboard/stats`. Activity feed visible. | `app/home/page.tsx`, `components/dashboard/**` |
| **M3: Active Guests** | Table shows only customers with active (sent, not expired) coupons. Top 10, sorted by expiry soonest. Server Component fetches via Supabase directly. | `app/home/customers/page.tsx` |
| **M4: Coupons** | Read-only table, filter by type, shows status badges. | `app/home/coupons/page.tsx`, `components/coupons/**` |
| **M5: Intake** | Public form submits to `/api/leads`, shows coupon on success. Mobile-first. | `app/form/[slug]/page.tsx`, `components/intake/**` |
| **M6: Polish** | Color palette applied sitewide. Loading skeletons on all pages. Error boundaries. | `styles/**`, `components/ui/**` |

## File Structure / Routing Plan

```
app/
├── auth/
│   ├── sign-in/page.tsx          # M1
│   ├── sign-up/page.tsx          # M1
│   ├── reset-password/page.tsx   # M1
│   └── update-password/page.tsx  # M1
├── home/
│   ├── page.tsx                  # M2 — Dashboard
│   ├── layout.tsx                # Shared sidebar layout
│   ├── customers/page.tsx        # M3
│   ├── coupons/page.tsx        # M4
│   └── profile/page.tsx        # (already exists, verify working)
├── form/
│   └── [slug]/page.tsx           # M5 — Public intake form
├── api/
│   └── (existing routes — no changes)
components/
├── layout/
│   ├── Sidebar.tsx               # 260px, nav items, active pill
│   └── TopBar.tsx                # Mobile hamburger + title
├── dashboard/
│   ├── KpiCard.tsx               # Icon + value + label
│   ├── ActivityFeed.tsx          # List of recent events
│   └── LineChart.tsx             # Optional: Recharts 30-day
├── customers/
│   ├── CustomerTable.tsx         # Sortable table
│   └── CustomerSearch.tsx        # Debounced search input
├── coupons/
│   ├── CouponTable.tsx           # Read-only table + badges
│   └── TypeFilter.tsx            # Dropdown filter
├── intake/
│   ├── IntakeForm.tsx            # Name, phone, birthday, dish
│   └── CouponSuccess.tsx         # Post-submit display
├── ui/
│   ├── Button.tsx                # Primary / secondary variants
│   ├── Input.tsx                 # Labeled input with error
│   ├── Card.tsx                  # Card wrapper
│   ├── Badge.tsx                 # Status badges
│   └── Skeleton.tsx              # Loading skeletons
└── providers/
    └── QueryProvider.tsx         # TanStack Query setup
lib/
├── queries/
│   ├── useDashboardStats.ts      # Query hook for stats
│   ├── useCustomers.ts           # Query hook for customers
│   ├── useCoupons.ts             # Query hook for coupons
│   └── useProfile.ts             # Query + mutation for profile
├── schemas/
│   ├── auth.ts                   # Zod auth schemas
│   ├── profile.ts                # Zod profile schema
│   └── intake.ts                 # Zod intake schema
└── utils/
    └── format.ts                 # Phone formatter, date formatter
```

## Task Breakdown

### Phase 1: Foundation

- [ ] Install TanStack Query, Zod, Recharts (optional)
- [ ] Create `components/providers/QueryProvider.tsx`
- [ ] Create `components/ui/` base components (Button, Input, Card, Badge, Skeleton)
- [ ] Create `lib/schemas/` with Zod shapes
- [ ] Verify Supabase SSR auth setup

### Phase 2: Auth Pages

- [ ] Rebuild `/auth/sign-in` with plain HTML form + Server Action
- [ ] Rebuild `/auth/sign-up` with confirm password
- [ ] Rebuild `/auth/reset-password` with email input
- [ ] Rebuild `/auth/update-password` for post-reset flow
- [ ] Test auth flow end-to-end

### Phase 3: Layout

- [ ] Build `Sidebar` component (260px, orange pill active state)
- [ ] Build `TopBar` for mobile
- [ ] Create `home/layout.tsx` with Sidebar + TopBar
- [ ] Clean layout, remove unused wrappers

### Phase 4: Dashboard

- [ ] Create `useDashboardStats` query hook
- [ ] Build `KpiCard` component
- [ ] Build `ActivityFeed` component
- [ ] Wire `/home` page with real data
- [ ] Add loading skeletons

### Phase 5: Active Guests

- [ ] Create Server Component page that queries `coupons` joined with `customers`
- [ ] Filter: `status = 'sent'` and `expires_at > now()`
- [ ] Sort by `expires_at` ascending
- [ ] Limit 10
- [ ] Display: Name, Phone, Code, Discount, Expires In, Type
- [ ] Add empty state

### Phase 6: Coupons

- [ ] Create `useCoupons` query hook with type filter
- [ ] Build `CouponTable` with status badges
- [ ] Build `TypeFilter` dropdown
- [ ] Wire `/home/coupons` page

### Phase 7: Intake Form

- [ ] Build `IntakeForm` component (mobile-first)
- [ ] Build `CouponSuccess` component
- [ ] Wire `/form/[slug]` page
- [ ] Handle duplicate phone error gracefully

### Phase 8: Polish

- [ ] Apply color palette sitewide (#E8634A primary, #1A1A2E dark bg)
- [ ] Replace all 7xl/9xl typography
- [ ] Add loading states to all pages
- [ ] Add error boundaries (`error.tsx` on each route)
- [ ] Test all flows on mobile viewport

## Dependencies to Verify

| Package | Purpose | Status |
|---------|---------|--------|
| `@supabase/ssr` | Auth SSR | Already installed |
| `@tanstack/react-query` | Server state | Needs install |
| `zod` | Form validation | Needs install |
| `recharts` | Line chart (optional) | Needs install |
| `lucide-react` | Icons | Already installed |
| `tailwind-merge` | Class merging | Already installed |
| `clsx` | Conditional classes | Already installed |

## No-Go Zones

- **Do not modify backend** — Supabase schema, APIs, cron jobs stay untouched
- **Do not add new API endpoints** — Use existing `/api/dashboard/stats`, `/api/customers`, `/api/coupons`, `/api/profile`, `/api/leads`
- **Do not add OAuth** — Email + password only
- **Do not add i18n** — English only
- **Do not add POS billing**
- **Do not add subscriptions** — Pay-per-credit only

## Testing Checklist

- [ ] Auth: sign-up → sign-in → sign-out → reset password
- [ ] Dashboard: KPIs match backend data
- [ ] Customers: search filters, sort works
- [ ] Coupons: type filter changes results
- [ ] Intake: submit → coupon displayed → WhatsApp sent
- [ ] Mobile: all pages usable at 375px width
- [ ] Auth guard: unauthenticated users redirected from `/home`
