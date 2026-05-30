# Staging Status

Current state of `krate-staging.a5c.ai` as of 2026-05-30.

## Health Dashboard

| Component | Status | Root Cause |
|-----------|--------|------------|
| Kubernetes | Connected | CRD read/write operations work via kubectl |
| Gitea | **Error** | `KRATE_GITEA_HTTP_URL` points to a Gitea instance that is not responding |
| Agent Mux Gateway | **Not configured** | `AGENT_MUX_URL` / `AGENT_GATEWAY_URL` not set in deployment |
| Assistant | **Not configured** | `ANTHROPIC_API_KEY` / `KRATE_ASSISTANT_API_KEY` not set |

## What Works on Staging

- Dashboard renders, sidebar navigation works
- CRD resource CRUD — creating, editing, deleting AgentStacks, TriggerRules, KrateProjects, etc. all write to etcd via the Kubernetes controller
- Getting Started page with progress tracking
- Inference service/route/virtual model management (CRD level)
- External provider wizard (creates CRD resources)
- Settings pages (persisted to localStorage)
- All pages render without errors (error boundaries + loading states on all 24 route groups)

## What Does Not Work on Staging

### Assistant Chat & Playground
**Error:** `Assistant API key not configured. Set ANTHROPIC_API_KEY or KRATE_ASSISTANT_API_KEY.`

The assistant runtime calls `callModel()` from krate-sdk which delegates to the Anthropic API. Without the key:
- Chat page shows the error above
- Playground cannot send prompts to any model
- Virtual model hooks cannot be tested (they execute during model calls)
- Cost tracking page has no data (costs come from model calls)

**Fix:** Add `ANTHROPIC_API_KEY` to the staging Kubernetes deployment env vars.

### Git Operations
**Error:** Gitea health check returns error.

Without a working Gitea backend:
- Repository code browser shows placeholder file trees, not real git content
- Clone URLs are templates (`<repository-service>/repo.git`)
- Pull request diffs are CRD-rendered, not real file diffs
- Branch creation, push, merge operations are inert
- Webhook delivery has no forge to deliver to

**Fix:** Either deploy Gitea via the Helm chart (`gitea.enabled: true` in values.yaml) or fix the existing Gitea deployment and verify `KRATE_GITEA_HTTP_URL` + `KRATE_GITEA_TOKEN` are correct.

### Agent Dispatch
Without the Agent Mux Gateway:
- DispatchButton creates an `AgentDispatchRun` CRD resource ✓
- But `agentMuxClient.submitAgentJob()` has no gateway to submit to
- No K8s Jobs are created → no agent containers start
- No sessions are created (agents create sessions when they run)
- No transcripts are generated
- The entire runs → sessions → transcripts pipeline is inert

**Fix:** Deploy the agent-mux gateway and set `AGENT_MUX_URL` in the web deployment.

### Real-Time Events
- SSE endpoint emits resource events and supports replay cursors via `Last-Event-ID` or `?cursor=...` ✓
- Local/default deployments still use memory + JSONL event storage, so multi-replica fanout requires enabling NATS event transport
- Set `externalDependencies.nats.eventTransport.enabled=true` and `externalDependencies.nats.url` in Helm to use the broker-backed transport path

### Health Checks
- Snapshot health now runs bounded probes for Kubernetes `kubectl cluster-info`, Gitea `/api/v1/version`, Agent Mux/Gateway `/healthz`, Krate Controller `/healthz`, and assistant key presence/format
- Missing backing services are reported as `not configured`; failures are structured without leaking secret values
