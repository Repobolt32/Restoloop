# Restoloop Superpowers Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Map the existing Restoloop codebase to Superpowers methodology so all future feature development follows the brainstorming → planning → TDD → subagent-driven-development → code-review workflow.

**Architecture:** This is an infrastructure and process setup, not a feature build. We will: (1) audit the existing codebase to document what exists and what's broken, (2) set up the Superpowers directory structure and test infrastructure properly, (3) create the first Superpowers-compliant spec and plan as a proof-of-concept. No production code changes until Phase 3.

**Tech Stack:** Next.js 15, TypeScript, Supabase, Vitest, Playwright, Tailwind CSS v4, shadcn/ui

## Global Constraints

- **No production code changes in Phase 1 or Phase 2** — audit and infrastructure only
- **Every test must follow TDD** — RED (write failing test) → verify RED → GREEN (minimal code) → verify GREEN → REFACTOR → commit
- **All commands must be exact** — copy-paste ready, with expected output
- **No `as any` casts** — if Supabase types are missing, generate them or define proper interfaces
- **No hardcoded secrets** — all credentials come from environment variables
- **Follow existing patterns** — use `~/` import aliases, `cn()` utility, existing component patterns
- **Commit after every task** — one logical change per commit
- **Run `pnpm typecheck` and `pnpm test` after every task** — both must pass before committing

---

## File Structure

### Phase 1: Audit (read-only, no code changes)

| File | Action | Purpose |
|------|--------|---------|
| `docs/superpowers/specs/2026-06-17-codebase-audit.md` | Create | Document current state, bugs, gaps |

### Phase 2: Infrastructure Setup

| File | Action | Purpose |
|------|--------|---------|
| `vitest.config.ts` | Modify | Fix alias resolution order |
| `__tests__/setup/router-mock.ts` | Create | Shared Next.js router mock |
| `vitest.setup.ts` | Modify | Import shared mocks |
| `.gitignore` | Modify | Add `.next/`, `storage-state.json` |
| `eslint.config.mjs` | Modify | Ignore `.next/` directory |
| `docs/superpowers/specs/2026-06-17-test-infrastructure.md` | Create | Spec for test infra |

### Phase 3: First Superpowers Feature (proof-of-concept)

| File | Action | Purpose |
|------|--------|---------|
| `docs/superpowers/specs/2026-06-17-fix-whatsapp-module.md` | Create | Brainstorming spec for fixing whatsapp.ts |
| `docs/superpowers/plans/2026-06-17-fix-whatsapp-module.md` | Create | TDD implementation plan |
| `__tests__/lib/whatsapp.test.ts` | Create | TDD tests for whatsapp module |
| `lib/whatsapp.ts` | Modify | Fix to use consistent module pattern |
| `lib/campaigns.ts` | Modify | Use whatsapp.ts instead of raw fetch |

---

## Phase 1: Codebase Audit

### Task 1: Explore Project Context

**Files:**
- Read: `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/BUSINESS_RULES.md`
- Read: All files in `lib/`
- Read: All files in `app/` (page.tsx files)
- Read: `__tests__/` (all existing tests)
- Read: `package.json`, `tsconfig.json`, `vitest.config.ts`

**Steps:**

- [ ] **Step 1: Read AGENTS.md**

  Read the file. Note: commands, project structure, key files, known issues.

- [ ] **Step 2: Read all lib/ files**

  For each file in `lib/`, document:
  - What it does (1 sentence)
  - What it imports (dependencies)
  - What imports it (consumers)
  - Known issues (`as any`, `console.log`, hardcoded values, missing error handling)

- [ ] **Step 3: Read all app/ page files**

  For each page in `app/`, document:
  - Route path
  - Server or Client component
  - Data fetching method
  - Known issues

- [ ] **Step 4: Read existing tests**

  For each test file, document:
  - What it tests
  - Does it use TDD? (test written before or after code?)
  - Does it mock correctly?
  - Does it actually catch bugs?

- [ ] **Step 5: Run all verification commands**

  ```bash
  pnpm typecheck
  ```
  Expected: 0 errors

  ```bash
  pnpm test
  ```
  Expected: Note how many tests pass/fail and which files

  ```bash
  pnpm lint
  ```
  Expected: Note warnings count and categories

- [ ] **Step 6: Write audit document**

  Create `docs/superpowers/specs/2026-06-17-codebase-audit.md` with:

  ```markdown
  # Restoloop Codebase Audit

  ## Summary
  [1 paragraph: what exists, what works, what's broken]

  ## Working Features
  [List each working feature with file paths]

  ## Known Bugs
  [List each bug with file:line, description, severity]

  ## Missing Tests
  [List each untested module]

  ## Type Safety Issues
  [List each `as any` cast with file:line]

  ## Security Issues
  [List hardcoded secrets, missing RLS, etc.]

  ## Architecture Issues
  [List module coupling, circular deps, etc.]

  ## Recommendations
  [Prioritized list of what to fix first]
  ```

- [ ] **Step 7: Commit**

  ```bash
  git add docs/superpowers/specs/2026-06-17-codebase-audit.md
  git commit -m "docs: add codebase audit for Superpowers onboarding"
  ```

---

## Phase 2: Test Infrastructure Setup

### Task 2: Fix Vitest Alias Resolution

**Files:**
- Modify: `vitest.config.ts`
- Test: `__tests__/lib/coupons.test.ts` (new, will fail first)

**Problem:** The `~` alias (`./app`) matches before `~/lib`, so `import from '~/lib/coupons'` resolves to `./app/lib/coupons` which doesn't exist.

- [ ] **Step 1: Write the failing test**

  Create `__tests__/lib/coupons.test.ts`:

  ```typescript
  import { describe, it, expect } from 'vitest';
  import { generateCouponCode } from '~/lib/coupons';

  describe('generateCouponCode', () => {
    it('returns an 8-character string', () => {
      const code = generateCouponCode();
      expect(code).toHaveLength(8);
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  pnpm test __tests__/lib/coupons.test.ts
  ```

  Expected: FAIL with `Failed to resolve import "~/lib/coupons"`

- [ ] **Step 3: Fix vitest.config.ts**

  Change the alias order so `~/lib` comes before `~`:

  ```typescript
  resolve: {
    alias: {
      "~/config": path.resolve(__dirname, "./config"),
      "~/components": path.resolve(__dirname, "./components"),
      "~/lib": path.resolve(__dirname, "./lib"),
      "~": path.resolve(__dirname, "./app"),
    },
  },
  ```

- [ ] **Step 4: Run test to verify it passes**

  ```bash
  pnpm test __tests__/lib/coupons.test.ts
  ```

  Expected: PASS (1 test)

- [ ] **Step 5: Run full test suite**

  ```bash
  pnpm test
  ```

  Expected: All existing tests still pass

- [ ] **Step 6: Run typecheck**

  ```bash
  pnpm typecheck
  ```

  Expected: 0 errors

- [ ] **Step 7: Commit**

  ```bash
  git add vitest.config.ts __tests__/lib/coupons.test.ts
  git commit -m "fix: resolve vitest alias order so ~/lib imports work"
  ```

---

### Task 3: Create Shared Next.js Router Mock

**Files:**
- Create: `__tests__/setup/router-mock.ts`
- Modify: `vitest.setup.ts`
- Modify: `__tests__/coupons/page.test.tsx` (existing broken test)

**Problem:** `__tests__/coupons/page.test.tsx` fails with "invariant expected app router to be mounted" because `CouponsContent` uses `useRouter()` but the test has no mock.

- [ ] **Step 1: Write the failing test**

  The test already exists and fails. Verify:

  ```bash
  pnpm test __tests__/coupons/page.test.tsx
  ```

  Expected: FAIL with `invariant expected app router to be mounted`

- [ ] **Step 2: Create shared router mock**

  Create `__tests__/setup/router-mock.ts`:

  ```typescript
  import { vi } from 'vitest';

  export const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  };

  vi.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
  }));
  ```

- [ ] **Step 3: Import mock in vitest.setup.ts**

  Add to `vitest.setup.ts`:

  ```typescript
  import "@testing-library/jest-dom/vitest";
  import "./setup/router-mock";
  ```

- [ ] **Step 4: Run test to verify it passes**

  ```bash
  pnpm test __tests__/coupons/page.test.tsx
  ```

  Expected: PASS (8 tests)

- [ ] **Step 5: Run full test suite**

  ```bash
  pnpm test
  ```

  Expected: All tests pass

- [ ] **Step 6: Run typecheck**

  ```bash
  pnpm typecheck
  ```

  Expected: 0 errors

- [ ] **Step 7: Commit**

  ```bash
  git add __tests__/setup/router-mock.ts vitest.setup.ts
  git commit -m "fix: add shared Next.js router mock for component tests"
  ```

---

### Task 4: Fix ESLint and Gitignore

**Files:**
- Modify: `.gitignore`
- Modify: `eslint.config.mjs`

**Problem:** ESLint lints `.next/` build output (hundreds of false errors). `.gitignore` doesn't exclude `storage-state.json` (Playwright auth state).

- [ ] **Step 1: Check current .gitignore**

  ```bash
  git check-ignore .next/ storage-state.json
  ```

  Expected: Note which are/aren't ignored

- [ ] **Step 2: Update .gitignore**

  Add these lines if missing:

  ```
  .next/
  storage-state.json
  test-results/
  playwright-report/
  ```

- [ ] **Step 3: Check current ESLint config**

  Read `eslint.config.mjs` and note if `.next/` is in the ignore list.

- [ ] **Step 4: Add .next/ to ESLint ignores**

  In `eslint.config.mjs`, ensure the ignores array includes:

  ```javascript
  ignores: [
    ".next/**",
    "node_modules/**",
    "public/**",
    ".agents/**",
  ]
  ```

- [ ] **Step 5: Run lint**

  ```bash
  pnpm lint
  ```

  Expected: Significantly fewer warnings (no `.next/` errors)

- [ ] **Step 6: Run typecheck**

  ```bash
  pnpm typecheck
  ```

  Expected: 0 errors

- [ ] **Step 7: Commit**

  ```bash
  git add .gitignore eslint.config.mjs
  git commit -m "fix: exclude .next/ from linting, add playwright artifacts to gitignore"
  ```

---

### Task 5: Write Test Infrastructure Spec

**Files:**
- Create: `docs/superpowers/specs/2026-06-17-test-infrastructure.md`

- [ ] **Step 1: Write the spec**

  Create `docs/superpowers/specs/2026-06-17-test-infrastructure.md`:

  ```markdown
  # Test Infrastructure Spec

  ## Summary
  Documents the test infrastructure setup for Restoloop after Superpowers onboarding.

  ## Test Framework
  - Unit tests: Vitest + @testing-library/react
  - E2E tests: Playwright (installed, 85 tests discovered)
  - Run command: `pnpm test` (unit), `npx playwright test` (E2E)

  ## Alias Resolution
  - `~/lib/*` → `./lib/*` (business logic)
  - `~/components/*` → `./components/*` (UI components)
  - `~/config/*` → `./config/*` (configuration)
  - `~/*` → `./app/*` (Next.js pages, catch-all)
  - Order matters: specific aliases before catch-all

  ## Shared Mocks
  - `__tests__/setup/router-mock.ts` — Next.js router mock (auto-imported via vitest.setup.ts)
  - Components using `useRouter`, `usePathname`, `useSearchParams` are automatically mocked

  ## TDD Workflow
  Every new feature follows:
  1. RED: Write failing test
  2. Verify RED: Run test, confirm it fails for expected reason
  3. GREEN: Write minimal code to pass
  4. Verify GREEN: Run test, confirm it passes
  5. REFACTOR: Clean up
  6. Commit

  ## Test File Conventions
  - Unit tests: `__tests__/lib/<module>.test.ts`
  - Component tests: `__tests__/<page>/page.test.tsx`
  - E2E tests: `__tests__/e2e/<feature>.spec.ts`

  ## Verification Commands
  - `pnpm test` — all unit tests pass
  - `pnpm typecheck` — 0 TypeScript errors
  - `pnpm lint` — no errors (warnings acceptable if documented)
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add docs/superpowers/specs/2026-06-17-test-infrastructure.md
  git commit -m "docs: add test infrastructure spec"
  ```

---

## Phase 3: First Superpowers Feature (Proof-of-Concept)

> This phase demonstrates the complete Superpowers workflow on a real bug.
> The bug: `lib/campaigns.ts` bypasses `lib/whatsapp.ts` and does raw `fetch` to Meta API.
> We will fix this using brainstorming → spec → plan → TDD → subagent-driven-development.

### Task 6: Brainstorming — Fix WhatsApp Module Consistency

**Files:**
- Create: `docs/superpowers/specs/2026-06-17-fix-whatsapp-module.md`

**This task follows the `brainstorming` skill:**

- [ ] **Step 1: Explore project context**

  Read:
  - `lib/whatsapp.ts` — the WhatsApp messaging module
  - `lib/campaigns.ts` — the campaign engine
  - `lib/coupons.ts` — coupon utilities

  Document:
  - What `whatsapp.ts` exports (functions, types)
  - What `campaigns.ts` does for WhatsApp sending
  - Where the inconsistency is

- [ ] **Step 2: Ask clarifying questions**

  Present to user (one at a time):

  **Question 1:** "The `sendCampaign` function in `campaigns.ts` does a raw `fetch` to the Meta API instead of using `sendWelcomeMessage`/`sendBirthdayMessage`/`sendWinbackMessage` from `whatsapp.ts`. Should we:
  A) Refactor `campaigns.ts` to use the `whatsapp.ts` module functions
  B) Keep them separate (campaigns uses Meta API directly, whatsapp.ts is for other messages)
  C) Merge them into a single unified module"

  **Question 2:** "The `whatsapp.ts` module has `sendMetaMessage` (private) and `sendThirdPartyMessage` (public). The campaign engine uses Meta API directly. Should the campaign engine:
  A) Use `sendMetaMessage` (make it public or add a wrapper)
  B) Use `sendThirdPartyMessage` (switch to 3rd party provider)
  C) Keep its own Meta API call but share the same error handling pattern"

  Wait for user answers before proceeding.

- [ ] **Step 3: Propose 2-3 approaches**

  Based on user answers, propose approaches with trade-offs:

  **Approach A: Unified Module** — All WhatsApp sending goes through `whatsapp.ts`. Campaign engine calls exported functions. Single source of truth for API calls, error handling, and logging.

  **Approach B: Shared Utility** — Extract common Meta API call into a shared `sendMetaTemplate()` function. Both `whatsapp.ts` and `campaigns.ts` use it. Less refactoring but more coupling.

  **Approach C: Keep Separate, Fix Types** — Keep current architecture but remove `as any` casts, add proper error handling to `campaigns.ts` Meta API call, and document why they're separate.

  Present recommendation with reasoning.

- [ ] **Step 4: Present design**

  Present the chosen design in sections:
  - Architecture (which module does what)
  - Interfaces (function signatures, types)
  - Error handling (what happens on failure)
  - Testing (what tests, what they verify)

  Get user approval after each section.

- [ ] **Step 5: Write design doc**

  Save approved design to `docs/superpowers/specs/2026-06-17-fix-whatsapp-module.md`

- [ ] **Step 6: Spec self-review**

  Check for:
  - Placeholders (TBD, TODO)
  - Contradictions between sections
  - Ambiguity (could be interpreted two ways)
  - Scope (focused enough for one plan)

  Fix inline.

- [ ] **Step 7: User reviews spec**

  Present to user:
  > "Spec written to `docs/superpowers/specs/2026-06-17-fix-whatsapp-module.md`. Please review and let me know if you want changes before we write the implementation plan."

  Wait for approval.

- [ ] **Step 8: Commit**

  ```bash
  git add docs/superpowers/specs/2026-06-17-fix-whatsapp-module.md
  git commit -m "docs: add whatsapp module consistency spec"
  ```

---

### Task 7: Writing Plans — Create Implementation Plan

**Files:**
- Create: `docs/superpowers/plans/2026-06-17-fix-whatsapp-module.md`

**This task follows the `writing-plans` skill:**

- [ ] **Step 1: Read the spec**

  Read `docs/superpowers/specs/2026-06-17-fix-whatsapp-module.md`

- [ ] **Step 2: Map file structure**

  List every file that will be created or modified with its responsibility.

- [ ] **Step 3: Decompose into tasks**

  Each task:
  - 2-5 minutes of work
  - Has exact file paths
  - Has complete code (no placeholders)
  - Has TDD steps (RED → verify RED → GREEN → verify GREEN → REFACTOR → commit)
  - Has exact commands with expected output

- [ ] **Step 4: Write the plan**

  Save to `docs/superpowers/plans/2026-06-17-fix-whatsapp-module.md`

  Follow the `writing-plans` format exactly:
  - Header with goal, architecture, tech stack
  - Global constraints
  - Task structure with checkbox steps
  - No placeholders

- [ ] **Step 5: Self-review**

  Check:
  - Every spec requirement has a task
  - No placeholders
  - Type consistency across tasks
  - Commands are exact

- [ ] **Step 6: Commit**

  ```bash
  git add docs/superpowers/plans/2026-06-17-fix-whatsapp-module.md
  git commit -m "docs: add whatsapp module fix implementation plan"
  ```

---

### Task 8: Execute Plan via Subagent-Driven Development

**This task follows the `subagent-driven-development` skill:**

- [ ] **Step 1: Read the plan**

  Read `docs/superpowers/plans/2026-06-17-fix-whatsapp-module.md`

- [ ] **Step 2: Create git worktree**

  Follow `using-git-worktrees` skill:
  - Detect existing isolation
  - Create worktree if needed
  - Run `pnpm install`
  - Run `pnpm test` to verify baseline

- [ ] **Step 3: Create todos for all tasks**

  One todo per task from the plan.

- [ ] **Step 4: Dispatch implementer subagent per task**

  For each task:
  1. Extract task brief
  2. Dispatch implementer subagent with brief + context
  3. Implementer follows TDD (RED → GREEN → REFACTOR)
  4. Implementer commits
  5. Dispatch task reviewer subagent
  6. Fix any Critical/Important findings
  7. Mark task complete

- [ ] **Step 5: Final whole-branch review**

  After all tasks complete:
  1. Dispatch code reviewer subagent for entire branch
  2. Fix any findings
  3. Verify all tests pass

- [ ] **Step 6: Finish branch**

  Follow `finishing-a-development-branch` skill:
  1. Verify tests pass
  2. Present options: merge / PR / keep / discard
  3. Execute user's choice

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-06-17-superpowers-onboarding.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**

---

## Appendix: Superpowers Workflow Reference

For future feature development, always follow this order:

```
1. brainstorming     → Explore context, ask questions, propose approaches, write spec
2. writing-plans     → Break spec into TDD tasks with exact code
3. using-git-worktrees → Create isolated workspace
4. subagent-driven-development → Execute tasks with TDD + review
5. requesting-code-review → Final whole-branch review
6. finishing-a-development-branch → Merge or PR
```

**Key rules:**
- NEVER write code before brainstorming and planning
- NEVER write tests after code (TDD: test first, watch it fail, then implement)
- NEVER skip code review
- NEVER work on main/master without explicit consent
- Every commit must have passing tests
