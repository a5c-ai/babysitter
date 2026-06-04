# GAP-HADAPT-004: Harness Fallback Chains

| Field | Value |
|-------|-------|
| Category | harness-adaptation |
| Priority | High |
| Effort | M |
| Status | Missing |

## Description
Define fallback harness sequences. If primary harness fails or is unavailable, automatically try next in chain.

## Current State
Single harness per run. Failure = run failure. No fallback.

## Target State
Configurable fallback chains per task kind. If primary harness fails, retry with next harness in chain. Fallback configured at run, session, or global level.

## Dependencies
- [GAP-HADAPT-001](../harness-adaptation/GAP-HADAPT-001.md) -- capability routing for fallback selection
- [GAP-HADAPT-005](../harness-adaptation/GAP-HADAPT-005.md) -- health monitoring for failure detection

## Key Files
| Component | Path |
|-----------|------|
| Harness invoker | `packages/sdk/src/harness/invoker.ts` |
| Adapter registry | `packages/sdk/src/harness/registry.ts` |

## Recommendation
Phase 2 implementation. Define fallback chain configuration. Implement retry with next harness on failure. Log fallback decisions.
