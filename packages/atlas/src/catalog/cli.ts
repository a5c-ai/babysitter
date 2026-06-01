import { atlas } from "../index";
import { AGENT_CATALOG, GRAPH_DOCUMENT } from "./data";
import { getNodeById, listGraphEdges, listGraphNodes, listOutgoingTargets } from "./atlas-bridge";
import { effectiveTransportMuxClaimStatus } from "./transport-mux-cutover";
import type { GraphNode, GraphRelationship } from "./models";

export interface CliCatalogRow {
  agent: string;
  version: string;
  providers: string;
  hooks: string;
  capabilities: string;
}

export interface CliCatalogSummary {
  schemaVersion: string;
  graphId: string;
  totalAgents: number;
  totalCapabilities: number;
  totalModelProviders: number;
}

export interface CliGraphNodeRow {
  nodeId: string;
  kind: GraphNode["kind"];
  label: string;
  evidenceIds: string[];
  attributes: Record<string, unknown>;
}

export interface CliGraphEdgeRow {
  edgeId: string;
  relation: string;
  fromNodeId: string;
  fromKind?: GraphNode["kind"];
  fromLabel: string;
  toNodeId: string;
  toKind?: GraphNode["kind"];
  toLabel: string;
  versionRange?: string;
  evidenceIds: string[];
  attributes: Record<string, unknown>;
}

export interface CliNodeRelationRow extends CliGraphEdgeRow {
  direction: "incoming" | "outgoing";
  relatedNodeId: string;
  relatedNodeKind?: GraphNode["kind"];
  relatedLabel: string;
}

export interface CliNodeQuery {
  node: CliGraphNodeRow;
  outgoing: CliNodeRelationRow[];
  incoming: CliNodeRelationRow[];
  claims: CliEvidenceClaimRow[];
  evidenceSources: CliEvidenceSourceRow[];
}

export interface CliEvidenceClaimRow {
  claimId: string;
  subjectKind: string;
  subjectId: string;
  statement: string;
  confidence: string;
  status: string;
  evidenceIds: string[];
  sourceIds: string[];
}

export interface CliEvidenceSourceRow {
  evidenceId: string;
  kind: string;
  sourcePathOrUrl: string;
  locator: string;
  capturedAt: string;
  trustLevel: string;
  claimIds: string[];
}

export interface CliCapabilitySupportRow {
  supportId: string;
  capabilityId: string;
  capabilityLabel: string;
  supportLevel: string;
  subjectKind: string;
  subjectId: string;
  subjectLabel: string;
  versionRange: string;
  notes?: string;
  claimIds: string[];
  sourceIds: string[];
  evidenceIds: string[];
}

export interface CliAgentRelationRow {
  nodeId: string;
  agentId: string;
  displayName: string;
  versionRange: string;
  providerIds: string[];
  modelIds: string[];
  transportIds: string[];
  modalityIds: string[];
  hookIds: string[];
  pluginTargetIds: string[];
  sessionNuanceIds: string[];
  lifecycleNuanceIds: string[];
  evidenceIds: string[];
}

export interface CliPackageRelationRow {
  nodeId: string;
  packageId: string;
  packageName: string;
  workspacePath: string;
  moduleType: string;
  sourceOfTruthRole: string;
  surfaceKinds: string[];
  processIds: string[];
  pathIds: string[];
  paths: string[];
  ciIds: string[];
  graphIds: string[];
  evidenceIds: string[];
}

export interface CliProcessRelationRow {
  nodeId: string;
  processId: string;
  displayName: string;
  category: string;
  ownerPackageId: string;
  pathIds: string[];
  paths: string[];
  inputs: string[];
  outputs: string[];
  evidenceIds: string[];
}

export interface CliGraphEdgeFilter {
  relation?: string;
  fromNodeId?: string;
  toNodeId?: string;
  nodeId?: string;
}

export interface CliNodeRelationFilter {
  nodeId: string;
  direction?: "incoming" | "outgoing" | "both";
  relation?: string;
}

export interface CliEvidenceClaimFilter {
  claimId?: string;
  subjectId?: string;
  subjectKind?: string;
  nodeId?: string;
  evidenceId?: string;
}

export interface CliEvidenceSourceFilter {
  evidenceId?: string;
  claimId?: string;
  nodeId?: string;
}

export interface CliCapabilitySupportFilter {
  supportId?: string;
  capabilityId?: string;
  subjectKind?: string;
  subjectId?: string;
  subjectIdPrefix?: string;
  supportLevel?: string;
  versionRange?: string;
}

function valueAsString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function displayLabel(node: GraphNode | undefined): string {
  if (!node) {
    return "";
  }

  const candidates = [
    node.displayName,
    node.label,
    node.canonicalName,
    node.packageName,
    node.statement,
    node.path,
    node.sourcePathOrUrl,
    node.agentId,
    node.providerId,
    node.modelId,
    node.runtimeId,
    node.modalityId,
    node.hookId,
    node.capabilityId,
    node.processId,
    node.packageId,
    node.pathId,
    node.targetId,
    node.evidenceId,
    node.claimId,
    node.sessionSemanticsId,
    node.lifecycleSemanticsId,
    node.signalId,
    node.mappingId,
    node.artifactId,
    node.id,
  ];

  return candidates.map(valueAsString).find(Boolean) ?? node.id;
}

function toCliGraphNodeRow(node: GraphNode): CliGraphNodeRow {
  const { id, kind, evidenceRefs, ...attributes } = node;
  return {
    nodeId: id,
    kind,
    label: displayLabel(node),
    evidenceIds: stringArray(evidenceRefs),
    attributes,
  };
}

function toCliGraphEdgeRow(edge: GraphRelationship): CliGraphEdgeRow {
  const fromNode = getNodeById(edge.from);
  const toNode = getNodeById(edge.to);
  const { id, relation, from, to, evidenceRefs, ...attributes } = edge;

  return {
    edgeId: id,
    relation,
    fromNodeId: from,
    fromKind: fromNode?.kind,
    fromLabel: displayLabel(fromNode),
    toNodeId: to,
    toKind: toNode?.kind,
    toLabel: displayLabel(toNode),
    versionRange: valueAsString(edge.versionRange) || undefined,
    evidenceIds: stringArray(evidenceRefs),
    attributes,
  };
}

function claimNodesFor(nodeId: string): GraphNode[] {
  const edgeBased = listOutgoingTargets(nodeId, "supported_by_claim").filter((node) => node.kind === "Claim");
  if (edgeBased.length > 0) return edgeBased;

  // Fallback: find Claim nodes whose evidenceIds overlap with the node's evidenceRefs
  const node = getNodeById(nodeId);
  if (!node) return [];
  const evidenceIds = stringArray(node.evidenceRefs);
  if (evidenceIds.length === 0) return [];

  return listGraphNodes()
    .filter((candidate) => candidate.kind === "Claim" && stringArray(candidate.evidenceIds).some((id) => evidenceIds.includes(id)));
}

function sourceNodesForClaim(claimNodeId: string): GraphNode[] {
  const claimNode = getNodeById(claimNodeId);
  const sourceNodes = listOutgoingTargets(claimNodeId, "sourced_from").filter((node) => node.kind === "EvidenceSource");
  if (sourceNodes.length > 0) {
    return sourceNodes;
  }

  return stringArray(claimNode?.evidenceIds)
    .map((evidenceId) => getNodeById(`evidence:${evidenceId}`))
    .filter((node): node is GraphNode => node?.kind === "EvidenceSource");
}

function toCliEvidenceClaimRow(node: GraphNode): CliEvidenceClaimRow {
  const sourceIds = sourceNodesForClaim(node.id).map((source) => valueAsString(source.evidenceId)).filter(Boolean);
  const evidenceIds = stringArray(node.evidenceIds);
  return {
    claimId: valueAsString(node.claimId),
    subjectKind: valueAsString(node.subjectKind),
    subjectId: valueAsString(node.subjectId),
    statement: valueAsString(node.statement),
    confidence: valueAsString(node.confidence),
    status: effectiveTransportMuxClaimStatus(valueAsString(node.status), evidenceIds),
    evidenceIds,
    sourceIds: uniqueStrings(sourceIds),
  };
}

function claimsForEvidence(evidenceId: string): string[] {
  const directClaimIds = listGraphEdges()
    .filter((edge) => edge.relation === "sourced_from" && edge.to === `evidence:${evidenceId}`)
    .map((edge) => {
      const claimNode = getNodeById(edge.from);
      return valueAsString(claimNode?.claimId);
    })
    .filter(Boolean);

  if (directClaimIds.length > 0) {
    return uniqueStrings(directClaimIds);
  }

  return listGraphNodes()
    .filter((node) => node.kind === "Claim" && stringArray(node.evidenceIds).includes(evidenceId))
    .map((node) => valueAsString(node.claimId))
    .filter(Boolean);
}

function toCliEvidenceSourceRow(node: GraphNode): CliEvidenceSourceRow {
  return {
    evidenceId: valueAsString(node.evidenceId),
    kind: valueAsString(node.kindLabel),
    sourcePathOrUrl: valueAsString(node.sourcePathOrUrl),
    locator: valueAsString(node.locator),
    capturedAt: valueAsString(node.capturedAt),
    trustLevel: valueAsString(node.trustLevel),
    claimIds: claimsForEvidence(valueAsString(node.evidenceId)),
  };
}

function capabilityLabel(capabilityId: string): string {
  return displayLabel(getNodeById(`capability:${capabilityId}`)) || capabilityId;
}

function nodeRelationRow(edge: GraphRelationship, direction: "incoming" | "outgoing", nodeId: string): CliNodeRelationRow {
  const row = toCliGraphEdgeRow(edge);
  const relatedNodeId = direction === "outgoing" ? edge.to : edge.from;
  const relatedNode = getNodeById(relatedNodeId);
  return {
    ...row,
    direction,
    relatedNodeId,
    relatedNodeKind: relatedNode?.kind,
    relatedLabel: displayLabel(relatedNode),
  };
}

export function listCliRows(): CliCatalogRow[] {
  return AGENT_CATALOG.agents.map((agent) => ({
    agent: agent.displayName,
    version: agent.versionRange,
    providers: agent.providerIds.join(", "),
    hooks: agent.hookIds.join(", "),
    capabilities: agent.capabilityIds.join(", "),
  }));
}

export function getCliCatalogSummary(): CliCatalogSummary {
  return {
    schemaVersion: GRAPH_DOCUMENT.schemaVersion,
    graphId: GRAPH_DOCUMENT.graphId,
    totalAgents: AGENT_CATALOG.agents.length,
    totalCapabilities: AGENT_CATALOG.capabilities.length,
    totalModelProviders: AGENT_CATALOG.providers.length,
  };
}

export function listCliGraphNodes(kind?: GraphNode["kind"]): CliGraphNodeRow[] {
  return listGraphNodes()
    .filter((node) => !kind || node.kind === kind)
    .map(toCliGraphNodeRow);
}

export function listCliGraphEdges(filter: CliGraphEdgeFilter = {}): CliGraphEdgeRow[] {
  return listGraphEdges()
    .filter((edge) => !filter.relation || edge.relation === filter.relation)
    .filter((edge) => !filter.fromNodeId || edge.from === filter.fromNodeId)
    .filter((edge) => !filter.toNodeId || edge.to === filter.toNodeId)
    .filter((edge) => !filter.nodeId || edge.from === filter.nodeId || edge.to === filter.nodeId)
    .map(toCliGraphEdgeRow);
}

export function listCliNodeRelations(filter: CliNodeRelationFilter): CliNodeRelationRow[] {
  return listGraphEdges()
    .filter((edge) => !filter.relation || edge.relation === filter.relation)
    .filter((edge) => {
      if (filter.direction === "incoming") {
        return edge.to === filter.nodeId;
      }
      if (filter.direction === "outgoing") {
        return edge.from === filter.nodeId;
      }
      return edge.from === filter.nodeId || edge.to === filter.nodeId;
    })
    .map((edge) => nodeRelationRow(edge, edge.from === filter.nodeId ? "outgoing" : "incoming", filter.nodeId));
}

export function getCliNodeQuery(nodeId: string): CliNodeQuery | undefined {
  const node = getNodeById(nodeId);
  if (!node) {
    return undefined;
  }

  return {
    node: toCliGraphNodeRow(node),
    outgoing: listCliNodeRelations({ nodeId, direction: "outgoing" }),
    incoming: listCliNodeRelations({ nodeId, direction: "incoming" }),
    claims: listCliEvidenceClaims({ nodeId }),
    evidenceSources: listCliEvidenceSources({ nodeId }),
  };
}

export function listCliEvidenceClaims(filter: CliEvidenceClaimFilter = {}): CliEvidenceClaimRow[] {
  const nodeIdFilter = filter.nodeId;
  const claims = (nodeIdFilter ? claimNodesFor(nodeIdFilter) : listGraphNodes().filter((node) => node.kind === "Claim")).map(
    toCliEvidenceClaimRow,
  );

  return claims
    .filter((claim) => !filter.claimId || claim.claimId === filter.claimId)
    .filter((claim) => !filter.subjectId || claim.subjectId === filter.subjectId)
    .filter((claim) => !filter.subjectKind || claim.subjectKind === filter.subjectKind)
    .filter((claim) => !filter.evidenceId || claim.sourceIds.includes(filter.evidenceId) || claim.evidenceIds.includes(filter.evidenceId));
}

export function listCliEvidenceSources(filter: CliEvidenceSourceFilter = {}): CliEvidenceSourceRow[] {
  const nodeIdFilter = filter.nodeId;
  const sources = (
    nodeIdFilter
      ? uniqueStrings(claimNodesFor(nodeIdFilter).flatMap((claim) => sourceNodesForClaim(claim.id).map((source) => source.id)))
          .map((nodeId) => getNodeById(nodeId))
          .filter((node): node is GraphNode => Boolean(node))
      : listGraphNodes().filter((node) => node.kind === "EvidenceSource")
  ).map(toCliEvidenceSourceRow);

  return sources
    .filter((source) => !filter.evidenceId || source.evidenceId === filter.evidenceId)
    .filter((source) => !filter.claimId || source.claimIds.includes(filter.claimId));
}

export function listCliCapabilitySupport(filter: CliCapabilitySupportFilter = {}): CliCapabilitySupportRow[] {
  return listGraphNodes()
    .filter((node) => node.kind === "CapabilitySupport")
    .filter((node) => !filter.supportId || valueAsString(node.supportId) === filter.supportId)
    .filter((node) => !filter.capabilityId || valueAsString(node.capabilityId) === filter.capabilityId)
    .filter((node) => !filter.subjectKind || valueAsString(node.subjectKind) === filter.subjectKind)
    .filter((node) => !filter.subjectId || valueAsString(node.subjectId) === filter.subjectId)
    .filter((node) => !filter.subjectIdPrefix || valueAsString(node.subjectId).startsWith(filter.subjectIdPrefix))
    .filter((node) => !filter.supportLevel || valueAsString(node.supportLevel) === filter.supportLevel)
    .filter((node) => !filter.versionRange || valueAsString(node.versionRange) === filter.versionRange)
    .map((node) => {
      const claimRows = listCliEvidenceClaims({ nodeId: node.id });
      const subjectNode = getNodeById(valueAsString(node.subjectId));
      const sourceIds = uniqueStrings(claimRows.flatMap((claim) => claim.sourceIds));
      return {
        supportId: valueAsString(node.supportId),
        capabilityId: valueAsString(node.capabilityId),
        capabilityLabel: capabilityLabel(valueAsString(node.capabilityId)),
        supportLevel: valueAsString(node.supportLevel),
        subjectKind: valueAsString(node.subjectKind),
        subjectId: valueAsString(node.subjectId),
        subjectLabel: displayLabel(subjectNode),
        versionRange: valueAsString(node.versionRange),
        notes: valueAsString(node.notes) || undefined,
        claimIds: claimRows.map((claim) => claim.claimId),
        sourceIds,
        evidenceIds: uniqueStrings([...stringArray(node.evidenceRefs), ...claimRows.flatMap((claim) => claim.evidenceIds), ...sourceIds]),
      };
    });
}

export function listCliAgentRelations(agentId?: string): CliAgentRelationRow[] {
  return listGraphNodes()
    .filter((node) => node.kind === "AgentVersion")
    .filter((node) => !agentId || valueAsString(node.agentId) === agentId)
    .map((node) => {
      const matchingAgent = AGENT_CATALOG.agents.find(
        (agent) => agent.agentId === valueAsString(node.agentId) && agent.versionRange === valueAsString(node.versionRange),
      );

      return {
        nodeId: node.id,
        agentId: valueAsString(node.agentId),
        displayName: valueAsString(node.displayName),
        versionRange: valueAsString(node.versionRange),
        providerIds: matchingAgent?.providerIds ?? [],
        modelIds: matchingAgent?.modelIds ?? [],
        transportIds: matchingAgent?.transportIds ?? [],
        modalityIds: matchingAgent?.modalityIds ?? [],
        hookIds: matchingAgent?.hookIds ?? [],
        pluginTargetIds: matchingAgent?.pluginTargetIds ?? [],
        sessionNuanceIds: matchingAgent?.sessionNuanceIds ?? [],
        lifecycleNuanceIds: matchingAgent?.lifecycleNuanceIds ?? [],
        evidenceIds: uniqueStrings([...(matchingAgent?.evidenceIds ?? []), ...stringArray(node.evidenceRefs)]),
      };
    });
}

export function listCliPackageRelations(packageId?: string): CliPackageRelationRow[] {
  return listGraphNodes()
    .filter((node) => node.kind === "PackageSurface")
    .filter((node) => !packageId || valueAsString(node.packageId) === packageId)
    .map((node) => {
      const processes = listOutgoingTargets(node.id, "surfaces_process");
      const paths = listOutgoingTargets(node.id, "references_path");
      const ciSurfaces = listOutgoingTargets(node.id, "validated_by_ci");
      const graphIds = atlas.getOutgoing(node.id)
        .filter((edge) => edge.kind === "wraps_graph")
        .map((edge) => edge.to);
      return {
        nodeId: node.id,
        packageId: valueAsString(node.packageId),
        packageName: valueAsString(node.packageName),
        workspacePath: valueAsString(node.workspacePath),
        moduleType: valueAsString(node.moduleType),
        sourceOfTruthRole: valueAsString(node.sourceOfTruthRole),
        surfaceKinds: stringArray(node.surfaceKinds),
        processIds: processes.map((process) => valueAsString(process.processId)).filter(Boolean),
        pathIds: paths.map((pathNode) => valueAsString(pathNode.pathId)).filter(Boolean),
        paths: paths.map((pathNode) => valueAsString(pathNode.path)).filter(Boolean),
        ciIds: ciSurfaces.map((ci) => valueAsString(ci.ciId)).filter(Boolean),
        graphIds: uniqueStrings(graphIds),
        evidenceIds: stringArray(node.evidenceRefs),
      };
    });
}

export function listCliProcessRelations(processId?: string): CliProcessRelationRow[] {
  return listGraphNodes()
    .filter((node) => node.kind === "ProcessDescriptor")
    .filter((node) => !processId || valueAsString(node.processId) === processId)
    .map((node) => {
      const paths = listOutgoingTargets(node.id, "references_path");
      return {
        nodeId: node.id,
        processId: valueAsString(node.processId),
        displayName: valueAsString(node.displayName),
        category: valueAsString(node.category),
        ownerPackageId: valueAsString(node.ownerPackage),
        pathIds: paths.map((pathNode) => valueAsString(pathNode.pathId)).filter(Boolean),
        paths: paths.map((pathNode) => valueAsString(pathNode.path)).filter(Boolean),
        inputs: stringArray(node.inputs),
        outputs: stringArray(node.outputs),
        evidenceIds: stringArray(node.evidenceRefs),
      };
    });
}
