# GAP-USER-001: Operator Command Layer

| Field | Value |
|-------|-------|
| Category | user-experience |
| Priority | High |
| Effort | L |
| Status | Partial |

## Description
Operator command layer that surfaces key babysitter commands as in-session actions during breakpoint interactions, enabling operators to inspect status, modify configuration, and manage effects without leaving the orchestration flow.

## Current State
50+ babysitter CLI commands are terminal-only. During orchestration, the operator interacts only through breakpoints (no embedded SDK dashboard exists yet).

## Target State
Key commands (run:status, task:list, tokens:stats, run:events) surfaceable during breakpoint interactions. Operators can inspect and act without breaking orchestration flow.

## Dependencies
- [GAP-UX-005](../user-experience/GAP-UX-005.md) -- structured status view for in-session display

## Key Files
| Component | Path |
|-----------|------|
| CLI commands | `packages/sdk/src/cli/` |
| Breakpoint types | `packages/sdk/src/breakpoints/types.ts` |
| Interaction module | `packages/sdk/src/interaction/` |

## Recommendation
Phase 2 implementation. Create operator command layer that wraps key CLI commands for in-session invocation during breakpoint interactions.
