# GAP-AGENT-003: Process Orchestration with Effect Routing

| Field | Value |
|-------|-------|
| Category | agent-delegation |
| Priority | High |
| Effort | XL |
| Status | Partial |

## Description
A coordinator process pattern that orchestrates multiple worker harnesses, routing effects to appropriate harnesses based on task requirements. Reframed from CC coordinator mode to babysitter process-level orchestration.

## Current State
Orchestration via process definitions exists. Single harness per run. No coordinator process pattern that dynamically routes work to different harnesses based on capabilities.

## Target State
Coordinator process template in process library. Fan-out/fan-in delegation pattern with dynamic harness selection. Progress aggregation from workers. Coordinator sees status of all delegated work.

## Dependencies
- [GAP-AGENT-001](../agent-delegation/GAP-AGENT-001.md) -- sub-harness invocation
- [GAP-HADAPT-001](../harness-adaptation/GAP-HADAPT-001.md) -- capability-based routing
- [GAP-ROUTE-001](../effect-routing/GAP-ROUTE-001.md) -- smart routing engine

## Key Files
| Component | Path |
|-----------|------|
| Process context | `packages/sdk/src/runtime/processContext.ts` |
| Task definitions | `packages/sdk/src/tasks/` |
| Harness adapters | `packages/sdk/src/harness/` |

## Recommendation
Phase 3-4 implementation. Create coordinator process template. Implement fan-out/fan-in with progress aggregation.
