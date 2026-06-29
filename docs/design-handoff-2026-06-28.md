# Restoloop Design Handoff — 2026-06-28

> Session ended mid-brainstorm. Next session: continue design from Section 3 (webhook flow + campaign engine).

---

## Project

**Restoloop** — WhatsApp-first customer winback engine for Indian restaurants.

**Docs:** `docs/Doc-Restoloop.md` (PRD), `docs/BUSINESS_RULES.md` (ideas, not law — flexible), `docs/DEVELOPER_GUIDE.md` (old stack reference).

**Previous codebase:** Reset to docs only. Starting fresh. 6 known bugs documented in BUSINESS_RULES.md section 10 — all were from dropped code, not relevant to new build.

---

## Decisions Locked This Session

### Target & Positioning
- **Target:** Tier-2/3 small restaurants, owner-operated, no POS, "set and forget"
- **Why not Reelo:** Reelo is full POS-tied loyalty suite (₹3,250/outlet/mo). Too heavy for dhabas.
- **Competitor landscape:**
  - Reelo (leader, 32k+ restaurants, full CRM)
  - Rewardz, Fundle.ai, SpotBay, GoLoyal, Bingage, Royalink, LoyalBond — all smaller
  - Gap: "set and forget" auto-winback without POS integration = underserved niche

### Architecture
- **Stack:** Next.js (App Router) + Supabase (Postgres + auth + RLS) + Vercel cron
- **Monolith approach:** Server Actions + Route Handlers, single repo, single deploy
- **WhatsApp:** OpenWA self-host (dev) → Meta Cloud API (prod later). Adapter pattern = one interface, two impls.
- **Monetization:** Monthly subscription tiers (not pay-per-credit as original PRD said)

### MVP Scope
- Full restaurant dashboard
- QR → WhatsApp opt-in flow
- 3 campaign types: welcome reminder (25d), birthday, winback (40d)
- Credit management (per-subscription-tier)
- Super admin panel
- ~2-3 weeks solo dev

### WhatsApp API Cost Reality (India, July 2025)
- Meta Marketing: ~₹0.78-0.89/msg
- Meta Utility: ~₹0.115/msg (free inside 24h window)
- OpenWA: free (self-hosted, owner runs gateway, risk of bans)

---

## Data Model Decisions

### 4 Tables
1. **restaurants** — owner account + profile + coupon defaults + credits + plan
2. **customers** — per-restaurant (UNIQUE restaurant_id + phone), opt-in status, last_visit, birthday
3. **coupons** — per-restaurant+customer, type, code (unique), discount_cents, status, expires
4. **message_logs** — audit trail, direction, type, status, error

### Key Design Choices
- All money in `cents` (integer) — no float bugs
- Phone E.164 format `919876543210` (no `+`)
- `customers.last_visit_at` — drives winback 40-day timer, updated on coupon redeem
- `birthday` as `date` — year-agnostic MM-DD matching in cron
- RLS enforced at DB level, not app level (defense in depth)
- Same phone can be customer at 2 restaurants (UNIQUE per restaurant_id)
- `restaurants.slug` — powers public `/form/[slug]` intake fallback URL

### Open Questions (Not Yet Decided)
1. Slug: auto-generate from name or owner-chosen?
2. Birthday: year required or just MM-DD?
3. Initial credits: signup bonus (100 free) or pay first?

---

## WhatsApp Adapter Design

```ts
interface WhatsAppAdapter {
  sendText(phone, text): Promise<SendResult>
  sendTemplate(phone, template, vars): Promise<SendResult>
  validateWebhook(rawBody, signature): WebhookEvent
  parseInbound(rawBody): InboundMessage
}
```

Two implementations:
- **OpenWAAdapter** (dev): free-text, no signature, session-based URL, phone format `91xxx@c.us`
- **MetaAdapter** (prod): templates need pre-approval, HMAC SHA256 signature, nested payload, Bearer token auth

Swap via `WHATSAPP_PROVIDER=openwa|meta` env var. One config flip, zero business logic changes.

Migration path: ship OpenWA, get customers, add MetaAdapter when ready, flip env var. No DB changes.

---

## Where We Left Off

### ✅ Completed in Brainstorming Skill
1. ✅ Explore project context — competitor research done
2. ✅ Ask clarifying questions — all answered
3. ✅ Propose 2-3 approaches — monolith chosen
4. 🔄 **Present design sections — IN PROGRESS**
   - ✅ Section 1: Architecture + Modules — approved
   - ✅ Section 2: Data Model — approved
   - ❌ **Section 3: Webhook flow + campaign engine — NEXT**
   - ❌ Section 4: Dashboard UI (will need ui-ux-pro-max skill)
   - ❌ Section 5: Error handling
   - ❌ Section 6: Testing strategy
5. ❌ Write design doc
6. ❌ Spec self-review
7. ❌ User reviews written spec
8. ❌ Invoke writing-plans skill

### Next Session: Pick Up Here
Start with **Section 3: Webhook Flow + Campaign Engine**:
- Customer sends "hello" via QR → webhook receives → auto-reply opt-in prompt
- Customer replies "YES" → status → pending → opted_in → send welcome coupon
- Customer replies "STOP" → opted_out → skip in campaigns
- Daily cron (10am IST) → scan customers for:
  - Birthday matches today, no birthday coupon this year
  - Last visit 40+ days ago, no recent winback
  - Signup 25 days ago, welcome coupon unredeemed
- Credit deduction per successful send
- Block send if zero credits (log as "blocked_no_credits")

Then Section 4: Dashboard UI (invoke `ui-ux-pro-max` skill per user memory — they rejected old coral/navy/Inter/Stitch design system).

---

## Memory & Context for Next Session

- **Caveman mode:** ACTIVE (full level). Terse, no filler.
- **UI/UX approach:** Use `ui-ux-pro-max` + `frontend-design` skills (user memory override — rejects old design system)
- **Old framework brand:** Never mention (per memory `feedback_forget-legacy-name.md`)
- **Model:** User set `qwen3.7-max` as default for new sessions
- **Brainstorming skill:** Must follow full checklist before any code

---

## File Locations

| File | Purpose |
|---|---|
| `docs/Doc-Restoloop.md` | PRD (gaps to fill) |
| `docs/BUSINESS_RULES.md` | Ideas doc (flexible, not law) |
| `docs/DEVELOPER_GUIDE.md` | Old stack reference |
| `docs/UI-UX-Design-Spec.md` | Says "use ui-ux-pro-max" |
| `docs/design-handoff-2026-06-28.md` | **This file** |
| `~/.claude/projects/E--desktop-Restoloop/memory/` | Cross-session memory |
