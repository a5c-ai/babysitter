# Kradle SDK API Reference

> Exhaustive API reference for `@a5c-ai/kradle-sdk`.
> Source: `packages/kradle/sdk/src/index.js` — 65+ re-exports from core.
> All functions are pure ESM exports with zero external dependencies.

---

## 1. Resource Model

Source: `packages/kradle/core/src/resource-model.js`

### CONFIG_KINDS

```javascript
import { CONFIG_KINDS } from '@a5c-ai/kradle-sdk';
// Type: Set<string>
// Size: 44 kind names stored in etcd via Kubernetes CRDs
// Includes: Organization, User, Team, Repository, AgentStack, KradleWorkspace, etc.
```

### AGGREGATED_KINDS

```javascript
import { AGGREGATED_KINDS } from '@a5c-ai/kradle-sdk';
// Type: Set<string>
// Size: 32 kind names stored in PostgreSQL
// Includes: PullRequest, Issue, AgentDispatchRun, AgentSession, etc.
```

### createResource(kind, metadata, spec, status)

Creates a well-formed Kradle resource object with validation.

```javascript
import { createResource } from '@a5c-ai/kradle-sdk';

const repo = createResource('Repository',
  { name: 'my-repo', namespace: 'kradle-org-acme' },
  { organizationRef: 'acme', visibility: 'private' },
  { phase: 'Ready' }
);
```

**Parameters:**
| Parameter | Type | Required | Default | Constraints |
|-----------|------|----------|---------|-------------|
| `kind` | `string` | Yes | — | Must be a key in ALL_KINDS (76 valid values) |
| `metadata` | `object` | Yes | — | Must contain `name` (non-empty string) |
| `spec` | `object` | No | `{}` | Deep-cloned via JSON.parse(JSON.stringify) |
| `status` | `object` | No | `{}` | Deep-cloned |

**Returns:** `{ apiVersion: 'kradle.a5c.ai/v1alpha1', kind, metadata: { namespace, labels: {}, annotations: {}, ...metadata }, spec, status }`

**Throws:**
- `Error('Unknown Kradle resource kind: X')` if kind not in ALL_KINDS
- `Error('X requires metadata.name')` if metadata.name is falsy

**Side Effects:** None (pure function)

### clone(value)

Deep clone via `JSON.parse(JSON.stringify(value))`. Returns `undefined` for `undefined` input.

```javascript
import { clone } from '@a5c-ai/kradle-sdk';
const copy = clone(resource);  // Independent deep copy
clone(undefined);              // Returns undefined
```

### resourceToYaml(resource)

Serialize a resource object to YAML string format. Custom implementation (no dependencies).

```javascript
import { resourceToYaml } from '@a5c-ai/kradle-sdk';
const yaml = resourceToYaml(repo);
// apiVersion: kradle.a5c.ai/v1alpha1
// kind: Repository
// metadata:
//   name: my-repo
//   namespace: kradle-org-acme
// spec:
//   organizationRef: acme
//   visibility: private
```

**Behavior:**
- Scalars: direct value (quotes added for `: ` or `{`/`[` prefixed strings)
- Objects: nested with 2-space indent
- Arrays: `- item` format; first key of object items on same line as `-`
- Returns string with trailing newline

### findResourceDefinition(kind)

Look up the full resource definition from `KRADLE_RESOURCES` array.

```javascript
import { findResourceDefinition } from '@a5c-ai/kradle-sdk';
const def = findResourceDefinition('Repository');
// { kind: 'Repository', plural: 'repositories', namespaced: true, storage: 'etcd' }
findResourceDefinition('repositories');  // Also works (matches on plural)
```

**Throws:** `Error('Unsupported Kradle resource X')` if not found.

**Note:** This function searches the 75+ KRADLE_RESOURCES array (which includes KubeVela, Kyverno, and core K8s resources beyond the 76 Kradle-native kinds).

---

## 2. API Controller

Source: `packages/kradle/core/src/api-controller.js`

### createKradleApiController(options?)

Creates the main API controller facade for resource operations.

```javascript
import { createKradleApiController } from '@a5c-ai/kradle-sdk';

const controller = createKradleApiController({
  namespace: 'kradle-org-acme',
  resourceGateway: customGateway,  // optional
  onAuditEvent: (event) => {}     // optional callback
});
```

**Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `namespace` | `string` | `process.env.KRADLE_NAMESPACE` or `'kradle-system'` | Target K8s namespace |
| `resourceGateway` | `object` | `createKubernetesResourceGateway(options)` | Custom gateway |
| `onAuditEvent` | `function` | `null` | Callback for audit events |

**Methods:**

| Method | Signature | Returns | Side Effects |
|--------|-----------|---------|--------------|
| `snapshot()` | `() → Promise<object>` | Full snapshot with architecture | kubectl calls |
| `listResource(kind)` | `(string) → Promise<{items}>` | Resource list | kubectl get |
| `listResourceForOrg(org, kind)` | `(string, string) → Promise<{items}>` | Org-filtered list | kubectl get + filter |
| `getResource(kind, name)` | `(string, string) → Promise<object>` | Single resource | kubectl get |
| `applyResource(resource)` | `(object) → Promise<{operation, resource}>` | Apply result | kubectl apply, cache clear, event emit |
| `applyResourceForOrg(org, resource)` | `(string, object) → Promise<object>` | Scoped apply | kubectl apply, cross-org validation |
| `deleteResource(kind, name)` | `(string, string) → Promise<object>` | Delete result | kubectl delete, cache clear, event emit |
| `deleteResourceForOrg(org, kind, name)` | `(string, string, string) → Promise<object>` | Scoped delete | Cross-org validation, kubectl delete |
| `getResourceForOrg(org, kind, name)` | `(string, string, string) → Promise<object>` | Scoped get | Cross-org validation |
| `createRepository(input)` | `(object) → Promise<{repository, resource}>` | Repository summary | kubectl apply |
| `createOrganization(input)` | `(object) → Promise<{organization, namespace, binding}>` | Org + namespace + binding | kubectl apply x3 |
| `watchResource(path, handlers)` | `(string, object) → {child, command}` | Watch handle | kubectl spawn |
| `reviewAgentPermissions(input)` | `(object) → Promise<review>` | Permission review | snapshot + review |
| `dispatchAgent(input)` | `(object) → Promise<dispatch result>` | Dispatch run | Full dispatch flow |
| `approveAgentAction(input)` | `(object) → Promise<result>` | Approval decision | Snapshot + approve |
| `denyAgentAction(input)` | `(object) → Promise<result>` | Deny decision | Snapshot + deny |
| `processWebhookEvent(input)` | `(object) → Promise<{processed, dispatched}>` | Trigger results | Snapshot + trigger eval |
| `provisionAgentWorkspace(input)` | `(object) → Promise<workspace>` | Workspace | Workspace creation |
| `archiveAgentWorkspace(input)` | `(object) → Promise<result>` | Archived workspace | Snapshot + archive |
| `linkWorkItem(input)` | `(object) → Promise<link>` | Link resource | Link creation |
| `queryAgentMemory(input)` | `(object) → Promise<results>` | Query results | Memory query |
| `syncExternalBinding(name, opts)` | `(string, object) → Promise<{resource, bindingName}>` | Sync result | Upsert + watermark |
| `resolveExternalConflict(opts)` | `(object) → Promise<result>` | Resolution | Conflict resolve |
| `approveExternalWriteIntent(opts)` | `(object) → Promise<result>` | Approval | Intent approve |
| `cancelExternalWriteIntent(opts)` | `(object) → Promise<result>` | Cancellation | Intent reject |
| `processExternalWebhook(params)` | `(object) → Promise<result>` | Delivery result | HMAC verify + process |

**Cross-org admission (in `applyResource`):**
```javascript
// If resource.spec.organizationRef is set and metadata.namespace doesn't match
// orgNamespaceName(organizationRef), throws:
// Error('Cross-org namespace mismatch: resource organizationRef "X" expects namespace "Y" but got "Z"')
```

---

## 3. UI Model

Source: `packages/kradle/core/src/controller-ui.js`

### createControllerUiModel(snapshot, options?)

Transforms a raw snapshot into the structured UI model consumed by all web pages.

```javascript
import { createControllerUiModel } from '@a5c-ai/kradle-sdk';
const uiModel = createControllerUiModel(snapshot, { organization: 'acme' });
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `snapshot` | `object` | Raw snapshot from `controller.snapshot()` or runtime |
| `options.organization` | `string` | Org slug to filter by (optional) |

**Returns:** Full UI model object (see web-console-spec.md Section 3.2 for full shape)

### issueProjectRefs(issue)

Extract all project references from an issue resource (checks spec, labels, annotations, status).

```javascript
import { issueProjectRefs } from '@a5c-ai/kradle-sdk';
const refs = issueProjectRefs(issue); // ['project-alpha', 'project-beta']
```

### issueRepositoryRefs(issue)

Extract all repository references from an issue resource.

```javascript
import { issueRepositoryRefs } from '@a5c-ai/kradle-sdk';
const refs = issueRepositoryRefs(issue); // ['my-repo', 'other-repo']
```

---

## 4. Authentication

Source: `packages/kradle/core/src/auth.js`

### createAuthProviderConfig(env?)

```javascript
import { createAuthProviderConfig } from '@a5c-ai/kradle-sdk';
const config = createAuthProviderConfig(process.env);
// Returns: { session: { cookieName }, delegatedIdentity: {...}, providers: { github: {...}, sso: {...} } }
```

### listEnabledAuthProviders(config?)

```javascript
import { listEnabledAuthProviders } from '@a5c-ai/kradle-sdk';
const providers = listEnabledAuthProviders(config);
// Returns: Array of providers where enabled=true, clientId set, authorizationUrl set
```

### buildAuthorizationRedirect({ provider, requestUrl, state? })

```javascript
import { buildAuthorizationRedirect } from '@a5c-ai/kradle-sdk';
const { url, state, redirectUri } = buildAuthorizationRedirect({
  provider: config.providers.github,
  requestUrl: 'https://kradle.example.com/login'
});
// url: 'https://github.com/login/oauth/authorize?response_type=code&client_id=...&redirect_uri=...&scope=...&state=...'
```

**Throws:** Error if provider disabled, clientId missing, or authorizationUrl missing.

### exchangeOAuthCodeForProfile({ provider, code, requestUrl, fetchImpl? })

```javascript
import { exchangeOAuthCodeForProfile } from '@a5c-ai/kradle-sdk';
const profile = await exchangeOAuthCodeForProfile({
  provider: config.providers.github,
  code: 'abc123',
  requestUrl: 'https://kradle.example.com/login'
});
// Returns: { provider, subject, email, displayName, username, groups, teams, admin }
```

**Side Effects:** Two HTTP requests (token exchange + profile fetch)

### createSessionCookie(config, profile, options?)

```javascript
import { createSessionCookie } from '@a5c-ai/kradle-sdk';
const cookie = createSessionCookie(config, profile, { secret: 'my-secret' });
// "kradle_session=eyJ...base64url.hmac_signature; Path=/; HttpOnly; SameSite=Lax"
```

### parseSessionCookie(config, cookieValue, options?)

```javascript
import { parseSessionCookie } from '@a5c-ai/kradle-sdk';
const session = parseSessionCookie(config, cookieValue, { secret: 'my-secret' });
// Returns: { cookieName, provider, subject, user } or null
```

### profileFromDelegatedHeaders(headers, config?, options?)

```javascript
import { profileFromDelegatedHeaders } from '@a5c-ai/kradle-sdk';
const profile = profileFromDelegatedHeaders(request.headers, config, { requestUrl });
```

### registerLoginProfile({ controller, namespace, profile })

Applies User + IdentityMapping resources via `controller.applyResource()`.

### mapLoginProfileToKradleIdentity(profile)

Pure function: maps OAuth profile to User + IdentityMapping resources.

### createInviteResource(spec) / createTeamResource(spec)

Factory functions for Invite and Team resources.

---

## 5. Org Scoping

Source: `packages/kradle/core/src/org-scoping.js`

### orgNamespaceName(org)

```javascript
import { orgNamespaceName } from '@a5c-ai/kradle-sdk';
orgNamespaceName('acme');      // 'kradle-org-acme'
orgNamespaceName('Acme Inc');  // 'kradle-org-acme-inc'
```

**Throws:** `Error('organization is required')` if empty after normalization.

### normalizeOrgSlug(value)

```javascript
import { normalizeOrgSlug } from '@a5c-ai/kradle-sdk';
normalizeOrgSlug('Acme Inc');   // 'acme-inc'
normalizeOrgSlug('  HELLO  ');  // 'hello'
```

---

## 6. Agent Controllers

### resolveStack(agentStack, resources)

Translates an `AgentStack` CRD into a flat execution config consumed by `createAgentJob()`.

```javascript
import { resolveStack } from '@a5c-ai/kradle-sdk';

const executionConfig = resolveStack(agentStack, resources);
// Returns: {
//   agentImage: string,
//   command: string[],
//   model: string,
//   prompt: string,
//   systemPrompt: string,
//   serviceAccountName: string,
//   resourceRequests: { cpu, memory },
//   resourceLimits: { cpu, memory },
//   adapterRef: string,
//   runnerPoolRef: string | null
// }
```

**Throws:** `Error('AgentStack not found: X')` if stack is not in resources.

---

### createAgentJob(run, executionConfig)

Generates a `batch/v1` Job manifest for an agent dispatch run. Does not submit
to Kubernetes — call `submitAgentJob()` to apply.

```javascript
import { createAgentJob } from '@a5c-ai/kradle-sdk';

const jobManifest = createAgentJob(run, executionConfig, {
  workspacePvcName: 'kradle-ws-my-workspace',
  callbackUrl: 'https://kradle.example.com/api/orgs/acme/agents/runs/run-abc/callback',
  resolvedTransport: { transport: 'websocket', codec: 'json' },
  budgetDeadlineSeconds: 3600
});
// Returns: batch/v1 Job object ready for kubectl apply
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `run` | `object` | AgentDispatchRun resource |
| `executionConfig` | `object` | Output of `resolveStack()` |
| `options.workspacePvcName` | `string` | PVC name to mount at `/workspace` |
| `options.callbackUrl` | `string` | Callback endpoint for result reporting |
| `options.resolvedTransport` | `object` | Output of `resolveTransport()` |
| `options.budgetDeadlineSeconds` | `number` | `activeDeadlineSeconds` for budget enforcement |

---

### submitAgentJob(jobManifest)

Submits a Job manifest to Kubernetes via `kubectl apply -f -`. Returns the applied
Job resource.

```javascript
import { submitAgentJob } from '@a5c-ai/kradle-sdk';

const appliedJob = await submitAgentJob(jobManifest);
// Returns: { job: K8s Job resource, jobName: string }
```

---

### getJobStatus(jobName, namespace)

Retrieves the current status of a Kubernetes Job.

```javascript
import { getJobStatus } from '@a5c-ai/kradle-sdk';

const status = await getJobStatus('agent-run-abc', 'kradle-org-acme');
// Returns: { phase: 'Pending'|'Active'|'Succeeded'|'Failed', startTime, completionTime, conditions }
```

---

### getJobLogs(jobName, namespace, options?)

Retrieves logs from the agent pod associated with a Job.

```javascript
import { getJobLogs } from '@a5c-ai/kradle-sdk';

const logs = await getJobLogs('agent-run-abc', 'kradle-org-acme', { tail: 100 });
// Returns: string (raw log output)
```

---

### deleteJob(jobName, namespace)

Deletes a completed or failed Job and its associated pods.

```javascript
import { deleteJob } from '@a5c-ai/kradle-sdk';

await deleteJob('agent-run-abc', 'kradle-org-acme');
// Returns: { deleted: true, jobName }
```

---

### persistSessionEvent(runId, result)

Applies a callback result payload to the `AgentDispatchRun` and `AgentSession`
resources, updating their phases and status fields.

```javascript
import { persistSessionEvent } from '@a5c-ai/kradle-sdk';

await persistSessionEvent('run-abc', {
  phase: 'Succeeded',
  exitCode: 0,
  artifacts: [{ kind: 'pr', digest: 'sha256:abc' }],
  costUsd: 0.042
});
// Updates: AgentDispatchRun.status.phase, AgentSession.status.phase, costUsd, artifacts
```

---

### createHooksLifecycleEmitter(bus?)

Creates a lifecycle event emitter that wraps an event bus and emits 9 structured
agent lifecycle events to registered `WebhookSubscription` endpoints.

```javascript
import { createHooksLifecycleEmitter, globalEventBus } from '@a5c-ai/kradle-sdk';

const emitter = createHooksLifecycleEmitter(globalEventBus);

emitter.emit('RUN_CREATED', { runId: 'run-abc', org: 'acme', stackRef: 'my-stack' });
emitter.emit('RUN_STARTED', { runId: 'run-abc', k8sJobName: 'agent-run-abc' });
emitter.emit('RUN_COMPLETED', { runId: 'run-abc', costUsd: 0.042, artifacts: [] });
```

**Event types:** `RUN_CREATED`, `RUN_QUEUED`, `RUN_STARTED`, `STEP_STARTED`,
`STEP_COMPLETED`, `APPROVAL_REQUESTED`, `APPROVAL_GRANTED`, `APPROVAL_DENIED`,
`RUN_COMPLETED`, `RUN_FAILED`

---

### checkBudget({ org, model, estimatedTokens, resources })

Checks whether a dispatch run is within the organization's budget ceiling and
computes the `activeDeadlineSeconds` value for the Job spec.

```javascript
import { checkBudget } from '@a5c-ai/kradle-sdk';

const result = checkBudget({
  org: 'acme',
  model: 'claude-sonnet-4',
  estimatedTokens: 100000,
  resources: snapshot.resources
});
// Returns: {
//   allowed: boolean,
//   reason: string | null,       // 'budget-exceeded' if not allowed
//   estimatedCostUsd: number,
//   activeDeadlineSeconds: number
// }
```

---

### estimateCost(model, inputTokens, outputTokens?)

Pure function that computes estimated cost from model rate tables.

```javascript
import { estimateCost } from '@a5c-ai/kradle-sdk';

const cost = estimateCost('claude-sonnet-4', 80000, 20000);
// Returns: number (USD)
```

Rate tables are sourced from `AgentProviderConfig.spec.modelRates`. Falls back
to built-in defaults when no provider config is available.

---

### resolveTransport(stack, resources)

Resolves the transport protocol and codec for an agent Job by reading the
`AgentTransportBinding` referenced by the stack's adapter.

```javascript
import { resolveTransport } from '@a5c-ai/kradle-sdk';

const transport = resolveTransport(agentStack, resources);
// Returns: {
//   transport: 'websocket' | 'http' | 'stdio' | 'unix',
//   codec: 'json' | 'msgpack',
//   envVars: {
//     AGENT_MUX_TRANSPORT: string,
//     TRANSPORT_MUX_CODEC: string
//   }
// }
```

Falls back to `{ transport: 'http', codec: 'json' }` when no binding is found.

---

### createAgentStackController(options?)

```javascript
import { createAgentStackController } from '@a5c-ai/kradle-sdk';
const ctrl = createAgentStackController({ fetch: customFetch });
```

**Methods:**
- `reconcileStack(stack, resources)` — Returns `{ conditions, capabilities, validation, permissionDecision }`
- `listStackCapabilities(stack, resources)` — Returns array of `{ kind, name, status, ref }`
- `checkMcpHealth(mcpServer)` — Returns `{ serverName, status, latencyMs, error? }`

### createAgentDispatchController(options?)

```javascript
import { createAgentDispatchController } from '@a5c-ai/kradle-sdk';
const ctrl = createAgentDispatchController({ permissionReviewer, stackController, ... });
```

**Methods:**
- `createManualDispatch({ repository, ref, agentStack, taskKind, actor, namespace, organizationRef, resources })` — Full dispatch orchestration

### createAgentWorkspaceController()

```javascript
import { createAgentWorkspaceController } from '@a5c-ai/kradle-sdk';
const ctrl = createAgentWorkspaceController();
```

**Methods (25):**
- `createWorkspace(opts)` — Returns `{ workspace, pvcManifest }`
- `deleteWorkspace(opts)` — Returns `{ workspace, pvcDeleteManifest }`
- `getWorkspaceStatus(opts)` — Returns status object
- `initializeWorkspace(opts)` — Returns git clone commandSpec
- `checkoutBranch(opts)` — Returns git checkout commandSpec
- `syncWorkspace(opts)` — Returns fetch+reset commandSpecs
- `getMountSpec(opts)` — Returns `{ volume, volumeMount }`
- `findReusableWorkspace(opts)` — Returns matching workspace or null
- `claimWorkspace(opts)` — Marks workspace InUse
- `releaseWorkspace(opts)` — Returns workspace to Ready
- `provisionWorkspace(opts)` — Legacy: create + mark InUse + runtime
- `archiveWorkspace(opts)` — Sets phase=Archived
- `recoverWorkspace(opts)` — Recovers from Archived
- `bindSession(opts)` — Adds session to boundSessions[]
- `linkWorkItem(opts)` — Creates WorkItemWorkspaceLink
- `linkWorkItemToSession(opts)` — Creates WorkItemSessionLink
- `listWorkspacesForRepo(opts)` — Filter by repository
- `listWorkspacesForRun(opts)` — Filter by runRef
- `launchCodespace(workspace, opts)` — Returns podSpec, serviceSpec, codespaceUrl
- `stopCodespace(workspace)` — Returns delete manifests
- `getCodespaceStatus(workspace, podStatus)` — Returns running/url/uptime
- `addAssociation(workspace, ref)` — Adds to spec.associations[]
- `removeAssociation(workspace, ref)` — Removes from spec.associations[]
- `listAssociations(workspace)` — Returns associations array
- `getWorkspaceRuns(workspace, allRuns)` — Returns `{ active, history }`

### createAgentTriggerController(options?)

```javascript
import { createAgentTriggerController, validateTriggerRule } from '@a5c-ai/kradle-sdk';
```

**Methods:**
- `matchRule(rule, event)` — Returns `{ matches, reason }`
- `evaluateEvent({ event, resources })` — Returns array of `{ rule, matches, reason, isDuplicate }`
- `createTriggerExecution({ rule, event, decision, reason, namespace, organizationRef })` — Creates resource
- `evaluateWebhookEvent(event, rules)` — Returns `{ matchingRules, dispatchIntents }`
- `processEvent({ event, resources, namespace, organizationRef })` — Full evaluation + dispatch

**Utility exports:**
- `validateCronExpression(expr)` → `{ valid, error? }`
- `calculateNextRun(cronExpr, fromDate?)` → `Date | null`
- `validateWebhookTrigger(config)` → `{ valid, error? }`
- `validateCommentTrigger(config)` → `{ valid, error? }`
- `validateLabelTrigger(config)` → `{ valid, error? }`
- `getTriggerSourceType(rule)` → `'cron'|'webhook'|'comment'|'label'|'event'|'unknown'`
- `validateTriggerRule(rule)` → `{ valid, errors[] }`

### createAgentApprovalController()

**Methods:**
- `createApprovalRequest({ dispatchRun, action, requestedBy, context, namespace, organizationRef, resources })` — Creates AgentApproval (dedup check)
- `recordDecision({ approvalName, decision, decidedBy, reason, namespace, organizationRef, resources })` — Approve or deny
- `isActionApproved({ dispatchRun, action, resources })` — Check approval status
- `listPendingApprovals({ organizationRef, resources })` — Filter pending
- `listApprovalsForRun({ dispatchRun, resources })` — Filter by run
- `persistApproval({ approval, applyResource })` — Persist to K8s
- `enforceApproval({ dispatchRun, action, resources })` — Gate check

### createPermissionReviewer()

```javascript
import { createPermissionReviewer } from '@a5c-ai/kradle-sdk';
const reviewer = createPermissionReviewer();
const result = reviewer.reviewPermissions({
  repository, ref, actor, agentStack, triggerSource, taskKind,
  runnerPool, toolRefs, skillRefs, mcpServerRefs, contextLabelRefs,
  workspacePolicyRef, isFork, resources
});
// Returns: { decision: 'allowed'|'requires-approval'|'denied', reasons[], grants[], capabilities, ... }
```

---

## 7. Memory System

### queryGraph({ records, edges, query, kinds?, depth? })

```javascript
import { queryGraph } from '@a5c-ai/kradle-sdk';
const result = queryGraph({
  records: [{ id: 'n1', nodeKind: 'concept', attributes: { title: 'Design' }, edges: [] }],
  edges: [{ source: 'n1', target: 'n2', kind: 'related-to' }],
  query: 'design',
  kinds: ['concept'],
  depth: 2
});
// Returns: { matches: [{ record, score, edges }], totalMatches: number }
```

**Scoring:** id match = 2, attribute match = 1, no match = 0
**Throws:** Error if query is null, undefined, or empty string

### queryGrep({ documents, query, paths?, context?, maxMatches? })

```javascript
import { queryGrep } from '@a5c-ai/kradle-sdk';
const result = queryGrep({
  documents: [{ path: 'docs/arch.md', content: '...' }],
  query: 'controller',
  paths: ['docs/*'],
  context: 2,
  maxMatches: 25
});
// Returns: { excerpts: [{ path, lineNumber, line, highlighted, context, contextStart, contextEnd }], totalMatches }
```

### queryMemory({ query, mode, records, documents, edges, graphOptions, grepOptions })

Combined query supporting three modes: `'graph-only'`, `'grep-only'`, `'graph-and-grep'`.

```javascript
import { queryMemory } from '@a5c-ai/kradle-sdk';
const result = queryMemory({
  query: 'agent design',
  mode: 'graph-and-grep',
  records, documents, edges,
  graphOptions: { kinds: ['concept'], depth: 2 },
  grepOptions: { paths: ['docs/*'], context: 3, maxMatches: 25 }
});
// Returns: { graph: { matches, totalMatches }, grep: { excerpts, totalMatches }, stats: { mode, totalMatches, graphCount, grepCount } }
```

### Memory Import Utilities

```javascript
import {
  parseJournalForImport,    // Parse babysitter run journal → importable data
  createMemorySnapshot,     // Create AgentMemorySnapshot resource
  validateMemoryImport,     // Validate AgentRunMemoryImport structure
  validateMemorySnapshot,   // Validate AgentMemorySnapshot structure
  validateOntology,         // Validate AgentMemoryOntology structure
  getOntologyNodeKinds,     // Extract valid node kinds
  getOntologyEdgeKinds      // Extract valid edge kinds
} from '@a5c-ai/kradle-sdk';
```

---

## 8. External Backend Controllers

### createWebhookController(options?)

```javascript
import { createWebhookController } from '@a5c-ai/kradle-sdk';
const ctrl = createWebhookController({ secret: 'webhook-signing-secret' });
```

- `verifyHmacSignature(body, signature)` → `{ valid, reason }`
- `createDeliveryRecord({ deliveryId, eventType, payload, rawBody })` → record
- `recordDelivery(record)` — Store in dedup Map
- `isDuplicate(deliveryId)` → boolean
- `onEvent(handler)` — Subscribe to events
- `processDelivery(params)` → `{ queued, duplicate, deliveryId }`

### createSyncController(opts?)

```javascript
import { createSyncController } from '@a5c-ai/kradle-sdk';
const ctrl = createSyncController({ persistFn: async (resource) => {} });
```

- `normalizeEvent(rawEvent)` → canonical event
- `upsertResource({ kind, localName, namespace, spec, externalEnvelope })` → resource
- `updateWatermark(bindingRef, timestamp)` — Advance watermark
- `getWatermark(bindingRef)` → string | null
- `applyOwnershipMode({ ownershipMode, operation, origin })` → `{ allowed, reason }`
- `createTombstone(params)` → tombstone record
- `getTombstone(nativeId)` → record | null

### createConflictController(opts?)

```javascript
import { createConflictController } from '@a5c-ai/kradle-sdk';
const ctrl = createConflictController({ persistFn });
```

- `detectConflict({ resourceRef, fieldPath, localValue, externalValue, namespace?, organizationRef? })` → `{ conflict: resource | null }`
- `resolveConflict({ conflictName, strategy, resolvedValue?, resources? })` → resolved conflict
- `listOpenConflicts(options)` → conflict array
- `supersede(conflictName, resources)` → superseded conflict

### createWriteController(opts?)

```javascript
import { createWriteController } from '@a5c-ai/kradle-sdk';
const ctrl = createWriteController({ persistFn });
```

- `createWriteIntent({ interfaceKey, operation, payload?, resourceRef, requiresApproval?, maxRetries?, namespace?, organizationRef? })` → intent
- `approveWriteIntent({ intentName, approvedBy, resources? })` → approved intent
- `rejectWriteIntent({ intentName, rejectedBy, reason?, resources? })` → rejected intent
- `markSending(intentName, resources)` → sending intent
- `confirmSuccess(intentName, response, resources)` → succeeded intent
- `confirmFailure(intentName, error, resources)` → failed/retrying intent
- `listIntents(options)` → intent array

---

## 9. Event System

### globalEventBus

Singleton event bus shared across the process.

```javascript
import { globalEventBus } from '@a5c-ai/kradle-sdk';
globalEventBus.subscribe((event) => console.log(event));
globalEventBus.emit({ type: 'custom', data: {} });
globalEventBus.emitResourceChange('Repository', 'my-repo', 'apply');
```

### createEventBus()

Create an isolated event bus instance.

```javascript
import { createEventBus } from '@a5c-ai/kradle-sdk';
const bus = createEventBus();
bus.subscribe(fn);
bus.unsubscribe(fn);
bus.emit(event);
bus.emitResourceChange(kind, name, operation);
```

---

## 10. Async Utilities

### createEventBatcher(handler, options?)

```javascript
import { createEventBatcher } from '@a5c-ai/kradle-sdk';
const batcher = createEventBatcher(async (events) => { await saveAll(events); }, { maxBatchSize: 50, flushIntervalMs: 1000 });
batcher.push(event);     // Add event to batch
await batcher.flush();   // Force immediate flush
batcher.stop();          // Clear timer and buffer
```

### createRetryPolicy(options?)

```javascript
import { createRetryPolicy } from '@a5c-ai/kradle-sdk';
const policy = createRetryPolicy({ maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 30000, jitter: true });
policy.shouldRetry(attempt, error);  // boolean
policy.getDelay(attempt);            // milliseconds
```

### createDeliveryQueue(processor, options?)

```javascript
import { createDeliveryQueue } from '@a5c-ai/kradle-sdk';
const queue = createDeliveryQueue(async (item) => { await deliver(item); }, { concurrency: 5, retryPolicy });
queue.enqueue(item);     // Add to queue
await queue.drain();     // Wait for empty
queue.size();            // Current queue + active
queue.stop();            // Clear and resolve waiters
```

### createCheckpointer(storage?)

```javascript
import { createCheckpointer } from '@a5c-ai/kradle-sdk';
const cp = createCheckpointer(new Map());
cp.save('progress', { page: 5 });
cp.load('progress');    // { page: 5 }
cp.clear('progress');
cp.listKeys();          // []
```

---

## 11. Audit

### createAuditController()

```javascript
import { createAuditController } from '@a5c-ai/kradle-sdk';
const audit = createAuditController();
audit.log({ org: 'acme', actor: 'user1', action: 'apply', resource: { kind: 'Repository', name: 'x' } });
const { events, total } = audit.query({ org: 'acme', action: 'apply', limit: 10, offset: 0 });
```

### createEventPoller(options)

Polling mechanism for audit event consumption with exponential backoff.

---

## 12. Other Utilities

### createRunnerController()

```javascript
import { createRunnerController } from '@a5c-ai/kradle-sdk';
const runners = createRunnerController();
runners.validateRunnerPool(resource);  // { valid, reason?, name?, ... }
runners.getPoolStatus(pool);           // { idle, active, total, phase, scaling }
runners.getCapacity(pool);             // { maxReplicas, used, available, utilizationPct }
runners.createRunner(pool, runRef);    // Runner record
runners.assignJob(runnerId, jobRef);   // Assignment
runners.releaseRunner(runnerId);       // Release
```

### createNotificationController()

```javascript
import { createNotificationController } from '@a5c-ai/kradle-sdk';
const notif = createNotificationController();
notif.createNotification(event);                    // Create from event
notif.listNotifications(org, { unreadOnly, limit, since });
notif.markAsRead(id);                               // Mark single
notif.markAllAsRead(org);                           // Mark all for org
notif.getUnreadCount(org);                          // Count
notif.getPreferences(userId);                       // Get prefs
notif.updatePreferences(userId, { sound: true });   // Update
```

### createGiteaService(options)

```javascript
import { createGiteaService } from '@a5c-ai/kradle-sdk';
const gitea = createGiteaService({ baseUrl: 'http://gitea:3000', token: 'admin-token' });
```

### fetchControllerUiModel({ baseUrl, org })

```javascript
import { fetchControllerUiModel } from '@a5c-ai/kradle-sdk';
const uiModel = await fetchControllerUiModel({ baseUrl: 'http://localhost:3080', org: 'acme' });
```

### clearSnapshotCache()

```javascript
import { clearSnapshotCache } from '@a5c-ai/kradle-sdk';
clearSnapshotCache();  // Invalidates all per-org cache entries + legacy cache
```

### mapOidcIdentity(profile)

```javascript
import { mapOidcIdentity } from '@a5c-ai/kradle-sdk';
const identity = mapOidcIdentity({ subject, email, groups });
```

---

## 13. Atlas Graph Client

Source: `packages/kradle/sdk/src/atlas-graph-client.js`

### STACK_LAYERS

Array of 11 stack layer definitions for the agent stack builder. Each has:
```javascript
{ key: 'layer:N-name', label: string, kind: 'stack-layer', position: number, atlasKinds: string[] }
```

Layers: Model, Provider, Transport, Agent Core, Agent Runtime, Agent Platform, Workspace, Execution, Sandbox, Interaction, Presentation.

### COMPOSITION_FACETS

Array of 4 composition facet definitions:
- Roles and Teams
- Skills and Capabilities
- Evaluation and Governance
- Environment and Data

### ALL_LAYER_DEFS

Combined `[...STACK_LAYERS, ...COMPOSITION_FACETS]` — 15 definitions.

### fetchAtlasRecordsByKinds(atlasBaseUrl, kinds, options?)

```javascript
import { fetchAtlasRecordsByKinds } from '@a5c-ai/kradle-sdk';
const records = await fetchAtlasRecordsByKinds('https://atlas.example.com', ['ModelFamily', 'ModelVersion'], { limit: 100 });
// Returns: Array<{ id, nodeKind, displayName, description, cluster }>
```

### searchAtlasGraph(atlasBaseUrl, query, options?)

```javascript
import { searchAtlasGraph } from '@a5c-ai/kradle-sdk';
const result = await searchAtlasGraph('https://atlas.example.com', 'claude', { kinds: ['ModelFamily'], limit: 25 });
// Returns: { total, hits: Array<{ id, nodeKind, displayName, cluster, score, snippet }> }
```

---

## 14. Boundary Constants

All boundary declarations are also exported for runtime introspection:

```javascript
import {
  KRADLE_API_CONTROLLER_BOUNDARY,
  AGENT_STACK_CONTROLLER_BOUNDARY,
  AGENT_DISPATCH_CONTROLLER_BOUNDARY,
  AGENT_WORKSPACE_CONTROLLER_BOUNDARY,
  AGENT_TRIGGER_CONTROLLER_BOUNDARY,
  AGENT_APPROVAL_CONTROLLER_BOUNDARY,
  AGENT_MEMORY_QUERY_BOUNDARY,
  AGENT_PERMISSION_REVIEW_BOUNDARY,
  AGENT_SECRET_GRANT_CONTROLLER_BOUNDARY,
  AGENT_CONFIG_GRANT_CONTROLLER_BOUNDARY,
  AGENT_ADAPTER_CONTROLLER_BOUNDARY,
  AGENT_TRANSPORT_BINDING_CONTROLLER_BOUNDARY,
  AGENT_PROVIDER_CONFIG_CONTROLLER_BOUNDARY,
  AGENT_PROJECT_CONTROLLER_BOUNDARY,
  AGENT_GATEWAY_CONFIG_CONTROLLER_BOUNDARY,
  AGENT_SESSION_TRANSCRIPT_CONTROLLER_BOUNDARY,
  AGENT_SUBAGENT_CONTROLLER_BOUNDARY,
  AGENT_WRITEBACK_CONTROLLER_BOUNDARY,
  AUDIT_CONTROLLER_BOUNDARY,
  RUNNER_CONTROLLER_BOUNDARY,
  NOTIFICATION_CONTROLLER_BOUNDARY,
  AGENT_MEMORY_CONTROLLER_BOUNDARY
} from '@a5c-ai/kradle-sdk';
```

Each exports `{ role, scope, owns, delegatesTo, mustNotOwn }`.


---

## Inference Service Controller

### `createInferenceServiceController(config)`

**Import:** `import { createInferenceServiceController } from '@a5c-ai/kradle';`

Returns an inference service controller with methods:

| Method | Signature | Description |
|--------|-----------|-------------|
| `createService` | `(spec) => Promise<resource>` | Create KradleInferenceService and apply KServe manifest |
| `getService` | `(name) => Promise<resource>` | Get service with resolved endpoint URL |
| `listServices` | `() => Promise<resource[]>` | List all KradleInferenceServices |
| `deleteService` | `(name) => Promise<void>` | Delete service and underlying KServe resource |
| `runInference` | `(name, payload) => Promise<result>` | Proxy inference request to the resolved endpoint |
| `toProviderConfig` | `(name) => Promise<AgentProviderConfig>` | Bridge service to AgentProviderConfig |

**Constants exported:**
- `KRADLE_INFERENCE_SERVICE_CONTROLLER_BOUNDARY` -- boundary identifier string
- `SUPPORTED_MODEL_FORMATS` -- array of supported format names: `['sklearn', 'xgboost', 'lightgbm', 'tensorflow', 'pytorch', 'onnx', 'triton', 'huggingface', 'custom']`
- `INFERENCE_PROTOCOLS` -- `{ V1: 'v1', V2: 'v2' }`

---

## Artifact Registry Controller

### `createArtifactRegistryController(config)`

**Import:** `import { createArtifactRegistryController } from '@a5c-ai/kradle';`

Returns an artifact registry controller with methods:

| Method | Signature | Description |
|--------|-----------|-------------|
| `createRegistry` | `(spec) => Promise<resource>` | Create ArtifactRegistry |
| `listRegistries` | `() => Promise<resource[]>` | List registries |
| `createFeed` | `(registryRef, spec) => Promise<resource>` | Create ArtifactFeed |
| `listFeeds` | `(registryRef?) => Promise<resource[]>` | List feeds, optionally filtered by registry |
| `publishVersion` | `(feedRef, spec) => Promise<resource>` | Publish ArtifactVersion |
| `listVersions` | `(feedRef) => Promise<resource[]>` | List versions for a feed |
| `trackDownload` | `(versionRef, context) => Promise<resource>` | Record ArtifactDownload |
| `setAccessPolicy` | `(feedRef, subject, permission) => Promise<resource>` | Create or update ArtifactAccessPolicy |
| `getInstallCommand` | `(feedRef) => Promise<string>` | Generate protocol-specific install command |

**Constants exported:**
- `ARTIFACT_REGISTRY_CONTROLLER_BOUNDARY` -- boundary identifier string

---

## Assistant Runtime

### `createAssistantRuntime(config)`

**Import:** `import { createAssistantRuntime } from '@a5c-ai/kradle';`

Returns an assistant runtime object with methods:

| Method | Signature | Description |
|--------|-----------|-------------|
| `chat` | `(opts) => AsyncIterable<chunk>` | SSE stream of assistant response chunks. `opts`: `{ org, sessionId, messages, system?, tools?, model? }` |
| `generate` | `(opts) => Promise<object>` | Structured generation. `opts`: `{ org, prompt, schema?, system?, tools?, model? }` |
| `listSessions` | `(org) => Array<session>` | List active sessions for org |
| `clearSession` | `(org, sessionId) => void` | Remove session from in-process store |

**Constants exported:**
- `ASSISTANT_RUNTIME_BOUNDARY` -- boundary identifier string
- `defaultAssistantConfig` -- default model and system prompt config object
- `defaultSystemPrompt` -- default system prompt string
- `callModel` -- low-level Anthropic API call function: `callModel(messages, opts) => AsyncIterable<chunk>`

**Session store:** `globalThis.__kradleSessions` keyed by `org:sessionId`. Not persisted across process restarts.

---

## New Model Types

```javascript
// KradleInferenceService spec
{
  predictor: {
    model: {
      modelFormat: { name: 'pytorch' },
      storageUri: 's3://bucket/model',
      runtime: 'optional-runtime-name',
      protocolVersion: 'v2'
    },
    resources: { limits: { cpu: '2', memory: '4Gi' } }
  },
  features: {}
}

// ArtifactRegistry spec
{
  organizationRef: 'my-org',
  displayName: 'My Registry',
  type: 'npm',
  storageBackend: 's3',
  storageConfig: { bucket: 'artifacts', prefix: 'npm/' }
}

// ArtifactVersion spec
{
  organizationRef: 'my-org',
  feedRef: 'my-feed',
  name: 'my-package',
  version: '1.2.3',
  packageType: 'npm',
  size: 12345,
  checksums: { sha256: 'abc...', md5: 'def...' },
  metadata: { dependencies: {}, tags: [], description: '' },
  publishedBy: 'username',
  publishedAt: '2026-05-20T00:00:00Z'
}
```