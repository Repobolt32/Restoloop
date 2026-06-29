# Restoloop

## Skills

Before implementing any slice, invoke relevant tech skills from `.claude/skills/`:

- **Server-side:** `server-actions`, `route-handlers`, `vercel-functions`
- **Database:** `supabase-postgres-best-practices`, `zod`
- **UI:** `frontend-design`, `tailwind-design-system`, `web-design-guidelines`
- **Testing:** `playwright-best-practices`, `playwright-visual-testing`
- **Billing:** `razorpay`
- **Guidelines:** `karpathy-guidelines`
- **Deploy:** `deploy-to-vercel`

## Source of Truth

- `docs/BUSINESS_RULES.md` — business requirements (flexible, not law)
- `docs/superpowers/specs/2026-06-28-restoloop-design.md` — design spec
- `docs/superpowers/plans/2026-06-28-restoloop-implementation.md` — implementation plan

## Notes

- Never refer to old PRD (`docs/Doc-Restoloop.md`)
- Never mention old framework brand name
- Use `ui-ux-pro-max` + `frontend-design` for dashboard (reject old coral/navy/Inter/Stitch design system)

## Directory Structure

```
src/
├── app/           Next.js App Router pages
│   ├── signup/    Auth: signup form
│   ├── login/     Auth: login form
│   ├── auth/      Auth callback
│   ├── dashboard/ Owner dashboard (customers, coupons, validate, settings)
│   ├── admin/     Super admin panel
│   ├── form/      Public customer intake form
│   └── api/       Route handlers (whatsapp webhook, cron, razorpay)
├── lib/
│   ├── supabase/  Client + server supabase helpers
│   └── whatsapp/  WhatsApp adapter (OpenWA + Meta stub)
supabase/migrations/   SQL migrations
docs/               Business rules, design spec, implementation plan
.claude/skills/      Tech skill files
```
