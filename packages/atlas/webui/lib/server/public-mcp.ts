import type { AtlasRecord, Edge } from "@a5c-ai/atlas";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import Fuse from "fuse.js";
import { z } from "zod";
import { openapiSpec } from "@/lib/openapi";
import { paginate } from "@/lib/api-helpers";
import { getAtlasViewForUser } from "./atlas-view";
import type { AtlasGraphLike } from "./atlas-local";

type AtlasView = Awaited<ReturnType<typeof getAtlasViewForUser>>;

type SearchDoc = {
  id: string;
  _kind: string;
  _cluster: string;
  displayName: string;
  description: string;
};

type WikiPageSummary = {
  id: string;
  slug: string;
  title: string;
  articlePath: string;
};

type PublicAtlasToolConfig = {
  title?: string;
  description?: string;
  inputSchema?: Record<string, z.ZodTypeAny>;
};

type PublicAtlasToolRegistrar = (
  name: string,
  config: PublicAtlasToolConfig,
  handler: (...args: any[]) => unknown,
) => unknown;

function createPublicAtlasToolRegistrar(server: McpServer): PublicAtlasToolRegistrar {
  return server.registerTool.bind(server) as PublicAtlasToolRegistrar;
}

function jsonToolResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function jsonToolError(message: string) {
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: message,
      },
    ],
  };
}

function normalizeClusterMatch(lhs: string, rhs: string) {
  return lhs.replace(/^\d+-/, "") === rhs.replace(/^\d+-/, "");
}

function summarizeRecord(graph: AtlasGraphLike, record: AtlasRecord) {
  return {
    id: record.id,
    nodeKind: record._kind,
    displayName: graph.getDisplayName(record),
    cluster: record._cluster,
  };
}

function stripRecordAttributes(record: AtlasRecord) {
  const {
    _kind,
    _file,
    _cluster,
    id: _id,
    ...attributes
  } = record as Record<string, unknown> & {
    _kind: string;
    _file: string;
    _cluster: string;
    id: string;
  };

  return attributes;
}

function buildSearchFuse(docs: SearchDoc[]) {
  return new Fuse(docs, {
    keys: [
      { name: "id", weight: 0.4 },
      { name: "displayName", weight: 0.3 },
      { name: "description", weight: 0.2 },
      { name: "_kind", weight: 0.1 },
    ],
    threshold: 0.4,
    ignoreLocation: true,
    includeScore: true,
  });
}

function searchSnippet(doc: SearchDoc, query: string) {
  const text = doc.description || doc.displayName || doc.id;
  if (!text) return "";
  const lower = text.toLowerCase();
  const needle = query.toLowerCase().split(/\s+/)[0] ?? "";
  const idx = needle ? lower.indexOf(needle) : -1;
  if (idx < 0) return text.slice(0, 160);
  const start = Math.max(0, idx - 60);
  return `${start > 0 ? "…" : ""}${text.slice(start, start + 160)}`;
}

function toWikiSummary(page: AtlasRecord): WikiPageSummary {
  return {
    id: page.id,
    slug: String(page.slug ?? page.id),
    title: String(page.title ?? page.id),
    articlePath:
      typeof page.articlePath === "string" ? page.articlePath : page._file,
  };
}

function directChildPages(slug: string, pages: WikiPageSummary[]) {
  return pages.filter((page) => {
    if (page.slug === "index" || !page.slug.startsWith(`${slug}/`)) return false;
    return !page.slug.slice(slug.length + 1).includes("/");
  });
}

export async function getPublicAtlasView() {
  return getAtlasViewForUser(null);
}

export function getPublicAtlasStatsFromView(view: AtlasView) {
  return {
    mode: "public",
    stats: view.index.stats,
    totals: {
      records: Object.keys(view.index.records).length,
      nodeKinds: Object.keys(view.index.nodeKinds).length,
      edgeKinds: Object.keys(view.index.edgeKinds).length,
      clusters: Object.keys(view.index.clusters).length,
    },
  };
}

export function listPublicClustersFromView(view: AtlasView) {
  return Object.entries(view.index.clusters).map(([id, cluster]) => ({
    id,
    nodeKinds: cluster.nodeKinds,
    recordCount: cluster.recordCount,
  }));
}

export function listPublicKindsFromView(
  view: AtlasView,
  cluster?: string,
) {
  const all = Object.values(view.index.nodeKinds);
  const filtered = cluster
    ? all.filter((kind) => {
        if (!kind.cluster) return false;
        return kind.cluster === cluster || normalizeClusterMatch(kind.cluster, cluster);
      })
    : all;

  return filtered.map((kind) => ({
    id: kind.name,
    displayName: kind.name,
    cluster: kind.cluster ?? null,
    instanceCount: kind.count ?? 0,
  }));
}

export function getPublicKindFromView(
  view: AtlasView,
  nodeKindId: string,
  limit = 50,
  cursor: string | null = null,
) {
  const def = view.index.nodeKinds[nodeKindId];
  if (!def) return null;

  const clampedLimit = Math.min(Math.max(limit || 50, 1), 500);
  const records = Object.values(view.index.records)
    .filter((record) => record._kind === nodeKindId)
    .sort((a, b) => a.id.localeCompare(b.id));
  const { page, nextCursor } = paginate(records, cursor, clampedLimit, (record) => record.id);

  return {
    id: def.name,
    displayName: def.name,
    cluster: def.cluster ?? null,
    schema: def,
    instanceCount: def.count ?? records.length,
    instances: page.map((record) => ({
      id: record.id,
      displayName: view.graph.getDisplayName(record),
    })),
    nextCursor,
  };
}

export function listPublicEdgeKindsFromView(view: AtlasView) {
  const counts = new Map<string, number>();
  for (const edge of view.index.edges) {
    counts.set(edge.kind, (counts.get(edge.kind) ?? 0) + 1);
  }

  const toArray = (value: string | string[] | undefined) =>
    !value ? [] : Array.isArray(value) ? value : [value];

  return Object.values(view.index.edgeKinds).map((kind) => ({
    id: kind.name,
    sourceKinds: toArray(kind.source),
    targetKinds: toArray(kind.target),
    wiredPairCount: counts.get(kind.name) ?? kind.count ?? 0,
  }));
}

export function getPublicEdgeKindFromView(
  view: AtlasView,
  edgeKindId: string,
  limit = 50,
  cursor: string | null = null,
) {
  const def = view.index.edgeKinds[edgeKindId];
  if (!def) return null;

  const clampedLimit = Math.min(Math.max(limit || 50, 1), 500);
  const pairs = view.index.edges
    .filter((edge) => edge.kind === edgeKindId)
    .map((edge) => ({ from: edge.from, to: edge.to }))
    .sort((a, b) =>
      a.from === b.from ? a.to.localeCompare(b.to) : a.from.localeCompare(b.from),
    );
  const { page, nextCursor } = paginate(pairs, cursor, clampedLimit, (pair) => `${pair.from}|${pair.to}`);
  const toArray = (value: string | string[] | undefined) =>
    !value ? [] : Array.isArray(value) ? value : [value];

  return {
    id: def.name,
    description: def.description ?? "",
    cardinality: def.cardinality ?? "",
    sourceKinds: toArray(def.source),
    targetKinds: toArray(def.target),
    wiredPairCount: pairs.length,
    pairs: page,
    nextCursor,
  };
}

export function searchPublicAtlasFromView(
  view: AtlasView,
  {
    query,
    kind,
    cluster,
    limit = 25,
    offset = 0,
  }: {
    query: string;
    kind?: string;
    cluster?: string;
    limit?: number;
    offset?: number;
  },
) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return { error: "query parameter 'q' is required" } as const;
  }

  const docs: SearchDoc[] = view.graph.getAllRecords().map((record) => {
    const description = (record as Record<string, unknown>).description;
    return {
      id: record.id,
      _kind: record._kind,
      _cluster: record._cluster,
      displayName: view.graph.getDisplayName(record),
      description: typeof description === "string" ? description : "",
    };
  });

  const clampedLimit = Math.min(Math.max(limit || 25, 1), 200);
  const clampedOffset = Math.max(offset || 0, 0);

  const filtered = buildSearchFuse(docs)
    .search(normalizedQuery)
    .filter((entry) => {
      if (kind && entry.item._kind !== kind) return false;
      if (cluster && entry.item._cluster !== cluster) return false;
      return true;
    });

  return {
    total: filtered.length,
    hits: filtered.slice(clampedOffset, clampedOffset + clampedLimit).map((entry) => ({
      id: entry.item.id,
      nodeKind: entry.item._kind,
      displayName: entry.item.displayName,
      cluster: entry.item._cluster,
      score: entry.score ?? 0,
      snippet: searchSnippet(entry.item, normalizedQuery),
    })),
  };
}

export function getPublicRecordFromView(
  view: AtlasView,
  id: string,
  expandNeighbors = false,
) {
  const record = view.graph.getRecord(id);
  if (!record) return null;

  const outgoing = view.graph.getOutgoing(id).map((edge) => ({
    kind: edge.kind,
    to: edge.to,
  }));
  const incoming = view.graph.getIncoming(id).map((edge) => ({
    kind: edge.kind,
    from: edge.from,
  }));

  const response: Record<string, unknown> = {
    id: record.id,
    nodeKind: record._kind,
    file: record._file,
    cluster: record._cluster,
    displayName: view.graph.getDisplayName(record),
    attributes: stripRecordAttributes(record),
    outgoingEdges: outgoing,
    incomingEdges: incoming,
  };

  if (expandNeighbors) {
    const seen = new Set<string>();
    const expandRecord = (recordId: string) => {
      if (seen.has(recordId)) return null;
      seen.add(recordId);
      const neighbor = view.graph.getRecord(recordId);
      if (!neighbor) return { id: recordId, missing: true };
      return summarizeRecord(view.graph, neighbor);
    };

    response.expandedNeighbors = {
      outgoing: outgoing.map((edge) => ({ ...edge, record: expandRecord(edge.to) })),
      incoming: incoming.map((edge) => ({ ...edge, record: expandRecord(edge.from) })),
    };
  }

  return response;
}

export function getPublicNeighborsFromView(
  view: AtlasView,
  {
    id,
    depth = 1,
    kinds = [],
    edges = [],
  }: {
    id: string;
    depth?: number;
    kinds?: string[];
    edges?: string[];
  },
) {
  if (!view.graph.getRecord(id)) return null;

  const clampedDepth = Math.min(Math.max(depth || 1, 1), 3);
  const kindFilter = kinds.map((value) => value.trim()).filter(Boolean);
  const edgeFilter = edges.map((value) => value.trim()).filter(Boolean);
  const visited = new Set<string>([id]);
  const edgesOut: Edge[] = [];
  const edgesSeen = new Set<string>();
  let frontier = [id];

  for (let currentDepth = 0; currentDepth < clampedDepth; currentDepth++) {
    const next: string[] = [];
    for (const nodeId of frontier) {
      const candidates = [
        ...view.graph.getOutgoing(nodeId),
        ...view.graph.getIncoming(nodeId),
      ];
      for (const edge of candidates) {
        if (edgeFilter.length && !edgeFilter.includes(edge.kind)) continue;
        const edgeKey = `${edge.from}|${edge.to}|${edge.kind}`;
        if (edgesSeen.has(edgeKey)) continue;

        const otherId = edge.from === nodeId ? edge.to : edge.from;
        const otherRecord = view.graph.getRecord(otherId);
        if (kindFilter.length && otherRecord && !kindFilter.includes(otherRecord._kind)) {
          continue;
        }

        edgesSeen.add(edgeKey);
        edgesOut.push(edge);
        if (!visited.has(otherId)) {
          visited.add(otherId);
          next.push(otherId);
        }
      }
    }
    frontier = next;
  }

  return {
    nodes: Array.from(visited).map((recordId) => {
      const record = view.graph.getRecord(recordId);
      return record
        ? summarizeRecord(view.graph, record)
        : { id: recordId, missing: true };
    }),
    edges: edgesOut.map((edge) => ({
      from: edge.from,
      to: edge.to,
      kind: edge.kind,
    })),
  };
}

export function getPublicWikiPageFromView(view: AtlasView, slug = "index") {
  const page = view.graph.getPageBySlug(slug);
  if (!page) return null;

  const documented = view.graph
    .getOutgoing(page.id)
    .filter((edge) => edge.kind === "documents")
    .map((edge) => view.graph.getRecord(edge.to))
    .filter((record): record is AtlasRecord => Boolean(record))
    .map((record) => summarizeRecord(view.graph, record));

  const allPages = view.graph.getPages().map(toWikiSummary);
  const children = directChildPages(slug, allPages);
  const parentSlug =
    slug === "index" || !slug.includes("/") ? null : slug.split("/").slice(0, -1).join("/");

  return {
    id: page.id,
    slug: String(page.slug ?? page.id),
    title: String(page.title ?? page.id),
    articlePath:
      typeof page.articlePath === "string" ? page.articlePath : page._file,
    article: typeof page.article === "string" ? page.article : "",
    documentedRecords: documented,
    childPages: children,
    parentSlug,
  };
}

export function getPublicOpenApiPayload() {
  return {
    specPath: "/api/v1/openapi.json",
    docsPath: "/api/v1/docs",
    openapi: openapiSpec,
  };
}

export function registerPublicAtlasMcpTools(server: McpServer) {
  const registerTool = createPublicAtlasToolRegistrar(server);

  registerTool(
    "atlas_public_stats",
    {
      title: "Atlas public stats",
      description: "Return public Atlas graph counts and index statistics.",
    },
    async () => jsonToolResult(getPublicAtlasStatsFromView(await getPublicAtlasView())),
  );

  registerTool(
    "atlas_public_clusters",
    {
      title: "Atlas public clusters",
      description: "List public Atlas clusters and their record counts.",
    },
    async () => jsonToolResult(listPublicClustersFromView(await getPublicAtlasView())),
  );

  registerTool(
    "atlas_public_search",
    {
      title: "Atlas public search",
      description: "Search the public Atlas catalog by id, title, display name, description, or node kind.",
      inputSchema: {
        q: z.string().min(1),
        kind: z.string().optional(),
        cluster: z.string().optional(),
        limit: z.number().int().min(1).max(200).optional(),
        offset: z.number().int().min(0).optional(),
      },
    },
    async ({ q, kind, cluster, limit, offset }) => {
      const result = searchPublicAtlasFromView(await getPublicAtlasView(), {
        query: q,
        kind,
        cluster,
        limit,
        offset,
      });
      if ("error" in result && typeof result.error === "string") {
        return jsonToolError(result.error);
      }
      return jsonToolResult(result);
    },
  );

  registerTool(
    "atlas_public_record",
    {
      title: "Atlas public record detail",
      description: "Fetch a public Atlas record with attributes and inbound/outbound edges.",
      inputSchema: {
        id: z.string().min(1),
        expandNeighbors: z.boolean().optional(),
      },
    },
    async ({ id, expandNeighbors }) => {
      const result = getPublicRecordFromView(await getPublicAtlasView(), id, expandNeighbors ?? false);
      return result
        ? jsonToolResult(result)
        : jsonToolError(`record '${id}' not found`);
    },
  );

  registerTool(
    "atlas_public_neighbors",
    {
      title: "Atlas public neighbors",
      description: "Fetch a bounded public Atlas neighborhood around a record id.",
      inputSchema: {
        id: z.string().min(1),
        depth: z.number().int().min(1).max(3).optional(),
        kinds: z.array(z.string()).optional(),
        edges: z.array(z.string()).optional(),
      },
    },
    async ({ id, depth, kinds, edges }) => {
      const result = getPublicNeighborsFromView(await getPublicAtlasView(), {
        id,
        depth,
        kinds,
        edges,
      });
      return result
        ? jsonToolResult(result)
        : jsonToolError(`record '${id}' not found`);
    },
  );

  registerTool(
    "atlas_public_kinds",
    {
      title: "Atlas public node kinds",
      description: "List public Atlas node kinds, optionally scoped to a cluster.",
      inputSchema: {
        cluster: z.string().optional(),
      },
    },
    async ({ cluster }) => jsonToolResult(listPublicKindsFromView(await getPublicAtlasView(), cluster)),
  );

  registerTool(
    "atlas_public_kind",
    {
      title: "Atlas public node kind detail",
      description: "Fetch one node kind plus a paginated slice of its public instances.",
      inputSchema: {
        id: z.string().min(1),
        limit: z.number().int().min(1).max(500).optional(),
        cursor: z.string().optional(),
      },
    },
    async ({ id, limit, cursor }) => {
      const result = getPublicKindFromView(await getPublicAtlasView(), id, limit, cursor ?? null);
      return result
        ? jsonToolResult(result)
        : jsonToolError(`NodeKind '${id}' not found`);
    },
  );

  registerTool(
    "atlas_public_edge_kinds",
    {
      title: "Atlas public edge kinds",
      description: "List public Atlas edge kinds and their wired pair counts.",
    },
    async () => jsonToolResult(listPublicEdgeKindsFromView(await getPublicAtlasView())),
  );

  registerTool(
    "atlas_public_edge_kind",
    {
      title: "Atlas public edge kind detail",
      description: "Fetch one edge kind plus a paginated slice of its public wired pairs.",
      inputSchema: {
        id: z.string().min(1),
        limit: z.number().int().min(1).max(500).optional(),
        cursor: z.string().optional(),
      },
    },
    async ({ id, limit, cursor }) => {
      const result = getPublicEdgeKindFromView(await getPublicAtlasView(), id, limit, cursor ?? null);
      return result
        ? jsonToolResult(result)
        : jsonToolError(`EdgeKind '${id}' not found`);
    },
  );

  registerTool(
    "atlas_public_wiki_page",
    {
      title: "Atlas public wiki page",
      description: "Fetch a public Atlas wiki page by slug, including article markdown and documented record links.",
      inputSchema: {
        slug: z.string().optional(),
      },
    },
    async ({ slug }) => {
      const result = getPublicWikiPageFromView(await getPublicAtlasView(), slug ?? "index");
      return result
        ? jsonToolResult(result)
        : jsonToolError(`wiki page '${slug ?? "index"}' not found`);
    },
  );

  registerTool(
    "atlas_public_openapi",
    {
      title: "Atlas public OpenAPI",
      description: "Return the public REST OpenAPI document and the docs/spec URLs.",
    },
    async () => jsonToolResult(getPublicOpenApiPayload()),
  );
}
