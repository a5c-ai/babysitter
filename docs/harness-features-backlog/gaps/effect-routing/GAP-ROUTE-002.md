# GAP-ROUTE-002: Effect Priority and Scheduling

| Field | Value |
|-------|-------|
| Category | effect-routing |
| Priority | Medium |
| Effort | M |
| Status | Missing |

## Description
Assign priorities to effects. Schedule high-priority effects first. Support preemption and deadline-based scheduling.

## Current State
Effects executed in dispatch order. No priority system.

## Target State
Effect priority levels (critical, high, normal, low). High-priority effects scheduled first. Deadline-based scheduling for time-sensitive effects. Priority visible in task:list output.

## Dependencies
- [GAP-PAR-009](../parallelization/GAP-PAR-009.md) -- execution strategies for priority-aware scheduling

## Key Files
| Component | Path |
|-----------|------|
| Task definitions | `packages/sdk/src/tasks/` |
| Scheduler hints | `packages/sdk/src/runtime/types.ts` |

## Recommendation
Phase 3 implementation. Add priority field to effect scheduler hints. Implement priority-aware scheduling in babysit skill.
