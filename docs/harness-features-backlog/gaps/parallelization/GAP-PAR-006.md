# GAP-PAR-006: Streaming Parallelism

| Field | Value |
|-------|-------|
| Category | parallelization |
| Priority | Medium |
| Effort | M |
| Status | Partial |

## Description
Enable overlapped execution where model output streams while tools execute, reducing total iteration time by overlapping I/O-bound and compute-bound phases.

## Current State
invokeHarness() waits for completion. Pi subscribe() enables event streaming but not overlapped execution. Each phase (prompt, execute, respond) runs sequentially.

## Target State
Tool execution overlaps with result streaming. Model can begin processing results while remaining tools complete. Pipeline parallelism between orchestration phases.

## Dependencies
- [GAP-PERF-004](../performance/GAP-PERF-004.md) -- streaming message rendering
- [GAP-PAR-001](../parallelization/GAP-PAR-001.md) -- concurrent execution

## Key Files
| Component | Path |
|-----------|------|
| Harness invoker | `packages/sdk/src/harness/invoker.ts` |
| Pi session wrapper | `packages/sdk/src/harness/piWrapper.ts` |

## Recommendation
Phase 3 implementation. Enable pipeline parallelism between execution phases. Leverage Pi event streaming for overlapped processing.
