# GAP-MCPC-004: MCP Server Management UI and Connection Lifecycle

| Field | Value |
|-------|-------|
| Category | mcp-channels |
| Priority | Medium |
| Effort | M |
| Status | Missing |

## Description
Manage MCP server connections with lifecycle control, health monitoring,
approval workflows, and a management UI.

## CC Implementation

CC has extensive MCP server management:
- `MCPConnectionManager.tsx` -- manages all MCP server connections with
  lifecycle (connect, disconnect, reconnect, health check)
- `MCPSettings.tsx` -- settings UI for MCP servers
- `MCPListPanel.tsx` -- list of connected servers with status
- `MCPToolListView.tsx` -- browse tools from connected servers
- `MCPToolDetailView.tsx` -- tool detail with parameter schema
- `MCPAgentServerMenu.tsx` -- server menu for agent context
- `MCPRemoteServerMenu.tsx` -- remote server configuration
- `MCPStdioServerMenu.tsx` -- stdio transport configuration
- `MCPReconnect.tsx` -- reconnection UI
- `MCPServerApprovalDialog.tsx` -- approve new server connections
- `MCPServerMultiselectDialog.tsx` -- select which servers to enable
- `McpParsingWarnings.tsx` -- parsing error display
- `useMcpConnectivityStatus.tsx` -- connection health hook

## Current State
Babysitter's `mcp:serve` starts babysitter AS an MCP server. No MCP client
connection management. No server lifecycle. No health monitoring. No management
UI.

## Target State
A `mcp:connect` command to add MCP server connections. Connection manager with:
- Startup/shutdown lifecycle per server
- Health monitoring with reconnection
- Server approval workflow (first-connect requires approval)
- Tool/resource browsing per connected server
- Integration with embedded SDK dashboard for connection status

## Dependencies
- [GAP-TOOLS-025](../tools-capabilities/GAP-TOOLS-025.md) -- MCP client capability
- [GAP-MCPC-001](GAP-MCPC-001.md) -- channel support

## Key Files
| Component | Path |
|-----------|------|
| Babysitter MCP module | `packages/sdk/src/mcp/` |
| CC MCP connection mgr | `src/services/mcp/MCPConnectionManager.tsx` |
| CC MCP config | `src/services/mcp/config.ts` |
| CC MCP components | `src/components/mcp/` (10 files) |

## Recommendation
Phase 3. Build on the MCP client from GAP-TOOLS-025. Add connection lifecycle
management. UI can initially be CLI-based, then migrate to Ink components.
