import { Type } from "@sinclair/typebox";
import type { AgenticToolOptions, CustomToolDefinition } from "../types";
import { errorResult, jsonResult } from "../shared/results";

export function createDiscoveryTools(options: AgenticToolOptions): CustomToolDefinition[] {
  return [
    {
      name: "tool_search",
      label: "Search Tools",
      description:
        "Search available tools by name or description. Returns lightweight entries. Use tool_fetch to get full schema for a specific tool.",
      parameters: Type.Object({
        query: Type.String({ description: "Search query (matched against tool names and descriptions)" }),
        max_results: Type.Optional(Type.Number({ description: "Maximum results to return (default 20)" })),
      }),
      execute: (_toolCallId, params) => {
        const registry = options.toolRegistry ?? options.deferredToolRegistry;
        if (!registry) {
          return errorResult("Tool search is not available — no unified tool registry configured.");
        }
        const query = String(params.query ?? "");
        const maxResults = typeof params.max_results === "number" ? params.max_results : 20;
        const results = registry.searchTools(query, maxResults);
        return jsonResult({
          query,
          resultCount: results.length,
          tools: results.map((tool) => ({
            name: tool.name,
            description: tool.description,
            source: tool.source,
            sourceQualifier: tool.sourceQualifier,
            metadata: tool.metadata,
          })),
        });
      },
    },
    {
      name: "tool_fetch",
      label: "Fetch Tool Schema",
      description:
        "Fetch the full JSON Schema for a tool by name. Returns the complete input/output schema needed to invoke the tool.",
      parameters: Type.Object({
        name: Type.String({ description: "Tool name to fetch schema for" }),
        source: Type.Optional(Type.String({ description: "Source filter: builtin, mcp, plugin, custom" })),
        source_qualifier: Type.Optional(Type.String({ description: "Source qualifier (e.g. MCP server name)" })),
      }),
      execute: async (_toolCallId, params) => {
        const registry = options.toolRegistry ?? options.deferredToolRegistry;
        if (!registry) {
          return errorResult("Tool fetch is not available — no unified tool registry configured.");
        }

        const toolName = String(params.name ?? "");
        const validSources = new Set(["builtin", "mcp", "plugin", "custom"]);
        const rawSource = typeof params.source === "string" ? params.source : undefined;
        if (rawSource && !validSources.has(rawSource)) {
          return errorResult(`Invalid source "${rawSource}". Valid sources: builtin, mcp, plugin, custom.`);
        }

        const resolved = await registry.fetchSchema(
          toolName,
          rawSource as "builtin" | "mcp" | "plugin" | "custom" | undefined,
          typeof params.source_qualifier === "string" ? params.source_qualifier : undefined,
        );
        if (!resolved) {
          return errorResult(`Tool "${toolName}" not found or schema could not be loaded.`);
        }

        return jsonResult({
          name: resolved.name,
          description: resolved.description,
          source: resolved.source,
          sourceQualifier: resolved.sourceQualifier,
          metadata: resolved.metadata,
          inputSchema: resolved.schema.inputSchema,
          outputSchema: resolved.schema.outputSchema,
        });
      },
    },
  ];
}
