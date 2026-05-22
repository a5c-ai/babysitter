export interface Edge {
  from: string;
  to: string;
  kind: string;
  attributes?: Record<string, unknown>;
}

export interface AtlasRecord {
  id: string;
  _kind: string;
  _file: string;
  _cluster: string;
  [key: string]: unknown;
}

export type Record_ = AtlasRecord;

export interface NodeKindDef {
  name: string;
  id?: string;
  description?: string;
  count: number;
  cluster?: string;
  attributes?: unknown;
  [key: string]: unknown;
}

export interface EdgeKindDef {
  name: string;
  id?: string;
  description?: string;
  source?: string | string[];
  target?: string | string[];
  cardinality?: string | number;
  inverse?: string;
  count: number;
  [key: string]: unknown;
}

export interface ClusterDef {
  nodeKinds: string[];
  recordCount: number;
}

export interface IndexShape {
  generatedAt: string;
  catalogDir: string;
  stats: {
    totalRecords: number;
    totalEdges: number;
    totalNodeKinds: number;
    totalEdgeKinds: number;
    totalClusters: number;
    yamlFiles: number;
    parseErrors: number;
  };
  records: Record<string, AtlasRecord>;
  edges: Edge[];
  nodeKinds: Record<string, NodeKindDef>;
  edgeKinds: Record<string, EdgeKindDef>;
  clusters: Record<string, ClusterDef>;
}

export interface NeighborResult {
  nodes: Set<string>;
  edges: Edge[];
}

export interface SearchHit {
  record: AtlasRecord;
  score: number;
  displayName: string;
}


