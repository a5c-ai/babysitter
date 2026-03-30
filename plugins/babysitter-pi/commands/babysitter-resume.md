---
name: babysitter:resume
description: Resume a previously stopped or interrupted babysitter run
arguments:
  - name: runId
    description: The run ID to resume
    required: true
---

Resume an existing babysitter orchestration run that was previously stopped, interrupted, or is in a waiting state. Re-binds the run to the current session and continues iteration from where it left off.

## Usage

```
/babysitter:resume 01ABCDEF1234
```

## Behaviour

1. Locates the run directory for the given run ID.
2. Reads run metadata and journal to determine current state.
3. Re-binds the run to the active oh-my-pi session.
4. Restores iteration count and timing state from the journal.
5. Runs the next orchestration iteration via the SDK.
6. Injects a continuation prompt if effects are still pending.

## Implementation Notes

This command doc can describe the low-level Babysitter runtime behavior that the
pi plugin hides from end users.

- Resume may use raw Babysitter replay, iteration, and session-binding
  primitives internally.
- If the harness has a native resume path, prefer that over an explicit
  fallback association flow.

## Notes

- The run must exist on disk in the configured runs directory (`BABYSITTER_RUNS_DIR`).
- Completed or failed runs cannot be resumed; use `/babysitter:status` to check state first.
- If another run is active for the current session, it will be replaced.
- The replay engine handles deterministic re-execution of previously resolved effects.
