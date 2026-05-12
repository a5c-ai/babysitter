import type { IndexShape } from "@a5c-ai/atlas";

export type AtlasMcpToolManifest = {
  name: string;
  title: string;
  description: string;
  inputSchema?: Record<string, unknown>;
};

export const ATLAS_AGENT_DOCS_PATH = "/for-agents";
export const ATLAS_AGENTS_MD_PATH = "/agents.md";
export const ATLAS_MCP_PATH = "/api/mcp";
export const ATLAS_MCP_MANIFEST_PATH = "/mcp.json";
export const ATLAS_MCP_WELL_KNOWN_PATH = "/.well-known/mcp.json";
export const ATLAS_OPENAPI_PATH = "/api/v1/openapi.json";
export const ATLAS_OPENAPI_DOCS_PATH = "/api/v1/docs";

export const atlasMcpTools: AtlasMcpToolManifest[] = [
  {
    name: "atlas_public_stats",
    title: "Atlas public stats",
    description: "Return public Atlas graph counts and index statistics.",
  },
  {
    name: "atlas_public_clusters",
    title: "Atlas public clusters",
    description: "List public Atlas clusters and their record counts.",
  },
  {
    name: "atlas_public_search",
    title: "Atlas public search",
    description: "Search the public Atlas catalog by id, title, display name, description, or node kind.",
    inputSchema: {
      type: "object",
      required: ["q"],
      properties: {
        q: { type: "string", minLength: 1 },
        kind: { type: "string" },
        cluster: { type: "string" },
        limit: { type: "integer", minimum: 1, maximum: 200 },
        offset: { type: "integer", minimum: 0 },
      },
    },
  },
  {
    name: "atlas_public_record",
    title: "Atlas public record detail",
    description: "Fetch a public Atlas record with attributes and inbound/outbound edges.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", minLength: 1 },
        expandNeighbors: { type: "boolean" },
      },
    },
  },
  {
    name: "atlas_public_neighbors",
    title: "Atlas public neighbors",
    description: "Fetch a bounded public Atlas neighborhood around a record id.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", minLength: 1 },
        depth: { type: "integer", minimum: 1, maximum: 3 },
        kinds: { type: "array", items: { type: "string" } },
        edges: { type: "array", items: { type: "string" } },
      },
    },
  },
  {
    name: "atlas_public_kinds",
    title: "Atlas public node kinds",
    description: "List public Atlas node kinds, optionally scoped to a cluster.",
    inputSchema: {
      type: "object",
      properties: {
        cluster: { type: "string" },
      },
    },
  },
  {
    name: "atlas_public_kind",
    title: "Atlas public node kind detail",
    description: "Fetch one node kind plus a paginated slice of its public instances.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", minLength: 1 },
        limit: { type: "integer", minimum: 1, maximum: 500 },
        cursor: { type: "string" },
      },
    },
  },
  {
    name: "atlas_public_edge_kinds",
    title: "Atlas public edge kinds",
    description: "List public Atlas edge kinds and their wired pair counts.",
  },
  {
    name: "atlas_public_edge_kind",
    title: "Atlas public edge kind detail",
    description: "Fetch one edge kind plus a paginated slice of its public wired pairs.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", minLength: 1 },
        limit: { type: "integer", minimum: 1, maximum: 500 },
        cursor: { type: "string" },
      },
    },
  },
  {
    name: "atlas_public_wiki_page",
    title: "Atlas public wiki page",
    description: "Fetch a public Atlas wiki page by slug, including article markdown and documented record links.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string" },
      },
    },
  },
  {
    name: "atlas_public_openapi",
    title: "Atlas public OpenAPI",
    description: "Return the public REST OpenAPI document and the docs/spec URLs.",
  },
];

export function absoluteUrl(origin: string, path: string) {
  return new URL(path, origin).toString();
}

export function buildAtlasMcpManifest(origin = "https://atlas-staging.a5c.ai") {
  return {
    name: "agentic-ai-atlas-public",
    title: "Agentic AI Atlas",
    description:
      "Public MCP server for searching and traversing the Agentic AI Atlas graph, node kinds, edge kinds, wiki pages, and OpenAPI surface.",
    icon: absoluteUrl(origin, "/globe.svg"),
    url: absoluteUrl(origin, ATLAS_MCP_PATH),
    transport: "streamable-http",
    capabilities: {
      tools: true,
      resources: false,
    },
    documentation: absoluteUrl(origin, ATLAS_AGENT_DOCS_PATH),
    agents: absoluteUrl(origin, ATLAS_AGENTS_MD_PATH),
    openapi: absoluteUrl(origin, ATLAS_OPENAPI_PATH),
    tools: atlasMcpTools.map((tool) => ({
      name: tool.name,
      title: tool.title,
      description: tool.description,
      ...(tool.inputSchema ? { inputSchema: tool.inputSchema } : {}),
    })),
  };
}

export function buildAgentsMarkdown(index: IndexShape, origin = "https://atlas-staging.a5c.ai") {
  const stats = index.stats;
  const topKinds = Object.entries(index.nodeKinds)
    .sort((a, b) => (b[1].count ?? 0) - (a[1].count ?? 0))
    .slice(0, 8)
    .map(([kind, def]) => `- ${kind}: ${(def.count ?? 0).toLocaleString()} records`)
    .join("\n");

  const toolDocs = atlasMcpTools
    .map((tool) => `- \`${tool.name}\`: ${tool.description}`)
    .join("\n");

  return `# Agentic AI Atlas for Agents

Agentic AI Atlas is a public, read-only graph of agent stacks, tools, tool servers, roles, workflows, capabilities, wiki pages, and implementation metadata.

## Canonical URLs

- Human guide: ${absoluteUrl(origin, ATLAS_AGENT_DOCS_PATH)}
- MCP endpoint: ${absoluteUrl(origin, ATLAS_MCP_PATH)}
- MCP manifest: ${absoluteUrl(origin, ATLAS_MCP_MANIFEST_PATH)}
- Well-known MCP manifest: ${absoluteUrl(origin, ATLAS_MCP_WELL_KNOWN_PATH)}
- OpenAPI JSON: ${absoluteUrl(origin, ATLAS_OPENAPI_PATH)}
- OpenAPI docs: ${absoluteUrl(origin, ATLAS_OPENAPI_DOCS_PATH)}

## Current Graph Snapshot

- Records: ${stats.totalRecords.toLocaleString()}
- Edges: ${stats.totalEdges.toLocaleString()}
- Node kinds: ${stats.totalNodeKinds.toLocaleString()}
- Edge kinds: ${stats.totalEdgeKinds.toLocaleString()}
- Clusters: ${stats.totalClusters.toLocaleString()}
- YAML files: ${stats.yamlFiles.toLocaleString()}
- Parse errors: ${stats.parseErrors.toLocaleString()}

## High-Volume Node Kinds

${topKinds}

## MCP Tools

${toolDocs}

## Recommended Agent Workflow

1. Start with \`atlas_public_search\` for a role, workflow, tool, tool server, capability, or wiki term.
2. Use \`atlas_public_record\` with \`expandNeighbors: true\` for exact graph context.
3. Use \`atlas_public_neighbors\` for bounded projections around a record.
4. Use \`atlas_public_wiki_page\` when a wiki slug is the best human-readable explanation.
5. Use \`atlas_public_openapi\` when REST endpoints are easier than MCP tools.

## Usage Notes

- Treat the public graph as read-only.
- Prefer exact record ids from search results before traversing neighbors.
- Keep neighbor depth small unless the user asks for broad exploration.
- When summarizing graph facts, include the record id and edge kind that support each claim.
`;
}
