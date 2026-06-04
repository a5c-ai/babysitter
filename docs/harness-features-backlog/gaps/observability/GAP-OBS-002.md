# GAP-OBS-002: Phase Timeline Visualization

| Field | Value |
|-------|-------|
| Category | observability |
| Priority | Medium |
| Effort | M |
| Status | Partial |

## Description
Synthesize a phase timeline from journal events showing orchestration progression through planning, execution, verification, and completion phases.

## Current State
No embedded SDK dashboard exists yet. Understanding orchestration progression requires manual log analysis.

## Target State
Embedded SDK dashboard renders a timeline view showing phase transitions, duration per phase, key milestones, and current position in the orchestration lifecycle.

## Dependencies
- [GAP-OBS-001](../observability/GAP-OBS-001.md) -- health snapshot for phase context

## Key Files
| Component | Path |
|-----------|------|
| Embedded SDK dashboard (new) | `packages/sdk/src/dashboard/` |
| Journal storage | `packages/sdk/src/storage/` |

## Recommendation
Phase 3 implementation. Derive phase transitions from journal event patterns. Render as timeline in embedded SDK dashboard.
