import { describe, expect, it } from "vitest";
import type { IndexShape } from "@a5c-ai/atlas";
import { buildOverlayIndexFromYaml, mergeIndexes } from "../lib/server/atlas-overlay";

function createBaseIndex(): IndexShape {
  return {
    generatedAt: "2026-05-07T00:00:00.000Z",
    catalogDir: "atlas",
    stats: {
      totalRecords: 1,
      totalEdges: 1,
      totalNodeKinds: 1,
      totalEdgeKinds: 1,
      totalClusters: 1,
      yamlFiles: 1,
      parseErrors: 0,
    },
    records: {
      "tool:public": {
        id: "tool:public",
        _kind: "Tool",
        _cluster: "public",
        _file: "public.yaml",
        displayName: "Public Tool",
      },
    },
    edges: [
      {
        from: "tool:public",
        kind: "related_to",
        to: "tool:target",
      },
    ],
    nodeKinds: {
      Tool: { name: "Tool", count: 1 },
    },
    edgeKinds: {
      related_to: { name: "related_to", count: 1 },
    },
    clusters: {
      public: { nodeKinds: ["Tool"], recordCount: 1 },
    },
  };
}

describe("atlas overlay helpers", () => {
  it("builds an overlay index from both single-node and NodeDocument YAML shapes", () => {
    const yaml = [
      "nodeKind: Tool",
      "id: tool:overlay",
      "attributes:",
      "  displayName: Overlay Tool",
      "edges:",
      "  related_to:",
      "    - tool:target",
      "---",
      "kind: NodeDocument",
      "nodes:",
      "  - id: skill:overlay",
      "    kind: Skill",
      "    displayName: Overlay Skill",
      "    edges:",
      "      - kind: supports",
      "        to: tool:overlay",
    ].join("\n");

    const index = buildOverlayIndexFromYaml(yaml, "overlay.yaml");

    expect(index.stats.totalRecords).toBe(2);
    expect(index.stats.totalEdges).toBe(2);
    expect(index.records["tool:overlay"]).toMatchObject({
      _kind: "Tool",
      _cluster: "user",
      displayName: "Overlay Tool",
    });
    expect(index.records["skill:overlay"]).toMatchObject({
      _kind: "Skill",
      _cluster: "user",
      displayName: "Overlay Skill",
    });
  });

  it("keeps public records authoritative while deduplicating repeated edges", () => {
    const base = createBaseIndex();
    const overlay = buildOverlayIndexFromYaml(
      [
        "nodeKind: Tool",
        "id: tool:public",
        "attributes:",
        "  displayName: Overlay Should Not Win",
        "edges:",
        "  related_to:",
        "    - tool:target",
        "---",
        "nodeKind: Tool",
        "id: tool:private",
        "attributes:",
        "  displayName: Private Tool",
        "edges:",
        "  related_to:",
        "    - tool:target",
      ].join("\n"),
      "private.yaml",
    );

    const merged = mergeIndexes(base, overlay);

    expect(merged.records["tool:public"]).toMatchObject({
      displayName: "Public Tool",
    });
    expect(merged.records["tool:private"]).toMatchObject({
      displayName: "Private Tool",
    });
    expect(
      merged.edges.filter((edge) => edge.from === "tool:public" && edge.kind === "related_to" && edge.to === "tool:target"),
    ).toHaveLength(1);
  });
});
