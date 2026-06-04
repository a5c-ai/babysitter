# GAP-SUBOBS-002: Subagent Progress Tracking

| Field | Value |
|-------|-------|
| Category | subagent-observability |
| Priority | High |
| Effort | M |
| Status | Missing |

## Description
Track progress percentage, current step, and estimated completion for dispatched subagent tasks. Surface in embedded SDK dashboard.

## Current State
No progress tracking. Tasks are opaque until completion.

## Target State
Progress updates from subagents (percentage, current step, ETA). Progress visible in embedded SDK dashboard with progress bars. Estimated completion based on historical data.

## Dependencies
- [GAP-SUBOBS-001](../subagent-observability/GAP-SUBOBS-001.md) -- streaming output for progress extraction

## Key Files
| Component | Path |
|-----------|------|
| Harness invoker | `packages/sdk/src/harness/invoker.ts` |
| Embedded SDK dashboard (new) | `packages/sdk/src/dashboard/` |
| Task definitions | `packages/sdk/src/tasks/` |

## Recommendation
Phase 2 implementation. Define progress update protocol. Extract progress from harness output. Surface in embedded SDK dashboard.
