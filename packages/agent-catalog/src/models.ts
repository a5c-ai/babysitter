export type NodeKind =
  | "AdapterModel"
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
  | "ProviderTranslation"
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
  evidencePolicy: GraphEvidencePolicy;
}

export interface VendorBackedEvidencePolicy {
  selector: {
    kindLabels: string[];
    trustLevels: string[];
  };
  requiredAttributes: string[];
  maxFreshnessWindowDays: number;
  reviewOwnerPattern: string;
  reachability: {
    timeoutMs: number;
    retries: number;
    acceptedStatusCodes: number[];
  };
}

export interface GraphEvidencePolicy {
  summary: string;
  vendorBackedEvidence: VendorBackedEvidencePolicy;
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
  trustLevel: string;
  reviewOwner: string;
  reviewedAt: string;
  freshnessWindowDays?: number;
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

export type ToolSchemaFormat = "openai" | "anthropic" | "google" | "none";

export interface CodecCapabilities {
  supportsTools: boolean;
  supportsStreaming: boolean;
  supportsTokenCounting: boolean;
  costTracking: boolean;
  toolSchemaFormat: ToolSchemaFormat;
}

export interface TransportDescriptor {
  transportId: string;
  label: string;
  status: string;
  interactive: boolean;
  persistentSession: boolean;
  stdinInjection: boolean;
  blockingStopHook: boolean;
  codecCapabilities?: CodecCapabilities;
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
  status: string;
  protocolKind: string;
  interactive: boolean;
  streaming: boolean;
  requestShape: string;
  responseShape: string;
  codecCapabilities?: CodecCapabilities;
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
  canonicalPhase?: string;
  blockCapability?: boolean;
  mutationCapability?: boolean;
  scope?: string;
  supportLevel: string;
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

export type HookSupportLevel = 'native' | 'emulated' | 'unsupported';

export interface HookSupportMap {
  sessionStart: HookSupportLevel;
  stop: HookSupportLevel;
  userPromptSubmit: HookSupportLevel;
  preToolUse: HookSupportLevel;
  sessionEnd: HookSupportLevel;
}

export interface BridgeCapabilities {
  interactiveBridge: boolean;
  sessionResume: boolean;
  positionalPrompt: boolean;
}

export interface InteractiveSignals {
  /** Regex pattern that appears in terminal output when the harness finishes a turn and is ready for input. */
  turnCompletePattern?: string;
  /** Whether the harness exits after processing a single prompt in non-interactive mode. */
  exitOnNonInteractive?: boolean;
  /** The harness-specific flag/mode for non-interactive one-shot execution (e.g. "--print" for Claude, "exec" for Codex). */
  nonInteractiveMode?: string;
  /** The harness-specific flag/mode for interactive session (e.g. no flag for Claude, no flag for Codex). */
  interactiveMode?: string;
}

export interface AdapterAuthMethod {
  type: string;
  name: string;
  envVars?: string[];
}

export interface AdapterRuntimeHooks {
  preToolUse?: string;
  postToolUse?: string;
  sessionStart?: string;
  sessionEnd?: string;
  stop?: string;
  userPromptSubmit?: string;
}

export interface AdapterConfigSchema {
  configFormat?: string;
  configFilePaths?: string[];
  projectConfigFilePaths?: string[];
}

export interface AdapterInstallCommand {
  type: string;
  command: string;
}

export interface AdapterMetadata {
  installCommands?: AdapterInstallCommand[];
  authMethods?: AdapterAuthMethod[];
  authFiles?: string[];
  hostEnvSignals?: string[];
  sessionDir?: string;
  sessionPersistence?: 'file' | 'sqlite' | 'none';
  automationEnv?: Record<string, string>;
  approvalModes?: string[];
  capabilityFlags?: Record<string, unknown>;
  runtimeHooks?: AdapterRuntimeHooks;
  configSchema?: AdapterConfigSchema;
  displayName?: string;
  defaultModelId?: string;
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
  interactiveSignals?: InteractiveSignals;
  hookSupport?: {
    interactive: HookSupportMap;
    nonInteractive: Partial<HookSupportMap>;
  };
  bridgeCapabilities?: BridgeCapabilities;
  adapterMetadata?: AdapterMetadata;
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
  hookRegistrationOutputPath?: string | null;
  hookRegistrationAliasPaths?: string[];
  harnessManifestPath?: string | null;
  scriptVariants?: string[];
  adapterFamily?: "shell-hook" | "programmatic";
  distribution?: "marketplace" | "npm-cli" | "both";
  marketplacePath?: string;
  installLayout?: PluginInstallLayout;
  packageMetadata?: PluginPackageMetadata;
  componentSupport?: PluginComponentSupport;
  cliCommand?: string;
  callerEnvVars?: string[];
  configPaths?: string[];
  processNames?: string[];
  harnessCapabilities?: string[];
  externalRepo?: string;
  externalPackageName?: string | null;
  generatedSourceDir?: string;
  requiredSurfaceFile?: string | null;
  promptCapabilities?: string[];
  loopControlTerm?: string;
  hookDriven?: boolean;
  interactiveToolName?: string;
  sessionEnvVarsDescription?: string;
  hasIntentFidelityChecks?: boolean;
  hasNonNegotiables?: boolean;
  cliSetupMode?: string;
  defaultStepCount?: number;
  skillSystemLabel?: string;
  defaultTransportId?: string;
  hooksMuxFamily?: string;
  sessionIdQuality?: string;
  supportsOrderedFanout?: boolean;
  supportsNativeAdditionalContext?: boolean;
  supportsBlock?: boolean;
  supportsAsk?: boolean;
  supportsToolInputMutation?: boolean;
  supportsToolResultMutation?: boolean;
  supportsPersistedEnv?: boolean;
  envPersistenceMode?: string;
  toolInterceptionScope?: string;
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

// ---------------------------------------------------------------------------
// AdapterModelRecord — model capabilities stored in atlas graph
// ---------------------------------------------------------------------------

export interface AdapterModelRecord {
  /** The harness (adapter) this model belongs to. */
  harness: string;
  /** The canonical model identifier. */
  modelId: string;
  /** An optional short alias. */
  modelAlias?: string;
  /** Human-readable display name. */
  displayName: string;
  /** Whether this model is deprecated. */
  deprecated: boolean;
  /** Maximum context window size in tokens. */
  contextWindow: number;
  /** Maximum output tokens. */
  maxOutputTokens: number;
  /** Maximum thinking/reasoning tokens. */
  maxThinkingTokens?: number;
  /** Cost per million input tokens in USD. */
  inputPricePerMillion?: number;
  /** Cost per million output tokens in USD. */
  outputPricePerMillion?: number;
  /** Whether this model supports extended thinking. */
  supportsThinking: boolean;
  /** Discrete thinking effort levels. */
  thinkingEffortLevels: string[];
  /** Whether this model supports tool/function calling. */
  supportsToolCalling: boolean;
  /** Whether this model supports parallel tool calls. */
  supportsParallelToolCalls: boolean;
  /** Whether tool call arguments stream incrementally. */
  supportsToolCallStreaming: boolean;
  /** Whether this model supports JSON-only output mode. */
  supportsJsonMode: boolean;
  /** Whether this model supports structured output with a schema. */
  supportsStructuredOutput: boolean;
  /** Whether this model supports real-time text token streaming. */
  supportsTextStreaming: boolean;
  /** Whether thinking/reasoning tokens stream. */
  supportsThinkingStreaming: boolean;
  /** Whether this model accepts image inputs. */
  supportsImageInput: boolean;
  /** Whether this model can produce image outputs. */
  supportsImageOutput: boolean;
  /** Whether this model accepts file inputs beyond images. */
  supportsFileInput: boolean;
  /** The CLI argument key used to select this model. */
  cliArgKey: string;
  /** The CLI argument value passed with cliArgKey. */
  cliArgValue: string;
  /** ISO 8601 timestamp of the last update. */
  lastUpdated: string;
  /** Whether this data comes from a bundled snapshot or a remote refresh. */
  source: 'bundled' | 'remote';
}
