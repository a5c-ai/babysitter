# Resource Contracts

All resources use `apiVersion: krate.a5c.ai/v1alpha1`, `kind`, `metadata`, `spec`, and `status`.

## Common metadata

- `metadata.name` is required.
- `metadata.namespace` defaults to `default`.
- `metadata.labels` and `metadata.annotations` default to empty maps.
- `metadata.resourceVersion` increments on every stored mutation.

## Lifecycle contract

1. Caller submits a resource mutation.
2. Control plane normalizes metadata and validates kind support.
3. RBAC checks `user`, verb, kind, and namespace.
4. Admission policies evaluate in audit or enforce mode.
5. Resource is routed to etcd or Postgres by storage class.
6. Audit and watch events are emitted.
7. Status is patched by controllers or workflow services.

## Kind-specific contracts

- `User`, `Team`, `Invite`, `IdentityMapping`, and `AuthProvider` drive sign-in, admin-managed user mapping, teams, invites, and access configuration.
- `RepositoryPermission` and `SSHKey` reconcile repository access and key material into the repository backend.
- `Repository` status includes Gitea backend integration and health.
- `PullRequest` includes repository, source ref, target ref, title, and phase.
- `Pipeline` includes repository, ref, steps, trust tier, and resume point.
- `Job` includes service-account scopes, step name, and isolation metadata.
- `RunnerPool` includes warm replicas, maximum replicas, and cache policy.
- `WebhookDelivery` includes request, signature, response, phase, latency, and replay metadata.
- `RefPolicy` and `BranchProtection` are enforced before protected writes.
- `View` and `Selector` are label/query definitions used by UI and workflows.

## Validation requirements

- Unsupported kinds fail fast.
- Missing names fail fast.
- Selectors match labels deterministically.
- Storage class is inspectable in status.
