# Integration & Design Decisions

Supplementary specification covering external dependencies, scope boundaries,
architectural trade-offs, and system nuances for the Kradle project.

---

## 1. External Dependencies & Integration Points

### 1.1 Agent-Mux Dependency

#### What Kradle Imports from @a5c-ai/agent-mux

Kradle does not import agent-mux as an npm dependency. Instead, it communicates
with the agent-mux gateway over HTTP. The integration surface lives entirely
within `core/src/agent-mux-client.js`, which provides:

- **queryCapabilities(adapter)** -- GET `/api/v1/agents/{adapter}/capabilities`
- **launchSession({stack, contextBundle, permissionSnapshot, workspace})** -- POST `/api/v1/sessions`
- **getSessionStatus(sessionId)** -- GET `/api/v1/sessions/{sessionId}`
- **subscribeToEvents(runId, callback)** -- GET `/api/v1/runs/{runId}/events` (SSE)
- **reconcileTranscript(sessionId, events, options)** -- local data transformation

The boundary declaration (`AGENT_MUX_CLIENT_BOUNDARY`) explicitly states:
- Owns: gateway HTTP calls, SSE event streaming, transcript reconciliation
- Delegates to: resource-model (for creating AgentSessionTranscript resources)
- Must not own: secret values, permission review, resource persistence

#### How agent-mux-client.js Connects to the Gateway

Connection is HTTP-only, using Node.js built-in `node:http` / `node:https`.
Zero external fetch or HTTP client dependencies. The internal `httpRequest()`
helper performs raw `transport.request()` calls with JSON serialization.

Connection parameters:
- `gateway` string -- full base URL (e.g. `http://agent-mux-gateway:8080`)
- `enabled` boolean -- client methods return `null` early when disabled
- Timeout: 30s default per request
- Protocol: auto-detected from URL scheme (http:// vs https://)

SSE streaming uses a persistent HTTP connection with:
- Reconnection via exponential backoff (1s, 2s, 4s... capped at 30s)
- Backoff reset on successful connection establishment
- Graceful abort via returned `{ abort }` handle
- Buffer-based SSE parsing (splits on `\n\n`, extracts `data:` lines)

#### What Works WITHOUT Agent-Mux

The following subsystems are fully operational without agent-mux:

1. **Resource CRUD** -- All 76 resource kinds can be created, listed, updated, deleted via kubectl
2. **Web Console** -- All 57 pages render; agent dispatch pages show "gateway unavailable" state
3. **Auth & Sessions** -- OAuth login, cookie sessions, delegated identity all functional
4. **Project Management** -- KradleProject, Issue, PullRequest lifecycle fully local
5. **Memory System** -- AgentMemoryRepository, Source, Ontology, Query, Import all operate on CRDs
6. **Workspace Provisioning** -- KradleWorkspace PVC specs, git ops, codespace generation
7. **External Backends** -- Provider registration, webhook delivery, sync events
8. **Audit Logging** -- Audit controller records all mutations regardless of agent-mux state
9. **Policy Engine** -- Kyverno integration, PolicyProfile, PolicyBinding
10. **Runner Pool Management** -- RunnerPool specs, scheduling policies
11. **Notification System** -- Resource-change notifications via event bus
12. **MCP Server** -- All 14 tools operational; `kradle_dispatch_agent` returns error status

#### What REQUIRES Agent-Mux

The following operations fail gracefully (return null/error) without a running gateway:

1. **Real Session Creation** -- `launchSession()` returns null; AgentSession resource created but status stays `Pending`
2. **Event Streaming** -- `subscribeToEvents()` reconnect loop fires indefinitely (capped at 30s intervals)
3. **Transcript Reconciliation** -- No events to reconcile; AgentSessionTranscript never moves to `Reconciled` phase
4. **Adapter Capability Discovery** -- `queryCapabilities()` returns null; stack readiness condition degraded
5. **Live Session Status** -- `getSessionStatus()` returns null; UI shows "status unavailable"
6. **Cost Calculation** -- Token usage comes from SSE events; without them, cost fields remain zero

#### Gateway URL Configuration

The gateway URL flows through the system as follows:

```
Helm values.yaml:
  agents:
    agentMux:
      enabled: false      # Must be true for integration
      gateway: ""         # Full URL to agent-mux gateway

  --> Rendered into Deployment env:
      KRADLE_AGENT_MUX_ENABLED=true
      KRADLE_AGENT_MUX_GATEWAY=http://agent-mux-gateway:8080

  --> Read by API controller initialization:
      createAgentMuxClient({
        gateway: process.env.KRADLE_AGENT_MUX_GATEWAY || '',
        enabled: process.env.KRADLE_AGENT_MUX_ENABLED === 'true'
      })

  --> Persisted in AgentGatewayConfig CRD:
      spec.gatewayUrl (for UI display and runtime reconfiguration)
```

The web container does NOT communicate with agent-mux directly. All agent
operations route through the API container's `/api/agents/*` endpoints, which
delegate to the mux client instance.

#### Runtime Availability Check

```javascript
client.isAvailable()  // returns: enabled && !!gateway
```

Every client method checks `isAvailable()` first and returns `null` immediately
when the gateway is not configured. This prevents connection errors from
propagating into the resource reconciliation loops.

---

### 1.2 Transport-Mux Dependency

#### How Transport-Mux Handles Protocol Translation

Transport-mux is an external component (not bundled with kradle) that provides
protocol translation between different agent communication channels:

- **stdio** -- stdin/stdout JSON-RPC for local CLI agents
- **http** -- REST/SSE for cloud-hosted agents
- **websocket** -- bidirectional streaming for persistent connections
- **unix** -- Unix domain socket for same-host agents

The transport-mux runtime sits between the agent-mux gateway and the actual
agent process, handling message framing, connection lifecycle, and protocol
negotiation.

#### What Kradle's AgentTransportBinding Models

The `AgentTransportBinding` CRD captures connection configuration:

```yaml
spec:
  adapterRef: "claude-adapter-v1"
  endpoint: "wss://agent.example.com/ws"
  protocol: "websocket"          # One of: stdio, http, websocket, unix
  reconnectPolicy:
    maxRetries: 3
    backoffMs: 1000
    maxBackoffMs: 30000
  auth:
    type: "bearer"
    secretRef: "agent-token-secret"
  healthCheck:
    endpoint: "/health"
    intervalMs: 30000
```

The controller (`agent-transport-binding-controller.js`) provides:
- **Validation** -- Ensures required fields present, protocol is one of 4 valid types
- **Connection Status Tracking** -- Reads `status.connectionStatus` (set externally)
- **Reconnect Policy Resolution** -- Merges spec overrides with defaults (3 retries, 1s-30s backoff)

#### Gap: Kradle Validates Transport but Never Activates the Runtime

The transport binding controller is purely declarative. It:
- Validates the spec shape
- Reports connection status from the resource's status field
- Returns supported protocols list

It does NOT:
- Open actual TCP/WebSocket connections
- Start stdio processes
- Perform health checks (despite modeling healthCheck in spec)
- Activate the transport-mux runtime component
- Signal transport-mux to register a new binding

The intent is that transport-mux watches AgentTransportBinding resources via
Kubernetes watch and self-reconciles. Kradle's role is to persist the desired
state and present it in the UI.

---

### 1.3 Hooks-Mux Dependency

#### What Hooks-Mux Provides

The hooks-mux system (external to kradle) provides lifecycle event dispatching
for agent runs:

- `RUN_CREATED` -- Agent dispatch initiated
- `STEP_STARTED` -- Agent begins a tool use or reasoning step
- `STEP_COMPLETED` -- Agent finishes a step
- `APPROVAL_REQUESTED` -- Agent needs human gate
- `APPROVAL_GRANTED` / `APPROVAL_DENIED` -- Gate resolved
- `RUN_COMPLETED` -- Agent run finished (success/failure/timeout)
- `RUN_CANCELLED` -- Agent run externally terminated

These events flow to registered webhook subscribers, trigger rules, and
the notification system.

#### What Kradle's Event Bus Does Instead

Kradle has its own in-process event bus (`core/src/event-bus.js`) that provides:

```javascript
const bus = createEventBus();
bus.subscribe(fn);
bus.emit({ type: 'resource-change', kind, name, operation, timestamp });
bus.emitResourceChange('Repository', 'my-repo', 'apply');
```

This bus handles:
- Real-time resource change notifications to SSE clients (web console live updates)
- Cache invalidation signals
- UI refresh triggers

The event bus is limited to **resource-change events only**. It does not model:
- Agent lifecycle events (run created/completed)
- Step-level granularity (tool use, reasoning)
- Cross-service event routing
- Durable event delivery with retries

#### Gap: No HookDispatcher Integration

Kradle has a `WebhookBus` class (`core/src/hooks-events.js`) that handles
outbound webhook delivery for resource events, but it is NOT connected to
hooks-mux lifecycle events. Specifically:

- `WebhookBus.deliver()` creates `WebhookDelivery` resources for webhook subscribers
- It does NOT receive or forward agent-lifecycle events from hooks-mux
- `AgentTriggerRule` resources define event-to-stack routing but the trigger
  evaluation is purely resource-driven (no real-time hook stream)
- `AgentTriggerExecution` records are created by the trigger controller but
  the trigger is evaluated on resource watch events, not on hooks-mux push

The missing integration:
1. No hooks-mux webhook receiver endpoint in kradle's HTTP server
2. No translation layer from hooks-mux event format to kradle event bus
3. No lifecycle event emission when AgentDispatchRun status changes
4. No step-level event tracking (only run-level status)

---

### 1.4 Babysitter-SDK Dependency

#### The .a5c/processes Pattern

Babysitter-SDK uses a file-based process definition pattern:

```
.a5c/
  processes/
    my-process.json        # Process definition
  runs/
    <runId>/
      journal.json         # Event log
      state.json           # Current state
      effects/             # Effect outputs
```

Kradle processes (if any) would follow this same pattern. However, kradle does
not currently define babysitter processes for its own operations. The
integration point is on the **import** side -- kradle can ingest babysitter
run artifacts into its memory system.

#### How AgentRunMemoryImport Connects to Babysitter Journal Parsing

The `agent-memory-import.js` module provides:

```javascript
parseJournalForImport(journal)
// Returns: { summary, keyEvents, effectSummary }
```

This function:
1. Accepts a babysitter `.a5c` journal array (raw event objects)
2. Extracts structural metadata only (no raw task content, no effect payloads)
3. Produces a summary with: runId, processId, eventCount, durationMs, runStatus
4. Extracts key events: run_start, task_completed (with effect kind/result), breakpoint, run_end
5. Computes effect summary: successCount, failureCount, effectKinds array

The `AgentRunMemoryImport` CRD then stores this parsed summary alongside:
- `memoryRepository` reference (where to store)
- `source` information (which babysitter run)
- `include` filters (what to import)
- Review and redaction status

#### The Orchestration Boundary

```
Babysitter-SDK                    Kradle
-------------------------------------------
Process definition         <-->   (not used)
Run lifecycle              <-->   AgentDispatchRun (mirrors status)
Journal events             --->   AgentRunMemoryImport (parsed summary)
Session binding            <-->   AgentSession (Kradle projection)
Hook-driven continuation   <-->   AgentApproval (approval gates)
```

- **Babysitter owns**: run lifecycle (create, iterate, complete), journal/state, session binding
- **Kradle owns**: resource state, memory ingestion, audit trail, approval workflows
- The boundary is clean: babysitter does execution, kradle does desired-state persistence

---

### 1.5 Atlas Dependency

#### How the Stack Builder Queries Atlas Graph

The web console's stack builder uses Atlas as a knowledge source for populating
layer options. The query path is:

```
Browser (stack-builder-graph.jsx)
  --> /api/atlas/search (Next.js route handler)
    --> fetch(ATLAS_BASE_URL + /api/v1/search?q=...&kind=...&limit=...)
    --> fetch(ATLAS_BASE_URL + /api/v1/kinds/{kind}?limit=...)
```

The proxy route (`web/app/api/atlas/search/route.js`) handles:
- **Browse mode**: fetches instances by kind (no search query needed)
- **Search mode**: full-text search via Atlas's Fuse.js-based endpoint
- **Multi-kind search**: parallel queries per kind, merged and deduplicated by id

The SDK also provides a direct client (`sdk/src/atlas-graph-client.js`):
- `fetchAtlasRecordsByKinds(atlasBaseUrl, kinds, options)` -- browse by NodeKind
- `searchAtlasGraph(atlasBaseUrl, query, options)` -- full-text with optional kind filter

#### The 11 Stack Layers + 4 Composition Facets

**STACK_LAYERS** (11 layers, each with associated Atlas NodeKinds):

| # | Layer | Atlas NodeKinds |
|---|-------|-----------------|
| 1 | Model | ModelFamily, ModelVersion, SessionModel |
| 2 | Provider | Provider, ModelProviderProduct, ModelProviderVersion |
| 3 | Transport | TransportProtocol, ModelTransportProtocol |
| 4 | Agent Core | AgentCoreImpl, Capability, CapabilitySupport |
| 5 | Agent Runtime | AgentProduct, AgentRuntimeImpl, AgentVersion, Subagent |
| 6 | Agent Platform | AgentPlatformImpl, Platform, PlatformService |
| 7 | Workspace | Workspace, Project, SharedContextSpec |
| 8 | Execution | Workflow, LibraryProcess, Phase, HookSurface |
| 9 | Sandbox | PermissionMode, DeploymentTarget |
| 10 | Interaction | Tool, ToolDescriptor, ToolServer, PluginArtifact, MCPPrompt |
| 11 | Presentation | AgentUIImpl, Page, APIEndpoint, Presentation |

**COMPOSITION_FACETS** (4 cross-cutting concerns):

| Facet | Atlas NodeKinds |
|-------|-----------------|
| Roles and Teams | Role, Responsibility, OrgUnit, AgentTeam |
| Skills and Capabilities | Skill, LibrarySkill, SkillArea, Capability |
| Evaluation and Governance | Benchmark, TestSet, EvalRun |
| Environment and Data | StackPart, VectorStore, MemoryStore |

#### Atlas Node Kinds Mapped to Stack Builder Layers

Each stack builder layer queries Atlas for specific NodeKinds. The mapping
(`atlasKinds` array per layer) drives which records appear as selectable
options in the UI. Users compose an AgentStack by picking one or more
records from each layer.

The resolution path:
1. User opens stack builder page
2. UI requests `/api/atlas/search?mode=browse&kinds=ModelFamily,ModelVersion`
3. Route handler fetches from Atlas API
4. Results rendered as selectable cards/chips in the layer panel
5. User selections flow into AgentStack spec fields

#### What Happens When Atlas Is Unavailable

When Atlas is unreachable:
- Browse queries return empty arrays `[]` (no crash)
- Search queries return `{ total: 0, hits: [] }`
- The proxy route returns `{ total: 0, hits: [], error: <message> }` with status 502
- Stack builder layers show "No options available" state
- Users can still manually type stack configuration without Atlas suggestions
- The `ATLAS_BASE_URL` env var defaults to `https://atlas-staging.a5c.ai`

---

## 2. Scope Boundaries

### 2.1 What Kradle Owns

#### Kubernetes CRD Resource Model (76 Kinds)

Kradle defines and manages 76 resource kinds across two storage tiers:

**Config kinds (44, etcd-stored):**
Organization, OrgNamespaceBinding, User, Team, Invite, IdentityMapping,
AuthProvider, Repository, SSHKey, RepositoryPermission, WebhookSubscription,
RefPolicy, BranchProtection, PolicyProfile, PolicyTemplate, PolicyBinding,
PolicyExceptionRequest, RunnerPool, View, Selector, AgentStack, AgentSubagent,
AgentToolProfile, AgentMcpServer, AgentSkill, AgentTriggerRule, AgentContextLabel,
KradleWorkspacePolicy, AgentServiceAccount, AgentRoleBinding, AgentSecretGrant,
AgentConfigGrant, AgentAdapter, AgentTransportBinding, AgentProviderConfig,
KradleProject, AgentGatewayConfig, AgentMemoryRepository, AgentMemorySource,
AgentMemoryOntology, AgentMemoryAssociation, KradleWorkspace,
ExternalBackendProvider, ExternalBackendBinding, ExternalBackendSyncPolicy,
ExternalProviderCapabilityManifest

**Aggregated kinds (32, postgres-stored):**
PullRequest, Issue, Review, Pipeline, Job, WebhookDelivery, AgentDispatchRun,
AgentDispatchAttempt, AgentSession, AgentContextBundle, KradleArtifact,
AgentApproval, AgentTriggerExecution, AgentCapabilityRequirement,
WorkItemSessionLink, WorkItemWorkspaceLink, AgentSessionTranscript,
AgentSessionAttachment, KradleWorkspaceRuntime, AgentMemorySnapshot,
AgentMemoryQuery, AgentMemoryUpdate, AgentRunMemoryImport,
ExternalWebhookDelivery, ExternalSyncEvent, ExternalSyncState,
ExternalWriteIntent, ExternalSyncConflict, ExternalObjectLink

#### Resource CRUD via kubectl

All resource operations use `spawnSync('kubectl', ...)` or async `spawn('kubectl', ...)`:
- `kubectl get <resource> -n <namespace> -o json`
- `kubectl apply -f - -o json` (with JSON manifest piped to stdin)
- `kubectl delete <resource> <name> -n <namespace>`
- `kubectl get <resource> --watch -o json` (for live updates)

#### Web Console (57+ Pages)

Seven page modules:
1. **agent** -- Stacks, dispatch, sessions, triggers, memory, projects, adapters, workspaces
2. **repo** -- Repositories, pull requests, issues, reviews, pipelines
3. **manage** -- Organizations, users, teams, invites, identity mappings
4. **settings** -- Auth providers, webhooks, runners, policies, views
5. **external** -- Backend providers, bindings, sync policies, conflicts
6. **lib/kradle-ui** -- Shared UI components (tables, forms, modals, badges)
7. **lib/page-frame** -- Layout shell, navigation, breadcrumbs

#### Auth (OAuth, Session Cookies, Middleware)

- GitHub OAuth (authorization code flow)
- Workspace SSO (OIDC authorization code flow)
- Delegated identity (proxy headers: x-forwarded-user/groups/email)
- Local development bypass (auto-login for localhost)
- HMAC-SHA256 signed session cookies
- `parseSessionCookie` / `createSessionCookie` with timing-safe verification

#### Workspace Provisioning

- `KradleWorkspace` CRD: PVC specs, volume lifecycle, repository binding
- `KradleWorkspacePolicy` CRD: trust tiers, cleanup retention, provisioning mode
- `KradleWorkspaceRuntime` CRD: process status, environment, preview URLs
- Git worktree integration specs (branch/commit binding)
- Runner mount specifications

#### Memory System

- `AgentMemoryRepository`: org-level git pointer with layout profile and index policy
- `AgentMemorySource`: read policy for paths/kinds per repository, team, stack, or trigger
- `AgentMemoryOntology`: ontology with nodeKinds, edgeKinds, controlled vocabulary
- `AgentMemoryQuery`: graph/grep retrieval with ranking metadata
- `AgentRunMemoryImport`: babysitter run ingestion with redaction and review
- `AgentMemorySnapshot`: dispatch-time pin with resolved commit and digests
- `AgentMemoryUpdate`: reviewable proposed mutations with branch and validation
- `AgentMemoryAssociation`: bridge records linking memory to Kradle resources

#### External Backend Abstraction

- `ExternalBackendProvider`: registration (type, endpoint, auth, capability discovery)
- `ExternalBackendBinding`: binding to org with credential reference and sync scope
- `ExternalBackendSyncPolicy`: interval, conflict resolution, field mapping, retry policy
- `ExternalProviderCapabilityManifest`: discovered API capabilities
- `ExternalWebhookDelivery`: inbound webhook processing
- `ExternalSyncEvent`: discrete sync event with dedupe/ordering
- `ExternalSyncState`: current sync phase per resource
- `ExternalWriteIntent`: queued write-back with approval state
- `ExternalSyncConflict`: detected conflicts with resolution outcomes
- `ExternalObjectLink`: stable local-to-external ID mapping

#### Notification System

- `globalEventBus` singleton for in-process pub/sub
- SSE endpoint for real-time web console updates
- `emitResourceChange(kind, name, operation)` on every mutation
- Listener registration/deregistration for per-connection subscriptions

#### Runner Pool Management

- `RunnerPool` CRD: capacity (warmReplicas, maxReplicas), cache policy, trust boundary
- Scheduling policy specs (not execution)
- Runner identity binding via AgentServiceAccount

#### Audit Logging

- Audit controller records all resource mutations
- Queryable via MCP tool (`kradle_audit_query`)
- Correlation IDs on all snapshot fetches

#### MCP Server (14 Tools)

Exposed via stdio (`kradle mcp`):
- `kradle_snapshot`, `kradle_list_resources`, `kradle_get_resource`
- `kradle_apply_resource`, `kradle_delete_resource`, `kradle_search`
- `kradle_list_stacks`, `kradle_create_stack`, `kradle_dispatch_agent`
- `kradle_list_secrets`, `kradle_create_secret`
- `kradle_sync_external`, `kradle_resolve_conflict`, `kradle_audit_query`

---

### 2.2 What Agent-Mux Owns

#### Actual Agent Spawning and Management

Agent-mux is responsible for:
- Instantiating agent processes (Claude, Codex, Gemini, etc.)
- Managing process lifecycle (start, monitor, terminate)
- Resource isolation between concurrent agent sessions
- Process cleanup on timeout or cancellation

#### Session Lifecycle

- Create session from stack parameters (model, prompt, tools, workspace)
- Stream events from running session to subscribers
- Terminate sessions (graceful and forced)
- Track session state transitions (Pending, Running, Completed, Failed, Cancelled)

#### Adapter Registry

Agent-mux maintains the runtime adapter registry:
- Claude adapter (Anthropic API)
- Codex adapter (OpenAI API)
- Gemini adapter (Google API)
- Pi adapter (Inflection API)
- Custom adapters via plugin system

Each adapter implements: capabilities query, session creation, event streaming.

#### Transport Codec

- Message format translation between kradle's JSON and adapter-native formats
- Streaming frame encoding (SSE, WebSocket, stdio JSON-RPC)
- Binary attachment handling
- Compression negotiation

#### Provider Client Instantiation

- API key retrieval and injection
- Base URL resolution per provider
- Rate limiting enforcement per provider/model combination
- Retry logic for transient provider failures

#### Real-Time Event Streaming

- SSE server for `/api/v1/runs/{runId}/events`
- Event buffering and replay for reconnecting clients
- Multi-subscriber fanout (multiple UI tabs)
- Connection keep-alive and heartbeat

#### Token Counting and Cost Calculation

- Per-message input/output token counting
- Model-specific pricing application
- Cumulative cost tracking per session/run
- Cost breakdown in event payloads (`event.usage.inputTokens`, `event.usage.outputTokens`)

---

### 2.3 What Babysitter-SDK Owns

#### Process Definition and Orchestration

- `.a5c/processes/*.json` file format and schema
- Task graph resolution (dependencies, parallelism)
- Effect system (what a task produces)
- Breakpoint system (human gates in execution flow)

#### Run Lifecycle

- Run creation with process binding
- Task iteration (next task selection, execution, completion)
- Run completion detection (all tasks done, failure threshold)
- Run cancellation and cleanup

#### Journal and State Management

- Append-only journal (`journal.json`) with typed events
- Mutable state snapshot (`state.json`) for resumption
- Effect output persistence (`effects/`)
- Run metadata (timing, status, error details)

#### Session Binding

- Binding an agent session to a babysitter run
- Session-to-task mapping (which session handles which task)
- Multi-session orchestration (parallel tasks)

#### Hook-Driven Continuation

- Pre/post task hooks
- Breakpoint evaluation and resolution
- External trigger integration (webhook → resume)
- Timeout-based auto-continuation

---

### 2.4 The Gap Zone

The gap zone defines areas where kradle manages the **resource declaration** but
does not perform the **runtime execution**. This is by design -- kradle is the
"desired state" layer; execution is delegated to specialized runtimes.

#### AgentStack Exists but Isn't Resolved into a Running Adapter

- `AgentStack` CRD captures: baseAgent, adapter, model, prompt, tools, MCP servers, skills
- The stack controller reconciles readiness conditions (capability resolution, MCP health)
- But it never actually calls agent-mux to instantiate the adapter
- The gap: creating an AgentStack does not start anything

#### AgentDispatchRun Created but Agent Not Spawned by Kradle

- `AgentDispatchRun` CRD captures: repository, sourceRefs, agentStack, taskKind
- Status tracks: Queued, Running, Completed, Failed
- The dispatch controller creates the resource and validates the spec
- But the actual agent spawn happens in agent-mux (triggered by external controller)
- The gap: dispatch resource exists immediately, execution happens later

#### KradleWorkspace Generates Pod Specs but Doesn't Execute Them

- `KradleWorkspace` CRD captures: repository, volumeSpec, mount paths
- `KradleWorkspacePolicy` defines provisioning rules and trust tiers
- The workspace controller generates PVC manifests and mount specifications
- But it does not create the actual PVC or pod (that's the workspace-provisioner)
- The gap: workspace spec is declarative; provisioning is separate

#### RunnerPool Generates Schedules but Doesn't Provision Runners

- `RunnerPool` CRD captures: warmReplicas, maxReplicas, cache policy
- The runner controller validates pool specs and computes scheduling hints
- But it does not create actual runner pods or scale deployments
- The gap: pool definition is intent; ARC (Actions Runner Controller) or
  similar actually provisions the runners

#### The Intent

This pattern is intentional Kubernetes-native architecture:
1. Kradle manages CRD resources as desired state
2. Specialized operators/controllers watch these resources
3. Operators reconcile desired state into actual state
4. Status fields reflect observed state back into CRDs
5. Kradle's UI reads status to show current state

This separation enables:
- Independent scaling of control plane vs execution plane
- Pluggable execution backends (swap agent-mux implementation)
- GitOps-compatible declarative management
- Clear audit trail (every intent is a persisted resource)

---

## 3. Architectural Choices & Trade-offs

### 3.1 Why CRD-First (vs Database-First)

**Decision:** All state stored as Kubernetes custom resources (CRDs for config
kinds, aggregated API server for data-plane kinds).

**Rationale:**
- GitOps-compatible: resources can be managed via Argo CD, Flux, or plain kubectl
- kubectl-native: operators and admins use familiar tooling
- Declarative: desired state vs imperative mutations
- No external DB dependency for control plane (etcd comes with K8s)
- Built-in RBAC: Kubernetes RBAC applies to all resource operations
- Watch support: built-in change notification for controllers
- Namespace isolation: multi-tenancy via namespace-per-org

**Trade-off:**
- Slower than direct database queries (kubectl spawnSync overhead)
- etcd size limits (~1.5MB per resource, cluster-wide storage cap)
- No complex queries (no JOIN, no WHERE with multiple conditions)
- No full-text search (client-side filtering only)
- Pagination via continue tokens (not offset-based)

**Mitigation:**
- Snapshot cache (30s TTL) for dashboard queries
- Per-org caching reduces repeated cross-namespace queries
- Background async snapshot refresh (stale-while-revalidate)
- Aggregated API server pattern for high-volume data (PullRequest, Pipeline, etc.)
- `getPartialSnapshot()` for pages that only need a subset of kinds

**When It Breaks:**
- Large clusters with 1000+ resources per kind (kubectl list becomes slow)
- Complex joins needed (e.g. "all runs for repositories owned by team X")
- Full-text search across resource content (need external search index)
- High-frequency writes (etcd write throughput is ~10K/s cluster-wide)
- Time-series data (audit logs, metrics -- needs separate store)

---

### 3.2 Why kubectl spawnSync (vs K8s client-go or @kubernetes/client-node)

**Decision:** Shell out to kubectl binary for all Kubernetes operations using
Node.js `child_process.spawnSync()` and `child_process.spawn()`.

**Rationale:**
- Zero npm dependencies for K8s operations (no `@kubernetes/client-node`)
- Works with any kubeconfig (user's local config, service account, EKS/GKE auth plugins)
- kubectl handles all auth complexity (OIDC, exec-based plugins, certificates)
- No Node.js K8s client compatibility bugs
- kubectl is battle-tested and always up-to-date with K8s API changes
- Debugging: can reproduce any operation by copying the kubectl command

**Trade-off:**
- `spawnSync` blocks the event loop (one at a time per request)
- Cold starts are slow (kubectl binary startup + API server TLS handshake)
- No watch support in sync mode (separate spawn needed)
- Process spawn overhead (~20-50ms per call)
- Max buffer limits on large responses (configurable via `KRADLE_KUBECTL_MAX_BUFFER_BYTES`)

**Mitigation:**
- `kubernetes-controller-async.js` uses `spawn()` + `Promise.all()` for parallel queries
- Snapshot cache means most page loads skip kubectl entirely
- `getPartialSnapshot()` queries only needed kinds (not all 76)
- `KRADLE_KUBECTL_TIMEOUT_MS` (default 3s) prevents hung processes
- `runKubectlAsync()` for non-blocking operations in the async controller
- In-cluster detection auto-adds `--server`, `--token`, `--certificate-authority`
  flags (no kubeconfig file needed in-cluster)

**Future Options:**
- Could add in-cluster HTTP client using service account token at
  `/var/run/secrets/kubernetes.io/serviceaccount/token`
- Could use `@kubernetes/client-node` for watch-only operations
- Could implement a sidecar proxy that exposes a local HTTP API

---

### 3.3 Why Next.js App Router (vs Pages Router or Remix)

**Decision:** Next.js 16 with App Router, React 19 server components.

**Rationale:**
- Server-side rendering for dashboard pages (no client-side waterfall)
- Streaming responses for progressive rendering
- Parallel data loading (multiple server components fetch independently)
- File-based routing matches the 7-module page structure
- React Server Components reduce client bundle size
- Built-in API routes for proxy endpoints (Atlas, auth callbacks)

**Trade-off:**
- Complex server/client boundary (`'use client'` directive management)
- Cannot pass functions or non-serializable props from server to client components
- Larger initial bundle than SPA alternatives
- Build time increases with page count
- Turbopack compatibility issues in Docker builds (fallback to webpack)

**Mitigation:**
- Clear module split: `lib/pages/` (server), `components/` (client where needed)
- `'use client'` only on interactive components (forms, drag-drop, modals)
- SDK resolveAlias for monorepo imports (relative path workaround)
- Standalone output mode reduces Docker image size
- `export const metadata` pattern for static head content

**Gotcha:**
- `export const metadata` cannot coexist with barrel re-exports
  (must be in the page file itself, not re-exported from index)
- `dynamic = 'force-dynamic'` required on proxy routes (Atlas, auth)
- `process.env` access works differently in server components vs route handlers

---

### 3.4 Why Pure ESM JavaScript (vs TypeScript)

**Decision:** Zero TypeScript across all kradle packages. Pure `.js`/`.jsx` with
JSDoc annotations for type information.

**Rationale:**
- No build step for core package (run directly with `node`)
- Instant startup (no compilation delay in development)
- Simpler debugging (source maps not needed, line numbers match)
- No `tsconfig.json` complexity (path aliases, module resolution, strict modes)
- JSDoc types are optional and incremental (add where valuable)
- Core package uses only Node.js built-in modules (no bundler needed)

**Trade-off:**
- No compile-time type safety
- JSDoc is more verbose than TypeScript type annotations
- IDE IntelliSense weaker for complex types (generics, discriminated unions)
- Refactoring tools less reliable without type information
- No `enum` or `interface` -- must use `@typedef` or constants

**Mitigation:**
- Comprehensive test suite (1440+ tests across core, SDK, CLI, web)
- Controller boundary declarations (BOUNDARY objects) enforce contracts at runtime
- `validateResource()` checks required fields at runtime
- Every controller factory function documents its API via JSDoc
- Resource model has `requiredSpec` arrays that enforce schema at create/apply time

---

### 3.5 Why Stale-While-Revalidate (vs K8s Watch Streams)

**Decision:** 30s TTL cache with stale-while-revalidate pattern for all
Kubernetes resource reads.

**Rationale:**
- Simple implementation (Map-based cache, no persistent connections)
- Works with kubectl (no long-lived watch connections needed)
- Handles cold starts gracefully (first request blocks, subsequent use cache)
- Predictable memory usage (one snapshot per org)
- No reconnection logic needed for reads

**Trade-off:**
- 30s staleness window (UI may show outdated data)
- Cache miss on first request after deploy or cache clear
- Background revalidation fires even when no one is watching
- Multiple simultaneous requests may all miss cache (thundering herd)

**Mitigation:**
- `clearSnapshotCache()` called on every write (apply/delete) -- immediate consistency for mutations
- Per-org isolation: cache key includes organization parameter
- `revalidating` flag prevents duplicate background fetches
- `staleMs` threshold (5x TTL = 150s) before forcing blocking revalidation
- Configurable via `KRADLE_SNAPSHOT_CACHE_TTL_MS` env var

**Future:**
- `watchResourceChanges()` is implemented in `kubernetes-controller-async.js`
- Watches key kinds (Organization, AgentStack, AgentSession) and clears cache on change
- Not yet wired to the web layer HTTP server
- Could enable near-real-time UI updates without polling

---

### 3.6 Why SDK Re-export Layer (vs Direct Imports)

**Decision:** `@a5c-ai/kradle-sdk` re-exports from core, and web/CLI import
from the SDK rather than directly from core internals.

**Rationale:**
- Decouples web/CLI from internal core file paths
- Single import target for consumers (`import { ... } from '@a5c-ai/kradle-sdk'`)
- SDK can expose a stable API surface while core refactors internally
- SDK adds web-specific helpers (UI model mappers, auth wrappers)
- Clear dependency direction: web -> SDK -> core

**Trade-off:**
- Extra level of indirection for simple re-exports
- Turbopack/webpack need `resolveAlias` configuration for monorepo resolution
- Circular dependency risk if SDK imports from web accidentally
- Version coupling (SDK must update when core export shapes change)

**Gotcha:**
- Turbopack requires **relative path** in resolveAlias (not absolute path)
- The alias target is `'../sdk/src/index.js'` from the web package root
- Monorepo workspace root must be correctly set in `next.config.js`
- Build fails silently with wrong path (module not found at runtime, not build time)

---

### 3.7 Why x-kubernetes-preserve-unknown-fields (vs Strict Schemas)

**Decision:** All CRD specs use `x-kubernetes-preserve-unknown-fields: true`
allowing arbitrary additional fields.

**Rationale:**
- Rapid iteration: UI can add new spec fields without CRD redeployment
- Forward-compatible: older CRD versions accept newer resource manifests
- No validation failures during development cycles
- Reduces coupling between Helm chart releases and feature development
- Enables spec exploration (prototype fields in UI, formalize later)

**Trade-off:**
- No server-side validation of field names or types
- Typos in spec field names silently accepted (e.g. `organisationRef` vs `organizationRef`)
- No OpenAPI schema generation for CRD fields
- `kubectl explain` shows no field documentation
- etcd stores whatever is submitted (no normalization)

**Mitigation:**
- Client-side validation in controllers (`validate*` functions)
- `requiredSpec` arrays in RESOURCE_DEFINITIONS enforce mandatory fields at apply time
- Test suite covers all valid/invalid field combinations
- Controller boundary declarations document expected spec shapes
- UI forms constrain input to valid fields

**Note:** Helm only installs CRDs on `helm install`, not `helm upgrade`.
Explicit `kubectl apply -f packages/kradle/charts/crds/ --server-side --force-conflicts`
is needed in CI before helm upgrade to update CRD definitions.

---

### 3.8 Why Single-Container-Per-Role (api + controllers + web + webhook-worker)

**Decision:** 4 deployment containers (roles), each running a different entry
command from the same or related images.

**Actual Layout:**
| Role | Image | Entry Command | Port |
|------|-------|--------------|------|
| api | kradle-controller | `node src/http-server.js` | 3080 |
| controllers | kradle-controller | `node src/control-plane.js` | - |
| web | kradle-web | `node .next/standalone/server.js` | 3000 |
| webhook-worker | kradle-controller | `node src/external/webhook-controller.js` | - |

**Rationale:**
- Separation of concerns (API serving vs background reconciliation vs UI)
- Independent scaling (web can scale to 3 replicas while api stays at 1)
- Failure isolation (webhook worker crash doesn't affect UI)
- Resource tuning (web needs more memory for SSR, api needs more CPU)

**Trade-off:**
- More pods consuming cluster resources
- More complexity in Helm chart (4 Deployments, 4 Services)
- Internal service discovery needed (web → api via `KRADLE_CONTROLLER_URL`)
- Shared code must be in core package (duplicated in controller image)

**Actual State:**
- api and controllers share the `kradle-controller` image (same codebase, different entrypoint)
- web uses the `kradle-web` image (Next.js standalone build)
- webhook-worker is architecturally separate but shares the controller image

---

## 4. System Nuances & Gotchas

### 4.1 Namespace Discovery Fallback Chain

The system must determine which Kubernetes namespaces to query for org-scoped
resources. The resolution follows a priority chain:

**Step 1:** Check Organization resources in platform namespace
```javascript
organizations.map(org => org.spec?.namespaceName || org.metadata?.labels?.['kradle.a5c.ai/namespace'])
```
If Organization CRDs exist, derive namespaces from their `spec.namespaceName` field.

**Step 2:** Check OrgNamespaceBinding resources
```javascript
bindings.map(binding => binding.spec?.namespace || binding.metadata?.labels?.['kradle.a5c.ai/namespace'])
```
Bindings explicitly declare the namespace for each org.

**Step 3:** Environment variable fallback
```javascript
if (process.env.KRADLE_ADMIN_ORG) fallbackOrgs.add(orgNamespaceName(adminOrg));
fallbackOrgs.add(orgNamespaceName(process.env.KRADLE_ORG || 'default'));
// Result: ['kradle-org-admin', 'kradle-org-default']
```

**Step 4:** Last resort
```javascript
return [KRADLE_PLATFORM_NAMESPACE]; // 'kradle-system'
```

**WHY this chain exists:** Fresh deployments have no Organization CRD yet
(it's created on first admin login), but the UI needs to list resources in
an org namespace. The fallback ensures the system bootstraps correctly.

**Edge cases:**
- Multiple orgs: all discovered namespaces are queried (flat merge, no hierarchy)
- Namespace doesn't exist yet: kubectl returns empty list (no error with `--ignore-not-found`)
- Stale bindings: namespace listed but org deleted → empty results (harmless)

---

### 4.2 KRADLE_CONTROLLER_URL Indirection

**Architecture:**
```
Browser → Web Container (Next.js) → API Container (HTTP server)
                                          ↓
                                    kubectl → K8s API
```

**How it works:**
- Web container has `KRADLE_CONTROLLER_URL` env var pointing to api's internal K8s Service URL
  (e.g. `http://kradle-api.kradle-system.svc.cluster.local:80`)
- Web NEVER runs kubectl directly (no kubeconfig mounted in web container)
- All resource operations go through fetch() to the api container

**If api container is down:**
- Web's server-side data fetching returns clean error model
- Pages render with error state (not a crash/500)
- No kubectl fallback from web container (by design)

**If api returns degraded data:**
- Web may probe local snapshot for comparison (modelResourceScore heuristic)
- Used to detect api container serving stale cache vs fresh data
- Not a correctness requirement, just a freshness indicator

**Why not direct kubectl from web?**
- Security: web container is publicly exposed (ingress), kubectl access is dangerous
- Image size: web image doesn't include kubectl binary (except for auth callback)
- Separation: web handles presentation, api handles data operations
- Exception: `registerLoginProfile()` in auth callback does use kubectl (web image
  includes kubectl for this single operation -- registers User/IdentityMapping on login)

---

### 4.3 Cache + Write Interaction

**Write path (mutation):**
```
applyResource(resource) / deleteResource(kind, name)
  → kubectl apply / delete
  → clearSnapshotCache()           // Invalidate ALL cached data
  → globalEventBus.emitResourceChange(kind, name, 'apply'|'delete')
  → SSE clients receive notification
  → Next page load fetches fresh data from kubectl
```

**Read path (query):**
```
Page server component calls controller
  → staleWhileRevalidate(org, revalidateFn)
  → If cache fresh (< 30s): return immediately
  → If cache stale (30s-150s): return stale, refresh in background
  → If cache too old (> 150s) or missing: block on fresh fetch
```

**Key behaviors:**
- `clearSnapshotCache()` clears ALL orgs (global invalidation)
- `clearOrgCache(org)` clears single org (surgical invalidation)
- Per-org cache isolation: different orgs don't interfere
- `revalidating` flag prevents thundering herd (only one background refresh)
- Write + immediate read: always gets fresh data (cache cleared on write)

**Race condition:**
If two users write simultaneously:
1. User A writes → cache cleared
2. User B writes → cache cleared (already empty)
3. User A reads → fresh fetch, sets cache
4. User B reads → gets User A's fresh data (which includes both writes if kubectl returned both)

This is safe because kubectl always returns the latest server state.

---

### 4.4 Auth Cookie Security

**Cookie creation:**
```javascript
// Payload: base64url(JSON({ provider, subject, user }))
// With secret:  payload.hmac-sha256(payload, secret) → base64url
// Without secret: payload only (plain base64url, no signature)
```

**Verification matrix:**

| Cookie State | Secret Configured | Result |
|-------------|-------------------|--------|
| Signed | Yes | Verify HMAC, constant-time compare |
| Signed | No | Reject (can't verify) |
| Unsigned | Yes | Reject (could be tampered) |
| Unsigned | No | Accept (backward compatible) |

**Security properties:**
- HMAC-SHA256 signing ONLY when `KRADLE_SESSION_SECRET` env var is set
- Without secret: cookie is plain base64 (useful for development)
- Constant-time comparison via `crypto.timingSafeEqual` (prevents timing attacks)
- HttpOnly flag (no JavaScript access)
- SameSite=Lax (prevents CSRF from cross-origin POST)
- No Secure flag by default (set at ingress/proxy level)

**Tampered cookie handling:**
- Invalid HMAC → `parseSessionCookie` returns `null`
- null session → middleware rejects request
- Rejection → 307 redirect to `/login`
- No error message exposed (prevents oracle attacks)

---

### 4.5 CRD Lifecycle in CI

**Problem:** Helm's CRD handling has a well-known limitation:
- `helm install` -- applies CRDs from the `crds/` directory
- `helm upgrade` -- does NOT update CRDs (by design, to prevent data loss)
- `helm uninstall` -- does NOT delete CRDs (by design, to prevent data loss)

**CI workaround:**
```bash
# Before helm upgrade, explicitly apply CRDs
kubectl apply -f packages/kradle/charts/crds/ --server-side --force-conflicts
```

`--server-side` enables server-side apply (handles field ownership correctly).
`--force-conflicts` resolves ownership conflicts (Helm vs kubectl managers).

**Implications for development:**
- Adding a new field to an existing CRD: no CRD redeployment needed (preserve-unknown-fields)
- Adding a new CRD kind: must deploy the CRD yaml file before resources can be created
- Removing a field from CRD: preserve-unknown-fields means old resources still have the field
- Changing field type in CRD: no validation exists, so no conflict (but client code may break)

**Best practices:**
- Always add new kinds in the same PR that adds the CRD yaml
- CI pipeline runs CRD apply before helm upgrade
- Never rename CRD group/version/plural (breaks all existing resources)
- Use annotations to mark deprecated fields (spec.deprecated.fieldName: "reason")

---

### 4.6 Org-Scoped vs Platform-Scoped Resources

**Platform-scoped resources** (exist in kradle-system namespace only):
- `Organization` -- represents an org identity
- `OrgNamespaceBinding` -- binds org to a namespace

These are special because they exist "above" org namespaces -- they define
the org structure itself.

**Org-scoped resources** (exist in kradle-org-{slug} namespaces):
- All other 74 resource kinds
- Always have `spec.organizationRef` field
- Namespace derived from org: `kradle-org-${normalizeOrgSlug(org)}`

**Enforcement:**
```javascript
// In withOrgScope():
if (resource.metadata?.namespace && resource.metadata.namespace !== namespace) {
  throw new Error(`namespace ${resource.metadata.namespace} does not match organization ${org}`);
}
```

Cross-org denial: `applyResource()` calls `withOrgScope()` which rejects any
resource whose explicit namespace conflicts with its `organizationRef`.

**KRADLE_RESOURCES array has `platformScoped: true` flag:**
- Platform-scoped: only queried from `KRADLE_PLATFORM_NAMESPACE` (kradle-system)
- Org-scoped: queried from all discovered org namespaces

**Multi-org queries:**
Snapshot fetches resources from ALL org namespaces. The flattened result includes
resources from all orgs. UI filters by `spec.organizationRef` for the current org view.

---

### 4.7 Web Container Architecture

**Dockerfile structure (multi-stage):**
```dockerfile
# Stage 1: deps - install node_modules
FROM node:20 AS deps
COPY package*.json ./
RUN npm ci

# Stage 2: build - Next.js production build
FROM node:20 AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: runtime - minimal production image
FROM node:20-slim AS runtime
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# kubectl for auth callback
COPY --from=bitnami/kubectl:latest /opt/bitnami/kubectl/bin/kubectl /usr/local/bin/
```

**Build uses webpack (not turbopack) for Docker:**
- Turbopack has issues with Docker layer caching
- Webpack is more predictable in CI environments
- `--webpack` flag in `next build` command

**Runtime image includes kubectl:**
- Needed for `registerLoginProfile()` during auth callback
- Called once per user login (not hot path)
- Could be removed if auth moved fully to api container

**SDK resolution via turbopack resolveAlias:**
```javascript
// next.config.js
experimental: {
  turbopack: {
    resolveAlias: {
      '@a5c-ai/kradle-sdk': '../sdk/src/index.js'  // MUST be relative
    }
  }
}
```

**Standalone output mode:**
- `.next/standalone/` contains full Node.js app (no node_modules needed at runtime)
- Reduces Docker image from ~1GB to ~150MB
- Entry: `node .next/standalone/server.js`
- Static assets served from `.next/static/` (can be CDN-fronted)

---

## 5. Integration Gaps (Known, Documented)

The following integration gap categories track areas where kradle has resource
definitions and controller logic but previously lacked (or still lacks) runtime
integration. Items marked **RESOLVED** have been implemented in the K8s Job
dispatch architecture.

### Gap 1: Session Lifecycle Sync — RESOLVED

**Previous state:**
Created `AgentSession` resources with `spec.agentMuxSessionId`. Status depended
on mux client responses; if mux was unavailable, status stayed `Pending`.

**Resolution:**
Agent pods now POST directly to the Kradle callback endpoint
(`POST /api/orgs/{org}/agents/runs/{name}/callback`) on completion.
`persistSessionEvent()` applies the result to `AgentSession` and `AgentDispatchRun`
in a single atomic update. No polling or mux webhook receiver needed.

---

### Gap 2: Adapter Capability Caching

**What kradle does now:**
`queryCapabilities(adapter)` called during stack reconciliation. Result is used
once and discarded (no caching of adapter capabilities).

**What it should do:**
Cache adapter capabilities with TTL, invalidate on adapter CRD changes.
Reduces mux API calls during frequent stack reconciliation cycles.

**What blocks it:**
No cache layer between mux client and stack controller. Low priority since
mux is usually fast and capabilities rarely change.

**Estimated effort:** 0.5 day (add to snapshot cache pattern)

---

### Gap 3: Transport Resolution and Codec Injection — RESOLVED

**Previous state:**
Validated `AgentTransportBinding` spec, but never activated the transport runtime
or injected settings into agent processes.

**Resolution:**
`resolveTransport(stack, resources)` reads the `AgentTransportBinding` referenced
by the stack's adapter and injects `AGENT_MUX_TRANSPORT` and `TRANSPORT_MUX_CODEC`
as environment variables directly into the `batch/v1` Job spec via `createAgentJob()`.
Agent pods receive transport configuration at startup without any manual wiring.

---

### Gap 4: Lifecycle Event Emission — RESOLVED

**Previous state:**
`globalEventBus.emitResourceChange()` fired on resource CRUD operations only.
Purely internal, resource-level granularity. No agent lifecycle events.

**Resolution:**
`createHooksLifecycleEmitter(bus)` emits 9 structured lifecycle events
(RUN_CREATED, RUN_QUEUED, RUN_STARTED, STEP_STARTED, STEP_COMPLETED,
APPROVAL_REQUESTED, APPROVAL_GRANTED, APPROVAL_DENIED, RUN_COMPLETED/RUN_FAILED)
at the correct dispatch lifecycle points. Events are forwarded to registered
`WebhookSubscription` endpoints via the existing webhook delivery system.

---

### Gap 5: Cost Aggregation — RESOLVED

**Previous state:**
`reconcileTranscript()` summed token usage from SSE events. Cost fields were zero
when no events were available.

**Resolution:**
`checkBudget()` + `estimateCost()` enforce budget before dispatch. The agent pod's
callback payload includes `costUsd` (actual incurred cost). `persistSessionEvent()`
records this against `AgentDispatchRun.status.costUsd`. Budget ceiling is enforced
at the infrastructure level via `activeDeadlineSeconds` on the Job spec, ensuring
agents cannot exceed their budget even if the callback is never delivered.

---

### Gap 6: Real-Time Session Streaming to UI

**What kradle does now:**
Web console shows session status from cached snapshot (30s staleness).
SSE endpoint only emits resource-change events (kind/name/operation).

**What it should do:**
Proxy or relay agent step events to the web console for live session
viewing (token-by-token streaming).

**What blocks it:**
Web container cannot reach agent pods directly. API container would need to relay
agent SSE or WebSocket events to its own SSE endpoint. Significant complexity for
multi-subscriber fanout with back-pressure.

**Estimated effort:** 5-8 days (SSE relay, subscriber management, back-pressure)

---

### Gap 7: Approval Gate Integration

**What kradle does now:**
`AgentApproval` resources created with spec describing the gate (action, requestedBy).
Status updated manually (via UI form or API call). `APPROVAL_REQUESTED` hooks event
is now emitted when the gate is created.

**What it should do:**
When approval is granted/denied, automatically resume or cancel the blocked agent Job.
Currently approval resolution updates the AgentDispatchRun phase but does not signal
the suspended Job pod to continue.

**What blocks it:**
Agent Job pods are not designed to pause mid-execution awaiting approval. The approval
gate must be enforced at dispatch time (before Job creation), not within a running pod.

**Estimated effort:** 1-2 days (pre-dispatch approval gate enforcement tightening)

---

### Gap 8: Context Bundle Delivery

**What kradle does now:**
`AgentContextBundle` resources store prompt/context snapshots with digest.
Created during dispatch, immutable after creation. Bundle digest is stored in
the Job's env vars.

**What it should do:**
Deliver the full bundle payload (attachments, provenance, redaction manifest) to
the agent pod at startup, not just the digest.

**What blocks it:**
Bundle payloads may be too large for env var injection. Need a signed URL or
in-cluster object store reference that the pod can fetch at startup.

**Estimated effort:** 1-2 days (signed URL generation or object store integration)

---

### Gap 9: Workspace Mount Coordination — RESOLVED

**Previous state:**
`KradleWorkspace` spec defined volume mounts. `launchSession()` passed
`workspace.mountPath` to mux. Assumed workspace was pre-provisioned.

**Resolution:**
The dispatch flow now verifies workspace phase before Job creation.
`findReusableWorkspace()` returns only `Ready` workspaces. If none found,
`createWorkspace()` provisions a new PVC. The Job is only submitted after the
workspace PVC is `Bound`. The PVC is mounted at `/workspace` in the Job pod spec
via `getMountSpec()`.

---

### Gap 10: Trigger-to-Dispatch Pipeline — RESOLVED

**Previous state:**
`AgentTriggerRule` created `AgentDispatchRun` on match, but dispatch run creation
was the terminal action — no agent was actually launched.

**Resolution:**
`createManualDispatch()` now continues through the full dispatch flow after creating
the run resource: it runs `checkBudget()`, calls `createAgentJob()`, and submits the
Job to Kubernetes via `submitAgentJob()`. The trigger-to-execution pipeline is now
complete end-to-end.

---

### Gap 11: Multi-Session Orchestration

**What kradle does now:**
`AgentSubagent` defines child-agent roles with task kinds and tool subsets.
Stack reconciliation resolves subagent references.

**What it should do:**
Orchestrate multiple concurrent K8s Jobs (one per subagent) for a single
dispatch run. Track progress, handle dependencies between subagent tasks.

**What blocks it:**
No multi-Job coordinator. Would need significant orchestration logic
(task graph, dependency resolution, failure handling, rollback).

**Estimated effort:** 10-15 days (orchestrator, state machine, failure handling)

---

### Gap 12: Memory Query at Dispatch Time

**What kradle does now:**
`AgentMemorySnapshot` pins memory state at dispatch time. `AgentMemoryQuery`
records retrieval requests. Both are CRD resources. A snapshot is created during
dispatch if an `AgentMemoryRepository` exists.

**What it should do:**
Automatically inject the resolved memory snapshot content into the context bundle
delivered to the agent Job as a mounted file or env var.

**What blocks it:**
Memory content may be large (full git-backed repository). Need efficient delivery
mechanism (in-cluster object store or read-only PVC mount).

**Estimated effort:** 2-3 days (snapshot injection into Job spec)

---

### Gap 13: Provider Config Resolution

**What kradle does now:**
`AgentProviderConfig` stores API base URLs, auth types, and model rate tables.
`checkBudget()` and `estimateCost()` use these rate tables for budget enforcement.

**What it should do:**
Resolve provider config at Job creation time and pass credential references to
the agent pod via env var secret refs (`valueFrom.secretKeyRef`).

**What blocks it:**
Security boundary -- kradle should not pass raw API keys in Job env vars.
Need `secretKeyRef` protocol (reference existing K8s Secret by name/key).

**Estimated effort:** 1-2 days (secretKeyRef injection in createAgentJob)

---

### Summary of Integration Gaps

| # | Gap | Status | Effort | Priority |
|---|-----|--------|--------|----------|
| 1 | Session Lifecycle Sync | **RESOLVED** (callback endpoint) | — | — |
| 2 | Adapter Capability Caching | Open | 0.5d | Low |
| 3 | Transport Binding Activation | **RESOLVED** (env var injection) | — | — |
| 4 | Lifecycle Event Emission | **RESOLVED** (9 hooks events) | — | — |
| 5 | Cost Aggregation | **RESOLVED** (checkBudget + deadline) | — | — |
| 6 | Real-Time Session Streaming | Open | 5-8d | High |
| 7 | Approval Gate Integration | Partial (pre-dispatch) | 1-2d | Medium |
| 8 | Context Bundle Delivery | Open | 1-2d | Medium |
| 9 | Workspace Mount Coordination | **RESOLVED** (PVC mount in Job) | — | — |
| 10 | Trigger-to-Dispatch Pipeline | **RESOLVED** (K8s Job submission) | — | — |
| 11 | Multi-Session Orchestration | Open | 10-15d | Low |
| 12 | Memory Query at Dispatch Time | Partial (snapshot created) | 2-3d | Medium |
| 13 | Provider Config Resolution | Partial (rates used, creds pending) | 1-2d | Medium |

**Remaining open effort:** ~20-31 developer-days (down from 35-60)

**Resolved critical path:** Gap 10 (Trigger-to-Dispatch) is complete. The basic
dispatch-to-completion lifecycle (Gaps 1, 9, 10) is now end-to-end operational
via K8s Jobs. Remaining gaps (6, 11) are non-critical enhancements.

---

## 6. Architectural Choice: Why K8s Jobs (vs DaemonSet, Deployment, Raw Pod)

### Decision

Agent execution uses `batch/v1` Jobs (not DaemonSets, Deployments, or raw Pods).

### Rationale

| Option | Why Rejected |
|--------|-------------|
| **Raw Pod** | No automatic restart semantics; pod evictions or node failures lose the run. Pod lifecycle not tracked by K8s controller. Manual cleanup required. |
| **Deployment** | Designed for long-lived services, not one-shot tasks. Scales by replica count, not by task. Restart policy conflicts with agent "run once to completion" semantics. |
| **DaemonSet** | Runs one pod per node — not suitable for per-run isolation. Cannot express per-run resource limits or deadlines. |
| **StatefulSet** | Designed for ordered, persistent services. Overkill for ephemeral agent runs. |
| **batch/v1 Job (chosen)** | Native support for `completionMode`, `backoffLimit`, `activeDeadlineSeconds`. K8s garbage-collects succeeded Jobs automatically. Pod failure is surfaced as Job failure. Integrates with K8s scheduler for resource-aware placement. Works with cluster autoscaler for node provisioning. |

### Why `activeDeadlineSeconds` for Budget Enforcement

Budget enforcement requires a hard ceiling that survives process crashes, pod
restarts, and network partitions. `activeDeadlineSeconds` is enforced by the
K8s Job controller at the infrastructure level — even if the agent pod loses
connectivity to Kradle, Kubernetes will terminate the pod when the deadline is
exceeded and mark the Job as Failed. This gives Kradle a guaranteed out-of-band
termination path independent of the callback mechanism.

### Why One Job per Dispatch Run (vs Shared Runner Pool)

- **Isolation:** Each run gets its own process namespace, filesystem, and network
  policy. A bug in one agent cannot corrupt another run's workspace.
- **Resource accounting:** Job resource requests/limits are per-run, enabling
  accurate cost tracking and scheduler placement decisions.
- **Auditability:** K8s Job name matches dispatch run name (`agent-{runName}`),
  making cross-referencing between Kradle resources and cluster logs trivial.
- **Simplicity:** No need for a long-lived runner daemon to multiplex tasks; K8s
  handles pod lifecycle, log collection, and cleanup.

### Tradeoffs

- **Cold start latency:** Each run incurs image pull + pod scheduling time (~5-30s
  depending on cluster). RunnerPool warm replicas can mitigate this for CI Jobs,
  but agent Jobs currently pay the full cold start cost.
- **Cluster resource pressure:** Many concurrent dispatch runs create many pods.
  Cluster autoscaler must be configured to scale node groups for agent workloads.
- **Log retention:** K8s deletes completed Job pods after TTL. Kradle must ship
  logs to an external store (or use `persistSessionEvent` artifact logging) before
  the TTL expires.


---

## KServe Integration: CRD Wrapper Architecture

**Decision:** Wrap KServe `InferenceService` and `ServingRuntime` CRDs via Kradle resources (`KradleInferenceService`, `KradleServingRuntime`) rather than exposing KServe CRDs directly to Kradle users.

**Rationale:**
- Kradle resources follow the standard Kradle CRD model (`apiVersion: kradle.a5c.ai/v1alpha1`), keeping a consistent API surface for all platform resources
- The wrapper validates model formats, generates correct KServe manifests, and abstracts away KServe-specific versioning (`serving.kserve.io/v1beta1`)
- `toProviderConfig()` creates a seamless bridge to `AgentProviderConfig`, allowing agent stacks to reference on-cluster models without knowing they are backed by KServe
- Enables future backend swap (e.g., Seldon, Triton standalone) without changing consumer API

**Alternative considered:** Direct KServe CRD exposure via kubectl pass-through. Rejected because it breaks the Kradle CRD model and makes agent integration harder.

---

## Artifact Registry: Internal + External Dual-Mode Design

**Decision:** Support both internal storage (Kradle-managed etcd/S3/GCS/Azure Blob) and external integration (GitHub Packages, etc.) within the same `ArtifactRegistry` resource via `storageBackend` and `externalIntegration` fields.

**Rationale:**
- Teams often have existing external registries (npm, PyPI, GitHub Packages) they need to access; forcing migration to internal storage would block adoption
- Internal storage (especially S3/GCS) provides full control over retention, access policy, and cost; external-only would lose that control
- Mirror mode syncs published versions to external backends, enabling gradual migration or dual-publish workflows
- A single resource kind covering both modes reduces API surface complexity

**Alternative considered:** External-only (proxy to existing registries). Rejected because Kradle needs to enforce access policies and track download analytics that external registries do not expose.

---

## Assistant Runtime: In-Process vs. K8s Job

**Decision:** Implement the assistant as an in-process runtime (`assistant-runtime.js`) using the Anthropic API directly, rather than dispatching K8s Jobs.

**Rationale:**
- Assistant chat requires low latency (< 1s to first token); K8s Job startup overhead (5-30s) is unacceptable for interactive chat
- Session state (message history) must survive across requests within a session; in-process `globalThis` store achieves this trivially without distributed state management
- Streaming (SSE) is native to the Anthropic API and the Next.js runtime; routing through K8s Jobs would require complex proxying
- Assistant workloads are lightweight (API calls, no GPU) and do not benefit from the isolation that K8s Jobs provide for agent workloads

**Alternative considered:** K8s Job dispatch (same as agent dispatch). Rejected due to latency, streaming complexity, and session state management overhead.

**Trade-off accepted:** In-process runtime means the assistant does not get the resource isolation and budget enforcement of K8s Jobs. This is acceptable because the assistant uses a shared Anthropic API key with org-level rate limiting.

---

## Integration Gap Status Update

| Gap | Status | Notes |
|-----|--------|-------|
| KServe inference | **Implemented** | KradleInferenceService + KradleServingRuntime controllers, 7 API routes, web console pages |
| Artifact registry | **Implemented** | 5 resource kinds, 6 API routes, web console pages |
| Assistant runtime | **Implemented** | In-process runtime, SSE streaming, session management, 5 API routes |
| Auth on mutating routes | **Implemented** | withAuth applied to all POST/DELETE/PUT handlers; webhook HMAC and agent callback intentionally unauthenticated |