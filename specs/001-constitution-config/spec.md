# Feature Specification: Configure Restoloop Constitution and Design Rules

**Feature Branch**: `001-constitution-config`  
**Created**: 2026-05-24  
**Status**: Draft  
**Input**: Configure Restoloop constitution and design rules for Spec-Kit and Superpowers plugin integration.

## User Scenarios & Testing

### User Story 1 - Enforcing Restoloop Brand Rules (Priority: P1)
As a developer, I want the AI coding assistant (Claude Code) and its execution subagents to strictly respect the Restoloop visual guidelines (Light mode only, `#F97316` Orange accent, Inter typography, mobile-first design starting at 375px) so that no out-of-spec frontend code is generated.

**Why this priority**: Restoloop has strict visual branding for Indian restaurant owners. Rushing into dark modes or wrong colors violates our aesthetic guidelines.
**Independent Test**: Can be verified by running the AI agent to draft a simple component and checking that it strictly uses light mode tailwind classes, `#F97316`, and Inter fonts.

**Acceptance Scenarios**:
1. **Given** that the AI agent is initialized in the workspace, **When** it drafts a user component, **Then** it must not use dark mode classes (`dark:`) or alternative color palettes.
2. **Given** a new UI view layout is requested, **When** the agent starts coding, **Then** it must design mobile-first starting at 375px viewport width.

---

### User Story 2 - Locked Backend Security Gate (Priority: P1)
As a system maintainer, I want the AI agent to be strictly blocked from making changes to the database schema, edge functions, cron jobs, or database migrations, so that the existing backend remains perfectly stable and read-only.

**Why this priority**: Changing the live database schema or backend APIs without strict orchestration will break existing services.
**Independent Test**: Confirm that any planning or code generation files explicitly avoid writing SQL migrations or altering server-side controllers.

**Acceptance Scenarios**:
1. **Given** a plan to fetch data is generated, **When** the agent designs the data flow, **Then** it must only use existing Supabase client queries or client APIs, and never propose schema modifications.

---

## Requirements

### Functional Requirements
*   **FR-001**: The `.specify/memory/constitution.md` MUST capture all technology stack, brand identity, and development gates defined in `CLAUDE.md`.
*   **FR-002**: The Spec-Kit configuration MUST load the constitution as a system prompt constraint during AI agent planning.
*   **FR-003**: The workspace `.gitignore` MUST properly ignore `.claude/` to prevent accidental credential leakage.
*   **FR-004**: The project template checklist MUST require verification of the brand rules (light mode, orange theme, mobile-first) before code completion.

---

## Success Criteria

### Measurable Outcomes
*   **SC-001**: 100% of all subsequent AI-generated specifications and technical plans respect the read-only database backend rule.
*   **SC-002**: 100% of UI components generated use Inter typography and the `#F97316` primary orange accent.
*   **SC-003**: Zero credential leaks by ensuring the `.claude/` folder remains ignored in `.gitignore`.

---

## Assumptions
*   The developer is using Claude Code or an agent compatible with `.claude/skills/` and `.specify/`.
*   All backend services (Supabase auth, WhatsApp messaging API) are up and running, requiring only frontend alignment.
