# GAP-STATE-006: Session Rewind and History

| Field | Value |
|-------|-------|
| Category | state-continuity |
| Priority | Medium |
| Effort | L |
| Status | Missing |

## Description
Navigate session history and rewind to previous states by forking runs at specific journal points, enabling exploration of alternative orchestration paths.

## Current State
Journal is append-only. No rewind capability. To explore alternatives, must create a new run from scratch.

## Target State
run:rewind creates a new run forked from a specific journal point. Session history browsable. Multiple alternative branches coexist. Leverages event-sourced journal for deterministic branching.

## Dependencies
- [GAP-STATE-003](../state-continuity/GAP-STATE-003.md) -- session state persistence for rewind snapshots

## Key Files
| Component | Path |
|-----------|------|
| Journal storage | `packages/sdk/src/storage/` |
| Replay engine | `packages/sdk/src/runtime/replay/createReplayEngine.ts` |

## Recommendation
Phase 4 implementation. Add run:rewind that truncates journal at fork point and creates new run. Enable session history browsing.
