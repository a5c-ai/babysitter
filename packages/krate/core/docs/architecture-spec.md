# Architecture Spec

## Overview

Krate splits forge responsibilities into a Kubernetes API control plane, Argo CD GitOps reconciliation, and a Gitea-backed Git data plane. The control plane provides resource semantics, RBAC, admission, watch, and declarative automation. Argo CD owns application sync/prune/self-heal, while Gitea serves Git traffic, repository storage, SSH keys, collaborators/teams, branch protection, webhooks, object storage metadata, and code search hooks.

## Control plane

Krate keeps the HTTP API controller role separate from Kubernetes resource ownership. The Krate API controller owns route-level orchestration, request validation, workflow-shaped responses, degraded-state errors, and UI affordances. It delegates Kubernetes intent to a narrow resource gateway, and that gateway calls the Kubernetes resource client for list/get/apply/delete/watch and SubjectAccessReview checks. The Kubernetes resource client is the only layer that shells out to `kubectl` in the local implementation and does not own UI flow decisions or product workflows. Git smart-HTTP and SSH traffic remain outside those control-plane roles and cross only the Git data-plane boundary.

The control plane exposes two API classes:

- CRDs for low-cardinality declarative configuration: `Repository`, `WebhookSubscription`, `RefPolicy`, `BranchProtection`, `RunnerPool`, `View`, and `Selector`.
- Aggregated API resources for high-cardinality records: `PullRequest`, `Issue`, `Review`, `Pipeline`, `Job`, and `WebhookDelivery`.

The aggregated API server must preserve `kubectl` ergonomics while storing records in Postgres. This avoids using etcd as the database for comments, reviews, CI logs, and delivery records.

## Data plane

The data plane consists of:

- Gitea backend: Kubernetes-hosted Git server for smart-HTTP/SSH, repository APIs, SSH deploy keys, collaborators/teams, protected branches, and webhooks.
- Repository storage: Gitea-managed persistent storage on Kubernetes volumes.
- Object Storage: LFS objects, archives, artifacts, and large immutable blobs.
- Code Search: Zoekt service/indexer per repository cohort in documented post-MVP roadmap stages.

Routing resolves repository identity to the Gitea backend and records object/search placement separately. A single Gitea backend is enough for MVP, but the API and status model must not prevent future scale-out.

## Scaling model

- `git-upload-pack` reads scale horizontally on request rate.
- `git-receive-pack` writes target the Gitea backend and keep the receive path warm for backlog handling.
- Search indexers scale independently from Gitea backends and API servers.
- Runner pools scale by queue depth with `warmReplicas` and `maxReplicas`.

## Identity and authz flow

1. A human signs in with OIDC.
2. The UI exchanges or maps that identity into Kubernetes-compatible user/group identity.
3. Server Components and route handlers call the API server with the user identity.
4. Kubernetes RBAC and admission decide whether the action is allowed.
5. CI jobs receive projected ServiceAccount tokens scoped to the pipeline/job context.

## Policy model

- Branch and ref policy: `RefPolicy` CRDs reconcile into Gitea-backed branch protection and receive-pack policy checks.
- Outbound integrations: `WebhookSubscription` resources delivered through a durable queue and represented as `WebhookDelivery` records.
- Resource policy: Kubernetes admission webhooks validate and mutate Krate API resources directly.

## UI architecture

The UI uses Next.js App Router. Server Components fetch directly from the Kubernetes/aggregated API. Watch streams are converted to SSE through route handlers. The Git proxy route streams smart-HTTP to the Gitea-backed data plane. Monaco or CodeMirror powers diff and code views.

## Deployment topology

Minimum deployment includes:

- APIService and aggregated API server.
- CRDs and conversion/defaulting as needed.
- Postgres.
- Controllers/operators.
- Gitea backend.
- Argo CD Application for GitOps reconciliation.
- Object storage configuration.
- Next.js UI.
- Optional NATS, Kyverno, ARC, and ingress components depending on profile.

## Implemented controller boundary proof

The executable MVP keeps four controller-adjacent roles separate in code and tests:

- `krate-api-controller` is the HTTP/application facade. It owns request validation, workflow-shaped repository DTOs, API errors, degraded-state responses, and UI snapshot composition. It must not shell out to `kubectl`, own watch internals, or schedule reconciliation loops.
- `kubernetes-resource-gateway` is the narrow application port for Kubernetes resource operations. It owns list/get/apply/delete/watch delegation and Repository manifest application, but not page-flow or forge DTO decisions.
- `kubernetes-resource-client` owns local `kubectl` execution, SubjectAccessReview checks, Kubernetes API discovery, resource apply/delete, and watch streams.
- `krate-kubernetes-reconciler` owns Repository status projection, Gitea hosting intent, policy projection, and data-plane sync intent. It must not own HTTP routes or browser flows.

`tests/krate.test.js` locks these boundaries with contract tests, while `scripts/validate-ui.mjs` checks that the UI model exposes the API controller, resource gateway, Kubernetes client, Kubernetes reconciler, and Git data-plane lanes.

