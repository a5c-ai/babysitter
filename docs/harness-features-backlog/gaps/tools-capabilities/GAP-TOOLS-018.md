# GAP-TOOLS-018: Structured Planning Phase in Process Definitions

| Field | Value |
|-------|-------|
| Category | tools-capabilities |
| Priority | High |
| Effort | M |
| Status | Partial |

## Description
Formalize a structured planning phase within process definitions where the orchestrator generates, validates, and commits to an execution plan before dispatching implementation effects. Currently `harness:plan` stops after Phase 1 but the plan structure is informal and not machine-readable.

## Current State
The `harness:plan` alias stops after the first phase of orchestration, implying a plan-then-execute model. However, the plan output is unstructured text. Process definitions in `gsd/` have planning phases but they produce free-form artifacts. There is no schema for plans, no plan validation, and no plan-to-effect compilation step.

## Target State
A `PlanSchema` type defining structured plans with: ordered steps, estimated effort per step, dependency graph between steps, resource requirements (harness capabilities, tools needed), risk assessment. A `ctx.plan()` intrinsic that produces a validated plan. Plan-to-effect compilation that generates the effect dispatch sequence from the plan. Plan approval via breakpoint before execution begins.

## Dependencies
- [GAP-PROC-004](../process-composition/GAP-PROC-004.md) -- parameter schemas for plan step typing

## Related Gaps
- [GAP-USER-012](../user-experience/GAP-USER-012.md) -- plan mode and verification UX (depends on this gap, not a prerequisite)

## Key Files
| Component | Path |
|-----------|------|
| Process definitions | `library/` |
| GSD phases | `library/gsd/` |
| Runtime | `packages/sdk/src/runtime/` |
| Harness create-run | `packages/sdk/src/cli/` |

## Recommendation
Phase 2-3 implementation. Define `PlanSchema` type. Add `ctx.plan()` intrinsic to `ProcessContext`. Implement plan validation and plan-to-effect compilation. Wire plan approval through breakpoint system.
