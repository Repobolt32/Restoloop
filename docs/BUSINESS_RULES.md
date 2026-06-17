# Restoloop Business Rules

> Non-technical reference for stakeholders, product managers, and support teams.

---

## 1. What is Restoloop?

Restoloop is a **customer retention platform for restaurants**. It helps restaurants bring customers back automatically through WhatsApp-based coupon campaigns.

### Core Value Proposition
- Restaurants collect customer data via QR code intake forms
- The system automatically sends personalized coupons via WhatsApp
- Restaurants track redemptions and campaign performance

---

## 2. How It Works

### 2.1 Restaurant Onboarding

| Step | Action |
|------|--------|
| 1 | Restaurant owner signs up with email/password |
| 2 | Creates a restaurant profile (name, address, phone, email) |
| 3 | System generates a unique public URL and QR code |
| 4 | Owner prints QR codes and places them in the restaurant |

### 2.2 Customer Intake

| Step | Action |
|------|--------|
| 1 | Customer scans QR code or visits the public URL |
| 2 | Fills in: Name, WhatsApp number (+91 Indian numbers) |
| 3 | Optionally provides: Birthday, favourite dish |
| 4 | Submits the form |
| 5 | System creates a welcome coupon |
| 6 | System returns a WhatsApp Click-to-Chat URL with prefilled coupon message |
| 7 | Customer clicks the link to open WhatsApp and send themselves the coupon |

### 2.3 Automated Campaigns

The system runs three types of automated campaigns:

#### Welcome Reminder (15-day)
- **Trigger**: 15 days after customer signs up
- **Condition**: Welcome coupon hasn't been redeemed yet
- **Action**: Sends a reminder WhatsApp message
- **Message**: "Hey [Name]! Your welcome coupon code [CODE] for [Restaurant] is still active!"

#### Birthday Campaign
- **Trigger**: On the customer's birthday (matching month-day)
- **Condition**: No birthday coupon sent this year
- **Action**: Generates a new coupon and sends via WhatsApp template

#### Win-back Campaign
- **Trigger**: 45 days after customer's last visit
- **Condition**: No winback coupon sent recently
- **Action**: Generates a coupon and sends via WhatsApp template

### 2.4 Coupon Validation

| Step | Action |
|------|--------|
| 1 | Customer presents coupon code at restaurant |
| 2 | Staff opens dashboard and navigates to Coupons page |
| 3 | Staff enters coupon code for validation |
| 4 | System checks: valid code, belongs to this restaurant, not expired, not already redeemed |
| 5 | Returns: Customer name, discount amount, coupon status |

---

## 3. Coupon Rules

### 3.1 Coupon Types

| Type | When Sent | Default Discount | Expiry |
|------|-----------|------------------|--------|
| **Welcome** | When customer signs up (Click-to-Chat) | ₹50 | 30 days |
| **Birthday** | On customer's birthday | ₹38 | 7 days |
| **Win-back** | 45 days after last visit | ₹30 | 7 days |

### 3.2 Coupon Codes

- **Welcome coupons**: Format `W{amount}-{6 chars}` (e.g., `W50-ABC123`)
- **Birthday/Win-back coupons**: 8 characters long (e.g., `AMXK7R2Q`)
  - Uppercase letters and numbers only
  - Excludes visually confusing characters: I, O, 0, 1
- All codes are unique across the system

### 3.3 Coupon Statuses

| Status | Meaning |
|--------|---------|
| **sent** | Created and ready for use (default status on creation) |
| **redeemed** | Customer used the coupon at the restaurant |
| **expired** | Coupon passed its expiry date |

### 3.4 Deduplication Rules

- **Birthday**: Only one birthday coupon per customer per calendar year
- **Win-back**: Only one winback coupon per 45-day period
- **Welcome reminder**: Only one reminder per welcome coupon

---

## 4. Credit System

### 4.1 How Credits Work

- Each restaurant (tenant) has a `credits_balance`
- Each successful WhatsApp message costs **1 credit**
- Credits are deducted from both:
  - The restaurant's balance
  - The platform's master wallet

### 4.2 Credit Behaviors

| Scenario | What Happens |
|----------|--------------|
| Customer signs up | No credit deducted (welcome uses Click-to-Chat URL) |
| Birthday campaign runs | 1 credit deducted (birthday coupon) |
| Win-back campaign runs | 1 credit deducted (winback coupon) |
| 15-day reminder sent | 1 credit deducted (reminder) |
| No credits remaining | Messages are blocked, logged as "blocked" |

### 4.3 Platform Credits

- The platform master wallet is seeded with **1,000 credits**
- New restaurants start with **0 credits**
- Admin must manually add credits before campaigns can run
- Both tenant balance and platform wallet are deducted on each message

---

## 5. WhatsApp Messaging

### 5.1 Two Channels

| Channel | Used For | Provider |
|---------|----------|----------|
| **Meta Cloud API** | Template messages (welcome, birthday, winback) | WhatsApp Business |
| **Third-party** | Free-text reminders | Ultramsg, Evolution, WAHA |

### 5.2 Message Types

| Type | Channel | Template Name |
|------|---------|---------------|
| Welcome coupon | Click-to-Chat URL | N/A (prefilled wa.me link) |
| Birthday coupon | Meta | `birthday_coupon` |
| Win-back coupon | Meta | `winback_coupon` |
| 15-day reminder | Third-party | Free text |

### 5.3 Phone Number Format

- Indian numbers only (starting with +91)
- Stored as 10 digits without country code (e.g., `9876543210`)
- WhatsApp API receives numbers without the `+` prefix

---

## 6. User Roles

### 6.1 Restaurant Owner

- Signs up and creates a restaurant profile
- Views dashboard, customers, and coupons
- Validates coupon codes
- Cannot add credits (admin only)

### 6.2 Super Admin

- Accesses `/admin` dashboard
- Views all restaurants and their credit balances
- Adds credits to restaurants
- Manages platform-wide settings

---

## 7. Data Ownership

| Entity | Owner |
|--------|-------|
| Restaurant profile | Belongs to the owner (user who created it) |
| Customers | Belong to the restaurant (tenant) |
| Coupons | Belong to the restaurant and customer |
| Message logs | Belong to the restaurant |

### 7.1 Multi-Tenancy Rules

- Each restaurant is isolated (cannot see other restaurants' data)
- A user can own multiple restaurants (system uses the oldest one)
- Row Level Security (RLS) enforces data isolation at the database level

---

## 8. Public Intake Form

### 8.1 URL Structure

```
https://restoloop.app/form/{restaurant-slug}
```

Example: `https://restoloop.app/form/the-golden-spoon`

### 8.2 Slug Rules

- Generated from restaurant name (first two words)
- Lowercase, hyphenated (e.g., "The Golden Spoon" → `the-golden`)
- Unique across the system
- **Immutable** after first creation

### 8.3 Form Fields

| Field | Required | Format |
|-------|----------|--------|
| Name | Yes | Text |
| WhatsApp Number | Yes | 10-digit Indian number |
| Birthday | No | Date (MM/DD/YYYY) |
| Favourite Dish | No | Text |

---

## 9. Dashboard Pages

| Page | Purpose |
|------|---------|
| `/home` | Central hub with quick actions |
| `/home/dashboard` | Overview metrics |
| `/home/customers` | List of active customers with coupons |
| `/home/coupons` | All coupons (filterable by type) |
| `/home/restaurant-profile` | Edit restaurant details, view QR code |
| `/admin` | Super admin: manage credits across all restaurants |

---

## 10. Error Handling

### 10.1 Campaign Errors

- If WhatsApp API fails: coupon is created but marked as "failed" in message log
- If credits are exhausted: messages are logged as "blocked"
- Campaign continues processing other tenants despite individual failures

### 10.2 Form Submission Errors

- Duplicate phone numbers: existing customer record is updated
- Invalid phone numbers: rejected by form validation
- Network errors: user sees retry option

---

## 11. Security

| Feature | Implementation |
|---------|----------------|
| Authentication | Supabase Auth (email/password) |
| Authorization | Row Level Security (RLS) on all tables |
| CSRF Protection | Cloudflare Edge CSRF middleware |
| CAPTCHA | Cloudflare Turnstile on public forms |
| Data Isolation | Tenant-scoped queries via RLS policies |

---

## 12. Billing Model

- **Credit-based**: Pay per message sent
- **Two-tier wallet**: Restaurant wallet + Platform master wallet
- **Manual top-up**: Admin adds credits via admin dashboard
- **Deduction**: 1 credit per successful WhatsApp delivery

---

*Document generated from codebase analysis. Last updated: June 2026.*
