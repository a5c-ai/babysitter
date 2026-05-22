# GAP-TOOLS-023: Multi-Step Workflow Composition Within Effects

| Field | Value |
|-------|-------|
| Category | tools-capabilities |
| Priority | High |
| Effort | L |
| Status | Partial |

## Description
Enable composition of multi-step workflows within a single effect, where each step can be a different task kind with conditional branching, retry logic, and data passing between steps. Extends beyond linear process definitions to support complex orchestration patterns within effects.

## Current State
Process definitions compose effects sequentially or in parallel via `ctx.task()`, `ctx.parallel.all()`, and `ctx.parallel.map()`. However, individual effects are atomic -- there is no way to define a multi-step workflow within an effect that includes conditionals, retries, or step-to-step data transformation. Process composition gaps (GAP-PROC-001, GAP-PROC-002) cover chaining and nesting of processes but not intra-effect workflows.

## Target State
A `ctx.workflow()` intrinsic that accepts a workflow definition with: ordered steps with named outputs, conditional branching (if step A fails, run step B), configurable retry policies per step, data transformation between steps, timeout per step and for the overall workflow. Workflow execution is deterministic and replayable via the journal.

## Dependencies
- [GAP-PROC-001](../process-composition/GAP-PROC-001.md) -- process chaining for inter-process workflows
- [GAP-PROC-002](../process-composition/GAP-PROC-002.md) -- process nesting for hierarchical workflows

## Key Files
| Component | Path |
|-----------|------|
| Runtime | `packages/sdk/src/runtime/` |
| Process context | `packages/sdk/src/runtime/processContext.ts` |
| Task definitions | `packages/sdk/src/tasks/` |
| Replay engine | `packages/sdk/src/runtime/replay/` |

## Recommendation
Phase 3 implementation. Define `WorkflowDefinition` type with steps, branches, and retry policies. Add `ctx.workflow()` to `ProcessContext`. Ensure workflow steps map to individual journal events for replayability.
