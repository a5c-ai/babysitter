# GAP-PERF-007: Aggressive Parallelism

| Field | Value |
|-------|-------|
| Category | performance |
| Priority | Medium |
| Effort | L |
| Status | Partial |

## Description
Maximize parallel execution of independent effects within and across iterations, moving beyond conservative sequential execution.

## Current State
ctx.parallel.all()/ctx.parallel.map() provides effect batching, but the babysit skill executes pending effects sequentially. Scheduler hints (parallelGroupId) exist but are not used for runtime parallelism.

## Target State
The orchestration loop detects independent effects and executes them concurrently. Multiple harness invocations run simultaneously. Results are posted as they complete.

## Dependencies
- [GAP-PAR-001](../parallelization/GAP-PAR-001.md) -- concurrent effect execution
- [GAP-PAR-009](../parallelization/GAP-PAR-009.md) -- execution strategies

## Key Files
| Component | Path |
|-----------|------|
| Process context | `packages/sdk/src/runtime/processContext.ts` |
| Task batching | `packages/sdk/src/tasks/batching.ts` |
| Harness invoker | `packages/sdk/src/harness/invoker.ts` |

## Recommendation
Phase 4 implementation. Modify babysit skill to execute parallel-grouped effects concurrently using multiple harness invocations.
