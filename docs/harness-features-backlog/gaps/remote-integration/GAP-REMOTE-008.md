# GAP-REMOTE-008: Streaming Orchestration Protocol

| Field | Value |
|-------|-------|
| Category | remote-integration |
| Priority | Medium |
| Effort | L |
| Status | Missing |

## Description
Real-time progress streaming from babysitter to external consumers via SSE or WebSocket, enabling live dashboards and reactive integrations.

## Current State
No streaming protocol. Host visibility is coarse -- results only available after iteration completion.

## Target State
StreamEvent types (progress, effect-requested, effect-resolved, log). SSE endpoint on MCP server. Latency under 500ms from journal write to stream delivery. run:stream CLI for live tailing.

## Dependencies
- [GAP-REMOTE-007](../remote-integration/GAP-REMOTE-007.md) -- host contract for structured API

## Key Files
| Component | Path |
|-----------|------|
| MCP server | `packages/sdk/src/mcp/` |
| Journal storage | `packages/sdk/src/storage/` |

## Recommendation
Phase 4 implementation. Define StreamEvent types. Add SSE endpoint to MCP server. Integrate with journal appendEvent.
