# GAP-AGENT-006: Cross-Run State Sharing

| Field | Value |
|-------|-------|
| Category | agent-delegation |
| Priority | High |
| Effort | L |
| Status | Missing |

## Description
Shared state between related runs (parent/child, coordinator/worker) for accumulated knowledge, shared context, and collaborative findings. Reframed from CC agent memory to babysitter cross-run state sharing.

## Current State
No shared memory between invocations. State is per-run only. Each sub-harness invocation starts with a fresh context.

## Target State
Shared state store accessible by related runs. Parent can seed child runs with accumulated context. Child results accumulate into shared state. Session-level state persists across runs.

## Dependencies
- [GAP-STATE-003](../state-continuity/GAP-STATE-003.md) -- session state persistence
- [GAP-SESSION-001](../session-management/GAP-SESSION-001.md) -- session-to-run relationship

## Key Files
| Component | Path |
|-----------|------|
| Session management | `packages/sdk/src/session/` |
| State cache | `packages/sdk/src/runtime/replay/stateCache.ts` |

## Recommendation
Phase 2 implementation. Define shared state store scoped to sessions. Allow parent runs to seed child context. Aggregate child results into session state.
