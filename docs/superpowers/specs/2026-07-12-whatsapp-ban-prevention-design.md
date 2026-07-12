# WhatsApp Ban Prevention — Design Spec (2026-07-12)

## Goal

Implement five mutually-reinforcing layers of WhatsApp safety to protect restaurant phone numbers from being banned by Meta's spam filters during the early warm-up phase and at steady-state operation.

---

## 1. Double-Opt-In Conversational Hook

### How it works

The intake form at `src/app/form/[slug]/actions.ts` creates a customer record with `opt_in_status = 'opted_in'` and returns a `wa.me` link. When the customer taps the link, they message the restaurant WhatsApp. The webhook at `src/app/api/whatsapp/route.ts` receives the inbound message and checks the customer's state.

**Current behaviour (to change):** The webhook immediately sends the full coupon message to an `opted_in` customer.

**New behaviour:**
1. Customer taps `wa.me` link → sends prefilled message → webhook receives it.
2. If this is the **first message** from the customer (no prior `opt_in_confirm` log), the webhook sends a **warm greeting with a single YES prompt** — no coupon yet:
   > *"Hi [Name]! 🎁 Welcome to [Restaurant]. Reply YES to confirm and receive your [X]% discount coupon. Reply STOP to cancel."*
3. Customer replies `YES` (or `Y`) → webhook sends the actual coupon.

This forced two-way exchange removes the "Block/Report" banner from the customer's screen before any marketing content is delivered.

### Opt-out gate on intake form

If a customer's phone exists in the DB with `opt_in_status = 'opted_out'`, the form rejects the submission with:
> *"You have opted out of this loyalty club. Please contact the restaurant to re-enable your membership."*

Opted-out customers can only be re-enabled by the restaurant owner adding them manually via the dashboard.

### YES/Y affirmative matching

The webhook already normalises the body with `.toUpperCase()`. We extend the match condition from:
```
if (body === 'YES')
```
to:
```
if (body === 'YES' || body === 'Y')
```

---

## 2. Dynamic Spintax & Phrase Variation

A lightweight Spintax resolver is added as a pure utility function in `src/lib/whatsapp/spintax.ts`. It resolves `{A|B|C}` tokens into a randomly chosen variant before every message send.

**Format:** `{Hey|Hi|Hello} {Name}! {Your coupon|Here is your coupon} code {is|:} ...`

**Constraints:**
- No nested `{}` blocks — flat only (ponytail: keeps the regex single-pass and predictable).
- Works on all outbound message strings: opt-in prompt, coupon delivery, birthday, winback, expiry reminder, welcome reminder.
- No external packages — plain JS `String.replace()` with a callback.

---

## 3. Human-like Jitter (Randomized Reply Delays)

All **webhook-triggered outbound messages** (opt-in prompt, coupon delivery) are sent with a randomized delay of 5–8 seconds before calling `adapter.sendText()`.

**Implementation:** Use Next.js `after()` from `next/server`.
- Return the `200 OK` response immediately.
- Schedule the actual jitter + send inside `after(async () => { ... })`.

This prevents OpenWA from timing out on the webhook (no waiting) and prevents WhatsApp from flagging instantaneous bot replies.

**Cron campaign messages do NOT use `after()`** — they use the hourly batch distribution (pillar 5) as their natural spread mechanism. No in-process sleep is needed there.

---

## 4. Interactive Chat History Checks

Before sending any **scheduled campaign message** (birthday, winback, expiry reminder, welcome reminder), the campaign engine checks that the customer has **at least one inbound message log** (direction = `'inbound'`) in `message_logs`.

If no inbound record exists, the campaign message is skipped and a `blocked_no_prior_interaction` status is logged in `message_logs`.

**Exception: manually-added customers.** The restaurant owner can use the admin dashboard to mark a customer as having interacted (a boolean `has_interacted` column, or the check can be bypassed for customers manually added by the owner via `source = 'manual'`). For now (ponytail: YAGNI) we skip the bypass — manual customers are simply not eligible for campaigns until they interact once. The owner is expected to have in-person conversations with these customers.

---

## 5. Hourly Batch Cron Distribution

### Problem

The daily cron runs all 4 campaign types for all restaurants in one synchronous loop. With jitter between messages, this will eventually timeout as restaurants grow.

### Solution

Change `vercel.json` cron schedule from `30 4 * * *` (once daily) to `0 * * * *` (once per hour, 24 times/day).

Each hourly run processes a **batch of up to 5 customers per restaurant** for each campaign type. To prevent double-sending, the campaign engine checks `message_logs` to see if that customer already received that campaign type **today** (UTC date match).

This naturally spreads a 100-customer restaurant's daily messages across the full 24-hour window (100 / 5 batches = 20 hours). No queues, no new tables.

**No sleep/jitter needed in the cron** — the human variation is provided by spreading across hours.

---

## Architecture Summary

### Files modified

| File | Change |
|------|--------|
| `src/lib/whatsapp/spintax.ts` | **New** — pure `resolveSpintax(template: string): string` function |
| `src/app/api/whatsapp/route.ts` | Use `after()`, add jitter, update YES/Y match, double-opt-in gate logic, spintax on all outbound messages |
| `src/app/form/[slug]/actions.ts` | Add `opted_out` gate: reject form if `opt_in_status === 'opted_out'` |
| `src/lib/campaigns/index.ts` | Add prior-interaction check; add `today` date dedup check; apply spintax to all campaign messages |
| `vercel.json` | Change cron schedule from `30 4 * * *` to `0 * * * *` |

### No new DB tables or migrations needed

The `message_logs` table already stores both `direction` and `type`. The hourly dedup check reads from it. No schema changes required.

---

## Testing Plan

### Unit tests (Vitest)
- `spintax.ts`: resolves single-option, multi-option, consecutive tokens; handles no-token strings unchanged.
- Webhook route: `YES` and `Y` both trigger coupon send; other strings resend prompt; `opted_out` customer in form action returns error.
- Campaign engine: skips customer if no inbound log exists; skips customer if already sent today.

### Manual / E2E
1. Submit intake form with opted-out phone → see error banner.
2. Submit intake form normally → tap wa.me link → receive greeting message (no coupon yet).
3. Reply YES → receive coupon message.
4. Reply Y → same.
5. Trigger hourly cron twice → verify no duplicate messages for same customer on same day.
6. Inspect all outbound messages for spintax variation.
