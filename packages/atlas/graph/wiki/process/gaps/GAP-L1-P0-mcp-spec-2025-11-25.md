---
id: page:process-gaps-GAP-L1-P0-mcp-spec-2025-11-25
nodeKind: Page
title: "GAP-L1-P0-mcp-spec-2025-11-25"
slug: "process/gaps/GAP-L1-P0-mcp-spec-2025-11-25"
articlePath: "wiki/process/gaps/GAP-L1-P0-mcp-spec-2025-11-25.md"
documents: []
---
# GAP-L1-P0-mcp-spec-2025-11-25

| Field | Value |
|---|---|
| id | gap:mcp-spec-2025-11-25 |
| title | MCP spec revision 2025-11-25 not modeled (latest revision is unknown to schema) |
| level | 1 |
| priority | P0 |
| discoveredAt | 2026-04-28T00:00:00Z |
| source | https://modelcontextprotocol.io/specification (lists 2025-11-25 schema as authoritative) |
| status | closed |
| owner | tbd |

## Current state
`schema/examples/compute/mcp-transports/streamable-http.yaml` records `specVersion: "2025-03-26"`. The `MCPTransport` NodeKind only carries `kind/specUrl/specVersion`. There is no enumeration of MCP spec revisions, and no notion of feature deltas across revisions (e.g. elicitation, structured tool output, resource links, OAuth Resource Server classification, removal of JSON-RPC batching, mandatory `MCP-Protocol-Version` header).

## Desired state
Schema models MCP spec revisions as first-class data:
- New NodeKind `MCPSpecRevision` with attributes `revisionDate (iso-date)`, `status (enum<live,deprecated,draft>)`, `successorOf (ref<MCPSpecRevision>)`.
- Edge `MCPTransport speaks_revision MCPSpecRevision` (N:N) carrying `since`, `until`.
- `MCPFeature` NodeKind enumerating `elicitation`, `structured-tool-output`, `resource-links`, `oauth-resource-server`, `protocol-version-header`, `jsonrpc-batching` (deprecated 2025-06-18), `_meta-field`, `completion-context`, `title-field`.
- Edge `MCPSpecRevision adds_feature / removes_feature MCPFeature`.
- Existing `streamable-http.yaml` example updated to reference both 2025-06-18 and 2025-11-25 revisions.

## Evidence
- https://modelcontextprotocol.io/specification (links to schema/2025-11-25/schema.ts)
- https://modelcontextprotocol.io/specification/2025-06-18/changelog (full 2025-03-26 → 2025-06-18 delta)
- C:/work/v6/graph/schema/examples/compute/mcp-transports/streamable-http.yaml

## Propagation status
- Level 1 (real-world vs graph): in-progress
- Level 2 (graph vs docs): not-started — `02-node-kinds/transport.md` and `coverage-checklist.md` rows must add `MCPSpecRevision` / `MCPFeature`
- Level 3 (qa vs docs): not-applicable
- Level 4–7: cascade once Level 1+2 land

## Propagation chain
- Level 1: add NodeKinds + edges to ontology-schema.yaml; add 4 example revision files (2024-11-05, 2025-03-26, 2025-06-18, 2025-11-25); add 9 feature example files.
- Level 2: update transport.md + 03-edge-kinds.md + coverage-checklist row "MCP-Transport (sibling concept; not a layer)"; resolves OpenQuestion `oq:industry-standard-cross-protocol-tool-call-streaming` partially.

## Notes
This is the single highest-impact L1 gap because MCP is the primary integration surface and the spec evolved twice since the catalog was authored.

## Resolution (2026-04-28)
Closed via lighter-weight modeling than originally proposed: instead of introducing `MCPSpecRevision` and `MCPFeature` NodeKinds, MCP spec evolution is captured as:
- `MCPTransport.specRevisions: list<string>` and `MCPTransport.currentSpecRevision: string` (declared in `ontology-schema.yaml`, documented in `02-node-kinds/transport.md`).
- Six new `Capability` entries representing the 2025-06-18 / 2025-11-25 deltas: `capability:mcp-elicitation`, `capability:mcp-structured-tool-output`, `capability:mcp-resource-links`, `capability:mcp-oauth-resource-server`, `capability:mcp-protocol-version-header`, `capability:mcp-no-jsonrpc-batching`.
- `CapabilitySupport` bindings record per-`AgentRuntimeImpl` support level (full/partial/none) with evidence sources.
- The transport YAML examples (`stdio.yaml`, `streamable-http.yaml`) list all four published revisions.

Propagation chain delivered:
- Level 1: `schema/ontology-schema.yaml` (MCPTransport attrs) + 6 capability YAMLs + 2 transport YAML updates + ~9 CapabilitySupport YAMLs (claude-code/cursor/opencode × elicitation/structured/resource-links).
- Level 2: `02-node-kinds/transport.md` rewritten with the spec-revision-history section.
- Level 3+: not applicable (qa skeletons inert).
