# GAP-UX-005: Structured Orchestration Status View

| Field | Value |
|-------|-------|
| Category | user-experience |
| Priority | High |
| Effort | M |
| Status | Partial |

## Description
Unified orchestration status showing phase, token usage, pending effects, health, and progress in a single view, replacing the current fragmented multi-command approach.

## Current State
Status fragmented across run:status (lifecycle state), tokens:stats (post-hoc tokens), harness:observe (separate dashboard). No single command provides unified orchestration visibility.

## Target State
run:status --rich combines run state, token stats, pending effects count, health indicators, and phase progression in one view. Works in --json mode for machine consumption.

## Dependencies
- [GAP-STATE-008](../state-continuity/GAP-STATE-008.md) -- health score for status view

## Key Files
| Component | Path |
|-----------|------|
| CLI commands | `packages/sdk/src/cli/` |
| Token stats | `packages/sdk/src/cli/` |
| Embedded SDK dashboard (new) | `packages/sdk/src/dashboard/` |

## Recommendation
Phase 1 implementation. Enhance run:status with --rich flag showing unified view. Include token usage, health score, phase, and pending summary.
