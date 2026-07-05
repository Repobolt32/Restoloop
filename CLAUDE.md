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

- `progress.md` — **Primary Status & Progress File**. Read at session start to verify project status. Always update it with newly completed features and next steps before finishing any task or session.
- `docs/BUSINESS_RULES.md` — business requirements (flexible, not law)
- `docs/superpowers/specs/2026-06-28-restoloop-design.md` — design spec
- `docs/superpowers/plans/2026-06-28-restoloop-implementation.md` — implementation plan

## Notes

- **Startup & Status**: Read `progress.md` first. Load the `using-superpowers` skill before responding or performing actions.
- **Maintain Progress**: Update `progress.md` at the end of every feature slice or session.
- Never refer to old PRD (`docs/Doc-Restoloop.md`)
- Never mention old framework brand name
- Use `ui-ux-pro-max` + `frontend-design` for dashboard (reject old coral/navy/Inter/Stitch design system)

## Search & Navigation

**Default search tool: graphify MCP.** Before using `grep`, `glob`, or reading files manually, query graphify:

- `query_graph` — find concepts, functions, patterns by keyword (BFS traversal)
- `get_node` — inspect a specific entity (function, class, component)
- `get_neighbors` — see what connects to a node (imports, calls, references)
- `shortest_path` — trace how two concepts relate across the codebase
- `god_nodes` — find the most connected files (architecture hubs)
- `graph_stats` — overview of codebase structure

**When to use graphify vs other tools:**

| Task | Tool |
|------|------|
| Find where a concept/function lives | `query_graph` |
| Understand connections between modules | `get_neighbors` / `shortest_path` |
| Find all files matching a glob pattern | `glob` (graphify doesn't do filename patterns) |
| Search for exact string/regex in files | `grep` (graphify searches concepts, not raw text) |
| Read a specific file once you know the path | `read` |

**When to dispatch explorer agents:**

Dispatch an explorer agent (`task` with `subagent_type: "explore"`) when:
- You need to search across 5+ files in parallel to gather context for a plan
- You need to find all usages of a function/pattern across the codebase and summarize
- You're exploring an unfamiliar part of the codebase and need a quick map
- The task is "find everything related to X" and you don't know the scope yet

Do NOT dispatch explorers when:
- graphify `query_graph` or `get_neighbors` gives you the answer directly
- You already know which 1-2 files to read
- The search is a simple glob or grep pattern

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
