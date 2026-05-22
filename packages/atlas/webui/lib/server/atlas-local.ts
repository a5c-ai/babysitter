import * as fs from "node:fs";
import * as path from "node:path";
import type { AtlasRecord, Edge, IndexShape, NeighborResult, SearchHit } from "@a5c-ai/atlas";

export interface AtlasGraphLike {
  getIndex(): IndexShape;
  getStats(): IndexShape["stats"];
  getClusters(): IndexShape["clusters"];
  getNodeKinds(): IndexShape["nodeKinds"];
  getEdgeKinds(): IndexShape["edgeKinds"];
  getRecord(id: string): AtlasRecord | undefined;
  getAllRecords(): AtlasRecord[];
  getRecordsByKind(kind: string): AtlasRecord[];
  getPages(): AtlasRecord[];
  getPageBySlug(slug: string): AtlasRecord | undefined;
  getPagesForRecord(id: string): AtlasRecord[];
  getOutgoing(id: string): Edge[];
  getIncoming(id: string): Edge[];
  getNeighbors(id: string, depth?: number): NeighborResult;
  getDisplayName(record: AtlasRecord | undefined): string;
  searchRecords(query: string, options?: { limit?: number; kind?: string; cluster?: string }): SearchHit[];
}

class LocalAtlasGraph implements AtlasGraphLike {
  private allRecordsCache: AtlasRecord[] | null = null;
  private pagesCache: AtlasRecord[] | null = null;
  private recordsByKindCache: Map<string, AtlasRecord[]> | null = null;
  private incomingByTarget: Map<string, Edge[]> | null = null;
  private outgoingBySource: Map<string, Edge[]> | null = null;

  constructor(private readonly index: IndexShape) {}

  getIndex(): IndexShape {
    return this.index;
  }

  getStats(): IndexShape["stats"] {
    return this.index.stats;
  }

  getClusters(): IndexShape["clusters"] {
    return this.index.clusters;
  }

  getNodeKinds(): IndexShape["nodeKinds"] {
    return this.index.nodeKinds;
  }

  getEdgeKinds(): IndexShape["edgeKinds"] {
    return this.index.edgeKinds;
  }

  getRecord(id: string): AtlasRecord | undefined {
    return this.index.records[id];
  }

  getAllRecords(): AtlasRecord[] {
    if (this.allRecordsCache) return this.allRecordsCache;
    this.allRecordsCache = Object.values(this.index.records);
    return this.allRecordsCache;
  }

  getRecordsByKind(kind: string): AtlasRecord[] {
    return this.recordsByKindMap().get(kind) ?? [];
  }

  getPages(): AtlasRecord[] {
    if (this.pagesCache) return this.pagesCache;
    this.pagesCache = this.getRecordsByKind("Page")
      .slice()
      .sort((a, b) => String(a.slug ?? a.id).localeCompare(String(b.slug ?? b.id)));
    return this.pagesCache;
  }

  getPageBySlug(slug: string): AtlasRecord | undefined {
    return this.getPages().find((record) => record.slug === slug);
  }

  getPagesForRecord(id: string): AtlasRecord[] {
    const pageIds = new Set(
      this.getIncoming(id)
        .filter((edge) => edge.kind === "documents")
        .map((edge) => edge.from),
    );
    return this.getPages().filter((record) => pageIds.has(record.id));
  }

  getOutgoing(id: string): Edge[] {
    return this.outgoingMap().get(id) ?? [];
  }

  getIncoming(id: string): Edge[] {
    return this.incomingMap().get(id) ?? [];
  }

  getNeighbors(id: string, depth = 1): NeighborResult {
    const nodes = new Set<string>([id]);
    const edges: Edge[] = [];
    const seen = new Set<string>();
    let frontier = [id];

    for (let currentDepth = 0; currentDepth < depth; currentDepth++) {
      const next: string[] = [];
      for (const nodeId of frontier) {
        for (const edge of this.getOutgoing(nodeId).concat(this.getIncoming(nodeId))) {
          const key = `${edge.from}->${edge.to}:${edge.kind}`;
          if (seen.has(key)) continue;
          seen.add(key);
          edges.push(edge);
          for (const adjacent of [edge.from, edge.to]) {
            if (!nodes.has(adjacent)) {
              nodes.add(adjacent);
              next.push(adjacent);
            }
          }
        }
      }
      frontier = next;
      if (frontier.length === 0) break;
    }

    return { nodes, edges };
  }

  getDisplayName(record: AtlasRecord | undefined): string {
    if (!record) return "";
    const value = record.displayName ?? record.name ?? record.title ?? record.id;
    return typeof value === "string" ? value : record.id;
  }

  searchRecords(query: string, options: { limit?: number; kind?: string; cluster?: string } = {}): SearchHit[] {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];

    const hits: SearchHit[] = [];
    for (const record of this.getAllRecords()) {
      if (options.kind && record._kind !== options.kind) continue;
      if (options.cluster && record._cluster !== options.cluster) continue;

      const displayName = this.getDisplayName(record);
      const haystack = JSON.stringify({
        id: record.id,
        displayName,
        kind: record._kind,
        cluster: record._cluster,
        record,
      }).toLowerCase();

      let score = 0;
      for (const term of terms) {
        if (record.id.toLowerCase() === term) score += 20;
        if (displayName.toLowerCase().includes(term)) score += 10;
        if (record._kind.toLowerCase().includes(term)) score += 4;
        if (haystack.includes(term)) score += 1;
      }

      if (score > 0) {
        hits.push({ record, score, displayName });
      }
    }

    return hits
      .sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id))
      .slice(0, options.limit ?? 25);
  }

  private incomingMap(): Map<string, Edge[]> {
    if (this.incomingByTarget) return this.incomingByTarget;
    const map = new Map<string, Edge[]>();
    for (const edge of this.index.edges) {
      const entries = map.get(edge.to) ?? [];
      entries.push(edge);
      map.set(edge.to, entries);
    }
    this.incomingByTarget = map;
    return map;
  }

  private outgoingMap(): Map<string, Edge[]> {
    if (this.outgoingBySource) return this.outgoingBySource;
    const map = new Map<string, Edge[]>();
    for (const edge of this.index.edges) {
      const entries = map.get(edge.from) ?? [];
      entries.push(edge);
      map.set(edge.from, entries);
    }
    this.outgoingBySource = map;
    return map;
  }

  private recordsByKindMap(): Map<string, AtlasRecord[]> {
    if (this.recordsByKindCache) return this.recordsByKindCache;
    const map = new Map<string, AtlasRecord[]>();
    for (const record of this.getAllRecords()) {
      const entries = map.get(record._kind) ?? [];
      entries.push(record);
      map.set(record._kind, entries);
    }
    this.recordsByKindCache = map;
    return map;
  }
}

let publicIndexCache: IndexShape | null = null;

function loadPublicIndex(): IndexShape {
  if (publicIndexCache) return publicIndexCache;

  const cwd = /* turbopackIgnore: true */ process.cwd();
  const candidates = [
    // monorepo root (dev): {repo}/packages/atlas/src/index.json
    path.join(cwd, "packages", "atlas", "src", "index.json"),
    // monorepo root (built): {repo}/packages/atlas/dist/index.json
    path.join(cwd, "packages", "atlas", "dist", "index.json"),
    // webui cwd (dev): ../src/index.json
    path.join(cwd, "..", "src", "index.json"),
    // webui cwd (built): ../dist/index.json
    path.join(cwd, "..", "dist", "index.json"),
  ];

  for (const indexPath of candidates) {
    if (!fs.existsSync(indexPath)) continue;
    publicIndexCache = JSON.parse(fs.readFileSync(indexPath, "utf8")) as IndexShape;
    return publicIndexCache;
  }

  throw new Error(`Atlas index.json not found. Checked: ${candidates.join(", ")}`);
}

export function getPublicAtlasGraph(): AtlasGraphLike {
  return new LocalAtlasGraph(loadPublicIndex());
}

export function createLocalAtlasGraph(index: IndexShape): AtlasGraphLike {
  return new LocalAtlasGraph(index);
}
