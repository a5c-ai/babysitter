---
id: page:process-gaps-GAP-L1-P2-mcp-stdio-vs-http-sse-deprecation
nodeKind: Page
title: "GAP-L1-P2-mcp-stdio-vs-http-sse-deprecation"
slug: "process/gaps/GAP-L1-P2-mcp-stdio-vs-http-sse-deprecation"
articlePath: "wiki/process/gaps/GAP-L1-P2-mcp-stdio-vs-http-sse-deprecation.md"
documents: []
---
# GAP-L1-P2-mcp-stdio-vs-http-sse-deprecation

| Field | Value |
|---|---|
| id | gap:mcp-stdio-vs-http-sse-deprecation |
| title | MCPTransport HTTP+SSE deprecation status not encoded; WebSocket "community-only" status not encoded |
| level | 1 |
| priority | P2 |
| discoveredAt | 2026-04-28T00:00:00Z |
| source | https://modelcontextprotocol.io/specification/2025-03-26/basic/transports |
| status | open |
| owner | tbd |

## Current state
`MCPTransport.kind: enum<stdio,streamable-http,sse,websocket>`. Coverage-checklist row says HTTP+SSE is "deprecated" and WebSocket is "community" / not-in-spec, but the schema has no `status` attribute on `MCPTransport`. Examples show `status: live` only for streamable-http, but the field isn't in the NodeKind definition (only in the example).

## Desired state
- Add `MCPTransport.status: enum<live,deprecated,community,draft>` formally to NodeKind.
- Update `http-sse.yaml` example with `status: deprecated`, `deprecatedSinceRevision: 2025-03-26`.
- Update `websocket.yaml` with `status: community`.

## Evidence
- C:/work/v6/graph/schema/examples/compute/mcp-transports/streamable-http.yaml (uses `status: live` field that isn't in the schema)
- https://modelcontextprotocol.io/specification/2025-03-26/basic/transports

## Propagation status
- Level 1: open
- Level 2: not-started — `02-node-kinds/transport.md` undocumented attribute

## Propagation chain
- Level 1: 1 attribute addition + 4 example status updates.
- Level 2: transport.md table grows by one row.

## Notes
Schema-vs-example drift: examples already use a field the NodeKind doesn't declare. Internal consistency bug.
