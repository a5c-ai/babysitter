import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { AtlasRecord, Edge, IndexShape } from "@a5c-ai/atlas";
import { createLocalAtlasGraph } from "../lib/server/atlas-local";
import { buildServiceTowerView } from "../components/reusable-views/service-tower-data";
import { getReusableViewType, renderReusableView } from "../components/reusable-views/render";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => <a href={href} className={className}>{children}</a>,
}));

function record(id: string, kind: string, displayName: string, extra: Record<string, unknown> = {}): AtlasRecord {
  return {
    id,
    _kind: kind,
    _cluster: String(extra._cluster ?? "test"),
    _file: `${id}.yaml`,
    displayName,
    summary: `${displayName} summary`,
    ...extra,
  };
}

function index(records: AtlasRecord[], edges: Edge[] = []): IndexShape {
  const nodeKinds: IndexShape["nodeKinds"] = {};
  const clusters: IndexShape["clusters"] = {};
  for (const entry of records) {
    nodeKinds[entry._kind] = { name: entry._kind, count: (nodeKinds[entry._kind]?.count ?? 0) + 1 };
    const cluster = clusters[entry._cluster] ?? { nodeKinds: [], recordCount: 0 };
    if (!cluster.nodeKinds.includes(entry._kind)) cluster.nodeKinds.push(entry._kind);
    cluster.recordCount += 1;
    clusters[entry._cluster] = cluster;
  }
  return {
    generatedAt: "2026-05-11T00:00:00.000Z",
    catalogDir: "test",
    stats: {
      totalRecords: records.length,
      totalEdges: edges.length,
      totalNodeKinds: Object.keys(nodeKinds).length,
      totalEdgeKinds: 1,
      totalClusters: Object.keys(clusters).length,
      yamlFiles: 1,
      parseErrors: 0,
    },
    records: Object.fromEntries(records.map((entry) => [entry.id, entry])),
    edges,
    nodeKinds,
    edgeKinds: { documents: { name: "documents", count: 1 } },
    clusters,
  };
}

describe("service tower reusable view", () => {
  it("builds customizable floors, rooms, services, and record links from graph queries", () => {
    const graph = createLocalAtlasGraph(index([
      record("layer:1-model", "Layer", "Layer 1: Model"),
      record("layer:2-provider", "Layer", "Layer 2: Provider"),
      record("workflow:release", "Workflow", "Release workflow", { _cluster: "workflows" }),
      record("tool:ci", "Tool", "CI Tool"),
    ], [
      { from: "layer:1-model", to: "layer:2-provider", kind: "depends_on" },
      { from: "workflow:release", to: "tool:ci", kind: "uses" },
    ]));

    const data = buildServiceTowerView(graph, {
      title: "Custom Atlas",
      floors: [
        {
          id: "stack",
          label: "STACK",
          rooms: [
            { id: "layers", label: "Layers", query: { kind: "Layer", limit: 2 }, color: "#D4A84B" },
            { id: "workflows", label: "Workflows", query: { kind: "Workflow", limit: 2 }, color: "#C98A3E" },
          ],
        },
      ],
    });

    expect(data.title).toBe("Custom Atlas");
    expect(data.floors).toHaveLength(1);
    expect(data.floors[0].rooms[0].records.map((entry) => entry.id)).toEqual(["layer:1-model", "layer:2-provider"]);
    expect(data.floors[0].rooms[0].services[0].refs[0]).toMatchObject({ id: "layer:2-provider", href: "/n/layer%3A2-provider" });
    expect(data.stats.find((stat) => stat.label === "Records")?.value).toBe(3);
  });

  it("renders a service-tower reusable view selected by wiki page frontmatter", () => {
    const page = record("page:custom", "Page", "Custom page", {
      reusableView: {
        type: "service-tower",
        options: {
          title: "Rendered Tower",
          floors: [
            {
              label: "STACK",
              rooms: [
                { label: "Layers", query: { kind: "Layer", limit: 1 }, color: "#D4A84B" },
              ],
            },
          ],
        },
      },
    });
    const graph = createLocalAtlasGraph(index([page, record("layer:1-model", "Layer", "Layer 1: Model")]));

    expect(getReusableViewType(page)).toBe("service-tower");
    const html = renderToStaticMarkup(<>{renderReusableView(page, graph)}</>);

    expect(html).toContain("Rendered Tower");
    expect(html).toContain("STACK");
    expect(html).toContain("Layers");
    expect(html).toContain("1 Records");
    expect(html).toContain("Walk the building.");
  });
});
