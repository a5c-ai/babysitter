export type NodeKind =
  | "AgentProduct"
  | "AgentVersion"
  | "Capability"
  | "CapabilitySupport"
  | "CiSurface"
  | "Claim"
  | "DiscoverySignal"
  | "EvidenceSource"
  | "HookMapping"
  | "HookSurface"
  | "LifecycleSemantics"
  | "Modality"
  | "ModelProviderProduct"
  | "ModelProviderVersion"
  | "ModelFamily"
  | "ModelVersion"
  | "PackageSurface"
  | "PathDescriptor"
  | "PluginArtifact"
  | "PluginTarget"
  | "ProcessDescriptor"
  | "SessionSemantics"
  | "TransportProtocol"
  | "TransportRuntime";

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

export type ClaimConfidence = "high" | "medium" | "low";

export type ClaimProvenanceKind = "repo-observation" | "vendor-documentation" | "vendor-inference";

export type ClaimEvidenceStrength = "corroborated" | "partial" | "inferred";

export interface ClaimRecord {
  claimId: string;
  statement: string;
  subjectKind: string;
  subjectId: string;
  confidence: ClaimConfidence;
  status: string;
  provenanceKind: ClaimProvenanceKind;
  evidenceStrength: ClaimEvidenceStrength;
  evidenceIds: string[];
  unresolvedGaps: string[];
}

export interface CapabilityAssertion {
  supportId: string;
  capabilityId: string;
  subjectKind: string;
  subjectId: string;
  versionRange: string;
  supportLevel: string;
  notes?: string;
  evidenceIds: string[];
  hasVendorEvidence: boolean;
  evidenceStrength: ClaimEvidenceStrength;
  unresolvedGaps: string[];
  supportingClaims: ClaimRecord[];
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
  stateFilePatterns: string[];
  pidMarkerPolicy: string;
  metadataFields: HostMetadataField[];
  evidenceIds: string[];
}

export interface LifecycleNuance {
  nuanceId: string;
  agentId: string;
  versionRange: string;
  runtimeHookMode: string;
  stopHookMode: string;
  backgroundTaskMode: string;
  checkpointMode: string;
  pluginContextMode: string;
  platformNuances: string[];
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

export interface AgentProductDescriptor {
  agentId: string;
  displayName: string;
  aliases: string[];
  vendor: string;
  families: string[];
  status: string;
  evidenceIds: string[];
}

export interface ModelProviderProductDescriptor {
  providerId: string;
  displayName: string;
  kindLabel: string;
  vendor: string;
  homepage?: string | null;
  apiFamilies: string[];
  authKinds: string[];
  evidenceIds: string[];
}

export interface ModelFamilyDescriptor {
  modelId: string;
  providerId: string;
  label: string;
  modalities: string[];
  reasoningFamily?: string;
  status: string;
  evidenceIds: string[];
}

export interface TransportProtocolDescriptor {
  transportId: string;
  label: string;
  protocolKind: string;
  interactive: boolean;
  streaming: boolean;
  requestShape: string;
  responseShape: string;
  evidenceIds: string[];
}

export interface CapabilitySupportRecord {
  supportId: string;
  capabilityId: string;
  supportLevel: string;
  subjectKind: "AgentVersion" | "ModelProviderVersion" | "TransportRuntime" | "PluginTarget";
  subjectId: string;
  versionRange: string;
  notes?: string;
  evidenceIds: string[];
}

export interface HookMappingDescriptor {
  mappingId: string;
  hookId: string;
  targetId: string;
  nativeName: string;
  versionRange: string;
  requiresRuntimeHooks: boolean;
  evidenceIds: string[];
}

export interface DiscoverySignalDescriptor {
  signalId: string;
  signalKind: string;
  key: string;
  matchMode: string;
  confidence: "high" | "medium" | "low";
  scope: string;
  signals: string[];
  absentSignals: string[];
  argvMatches: string[];
  metadataFields: HostMetadataField[];
  evidenceIds: string[];
}

export interface PackageSurfaceDescriptor {
  packageId: string;
  packageName: string;
  workspacePath: string;
  moduleType: string;
  surfaceKinds: string[];
  sourceOfTruthRole: string;
  evidenceIds: string[];
}

export interface PathDescriptorRecord {
  pathId: string;
  path: string;
  pathKind: string;
  ownerKind: string;
  ownerId: string;
  platform: string;
  notes?: string;
  evidenceIds: string[];
}

export interface CiSurfaceDescriptor {
  ciId: string;
  packageId: string;
  scripts: string[];
  publishStrategy: string;
  releaseChannels: string[];
  validationCommands: string[];
  evidenceIds: string[];
}

export interface AgentVersion {
  agentId: string;
  aliases: string[];
  versionRange: string;
  releaseChannel: string;
  since: string | null;
  until: string | null;
  runtimeFamily?: string;
  osSupport: string[];
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

export interface PluginInstallLayout {
  harnessHomeRelative?: string | null;
  pluginsDirRelative?: string | null;
  marketplacePathRelative?: string | null;
}

export interface PluginPackageMetadata {
  moduleType?: "commonjs" | "module";
  binScriptExt?: ".js" | ".cjs";
  installLifecycle?: "postinstall" | "plugin-scripts" | "none";
  activationMessage?: "restart" | "codex-open-plugins";
  extraPackageFiles?: string[];
  extraScripts?: Record<string, string>;
  peerDependencyPackage?: string;
  emitCjsWrappers?: boolean;
}

export interface PluginComponentSupport {
  agents: "native" | "unsupported";
  context: "native" | "unsupported";
}

export interface PluginTargetDescriptor {
  targetId: string;
  displayName: string;
  adapterName: string;
  manifestFormat: string;
  commandFormat: string;
  distributionModel: string;
  npmPublishable: boolean;
  pluginRootEnvVar?: string | null;
  pluginRootEnvVarForExtension?: string | null;
  skillHandling?: "native" | "derived-from-commands" | "none";
  hookRegistrationFormat?: string | null;
  scriptVariants?: string[];
  adapterFamily?: "shell-hook" | "programmatic";
  distribution?: "marketplace" | "npm-cli" | "both";
  marketplacePath?: string;
  installLayout?: PluginInstallLayout;
  packageMetadata?: PluginPackageMetadata;
  componentSupport?: PluginComponentSupport;
  supportedHooks: Record<string, string>;
  evidenceIds: string[];
}

export interface HostDetectionRule {
  agent: string;
  confidence: "high" | "medium" | "low";
  signals: string[];
  metadataFields: HostMetadataField[];
  argvMatches: string[];
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

export interface AgentVersionReference {
  id: string;
  slug: string;
  agentId: string;
  name: string;
  versionRange: string;
}

export interface AgentOntologyEvidenceSummary {
  evidenceCount: number;
  claimCount: number;
  corroboratedCount: number;
  partialCount: number;
  inferredCount: number;
  unresolvedGapCount: number;
}

export interface AgentOntologyListItem extends AgentVersionReference {
  aliases: string[];
  runtimeFamily?: string;
  releaseChannel: string;
  since: string | null;
  until: string | null;
  osSupport: string[];
  description: string;
  sourcePackage: string;
  providers: ModelProviderVersion[];
  models: ModelVersion[];
  transports: TransportDescriptor[];
  modalities: ModalityDescriptor[];
  capabilities: CapabilityDescriptor[];
  hooks: HookDescriptor[];
  pluginTargets: PluginTargetDescriptor[];
  sessionSemantics: SessionNuance[];
  lifecycleSemantics: LifecycleNuance[];
  evidenceSummary: AgentOntologyEvidenceSummary;
  filePath: string;
  directory: string;
}

export interface AgentOntologyDetail extends AgentOntologyListItem {
  capabilityMatrix: CapabilityAssertion[];
  evidence: EvidenceRecord[];
  claims: ClaimRecord[];
  supersedes: AgentVersionReference[];
  supersededBy: AgentVersionReference[];
  schemaVersion: string;
  generatedAt: string;
}

export interface AgentCatalog {
  schemaVersion: string;
  generatedAt: string;
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
  agents: AgentVersion[];
  capabilityAssertions: CapabilityAssertion[];
  graph: GraphEdge[];
}

export interface AgentCapabilitySupportMatrix {
  agent: AgentVersion;
  capabilitySupport: CapabilitySupportRecord[];
  capabilities: CapabilityDescriptor[];
}

export interface AgentVersionTopology {
  agent: AgentVersion;
  product?: AgentProductDescriptor;
  capabilitySupport: CapabilitySupportRecord[];
  capabilities: CapabilityDescriptor[];
  defaultModels: ModelVersion[];
  modelFamilies: ModelFamilyDescriptor[];
  providerVersions: ModelProviderVersion[];
  providers: ModelProviderProductDescriptor[];
  transportRuntimes: TransportDescriptor[];
  transportProtocols: TransportProtocolDescriptor[];
  modalities: ModalityDescriptor[];
  sessionSemantics: SessionNuance[];
  lifecycleSemantics: LifecycleNuance[];
  discoverySignals: DiscoverySignalDescriptor[];
  hookMappings: HookMappingDescriptor[];
  hooks: HookDescriptor[];
  pluginTargets: PluginTargetDescriptor[];
}

export interface ProviderModelTopology {
  provider: ModelProviderProductDescriptor;
  versions: ModelProviderVersion[];
  capabilitySupport: CapabilitySupportRecord[];
  capabilities: CapabilityDescriptor[];
  models: ModelVersion[];
  modelFamilies: ModelFamilyDescriptor[];
  agents: AgentVersion[];
}

export interface PackageTopology {
  package: PackageSurfaceDescriptor;
  processes: ProcessDescriptor[];
  ciSurfaces: CiSurfaceDescriptor[];
  directPaths: PathDescriptorRecord[];
  processPaths: PathDescriptorRecord[];
  wrapsGraphIds: string[];
}

export interface SubjectProvenance {
  subjectId: string;
  claims: ClaimRecord[];
  evidence: EvidenceRecord[];
}

export interface OntologyEvidenceSearchResult {
  query: string;
  evidence: EvidenceRecord[];
  claims: ClaimRecord[];
}
