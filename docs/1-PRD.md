# PRD — Restoloop Product Requirements

## Problem Statement

Indian restaurant owners lose repeat customers because they have no systematic way to stay in touch after the meal. They rely on memory, paper punch cards, or nothing at all. Meanwhile, every Indian diner has WhatsApp — it's how they communicate with everyone, including businesses.

Restaurant owners need a simple, "set and forget" system that:
1. Collects customer contact info through a familiar channel (WhatsApp)
2. Automatically sends coupon reminders to bring customers back
3. Tracks redemptions so they can see it working — without managing a CRM

Current alternatives (loyalty apps, email marketing, SMS) fail because they require customers to install apps, check email, or pay for SMS — all friction points in the Indian market.

## Solution

Restoloop is a **WhatsApp-first customer winback and reminder engine** for Indian restaurants. The workflow:

1. Restaurant prints a QR code → places it in the restaurant
2. Customer scans QR → opens WhatsApp DM with the restaurant's number → sends "hello"
3. System auto-replies with an opt-in prompt → customer replies "YES"
4. Customer is onboarded (phone captured from WhatsApp sender) → receives a welcome coupon
5. Later, the system automatically sends reminder coupons:
   - **Welcome reminder** — 25 days after signup, if coupon unused
   - **Birthday coupon** — on the customer's birthday
   - **Winback coupon** — 40 days after last visit

All coupon sends go through the restaurant's own WhatsApp number via a decoupled adapter (OpenWA today, Meta Cloud API when ready). No app installs, no email, no SMS.

The restaurant owner gets a simple dashboard to see active guests, coupon history, and credit balance.

**WhatsApp provider**: Currently targeting **OpenWA** (self-hosted, dev-friendly). Production target is **Meta Cloud API**. The adapter is designed for config-only provider swaps.

## User Stories

### Restaurant Owner

1. As a restaurant owner, I want to sign up with just email and password, so that I can start using the product in under a minute.
2. As a restaurant owner, I want to set my restaurant name, address, and coupon discount amounts, so that coupons reflect my brand and pricing.
3. As a restaurant owner, I want to see how many active guests have unredeemed coupons, so that I know the system is working.
4. As a restaurant owner, I want to see all coupons sent (with type, discount, status, and customer), so that I can track campaign performance.
5. As a restaurant owner, I want to filter coupons by type (welcome, birthday, winback), so that I can analyze specific campaigns.
6. As a restaurant owner, I want the system to automatically send birthday coupons to customers on their birthday, so that I never miss an opportunity to delight them.
7. As a restaurant owner, I want the system to automatically send winback coupons to customers who haven't visited in 40 days, so that I bring back lapsing customers without manual effort.
8. As a restaurant owner, I want the system to send welcome reminders at 25 days for unclaimed coupons, so that customers don't forget to use them.
9. As a restaurant owner, I want to see my remaining credit balance, so that I know when to top up.
10. As a restaurant owner, I want to be alerted when credits are running low, so that I don't miss campaign sends.
11. As a restaurant owner, I want to validate a coupon code at the counter by entering it, so that I can honor discounts during checkout.
12. As a restaurant owner, I want coupon validation to automatically record the customer's visit date, so that winback timing is accurate.
13. As a restaurant owner, I want my data to be completely isolated from other restaurants, so that customer lists and coupons are private.
14. As a restaurant owner, I want to reset my password if I forget it, so that I don't lose access to my account.(use supabase aith foer this. like authentivqtion login by google accetc)
15. As a restaurant owner, I want the dashboard and all pages to work on my phone, so that I can check things during service without a laptop(just mobile view , not custom app).

### Customer (Diner)

16. As a customer, I want to join a restaurant's coupon program by scanning a QR code and sending a WhatsApp message, so that I don't need to install any app or fill out forms.
17. As a customer, I want the restaurant to confirm my opt-in and send my welcome coupon immediately, so that I know it worked.
18. As a customer, I want to receive coupons on my birthday, so that I feel valued by the restaurant.
19. As a customer, I want to receive a coupon when I haven't visited in a while, so that I'm reminded to come back.
20. As a customer, I want to receive a reminder if I have an unused coupon, so that I don't let it expire.
21. As a customer, I want to opt out by replying "STOP" at any time, so that I control whether I receive messages.
22. As a customer, I want to rejoin by replying "YES" after opting out, so that I can change my mind.

### Super Admin

23. As a super admin, I want to see all restaurants and their credit balances, so that I can manage the platform.
24. As a super admin, I want to add credits to a restaurant's account, so that they can continue sending campaigns.

## Implementation Decisions  (Suggested only, can  be changed)

### Architecture  

### Modules

### Database Schema


### Data Isolation

All tables use Row Level Security policies scoped to `owner_id = auth.uid()`. Each restaurant's data is fully isolated — no cross-tenant data leakage is possible.

### Campaign Timing

| Campaign | Trigger | Condition | Coupon Expiry |
|----------|---------|-----------|---------------|
| Winback | 40 days since last visit | No recent winback coupon | 7 days |
| Birthday | Today matches birthday (MM-DD) | No birthday coupon this year | 7 days |
| Welcome Reminder | 25 days since signup | Welcome coupon not redeemed | 30 days (from creation) |

### Credit System


### Opt-In Model

- `pending` — Customer messaged but hasn't replied "YES" yet
- `opted_in` — Customer confirmed; receives campaign messages
- `opted_out` — Customer replied "STOP"; skipped by campaign engine
- Only `opted_in` customers receive automated messages
- Opt-in status transitions handled by the WhatsApp webhook handler

## Testing Decisions

### What makes a good test

- Tests verify external behavior, not implementation details
- Each campaign type is tested independently (winback, birthday, reminder)
- WhatsApp adapter is tested via its public interface (not provider internals)
- Credit deduction is verified at the integration level
- Edge cases: zero credits, duplicate coupons, missing customer phone, expired coupons

### Modules tested


## Out of Scope


- SMS or email channels
- Advanced analytics dashboards or charts
- Native mobile app
- Multi-location support per tenant
- Staff or team accounts
- Advanced coupon rules (usage limits, stacking, minimum order)
- Subscription billing (pay-per-credit only)
- POS integration or billing module
- Public API for third-party integrations

## Further Notes


