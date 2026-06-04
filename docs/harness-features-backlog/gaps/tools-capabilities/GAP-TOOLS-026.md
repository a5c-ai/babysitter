# GAP-TOOLS-026: Structured User Interaction from Within Effects

| Field | Value |
|-------|-------|
| Category | tools-capabilities |
| Priority | Medium |
| Effort | M |
| Status | Partial |

## Description
Enable richer user interaction patterns from within orchestrated effects beyond the binary approve/reject model of breakpoints. Process definitions need to ask structured questions (multiple choice, free text input, file selection, parameter configuration) and receive typed responses during execution.

## Current State
The breakpoint system (`ctx.breakpoint()`) provides approval gates with optional feedback text, strategy routing, and auto-approval rules. The interaction module (`packages/sdk/src/interaction/`) has arrow-key selectors, multi-select, and free-text input for CLI use. However, these are not available as effect intrinsics -- process definitions cannot dispatch structured questions as effects that harnesses render and return typed answers for.

## Target State
A `ctx.ask()` intrinsic that dispatches structured interaction effects with typed schemas: choice (single select from options), multiChoice (multi-select), freeText (with validation), confirm (yes/no with context), fileSelect (pick from file list), parameterForm (fill structured parameters). Interaction effects go through the journal like other effects. Harness adapters render interactions appropriately for their UI surface.

## Dependencies
- [GAP-UX-010](../user-experience/GAP-UX-010.md) -- typed effect interaction patterns
- [GAP-JSON-003](../json-interaction/GAP-JSON-003.md) -- JSON breakpoint API for programmatic interaction

## Key Files
| Component | Path |
|-----------|------|
| Interaction module | `packages/sdk/src/interaction/` |
| Breakpoints | `packages/sdk/src/breakpoints/` |
| Process context | `packages/sdk/src/runtime/processContext.ts` |
| Task definitions | `packages/sdk/src/tasks/` |

## Recommendation
Phase 3 implementation. Define interaction effect schema types. Add `ctx.ask()` to ProcessContext. Implement interaction rendering in harness adapters. Ensure interaction effects are journaled and replayable.
