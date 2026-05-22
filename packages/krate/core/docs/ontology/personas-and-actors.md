# Personas and Actors

## Developer

- Groups: `system:authenticated`, `krate:developers`.
- Can create and update `PullRequest`, `Issue`, `Review`, `Pipeline`, and `Job` records.
- Cannot create repositories or branch protection without repo-admin rights.
- Needs UI flows for PR review, failed CI inspection, webhook visibility, and YAML/resource transparency.

## Repository admin

- Groups: `krate:repo-admins`.
- Can create repositories, branch protection, ref policies, webhook subscriptions, triage views, and selectors.
- Can replay webhook deliveries and manage repository-level governance.

## Platform engineer

- Groups: `krate:platform-engineers`.
- Can perform all verbs on all Krate kinds.
- Owns install, upgrade, observability, runner pools, backup/restore, and release gates.

## Controllers

- Use scoped service accounts.
- Patch status and reconcile desired state.
- Must not bypass admission-sensitive invariants unless explicitly modeled.

## Runner jobs

- Use service-account scopes derived from trust tier.
- Trusted jobs may access configured caches and publication credentials.
- Untrusted fork jobs have no secrets and no cluster API mutation.
