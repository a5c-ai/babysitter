export type NodeKind = "AgentProduct" | "AgentVersion" | "Capability" | "CapabilitySupport" | "CiSurface" | "Claim" | "DiscoverySignal" | "EvidenceSource" | "HookMapping" | "HookSurface" | "LifecycleSemantics" | "Modality" | "ModelProviderProduct" | "ModelProviderVersion" | "ModelFamily" | "ModelVersion" | "PackageSurface" | "PathDescriptor" | "PluginArtifact" | "PluginTarget" | "ProcessDescriptor" | "SessionSemantics" | "TransportProtocol" | "TransportRuntime";
export interface GraphNode {
    id: string;
    kind: NodeKind;
    evidenceRefs?: string[];
    [key: string]: unknown;
}
export interface GraphRelationship {
    id: string;
    relation: string;
    from: string;
    to: string;
    evidenceRefs?: string[];
    [key: string]: unknown;
}
export interface GraphDocument {
    kind: "GraphDocument";
    id: string;
    graphId: string;
    schemaVersion: string;
    catalogVersion: string;
    generatedAt: string;
    owners: string[];
    imports: string[];
    schemaPath: string;
    defaultNamespace: string;
    evidencePolicy: string;
}
export interface OntologyKindRule {
    requiredAttributes: string[];
    from?: string[];
    to?: string[];
}
export interface OntologySchema {
    kind: "OntologySchema";
    id: string;
    schemaId: string;
    version: string;
    nodeKinds: Record<string, OntologyKindRule>;
    edgeKinds: Record<string, OntologyKindRule>;
    versionScopingRules: string[];
    deprecationRules: string[];
}
export interface CatalogGraph {
    document: GraphDocument;
    schema: OntologySchema;
    nodes: GraphNode[];
    edges: GraphRelationship[];
}
export interface EvidenceRecord {
    evidenceId: string;
    kind: "repo" | "web";
    sourcePathOrUrl: string;
    excerptLocator: string;
    claim: string;
    capturedAt: string;
}
export interface OntologyEvidenceShardDescriptor {
    entryKind: "evidence-sources" | "claims";
    group: string;
    relativePath: string;
    entryCount: number;
}
export interface OntologyEvidenceManifest {
    generatedAt: string;
    graphId: string;
    schemaVersion: string;
    exportVersion: number;
    shards: OntologyEvidenceShardDescriptor[];
}
export interface OntologyEvidenceShard<TEntry extends GraphNode = GraphNode> {
    kind: "EvidenceShard";
    entryKind: "evidence-sources" | "claims";
    group: string;
    generatedAt: string;
    entries: TEntry[];
}
export interface OntologyEvidenceExport {
    generatedAt: string;
    manifest: OntologyEvidenceManifest;
    evidenceSources: GraphNode[];
    claims: GraphNode[];
}
export interface ModelProviderVersion {
    providerId: string;
    versionRange: string;
    displayName: string;
    hostEnvSignals: string[];
    authSignals: string[];
    evidenceIds: string[];
}
export interface ModelVersion {
    modelId: string;
    providerId: string;
    versionRange: string;
    label: string;
    defaultForAgentIds: string[];
    evidenceIds: string[];
}
export interface TransportDescriptor {
    transportId: string;
    label: string;
    interactive: boolean;
    persistentSession: boolean;
    stdinInjection: boolean;
    blockingStopHook: boolean;
    evidenceIds: string[];
}
export interface CapabilityDescriptor {
    capabilityId: string;
    namespace: string;
    label: string;
    description: string;
    producerPackages: string[];
    evidenceIds: string[];
}
export interface ModalityDescriptor {
    modalityId: string;
    direction: "input" | "output" | "bidirectional";
    label: string;
    evidenceIds: string[];
}
export interface HookDescriptor {
    hookId: string;
    canonicalName: string;
    targetNames: Record<string, string>;
    requiresRuntimeHooks: boolean;
    evidenceIds: string[];
}
export interface SessionNuance {
    nuanceId: string;
    agentId: string;
    versionRange: string;
    sessionDirStrategy: string;
    envSignals: string[];
    resumeSemantics: string;
    evidenceIds: string[];
}
export interface LifecycleNuance {
    nuanceId: string;
    agentId: string;
    versionRange: string;
    runtimeHookMode: string;
    stopHookMode: string;
    pluginContextMode: string;
    evidenceIds: string[];
}
export interface ProcessDescriptor {
    processId: string;
    category: string;
    displayName: string;
    description: string;
    paths: string[];
    inputs: string[];
    outputs: string[];
    evidenceIds: string[];
}
export interface AgentVersion {
    agentId: string;
    aliases: string[];
    versionRange: string;
    runtimeFamily?: string;
    displayName: string;
    summary: string;
    sourcePackage: string;
    providerIds: string[];
    modelIds: string[];
    transportIds: string[];
    modalityIds: string[];
    capabilityIds: string[];
    hookIds: string[];
    pluginTargetIds: string[];
    sessionNuanceIds: string[];
    lifecycleNuanceIds: string[];
    evidenceIds: string[];
}
export interface GraphEdge {
    edgeId: string;
    from: string;
    to: string;
    relation: string;
    versionRange: string;
    evidenceIds: string[];
}
export interface HarnessCapabilitySnapshot {
    supportsSkills: boolean;
    supportsThinking: boolean;
    supportsMCP: boolean;
    requiresToolApproval: boolean;
    supportsInteractiveMode: boolean;
    supportsStdinInjection: boolean;
    supportsSubagentDispatch: boolean;
    supportsParallelExecution: boolean;
    supportsImageInput: boolean;
    hasRuntimeHooks: boolean;
    hasStopHook: boolean;
}
export interface HarnessFallbackMetadata {
    harnessId: string;
    adapterName: string;
    hostEnvSignals: string[];
    sessionDir: string;
    capabilities: HarnessCapabilitySnapshot;
    evidenceIds: string[];
}
export interface HostMetadataField {
    key: string;
    envVars: string[];
}
export interface HooksMuxDetectionRule {
    adapter: string;
    confidence: "high" | "medium" | "low";
    signals: string[];
    absentSignals?: string[];
}
export interface HarnessImageEntry {
    harness: string;
    image: string;
    tag?: string;
    preinstalled: boolean;
}
export interface UiAgentCard {
    id: string;
    name: string;
    versionRange: string;
    description: string;
    providerNames: string[];
    transportLabels: string[];
    capabilities: string[];
    hookNames: string[];
    filePath: string;
    directory: string;
    metadata: Record<string, unknown>;
}
export interface AgentCatalog {
    schemaVersion: string;
    generatedAt: string;
    evidence: EvidenceRecord[];
    providers: ModelProviderVersion[];
    models: ModelVersion[];
    transports: TransportDescriptor[];
    capabilities: CapabilityDescriptor[];
    modalities: ModalityDescriptor[];
    hooks: HookDescriptor[];
    sessionNuances: SessionNuance[];
    lifecycleNuances: LifecycleNuance[];
    processes: ProcessDescriptor[];
    agents: AgentVersion[];
    graph: GraphEdge[];
}
//# sourceMappingURL=models.d.ts.map