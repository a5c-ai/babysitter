# GAP-USER-006: Real-Time Cost Tracking

| Field | Value |
|-------|-------|
| Category | user-experience |
| Priority | High |
| Effort | M |
| Status | Partial |

## Description
Real-time cost tracking during active orchestration with per-model pricing, token breakdown, and cost threshold breakpoints for budget management.

## Current State
tokens:stats provides post-hoc analysis from run journals. No real-time cost visibility during active orchestration.

## Target State
Real-time cost accumulation from task results. Per-model pricing (configurable). Cost visible in run:status and embedded SDK dashboard. Cost threshold breakpoints auto-pause when budget exceeded.

## Dependencies
- [GAP-SUBOBS-003](../subagent-observability/GAP-SUBOBS-003.md) -- per-subagent token tracking
- [GAP-SESSION-004](../session-management/GAP-SESSION-004.md) -- session-level cost budgets

## Key Files
| Component | Path |
|-----------|------|
| Token stats | `packages/sdk/src/cli/` |
| Embedded SDK dashboard (new) | `packages/sdk/src/dashboard/` |

## Recommendation
Phase 2 implementation. Accumulate token counts from task results. Apply per-model pricing. Surface in run:status and embedded SDK dashboard. Add cost threshold breakpoints.
