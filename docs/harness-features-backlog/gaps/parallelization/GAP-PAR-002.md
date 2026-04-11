# GAP-PAR-002: Async Effect Execution

| Field | Value |
|-------|-------|
| Category | parallelization |
| Priority | High |
| Effort | L |
| Status | Missing |

## Description
Dispatch effects asynchronously so the orchestration loop can continue with other work while long-running effects execute in the background. Reframed from CC background agent dispatch to babysitter async effect model.

## Current State
All harness invocations via invokeHarness() are synchronous -- the orchestration loop blocks until the invocation returns. No mechanism to dispatch a task and continue with other work.

## Target State
Effects can be dispatched with a background flag. The orchestration loop continues processing other effects while background effects execute. Background effect status tracked via polling. Results posted and journal updated when complete.

## Dependencies
- [GAP-PAR-001](../parallelization/GAP-PAR-001.md) -- concurrent execution foundation
- [GAP-SUBOBS-002](../subagent-observability/GAP-SUBOBS-002.md) -- progress tracking for background effects

## Key Files
| Component | Path |
|-----------|------|
| Harness invoker | `packages/sdk/src/harness/invoker.ts` |
| Scheduler hints | `packages/sdk/src/runtime/types.ts` |
| Orchestrate iteration | `packages/sdk/src/runtime/orchestrateIteration.ts` |

## Recommendation
Phase 2 implementation. Add background flag to effect scheduler hints. Babysit skill dispatches background effects without waiting and tracks status via polling.
