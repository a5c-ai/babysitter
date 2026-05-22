# GAP-SESSION-004: Session-Level Cost Tracking and Budgets

| Field | Value |
|-------|-------|
| Category | session-management |
| Priority | High |
| Effort | M |
| Status | Missing |

## Description
Track cumulative cost across all runs in a session. Set session budgets with alerts and auto-pause.

## Current State
Cost tracked per-run only. No session aggregation.

## Target State
Session-level cost aggregation across all runs. Configurable session budgets. Alerts at budget thresholds (50%, 80%, 100%). Auto-pause orchestration when budget exceeded.

## Dependencies
- [GAP-SESSION-001](../session-management/GAP-SESSION-001.md) -- session-to-run relationship for aggregation
- [GAP-SUBOBS-003](../subagent-observability/GAP-SUBOBS-003.md) -- per-effect cost data

## Key Files
| Component | Path |
|-----------|------|
| Session management | `packages/sdk/src/session/` |
| Token stats | `packages/sdk/src/cli/` |

## Recommendation
Phase 2 implementation. Aggregate run-level costs into session state. Define budget configuration. Implement threshold alerts and auto-pause.
