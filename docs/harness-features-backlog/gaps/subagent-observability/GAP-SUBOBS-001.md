# GAP-SUBOBS-001: Streaming Output Capture from Invoked Harnesses

| Field | Value |
|-------|-------|
| Category | subagent-observability |
| Priority | Critical |
| Effort | L |
| Status | Missing |

## Description
Capture and stream stdout/stderr from spawned harness CLIs in real-time during effect execution. Enable live progress visibility for operators.

## Current State
CLI-based `invokeHarness()` captures output only after process exits. Pi adapter supports streaming via `PiSessionHandle.subscribe()`, but this is Pi-specific and not generalized across harnesses. No unified streaming output capture.

## Target State
Real-time stdout/stderr streaming from spawned harness processes. Stream events visible in embedded SDK dashboard. Progress updates captured mid-execution.

## Dependencies
- None

## Key Files
| Component | Path |
|-----------|------|
| Harness invoker | `packages/sdk/src/harness/invoker.ts` |
| Embedded SDK dashboard (new) | `packages/sdk/src/dashboard/` |

## Recommendation
Phase 1 implementation. Pipe stdout/stderr from child processes in invokeHarness(). Stream events to embedded SDK dashboard via journal or direct channel.
