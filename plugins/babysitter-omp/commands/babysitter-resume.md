---
name: babysitter:resume
description: Resume a previously stopped or interrupted babysitter run
arguments:
  - name: runId
    description: The run ID to resume
    required: true
---

Resume an existing babysitter orchestration run that was previously stopped, interrupted, or is in a waiting state. Re-binds the run to the current session and continues iteration from where it left off.

## Behaviour

1. Locates the run directory for the given run ID.
2. Reads run metadata and journal to determine current state.
3. Re-binds the run to the active oh-my-pi session.
