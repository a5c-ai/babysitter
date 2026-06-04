# GAP-PROC-002: Process Nesting and Sub-Process Invocation

| Field | Value |
|-------|-------|
| Category | process-composition |
| Priority | High |
| Effort | L |
| Status | Missing |

## Description
Invoke a process from within another process as a first-class effect. Sub-processes inherit parent context.

## Current State
No sub-process effect. Must use ctx.task() with agent kind as workaround.

## Target State
ctx.subprocess() effect that invokes a child process. Child process inherits parent context. Results returned to parent as effect result. Child runs tracked in parent journal.

## Dependencies
- [GAP-AGENT-001](../agent-delegation/GAP-AGENT-001.md) -- sub-harness invocation for child execution

## Key Files
| Component | Path |
|-----------|------|
| Process context | `packages/sdk/src/runtime/processContext.ts` |
| Runtime | `packages/sdk/src/runtime/` |

## Recommendation
Phase 2 implementation. Add ctx.subprocess() as first-class effect. Create child run with parent context inheritance.
