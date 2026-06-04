# GAP-SEC-003: Permission Request and Denial Hooks

| Field | Value |
|-------|-------|
| Category | security |
| Priority | High |
| Effort | L |
| Status | Partial |

## Description
Typed permission hooks that distinguish between different kinds of human interaction: clarification requests, security approvals, intervention alerts, and notifications. Different interaction types get different UX flows.

## Current State
All human interaction flows through the same breakpoint mechanism. A breakpoint for "confirm destructive action" looks the same as one for "please clarify requirements." The interaction module provides input widgets but not semantic interaction types.

## Target State
InteractionKind enum: clarification, approval, intervention, notification, handoff. Each kind routes through different UX flows with appropriate urgency and context. Permission denied events logged for audit.

## Dependencies
- [GAP-SEC-001](../security/GAP-SEC-001.md) -- governance policy for permission evaluation

## Key Files
| Component | Path |
|-----------|------|
| Breakpoint types | `packages/sdk/src/breakpoints/types.ts` |
| Interaction module | `packages/sdk/src/interaction/` |

## Recommendation
Phase 2 implementation. Introduce InteractionKind to the breakpoint system. Route different kinds through different UX flows. Backward compatible with existing breakpoints.
