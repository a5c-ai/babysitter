---
name: babysitter:status
description: Check the status of the active babysitter run
arguments:
  - name: runId
    description: Optional run ID to check (defaults to the active run)
    required: false
---

Check the current status of a babysitter orchestration run.

## Notes

- When called without arguments, reports on the run bound to the current session.
- If discovery reports `pi` as installed but direct invocation fails, validate `where pi`.
