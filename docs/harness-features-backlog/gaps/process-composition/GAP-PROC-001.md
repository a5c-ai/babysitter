# GAP-PROC-001: Process Chaining and Pipelines

| Field | Value |
|-------|-------|
| Category | process-composition |
| Priority | High |
| Effort | M |
| Status | Missing |

## Description
Chain processes sequentially where output of one becomes input of next. Define reusable pipelines.

## Current State
Processes are standalone. Chaining requires manual harness:call sequences.

## Target State
Pipeline definitions chain processes. Output of process N becomes input of process N+1. Pipelines reusable and parameterized. Pipeline execution tracked as a single session.

## Dependencies
- [GAP-PROC-004](../process-composition/GAP-PROC-004.md) -- parameter schemas for pipeline stage validation

## Key Files
| Component | Path |
|-----------|------|
| Process context | `packages/sdk/src/runtime/processContext.ts` |
| CLI commands | `packages/sdk/src/cli/` |
| Process definitions | `.a5c/processes/` |

## Recommendation
Phase 2 implementation. Define pipeline schema. Implement pipeline:run command that chains processes with output-to-input mapping.
