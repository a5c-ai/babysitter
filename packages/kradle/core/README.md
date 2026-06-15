# Kradle

Kradle is a Kubernetes-native Git forge runtime. Repositories, pull requests, CI, webhooks, policy, and UI flows execute through Kubernetes-style resources, Argo CD GitOps reconciliation, and a Gitea-backed Git hosting backend with explicit storage boundaries.

This repository is the executable MVP runtime and handoff package for the specs in `docs/`. It includes a stateful Node.js runtime, HTTP API server, production-shaped Kubernetes package surface, deterministic e2e/package validation, a minikube setup script, a production-built controller container, and safe GitHub publishing lanes for package, chart, image, and generated artifacts.

## What is implemented

- Kubernetes-style resource taxonomy for `Repository`, `PullRequest`, `Issue`, `Review`, `Pipeline`, `Job`, `RunnerPool`, `WebhookSubscription`, `WebhookDelivery`, `RefPolicy`, `BranchProtection`, `View`, and `Selector`.
- Control-plane behavior for validation, storage routing, watches, RBAC checks, admission policy, and audit warnings.
- Data-plane behavior backed by Gitea for repository hosting, SSH deploy keys, collaborators/teams, protected branches, webhooks, object storage records, and search indexing queueing.
- Runner/CI behavior for trusted and forked jobs, projected service-account identity, isolation policy, checks completion, and rerun-from-step behavior.
- Webhook/event behavior for subscriptions, signed deliveries, inspection, replay, and PR lifecycle notifications.
- Runnable local runtime and HTTP API for repository creation, PR creation, checks, review approval, merge, resource listing, and snapshot export/import restore.
- UI and operations handoff models for excellent flows, YAML transparency, Argo CD Application manifests, Gitea-backed install manifests, observability, backup/restore, and release gates.
- Integrated component catalog and lifecycle snapshot for all implementation areas.
- Next.js console under `apps/web` backed by the executable Kradle runtime model.
- Production-shaped controller container using `bin/kradle-server.mjs`, `/healthz`, and the same runtime API covered by tests.
- GitHub Actions publishing for validated package artifacts, dist/chart/example bundles, GHCR controller images, tagged Helm chart OCI pushes, and AKS Helm deployments for develop/staging/main.

## Quick start

```bash
npm run check
npm run demo
npm run demo -- --json
npm run serve
npm run e2e
npm run package:check
npm run setup:minikube -- --dry-run
```

`npm run check` runs the full local gate: build, docs/ontology coverage, unit tests, e2e package validation, package checks, smoke assertions, UI validation, and the Next.js production build. `npm run serve` starts the local runtime API used by the lifecycle tests.

## Entrypoints

- Library API: `src/index.js`
- CLI demo: `bin/kradle-demo.mjs` or package bin `kradle-demo`
- Runtime server: `bin/kradle-server.mjs` or package bin `kradle-server` (`npm run serve`)
- Public preview: `public/index.html`
- Next.js UI: `apps/web` (`npm run dev`, `npm run ui:build`)
- Product home: `https://a5c.ai/kradle`
- Helm-style package: `charts/kradle`
- Controller image: `Dockerfile` builds `ghcr.io/${{ github.repository }}/kradle-controller`
- Publishing workflow: `.github/workflows/publish.yml` (develop -> `kradle-develop.a5c.ai`, staging -> `kradle-staging.a5c.ai`, main -> `kradle.a5c.ai`)
- Minikube setup: `scripts/setup-minikube.mjs`
- Demo resources: `examples/minikube-demo.yaml`
- Generated handoff summary: `dist/kradle-summary.json`
- Generated lifecycle snapshot: `dist/kradle-lifecycle.json`
- Documentation index: `docs/README.md`


## Sign-in and user management

Kradle installs with GitHub login enabled by default and optional SSO disabled until an operator supplies provider settings. SSO is installation configuration only: admins manage users, teams, invites, repository access, and identity mappings in Kradle after the provider is configured through Helm values.

### Create a GitHub OAuth client

1. In GitHub, open **Settings -> Developer settings -> OAuth Apps -> New OAuth App**.
2. Set the homepage URL to the public Kradle URL, for example `https://kradle.example.com`.
3. Set the callback URL to `https://kradle.example.com/api/auth/callback/github`.
4. Copy the generated client ID and client secret into a private values file or an existing Kubernetes Secret.

```yaml
auth:
  github:
    enabled: true
    clientId: "<github-client-id>"
    clientSecret: "<github-client-secret>"
```

Install or upgrade with:

```bash
helm upgrade --install kradle charts/kradle -n kradle-system --create-namespace -f auth-values.yaml
```

To disable GitHub login:

```yaml
auth:
  github:
    enabled: false
```

### Configure SSO

Create an OAuth/OIDC client in your identity provider with callback URL `https://kradle.example.com/api/auth/callback/sso`, then pass the provider endpoints through Helm values. This configuration is intentionally not exposed in the UI.

```yaml
auth:
  sso:
    enabled: true
    providerName: "Company SSO"
    issuerUrl: "https://idp.example.com"
    authorizationUrl: "https://idp.example.com/oauth2/v1/authorize"
    tokenUrl: "https://idp.example.com/oauth2/v1/token"
    userInfoUrl: "https://idp.example.com/oauth2/v1/userinfo"
    clientId: "<sso-client-id>"
    clientSecret: "<sso-client-secret>"
    scopes: "openid profile email groups"
```

For existing secrets, create keys named `github-client-id`, `github-client-secret`, `sso-client-id`, and `sso-client-secret`, then reference them:

When every enabled provider uses `existingSecret`, the chart does not render an additional Kradle-managed auth Secret. If only one provider uses an existing Secret, the chart renders only the inline-managed provider keys.

```yaml
auth:
  github:
    existingSecret: kradle-auth-secrets
  sso:
    existingSecret: kradle-auth-secrets
```

When a cluster ingress or identity proxy delegates authentication, set the forwarded identity headers at install time:

```yaml
auth:
  delegatedIdentity:
    enabled: true
    userHeader: x-forwarded-user
    groupsHeader: x-forwarded-groups
```

For local Next.js development, `http://localhost:3000/api/auth/delegated` can sign in without a proxy header when delegated identity is enabled. It defaults to `local-developer` in `kradle:repo-admins`, and can be overridden with `?user=alice&email=alice@example.test&groups=kradle:developers` or disabled with `KRADLE_AUTH_DELEGATED_LOCAL_DEVELOPMENT=false`.

All web UI pages and authenticated API routes require the `kradle_session` login cookie. `/login` and `/api/auth/*` stay public so users can start OAuth, delegated sign-in, or logout flows.

Kradle stores `User`, `Team`, `Invite`, `IdentityMapping`, `RepositoryPermission`, and `SSHKey` resources. OAuth callbacks and delegated identity headers auto-register the Kradle user plus identity mapping, and controllers reconcile those resources into workspace access, repository account mappings, team membership, SSH keys, and repository permissions while the UI exposes only Kradle people and access flows.

### Staging service bindings

The Helm chart can wire assistant, Gitea, Agent Adapter, and NATS event transport configuration into the deployed workloads without committing secret values. Use `assistant.*.existingSecret` for `ANTHROPIC_API_KEY` or `KRADLE_ASSISTANT_API_KEY`, `gitea.token.existingSecret` for `KRADLE_GITEA_TOKEN`, `agentMux.url` or `agentMux.gatewayUrl` for the Agent Adapter service endpoints, and `externalDependencies.nats.eventTransport.enabled` plus either `externalDependencies.nats.url` or `externalDependencies.nats.existingSecret` for broker-backed event fanout/replay. Secret-backed NATS URLs default to key `url` and can be overridden with `externalDependencies.nats.key`. `externalDependencies.nats.eventTransport.subject` and `stream` select the NATS subject and JetStream stream. Empty values remain omitted so local/default renders keep their degraded-service behavior until real backing services are configured.

## Runtime API

Start the local server with `npm run serve`, then use:

- `GET /healthz` — health check.
- `GET /api/snapshot` — complete runtime resource/event/audit snapshot.
- `GET /api/resources/:kind` — Kubernetes-style list for a resource kind.
- `POST /api/repositories` — create a repository resource backed by the Gitea Git hosting integration plan.
- `POST /api/pullrequests` — create a PR, enqueue CI jobs, and deliver a webhook.
- `POST /api/pullrequests/:name/checks/complete` — complete the PR pipeline.
- `POST /api/pullrequests/:name/reviews` — add an approval or change-request review.
- `POST /api/pullrequests/:name/merge` — enforce checks/reviews, execute the Gitea-backed receive-pack path, and emit merge webhook delivery.

## Development commands

- `npm run build` — generate `dist/kradle-summary.json` and `dist/kradle-lifecycle.json` from the executable model.
- `npm run validate:docs` — verify required docs, ontology files, and source terms.
- `npm test` — run Node test coverage for the model, runtime, API, and handoff surfaces.
- `npm run smoke` — execute MVP smoke assertions and print flow/storage status.
- `npm run demo` — print the human-readable handoff summary.
- `npm run serve` — start the local Kradle HTTP API.
- `npm run ui:dev` / `npm run dev` — start the Next.js implementation console.
- `npm run ui:validate` — verify the UI files and model-data contract.
- `npm run ui:build` — build the Next.js console for production using the webpack builder for deterministic standalone tracing of the Node-backed Kubernetes controller routes.
- `npm run dev:check` — quick developer loop for UI contract and unit tests.
- `npm run check` — run the complete quality gate.

## Documentation map

Start with `docs/README.md`, then read:

- `docs/product-requirements.md`
- `docs/system-requirements.md`
- `docs/architecture-spec.md`
- `docs/user-stories.md`
- `docs/roadmap-mvp.md`
- `docs/install.md`
- `docs/local-minikube.md`
- `charts/kradle/README.md`
- `docs/ontology/README.md`

## Release boundary

The current package is ready as a verified Kubernetes-native runtime contract, chart package, local minikube handoff, controller image build, and implementation artifact. The chart validates the Kubernetes install contract locally through e2e/package gates, the Dockerfile packages the runnable controller API and Next.js web app, and the publishing workflow safely pushes images/charts from non-PR contexts while deploying branch commits to the existing AKS cluster at `kradle-develop.a5c.ai`, `kradle-staging.a5c.ai`, and `kradle.a5c.ai`.

## QA automation

The product-wide QA strategy lives in `docs/tests/README.md`. Current executable gates are `npm run check`, `npm test`, `npm run e2e`, `npm run validate:docs`, `npm run package:check`, `npm run smoke`, `npm run ui:validate`, and `npm run ui:build`. Future planned gates cover browser automation, coverage, security, live integrations, and agent/company-brain workflows.

## External backend integrations

Design docs for GitHub and future externally managed backends live in `docs/external/README.md`. The model splits providers into three optional interfaces: issue tracking, CI/CD, and git forge, with GitHub expected to support all three through GitHub Apps, APIs, webhooks, and bidirectional sync.
