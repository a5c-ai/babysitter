---
name: retrospect
description: Summarize or retrospect on one or more completed Babysitter runs.
argument-hint: "[run-id...] [--all] Optional run IDs or --all for all runs"
---

# retrospect

Load and use the installed `babysit` skill.

Resolve the request in `retrospect` mode:

- treat everything after `$retrospect` as the run selector(s) to summarize
- focus on the run history, outcomes, lessons, and gaps
- do not create a separate command surface here; this skill only forwards into
  `babysit`

## Phase 1: Resolve Target Run(s)

- If `--all` or "all" is present in args: list all runs via `ls -lt .a5c/runs/` and collect all completed/failed run IDs
- If multiple run IDs are provided: use all of them
- Otherwise: existing behavior (resolve the latest single run)
- Use `ask_user` to confirm run selection in interactive mode

## Phase 2: Load Run Data

For each selected run, load:
- `run.json` metadata
- Journal events
- Task definitions and results
- State snapshots

## Phase 3: Analysis

Perform standard per-run analysis (outcomes, process effectiveness, suggestions).

### Cross-Run Pattern Analysis (multi-run mode)

When analyzing multiple runs, additionally cover:
- **Common failure modes** across runs
- **Velocity trends** (tasks/time across runs)
- **Process evolution** (how processes changed over time)
- **Repeated breakpoint patterns**

## Phase 4: Suggestions

Provide actionable suggestions for process improvements, optimizations, and fixes.

## Phase 5: Implementation

If the user agrees, implement improvements to processes, skills, or configuration.

## Phase 6: Cleanup Suggestion

After analysis, suggest: "Consider running `babysitter cleanup` (or `/babysitter:cleanup`) to clean up old run data and reclaim disk space."
