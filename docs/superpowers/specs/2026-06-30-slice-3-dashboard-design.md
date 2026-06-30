# UI Design Spec: Slice 3 - Owner Sees Activity Dashboard

This document details the visual guidelines, typography, layout, and component styling for the restaurant owner dashboard, following the project's **Crimson & Warm Saffron** light theme.

---

## 1. Visual Tokens (Light Mode Theme)

Derived from `design-system/restoloop/MASTER.md`:
* **Background (`--color-background`)**: `#FEF2F2` (Warm rose-tinted cream)
* **Foreground (`--color-foreground`)**: `#450A0A` (Deep culinary maroon)
* **Primary / Highlights (`--color-primary`)**: `#DC2626` (Appetizing crimson red)
* **Secondary / Muted Highlights (`--color-secondary`)**: `#F87171` (Soft coral red)
* **Accent / Interactive (`--color-accent`)**: `#A16207` (Warm saffron gold)
* **Border (`--color-border`)**: `#FECACA` (Soft pinkish divider)
* **Muted Surface (`--color-muted`)**: `#F0EDF1` (Off-white gray for card wells)

### Typography Pairing
* **Display / Header Font**: *Playfair Display SC* (serif)
* **Body / Data Font**: *Karla* (high-readability sans-serif)

---

## 2. Layout & Shell Structure

Every dashboard subpage is housed within a persistent left sidebar layout (`src/app/dashboard/layout.tsx`).

### Layout Blueprint (Desktop)
```text
+-------------------------------------------------------------------------+
| [Logo] Restoloop    |                                                   |
|                     |  [Header / Welcome Restaurant Name]               |
|  * Overview         |  [Active Section View]                            |
|  o Guests           |                                                   |
|  o Coupons          |  +---------------------------------------------+  |
|                     |  | Content Area                                |  |
|                     |  |                                             |  |
|                     |  +---------------------------------------------+  |
| [Credits Indicator] |                                                   |
+-------------------------------------------------------------------------+
```

* **Sidebar Styling**: Light gray background (`#F9FAFB` or `#F5F7FA`) with a solid right border (`1px solid var(--color-border)`).
* **Navigation Links**: 
  * Unselected: Maroon text with subtle hover effect (background tint, `transition-all 200ms`).
  * Selected: Accent gold background (`var(--color-accent)`) with white text and a rounded, block-like appearance.
* **Credits Display**: Housed at the bottom of the sidebar. Shows a visual progress meter of remaining platform credits.

---

## 3. Component Specifications

### 3.1. Data Tables (Guests / Coupons)
* **Header Row**: Accent maroon background (`#450A0A`) with bold, white text using the Display font style, with a subtle letter-spacing.
* **Rows**: Alternating subtle white and warm rose background (`#FEF2F2`). Hovering over a row highlights it with a 200ms fade transition.
* **Phone Masking**: Format: `9198765****` (last 4 characters replaced by asterisks). Monospaced digit layout to prevent text jitter.
* **Values / Prices**: Coupons show value formatted as Rupees (`₹X.XX`).

### 3.2. Interactive Filter Chips (Coupons Page)
* **All / Welcome / Birthday / Winback**:
  * Unselected chip: Bordered white pills with Crimson text and gold borders.
  * Selected chip: Solid Crimson background (`#DC2626`) with crisp white text.
  * Transition duration: `200ms` for color changes.

### 3.3. Recent Activity Log Feed
* Displayed on the main Overview page as a styled clean block-based card:
  * **Card Container**: `#FFFFFF` background, `1px solid var(--color-border)` borders, subtle card lift shadow (`var(--shadow-md)`).
  * **Status Badges**:
    * `sent` -> Soft mint green badge (`bg-emerald-100 text-emerald-800`).
    * `failed` -> Soft rose badge (`bg-red-100 text-red-800`).
  * **Masked Phone & Direction Arrow**: Monospaced font showing direction, e.g., `9198765**** → Outbound (welcome_coupon)`.

### 3.4. Credits Bullet/Progress Bar (Overview Page)
* Housed on the main dashboard page:
  * Styled as a custom horizontal SVG bar representing target progress (e.g. `X / 1000 credits`).
  * Green bar (`#22C55E`) indicating remaining capacity, with a target mark at 1000.

---

## 4. Anti-Patterns Avoided
* ❌ Emojis in status badges or table headers.
* ❌ Scale hover transforms that move adjacent elements (transforms will only use translate or opacity shifts).
* ❌ Raw hex values used inside component styles; all colors inherit from Tailwind CSS v4 variables configured in `globals.css`.
