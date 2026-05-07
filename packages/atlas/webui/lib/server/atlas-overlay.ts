import yaml from "js-yaml";
import type { AtlasRecord, Edge, IndexShape } from "@a5c-ai/atlas";

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function edgeAttributes(value: Record<string, unknown>): Record<string, unknown> {
  const attributes = { ...value };
  delete attributes.to;
  delete attributes.id;
  delete attributes.target;
  return attributes;
}

function extractEdges(record: Record<string, unknown>, fromId: string): Edge[] {
  const edges: Edge[] = [];
  const rawEdges = record.edges;
  if (Array.isArray(rawEdges)) {
    for (const item of rawEdges) {
      const edge = asObject(item);
      if (edge && edge.kind && edge.to) {
        edges.push({ from: fromId, to: String(edge.to), kind: String(edge.kind), attributes: asObject(edge.attributes) ?? undefined });
      }
    }
    return edges;
  }
  const edgeMap = asObject(rawEdges);
  if (!edgeMap) return edges;
  for (const [kind, value] of Object.entries(edgeMap)) {
    if (typeof value === "string") {
      edges.push({ from: fromId, to: value, kind });
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") {
          edges.push({ from: fromId, to: item, kind });
          continue;
        }
        const objectItem = asObject(item);
        const to = objectItem?.to ?? objectItem?.id ?? objectItem?.target;
        if (typeof to === "string" && objectItem) {
          edges.push({ from: fromId, to, kind, attributes: edgeAttributes(objectItem) });
        }
      }
      continue;
    }
    const objectValue = asObject(value);
    const to = objectValue?.to ?? objectValue?.id ?? objectValue?.target;
    if (typeof to === "string" && objectValue) {
      edges.push({ from: fromId, to, kind, attributes: edgeAttributes(objectValue) });
    }
  }
  return edges;
}

function emptyIndex(): IndexShape {
  return {
    generatedAt: new Date().toISOString(),
    catalogDir: "user-overlay",
    stats: {
      totalRecords: 0,
      totalEdges: 0,
      totalNodeKinds: 0,
      totalEdgeKinds: 0,
      totalClusters: 0,
      yamlFiles: 0,
      parseErrors: 0,
    },
    records: {},
    edges: [],
    nodeKinds: {},
    edgeKinds: {},
    clusters: {},
  };
}

export function buildOverlayIndexFromYaml(rawYaml: string, sourceLabel: string): IndexShape {
  const records: Record<string, AtlasRecord> = {};
  const edges: Edge[] = [];
  let parseErrors = 0;

  try {
    const docs = yaml.loadAll(rawYaml);
    for (const doc of docs) {
      const objectDoc = asObject(doc);
      if (!objectDoc) continue;
      if (objectDoc.kind === "NodeDocument" && Array.isArray(objectDoc.nodes)) {
        for (const nodeItem of objectDoc.nodes) {
          const node = asObject(nodeItem);
          if (!node || typeof node.id !== "string" || typeof node.kind !== "string") continue;
          const { id, kind, edges: _edges, ...attributes } = node;
          records[id] = {
            id,
            _kind: kind,
            _cluster: "user",
            _file: sourceLabel,
            ...attributes,
          };
          edges.push(...extractEdges(node, id));
        }
        continue;
      }
      const id = objectDoc.id;
      const kind = objectDoc.nodeKind ?? objectDoc.kind;
      if (typeof id !== "string" || typeof kind !== "string") continue;
      const attributes = asObject(objectDoc.attributes) ?? {};
      records[id] = {
        id,
        _kind: kind,
        _cluster: "user",
        _file: sourceLabel,
        ...attributes,
      };
      edges.push(...extractEdges(objectDoc, id));
    }
  } catch {
    parseErrors += 1;
  }

  const nodeKinds: IndexShape["nodeKinds"] = {};
  const edgeKinds: IndexShape["edgeKinds"] = {};
  const clusters: IndexShape["clusters"] = {};

  for (const record of Object.values(records)) {
    nodeKinds[record._kind] = {
      ...(nodeKinds[record._kind] ?? { name: record._kind, count: 0 }),
      name: record._kind,
      count: (nodeKinds[record._kind]?.count ?? 0) + 1,
    };
  }
  for (const edge of edges) {
    edgeKinds[edge.kind] = {
      ...(edgeKinds[edge.kind] ?? { name: edge.kind, count: 0 }),
      name: edge.kind,
      count: (edgeKinds[edge.kind]?.count ?? 0) + 1,
    };
  }
  if (Object.keys(records).length > 0) {
    clusters.user = {
      nodeKinds: Object.keys(nodeKinds).sort(),
      recordCount: Object.keys(records).length,
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    catalogDir: "user-overlay",
    stats: {
      totalRecords: Object.keys(records).length,
      totalEdges: edges.length,
      totalNodeKinds: Object.keys(nodeKinds).length,
      totalEdgeKinds: Object.keys(edgeKinds).length,
      totalClusters: Object.keys(clusters).length,
      yamlFiles: 1,
      parseErrors,
    },
    records,
    edges,
    nodeKinds,
    edgeKinds,
    clusters,
  };
}

export function mergeIndexes(base: IndexShape, overlay: IndexShape): IndexShape {
  if (Object.keys(overlay.records).length === 0 && overlay.edges.length === 0) {
    return base;
  }

  const records: Record<string, AtlasRecord> = { ...base.records };
  for (const [id, record] of Object.entries(overlay.records)) {
    if (!records[id]) {
      records[id] = record;
    }
  }

  const seenEdges = new Set<string>();
  const edges: Edge[] = [];
  for (const edge of [...base.edges, ...overlay.edges]) {
    const key = `${edge.from}|${edge.kind}|${edge.to}|${JSON.stringify(edge.attributes ?? {})}`;
    if (seenEdges.has(key)) continue;
    seenEdges.add(key);
    edges.push(edge);
  }

  const nodeKinds: IndexShape["nodeKinds"] = {};
  const edgeKinds: IndexShape["edgeKinds"] = {};
  const clusters: IndexShape["clusters"] = {};

  for (const record of Object.values(records)) {
    const current = nodeKinds[record._kind] ?? base.nodeKinds[record._kind] ?? overlay.nodeKinds[record._kind] ?? { name: record._kind, count: 0 };
    nodeKinds[record._kind] = { ...current, name: record._kind, count: (nodeKinds[record._kind]?.count ?? 0) + 1 };
    const cluster = record._cluster || "uncategorized";
    const clusterDef = clusters[cluster] ?? { nodeKinds: [], recordCount: 0 };
    if (!clusterDef.nodeKinds.includes(record._kind)) {
      clusterDef.nodeKinds = [...clusterDef.nodeKinds, record._kind].sort();
    }
    clusterDef.recordCount += 1;
    clusters[cluster] = clusterDef;
  }

  for (const edge of edges) {
    const current = edgeKinds[edge.kind] ?? base.edgeKinds[edge.kind] ?? overlay.edgeKinds[edge.kind] ?? { name: edge.kind, count: 0 };
    edgeKinds[edge.kind] = { ...current, name: edge.kind, count: (edgeKinds[edge.kind]?.count ?? 0) + 1 };
  }

  return {
    generatedAt: new Date().toISOString(),
    catalogDir: base.catalogDir,
    stats: {
      totalRecords: Object.keys(records).length,
      totalEdges: edges.length,
      totalNodeKinds: Object.keys(nodeKinds).length,
      totalEdgeKinds: Object.keys(edgeKinds).length,
      totalClusters: Object.keys(clusters).length,
      yamlFiles: base.stats.yamlFiles + overlay.stats.yamlFiles,
      parseErrors: base.stats.parseErrors + overlay.stats.parseErrors,
    },
    records,
    edges,
    nodeKinds,
    edgeKinds,
    clusters,
  };
}

export function mergeManyIndexes(indexes: IndexShape[]): IndexShape {
  return indexes.reduce((merged, current) => mergeIndexes(merged, current), emptyIndex());
}
