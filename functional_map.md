# Restoloop Functional Map

This document provides a complete audit of the Restoloop application's pages, features, and interactive elements as of March 17, 2026.

## 1. Landing Page (`/`)
The entry point for visitors, showcasing the product's value proposition.
- **Features:** Hero section with value proposition, features overview (Dashboard, Auth, Multi-tenancy, Billing), and CTA.
- **Interactive Elements:**
  - **[Get Started]** (Button): Navigates to `/auth/sign-up`.
  - **[Contact Us]** (Link): Navigates to `/contact`.
  - **[Sign In]** (Footer Link): Navigates to `/auth/sign-in`.

![Landing Page](file:///C:/Users/iamku/.gemini/antigravity/brain/6537beb6-96ac-4bd3-87f2-6652493bec2e/landing_page.png)

---

## 2. Dashboard (`/home`)
The central hub for restaurant owners to monitor their performance.
- **Features:** Real-time stats cards (Revenue, Customers, Coupons Sent/Redeemed), Revenue Analytics Chart, Active Coupons widget, and Recent Activity feed.
- **Interactive Elements:**
  - **[View Lead Form]** (Link): Opens the public registration form (`/form/[slug]`).
  - **[Billing Counter]** (Link): Navigates to the POS terminal (`/home/billing`).
  - **[Configure Settings]** (Link): Navigates to the Restaurant Profile (`/home/restaurant-profile`).

![Dashboard](file:///C:/Users/iamku/.gemini/antigravity/brain/6537beb6-96ac-4bd3-87f2-6652493bec2e/dashboard.png)

---

## 3. Billing Counter (POS) (`/home/billing`)
A dedicated terminal for managing customer bills and coupon redemptions.
- **Features:** Dynamic row addition for bill items, subtotal calculation, optional GST tax application, and coupon validation logic.
- **Interactive Elements:**
  - **[Add Item]** (Button): Adds a new row for bill items.
  - **[Remove Item]** (Icon Button): Removes a specific bill item.
  - **[Dish/Item name]** (Input): Text entry for item name.
  - **[Qty]** (Number Input): Quantity adjustment.
  - **[Price (₹)]** (Number Input): Individual item price.
  - **[Apply GST Taxes]** (Switch): Toggles CGST/SGST calculation.
  - **[CODE]** (Input): Accepts 4-8 character coupon codes.
  - **[Apply]** (Button): Validates and applies the coupon discount to the grand total.
  - **[Confirm Bill]** (Button): Processes the final bill and updates revenue metrics.

![Billing Counter](file:///C:/Users/iamku/.gemini/antigravity/brain/6537beb6-96ac-4bd3-87f2-6652493bec2e/billing_counter.png)

---

## 4. Restaurant Profile (`/home/restaurant-profile`)
Global configuration for the restaurant's identity and coupon values.
- **Features:** Restaurant naming, immutable slug mapping, tax rate settings, and default coupon values for different campaign types.
- **Interactive Elements:**
  - **[Tax Rate (%)]** (Number Input): Defines the global tax percentage.
  - **[Welcome/Birthday/Win-back]** (Number Inputs): Defines default ₹ discount values.
  - **[Copy Link]** (Button): Copies the public form URL to the clipboard.
  - **[Save Profile]** (Button): Updates the tenant record in the database.

![Restaurant Profile](file:///C:/Users/iamku/.gemini/antigravity/brain/6537beb6-96ac-4bd3-87f2-6652493bec2e/restaurant_profile.png)

---

## 5. Public Lead Form (`/form/[slug]`)
The customer-facing registration page for lead collection.
- **Features:** Branded header, welcome discount offer, and WhatsApp lead collection.
- **Interactive Elements:**
  - **[Your Name]** (Input): Required customer name.
  - **[WhatsApp Number]** (Input): Required 10-digit mobile number.
  - **[Birthday]** (Date Input): Optional birthday for future campaigns.
  - **[Claim Welcome Coupon]** (Button): Submits the form and triggers coupon generation via WhatsApp.

![Public Form](file:///C:/Users/iamku/.gemini/antigravity/brain/6537beb6-96ac-4bd3-87f2-6652493bec2e/public_form.png)

---

## 6. Super Admin Dashboard (`/admin`)
Restricted oversight panel for platform administrators.
- **Features:** Global metrics (Total Tenants, Circulating Credits, Master Credits) and tenant management table.
- **Interactive Elements:**
  - **[Adjustment Amount]** (Input): Defines the step for credit adjustments.
  - **[-] / [+] [Add]** (Buttons): Deducts or adds credits to a specific tenant's account.

![Admin Dashboard](file:///C:/Users/iamku/.gemini/antigravity/brain/6537beb6-96ac-4bd3-87f2-6652493bec2e/admin_dashboard.png)
