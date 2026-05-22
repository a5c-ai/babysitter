# Data Plane Component Requirements

## Purpose

The data plane serves Git repositories through a Kubernetes-hosted Gitea backend while avoiding the impossible one-PVC-per-repository model. It separates Kubernetes resource intent from Gitea repository hosting, persistent storage, object storage metadata, and code search hooks.

## Responsibilities

- Terminate smart-HTTP and SSH Git traffic through Gitea.
- Map repository identity to the Gitea backend and integration plan.
- Store repositories in Gitea-managed persistent Kubernetes storage.
- Store LFS objects, archives, and other large immutable objects in object storage.
- Expose indexing hooks for Zoekt search.

## API and resource surface

- Repository status must include Gitea backend integration and health.
- Gitea integration API must support route lookup, repo initialization, access checks, deploy keys, permissions, webhooks, and maintenance operations.
- Gitea must expose smart-HTTP and SSH entry points and API-backed repository integration.

## Requirements

- MVP must support a Kubernetes-hosted Gitea backend for `git-upload-pack`, `git-receive-pack`, SSH keys, permissions, protected branches, and webhooks.
- Architecture must allow Gitea backend scale-out without changing repository APIs.
- Writes must keep warm capacity; push traffic must not scale from zero.
- Reads may scale horizontally behind HPA.
- Receive-pack must evaluate compiled ref policy before accepting protected ref updates.

## Dependencies

- RWX storage class such as EFS or CephFS.
- Object storage for LFS and archives.
- Repository operator for Gitea initialization and integration planning.
- Identity/RBAC checks from control plane.
- Optional Zoekt search service.

## Security and policy

- Git operations must authorize against Kubernetes identity and repository policy.
- Custom hook execution must be sandboxed through WASM.
- Gitea backend pods must mount only needed config, credentials, and repository storage.

## Scaling and performance

- Each Gitea backend target is capacity-planned by repository count, storage, and I/O profiles.
- `git-upload-pack` scales on request rate.
- `git-receive-pack` scales on backlog with warm minimums.
- Search indexing must not starve Git read/write traffic.

## Failure modes

- Gitea backend unavailable: affected repositories show degraded status and API routes return actionable errors.
- RWX volume degraded: writes pause or fail closed to protect repository integrity.
- Object store unavailable: LFS/archive operations degrade separately from core Git refs where possible.
- Gitea route cannot resolve repository: request fails with correlation ID and resource status pointer.

## Observability

- Git operation latency and error rate by operation, repository, and Gitea backend.
- Gitea repository storage usage, inode usage, I/O wait, queue depth, and policy rejection count.
- Gitea route-cache hit rate and backend health.

## Acceptance criteria

- `git clone`, `git fetch`, and `git push` work against a repository created by `kubectl`.
- A protected branch update can be blocked by `RefPolicy`.
- Read traffic can scale without adding repository PVCs.
- Repository status exposes Gitea backend integration and health.

