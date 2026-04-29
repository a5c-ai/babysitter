---
name: task-to-prd
description: "Convert a raw task (tracker ticket, email, or text) into a fully characterized PRD via Five Whys + interactive clarification + adversarial review. Stack-agnostic with optional integration hooks."
author: Yehuda Yungstein
---

# Task to PRD Generator

Convert an unrefined task into a production-ready PRD through interactive
clarification, automated codebase verification, and user-gated refinement.

This skill is **stack-agnostic**. Tracker integrations, code-review tools,
and external verifiers are all wrapped as **Optional Hooks** — the skill
works end-to-end without any of them.

The output is a PRD file ready to be consumed by `/prd-to-spec`.

## Input Sources

Accept one of:

- **Tracker ticket ID:** `/task-to-prd <ticket-id>` — fetched via your
  tracker integration (see Optional Hook in Phase 1).
  *Examples:* `JIRA-1234`, `LIN-456`, `gh-issue-789`.
- **Text description:** `/task-to-prd "Change the dashboard donut to show
  lessons instead of points"`
- **File path:** `/task-to-prd path/to/email.txt`

## Optional Hook Pattern

Every external-tool integration follows this template:

> **<Capability> (optional):** <one-line description of what this step achieves>.
> *Examples:* <2-4 concrete examples mixing ecosystems>.
> *Skip if:* <when this step doesn't apply>.

## Execution

### Phase 1: Clarification (Interactive)

1. **Load source:**
   - If input is a tracker ticket ID → fetch summary, description, and
     comments via your tracker integration (see Optional Hook below).
   - If input is a file path → read the file.
   - If input is inline text → use as-is.

   > **Tracker fetch (optional):** retrieve the ticket's full content
   > (summary, description, comments, linked issues) without creating
   > a new ticket.
   > *Examples:* Jira via a `/jira` skill or `acli jira workitem view`,
   > Linear via `linear-cli` or MCP, GitHub Issues via `gh issue view`.
   > *Skip if:* input is plain text or a local file.

2. **Read project context:**
   - Your project's primary context document (e.g., `CLAUDE.md`,
     `AGENTS.md`, top-level README).
   - Your archive of previous PRDs (if maintained) for style inspiration —
     never as a rigid template.

3. **Five Whys** — dig into the root cause before jumping to a solution:
   - Why is this a problem?
   - Why does it happen?
   - Why was it not caught earlier?
   - Why does the current design allow it?
   - Why is the proposed solution the right one (if one was proposed)?

4. **Interactive clarification** — ask questions one at a time using your
   harness's interactive Q&A mechanism (e.g., `AskUserQuestion`):
   - Each question follows this format: short explanation of what's
     unclear + why it matters + recommendation + 2-4 options.
   - The user may answer directly OR say "I'll ask <stakeholder>" — then
     wait; the user will paste the answer back.
   - Track every Q&A in a running **Decision Log** with attribution.

5. **Scope detection** — identify which layers the task affects
   (data-pipeline, backend, frontend, infra, docs).

6. **BREAKPOINT — Scope Lock:** before writing anything, present:
   - Summary of the problem.
   - Proposed scope (files, layers).
   - Known constraints.
   - Decision Log so far.

   **Wait for explicit user approval** before proceeding to Phase 2.

### Phase 2: PRD Draft (Automatic)

1. **Parallel codebase scan** — launch one subagent per affected layer.
   Each one reads the files relevant to the locked scope and reports back.
   *Example layer splits:* data-pipeline, backend, frontend, infra.

2. **Draft PRD** at `<your-tasks-dir>/<feature-branch>-PRD.md` with
   these sections:
   - Background (including Five Whys findings)
   - Root Cause
   - Agreed Solution
   - Scope (exhaustive file list by layer)
   - Edge Cases
   - Technical Constraints
   - Data Flow (if applicable)
   - **Decision Log** — every Q&A from Phase 1 with attribution
     (user / `<stakeholder name>` such as product owner, tech lead,
     designer)
   - Definition of Done
   - Open Questions (if any remain)

### Phase 3: Automated Verification (with User Gates)

Run these checks in order. **ANY proposed change to the PRD requires a
BREAKPOINT** with user approval showing: old text, new text, reason,
recommendation.

1. **"What could go wrong" analysis** — examine:
   - Downstream consumers affected.
   - Hidden dependencies.
   - Edge cases not covered.
   - Rollback complexity.

2. **Codebase consistency check** — verify PRD claims against actual code
   (file paths, line numbers, identifiers, signatures, etc.).

3. **Conventions check** — verify against your project's conventions
   document (e.g., `CLAUDE.md`, `CONTRIBUTING.md`, project style guide).

4. **Adversarial review** — one subagent tries to find flaws in the
   proposed solution; another defends or refines.

5. **Quality checklist** — auto-generate a quality checklist for the PRD
   (completeness, clarity, testability, consistency) and validate.

6. **Independent external PRD reviewer (optional):** run an external
   reviewer that hasn't seen the drafting context.
   *Examples:* Codex CLI (`/codex:review --wait` or equivalent), Gemini
   (`/gemini-review`), peer review from a teammate.
   *Skip if:* you don't have a secondary reviewer available.

7. For EVERY finding that suggests a change:
   - **BREAKPOINT** showing: finding, current PRD text, proposed change,
     recommendation.
   - Wait for user approval (approve / reject / modify).
   - Apply only approved changes.

### Phase 4: Finalize

1. **BREAKPOINT — Final PRD Review:** present the complete PRD to the
   user for final approval.

2. After approval:
   - **Tracker update (optional):** if input was a tracker ticket,
     update its description with a reference to the PRD file path.
     If input was text/file and no ticket exists, ask whether to create
     one.
     *Examples:* Jira (`/jira` or `acli`), Linear (CLI / MCP),
     GitHub Issues (`gh issue edit` / `gh issue create`).
     *Skip if:* you don't track tasks in an external system.
   - **Project status update (optional):** append a "PRD created" entry
     to your status / changelog file if you maintain one.

3. **Output in chat** (NOT a file) — a short follow-up prompt to convert
   the PRD into a SPEC:

   ```text
   Read <project-context-doc> for context. Then run /prd-to-spec <path-to-PRD>
   ```

## Rules

- Phase 1 and Phase 4 are 100% under user control (interactive).
- Phase 2 is fully automatic (no questions).
- Phase 3 is automatic BUT pauses on every proposed change.
- All clarification questions follow the format: short explanation +
  why it matters + recommendation + 2-4 options.
- Never modify the PRD silently — every change needs user approval.
- Do NOT create a SPEC. That's `/prd-to-spec`.
- Do NOT move the PRD to an archive folder until the PR for it is merged.
- The PRD must be proportional to the task. A 1-line fix gets a concise
  PRD; a multi-layer feature gets a detailed one.
- Previous PRDs are inspiration, not templates.
