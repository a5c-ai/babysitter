# Web UI Excellent Flows

The UI ontology is a set of resource-backed view models rather than a hidden application state machine.

## Required flows

- Create and inspect a repository.
- Open and review a pull request.
- Inspect failed checks and rerun/resume CI.
- Edit runner pool capacity and cache policy.
- Inspect and replay webhook deliveries.
- Open YAML/resource views for UI actions.

## View model invariants

- Dashboard cards summarize repositories, PRs, pipelines, runner pools, and webhook deliveries.
- PR review surfaces changed files, pipeline checks, comments, and YAML.
- Runner pool editor exposes scaling limits and resource YAML.
- Webhook inspector exposes request, response, phase, signature, and replay action.
- Every view includes enough resource identity for kubectl-style workflows.

## Traceability

`View` and `Selector` resources support saved triage and cross-repository work. UI filters should map to selector labels or query metadata.

## Current executable UI contract

- Breadcrumbs orient each organization and repository route.
- `ForgeFlowRail` makes the default Git forge flow explicit: create, clone, branch, open PR, merge, deploy, and notify.
- `RepositoryCommandBar` keeps clone, branch, watch, RBAC, PR-flow, and YAML actions visible across repository tabs.
- Degraded-state banners render on every route that depends on the controller model, not only on the dashboard.
- Architecture boundaries include the API controller, Kubernetes resource gateway, Kubernetes client, Kubernetes reconciler, and Git data plane.
