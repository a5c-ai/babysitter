---
description: Clean up .a5c/runs and .a5c/processes directories. Aggregates insights from completed/failed runs into docs/run-history-insights.md, then archives and removes old run data after confirmation, and reports orphaned process files (removed only with --remove-orphaned-processes).
argument-hint: "[--dry-run] [--keep-days N] [--remove-orphaned-processes] Optional flags. --dry-run shows what would be removed without deleting. --keep-days N keeps runs newer than N days (default 7). --remove-orphaned-processes also archives and removes orphaned process files (reported only by default)."
allowed-tools: Read, Grep, Write, Task, Bash, Edit, Grep, Glob, WebFetch, WebSearch, Search, AskUserQuestion, TodoWrite, TodoRead, Skill, BashOutput, KillShell, MultiEdit, LS
---

Invoke the babysitter:babysit skill (using the Skill tool) and follow its instructions (SKILL.md).

Resolve the active process library with:

```bash
babysitter process-library:active --json
```

Read `binding.dir` from that JSON and create/run the cleanup process from `cradle/cleanup-runs.js#process` relative to that active library root. Do not use plugin-cache-relative cradle paths.

Implementation notes (for the process):
- Parse arguments for `--dry-run` flag (if present, set dryRun: true in inputs) `--keep-days N` (default: 7), and `--remove-orphaned-processes` (if present, set removeOrphanedProcesses: true in inputs)

CRITICAL: The cleanup MUST follow this exact phase order. Do NOT delete any run before Phase 2 completes.

Phase 1 — Scan:
- Scan .a5c/runs/ for all runs
- Classify each as terminal (completed/failed) or active (in-progress/created)
- Identify terminal runs older than the keep-days threshold as removal candidates
- Never mark active/in-progress runs for removal
- Count and report: total runs, terminal, active, removal candidates, disk usage

Phase 2 — Aggregate insights (BEFORE any deletion):
- For EVERY removal candidate, read its run.json and journal/ events
- Extract: processId, prompt, status, event count, created date, task summaries
- Group by process type and extract patterns (retry counts, convergence behavior, failure modes)
- Append a new dated section to docs/run-history-insights.md with:
  - Summary statistics (runs removed, disk freed, runs retained)
  - Run categories with counts and descriptions
  - Key patterns observed (multi-batch convergence, retry behavior, etc.)
  - What worked well / what didn't from the run data
- This file MUST be written and verified before proceeding to Phase 3

Phase 3 — Confirm removal:
- In interactive mode, show the user what will be removed via a breakpoint
- In non-interactive mode (yolo), the confirm breakpoint is auto-approved without selecting the removal option, so nothing is removed (insights are still written). Run interactively to remove.
- In dry-run mode, stop here and show what would be removed

Phase 4 — Remove:
- Removal happens only inside the process, after the exact removal option is chosen at the breakpoint. Never delete runs manually.
- Delete the terminal runs older than keep-days threshold
- Report orphaned process files not referenced by remaining runs (report-only by default; removed only with `removeOrphanedProcesses: true`, and never if git-tracked or if its name appears in another file in the processes directory, a conservative "named by another file" match)
- Show remaining run count and disk usage after cleanup
