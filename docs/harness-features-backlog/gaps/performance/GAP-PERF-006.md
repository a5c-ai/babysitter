# GAP-PERF-006: Incremental Orchestration Streaming

| Field | Value |
|-------|-------|
| Category | performance |
| Priority | Medium |
| Effort | L |
| Status | Missing |

## Description
Stream orchestration progress incrementally to observers and dashboards during effect execution, rather than only reporting after each iteration completes.

## Current State
Progress is visible only after tool steps complete. No embedded SDK dashboard exists yet. No streaming protocol for live orchestration events.

## Target State
Journal events stream to observers in real-time as they are appended. Effect execution progress (started, 50%, complete) is visible mid-iteration. External consumers can subscribe to orchestration events.

## Dependencies
- [GAP-JSON-005](../json-interaction/GAP-JSON-005.md) -- JSON event stream infrastructure

## Key Files
| Component | Path |
|-----------|------|
| Embedded SDK dashboard (new) | `packages/sdk/src/dashboard/` |
| Journal storage | `packages/sdk/src/storage/` |
| MCP server | `packages/sdk/src/mcp/` |

## Recommendation
Phase 4 implementation. Integrate with journal appendEvent to emit stream events on writes. Add SSE endpoint to MCP server.
