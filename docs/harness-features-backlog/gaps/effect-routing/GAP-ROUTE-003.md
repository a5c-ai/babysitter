# GAP-ROUTE-003: Effect Result Caching and Deduplication

| Field | Value |
|-------|-------|
| Category | effect-routing |
| Priority | Medium |
| Effort | M |
| Status | Partial |

## Description
Cache effect results by invocation key. Skip re-execution for identical effects across runs or sessions.

## Current State
Replay deduplicates within a run via journal. No cross-run caching.

## Target State
Cross-run effect cache indexed by invocation key. Identical effects return cached results without re-execution. Cache invalidation based on input changes. Configurable cache TTL.

## Dependencies
- None

## Key Files
| Component | Path |
|-----------|------|
| Runtime replay | `packages/sdk/src/runtime/replay/` |
| Storage | `packages/sdk/src/storage/` |

## Recommendation
Phase 3 implementation. Add cross-run effect cache. Index by invocation key (SHA256 of processId:stepId:taskId). Configurable TTL.
