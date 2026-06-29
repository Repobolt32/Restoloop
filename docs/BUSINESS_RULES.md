# Restoloop Business Rules

> Non-technical reference for product behavior. Verified against actual code June 2026.

---

## 1. What is Restoloop?

Restoloop is a **WhatsApp-first customer retention platform for restaurants**. Customers scan a QR code, opt in via WhatsApp DM, and receive automated coupon reminders to bring them back.

### Core Value Proposition
- Customers onboard by sending a WhatsApp message (QR -> DM -> opt-in)
- The system automatically sends personalized coupons via the restaurant's own WhatsApp number
- Restaurants track redemptions and campaign performance

---

## 2. How It Works

### 2.1 Restaurant Onboarding

| Step | Action |
|------|--------|
| 1 | Restaurant owner signs up with email/password |
| 2 | Creates a restaurant profile (name, address, phone, email, coupon amounts) |
| 3 | System generates a unique QR code linked to the restaurant's WhatsApp number |
| 4 | Owner prints QR codes and places them in the restaurant |

### 2.2 Customer Onboarding (WhatsApp DM — Primary, not yet built)

| Step | Action |
|------|--------|
| 1 | Customer scans QR code at the restaurant |
| 2 | QR opens WhatsApp DM with the restaurant's number |
| 3 | Customer sends any message (e.g. "hello") |
| 4 | System auto-replies: "Reply YES to receive exclusive coupons from [Restaurant]" |
| 5 | Customer replies "YES" |
| 6 | System registers the customer and sends a welcome coupon code |
| 7 | Customer is now opted in for future reminders |

> **Status**: The WhatsApp webhook that powers this flow is not yet built. Currently, customers can only onboard through the web intake form.

### 2.3 Customer Onboarding (Web Form — Fallback, currently the only working path)

| Step | Action |
|------|--------|
| 1 | Customer visits the restaurant's public URL (/form/[slug]) |
| 2 | Fills in: Name, WhatsApp number (+91), optionally birthday + food preference |
| 3 | Submits the form |
| 4 | System creates a welcome coupon |
| 5 | Returns a WhatsApp Click-to-Chat link with prefilled coupon message |

No push message is sent from this endpoint. The customer must tap the link to open WhatsApp.

### 2.4 Opt-In Model

| Status | Meaning | How Set |
|--------|---------|---------|
| `pending` | Customer registered but hasn't opted in yet | Default on signup |
| `opted_in` | Customer said YES to receive coupons | Set on "YES" reply |
| `opted_out` | Customer said STOP or unsubscribed | Set on "STOP" reply |

**Rules:**
- Only `opted_in` customers receive automated campaign messages
- Customers can opt out at any time by replying "STOP"
- Customers can rejoin by replying "YES"



---

## 3. Automated Campaigns

The system runs daily campaigns via cron:

### Welcome Reminder
- **Trigger**: 25 days after customer signup 
- **Condition**: Welcome coupon hasn't been redeemed
- **Action**: Sends reminder: "Hey [Name]! Your coupon [CODE] for [Restaurant] is still active!"

### Birthday Campaign
- **Trigger**: On the customer's birthday (month-day match)
- **Condition**: No birthday coupon sent this year
- **Action**: Generates coupon + sends: "Happy Birthday [Name]! Enjoy Rs.[X] OFF at [Restaurant]"

### Win-back Campaign
- **Trigger**: 40 days after customer's last visit *(currently at 45 days )*
- **Condition**: No recent winback coupon for this customer
- **Action**: Generates coupon + sends: "We miss you [Name]! Come back for Rs.[X] OFF"


---

## 4. Coupon Rules

### 4.1 Coupon Types(can be edited later)

| Type | When Sent | Default Discount | Expiry |
|------|-----------|------------------|--------|
| **Welcome** | On customer signup | Rs.50 | 30 days |
| **Birthday** | On customer's birthday | Rs.38 | 7 days |
| **Win-back** | 40 days after last visit | Rs.30 | 7 days |

*Discount amounts are configurable per restaurant in the profile settings.*

### 4.2 Coupon Codes

- **Welcome coupons**: Format `W{amount}-{6 chars}` (e.g., `W50-ABC123`)
- **Campaign coupons**: 8 characters, uppercase letters + numbers, excluding I/O/0/1 (avoids visual confusion)
- All codes are unique across the system (database unique constraint)

### 4.3 Coupon Statuses

| Status | Meaning |
|--------|---------|
| `sent` | Created and ready for use (default for generated coupons) |
| `redeemed` | Customer used the coupon at the restaurant |
| `expired` | Passed expiry date (set by campaign engine or validation check) |
| `pending` | Reserved for future use |

### 4.4 Coupon Validation

When a coupon is validated at the counter:
1. Staff enters the coupon code
2. System verifies the coupon belongs to the restaurant, is not redeemed, and is not expired
3. Coupon is marked as `redeemed` with a timestamp


---

## 5. Credit System

| Scenario | Credits Used |
|----------|-------------|
| Customer signs up (welcome coupon) | 0 (included in onboarding) |
| Birthday campaign send | 1 credit |
| Win-back campaign send | 1 credit |
| Welcome reminder send | 1 credit |
| No credits remaining | Messages logged as "blocked", no send attempted |





---

## 6. WhatsApp Provider

Restoloop's WhatsApp messaging is in transition toward a decoupled adapter pattern.

| Provider | Status | Use Case |
|----------|--------|----------|
| **Meta Cloud API** | Current | Template-based sends (welcome, birthday, winback) — hardcoded in campaign engine |
| **Third-party (ultramsg/evolution/waha)** | Current | Free-text sends (welcome reminders) — selected via `WHATSAPP_PROVIDER` env var |
| **OpenWA** | Target | Self-hosted, free — the intended primary provider for both template and free-text sends |

The target architecture routes all sends through a single adapter selected by `WHATSAPP_PROVIDER=openwa|meta`. Currently, the code has two separate paths (Meta templates + third-party free-text) that need to be unified under an OpenWA-first adapter.

---

## 7. User Roles

### Restaurant Owner
- Signs up, creates profile
- Views dashboard hub (3 quick-action cards: Add Customer, Active Guests, Coupons)
- Views active guests (customers with unredeemed coupons)
- Views coupon history with type filter
- Edits restaurant profile and coupon amounts
- Validates coupon codes at the counter
- Cannot add credits (admin only)

### Super Admin
- Accesses `/admin` dashboard
- Views all restaurants and credit balances
- Adds credits to restaurants

---

## 8. Data Ownership

| Entity | Owner | Isolation |
|--------|-------|-----------|
| Restaurant profile | Owner (user who created it) | RLS by `owner_id` |
| Customers | Restaurant (tenant) | RLS by `tenant_id` |
| Coupons | Restaurant + Customer | RLS by `tenant_id` |
| Message logs | Restaurant | RLS by `tenant_id` |

Each restaurant is fully isolated — owners cannot see other restaurants' data.

---

## 9. Public Intake Form (Fallback)

```
URL: https://restoloop.app/form/{restaurant-slug}
Example: /form/the-golden
```

| Field | Required | Format |
|-------|----------|--------|
| Name | Yes | Text |
| WhatsApp Number | Yes | +91 followed by 10 digits |
| Birthday | No | Date |
| Food Preference | No | Text |

Returns a WhatsApp Click-to-Chat URL with the coupon code. No push message is sent.

---



*Last updated: June 2026 — verified against actual code.*
