# GAP-UX-010: Typed Effect Interaction Patterns

| Field | Value |
|-------|-------|
| Category | user-experience |
| Priority | Medium |
| Effort | M |
| Status | Partial |

## Description
Extend the interaction model beyond breakpoint approve/reject to support typed interaction patterns: choice selection, multi-select, file picker, parameter configuration forms, and confirmation dialogs. These interaction types should be available as effect intrinsics that harness adapters render appropriately for their UI surface.

## Current State
The interaction module (`packages/sdk/src/interaction/`) provides arrow-key selectors, multi-select, and free-text input for direct CLI use. The breakpoint system supports approve/reject with optional feedback, strategy routing, and the `option` field for single-choice. However, these rich interaction types are not available as orchestration effects -- they cannot be dispatched from process definitions and rendered by harness adapters.

## Target State
Typed interaction effect schemas: `ChoiceInteraction` (single select), `MultiChoiceInteraction` (multi-select), `TextInputInteraction` (with validation regex), `ConfirmInteraction` (yes/no with context), `FileSelectInteraction` (pick from workspace files), `FormInteraction` (structured parameter input). Each schema defines the interaction type, options, validation rules, and default values. Harness adapters implement renderers for each type. All interactions flow through the journal as effects.

## Dependencies
- [GAP-JSON-003](../json-interaction/GAP-JSON-003.md) -- JSON breakpoint API for programmatic interaction rendering

## Key Files
| Component | Path |
|-----------|------|
| Interaction module | `packages/sdk/src/interaction/` |
| Breakpoints | `packages/sdk/src/breakpoints/` |
| Process context | `packages/sdk/src/runtime/processContext.ts` |
| Harness adapters | `packages/sdk/src/harness/` |

## Recommendation
Phase 3 implementation. Define typed interaction schemas in `packages/sdk/src/interaction/types.ts`. Extend ProcessContext with `ctx.ask()` intrinsic. Implement interaction renderers in each harness adapter. Ensure journal tracking for replay.
