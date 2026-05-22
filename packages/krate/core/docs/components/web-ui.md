# Web UI Component Requirements

## Purpose

The Web UI makes Kubernetes-native forge concepts usable without hiding them. It provides developer-grade PR, code, CI, hooks, policy, and triage workflows while exposing the YAML and `kubectl` equivalent for every mutation.

## Responsibilities

- Render repositories, code, PRs, issues, pipelines, runners, hooks, policies, insights, and settings.
- Fetch data from the Kubernetes and aggregated APIs without a separate forge backend.
- Stream resource changes through Watch API to SSE.
- Provide GitOps-transparent mutation panels.
- Preserve RBAC semantics by carrying user identity to the API server.

## Information architecture

Org-scoped sections:

- Repositories
- Inbox
- Runs
- Runners
- Hooks & Policies
- Insights
- Settings

Per-repository sections:

- Code
- Pull Requests
- Issues
- Runs
- Hooks
- Settings

## Requirements

- Use Next.js App Router and Server Components for primary data fetching.
- Use route handlers for `/api/watch/orgs/[org]/*` SSE streams.
- Use `/api/git-proxy` to stream smart-HTTP to the Gitea backend where needed.
- Use Monaco or CodeMirror for code and diff views.
- Every mutating action must include a stable `</>` affordance showing YAML, kubectl command, copy-as-apply, and save/open PR options where relevant.
- Every detail page should include a YAML tab.
- Saved views must map to `View` or `Selector` resources.

## Dependencies

- Aggregated API server and CRDs.
- OIDC and TokenRequest integration.
- Gitea backend.
- Watch API.
- Optional Kyverno/Gatekeeper policy metadata.

## Security and policy

- The UI must not implement a shadow permission model.
- Disabled or hidden actions must still be backed by API authorization outcomes.
- Token handling must keep user credentials out of client-side JavaScript where possible.
- Mutating route handlers must call the same API path as generated YAML apply.

## Scaling and performance

- Watch streams should avoid polling for PR, comment, pipeline, and webhook state.
- Large diffs and logs must virtualize rendering.
- Route handlers must apply backpressure for long-lived SSE and Git proxy streams.

## Failure modes

- Watch disconnect: UI reconnects and resumes from current list state.
- RBAC denied: UI shows actionable denied status and resource/verb context.
- API unavailable: UI shows degraded state with correlation IDs.
- Git proxy failure: code/clone/push flows surface data-plane health.

## Observability

- Web vitals, API route latency, watch connection count, SSE reconnects, denied action count, Git proxy errors, mutation success/failure.

## Acceptance criteria

- Repo list, file view, PR list, and PR detail render from API resources.
- PR/pipeline state updates through SSE without manual refresh.
- Mutating forms expose YAML and `kubectl apply` equivalents.
- Runner live view streams logs and pod event hints.

## Implemented forge navigation proof

The Next.js console now treats YAML as transparency rather than the default user journey:

- Global pages render breadcrumbs, degraded-state banners, and direct navigation for repositories, PRs/issues, pipelines, runners, hooks, insights, operations, and the YAML workbench.
- The dashboard and repository landing render a `ForgeFlowRail` for the developer path: create, clone, branch, open PR, merge, deploy, and notify.
- Repository subpages render a `RepositoryCommandBar` with clone, branch, watch, RBAC, PR-flow, and YAML affordances before the code, pull request, issue, pipeline, hook, and settings tabs.
- The architecture map exposes the `krate-api-controller`, `kubernetes-resource-gateway`, `kubernetes-resource-client`, `krate-kubernetes-reconciler`, and `git-data-plane` lanes so users can understand what owns UI/API flow versus Kubernetes reconciliation.

`npm run ui:validate` checks these route-flow and architecture-boundary affordances, and `npm run ui:build` proves every app route compiles in the production Next.js build.
