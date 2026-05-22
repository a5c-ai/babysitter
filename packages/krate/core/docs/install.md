# Installation and Local Development

Krate is a Kubernetes-native forge package with a local validation harness. You can run the deterministic harness, inspect the Next.js console, and dry-run the minikube install path while the install/runtime contract is expressed as Kubernetes resources, an Argo CD Application surface, and a Gitea-backed Git data plane.

## Prerequisites

- Node.js 20 or newer
- npm
- Optional for cluster dry-runs and live install experiments: Docker, minikube, kubectl, and Helm

## Fast path

```bash
npm install
npm run check
npm run dev
```

`npm run dev` starts the Next.js console from `apps/web` and renders data from the executable Krate lifecycle snapshot.

## Validation commands

```bash
npm run build          # writes dist/krate-summary.json and dist/krate-lifecycle.json
npm test               # unit coverage for resource, component, and handoff behavior
npm run e2e            # chart and minikube dry-run lifecycle coverage
npm run package:check  # npm package and chart/package metadata checks
npm run smoke          # Kubernetes contract smoke assertions
npm run ui:validate    # UI file and data-contract validation
npm run ui:build       # production Next.js build with deterministic standalone tracing
npm run check          # all deterministic gates
```

## Next.js UI

```bash
npm run ui:dev
npm run ui:build
```

The UI covers overview, repositories/data plane, runners/CI, identity and policy, hooks/events, operations/install, and lifecycle validation. It imports the Krate Kubernetes/Gitea/Argo CD contract model from `src/index.js`; no cluster is required for local UI development.

The Next.js proxy protects all UI pages and authenticated API routes with the `krate_session` cookie. `/login` and `/api/auth/*` remain public entrypoints for starting and ending sessions.

## Minikube package path

Preview the commands without mutating your machine:

```bash
npm run setup:minikube -- --dry-run --json
```

When you have minikube, kubectl, Helm, and Docker available and want to apply the package locally:

```bash
npm run setup:minikube -- --apply
```

This applies the Helm-style chart from `charts/krate` and demo resources from `examples/minikube-demo.yaml`.

## Troubleshooting

- If `npm run ui:build` fails after dependency changes, rerun `npm install` and retry.
- `kubectl port-forward` does not inject delegated identity headers; it only tunnels TCP. For local browser login without an identity proxy, explicitly set `auth.delegatedIdentity.enabled=true` and `auth.delegatedIdentity.localDevelopment.enabled=true`, then use `/api/auth/delegated` on `localhost`. Leave local development login disabled outside local clusters.
- If minikube tools are missing, use `npm run setup:minikube -- --dry-run --json` to see the required tools and commands.
- If `npm run check` fails, run the individual command listed above to isolate whether the issue is docs, unit tests, e2e package validation, smoke, or UI build.

## Current release surface

Krate now includes the verified Kubernetes-native runtime contract, Helm-style chart surface, Argo CD Application surface, Gitea backend integration, minikube handoff, production-shaped controller image build, and GitHub publishing workflow. The Dockerfile builds the runnable `bin/krate-server.mjs` controller API with a `/healthz` check plus the Next.js web app, and `.github/workflows/publish.yml` validates the full local gate before publishing or uploading package, dist, chart, example, UI, and image artifacts. Pull requests build images without pushing; branch/tag contexts can publish GHCR images, tagged releases can push the Helm chart to GHCR OCI, and commits to `develop`, `staging`, and `main` deploy the Helm chart to AKS at `krate-develop.a5c.ai`, `krate-staging.a5c.ai`, and `krate.a5c.ai`.

The local harness is intentionally deterministic: it validates resource contracts, Gitea API-shaped integration, Argo CD Application generation, lifecycle behavior, package surface, and UI without requiring external services. Live-cluster conformance remains the follow-up environment gate beyond this executable Kubernetes package.

## Local runtime API

Run `npm run serve` to start the local stateful Krate API on port 3080. The API exposes `GET /healthz`, `GET /api/orgs/[org]/snapshot`, `GET /api/orgs/[org]/runtime-resources/:kind`, `POST /api/orgs/[org]/repositories`, `POST /api/orgs/[org]/pullrequests`, `POST /api/orgs/[org]/pullrequests/:name/checks/complete`, `POST /api/orgs/[org]/pullrequests/:name/reviews`, and `POST /api/orgs/[org]/pullrequests/:name/merge`.

These endpoints execute the same control-plane, runner, webhook, policy, and Kubernetes/Gitea integration code used by the tests; they are a deterministic harness for the cluster package contract, not a replacement architecture. GET /api/orgs/[org]/snapshot returns a KrateRuntimeSnapshot export with the etcd/postgres storage boundary, audit log, and events. POST /api/orgs/[org]/snapshot imports that export into the running local API so backup/restore behavior is executable in tests instead of only documented.

## KubeVela / OAM delivery plane

Set kubevela.enabled=true to let the Krate chart create an Argo CD Application that installs KubeVela ela-core into ela-system. Krate then discovers core.oam.dev resources and exposes OAM Applications, component definitions, trait definitions, policy definitions, and workflow step definitions through the forge UI and controller JSON.


## Optional Kyverno integration

Krate can run without Kyverno, connect to a platform-owned Kyverno install, or manage Kyverno through Argo CD for local/greenfield clusters. Use `externalDependencies.kyverno.mode`:

- `auto` (default): Krate discovers an existing Kyverno install when CRDs are readable, otherwise keeps native Krate policy resources available.
- `disabled`: no policy-engine dependency; Hooks & Policies shows native Krate policy resources only.
- `byo`: Krate requires/discovers Kyverno CRDs/controllers and reads policy reports/exceptions using the chart RBAC.
- `managed`: Krate renders an Argo CD `Application` for the upstream Kyverno Helm chart and still exposes all raw YAML/`kubectl` actions.

The first implementation slice is intentionally admission-safe and non-fatal: if Kyverno is absent, the controller model reports an auto-discovery degraded policy engine instead of breaking repository, run, or deployment flows. Enforce-mode product promises require the Krate aggregated API server path to remain behind kube-apiserver admission.
