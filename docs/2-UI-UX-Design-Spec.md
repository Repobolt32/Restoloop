# UI/UX Design Spec

## Color Palette (Petpooja-Inspired Light Mode)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#E8634A` | Buttons, active states, links, KPI accents |
| `--color-page-bg` | `#F3F4F6` | Page background (light gray) |
| `--color-card-bg` | `#FFFFFF` | Cards, panels, table rows |
| `--color-text-primary` | `#111827` | Headings, primary text (slate-900) |
| `--color-text-secondary` | `#6B7280` | Labels, captions, muted text (gray-500) |
| `--color-text-tertiary` | `#9CA3AF` | Placeholders, disabled (gray-400) |
| `--color-border` | `#E5E7EB` | Dividers, table borders (gray-200) |
| `--color-success` | `#22C55E` | Success states, active coupons |
| `--color-warning` | `#EAB308` | Low credit alert |
| `--color-danger` | `#EF4444` | Errors, expired coupons |

## Tag Colors (Soft Pastel Pills)

| Tag | Background | Text |
|-----|-----------|------|
| VIP | `#FEF3C7` | `#B45309` |
| Regular | `#DBEAFE` | `#1E40AF` |
| First-Timer | `#D1FAE5` | `#047857` |
| Winback | `#FCE7F3` | `#BE185D` |

## Typography

| Element | Size | Weight | Tracking | Line Height |
|---------|------|--------|----------|-------------|
| Page title | `text-2xl` | 700 | `tight` | 1.2 |
| Card title | `text-base` | 600 | normal | 1.4 |
| Body | `text-sm` | 400 | normal | 1.5 |
| Label | `text-xs` | 500 | normal | 1.4 |
| Table header | `text-xs` | 500 | normal | 1.4 |
| KPI value | `text-3xl` | 700 | tight | 1.0 |
| KPI label | `text-sm` | 400 | normal | 1.4 |

**Rules:**
- Max heading: `text-3xl` (admin), `text-2xl` (auth)
- No `tracking-tighter` on giant headers
- No uppercase `tracking-[0.4em]` labels
- Font: Inter (system fallback)

## Spacing

- Sidebar width: `260px`
- Content max-width: `1200px`
- Card padding: `24px`
- Section gap: `24px`
- Table cell padding: `12px 16px`
- Page padding: `24px` desktop, `16px` mobile

## Component Inventory

### Layout
- `Sidebar` — 260px fixed left, white bg, subtle right border. Nav items with coral pill active indicator.
- `TopBar` — mobile hamburger + page title
- `PageContainer` — max-width 1200px, centered

### Dashboard
- `KpiCard` — white card, subtle shadow, icon + value + label, primary accent border-left 4px
- `ActivityFeed` — list of recent events with timestamp
- `LineChart` (optional) — Recharts, 30-day message sends

### Active Guests
- `ActiveGuestTable` — shows customers with active (sent, not expired) coupons only
- Top 10, sorted by expiry soonest
- Columns: Name | Phone | Coupon Code | Discount | Expires In | Type
- No search/filter needed (small, high-signal list)
- Empty state: "No active coupons right now"

### Coupons
- `CouponTable` — read-only, type badge (color-coded)
- `TypeFilter` — dropdown: All / Welcome / Birthday / Winback

### Profile
- `ProfileForm` — editable fields, save button
- `FormInput` — labeled input with error state

### Auth
- `AuthForm` — email + password, plain HTML, no containers
- `PasswordResetForm` — email input + submit

### Public Intake Form
- `IntakeForm` — name, phone, birthday, favorite dish
- `CouponSuccess` — coupon code display, WhatsApp confirmation

## User Flows

### Auth Flow
```
Sign In page → Submit → Server Action validates → Cookie set → Redirect /home
                     ↓
              Invalid → Error message on form
```

### Intake Form Flow
```
Landing /form/[slug] → Fill form → Submit → Backend creates customer + coupon
                                              ↓
                                       WhatsApp API sends message
                                              ↓
                                       Success page with coupon code
```

### Dashboard Flow
```
Sign in → /home → Fetch /api/dashboard/stats → Render KPIs + activity feed
```

## Wireframe Descriptions

### Dashboard Page
```
[Sidebar: white bg] | [TopBar: Dashboard]
          |
          | [KPI Card: Total Customers] [KPI: Coupons Sent] [KPI: Credits Remaining]
          |
          | [Activity Feed — Recent Sends]
          |   - "Welcome coupon sent to Rajesh"
          |   - "Birthday coupon sent to Priya"
          |   - "Low credit: 23 remaining"
          |
          | [Optional: Line Chart — 30-day sends]
```

### Active Guests Page
```
[Sidebar: white bg] | [TopBar: Active Guests]
          |
          | Name      | Phone       | Code     | Discount | Expires In | Type
          | Rajesh    | +91 98...   | AMXK7R2Q | ₹50 OFF  | 2 days     | Welcome
          | Priya     | +91 99...   | BDAY5678 | ₹100 OFF | 5 days     | Birthday
          | ...
```

### Coupons Page
```
[Sidebar: white bg] | [TopBar: Coupons]
          |
          | [Filter: All ▼]
          |
          | Code       | Type      | Discount | Status  | Sent Date | Customer
          | WEL-1234   | Welcome   | 10%      | Active  | 22 May    | Rajesh
          | BDAY-567   | Birthday  | 20%      | Active  | 21 May    | Priya
          | ...
```

### Profile Page
```
[Sidebar: white bg] | [TopBar: Profile]
          |
          | Restaurant Name  [__________]
          | Address        [__________]
          | Phone          [__________]
          | Email          [__________]
          | Welcome Coupon [__________]
          | Birthday Coupon[__________]
          |
          | [Save Changes]
```

### Intake Form (Public)
```
[Restaurant Name Header]

Welcome! Get 10% off your next visit.

Name          [__________]
Phone         [__________]
Birthday      [__________] (optional)
Favorite Dish [__________] (optional)

[Get My Coupon]

→ Success: "Your coupon code: WEL-1234. Check WhatsApp!"
```
