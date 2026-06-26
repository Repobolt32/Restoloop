# Handoff — 3 Remaining Issues

**Date:** June 26, 2026
**Branch:** `main`
**Status:** 22/22 GitHub issues CLOSED. 3 minor polish items remain.

---

## Issue 1: Discount shows % instead of ₹

**File:** `app/home/coupons/coupons-content.tsx:154`
**Line:** `{coupon.discount}%`

Change `%` to `₹` (rupee symbol).

---

## Issue 2: API routes excluded from middleware

**File:** `middleware.ts:13`
**Line:** `matcher: ['/((?!_next/static|_next/image|images|locales|assets|api/*).*)']`

The `api/*` exclusion means non-cron API routes (like `/api/leads`, `/api/coupons/validate`) skip session refresh. Either remove `api/*` from the exclusion or add specific API routes that need session handling.

---

## Issue 3: Simulated sends return success: true

**File:** `lib/whatsapp.ts:121`
**Line:** `return { success: true, messageId: \`mock_3rd_${Date.now()}\` };`

When WA provider is missing, simulated sends return `success: true` which still deducts credits for phantom messages. Should return `success: false` or add a `simulated` flag so campaigns.ts can skip credit deduction.

---

**All other bugs are fixed. Tests pass. Ready for these 3 quick fixes then ship.**
