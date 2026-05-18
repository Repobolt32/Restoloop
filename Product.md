# 🍽️ Restoloop — Complete Product Summary
> Restaurant WhatsApp Retargeting SaaS | India Market | Built with Antigravity IDE

---

## What It Does
Restaurant owners get a QR code → customer scans → fills form → gets WhatsApp coupon → comes back → owner makes money. Fully automated.

---

## Tech Stack
| Layer | Decision |
|---|---|
| Framework | Next.js 15 (App Router) |
| Boilerplate | Makerkit Next.js SaaS Lite (`next-supabase-saas-kit-lite`) |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| WhatsApp | Meta Cloud API — raw `fetch()`, no npm library |
| Scheduler | Vercel Cron Jobs — daily 9am IST |
| Payments | Razorpay (Phase 2 only) |
| Hosting | Vercel (free tier) |
| UI | shadcn/ui + Tailwind (included in Makerkit) |
| **MVP Cost** | **₹0/month** |

---

## Pages
| Route | Purpose |
|---|---|
| `/dashboard` | Stats cards + revenue bar chart + active coupons + recent activity |
| `/billing` | Bill calculator + coupon code validator + tax toggle (frontend only) |
| `/restaurant-profile` | Restaurant info + tax rate + coupon discount % + QR code download |
| `/form/[slug]` | **PUBLIC** — customer signup form, no auth, linked to restaurant by slug |
| `/admin` | Super-admin only (you) — all restaurants + your Meta credit wallet |
| Floating Button | WhatsApp support link on every page |

---

## Customer Form Fields
| Field | Required |
|---|---|
| Name | ✅ Yes |
| WhatsApp Number (+91) | ✅ Yes |
| Birthday | ❌ Optional |
| Favourite Dish | ❌ Optional |

---

## QR → Form → Restaurant Link (How It Works)
```
1. Each restaurant gets a unique slug e.g. "sharmas-dhaba"
2. QR code encodes: yourdomain.com/form/sharmas-dhaba
3. Form reads slug from URL → fetches tenant from DB → shows restaurant name
4. On submit: customer saved with tenant_id of THAT restaurant
```
One URL param. That's the entire multi-tenancy for the form.

---

## Coupons — 3 Hardcoded Types (MVP)
| Code | Discount | Trigger | Eligibility | Expiry |
|---|---|---|---|---|
| `WELCOME50` | ₹50 off | Form submitted | First-time customers only | 7 days |
| `HAPPYBDAY` | ₹38 off | Birthday match (daily cron) | Birthday = today | 7 days |
| `HELLO30` | ₹30 off | 40-day inactivity (daily cron) | Last visit > 40 days ago | 10 days |

**Rules:**
- Coupons are never deleted — marked `redeemed` with timestamp
- Discount % is configurable per restaurant in `/restaurant-profile`
- One active coupon per customer at a time

---

## Automation Logic
```
Form submit       → sendWhatsApp() called directly in POST /api/leads
                    (no scheduler needed — instant)

Daily 9am cron    → /api/cron/daily
                  → Check birthdays → send HAPPYBDAY coupons
                  → Check 40-day inactive → send HELLO30 coupons
                  → Check low credits → WhatsApp warning to owner

Message limit     → Max 50 messages/day per restaurant (prevent spam)
Send window       → 10am–12pm IST (best open rates)
Owner control     → Single pause/resume toggle only
```

---

## Billing Page Logic
```
Owner adds items  → name + qty + price → subtotal calculated (frontend)
Tax toggle        → ON/OFF + CGST % + SGST % → added to total (frontend ONLY)
                    Tax rate saved to restaurant profile (pre-fills each time)
                    Tax calculation NEVER sent to backend or stored in DB

Coupon section    → Owner enters code → POST /api/coupons/validate
                  → Backend checks: exists? not redeemed? not expired? correct tenant?
                  → Returns discount amount → applied to total (frontend)

Confirm button    → POST /api/billing/confirm
                  → Marks coupon as redeemed (if provided)
                  → Deducts 1 platform credit (if coupon used)
                  → Records a full transaction in the `bills` table
                  → Backend stores: items (JSON), final_total, subtotal, tax_amount, discount_amount, customer_id
```

---

## Dashboard Metrics
- **Total Customers** — count of all leads for this tenant
- **Coupons Sent** — count of all issued coupons
- **Coupons Redeemed** — count of redeemed coupons
- **Revenue Attributed (₹)** — SUM of bill amounts where coupon was redeemed
- **Revenue Bar Chart** — monthly bar chart of attributed revenue (killer metric)
- **Active Coupons widget** — WELCOME50 / HAPPYBDAY / HELLO30 with sent counts
- **Recent Activity feed** — latest signups + redemptions

---

## Admin Page (You Only — Hidden From Restaurant Owners)
- Total restaurants on platform
- Total customers across all restaurants
- Total messages sent (all time)
- Your Meta credit wallet: bought / used / remaining
- Restaurants list: name, customer count, credits balance, last active
- Low credit alerts (< 100 credits = highlighted red)

---

## Credit & Pricing System
```
1 credit = 1 WhatsApp message sent
Credits never expire
Your cost from Meta ≈ ₹0.50/message
```

| Pack | Credits | Price | Per Credit |
|---|---|---|---|
| Free Trial | 50 | ₹0 (on signup) | — |
| Starter | 500 | ₹1,799 | ₹3.60 |
| Popular 🔥 | 1,000 | ₹2,999 | ₹3.00 |
| Growth | 2,500 | ₹5,999 | ₹2.40 |

**Your margin:** ~₹2.50 per message minimum

**Low credit warning:** When restaurant hits < 100 credits, system auto-sends them a WhatsApp:
> "Aapke 100 credits bache hain. Ab tak X customers reach kiye, ₹Y revenue hua. Top up karein: [link]"

---

## Database Tables (Core)
```sql
tenants          -- one row per restaurant (id, name, slug, owner_id, credits_balance, tax_cgst, tax_sgst, coupon_welcome_amount, etc.)
customers        -- all leads (id, tenant_id, name, phone, birthday, food_pref, visit_count, last_visit, opted_out)
coupons          -- issued coupons (id, tenant_id, customer_id, code, type, discount_amount, issued_at, expires_at, status)
bills            -- ALL transactions (id, tenant_id, coupon_id, customer_id, subtotal, discount_amount, tax_amount, final_total, items)
message_log      -- every WhatsApp sent (id, tenant_id, customer_id, type, status, sent_at)
platform_credits -- your Meta wallet (total_bought, total_used, remaining)
```

---

## API Routes
```
POST /api/leads                  → Save customer + send welcome WhatsApp
POST /api/coupons/validate       → Verify coupon code at billing time
POST /api/billing/confirm        → Mark coupon redeemed + record bill amount
GET  /api/dashboard/stats        → Fetch all dashboard metrics for tenant
GET  /api/qr                     → Generate QR code for tenant slug
GET  /api/cron/daily             → Vercel cron — birthday + winback + low credit jobs
```

---

## Vibe Coding — Safe vs Careful

### ✅ Safe to vibe code (let Antigravity rip):
- Customer form UI `/form/[slug]`
- Dashboard UI — cards, chart, activity feed
- Billing page frontend (items, tax, totals)
- QR code generation (`qrcode` npm package)
- shadcn/ui component wiring
- Vercel cron route structure

### ⚠️ Write carefully / review manually:
- **Supabase RLS policies** — AI gets this wrong. Every table needs `tenant_id` scoping or you leak data between restaurants
- **Coupon validation logic** — check: exists + not redeemed + not expired + matches tenant_id. All 4 conditions.
- **Cron job deduplication** — HAPPYBDAY and HELLO30 must not send twice to same customer same day. Add `sent_today` check.
- **Phone number format** — always store as `+91XXXXXXXXXX`. Meta API rejects other formats silently.
- **Slug generation** — auto-generate on signup, never allow changes (printed QR codes would break)

---

## 7-Day Build Order

```
Day 1 → Clone Makerkit + connect Supabase + run migrations + deploy to Vercel
Day 2 → /form/[slug] public page (mobile-first, no auth)
Day 3 → POST /api/leads + Meta WhatsApp welcome message fires on submit
Day 4 → /billing page — items table + tax toggle (frontend logic)
Day 5 → POST /api/coupons/validate + POST /api/billing/confirm
Day 6 → /dashboard — stats cards + revenue bar chart (recharts)
Day 7 → Vercel cron /api/cron/daily — birthday + winback jobs
```

---

## One-Line Sales Pitch (Hindi)
> **"Hamare system se jo customer wapas aaya, uska bill dekho dashboard pe. Uske baad decide karo."**
> *(Look at the revenue from returning customers on the dashboard. Then decide.)*

---

## Open Questions (Resolve Before Building)
- [ ] What is your Meta WhatsApp Business account phone number? (register TODAY — 24-48hr approval)
- [ ] What are your exact WhatsApp message templates? (submit for Meta approval on Day 1)
- [ ] What will your domain/app name be? (needed for slug URLs)
- [ ] Razorpay account ready for Phase 2?



