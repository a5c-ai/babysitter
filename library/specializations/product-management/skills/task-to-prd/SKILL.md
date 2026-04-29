---
name: task-to-prd
description: "Convert a raw task (tracker ticket, email, or text) into a fully characterized PRD. User-facing entry point that dispatches to the task-to-prd babysitter process via /babysitter:call (interactive) or /babysitter:yolo (auto). Stack-agnostic."
author: Yehuda Yungstein
---

# Task to PRD Generator

User-facing entry point for the task → PRD pipeline. The user runs
`/task-to-prd` and this skill dispatches to the companion babysitter
process via `/babysitter:call` (interactive — Five Whys, clarification
loop, scope-lock, per-finding gates, final approval) or
`/babysitter:yolo` (non-interactive, auto-approve every gate).

## Usage

```
/task-to-prd <tracker-id | file-path | inline-text>
```

Examples:
- `/task-to-prd JIRA-1234`
- `/task-to-prd path/to/email.txt`
- `/task-to-prd "Eden asked to change the donut to show lessons"` (inline)

## Companion process

- Library path: `library/specializations/product-management/task-to-prd.js`
- Locally installed: `~/.a5c/processes/task-to-prd.js`

The process file is the source of truth for the pipeline. This skill
intentionally stays thin so users only need to remember `/task-to-prd`.

## What this skill does when invoked

1. **Parse input** — detect whether it's a tracker ticket ID, a file
   path, or inline text.
2. **Infer `featureBranch`** — read the current git branch via
   `git branch --show-current`. If unsuitable (e.g., `main`), ask the
   user to provide a feature-branch name.
3. **Detect optional inputs** from the project context:
   - `contextDoc` — project conventions doc (default `CLAUDE.md`)
   - `archiveDir` — past PRD archive directory (default empty)
   - `trackerHint` — hint like `jira`, `linear`, `gh-issues` (default empty)
   - `secondaryReviewer` — hint like `codex`, `gemini`, `peer` (default empty)
4. **Ask the user to pick the run mode:**

   > Run mode for the babysitter `task-to-prd` process:
   >
   > 1. **Interactive (`/babysitter:call`)** — recommended. The Five
   >    Whys + clarification loop is intrinsically interactive — every
   >    question goes through the user. Verification findings each get
   >    a per-finding approval gate.
   > 2. **Auto / yolo (`/babysitter:yolo`)** — non-interactive. Skips
   >    the clarification loop (uses defaults from Five Whys), auto-
   >    approves every gate, applies all proposed PRD changes
   >    automatically. Use only when the input is already well-defined
   >    and you want a fast first draft.

   Default to option 1 if the user does not respond.

5. **Dispatch** by invoking the chosen babysitter command via the Skill tool:

   For interactive:
   ```
   Skill('babysitter:call', 'Run the product-management/task-to-prd process with inputs: input=<resolved>, featureBranch=<resolved>, contextDoc=<resolved>, archiveDir=<resolved>, trackerHint=<resolved>, secondaryReviewer=<resolved>')
   ```

   For auto / yolo:
   ```
   Skill('babysitter:yolo', '<same instruction as above>')
   ```

6. **Return** the PRD path, the Decision Log, and the follow-up
   `/prd-to-spec` prompt produced by the process to the user.

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

- **Tracker integration** — `trackerHint` input. Examples: Jira
  (`/jira` skill or `acli jira workitem view`), Linear (CLI / MCP),
  GitHub Issues (`gh issue view`).
- **Secondary reviewer** — `secondaryReviewer` input. Examples: Codex
  (`/codex:review`), Gemini (`/gemini-review`), `deep-verify-plan`
  (`/deep-verify-plan`), `peer` (notify a teammate).
- **Stakeholder attribution** — the Decision Log records each Q&A with
  attribution to `user` or a named stakeholder (e.g., product owner,
  tech lead, designer).

The process works end-to-end without any of them.

## Pipeline shape (executed by the process)

| Phase | What happens | Interactive in `/babysitter:call`? |
|-------|--------------|-----------------------------------|
| 1a. Load source | Detect tracker / file / inline | no |
| 1b. Five Whys | Root-cause analysis | no |
| 1c. Clarification loop | Q&A one at a time | YES |
| 1d. Scope Lock | Approve scope before drafting | YES |
| 2. Draft (parallel) | Codebase scan + draft PRD via embedded skill instructions | no |
| 3a. Verification (5 parallel) | what-could-go-wrong + consistency + conventions + adversarial + quality checklist | no |
| 3b. Per-finding gate | Approve each proposed PRD change | YES |
| 4a. Final review | Approve final PRD | YES |
| 4b. Tracker update | Push reference to tracker (if applicable) | no |
| 4c. Follow-up prompt | Output `/prd-to-spec <path>` | no |

In `/babysitter:yolo` mode, every gate marked YES is auto-approved.

## Rules

- The skill itself does not produce the PRD. It only sets up inputs
  and dispatches to the process via `/babysitter:call` or `/babysitter:yolo`.
- Default to `/babysitter:call` (interactive) when in doubt.
- Phase 1 (clarification) is the most user-intensive — yolo mode
  effectively turns it into a shallow first-draft using only Five-Whys
  defaults. Recommend interactive mode for any non-trivial task.
- The PRD must be proportional to the task size (the process honors this).
