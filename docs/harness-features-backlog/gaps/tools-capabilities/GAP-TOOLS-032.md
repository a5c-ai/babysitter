# GAP-TOOLS-032: MCP Authentication

| Field | Value |
|-------|-------|
| Category | tools-capabilities |
| Priority | Medium |
| Effort | L |
| Status | Missing |

## Description
OAuth and authentication flows for MCP servers that require auth (Slack, Gmail,
Google Calendar, Hugging Face, Similarweb, etc.). CC has `McpAuthTool` and
OAuth port management (`src/services/mcp/auth.ts`, `oauthPort.ts`).

## Current State
Babysitter's MCP server (`mcp:serve`) uses stdio transport with no auth.
No MCP client auth. No OAuth flow support. Cannot connect to MCP servers
that require authentication.

## Target State
- OAuth flow support for MCP server connections
- Token storage and refresh
- `mcp:auth <server>` CLI command for interactive auth
- Headless auth support for CI/CD (token injection via env vars)
- Auth state persisted in `~/.a5c/mcp-auth/`

## Dependencies
- [GAP-TOOLS-025](GAP-TOOLS-025.md) -- MCP client capability
- [GAP-MCPC-004](../mcp-channels/GAP-MCPC-004.md) -- MCP server management

## Key Files
| Component | Path |
|-----------|------|
| MCP module | `packages/sdk/src/mcp/` |
| CC MCP auth | `src/services/mcp/auth.ts` |
| CC OAuth port | `src/services/mcp/oauthPort.ts` |

## Recommendation
Phase 3. Needed for Slack/Gmail/Calendar MCP integrations. Implement OAuth
code flow with PKCE. Store tokens encrypted in global state dir.
