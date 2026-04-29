---
name: prd-to-spec
description: "Convert an approved PRD into a phase-gated implementation SPEC. User-facing entry point that dispatches to the prd-to-spec babysitter process via /babysitter:call (interactive) or /babysitter:yolo (auto). Stack-agnostic."
author: Yehuda Yungstein
---

# PRD to SPEC Generator

User-facing entry point for the PRD → SPEC pipeline. The user runs
`/prd-to-spec` and this skill dispatches to the companion babysitter
process via `/babysitter:call` (interactive, with breakpoints) or
`/babysitter:yolo` (non-interactive, auto-approve).

## Usage

```
/prd-to-spec <PRD-path-or-inline-text>
```

Examples:
- `/prd-to-spec docs/active/feature-X-PRD.md`
- `/prd-to-spec "Build a notification dashboard with real-time alerts"`

## Companion process

- Library path: `library/specializations/product-management/prd-to-spec.js`
- Locally installed: `~/.a5c/processes/prd-to-spec.js`

The process file is the source of truth for the pipeline. This skill
intentionally stays thin so users only need to remember `/prd-to-spec`.

## What this skill does when invoked

1. **Parse input** — resolve the PRD path or capture the inline text.
2. **Infer `featureBranch`** — read the current git branch via
   `git branch --show-current`. If it is `main` / `develop` / `dev`,
   ask the user for a feature-branch name.
3. **Detect optional inputs** from the project context:
   - `contextDoc` — project conventions doc (default `CLAUDE.md`)
   - `archiveDir` — past SPEC archive directory (default empty)
   - `failureLogPath` — project-local `failure-log.md` (default empty)
   - `secondaryReviewer` — hint like `codex`, `gemini`, `peer` (default empty)
4. **Ask the user to pick the run mode:**

   > Run mode for the babysitter `prd-to-spec` process:
   >
   > 1. **Interactive (`/babysitter:call`)** — recommended. Pauses at
   >    every breakpoint (discovery review, SPEC approval, etc.) for
   >    explicit user confirmation.
   > 2. **Auto / yolo (`/babysitter:yolo`)** — non-interactive. Skips
   >    all breakpoints; auto-approves every gate. Use only when the
   >    pipeline is well-tested and the inputs are trusted.

   Default to option 1 if the user does not respond.

5. **Dispatch** by invoking the chosen babysitter command via the Skill tool:

   For interactive:
   ```
   Skill('babysitter:call', 'Run the product-management/prd-to-spec process with inputs: prdPath=<resolved>, featureBranch=<resolved>, contextDoc=<resolved>, archiveDir=<resolved>, failureLogPath=<resolved>, secondaryReviewer=<resolved>')
   ```

   For auto / yolo:
   ```
   Skill('babysitter:yolo', '<same instruction as above>')
   ```

6. **Return** the SPEC path and the execution prompt produced by the
   process to the user.

## Fallback (no babysitter runtime)

If neither `/babysitter:call` nor `/babysitter:yolo` is available:

1. Read the process source at the location above.
2. Execute each task's agent prompt manually, in phase order.
3. Pause at every `ctx.breakpoint(...)` for explicit user approval
   (interactive equivalent) or skip every breakpoint (yolo equivalent),
   matching the mode the user picked in step 4.
4. Return the same outputs the process would have returned.

## Optional Integration Hooks

All flow through the process inputs (none required):

- **Tracker integration** — `trackerHint` input. Examples: `jira`
  (`/jira` or `acli jira workitem update`), `linear` (CLI / MCP),
  `gh-issues` (`gh issue edit`).
- **Secondary reviewer** — `secondaryReviewer` input. Examples: `codex`
  (`/codex:review`), `gemini` (`/gemini-review`), `deep-verify-plan`
  (`/deep-verify-plan`), `peer` (notify a teammate).
- **Pipeline framework** for Phase 3 verification — examples: Dagster,
  Airflow, dbt, Prefect, K8s preview.
- **UI framework** for Phase 3 verification — examples: Vite, Next,
  Storybook.

The process works end-to-end without any of them.

## Failure Log Mechanism

The process reads a project-local `failure-log.md` in Phase 1 to
internalize lessons from prior failed runs. Setup:

- Cross-project lessons: `~/.claude/skills/<your-namespace>/failure-log.md`
- Project-specific lessons: `<repo-root>/.claude/failure-log.md`

Each entry follows:

```markdown
### [YYYY-MM-DD] <short-pattern-name>

**Context:** <what we tried to do>
**What went wrong:** <the failure mode in 1-2 sentences>
**Constraint going forward:** <the binding rule for future runs>
```

If the file doesn't exist, the process notes "no prior failures recorded"
and continues.

## Pre-Push Personal Docs Check

The process executes this gate as part of Phase 7 (Deliver) of the
generated SPEC. Procedure:

1. List candidates: `git diff --name-only origin/<base-branch>...HEAD`
2. Classify each file: `legitimate` / `personal-doc` / `ambiguous`
3. Block by default for: `SPEC*.md`, `PRD*.md`, `HANDOFF*.md`,
   `SUMMARY*.md`, `*-NOTES.md`, anything under `docs/plans/`, `ai_docs/`,
   `.claude/scratch/`, `tmp/`, `investigation-*`, `analysis-*`,
   `playbook-*`, AI-generated plans/specs not explicitly approved.
4. Block-and-ask gate: per-file decision of `unstage` / `keep` /
   `gitignore`. Do NOT skip even if rushed.
5. Proceed with push only after all blocked files are resolved.

## Rules

- The skill itself does not produce the SPEC. It only sets up inputs
  and dispatches to the process via `/babysitter:call` or `/babysitter:yolo`.
- Default to `/babysitter:call` (interactive) when in doubt.
- Never bypass user-approval breakpoints in interactive mode — they
  are first-class in the process.
- The SPEC must be proportional to the task (the process honors this).
