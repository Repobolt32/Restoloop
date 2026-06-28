# Restoloop Implementation Handoff — 2026-06-28

> Session ended after plan written. Next session: pick execution mode (subagent-driven vs inline) + start Slice 1.

---

## Where We Are

✅ **Brainstorming complete** — all 6 sections approved, spec written
✅ **Plan written** — 8 slices, 28 tasks, 6 phases
✅ **Spec committed** — `docs/superpowers/specs/2026-06-28-restoloop-design.md`
✅ **Plan committed** — `docs/superpowers/plans/2026-06-28-restoloop-implementation.md`

❌ **Execution not started** — need to pick subagent-driven vs inline
❌ **No code written yet**

---

## Locked Decisions (from spec)

| Decision | Value |
|----------|-------|
| Stack | Next.js 14+ (App Router) + TypeScript + Tailwind + Supabase + Vercel |
| Auth | Supabase Auth (email/password) |
| DB | 4 tables: restaurants, customers, coupons, message_logs |
| RLS | DB-level (`owner_id = auth.uid()`) |
| WhatsApp | OpenWA (dev) → Meta (prod), adapter pattern |
| Cron | 10am IST = 04:30 UTC daily |
| Payment | Razorpay (India-native) |
| Initial credits | 1000 free on signup |
| Webhook dedupe | UNIQUE on `message_logs.provider_message_id` |
| Slug | Auto-generate, owner can edit |
| Birthday | MM-DD, year optional |
| Opt-out link | Every outbound message |
| Testing | Defer for MVP |
| UI/UX | Use `ui-ux-pro-max` + `frontend-design` skills (rejects old coral/navy/Inter/Stitch) |

---

## Execution Plan Overview

**8 slices, each ships working feature:**

- **S1: "Hello Restoloop"** — signup → restaurant → empty dashboard
- **S2: "Customer joins"** — QR → WhatsApp opt-in → welcome coupon
- **S3: "Owner sees activity"** — dashboard tables, recent activity feed
- **S4: "First campaign fires"** — cron, welcome reminder (25d)
- **S5: "Birthday + winback fire"** — remaining 2 campaign types
- **S6: "Coupon redemption"** — validation screen, last_visit_at update
- **S7: "Credits work"** — Razorpay self-serve top-up
- **S8: "Admin sees all"** — super admin panel

**Execution order:** S1 → S2 → S3 → S4 → S5 → S6 → S7 → S8

---

## Next Session: Resume Here

### Step 1: Pick Execution Mode

**Option A: Subagent-Driven (recommended)**
- I dispatch fresh subagent per task
- Review between tasks
- Fast iteration
- Invoke: `superpowers:subagent-driven-development`

**Option B: Inline Execution**
- Execute tasks in this session
- Batch with checkpoints
- Invoke: `superpowers:executing-plans`

### Step 2: Start Slice 1

Once mode picked, start Task 1.1: Initialize Next.js + Supabase

```bash
cd E:\desktop\Restoloop
npx create-next-app@latest . --typescript --app --tailwind --eslint --src-dir --import-alias "@/*"
```

### Step 3: Add Zod to package.json (BEFORE Task 1.4)

Plan uses `zod` for validation in server actions. Need to add:

```bash
npm install zod
```

**Add this to Task 1.1** (before any server action is written).

---

## Tech Stack Summary

**Frontend + Backend:** Next.js 14+ (App Router) + TypeScript + Tailwind
**Database + Auth:** Supabase (Postgres + Auth + RLS)
**Hosting:** Vercel + Vercel Cron
**WhatsApp:** OpenWA (dev) + Meta Cloud API (prod) via adapter
**Payments:** Razorpay Node SDK
**Validation:** Zod (needs install)

**Libraries verified via ref mcp:**
- Next.js Server Actions ✅
- Supabase RLS `auth.uid()` ✅
- Vercel cron config ✅
- Razorpay webhook signature ✅

**OpenWA API:** Not yet verified. Verify in Task 2.2 before writing OpenWA adapter.

---

## File Locations

| File | Purpose |
|---|---|
| `docs/superpowers/specs/2026-06-28-restoloop-design.md` | Approved design spec |
| `docs/superpowers/plans/2026-06-28-restoloop-implementation.md` | Full implementation plan |
| `docs/design-handoff-2026-06-28.md` | Brainstorm handoff (prior session) |
| `docs/handoff-2026-06-28-implementation.md` | **This file** |

---

## Memory Updates Needed

Update `~/.claude/projects/E--desktop-Restoloop/memory/restoloop-brainstorm-state.md`:

```markdown
- **Plan complete:** docs/superpowers/plans/2026-06-28-restoloop-implementation.md
- **Execution mode:** TBD (subagent-driven vs inline)
- **Next session:** Pick mode + start Slice 1
- **Zod install needed:** Before Task 1.4
```

---

## Quick Start (Next Session)

```bash
# 1. Pick execution mode (subagent-driven recommended)
# 2. Invoke skill: superpowers:subagent-driven-development OR superpowers:executing-plans
# 3. Start Task 1.1
npx create-next-app@latest . --typescript --app --tailwind --eslint --src-dir --import-alias "@/*"
npm install @supabase/supabase-js @supabase/ssr zod
```

---

**Ready to execute. Pick mode + go.**
