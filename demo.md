# Restoloop — Demo Dashboard Spec

Route: `/demo/dashboard`
Purpose: Show to restaurant owner during sales meeting. All data is hardcoded.

---

## Layer 1 — Stat Cards (Top Row)

| Card Label | Value | Sublabel |
|---|---|---|
| Total Customers | **142** | Registered via QR |
| Messages Sent | **89** | Via WhatsApp |
| Coupons Redeemed | **18** | By returning customers |
| Revenue Attributed | **₹ 4,320** | From returning customers |

---

## Layer 2 — Revenue Bar Chart

Title: *"Revenue from Returning Customers (Last 6 Months)"*

| Month | Revenue |
|---|---|
| Oct | ₹ 600 |
| Nov | ₹ 1,100 |
| Dec | ₹ 1,800 |
| Jan | ₹ 1,400 |
| Feb | ₹ 2,200 |
| Mar | ₹ 4,320 |

Chart type: Vertical bar chart. Upward trend is the visual story.

---

## Layer 3 — Coupon Breakdown Widget

Title: *"Active Coupon Types"*

| Coupon | Trigger | Sent | Redeemed |
|---|---|---|---|
| WELCOME50 — ₹50 off | Customer signs up via QR | 142 | 8 |
| HAPPYBDAY — ₹38 off | Customer's birthday (auto) | 12 | 6 |
| HELLO30 — ₹30 off | Inactive 40+ days (auto) | 38 | 4 |

Note: Birthday and win-back are fully automatic — no manual work for owner.

---

## Layer 4 — Recent Activity (2 Tabs)

### Tab 1: Recent Signups

| Name | Joined | Coupon Sent |
|---|---|---|
| Rahul Sharma | Today, 2:14 PM | ✅ WELCOME50 |
| Priya Verma | Today, 11:30 AM | ✅ WELCOME50 |
| Ankit Joshi | Yesterday | ✅ WELCOME50 |
| Meena Patel | 2 days ago | ✅ WELCOME50 |
| Suresh Kumar | 3 days ago | ✅ WELCOME50 |

### Tab 2: Recent Redemptions

| Name | Coupon Used | Discount | Bill Amount | Date |
|---|---|---|---|---|
| Meena Patel | HELLO30 | ₹ 30 | ₹ 480 | Today |
| Suresh Kumar | WELCOME50 | ₹ 50 | ₹ 720 | Yesterday |
| Deepika Singh | HAPPYBDAY | ₹ 38 | ₹ 390 | 2 days ago |
| Ankit Joshi | WELCOME50 | ₹ 50 | ₹ 610 | 3 days ago |
| Rahul Verma | HELLO30 | ₹ 30 | ₹ 540 | 4 days ago |

---

## Bottom Widget — Credits (Small, Bottom Corner)

| Label | Value |
|---|---|
| Credits Remaining | 347 / 500 |
| Approx. Messages Left | ~258 |

Small, unobtrusive. Plants the seed for the credit/pricing model.

---

## Restaurant Header (Top of Page)

Show a fake restaurant name to make it feel real:

- **Restaurant Name:** Sharma's Family Restaurant
- **Location:** Connaught Place, Delhi
- **Owner:** Rajesh Sharma
- **QR Active Since:** 1 Oct 2025
