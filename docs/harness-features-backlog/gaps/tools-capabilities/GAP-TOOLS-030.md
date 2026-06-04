# GAP-TOOLS-030: Effect Cancellation

| Field | Value |
|-------|-------|
| Category | tools-capabilities |
| Priority | High |
| Effort | M |
| Status | Missing |

## Description
Cancel or stop a running effect mid-execution. CC's `TaskStopTool` can cancel
background tasks. Babysitter has no cancellation mechanism -- once an effect is
dispatched, it runs to completion or timeout.

## Current State
Effects are dispatched via `ctx.task()` and executed by the harness operator.
`BABYSITTER_TIMEOUT` (default 2min) and `BABYSITTER_NODE_TASK_TIMEOUT` (15min) are
the only guards. The `invokeHarness()` function spawns a child process with a timeout
but the operator cannot cancel individual effects. If a harness hangs, the entire run
blocks until timeout.

No journal event for cancellation. No `EFFECT_CANCELLED` type.

## Target State
- New `EFFECT_CANCELLED` journal event type
- `task:cancel <runId> <effectId>` CLI command
- Cancel signal propagated to running harness process (SIGTERM then SIGKILL)
- Effect result marked as `status: 'cancelled'` with cancellation reason
- Process code receives cancellation as a thrown error that can be caught:
  ```javascript
  try {
    await ctx.task(longRunningTask, args);
  } catch (e) {
    if (e instanceof EffectCancelledError) {
      // handle graceful cancellation
    }
  }
  ```
- Embedded SDK dashboard shows cancel button for running effects
- Timeout-based auto-cancellation configurable per task

## Dependencies
None (core cancellation is standalone).

**Optional enhancement**: [GAP-SUBOBS-004](../subagent-observability/GAP-SUBOBS-004.md) -- health monitoring can trigger auto-cancel (future integration, not a prerequisite)

## Key Files
| Component | Path |
|-----------|------|
| Harness invoker | `packages/sdk/src/harness/invoker.ts` |
| Runtime exceptions | `packages/sdk/src/runtime/` (EffectRequestedError etc.) |
| Storage events | `packages/sdk/src/storage/` (event types) |
| Task CLI | `packages/sdk/src/cli/` (task:post) |

## Recommendation
Phase 2. High priority for production use -- runaway effects are a real operational
issue. Start with CLI cancellation, then add embedded SDK dashboard button.
