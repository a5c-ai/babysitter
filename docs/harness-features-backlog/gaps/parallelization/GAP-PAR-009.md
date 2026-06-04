# GAP-PAR-009: Parallel Effect Execution Strategies

| Field | Value |
|-------|-------|
| Category | parallelization |
| Priority | High |
| Effort | M |
| Status | Partial |

## Description
Implement hint-driven execution strategies that use EffectSchedulerHints (parallelGroupId, pendingCount, sleepUntilEpochMs) to make intelligent decisions about effect execution order and concurrency.

## Current State
Scheduler hints are written to task definitions but not read by the orchestration loop. All effects execute in dispatch order regardless of hints.

## Target State
Multiple execution strategies: parallel strategy (same parallelGroupId concurrently), sleep strategy (skip sleep effects until epoch passes), priority strategy (high-pendingCount groups first), cost strategy (route expensive tasks to cheaper models).

## Dependencies
- None (enables GAP-PAR-001, GAP-PAR-002, GAP-PAR-003)

## Key Files
| Component | Path |
|-----------|------|
| Scheduler hints | `packages/sdk/src/runtime/types.ts` |
| Orchestrate iteration | `packages/sdk/src/runtime/orchestrateIteration.ts` |
| Task batching | `packages/sdk/src/tasks/batching.ts` |

## Recommendation
Phase 1 implementation. Read scheduler hints in the babysit skill and implement at least the parallel and sleep strategies.
