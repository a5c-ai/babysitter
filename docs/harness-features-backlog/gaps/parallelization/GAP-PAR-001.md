# GAP-PAR-001: Concurrent Effect Execution

| Field | Value |
|-------|-------|
| Category | parallelization |
| Priority | High |
| Effort | L |
| Status | Partial |

## Description
Execute multiple independent effects concurrently within a single orchestration iteration, using parallelGroupId hints to identify effects safe for concurrent dispatch.

## Current State
ctx.parallel.all() batches effect requests, but these are dispatched to the external orchestrator as a list and executed one at a time. The parallelGroupId scheduler hint exists but is not used for concurrent execution.

## Target State
Effects within the same parallelGroupId execute concurrently via multiple harness invocations or Pi sessions. Results posted as they complete. True parallelism without SDK changes -- only babysit skill modification needed.

## Dependencies
- [GAP-PAR-009](../parallelization/GAP-PAR-009.md) -- execution strategy framework

## Key Files
| Component | Path |
|-----------|------|
| Parallel intrinsics | `packages/sdk/src/runtime/intrinsics/parallel.ts` |
| Process context | `packages/sdk/src/runtime/processContext.ts` |
| Task batching | `packages/sdk/src/tasks/batching.ts` |
| Scheduler hints | `packages/sdk/src/runtime/types.ts` |

## Recommendation
Phase 1 implementation. Modify the babysit skill to detect parallelGroupId in pending actions and execute effects within the same group concurrently.
