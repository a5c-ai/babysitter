# Operations and Publishing Component Requirements

## Purpose

Operations and publishing turn Krate from an architecture into an installable, upgradeable, observable system. The MVP must ship as a Helm chart with a reproducible demo and production-shaped configuration paths.

## Responsibilities

- Package images, charts, CRDs, APIService, controllers, UI, Gitea backend, and Argo CD workloads.
- Document install profiles and dependencies.
- Define upgrade, rollback, backup, restore, and support expectations.
- Provide release readiness gates and smoke tests.

## Publish surface

- Container images for aggregated API server, controllers, Gitea backend, UI, webhook delivery worker, and optional indexers.
- Helm chart with CRDs, RBAC, ServiceAccounts, Deployments, Services, APIService, Gitea backend, Argo CD Application, config, and optional templates.
- Example manifests for repository, PR policy, runner pool, webhook, and demo workflow.

## Requirements

- `helm install krate` must install the MVP in a documented cluster profile.
- Chart values must allow BYO Argo CD, Gitea, Postgres, object storage, RWX storage class, ingress, OIDC provider, ARC, NATS, Kyverno, and Gatekeeper.
- Demo mode must be explicit and not confused with production defaults.
- Production install docs must call out HA, storage, backup, secrets, and network requirements.
- Upgrade docs must describe CRD, Postgres, controller, Gitea backend, and Argo CD rollouts.

## Dependencies

- Kubernetes cluster with API aggregation support.
- RWX storage provider.
- Postgres.
- Object storage.
- OIDC provider.
- Optional NATS JetStream, ARC, Kyverno/Gatekeeper, ingress controller, cert-manager.

## Security and policy

- Helm chart must install least-privilege RBAC.
- Secrets must be configurable through existing cluster secret management.
- Default network policies should separate API, UI, data-plane, and storage paths where possible.
- Release artifacts must be signed or checksummed.

## Scaling and performance

- Chart values must expose replica counts and autoscaling knobs for API server, UI, Gitea backend, runner workers, and delivery workers.
- Gitea backend sizing guidance must include repository count, storage, and I/O considerations.
- Runner pool defaults must distinguish trusted warm capacity from untrusted cold starts.

## Failure modes

- Failed install: Helm output and events identify missing dependencies.
- Failed migration: release blocks or rolls back before incompatible controllers start.
- Failed Gitea rollout: receive-pack writes are protected from corruption.
- Failed dependency: status pages and docs point to the exact degraded capability.

## Observability

- Default ServiceMonitor/PodMonitor templates where Prometheus is available.
- Example dashboards for API, Git data plane, runners, webhooks, and storage.
- Log correlation IDs across UI, API, Gitea backend, and delivery worker.

## Acceptance criteria

- Clean install creates all required Kubernetes resources.
- Smoke test creates repository, pushes code, opens PR, runs CI, and applies a policy.
- Backup and restore docs exist and are testable.
- Release checklist gates chart, images, CRDs, migration, security, and docs.

## Repository package artifacts

The repository now includes a verified Kubernetes package lifecycle:

- `charts/krate` provides the Helm-style chart surface with CRDs, APIService, RBAC, service accounts, workloads, services, a Gitea backend, an Argo CD Application surface, and network policy defaults.
- `examples/minikube-demo.yaml` and `examples/policy-kyverno-pr-title.yaml` provide demo install resources.
- `scripts/setup-minikube.mjs` provides dry-run and apply modes for local minikube setup.
- `npm run e2e` validates the chart and minikube command plan without requiring a live cluster.
- `npm run package:check` validates chart structure and npm pack contents.

This is a production-shaped package contract for the executable Kubernetes-native model. Controller image build/publish, chart packaging, npm package validation, generated dist/example artifacts, UI build artifacts, and AKS Helm deployments for develop/staging/main are wired through `.github/workflows/publish.yml` with safe PR/branch/tag gates. Live-cluster conformance now runs through the branch deployment lane for `krate-develop.a5c.ai`, `krate-staging.a5c.ai`, and `krate.a5c.ai`.

