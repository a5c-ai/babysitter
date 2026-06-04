# GAP-SEC-006: OAuth Integration

| Field | Value |
|-------|-------|
| Category | security |
| Priority | Medium |
| Effort | L |
| Status | Missing |

## Description
OAuth flow for authenticating with external services (MCP servers, APIs, SaaS integrations) during orchestration, enabling secure credential management.

## Current State
No OAuth in harness. Harness delegates auth to host CLI. External service credentials managed ad-hoc.

## Target State
OAuth flow for MCP server authentication. Secure credential storage with scoped access. Token refresh lifecycle management. Credential sharing across runs within a session.

## Dependencies
- [GAP-SEC-001](../security/GAP-SEC-001.md) -- governance policy for credential access control

## Key Files
| Component | Path |
|-----------|------|
| MCP server | `packages/sdk/src/mcp/` |
| Config module | `packages/sdk/src/config/` |

## Recommendation
Phase 4 implementation. Add OAuth client library. Integrate with MCP authentication. Store tokens securely in global state directory.
