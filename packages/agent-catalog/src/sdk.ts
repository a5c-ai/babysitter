import path from "node:path";
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
  getCatalogDataState,
} from "./data";
import { atlas } from "@a5c-ai/atlas";
import { getCatalogGraph, listGraphNodes, listRelationshipsByRelation } from "./atlas-bridge";
import { effectiveTransportMuxClaimStatus, shouldSurfaceTransportProtocol } from "./transport-mux-cutover";
import type {
  AdapterModelRecord,
  AgentCapabilitySupportMatrix,
  AgentCatalog,
  AgentOntologyDetail,
  AgentOntologyEvidenceSummary,
  AgentOntologyListItem,
  AgentVersionReference,
  AgentProductDescriptor,
  AgentVersion,
  BridgeCapabilities,
  CapabilityAssertion,
  AgentVersionTopology,
  CapabilityDescriptor,
  CapabilitySupportRecord,
  CatalogGraph,
  ClaimRecord,
  CiSurfaceDescriptor,
  CodecCapabilities,
  DiscoverySignalDescriptor,
  EvidenceRecord,
  GraphNode,
  GraphRelationship,
  HarnessFallbackMetadata,
  HarnessImageEntry,
  HookDescriptor,
  HookMappingDescriptor,
  HookSupportMap,
  InteractiveSignals,
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
  OntologyEvidenceManifest,
  OntologyEvidenceSearchResult,
  OntologyEvidenceShardDescriptor,
  PackageSurfaceDescriptor,
  PackageTopology,
  PathDescriptorRecord,
  PluginTargetDescriptor,
  ProcessDescriptor,
  ProviderModelTopology,
  SessionNuance,
  SubjectProvenance,
  ToolSchemaFormat,
  TransportDescriptor,
  TransportProtocolDescriptor,
  UiAgentCard,
} from "./models";

function buildHarnessAliases(): Record<string, string> {
  const aliases: Record<string, string> = {};
  try {
    for (const target of PLUGIN_TARGETS) {
      aliases[target.targetId] = target.targetId;
      if (target.adapterName && target.adapterName !== target.targetId) {
        aliases[target.adapterName] = target.targetId;
      }
      if (target.cliCommand && target.cliCommand !== target.targetId && target.cliCommand !== target.adapterName) {
        aliases[target.cliCommand] = target.targetId;
      }
    }
  } catch {
    // Catalog unavailable — return empty
  }
  return aliases;
}
let cachedHarnessAliases: Record<string, string> | undefined;
const HARNESS_ALIASES: Record<string, string> = new Proxy({} as Record<string, string>, {
  get(_target, prop: string) {
    if (!cachedHarnessAliases) cachedHarnessAliases = buildHarnessAliases();
    return cachedHarnessAliases[prop];
  },
  has(_target, prop: string) {
    if (!cachedHarnessAliases) cachedHarnessAliases = buildHarnessAliases();
    return prop in cachedHarnessAliases;
  },
});

interface SdkState {
  graph: CatalogGraph;
  nodeById: Map<string, GraphNode>;
  outgoingByNode: Map<string, GraphRelationship[]>;
  incomingByNode: Map<string, GraphRelationship[]>;
  agentByKey: Map<string, AgentVersion>;
  providerVersionByKey: Map<string, ModelProviderVersion>;
  modelVersionByKey: Map<string, ModelVersion>;
  transportById: Map<string, TransportDescriptor>;
  capabilityById: Map<string, CapabilityDescriptor>;
  modalityById: Map<string, ModalityDescriptor>;
  sessionById: Map<string, SessionNuance>;
  lifecycleById: Map<string, LifecycleNuance>;
  hookById: Map<string, HookDescriptor>;
  pluginTargetById: Map<string, PluginTargetDescriptor>;
}

let cachedSdkState: SdkState | undefined;

function buildSdkState(): SdkState {
  const dataState = getCatalogDataState();
  const graph = getCatalogGraph();
  return {
    graph,
    nodeById: new Map(graph.nodes.map((node) => [node.id, node] as const)),
    outgoingByNode: groupEdgesBy(graph.edges, "from"),
    incomingByNode: groupEdgesBy(graph.edges, "to"),
    agentByKey: new Map(dataState.agentCatalog.agents.map((agent) => [versionKey(agent.agentId, agent.versionRange), agent] as const)),
    providerVersionByKey: new Map(
      dataState.agentCatalog.providers.map((provider) => [versionKey(provider.providerId, provider.versionRange), provider] as const),
    ),
    modelVersionByKey: new Map(
      dataState.agentCatalog.models.map((model) => [versionKey(model.modelId, model.versionRange), model] as const),
    ),
    transportById: new Map(dataState.agentCatalog.transports.map((transport) => [transport.transportId, transport] as const)),
    capabilityById: new Map(
      dataState.agentCatalog.capabilities.map((capability) => [capability.capabilityId, capability] as const),
    ),
    modalityById: new Map(dataState.agentCatalog.modalities.map((modality) => [modality.modalityId, modality] as const)),
    sessionById: new Map(dataState.agentCatalog.sessionNuances.map((nuance) => [nuance.nuanceId, nuance] as const)),
    lifecycleById: new Map(
      dataState.agentCatalog.lifecycleNuances.map((nuance) => [nuance.nuanceId, nuance] as const),
    ),
    hookById: new Map(dataState.hooks.map((hook) => [hook.hookId, hook] as const)),
    pluginTargetById: new Map(dataState.pluginTargets.map((target) => [target.targetId, target] as const)),
  };
}

function getSdkState(): SdkState {
  if (!cachedSdkState) {
    cachedSdkState = buildSdkState();
  }
  return cachedSdkState;
}

export function clearAgentCatalogSdkCache(): void {
  cachedSdkState = undefined;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const AGENT_FILE_PATH = "packages/atlas/graph/agent-stack/core-impls";
const AGENT_DIRECTORY = "packages/atlas/graph";

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
  return getSdkState().nodeById.get(nodeId);
}

function outgoingEdges(nodeId: string, relation?: string): GraphRelationship[] {
  const edges = getSdkState().outgoingByNode.get(nodeId) ?? [];
  return relation ? edges.filter((edge) => edge.relation === relation) : edges;
}

function incomingEdges(nodeId: string, relation?: string): GraphRelationship[] {
  const edges = getSdkState().incomingByNode.get(nodeId) ?? [];
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

function parseToolSchemaFormat(value: unknown): ToolSchemaFormat {
  const normalized = valueAsString(value);
  if (normalized === "openai" || normalized === "anthropic" || normalized === "google") return normalized;
  return "none";
}

function parseCodecCapabilities(value: unknown): CodecCapabilities | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const obj = value as Record<string, unknown>;
  return {
    supportsTools: obj.supportsTools === true || obj.supportsTools === "true",
    supportsStreaming: obj.supportsStreaming === true || obj.supportsStreaming === "true",
    supportsTokenCounting: obj.supportsTokenCounting === true || obj.supportsTokenCounting === "true",
    costTracking: obj.costTracking === true || obj.costTracking === "true",
    toolSchemaFormat: parseToolSchemaFormat(obj.toolSchemaFormat),
  };
}

function toTransportProtocol(node: GraphNode): TransportProtocolDescriptor {
  return {
    transportId: valueAsString(node.transportId),
    label: valueAsString(node.label),
    status: effectiveTransportMuxClaimStatus(valueAsString(node.status), nodeEvidenceIds(node)),
    protocolKind: valueAsString(node.protocolKind),
    interactive: Boolean(node.interactive),
    streaming: Boolean(node.streaming),
    requestShape: valueAsString(node.requestShape),
    responseShape: valueAsString(node.responseShape),
    codecCapabilities: parseCodecCapabilities(node.codecCapabilities),
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
    canonicalPhase: valueAsString(node.canonicalPhase) || undefined,
    blockCapability: node.blockCapability === true || node.blockCapability === "true" ? true : node.blockCapability === false || node.blockCapability === "false" ? false : undefined,
    mutationCapability: node.mutationCapability === true || node.mutationCapability === "true" ? true : node.mutationCapability === false || node.mutationCapability === "false" ? false : undefined,
    scope: valueAsString(node.scope) || undefined,
    supportLevel: valueAsString(node.supportLevel) || 'supported',
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
  const graph = getSdkState().graph;
  const normalized = normalizeLookup(agentIdOrAlias);
  const products = graph.nodes.filter(
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
      ...graph.nodes.filter(
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
  return getSdkState().agentByKey.get(versionKey(valueAsString(node.agentId), valueAsString(node.versionRange)));
}

function typedProviderVersionFromNode(node: GraphNode): ModelProviderVersion | undefined {
  return getSdkState().providerVersionByKey.get(versionKey(valueAsString(node.providerId), valueAsString(node.versionRange)));
}

function typedModelVersionFromNode(node: GraphNode): ModelVersion | undefined {
  return getSdkState().modelVersionByKey.get(versionKey(valueAsString(node.modelId), valueAsString(node.versionRange)));
}

function typedTransportFromNode(node: GraphNode): TransportDescriptor | undefined {
  const transportId = valueAsString(node.runtimeId) || valueAsString(node.runtimeKind) || String(node.id).replace(/^transport-runtime:/, "");
  return getSdkState().transportById.get(transportId);
}

function typedCapabilityFromNode(node: GraphNode): CapabilityDescriptor | undefined {
  return getSdkState().capabilityById.get(valueAsString(node.capabilityId));
}

function typedModalityFromNode(node: GraphNode): ModalityDescriptor | undefined {
  return getSdkState().modalityById.get(valueAsString(node.modalityId));
}

function typedSessionFromNode(node: GraphNode): SessionNuance | undefined {
  return getSdkState().sessionById.get(valueAsString(node.sessionSemanticsId));
}

function typedLifecycleFromNode(node: GraphNode): LifecycleNuance | undefined {
  return getSdkState().lifecycleById.get(valueAsString(node.lifecycleSemanticsId));
}

function typedHookFromNode(node: GraphNode): HookDescriptor | undefined {
  return getSdkState().hookById.get(valueAsString(node.hookId));
}

function typedPluginTargetFromNode(node: GraphNode): PluginTargetDescriptor | undefined {
  const targetId = valueAsString(node.targetId) || String(node.id).replace(/^plugin-target:/, "");
  return getSdkState().pluginTargetById.get(targetId);
}

function capabilitySupportNodesForSubject(subjectId: string): GraphNode[] {
  const edgeBased = outgoingNodes(subjectId, "supports_capability").filter((node) => node.kind === "CapabilitySupport");
  if (edgeBased.length > 0) return edgeBased;

  // Fallback: find CapabilitySupport nodes whose subjectId matches
  return getSdkState().graph.nodes.filter(
    (node) => node.kind === "CapabilitySupport" && valueAsString(node.subjectId) === subjectId,
  );
}

function capabilitySupportForSubject(subjectId: string): CapabilitySupportRecord[] {
  return capabilitySupportNodesForSubject(subjectId).map(toCapabilitySupport);
}

function capabilitiesForSupportNodes(nodes: GraphNode[]): CapabilityDescriptor[] {
  const edgeBased = uniqueBy(
    nodes
      .flatMap((node) => outgoingNodes(node.id, "for_capability"))
      .filter((node): node is GraphNode => node.kind === "Capability")
      .map((node) => typedCapabilityFromNode(node))
      .filter((capability): capability is CapabilityDescriptor => Boolean(capability)),
    (capability) => capability.capabilityId,
  );
  if (edgeBased.length > 0) return edgeBased;

  // Fallback: resolve capabilities from capabilityId attribute on support nodes
  const capabilityIds = new Set(nodes.map((node) => valueAsString(node.capabilityId)).filter(Boolean));
  return uniqueBy(
    Array.from(capabilityIds)
      .map((capId) => getSdkState().capabilityById.get(capId))
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
    outgoingNodes(agentNode.id, "uses_transport").filter(
      (node) => node.kind === "TransportProtocol" && shouldSurfaceTransportProtocol(nodeEvidenceIds(node)),
    ),
    (node) => node.id,
  );
  const modalityNodes = outgoingNodes(agentNode.id, "supports_modality").filter((node) => node.kind === "Modality");
  let sessionNodes = outgoingNodes(agentNode.id, "uses_session_semantics").filter((node) => node.kind === "SessionSemantics");
  if (sessionNodes.length === 0) {
    // Fallback: find SessionSemantics by agentId attribute match
    const agentId = valueAsString(agentNode.agentId);
    sessionNodes = getSdkState().graph.nodes.filter((node) => {
      if (node.kind !== "SessionSemantics") return false;
      const nodeAgentId = valueAsString(node.agentId);
      return nodeAgentId === agentId || nodeAgentId === `agent:${agentId}`;
    });
  }
  let lifecycleNodes = outgoingNodes(agentNode.id, "uses_lifecycle_semantics").filter((node) => node.kind === "LifecycleSemantics");
  if (lifecycleNodes.length === 0) {
    const agentId = valueAsString(agentNode.agentId);
    const agentRange = valueAsString(agentNode.versionRange);
    lifecycleNodes = getSdkState().graph.nodes.filter((node) => {
      if (node.kind !== "LifecycleSemantics") return false;
      const nodeAgentId = valueAsString(node.agentId);
      if (nodeAgentId !== agentId && nodeAgentId !== `agent:${agentId}`) return false;
      if (agentRange) {
        const lcRange = valueAsString(node.versionRange);
        if (lcRange && lcRange !== agentRange) return false;
      }
      return true;
    });
  }
  const discoveryNodes = outgoingNodes(agentNode.id, "discovered_by").filter((node) => node.kind === "DiscoverySignal");
  let hookMappingNodes = outgoingNodes(agentNode.id, "emits_hook").filter((node) => node.kind === "HookMapping");
  let hookNodes: GraphNode[];
  if (hookMappingNodes.length > 0) {
    hookNodes = uniqueBy(
      hookMappingNodes.flatMap((node) => outgoingNodes(node.id, "maps_hook").filter((candidate) => candidate.kind === "HookSurface")),
      (node) => node.id,
    );
  } else {
    // Fallback: derive hooks from agent's plugin targets
    const targetIds = agent.pluginTargetIds;
    const hookFamilies = new Set<string>();
    for (const targetNode of getSdkState().graph.nodes.filter((n) => n.kind === "PluginTarget")) {
      const tid = valueAsString(targetNode.targetId);
      if (targetIds.includes(tid)) {
        const adapter = valueAsString(targetNode.adapterName);
        if (adapter) hookFamilies.add(adapter);
        if (tid !== adapter) hookFamilies.add(tid);
      }
    }
    hookMappingNodes = getSdkState().graph.nodes.filter(
      (n) => n.kind === "HookMapping" && hookFamilies.has(valueAsString(n.adapterFamily)),
    );
    const hookIdSet = new Set(hookMappingNodes.map((n) => valueAsString(n.hookId)).filter(Boolean));
    hookNodes = getSdkState().graph.nodes.filter(
      (n) => n.kind === "HookSurface" && hookIdSet.has(valueAsString(n.hookId)),
    );
  }
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
  return getSdkState().graph.nodes.filter((node) => node.kind === "PackageSurface").map(toPackageSurface).map(clone);
}

export function getPackageSurface(packageId: string): PackageSurfaceDescriptor | undefined {
  const node = getNode(`package:${packageId}`) ??
    getSdkState().graph.nodes.find(
      (candidate) => candidate.kind === "PackageSurface" && valueAsString(candidate.packageId) === packageId,
    );
  return node?.kind === "PackageSurface" ? clone(toPackageSurface(node)) : undefined;
}

export function listPackagesBySurfaceKind(surfaceKind: string): PackageSurfaceDescriptor[] {
  return listPackageSurfaces().filter((pkg) => pkg.surfaceKinds.includes(surfaceKind));
}

export function findPackageSurfaceByWorkspacePath(workspacePath: string): PackageSurfaceDescriptor | undefined {
  const normalized = workspacePath.trim();
  const node = getSdkState().graph.nodes.find(
    (candidate) => candidate.kind === "PackageSurface" && valueAsString(candidate.workspacePath) === normalized,
  );
  return node ? clone(toPackageSurface(node)) : undefined;
}

export function listProcessDescriptors(): ProcessDescriptor[] {
  return clone(AGENT_CATALOG.processes);
}

export function listProcessesByPackage(packageId: string): ProcessDescriptor[] {
  const packageNode = getNode(`package:${packageId}`) ??
    getSdkState().graph.nodes.find(
      (candidate) => candidate.kind === "PackageSurface" && valueAsString(candidate.packageId) === packageId,
    );
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
  return getSdkState().graph.nodes.filter((node) => node.kind === "PathDescriptor").map(toPathDescriptor).map(clone);
}

export function getPathDescriptor(pathIdOrPath: string): PathDescriptorRecord | undefined {
  const directNode = getNode(`path:${pathIdOrPath}`);
  if (directNode?.kind === "PathDescriptor") {
    return clone(toPathDescriptor(directNode));
  }

  const pathNode = getSdkState().graph.nodes.find(
    (node) => node.kind === "PathDescriptor" && valueAsString(node.pathId) === pathIdOrPath,
  ) ?? getSdkState().graph.nodes.find((node) => node.kind === "PathDescriptor" && valueAsString(node.path) === pathIdOrPath);

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
    getSdkState().graph.nodes.find(
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
  const packageNode = getNode(`package:${packageId}`) ??
    getSdkState().graph.nodes.find(
      (candidate) => candidate.kind === "PackageSurface" && valueAsString(candidate.packageId) === packageId,
    );
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
    wrapsGraphIds: sortStrings(atlas.getOutgoing(packageNode.id).filter((edge) => edge.kind === "wraps_graph").map((edge) => edge.to)),
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

export function getPluginTargetDescriptor(targetIdOrAdapterName: string): PluginTargetDescriptor | undefined {
  const target = PLUGIN_TARGETS.find((entry) => entry.targetId === targetIdOrAdapterName)
    ?? PLUGIN_TARGETS.find((entry) => entry.adapterName === targetIdOrAdapterName);
  return target ? clone(target) : undefined;
}

export function listHookMappingsByAdapterFamily(adapterFamily: string): HookMappingDescriptor[] {
  const graph = getSdkState().graph;
  return graph.nodes
    .filter((node) => node.kind === "HookMapping" && valueAsString(node.adapterFamily) === adapterFamily)
    .map(toHookMapping)
    .map(clone);
}

export function getHookCatalog(): HookDescriptor[] {
  return clone(HOOKS);
}

export function getHookNameMap(): Record<string, Record<string, string>> {
  const map: Record<string, Record<string, string>> = {};
  for (const target of PLUGIN_TARGETS) {
    for (const [canonicalName, nativeName] of Object.entries(target.supportedHooks)) {
      if (!map[canonicalName]) {
        map[canonicalName] = {};
      }
      map[canonicalName][target.targetId] = nativeName;
    }
  }
  return clone(map);
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

// ---------------------------------------------------------------------------
// Path resolution helpers
// ---------------------------------------------------------------------------

function packageRoot(): string {
  return path.resolve(__dirname, "..");
}

export function resolveCatalogGraphAssetPath(relativePath: string): string {
  return path.resolve(packageRoot(), "graph", relativePath);
}

export function resolveCatalogEvidenceAssetPath(...segments: string[]): string {
  return path.resolve(packageRoot(), "evidence", ...segments);
}

// ---------------------------------------------------------------------------
// Evidence manifest / snapshot helpers
// ---------------------------------------------------------------------------

export function getOntologyEvidenceManifest(): OntologyEvidenceManifest {
  const evidence = AGENT_CATALOG.evidence;
  const claims = AGENT_CATALOG.claims;

  const repoEvidence = evidence.filter((entry) => entry.kind === "repo");
  const webEvidence = evidence.filter((entry) => entry.kind === "web");
  const repoClaims = claims.filter((claim) => claim.provenanceKind === "repo-observation");
  const vendorClaims = claims.filter((claim) => claim.provenanceKind !== "repo-observation");

  const shards: OntologyEvidenceShardDescriptor[] = [];

  if (repoEvidence.length > 0) {
    shards.push({
      entryKind: "evidence-sources",
      group: "repo",
      relativePath: "shards/evidence-sources-repo.json",
      entryCount: repoEvidence.length,
    });
  }

  if (webEvidence.length > 0) {
    shards.push({
      entryKind: "evidence-sources",
      group: "web",
      relativePath: "shards/evidence-sources-web.json",
      entryCount: webEvidence.length,
    });
  }

  if (repoClaims.length > 0) {
    shards.push({
      entryKind: "claims",
      group: "repo",
      relativePath: "shards/claims-repo.json",
      entryCount: repoClaims.length,
    });
  }

  if (vendorClaims.length > 0) {
    shards.push({
      entryKind: "claims",
      group: "vendor",
      relativePath: "shards/claims-vendor.json",
      entryCount: vendorClaims.length,
    });
  }

  return clone({
    generatedAt: GRAPH_DOCUMENT.generatedAt,
    graphId: GRAPH_DOCUMENT.graphId,
    schemaVersion: GRAPH_DOCUMENT.schemaVersion,
    exportVersion: 2,
    shards,
  });
}

export function getOntologyEvidenceSnapshot(): { evidenceSources: EvidenceRecord[]; claims: ClaimRecord[] } {
  return clone({
    evidenceSources: AGENT_CATALOG.evidence,
    claims: AGENT_CATALOG.claims,
  });
}

// ---------------------------------------------------------------------------
// Claims / evidence helpers
// ---------------------------------------------------------------------------

export function listOntologyClaims(): ClaimRecord[] {
  return clone(CLAIMS);
}

export function getOntologyClaim(claimId: string): ClaimRecord | undefined {
  const claim = CLAIMS.find((entry) => entry.claimId === claimId);
  return claim ? clone(claim) : undefined;
}

export function getOntologyEvidenceSource(evidenceId: string): EvidenceRecord | undefined {
  const entry = AGENT_CATALOG.evidence.find((source) => source.evidenceId === evidenceId);
  return entry ? clone(entry) : undefined;
}

export function listClaimsForSubject(subjectId: string): ClaimRecord[] {
  return clone(CLAIMS.filter((claim) => claim.subjectId === subjectId));
}

export function listEvidenceForSubject(subjectId: string): EvidenceRecord[] {
  const claimsForSubject = CLAIMS.filter((claim) => claim.subjectId === subjectId);
  const evidenceIds = new Set(claimsForSubject.flatMap((claim) => claim.evidenceIds));

  const assertions = CAPABILITY_ASSERTIONS.filter((assertion) => assertion.subjectId === subjectId);
  for (const assertion of assertions) {
    for (const id of assertion.evidenceIds) {
      evidenceIds.add(id);
    }
    for (const claim of assertion.supportingClaims) {
      for (const id of claim.evidenceIds) {
        evidenceIds.add(id);
      }
    }
  }

  const agents = AGENT_CATALOG.agents.filter(
    (agent) => agentVersionNodeId(agent) === subjectId,
  );
  for (const agent of agents) {
    for (const id of agent.evidenceIds) {
      evidenceIds.add(id);
    }
  }

  return clone(AGENT_CATALOG.evidence.filter((entry) => evidenceIds.has(entry.evidenceId)));
}

export function getSubjectProvenance(subjectId: string): SubjectProvenance {
  return clone({
    subjectId,
    claims: listClaimsForSubject(subjectId),
    evidence: listEvidenceForSubject(subjectId),
  });
}

export function listClaimsForEvidence(evidenceId: string): ClaimRecord[] {
  return clone(CLAIMS.filter((claim) => claim.evidenceIds.includes(evidenceId)));
}

export function searchOntologyEvidence(query: string): OntologyEvidenceSearchResult {
  const normalizedQuery = query.trim().toLowerCase();
  const evidence = AGENT_CATALOG.evidence.filter(
    (entry) =>
      entry.evidenceId.toLowerCase().includes(normalizedQuery) ||
      entry.sourcePathOrUrl.toLowerCase().includes(normalizedQuery) ||
      entry.claim.toLowerCase().includes(normalizedQuery),
  );
  const evidenceIds = new Set(evidence.map((entry) => entry.evidenceId));
  const claims = CLAIMS.filter(
    (claim) =>
      claim.claimId.toLowerCase().includes(normalizedQuery) ||
      claim.evidenceIds.some((id) => evidenceIds.has(id)),
  );

  return clone({ query, evidence, claims });
}

export interface LaunchConfigDescriptor {
  id: string;
  harness: string;
  mode: string;
  displayName: string;
  commArgs: string[];
  env: Record<string, string>;
  description: string;
}

export function getLaunchConfig(harness: string, mode: string): LaunchConfigDescriptor | undefined {
  try {
    const atlas = require('@a5c-ai/atlas') as { AtlasGraph: new (index: unknown) => { getAllRecords(): Array<Record<string, unknown>> }; getIndex(): unknown };
    const graph = new atlas.AtlasGraph(atlas.getIndex());
    const configId = `launch-config:${harness}.${mode}`;
    const record = graph.getAllRecords().find((r) => r.id === configId);
    if (!record) return undefined;
    return {
      id: String(record.id),
      harness,
      mode,
      displayName: String(record.displayName ?? ''),
      commArgs: Array.isArray(record.commArgs) ? record.commArgs as string[] : [],
      env: (record.env && typeof record.env === 'object') ? record.env as Record<string, string> : {},
      description: String(record.description ?? ''),
    };
  } catch {
    return undefined;
  }
}

export function getYoloLaunchArgs(harness: string): string[] {
  const config = getLaunchConfig(harness, 'dangerously-bypass-approvals-and-sandbox');
  return config?.commArgs ?? [];
}

export function getInteractiveSignals(harness: string): InteractiveSignals | undefined {
  const agent = getAgentVersion(harness);
  return agent?.interactiveSignals;
}

export function getHookSupport(harness: string, mode: 'interactive' | 'nonInteractive'): Partial<HookSupportMap> | undefined {
  const agent = getAgentVersion(harness);
  return agent?.hookSupport?.[mode];
}

export function getBridgeCapabilities(harness: string): BridgeCapabilities | undefined {
  const agent = getAgentVersion(harness);
  return agent?.bridgeCapabilities;
}

export function getTransportCodecCapabilities(transportId: string): CodecCapabilities | undefined {
  // First check TransportRuntime descriptors (TransportDescriptor)
  const transportDescriptor = getSdkState().transportById.get(transportId);
  if (transportDescriptor?.codecCapabilities) {
    return clone(transportDescriptor.codecCapabilities);
  }

  // Then check TransportProtocol nodes
  const protocolNode = getNode(`transportProtocol:${transportId}`) ??
    getSdkState().graph.nodes.find(
      (node) => node.kind === "TransportProtocol" && valueAsString(node.transportId) === transportId,
    );
  if (protocolNode) {
    const capabilities = parseCodecCapabilities(protocolNode.codecCapabilities);
    return capabilities ? clone(capabilities) : undefined;
  }

  return undefined;
}

export function getAdapterMetadata(harness: string): import('./models.js').AdapterMetadata | undefined {
  const agent = getAgentVersion(harness);
  return agent?.adapterMetadata;
}

export interface ResolvedInstallMethod {
  type: string;
  command: string;
}

export function getInstallMethods(harness: string): ResolvedInstallMethod[] {
  const metadata = getAdapterMetadata(harness);
  if (metadata?.installCommands?.length) {
    return metadata.installCommands.map(c => ({ type: c.type, command: c.command }));
  }
  const agent = getAgentVersion(harness);
  const node = resolveVersionNode(agentVersionNodes(harness));
  const installRefs = node ? stringArray(node.installMethods) : [];
  const sourcePackage = agent?.sourcePackage ?? harness;
  return installRefs.map((ref: string) => {
    const type = ref.replace(/^install:/, '');
    let command: string;
    switch (type) {
      case 'npm': command = `npm install -g ${sourcePackage}`; break;
      case 'gh-extension': command = `gh extension install ${sourcePackage.replace(/^@/, '')}`; break;
      case 'pip': command = `pip install ${sourcePackage}`; break;
      case 'brew': command = `brew install ${sourcePackage}`; break;
      case 'manual': command = `Download from ${sourcePackage}`; break;
      default: command = `${type} install ${sourcePackage}`; break;
    }
    return { type, command };
  });
}

export function getAutomationEnv(harness: string): Record<string, string> {
  const metadata = getAdapterMetadata(harness);
  return metadata?.automationEnv ?? {};
}

export function getHostEnvSignals(harness: string): string[] {
  const metadata = getAdapterMetadata(harness);
  return metadata?.hostEnvSignals ?? [];
}

function expandHome(p: string | undefined): string | undefined {
  if (!p) return p;
  const home = (typeof process !== 'undefined' && process.env) ? (process.env['HOME'] || process.env['USERPROFILE'] || '') : '';
  return path.normalize(p.replace(/^~(?=[/\\]|$)/, home));
}

export function getSessionConfig(harness: string): { sessionDir?: string; sessionPersistence?: string } {
  const metadata = getAdapterMetadata(harness);
  return { sessionDir: expandHome(metadata?.sessionDir), sessionPersistence: metadata?.sessionPersistence };
}

export function getCapabilityFlags(harness: string): Record<string, unknown> {
  const metadata = getAdapterMetadata(harness);
  return metadata?.capabilityFlags ?? {};
}

export function getRuntimeHooks(harness: string): import('./models.js').AdapterRuntimeHooks {
  const metadata = getAdapterMetadata(harness);
  return metadata?.runtimeHooks ?? {};
}

export function getConfigSchema(harness: string): import('./models.js').AdapterConfigSchema {
  const metadata = getAdapterMetadata(harness);
  const schema = metadata?.configSchema ?? {};
  return {
    ...schema,
    configFilePaths: schema.configFilePaths?.map(expandHome).filter((p): p is string => !!p),
    projectConfigFilePaths: schema.projectConfigFilePaths?.map(expandHome).filter((p): p is string => !!p),
  };
}

export function getDisplayName(harness: string): string {
  const metadata = getAdapterMetadata(harness);
  return metadata?.displayName ?? harness;
}

export function getDefaultModelId(harness: string): string | undefined {
  const metadata = getAdapterMetadata(harness);
  return metadata?.defaultModelId;
}

// ---------------------------------------------------------------------------
// Provider translation graph queries
// ---------------------------------------------------------------------------

export interface ProviderTranslationEnvMapping {
  envVar: string;
  source: string;
  condition: string;
  fallback?: string;
}

export interface ProviderTranslationRecord {
  id: string;
  harness: string;
  provider: string;
  proxyRequired: boolean;
  proxyExposedTransport?: string;
  staticEnv?: Record<string, string>;
  envMapping: ProviderTranslationEnvMapping[];
  args: string[];
  providerGroup?: string[];
  harnessUsers?: string[];
  conditionalLogic?: string;
  nativeSdk?: string;
  modelTierEnvVars?: string[];
  suppressNonAnthropicKey?: boolean;
  notes?: string;
}

function parseEnvMapping(raw: unknown): ProviderTranslationEnvMapping[] {
  if (!Array.isArray(raw)) return [];
  const result: ProviderTranslationEnvMapping[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const obj = entry as Record<string, unknown>;
    const envVar = String(obj.envVar ?? "");
    if (!envVar) continue;
    result.push({
      envVar,
      source: String(obj.source ?? ""),
      condition: String(obj.condition ?? ""),
      fallback: obj.fallback != null ? String(obj.fallback) : undefined,
    });
  }
  return result;
}

function parseStaticEnv(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    result[key] = String(value ?? "");
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function toProviderTranslationRecord(node: GraphNode): ProviderTranslationRecord {
  return {
    id: node.id,
    harness: valueAsString(node.harness),
    provider: valueAsString(node.provider),
    proxyRequired: Boolean(node.proxyRequired),
    proxyExposedTransport: node.proxyExposedTransport ? valueAsString(node.proxyExposedTransport) : undefined,
    staticEnv: parseStaticEnv(node.staticEnv),
    envMapping: parseEnvMapping(node.envMapping),
    args: stringArray(node.args),
    providerGroup: node.providerGroup ? stringArray(node.providerGroup) : undefined,
    harnessUsers: node.harnessUsers ? stringArray(node.harnessUsers) : undefined,
    conditionalLogic: node.conditionalLogic ? valueAsString(node.conditionalLogic) : undefined,
    nativeSdk: node.nativeSdk ? valueAsString(node.nativeSdk) : undefined,
    modelTierEnvVars: node.modelTierEnvVars ? stringArray(node.modelTierEnvVars) : undefined,
    suppressNonAnthropicKey: node.suppressNonAnthropicKey === true || node.suppressNonAnthropicKey === "true" ? true : undefined,
    notes: node.notes ? valueAsString(node.notes) : undefined,
  };
}

/**
 * Returns all ProviderTranslation records from the atlas graph.
 */
export function listProviderTranslations(): ProviderTranslationRecord[] {
  return getSdkState().graph.nodes
    .filter((node) => node.kind === "ProviderTranslation")
    .map(toProviderTranslationRecord)
    .map(clone);
}

/**
 * Returns all ProviderTranslation records for a given harness.
 */
export function listProviderTranslationsForHarness(harness: string): ProviderTranslationRecord[] {
  const normalized = normalizeLookup(harness);
  return getSdkState().graph.nodes
    .filter((node) => {
      if (node.kind !== "ProviderTranslation") return false;
      if (normalizeLookup(valueAsString(node.harness)) === normalized) return true;
      // Check if this harness is listed in harnessUsers (for generic-openai shared translations)
      const users = node.harnessUsers;
      if (Array.isArray(users) && users.some((u) => normalizeLookup(String(u)) === normalized)) return true;
      return false;
    })
    .map(toProviderTranslationRecord)
    .map(clone);
}

/**
 * Resolves the specific ProviderTranslation record for a harness + provider combination.
 *
 * Resolution order:
 * 1. Exact provider match (node.provider === provider)
 * 2. Provider group match (provider in node.providerGroup)
 * 3. Default fallback (node.provider === '_default')
 *
 * Returns undefined if no translation is found.
 */
export function getProviderTranslation(harness: string, provider: string): ProviderTranslationRecord | undefined {
  const translations = listProviderTranslationsForHarness(harness);
  const normalizedProvider = normalizeLookup(provider);

  // 1. Exact match on provider field
  const exact = translations.find((t) => normalizeLookup(t.provider) === normalizedProvider);
  if (exact) return exact;

  // 2. Match within a provider group
  const group = translations.find(
    (t) => t.providerGroup && t.providerGroup.some((p) => normalizeLookup(p) === normalizedProvider),
  );
  if (group) return group;

  // 3. Default fallback
  const fallback = translations.find((t) => t.provider === "_default");
  return fallback;
}

// ---------------------------------------------------------------------------
// Adapter model queries
// ---------------------------------------------------------------------------

function toAdapterModelRecord(node: GraphNode): AdapterModelRecord {
  return {
    harness: valueAsString(node.harness),
    modelId: valueAsString(node.modelId),
    modelAlias: valueAsString(node.modelAlias) || undefined,
    displayName: valueAsString(node.displayName),
    deprecated: Boolean(node.deprecated),
    contextWindow: Number(node.contextWindow) || 0,
    maxOutputTokens: Number(node.maxOutputTokens) || 0,
    maxThinkingTokens: node.maxThinkingTokens != null ? Number(node.maxThinkingTokens) : undefined,
    inputPricePerMillion: node.inputPricePerMillion != null ? Number(node.inputPricePerMillion) : undefined,
    outputPricePerMillion: node.outputPricePerMillion != null ? Number(node.outputPricePerMillion) : undefined,
    supportsThinking: Boolean(node.supportsThinking),
    thinkingEffortLevels: stringArray(node.thinkingEffortLevels),
    supportsToolCalling: Boolean(node.supportsToolCalling),
    supportsParallelToolCalls: Boolean(node.supportsParallelToolCalls),
    supportsToolCallStreaming: Boolean(node.supportsToolCallStreaming),
    supportsJsonMode: Boolean(node.supportsJsonMode),
    supportsStructuredOutput: Boolean(node.supportsStructuredOutput),
    supportsTextStreaming: Boolean(node.supportsTextStreaming),
    supportsThinkingStreaming: Boolean(node.supportsThinkingStreaming),
    supportsImageInput: Boolean(node.supportsImageInput),
    supportsImageOutput: Boolean(node.supportsImageOutput),
    supportsFileInput: Boolean(node.supportsFileInput),
    cliArgKey: valueAsString(node.cliArgKey),
    cliArgValue: valueAsString(node.cliArgValue),
    lastUpdated: valueAsString(node.lastUpdated),
    source: (valueAsString(node.source) as 'bundled' | 'remote') || 'bundled',
  };
}

/**
 * Returns all AdapterModel records for a given harness from the atlas graph.
 */
export function getAdapterModels(harness: string): AdapterModelRecord[] {
  const normalized = normalizeLookup(harness);
  return getSdkState().graph.nodes
    .filter((node) => node.kind === "AdapterModel" && normalizeLookup(valueAsString(node.harness)) === normalized)
    .map(toAdapterModelRecord)
    .map(clone);
}
