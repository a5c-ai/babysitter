# GAP-REMOTE-003: Remote Sessions (WebSocket)

| Field | Value |
|-------|-------|
| Category | remote-integration |
| Priority | High |
| Effort | XL |
| Status | Missing |

## Description
Remote session support via WebSocket transport, enabling cloud-hosted orchestration, shared team sessions, and secure remote execution environments.

## Current State
All execution is local. invokeHarness() spawns local CLI processes. MCP server uses stdio transport, not network transport.

## Target State
WebSocket transport for MCP server. Session multiplexing for concurrent remote users. Authentication and authorization. Run directory synchronization for remote execution.

## Dependencies
- [GAP-REMOTE-007](../remote-integration/GAP-REMOTE-007.md) -- host contract layer for structured API
- [GAP-JSON-005](../json-interaction/GAP-JSON-005.md) -- event streaming for remote visibility

## Key Files
| Component | Path |
|-----------|------|
| MCP server entry | `packages/sdk/src/cli/mcpServeEntry.ts` |
| MCP handlers | `packages/sdk/src/mcp/` |

## Recommendation
Phase 5 implementation. Add WebSocket transport to MCP server. Implement session multiplexing and authentication.
