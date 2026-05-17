# Krate System Specification v2

> Exhaustive system specification derived from implementation source code.
> Source: `packages/krate/core/src/resource-model.js`, `http-server.js`, controller files.

---

## 1. Resource Taxonomy

All 76 resource kinds from `RESOURCE_DEFINITIONS` in `packages/krate/core/src/resource-model.js`.
Every resource follows the Kubernetes object model:

```javascript
{
  apiVersion: 'krate.a5c.ai/v1alpha1',
  kind: '<ResourceKind>',
  metadata: {
    name: '<unique-name>',              // Required: validated by validateResource()
    namespace: '<krate-org-slug>',      // Defaults to 'default' if not provided
    labels: { 'krate.a5c.ai/org': '<org>' },
    annotations: {}
  },
  spec: { /* kind-specific; requiredSpec fields validated */ },
  status: { /* storage, phase, conditions */ }
}
```

### 1.1 CONFIG Kinds (etcd storage — 44 kinds)

#### Identity Context (11 kinds)

| # | Kind | Plural | Required Spec Fields | Purpose |
|---|------|--------|---------------------|---------|
| 1 | Organization | organizations | `displayName`, `namespaceName` | Krate organization identity in the platform namespace with a bound tenant namespace |
| 2 | OrgNamespaceBinding | orgnamespacebindings | `organizationRef`, `namespace` | Binding from one organization to exactly one tenant namespace for resources and side effects |
| 3 | User | users | `organizationRef`, `displayName`, `email` | Human account profile, sign-in state, admin flag, and linked identities |
| 4 | Team | teams | `organizationRef`, `displayName` | Team membership, maintainers, and repository permission grants |
| 5 | Invite | invites | `organizationRef`, `email`, `role` | Pending user invitation with requested teams and expiry |
| 6 | IdentityMapping | identitymappings | `organizationRef`, `user`, `provider`, `subject` | Mapping between Krate users, sign-in subjects, workspace identities, and repository accounts |
| 7 | AuthProvider | authproviders | `organizationRef`, `type` | Installation sign-in provider visibility and delegated identity settings |
| 8 | AgentServiceAccount | agentserviceaccounts | `organizationRef`, `namespace`, `serviceAccountName` | Kubernetes ServiceAccount wrapper for agent/runner identity binding |
| 9 | AgentRoleBinding | agentrolebindings | `organizationRef`, `subject`, `roleRef`, `scope` | Managed projection to native Kubernetes RBAC for agent identity |
| 10 | AgentSecretGrant | agentsecretgrants | `organizationRef`, `subject`, `secretRef`, `purpose` | Explicit permission for subject to access Secret keys with purpose scope |
| 11 | AgentConfigGrant | agentconfiggrants | `organizationRef`, `subject`, `configMapRef`, `purpose` | Explicit permission for subject to access ConfigMap keys with purpose scope |

#### Data-Plane Context (4 kinds)

| # | Kind | Plural | Required Spec Fields | Purpose |
|---|------|--------|---------------------|---------|
| 12 | Repository | repositories | `organizationRef`, `visibility` | Repository identity, visibility, repository hosting integration, object storage, and search settings |
| 13 | SSHKey | sshkeys | `organizationRef`, `scope`, `key` | User, deploy, and automation SSH keys reconciled into repository key APIs |
| 14 | RepositoryPermission | repositorypermissions | `organizationRef`, `repository`, `subject`, `permission` | Repository collaborators and teams synced with repository permissions |
| 15 | RefPolicy | refpolicies | `organizationRef` | Reference deny rules, force-push policy, signing policy, and future custom hook gates |

#### Control-Plane Context (1 kind)

| # | Kind | Plural | Required Spec Fields | Purpose |
|---|------|--------|---------------------|---------|
| 16 | BranchProtection | branchprotections | `organizationRef`, `refs` | Protected ref rules such as pull-request requirements |

#### Policy Context (4 kinds)

| # | Kind | Plural | Required Spec Fields | Purpose |
|---|------|--------|---------------------|---------|
| 17 | PolicyProfile | policyprofiles | `organizationRef`, `displayName`, `mode` | Organization policy posture, default templates, rollout mode, and exception approval rules |
| 18 | PolicyTemplate | policytemplates | `displayName`, `targetKinds`, `kyverno` | Curated Kyverno policy template metadata, parameters, rollout defaults, and remediation guidance |
| 19 | PolicyBinding | policybindings | `organizationRef`, `templateRef`, `mode` | Binding from a policy template to org/repo/env with audit/enforce rollout state |
| 20 | PolicyExceptionRequest | policyexceptionrequests | `organizationRef`, `policyRef`, `justification`, `expiresAt` | Auditable request and approval workflow for temporary Kyverno PolicyException resources |

#### Hooks-Events Context (1 kind)

| # | Kind | Plural | Required Spec Fields | Purpose |
|---|------|--------|---------------------|---------|
| 21 | WebhookSubscription | webhooksubscriptions | `organizationRef`, `url`, `events` | Endpoint, event filters, signing reference, delivery mode, and retry policy |

#### Runners-CI Context (1 kind)

| # | Kind | Plural | Required Spec Fields | Purpose |
|---|------|--------|---------------------|---------|
| 22 | RunnerPool | runnerpools | `organizationRef`, `warmReplicas`, `maxReplicas` | Runner capacity, warm/max replicas, cache policy, and trust boundary |

#### Web-UI Context (2 kinds)

| # | Kind | Plural | Required Spec Fields | Purpose |
|---|------|--------|---------------------|---------|
| 23 | View | views | `organizationRef`, `selector` | Saved triage and dashboard view backed by resource selectors |
| 24 | Selector | selectors | `organizationRef` | Reusable label/query selector for workflows and views |

#### Agents Context (18 kinds)

| # | Kind | Plural | Required Spec Fields | Purpose |
|---|------|--------|---------------------|---------|
| 25 | AgentStack | agentstacks | `organizationRef`, `baseAgent`, `adapter`, `runtimeIdentity` | Reusable agent definition with model, prompt, tools, MCP servers, skills, subagents, approval mode, and runner policy |
| 26 | AgentSubagent | agentsubagents | `organizationRef`, `rolePrompt`, `taskKinds` | Named child-agent definition with role, task kinds, tool subset, and workspace scope |
| 27 | AgentToolProfile | agenttoolprofiles | `organizationRef`, `filesystemPolicy`, `approvalPolicyByTool` | Native tool policy for filesystem, network, shell, and approval gates |
| 28 | AgentMcpServer | agentmcpservers | `organizationRef`, `transport`, `scope` | Managed MCP endpoint with transport, discovery, health, and secret/config refs |
| 29 | AgentSkill | agentskills | `organizationRef`, `format`, `sourceRef` | Reusable runbook/procedure bundle with prompt fragments, tool deps, and output contracts |
| 30 | AgentTriggerRule | agenttriggerrules | `organizationRef`, `sources`, `agentStack`, `taskKind` | Event-to-stack routing for CI failures, webhooks, comments, labels, schedules, and manual dispatch |
| 31 | AgentContextLabel | agentcontextlabels | `organizationRef`, `promptFragment`, `allowedSources` | Reviewed prompt fragment with provenance and allowlisted sources |
| 32 | KrateWorkspacePolicy | krateworkspacepolicies | `organizationRef`, `mode`, `retentionPolicy` | Git worktree provisioning, cleanup, retention, and trust tier policies |
| 33 | AgentAdapter | agentadapters | `organizationRef`, `adapterType`, `transport` | Agent adapter definition with transport type, capabilities matrix, auth requirements, and installation method |
| 34 | AgentTransportBinding | agenttransportbindings | `organizationRef`, `adapterRef`, `endpoint`, `protocol` | Connection configuration for an adapter instance with endpoint, protocol, auth, health check, and reconnect policy |
| 35 | AgentProviderConfig | agentproviderconfigs | `organizationRef`, `provider`, `authType` | Model provider configuration with API base, auth type, default model, model translations, and rate limits |
| 36 | KrateProject | krateprojects | `organizationRef`, `displayName` | Org project grouping issues, linked repositories, kanban board config, default workflow, and backend sync refs |
| 37 | AgentGatewayConfig | agentgatewayconfigs | `organizationRef`, `gatewayUrl` | Runtime Agent Mux gateway connection settings with URL, auth, reconnect policy, and feature flags |
| 38 | AgentMemoryRepository | agentmemoryrepositories | `organizationRef`, `repositoryRef`, `defaultBranch`, `layoutProfile` | Org-level Git repository pointer for shared agent memory with layout profile and index policy |
| 39 | AgentMemorySource | agentmemorysources | `organizationRef`, `repositoryRef`, `appliesTo`, `include` | Read policy for memory paths and kinds per repository, team, stack, or trigger |
| 40 | AgentMemoryOntology | agentmemoryontologies | `organizationRef`, `memoryRepository`, `ontologyPath` | Ontology policy pointer with required fields, edge kinds, and controlled vocabulary |
| 41 | AgentMemoryAssociation | agentmemoryassociations | `organizationRef`, `memoryRef`, `targetRef`, `relationship` | Bridge record linking memory content to Krate resources by relationship type |

#### Workspaces Context (1 kind)

| # | Kind | Plural | Required Spec Fields | Purpose |
|---|------|--------|---------------------|---------|
| 42 | KrateWorkspace | krateworkspaces | `organizationRef`, `repository`, `volumeSpec` | Volume-backed git workspace with PVC lifecycle, repo binding, and runner mount spec |

#### External-Backends Context (4 kinds)

| # | Kind | Plural | Required Spec Fields | Purpose |
|---|------|--------|---------------------|---------|
| 43 | ExternalBackendProvider | externalbackendproviders | `organizationRef`, `providerType`, `endpoint` | External backend provider registration with type, endpoint, auth configuration, and capability discovery settings |
| 44 | ExternalBackendBinding | externalbackendbindings | `organizationRef`, `providerRef`, `credentialRef` | Binding of an external backend provider to an organization with credential reference and sync scope |
| 45 | ExternalBackendSyncPolicy | externalbackendsyncpolicies | `organizationRef`, `providerRef`, `syncInterval` | Sync interval, conflict resolution mode, field mapping overrides, and retry policy for an external backend provider |
| 46 | ExternalProviderCapabilityManifest | externalprovidercapabilitymanifests | `organizationRef`, `providerRef`, `capabilities` | Discovered capability surface of an external backend provider including supported resource kinds and API features |

### 1.2 AGGREGATED Kinds (postgres storage — 32 kinds)

#### Control-Plane Context (3 kinds)

| # | Kind | Plural | Required Spec Fields | Purpose |
|---|------|--------|---------------------|---------|
| 47 | PullRequest | pullrequests | `organizationRef`, `repository`, `title` | Review unit with source/target refs, title, checks, and merge lifecycle |
| 48 | Issue | issues | `organizationRef`, `title` | Project-scoped work item with labels, comments, backend sync metadata, and zero-or-more repository associations |
| 49 | Review | reviews | `organizationRef`, `pullRequest` | Approval, comment, or change-request record for a pull request |

#### Runners-CI Context (2 kinds)

| # | Kind | Plural | Required Spec Fields | Purpose |
|---|------|--------|---------------------|---------|
| 50 | Pipeline | pipelines | `organizationRef`, `repository`, `ref` | CI pipeline run state, trust tier, steps, and resume point |
| 51 | Job | jobs | `organizationRef`, `pipeline`, `step` | Executable CI step with service-account scope and isolation metadata |

#### Hooks-Events Context (1 kind)

| # | Kind | Plural | Required Spec Fields | Purpose |
|---|------|--------|---------------------|---------|
| 52 | WebhookDelivery | webhookdeliveries | `organizationRef`, `subscription`, `eventType`, `signature` | Durable outbound webhook delivery attempt with signature, phase, response, and replay metadata |

#### Agents Context (17 kinds)

| # | Kind | Plural | Required Spec Fields | Purpose |
|---|------|--------|---------------------|---------|
| 53 | AgentDispatchRun | agentdispatchruns | `organizationRef`, `repository`, `sourceRefs`, `agentStack`, `taskKind` | Logical CI-like run visible beside Pipeline/Job records with queue, status, workspace, and cost |
| 54 | AgentDispatchAttempt | agentdispatchattempts | `organizationRef`, `agentDispatchRun`, `attemptReason`, `agentStackSnapshot` | Concrete execution attempt with reason, stack snapshot, and runtime state |
| 55 | AgentSession | agentsessions | `organizationRef`, `agentMuxSessionId`, `dispatchRun` | Krate projection of Agent Mux chat/session with lifecycle state |
| 56 | AgentContextBundle | agentcontextbundles | `organizationRef`, `dispatchRun`, `digest`, `sources` | Immutable prompt/context snapshot with digest, provenance, and redaction manifest |
| 57 | KrateArtifact | krateartifacts | `organizationRef`, `dispatchRun`, `kind`, `digest` | Durable agent output with kind, digest, and retention policy |
| 58 | AgentApproval | agentapprovals | `organizationRef`, `dispatchRun`, `action`, `requestedBy` | Human gate for tools, secrets, write-back, and release actions |
| 59 | AgentTriggerExecution | agenttriggerexecutions | `organizationRef`, `triggerRule`, `sourceEvent`, `decision` | Durable trigger evaluation record with dedupe, coalescing, and rejection reason |
| 60 | AgentCapabilityRequirement | agentcapabilityrequirements | `organizationRef`, `ownerRef`, `requiredRoles` | Computed dependency record from tools, MCP, skills, models, and subagents |
| 61 | WorkItemSessionLink | workitemsessionlinks | `organizationRef`, `workItemRef`, `agentSession` | Association between issues/PRs and agent sessions |
| 62 | WorkItemWorkspaceLink | workitemworkspacelinks | `organizationRef`, `workItemRef`, `workspace` | Association between issues/PRs and agent workspaces |
| 63 | AgentSessionTranscript | agentsessiontranscripts | `organizationRef`, `sessionRef`, `messages` | Durable chat transcript with message nodes, pagination support, and cost per turn |
| 64 | AgentSessionAttachment | agentsessionattachments | `organizationRef`, `sessionRef`, `sourceType`, `digest` | File attached to a session message with source type, MIME type, digest, and redaction status |
| 65 | KrateWorkspaceRuntime | krateworkspaceruntimes | `organizationRef`, `workspaceRef`, `status` | Workspace runtime surface state with cwd, environment variables, process status, and preview URL |
| 66 | AgentMemorySnapshot | agentmemorysnapshots | `organizationRef`, `memoryRepository`, `requestedRef`, `resolvedCommit` | Immutable dispatch-time memory pin with resolved commit, query manifest digest, and selected records digest |
| 67 | AgentMemoryQuery | agentmemoryqueries | `organizationRef`, `snapshotRef`, `requester`, `query` | Graph and grep retrieval record with query parameters, result digests, and ranking metadata |
| 68 | AgentMemoryUpdate | agentmemoryupdates | `organizationRef`, `memoryRepository`, `sourceRun`, `changes` | Reviewable proposed memory mutation with branch, changes, and validation status |
| 69 | AgentRunMemoryImport | agentrunmemoryimports | `organizationRef`, `memoryRepository`, `source`, `include` | Import curated babysitter run metadata into org company brain with redaction and review |

#### External-Backends Context (6 kinds)

| # | Kind | Plural | Required Spec Fields | Purpose |
|---|------|--------|---------------------|---------|
| 70 | ExternalWebhookDelivery | externalwebhookdeliveries | `organizationRef`, `providerRef`, `eventType`, `payload` | Inbound webhook delivery from an external backend provider with event type, payload, and processing state |
| 71 | ExternalSyncEvent | externalsyncevents | `organizationRef`, `providerRef`, `eventKind`, `resourceRef` | Discrete sync event record from an external backend for a specific resource kind with dedupe and ordering metadata |
| 72 | ExternalSyncState | externalsyncstates | `organizationRef`, `providerRef`, `resourceRef`, `phase` | Current sync phase, last successful sync timestamp, and error details for an external resource binding |
| 73 | ExternalWriteIntent | externalwriteintents | `organizationRef`, `providerRef`, `resourceRef`, `operation` | Queued write-back intent to an external backend with operation, payload snapshot, and approval state |
| 74 | ExternalSyncConflict | externalsyncconflicts | `organizationRef`, `providerRef`, `resourceRef`, `conflictKind` | Detected conflict between local and external state with conflict kind, diff, and resolution outcome |
| 75 | ExternalObjectLink | externalobjectlinks | `organizationRef`, `providerRef`, `externalId`, `localRef` | Stable mapping between a Krate local resource and its external backend counterpart by external ID |

---

## 2. API Surface

Source: `packages/krate/core/src/http-server.js`

### 2.1 All HTTP Routes (40 routes)

| # | Method | Path | Auth | Request Body | Success | Error | Purpose |
|---|--------|------|------|-------------|---------|-------|---------|
| 1 | GET | `/healthz` | No | — | 200 `{ ok: true }` | — | Health check |
| 2 | GET | `/api/controller` | No | Query: `?org=` | 200 UI model | 400 | Full controller UI model |
| 3 | GET | `/api/orgs` | No | — | 200 `{ organizations }` | 400 | List organizations |
| 4 | POST | `/api/orgs` | Yes | `{ slug, displayName }` | 201 `{ organization, namespace, binding }` | 400 | Create organization |
| 5 | GET | `/api/orgs/:org/resources` | No | Query: `?kind=` | 200 `{ items }` | 400 | List resources by kind |
| 6 | POST | `/api/orgs/:org/resources` | Yes | Resource object | 201 `{ operation, resource }` | 400 | Apply resource |
| 7 | GET | `/api/orgs/:org/resources/:kind/:name` | No | — | 200 resource | 400 | Get single resource |
| 8 | DELETE | `/api/orgs/:org/resources/:kind/:name` | Yes | — | 200 result | 400 | Delete resource |
| 9 | GET | `/api/orgs/:org/repositories` | No | — | 200 `{ items }` | 400 | List repositories |
| 10 | POST | `/api/orgs/:org/repositories` | Yes | `{ name, visibility }` | 201 `{ repository }` | 400 | Create repository |
| 11 | GET | `/api/orgs/:org/repositories/:name` | No | — | 200 resource | 400 | Get repository |
| 12 | DELETE | `/api/orgs/:org/repositories/:name` | Yes | — | 200 result | 400 | Delete repository |
| 13 | GET | `/api/orgs/:org/snapshot` | No | — | 200 snapshot | 400 | Org runtime snapshot |
| 14 | POST | `/api/orgs/:org/snapshot` | Yes | Snapshot object | 200 result | 400 | Import snapshot |
| 15 | GET | `/api/orgs/:org/runtime-resources/:kind` | No | — | 200 items | 400 | List runtime resources |
| 16 | POST | `/api/orgs/:org/repositories/:repo/objects` | Yes | Object data | 201 result | 400 | Record git object |
| 17 | POST | `/api/orgs/:org/repositories/:repo/search-index` | Yes | Index request | 202 result | 400 | Enqueue search index |
| 18 | POST | `/api/orgs/:org/pullrequests` | Yes | PR data | 201 PR | 400 | Create pull request |
| 19 | POST | `/api/orgs/:org/pullrequests/:pr/reviews` | Yes | Review data | 201 review | 400 | Add review |
| 20 | POST | `/api/orgs/:org/pullrequests/:pr/checks/complete` | Yes | Pipeline data | 200 result | 400 | Complete pipeline check |
| 21 | POST | `/api/orgs/:org/pullrequests/:pr/merge` | Yes | Merge options | 200 result | 400 | Merge pull request |
| 22 | POST | `/api/orgs/:org/agents/approvals/:name/decide` | Yes | `{ decision, decidedBy, reason }` | 200 result | 400 | Approve/deny agent action |
| 23 | POST | `/api/orgs/:org/agents/webhooks/ingest` | Yes | Webhook payload | 200 result | 400 | Ingest webhook event |
| 24 | POST | `/api/orgs/:org/agents/events/pipeline-failure` | Yes | `{ name, repository, ref }` | 200 result | 400 | Pipeline failure event |
| 25 | POST | `/api/orgs/:org/agents/events/comment` | Yes | `{ kind, name, body }` | 200 result | 400 | Comment event |
| 26 | POST | `/api/orgs/:org/agents/events/label` | Yes | `{ kind, name, label }` | 200 result | 400 | Label event |
| 27 | POST | `/api/orgs/:org/agents/triggers/process` | Yes | Event + options | 200 result | 400 | Process trigger |
| 28 | POST | `/api/orgs/:org/agents/memory/query` | Yes | `{ query, mode, kinds }` | 200 results | 400 | Query agent memory |
| 29 | GET | `/api/orgs/:org/secrets` | No | — | 200 `{ secrets }` | 400 | List secrets |
| 30 | POST | `/api/orgs/:org/secrets` | Yes | `{ name, data }` | 201 result | 400 | Create secret |
| 31 | DELETE | `/api/orgs/:org/secrets/:name` | Yes | — | 200 result | 400 | Delete secret |
| 32 | GET | `/api/orgs/:org/secret-grants` | No | — | 200 grants | 400 | List secret grants |
| 33 | POST | `/api/orgs/:org/secret-grants` | Yes | Grant data | 201 grant | 400 | Create secret grant |
| 34 | POST | `/api/orgs/:org/external/sync` | Yes | `{ bindingName, kind, localName, spec, externalEnvelope }` | 200 result | 400 | Trigger external sync |
| 35 | POST | `/api/orgs/:org/external/conflicts/:name/resolve` | Yes | `{ strategy, resolvedValue }` | 200 result | 400 | Resolve sync conflict |
| 36 | POST | `/api/orgs/:org/external/write-intents/:name/approve` | Yes | `{ approvedBy }` | 200 result | 400 | Approve write intent |
| 37 | POST | `/api/orgs/:org/external/write-intents/:name/cancel` | Yes | `{ cancelledBy }` | 200 result | 400 | Cancel write intent |
| 38 | GET | `/api/orgs/:org/agents/events/stream` | No | — | 200 SSE | — | SSE event stream |

### 2.2 Route Pattern Matching

All routes use regex matching on `url.pathname`:
```javascript
url.pathname.match(/^\/api\/orgs\/([^/]+)\/resources$/)
```

Priority: routes are checked in order of declaration in `createKrateHttpHandler()`.

### 2.3 SSE Protocol

```
GET /api/orgs/:org/agents/events/stream HTTP/1.1

HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no

data: {"type":"connected"}

data: {"type":"heartbeat"}

data: {"type":"resource-change","kind":"Repository","name":"my-repo","operation":"apply","timestamp":"2025-01-01T00:00:00.000Z"}
```

---

## 3. Controller Boundaries

### 3.1 Complete Controller Inventory

| # | Controller | Source File | Lines | Methods |
|---|-----------|-------------|-------|---------|
| 1 | KubernetesResourceClient | `kubernetes-controller.js` | 883 | snapshot, listResource, getResource, applyResource, deleteResource, createRepository, createOrganization, watchResource |
| 2 | KrateKubernetesReconciler | `kubernetes-controller.js` | (shared) | describeReconciliationScope, reconcileRepository, reconcileIdentityAccess, reconcileIdentityAccessResources |
| 3 | KubernetesResourceGateway | `kubernetes-resource-gateway.js` | 48 | snapshot, list, get, apply, delete, createRepository, createOrganization, watch |
| 4 | KrateApiController | `api-controller.js` | 541 | snapshot, listResource, getResource, applyResource, deleteResource, createRepository, createOrganization, dispatchAgent, processWebhookEvent, queryAgentMemory, syncExternalBinding, resolveExternalConflict, + 10 more |
| 5 | AgentStackController | `agent-stack-controller.js` | 347 | reconcileStack, listStackCapabilities, checkMcpHealth |
| 6 | AgentDispatchController | `agent-dispatch-controller.js` | 209 | createManualDispatch |
| 7 | AgentWorkspaceController | `agent-workspace-controller.js` | 702 | createWorkspace, deleteWorkspace, getWorkspaceStatus, initializeWorkspace, checkoutBranch, syncWorkspace, getMountSpec, findReusableWorkspace, claimWorkspace, releaseWorkspace, provisionWorkspace, archiveWorkspace, recoverWorkspace, bindSession, linkWorkItem, linkWorkItemToSession, listWorkspacesForRepo, listWorkspacesForRun, launchCodespace, stopCodespace, getCodespaceStatus, addAssociation, removeAssociation, listAssociations, getWorkspaceRuns |
| 8 | AgentTriggerController | `agent-trigger-controller.js` | 381 | matchRule, evaluateEvent, createTriggerExecution, evaluateWebhookEvent, processEvent |
| 9 | AgentApprovalController | `agent-approval-controller.js` | 170 | createApprovalRequest, recordDecision, isActionApproved, listPendingApprovals, listApprovalsForRun, persistApproval, enforceApproval |
| 10 | AgentMemoryQuery | `agent-memory-query.js` | 293 | queryGraph, queryGrep, queryMemory |
| 11 | WebhookController | `external/webhook-controller.js` | 144 | verifyHmacSignature, createDeliveryRecord, recordDelivery, isDuplicate, onEvent, processDelivery |
| 12 | SyncController | `external/sync-controller.js` | 235 | normalizeEvent, upsertResource, updateWatermark, getWatermark, applyOwnershipMode, createTombstone, getTombstone |
| 13 | ConflictController | `external/conflict-controller.js` | 225 | detectConflict, resolveConflict, listOpenConflicts, supersede |
| 14 | WriteController | `external/write-controller.js` | 283 | createWriteIntent, approveWriteIntent, rejectWriteIntent, markSending, confirmSuccess, confirmFailure, listIntents |
| 15 | AuditController | `audit-controller.js` | ~180 | log, query, getStream, getMetrics |
| 16 | RunnerController | `runner-controller.js` | ~300 | validateRunnerPool, getPoolStatus, getCapacity, createRunner, assignJob, releaseRunner, generatePodSpec |
| 17 | NotificationController | `notification-controller.js` | 178 | createNotification, listNotifications, markAsRead, markAllAsRead, getUnreadCount, getPreferences, updatePreferences |
| 18 | PermissionReviewer | `agent-permission-review.js` | 250 | reviewPermissions, createPermissionSnapshot |

### 3.2 Boundary Pattern

Every controller exports:
```javascript
export const <NAME>_BOUNDARY = {
  role: 'controller-name',
  scope: 'What it does in one sentence',
  owns: ['capability-1', 'capability-2'],
  delegatesTo: ['other-controller-1'],
  mustNotOwn: ['thing-it-must-not-do']
};
```

---

## 4. Resource Validation Rules

Source: `packages/krate/core/src/resource-model.js` — `validateResource()`

### 4.1 Universal Validation

1. `resource` must be a non-null object
2. `resource.kind` must match a key in `RESOURCE_DEFINITIONS`
3. `resource.metadata.name` is required (non-empty string)
4. `resource.spec` and `resource.status` default to `{}` if missing
5. `resource.metadata.namespace` defaults to `'default'`
6. `resource.metadata.labels` and `annotations` default to `{}`
7. Every field listed in `requiredSpec` must be non-null, non-undefined, non-empty-string

### 4.2 Name Normalization

`normalizeName(value)`:
```javascript
String(value).toLowerCase()
  .replace(/[^a-z0-9-]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 63) || 'user'
```

### 4.3 Org Slug Normalization

`normalizeOrgSlug(value)`:
```javascript
String(value).trim().toLowerCase()
  .replace(/[^a-z0-9-]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 63)
```

---

## 5. MCP Server Protocol

Source: `packages/krate/cli/src/mcp-server.js`

### 5.1 Tools (14)

| # | Tool | Inputs | Output |
|---|------|--------|--------|
| 1 | `krate_list_resources` | `{ kind: string }` | Resource list |
| 2 | `krate_get_resource` | `{ kind: string, name: string }` | Single resource |
| 3 | `krate_apply_resource` | `{ resource: object }` | Apply result |
| 4 | `krate_delete_resource` | `{ kind: string, name: string }` | Delete result |
| 5 | `krate_snapshot` | `{}` | Full org snapshot |
| 6 | `krate_search` | `{ query: string }` | Search results |
| 7 | `krate_list_stacks` | `{}` | Agent stacks |
| 8 | `krate_create_stack` | `{ name: string, org: string }` | Created stack |
| 9 | `krate_dispatch_agent` | `{ stackRef: string }` | Dispatch result |
| 10 | `krate_list_secrets` | `{ org?: string }` | Secret grants |
| 11 | `krate_create_secret` | `{ name, org, agentRef, secretRef }` | Created grant |
| 12 | `krate_sync_external` | `{ bindingName, kind, localName }` | Sync result |
| 13 | `krate_resolve_conflict` | `{ conflictName, strategy }` | Resolution |
| 14 | `krate_audit_query` | `{ org?, action?, since?, until?, limit?, offset? }` | Audit events |

### 5.2 Prompts (3)

| Prompt | Description |
|--------|-------------|
| `krate_workspace_setup` | Guide for setting up a new krate workspace |
| `krate_stack_config` | Help configuring an agent stack |
| `krate_troubleshoot` | Diagnose common krate issues |

### 5.3 Resources (2)

| URI | MIME Type |
|-----|-----------|
| `krate://snapshot` | application/json |
| `krate://stacks` | application/json |

---

## 6. CLI Commands

Source: `packages/krate/cli/src/index.js`

| Command | Description | Key Options |
|---------|-------------|-------------|
| `krate serve` | Start HTTP API server | `--port 3080` |
| `krate mcp` | Start MCP server over stdio | — |
| `krate status` | Show workspace status | `--org`, `--json` |
| `krate stacks` | List agent stacks | `--org`, `--json` |
| `krate dispatch` | Dispatch an agent run | `--stack`, `--repo`, `--ref` |
| `krate apply` | Apply resource from file | `--file`, `--org` |
| `krate get` | Get resource by kind/name | `kind`, `name`, `--org` |
| `krate list` | List resources by kind | `kind`, `--org`, `--json` |
| `krate delete` | Delete resource | `kind`, `name`, `--org` |
| `krate version` | Show CLI version | — |

---

## 7. Event System

### 7.1 Event Bus API

```javascript
const bus = createEventBus();
bus.subscribe(fn);                          // Add listener
bus.unsubscribe(fn);                        // Remove listener
bus.emit(event);                            // Broadcast
bus.emitResourceChange(kind, name, op);     // Convenience
```

### 7.2 Event Types

| Type | Origin | Payload |
|------|--------|---------|
| `connected` | SSE endpoint | `{}` |
| `heartbeat` | SSE interval (30s) | `{}` |
| `resource-change` | applyResource/deleteResource | `{ kind, name, operation, timestamp }` |

### 7.3 Notification Types

| Type | Trigger | Severity |
|------|---------|----------|
| `run-complete` | AgentDispatchRun phase change | info/error |
| `approval-needed` | AgentApproval created (pending) | warning |
| `conflict-detected` | ExternalSyncConflict created | warning |
| `workspace-ready` | KrateWorkspace claimed | info |
| `system` | Default/fallback | info |

---

## 8. Trigger Rule System

### 8.1 Source Types

| Source Type | Detection Logic | Validation Function |
|-------------|----------------|-------------------|
| `cron` | `spec.cronExpression !== undefined` | `validateCronExpression(expr)` |
| `webhook` | `spec.webhookTrigger !== undefined` | `validateWebhookTrigger(config)` |
| `comment` | `spec.commentTrigger !== undefined` | `validateCommentTrigger(config)` |
| `label` | `spec.labelTrigger !== undefined` | `validateLabelTrigger(config)` |
| `event` | `spec.sources !== undefined` | Array.isArray + non-empty |

### 8.2 Rule Matching Algorithm

For event-based rules (`matchRule()`):
1. Event type must be in `rule.spec.sources[]`
2. If `rule.spec.repository` set: must match `event.repository`
3. If `rule.spec.allowedActors[]` non-empty: `event.actor` must be included

For webhook-based rules (`evaluateWebhookEvent()`):
1. `rule.spec.enabled !== false`
2. `rule.spec.webhookTrigger` must exist
3. `webhookTrigger.events` includes event type (or `['*']` or absent)
4. `webhookTrigger.repository` matches (if set)
5. `webhookTrigger.action` matches (if set)

### 8.3 Deduplication

Before dispatching, checks `AgentTriggerExecution` resources:
```javascript
executions.some(ex =>
  ex.spec?.triggerRule === rule.metadata?.name &&
  ex.spec?.sourceEvent === eventUid &&
  ex.status?.phase !== 'Failed'
)
```

Event UID format: `${event.type}:${event.source.kind}:${event.source.name}`

---

## 9. Approval System

### 9.1 Valid Actions

```javascript
const VALID_ACTIONS = new Set(['tool-use', 'secret-access', 'write-back', 'release', 'escalation']);
```

### 9.2 Approval Phases

```
(none) → Pending → Approved
                 → Denied
```

### 9.3 Duplicate Detection

Before creating a new approval, checks for existing:
```javascript
resources.AgentApproval.find(a =>
  a.spec?.dispatchRun === dispatchRun &&
  a.spec?.action === action &&
  (!a.status?.phase || a.status.phase === 'Pending')
)
```

---

## 10. Stack Readiness Conditions

Source: `agent-stack-controller.js` — `reconcileStack()`

| Condition Type | True When | False When |
|---------------|-----------|------------|
| `CapabilitiesResolved` | All referenced resources exist | Any missing ref |
| `ToolsAdmitted` | AgentToolProfile found (or no ref) | Referenced profile missing |
| `McpHealthy` | All AgentMcpServer resources exist | Any missing MCP server |
| `SkillsValidated` | All skills exist with valid format+sourceRef | Missing or invalid skills |
| `SubagentsValid` | All subagents exist with non-empty taskKinds | Missing or invalid subagents |
| `ContextLabelsValid` | All context labels exist | Any missing label |
| `RuntimeIdentityReady` | AgentServiceAccount found | SA not found |
| `RolesAdmitted` | No role binding errors in permission review | Missing AgentRoleBinding |
| `SecretsAdmitted` | No secret grant errors | Missing AgentSecretGrant |
| `ConfigAdmitted` | No config grant errors | Missing AgentConfigGrant |
| `Ready` | ALL above conditions are True | ANY condition is False |

---

## 11. External Conflict Resolution

### 11.1 Valid Strategies

```javascript
const VALID_STRATEGIES = ['prefer-external', 'prefer-krate', 'manual', 'ignore'];
```

### 11.2 Conflict Lifecycle

```
(detected) → Open → Resolved (with strategy + resolvedValue)
                   → Superseded (newer conflict replaces)
```

### 11.3 Write Intent Phases

```javascript
const VALID_PHASES = ['PendingApproval', 'ReadyToSend', 'Sending', 'Retrying', 'Succeeded', 'Failed', 'Rejected'];
```

Lifecycle:
```
PendingApproval → ReadyToSend (approved) → Sending → Succeeded
                                                    → Retrying → Sending (retry)
                                                    → Failed
               → Rejected (cancelled)
```

---

## 12. Runner System

### 12.1 Pool Validation Rules

- `spec.organizationRef`: required, non-empty string
- `spec.warmReplicas`: non-negative integer
- `spec.maxReplicas`: positive integer (>= 1)
- `warmReplicas <= maxReplicas`

### 12.2 Runner Statuses

```javascript
const RUNNER_STATUSES = new Set(['Idle', 'Running', 'Terminating']);
```

### 12.3 Pool Phases

| Phase | Condition |
|-------|-----------|
| `Empty` | No runners registered |
| `Active` | At least one runner is Running |
| `Idle` | All runners are Idle |

### 12.4 Scaling States

| State | Condition |
|-------|-----------|
| `ScalingUp` | total < warmReplicas |
| `ScalingDown` | total > maxReplicas |
| `Stable` | warmReplicas <= total <= maxReplicas |

---

## 13. Audit System

### 13.1 Event Structure

```javascript
{
  id: number,           // Auto-incrementing sequence
  org: string,          // Required
  actor: string,        // Default: 'system'
  action: string,       // Required (e.g., 'apply', 'delete', 'dispatch')
  resource: object,     // Optional resource reference
  timestamp: string     // ISO 8601
}
```

### 13.2 Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `org` | string | Filter by organization |
| `action` | string | Filter by action type |
| `since` | string (ISO) | Events after this time |
| `until` | string (ISO) | Events before this time |
| `limit` | number | Max results to return |
| `offset` | number | Skip first N results |

---

## 14. Resource Model Utility Functions

Source: `packages/krate/core/src/resource-model.js`

| Function | Signature | Purpose |
|----------|-----------|---------|
| `listResourceDefinitions()` | `() → Array<{kind, storage, context, plural, purpose, requiredSpec}>` | List all 76 definitions |
| `resourceDefinitionForKind(kind)` | `(string) → definition` | Lookup by kind name |
| `resourceSchemaForKind(kind)` | `(string) → schema object` | Get schema with required fields |
| `storageClassForKind(kind)` | `(string) → 'etcd' | 'postgres'` | Get storage backend |
| `resourceKey(resource)` | `(object) → 'Kind/namespace/name'` | Unique resource key |
| `clone(value)` | `(any) → deep copy` | `JSON.parse(JSON.stringify(value))` |
| `createResource(kind, metadata, spec, status)` | `(string, object, object, object) → resource` | Create well-formed resource |
| `validateResource(resource)` | `(object) → resource (mutated)` | Validate and normalize |
| `toKubernetesList(kind, items)` | `(string, Array) → { apiVersion, kind, items }` | Wrap as K8s list |
| `matchLabels(resource, selector)` | `(object, object) → boolean` | Label selector match |
| `createSelector(spec)` | `(object) → Selector resource` | Create Selector |
| `createView(spec)` | `(object) → View resource` | Create View |
| `resourceToYaml(resource)` | `(object) → string` | Serialize to YAML |
