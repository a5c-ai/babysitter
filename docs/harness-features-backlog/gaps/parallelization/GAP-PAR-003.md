# GAP-PAR-003: Multi-Harness Parallel Dispatch

| Field | Value |
|-------|-------|
| Category | parallelization |
| Priority | High |
| Effort | XL |
| Status | Partial |

## Description
Orchestrate multiple harness invocations working in parallel on related tasks, with persistent group identity across iterations and coordination between dispatched work. Reframed from CC agent swarms to babysitter multi-harness parallel dispatch.

## Current State
ctx.parallel.all() and ctx.parallel.map() provide one-shot parallel effect dispatch with deduplication. No persistent team identity across iterations, no inter-effect communication during execution, no fan-out/fan-in patterns with intermediate checkpoints.

## Target State
Named effect groups with persistent identity across iterations. Multiple harnesses working concurrently on related tasks. Coordinator process pattern for ongoing management. Fan-out/fan-in delegation with intermediate checkpoints.

## Dependencies
- [GAP-PAR-001](../parallelization/GAP-PAR-001.md) -- concurrent execution
- [GAP-PAR-002](../parallelization/GAP-PAR-002.md) -- async execution
- [GAP-HADAPT-001](../harness-adaptation/GAP-HADAPT-001.md) -- capability-based routing

## Key Files
| Component | Path |
|-----------|------|
| Task batching | `packages/sdk/src/tasks/batching.ts` |
| Harness adapters | `packages/sdk/src/harness/` |
| Process context | `packages/sdk/src/runtime/processContext.ts` |

## Recommendation
Phase 3-4 implementation. Phase 3: named effect groups with persistent identity. Phase 4: inter-effect messaging via journal events and coordinator process pattern.
