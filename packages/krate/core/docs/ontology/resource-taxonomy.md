# Resource Taxonomy

## CRD-backed configuration resources

These are low-cardinality desired-state contracts and are safe for etcd-backed storage.

| Kind | Owner | Purpose |
| --- | --- | --- |
| `Organization` | Identity/data plane | Workspace organization, owners, teams, and default repository policy |
| `User` | Identity | Human account profile, sign-in state, and linked identities |
| `Team` | Identity | Team membership, maintainers, and repository permission grants |
| `Invite` | Identity | Pending invitation, role, requested teams, and expiry |
| `IdentityMapping` | Identity | Mapping between sign-in subjects, Kubernetes identities, and repository accounts |
| `AuthProvider` | Identity | Installation sign-in provider status and delegated identity settings |
| `Repository` | Data plane | Repository identity, visibility, Gitea hosting integration, object/search settings |
| `SSHKey` | Identity/data plane | User, deploy, and automation keys reconciled into repository hosting |
| `RepositoryPermission` | Identity/data plane | Collaborator and team grants synced to repository hosting |
| `WebhookSubscription` | Hooks/events | Endpoint, event filters, signing configuration, retry policy |
| `RefPolicy` | Data plane/hooks | Deny refs, force-push policy, signing and linear-history policy |
| `BranchProtection` | Data plane/control | PR requirement and protected ref rules |
| `RunnerPool` | Runners/CI | Runner capacity, scale limits, cache configuration |
| `View` | Web UI | Saved triage view and presentation contract |
| `Selector` | Web UI/control | Reusable label/query selector for workflows |

## Aggregated Postgres-backed resources

These are high-cardinality runtime records and must not store primary records in etcd.

| Kind | Owner | Purpose |
| --- | --- | --- |
| `PullRequest` | Control/UI | Review unit, refs, status, checks, merge lifecycle |
| `Issue` | Control/UI | Work item, labels, assignment, lifecycle |
| `Review` | Control/UI | Approval/comment/change-request records |
| `Pipeline` | Runners/CI | Pipeline run state and resume point |
| `Job` | Runners/CI | Step execution record and service-account scope |
| `WebhookDelivery` | Hooks/events | Durable delivery attempt, signature, response, replay chain |

## Taxonomy invariants

- Config resources can drive reconciliation and must remain small.
- Aggregated resources can be listed, watched, and label-selected through the API server but store primary state outside etcd.
- Every kind has metadata, spec, status, storage class, owner context, and executable tests.
