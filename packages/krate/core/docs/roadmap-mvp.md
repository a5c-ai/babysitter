# MVP Roadmap

## MVP promise

A user can install Krate, create a repository resource, push Git content, create/review a PR, run CI through ARC with Workload Identity, and apply a Kyverno policy that blocks a PR while the same policy appears in the UI.

## Six-week plan

### Weeks 1-2: Aggregated API server

Deliverables:

- `Repository` and `PullRequest` resources with Kubernetes discovery.
- Postgres-backed storage for aggregated resources.
- Working `kubectl get/create` flows.
- Initial RBAC and admission compatibility.

Exit criteria:

- PR creation and listing work through `kubectl`.
- PR data is not stored as large etcd objects.

### Week 3: Gitea-backed data plane

Deliverables:

- Gitea-backed smart-HTTP and SSH pathing.
- Single Gitea backend with persistent repository storage.
- `git-upload-pack` and `git-receive-pack` support.
- Repository operator creates Gitea repository integration plans.

Exit criteria:

- `kubectl create -f repo.yaml` followed by `git push` works.

### Week 4: Next.js skeleton

Deliverables:

- OIDC login skeleton.
- Repo list and file view.
- PR list.
- Watch API to SSE route.
- GitOps-transparent mutation panel pattern.

Exit criteria:

- Repo and PR pages update from watch streams.

### Week 5: PR creation and review

Deliverables:

- PR creation flow.
- Inline diff view.
- Comment threads.
- Pipeline status in PR rail.

Exit criteria:

- Developer can create and review a PR in the UI.

### Week 6: CI identity and demo

Deliverables:

- ARC-backed workflow execution.
- Workload Identity for CI jobs.
- Demo Kyverno PR policy.
- Outbound webhook and delivery log.
- Helm chart packaging.

Exit criteria:

- Public demo path: `helm install krate`; create repo; push; create PR; run CI; policy blocks a PR; UI shows policy and delivery state.

## Post-MVP roadmap

- v0.2: Live run view refinements, `RefPolicy` with WASM hooks, scaled Gitea data plane, and richer saved `View`/`Selector` templates.
- v0.3: Zoekt code search, multi-cluster federation, richer insights and cost attribution.

## Open decisions

- Commit to aggregated API server over pure CRDs for high-cardinality resources.
- Choose ARC-only MVP or executor-pluggable runner abstraction from day one.
- Decide whether to bundle Kyverno or support BYO only.
- Decide final product name before public README and chart publication.
