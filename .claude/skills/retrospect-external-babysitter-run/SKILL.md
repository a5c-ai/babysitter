---
name: retrospect-external-babysitter-run
description: For a repository in the babysitter-users catalog, locate its babysitter processes and any committed runs (.a5c/runs/<runId>/) and perform a retrospective on a chosen run -- what went well, what failed, process suggestions, quality of effect design, breakpoint patterns -- mirroring the /babysitter:retrospect workflow but applied to an external repo. Invoke when asked to "retrospect on repo X's run", "analyze how someone else used babysitter", or "review an external babysitter run".
---

# Retrospect External Babysitter Run

Analyse a babysitter run that lives in an external public repository, using the same lens as the in-repo `/babysitter:retrospect` command. Produce a written retrospective with concrete suggestions for the process author (or, if the insight generalizes, for the babysitter project itself).

## When to use

- User names an external repo and asks for a retrospective.
- User asks "find a babysitter run to retrospect on" (combine with the `catalog-babysitter-users` skill to pick one).
- User asks "how are other people using babysitter processes? What do they get wrong?".

## Prerequisites

- `gh` CLI authenticated.
- `docs/repo-with-babysitter-processes.md` exists (if not, run the `catalog-babysitter-users` skill first).
- A workspace directory where external repos can be shallow-cloned (default: `/tmp/babysitter-retrospect/` or `.a5c/tmp/external-runs/`).

## Phase 1 -- Target selection

1. Read `docs/repo-with-babysitter-processes.md` and list Active repos with stars + description. If the user already named a repo, skip to step 3.
2. Ask the user which repo to retrospect on (use AskUserQuestion in interactive mode; if non-interactive, pick the highest-starred Active repo that wasn't retrospected in the last 30 days -- track via `docs/retrospectives/<owner>-<name>/log.md`).
3. Confirm the target with the user before cloning.

## Phase 2 -- Discover processes and runs

Shallow clone the target:

```bash
mkdir -p .a5c/tmp/external-runs
cd .a5c/tmp/external-runs
gh repo clone <owner>/<name> -- --depth 50 --single-branch
cd <name>
```

Locate:

- **Process files**: files importing `defineTask` from `@a5c-ai/babysitter-sdk`. Use Grep: `grep -rl "from '@a5c-ai/babysitter-sdk'" -- . --include='*.js' --include='*.ts'`.
- **Committed runs**: `.a5c/runs/<runId>/` directories. Many repos gitignore `.a5c/runs/` entirely -- that's fine; note it and proceed with process-only retrospective. When runs ARE committed, look for `run.json`, `journal/`, `tasks/`, `state/output.json`.
- **Historical runs via git log**: `git log --all --diff-filter=A --name-only -- '.a5c/runs/'` surfaces runs that existed at some commit even if later cleaned up. Check out the commit that introduced the run if you want the journal content.

Summarize to the user:

- N process files found, by top-level directory
- M run directories present in HEAD; P additional historical runs reachable via git history
- Which runs completed vs failed (grep `RUN_COMPLETED` / `RUN_FAILED` in the journal)

## Phase 3 -- Pick a run to retrospect

If multiple runs exist, ask the user (interactive) or default (non-interactive) to:

- The most recent failed run (highest signal for process improvement), OR
- If no failures, the most recent completed run.

If no runs are committed at all, switch to a **process-only retrospective**: analyse the process file(s) for quality issues without run evidence. Mark the output clearly as process-only.

## Phase 4 -- Load the run

Inspect, in order:

- `.a5c/runs/<runId>/run.json` -- processId, entrypoint, prompt, createdAt
- `.a5c/runs/<runId>/inputs.json` -- user intent
- `.a5c/runs/<runId>/journal/*.json` -- event stream (RUN_CREATED, EFFECT_REQUESTED, EFFECT_RESOLVED, RUN_COMPLETED / RUN_FAILED). Read every journal entry; it is the authoritative record.
- `.a5c/runs/<runId>/tasks/<effectId>/task.json` + `result.json` -- per-effect definition and result
- `.a5c/runs/<runId>/state/output.json` (if present) -- final output
- The process file referenced by `run.json.entrypoint` -- cross-reference against the journal to see what the author intended vs what happened.

## Phase 5 -- Retrospective analysis

Mirror the in-repo `/babysitter:retrospect` workflow. Produce notes under each heading:

### 5.1 Outcome

- Success / partial success / failure.
- Total iterations, duration, distinct effect count, retry count.
- Final output quality (from `state/output.json` shape + content).

### 5.2 What went well

- Effects that resolved on first try.
- Process sections with clear inputs/outputs and no re-runs.
- Useful breakpoints that caught real issues before they propagated.

### 5.3 What went poorly

- Effects that were re-dispatched (same invocationKey or similar taskId appearing repeatedly).
- Long gaps between EFFECT_REQUESTED and EFFECT_RESOLVED (external bottlenecks).
- Breakpoints that looped (approval -> reject -> retry -> reject).
- Tasks that crashed and what the error category was (Configuration / Validation / Runtime / External / Internal).
- Any RUN_FAILED: trace the last few events and the thrown error.

### 5.4 Process-quality review

Evaluate the process file itself against these criteria:

- Determinism: does every effect have stable invocation keys (processId:stepId:taskId)? Any non-deterministic branching based on wall-clock time, random, or unpinned env vars?
- Effect granularity: are tasks too coarse (one huge agent task vs several narrower ones) or too fine (dozens of tiny tasks)?
- Idempotency: can the process be re-run safely? Does it use `ctx.task()` for all side effects, or does it write files outside a task?
- Breakpoint discipline: are breakpoints used to gate irreversible actions? Do they follow the robust rejection pattern (loop with feedback)?
- Error surfacing: does the process throw with useful context, or swallow errors?
- Labels: are task labels meaningful and consistent (enables filtering / observability)?
- Re-use: could any section be replaced by a shared component from `library/processes/shared/`?

### 5.5 Suggestions

Concrete, actionable suggestions in three buckets:

- **For the run** (if still in progress): what to retry, rollback, or fix first.
- **For the process** (always): specific edits to the process file -- split this task, add this breakpoint, move that side-effect inside a task, use stableKey here.

Can it be generalized into a reusable pattern or library process in the processes library? If so, suggest that too. (also using `/babysitter:contrib library ...`)

- **For babysitter upstream** (when the insight generalizes): missing primitives, confusing SDK behavior, documentation gaps worth filing via `/babysitter:contrib`.

Every suggestion must cite evidence -- a journal event, a file path, a line range.

## Phase 6 -- Write the retrospective

Write to `docs/retrospectives/<owner>-<name>/<runId-or-process-name>.md` with this structure:

```markdown
# Retrospective: <owner>/<name> -- <runId or process name>

Date: YYYY-MM-DD
Source commit: <sha>
Process: <relative path>
Run: <runId or "process-only">
Outcome: <success | failure | process-only>

## Context
<1-3 sentences on what the process is trying to do and the user intent from inputs.json>

## Timeline
<bullet timeline of key journal events with timestamps and durations>

## What went well
...

## What went poorly
...

## Process-quality review
...

## Suggestions
### For the run
### For the process
### For babysitter upstream

## Evidence
<links to specific journal event files, task.json files, line-anchored process file refs>
```

Also append a one-line entry to `docs/retrospectives/<owner>-<name>/log.md` with the date, runId, and outcome, so we don't re-retrospect the same run.

## Phase 7 -- Cleanup and callbacks

- Leave the shallow clone under `.a5c/tmp/external-runs/` in place (it's cheap). If disk pressure, note this to the user; do NOT auto-delete.
- Suggest the user use `/babysitter:contrib` for any upstream-worthy insight:
  - Process/skill improvement idea -> `/babysitter:contrib library contribution: [description]`
  - SDK/CLI bug or missing primitive -> `/babysitter:contrib bug report: [description]`
  - Documentation gap that tripped the external author -> `/babysitter:contrib documentation question: [what was unclear]`
- If the process author is findable (repo owner, git author of the process file), suggest opening an issue on their repo with a pointer to the retrospective document.

## Notes

- Honour the target repo's LICENSE when quoting code in the retrospective. Short excerpts for analysis are fair use; do not wholesale copy process files into this repo.
- Never execute the external process -- retrospectives are read-only analysis.
- If the run journal is very large (>500 events), sample: first 20, last 20, plus every EFFECT that transitioned to resolved or failed.
