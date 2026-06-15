# Kradle — CLAUDE.md

Kubernetes-native Git forge runtime. Part of the babysitter monorepo.

## Packages

Kradle is split into 4 packages under `packages/kradle/`:

| Package | Name | Description |
|---------|------|-------------|
| **core** | `@a5c-ai/kradle` | Resource model, controllers, HTTP API server, build scripts |
| **sdk** | `@a5c-ai/kradle-sdk` | Client SDK — `createKradleApiController`, UI model helpers, auth, resource CRUD |
| **cli** | `@a5c-ai/kradle-cli` | CLI entrypoint (`kradle`) and MCP server mode (`kradle mcp`) |
| **web** | `@a5c-ai/kradle-web` | Next.js 16 + React 19 web console |

## Quick Commands

### Core (`packages/kradle/core`)

```bash
npm run build     # Generate dist/ JSON snapshots
npm test          # Unit + integration tests (node:test) — 1668 tests
npm run e2e       # End-to-end package validation — 3 tests
npm run smoke     # MVP smoke assertions — 21 checks
npm run serve     # Start HTTP API on port 3080
npm run demo      # Print handoff summary
```

### SDK (`packages/kradle/sdk`)

```bash
node --test tests/*.test.js   # SDK export + integration tests — 78 tests
```

### CLI (`packages/kradle/cli`)

```bash
node --test tests/*.test.js   # CLI commands + MCP protocol tests — 51 tests
kradle serve                   # Start HTTP API server
kradle mcp                     # Start MCP (Model Context Protocol) server over stdio
```

### Web (`packages/kradle/web`)

```bash
npm run build     # Next.js production build (Turbopack)
npm run dev       # Development server
npm test          # Route and API utility tests — 173 tests
```

## Architecture

- Pure ESM JavaScript (Node 20+, zero external deps in core)
- Kubernetes-first: all resources are K8s API objects (CRDs or aggregated)
- Control plane (etcd): Organization, User, Team, Repository, Policy
- Data plane (Postgres): PullRequest, Issue, Review, Pipeline, Job
- Git layer (Gitea): Repository storage, branches, SSH keys
- Agent layer: 12+ agent CRDs (stacks, runs, rules, sessions, memory, adapters, providers, projects, workspaces, approvals, permissions)
- External backends: Provider adapters (GitHub first), webhook/sync/write/conflict controllers
- Typed providers: GitProvider, CiProvider, IssueTrackerProvider, AppHostingProvider, ArtifactRegistryProvider — standard interfaces implemented by backend adapters
- Observability: Audit controller, event streaming, cost tracking

## MCP Server Mode

The CLI provides an MCP server (`kradle mcp`) that exposes 19 tools, 3 prompts, and 3 resources over stdio:

**Tools:**
- `kradle_snapshot` — org runtime snapshot
- `kradle_list_resources` / `kradle_get_resource` — read resources by kind
- `kradle_apply_resource` / `kradle_delete_resource` — write resources
- `kradle_search` — full-text resource search
- `kradle_list_stacks` / `kradle_create_stack` — agent stacks
- `kradle_dispatch_agent` — dispatch an agent run
- `kradle_list_secrets` / `kradle_create_secret` — secret management
- `kradle_sync_external` — trigger external sync
- `kradle_resolve_conflict` — resolve sync conflict
- `kradle_audit_query` — query audit events
- `kradle_model_catalog` — list available models and providers
- `kradle_list_model_routes` — list model routing configurations
- `kradle_create_model_route` — create a model route (Envoy AI Gateway)
- `kradle_list_virtual_models` — list virtual model abstractions
- `kradle_create_virtual_model` — create a virtual model

**Resources:**
- `kradle://snapshot` — org runtime snapshot
- `kradle://resources` — resource listing
- `kradle://models` — model catalog and routing

**CLI commands:** `kradle serve`, `kradle mcp`, `kradle status`, `kradle stacks`, `kradle dispatch`, `kradle apply`, `kradle get`, `kradle list`, `kradle delete`, `kradle version`

## Conventions

- No TypeScript — this is pure JavaScript with JSDoc types
- No external runtime dependencies in core (Node.js built-ins only)
- SDK re-exports core helpers for web/CLI consumers; web imports from `@a5c-ai/kradle-sdk`
- Web console is in ../web/ (Next.js 16 + React 19)
- Helm chart is in ../charts/ (not an npm workspace)
- Resource taxonomy: 89 kinds across config (etcd) and aggregated (Postgres) storage (58 CONFIG + 31 AGGREGATED = 89 total CRDs)
- Web console split into 7 modules (lib/kradle-ui, lib/page-frame, pages/agent, pages/repo, pages/manage, pages/settings, pages/external)
- Auth middleware on all mutating API routes
- Async kubectl snapshot with stale-while-revalidate cache (30s TTL)

## Agent Dispatch: K8s Job Architecture

Agents are dispatched as Kubernetes `batch/v1` Jobs (not subprocesses or Agent Adapter HTTP calls).
The dispatch flow:

1. `resolveStack(agentStack, resources)` — translates AgentStack CRD to execution config
2. `checkBudget()` + `estimateCost()` — enforce org budget before Job creation
3. `resolveTransport(stack, resources)` — reads AgentTransportBinding, produces env vars
4. `createAgentJob(run, executionConfig)` — generates Job manifest with:
   - Workspace PVC mounted at `/workspace`
   - `AGENT_MUX_TRANSPORT` and `TRANSPORT_MUX_CODEC` env vars injected
   - `activeDeadlineSeconds` set for budget enforcement
   - `KRADLE_CALLBACK_URL` pointing to result callback endpoint
5. `submitAgentJob(manifest)` — applies Job to Kubernetes
6. Agent pod executes, then POSTs result to `POST /api/orgs/{org}/agents/runs/{name}/callback`
7. `persistSessionEvent(runId, result)` — updates AgentDispatchRun + AgentSession resources
8. `createHooksLifecycleEmitter(bus)` — emits 9 lifecycle events at each dispatch stage

**Key new SDK exports:** `createAgentJob`, `submitAgentJob`, `getJobStatus`, `getJobLogs`,
`deleteJob`, `resolveStack`, `persistSessionEvent`, `createHooksLifecycleEmitter`,
`checkBudget`, `estimateCost`, `resolveTransport`

## Inference (KServe Integration)

- `kradle-inference-service-controller.js` wraps KServe `InferenceService` CRDs under `serving.kserve.io/v1beta1`
- Validates and generates KServe manifests for `KradleInferenceService` and `KradleServingRuntime` resources
- Endpoint discovery from K8s status (resolves URL after KServe readiness)
- Supports V1 and V2 inference protocols (`/v1/models/{name}:predict`, `/v2/models/{name}/infer`)
- `toProviderConfig` bridges an inference service to an `AgentProviderConfig` with `type: 'kserve'`
- Supported model frameworks: `sklearn`, `xgboost`, `lightgbm`, `tensorflow`, `pytorch`, `onnx`, `triton`, `huggingface`, `custom`
- Agent stacks can reference on-cluster models alongside cloud LLMs via the provider bridge
- **Key exports:** `createInferenceServiceController`, `KRADLE_INFERENCE_SERVICE_CONTROLLER_BOUNDARY`, `SUPPORTED_MODEL_FORMATS`, `INFERENCE_PROTOCOLS`

## Artifact Registry

- `artifact-registry-controller.js` manages 5 resource kinds: `ArtifactRegistry`, `ArtifactFeed`, `ArtifactAccessPolicy`, `ArtifactVersion`, `ArtifactDownload`
- Supports `npm`, `pip`, `docker`, and `generic` registry types
- Storage backends: `internal`, `s3`, `azure-blob`, `gcs`
- External integration modes (GitHub Packages, etc.): `read-only`, `read-write`, `mirror`
- Protocol-specific install command generation per feed type
- Access policy enforcement: `read`, `write`, `admin` permissions per feed
- **Key exports:** `createArtifactRegistryController`, `ARTIFACT_REGISTRY_CONTROLLER_BOUNDARY`

## Assistant Agent

- `assistant-runtime.js` provides an in-process runtime using the Anthropic API
- Chat sessions with persistent message history (`globalThis`-based session store)
- `createAssistantRuntime` returns an object with `chat`, `generate`, `listSessions`, `clearSession` methods
- Structured generation endpoint (`generate`) for dynamic content and agentic calls
- Default `assistant` AgentStack configuration deployed via Helm chart
- Stack selector allows using different `AgentStack` CRDs for different conversation contexts
- Supports tool definitions passed through to model calls
- **Key exports:** `createAssistantRuntime`, `ASSISTANT_RUNTIME_BOUNDARY`, `defaultAssistantConfig`, `defaultSystemPrompt`, `callModel`

## Agent Adapter Integration

- AgentStack, AgentDispatchRun, AgentTriggerRule, AgentSession, AgentMemory and 7+ more resource kinds fully implemented
- Agent adapter, transport binding, provider config, project, gateway, session transcript controllers
- Memory system: repository, source, ontology, query engine, import/snapshot
- Subagent orchestration with dispatch, supervision, tool scoping
- Permission review with cross-org denial, workspace policy enforcement
- External backend providers with GitHub adapter, webhook/sync/write/conflict controllers
- K8s Job-based dispatch with callback result collection and hooks lifecycle events

## Typed Providers

Typed provider interfaces for external service integration:

- **GitProvider** — Git hosting operations (clone, push, PR creation, branch management)
- **CiProvider** — CI/CD pipeline triggering, status, and log retrieval
- **IssueTrackerProvider** — Issue CRUD, label management, assignment
- **AppHostingProvider** — Application deployment, scaling, environment management
- **ArtifactRegistryProvider** — Package publish, version listing, feed management

Each provider type defines a standard interface that backend adapters (GitHub, GitLab, Azure DevOps, etc.) implement. The provider config CRD (`AgentProviderConfig`) references a typed provider and its connection details.

## KradleVirtualModel

Programmable model abstraction layer (`virtual-model-controller.js`):

- Declarative routing rules with condition evaluation (eq, neq, gt, lt, in, contains, matches)
- Weighted random route selection across multiple model routes
- JS hook execution in sandboxed `vm.Script` contexts (3s timeout) for:
  - `routeSelect` — custom route selection logic
  - `requestTransform` / `responseTransform` — request/response modification
  - `sessionLifecycle` — session event handling
  - `observe` — observability side-effects
- Agentic lifecycle hooks: `onSessionStart`, `onSessionEnd`, `onTurnEnd`, `onPreToolUse`, `onPostToolUse`, `onUserPromptSubmit`, `onError`, `onCompact`
- Session management with `maxTurns` and `escalationThreshold`
- Fallback chain for route resolution
- Reconciliation with route existence validation
- **Key exports:** `createVirtualModelController`, `validateVirtualModel`, `VIRTUAL_MODEL_CONTROLLER_BOUNDARY`

## KradleModelRoute and Envoy AI Gateway

Model routing layer for LLM traffic management:

- `KradleModelRoute` CRD defines upstream model endpoints with provider, model name, API key references, and rate limits
- Envoy AI Gateway integration generates xDS configuration for model-level load balancing and traffic splitting
- Virtual models reference model routes by name, enabling A/B testing, canary deployments, and cost-aware routing
- MCP tools (`kradle_create_model_route`, `kradle_list_model_routes`) for programmatic route management
- Route health tracking and automatic failover via fallback chains
