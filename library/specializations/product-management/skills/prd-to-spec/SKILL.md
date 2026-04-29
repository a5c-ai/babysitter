---
name: prd-to-spec
description: "Convert an approved PRD into a phase-gated implementation SPEC with verification ledger, TDD breakpoints, and quality gates. Stack-agnostic with optional integration hooks."
author: Yehuda Yungstein
---

# PRD to SPEC Generator

Convert a PRD into a production-ready, phase-gated SPEC file that an engineer
(or an orchestrator agent) can execute task-by-task.

This skill is **stack-agnostic**. Every step that integrates with a specific
tool, tracker, or pipeline framework is wrapped as an **Optional Hook** —
documented with examples but never required for the skill to function.

## Input

The user provides either:

- A path to a PRD file: `/prd-to-spec <your-tasks-dir>/<task-id>-PRD.md`
- Inline text describing the task: `/prd-to-spec "description..."`

## Optional Hook Pattern

Throughout this skill, every external-tool integration uses this template:

> **<Capability> (optional):** <one-line description of what this step achieves>.
> *Examples:* <2-4 concrete examples mixing ecosystems>.
> *Skip if:* <when this step doesn't apply>.

The skill works end-to-end without any of the optional hooks installed.

## Execution

### Phase 1: Discovery & Verification Ledger

1. Read the PRD (file or inline text).
2. Read your project's primary context document (e.g., `CLAUDE.md`, `AGENTS.md`,
   or top-level README) for conventions and onboarding info.
3. **Smart scope detection** — determine which layers the PRD affects
   (data-pipeline, backend, frontend, infra, docs). Phases that target
   irrelevant layers will be skipped in Phase 3.
4. **Parallel codebase scan** — launch one subagent per affected layer.
   Each one reads the files mentioned in the PRD and the surrounding code.
   Examples of layer splits: data-pipeline (SQL/transforms), backend (services,
   schemas, queues), frontend (components, types, API calls), infra (IaC,
   deployment configs), docs.
5. Build a **Verification Ledger** — for every claim in the PRD, verify
   against actual code with `file:line` references. Note any discrepancies.
6. **Auto-detect blocking PRs** — check `git log origin/<base-branch>` and
   `gh pr list` for open PRs touching the same files. If found, note them
   as dependencies. (`<base-branch>` = your repo's default integration
   branch — typically `dev`, `develop`, or `main`.)
7. Inspect your archive of previous SPECs (if you maintain one) for style
   inspiration only — never as a rigid template. Each task is different.
8. **Read the project-local `failure-log.md`** — see § Optional: Failure Log
   Mechanism below. If the file doesn't exist, note "no prior failures
   recorded" and continue.

### Phase 2: SPEC Generation

Create the SPEC file at `<your-tasks-dir>/<feature-branch>-SPEC.md` with
these sections:

**Header**

```text
# SPEC: <Title>
Source PRD: <path>
Tracker Task: <link, if applicable>
Branch: <feature-branch> (from latest <base-branch>)
Quality Gate: Each phase must reach quality score >= 0.85 before proceeding
```

**Prerequisites:** files to read before execution. **MUST include** the
project-local `failure-log.md` (see § Optional: Failure Log Mechanism) with
the note "every pattern there is a binding constraint from prior failures".

**Known Divergences** *(if applicable)* — document intentional differences
between related files or components.

**Verification Ledger** — table of PRD claims vs. actual code findings.

**Phase 1: Pre-Check**
- **First step MUST be:** read the project-local `failure-log.md` and
  internalize all patterns as binding constraints (not suggestions).
  Add this as the literal first numbered step AND as the first Quality
  Gate checkbox.
- Branch from `<base-branch>`; verify any blocking PRs are merged.
- Read project conventions document.
- **Ticket-tracker integration (optional):** mark the task as in-progress
  in your tracker.
  *Examples:* Jira (`/jira` skill or `acli jira workitem update`), Linear
  (`linear-cli` or MCP), GitHub Issues (`gh issue edit ... --add-label
  in-progress`).
  *Skip if:* you don't track tasks in an external system.
- Quality Gate checklist (first item: "failure-log.md read and patterns
  internalized").

**Phase 2: Execute (TDD)**
- For EVERY sub-task: write the failing test FIRST (RED) → implement
  minimally (GREEN) → refactor (IMPROVE).
- Sub-tasks list: exact file paths, line numbers, current code, target code.
- Edge case matrix with expected results.
- Quality Gate checklist.

**Phase 3: Local Pipeline Verification & Data Quality**
- Run the project's full test suite.
  *Examples:* `pytest tests/ -v` (Python), `npm test` / `vitest` / `jest`
  (JS/TS), `go test ./...` (Go), `cargo test` (Rust).
- **If a data pipeline / backend layer changed — Pipeline Verification
  BREAKPOINT (skip if not applicable):**
  - Materialize / run affected pipeline assets locally; verify no errors.
  - Run data-quality spot-check queries on materialized results.
  - Verify downstream consumers (snapshots, write-backs, exports) succeed.
  - If anything fails or hangs: guide the user step by step through
    diagnosis. Do NOT silently skip or assume it works.
  - **WAIT for user confirmation** that pipeline results look correct
    before proceeding.
  - *Examples:* `dagster asset materialize ...` (Dagster),
    `airflow tasks test ...` (Airflow), `dbt run --select ...` (dbt),
    `prefect deployment run ...` (Prefect),
    `kubectl apply --dry-run=server ...` (K8s previews).
- **If a UI layer changed — UI Verification BREAKPOINT (skip if not
  applicable):**
  - Start the project's dev server(s).
    *Examples:* `npm run dev`, Vite (`vite`), Next (`next dev`),
    Storybook (`storybook dev`).
  - Seed test data if needed (DB fixtures, mock APIs, recorded responses).
  - Present to user: URL, login credentials (if any), navigation steps,
    what to look for.
  - **WAIT for user confirmation** before proceeding.
- **If neither applies:** skip to Phase 4.
- Quality Gate checklist (includes "User confirmed pipeline results"
  and/or "User confirmed UI" as applicable).

**Phase 4: Conventions Fix**
- **Project conventions check (optional):** run a project-specific
  conventions check.
  *Examples:* a custom `/conventions-check` skill, project-specific lint
  rules, a pre-commit hook config.
  *Skip if:* your project has no extra conventions beyond standard
  linters/formatters.
- Run the project's linter, formatter, and type checker — on changed
  files only.
  *Examples:*
  - TypeScript: `eslint`, `prettier`, `tsc-files --noEmit`
  - Python: `ruff`, `black`, `mypy`
  - Go: `golangci-lint`, `gofmt`, `go vet`
  - Ruby: `rubocop`, `standardrb`
- Quality Gate checklist.

**Phase 5: Completeness (Hard Gate)**
- Verify every Definition-of-Done item with `file:line` evidence.
- YES/NO gate questions — any NO blocks delivery.
- **DoD verification (optional):** run a structured Definition-of-Done
  verification step.
  *Examples:* a `/verification-before-completion` skill, a manual
  checklist walkthrough, a pre-merge bot.
- Quality Gate checklist.

**Phase 6: Code Review**
- **Step 1 — Primary code review (mandatory):** run a thorough
  quality + correctness review on the diff. Fix CRITICAL and HIGH
  findings before continuing.
- **Step 2 — Independent secondary review (optional but recommended):**
  at least one reviewer that doesn't share context with Step 1.
  *Examples:* Codex CLI (`/codex:review --wait` or equivalent), Gemini
  (`/gemini-review`), GitHub Copilot review, peer review from a teammate.
- **Step 3 — Project-conventions review (optional):** check the diff
  against project-specific conventions.
  *Examples:* a `/requesting-code-review` skill, a CODEOWNERS reviewer,
  a custom convention bot.
- Re-run tests after every fix.
- Quality Gate checklist.

**Phase 7: Deliver**
- **BREAKPOINT** — present summary, WAIT for user approval.
- **Pre-Push Personal Docs Check (mandatory gate before any push)** —
  see § Pre-Push Personal Docs Check below for the full procedure.
  Quality Gate must include "Pre-Push Personal Docs Check executed and
  resolved with explicit per-file decisions".
- **Update project status (optional):** update your status / changelog
  file if you maintain one.
- Commit, push, open PR against `<base-branch>`.
- **Ticket-tracker update (optional):** mark the task as in-review and
  add the PR link.
  *Examples:* Jira (`/jira` skill or `acli`), Linear (CLI / MCP),
  GitHub Issues (`gh issue edit`).
- Do NOT move the PRD/SPEC to an archive folder until the PR is merged.
- Rollback plan and post-deploy monitoring notes.
- Quality Gate checklist.

**Execution Constraints:** scope boundary, exhaustive file list,
what does NOT change.

### Phase 3 (Outer): Self-Verification

After generating the SPEC:

1. Self-review: check for internal contradictions, missing edge cases,
   wrong line numbers, unfilled placeholders.
2. **Plan-quality verifier (optional):** run an external/independent
   verifier on the SPEC.
   *Examples:* a `deep-verify-plan` skill, a `verify-plan` skill,
   `/codex:review` on the SPEC file, a peer SPEC review.
3. Fix any issues found.
4. **BREAKPOINT** — present the SPEC to user for approval.

### Phase 4 (Outer): Generate Execution Prompt

After user approves the SPEC, output a short execution prompt in chat
(NOT a file):

```text
Read <project-context-doc> for context. Then execute the SPEC at
<path-to-SPEC>. Execute phase-by-phase, ensuring each phase reaches
quality score >= 0.85 before proceeding.
```

The execution can be manual (engineer reads the SPEC and works through
phases) or via an orchestrator agent.

> **Orchestrator (optional):** automate phase-by-phase execution with
> a runtime that respects breakpoints and quality gates.
> *Examples:* a babysitter run, a claude-flow workflow, an autoclaude
> session, a custom shell loop.
> *Skip if:* you prefer manual execution.

## Optional: Failure Log Mechanism

The SPEC requires reading a project-local `failure-log.md` before each run.
This file accumulates lessons learned from prior failed runs of the SPEC
pipeline, so each new execution inherits patterns to avoid.

### Setup (one-time)

Create the file in either:

- `~/.claude/skills/<your-namespace>/failure-log.md` — for cross-project
  lessons that follow you everywhere.
- `<repo-root>/.claude/failure-log.md` — for project-specific lessons that
  travel with the repo.

### Format

A single markdown file. Each entry follows this template:

```markdown
### [YYYY-MM-DD] <short-pattern-name>

**Context:** <what we tried to do>
**What went wrong:** <the failure mode in 1-2 sentences>
**Constraint going forward:** <the binding rule for future runs>
```

### When to write to it

After any phase failure, code-review escalation, or production rollback —
add an entry. The next SPEC run will read it as part of Phase 1 and treat
each pattern as a binding constraint, not a suggestion.

### When to read it

Phase 1 of every SPEC execution. The first numbered step in Phase 1 must be:
"Read `failure-log.md` and internalize all patterns as binding constraints."
If the file doesn't exist yet, that's fine — skip and note "no prior
failures recorded."

## Pre-Push Personal Docs Check

Personal/working documents often slip into commits — this gate catches them.

**Procedure:**

1. **List candidates** — run `git diff --name-only origin/<base-branch>...HEAD`
   to see every file changing in the push.

2. **Classify each file** as one of:
   - `legitimate` — real product change, ship it.
   - `personal-doc` — working note, scratch file, AI-generated planning
     artifact.
   - `ambiguous` — unclear, requires human judgment.

3. **Common personal-doc patterns** (block by default):
   - `SPEC*.md`, `PRD*.md`, `HANDOFF*.md`, `SUMMARY*.md`, `*-NOTES.md`
   - Anything under `docs/plans/`, `ai_docs/`, `.claude/scratch/`, `tmp/`
   - Files named like `investigation-*`, `analysis-*`, `playbook-*`
   - AI-generated plans/specs not explicitly approved for shipping

4. **Block-and-ask gate** — present blocked files to the user. For each
   one, require an explicit decision:
   - `unstage` — remove from this push (`git reset HEAD <file>`).
   - `keep` — yes, intentionally part of the change.
   - `gitignore` — add to `.gitignore` and unstage.

   Do NOT skip this step even if the user is in a hurry. The cost of one
   leaked working doc is much higher than the 30 seconds of friction.

5. After all blocked files are resolved, proceed with the push.

## Rules

- The SPEC must be proportional to the task. A 1-line change gets a concise
  SPEC. A multi-layer refactor gets a detailed one.
- Every phase MUST have a Quality Gate checklist.
- Previous SPECs are inspiration, not templates. Adapt to the task.
- All clarification questions to the user follow this format: short
  explanation of what's unclear + why it matters + recommendation +
  2-4 options.
- Do NOT implement anything. This skill only produces the SPEC file.
