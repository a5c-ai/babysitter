import { describe, expect, it } from "vitest";
import type { IndexShape } from "@a5c-ai/atlas";
import { buildAgentsMarkdown, buildAtlasMcpManifest } from "../lib/server/agent-docs";

const index = {
  stats: {
    totalRecords: 12,
    totalEdges: 34,
    totalNodeKinds: 3,
    totalEdgeKinds: 4,
    totalClusters: 2,
    yamlFiles: 5,
    parseErrors: 0,
  },
  nodeKinds: {
    Tool: { name: "Tool", count: 7 },
    ToolServer: { name: "ToolServer", count: 3 },
    Page: { name: "Page", count: 2 },
  },
  edgeKinds: {},
  records: {},
  edges: [],
  clusters: {},
} satisfies IndexShape;

describe("agent docs", () => {
  it("builds an MCP discovery manifest for the public Atlas server", () => {
    const manifest = buildAtlasMcpManifest("https://atlas.example");

    expect(manifest).toMatchObject({
      name: "agentic-ai-atlas-public",
      transport: "streamable-http",
      url: "https://atlas.example/api/mcp",
      documentation: "https://atlas.example/for-agents",
      agents: "https://atlas.example/agents.md",
      openapi: "https://atlas.example/api/v1/openapi.json",
      capabilities: { tools: true, resources: false },
    });
    expect(manifest.tools.map((tool) => tool.name)).toContain("atlas_public_search");
    expect(manifest.tools.map((tool) => tool.name)).toContain("atlas_public_neighbors");
  });

  it("builds agents.md with graph stats and canonical URLs", () => {
    const markdown = buildAgentsMarkdown(index, "https://atlas.example");

    expect(markdown).toContain("# Agentic AI Atlas for Agents");
    expect(markdown).toContain("MCP endpoint: https://atlas.example/api/mcp");
    expect(markdown).toContain("Well-known MCP manifest: https://atlas.example/.well-known/mcp.json");
    expect(markdown).toContain("Records: 12");
    expect(markdown).toContain("`atlas_public_record`");
  });
});
