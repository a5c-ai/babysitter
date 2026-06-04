# GAP-RUN-001: Run Comparison and Diffing

| Field | Value |
|-------|-------|
| Category | run-lifecycle |
| Priority | Medium |
| Effort | M |
| Status | Missing |

## Description
Compare two runs: input differences, effect divergence points, output deltas. Enable A/B testing of process changes.

## Current State
No run comparison. Must manually diff journal files.

## Target State
run:diff command comparing two runs. Shows: input differences, first divergence point in journals, effect outcome differences, output deltas. Enables A/B testing of process definition changes.

## Dependencies
- None

## Key Files
| Component | Path |
|-----------|------|
| Journal storage | `packages/sdk/src/storage/` |
| CLI commands | `packages/sdk/src/cli/` |

## Recommendation
Phase 3 implementation. Add run:diff command. Compare journals event-by-event. Highlight divergence points and outcome differences.
