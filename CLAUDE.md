# Restoloop

Monorepo containing a Next.js SaaS starter kit (MakerKit) and Playwright E2E tests.

## Project Map

- `@nextjs-saas-starter-kit-lite/apps/web/` — Next.js application
- `@nextjs-saas-starter-kit-lite/apps/e2e/` — Playwright E2E tests
- `@nextjs-saas-starter-kit-lite/packages/` — Shared packages (auth, i18n, supabase, shared, next)
- `@nextjs-saas-starter-kit-lite/tooling/` — ESLint, Prettier, TypeScript configs
- `@nextjs-saas-starter-kit-lite/turbo.json` — Turbo pipeline config
- `@package.json` — pnpm workspace root

## Lifecycle (Superpowers Only)

```
brainstorming → writing-plans → subagent-driven-development
                                   ├─ test-driven-development
                                   ├─ verification-before-completion
                                   └─ requesting-code-review
                                          → finishing-a-development-branch
```

## Hard Gates

| Gate | Enforcement |
|------|-------------|
| Ref-context verification | `superpowers:brainstorming` + `superpowers:writing-plans` |
| TDD: test before code | `superpowers:test-driven-development` |
| Plan before code (>2 files) | Plan Mode required |
| Verify before claiming done | `superpowers:verification-before-completion` |

## Communication Rules

- No performative agreement. State facts or ask questions.
- One question at a time during brainstorming.
- Actions > words. Just fix it, don't announce gratitude.

## Context Management

- Use `@path` syntax to reference project files.
- Use `superpowers:skill-name` for skill references.
- Don't re-describe what skills already enforce.

## Git Discipline

- Commit format: `type(scope): description`
- Commit at phase gates (after plan, after feature, after review)
- No force-push to main

## Quick Reference

| Task | Skill |
|------|-------|
| New feature / bugfix | `superpowers:brainstorming` → `superpowers:writing-plans` |
| Executing plan | `superpowers:subagent-driven-development` |
| Writing E2E tests | `@.claude/skills/playwright-generate-test/SKILL.md` |
| Debugging | `superpowers:systematic-debugging` |
| Code review feedback | `superpowers:receiving-code-review` |
| Plan ref-context wiring | `@.claude/skills/wiring-ref-context/SKILL.md` |

## Tool Usage

- **WebFetch / WebSearch:** Allowed for docs and GitHub refs (see `settings.local.json`)
- **MCP ref-context:** Mandatory during brainstorming and planning for all APIs/libraries
