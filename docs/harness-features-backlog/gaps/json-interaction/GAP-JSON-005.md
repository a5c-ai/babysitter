# GAP-JSON-005: JSON Event Stream (SSE/WebSocket)

| Field | Value |
|-------|-------|
| Category | json-interaction |
| Priority | High |
| Effort | L |
| Status | Missing |

## Description
Real-time event streaming from runs via SSE or WebSocket. Enable live dashboards, external monitoring, and reactive UIs.

## Current State
No embedded SDK dashboard exists yet. No streaming event API.

## Target State
SSE or WebSocket endpoint for run events. Real-time journal event streaming. Subscriptions per run or per session. Enable external dashboards and monitoring tools to receive live updates.

## Dependencies
- [GAP-JSON-001](../json-interaction/GAP-JSON-001.md) -- JSON API foundation
- [GAP-REMOTE-008](../remote-integration/GAP-REMOTE-008.md) -- streaming protocol definition

## Key Files
| Component | Path |
|-----------|------|
| Journal storage | `packages/sdk/src/storage/` |
| MCP server | `packages/sdk/src/mcp/` |
| Embedded SDK dashboard (new) | `packages/sdk/src/dashboard/` |

## Recommendation
Phase 2 implementation. Add SSE endpoint to MCP server. Integrate with journal appendEvent for real-time streaming.
