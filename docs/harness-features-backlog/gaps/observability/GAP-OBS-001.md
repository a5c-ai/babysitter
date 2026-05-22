# GAP-OBS-001: Run Health Snapshot

| Field | Value |
|-------|-------|
| Category | observability |
| Priority | High |
| Effort | M |
| Status | Partial |

## Description
Transform harness:doctor from a forensic diagnostic tool to a proactive health snapshot with synthesized health scores, top issues, and actionable recommendations.

## Current State
harness:doctor checks journal integrity, state cache validity, effect status, lock status, and session state. Output is forensic -- raw data for manual interpretation rather than synthesized health with recommendations.

## Target State
Overall health score (0-100), top 3 issues with severity and recommended actions, health trend from recent iterations. Integration with RunHealthScore for continuous monitoring.

## Dependencies
- [GAP-STATE-008](../state-continuity/GAP-STATE-008.md) -- run health model for scoring dimensions

## Key Files
| Component | Path |
|-----------|------|
| Logging module | `packages/sdk/src/logging/` |
| Embedded SDK dashboard (new) | `packages/sdk/src/dashboard/` |
| Embedded SDK dashboard CLI (new) | `packages/sdk/src/dashboard/` |

## Recommendation
Phase 1 implementation. Enhance harness:doctor to compute health score, surface top issues with actionable recommendations, and show health trend.
