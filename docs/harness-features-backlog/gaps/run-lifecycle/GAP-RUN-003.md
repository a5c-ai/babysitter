# GAP-RUN-003: Run Forking and Branching

| Field | Value |
|-------|-------|
| Category | run-lifecycle |
| Priority | Medium |
| Effort | L |
| Status | Missing |

## Description
Fork a run at any point in its journal. Create branch runs that diverge from a common history.

## Current State
No forking. Must create new run and replay manually.

## Target State
run:fork creates new run from specific journal point. Fork inherits journal history up to fork point. Multiple forks coexist. Fork relationships tracked. Enables exploring alternative orchestration paths.

## Dependencies
- [GAP-STATE-006](../state-continuity/GAP-STATE-006.md) -- session rewind for history navigation

## Key Files
| Component | Path |
|-----------|------|
| Journal storage | `packages/sdk/src/storage/` |
| Replay engine | `packages/sdk/src/runtime/replay/createReplayEngine.ts` |
| State cache | `packages/sdk/src/runtime/replay/stateCache.ts` |

## Recommendation
Phase 3 implementation. Add run:fork command. Copy journal up to fork point. Create new run directory with forked history. Track fork relationships in metadata.
