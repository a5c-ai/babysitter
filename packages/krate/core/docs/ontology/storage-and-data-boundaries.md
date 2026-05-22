# Storage and Data Boundaries

## etcd boundary

etcd stores CRD-backed configuration: `Repository`, `WebhookSubscription`, `RefPolicy`, `BranchProtection`, `RunnerPool`, `View`, and `Selector`. These are low-cardinality desired-state resources.

## Postgres boundary

Postgres stores aggregated records: `PullRequest`, `Issue`, `Review`, `Pipeline`, `Job`, and `WebhookDelivery`. These records can be listed and watched through Kubernetes APIs but their primary storage is not etcd.

## Gitea repository boundary

Gitea stores repositories and terminates smart-HTTP/SSH Git traffic. Repository status points to the Gitea backend integration, protected branch state, deploy keys, collaborators/teams, webhooks, and health, while Krate routing remains stateless.

## Object storage boundary

Object storage contains large immutable objects such as LFS blobs, archives, and artifacts. Repository specs reference object storage configuration without embedding large data.

## Search boundary

Search indexing hooks observe Git and resource events. Search lag must not block Git write success.

## Boundary invariant

No workflow should require copying high-cardinality logs, comments, jobs, or webhook attempts into etcd.

## Deterministic runtime snapshot boundary

The deterministic harness can export and import a KrateRuntimeSnapshot that preserves the control-plane etcd/postgres resource split, audit log, and events. This is the executable backup/restore boundary for the current package contract; production cluster backup still requires the external Postgres, object storage, Gitea repository storage, and declarative resource backup plan described in the operations docs.
