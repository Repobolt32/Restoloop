# UI/UX Design Spec

## Color Palette (RestroBit-Inspired Light Mode)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#F97316` | Buttons, active states, links, KPI accents |
| `--color-primary-hover` | `#EA580C` | Button hover |
| `--color-page-bg` | `#F3F4F6` | Page background |
| `--color-card-bg` | `#FFFFFF` | Cards, panels, table rows |
| `--color-sidebar-bg` | `#FFFFFF` | Sidebar background |
| `--color-text-primary` | `#111827` | Headings, primary text |
| `--color-text-secondary` | `#6B7280` | Labels, captions |
| `--color-text-tertiary` | `#9CA3AF` | Placeholders, disabled |
| `--color-border` | `#E5E7EB` | Dividers, table borders |
| `--color-success` | `#22C55E` | Success states |
| `--color-danger` | `#EF4444` | Errors, expired |

## Typography

| Element | Size | Weight | Tracking | Line Height |
|---------|------|--------|----------|-------------|
| Page title | `text-2xl` | 700 | `tight` | 1.2 |
| Card title | `text-base` | 600 | normal | 1.4 |
| Body | `text-sm` | 400 | normal | 1.5 |
| Label | `text-xs` | 500 | normal | 1.4 |
| Table header | `text-xs` | 500 | normal | 1.4 |
| KPI value | `text-3xl` | 700 | tight | 1.0 |

**Font:** Inter (system fallback)

## Spacing

- Sidebar width: `240px`
- Content max-width: `1200px`
- Card padding: `20px`
- Section gap: `20px`
- Page padding: `24px`

## Shadows

| Token | Value |
|-------|-------|
| `--shadow-card` | `0 1px 3px rgba(0,0,0,0.08)` |
| `--shadow-dropdown` | `0 4px 6px rgba(0,0,0,0.1)` |

## Badge Colors (Soft Pastel Pills)

| Type | Background | Text |
|------|-----------|------|
| Welcome | `#DBEAFE` | `#1E40AF` |
| Birthday | `#FCE7F3` | `#BE185D` |
| Winback | `#FEF3C7` | `#B45309` |
| Active | `#D1FAE5` | `#047857` |
| Expired | `#FEE2E2` | `#991B1B` |

## Component Inventory

### Layout
- `Sidebar` — 240px white bg, icon + text nav. Active item: light orange bg `#FFF7ED` with orange text `#F97316`.
- `TopBar` — white, breadcrumb left, search center, user avatar right.
- `PageContainer` — max-width 1200px, padding 24px.

### Dashboard
- `KpiCard` — white card, subtle shadow, left border 4px primary, icon + value + label.
- `ActivityFeed` — list of recent events with relative timestamp.
- `CategoryTabs` — horizontal pill tabs, active: orange bg + white text.

### Active Guests
- `ActiveGuestTable` — white card, clean table, no zebra striping.
- Top 10, sorted by expiry soonest.
- Columns: Name | Phone | Code | Discount | Expires In | Type
- Type badges: soft pastel pills.
- Empty state: centered illustration + text.

### Coupons
- `CouponTable` — read-only, status badge color-coded.
- `TypeFilter` — dropdown: All / Welcome / Birthday / Winback.

### Profile
- `ProfileForm` — white card, 2-column grid on desktop, labeled inputs.

### Public Intake Form
- `IntakeForm` — centered card, orange header, simple fields, prominent orange CTA.
- `CouponSuccess` — large code display, WhatsApp confirmation.

## Responsive

- Tablet-first: 768px minimum usable width.
- Sidebar collapses to hamburger on mobile.
- Cards stack vertically below 768px.
- Tables: horizontal scroll on mobile, no card flip.

## Wireframe Descriptions

### Dashboard Page
```
[Sidebar: white] | [TopBar: white, breadcrumb, search, avatar]
          |
          | Dashboard > Overview
          |
          | [KPI: Total Customers] [KPI: Coupons Sent] [KPI: Credits Left]
          |
          | [Activity Feed — Recent Sends]
          |   "Welcome coupon sent to Rajesh — 2 min ago"
          |   "Birthday coupon sent to Priya — 1 hr ago"
```

### Active Guests Page
```
[Sidebar: white] | [TopBar: Active Guests]
          |
          | Active Guests          [count: 8 active]
          |
          | Name    | Phone       | Code     | Discount | Expires | Type
          | Rajesh  | +91 98...   | AMXK7R2Q | ₹50 OFF  | 2 days  | Welcome [blue pill]
          | Priya   | +91 99...   | BDAY5678 | ₹100 OFF | 5 days  | Birthday [pink pill]
```

### Coupons Page
```
[Sidebar: white] | [TopBar: Coupons]
          |
          | [Filter: All ▼]
          |
          | Code     | Type      | Discount | Status    | Sent     | Customer
          | WEL-1234 | Welcome   | ₹50      | Active    | 22 May   | Rajesh
          | BDAY-567 | Birthday  | ₹100     | Redeemed  | 21 May   | Priya
```

### Profile Page
```
[Sidebar: white] | [TopBar: Profile]
          |
          | [Form Card — 2 columns]
          | Restaurant Name  [__________]
          | Address          [__________]
          | Phone            [__________]
          | Welcome Coupon   [__________]
          | Birthday Coupon  [__________]
          |
          | [Save Changes]
```

### Intake Form (Public)
```
[Restoloop Header — orange bg #F97316]

Welcome! Get 10% off your next visit.

Name          [__________]
Phone         [__________]
Birthday      [__________] (optional)

[Get My Coupon]

→ "Your coupon code: WEL-1234. Check WhatsApp!"
```
