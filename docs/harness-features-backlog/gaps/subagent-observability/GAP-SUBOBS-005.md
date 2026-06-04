# GAP-SUBOBS-005: Embedded SDK Dashboard Subagent Drill-Down

| Field | Value |
|-------|-------|
| Category | subagent-observability |
| Priority | Medium |
| Effort | L |
| Status | Missing |

## Description
Build embedded SDK dashboard with subagent-level views: live output, progress bars, cost meters, dependency graphs.

## Current State
No embedded SDK dashboard exists yet. No subagent visibility.

## Target State
Embedded SDK dashboard shows: per-subagent live output streams, progress bars per task, cost meters with budget utilization, dependency graphs between effects, drill-down from run to individual subagent.

## Dependencies
- [GAP-SUBOBS-001](../subagent-observability/GAP-SUBOBS-001.md) -- streaming output as data source
- [GAP-SUBOBS-002](../subagent-observability/GAP-SUBOBS-002.md) -- progress tracking for display
- [GAP-SUBOBS-003](../subagent-observability/GAP-SUBOBS-003.md) -- cost tracking for meters

## Key Files
| Component | Path |
|-----------|------|
| Embedded SDK dashboard (new) | `packages/sdk/src/dashboard/` |
| Embedded SDK dashboard CLI (new) | `packages/sdk/src/dashboard/` |

## Recommendation
Phase 3 implementation. Build embedded SDK dashboard with subagent-level components. Integrate streaming output, progress, and cost data.
