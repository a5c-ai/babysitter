# World Ontology

Krate is a Kubernetes-native forge: repositories, review, CI, policy, hooks, and operations are expressed through Kubernetes-style resources rather than a separate opaque application model.

## Domain entities

- **Kubernetes API server** is the interaction contract for discovery, verbs, watches, RBAC, admission, and status.
- **etcd** stores low-cardinality configuration resources such as `Repository`, `WebhookSubscription`, `RefPolicy`, `BranchProtection`, `RunnerPool`, `View`, and `Selector`.
- **Postgres** stores high-cardinality aggregated records such as `PullRequest`, `Issue`, `Review`, `Pipeline`, `Job`, and `WebhookDelivery`.
- **Gitea backend** stores repositories and keeps the write path warm for `receive-pack`.
- **Object storage** stores LFS objects, archives, and large immutable artifacts.
- **Search index** receives repository indexing hooks without blocking Git writes.

## Human actors

- **Developer** opens pull requests, comments, reviews, runs pipelines, and investigates failures.
- **Repository admin** creates repositories, branch protection, ref policies, webhook subscriptions, and triage views.
- **Platform engineer** installs Krate, manages runner pools, admission rollout, observability, backup, and release gates.
- **Team lead** uses views and selectors to triage cross-repository work.

## Machine actors

- **Controllers** reconcile resource state and patch status.
- **Runner jobs** execute pipeline steps with scoped service-account identity.
- **Admission policies** validate mutations in audit or enforce mode.
- **Webhook dispatchers** sign, deliver, retry, and replay outbound events.
- **Git clients** use smart HTTP/SSH routes resolved by the Gitea backend integration.

## Non-negotiable assumptions

- Kubernetes RBAC remains authoritative for user and machine actions.
- UI state must be explainable as resources, YAML, events, and status.
- High-cardinality activity must not overload etcd.
- Untrusted fork work must not access secrets or the cluster API.
- Operations must be installable, observable, backupable, restorable, and release-gated.
