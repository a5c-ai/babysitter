# GAP-STATE-008: Run Health Model

| Field | Value |
|-------|-------|
| Category | state-continuity |
| Priority | High |
| Effort | M |
| Status | Missing |

## Description
Continuous health scoring for runs based on journal analysis: pending effect age, retry churn, no-op iterations, progress rate. Enables proactive health monitoring and automated intervention.

## Current State
No health scoring. harness:doctor diagnoses individual runs post-hoc but does not maintain continuous health model. Health-relevant signals exist but are not aggregated.

## Target State
RunHealthScore computed from journal: pending age score, retry churn score, progress score, no-op iteration detection. Surfaced in run:status and embedded SDK dashboard. Threshold-based warnings.

## Dependencies
- None (foundation gap)

## Key Files
| Component | Path |
|-----------|------|
| Journal storage | `packages/sdk/src/storage/` |
| Orchestrate iteration | `packages/sdk/src/runtime/orchestrateIteration.ts` |
| Hook dispatcher | `packages/sdk/src/hooks/dispatcher.ts` |

## Recommendation
Phase 1 implementation. Define RunHealthScore type. Compute from journal analysis on every run:status call. Surface in harness:doctor with actionable recommendations.
