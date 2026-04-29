---
name: cleanup
description: Clean up .a5c/runs and .a5c/processes directories. Aggregates insights from completed/failed runs into docs/run-history-insights.md, then removes old run data and orphaned process files.
---

# cleanup

Invoke the babysitter:babysit skill (using the Skill tool) and follow its instructions (SKILL.md).

Create and run a cleanup process using the process at `skills\babysit\process\cradle\cleanup-runs.js/processes/cleanup-runs.js`.

Implementation notes (for the process):
- Parse arguments for `--dry-run` flag (if present, set dryRun: true in inputs) and `--keep-days N` (default: 7)
- The process scans .a5c/runs/ for completed/failed runs, aggregates insights, writes summaries, then removes old data
- Always show the user what will be removed before removing (in interactive mode via breakpoints)
- In non-interactive mode (yolo), proceed with cleanup using defaults
- The insights file goes to docs/run-history-insights.md
- Only remove terminal runs (completed/failed) older than the keep-days threshold
- Never remove active/in-progress runs
- Remove orphaned process files not referenced by remaining runs
- After cleanup, show remaining run count and disk usage
