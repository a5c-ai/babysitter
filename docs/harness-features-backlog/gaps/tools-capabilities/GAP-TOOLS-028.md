# GAP-TOOLS-028: Sleep/Delay Effect Enhancement

| Field | Value |
|-------|-------|
| Category | tools-capabilities |
| Priority | Low |
| Effort | S |
| Status | Partial |

## Description
Enhance the existing `ctx.sleepUntil()` effect with richer delay semantics: relative durations, conditional wake (sleep until condition), retry-with-backoff patterns, and integration with the scheduling system. Document current capabilities and gaps.

## Current State
The `ctx.sleepUntil()` intrinsic exists as a `ProcessContext` effect that pauses execution until a specified timestamp. The `sleep` task kind is registered. Sleep effects go through the journal and replay system. However: only absolute timestamps are supported (no relative durations like "wait 5 minutes"), no conditional wake mechanism, no built-in retry-with-backoff pattern, and no integration with scheduling.

## Target State
Extended sleep API: `ctx.sleep(duration)` for relative delays, `ctx.sleepUntil(timestamp)` (existing), `ctx.waitFor(condition, options)` for conditional wake with polling interval and timeout, `ctx.retryWithBackoff(task, options)` for exponential backoff retry patterns. All variants journal-tracked and replayable.

## Dependencies
- [GAP-TOOLS-020](../tools-capabilities/GAP-TOOLS-020.md) -- scheduling integration for long sleeps

## Key Files
| Component | Path |
|-----------|------|
| Process context | `packages/sdk/src/runtime/processContext.ts` |
| Task definitions | `packages/sdk/src/tasks/` |
| Replay engine | `packages/sdk/src/runtime/replay/` |

## Recommendation
Phase 4 implementation. Add `ctx.sleep(duration)` as syntactic sugar over `ctx.sleepUntil()`. Implement `ctx.waitFor()` as a polling effect. Build `ctx.retryWithBackoff()` as a composition of task + sleep effects. Low effort since the foundation exists.
