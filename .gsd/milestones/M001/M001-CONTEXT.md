# M001 — Restoloop Production Readiness

## Project Description

Restoloop is a multi-tenant SaaS customer retention platform for restaurants. Customers scan QR codes to fill intake forms, receive welcome coupons via WhatsApp Click-to-Chat, and the system automatically runs birthday, win-back, and welcome reminder campaigns via WhatsApp templates. Restaurants manage everything through a dashboard. A super admin manages credits across all tenants.

This milestone slices the product into its 9 feature areas, documents what's built vs what's missing for each, and provides a trackable structure so any future issue maps to a specific slice.

## Why This Milestone

The codebase is a functional MVP with 49 known issues. But issues are tracked as a flat list — no structure. When a new bug appears, there's no way to know which feature area it belongs to, what else is broken in that area, or whether the area is production-ready.

This milestone creates the structure: 9 slices based on the product's feature areas. Each slice documents its current status, what's built, what's broken, and what's missing. Any issue that comes in maps to exactly one slice.

## User-Visible Outcome

When this milestone ships:

1. **Restaurant Onboarding** — Owner signs up, creates profile, gets QR code, prints it
2. **Customer Intake** — Customer scans QR, fills form, gets welcome coupon via WhatsApp
3. **Automated Campaigns** — System sends birthday, win-back, and welcome reminder campaigns automatically
4. **Coupon System** — Staff validates coupons at restaurant, coupons get marked redeemed
5. **WhatsApp Messaging** — Correct templates used, correct parameters passed, credits deducted
6. **Credit System** — Admin adds credits, campaigns block when credits exhausted
7. **Dashboard** — Accurate stats, working filters, correct currency symbols
8. **Admin Panel** — Only super admin can manage credits, tenant oversight works
9. **Auth & Security** — Safe redirects, no leaked errors, RLS enforced

## Completion Class

**Integration** — the code already works in isolation. This milestone requires proving the pieces work together: WhatsApp templates receive correct parameters, coupon validation marks redemption, admin auth blocks non-admins, dashboard counts match database reality.

## Final Integrated Acceptance

1. Restaurant owner signs up → creates profile → QR code generated → customer scans → fills form → gets welcome coupon via WhatsApp Click-to-Chat
2. 15 days later → welcome reminder sent via 3rd party WhatsApp
3. Customer's birthday → birthday coupon sent via Meta template with correct discount and code
4. 45 days inactive → win-back coupon sent via Meta template
5. Customer presents coupon at restaurant → staff validates → coupon marked redeemed → cannot reuse
6. Admin adds credits to tenant → campaigns run → credits deducted from both tenant and platform
7. Dashboard shows accurate stats: correct birthday count, real coupon performance, working retry button

## Architectural Decisions

### Decision 1: Slice by product feature, not by technical layer

**Rationale:** Issues are feature-driven ("birthday campaign sent wrong template"), not layer-driven ("lib/whatsapp.ts has a bug"). Slicing by feature makes issue triage natural: "this belongs to Slice 3: Automated Campaigns."

**Alternatives considered:**
- Slice by technical layer (frontend, backend, database): Loses feature context
- Slice by page/component: Too granular, doesn't capture cross-cutting concerns like WhatsApp

### Decision 2: Each slice is self-contained

**Rationale:** A slice includes everything needed to understand and fix that feature: the business rules, the code files, the current status, and what's broken. No cross-referencing needed.

**Alternatives considered:**
- Shared dependency map: Complex, hard to maintain
- Flat issue list: What we're replacing

### Decision 3: Status per slice, not per issue

**Rationale:** Instead of tracking 49 individual issues, track 9 slices. Each slice has a status (working/partial/broken/missing). Issues are notes within a slice, not the primary tracking unit.

**Alternatives considered:**
- Track every issue individually: Overwhelming, no structure
- Only track critical issues: Loses medium/low issues

## Error Handling Strategy

- **WhatsApp API failures:** Already handled — message logged as `failed`, campaign continues. No change needed.
- **Credit exhaustion:** Already handled — messages logged as `blocked`. No change needed.
- **Coupon validation errors:** Already returns specific error codes. Fix: actually mark as redeemed on success.
- **Auth errors:** Currently leak error details via URL params. Fix: generic error messages, log details server-side.
- **Open redirects:** Fix: validate `next` param against allowed domains or relative paths only.

## Risks and Unknowns

| Risk | Impact | Mitigation |
|------|--------|------------|
| WhatsApp template names may not match Meta Business account | Campaigns fail silently | Verify template names against Meta dashboard before deploying |
| Supabase type generation may reveal deeper schema mismatches | Type errors across codebase | Run generation early, fix incrementally |
| Credit race condition during concurrent cron runs | Double-spending credits | Add database-level locking or idempotency keys |
| E2E tests may reveal more broken features than expected | Scope creep | Note failures, fix in priority order per slice |

## Existing Codebase / Prior Art

| Module | Status | Slice |
|--------|--------|-------|
| `lib/campaigns.ts` | Working | S03 Automated Campaigns |
| `lib/whatsapp.ts` | Partial | S05 WhatsApp Messaging |
| `lib/coupons.ts` | Working | S04 Coupon System |
| `lib/tenant.ts` | Working | S01 Restaurant Onboarding |
| `lib/slug.ts` | Working | S01 Restaurant Onboarding |
| `lib/restoloop.types.ts` | Working | S09 Auth & Security (infra) |
| `lib/supabase/server.ts` | Working | S09 Auth & Security (infra) |
| `app/api/leads/route.ts` | Partial | S02 Customer Intake |
| `app/api/coupons/validate/route.ts` | Partial | S04 Coupon System |
| `app/api/cron/process-campaigns/route.ts` | Working | S03 Automated Campaigns |
| `app/home/dashboard/page.tsx` | Partial | S07 Dashboard |
| `app/home/customers/page.tsx` | Working | S07 Dashboard |
| `app/home/coupons/page.tsx` | Partial | S07 Dashboard |
| `app/home/restaurant-profile/page.tsx` | Working | S01 Restaurant Onboarding |
| `app/form/[slug]/page.tsx` | Working | S02 Customer Intake |
| `app/admin/page.tsx` | Working | S08 Admin Panel |
| `app/admin/_lib/server-actions.ts` | Partial | S08 Admin Panel |
| `app/auth/*` | Partial | S09 Auth & Security |
| `middleware.ts` | Working | S09 Auth & Security |
| `__tests__/e2e/` | Broken | S09 Auth & Security (infra) |

## Relevant Requirements

This milestone creates the tracking structure for the entire product. No new features. The requirements are:

1. 9 slices defined, each with current status
2. Every existing code file mapped to exactly one slice
3. Every known issue mapped to exactly one slice
4. Any new issue can be triaged to a slice in under 30 seconds

## Scope

### In Scope

- Define 9 slices based on product feature areas
- Document current status per slice (what's built, what's broken, what's missing)
- Map all existing code files to slices
- Map all known issues to slices
- Create traceability: issue → slice → code files → business rules

### Out of Scope

- Fixing any bugs (that's execution, this is structure)
- Adding new features
- Refactoring code
- Writing tests

### Non-Goals

- Replace existing issue tracking
- Create GitHub issues for everything
- Prioritize issues (that's triage, not structure)

## Technical Constraints

- Slices based on BUSINESS_RULES.md feature areas
- Each slice is independent (no cross-slice dependencies for tracking)
- Status is per-slice (working/partial/broken/missing)
- Issues are notes within slices, not primary tracking units

## Integration Points

| System | Slice | Notes |
|--------|-------|-------|
| Supabase Auth | S09 | Email/password, session cookies |
| Supabase Database | S09 | All CRUD, RLS policies |
| WhatsApp Meta Cloud API | S05 | Template messages for campaigns |
| WhatsApp 3rd Party | S05 | Free-text messages for reminders |
| Cloudflare Turnstile | S02 | CAPTCHA on public intake form |
| Vercel | S09 | Deployment, cron jobs |

## Testing Requirements

- No new tests in this milestone
- Existing tests continue passing
- E2E test status documented per slice (broken specs noted)

## Acceptance Criteria

- [ ] 9 slices defined with clear boundaries
- [ ] Each slice has: business rules reference, code file list, current status, known issues
- [ ] Every code file in `app/`, `lib/`, `components/` mapped to exactly one slice
- [ ] Every issue from `fina-issues.md` and `issues-open.md` mapped to exactly one slice
- [ ] New issue can be triaged to a slice by matching against slice descriptions

## Open Questions

1. **WhatsApp template names:** Are `birthday_coupon` and `winback_coupon` approved in Meta Business account?
2. **Admin user ID:** Is `SUPER_ADMIN_USER_ID` set in production?
3. **Coupon redemption flow:** Does staff enter code manually, or is there a scan flow?
4. **Credit race condition:** Is concurrent cron runs a real risk or theoretical?

---

*Created: 2026-06-21*
*Source: docs/BUSINESS_RULES.md*
