/** Create a Krate API controller for a given namespace, providing resource CRUD and org-scoped operations. */
export { createKrateApiController, KRATE_API_CONTROLLER_BOUNDARY } from '../../core/src/api-controller.js';

/** Fetch the controller UI model from a running Krate API server for dashboard rendering. */
export { fetchControllerUiModel } from '../../core/src/controller-client.js';
/** Clear the in-memory snapshot cache to force a fresh kubectl fetch on next read. */
export { clearSnapshotCache } from '../../core/src/snapshot-cache.js';

/** Build a controller UI model from raw resources for server-side rendering of the console dashboard. */
export { createControllerUiModel, issueProjectRefs, issueRepositoryRefs } from '../../core/src/controller-ui.js';

/** Authentication helpers: OAuth flows, session cookies, identity registration, and team/invite resource creation. */
export {
  createAuthProviderConfig,
  listEnabledAuthProviders,
  buildAuthorizationRedirect,
  exchangeOAuthCodeForProfile,
  parseSessionCookie,
  createSessionCookie,
  registerLoginProfile,
  mapLoginProfileToKrateIdentity,
  profileFromDelegatedHeaders,
  createInviteResource,
  createTeamResource
} from '../../core/src/auth.js';

/** Map an OIDC identity to a Krate workspace identity with groups and UID. */
export { mapOidcIdentity } from '../../core/src/identity-policy.js';

/** Resource model: create, validate, and serialize Krate CRD resources across all 89 kinds. */
export {
  createResource,
  validateResource,
  resourceSchemaForKind,
  RESOURCE_DEFINITIONS,
  CONFIG_KINDS,
  AGGREGATED_KINDS,
  ALL_KINDS,
  clone,
  resourceToYaml
} from '../../core/src/resource-model.js';

/** Look up a resource definition by kind name from the kubernetes-controller registry. */
export { findResourceDefinition } from '../../core/src/kubernetes-controller.js';

/** Derive the Kubernetes namespace name for a given org slug. */
export { orgNamespaceName, normalizeOrgSlug } from '../../core/src/org-scoping.js';

/** Atlas graph client: fetch records by kind, search the knowledge graph, and access stack layer definitions. */
export {
  fetchAtlasRecordsByKinds,
  searchAtlasGraph,
  STACK_LAYERS,
  COMPOSITION_FACETS,
  ALL_LAYER_DEFS
} from './atlas-graph-client.js';

/** External sync controller for reconciling resources from external backends into Krate. */
export { createSyncController } from '../../core/src/external/sync-controller.js';
/** External webhook controller for processing inbound webhook deliveries from providers. */
export { createWebhookController } from '../../core/src/external/webhook-controller.js';
/** External write controller for pushing Krate resource changes back to external backends. */
export { createWriteController } from '../../core/src/external/write-controller.js';
/** External conflict controller for detecting and resolving sync conflicts between Krate and backends. */
export { createConflictController } from '../../core/src/external/conflict-controller.js';

/** Provider registry and factory for creating typed external backend providers (Git, CI, Issue, etc.). */
export {
  createDefaultProviderRegistry,
  createTypedProvider,
  createExternalBackendProvider
} from '../../core/src/external/provider-resource-factory.js';

/** In-process event bus for publishing and subscribing to lifecycle events across controllers. */
export {
  createConfiguredEventTransport,
  createEventBus,
  createMemoryEventTransport,
  createNatsJetStreamBrokerClient,
  createNatsJetStreamEventTransport,
  globalEventBus,
  loadPersistedEvents
} from '../../core/src/event-bus.js';

/** Shared Krate dependency health probes for web/API health surfaces. */
export { collectKrateHealthProbes, healthStatusValue } from '../../core/src/health-probes.js';

/** Agent adapter controller for managing adapter definitions with transport type and capabilities. */
export {
  createAgentAdapterController,
  AGENT_ADAPTER_CONTROLLER_BOUNDARY,
  validateAgentAdapter
} from '../../core/src/agent-adapter-controller.js';

export {
  createAgentTransportBindingController,
  AGENT_TRANSPORT_BINDING_CONTROLLER_BOUNDARY,
  validateAgentTransportBinding
} from '../../core/src/agent-transport-binding-controller.js';

export {
  createAgentProviderConfigController,
  AGENT_PROVIDER_CONFIG_CONTROLLER_BOUNDARY,
  validateAgentProviderConfig
} from '../../core/src/agent-provider-config-controller.js';

export {
  createAgentProjectController,
  AGENT_PROJECT_CONTROLLER_BOUNDARY,
  validateAgentProject
} from '../../core/src/agent-project-controller.js';

export {
  createAgentGatewayConfigController,
  AGENT_GATEWAY_CONFIG_CONTROLLER_BOUNDARY,
  validateAgentGatewayConfig
} from '../../core/src/agent-gateway-config-controller.js';

export {
  createAgentSessionTranscriptController,
  AGENT_SESSION_TRANSCRIPT_CONTROLLER_BOUNDARY,
  validateAgentSessionTranscript
} from '../../core/src/agent-session-transcript-controller.js';

export {
  createAgentSubagentController,
  AGENT_SUBAGENT_CONTROLLER_BOUNDARY
} from '../../core/src/agent-subagent-controller.js';

export {
  createAgentWritebackController,
  AGENT_WRITEBACK_CONTROLLER_BOUNDARY
} from '../../core/src/agent-writeback-controller.js';

/** Agent stack controller for managing reusable agent definitions with model, prompt, and tools. */
export {
  createAgentStackController,
  AGENT_STACK_CONTROLLER_BOUNDARY
} from '../../core/src/agent-stack-controller.js';

export {
  createAgentPersonaController,
  AGENT_PERSONA_CONTROLLER_BOUNDARY,
  validateAgentPersona,
  validateAgentDefinition,
  resolveAgentPersona,
  resolveAgentDefinition
} from '../../core/src/agent-persona-controller.js';

export {
  composeAgentSystemPrompt,
  composeAgentPrompt
} from '../../core/src/agent-prompt-composition.js';

/** Agent dispatch controller for creating and managing K8s Job-based agent runs. */
export {
  createAgentDispatchController,
  AGENT_DISPATCH_CONTROLLER_BOUNDARY
} from '../../core/src/agent-dispatch-controller.js';

/** Agent approval controller for human-in-the-loop gates on tools, secrets, and write-back actions. */
export {
  createAgentApprovalController,
  AGENT_APPROVAL_CONTROLLER_BOUNDARY
} from '../../core/src/agent-approval-controller.js';

/** Agent trigger controller for event-to-stack routing with cron, webhook, comment, and label sources. */
export {
  createAgentTriggerController,
  AGENT_TRIGGER_CONTROLLER_BOUNDARY,
  validateCronExpression,
  calculateNextRun,
  validateWebhookTrigger,
  validateCommentTrigger,
  validateLabelTrigger,
  getTriggerSourceType,
  validateTriggerRule
} from '../../core/src/agent-trigger-controller.js';

/** Agent workspace controller for managing volume-backed git workspaces with PVC lifecycle. */
export {
  createAgentWorkspaceController,
  AGENT_WORKSPACE_CONTROLLER_BOUNDARY
} from '../../core/src/agent-workspace-controller.js';

/** Agent memory controller for managing org-level shared memory repositories and sources. */
export {
  createAgentMemoryController,
  AGENT_MEMORY_CONTROLLER_BOUNDARY
} from '../../core/src/agent-memory-controller.js';

export {
  queryGraph,
  queryGrep,
  queryMemory,
  AGENT_MEMORY_QUERY_BOUNDARY
} from '../../core/src/agent-memory-query.js';

/** Permission reviewer for cross-org denial and workspace policy enforcement on agent actions. */
export {
  createPermissionReviewer,
  AGENT_PERMISSION_REVIEW_BOUNDARY
} from '../../core/src/agent-permission-review.js';

/** Secret and config grant controllers for managing explicit access permissions to K8s Secrets and ConfigMaps. */
export {
  createAgentSecretGrantController,
  createAgentConfigGrantController,
  AGENT_SECRET_GRANT_CONTROLLER_BOUNDARY,
  AGENT_CONFIG_GRANT_CONTROLLER_BOUNDARY,
  validateAgentSecretGrant,
  validateAgentConfigGrant,
  listGrantsForAgent,
  revokeGrant
} from '../../core/src/agent-secret-config-grant-controller.js';

/** Audit controller for querying and streaming audit events with durable delivery. */
export {
  createAuditController,
  createEventPoller,
  AUDIT_CONTROLLER_BOUNDARY
} from '../../core/src/audit-controller.js';

/** Async utilities: event batching, retry policies, delivery queues, and checkpointing. */
export {
  createEventBatcher,
  createRetryPolicy,
  createDeliveryQueue,
  createCheckpointer
} from '../../core/src/async-controller.js';

/** Runner controller for managing CI runner pools with capacity and cache policies. */
export {
  createRunnerController,
  RUNNER_CONTROLLER_BOUNDARY
} from '../../core/src/runner-controller.js';

/** Notification controller for sending alerts and messages through configured channels. */
export {
  createNotificationController,
  NOTIFICATION_CONTROLLER_BOUNDARY
} from '../../core/src/notification-controller.js';

/** Create a Gitea service client for repository, branch, and SSH key operations against the Git backend. */
export { createGiteaService } from '../../core/src/gitea-service.js';

/** Memory import utilities: parse journals, create snapshots, validate imports, and manage ontologies. */
export {
  parseJournalForImport,
  createMemorySnapshot,
  validateMemoryImport,
  validateMemorySnapshot,
  validateOntology,
  getOntologyNodeKinds,
  getOntologyEdgeKinds
} from '../../core/src/agent-memory-import.js';

/** KServe inference service controller for managing on-cluster model serving with KServe CRDs. */
export {
  createInferenceServiceController,
  KRATE_INFERENCE_SERVICE_CONTROLLER_BOUNDARY,
  SUPPORTED_MODEL_FORMATS,
  INFERENCE_PROTOCOLS,
  KSERVE_API_GROUP,
  KSERVE_API_VERSION
} from '../../core/src/krate-inference-service-controller.js';

/** Model route controller for Envoy AI Gateway xDS configuration and LLM traffic management. */
export {
  createModelRouteController,
  MODEL_ROUTE_CONTROLLER_BOUNDARY,
  validateModelRoute,
  VALID_ROUTE_TYPES,
  VALID_EXTERNAL_PROTOCOLS,
  ENVOY_AI_GATEWAY_API_GROUP,
  ENVOY_AI_GATEWAY_API_VERSION
} from '../../core/src/model-route-controller.js';

/** Virtual model controller for programmable model abstraction with routing rules and hook execution. */
export {
  createVirtualModelController,
  VIRTUAL_MODEL_CONTROLLER_BOUNDARY,
  validateVirtualModel
} from '../../core/src/virtual-model-controller.js';

/** Virtual model hook bridge for dispatching lifecycle hooks (session, completion, tool use) to virtual models. */
export {
  createVirtualModelHookBridge,
  VIRTUAL_MODEL_HOOK_TYPES,
  VIRTUAL_MODEL_HOOK_BRIDGE_BOUNDARY
} from '../../core/src/virtual-model-hook-bridge.js';

/** Artifact registry controller for managing package feeds, versions, and access policies. */
export {
  createArtifactRegistryController,
  ARTIFACT_REGISTRY_CONTROLLER_BOUNDARY
} from '../../core/src/artifact-registry-controller.js';

/** Assistant runtime for in-process chat sessions using the Anthropic API with tool support. */
export {
  createAssistantRuntime,
  ASSISTANT_RUNTIME_BOUNDARY,
  defaultAssistantConfig,
  defaultSystemPrompt,
  callModel
} from '../../core/src/assistant-runtime.js';
