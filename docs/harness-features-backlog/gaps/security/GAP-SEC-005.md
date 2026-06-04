# GAP-SEC-005: Approval Posture Model

| Field | Value |
|-------|-------|
| Category | security |
| Priority | High |
| Effort | M |
| Status | Partial |

## Description
Formalize approval postures per action category so that different types of operations have appropriate approval requirements. A destructive file operation should have a different posture than a read operation.

## Current State
The breakpoint system supports auto-approval rules with glob patterns, autoApproveAfterN, alwaysBreakOn profile tags. The pattern language is expressive but postures are not formalized by action type.

## Target State
Approval posture templates per action category (read, write, execute, destroy). Postures define: auto-approve threshold, escalation rules, required approver level. Integrated with governance policy engine.

## Dependencies
- [GAP-SEC-001](../security/GAP-SEC-001.md) -- governance policy for posture enforcement
- [GAP-SEC-003](../security/GAP-SEC-003.md) -- typed interactions for posture-aware UX

## Key Files
| Component | Path |
|-----------|------|
| Breakpoint patterns | `packages/sdk/src/breakpoints/patterns.ts` |
| Breakpoint evaluator | `packages/sdk/src/breakpoints/evaluator.ts` |

## Recommendation
Phase 2 implementation. Define approval posture templates per action category and wire into breakpoint evaluation.
