# System Requirements

## Functional requirements

- Krate must expose forge resources through Kubernetes-style APIs.
- Low-cardinality declarative configuration must use CRDs: `Repository`, `WebhookSubscription`, `RefPolicy`, `BranchProtection`, `RunnerPool`, `View`, and `Selector`.
- High-cardinality social and execution data must be served by an aggregated API server backed by Postgres: `PullRequest`, `Issue`, `Review`, `Pipeline`, `Job`, and delivery records.
- Git traffic and Git hosting integrations must be backed by a Kubernetes-hosted Gitea backend server for smart-HTTP/SSH, repositories, SSH keys, collaborators/teams, protected branches, and webhooks.
- CI jobs must run under scoped Kubernetes ServiceAccounts, not PATs.
- UI mutations must share code paths with generated YAML/kubectl actions.

## Integration requirements

- Kubernetes API aggregation must register Krate aggregated resources with normal discovery, watch, list, get, create, update, patch, and delete semantics where applicable.
- Admission webhooks must be able to validate and mutate PRs, issues, pipelines, and jobs.
- Kyverno and OPA Gatekeeper policies must work on Krate resources without a Krate-specific policy adapter.
- Repository operator must reconcile `Repository` resources into Gitea repository hosting, access configuration, integration plans, and status.
- PR operator must support preview-environment integration through ArgoCD ApplicationSet.
- Runner integration must compose with ARC for MVP and leave an abstraction seam for Tekton or Buildkite Agent.
- Webhook delivery must integrate with durable queueing, preferably NATS JetStream, and HMAC signing.

## Publish and install requirements

- Krate must ship as a public Helm chart.
- The chart must install CRDs, APIService registration, aggregated API server, controllers, Gitea backend, Argo CD Application surface, UI, service accounts, RBAC, and default policies.
- Install documentation must describe required and optional dependencies: Kubernetes version, Argo CD, Gitea, Postgres, RWX storage, object storage, NATS, ARC, Kyverno/Gatekeeper, OIDC provider, and ingress.
- The chart must support BYO Postgres, BYO object storage, BYO RWX class, and BYO Kyverno/Gatekeeper.
- Install must support a minimal demo mode and a production-shaped mode.

## Upgrade requirements

- CRD schema upgrades must be backward compatible inside a supported minor version.
- Aggregated API storage migrations must be versioned, idempotent, and observable.
- Controllers must tolerate partially upgraded components during Helm rollout.
- Gitea backend versions must be rollable without corrupting repositories or interrupting in-flight receive-pack writes.
- Release notes must list API changes, migration steps, and rollback constraints.

## CI/CD requirements

- The repository must publish chart artifacts and container images together with traceable versions.
- CI must run schema validation, controller tests, API conformance checks, security scans, Helm template validation, and a smoke install.
- Release candidates must prove the MVP path: install, create repository, push, create PR, run CI, apply policy, observe webhook delivery.

## Security requirements

- Krate must not use personal access tokens as a core credential mechanism.
- Human login must use OIDC and Kubernetes user/group mapping.
- UI server-side calls must carry the user’s Kubernetes identity or a strictly scoped delegated token.
- Runner jobs must use projected ServiceAccount tokens scoped to repo, ref, and pipeline identity.
- Fork PRs must be forced into untrusted pools with no secrets and no cluster API access.
- Server-side custom Git hooks must run in a WASM sandbox, not arbitrary shell.
- Outbound webhooks must be signed and secret rotation must be supported.

## Observability requirements

- Expose metrics for API latency, Postgres latency, Git operation latency, Gitea capacity, queue depth, webhook delivery status, runner wait time, runner cost, and policy violations.
- Emit Kubernetes events for reconciliation failures and user-visible operational issues.
- Preserve auditability through Kubernetes resources and copyable kubectl-equivalent activity entries.
- Provide dashboards for runner pools, hook health, Gitea/storage health, and API health.

## Backup and restore requirements

- Backup Postgres, repository RWX storage, object storage, and declarative resources.
- Document consistent restore ordering: API/config, Postgres, repositories, objects, controllers.
- Validate restore by listing resources, reading repository refs, opening PRs, and replaying a representative webhook delivery.

## Release readiness gates

- All required docs in this directory exist and link from `docs/README.md`.
- Helm install smoke test passes in a documented cluster profile.
- MVP demo path is reproducible from a clean namespace.
- Security model is documented with explicit threat boundaries.
- Known open decisions are tracked in the roadmap.


## KubeVela and OAM requirements

- The deployment must optionally install KubeVela as a GitOps-managed dependency through Argo CD.
- Krate must assimilate OAM Application, Component, Trait, Policy, Workflow Step, and Scope concepts into its ontology and UI.
- The UI must wrap KubeVela capabilities as repository and pull-request delivery flows while preserving raw Kubernetes/OAM YAML.
- KubeVela owns OAM reconciliation status; Krate only projects and summarizes it.

## Organization and namespace requirements

- Krate must model `Organization` as the top-level product scope for repositories, deployments, agents, runners, memory, sessions, secrets, config, and audit.
- Each organization must own or bind to exactly one Kubernetes namespace by default.
- Namespaced product resources must carry org and namespace labels and reject cross-org references unless an explicit sharing policy exists.
- Controllers must run cluster-wide if needed but reconcile side effects through the owning org namespace.
- UI routes and API routes must support org-addressed access such as `/orgs/[org]/repositories/[repo]` and `/api/orgs/[org]/...`.
- Backup, restore, retention, and audit must support org-level export and recovery.
