# GAP-HADAPT-003: Cost-Based Routing Policies

| Field | Value |
|-------|-------|
| Category | harness-adaptation |
| Priority | High |
| Effort | L |
| Status | Missing |

## Description
Route tasks to cheapest capable harness/model combination. Set per-run or per-session cost budgets with automatic downgrade.

## Current State
No cost awareness in routing. All tasks go to configured harness regardless of cost.

## Target State
Cost-aware routing considers harness/model pricing. Per-run and per-session cost budgets. Automatic downgrade to cheaper model when budget nearing limit. Cost optimization suggestions.

## Dependencies
- [GAP-HADAPT-001](../harness-adaptation/GAP-HADAPT-001.md) -- capability routing foundation
- [GAP-SESSION-004](../session-management/GAP-SESSION-004.md) -- session-level cost budgets

## Key Files
| Component | Path |
|-----------|------|
| Harness adapters | `packages/sdk/src/harness/` |
| Config module | `packages/sdk/src/config/` |

## Recommendation
Phase 2 implementation. Define cost model per harness/model. Implement budget tracking. Auto-downgrade when budget threshold reached.
