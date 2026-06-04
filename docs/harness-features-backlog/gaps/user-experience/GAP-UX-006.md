# GAP-UX-006: Pending Work Inspector

| Field | Value |
|-------|-------|
| Category | user-experience |
| Priority | High |
| Effort | M |
| Status | Partial |

## Description
Grouped and prioritized view of pending work, organizing effects by kind, priority, and age for operator decision-making.

## Current State
task:list --pending provides a flat list. The batching module groups effects for execution but does not surface grouped views to the operator.

## Target State
task:list --grouped organizes pending effects by kind (task, breakpoint, sleep), priority, and age. Counts per group. Works in --json mode for machine consumption.

## Dependencies
- None

## Key Files
| Component | Path |
|-----------|------|
| CLI commands | `packages/sdk/src/cli/` |
| Task batching | `packages/sdk/src/tasks/batching.ts` |

## Recommendation
Phase 1 implementation. Extend task:list with --grouped flag. Surface BatchedEffectSummary data in CLI output.
