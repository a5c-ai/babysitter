"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCatalogGraphSnapshot = getCatalogGraphSnapshot;
exports.getCatalogGraphDocument = getCatalogGraphDocument;
exports.getCatalogOntologySchema = getCatalogOntologySchema;
exports.getAgentCatalog = getAgentCatalog;
exports.listAgentVersions = listAgentVersions;
exports.getAgentVersions = getAgentVersions;
exports.listOntologyNodesByKind = listOntologyNodesByKind;
exports.listOntologyRelations = listOntologyRelations;
exports.getFallbackHarnessMetadata = getFallbackHarnessMetadata;
exports.listFallbackHarnessMetadata = listFallbackHarnessMetadata;
exports.getHostSignalMap = getHostSignalMap;
exports.getHostMetadataFields = getHostMetadataFields;
exports.getHooksMuxDetectionRules = getHooksMuxDetectionRules;
exports.getHarnessImages = getHarnessImages;
exports.lookupHarnessImage = lookupHarnessImage;
exports.listPluginTargets = listPluginTargets;
exports.getHookCatalog = getHookCatalog;
exports.getHookNameMap = getHookNameMap;
exports.getUiAgentCards = getUiAgentCards;
const data_1 = require("./data");
const graph_1 = require("./graph");
const HARNESS_ALIASES = {
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
function clone(value) {
    return JSON.parse(JSON.stringify(value));
}
function providerNamesById() {
    return new Map(data_1.AGENT_CATALOG.providers.map((provider) => [provider.providerId, provider.displayName]));
}
function transportLabelsById() {
    return new Map(data_1.AGENT_CATALOG.transports.map((transport) => [transport.transportId, transport.label]));
}
function capabilityLabelsById() {
    return new Map(data_1.AGENT_CATALOG.capabilities.map((capability) => [capability.capabilityId, capability.label]));
}
function hookNamesById() {
    return new Map(data_1.AGENT_CATALOG.hooks.map((hook) => [hook.hookId, hook.canonicalName]));
}
function getCatalogGraphSnapshot() {
    return clone((0, graph_1.getCatalogGraph)());
}
function getCatalogGraphDocument() {
    return clone(data_1.GRAPH_DOCUMENT);
}
function getCatalogOntologySchema() {
    return clone(data_1.ONTOLOGY_SCHEMA);
}
function getAgentCatalog() {
    return clone(data_1.AGENT_CATALOG);
}
function listAgentVersions() {
    return clone(data_1.AGENT_CATALOG.agents);
}
function getAgentVersions(agentIdOrAlias) {
    const normalized = agentIdOrAlias.toLowerCase();
    return data_1.AGENT_CATALOG.agents.filter((agent) => agent.agentId === normalized ||
        agent.aliases.includes(normalized) ||
        agent.displayName.toLowerCase() === normalized);
}
function listOntologyNodesByKind(kind) {
    return clone((0, graph_1.listGraphNodes)().filter((node) => node.kind === kind));
}
function listOntologyRelations(relation) {
    return clone((0, graph_1.listRelationshipsByRelation)(relation));
}
function getFallbackHarnessMetadata(harnessName) {
    const key = HARNESS_ALIASES[harnessName] ?? harnessName;
    const metadata = data_1.FALLBACK_METADATA[key];
    return metadata ? clone(metadata) : undefined;
}
function listFallbackHarnessMetadata() {
    return clone(data_1.FALLBACK_METADATA);
}
function getHostSignalMap() {
    return clone(data_1.HOST_SIGNAL_MAP);
}
function getHostMetadataFields() {
    return clone(data_1.HOST_METADATA_FIELDS);
}
function getHooksMuxDetectionRules() {
    return clone(data_1.HOOKS_MUX_DETECTION_RULES);
}
function getHarnessImages() {
    return clone(data_1.HARNESS_IMAGES);
}
function lookupHarnessImage(harness) {
    return data_1.HARNESS_IMAGES.find((entry) => entry.harness === harness);
}
function listPluginTargets() {
    return Array.from(new Set(data_1.AGENT_CATALOG.agents.flatMap((agent) => agent.pluginTargetIds))).sort();
}
function getHookCatalog() {
    return clone(data_1.HOOKS);
}
function getHookNameMap() {
    const map = {};
    for (const hook of data_1.HOOKS) {
        map[hook.canonicalName] = { ...hook.targetNames };
    }
    return map;
}
function getUiAgentCards() {
    const providers = providerNamesById();
    const transports = transportLabelsById();
    const capabilities = capabilityLabelsById();
    const hooks = hookNamesById();
    return data_1.AGENT_CATALOG.agents.map((agent, index) => ({
        id: `${index + 1}`,
        name: agent.displayName,
        versionRange: agent.versionRange,
        description: agent.summary,
        providerNames: agent.providerIds.map((providerId) => providers.get(providerId) ?? providerId),
        transportLabels: agent.transportIds.map((transportId) => transports.get(transportId) ?? transportId),
        capabilities: agent.capabilityIds.map((capabilityId) => capabilities.get(capabilityId) ?? capabilityId),
        hookNames: agent.hookIds.map((hookId) => hooks.get(hookId) ?? hookId),
        filePath: "packages/agent-catalog/graph/nodes/agents/versions.yaml",
        directory: "packages/agent-catalog/graph",
        metadata: {
            agentId: agent.agentId,
            aliases: agent.aliases,
            pluginTargets: agent.pluginTargetIds,
            modalities: agent.modalityIds,
            evidenceIds: agent.evidenceIds,
            schemaVersion: data_1.GRAPH_DOCUMENT.schemaVersion,
        },
    }));
}
