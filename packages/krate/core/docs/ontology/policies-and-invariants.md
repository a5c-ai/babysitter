# Policies and Invariants

## RBAC

- Users must be mapped from OIDC identity into Kubernetes-style groups.
- `system:authenticated` can read and watch, not mutate privileged resources.
- Developers can mutate review and CI records.
- Repo admins can mutate repository governance resources.
- Platform engineers can mutate all Krate resources.

## Admission rollout

- Policies support `audit` mode for warnings without blocking.
- Policies support `enforce` mode for fail-closed denial.
- Rollout sequence is preview, audit, then enforce.

## Isolation

- Fork PR jobs are untrusted.
- Untrusted jobs receive no secrets and no cluster API access.
- Trusted jobs receive only explicitly scoped capabilities.

## Git governance

- `BranchProtection` can require PR flow for protected refs.
- `RefPolicy` can deny internal refs and unsafe updates.
- Receive-pack must emit events with correlation to repository and Gitea backend.

## Audit and transparency

- Every mutation produces an audit entry with actor, groups, operation, resource, warnings, and allowed status.
- UI actions must expose equivalent YAML/resource state.
- Release gates must include docs coverage, tests, build, and smoke.
