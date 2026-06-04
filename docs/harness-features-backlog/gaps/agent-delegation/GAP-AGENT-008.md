# GAP-AGENT-008: Harness Selection Policies

| Field | Value |
|-------|-------|
| Category | agent-delegation |
| Priority | High |
| Effort | M |
| Status | Missing |

## Description
Define policies for selecting which harness handles a given task based on capability requirements, cost constraints, and quality targets. Reframed from CC named capability profiles to babysitter harness selection policies.

## Current State
Tasks routed to single harness specified at run creation. Task execution hints (execution.harness, execution.model) exist but are not used for routing decisions.

## Target State
Harness selection policies that consider: task kind and capability requirements, model preference, cost constraints, harness availability and health. At least 4 profiles: full, read-only, plan-only, verify-only.

## Dependencies
- [GAP-HADAPT-001](../harness-adaptation/GAP-HADAPT-001.md) -- capability-based routing foundation

## Key Files
| Component | Path |
|-----------|------|
| Task definitions | `packages/sdk/src/tasks/` |
| Task registry | `packages/sdk/src/tasks/registry.ts` |
| Harness adapters | `packages/sdk/src/harness/` |

## Recommendation
Phase 2 implementation. Define harness selection policies in task registry. Match task requirements to harness capabilities. Select optimal harness per task.
