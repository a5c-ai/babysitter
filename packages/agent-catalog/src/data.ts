import {
  getCatalogGraph,
  getGraphDocument,
  getOntologySchema,
  getNodeById,
  listGraphNodes,
  listNodesByKind,
  listOutgoingTargets,
  listRelationshipsByRelation,
} from "./graph";
import type {
  AgentCatalog,
  AgentVersion,
  CapabilityAssertion,
  CapabilityDescriptor,
  ClaimConfidence,
  ClaimEvidenceStrength,
  ClaimProvenanceKind,
  ClaimRecord,
  EvidenceRecord,
  GraphEdge,
  GraphNode,
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
  TransportDescriptor,
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
    transportId: valueAsString(node.runtimeId),
    label: valueAsString(node.label),
    interactive: Boolean(node.persistentSession) || Boolean(node.stdinInjection),
    persistentSession: Boolean(node.persistentSession),
    stdinInjection: Boolean(node.stdinInjection),
    blockingStopHook: Boolean(node.blockingStopHook),
    evidenceIds: nodeEvidenceIds(node),
  };
}

function toCapabilityDescriptor(node: GraphNode): CapabilityDescriptor {
  return {
    capabilityId: valueAsString(node.capabilityId),
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
  return listOutgoingTargets(agentNodeId, "supports_capability")
    .map((supportNode) => valueAsString(supportNode.capabilityId) || valueAsString(listOutgoingTargets(supportNode.id, "for_capability")[0]?.capabilityId))
    .filter(Boolean);
}

function agentHookIds(agentNodeId: string): string[] {
  return listOutgoingTargets(agentNodeId, "emits_hook")
    .map((mapping) => valueAsString(mapping.hookId))
    .filter(Boolean);
}

function agentTransportIds(agentNodeId: string): string[] {
  return listOutgoingTargets(agentNodeId, "uses_transport")
    .filter((node) => node.kind === "TransportRuntime")
    .map((node) => valueAsString(node.runtimeId))
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

function agentSessionNuanceIds(agentNodeId: string): string[] {
  return listOutgoingTargets(agentNodeId, "uses_session_semantics")
    .map((node) => valueAsString(node.sessionSemanticsId))
    .filter(Boolean);
}

function agentLifecycleNuanceIds(agentNodeId: string): string[] {
  return listOutgoingTargets(agentNodeId, "uses_lifecycle_semantics")
    .map((node) => valueAsString(node.lifecycleSemanticsId))
    .filter(Boolean);
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
  };
}

function toEvidenceRecord(node: GraphNode): EvidenceRecord {
  return {
    evidenceId: valueAsString(node.evidenceId),
    kind: valueAsString(node.kindLabel) === "web" ? "web" : "repo",
    sourcePathOrUrl: valueAsString(node.sourcePathOrUrl),
    excerptLocator: valueAsString(node.locator),
    claim: valueAsString(getNodeById<GraphNode>(`claim:${valueAsString(node.evidenceId)}`)?.statement),
    capturedAt: valueAsString(node.capturedAt),
  };
}

function toClaimRecord(node: GraphNode): ClaimRecord {
  return {
    claimId: valueAsString(node.claimId),
    statement: valueAsString(node.statement),
    subjectKind: valueAsString(node.subjectKind),
    subjectId: valueAsString(node.subjectId),
    confidence: claimConfidence(node.confidence),
    status: valueAsString(node.status),
    provenanceKind: claimProvenanceKind(node.provenanceKind),
    evidenceStrength: claimEvidenceStrength(node.evidenceStrength),
    evidenceIds: stringArray(node.evidenceIds),
    unresolvedGaps: stringArray(node.unresolvedGaps),
  };
}

function buildCapabilityAssertions(): CapabilityAssertion[] {
  return listNodesByKind("CapabilitySupport").map((node) => {
    const supportingClaims = listOutgoingTargets(node.id, "supported_by_claim")
      .filter((claim): claim is GraphNode => claim.kind === "Claim")
      .map(toClaimRecord);
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

function buildHostSignalMap(): Record<string, string[]> {
  const entries = HOST_DETECTION_RULES.map((rule) => [rule.agent, rule.signals] as const);
  return Object.fromEntries(entries);
}

function buildHostMetadataFields(): Record<string, HostMetadataField[]> {
  const entries = HOST_DETECTION_RULES.map((rule) => [rule.agent, rule.metadataFields] as const);
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

function buildFallbackMetadata(): Record<string, HarnessFallbackMetadata> {
  const sessionNuancesById = new Map(SESSION_NUANCES.map((nuance) => [nuance.nuanceId, nuance]));
  const metadataEntries = AGENTS.filter((agent) => agent.runtimeFamily === "cli-harness").map((agent) => {
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
      harness: valueAsString(node.targetId),
      image: valueAsString(node.pathPattern),
      tag: valueAsString(node.installerSurface) || undefined,
      preinstalled: stringArray(node.scriptVariants).includes("preinstalled"),
    }));
}

function buildPluginTargetDescriptors(): PluginTargetDescriptor[] {
  const hookNamesById = new Map(HOOKS.map((hook) => [hook.hookId, hook.canonicalName]));

  return listNodesByKind("PluginTarget").map((node) => {
    const targetId = valueAsString(node.targetId);
    const supportedHooks = Object.fromEntries(
      listNodesByKind("HookMapping")
        .filter((mapping) => valueAsString(mapping.targetId) === targetId)
        .map((mapping) => {
          const hookId = valueAsString(mapping.hookId);
          return [hookNamesById.get(hookId) ?? hookId, valueAsString(mapping.nativeName)] as const;
        }),
    );

    return {
      targetId,
      displayName: valueAsString(node.displayName),
      adapterName: valueAsString(node.adapterName),
      manifestFormat: valueAsString(node.manifestFormat),
      commandFormat: valueAsString(node.commandFormat),
      distributionModel: valueAsString(node.distributionModel),
      npmPublishable: Boolean(node.npmPublishable),
      pluginRootEnvVar:
        node.pluginRootEnvVar === null ? null : valueAsString(node.pluginRootEnvVar) || undefined,
      pluginRootEnvVarForExtension:
        node.pluginRootEnvVarForExtension === null
          ? null
          : valueAsString(node.pluginRootEnvVarForExtension) || undefined,
      skillHandling:
        (valueAsString(node.skillHandling) as PluginTargetDescriptor["skillHandling"]) || undefined,
      hookRegistrationFormat: valueAsString(node.hookRegistrationFormat) || undefined,
      scriptVariants: stringArray(node.scriptVariants),
      adapterFamily:
        (valueAsString(node.adapterFamily) as PluginTargetDescriptor["adapterFamily"]) || undefined,
      distribution:
        (valueAsString(node.distribution) as PluginTargetDescriptor["distribution"]) || undefined,
      marketplacePath: valueAsString(node.marketplacePath) || undefined,
      installLayout:
        node.installLayout && typeof node.installLayout === "object"
          ? {
              harnessHomeRelative: valueAsString((node.installLayout as GraphNode).harnessHomeRelative) || null,
              pluginsDirRelative: valueAsString((node.installLayout as GraphNode).pluginsDirRelative) || null,
              marketplacePathRelative:
                valueAsString((node.installLayout as GraphNode).marketplacePathRelative) || null,
            }
          : undefined,
      packageMetadata:
        node.packageMetadata && typeof node.packageMetadata === "object"
          ? {
              moduleType:
                (valueAsString((node.packageMetadata as GraphNode).moduleType) as PluginPackageMetadata["moduleType"]) ||
                undefined,
              binScriptExt:
                (valueAsString((node.packageMetadata as GraphNode).binScriptExt) as PluginPackageMetadata["binScriptExt"]) ||
                undefined,
              installLifecycle:
                (valueAsString((node.packageMetadata as GraphNode).installLifecycle) as PluginPackageMetadata["installLifecycle"]) ||
                undefined,
              activationMessage:
                (valueAsString((node.packageMetadata as GraphNode).activationMessage) as PluginPackageMetadata["activationMessage"]) ||
                undefined,
              extraPackageFiles: stringArray((node.packageMetadata as GraphNode).extraPackageFiles),
              extraScripts:
                ((node.packageMetadata as GraphNode).extraScripts as Record<string, string> | undefined) ?? undefined,
              peerDependencyPackage:
                valueAsString((node.packageMetadata as GraphNode).peerDependencyPackage) || undefined,
              emitCjsWrappers: Boolean((node.packageMetadata as GraphNode).emitCjsWrappers),
            }
          : undefined,
      componentSupport:
        node.componentSupport && typeof node.componentSupport === "object"
          ? {
              agents:
                (valueAsString((node.componentSupport as GraphNode).agents) as PluginComponentSupport["agents"]) ||
                "unsupported",
              context:
                (valueAsString((node.componentSupport as GraphNode).context) as PluginComponentSupport["context"]) ||
                "unsupported",
            }
          : undefined,
      supportedHooks,
      evidenceIds: nodeEvidenceIds(node),
    };
  });
}

const GRAPH = getCatalogGraph();
export const GRAPH_DOCUMENT = getGraphDocument();
export const ONTOLOGY_SCHEMA = getOntologySchema();

export const EVIDENCE = listNodesByKind("EvidenceSource").map(toEvidenceRecord);
export const CLAIMS = listNodesByKind("Claim").map(toClaimRecord);
export const PROVIDERS = listNodesByKind("ModelProviderVersion").map(toModelProviderVersion);
export const MODELS = listNodesByKind("ModelVersion").map(toModelVersion);
export const TRANSPORTS = listNodesByKind("TransportRuntime")
  .filter((node) => valueAsString(node.runtimeId) !== "amux-proxy")
  .map(toTransportDescriptor);
export const CAPABILITIES = listNodesByKind("Capability").map(toCapabilityDescriptor);
export const MODALITIES = listNodesByKind("Modality")
  .filter((node) => !["json", "stream-events"].includes(valueAsString(node.modalityId)))
  .map(toModalityDescriptor);
export const HOOKS = listNodesByKind("HookSurface").map(toHookDescriptor);
export const SESSION_NUANCES = listNodesByKind("SessionSemantics").map(toSessionNuance);
export const LIFECYCLE_NUANCES = listNodesByKind("LifecycleSemantics").map(toLifecycleNuance);
export const PROCESSES = listNodesByKind("ProcessDescriptor").map(toProcessDescriptor);
export const HOST_DETECTION_RULES = buildHostDetectionRules();
export const AGENTS = listNodesByKind("AgentVersion").map(toAgentVersion);
export const HOST_SIGNAL_MAP = buildHostSignalMap();
export const HOST_METADATA_FIELDS = buildHostMetadataFields();
export const HOOKS_MUX_DETECTION_RULES = buildHookDetectionRules();
export const FALLBACK_METADATA = buildFallbackMetadata();
export const HARNESS_IMAGES = buildHarnessImages();
export const PLUGIN_TARGETS = buildPluginTargetDescriptors();
export const CAPABILITY_ASSERTIONS = buildCapabilityAssertions();

export const AGENT_CATALOG: AgentCatalog = {
  schemaVersion: GRAPH_DOCUMENT.schemaVersion,
  generatedAt: GRAPH_DOCUMENT.generatedAt,
  evidence: EVIDENCE,
  claims: CLAIMS,
  providers: PROVIDERS,
  models: MODELS,
  transports: TRANSPORTS,
  capabilities: CAPABILITIES,
  modalities: MODALITIES,
  hooks: HOOKS,
  sessionNuances: SESSION_NUANCES,
  lifecycleNuances: LIFECYCLE_NUANCES,
  processes: PROCESSES,
  agents: AGENTS,
  capabilityAssertions: CAPABILITY_ASSERTIONS,
  graph: GRAPH.edges.map(
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
