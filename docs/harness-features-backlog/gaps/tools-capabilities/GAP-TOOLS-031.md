# GAP-TOOLS-031: MCP Resource Browsing and Reading

| Field | Value |
|-------|-------|
| Category | tools-capabilities |
| Priority | Medium |
| Effort | M |
| Status | Missing |

## Description
Browse and read resources from connected MCP servers. CC has `ListMcpResourcesTool`
and `ReadMcpResourceTool` for accessing MCP resources (files, database records,
API responses, etc. exposed by MCP servers).

## Current State
Babysitter's `mcp:serve` exposes babysitter's own resources. But there is no MCP
client capability to LIST or READ resources from external MCP servers. The agentic
tool set has no MCP resource tools.

## Target State
Two agentic tools:
- `mcp_list_resources`: List available resources from a connected MCP server
- `mcp_read_resource`: Read a specific resource by URI

Resources accessible from within Pi sessions and orchestrated tasks. Enables
processes to read external data (documentation, database records, API state)
during execution.

## Dependencies
- [GAP-TOOLS-025](GAP-TOOLS-025.md) -- MCP client capability (tool invocation)
- [GAP-MCPC-004](../mcp-channels/GAP-MCPC-004.md) -- MCP server connection management

## Key Files
| Component | Path |
|-----------|------|
| Agentic tools | `packages/sdk/src/harness/agenticTools.ts` |
| MCP module | `packages/sdk/src/mcp/` |

## Recommendation
Phase 3. Implement alongside MCP client capability. Resource browsing is less
critical than tool invocation but enables richer data access patterns.
