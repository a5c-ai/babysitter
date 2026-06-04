# GAP-ROUTE-001: Smart Effect Routing Engine

| Field | Value |
|-------|-------|
| Category | effect-routing |
| Priority | High |
| Effort | XL |
| Status | Missing |

## Description
Centralized routing engine that considers task kind, capabilities needed, model preference, cost, and harness health to select optimal execution target.

## Current State
All effects routed to single configured harness. No routing logic.

## Target State
Routing engine evaluates: task required capabilities, model preference, cost constraints, harness availability and health, historical performance. Selects optimal harness/model combination per effect.

## Dependencies
- [GAP-HADAPT-001](../harness-adaptation/GAP-HADAPT-001.md) -- capability declarations
- [GAP-HADAPT-003](../harness-adaptation/GAP-HADAPT-003.md) -- cost-based routing (optional enhancement, M6)
- [GAP-HADAPT-005](../harness-adaptation/GAP-HADAPT-005.md) -- health monitoring (optional enhancement, M6)

## Key Files
| Component | Path |
|-----------|------|
| Harness adapters | `packages/sdk/src/harness/` |
| Task definitions | `packages/sdk/src/tasks/` |
| Adapter registry | `packages/sdk/src/harness/registry.ts` |

## Recommendation
Phase 3 implementation. Build routing engine as central coordinator. Integrate capability matching, cost optimization, and health awareness.
