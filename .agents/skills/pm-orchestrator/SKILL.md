---
name: pm-orchestrator
description: Orchestrate slice implementation via AC generation, coder dispatch, tester dispatch, and judgment. Use when user says "run slice", "implement slice", or gives a slice name like "S1" or "Slice 2".
---

# PM Orchestrator Skill

This skill allows the agent to act as the primary PM Orchestrator to execute the implementation plan. It coordinates acceptance criteria generation, code implementation, and independent verification.

## When to Use

- When the user asks to implement or run a slice (e.g. "Run S1", "implement Slice 2").
- When executing vertical feature slices task-by-task.

## How to Use

Follow this sequence exactly for the requested slice:

### Step 1: Generate Acceptance Criteria (ACs)
1. Load the `deliver-acceptance-criteria` skill at [deliver-acceptance-criteria/SKILL.md](file:///E:/desktop/Restoloop/.agents/skills/deliver-acceptance-criteria/SKILL.md).
2. Locate the slice and its numbered task list in [docs/superpowers/plans/2026-06-28-restoloop-implementation.md](file:///E:/desktop/Restoloop/docs/superpowers/plans/2026-06-28-restoloop-implementation.md).
3. Generate 3 to 7 Given/When/Then acceptance criteria covering:
   - Happy path (primary success scenarios)
   - Edge cases (boundary conditions)
   - Error states and recovery paths
4. Save the generated ACs to a scratch file in the scratch directory: `.gemini/antigravity-cli/brain/<conversation-id>/scratch/slice-ACs.md`.

### Step 2: Define and Dispatch CODER
1. Call `define_subagent` to define the coder subagent:
   - **Name**: `restoloop-coder`
   - **Description**: "Implements code changes for Restoloop slices"
   - **enable_write_tools**: `true`
   - **enable_mcp_tools**: `true`
   - **system_prompt**:
     ```markdown
     You are a CODER subagent. Your job is to implement code changes for a Restoloop slice.

     ## Pre-flight (MANDATORY before writing code)
     1. Read the ponytail skill instructions.
     2. Read relevant domain skills from .agents/skills/ based on tasks:
        - Database → supabase-postgres-best-practices (if exists)
        - Validation → typescript-best-practices/SKILL.md
        - Server actions / api → route-handlers/SKILL.md or vercel-functions/SKILL.md
        - UI → frontend-design/SKILL.md and tailwind-design-system/SKILL.md
     3. Retrieve current API docs via Context7 MCP — never rely on memory for signatures.

     ## Execution Rules
     - Implement ONLY the requested code changes.
     - Ensure YAGNI and minimal code footprint.
     - Self-review: Did I add anything unrequested?
     - Report format: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT. Summarize what you changed and which files were touched.
     ```
2. Call `invoke_subagent` to launch the coder. Provide the slice name, the tasks, the generated ACs, and domain skill hints in the prompt.
3. Wait for the coder subagent to report completion.

### Step 3: Define and Dispatch TESTER
1. Call `define_subagent` to define the tester subagent:
   - **Name**: `restoloop-tester`
   - **Description**: "Independently tests Restoloop slices against ACs"
   - **enable_write_tools**: `false` (Must be read-only)
   - **enable_mcp_tools**: `false`
   - **system_prompt**:
     ```markdown
     You are a TESTER subagent. Your job is to independently verify that the coder's changes satisfy the acceptance criteria. You cannot edit any files.

     ## Pre-flight (MANDATORY)
     1. Read .agents/skills/tdd/SKILL.md
     2. Read .agents/skills/webapp-testing/SKILL.md

     ## Verification Pipeline (Run in sequence)
     1. FAST GATES: Run `pnpm typecheck && pnpm lint`. Fail immediately if errors exist.
     2. AUTOMATED TESTS: Run `pnpm test`. Report success/failure count.
     3. BUILD: Run `pnpm build` to verify production compilation.
     4. BEHAVIORAL: Run dev server (`pnpm dev`) and verify via webapp-testing patterns.
     5. ADVERSARIAL: Test edge cases (invalid inputs, empty inputs, boundary values).

     ## Critical Rule
     - Never trust the coder's self-test reports. Always execute verification commands yourself.

     ## Report Format
     Return a markdown table verifying each AC:
     | AC # | Given/When/Then | Status | Evidence (Command output/Logs) |
     |---|---|---|---|
     | AC-1 | ... | PASS/FAIL | ... |

     Gates: typecheck (PASS/FAIL) | lint (PASS/FAIL) | tests (PASS/FAIL) | build (PASS/FAIL)
     Verdict: ALL_PASS or NEEDS_FIX
     ```
2. Call `invoke_subagent` to launch the tester. Provide the generated ACs and the coder's completion summary in the prompt.
3. Wait for the tester subagent to report verification results.

### Step 4: Judge
1. Read the tester's report.
2. If the tester reports `ALL_PASS`:
   - Mark the slice as **VERIFIED**.
3. If the tester reports `NEEDS_FIX` or any AC fails:
   - Mark the slice as **NEEDS_FIX**.
   - Dispatch the coder subagent again with the tester's failure evidence (max 3 retries).
4. If there is ambiguity or a conflict, ask the user.

### Step 5: Final Report
1. Report the slice implementation results to the user including:
   - Slice Name
   - Final Status (VERIFIED or FAILED)
   - Verified Acceptance Criteria list
   - Files changed
   - Retry counts (if any)
