# GAP-TOOLS-025: MCP Tool Discovery and Invocation from Orchestrated Tasks

| Field | Value |
|-------|-------|
| Category | tools-capabilities |
| Priority | High |
| Effort | M |
| Status | Partial |

## Description
Enable process definitions to discover and invoke MCP tools registered on connected MCP servers, treating them as first-class routable capabilities. The orchestrator should know what MCP tools are available and route effects to MCP-capable harnesses or invoke MCP tools directly.

## Current State
The SDK has an MCP server (`mcp:serve`) that exposes babysitter's own tools via MCP. However, the orchestrator cannot act as an MCP client -- it cannot discover tools on external MCP servers or invoke them from within process definitions. Harnesses like CC have their own MCP client support, but the orchestrator has no visibility into what MCP tools are available.

## Target State
An MCP client module that: discovers tools on configured MCP servers, registers discovered tools in the capability registry, enables `ctx.mcpTool(server, tool, args)` intrinsic in process definitions, routes MCP tool invocations through the effect system for journal tracking, caches tool schemas for prompt enrichment. MCP tool availability becomes a routing constraint for harness selection.

## Dependencies
- [GAP-HADAPT-001](../harness-adaptation/GAP-HADAPT-001.md) -- capability-based routing with MCP as a capability
- [GAP-REMOTE-006](../remote-integration/GAP-REMOTE-006.md) -- MCP client infrastructure

## Key Files
| Component | Path |
|-----------|------|
| MCP server | `packages/sdk/src/mcp/` |
| Harness capabilities | `packages/sdk/src/harness/types.ts` |
| Effect routing | `packages/sdk/src/harness/registry.ts` |
| Task definitions | `packages/sdk/src/tasks/` |

## Recommendation
Phase 2-3 implementation. Build MCP client module alongside existing MCP server. Register discovered tools in capability registry. Add `ctx.mcpTool()` to ProcessContext with full journal tracking.
