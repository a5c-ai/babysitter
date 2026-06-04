# GAP-PERF-004: Streaming Message Rendering

| Field | Value |
|-------|-------|
| Category | performance |
| Priority | High |
| Effort | L |
| Status | Missing |

## Description
Stream output from harness invocations in real-time during effect execution instead of waiting for completion, enabling live progress visibility.

## Current State
`invokeHarness()` waits for the child process to complete before returning results. No embedded SDK dashboard exists yet for real-time model output.

## Target State
Harness invocation output streams in real-time. Pi adapter leverages `PiSessionHandle.subscribe()` for event streaming. CLI harnesses stream stdout from child processes. Embedded SDK dashboard shows live output.

## Dependencies
- [GAP-SUBOBS-001](../subagent-observability/GAP-SUBOBS-001.md) -- streaming capture from invoked harnesses

## Key Files
| Component | Path |
|-----------|------|
| Harness invoker | `packages/sdk/src/harness/invoker.ts` |
| Pi session wrapper | `packages/sdk/src/harness/piWrapper.ts` |
| Embedded SDK dashboard (new) | `packages/sdk/src/dashboard/` |

## Recommendation
Phase 2 implementation. For Pi adapter, leverage `PiSessionHandle.subscribe()`. For CLI harnesses, pipe stdout/stderr from child processes in real-time.
