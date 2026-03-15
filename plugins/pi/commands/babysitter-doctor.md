---
name: babysitter:doctor
description: Diagnose the health of a babysitter run
arguments:
  - name: runId
    description: Optional run ID to diagnose (defaults to the active run)
    required: false
---

Run diagnostic checks against a babysitter run to identify potential issues. Inspects run metadata, journal integrity, state cache, lock files, and effect health.

## Usage

```
/babysitter:doctor
/babysitter:doctor 01ABCDEF1234
```

## Checks Performed

- **Run directory structure**: verifies that `run.json`, `inputs.json`, `journal/`, `tasks/`, and `state/` exist and are well-formed.
- **Journal integrity**: validates event checksums, ordering, and completeness. Detects gaps or duplicate sequence numbers.
- **State cache**: checks whether the state cache is current or needs rebuilding. Reports schema version mismatches.
- **Lock file**: detects stale `run.lock` files that may block iteration (e.g., from a crashed process).
- **Effect health**: identifies effects that have been pending longer than expected, effects with missing task definitions or result files, and orphaned blobs.
- **Guard status**: reports current iteration count vs. maximum, elapsed time vs. time limit, consecutive error count, and doom-loop detection state.
- **Disk usage**: reports total run directory size and identifies large blobs.

## Output

Each check reports one of:
- **OK**: the check passed
- **WARN**: a potential issue was detected that may not be blocking
- **FAIL**: a definite problem that needs attention

## Notes

- When called without arguments, diagnoses the run bound to the current session.
- Suggests remediation commands (e.g., `run:repair-journal`, `run:rebuild-state`) when issues are found.
- Does not modify any run state; this is a read-only diagnostic.
