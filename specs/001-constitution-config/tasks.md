# Tasks: Configure Restoloop Constitution and Design Rules

**Input**: Design documents from `specs/001-constitution-config/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

## Formatting Reference
- **[P]**: Parallelizable task
- **[US1]**: Associated with User Story 1 (Enforcing Restoloop Brand Rules)
- **[US2]**: Associated with User Story 2 (Locked Backend Security Gate)

---

## Phase 1: Setup & Environment Validation
**Purpose**: Ensure the repository is configured for Spec-Kit and Claude integration.

- [x] T001 Verify Spec-Kit is initialized in the Restoloop repository (`.specify/` and `.claude/` directories present)
- [x] T002 Verify `.gitignore` ignores `.claude/` to prevent credential leakage (checked `.gitignore` line 50)

---

## Phase 2: User Story 1 - Configure Restoloop Constitution
**Goal**: Establish non-negotiable guidelines for brand colors, fonts, and responsiveness.

- [x] T003 [US1] Create `.specify/memory/constitution.md` containing the primary Orange `#F97316` brand color, Light mode constraint, Google Inter font family, and 375px mobile-first gate.
- [x] T004 [US1] Draft functional specification in `specs/001-constitution-config/spec.md` defining user scenarios and testing gates.

---

## Phase 3: User Story 2 - Enforce Read-Only Backend
**Goal**: Block the AI assistant and subagents from modifying database schemas, cron jobs, or migration files.

- [x] T005 [US2] Prohibit backend alterations in `.specify/memory/constitution.md` and document the database lock.
- [x] T006 [US2] Draft implementation plan in `specs/001-constitution-config/plan.md` mapping structural paths and confirming no schema files will be touched.

---

## Phase 4: Polish & Review
**Purpose**: Finalize documentation and verify all gates.

- [x] T007 [P] Perform Git status review and confirm active feature branch `001-constitution-config` is correctly tracking the new specs.
