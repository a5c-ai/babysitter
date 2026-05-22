import type { AtlasRecord, Edge, IndexShape, NeighborResult, SearchHit } from "./types";

// Use require() so bundlers (Turbopack/webpack) can resolve the JSON
// at build time instead of relying on fs.readFileSync + __dirname.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const indexJson: IndexShape = require("./index.json");

export type { AtlasRecord, ClusterDef, Edge, EdgeKindDef, IndexShape, NeighborResult, NodeKindDef, Record_, SearchHit } from "./types";

export class AtlasGraph {
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
    const pageIds = new Set(this.getIncoming(id).filter((edge) => edge.kind === "documents").map((edge) => edge.from));
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
      const haystack = JSON.stringify({ id: record.id, displayName, kind: record._kind, cluster: record._cluster, record }).toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (record.id.toLowerCase() === term) score += 20;
        if (displayName.toLowerCase().includes(term)) score += 10;
        if (record._kind.toLowerCase().includes(term)) score += 4;
        if (haystack.includes(term)) score += 1;
      }
      if (score > 0) hits.push({ record, score, displayName });
    }
    return hits.sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id)).slice(0, options.limit ?? 25);
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

export function createAtlasGraph(index: IndexShape = indexJson as unknown as IndexShape): AtlasGraph {
  return new AtlasGraph(index);
}

export const atlas = createAtlasGraph();
export const getIndex = (): IndexShape => atlas.getIndex();
export const getStats = (): IndexShape["stats"] => atlas.getStats();
export const getClusters = (): IndexShape["clusters"] => atlas.getClusters();
export const getNodeKinds = (): IndexShape["nodeKinds"] => atlas.getNodeKinds();
export const getEdgeKinds = (): IndexShape["edgeKinds"] => atlas.getEdgeKinds();
export const getRecord = (id: string): AtlasRecord | undefined => atlas.getRecord(id);
export const getAllRecords = (): AtlasRecord[] => atlas.getAllRecords();
export const getRecordsByKind = (kind: string): AtlasRecord[] => atlas.getRecordsByKind(kind);
export const getPages = (): AtlasRecord[] => atlas.getPages();
export const getPageBySlug = (slug: string): AtlasRecord | undefined => atlas.getPageBySlug(slug);
export const getPagesForRecord = (id: string): AtlasRecord[] => atlas.getPagesForRecord(id);
export const getOutgoing = (id: string): Edge[] => atlas.getOutgoing(id);
export const getIncoming = (id: string): Edge[] => atlas.getIncoming(id);
export const getNeighbors = (id: string, depth = 1): NeighborResult => atlas.getNeighbors(id, depth);
export const getDisplayName = (record: AtlasRecord | undefined): string => atlas.getDisplayName(record);
export const searchRecords = (query: string, options?: { limit?: number; kind?: string; cluster?: string }): SearchHit[] => atlas.searchRecords(query, options);


