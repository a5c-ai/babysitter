# Infrastructure Dependencies

What krate needs to run, what breaks when each piece is missing.

## Required Services

| Service | Env Var(s) | What Breaks Without It |
|---------|-----------|----------------------|
| Kubernetes cluster | In-cluster auth or `KUBECONFIG` | Everything — all CRD operations fail, snapshot returns empty |
| kubectl binary | `KRATE_KUBECTL` (default: `kubectl`) | All resource read/write operations |

## Conditional Services

| Service | Env Var(s) | What Breaks | What Still Works |
|---------|-----------|-------------|-----------------|
| Gitea | `KRATE_GITEA_HTTP_URL`, `KRATE_GITEA_TOKEN` | Code browser shows placeholders, clone URLs are templates, PRs are CRD-only, no real git operations | Dashboard, resource CRUD, agent config, inference config |
| Agent Mux Gateway | `AGENT_MUX_URL` or `AGENT_GATEWAY_URL` | Dispatch creates CRDs but no K8s Jobs execute, no sessions/transcripts | Stack/rule/approval CRUD, everything except running agents |
| Anthropic API | `ANTHROPIC_API_KEY` or `KRATE_ASSISTANT_API_KEY` | Assistant chat, playground, cost tracking all non-functional | Everything else |
| Atlas Knowledge Graph | `ATLAS_BASE_URL` (default: `https://atlas.a5c.ai`) | Stack builder graph nodes show empty (no layer/tool browsing from Atlas) | Manual stack creation still works |
| Krate Controller API | `KRATE_CONTROLLER_URL` | Web falls back to direct kubectl (slower, no caching) | Still functional, just slower |
| KServe | Deployed in cluster | Inference services are CRD shells, no actual model serving | Inference UI works for config management |
| Envoy AI Gateway | Deployed via Kustomize | Model routes generate manifests but don't apply, no request proxying | Route config management works |
| KubeVela | Helm subchart | Deployment management shows "KubeVela not detected" banner | Webhook/repo features work |
| Kyverno | Helm subchart | Policy management shows "Kyverno not detected" banner | Webhook/repo features work |
| NATS / JetStream | `KRATE_EVENT_TRANSPORT=nats`, `KRATE_EVENT_NATS_URL` or `NATS_URL` | Multi-replica event fanout and durable replay are unavailable; local memory/JSONL replay remains process-local | Single-process SSE and local tests |

## All Environment Variables

### Security & Auth (required for production)

| Variable | Default | Purpose |
|----------|---------|---------|
| `KRATE_SESSION_SECRET` | none (required) | HMAC-SHA256 key for session cookie signing |
| `KRATE_ADMIN_ORG` | `'default'` | Organization with admin privileges |
| `KRATE_ADMIN_USERNAME` | none | Admin user bypass for org checks |
| `KRATE_AUTH_COOKIE_NAME` | `'krate_session'` | Session cookie name |
| `KRATE_SESSION_MAX_AGE` | `86400` (24h) | Session TTL in seconds |
| `KRATE_WEBHOOK_SECRET` | none | HMAC secret for webhook signature validation |

### OAuth/SSO (required for real login)

| Variable | Default | Purpose |
|----------|---------|---------|
| `KRATE_AUTH_SSO_ENABLED` | `false` | Enable SSO login |
| `CLIENT_ID` | none | OAuth client ID |
| `CLIENT_SECRET` | none | OAuth client secret |
| `TOKEN_URL` | none | OAuth token endpoint |
| `AUTHORIZATION_URL` | none | OAuth authorization endpoint |
| `USERINFO_URL` | none | OAuth userinfo endpoint |
| `PROVIDER_NAME` | `'sso'` | Provider display name |
| `SCOPES` | `'openid profile email'` | OAuth scopes |
| `KRATE_AUTH_DELEGATED_IDENTITY_ENABLED` | `false` | Enable reverse-proxy auth headers |

### Infrastructure

| Variable | Default | Purpose |
|----------|---------|---------|
| `KRATE_KUBECTL` | `'kubectl'` | kubectl binary path |
| `KRATE_NAMESPACE` | `'krate-system'` | Default Kubernetes namespace |
| `KRATE_KUBECTL_TIMEOUT_MS` | `30000` | kubectl command timeout |
| `KRATE_CONTROLLER_URL` | none | Controller API URL for snapshot hydration |
| `KRATE_CONTROLLER_REQUEST_TIMEOUT_MS` | `5000` | Controller request timeout |
| `KRATE_PUBLIC_URL` | auto-detected | Public URL for OAuth callbacks |
| `KRATE_CALLBACK_URL` | none | Explicit OAuth callback URL |
| `KRATE_SNAPSHOT_CACHE_TTL_MS` | none | Snapshot cache TTL |

### Services

| Variable | Default | Purpose |
|----------|---------|---------|
| `KRATE_GITEA_HTTP_URL` | none | Gitea HTTP API URL |
| `KRATE_GITEA_TOKEN` | none | Gitea admin API token |
| `ANTHROPIC_API_KEY` | none | Anthropic API key for assistant |
| `KRATE_ASSISTANT_API_KEY` | none | Alternative to ANTHROPIC_API_KEY |
| `AGENT_MUX_URL` | none | Agent multiplexer endpoint |
| `AGENT_GATEWAY_URL` | none | Agent gateway endpoint |
| `ATLAS_BASE_URL` | `'https://atlas.a5c.ai'` | Atlas knowledge graph API |

### Logging & Events

| Variable | Default | Purpose |
|----------|---------|---------|
| `KRATE_EVENT_LOG_DIR` | `~/.krate/events` | Event bus JSONL persistence directory |
| `KRATE_EVENT_TRANSPORT` | `memory` | Set to `nats` or `nats-jetstream` to use broker-backed event transport |
| `KRATE_EVENT_NATS_URL` / `NATS_URL` | none | NATS endpoint for durable event transport |
| `KRATE_EVENT_NATS_SUBJECT` | `krate.events` | NATS subject for Krate resource/event fanout |
| `KRATE_EVENT_NATS_STREAM` | `KRATE_EVENTS` | JetStream stream name used for durable event replay |
| `KRATE_EVENT_REQUIRE_BROKER` | `false` | When true, broker publish failures surface as errors instead of degraded local operation |

### Helm Chart Additional Variables (values.yaml)

| Section | Key Variables |
|---------|-------------|
| Image | `image.repository`, `image.tag`, `image.pullPolicy` |
| Demo mode | `demo.enabled`, `demo.minio`, `demo.postgresql`, `demo.nats` |
| Replicas | `api.replicas`, `controllers.replicas`, `web.replicas` |
| Resources | CPU/memory limits per component |
| Ingress | `ingress.enabled`, `ingress.host`, `ingress.tls` |
| Autoscaling | `autoscaling.enabled`, `autoscaling.minReplicas`, `autoscaling.maxReplicas` |

## Degradation Behavior

The web console shows a `DegradedBanner` component when the controller is unreachable. Individual pages show `EmptyState` components when their backing data is unavailable. The health monitor page shows red/green/gray status dots per component.

There are no fallback behaviors (per CLAUDE.md rule: "fallbacks are evil"). If a service is down, the UI shows the error — it doesn't fake success with mock data.
