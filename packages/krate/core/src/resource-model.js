export const CONFIG_KINDS = new Set(['Organization', 'OrgNamespaceBinding', 'User', 'Team', 'Invite', 'IdentityMapping', 'AuthProvider', 'Repository', 'SSHKey', 'RepositoryPermission', 'WebhookSubscription', 'RefPolicy', 'BranchProtection', 'PolicyProfile', 'PolicyTemplate', 'PolicyBinding', 'PolicyExceptionRequest', 'RunnerPool', 'View', 'Selector', 'AgentStack', 'AgentSubagent', 'AgentToolProfile', 'AgentMcpServer', 'AgentSkill', 'AgentTriggerRule', 'AgentContextLabel', 'KrateWorkspacePolicy', 'AgentServiceAccount', 'AgentRoleBinding', 'AgentSecretGrant', 'AgentConfigGrant', 'AgentAdapter', 'AgentTransportBinding', 'AgentProviderConfig', 'KrateProject', 'AgentGatewayConfig', 'AgentMemoryRepository', 'AgentMemorySource', 'AgentMemoryOntology', 'AgentMemoryAssociation', 'KrateWorkspace', 'GitProvider', 'CiProvider', 'IssueTrackerProvider', 'AppHostingProvider', 'ArtifactRegistryProvider', 'ExternalBackendBinding', 'ExternalBackendSyncPolicy', 'ExternalProviderCapabilityManifest', 'ExternalWebhookConfig', 'JitsiMeetProvider', 'JitsiMeetingTemplate', 'KrateModelRoute', 'KrateVirtualModel', 'ArtifactRegistry', 'ArtifactFeed', 'ArtifactAccessPolicy', 'KrateInferenceService', 'KrateServingRuntime']);
export const AGGREGATED_KINDS = new Set(['PullRequest', 'Issue', 'Review', 'Pipeline', 'Job', 'WebhookDelivery', 'AgentDispatchRun', 'AgentDispatchAttempt', 'AgentSession', 'AgentContextBundle', 'KrateArtifact', 'AgentApproval', 'AgentTriggerExecution', 'AgentCapabilityRequirement', 'WorkItemSessionLink', 'WorkItemWorkspaceLink', 'AgentSessionTranscript', 'AgentSessionAttachment', 'KrateWorkspaceRuntime', 'AgentMemorySnapshot', 'AgentMemoryQuery', 'AgentMemoryUpdate', 'AgentRunMemoryImport', 'ExternalWebhookDelivery', 'ExternalSyncEvent', 'ExternalSyncState', 'ExternalWriteIntent', 'ExternalSyncConflict', 'ExternalObjectLink', 'JitsiMeeting', 'JitsiRecording', 'ArtifactVersion', 'ArtifactDownload']);
export const ALL_KINDS = new Set([...CONFIG_KINDS, ...AGGREGATED_KINDS]);

export const RESOURCE_DEFINITIONS = Object.freeze({
  Organization: { storage: 'etcd', context: 'identity', plural: 'organizations', purpose: 'Krate organization identity in the platform namespace with a bound tenant namespace', requiredSpec: ['displayName', 'namespaceName'] },
  OrgNamespaceBinding: { storage: 'etcd', context: 'identity', plural: 'orgnamespacebindings', purpose: 'Binding from one organization to exactly one tenant namespace for resources and side effects', requiredSpec: ['organizationRef', 'namespace'] },
  User: { storage: 'etcd', context: 'identity', plural: 'users', purpose: 'Human account profile, sign-in state, admin flag, and linked identities', requiredSpec: ['organizationRef', 'displayName', 'email'] },
  Team: { storage: 'etcd', context: 'identity', plural: 'teams', purpose: 'Team membership, maintainers, and repository permission grants', requiredSpec: ['organizationRef', 'displayName'] },
  Invite: { storage: 'etcd', context: 'identity', plural: 'invites', purpose: 'Pending user invitation with requested teams and expiry', requiredSpec: ['organizationRef', 'email', 'role'] },
  IdentityMapping: { storage: 'etcd', context: 'identity', plural: 'identitymappings', purpose: 'Mapping between Krate users, sign-in subjects, workspace identities, and repository accounts', requiredSpec: ['organizationRef', 'user', 'provider', 'subject'] },
  AuthProvider: { storage: 'etcd', context: 'identity', plural: 'authproviders', purpose: 'Installation sign-in provider visibility and delegated identity settings', requiredSpec: ['organizationRef', 'type'] },
  Repository: { storage: 'etcd', context: 'data-plane', plural: 'repositories', purpose: 'Repository identity, visibility, repository hosting integration, object storage, and search settings', requiredSpec: ['organizationRef', 'visibility'] },
  SSHKey: { storage: 'etcd', context: 'data-plane', plural: 'sshkeys', purpose: 'User, deploy, and automation SSH keys reconciled into repository key APIs', requiredSpec: ['organizationRef', 'scope', 'key'] },
  RepositoryPermission: { storage: 'etcd', context: 'data-plane', plural: 'repositorypermissions', purpose: 'Repository collaborators and teams synced with repository permissions', requiredSpec: ['organizationRef', 'repository', 'subject', 'permission'] },
  WebhookSubscription: { storage: 'etcd', context: 'hooks-events', plural: 'webhooksubscriptions', purpose: 'Endpoint, event filters, signing reference, delivery mode, and retry policy', requiredSpec: ['organizationRef', 'url', 'events'] },
  RefPolicy: { storage: 'etcd', context: 'data-plane', plural: 'refpolicies', purpose: 'Reference deny rules, force-push policy, signing policy, and future custom hook gates', requiredSpec: ['organizationRef'] },
  BranchProtection: { storage: 'etcd', context: 'control-plane', plural: 'branchprotections', purpose: 'Protected ref rules such as pull-request requirements', requiredSpec: ['organizationRef', 'refs'] },
  PolicyProfile: { storage: 'etcd', context: 'policy', plural: 'policyprofiles', purpose: 'Organization policy posture, default templates, rollout mode, and exception approval rules', requiredSpec: ['organizationRef', 'displayName', 'mode'] },
  PolicyTemplate: { storage: 'etcd', context: 'policy', plural: 'policytemplates', purpose: 'Curated Kyverno policy template metadata, parameters, rollout defaults, and remediation guidance', requiredSpec: ['displayName', 'targetKinds', 'kyverno'] },
  PolicyBinding: { storage: 'etcd', context: 'policy', plural: 'policybindings', purpose: 'Binding from a policy template to org, repository, environment, or resource selectors with audit/enforce rollout state', requiredSpec: ['organizationRef', 'templateRef', 'mode'] },
  PolicyExceptionRequest: { storage: 'etcd', context: 'policy', plural: 'policyexceptionrequests', purpose: 'Auditable request and approval workflow for temporary Kyverno PolicyException resources', requiredSpec: ['organizationRef', 'policyRef', 'justification', 'expiresAt'] },
  View: { storage: 'etcd', context: 'web-ui', plural: 'views', purpose: 'Saved triage and dashboard view backed by resource selectors', requiredSpec: ['organizationRef', 'selector'] },
  Selector: { storage: 'etcd', context: 'web-ui', plural: 'selectors', purpose: 'Reusable label/query selector for workflows and views', requiredSpec: ['organizationRef'] },
  PullRequest: { storage: 'postgres', context: 'control-plane', plural: 'pullrequests', purpose: 'Review unit with source/target refs, title, checks, and merge lifecycle', requiredSpec: ['organizationRef', 'repository', 'title'] },
  Issue: { storage: 'postgres', context: 'control-plane', plural: 'issues', purpose: 'Project-scoped work item with labels, comments, backend sync metadata, and zero-or-more repository associations', requiredSpec: ['organizationRef', 'title'] },
  Review: { storage: 'postgres', context: 'control-plane', plural: 'reviews', purpose: 'Approval, comment, or change-request record for a pull request', requiredSpec: ['organizationRef', 'pullRequest'] },
  Pipeline: { storage: 'postgres', context: 'runners-ci', plural: 'pipelines', purpose: 'CI pipeline run state, trust tier, steps, and resume point', requiredSpec: ['organizationRef', 'repository', 'ref'] },
  Job: { storage: 'postgres', context: 'runners-ci', plural: 'jobs', purpose: 'Executable CI step with service-account scope and isolation metadata', requiredSpec: ['organizationRef', 'pipeline', 'step'] },
  RunnerPool: { storage: 'etcd', context: 'runners-ci', plural: 'runnerpools', purpose: 'Runner capacity, warm/max replicas, cache policy, and trust boundary', requiredSpec: ['organizationRef', 'warmReplicas', 'maxReplicas'] },
  WebhookDelivery: { storage: 'postgres', context: 'hooks-events', plural: 'webhookdeliveries', purpose: 'Durable outbound webhook delivery attempt with signature, phase, response, and replay metadata', requiredSpec: ['organizationRef', 'subscription', 'eventType', 'signature'] },
  AgentStack: { storage: 'etcd', context: 'agents', plural: 'agentstacks', purpose: 'Reusable agent definition with model, prompt, tools, MCP servers, skills, subagents, approval mode, and runner policy', requiredSpec: ['organizationRef', 'baseAgent', 'adapter', 'runtimeIdentity'] },
  AgentSubagent: { storage: 'etcd', context: 'agents', plural: 'agentsubagents', purpose: 'Named child-agent definition with role, task kinds, tool subset, and workspace scope', requiredSpec: ['organizationRef', 'rolePrompt', 'taskKinds'] },
  AgentToolProfile: { storage: 'etcd', context: 'agents', plural: 'agenttoolprofiles', purpose: 'Native tool policy for filesystem, network, shell, and approval gates', requiredSpec: ['organizationRef', 'filesystemPolicy', 'approvalPolicyByTool'] },
  AgentMcpServer: { storage: 'etcd', context: 'agents', plural: 'agentmcpservers', purpose: 'Managed MCP endpoint with transport, discovery, health, and secret/config refs', requiredSpec: ['organizationRef', 'transport', 'scope'] },
  AgentSkill: { storage: 'etcd', context: 'agents', plural: 'agentskills', purpose: 'Reusable runbook/procedure bundle with prompt fragments, tool deps, and output contracts', requiredSpec: ['organizationRef', 'format', 'sourceRef'] },
  AgentTriggerRule: { storage: 'etcd', context: 'agents', plural: 'agenttriggerrules', purpose: 'Event-to-stack routing for CI failures, webhooks, comments, labels, schedules, and manual dispatch', requiredSpec: ['organizationRef', 'sources', 'agentStack', 'taskKind'] },
  AgentContextLabel: { storage: 'etcd', context: 'agents', plural: 'agentcontextlabels', purpose: 'Reviewed prompt fragment with provenance and allowlisted sources', requiredSpec: ['organizationRef', 'promptFragment', 'allowedSources'] },
  KrateWorkspacePolicy: { storage: 'etcd', context: 'agents', plural: 'krateworkspacepolicies', purpose: 'Git worktree provisioning, cleanup, retention, and trust tier policies', requiredSpec: ['organizationRef', 'mode', 'retentionPolicy'] },
  AgentServiceAccount: { storage: 'etcd', context: 'identity', plural: 'agentserviceaccounts', purpose: 'Kubernetes ServiceAccount wrapper for agent/runner identity binding', requiredSpec: ['organizationRef', 'namespace', 'serviceAccountName'] },
  AgentRoleBinding: { storage: 'etcd', context: 'identity', plural: 'agentrolebindings', purpose: 'Managed projection to native Kubernetes RBAC for agent identity', requiredSpec: ['organizationRef', 'subject', 'roleRef', 'scope'] },
  AgentSecretGrant: { storage: 'etcd', context: 'identity', plural: 'agentsecretgrants', purpose: 'Explicit permission for subject to access Secret keys with purpose scope', requiredSpec: ['organizationRef', 'subject', 'secretRef', 'purpose'] },
  AgentConfigGrant: { storage: 'etcd', context: 'identity', plural: 'agentconfiggrants', purpose: 'Explicit permission for subject to access ConfigMap keys with purpose scope', requiredSpec: ['organizationRef', 'subject', 'configMapRef', 'purpose'] },
  AgentDispatchRun: { storage: 'postgres', context: 'agents', plural: 'agentdispatchruns', purpose: 'Logical CI-like run visible beside Pipeline/Job records with queue, status, workspace, and cost', requiredSpec: ['organizationRef', 'repository', 'sourceRefs', 'agentStack', 'taskKind'] },
  AgentDispatchAttempt: { storage: 'postgres', context: 'agents', plural: 'agentdispatchattempts', purpose: 'Concrete execution attempt with reason, stack snapshot, and runtime state', requiredSpec: ['organizationRef', 'agentDispatchRun', 'attemptReason', 'agentStackSnapshot'] },
  AgentSession: { storage: 'postgres', context: 'agents', plural: 'agentsessions', purpose: 'Krate projection of Agent Mux chat/session with lifecycle state', requiredSpec: ['organizationRef', 'agentMuxSessionId', 'dispatchRun'] },
  AgentContextBundle: { storage: 'postgres', context: 'agents', plural: 'agentcontextbundles', purpose: 'Immutable prompt/context snapshot with digest, provenance, and redaction manifest', requiredSpec: ['organizationRef', 'dispatchRun', 'digest', 'sources'] },
  KrateArtifact: { storage: 'postgres', context: 'agents', plural: 'krateartifacts', purpose: 'Durable agent output with kind, digest, and retention policy', requiredSpec: ['organizationRef', 'dispatchRun', 'kind', 'digest'] },
  AgentApproval: { storage: 'postgres', context: 'agents', plural: 'agentapprovals', purpose: 'Human gate for tools, secrets, write-back, and release actions', requiredSpec: ['organizationRef', 'dispatchRun', 'action', 'requestedBy'] },
  KrateWorkspace: { storage: 'etcd', context: 'workspaces', plural: 'krateworkspaces', purpose: 'Volume-backed git workspace with PVC lifecycle, repo binding, and runner mount spec', requiredSpec: ['organizationRef', 'repository', 'volumeSpec'] },
  AgentTriggerExecution: { storage: 'postgres', context: 'agents', plural: 'agenttriggerexecutions', purpose: 'Durable trigger evaluation record with dedupe, coalescing, and rejection reason', requiredSpec: ['organizationRef', 'triggerRule', 'sourceEvent', 'decision'] },
  AgentCapabilityRequirement: { storage: 'postgres', context: 'agents', plural: 'agentcapabilityrequirements', purpose: 'Computed dependency record from tools, MCP, skills, models, and subagents', requiredSpec: ['organizationRef', 'ownerRef', 'requiredRoles'] },
  WorkItemSessionLink: { storage: 'postgres', context: 'agents', plural: 'workitemsessionlinks', purpose: 'Association between issues/PRs and agent sessions', requiredSpec: ['organizationRef', 'workItemRef', 'agentSession'] },
  WorkItemWorkspaceLink: { storage: 'postgres', context: 'agents', plural: 'workitemworkspacelinks', purpose: 'Association between issues/PRs and agent workspaces', requiredSpec: ['organizationRef', 'workItemRef', 'workspace'] },
  AgentAdapter: { storage: 'etcd', context: 'agents', plural: 'agentadapters', purpose: 'Agent adapter definition with transport type, capabilities matrix, auth requirements, and installation method', requiredSpec: ['organizationRef', 'adapterType', 'transport'] },
  AgentTransportBinding: { storage: 'etcd', context: 'agents', plural: 'agenttransportbindings', purpose: 'Connection configuration for an adapter instance with endpoint, protocol, auth, health check, and reconnect policy', requiredSpec: ['organizationRef', 'adapterRef', 'endpoint', 'protocol'] },
  AgentProviderConfig: { storage: 'etcd', context: 'agents', plural: 'agentproviderconfigs', purpose: 'Model provider configuration with API base, auth type, default model, model translations, and rate limits', requiredSpec: ['organizationRef', 'provider', 'authType'] },
  KrateProject: { storage: 'etcd', context: 'agents', plural: 'krateprojects', purpose: 'Org project grouping issues, linked repositories, kanban board config, default workflow, and backend sync refs', requiredSpec: ['organizationRef', 'displayName'] },
  AgentGatewayConfig: { storage: 'etcd', context: 'agents', plural: 'agentgatewayconfigs', purpose: 'Runtime Agent Mux gateway connection settings with URL, auth, reconnect policy, and feature flags', requiredSpec: ['organizationRef', 'gatewayUrl'] },
  AgentSessionTranscript: { storage: 'postgres', context: 'agents', plural: 'agentsessiontranscripts', purpose: 'Durable chat transcript with message nodes, pagination support, and cost per turn', requiredSpec: ['organizationRef', 'sessionRef', 'messages'] },
  AgentSessionAttachment: { storage: 'postgres', context: 'agents', plural: 'agentsessionattachments', purpose: 'File attached to a session message with source type, MIME type, digest, and redaction status', requiredSpec: ['organizationRef', 'sessionRef', 'sourceType', 'digest'] },
  KrateWorkspaceRuntime: { storage: 'postgres', context: 'agents', plural: 'krateworkspaceruntimes', purpose: 'Workspace runtime surface state with cwd, environment variables, process status, and preview URL', requiredSpec: ['organizationRef', 'workspaceRef', 'status'] },
  AgentMemoryRepository: { storage: 'etcd', context: 'agents', plural: 'agentmemoryrepositories', purpose: 'Org-level Git repository pointer for shared agent memory with layout profile and index policy', requiredSpec: ['organizationRef', 'repositoryRef', 'defaultBranch', 'layoutProfile'] },
  AgentMemorySource: { storage: 'etcd', context: 'agents', plural: 'agentmemorysources', purpose: 'Read policy for memory paths and kinds per repository, team, stack, or trigger', requiredSpec: ['organizationRef', 'repositoryRef', 'appliesTo', 'include'] },
  AgentMemoryOntology: { storage: 'etcd', context: 'agents', plural: 'agentmemoryontologies', purpose: 'Ontology policy pointer with required fields, edge kinds, and controlled vocabulary', requiredSpec: ['organizationRef', 'memoryRepository', 'ontologyPath'] },
  AgentMemoryAssociation: { storage: 'etcd', context: 'agents', plural: 'agentmemoryassociations', purpose: 'Bridge record linking memory content to Krate resources by relationship type', requiredSpec: ['organizationRef', 'memoryRef', 'targetRef', 'relationship'] },
  AgentMemorySnapshot: { storage: 'postgres', context: 'agents', plural: 'agentmemorysnapshots', purpose: 'Immutable dispatch-time memory pin with resolved commit, query manifest digest, and selected records digest', requiredSpec: ['organizationRef', 'memoryRepository', 'requestedRef', 'resolvedCommit'] },
  AgentMemoryQuery: { storage: 'postgres', context: 'agents', plural: 'agentmemoryqueries', purpose: 'Graph and grep retrieval record with query parameters, result digests, and ranking metadata', requiredSpec: ['organizationRef', 'snapshotRef', 'requester', 'query'] },
  AgentMemoryUpdate: { storage: 'postgres', context: 'agents', plural: 'agentmemoryupdates', purpose: 'Reviewable proposed memory mutation with branch, changes, and validation status', requiredSpec: ['organizationRef', 'memoryRepository', 'sourceRun', 'changes'] },
  AgentRunMemoryImport: { storage: 'postgres', context: 'agents', plural: 'agentrunmemoryimports', purpose: 'Import curated babysitter run metadata into org company brain with redaction and review', requiredSpec: ['organizationRef', 'memoryRepository', 'source', 'include'] },
  GitProvider: { storage: 'etcd', context: 'external-backends', plural: 'gitproviders', purpose: 'Git forge provider with repository management, PR lifecycle, branch protection, and webhook configuration', requiredSpec: ['organizationRef', 'platform', 'endpoint'] },
  CiProvider: { storage: 'etcd', context: 'external-backends', plural: 'ciproviders', purpose: 'CI/CD pipeline provider with job execution, workflow dispatch, and runner pool binding', requiredSpec: ['organizationRef', 'platform', 'endpoint'] },
  IssueTrackerProvider: { storage: 'etcd', context: 'external-backends', plural: 'issuetrackers', purpose: 'Issue tracking provider with project mapping, label sync, and milestone management', requiredSpec: ['organizationRef', 'platform', 'endpoint'] },
  AppHostingProvider: { storage: 'etcd', context: 'external-backends', plural: 'apphostingproviders', purpose: 'Application hosting provider for deployments, previews, domains, and environment management', requiredSpec: ['organizationRef', 'platform', 'endpoint'] },
  ArtifactRegistryProvider: { storage: 'etcd', context: 'external-backends', plural: 'artifactregistryproviders', purpose: 'Artifact registry provider for package feeds, container images, and build artifacts', requiredSpec: ['organizationRef', 'platform', 'endpoint'] },
  ExternalBackendBinding: { storage: 'etcd', context: 'external-backends', plural: 'externalbackendbindings', purpose: 'Binding of an external backend provider to an organization with credential reference and sync scope', requiredSpec: ['organizationRef', 'providerRef', 'providerKind', 'credentialRef'] },
  ExternalBackendSyncPolicy: { storage: 'etcd', context: 'external-backends', plural: 'externalbackendsyncpolicies', purpose: 'Sync interval, conflict resolution mode, field mapping overrides, and retry policy for an external backend provider', requiredSpec: ['organizationRef', 'providerRef', 'syncInterval'] },
  ExternalProviderCapabilityManifest: { storage: 'etcd', context: 'external-backends', plural: 'externalprovidercapabilitymanifests', purpose: 'Discovered capability surface of an external backend provider including supported resource kinds and API features', requiredSpec: ['organizationRef', 'providerRef', 'capabilities'] },
  ExternalWebhookDelivery: { storage: 'postgres', context: 'external-backends', plural: 'externalwebhookdeliveries', purpose: 'Inbound webhook delivery from an external backend provider with event type, payload, and processing state', requiredSpec: ['organizationRef', 'providerRef', 'eventType', 'payload'] },
  ExternalSyncEvent: { storage: 'postgres', context: 'external-backends', plural: 'externalsyncevents', purpose: 'Discrete sync event record from an external backend for a specific resource kind with dedupe and ordering metadata', requiredSpec: ['organizationRef', 'providerRef', 'eventKind', 'resourceRef'] },
  ExternalSyncState: { storage: 'postgres', context: 'external-backends', plural: 'externalsyncstates', purpose: 'Current sync phase, last successful sync timestamp, and error details for an external resource binding', requiredSpec: ['organizationRef', 'providerRef', 'resourceRef', 'phase'] },
  ExternalWriteIntent: { storage: 'postgres', context: 'external-backends', plural: 'externalwriteintents', purpose: 'Queued write-back intent to an external backend with operation, payload snapshot, and approval state', requiredSpec: ['organizationRef', 'providerRef', 'resourceRef', 'operation'] },
  ExternalSyncConflict: { storage: 'postgres', context: 'external-backends', plural: 'externalsyncconflicts', purpose: 'Detected conflict between local and external state with conflict kind, diff, and resolution outcome', requiredSpec: ['organizationRef', 'providerRef', 'resourceRef', 'conflictKind'] },
  ExternalObjectLink: { storage: 'postgres', context: 'external-backends', plural: 'externalobjectlinks', purpose: 'Stable mapping between a Krate local resource and its external backend counterpart by external ID', requiredSpec: ['organizationRef', 'providerRef', 'externalId', 'localRef'] },
  ArtifactRegistry: { storage: 'etcd', context: 'artifacts', plural: 'artifactregistries', purpose: 'Registry configuration for npm, pip, Docker, or ad-hoc artifact hosting with storage backend and access policy', requiredSpec: ['organizationRef', 'registryType', 'storageBackend'] },
  ArtifactFeed: { storage: 'etcd', context: 'artifacts', plural: 'artifactfeeds', purpose: 'Named feed/scope within a registry (e.g., @org scope in npm, project in pip, repository in Docker)', requiredSpec: ['organizationRef', 'registryRef', 'feedName'] },
  ArtifactAccessPolicy: { storage: 'etcd', context: 'artifacts', plural: 'artifactaccesspolicies', purpose: 'Read/write/admin access rules for registry feeds per user, team, or service account', requiredSpec: ['organizationRef', 'feedRef', 'subjects', 'permissions'] },
  ArtifactVersion: { storage: 'postgres', context: 'artifacts', plural: 'artifactversions', purpose: 'Published artifact version with digest, size, metadata, and provenance', requiredSpec: ['organizationRef', 'feedRef', 'name', 'version', 'digest'] },
  ArtifactDownload: { storage: 'postgres', context: 'artifacts', plural: 'artifactdownloads', purpose: 'Download/pull audit record for compliance and usage tracking', requiredSpec: ['organizationRef', 'artifactRef', 'requestedBy'] },
  KrateInferenceService: { storage: 'etcd', context: 'inference', plural: 'krateinferenceservices', purpose: 'KServe InferenceService wrapper for model inference with endpoint discovery, model catalog, protocol config, and provider integration', requiredSpec: ['organizationRef', 'modelFormat', 'storageUri'] },
  KrateServingRuntime: { storage: 'etcd', context: 'inference', plural: 'krateservingruntimes', purpose: 'KServe ServingRuntime wrapper defining container image, supported model formats, resource limits, and scheduling policy', requiredSpec: ['organizationRef', 'supportedModelFormats', 'containers'] },
  ExternalWebhookConfig: { storage: 'etcd', context: 'hooks-events', plural: 'externalwebhookconfigs', purpose: 'Inbound webhook configuration with provider type, event filters, signing secret, and enabled state', requiredSpec: ['organizationRef', 'events'] },
  JitsiMeetProvider: { storage: 'etcd', context: 'external-backends', plural: 'jitsimeetproviders', purpose: 'Jitsi Meet deployment endpoint with JWT auth, recording, and room lifecycle configuration', requiredSpec: ['organizationRef', 'endpoint', 'authMode'] },
  JitsiMeetingTemplate: { storage: 'etcd', context: 'agents', plural: 'jitsimeetingtemplates', purpose: 'Reusable Jitsi meeting configuration with scheduling, auto-invite, and agent participation settings', requiredSpec: ['organizationRef', 'providerRef', 'displayName'] },
  JitsiMeeting: { storage: 'postgres', context: 'agents', plural: 'jitsimeetings', purpose: 'Active or completed Jitsi meeting with participant tracking, recording state, and agent dispatch binding', requiredSpec: ['organizationRef', 'providerRef', 'roomId'] },
  JitsiRecording: { storage: 'postgres', context: 'agents', plural: 'jitsirecordings', purpose: 'Recording artifact from a Jitsi meeting with storage reference, transcript, and duration metadata', requiredSpec: ['organizationRef', 'meetingRef', 'providerRef'] },
  KrateModelRoute: { storage: 'etcd', context: 'inference', plural: 'kratemodelroutes', purpose: 'Unified model routing through Envoy AI Gateway mapping logical model names to internal KServe services or external cloud LLM endpoints', requiredSpec: ['organizationRef', 'modelName', 'routeType'] },
  KrateVirtualModel: { storage: 'etcd', context: 'inference', plural: 'kratevirtualmodels', purpose: 'Programmable model abstraction with declarative routing rules, JS hooks for request/response transformation, session lifecycle management, and observability injection', requiredSpec: ['organizationRef', 'modelName', 'routes'] }
});

export function listResourceDefinitions() {
  return Object.entries(RESOURCE_DEFINITIONS).map(([kind, definition]) => ({ kind, ...clone(definition) }));
}

export function resourceDefinitionForKind(kind) {
  const definition = RESOURCE_DEFINITIONS[kind];
  if (!definition) throw new Error(`Unknown Krate resource kind: ${kind}`);
  return { kind, ...clone(definition) };
}

export function resourceSchemaForKind(kind) {
  const definition = resourceDefinitionForKind(kind);
  return {
    apiVersion: 'krate.a5c.ai/v1alpha1',
    kind: definition.kind,
    plural: definition.plural,
    storage: definition.storage,
    context: definition.context,
    required: {
      metadata: ['name'],
      spec: [...definition.requiredSpec]
    },
    status: ['storage', 'phase', 'conditions']
  };
}

export function storageClassForKind(kind) {
  return resourceDefinitionForKind(kind).storage;
}

export function resourceKey(resource) {
  const namespace = resource.metadata?.namespace || 'default';
  const name = resource.metadata?.name;
  if (!name) throw new Error('resource metadata.name is required');
  return `${resource.kind}/${namespace}/${name}`;
}

export function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

export function createResource(kind, metadata, spec = {}, status = {}) {
  if (!ALL_KINDS.has(kind)) throw new Error(`Unknown Krate resource kind: ${kind}`);
  if (!metadata?.name) throw new Error(`${kind} requires metadata.name`);
  return {
    apiVersion: 'krate.a5c.ai/v1alpha1',
    kind,
    metadata: { namespace: metadata.namespace || 'default', labels: {}, annotations: {}, ...metadata },
    spec: clone(spec),
    status: clone(status)
  };
}

const FIELD_TYPE_RULES = {
  organizationRef: 'string', displayName: 'string', namespaceName: 'string',
  baseAgent: 'string', adapter: 'string', provider: 'string', authType: 'string',
  gatewayUrl: 'string', modelName: 'string', routeType: 'string', modelFormat: 'string',
  storageUri: 'string', repository: 'string', title: 'string', email: 'string',
  visibility: 'string', scope: 'string', key: 'string', subject: 'string',
  roleRef: 'string', secretRef: 'string', purpose: 'string', endpoint: 'string',
  providerType: 'string', platform: 'string', providerKind: 'string', adapterType: 'string', transport: 'string', protocol: 'string',
  namespace: 'string', serviceAccountName: 'string', ontologyPath: 'string',
  authMode: 'string', providerRef: 'string', templateRef: 'string', meetingRef: 'string', roomId: 'string',
  roomNameTemplate: 'string', format: 'string', storageRef: 'string',
  memoryRepository: 'string', repositoryRef: 'string', defaultBranch: 'string',
  warmReplicas: 'number', maxReplicas: 'number', maxTurns: 'number', ttlMinutes: 'number',
  runtimeIdentity: 'object', routes: 'array', sources: 'array', events: 'array',
  requiredRoles: 'array', changes: 'array', include: 'array',
  supportedModelFormats: 'array', containers: 'array', subjects: 'array',
  permissions: 'array', refs: 'array', targetKinds: 'array',
};

export function validateResource(resource) {
  if (!resource || typeof resource !== 'object') throw new Error('resource must be an object');
  const definition = resourceDefinitionForKind(resource.kind);
  if (!resource.metadata?.name) throw new Error(`${resource.kind} metadata.name is required`);
  if (typeof resource.metadata.name !== 'string') throw new Error(`${resource.kind} metadata.name must be a string (got ${typeof resource.metadata.name})`);
  if (!resource.spec || typeof resource.spec !== 'object') resource.spec = {};
  if (!resource.status || typeof resource.status !== 'object') resource.status = {};
  resource.metadata.namespace ||= 'default';
  resource.metadata.labels ||= {};
  resource.metadata.annotations ||= {};
  for (const field of definition.requiredSpec) {
    const value = resource.spec[field];
    if (value === undefined || value === null || value === '') {
      throw new Error(`${resource.kind} spec.${field} is required`);
    }
    const expectedType = FIELD_TYPE_RULES[field];
    if (expectedType === 'string' && typeof value !== 'string') {
      throw new Error(`${resource.kind} spec.${field} must be a string (got ${typeof value})`);
    }
    if (expectedType === 'number' && typeof value !== 'number') {
      throw new Error(`${resource.kind} spec.${field} must be a number (got ${typeof value})`);
    }
    if (expectedType === 'array' && !Array.isArray(value)) {
      throw new Error(`${resource.kind} spec.${field} must be an array (got ${typeof value})`);
    }
    if (expectedType === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
      throw new Error(`${resource.kind} spec.${field} must be an object (got ${Array.isArray(value) ? 'array' : typeof value})`);
    }
  }
  return resource;
}

export function toKubernetesList(kind, items) {
  return { apiVersion: 'krate.a5c.ai/v1alpha1', kind: `${kind}List`, items: items.map(clone) };
}

export function matchLabels(resource, selector = {}) {
  const labels = resource.metadata?.labels || {};
  return Object.entries(selector).every(([key, value]) => labels[key] === value);
}

export function createSelector({ name, namespace = 'krate-org-default', organizationRef = 'default', labels = {}, query = '' }) {
  return createResource('Selector', { name, namespace }, { organizationRef, labels, query });
}

export function createView({ name, namespace = 'krate-org-default', organizationRef = 'default', selector, columns = [], sort = [] }) {
  return createResource('View', { name, namespace }, { organizationRef, selector, columns, sort });
}

export function resourceToYaml(resource) {
  const lines = [];
  const scalar = (value) => {
    if (value === null) return 'null';
    if (value === undefined) return 'null';
    if (typeof value === 'string') return value.includes(': ') || value.startsWith('{') || value.startsWith('[') ? JSON.stringify(value) : value;
    return String(value);
  };
  const writeValue = (key, value, indent = 0) => {
    const pad = ' '.repeat(indent);
    if (Array.isArray(value)) {
      lines.push(`${pad}${key}:`);
      writeArray(value, indent + 2);
    } else if (value && typeof value === 'object') {
      lines.push(`${pad}${key}:`);
      writeObject(value, indent + 2);
    } else {
      lines.push(`${pad}${key}: ${scalar(value)}`);
    }
  };
  const writeObject = (value, indent) => {
    for (const [childKey, childValue] of Object.entries(value)) writeValue(childKey, childValue, indent);
  };
  const writeArray = (value, indent) => {
    const pad = ' '.repeat(indent);
    for (const item of value) {
      if (Array.isArray(item)) {
        lines.push(`${pad}-`);
        writeArray(item, indent + 2);
      } else if (item && typeof item === 'object') {
        const entries = Object.entries(item);
        if (entries.length === 0) {
          lines.push(`${pad}- {}`);
        } else {
          const [[firstKey, firstValue], ...rest] = entries;
          if (firstValue && typeof firstValue === 'object') {
            lines.push(`${pad}- ${firstKey}:`);
            if (Array.isArray(firstValue)) writeArray(firstValue, indent + 4);
            else writeObject(firstValue, indent + 4);
          } else {
            lines.push(`${pad}- ${firstKey}: ${scalar(firstValue)}`);
          }
          for (const [childKey, childValue] of rest) writeValue(childKey, childValue, indent + 2);
        }
      } else {
        lines.push(`${pad}- ${scalar(item)}`);
      }
    }
  };
  writeObject(resource, 0);
  return lines.join('\n') + '\n';
}
