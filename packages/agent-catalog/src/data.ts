import {
  clearAtlasBridgeCache,
  getCatalogGraph,
  getGraphDocument,
  getOntologySchema,
  getNodeById,
  listGraphNodes,
  listNodesByKind,
  listOutgoingTargets,
  listRelationshipsByRelation,
} from "./atlas-bridge";
// Evidence projection — inlined from deleted evidence-projection.ts
function evidenceIdFromNodeId(nodeId: string): string {
  return nodeId.startsWith("evidence:") ? nodeId.slice("evidence:".length) : nodeId;
}

function buildClaimsByEvidence(
  claimNodes: Iterable<GraphNode>,
  evidenceNodes: Iterable<GraphNode>,
  relationships: Iterable<Pick<GraphRelationship, "from" | "to" | "relation">>,
): Map<string, GraphNode[]> {
  const claimsByGraphId = new Map(Array.from(claimNodes, (node) => [String(node.id), node] as const));
  const evidenceByGraphId = new Map(Array.from(evidenceNodes, (node) => [String(node.id), node] as const));
  const claimsByEvidence = new Map<string, GraphNode[]>();
  for (const rel of relationships) {
    if (rel.relation !== "sourced_from") continue;
    const claimNode = claimsByGraphId.get(rel.from);
    const evidenceNode = evidenceByGraphId.get(rel.to);
    if (!claimNode || !evidenceNode) continue;
    const evidenceId = valueAsString(evidenceNode.evidenceId) || evidenceIdFromNodeId(String(evidenceNode.id));
    const bucket = claimsByEvidence.get(evidenceId);
    if (bucket) bucket.push(claimNode);
    else claimsByEvidence.set(evidenceId, [claimNode]);
  }
  return claimsByEvidence;
}

function getEvidenceClaimStatement(
  evidenceId: string,
  claimsByEvidence: ReadonlyMap<string, GraphNode[]>,
): string {
  return valueAsString(claimsByEvidence.get(evidenceId)?.[0]?.statement);
}
import {
  effectiveTransportMuxClaimStatus,
  effectiveTransportMuxUnresolvedGaps,
  shouldSurfaceCapabilitySupport,
  shouldSurfaceTransportRuntime,
} from "./transport-mux-cutover";
import type {
  AgentCatalog,
  AgentVersion,
  BridgeCapabilities,
  CatalogGraph,
  CapabilityAssertion,
  CapabilityDescriptor,
  ClaimConfidence,
  ClaimEvidenceStrength,
  ClaimProvenanceKind,
  ClaimRecord,
  CodecCapabilities,
  EvidenceRecord,
  GraphEdge,
  GraphDocument,
  GraphNode,
  HookSupportLevel,
  HookSupportMap,
  GraphRelationship,
  HarnessFallbackMetadata,
  HarnessImageEntry,
  HostDetectionRule,
  HookDescriptor,
  HooksMuxDetectionRule,
  HostMetadataField,
  LifecycleNuance,
  ModelProviderVersion,
  ModelVersion,
  ModalityDescriptor,
  PluginComponentSupport,
  PluginPackageMetadata,
  PluginTargetDescriptor,
  ProcessDescriptor,
  SessionNuance,
  ToolSchemaFormat,
  TransportDescriptor,
  OntologySchema,
} from "./models";

const FALLBACK_SESSION_DIR = ".a5c/runs";

function valueAsString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return "";
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

const PLUGIN_TARGET_ID_ALIASES: Record<string, string> = {
  "copilot-cli": "github-copilot",
  omp: "oh-my-pi",
};

function pluginTargetId(value: unknown): string {
  const targetId = valueAsString(value).replace(/^plugin-target:/, "");
  return PLUGIN_TARGET_ID_ALIASES[targetId] ?? targetId;
}

function nodeEvidenceIds(node: GraphNode): string[] {
  return stringArray(node.evidenceRefs);
}

function claimConfidence(value: unknown): ClaimConfidence {
  const normalized = valueAsString(value);
  return normalized === "high" || normalized === "medium" ? normalized : "low";
}

function claimProvenanceKind(value: unknown): ClaimProvenanceKind {
  const normalized = valueAsString(value);
  if (normalized === "repo-observation" || normalized === "vendor-documentation") {
    return normalized;
  }
  return "vendor-inference";
}

function claimEvidenceStrength(value: unknown): ClaimEvidenceStrength {
  const normalized = valueAsString(value);
  if (normalized === "corroborated" || normalized === "partial") {
    return normalized;
  }
  return "inferred";
}

function evidenceStrengthRank(strength: ClaimEvidenceStrength): number {
  if (strength === "corroborated") return 3;
  if (strength === "partial") return 2;
  return 1;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function toModelProviderVersion(node: GraphNode): ModelProviderVersion {
  const product = getNodeById<GraphNode>(`provider:${valueAsString(node.providerId)}`);
  return {
    providerId: valueAsString(node.providerId),
    versionRange: valueAsString(node.versionRange),
    displayName: valueAsString(product?.displayName) || valueAsString(node.providerId),
    hostEnvSignals: stringArray(node.envSignals),
    authSignals: stringArray(node.authSignals),
    evidenceIds: nodeEvidenceIds(node),
  };
}

function toModelVersion(node: GraphNode): ModelVersion {
  const defaultForAgentIds = listRelationshipsByRelation("defaults_to_model")
    .filter((edge) => edge.to === node.id)
    .map((edge) => {
      const agentNode = getNodeById(edge.from);
      return valueAsString(agentNode?.agentId);
    })
    .filter(Boolean);

  return {
    modelId: valueAsString(node.modelId),
    providerId: valueAsString(node.providerId),
    versionRange: valueAsString(node.versionRange),
    label: valueAsString(getNodeById<GraphNode>(`model:${valueAsString(node.modelId)}`)?.label) || valueAsString(node.modelId),
    defaultForAgentIds,
    evidenceIds: nodeEvidenceIds(node),
  };
}

function toTransportDescriptor(node: GraphNode): TransportDescriptor {
  return {
    transportId: transportRuntimeId(node),
    label: valueAsString(node.label),
    status: effectiveTransportMuxClaimStatus(valueAsString(node.status), nodeEvidenceIds(node)),
    interactive: Boolean(node.persistentSession) || Boolean(node.stdinInjection),
    persistentSession: Boolean(node.persistentSession),
    stdinInjection: Boolean(node.stdinInjection),
    blockingStopHook: Boolean(node.blockingStopHook),
    codecCapabilities: parseCodecCapabilities(node.codecCapabilities),
    evidenceIds: nodeEvidenceIds(node),
  };
}

function toCapabilityDescriptor(node: GraphNode): CapabilityDescriptor {
  return {
    capabilityId: valueAsString(node.capabilityId) || String(node.id).replace(/^capability:/, ""),
    namespace: valueAsString(node.namespace),
    label: valueAsString(node.label),
    description: valueAsString(node.description),
    producerPackages: stringArray(node.producerPackages),
    evidenceIds: nodeEvidenceIds(node),
  };
}

function toModalityDescriptor(node: GraphNode): ModalityDescriptor {
  const direction = valueAsString(node.direction);
  return {
    modalityId: valueAsString(node.modalityId),
    direction: direction === "input" || direction === "output" ? direction : "bidirectional",
    label: valueAsString(node.label),
    evidenceIds: nodeEvidenceIds(node),
  };
}

function toHookDescriptor(node: GraphNode): HookDescriptor {
  const targetNames = Object.fromEntries(
    listGraphNodes()
      .filter((candidate) => candidate.kind === "HookMapping" && valueAsString(candidate.hookId) === valueAsString(node.hookId))
      .map((mapping) => [valueAsString(mapping.targetId), valueAsString(mapping.nativeName)]),
  );

  return {
    hookId: valueAsString(node.hookId),
    canonicalName: valueAsString(node.canonicalName),
    targetNames,
    requiresRuntimeHooks: Boolean(node.requiresRuntimeHooks),
    evidenceIds: nodeEvidenceIds(node),
  };
}

function toSessionNuance(node: GraphNode): SessionNuance {
  return {
    nuanceId: valueAsString(node.sessionSemanticsId),
    agentId: valueAsString(node.agentId),
    versionRange: valueAsString(node.versionRange),
    sessionDirStrategy: valueAsString(node.sessionDirStrategy) || FALLBACK_SESSION_DIR,
    envSignals: stringArray(node.sessionIdSources),
    resumeSemantics: valueAsString(node.resumeSemantics),
    stateFilePatterns: stringArray(node.stateFilePatterns),
    pidMarkerPolicy: valueAsString(node.pidMarkerPolicy),
    metadataFields: (Array.isArray(node.metadataFields) ? node.metadataFields : []).map((field) => ({
      key: valueAsString((field as HostMetadataField).key),
      envVars: stringArray((field as HostMetadataField).envVars),
    })),
    evidenceIds: nodeEvidenceIds(node),
  };
}

function toLifecycleNuance(node: GraphNode): LifecycleNuance {
  return {
    nuanceId: valueAsString(node.lifecycleSemanticsId),
    agentId: valueAsString(node.agentId),
    versionRange: valueAsString(node.versionRange),
    runtimeHookMode: valueAsString(node.runtimeHookMode),
    stopHookMode: valueAsString(node.stopHookMode),
    backgroundTaskMode: valueAsString(node.backgroundTaskMode),
    checkpointMode: valueAsString(node.checkpointMode),
    pluginContextMode: valueAsString(node.pluginContextMode),
    platformNuances: stringArray(node.platformNuances),
    evidenceIds: nodeEvidenceIds(node),
  };
}

function toProcessDescriptor(node: GraphNode): ProcessDescriptor {
  return {
    processId: valueAsString(node.processId),
    category: valueAsString(node.category),
    displayName: valueAsString(node.displayName),
    description: valueAsString(node.description),
    paths: stringArray(node.paths),
    inputs: stringArray(node.inputs),
    outputs: stringArray(node.outputs),
    evidenceIds: nodeEvidenceIds(node),
  };
}

function agentCapabilityIds(agentNodeId: string): string[] {
  // First try graph edges
  const edgeBased = listOutgoingTargets(agentNodeId, "supports_capability")
    .map((supportNode) => valueAsString(supportNode.capabilityId) || valueAsString(listOutgoingTargets(supportNode.id, "for_capability")[0]?.capabilityId))
    .filter(Boolean);
  if (edgeBased.length > 0) return edgeBased;

  // Fallback: find CapabilitySupport nodes whose subjectId matches
  return Array.from(new Set(
    listNodesByKind("CapabilitySupport")
      .filter((node) => valueAsString(node.subjectId) === agentNodeId)
      .map((node) => valueAsString(node.capabilityId))
      .filter(Boolean)
  ));
}

function agentHookIds(agentNodeId: string): string[] {
  const edgeBased = listOutgoingTargets(agentNodeId, "emits_hook")
    .map((mapping) => valueAsString(mapping.hookId))
    .filter(Boolean);
  if (edgeBased.length > 0) return edgeBased;

  // Fallback: derive from agent's plugin targets and their hook mappings
  const targetIds = agentPluginTargetIds(agentNodeId);
  const hookFamilies = new Set<string>();
  for (const node of listNodesByKind("PluginTarget")) {
    const targetId = pluginTargetId(node.id);
    if (targetIds.includes(targetId)) {
      const adapterName = valueAsString(node.adapterName);
      if (adapterName) hookFamilies.add(adapterName);
      if (targetId !== adapterName) hookFamilies.add(targetId);
    }
  }
  return Array.from(new Set(
    listNodesByKind("HookMapping")
      .filter((mapping) => hookFamilies.has(valueAsString(mapping.adapterFamily)))
      .map((mapping) => valueAsString(mapping.hookId))
      .filter(Boolean)
  ));
}

function transportRuntimeId(node: GraphNode): string {
  return valueAsString(node.runtimeId) || valueAsString(node.runtimeKind) || String(node.id).replace(/^transport-runtime:/, "");
}

function agentTransportIds(agentNodeId: string): string[] {
  return listOutgoingTargets(agentNodeId, "uses_transport")
    .filter((node) => node.kind === "TransportRuntime")
    .map((node) => transportRuntimeId(node))
    .filter(Boolean);
}

function agentModalityIds(agentNodeId: string): string[] {
  return listOutgoingTargets(agentNodeId, "supports_modality")
    .map((node) => valueAsString(node.modalityId))
    .filter(Boolean);
}

function agentProviderIds(agentNodeId: string): string[] {
  const providerIds = listOutgoingTargets(agentNodeId, "defaults_to_model")
    .flatMap((modelNode) =>
      listOutgoingTargets(modelNode.id, "provided_by").map((providerNode) => valueAsString(providerNode.providerId)),
    )
    .filter(Boolean);
  return Array.from(new Set(providerIds));
}

function agentModelIds(agentNodeId: string): string[] {
  return listOutgoingTargets(agentNodeId, "defaults_to_model")
    .map((node) => valueAsString(node.modelId))
    .filter(Boolean);
}

function agentPluginTargetIds(agentNodeId: string): string[] {
  return listOutgoingTargets(agentNodeId, "targets_plugin_surface")
    .map((node) => valueAsString(node.targetId))
    .filter(Boolean);
}

function matchesAgentId(nodeAgentId: string, targetAgentId: string): boolean {
  if (nodeAgentId === targetAgentId) return true;
  // Handle "agent:codex" matching "codex"
  if (nodeAgentId.startsWith("agent:") && nodeAgentId.slice("agent:".length) === targetAgentId) return true;
  if (targetAgentId.startsWith("agent:") && targetAgentId.slice("agent:".length) === nodeAgentId) return true;
  return false;
}

function agentSessionNuanceIds(agentNodeId: string): string[] {
  const edgeBased = listOutgoingTargets(agentNodeId, "uses_session_semantics")
    .map((node) => valueAsString(node.sessionSemanticsId))
    .filter(Boolean);
  if (edgeBased.length > 0) return edgeBased;

  // Fallback: find SessionSemantics nodes whose agentId matches
  const agentNode = getNodeById(agentNodeId);
  const agentId = valueAsString(agentNode?.agentId);
  if (!agentId) return [];
  return listNodesByKind("SessionSemantics")
    .filter((node) => matchesAgentId(valueAsString(node.agentId), agentId))
    .map((node) => valueAsString(node.sessionSemanticsId))
    .filter(Boolean);
}

function agentLifecycleNuanceIds(agentNodeId: string): string[] {
  const edgeBased = listOutgoingTargets(agentNodeId, "uses_lifecycle_semantics")
    .map((node) => valueAsString(node.lifecycleSemanticsId))
    .filter(Boolean);
  if (edgeBased.length > 0) return edgeBased;

  // Fallback: find LifecycleSemantics nodes whose agentId and versionRange match
  const agentNode = getNodeById(agentNodeId);
  const agentId = valueAsString(agentNode?.agentId);
  const agentVersionRange = valueAsString(agentNode?.versionRange);
  if (!agentId) return [];
  return listNodesByKind("LifecycleSemantics")
    .filter((node) => {
      if (!matchesAgentId(valueAsString(node.agentId), agentId)) return false;
      // If agent has a specific version range, match lifecycle nodes with same or broader range
      if (agentVersionRange) {
        const lcRange = valueAsString(node.versionRange);
        if (lcRange && lcRange !== agentVersionRange) return false;
      }
      return true;
    })
    .map((node) => valueAsString(node.lifecycleSemanticsId))
    .filter(Boolean);
}

function toHookSupportLevel(value: unknown): HookSupportLevel {
  const normalized = valueAsString(value);
  if (normalized === 'native' || normalized === 'emulated') return normalized;
  return 'unsupported';
}

function parseHookSupportMap(value: unknown): HookSupportMap {
  const obj = (value && typeof value === 'object') ? value as Record<string, unknown> : {};
  return {
    sessionStart: toHookSupportLevel(obj.sessionStart),
    stop: toHookSupportLevel(obj.stop),
    userPromptSubmit: toHookSupportLevel(obj.userPromptSubmit),
    preToolUse: toHookSupportLevel(obj.preToolUse),
    sessionEnd: toHookSupportLevel(obj.sessionEnd),
  };
}

function parsePartialHookSupportMap(value: unknown): Partial<HookSupportMap> {
  const obj = (value && typeof value === 'object') ? value as Record<string, unknown> : {};
  const result: Partial<HookSupportMap> = {};
  if (obj.sessionStart != null) result.sessionStart = toHookSupportLevel(obj.sessionStart);
  if (obj.stop != null) result.stop = toHookSupportLevel(obj.stop);
  if (obj.userPromptSubmit != null) result.userPromptSubmit = toHookSupportLevel(obj.userPromptSubmit);
  if (obj.preToolUse != null) result.preToolUse = toHookSupportLevel(obj.preToolUse);
  if (obj.sessionEnd != null) result.sessionEnd = toHookSupportLevel(obj.sessionEnd);
  return result;
}

function parseHookSupport(value: unknown): AgentVersion['hookSupport'] {
  if (!value || typeof value !== 'object') return undefined;
  const obj = value as Record<string, unknown>;
  if (!obj.interactive || typeof obj.interactive !== 'object') return undefined;
  return {
    interactive: parseHookSupportMap(obj.interactive),
    nonInteractive: parsePartialHookSupportMap(obj.nonInteractive),
  };
}

function parseBridgeCapabilities(value: unknown): BridgeCapabilities | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const obj = value as Record<string, unknown>;
  return {
    interactiveBridge: Boolean(obj.interactiveBridge),
    sessionResume: Boolean(obj.sessionResume),
    positionalPrompt: Boolean(obj.positionalPrompt),
  };
}

function parseAdapterMetadata(value: unknown): import('./models.js').AdapterMetadata | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const obj = value as Record<string, unknown>;
  return {
    installCommands: Array.isArray(obj.installCommands) ? obj.installCommands.map((c: unknown) => {
      const cmd = c as Record<string, unknown>;
      return { type: valueAsString(cmd.type), command: valueAsString(cmd.command) };
    }) : undefined,
    authMethods: Array.isArray(obj.authMethods) ? obj.authMethods.map((m: unknown) => {
      const method = m as Record<string, unknown>;
      return {
        type: valueAsString(method.type),
        name: valueAsString(method.name),
        envVars: Array.isArray(method.envVars) ? method.envVars.map(String) : undefined,
      };
    }) : undefined,
    authFiles: Array.isArray(obj.authFiles) ? obj.authFiles.map(String) : undefined,
    hostEnvSignals: Array.isArray(obj.hostEnvSignals) ? obj.hostEnvSignals.map(String) : undefined,
    sessionDir: valueAsString(obj.sessionDir) || undefined,
    sessionPersistence: (['file', 'sqlite', 'none'].includes(valueAsString(obj.sessionPersistence)) ? valueAsString(obj.sessionPersistence) : undefined) as 'file' | 'sqlite' | 'none' | undefined,
    automationEnv: obj.automationEnv && typeof obj.automationEnv === 'object' ? Object.fromEntries(Object.entries(obj.automationEnv as Record<string, unknown>).map(([k, v]) => [k, String(v)])) : undefined,
    approvalModes: Array.isArray(obj.approvalModes) ? obj.approvalModes.map(String) : undefined,
    capabilityFlags: obj.capabilityFlags && typeof obj.capabilityFlags === 'object' ? obj.capabilityFlags as Record<string, unknown> : undefined,
    runtimeHooks: obj.runtimeHooks && typeof obj.runtimeHooks === 'object' ? obj.runtimeHooks as import('./models.js').AdapterRuntimeHooks : undefined,
    configSchema: obj.configSchema && typeof obj.configSchema === 'object' ? {
      configFormat: valueAsString((obj.configSchema as Record<string, unknown>).configFormat) || undefined,
      configFilePaths: Array.isArray((obj.configSchema as Record<string, unknown>).configFilePaths) ? ((obj.configSchema as Record<string, unknown>).configFilePaths as unknown[]).map(String) : undefined,
      projectConfigFilePaths: Array.isArray((obj.configSchema as Record<string, unknown>).projectConfigFilePaths) ? ((obj.configSchema as Record<string, unknown>).projectConfigFilePaths as unknown[]).map(String) : undefined,
    } : undefined,
    displayName: valueAsString(obj.displayName) || undefined,
    defaultModelId: valueAsString(obj.defaultModelId) || undefined,
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

function toAgentVersion(node: GraphNode): AgentVersion {
  return {
    agentId: valueAsString(node.agentId),
    aliases: stringArray(node.aliases),
    versionRange: valueAsString(node.versionRange),
    releaseChannel: valueAsString(node.releaseChannel),
    since: valueAsString(node.since) || null,
    until: valueAsString(node.until) || null,
    runtimeFamily: valueAsString(node.runtimeFamily),
    osSupport: stringArray(node.osSupport),
    displayName: valueAsString(node.displayName),
    summary: valueAsString(node.summary),
    sourcePackage: valueAsString(node.sourcePackage),
    providerIds: agentProviderIds(node.id),
    modelIds: agentModelIds(node.id),
    transportIds: agentTransportIds(node.id),
    modalityIds: agentModalityIds(node.id),
    capabilityIds: agentCapabilityIds(node.id),
    hookIds: agentHookIds(node.id),
    pluginTargetIds: agentPluginTargetIds(node.id),
    sessionNuanceIds: agentSessionNuanceIds(node.id),
    lifecycleNuanceIds: agentLifecycleNuanceIds(node.id),
    evidenceIds: nodeEvidenceIds(node),
    interactiveSignals: node.interactiveSignals != null ? {
      turnCompletePattern: valueAsString((node.interactiveSignals as Record<string, unknown>)?.turnCompletePattern) || undefined,
      exitOnNonInteractive: (node.interactiveSignals as Record<string, unknown>)?.exitOnNonInteractive === true ? true : undefined,
      nonInteractiveMode: valueAsString((node.interactiveSignals as Record<string, unknown>)?.nonInteractiveMode) || undefined,
      interactiveMode: valueAsString((node.interactiveSignals as Record<string, unknown>)?.interactiveMode),
    } : undefined,
    hookSupport: parseHookSupport(node.hookSupport),
    bridgeCapabilities: parseBridgeCapabilities(node.bridgeCapabilities),
    adapterMetadata: parseAdapterMetadata(node.adapterMetadata),
  };
}

function evidenceIdFromNode(node: GraphNode): string {
  const explicit = valueAsString(node.evidenceId);
  if (explicit) return explicit;
  return evidenceIdFromNodeId(String(node.id));
}

function toEvidenceRecord(node: GraphNode, evidenceClaims: Map<string, GraphNode[]>): EvidenceRecord {
  const evidenceId = evidenceIdFromNode(node);
  const freshnessWindowDays =
    typeof node.freshnessWindowDays === "number" && Number.isFinite(node.freshnessWindowDays)
      ? node.freshnessWindowDays
      : undefined;
  return {
    evidenceId,
    kind: valueAsString(node.kindLabel) === "web" ? "web" : "repo",
    sourcePathOrUrl: valueAsString(node.sourcePathOrUrl) || valueAsString(node.filePath),
    excerptLocator: valueAsString(node.locator),
    claim: getEvidenceClaimStatement(evidenceId, evidenceClaims),
    capturedAt: valueAsString(node.capturedAt) || valueAsString(node.observedAt),
    trustLevel: valueAsString(node.trustLevel),
    reviewOwner: valueAsString(node.reviewOwner),
    reviewedAt: valueAsString(node.reviewedAt),
    freshnessWindowDays,
  };
}

function toClaimRecord(node: GraphNode): ClaimRecord {
  const evidenceIds = stringArray(node.evidenceIds);
  return {
    claimId: valueAsString(node.claimId),
    statement: valueAsString(node.statement),
    subjectKind: valueAsString(node.subjectKind),
    subjectId: valueAsString(node.subjectId),
    confidence: claimConfidence(node.confidence),
    status: effectiveTransportMuxClaimStatus(valueAsString(node.status), evidenceIds),
    provenanceKind: claimProvenanceKind(node.provenanceKind),
    evidenceStrength: claimEvidenceStrength(node.evidenceStrength),
    evidenceIds,
    unresolvedGaps: effectiveTransportMuxUnresolvedGaps(stringArray(node.unresolvedGaps), evidenceIds),
  };
}

function synthesizeClaimsFromEvidenceRefs(node: GraphNode): ClaimRecord[] {
  const evidenceIds = nodeEvidenceIds(node);
  if (evidenceIds.length === 0) return [];

  const repoIds = evidenceIds.filter((id) => id.startsWith("repo-"));
  const webIds = evidenceIds.filter((id) => id.startsWith("web-"));

  const claims: ClaimRecord[] = [];

  if (repoIds.length > 0) {
    // Look for an existing Claim node matching a repo evidence ID
    const matchedRepoClaim = listNodesByKind("Claim").find((claimNode) => {
      const claimEvidenceIds = stringArray(claimNode.evidenceIds);
      return claimEvidenceIds.some((id) => repoIds.includes(id)) && valueAsString(claimNode.provenanceKind) === "repo-observation";
    });

    claims.push(matchedRepoClaim ? toClaimRecord(matchedRepoClaim) : {
      claimId: repoIds[0],
      statement: `Repo evidence supports capability: ${valueAsString(node.capabilityId)} for ${valueAsString(node.subjectId)}`,
      subjectKind: valueAsString(node.subjectKind),
      subjectId: valueAsString(node.subjectId),
      confidence: "high",
      status: "current",
      provenanceKind: "repo-observation",
      evidenceStrength: repoIds.length >= 2 ? "corroborated" : "partial",
      evidenceIds: repoIds,
      unresolvedGaps: [],
    });
  }

  if (webIds.length > 0) {
    // Look for an existing Claim node matching a web evidence ID
    const matchedWebClaim = listNodesByKind("Claim").find((claimNode) => {
      const claimEvidenceIds = stringArray(claimNode.evidenceIds);
      return claimEvidenceIds.some((id) => webIds.includes(id)) && valueAsString(claimNode.provenanceKind) !== "repo-observation";
    });

    if (matchedWebClaim) {
      const claim = toClaimRecord(matchedWebClaim);
      // Ensure partial vendor claims always have unresolved gaps
      if (claim.evidenceStrength !== "corroborated" && claim.unresolvedGaps.length === 0) {
        claim.unresolvedGaps = [`Vendor evidence for ${valueAsString(node.capabilityId)} has not been fully corroborated.`];
      }
      claims.push(claim);
    } else {
      claims.push({
        claimId: webIds[0],
        statement: `Vendor documentation supports capability: ${valueAsString(node.capabilityId)} for ${valueAsString(node.subjectId)}`,
        subjectKind: valueAsString(node.subjectKind),
        subjectId: valueAsString(node.subjectId),
        confidence: webIds.length >= 2 ? "high" : "medium",
        status: "current",
        provenanceKind: "vendor-documentation",
        evidenceStrength: webIds.length >= 2 ? "corroborated" : "partial",
        evidenceIds: webIds,
        unresolvedGaps: webIds.length >= 2 ? [] : [`Only ${webIds.length} web evidence source(s) found for this capability.`],
      });
    }
  }

  return claims;
}

function buildCapabilityAssertions(): CapabilityAssertion[] {
  return listNodesByKind("CapabilitySupport")
    .filter((node) =>
      shouldSurfaceCapabilitySupport(valueAsString(node.subjectKind), valueAsString(node.subjectId), nodeEvidenceIds(node)),
    )
    .map((node) => {
    let supportingClaims = listOutgoingTargets(node.id, "supported_by_claim")
      .filter((claim): claim is GraphNode => claim.kind === "Claim")
      .map(toClaimRecord);

    // Fall back to synthesized claims when no explicit claim edges exist
    if (supportingClaims.length === 0) {
      supportingClaims = synthesizeClaimsFromEvidenceRefs(node);
    }

    const vendorClaims = supportingClaims.filter((claim) => claim.provenanceKind !== "repo-observation");
    const primaryClaims = vendorClaims.length > 0 ? vendorClaims : supportingClaims;
    const evidenceStrength = primaryClaims.reduce<ClaimEvidenceStrength>(
      (strongest, claim) =>
        evidenceStrengthRank(claim.evidenceStrength) > evidenceStrengthRank(strongest)
          ? claim.evidenceStrength
          : strongest,
      "inferred",
    );

    return {
      supportId: valueAsString(node.supportId),
      capabilityId: valueAsString(node.capabilityId),
      subjectKind: valueAsString(node.subjectKind),
      subjectId: valueAsString(node.subjectId),
      versionRange: valueAsString(node.versionRange),
      supportLevel: valueAsString(node.supportLevel),
      notes: valueAsString(node.notes) || undefined,
      evidenceIds: nodeEvidenceIds(node),
      hasVendorEvidence: vendorClaims.length > 0,
      evidenceStrength,
      unresolvedGaps: uniqueStrings(primaryClaims.flatMap((claim) => claim.unresolvedGaps)),
      supportingClaims,
    };
  });
}

function buildHookDetectionRules(): HooksMuxDetectionRule[] {
  return listNodesByKind("DiscoverySignal")
    .filter((node) => valueAsString(node.scope) === "hooks-mux")
    .map((node) => ({
      adapter: valueAsString(node.key),
      confidence: (valueAsString(node.confidence) as HooksMuxDetectionRule["confidence"]) || "low",
      signals: stringArray(node.signals),
      absentSignals: stringArray(node.absentSignals),
    }));
}

function buildHostDetectionRules(): HostDetectionRule[] {
  return listNodesByKind("DiscoverySignal")
    .filter((node) => valueAsString(node.scope) === "host-detection")
    .map((node) => ({
      agent: valueAsString(node.key),
      confidence: (valueAsString(node.confidence) as HostDetectionRule["confidence"]) || "low",
      signals: stringArray(node.signals),
      metadataFields: (Array.isArray(node.metadataFields) ? node.metadataFields : []).map((field) => ({
        key: valueAsString((field as HostMetadataField).key),
        envVars: stringArray((field as HostMetadataField).envVars),
      })),
      argvMatches: stringArray(node.argvMatches),
    }));
}

function buildHostSignalMap(hostDetectionRules: HostDetectionRule[]): Record<string, string[]> {
  const entries = hostDetectionRules.map((rule) => [rule.agent, rule.signals] as const);
  return Object.fromEntries(entries);
}

function buildHostMetadataFields(hostDetectionRules: HostDetectionRule[]): Record<string, HostMetadataField[]> {
  const entries = hostDetectionRules.map((rule) => [rule.agent, rule.metadataFields] as const);
  return Object.fromEntries(entries);
}

function capabilityBoolean(agentNodeId: string, capabilityId: string): boolean {
  return agentCapabilityIds(agentNodeId).includes(capabilityId);
}

function adapterNameForAgent(agentId: string, aliases: string[]): string {
  if (agentId === "claude") return "claude";
  if (agentId === "gemini") return "gemini";
  if (agentId === "copilot") return "copilot";
  if (agentId === "omp") return "omp";
  return aliases[0] === "claude-code" ? "claude" : agentId;
}

function fallbackHarnessId(agentId: string, aliases: string[]): string {
  if (agentId === "claude") return "claude-code";
  if (agentId === "gemini") return "gemini-cli";
  if (agentId === "copilot") return "github-copilot";
  if (agentId === "omp") return "oh-my-pi";
  return aliases[0] ?? agentId;
}

function buildFallbackMetadata(
  sessionNuances: SessionNuance[],
  agents: AgentVersion[],
): Record<string, HarnessFallbackMetadata> {
  const sessionNuancesById = new Map(sessionNuances.map((nuance) => [nuance.nuanceId, nuance]));
  const metadataEntries = agents.filter((agent) => agent.runtimeFamily === "cli-harness").map((agent) => {
    const sessionNuance = sessionNuancesById.get(agent.sessionNuanceIds[0]);
    const harnessId = fallbackHarnessId(agent.agentId, agent.aliases);
    return [
      harnessId,
      {
        harnessId,
        adapterName: adapterNameForAgent(agent.agentId, agent.aliases),
        hostEnvSignals: sessionNuance?.envSignals ?? [],
        sessionDir: sessionNuance?.sessionDirStrategy ?? FALLBACK_SESSION_DIR,
        capabilities: {
          supportsSkills: capabilityBoolean(`agentVersion:${agent.agentId}:${slugify(agent.versionRange)}`, "skills"),
          supportsThinking: capabilityBoolean(`agentVersion:${agent.agentId}:${slugify(agent.versionRange)}`, "thinking"),
          supportsMCP: capabilityBoolean(`agentVersion:${agent.agentId}:${slugify(agent.versionRange)}`, "mcp"),
          requiresToolApproval: capabilityBoolean(`agentVersion:${agent.agentId}:${slugify(agent.versionRange)}`, "tool-approval"),
          supportsInteractiveMode: capabilityBoolean(`agentVersion:${agent.agentId}:${slugify(agent.versionRange)}`, "interactive-mode"),
          supportsStdinInjection: capabilityBoolean(`agentVersion:${agent.agentId}:${slugify(agent.versionRange)}`, "stdin-injection"),
          supportsSubagentDispatch: capabilityBoolean(`agentVersion:${agent.agentId}:${slugify(agent.versionRange)}`, "subagent-dispatch"),
          supportsParallelExecution: capabilityBoolean(`agentVersion:${agent.agentId}:${slugify(agent.versionRange)}`, "parallel-execution"),
          supportsImageInput: capabilityBoolean(`agentVersion:${agent.agentId}:${slugify(agent.versionRange)}`, "image-input"),
          hasRuntimeHooks: capabilityBoolean(`agentVersion:${agent.agentId}:${slugify(agent.versionRange)}`, "runtime-hooks"),
          hasStopHook: capabilityBoolean(`agentVersion:${agent.agentId}:${slugify(agent.versionRange)}`, "stop-hook"),
        },
        evidenceIds: agent.evidenceIds,
      },
    ] as const;
  });

  return Object.fromEntries(metadataEntries);
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

function buildHarnessImages(): HarnessImageEntry[] {
  return listNodesByKind("PluginArtifact")
    .filter((node) => valueAsString(node.artifactKind) === "container-image")
    .map((node) => ({
      harness: pluginTargetId(node.targetId),
      image: valueAsString(node.pathPattern),
      tag: valueAsString(node.installerSurface) || undefined,
      preinstalled: stringArray(node.scriptVariants).includes("preinstalled"),
    }));
}

// Derive hook families from Atlas PluginTarget.adapterName
function getPluginTargetHookFamilies(): Record<string, string[]> {
  const families: Record<string, string[]> = {};
  for (const node of listNodesByKind("PluginTarget")) {
    const targetId = pluginTargetId(node.id);
    const adapterName = valueAsString(node.adapterName);
    if (targetId && adapterName) {
      families[targetId] = [adapterName];
      if (targetId !== adapterName) families[targetId].push(targetId);
    }
  }
  return families;
}

function canonicalHookName(hookId: string): string {
  return hookId
    .replace(/^hook-surface:/, "")
    .split(".")[0]
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join("");
}

function supportedHooksForTarget(targetId: string): Record<string, string> {
  const hookFamilies = getPluginTargetHookFamilies();
  const families = new Set(hookFamilies[targetId] ?? [targetId]);
  const supportedHooks = Object.fromEntries(
    listNodesByKind("HookMapping")
      .filter((mapping) => families.has(valueAsString(mapping.adapterFamily)))
      .map((mapping) => [canonicalHookName(valueAsString(mapping.hookId)), valueAsString(mapping.nativeName)] as const)
      .filter(([canonical, native]) => Boolean(canonical && native)),
  );
  return supportedHooks;
}

// Known babysitter plugin targets (subset of Atlas PluginTargets)
const BABYSITTER_PLUGIN_TARGETS = new Set([
  "plugin-target:claude-code", "plugin-target:codex", "plugin-target:cursor",
  "plugin-target:gemini-cli", "plugin-target:copilot-cli", "plugin-target:pi",
  "plugin-target:omp", "plugin-target:opencode", "plugin-target:openclaw",
  "plugin-target:hermes",
]);

// Atlas uses different IDs for some targets
const TARGET_ID_ALIASES: Record<string, string> = {
  "plugin-target:gemini-cli": "gemini-cli",
  "plugin-target:copilot-cli": "github-copilot",
  "plugin-target:omp": "oh-my-pi",
};

function buildPluginTargetDescriptors(_hooks: HookDescriptor[]): PluginTargetDescriptor[] {
  const atlasTargets = listNodesByKind("PluginTarget")
    .filter((node) => BABYSITTER_PLUGIN_TARGETS.has(node.id));

  if (atlasTargets.length === 0) {
    return [];
  }

  return atlasTargets.map((node) => {
    const targetId = TARGET_ID_ALIASES[node.id] ?? pluginTargetId(node.id);
    const installLayout = node.installLayout && typeof node.installLayout === "object"
      ? {
          harnessHomeRelative: valueAsString((node.installLayout as GraphNode).harnessHomeRelative) || null,
          pluginsDirRelative: valueAsString((node.installLayout as GraphNode).pluginsDirRelative) || null,
          marketplacePathRelative: valueAsString((node.installLayout as GraphNode).marketplacePathRelative) || null,
        }
      : undefined;
    const packageMetadata = node.packageMetadata && typeof node.packageMetadata === "object"
      ? {
          moduleType: (valueAsString((node.packageMetadata as GraphNode).moduleType) as PluginPackageMetadata["moduleType"]) || undefined,
          binScriptExt: (valueAsString((node.packageMetadata as GraphNode).binScriptExt) as PluginPackageMetadata["binScriptExt"]) || undefined,
          installLifecycle: (valueAsString((node.packageMetadata as GraphNode).installLifecycle) as PluginPackageMetadata["installLifecycle"]) || undefined,
          activationMessage: (valueAsString((node.packageMetadata as GraphNode).activationMessage) as PluginPackageMetadata["activationMessage"]) || undefined,
          extraPackageFiles: stringArray((node.packageMetadata as GraphNode).extraPackageFiles),
          extraScripts: ((node.packageMetadata as GraphNode).extraScripts as Record<string, string> | undefined) ?? undefined,
          peerDependencyPackage: valueAsString((node.packageMetadata as GraphNode).peerDependencyPackage) || undefined,
          emitCjsWrappers: Boolean((node.packageMetadata as GraphNode).emitCjsWrappers),
        }
      : undefined;
    const componentSupport = node.componentSupport && typeof node.componentSupport === "object"
      ? {
          agents: (valueAsString((node.componentSupport as GraphNode).agents) as PluginComponentSupport["agents"]) || "unsupported",
          context: (valueAsString((node.componentSupport as GraphNode).context) as PluginComponentSupport["context"]) || "unsupported",
        }
      : undefined;

    // Normalize distribution: Atlas uses array, agent-catalog uses single string
    const distArray = stringArray(node.distribution);
    let distribution: PluginTargetDescriptor["distribution"];
    if (distArray.includes("marketplace") && (distArray.includes("npm-cli") || distArray.length > 1)) {
      distribution = "both";
    } else if (distArray.includes("marketplace")) {
      distribution = "marketplace";
    } else {
      distribution = "npm-cli";
    }

    // Normalize adapterFamily
    const adapterFamily: PluginTargetDescriptor["adapterFamily"] =
      valueAsString(node.adapterFamily) === "programmatic" ||
      ["pi", "omp", "opencode", "openclaw"].includes(valueAsString(node.adapterName))
        ? "programmatic"
        : "shell-hook";

    return {
      targetId,
      displayName: valueAsString(node.displayName),
      adapterName: valueAsString(node.adapterName),
      manifestFormat: valueAsString(node.manifestFormat),
      commandFormat: valueAsString(node.commandFormat),
      distributionModel: valueAsString(node.distributionModel),
      npmPublishable: Boolean(node.npmPublishable),
      pluginRootEnvVar: node.pluginRootEnvVar === null ? null : valueAsString(node.pluginRootEnvVar) || undefined,
      pluginRootEnvVarForExtension: node.pluginRootEnvVarForExtension === null ? null : valueAsString(node.pluginRootEnvVarForExtension) || undefined,
      skillHandling: (valueAsString(node.skillHandling) as PluginTargetDescriptor["skillHandling"]) || undefined,
      hookRegistrationFormat: valueAsString(node.hookRegistrationFormat) || undefined,
      hookRegistrationOutputPath: node.hookRegistrationOutputPath === null ? null : valueAsString(node.hookRegistrationOutputPath) || undefined,
      hookRegistrationAliasPaths: stringArray(node.hookRegistrationAliasPaths),
      harnessManifestPath: node.harnessManifestPath === null ? null : valueAsString(node.harnessManifestPath) || undefined,
      scriptVariants: stringArray(node.scriptVariants),
      adapterFamily,
      distribution,
      marketplacePath: valueAsString(node.marketplacePath) || undefined,
      installLayout,
      packageMetadata,
      componentSupport,
      cliCommand: valueAsString(node.cliCommand) || undefined,
      callerEnvVars: stringArray(node.callerEnvVars),
      configPaths: stringArray(node.configPaths),
      processNames: stringArray(node.processNames),
      harnessCapabilities: stringArray(node.capabilities),
      externalRepo: valueAsString(node.externalRepo) || undefined,
      externalPackageName: node.externalPackageName === null ? null : valueAsString(node.externalPackageName) || undefined,
      generatedSourceDir: valueAsString(node.generatedSourceDir) || undefined,
      requiredSurfaceFile: node.requiredSurfaceFile === null ? null : valueAsString(node.requiredSurfaceFile) || undefined,
      promptCapabilities: stringArray(node.promptCapabilities),
      loopControlTerm: valueAsString(node.loopControlTerm) || undefined,
      hookDriven: node.hookDriven === true || node.hookDriven === "true" ? true : node.hookDriven === false || node.hookDriven === "false" ? false : undefined,
      interactiveToolName: typeof node.interactiveToolName === "string" ? node.interactiveToolName : undefined,
      sessionEnvVarsDescription: valueAsString(node.sessionEnvVarsDescription) || undefined,
      hasIntentFidelityChecks: node.hasIntentFidelityChecks === true || node.hasIntentFidelityChecks === "true" ? true : false,
      hasNonNegotiables: node.hasNonNegotiables === true || node.hasNonNegotiables === "true" ? true : false,
      cliSetupMode: valueAsString(node.cliSetupMode) || undefined,
      defaultStepCount: typeof node.defaultStepCount === "number" ? node.defaultStepCount : undefined,
      skillSystemLabel: valueAsString(node.skillSystemLabel) || undefined,
      defaultTransportId: valueAsString(node.defaultTransportId) || undefined,
      hooksMuxFamily: valueAsString(node.hooksMuxFamily) || undefined,
      sessionIdQuality: valueAsString(node.sessionIdQuality) || undefined,
      supportsOrderedFanout: node.supportsOrderedFanout === true || node.supportsOrderedFanout === "true" ? true : node.supportsOrderedFanout === false || node.supportsOrderedFanout === "false" ? false : undefined,
      supportsNativeAdditionalContext: node.supportsNativeAdditionalContext === true || node.supportsNativeAdditionalContext === "true" ? true : node.supportsNativeAdditionalContext === false || node.supportsNativeAdditionalContext === "false" ? false : undefined,
      supportsBlock: node.supportsBlock === true || node.supportsBlock === "true" ? true : node.supportsBlock === false || node.supportsBlock === "false" ? false : undefined,
      supportsAsk: node.supportsAsk === true || node.supportsAsk === "true" ? true : node.supportsAsk === false || node.supportsAsk === "false" ? false : undefined,
      supportsToolInputMutation: node.supportsToolInputMutation === true || node.supportsToolInputMutation === "true" ? true : node.supportsToolInputMutation === false || node.supportsToolInputMutation === "false" ? false : undefined,
      supportsToolResultMutation: node.supportsToolResultMutation === true || node.supportsToolResultMutation === "true" ? true : node.supportsToolResultMutation === false || node.supportsToolResultMutation === "false" ? false : undefined,
      supportsPersistedEnv: node.supportsPersistedEnv === true || node.supportsPersistedEnv === "true" ? true : node.supportsPersistedEnv === false || node.supportsPersistedEnv === "false" ? false : undefined,
      envPersistenceMode: valueAsString(node.envPersistenceMode) || undefined,
      toolInterceptionScope: valueAsString(node.toolInterceptionScope) || undefined,
      supportedHooks: supportedHooksForTarget(targetId),
      evidenceIds: [],
    };
  });
}




interface AgentCatalogDataState {
  graph: CatalogGraph;
  graphDocument: GraphDocument;
  ontologySchema: OntologySchema;
  evidence: EvidenceRecord[];
  claims: ClaimRecord[];
  providers: ModelProviderVersion[];
  models: ModelVersion[];
  transports: TransportDescriptor[];
  capabilities: CapabilityDescriptor[];
  modalities: ModalityDescriptor[];
  hooks: HookDescriptor[];
  sessionNuances: SessionNuance[];
  lifecycleNuances: LifecycleNuance[];
  processes: ProcessDescriptor[];
  hostDetectionRules: HostDetectionRule[];
  agents: AgentVersion[];
  hostSignalMap: Record<string, string[]>;
  hostMetadataFields: Record<string, HostMetadataField[]>;
  hooksMuxDetectionRules: HooksMuxDetectionRule[];
  fallbackMetadata: Record<string, HarnessFallbackMetadata>;
  harnessImages: HarnessImageEntry[];
  pluginTargets: PluginTargetDescriptor[];
  capabilityAssertions: CapabilityAssertion[];
  agentCatalog: AgentCatalog;
}

let cachedDataState: AgentCatalogDataState | undefined;

function buildDataState(): AgentCatalogDataState {
  const graph = getCatalogGraph();
  const graphDocument = getGraphDocument();
  const ontologySchema = getOntologySchema();
  const evidenceNodes = listNodesByKind("EvidenceSource");
  const claimNodes = listNodesByKind("Claim");
  const evidenceClaims = buildClaimsByEvidence(claimNodes, evidenceNodes, listRelationshipsByRelation("sourced_from"));
  const evidence = evidenceNodes.map((node) => toEvidenceRecord(node, evidenceClaims));
  const claims = claimNodes.map(toClaimRecord);
  const providers = listNodesByKind("ModelProviderVersion").map(toModelProviderVersion);
  const models = listNodesByKind("ModelVersion").map(toModelVersion);
  const transports = listNodesByKind("TransportRuntime")
    .filter((node) => shouldSurfaceTransportRuntime(transportRuntimeId(node)))
    .map(toTransportDescriptor);
  const capabilities = listNodesByKind("Capability").map(toCapabilityDescriptor);
  const modalities = listNodesByKind("Modality")
    .filter((node) => !["json", "stream-events"].includes(valueAsString(node.modalityId)))
    .map(toModalityDescriptor);
  const hooks = listNodesByKind("HookSurface").map(toHookDescriptor);
  const sessionNuances = listNodesByKind("SessionSemantics").map(toSessionNuance);
  const lifecycleNuances = listNodesByKind("LifecycleSemantics").map(toLifecycleNuance);
  const processes = listNodesByKind("ProcessDescriptor").map(toProcessDescriptor);
  const hostDetectionRules = buildHostDetectionRules();
  const agents = listNodesByKind("AgentVersion").map(toAgentVersion);
  const hostSignalMap = buildHostSignalMap(hostDetectionRules);
  const hostMetadataFields = buildHostMetadataFields(hostDetectionRules);
  const hooksMuxDetectionRules = buildHookDetectionRules();
  const fallbackMetadata = buildFallbackMetadata(sessionNuances, agents);
  const harnessImages = buildHarnessImages();
  const pluginTargets = buildPluginTargetDescriptors(hooks);
  const capabilityAssertions = buildCapabilityAssertions();
  const agentCatalog: AgentCatalog = {
    schemaVersion: graphDocument.schemaVersion,
    generatedAt: graphDocument.generatedAt,
    evidence,
    claims,
    providers,
    models,
    transports,
    capabilities,
    modalities,
    hooks,
    sessionNuances,
    lifecycleNuances,
    processes,
    agents,
    capabilityAssertions,
    graph: graph.edges.map(
      (edge): GraphEdge => ({
        edgeId: edge.id,
        from: edge.from,
        to: edge.to,
        relation: edge.relation,
        versionRange: valueAsString(edge.versionRange) || ">=0.0.0",
        evidenceIds: stringArray(edge.evidenceRefs),
      }),
    ),
  };

  return {
    graph,
    graphDocument,
    ontologySchema,
    evidence,
    claims,
    providers,
    models,
    transports,
    capabilities,
    modalities,
    hooks,
    sessionNuances,
    lifecycleNuances,
    processes,
    hostDetectionRules,
    agents,
    hostSignalMap,
    hostMetadataFields,
    hooksMuxDetectionRules,
    fallbackMetadata,
    harnessImages,
    pluginTargets,
    capabilityAssertions,
    agentCatalog,
  };
}

export function clearAgentCatalogDataCache(): void {
  cachedDataState = undefined;
  clearAtlasBridgeCache();
}

export function getCatalogDataState(): AgentCatalogDataState {
  if (!cachedDataState) {
    cachedDataState = buildDataState();
  }
  return cachedDataState;
}

function createLazyContainer<T extends object>(kind: "array" | "object", resolve: () => T): T {
  const target = kind === "array" ? [] : {};
  return new Proxy(target, {
    get(_target, property) {
      const resolved = resolve() as object;
      const value = Reflect.get(resolved, property, resolved);
      return typeof value === "function" ? value.bind(resolved) : value;
    },
    set(_target, property, value) {
      return Reflect.set(resolve() as object, property, value);
    },
    has(_target, property) {
      return Reflect.has(resolve() as object, property);
    },
    ownKeys() {
      return Reflect.ownKeys(resolve() as object);
    },
    getOwnPropertyDescriptor(_target, property) {
      const descriptor = Reflect.getOwnPropertyDescriptor(resolve() as object, property);
      return descriptor ? { ...descriptor, configurable: true } : undefined;
    },
    defineProperty(_target, property, descriptor) {
      return Reflect.defineProperty(resolve() as object, property, descriptor);
    },
    deleteProperty(_target, property) {
      return Reflect.deleteProperty(resolve() as object, property);
    },
    getPrototypeOf() {
      return Reflect.getPrototypeOf(resolve() as object);
    },
    setPrototypeOf(_target, prototype) {
      return Reflect.setPrototypeOf(resolve() as object, prototype);
    },
    isExtensible() {
      return Reflect.isExtensible(resolve() as object);
    },
    preventExtensions() {
      return Reflect.preventExtensions(resolve() as object);
    },
  }) as T;
}

function createLazyArray<TValue>(resolve: () => TValue[]): TValue[] {
  return createLazyContainer("array", resolve);
}

function createLazyObject<TValue extends object>(resolve: () => TValue): TValue {
  return createLazyContainer("object", resolve);
}

export const GRAPH_DOCUMENT = createLazyObject(() => getCatalogDataState().graphDocument);
export const ONTOLOGY_SCHEMA = createLazyObject(() => getCatalogDataState().ontologySchema);
export const EVIDENCE = createLazyArray(() => getCatalogDataState().evidence);
export const CLAIMS = createLazyArray(() => getCatalogDataState().claims);
export const PROVIDERS = createLazyArray(() => getCatalogDataState().providers);
export const MODELS = createLazyArray(() => getCatalogDataState().models);
export const TRANSPORTS = createLazyArray(() => getCatalogDataState().transports);
export const CAPABILITIES = createLazyArray(() => getCatalogDataState().capabilities);
export const MODALITIES = createLazyArray(() => getCatalogDataState().modalities);
export const HOOKS = createLazyArray(() => getCatalogDataState().hooks);
export const SESSION_NUANCES = createLazyArray(() => getCatalogDataState().sessionNuances);
export const LIFECYCLE_NUANCES = createLazyArray(() => getCatalogDataState().lifecycleNuances);
export const PROCESSES = createLazyArray(() => getCatalogDataState().processes);
export const HOST_DETECTION_RULES = createLazyArray(() => getCatalogDataState().hostDetectionRules);
export const AGENTS = createLazyArray(() => getCatalogDataState().agents);
export const HOST_SIGNAL_MAP = createLazyObject(() => getCatalogDataState().hostSignalMap);
export const HOST_METADATA_FIELDS = createLazyObject(() => getCatalogDataState().hostMetadataFields);
export const HOOKS_MUX_DETECTION_RULES = createLazyArray(() => getCatalogDataState().hooksMuxDetectionRules);
export const FALLBACK_METADATA = createLazyObject(() => getCatalogDataState().fallbackMetadata);
export const HARNESS_IMAGES = createLazyArray(() => getCatalogDataState().harnessImages);
export const PLUGIN_TARGETS = createLazyArray(() => getCatalogDataState().pluginTargets);
export const CAPABILITY_ASSERTIONS = createLazyArray(() => getCatalogDataState().capabilityAssertions);
export const AGENT_CATALOG = createLazyObject(() => getCatalogDataState().agentCatalog);
