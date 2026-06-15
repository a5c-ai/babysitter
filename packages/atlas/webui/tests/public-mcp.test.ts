import { describe, expect, it } from "vitest";
import { createAtlasGraph, type IndexShape } from "@a5c-ai/atlas";
import {
  getPublicEdgeKindFromView,
  getPublicKindFromView,
  getPublicNeighborsFromView,
  getPublicRecordFromView,
  getPublicWikiPageFromView,
  listPublicClustersFromView,
  searchPublicAtlasFromView,
} from "../lib/server/public-mcp";

const index: IndexShape = {
  stats: {
    totalRecords: 4,
    totalEdges: 3,
    totalNodeKinds: 3,
    totalEdgeKinds: 2,
    totalClusters: 2,
    yamlFiles: 2,
    parseErrors: 0,
  },
  nodeKinds: {
    Tool: { name: "Tool", cluster: "public", count: 2 },
    Page: { name: "Page", cluster: "wiki", count: 1 },
    Agent: { name: "Agent", cluster: "public", count: 1 },
  },
  edgeKinds: {
    documents: {
      name: "documents",
      source: "Page",
      target: "Tool",
      count: 1,
    },
    related_to: {
      name: "related_to",
      source: ["Tool", "Agent"],
      target: ["Tool", "Agent"],
      count: 2,
    },
  },
  records: {
    "tool:atlas": {
      id: "tool:atlas",
      _kind: "Tool",
      _cluster: "public",
      _file: "tools/atlas.yaml",
      displayName: "Atlas Search",
      description: "Public graph search.",
    },
    "tool:graph": {
      id: "tool:graph",
      _kind: "Tool",
      _cluster: "public",
      _file: "tools/graph.yaml",
      displayName: "Graph Canvas",
      description: "Graph exploration.",
    },
    "agent:atlas": {
      id: "agent:atlas",
      _kind: "Agent",
      _cluster: "public",
      _file: "agents/atlas.yaml",
      displayName: "Atlas Agent",
      description: "Guides users through the graph.",
    },
    "page:index": {
      id: "page:index",
      _kind: "Page",
      _cluster: "wiki",
      _file: "wiki/index.md",
      slug: "index",
      title: "Atlas Wiki",
      articlePath: "wiki/index.md",
      article: "# Atlas Wiki\n\nWelcome.",
    },
  },
  edges: [
    { from: "page:index", to: "tool:atlas", kind: "documents" },
    { from: "tool:atlas", to: "tool:graph", kind: "related_to" },
    { from: "agent:atlas", to: "tool:atlas", kind: "related_to" },
  ],
  clusters: {
    public: { nodeKinds: ["Agent", "Tool"], recordCount: 3 },
    wiki: { nodeKinds: ["Page"], recordCount: 1 },
  },
};

const view = {
  graph: createAtlasGraph(index),
  index,
  mode: "public" as const,
};

describe("public atlas MCP helpers", () => {
  it("returns public record detail with optional expanded neighbors", () => {
    const result = getPublicRecordFromView(view, "tool:atlas", true);
    expect(result).toMatchObject({
      id: "tool:atlas",
      nodeKind: "Tool",
      displayName: "Atlas Search",
    });
    expect(result?.attributes).not.toHaveProperty("_kind");
    expect(result?.expandedNeighbors).toMatchObject({
      outgoing: [{ kind: "related_to", to: "tool:graph" }],
      incoming: [
        { kind: "documents", from: "page:index" },
        { kind: "related_to", from: "agent:atlas" },
      ],
    });
  });

  it("searches the public atlas view with snippets", () => {
    const result = searchPublicAtlasFromView(view, { query: "search" });
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.total).toBeGreaterThan(0);
    expect(result.hits[0]).toMatchObject({
      id: "tool:atlas",
      nodeKind: "Tool",
    });
    expect(result.hits[0]?.snippet).toContain("search");
  });

  it("builds public neighbors with kind filtering", () => {
    const result = getPublicNeighborsFromView(view, {
      id: "tool:atlas",
      depth: 1,
      kinds: ["Tool"],
    });
    expect(result?.nodes).toEqual([
      {
        id: "tool:atlas",
        nodeKind: "Tool",
        displayName: "Atlas Search",
        cluster: "public",
      },
      {
        id: "tool:graph",
        nodeKind: "Tool",
        displayName: "Graph Canvas",
        cluster: "public",
      },
    ]);
  });

  it("returns public kind and edge kind details with pagination", () => {
    const kind = getPublicKindFromView(view, "Tool", 1, null);
    expect(kind).toMatchObject({
      id: "Tool",
      instanceCount: 2,
      nextCursor: "tool:atlas",
    });

    const edgeKind = getPublicEdgeKindFromView(view, "related_to", 10, null);
    expect(edgeKind).toMatchObject({
      id: "related_to",
      wiredPairCount: 2,
    });
  });

  it("returns public wiki pages and documented records", () => {
    const page = getPublicWikiPageFromView(view, "index");
    expect(page).toMatchObject({
      slug: "index",
      title: "Atlas Wiki",
      documentedRecords: [
        {
          id: "tool:atlas",
          nodeKind: "Tool",
          displayName: "Atlas Search",
          cluster: "public",
        },
      ],
    });
  });

  it("lists public clusters", () => {
    expect(listPublicClustersFromView(view)).toEqual([
      { id: "public", nodeKinds: ["Agent", "Tool"], recordCount: 3 },
      { id: "wiki", nodeKinds: ["Page"], recordCount: 1 },
    ]);
  });
});
