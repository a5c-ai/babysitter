---
id: page:process-gaps-GAP-L1-P1-mcp-oauth-resource-server
nodeKind: Page
title: "GAP-L1-P1-mcp-oauth-resource-server"
slug: "process/gaps/GAP-L1-P1-mcp-oauth-resource-server"
articlePath: "wiki/process/gaps/GAP-L1-P1-mcp-oauth-resource-server.md"
documents: []
---
# GAP-L1-P1-mcp-oauth-resource-server

| Field | Value |
|---|---|
| id | gap:mcp-oauth-resource-server |
| title | MCP OAuth Resource Server classification + RFC 8707 Resource Indicators not modeled |
| level | 1 |
| priority | P1 |
| discoveredAt | 2026-04-28T00:00:00Z |
| source | https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization |
| status | closed |
| owner | tbd |

## Current state
`Provider.authMethods` enumerates `api-key,oauth,browser-login,service-account,iam,device-code`. `ToolServer` has no auth attribute at all. The 2025-06-18 MCP revision classifies MCP servers as **OAuth Resource Servers** (RFC 6749 §1.4) and requires clients to implement Resource Indicators (RFC 8707) to prevent token-theft attacks. The schema cannot express any of this.

## Desired state
- Add `ToolServer.authProfile` attribute with shape `{ kind: enum<none,bearer,oauth-resource-server,custom>, protectedResourceMetadataUrl?: url, authorizationServerUrl?: url, requiresResourceIndicators: bool }`.
- New NodeKind `AuthorizationServer` with `endpoints`, `discoveryUrl`, `signingKeySource`.
- Edge `ToolServer protected_by AuthorizationServer`.
- Coverage-checklist `Unified auth envelope across providers` OpenQuestion can be partially resolved by referencing this model.

## Evidence
- https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization
- https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices
- RFC 8707 (Resource Indicators)

## Propagation status
- Level 1: open
- Level 2: not-started — `secrets-interface` and `identity-interface` cross-refs need updating

## Propagation chain
- Level 1: NodeKind, edge, attribute extension.
- Level 2: links to ExtensionInterface `iface:identity-interface` and `iface:secrets-interface` documentation.

## Notes
Security gap: schema cannot represent the modern MCP auth model that real servers now require.

## Resolution (2026-04-28)
Closed (capability-level). `capability:mcp-oauth-resource-server` and `capability:mcp-protocol-version-header` capture the 2025-06-18 auth surface. Full `AuthorizationServer` NodeKind + `protected_by` edge remain a future enhancement tracked separately if needed; the capability binding plus `claude-code-mcp-oauth-resource-server` CapabilitySupport entry is sufficient for the catalog query patterns we have today.
