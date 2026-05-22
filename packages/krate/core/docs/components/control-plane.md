# Control Plane Component Requirements

## Purpose

The control plane makes Krate a Kubernetes API extension rather than a forge with Kubernetes integrations. It owns resource semantics, RBAC, admission, watch behavior, reconciliation entry points, and storage boundaries.

## Responsibilities

- Serve low-cardinality configuration as CRDs.
- Serve high-cardinality social and execution records through an aggregated API server backed by Postgres.
- Preserve Kubernetes API ergonomics for `kubectl`, controllers, admission, and watch clients.
- Coordinate with repository, PR, runner, webhook, and policy controllers.

## API and resource surface

CRDs:

- `Repository`
- `WebhookSubscription`
- `RefPolicy`
- `BranchProtection`
- `View` and `Selector`

Aggregated resources:

- `PullRequest`
- `Issue`
- `Review`
- `Pipeline`
- `Job`
- `RunnerPool`
- `WebhookDelivery`

## Requirements

- The aggregated API server must support Kubernetes discovery and normal verbs for relevant resources.
- High-cardinality resources must not store primary records in etcd.
- Resource schemas must expose status fields that controllers and UI can watch.
- Status updates must be safe for concurrent controller writes.
- API resources must be label-selectable for workflows such as similar run search and failed webhook queries.

## Dependencies

- kube-apiserver aggregation layer.
- Postgres for high-cardinality records.
- etcd for CRD-backed config only.
- Admission webhook ecosystem.
- Controllers for repositories, PRs, runners, and webhooks.

## Security and policy

- Authorization must be Kubernetes RBAC, not app-local permission logic.
- Admission must be able to validate PR, issue, pipeline, and job resources.
- Audit logs must identify the Kubernetes user/group or ServiceAccount behind each mutation.

## Scaling and performance

- API server must support watch streams for UI and controller clients.
- Postgres indexes must support list, watch bookmarks, labels, field selectors, and common PR/pipeline queries.
- API latency targets must be separated from Git data-plane latency targets.

## Failure modes

- Postgres unavailable: aggregated resources are degraded; CRD config remains discoverable.
- APIService unavailable: UI and kubectl operations for aggregated resources fail clearly.
- Admission failure: resource creation must fail closed for enforcing policies and expose actionable status.

## Observability

- Request latency, error rate, watch count, storage latency, admission latency, and reconciliation lag.
- Kubernetes events for controller and API storage errors.

## Acceptance criteria

- `kubectl get repositories` and `kubectl get pullrequests` work.
- Creating a PR can be blocked by a Kyverno policy.
- PR/comment/review scale tests do not grow etcd as the primary database.
- UI can watch PR and pipeline updates through the same API resources.
