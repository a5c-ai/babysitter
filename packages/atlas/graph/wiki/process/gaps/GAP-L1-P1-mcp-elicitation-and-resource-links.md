---
id: page:process-gaps-GAP-L1-P1-mcp-elicitation-and-resource-links
nodeKind: Page
title: "GAP-L1-P1-mcp-elicitation-and-resource-links"
slug: "process/gaps/GAP-L1-P1-mcp-elicitation-and-resource-links"
articlePath: "wiki/process/gaps/GAP-L1-P1-mcp-elicitation-and-resource-links.md"
documents: []
---
# GAP-L1-P1-mcp-elicitation-and-resource-links

| Field | Value |
|---|---|
| id | gap:mcp-elicitation-and-resource-links |
| title | MCP elicitation, structured tool output, and resource links not modeled in tool/server schema |
| level | 1 |
| priority | P1 |
| discoveredAt | 2026-04-28T00:00:00Z |
| source | https://modelcontextprotocol.io/specification/2025-06-18/changelog |
| status | closed |
| owner | tbd |

## Current state
`ToolDescriptor` and `ToolServer` NodeKinds describe a tool's name, schema, and protocol but do not represent:
- **Elicitation** — server-initiated requests for additional information from the user (analogous to a breakpoint, but inside MCP).
- **Structured tool output** — tool results carrying typed structured content alongside text.
- **Resource links** — tool results containing pointers to MCP resources rather than inlined data.

Coverage-checklist OpenQuestion "Industry standard for thinking-streaming envelopes" and "cross-protocol tool-call streaming" both touch this area.

## Desired state
- Add `ToolDescriptor.supportsElicitation: bool`, `ToolDescriptor.outputShape: enum<text,structured,resource-link,mixed>`.
- Add `Capability` instances `cap:mcp-elicitation`, `cap:mcp-structured-output`, `cap:mcp-resource-links`.
- Add `Channel` linkage so an elicitation request can be modeled as a `Channel` of kind `mcp-elicitation-channel` or as a sub-event of `Hook` `kind=DecisionPoint` (synonym).
- Resolve coverage-checklist OpenQuestion: elicitation IS the "agent-instance asking for help" pattern, equivalent to the `Decision-Point` term — record `synonym_of` between `term:elicitation` (new) and `term:decision-point`.

## Evidence
- https://modelcontextprotocol.io/specification/2025-06-18/changelog (PRs #382, #371, #603)

## Propagation status
- Level 1: open
- Level 2: not-started

## Propagation chain
- Level 1: 3 capabilities, attribute extension on ToolDescriptor.
- Level 2: terminology.md gets new synonym; coverage-checklist OpenQuestion `industry standard for cross-protocol tool-call streaming` partially resolved.

## Notes
Elicitation is conceptually the same pattern as a babysitter Decision-Point/Breakpoint — surfacing this in the schema unlocks cross-protocol unification.

## Resolution (2026-04-28)
Closed. Realized as three Capability entries (`capability:mcp-elicitation`, `capability:mcp-structured-tool-output`, `capability:mcp-resource-links`) with `appliesToNodeKinds: [AgentRuntimeImpl, ToolServer]`, plus per-product CapabilitySupport bindings for Claude Code (full), Cursor (partial — TODO verify), and OpenCode (none — TODO verify). Capture deferred to per-product evidence rather than reshaping `ToolDescriptor` schema, because the support level is per-runtime not per-tool.
