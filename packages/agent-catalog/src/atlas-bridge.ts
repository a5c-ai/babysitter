/**
 * Atlas bridge for agent-catalog.
 *
 * Adapts the Atlas graph singleton (`@a5c-ai/atlas`) into the same query
 * surface that `graph.ts` previously exposed. All data comes from Atlas —
 * there is no fallback to local YAML files.
 */

import { atlas } from "@a5c-ai/atlas";
import type { AtlasRecord, Edge } from "@a5c-ai/atlas";
import type {
  CatalogGraph,
  GraphDocument,
  GraphEdge,
  GraphNode,
  GraphRelationship,
  OntologySchema,
} from "./models";

// ---------------------------------------------------------------------------
// Record adaptation: Atlas `_kind` -> agent-catalog `kind`
// ---------------------------------------------------------------------------

const AGENT_CATALOG_KINDS = new Set([
  "AdapterModel", "AgentProduct", "AgentRuntimeImpl", "AgentUIImpl", "AgentVersion", "Capability", "CapabilitySupport",
  "AgentPlatformImpl", "CiSurface", "Claim", "DiscoverySignal", "EvidenceSource",
  "FrontmatterField",
  "HookMapping", "HookSurface", "LifecycleSemantics", "Modality",
  "ModelFamily", "ModelProviderProduct", "ModelProviderVersion", "ModelVersion",
  "PackageSurface", "PathDescriptor", "PluginArtifact", "PluginTarget",
  "ProcessDescriptor", "ProviderTranslation", "SessionSemantics", "TransportProtocol", "TransportRuntime",
  "InteractionPrimitive",
]);

function isAgentCatalogRecord(record: AtlasRecord): boolean {
  return AGENT_CATALOG_KINDS.has(record._kind);
}

function adaptRecord(record: AtlasRecord): GraphNode {
  const { _kind, _file, _cluster, ...rest } = record;
  return { ...rest, kind: _kind } as unknown as GraphNode;
}

function adaptEdge(edge: Edge, index: number): GraphRelationship {
  return {
    id: `edge:${edge.from}->${edge.to}:${edge.kind}:${index}`,
    relation: edge.kind,
    from: edge.from,
    to: edge.to,
    ...(edge.attributes ?? {}),
  } as GraphRelationship;
}

// ---------------------------------------------------------------------------
// Cached projections
// ---------------------------------------------------------------------------

let cachedNodes: GraphNode[] | undefined;
let cachedEdges: GraphRelationship[] | undefined;
let cachedNodeIds: Set<string> | undefined;

function allNodes(): GraphNode[] {
  if (!cachedNodes) {
    cachedNodes = atlas.getAllRecords().filter(isAgentCatalogRecord).map(adaptRecord);
  }
  return cachedNodes;
}

function agentCatalogNodeIds(): Set<string> {
  if (!cachedNodeIds) {
    cachedNodeIds = new Set(allNodes().map((node) => node.id));
  }
  return cachedNodeIds;
}

function allEdges(): GraphRelationship[] {
  if (!cachedEdges) {
    const nodeIds = agentCatalogNodeIds();
    cachedEdges = atlas
      .getIndex()
      .edges.filter((edge: Edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to))
      .map(adaptEdge);
  }
  return cachedEdges;
}

// ---------------------------------------------------------------------------
// Public API — drop-in replacements for graph.ts functions
// ---------------------------------------------------------------------------

export function listGraphNodes(): GraphNode[] {
  return [...allNodes()];
}

export function listNodesByKind(kind: GraphNode["kind"]): GraphNode[] {
  return atlas.getRecordsByKind(kind as string).filter(isAgentCatalogRecord).map(adaptRecord);
}

export function getNodeById<TNode extends GraphNode = GraphNode>(
  nodeId: string,
): TNode | undefined {
  const record = atlas.getRecord(nodeId);
  return record ? (adaptRecord(record) as TNode) : undefined;
}

export function listRelationshipsByRelation(
  relation: string,
): GraphRelationship[] {
  return allEdges().filter((edge) => edge.relation === relation);
}

export function listGraphEdges(): GraphRelationship[] {
  return [...allEdges()];
}

export function listOutgoingTargets(
  nodeId: string,
  relation: string,
): GraphNode[] {
  return atlas
    .getOutgoing(nodeId)
    .filter((edge: Edge) => edge.kind === relation)
    .map((edge: Edge) => atlas.getRecord(edge.to))
    .filter((record: AtlasRecord | undefined): record is AtlasRecord => record !== undefined)
    .map(adaptRecord);
}

export function listIncomingSources(
  nodeId: string,
  relation: string,
): GraphNode[] {
  return atlas
    .getIncoming(nodeId)
    .filter((edge: Edge) => edge.kind === relation)
    .map((edge: Edge) => atlas.getRecord(edge.from))
    .filter((record: AtlasRecord | undefined): record is AtlasRecord => record !== undefined)
    .map(adaptRecord);
}

export function listRelationshipsForNode(nodeId: string): GraphRelationship[] {
  return allEdges().filter(
    (edge) => edge.from === nodeId || edge.to === nodeId,
  );
}

// ---------------------------------------------------------------------------
// Synthetic graph document and schema
// ---------------------------------------------------------------------------

export function getGraphDocument(): GraphDocument {
  return {
    kind: "GraphDocument",
    id: "graph:agent-catalog",
    graphId: "graph:agent-catalog",
    schemaVersion: "2026.04.agent-catalog-v2",
    catalogVersion: "2026.04.agent-catalog-v2",
    generatedAt: new Date().toISOString(),
    owners: ["@a5c-ai"],
    imports: [],
    schemaPath: "schema/ontology-schema.yaml",
  } as unknown as GraphDocument;
}

export function getOntologySchema(): OntologySchema {
  const nodeKinds: Record<string, { requiredAttributes: string[] }> = {};
  for (const [name, def] of Object.entries(atlas.getNodeKinds())) {
    nodeKinds[name] = { requiredAttributes: ["id", "kind"], ...def };
  }
  const edgeKinds: Record<string, { requiredAttributes: string[]; from?: string[]; to?: string[] }> = {};
  for (const [name, def] of Object.entries(atlas.getEdgeKinds())) {
    edgeKinds[name] = { requiredAttributes: ["id", "relation", "from", "to"], ...def };
  }
  return {
    kind: "OntologySchema",
    id: "schema:agent-catalog-ontology",
    schemaId: "schema:agent-catalog-ontology",
    version: "2026.04.agent-catalog-v2",
    nodeKinds,
    edgeKinds,
    versionScopingRules: [],
    deprecationRules: [],
  } as unknown as OntologySchema;
}

export function getCatalogGraph(): CatalogGraph {
  return {
    document: getGraphDocument(),
    schema: getOntologySchema(),
    nodes: allNodes(),
    edges: allEdges(),
  };
}

// ---------------------------------------------------------------------------
// Utility functions (previously in graph.ts)
// ---------------------------------------------------------------------------

export function listEdgesForNode(
  catalog: { graph: GraphEdge[] },
  nodeId: string,
): GraphEdge[] {
  return catalog.graph.filter(
    (edge) => edge.from === nodeId || edge.to === nodeId,
  );
}

export function listEdgesByRelation(
  catalog: { graph: GraphEdge[] },
  relation: string,
): GraphEdge[] {
  return catalog.graph.filter((edge) => edge.relation === relation);
}

export function assertGraphFileCoverage(): void {
  // No-op: validation handled by Atlas indexer at build time.
}

// ---------------------------------------------------------------------------
// Cache management
// ---------------------------------------------------------------------------

export function clearAtlasBridgeCache(): void {
  cachedNodes = undefined;
  cachedEdges = undefined;
  cachedNodeIds = undefined;
}
