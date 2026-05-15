// API Controller
export { createKrateApiController, KRATE_API_CONTROLLER_BOUNDARY } from '../../core/src/api-controller.js';

// Controller Client (browser/server data fetching)
export { fetchControllerUiModel } from '../../core/src/controller-client.js';
export { clearSnapshotCache } from '../../core/src/snapshot-cache.js';

// Controller UI Model
export { createControllerUiModel, issueProjectRefs, issueRepositoryRefs } from '../../core/src/controller-ui.js';

// Authentication
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

// Identity Policy
export { mapOidcIdentity } from '../../core/src/identity-policy.js';

// Resource Model
export {
  createResource,
  CONFIG_KINDS,
  AGGREGATED_KINDS,
  clone,
  resourceToYaml
} from '../../core/src/resource-model.js';

// Resource Definition Lookup (from kubernetes-controller)
export { findResourceDefinition } from '../../core/src/kubernetes-controller.js';

// Org Scoping
export { orgNamespaceName, normalizeOrgSlug } from '../../core/src/org-scoping.js';

// Atlas Graph Client
export {
  fetchAtlasRecordsByKinds,
  searchAtlasGraph,
  STACK_LAYERS,
  COMPOSITION_FACETS,
  ALL_LAYER_DEFS
} from './atlas-graph-client.js';

// External Controllers
export { createSyncController } from '../../core/src/external/sync-controller.js';
export { createWebhookController } from '../../core/src/external/webhook-controller.js';
export { createWriteController } from '../../core/src/external/write-controller.js';
export { createConflictController } from '../../core/src/external/conflict-controller.js';

// External Provider Registry & Factory
export {
  createDefaultProviderRegistry,
  createExternalBackendProvider
} from '../../core/src/external/provider-resource-factory.js';

// Event Bus
export { createEventBus, globalEventBus } from '../../core/src/event-bus.js';

// Agent Controllers
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

// Agent Stack
export {
  createAgentStackController,
  AGENT_STACK_CONTROLLER_BOUNDARY
} from '../../core/src/agent-stack-controller.js';

// Agent Dispatch
export {
  createAgentDispatchController,
  AGENT_DISPATCH_CONTROLLER_BOUNDARY
} from '../../core/src/agent-dispatch-controller.js';

// Agent Approval
export {
  createAgentApprovalController,
  AGENT_APPROVAL_CONTROLLER_BOUNDARY
} from '../../core/src/agent-approval-controller.js';

// Agent Trigger
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

// Agent Workspace
export {
  createAgentWorkspaceController,
  AGENT_WORKSPACE_CONTROLLER_BOUNDARY
} from '../../core/src/agent-workspace-controller.js';

// Agent Memory
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

// Agent Permission
export {
  createPermissionReviewer,
  AGENT_PERMISSION_REVIEW_BOUNDARY
} from '../../core/src/agent-permission-review.js';

// Secret / Config Grants
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

// Audit
export {
  createAuditController,
  createEventPoller,
  AUDIT_CONTROLLER_BOUNDARY
} from '../../core/src/audit-controller.js';

// Async utilities
export {
  createEventBatcher,
  createRetryPolicy,
  createDeliveryQueue,
  createCheckpointer
} from '../../core/src/async-controller.js';

// Runner Controller
export {
  createRunnerController,
  RUNNER_CONTROLLER_BOUNDARY
} from '../../core/src/runner-controller.js';

// Notification Controller
export {
  createNotificationController,
  NOTIFICATION_CONTROLLER_BOUNDARY
} from '../../core/src/notification-controller.js';

// Gitea Service
export { createGiteaService } from '../../core/src/gitea-service.js';

// Memory import / snapshot / ontology
export {
  parseJournalForImport,
  createMemorySnapshot,
  validateMemoryImport,
  validateMemorySnapshot,
  validateOntology,
  getOntologyNodeKinds,
  getOntologyEdgeKinds
} from '../../core/src/agent-memory-import.js';
