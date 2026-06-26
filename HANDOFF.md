# Handoff — All Issues Resolved

**Date:** June 26, 2026
**Branch:** `main`
**Status:** 22/22 GitHub issues CLOSED. All 3 polish items fixed and verified.

---

## Issue 1: Discount shows % instead of ₹ — FIXED

**File:** `app/home/coupons/coupons-content.tsx:154`

Was: `{coupon.discount}%`
Now: `₹{coupon.discount}`

---

## Issue 2: API routes excluded from middleware — FIXED

**File:** `middleware.ts:13`

Matcher no longer excludes `api/*`. Only `/api/cron` is skipped (line 18).

---

## Issue 3: Simulated sends return success: true — FIXED

**File:** `lib/whatsapp.ts:121`

Was: `return { success: true, messageId: \`mock_3rd_${Date.now()}\` };`
Now: `return { success: false, error: 'Missing 3rd-party WhatsApp provider configuration' };`

---

## Verification

- **TypeScript**: Pass (`pnpm typecheck`)
- **Lint**: Pass (`pnpm lint`)
- **Unit tests**: 47/47 Pass (`pnpm test`)
- **Build**: Pre-existing env issue (requires HTTPS `NEXT_PUBLIC_SITE_URL` for production build)

---

## OpenCode Setup (New)

The project now has proper OpenCode configuration:

- `AGENTS.md` — primary context file (auto-loaded at session start)
- `opencode.json` — config with `instructions: ["AGENTS.md", "HANDOFF.md"]`
- `.opencode/skills/fix-handoff/SKILL.md` — skill for fixing remaining issues
- `CLAUDE.md` — symlink to AGENTS.md for backward compatibility
- `.opencode/agents/` — PM, coder, and tester agents (already existed)

---

**All done. Ready to ship.**
