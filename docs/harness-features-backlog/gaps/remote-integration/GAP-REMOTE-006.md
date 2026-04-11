# GAP-REMOTE-006: MCP Client Integration

| Field | Value |
|-------|-------|
| Category | remote-integration |
| Priority | Medium |
| Effort | L |
| Status | Partial |

## Description
MCP client capability so babysitter can consume external MCP servers, accessing their tools and resources as part of orchestration.

## Current State
mcp:serve provides babysitter as MCP server. No MCP client. Cannot consume external MCP servers.

## Target State
MCP client with stdio and HTTP transport. mcp:connect registers MCP server endpoints. MCP server tools exposed as agentic tools via dynamic registration. MCP resources accessible via CLI.

## Dependencies
- [GAP-SEC-006](../security/GAP-SEC-006.md) -- OAuth for MCP authentication

## Key Files
| Component | Path |
|-----------|------|
| MCP server | `packages/sdk/src/mcp/` |
| Agentic tools | `packages/sdk/src/harness/agenticTools.ts` |

## Recommendation
Phase 4 implementation. Create MCP client module. Register external MCP server tools as agentic tools. Support resource listing and reading.
