# Plan: Implement Meta Cloud API Adapter (for real this time)

## Context

progress.md claims OpenWA → Meta migration was completed on 2026-07-13, but the actual `src/lib/whatsapp/meta.ts` is mostly stubs. Only `verifyWebhookChallenge` works. The `openwa.ts` still exists despite progress.md saying it was deleted. The webhook GET verification will work after the user subscribes in Meta Portal, but:

- **POST /api/whatsapp** → `MetaAdapter.validateWebhook` returns `null` → 400 "Invalid webhook"
- **sendText** → returns `{ success: false, error: 'Meta requires templates' }`
- **sendTemplate** → returns `{ success: false, error: 'Not implemented' }`

Result: inbound customer messages silently dropped, no outbound messages delivered.

## Tech Skills Used

| Skill | Purpose |
|-------|---------|
| `route-handlers` | Next.js App Router route.ts patterns (loaded) |
| `ponytail` | Lazy minimal implementation, YAGNI (active, full level) |
| `zod` | Validate Meta webhook payload at trust boundary |
| `find-docs` / Context7 | Fetched current Meta Cloud API docs (v20.0) |
| `supabase-postgres-best-practices` | Reuse existing createServiceClient pattern |
| `test` / `tdd` | Update meta.test.ts with real implementation tests |
| `karpathy-guidelines` | Surgical changes, no over-engineering |

## Implementation Plan

### Task 1: Implement `MetaAdapter.validateWebhook`
**File:** `src/lib/whatsapp/meta.ts`

Parse Meta's nested payload shape:
```
entry[].changes[].value.messages[].{from, id, timestamp, text.body, type}
entry[].changes[].value.metadata.display_phone_number  → to
entry[].changes[].value.contacts[].profile.name          → sender name (optional)
```

- Return `null` for status updates (no `messages[]` array) — these are delivery receipts
- Verify HMAC-SHA256 signature using `META_APP_SECRET` and `x-hub-signature-256` header
- If signature mismatch → return `null` (security boundary)
- If no `messages[]` → return `null` (status update, not inbound message)
- Extract `from`, `body` (from `text.body`), `messageId` (from `id`), `timestamp` (parse to number)
- Extract `to` from `metadata.display_phone_number`

### Task 2: Implement `MetaAdapter.sendText`
**File:** `src/lib/whatsapp/meta.ts`

```
POST https://graph.facebook.com/v20.0/{META_PHONE_NUMBER_ID}/messages
Authorization: Bearer {META_ACCESS_TOKEN}
Content-Type: application/json

{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<phone>",
  "type": "text",
  "text": { "body": "<text>" }
}
```

Note: Meta only allows free-text sends within 24h window of customer's last inbound. Outside that window, must use templates. `sendText` is used for webhook replies (opt-in prompt, coupon delivery) — within 24h window, so OK.

### Task 3: Implement `MetaAdapter.sendTemplate`
**File:** `src/lib/whatsapp/meta.ts`

```
POST https://graph.facebook.com/v20.0/{META_PHONE_NUMBER_ID}/messages
{
  "messaging_product": "whatsapp",
  "to": "<phone>",
  "type": "template",
  "template": {
    "name": "<template>",
    "language": { "code": "en_US" },
    "components": [{ "type": "body", "parameters": [...] }]
  }
}
```

The `vars` array maps to body parameters as `{ type: "text", text: var }`.

### Task 4: Update `MetaAdapter.parseInbound`
**File:** `src/lib/whatsapp/meta.ts`

Same parsing logic as validateWebhook but returns `InboundMessage` shape (no `to`/`timestamp`).

### Task 5: Update `MetaAdapter.getStatus`
**File:** `src/lib/whatsapp/meta.ts`

```
GET https://graph.facebook.com/v20.0/{META_PHONE_NUMBER_ID}
?fields=verified_name,quality_rating,display_phone_number
Authorization: Bearer {META_ACCESS_TOKEN}
```

Return display_phone_number or quality_rating.

### Task 6: Fix signature header in `route.ts`
**File:** `src/app/api/whatsapp/route.ts`

Line 30: `request.headers.get('x-signature')` → `request.headers.get('x-hub-signature-256')`

### Task 7: Handle status update webhooks gracefully
**File:** `src/app/api/whatsapp/route.ts`

Currently `validateWebhook` returning `null` → 400 error. Meta sends status updates (delivered/read/sent) frequently. Should return 200 OK for status updates, not 400.

Logic:
- If signature invalid → 400 (real error)
- If signature valid but no `messages[]` (status update) → 200 OK (no-op)
- If signature valid + `messages[]` present → process inbound

This requires splitting `validateWebhook` to distinguish "bad signature" from "status update". Simplest: return a discriminated result, or have `validateWebhook` return the event and let route check signature separately.

**Ponytail approach:** Add a new method `verifySignature(rawBody, signature): boolean` to the adapter interface. Route calls it first. If valid, then calls `validateWebhook`. If `validateWebhook` returns null (status update), return 200 OK.

Actually simpler: `validateWebhook` already does both. Just change route to return 200 (not 400) when `validateWebhook` returns null AND signature is valid. But we don't know if null means "bad sig" or "status update".

**Cleanest minimal approach:** Add `verifySignature(rawBody, signature): boolean` to interface. Route:
```ts
if (!adapter.verifySignature(rawBody, signature)) return 400
const event = adapter.validateWebhook(rawBody, signature)
if (!event) return NextResponse.json({ status: 'status_update' })  // 200 OK
```

### Task 8: Update tests
**File:** `src/lib/whatsapp/meta.test.ts` (create if doesn't exist)

Tests for:
- validateWebhook: valid inbound, status update (null), bad signature (null), malformed JSON (null)
- sendText: success, HTTP error, network error
- sendTemplate: success, builds correct payload
- verifyWebhookChallenge: matching token, wrong token, wrong mode
- verifySignature: valid HMAC, invalid HMAC, missing secret

**File:** `src/app/api/whatsapp/route.test.ts`

Update mock to include `verifySignature` returning true. Update test for status update case (should return 200, not 400).

### Task 9: Clean up OpenWA remnants
**Files:** `src/lib/whatsapp/openwa.ts`, `src/lib/whatsapp/openwa.test.ts`

progress.md says these were deleted but they still exist. Since `WHATSAPP_PROVIDER=meta` in all envs and adapter.ts defaults to OpenWA only when provider is missing, we have two options:

**Ponytail choice:** KEEP openwa.ts for now. It's not hurting anything. The adapter factory routes to MetaAdapter when `WHATSAPP_PROVIDER=meta`. Deleting it is a separate cleanup task. YAGNI — don't delete working code that's not actively causing bugs.

But DO remove `resolveLidPhone?` from `types.ts` since Meta doesn't use LIDs and the route.ts still has LID branching code that's dead weight with Meta.

Actually wait — route.ts has 40+ lines of LID branching. progress.md says this was removed but it wasn't. With Meta, `event.from` is always a real E.164 phone (no `@lid`). All LID code is dead.

**Decision:** Strip LID branching from route.ts. It's dead code with Meta. Update tests that reference LID.

### Task 10: Verify
- `pnpm typecheck` → 0 errors
- `pnpm lint` → 0 errors
- `pnpm test` → all pass
- `pnpm build` → clean build

### Task 11: Update progress.md
Add new section documenting what was actually done (vs what progress.md previously claimed).

## Out of Scope (YAGNI)

- Deleting openwa.ts (separate cleanup)
- Template status update DB logging (not needed for MVP)
- Message status tracking (delivered/read) — not stored
- Meta API version upgrade (v20.0 → v25.0) — works fine, upgrade later if needed
- Phone number quality update handling

## Execution Order

1. Implement meta.ts (Tasks 1-5) — single file, all methods
2. Add verifySignature to interface + Meta + Mock + OpenWA (Task 7 prep)
3. Fix route.ts (Tasks 6, 7) — signature header + status update handling + strip LID code
4. Update tests (Task 8)
5. Verify (Task 10)
6. Update progress.md (Task 11)
