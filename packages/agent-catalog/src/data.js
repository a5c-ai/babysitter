"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGENT_CATALOG = exports.HARNESS_IMAGES = exports.FALLBACK_METADATA = exports.HOOKS_MUX_DETECTION_RULES = exports.HOST_METADATA_FIELDS = exports.HOST_SIGNAL_MAP = exports.AGENTS = exports.PROCESSES = exports.LIFECYCLE_NUANCES = exports.SESSION_NUANCES = exports.HOOKS = exports.MODALITIES = exports.CAPABILITIES = exports.TRANSPORTS = exports.MODELS = exports.PROVIDERS = exports.EVIDENCE = exports.ONTOLOGY_SCHEMA = exports.GRAPH_DOCUMENT = void 0;
const graph_1 = require("./graph");
const FALLBACK_SESSION_DIR = ".a5c/runs";
function valueAsString(value) {
    if (typeof value === "string") {
        return value;
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    return "";
}
function stringArray(value) {
    return Array.isArray(value) ? value.filter((entry) => typeof entry === "string") : [];
}
function nodeEvidenceIds(node) {
    return stringArray(node.evidenceRefs);
}
function toModelProviderVersion(node) {
    const product = (0, graph_1.getNodeById)(`provider:${valueAsString(node.providerId)}`);
    return {
        providerId: valueAsString(node.providerId),
        versionRange: valueAsString(node.versionRange),
        displayName: valueAsString(product?.displayName) || valueAsString(node.providerId),
        hostEnvSignals: stringArray(node.envSignals),
        authSignals: stringArray(node.authSignals),
        evidenceIds: nodeEvidenceIds(node),
    };
}
function toModelVersion(node) {
    const defaultForAgentIds = (0, graph_1.listRelationshipsByRelation)("defaults_to_model")
        .filter((edge) => edge.to === node.id)
        .map((edge) => {
        const agentNode = (0, graph_1.getNodeById)(edge.from);
        return valueAsString(agentNode?.agentId);
    })
        .filter(Boolean);
    return {
        modelId: valueAsString(node.modelId),
        providerId: valueAsString(node.providerId),
        versionRange: valueAsString(node.versionRange),
        label: valueAsString((0, graph_1.getNodeById)(`model:${valueAsString(node.modelId)}`)?.label) || valueAsString(node.modelId),
        defaultForAgentIds,
        evidenceIds: nodeEvidenceIds(node),
    };
}
function toTransportDescriptor(node) {
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
function toCapabilityDescriptor(node) {
    return {
        capabilityId: valueAsString(node.capabilityId),
        namespace: valueAsString(node.namespace),
        label: valueAsString(node.label),
        description: valueAsString(node.description),
        producerPackages: stringArray(node.producerPackages),
        evidenceIds: nodeEvidenceIds(node),
    };
}
function toModalityDescriptor(node) {
    const direction = valueAsString(node.direction);
    return {
        modalityId: valueAsString(node.modalityId),
        direction: direction === "input" || direction === "output" ? direction : "bidirectional",
        label: valueAsString(node.label),
        evidenceIds: nodeEvidenceIds(node),
    };
}
function toHookDescriptor(node) {
    const targetNames = Object.fromEntries((0, graph_1.listGraphNodes)()
        .filter((candidate) => candidate.kind === "HookMapping" && valueAsString(candidate.hookId) === valueAsString(node.hookId))
        .map((mapping) => [valueAsString(mapping.targetId), valueAsString(mapping.nativeName)]));
    return {
        hookId: valueAsString(node.hookId),
        canonicalName: valueAsString(node.canonicalName),
        targetNames,
        requiresRuntimeHooks: Boolean(node.requiresRuntimeHooks),
        evidenceIds: nodeEvidenceIds(node),
    };
}
function toSessionNuance(node) {
    return {
        nuanceId: valueAsString(node.sessionSemanticsId),
        agentId: valueAsString(node.agentId),
        versionRange: valueAsString(node.versionRange),
        sessionDirStrategy: valueAsString(node.sessionDirStrategy) || FALLBACK_SESSION_DIR,
        envSignals: stringArray(node.sessionIdSources),
        resumeSemantics: valueAsString(node.resumeSemantics),
        evidenceIds: nodeEvidenceIds(node),
    };
}
function toLifecycleNuance(node) {
    return {
        nuanceId: valueAsString(node.lifecycleSemanticsId),
        agentId: valueAsString(node.agentId),
        versionRange: valueAsString(node.versionRange),
        runtimeHookMode: valueAsString(node.runtimeHookMode),
        stopHookMode: valueAsString(node.stopHookMode),
        pluginContextMode: valueAsString(node.pluginContextMode),
        evidenceIds: nodeEvidenceIds(node),
    };
}
function toProcessDescriptor(node) {
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
function agentCapabilityIds(agentNodeId) {
    return (0, graph_1.listOutgoingTargets)(agentNodeId, "supports_capability")
        .map((supportNode) => valueAsString(supportNode.capabilityId) || valueAsString((0, graph_1.listOutgoingTargets)(supportNode.id, "for_capability")[0]?.capabilityId))
        .filter(Boolean);
}
function agentHookIds(agentNodeId) {
    return (0, graph_1.listOutgoingTargets)(agentNodeId, "emits_hook")
        .map((mapping) => valueAsString(mapping.hookId))
        .filter(Boolean);
}
function agentTransportIds(agentNodeId) {
    return (0, graph_1.listOutgoingTargets)(agentNodeId, "uses_transport")
        .filter((node) => node.kind === "TransportRuntime")
        .map((node) => valueAsString(node.runtimeId))
        .filter(Boolean);
}
function agentModalityIds(agentNodeId) {
    return (0, graph_1.listOutgoingTargets)(agentNodeId, "supports_modality")
        .map((node) => valueAsString(node.modalityId))
        .filter(Boolean);
}
function agentProviderIds(agentNodeId) {
    const providerIds = (0, graph_1.listOutgoingTargets)(agentNodeId, "defaults_to_model")
        .flatMap((modelNode) => (0, graph_1.listOutgoingTargets)(modelNode.id, "provided_by").map((providerNode) => valueAsString(providerNode.providerId)))
        .filter(Boolean);
    return Array.from(new Set(providerIds));
}
function agentModelIds(agentNodeId) {
    return (0, graph_1.listOutgoingTargets)(agentNodeId, "defaults_to_model")
        .map((node) => valueAsString(node.modelId))
        .filter(Boolean);
}
function agentPluginTargetIds(agentNodeId) {
    return (0, graph_1.listOutgoingTargets)(agentNodeId, "targets_plugin_surface")
        .map((node) => valueAsString(node.targetId))
        .filter(Boolean);
}
function agentSessionNuanceIds(agentNodeId) {
    return (0, graph_1.listOutgoingTargets)(agentNodeId, "uses_session_semantics")
        .map((node) => valueAsString(node.sessionSemanticsId))
        .filter(Boolean);
}
function agentLifecycleNuanceIds(agentNodeId) {
    return (0, graph_1.listOutgoingTargets)(agentNodeId, "uses_lifecycle_semantics")
        .map((node) => valueAsString(node.lifecycleSemanticsId))
        .filter(Boolean);
}
function toAgentVersion(node) {
    return {
        agentId: valueAsString(node.agentId),
        aliases: stringArray(node.aliases),
        versionRange: valueAsString(node.versionRange),
        runtimeFamily: valueAsString(node.runtimeFamily),
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
function toEvidenceRecord(node) {
    return {
        evidenceId: valueAsString(node.evidenceId),
        kind: valueAsString(node.kindLabel) === "web" ? "web" : "repo",
        sourcePathOrUrl: valueAsString(node.sourcePathOrUrl),
        excerptLocator: valueAsString(node.locator),
        claim: valueAsString((0, graph_1.getNodeById)(`claim:${valueAsString(node.evidenceId)}`)?.statement),
        capturedAt: valueAsString(node.capturedAt),
    };
}
function buildHookDetectionRules() {
    return (0, graph_1.listNodesByKind)("DiscoverySignal")
        .filter((node) => valueAsString(node.scope) === "hooks-mux")
        .map((node) => ({
        adapter: valueAsString(node.key),
        confidence: valueAsString(node.confidence) || "low",
        signals: stringArray(node.signals),
        absentSignals: stringArray(node.absentSignals),
    }));
}
function buildHostSignalMap() {
    const entries = (0, graph_1.listNodesByKind)("DiscoverySignal")
        .filter((node) => valueAsString(node.scope) === "host-detection")
        .map((node) => [valueAsString(node.key), stringArray(node.signals)]);
    return Object.fromEntries(entries);
}
function buildHostMetadataFields() {
    const entries = (0, graph_1.listNodesByKind)("DiscoverySignal")
        .filter((node) => valueAsString(node.scope) === "host-detection")
        .map((node) => [
        valueAsString(node.key),
        (Array.isArray(node.metadataFields) ? node.metadataFields : []).map((field) => ({
            key: valueAsString(field.key),
            envVars: stringArray(field.envVars),
        })),
    ]);
    return Object.fromEntries(entries);
}
function capabilityBoolean(agentNodeId, capabilityId) {
    return agentCapabilityIds(agentNodeId).includes(capabilityId);
}
function adapterNameForAgent(agentId, aliases) {
    if (agentId === "claude")
        return "claude";
    if (agentId === "gemini")
        return "gemini";
    if (agentId === "copilot")
        return "copilot";
    if (agentId === "omp")
        return "omp";
    return aliases[0] === "claude-code" ? "claude" : agentId;
}
function fallbackHarnessId(agentId, aliases) {
    if (agentId === "claude")
        return "claude-code";
    if (agentId === "gemini")
        return "gemini-cli";
    if (agentId === "copilot")
        return "github-copilot";
    if (agentId === "omp")
        return "oh-my-pi";
    return aliases[0] ?? agentId;
}
function buildFallbackMetadata() {
    const sessionNuancesById = new Map(exports.SESSION_NUANCES.map((nuance) => [nuance.nuanceId, nuance]));
    const metadataEntries = exports.AGENTS.filter((agent) => agent.runtimeFamily === "cli-harness").map((agent) => {
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
        ];
    });
    return Object.fromEntries(metadataEntries);
}
function slugify(versionRange) {
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
function buildHarnessImages() {
    return (0, graph_1.listNodesByKind)("PluginArtifact")
        .filter((node) => valueAsString(node.artifactKind) === "container-image")
        .map((node) => ({
        harness: valueAsString(node.targetId),
        image: valueAsString(node.pathPattern),
        tag: valueAsString(node.installerSurface) || undefined,
        preinstalled: stringArray(node.scriptVariants).includes("preinstalled"),
    }));
}
const GRAPH = (0, graph_1.getCatalogGraph)();
exports.GRAPH_DOCUMENT = (0, graph_1.getGraphDocument)();
exports.ONTOLOGY_SCHEMA = (0, graph_1.getOntologySchema)();
exports.EVIDENCE = (0, graph_1.listNodesByKind)("EvidenceSource").map(toEvidenceRecord);
exports.PROVIDERS = (0, graph_1.listNodesByKind)("ModelProviderVersion").map(toModelProviderVersion);
exports.MODELS = (0, graph_1.listNodesByKind)("ModelVersion").map(toModelVersion);
exports.TRANSPORTS = (0, graph_1.listNodesByKind)("TransportRuntime")
    .filter((node) => valueAsString(node.runtimeId) !== "amux-proxy")
    .map(toTransportDescriptor);
exports.CAPABILITIES = (0, graph_1.listNodesByKind)("Capability").map(toCapabilityDescriptor);
exports.MODALITIES = (0, graph_1.listNodesByKind)("Modality")
    .filter((node) => !["json", "stream-events"].includes(valueAsString(node.modalityId)))
    .map(toModalityDescriptor);
exports.HOOKS = (0, graph_1.listNodesByKind)("HookSurface").map(toHookDescriptor);
exports.SESSION_NUANCES = (0, graph_1.listNodesByKind)("SessionSemantics").map(toSessionNuance);
exports.LIFECYCLE_NUANCES = (0, graph_1.listNodesByKind)("LifecycleSemantics").map(toLifecycleNuance);
exports.PROCESSES = (0, graph_1.listNodesByKind)("ProcessDescriptor").map(toProcessDescriptor);
exports.AGENTS = (0, graph_1.listNodesByKind)("AgentVersion").map(toAgentVersion);
exports.HOST_SIGNAL_MAP = buildHostSignalMap();
exports.HOST_METADATA_FIELDS = buildHostMetadataFields();
exports.HOOKS_MUX_DETECTION_RULES = buildHookDetectionRules();
exports.FALLBACK_METADATA = buildFallbackMetadata();
exports.HARNESS_IMAGES = buildHarnessImages();
exports.AGENT_CATALOG = {
    schemaVersion: exports.GRAPH_DOCUMENT.schemaVersion,
    generatedAt: exports.GRAPH_DOCUMENT.generatedAt,
    evidence: exports.EVIDENCE,
    providers: exports.PROVIDERS,
    models: exports.MODELS,
    transports: exports.TRANSPORTS,
    capabilities: exports.CAPABILITIES,
    modalities: exports.MODALITIES,
    hooks: exports.HOOKS,
    sessionNuances: exports.SESSION_NUANCES,
    lifecycleNuances: exports.LIFECYCLE_NUANCES,
    processes: exports.PROCESSES,
    agents: exports.AGENTS,
    graph: GRAPH.edges.map((edge) => ({
        edgeId: edge.id,
        from: edge.from,
        to: edge.to,
        relation: edge.relation,
        versionRange: valueAsString(edge.versionRange) || ">=0.0.0",
        evidenceIds: stringArray(edge.evidenceRefs),
    })),
};
