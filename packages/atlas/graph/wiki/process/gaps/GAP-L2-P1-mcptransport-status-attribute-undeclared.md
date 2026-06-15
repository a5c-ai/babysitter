---
id: page:process-gaps-GAP-L2-P1-mcptransport-status-attribute-undeclared
nodeKind: Page
title: "GAP-L2-P1-mcptransport-status-attribute-undeclared"
slug: "process/gaps/GAP-L2-P1-mcptransport-status-attribute-undeclared"
articlePath: "wiki/process/gaps/GAP-L2-P1-mcptransport-status-attribute-undeclared.md"
documents: []
---
# GAP-L2-P1-mcptransport-status-attribute-undeclared

| Field | Value |
|---|---|
| id | gap:mcptransport-status-attribute-undeclared |
| title | MCPTransport.status / specVersion fields used in examples but not declared in NodeKind |
| level | 2 |
| priority | P1 |
| discoveredAt | 2026-04-28T00:00:00Z |
| source | grep MCPTransport in ontology-schema.yaml vs examples |
| status | closed |
| owner | tbd |

## Current state
`ontology-schema.yaml` defines `MCPTransport` with attributes: `id, displayName, kind, specUrl`. The example `streamable-http.yaml` uses **two extra fields**: `specVersion: "2025-03-26"` and `status: live`. These are not declared in the NodeKind. This breaks V-12.5 (NodeKind ↔ examples must be consistent).

## Desired state
Add `specVersion: string` and `status: enum<live,deprecated,community,draft>` to the `MCPTransport` NodeKind definition, OR remove them from the examples.

## Evidence
- C:/work/v6/graph/schema/ontology-schema.yaml lines 139-152
- C:/work/v6/graph/schema/examples/compute/mcp-transports/streamable-http.yaml

## Propagation status
- Level 2: open

## Propagation chain
- Level 2: 1 attribute addition each on NodeKind + transport.md update.

## Notes
Same root cause as GAP-L1-P2-mcp-stdio-vs-http-sse-deprecation but framed as Level 2 internal-consistency.

## Resolution (2026-04-28)
Closed. `MCPTransport` NodeKind in `ontology-schema.yaml` now declares `specVersion: string`, `specRevisions: list<string>`, `currentSpecRevision: string`, `streaming: enum<none,partial,full>`, and `status: enum<live,deprecated,community,draft>`. All four example YAMLs (stdio, streamable-http, http-sse, websocket) conform.
