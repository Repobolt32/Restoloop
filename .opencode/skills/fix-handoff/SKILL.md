---
name: fix-handoff
description: >
  Fix all remaining issues listed in HANDOFF.md.
  Use when: user says "fix handoff", "fix remaining issues", "ship it",
  "fix the 3 issues", or "fix everything in HANDOFF.md".
  NOT for: new features, unlisted bugs, or issues outside HANDOFF.md.
---

# Fix Handoff Issues

Fix all remaining issues in HANDOFF.md one by one.

## Steps

1. Read `HANDOFF.md` to get the current issue list
2. For each issue, in order:
   - Read the file and line number specified
   - Apply the exact fix described
   - Run `pnpm typecheck` to verify no type errors
   - Run `pnpm lint` to verify no lint errors
3. After all fixes:
   - Run `pnpm test` to verify no regressions
   - Run `pnpm build` to verify production build works

## Rules

- Fix only what HANDOFF.md describes — do not add extra changes
- If a fix is unclear, ask the user before guessing
- If a fix breaks tests, stop and report the conflict
- Mark each issue as complete in HANDOFF.md after fixing it
