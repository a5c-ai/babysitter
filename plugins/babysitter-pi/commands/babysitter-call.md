---
name: babysitter:call
description: Start a babysitter orchestration run
arguments:
  - name: prompt
    description: The task to orchestrate
    required: true
---

Start a babysitter orchestration run. Creates a new run using the SDK, binds it to the current session, and begins iteration.

This command initialises a fresh babysitter run with the given prompt, associates it with the active oh-my-pi session, and kicks off the first orchestration iteration. The loop driver will continue iterating automatically on subsequent `agent_end` events until the run completes, fails, or a guard trips.

## Usage

```
/babysitter:call "build feature X"
/babysitter:call "refactor the auth module to use JWT"
```

## Behaviour

1. Creates a new run via the SDK (`createRun`).
2. Binds the run to the current oh-my-pi session (`bindRun`).
3. Runs the first orchestration iteration (`iterate`).
4. Injects a continuation prompt if effects are pending.

## Implementation Notes

This command doc is the right place for low-level Babysitter runtime mechanics.
The top-level plugin README should stay at the `/babysitter:*` command surface.

- The command implementation may call raw Babysitter runtime primitives such as
  harness-aware `run:create`, iteration, status inspection, and result posting.
- Result values are written to `tasks/<effectId>/output.json` and then committed
  through `task:post`; the implementation must never write `result.json`
  directly.
- If the harness exposes a stronger native binding path than explicit session
  association, the implementation should prefer that path.

## Notes

- Only one run can be active per session. Starting a new run while one is active will replace it.
- The run directory defaults to `BABYSITTER_RUNS_DIR` (`.a5c/runs`).
- Use `/babysitter:status` to check progress and `/babysitter:resume` to pick up a stopped run.
