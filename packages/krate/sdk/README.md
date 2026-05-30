# @a5c-ai/krate-sdk

Client SDK for the Krate Kubernetes-native forge platform. Provides the API controller, UI model helpers, authentication utilities, agent controllers, memory query engine, and resource model helpers used by the web console and CLI.

## Installation

```bash
npm install @a5c-ai/krate-sdk
```

> Note: this package re-exports from `@a5c-ai/krate` (core). Zero external runtime dependencies.

## Quick Start

```js
import { createKrateApiController } from '@a5c-ai/krate-sdk';

const controller = createKrateApiController();

// Fetch a full org snapshot
const snapshot = await controller.snapshot();
console.log(snapshot.resources.AgentStack);

// Create a resource
await controller.applyResource({
  apiVersion: 'krate.a5c.ai/v1alpha1',
  kind: 'AgentStack',
  metadata: { name: 'my-stack', namespace: 'krate-org-default' },
  spec: { organizationRef: 'default', description: 'My agent stack' }
});

// Fetch a snapshot via the controller-client (with caching)
import { fetchControllerUiModel } from '@a5c-ai/krate-sdk';
const uiModel = await fetchControllerUiModel({ organization: 'default' });
```

## Quick Reference

Code examples for every major SDK export. All examples use `import` (ESM).

### Controller: snapshot, list, apply, delete

```js
import { createKrateApiController, createResource } from '@a5c-ai/krate-sdk';

const controller = createKrateApiController();

// Snapshot — fetch all resources across all kinds
const snapshot = await controller.snapshot();
console.log(snapshot.resources.AgentStack);

// List resources by kind
const repos = await controller.listResource('Repository');

// Apply (create or update) a resource
const resource = createResource('Repository', { name: 'my-repo' }, {
  organizationRef: 'acme',
  visibility: 'internal'
});
const { resource: created } = await controller.applyResource(resource);
console.log('Applied:', created.metadata.name);

// Delete a resource
await controller.deleteResource('Repository', 'my-repo');
```

### Auth: create cookie, parse cookie, register profile

```js
import {
  createAuthProviderConfig,
  createSessionCookie,
  parseSessionCookie,
  registerLoginProfile
} from '@a5c-ai/krate-sdk';

// Build auth config from environment variables
const config = createAuthProviderConfig();

// Create a signed session cookie (profile → signed JWT-like cookie value)
const cookie = createSessionCookie(
  { user: 'alice', email: 'alice@example.com' },
  config.session.secret
);

// Parse and verify a session cookie
const profile = parseSessionCookie(config, cookieValue);
// → { user: 'alice', email: 'alice@example.com', ... } or null

// Register a login profile in the identity store
await registerLoginProfile(
  { user: 'alice', email: 'alice@example.com' },
  { namespace: 'krate-org-default' }
);
```

### Memory: query graph, query grep

```js
import { queryGraph, queryGrep, queryMemory } from '@a5c-ai/krate-sdk';

// Graph-based traversal over memory records
const { matches, totalMatches } = queryGraph({
  records: memoryRecords,         // [{ id, nodeKind, attributes, edges }]
  query: 'deployment failures',
  kinds: ['Repository', 'Pipeline'],
  depth: 2,
});

// Grep-style search over document content
const { matches: grepMatches } = queryGrep({
  documents: memoryDocuments,     // [{ id, content, path }]
  query: 'AgentStack',
  maxMatches: 25,
});

// Combined dispatcher (graph + grep, auto-merged results)
const { graphMatches, grepMatches: combined } = queryMemory({
  records: memoryRecords,
  documents: memoryDocuments,
  query: 'deployment pipeline failures',
  mode: 'graph-and-grep',         // 'graph-only' | 'grep-only' | 'graph-and-grep'
  topK: 10,
});
```

### External: sync, resolve conflict, process webhook

```js
import {
  createSyncController,
  createConflictController,
  createWebhookController
} from '@a5c-ai/krate-sdk';

// Sync an external binding (e.g. GitHub repository adapter)
const syncCtrl = createSyncController();
const syncResult = await syncCtrl.syncBinding('github-binding', {
  kind: 'Repository',
  localName: 'my-repo',
  namespace: 'krate-org-default',
  spec: {},
  externalEnvelope: {
    nativeId: '123456',
    url: 'https://github.com/org/repo',
    etag: 'abc123',
    providerRef: 'github'
  }
});

// Resolve a sync conflict
const conflictCtrl = createConflictController();
await conflictCtrl.resolveConflict({
  conflictName: 'repo-conflict-abc',
  strategy: 'local-wins',
  resolvedValue: { /* merged spec */ },
  resources: {}
});

// Process an incoming webhook event
const webhookCtrl = createWebhookController();
await webhookCtrl.processWebhook({
  type: 'push',
  source: { kind: 'Repository', name: 'my-repo' },
  repository: 'my-repo',
  ref: 'refs/heads/main',
  actor: 'alice',
  payload: { commits: [] }
});
```

### Audit: log event, query events

```js
import { createAuditController } from '@a5c-ai/krate-sdk';

const audit = createAuditController();

// Log an audit event
audit.log({
  org: 'default',
  actor: 'alice',
  action: 'resource.applied',
  resource: { kind: 'Repository', name: 'my-repo', namespace: 'krate-org-default' },
});

// Query audit events with filtering
const { events, total } = audit.query({
  org: 'default',
  action: 'resource.applied',
  since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  limit: 50,
});
console.log(`Found ${total} events`);
```

---

## API Reference

### API Controller

| Export | Description |
|--------|-------------|
| `createKrateApiController(options?)` | Factory: full API controller (list, get, apply, delete, snapshot, dispatchAgent) |
| `KRATE_API_CONTROLLER_BOUNDARY` | Boundary descriptor for the controller role |

### Controller Client (browser / server data fetching)

| Export | Description |
|--------|-------------|
| `fetchControllerUiModel(options?)` | Fetch the controller UI model with 10s TTL caching and stale-while-revalidate |
| `clearSnapshotCache()` | Clear all snapshot cache entries |

### Controller UI Model

| Export | Description |
|--------|-------------|
| `createControllerUiModel(snapshot, options?)` | Build the UI-facing model from a raw Kubernetes snapshot |

### Authentication

| Export | Description |
|--------|-------------|
| `createAuthProviderConfig(spec)` | Build an AuthProvider config object |
| `listEnabledAuthProviders(snapshot)` | List auth providers that are enabled |
| `buildAuthorizationRedirect(provider, options)` | Construct an OAuth2 redirect URL |
| `exchangeOAuthCodeForProfile(provider, code, options)` | Exchange auth code for a user profile |
| `parseSessionCookie(cookie, secret)` | Parse and verify a signed session cookie |
| `createSessionCookie(profile, secret, options?)` | Create a signed session cookie |
| `registerLoginProfile(profile, options)` | Register a login profile in the identity store |
| `mapLoginProfileToKrateIdentity(profile)` | Map an OAuth profile to a Krate identity |
| `profileFromDelegatedHeaders(headers)` | Extract a user profile from delegated auth headers |
| `createInviteResource(input, namespace)` | Build an Invite Krate resource |
| `createTeamResource(input, namespace)` | Build a Team Krate resource |

### Identity Policy

| Export | Description |
|--------|-------------|
| `mapOidcIdentity(claims)` | Map OIDC claims to a Krate identity object |

### Resource Model

| Export | Description |
|--------|-------------|
| `createResource(kind, metadata, spec)` | Create a typed Krate resource object |
| `CONFIG_KINDS` | Set of config-plane (etcd-backed) resource kinds |
| `AGGREGATED_KINDS` | Set of aggregated (Postgres-backed) resource kinds |
| `clone(resource)` | Deep-clone a resource object |
| `resourceToYaml(resource)` | Serialize a resource to YAML string |

### Resource Definition

| Export | Description |
|--------|-------------|
| `findResourceDefinition(kindOrPlural)` | Look up a resource definition by kind or plural name |
| `orgNamespaceName(org)` | Compute the Kubernetes namespace name for an org slug |
| `normalizeOrgSlug(value)` | Normalize an org slug to a safe DNS label |

### Atlas Graph Client

| Export | Description |
|--------|-------------|
| `fetchAtlasRecordsByKinds(kinds, options?)` | Fetch atlas graph nodes by kind list |
| `searchAtlasGraph(query, options?)` | Full-text search over the atlas graph |
| `STACK_LAYERS` | Layer definitions for the atlas stack model |
| `COMPOSITION_FACETS` | Composition facet descriptors |
| `ALL_LAYER_DEFS` | All layer definitions combined |

### External Controllers

| Export | Description |
|--------|-------------|
| `createSyncController(options?)` | Controller for external backend sync events |
| `createWebhookController(options?)` | Controller for external webhook delivery |
| `createWriteController(options?)` | Controller for external write intents |
| `createConflictController(options?)` | Controller for external sync conflict resolution |
| `createDefaultProviderRegistry()` | Build the default external provider registry |
| `createExternalBackendProvider(spec)` | Create an external backend provider resource |

### Event Bus

| Export | Description |
|--------|-------------|
| `createEventBus(options?)` | Create an event bus backed by memory/local JSONL or configured broker transport |
| `createMemoryEventTransport(options?)` | Create the local/test event transport with replay cursors |
| `createNatsJetStreamEventTransport(options?)` | Create the NATS-backed event transport adapter |
| `createNatsJetStreamBrokerClient(options?)` | Create the default NATS/JetStream broker client for durable publish and replay |
| `globalEventBus` | The shared global event bus instance |
| `loadPersistedEvents(limit?)` | Load locally persisted JSONL events for compatibility and local replay |

### Agent Controllers

| Export | Description |
|--------|-------------|
| `createAgentAdapterController(options?)` | Controller for AgentAdapter resources |
| `validateAgentAdapter(spec)` | Validate an AgentAdapter spec |
| `createAgentTransportBindingController(options?)` | Controller for AgentTransportBinding resources |
| `validateAgentTransportBinding(spec)` | Validate an AgentTransportBinding spec |
| `createAgentProviderConfigController(options?)` | Controller for AgentProviderConfig resources |
| `validateAgentProviderConfig(spec)` | Validate an AgentProviderConfig spec |
| `createAgentProjectController(options?)` | Controller for KrateProject resources |
| `validateAgentProject(spec)` | Validate a KrateProject spec |
| `createAgentGatewayConfigController(options?)` | Controller for AgentGatewayConfig resources |
| `validateAgentGatewayConfig(spec)` | Validate an AgentGatewayConfig spec |
| `createAgentSessionTranscriptController(options?)` | Controller for AgentSessionTranscript resources |
| `validateAgentSessionTranscript(spec)` | Validate an AgentSessionTranscript spec |
| `createAgentSubagentController(options?)` | Controller for AgentSubagent orchestration |
| `createAgentWritebackController(options?)` | Controller for agent writeback operations |
| `createAgentStackController(options?)` | Controller for AgentStack resources |
| `createAgentDispatchController(options?)` | Controller for AgentDispatchRun resources |
| `createAgentApprovalController(options?)` | Controller for AgentApproval resources |
| `createAgentWorkspaceController(options?)` | Controller for KrateWorkspace resources |
| `createAgentMemoryController(options?)` | Controller for AgentMemory resources |

### Agent Triggers

| Export | Description |
|--------|-------------|
| `createAgentTriggerController(options?)` | Controller for AgentTriggerRule resources |
| `validateCronExpression(expr)` | Validate a cron expression |
| `calculateNextRun(expr, from?)` | Calculate next run time for a cron expression |
| `validateWebhookTrigger(spec)` | Validate a webhook trigger spec |
| `validateCommentTrigger(spec)` | Validate a comment trigger spec |
| `validateLabelTrigger(spec)` | Validate a label trigger spec |
| `getTriggerSourceType(spec)` | Determine the trigger source type |
| `validateTriggerRule(spec)` | Validate a complete trigger rule |

### Agent Memory Query

| Export | Description |
|--------|-------------|
| `queryGraph(query, context?)` | Query the agent memory graph |
| `queryGrep(pattern, context?)` | Grep-style search over memory |
| `queryMemory(input, context?)` | General memory query dispatcher |

### Agent Permissions

| Export | Description |
|--------|-------------|
| `createPermissionReviewer(options?)` | Create a permission reviewer for cross-org access checks |

### Secret / Config Grants

| Export | Description |
|--------|-------------|
| `createAgentSecretGrantController(options?)` | Controller for AgentSecretGrant resources |
| `createAgentConfigGrantController(options?)` | Controller for AgentConfigGrant resources |
| `validateAgentSecretGrant(spec)` | Validate an AgentSecretGrant spec |
| `validateAgentConfigGrant(spec)` | Validate an AgentConfigGrant spec |
| `listGrantsForAgent(agentRef, options?)` | List all grants for a given agent |
| `revokeGrant(grantName, options?)` | Revoke a secret or config grant |

### Audit

| Export | Description |
|--------|-------------|
| `createAuditController(options?)` | Controller for audit event tracking and querying |
| `createEventPoller(options?)` | Polling helper for audit event streams |

### Async Utilities

| Export | Description |
|--------|-------------|
| `createEventBatcher(handler, options?)` | Batch events and flush on interval or max size |
| `createRetryPolicy(options?)` | Build a retry policy with exponential backoff |
| `createDeliveryQueue(options?)` | Ordered delivery queue with retry |
| `createCheckpointer(options?)` | Persistent checkpoint helper for event streams |

### Memory Import / Snapshot / Ontology

| Export | Description |
|--------|-------------|
| `parseJournalForImport(journal)` | Parse a journal for memory import |
| `createMemorySnapshot(entries)` | Build a memory snapshot from entries |
| `validateMemoryImport(input)` | Validate a memory import payload |
| `validateMemorySnapshot(snapshot)` | Validate a memory snapshot |
| `validateOntology(ontology)` | Validate a memory ontology definition |
| `getOntologyNodeKinds(ontology)` | Extract node kinds from an ontology |
| `getOntologyEdgeKinds(ontology)` | Extract edge kinds from an ontology |

## Examples

### Fetch snapshot and filter resources

```js
import { createKrateApiController } from '@a5c-ai/krate-sdk';

const controller = createKrateApiController();
const snapshot = await controller.snapshot();

const stacks = snapshot.resources.AgentStack ?? [];
console.log('Stacks:', stacks.map((s) => s.metadata.name));
```

### Create a resource

```js
import { createKrateApiController, createResource } from '@a5c-ai/krate-sdk';

const controller = createKrateApiController();
const resource = createResource('Repository', { name: 'my-repo' }, {
  organizationRef: 'acme',
  visibility: 'internal'
});
const result = await controller.applyResource(resource);
console.log('Applied:', result.resource.metadata.name);
```

### Query agent memory

```js
import { queryMemory } from '@a5c-ai/krate-sdk';

const results = await queryMemory({ query: 'deployment pipeline failures', limit: 10 });
console.log(results.matches);
```
