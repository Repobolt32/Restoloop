# Restoloop Spec-Kit Constitution

## Core Principles

### I. WhatsApp-First Outbound Focus
Restoloop is a WhatsApp-first customer outreach SaaS for Indian restaurants. Every user experience, notification flow, and public form must be optimized for mobile layout (starting at 375px width) and instant messaging paradigms.

### II. Rigid Gated Development Lifecycle
No feature may be developed without progressing through the strict, stateful Spec-Driven Development (SDD) gates:
1. **Brainstorming:** Define scope and clarify edge cases first.
2. **Writing Plans:** Break requirements into atomic, testable planning files.
3. **Subagent-Driven Development:** Execute tasks task-by-task under a disciplined agent loop.
4. **Test-Driven Development (TDD):** Implement tests before writing production code.
5. **Verification Before Completion:** Verify that all E2E and unit tests pass before merging.

### III. Read-Only Backend & External APIs
The backend is completely locked. No modifications are permitted to the Supabase database schema, edge functions, cron jobs, database migrations, or WhatsApp client libraries. All business requirements must be satisfied via frontend UI rebuilds and server-side data fetching wrappers.

### IV. Mobile-First Responsive Design (375px+)
All interfaces must be designed from the ground up starting at mobile screen sizes (375px) and scale up to tablets (768px) and desktop viewports. Responsiveness is a P0 requirement.

### V. Brand Aesthetic Compliance (Inter & Light Orange)
To maintain visual consistency, all interfaces must adhere strictly to the following aesthetic rules:
*   **Theme:** Light mode only. Dark mode is strictly out of scope.
*   **Primary Accent:** Orange (`#F97316`) primary theme.
*   **Typography:** Google Inter font family as primary.

---

## Technical Constraints & Standards

### Technology Stack
*   **Framework:** Next.js 15.5 (App Router)
*   **Library:** React 19.2
*   **Language:** TypeScript 5.9 (Strict Type Safety)
*   **Styling:** Tailwind CSS 4 & shadcn/ui components
*   **State Management & Data Fetching:** TanStack Query 5 (React Query)
*   **Testing:** Playwright (E2E testing)
*   **Package Manager & Monorepo:** pnpm 10 & Turbo 2.5

### Code Quality Rules
*   **Clean Code:** Strictly adhere to the Clean Code skill. Avoid over-engineering, verbose logging, and duplicate code blocks.
*   **Commit Format:** All git commits must be structured as `type(scope): description`.
*   **Plan Mode Gate:** If a task changes more than 2 files, "Plan Mode" is mandatory before any code is generated.

---

## Governance
*   This Constitution serves as the permanent law for the Restoloop repository.
*   All subagents spawned during development will receive these rules as non-negotiable guidelines.
*   Any pull request or development branch review must verify compliance with this Constitution.

**Version**: 1.0.0 | **Ratified**: 2026-05-24 | **Last Amended**: 2026-05-24
