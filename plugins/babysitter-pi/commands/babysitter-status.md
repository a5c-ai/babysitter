---
name: babysitter:status
description: Check the status of the active babysitter run
arguments:
  - name: runId
    description: Optional run ID to check (defaults to the active run)
    required: false
---

Check the current status of a babysitter orchestration run. Displays run metadata, iteration count, pending and resolved effects, elapsed time, and current phase.

## Usage

```
/babysitter:status
/babysitter:status 01ABCDEF1234
```

## Output

- **Run ID** and **process ID**
- **Status**: idle, running, completed, or failed
- **Iteration count** and elapsed wall-clock time
- **Pending effects**: effects awaiting execution with their kind and title
- **Resolved effects**: effects that have been completed
- **Current phase**: the active orchestration phase (e.g., plan, execute, verify)
- **Quality score**: the most recent score value, if available

## Notes

- When called without arguments, reports on the run bound to the current session.
- When called with a run ID, the implementation may read status directly from
  the underlying Babysitter runtime.

## Implementation Notes

Raw Babysitter runtime inspection belongs here, not in the user-facing README.
If the command implementation shells out to Babysitter status or event APIs,
that is an internal harness detail.
