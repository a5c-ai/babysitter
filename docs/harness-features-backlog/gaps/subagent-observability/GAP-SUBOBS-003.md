# GAP-SUBOBS-003: Per-Subagent Token and Cost Tracking

| Field | Value |
|-------|-------|
| Category | subagent-observability |
| Priority | High |
| Effort | M |
| Status | Missing |

## Description
Track token usage and estimated cost per dispatched subagent effect. Aggregate at run and session level.

## Current State
tokens:stats tracks run-level tokens. No per-effect or per-subagent breakdown.

## Target State
Token usage and cost tracked per effect. Aggregated at run and session level. Visible in embedded SDK dashboard with per-effect cost breakdown. Cost anomaly detection for expensive effects.

## Dependencies
- [GAP-SUBOBS-001](../subagent-observability/GAP-SUBOBS-001.md) -- streaming output for token extraction

## Key Files
| Component | Path |
|-----------|------|
| Token stats | `packages/sdk/src/cli/` |
| Task definitions | `packages/sdk/src/tasks/` |
| Embedded SDK dashboard (new) | `packages/sdk/src/dashboard/` |

## Recommendation
Phase 2 implementation. Capture token counts from harness output per effect. Aggregate at run and session level. Display in embedded SDK dashboard.
