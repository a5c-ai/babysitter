import {
  AGENT_CATALOG,
  CAPABILITY_ASSERTIONS,
  CLAIMS,
  FALLBACK_METADATA,
  GRAPH_DOCUMENT,
  HARNESS_IMAGES,
  HOOKS,
  HOOKS_MUX_DETECTION_RULES,
  HOST_DETECTION_RULES,
  HOST_METADATA_FIELDS,
  HOST_SIGNAL_MAP,
  ONTOLOGY_SCHEMA,
  PLUGIN_TARGETS,
} from "./data";
import { getCatalogGraph, listGraphNodes, listRelationshipsByRelation } from "./graph";
import type {
  AgentCapabilitySupportMatrix,
  AgentCatalog,
  AgentOntologyDetail,
  AgentOntologyEvidenceSummary,
  AgentOntologyListItem,
  AgentVersionReference,
  AgentProductDescriptor,
  AgentVersion,
  CapabilityAssertion,
  AgentVersionTopology,
  CapabilityDescriptor,
  CapabilitySupportRecord,
  CatalogGraph,
  ClaimRecord,
  CiSurfaceDescriptor,
  DiscoverySignalDescriptor,
  GraphNode,
  GraphRelationship,
  HarnessFallbackMetadata,
  HarnessImageEntry,
  HookDescriptor,
  HookMappingDescriptor,
  HooksMuxDetectionRule,
  HostDetectionRule,
  HostMetadataField,
  LifecycleNuance,
  ModelFamilyDescriptor,
  ModelProviderProductDescriptor,
  ModelProviderVersion,
  ModelVersion,
  ModalityDescriptor,
  OntologySchema,
  PackageSurfaceDescriptor,
  PackageTopology,
  PathDescriptorRecord,
  PluginTargetDescriptor,
  ProcessDescriptor,
  ProviderModelTopology,
  SessionNuance,
  TransportDescriptor,
  TransportProtocolDescriptor,
  UiAgentCard,
} from "./models";

const HARNESS_ALIASES: Record<string, string> = {
  claude: "claude-code",
  "claude-code": "claude-code",
  codex: "codex",
  cursor: "cursor",
  gemini: "gemini-cli",
  "gemini-cli": "gemini-cli",
  copilot: "github-copilot",
  "github-copilot": "github-copilot",
  omp: "oh-my-pi",
  "oh-my-pi": "oh-my-pi",
  opencode: "opencode",
  openclaw: "openclaw",
  pi: "pi",
};

const GRAPH = getCatalogGraph();
const NODE_BY_ID = new Map(GRAPH.nodes.map((node) => [node.id, node] as const));
const OUTGOING_BY_NODE = groupEdgesBy(GRAPH.edges, "from");
const INCOMING_BY_NODE = groupEdgesBy(GRAPH.edges, "to");

const AGENT_BY_KEY = new Map(AGENT_CATALOG.agents.map((agent) => [versionKey(agent.agentId, agent.versionRange), agent] as const));
const PROVIDER_VERSION_BY_KEY = new Map(
  AGENT_CATALOG.providers.map((provider) => [versionKey(provider.providerId, provider.versionRange), provider] as const),
);
const MODEL_VERSION_BY_KEY = new Map(
  AGENT_CATALOG.models.map((model) => [versionKey(model.modelId, model.versionRange), model] as const),
);
const TRANSPORT_BY_ID = new Map(AGENT_CATALOG.transports.map((transport) => [transport.transportId, transport] as const));
const CAPABILITY_BY_ID = new Map(AGENT_CATALOG.capabilities.map((capability) => [capability.capabilityId, capability] as const));
const MODALITY_BY_ID = new Map(AGENT_CATALOG.modalities.map((modality) => [modality.modalityId, modality] as const));
const SESSION_BY_ID = new Map(AGENT_CATALOG.sessionNuances.map((nuance) => [nuance.nuanceId, nuance] as const));
const LIFECYCLE_BY_ID = new Map(
  AGENT_CATALOG.lifecycleNuances.map((nuance) => [nuance.nuanceId, nuance] as const),
);
const HOOK_BY_ID = new Map(HOOKS.map((hook) => [hook.hookId, hook] as const));
const PLUGIN_TARGET_BY_ID = new Map(PLUGIN_TARGETS.map((target) => [target.targetId, target] as const));

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const AGENT_FILE_PATH = "packages/agent-catalog/graph/nodes/agents/versions.yaml";
const AGENT_DIRECTORY = "packages/agent-catalog/graph";

function slugifyVersionRange(versionRange: string): string {
  return slugify(versionRange);
}

function agentVersionNodeId(agent: Pick<AgentVersion, "agentId" | "versionRange">): string {
  return `agentVersion:${agent.agentId}:${slugifyVersionRange(agent.versionRange)}`;
}

function orderedByIds<T>(ids: string[], items: T[], getId: (item: T) => string): T[] {
  const byId = new Map(items.map((item) => [getId(item), item]));
  return ids.map((id) => byId.get(id)).filter((item): item is T => Boolean(item));
}

function findProviderVersions(agent: AgentVersion): ModelProviderVersion[] {
  return orderedByIds(
    agent.providerIds,
    AGENT_CATALOG.providers.filter((provider) => agent.providerIds.includes(provider.providerId)),
    (provider) => provider.providerId,
  );
}

function findModelVersions(agent: AgentVersion): ModelVersion[] {
  return orderedByIds(
    agent.modelIds,
    AGENT_CATALOG.models.filter((model) => agent.modelIds.includes(model.modelId)),
    (model) => model.modelId,
  );
}

function findTransports(agent: AgentVersion): TransportDescriptor[] {
  return orderedByIds(
    agent.transportIds,
    AGENT_CATALOG.transports.filter((transport) => agent.transportIds.includes(transport.transportId)),
    (transport) => transport.transportId,
  );
}

function findModalities(agent: AgentVersion): ModalityDescriptor[] {
  return orderedByIds(
    agent.modalityIds,
    AGENT_CATALOG.modalities.filter((modality) => agent.modalityIds.includes(modality.modalityId)),
    (modality) => modality.modalityId,
  );
}

function findCapabilities(agent: AgentVersion): CapabilityDescriptor[] {
  return orderedByIds(
    agent.capabilityIds,
    AGENT_CATALOG.capabilities.filter((capability) => agent.capabilityIds.includes(capability.capabilityId)),
    (capability) => capability.capabilityId,
  );
}

function groupEdgesBy(edges: GraphRelationship[], key: "from" | "to"): Map<string, GraphRelationship[]> {
  const grouped = new Map<string, GraphRelationship[]>();
  for (const edge of edges) {
    const bucket = grouped.get(edge[key]);
    if (bucket) {
      bucket.push(edge);
      continue;
    }
    grouped.set(edge[key], [edge]);
  }
  return grouped;
}

function valueAsString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function nodeEvidenceIds(node: GraphNode | undefined): string[] {
  return node ? stringArray(node.evidenceRefs) : [];
}

function versionKey(subjectId: string, versionRange: string): string {
  return `${subjectId}@@${versionRange}`;
}

function normalizeLookup(value: string): string {
  return value.trim().toLowerCase();
}

function sortStrings(values: string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function uniqueBy<T>(values: T[], key: (value: T) => string): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];
  for (const value of values) {
    const nextKey = key(value);
    if (seen.has(nextKey)) {
      continue;
    }
    seen.add(nextKey);
    unique.push(value);
  }
  return unique;
}

function getNode(nodeId: string): GraphNode | undefined {
  return NODE_BY_ID.get(nodeId);
}

function outgoingEdges(nodeId: string, relation?: string): GraphRelationship[] {
  const edges = OUTGOING_BY_NODE.get(nodeId) ?? [];
  return relation ? edges.filter((edge) => edge.relation === relation) : edges;
}

function incomingEdges(nodeId: string, relation?: string): GraphRelationship[] {
  const edges = INCOMING_BY_NODE.get(nodeId) ?? [];
  return relation ? edges.filter((edge) => edge.relation === relation) : edges;
}

function outgoingNodes(nodeId: string, relation?: string): GraphNode[] {
  return outgoingEdges(nodeId, relation)
    .map((edge) => getNode(edge.to))
    .filter((node): node is GraphNode => Boolean(node));
}

function incomingNodes(nodeId: string, relation?: string): GraphNode[] {
  return incomingEdges(nodeId, relation)
    .map((edge) => getNode(edge.from))
    .filter((node): node is GraphNode => Boolean(node));
}

function toAgentProduct(node: GraphNode): AgentProductDescriptor {
  return {
    agentId: valueAsString(node.agentId),
    displayName: valueAsString(node.displayName),
    aliases: stringArray(node.aliases),
    vendor: valueAsString(node.vendor),
    families: stringArray(node.families),
    status: valueAsString(node.status),
    evidenceIds: nodeEvidenceIds(node),
  };
}

function toModelProviderProduct(node: GraphNode): ModelProviderProductDescriptor {
  const homepage = valueAsString(node.homepage);
  return {
    providerId: valueAsString(node.providerId),
    displayName: valueAsString(node.displayName),
    kindLabel: valueAsString(node.kindLabel),
    vendor: valueAsString(node.vendor),
    homepage: homepage || null,
    apiFamilies: stringArray(node.apiFamilies),
    authKinds: stringArray(node.authKinds),
    evidenceIds: nodeEvidenceIds(node),
  };
}

function toModelFamily(node: GraphNode): ModelFamilyDescriptor {
  return {
    modelId: valueAsString(node.modelId),
    providerId: valueAsString(node.providerId),
    label: valueAsString(node.label),
    modalities: stringArray(node.modalities),
    reasoningFamily: valueAsString(node.reasoningFamily) || undefined,
    status: valueAsString(node.status),
    evidenceIds: nodeEvidenceIds(node),
  };
}

function toTransportProtocol(node: GraphNode): TransportProtocolDescriptor {
  return {
    transportId: valueAsString(node.transportId),
    label: valueAsString(node.label),
    protocolKind: valueAsString(node.protocolKind),
    interactive: Boolean(node.interactive),
    streaming: Boolean(node.streaming),
    requestShape: valueAsString(node.requestShape),
    responseShape: valueAsString(node.responseShape),
    evidenceIds: nodeEvidenceIds(node),
  };
}

function toCapabilitySupport(node: GraphNode): CapabilitySupportRecord {
  return {
    supportId: valueAsString(node.supportId),
    capabilityId: valueAsString(node.capabilityId),
    supportLevel: valueAsString(node.supportLevel),
    subjectKind: (valueAsString(node.subjectKind) as CapabilitySupportRecord["subjectKind"]) || "AgentVersion",
    subjectId: valueAsString(node.subjectId),
    versionRange: valueAsString(node.versionRange),
    notes: valueAsString(node.notes) || undefined,
    evidenceIds: nodeEvidenceIds(node),
  };
}

function toHookMapping(node: GraphNode): HookMappingDescriptor {
  return {
    mappingId: valueAsString(node.mappingId),
    hookId: valueAsString(node.hookId),
    targetId: valueAsString(node.targetId),
    nativeName: valueAsString(node.nativeName),
    versionRange: valueAsString(node.versionRange),
    requiresRuntimeHooks: Boolean(node.requiresRuntimeHooks),
    evidenceIds: nodeEvidenceIds(node),
  };
}

function toDiscoverySignal(node: GraphNode): DiscoverySignalDescriptor {
  return {
    signalId: valueAsString(node.signalId),
    signalKind: valueAsString(node.signalKind),
    key: valueAsString(node.key),
    matchMode: valueAsString(node.matchMode),
    confidence: (valueAsString(node.confidence) as DiscoverySignalDescriptor["confidence"]) || "low",
    scope: valueAsString(node.scope),
    signals: stringArray(node.signals),
    absentSignals: stringArray(node.absentSignals),
    argvMatches: stringArray(node.argvMatches),
    metadataFields: (Array.isArray(node.metadataFields) ? node.metadataFields : []).map((field) => ({
      key: valueAsString((field as HostMetadataField).key),
      envVars: stringArray((field as HostMetadataField).envVars),
    })),
    evidenceIds: nodeEvidenceIds(node),
  };
}

function toPackageSurface(node: GraphNode): PackageSurfaceDescriptor {
  return {
    packageId: valueAsString(node.packageId),
    packageName: valueAsString(node.packageName),
    workspacePath: valueAsString(node.workspacePath),
    moduleType: valueAsString(node.moduleType),
    surfaceKinds: stringArray(node.surfaceKinds),
    sourceOfTruthRole: valueAsString(node.sourceOfTruthRole),
    evidenceIds: nodeEvidenceIds(node),
  };
}

function toPathDescriptor(node: GraphNode): PathDescriptorRecord {
  return {
    pathId: valueAsString(node.pathId),
    path: valueAsString(node.path),
    pathKind: valueAsString(node.pathKind),
    ownerKind: valueAsString(node.ownerKind),
    ownerId: valueAsString(node.ownerId),
    platform: valueAsString(node.platform),
    notes: valueAsString(node.notes) || undefined,
    evidenceIds: nodeEvidenceIds(node),
  };
}

function toCiSurface(node: GraphNode): CiSurfaceDescriptor {
  return {
    ciId: valueAsString(node.ciId),
    packageId: valueAsString(node.packageId),
    scripts: stringArray(node.scripts),
    publishStrategy: valueAsString(node.publishStrategy),
    releaseChannels: stringArray(node.releaseChannels),
    validationCommands: stringArray(node.validationCommands),
    evidenceIds: nodeEvidenceIds(node),
  };
}

function slugify(versionRange: string): string {
  return versionRange
    .replace(/>=/g, "ge-")
    .replace(/<=/g, "le-")
    .replace(/>/g, "gt-")
    .replace(/</g, "lt-")
    .replace(/=/g, "eq-")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function parseVersion(version: string): number[] | undefined {
  const match = version.trim().match(/^v?(\d+(?:\.\d+)*)/);
  if (!match) {
    return undefined;
  }
  return match[1].split(".").map((part) => Number.parseInt(part, 10));
}

function compareVersions(left: number[], right: number[]): number {
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = left[index] ?? 0;
    const rightPart = right[index] ?? 0;
    if (leftPart !== rightPart) {
      return leftPart < rightPart ? -1 : 1;
    }
  }
  return 0;
}

function rangeLowerBound(range: string): number[] {
  const tokens = range.split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    const match = token.match(/^(>=|>|=)?(.+)$/);
    if (!match) {
      continue;
    }
    const comparator = match[1] ?? "=";
    if (!["=", ">=", ">"].includes(comparator)) {
      continue;
    }
    const parsed = parseVersion(match[2]);
    if (parsed) {
      return parsed;
    }
  }
  return [0, 0, 0];
}

function satisfiesVersion(version: string, range: string): boolean {
  const parsedVersion = parseVersion(version);
  if (!parsedVersion) {
    return false;
  }
  const tokens = range.split(/\s+/).filter(Boolean);
  return tokens.every((token) => {
    const match = token.match(/^(>=|<=|>|<|=)?(.+)$/);
    if (!match) {
      return false;
    }
    const comparator = match[1] ?? "=";
    const parsedTarget = parseVersion(match[2]);
    if (!parsedTarget) {
      return false;
    }
    const comparison = compareVersions(parsedVersion, parsedTarget);
    switch (comparator) {
      case ">":
        return comparison > 0;
      case ">=":
        return comparison >= 0;
      case "<":
        return comparison < 0;
      case "<=":
        return comparison <= 0;
      case "=":
      default:
        return comparison === 0;
    }
  });
}

function sortVersionScopedNodes<TNode extends GraphNode>(nodes: TNode[]): TNode[] {
  return [...nodes].sort((left, right) => {
    const leftBound = rangeLowerBound(valueAsString(left.versionRange));
    const rightBound = rangeLowerBound(valueAsString(right.versionRange));
    const comparison = compareVersions(rightBound, leftBound);
    if (comparison !== 0) {
      return comparison;
    }
    return left.id.localeCompare(right.id);
  });
}

function agentVersionNodes(agentIdOrAlias: string): GraphNode[] {
  const normalized = normalizeLookup(agentIdOrAlias);
  const products = GRAPH.nodes.filter(
    (node) =>
      node.kind === "AgentProduct" &&
      (
        valueAsString(node.agentId).toLowerCase() === normalized ||
        valueAsString(node.displayName).toLowerCase() === normalized ||
        stringArray(node.aliases).some((alias) => alias.toLowerCase() === normalized)
      ),
  );

  const versionNodes = uniqueBy(
    [
      ...products.flatMap((product) => outgoingNodes(product.id, "has_version").filter((node) => node.kind === "AgentVersion")),
      ...GRAPH.nodes.filter(
        (node) =>
          node.kind === "AgentVersion" &&
          (
            valueAsString(node.agentId).toLowerCase() === normalized ||
            valueAsString(node.displayName).toLowerCase() === normalized ||
            stringArray(node.aliases).some((alias) => alias.toLowerCase() === normalized)
          ),
      ),
    ],
    (node) => node.id,
  );

  return sortVersionScopedNodes(versionNodes);
}

function resolveVersionNode(nodes: GraphNode[], selector?: string): GraphNode | undefined {
  if (nodes.length === 0) {
    return undefined;
  }
  if (!selector) {
    return sortVersionScopedNodes(nodes)[0];
  }

  const normalizedSelector = normalizeLookup(selector);
  const direct = nodes.find(
    (node) =>
      normalizeLookup(node.id) === normalizedSelector ||
      normalizeLookup(valueAsString(node.versionRange)) === normalizedSelector ||
      normalizeLookup(valueAsString(node.agentVersionId)) === normalizedSelector,
  );
  if (direct) {
    return direct;
  }

  const semanticMatches = nodes.filter((node) => satisfiesVersion(selector, valueAsString(node.versionRange)));
  return sortVersionScopedNodes(semanticMatches)[0];
}

function typedAgentVersionFromNode(node: GraphNode): AgentVersion | undefined {
  return AGENT_BY_KEY.get(versionKey(valueAsString(node.agentId), valueAsString(node.versionRange)));
}

function typedProviderVersionFromNode(node: GraphNode): ModelProviderVersion | undefined {
  return PROVIDER_VERSION_BY_KEY.get(versionKey(valueAsString(node.providerId), valueAsString(node.versionRange)));
}

function typedModelVersionFromNode(node: GraphNode): ModelVersion | undefined {
  return MODEL_VERSION_BY_KEY.get(versionKey(valueAsString(node.modelId), valueAsString(node.versionRange)));
}

function typedTransportFromNode(node: GraphNode): TransportDescriptor | undefined {
  return TRANSPORT_BY_ID.get(valueAsString(node.runtimeId));
}

function typedCapabilityFromNode(node: GraphNode): CapabilityDescriptor | undefined {
  return CAPABILITY_BY_ID.get(valueAsString(node.capabilityId));
}

function typedModalityFromNode(node: GraphNode): ModalityDescriptor | undefined {
  return MODALITY_BY_ID.get(valueAsString(node.modalityId));
}

function typedSessionFromNode(node: GraphNode): SessionNuance | undefined {
  return SESSION_BY_ID.get(valueAsString(node.sessionSemanticsId));
}

function typedLifecycleFromNode(node: GraphNode): LifecycleNuance | undefined {
  return LIFECYCLE_BY_ID.get(valueAsString(node.lifecycleSemanticsId));
}

function typedHookFromNode(node: GraphNode): HookDescriptor | undefined {
  return HOOK_BY_ID.get(valueAsString(node.hookId));
}

function typedPluginTargetFromNode(node: GraphNode): PluginTargetDescriptor | undefined {
  return PLUGIN_TARGET_BY_ID.get(valueAsString(node.targetId));
}

function capabilitySupportNodesForSubject(subjectId: string): GraphNode[] {
  return outgoingNodes(subjectId, "supports_capability").filter((node) => node.kind === "CapabilitySupport");
}

function capabilitySupportForSubject(subjectId: string): CapabilitySupportRecord[] {
  return capabilitySupportNodesForSubject(subjectId).map(toCapabilitySupport);
}

function capabilitiesForSupportNodes(nodes: GraphNode[]): CapabilityDescriptor[] {
  return uniqueBy(
    nodes
      .flatMap((node) => outgoingNodes(node.id, "for_capability"))
      .filter((node): node is GraphNode => node.kind === "Capability")
      .map((node) => typedCapabilityFromNode(node))
      .filter((capability): capability is CapabilityDescriptor => Boolean(capability)),
    (capability) => capability.capabilityId,
  );
}

function findHooks(agent: AgentVersion): HookDescriptor[] {
  return orderedByIds(
    agent.hookIds,
    AGENT_CATALOG.hooks.filter((hook) => agent.hookIds.includes(hook.hookId)),
    (hook) => hook.hookId,
  );
}

function findPluginTargets(agent: AgentVersion): PluginTargetDescriptor[] {
  return orderedByIds(
    agent.pluginTargetIds,
    PLUGIN_TARGETS.filter((target) => agent.pluginTargetIds.includes(target.targetId)),
    (target) => target.targetId,
  );
}

function findSessionSemantics(agent: AgentVersion): SessionNuance[] {
  return orderedByIds(
    agent.sessionNuanceIds,
    AGENT_CATALOG.sessionNuances.filter((nuance) => agent.sessionNuanceIds.includes(nuance.nuanceId)),
    (nuance) => nuance.nuanceId,
  );
}

function findLifecycleSemantics(agent: AgentVersion): LifecycleNuance[] {
  return orderedByIds(
    agent.lifecycleNuanceIds,
    AGENT_CATALOG.lifecycleNuances.filter((nuance) => agent.lifecycleNuanceIds.includes(nuance.nuanceId)),
    (nuance) => nuance.nuanceId,
  );
}

function findCapabilityMatrix(agent: AgentVersion): CapabilityAssertion[] {
  const subjectId = agentVersionNodeId(agent);
  return CAPABILITY_ASSERTIONS.filter(
    (assertion) => assertion.subjectKind === "AgentVersion" && assertion.subjectId === subjectId,
  );
}

function findClaims(agent: AgentVersion, capabilityMatrix: CapabilityAssertion[]): ClaimRecord[] {
  const claimMap = new Map<string, ClaimRecord>();

  for (const assertion of capabilityMatrix) {
    for (const claim of assertion.supportingClaims) {
      claimMap.set(claim.claimId, claim);
    }
  }

  for (const claim of CLAIMS) {
    if (claim.subjectKind === "AgentVersion" && claim.subjectId === agentVersionNodeId(agent)) {
      claimMap.set(claim.claimId, claim);
    }
    if (agent.evidenceIds.includes(claim.claimId)) {
      claimMap.set(claim.claimId, claim);
    }
  }

  return Array.from(claimMap.values());
}

function findEvidence(agent: AgentVersion, capabilityMatrix: CapabilityAssertion[], claims: ClaimRecord[]) {
  const evidenceIds = new Set<string>([
    ...agent.evidenceIds,
    ...capabilityMatrix.flatMap((assertion) => assertion.evidenceIds),
    ...claims.flatMap((claim) => claim.evidenceIds),
  ]);

  return AGENT_CATALOG.evidence.filter((evidence) => evidenceIds.has(evidence.evidenceId));
}

function buildEvidenceSummary(
  capabilityMatrix: CapabilityAssertion[],
  claims: ClaimRecord[],
  evidenceCount: number,
): AgentOntologyEvidenceSummary {
  return {
    evidenceCount,
    claimCount: claims.length,
    corroboratedCount: capabilityMatrix.filter((assertion) => assertion.evidenceStrength === "corroborated").length,
    partialCount: capabilityMatrix.filter((assertion) => assertion.evidenceStrength === "partial").length,
    inferredCount: capabilityMatrix.filter((assertion) => assertion.evidenceStrength === "inferred").length,
    unresolvedGapCount: new Set(capabilityMatrix.flatMap((assertion) => assertion.unresolvedGaps)).size,
  };
}

function toAgentReference(agent: AgentVersion): AgentVersionReference {
  return {
    id: agentVersionNodeId(agent),
    slug: getAgentVersionSlug(agent),
    agentId: agent.agentId,
    name: agent.displayName,
    versionRange: agent.versionRange,
  };
}

function buildOntologyListItem(agent: AgentVersion): AgentOntologyListItem {
  const capabilityMatrix = findCapabilityMatrix(agent);
  const claims = findClaims(agent, capabilityMatrix);
  const evidence = findEvidence(agent, capabilityMatrix, claims);

  return {
    ...toAgentReference(agent),
    aliases: agent.aliases,
    runtimeFamily: agent.runtimeFamily,
    releaseChannel: agent.releaseChannel,
    since: agent.since,
    until: agent.until,
    osSupport: agent.osSupport,
    description: agent.summary,
    sourcePackage: agent.sourcePackage,
    providers: findProviderVersions(agent),
    models: findModelVersions(agent),
    transports: findTransports(agent),
    modalities: findModalities(agent),
    capabilities: findCapabilities(agent),
    hooks: findHooks(agent),
    pluginTargets: findPluginTargets(agent),
    sessionSemantics: findSessionSemantics(agent),
    lifecycleSemantics: findLifecycleSemantics(agent),
    evidenceSummary: buildEvidenceSummary(capabilityMatrix, claims, evidence.length),
    filePath: AGENT_FILE_PATH,
    directory: AGENT_DIRECTORY,
  };
}

function getRelatedVersionReferences(agent: AgentVersion, relation: "supersedes", direction: "from" | "to") {
  const currentNodeId = agentVersionNodeId(agent);
  const matchingIds = listRelationshipsByRelation(relation)
    .filter((edge) => (direction === "from" ? edge.from === currentNodeId : edge.to === currentNodeId))
    .map((edge) => (direction === "from" ? edge.to : edge.from));

  return AGENT_CATALOG.agents
    .filter((candidate) => matchingIds.includes(agentVersionNodeId(candidate)))
    .map(toAgentReference);
}

function productNodeForVersionNode(versionNodeId: string): GraphNode | undefined {
  return incomingNodes(versionNodeId, "has_version")[0];
}

export function getCatalogGraphSnapshot(): CatalogGraph {
  return clone(getCatalogGraph());
}

export function getCatalogGraphDocument() {
  return clone(GRAPH_DOCUMENT);
}

export function getCatalogOntologySchema(): OntologySchema {
  return clone(ONTOLOGY_SCHEMA);
}

export function getAgentCatalog(): AgentCatalog {
  return clone(AGENT_CATALOG);
}

export function listCatalogClaims(): ClaimRecord[] {
  return clone(CLAIMS);
}

export function getCapabilitySupportAssertions(): CapabilityAssertion[] {
  return clone(CAPABILITY_ASSERTIONS);
}

export function listAgentVersions(): AgentVersion[] {
  return clone(AGENT_CATALOG.agents);
}

export function getAgentVersions(agentIdOrAlias: string): AgentVersion[] {
  return agentVersionNodes(agentIdOrAlias)
    .map((node) => typedAgentVersionFromNode(node))
    .filter((agent): agent is AgentVersion => Boolean(agent))
    .map(clone);
}

export function getAgentVersion(agentIdOrAlias: string, versionSelector?: string): AgentVersion | undefined {
  const node = resolveVersionNode(agentVersionNodes(agentIdOrAlias), versionSelector);
  const agent = node ? typedAgentVersionFromNode(node) : undefined;
  return agent ? clone(agent) : undefined;
}

export function listOntologyNodesByKind(kind: GraphNode["kind"]): GraphNode[] {
  return clone(listGraphNodes().filter((node) => node.kind === kind));
}

export function listOntologyRelations(relation: string) {
  return clone(listRelationshipsByRelation(relation));
}

export function listCapabilitySupportForSubject(subjectId: string): CapabilitySupportRecord[] {
  return capabilitySupportForSubject(subjectId).map(clone);
}

export function listCapabilitySupportByAgentVersion(agentIdOrAlias: string): AgentCapabilitySupportMatrix[] {
  return getAgentVersions(agentIdOrAlias).map((agent) => {
    const nodeId = `agentVersion:${agent.agentId}:${slugify(agent.versionRange)}`;
    const supportNodes = capabilitySupportNodesForSubject(nodeId);
    return {
      agent,
      capabilitySupport: supportNodes.map(toCapabilitySupport),
      capabilities: capabilitiesForSupportNodes(supportNodes),
    };
  }).map(clone);
}

export function getCapabilitySupportForAgentVersion(
  agentIdOrAlias: string,
  versionSelector?: string,
): CapabilitySupportRecord[] {
  const agentNode = resolveVersionNode(agentVersionNodes(agentIdOrAlias), versionSelector);
  return agentNode ? capabilitySupportForSubject(agentNode.id).map(clone) : [];
}

export function supportsAgentCapability(
  agentIdOrAlias: string,
  capabilityId: string,
  versionSelector?: string,
): boolean {
  return getCapabilitySupportForAgentVersion(agentIdOrAlias, versionSelector).some(
    (record) => record.capabilityId === capabilityId,
  );
}

export function getAgentVersionTopology(agentIdOrAlias: string, versionSelector?: string): AgentVersionTopology | undefined {
  const agentNode = resolveVersionNode(agentVersionNodes(agentIdOrAlias), versionSelector);
  const agent = agentNode ? typedAgentVersionFromNode(agentNode) : undefined;
  if (!agentNode || !agent) {
    return undefined;
  }

  const productNode = productNodeForVersionNode(agentNode.id);
  const supportNodes = capabilitySupportNodesForSubject(agentNode.id);
  const defaultModelNodes = outgoingNodes(agentNode.id, "defaults_to_model").filter((node) => node.kind === "ModelVersion");
  const providerVersionNodes = uniqueBy(
    defaultModelNodes.flatMap((node) => outgoingNodes(node.id, "provided_by").filter((candidate) => candidate.kind === "ModelProviderVersion")),
    (node) => node.id,
  );
  const providerNodes = uniqueBy(
    providerVersionNodes.flatMap((node) => incomingNodes(node.id, "has_version").filter((candidate) => candidate.kind === "ModelProviderProduct")),
    (node) => node.id,
  );
  const transportRuntimeNodes = outgoingNodes(agentNode.id, "uses_transport").filter((node) => node.kind === "TransportRuntime");
  const transportProtocolNodes = uniqueBy(
    outgoingNodes(agentNode.id, "uses_transport").filter((node) => node.kind === "TransportProtocol"),
    (node) => node.id,
  );
  const modalityNodes = outgoingNodes(agentNode.id, "supports_modality").filter((node) => node.kind === "Modality");
  const sessionNodes = outgoingNodes(agentNode.id, "uses_session_semantics").filter((node) => node.kind === "SessionSemantics");
  const lifecycleNodes = outgoingNodes(agentNode.id, "uses_lifecycle_semantics").filter((node) => node.kind === "LifecycleSemantics");
  const discoveryNodes = outgoingNodes(agentNode.id, "discovered_by").filter((node) => node.kind === "DiscoverySignal");
  const hookMappingNodes = outgoingNodes(agentNode.id, "emits_hook").filter((node) => node.kind === "HookMapping");
  const hookNodes = uniqueBy(
    hookMappingNodes.flatMap((node) => outgoingNodes(node.id, "maps_hook").filter((candidate) => candidate.kind === "HookSurface")),
    (node) => node.id,
  );
  const pluginTargetNodes = outgoingNodes(agentNode.id, "targets_plugin_surface").filter((node) => node.kind === "PluginTarget");

  return clone({
    agent,
    product: productNode?.kind === "AgentProduct" ? toAgentProduct(productNode) : undefined,
    capabilitySupport: supportNodes.map(toCapabilitySupport),
    capabilities: capabilitiesForSupportNodes(supportNodes),
    defaultModels: defaultModelNodes
      .map((node) => typedModelVersionFromNode(node))
      .filter((model): model is ModelVersion => Boolean(model)),
    modelFamilies: uniqueBy(
      defaultModelNodes
        .flatMap((node) => incomingNodes(node.id, "has_version").filter((candidate) => candidate.kind === "ModelFamily"))
        .map(toModelFamily),
      (model) => model.modelId,
    ),
    providerVersions: providerVersionNodes
      .map((node) => typedProviderVersionFromNode(node))
      .filter((provider): provider is ModelProviderVersion => Boolean(provider)),
    providers: providerNodes.map(toModelProviderProduct),
    transportRuntimes: transportRuntimeNodes
      .map((node) => typedTransportFromNode(node))
      .filter((transport): transport is TransportDescriptor => Boolean(transport)),
    transportProtocols: transportProtocolNodes.map(toTransportProtocol),
    modalities: modalityNodes
      .map((node) => typedModalityFromNode(node))
      .filter((modality): modality is ModalityDescriptor => Boolean(modality)),
    sessionSemantics: sessionNodes
      .map((node) => typedSessionFromNode(node))
      .filter((nuance): nuance is SessionNuance => Boolean(nuance)),
    lifecycleSemantics: lifecycleNodes
      .map((node) => typedLifecycleFromNode(node))
      .filter((nuance): nuance is LifecycleNuance => Boolean(nuance)),
    discoverySignals: discoveryNodes.map(toDiscoverySignal),
    hookMappings: hookMappingNodes.map(toHookMapping),
    hooks: hookNodes
      .map((node) => typedHookFromNode(node))
      .filter((hook): hook is HookDescriptor => Boolean(hook)),
    pluginTargets: pluginTargetNodes
      .map((node) => typedPluginTargetFromNode(node))
      .filter((target): target is PluginTargetDescriptor => Boolean(target)),
  });
}

export function getProviderModelTopology(providerId: string): ProviderModelTopology | undefined {
  const providerNode = getNode(`provider:${providerId}`);
  if (!providerNode || providerNode.kind !== "ModelProviderProduct") {
    return undefined;
  }

  const providerVersionNodes = outgoingNodes(providerNode.id, "has_version").filter((node) => node.kind === "ModelProviderVersion");
  const modelVersionNodes = uniqueBy(
    providerVersionNodes.flatMap((node) => incomingNodes(node.id, "provided_by").filter((candidate) => candidate.kind === "ModelVersion")),
    (node) => node.id,
  );
  const modelFamilyNodes = uniqueBy(
    modelVersionNodes.flatMap((node) => incomingNodes(node.id, "has_version").filter((candidate) => candidate.kind === "ModelFamily")),
    (node) => node.id,
  );
  const agentNodes = uniqueBy(
    modelVersionNodes.flatMap((node) => incomingNodes(node.id, "defaults_to_model").filter((candidate) => candidate.kind === "AgentVersion")),
    (node) => node.id,
  );
  const supportNodes = uniqueBy(
    providerVersionNodes.flatMap((node) => capabilitySupportNodesForSubject(node.id)),
    (node) => node.id,
  );

  return clone({
    provider: toModelProviderProduct(providerNode),
    versions: providerVersionNodes
      .map((node) => typedProviderVersionFromNode(node))
      .filter((version): version is ModelProviderVersion => Boolean(version)),
    capabilitySupport: supportNodes.map(toCapabilitySupport),
    capabilities: capabilitiesForSupportNodes(supportNodes),
    models: modelVersionNodes
      .map((node) => typedModelVersionFromNode(node))
      .filter((model): model is ModelVersion => Boolean(model)),
    modelFamilies: modelFamilyNodes.map(toModelFamily),
    agents: agentNodes
      .map((node) => typedAgentVersionFromNode(node))
      .filter((agent): agent is AgentVersion => Boolean(agent)),
  });
}

export function listPackageSurfaces(): PackageSurfaceDescriptor[] {
  return GRAPH.nodes.filter((node) => node.kind === "PackageSurface").map(toPackageSurface).map(clone);
}

export function getPackageSurface(packageId: string): PackageSurfaceDescriptor | undefined {
  const node = getNode(`package:${packageId}`);
  return node?.kind === "PackageSurface" ? clone(toPackageSurface(node)) : undefined;
}

export function listPackagesBySurfaceKind(surfaceKind: string): PackageSurfaceDescriptor[] {
  return listPackageSurfaces().filter((pkg) => pkg.surfaceKinds.includes(surfaceKind));
}

export function findPackageSurfaceByWorkspacePath(workspacePath: string): PackageSurfaceDescriptor | undefined {
  const normalized = workspacePath.trim();
  const node = GRAPH.nodes.find(
    (candidate) => candidate.kind === "PackageSurface" && valueAsString(candidate.workspacePath) === normalized,
  );
  return node ? clone(toPackageSurface(node)) : undefined;
}

export function listProcessDescriptors(): ProcessDescriptor[] {
  return clone(AGENT_CATALOG.processes);
}

export function listProcessesByPackage(packageId: string): ProcessDescriptor[] {
  const packageNode = getNode(`package:${packageId}`);
  if (!packageNode || packageNode.kind !== "PackageSurface") {
    return [];
  }

  return outgoingNodes(packageNode.id, "surfaces_process")
    .filter((node) => node.kind === "ProcessDescriptor")
    .map((node) => AGENT_CATALOG.processes.find((process) => process.processId === valueAsString(node.processId)))
    .filter((process): process is ProcessDescriptor => Boolean(process))
    .map(clone);
}

export function listPathDescriptors(): PathDescriptorRecord[] {
  return GRAPH.nodes.filter((node) => node.kind === "PathDescriptor").map(toPathDescriptor).map(clone);
}

export function getPathDescriptor(pathIdOrPath: string): PathDescriptorRecord | undefined {
  const directNode = getNode(`path:${pathIdOrPath}`);
  if (directNode?.kind === "PathDescriptor") {
    return clone(toPathDescriptor(directNode));
  }

  const pathNode = GRAPH.nodes.find(
    (node) => node.kind === "PathDescriptor" && valueAsString(node.pathId) === pathIdOrPath,
  ) ?? GRAPH.nodes.find((node) => node.kind === "PathDescriptor" && valueAsString(node.path) === pathIdOrPath);

  return pathNode ? clone(toPathDescriptor(pathNode)) : undefined;
}

export function listPathsByOwner(ownerId: string): PathDescriptorRecord[] {
  return outgoingNodes(ownerId, "references_path")
    .filter((node) => node.kind === "PathDescriptor")
    .map(toPathDescriptor)
    .map(clone);
}

export function findProcessesByPath(pathIdOrPath: string): ProcessDescriptor[] {
  const pathNode =
    getNode(`path:${pathIdOrPath}`) ??
    GRAPH.nodes.find(
      (node) =>
        node.kind === "PathDescriptor" &&
        (valueAsString(node.pathId) === pathIdOrPath || valueAsString(node.path) === pathIdOrPath),
    );
  if (!pathNode || pathNode.kind !== "PathDescriptor") {
    return [];
  }

  return incomingNodes(pathNode.id, "references_path")
    .filter((node) => node.kind === "ProcessDescriptor")
    .map((node) => AGENT_CATALOG.processes.find((process) => process.processId === valueAsString(node.processId)))
    .filter((process): process is ProcessDescriptor => Boolean(process))
    .map(clone);
}

export function getPackageTopology(packageId: string): PackageTopology | undefined {
  const packageNode = getNode(`package:${packageId}`);
  if (!packageNode || packageNode.kind !== "PackageSurface") {
    return undefined;
  }

  const processNodes = outgoingNodes(packageNode.id, "surfaces_process").filter((node) => node.kind === "ProcessDescriptor");
  const ciNodes = outgoingNodes(packageNode.id, "validated_by_ci").filter((node) => node.kind === "CiSurface");
  const directPathNodes = outgoingNodes(packageNode.id, "references_path").filter((node) => node.kind === "PathDescriptor");
  const processPathNodes = uniqueBy(
    processNodes.flatMap((node) => outgoingNodes(node.id, "references_path").filter((candidate) => candidate.kind === "PathDescriptor")),
    (node) => node.id,
  );

  return clone({
    package: toPackageSurface(packageNode),
    processes: processNodes
      .map((node) => AGENT_CATALOG.processes.find((process) => process.processId === valueAsString(node.processId)))
      .filter((process): process is ProcessDescriptor => Boolean(process)),
    ciSurfaces: ciNodes.map(toCiSurface),
    directPaths: directPathNodes.map(toPathDescriptor),
    processPaths: processPathNodes.map(toPathDescriptor),
    wrapsGraphIds: sortStrings(outgoingEdges(packageNode.id, "wraps_graph").map((edge) => edge.to)),
  });
}

export function getFallbackHarnessMetadata(harnessName: string): HarnessFallbackMetadata | undefined {
  const key = HARNESS_ALIASES[harnessName] ?? harnessName;
  const metadata = FALLBACK_METADATA[key];
  return metadata ? clone(metadata) : undefined;
}

export function listFallbackHarnessMetadata(): Record<string, HarnessFallbackMetadata> {
  return clone(FALLBACK_METADATA);
}

export function getHostSignalMap(): Record<string, string[]> {
  return clone(HOST_SIGNAL_MAP);
}

export function getHostMetadataFields(): Record<string, HostMetadataField[]> {
  return clone(HOST_METADATA_FIELDS);
}

export function getHostDetectionRules(): HostDetectionRule[] {
  return clone(HOST_DETECTION_RULES);
}

export function getHooksMuxDetectionRules(): HooksMuxDetectionRule[] {
  return clone(HOOKS_MUX_DETECTION_RULES);
}

export function getHarnessImages(): HarnessImageEntry[] {
  return clone(HARNESS_IMAGES);
}

export function lookupHarnessImage(harness: string): HarnessImageEntry | undefined {
  const normalized = harness.toLowerCase();
  const key = HARNESS_ALIASES[normalized] ?? normalized;
  const image = HARNESS_IMAGES.find((entry) => entry.harness === key);
  return image ? clone(image) : undefined;
}

export function listPluginTargets(): string[] {
  return PLUGIN_TARGETS.map((target) => target.targetId).sort();
}

export function listPluginTargetDescriptors(): PluginTargetDescriptor[] {
  return clone(PLUGIN_TARGETS);
}

export function getPluginTargetDescriptor(targetId: string): PluginTargetDescriptor | undefined {
  const target = PLUGIN_TARGETS.find((entry) => entry.targetId === targetId);
  return target ? clone(target) : undefined;
}

export function getHookCatalog(): HookDescriptor[] {
  return clone(HOOKS);
}

export function getHookNameMap(): Record<string, Record<string, string>> {
  const map: Record<string, Record<string, string>> = {};
  for (const hook of HOOKS) {
    map[hook.canonicalName] = { ...hook.targetNames };
  }
  return map;
}

export function getAgentVersionSlug(agent: Pick<AgentVersion, "agentId" | "versionRange">): string {
  return `${agent.agentId}--${slugifyVersionRange(agent.versionRange)}`;
}

export function getUiAgentOntologyList(): AgentOntologyListItem[] {
  return clone(AGENT_CATALOG.agents.map(buildOntologyListItem));
}

export function getUiAgentOntologyEntry(slugOrId: string): AgentOntologyDetail | undefined {
  const agent = AGENT_CATALOG.agents.find(
    (candidate) =>
      getAgentVersionSlug(candidate) === slugOrId ||
      agentVersionNodeId(candidate) === slugOrId,
  );

  if (!agent) {
    return undefined;
  }

  const capabilityMatrix = findCapabilityMatrix(agent);
  const claims = findClaims(agent, capabilityMatrix);
  const evidence = findEvidence(agent, capabilityMatrix, claims);

  return clone({
    ...buildOntologyListItem(agent),
    capabilityMatrix,
    evidence,
    claims,
    supersedes: getRelatedVersionReferences(agent, "supersedes", "from"),
    supersededBy: getRelatedVersionReferences(agent, "supersedes", "to"),
    schemaVersion: GRAPH_DOCUMENT.schemaVersion,
    generatedAt: GRAPH_DOCUMENT.generatedAt,
  });
}

export function getUiAgentCards(): UiAgentCard[] {
  return getUiAgentOntologyList().map((agent) => ({
    id: agent.slug,
    name: agent.name,
    versionRange: agent.versionRange,
    description: agent.description,
    providerNames: agent.providers.map((provider) => provider.displayName),
    transportLabels: agent.transports.map((transport) => transport.label),
    capabilities: agent.capabilities.map((capability) => capability.label),
    hookNames: agent.hooks.map((hook) => hook.canonicalName),
    filePath: agent.filePath,
    directory: agent.directory,
    metadata: {
      agentId: agent.agentId,
      aliases: agent.aliases,
      slug: agent.slug,
      runtimeFamily: agent.runtimeFamily,
      pluginTargets: agent.pluginTargets.map((target) => target.targetId),
      modalities: agent.modalities.map((modality) => modality.modalityId),
      evidenceSummary: agent.evidenceSummary,
      schemaVersion: GRAPH_DOCUMENT.schemaVersion,
    },
  }));
}
