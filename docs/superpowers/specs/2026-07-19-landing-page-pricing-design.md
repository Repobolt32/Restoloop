# Landing Page Pricing Section Alignment Spec

## Overview
Align the landing page (`src/app/page.tsx`) Pricing section with the established SaaS pricing model (Trial ₹599, Pro ₹999, Max ₹1,999, Ultra ₹2,999, and Recharge Packs Starter/Growth/Power).

## Target Architecture & Tiers

### 1. Subscription Tiers Grid
- **Trial**: ₹599 (21 Days) — Unlimited messaging, enrollment table QR code, auto-welcome coupons.
- **Pro** *(Highlighted / Most Popular)*: ₹999/mo — 300 base credits/mo, expiry reminder campaign, customer analytics.
- **Max**: ₹1,999/mo — 700 base credits/mo, birthday coupon campaign, full loyalty portal.
- **Ultra**: ₹2,999/mo — 1,500 base credits/mo, winback campaign triggers, premium analytics.

### 2. Recharge Credits Callout Box
- Information block explaining that unused credits roll over forever.
- Available top-ups:
  - **Starter**: ₹1,500 (🪙 500 credits)
  - **Growth**: ₹3,000 (🪙 1,000 credits)
  - **Power**: ₹6,000 (🪙 2,000 credits)

## Implementation Scope
- Update `Pricing` component in `src/app/page.tsx` to render the 4 tiers grid and the recharge callout box.
- All CTA buttons redirect to `/signup`.
