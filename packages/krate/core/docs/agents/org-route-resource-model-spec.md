# Org route and resource model spec

## Purpose

Krate should behave as an organization-first forge. This document defines how org scope affects routes, API paths, resource refs, namespaces, controllers, deployments, repositories, and agent memory.

## Route model

Preferred UI routes:

| Route | Purpose |
| --- | --- |
| `/orgs` | list visible orgs and recent activity. |
| `/orgs/[org]` | org dashboard: repositories, deployments, agents, memory, runners, audit. |
| `/orgs/[org]/repositories` | org repository list. |
| `/orgs/[org]/repositories/[repo]/code` | repository code browser. |
| `/orgs/[org]/repositories/[repo]/issues` | issues and work item boards. |
| `/orgs/[org]/repositories/[repo]/pull-requests` | PRs and reviews. |
| `/orgs/[org]/repositories/[repo]/runs` | CI and agent dispatch rows. |
| `/orgs/[org]/deployments` | deployment/environment inventory. |
| `/orgs/[org]/agents` | agent dashboard. |
| `/orgs/[org]/agents/runs/[run]` | dispatch detail and Agent Mux session. |
| `/orgs/[org]/agents/memory` | company brain memory. |
| `/orgs/[org]/settings` | org RBAC, namespace, policies, billing/cost if applicable. |

Non-org repository and deployment routes are not part of the product surface. Users enter repository, deployment, run, and settings flows through `/orgs/[org]/...` so the current org is always explicit.

## API route model

Preferred API routes:

| Route | Purpose |
| --- | --- |
| `/api/orgs/[org]/resources` | generic org-scoped resource list/apply. |
| `/api/orgs/[org]/repositories/[repo]/...` | repository-scoped actions. |
| `/api/orgs/[org]/deployments/[deployment]/...` | deployment-scoped actions. |
| `/api/orgs/[org]/agents/runs` | dispatch list/create. |
| `/api/orgs/[org]/agents/memory/query` | memory query. |
| `/api/orgs/[org]/agents/memory/import-babysitter-run` | run memory import. |
| `/api/watch/orgs/[org]/...` | org-scoped watches. |

Non-org API routes must not operate on org resources. Organization work is always explicit through `/orgs/[org]`, `/api/orgs/[org]/...`, or `/api/watch/orgs/[org]/...`.

## Resource reference shape

Every product resource should either include `spec.organizationRef` or be namespaced under an org namespace where org can be inferred.

```yaml
metadata:
  namespace: krate-org-a5c
  labels:
    krate.a5c.ai/org: a5c
spec:
  organizationRef: a5c
```

Cross-resource refs should include org when ambiguity is possible:

```yaml
repositoryRef:
  organization: a5c
  name: krate
deploymentRef:
  organization: a5c
  name: krate-web
memoryRepositoryRef:
  organization: a5c
  name: org-company-brain
```

## Deployment scoping

Deployments and environments are org siblings to repositories, not global resources.

```text
Organization
  -> Repository
  -> Deployment
    -> Environment
    -> ReleasePolicy
    -> RuntimeStatus
    -> DeploymentSecretGrant
  -> AgentDispatchRun
    -> may target Repository and Deployment in same org
```

Agent dispatches that operate on deployments must use an org ServiceAccount and deployment-scoped grants. A repository agent cannot mutate a deployment in another org.

## Namespace enforcement

Controllers must enforce:

- resource namespace matches org namespace;
- `metadata.labels[krate.a5c.ai/org]` matches `spec.organizationRef`;
- referenced repository/deployment/memory/secret/config resources belong to the same org;
- ServiceAccount tokens are mounted only from the org namespace;
- cross-org refs require `OrgSharingPolicy` and explicit audit.

## UI behavior

- The org switcher is global and persistent.
- Breadcrumbs always start with org.
- Search results group by org and hide unauthorized orgs entirely.
- YAML previews show namespace, org label, and `organizationRef`.
- Copyable `kubectl` examples include `-n <org-namespace>`.
- Empty states explain when a user has access to an org but no repositories, deployments, agents, or memory sources.

## Controller behavior

```text
watch event
  -> resolve namespace
  -> resolve organization
  -> validate labels and organizationRef
  -> validate same-org references
  -> compute effective RBAC and grants
  -> reconcile side effects in org namespace
  -> write status/audit with org and namespace
```

Controllers may use shared caches and cluster roles for observation, but all writes and runtime side effects are namespaced to the owning org unless explicitly platform-scoped.

## Acceptance criteria

- All repository, deployment, agent, runner, memory, session, workspace, secret, config, and audit records have org context.
- Ambiguous non-org routes are not product surface and return not found instead of selecting an org silently.
- API and watch routes are org-scoped by construction.
- Controller status and audit events include org and namespace.
- Cross-org references fail closed by default.

## Org-scoped resource kind matrix

| Domain | Resource examples | Org rule |
| --- | --- | --- |
| Core tenancy | `Organization`, `OrgNamespaceBinding`, `OrgSharingPolicy` | platform-owned; binds org to namespace. |
| Repositories | `Repository`, `PullRequest`, `Issue`, `Review`, `WebhookDelivery` | must match org namespace and labels. |
| Deployments | `Deployment`, `Environment`, release policies, runtime status | org-scoped sibling to repository. |
| Agents | `AgentStack`, `AgentTriggerRule`, `AgentDispatchRun`, `AgentSession`, `AgentWorkspace` | org-scoped; may reference same-org repo/deployment/memory. |
| Memory | `AgentMemoryRepository`, `AgentMemorySource`, `AgentMemorySnapshot`, `AgentRunMemoryImport` | org-scoped; memory repo per org by default. |
| Identity | `AgentServiceAccount`, `AgentRoleBinding`, `AgentSecretGrant`, `AgentConfigGrant` | namespace-bound to org. |
| Runners | `RunnerPool`, runner ServiceAccounts, workspace policies | org-scoped unless explicitly shared. |
| Audit | audit records, approval records, policy evaluations | include org and namespace always. |

## Admission checklist

Before accepting a create/update or starting a controller side effect, Krate must verify:

1. `organizationRef` exists and is visible to the actor.
2. target namespace equals the org namespace binding.
3. org labels match `organizationRef`.
4. referenced repository, deployment, memory repo, runner pool, secret, config, ServiceAccount, stack, trigger, session, and workspace are in the same org.
5. actor or ServiceAccount has Kubernetes RBAC for the namespace and Krate permission for the product action.
6. any cross-org reference has an admitted `OrgSharingPolicy`.
7. audit event can be emitted before external side effects.

## Org sharing policy

Cross-org sharing should be rare and explicit.

```yaml
kind: OrgSharingPolicy
metadata:
  name: a5c-read-shared-memory
spec:
  sourceOrg: a5c
  targetOrg: platform-shared
  allowedRefs:
    - kind: AgentMemoryRepository
      name: shared-engineering-memory
      permissions: [memory.graph.query, memory.records.read]
  expiresAt: 2026-06-01T00:00:00Z
  approvalPolicy:
    requiredApprovers: [team:security]
```

Sharing policies cannot grant Secret or ConfigMap values across orgs unless a separate secret replication policy exists.

## Migration requirements

- Add org columns/labels to aggregated tables before enforcing org filters.
- Backfill existing demo resources into a default org such as `a5c`.
- Keep org-scoped watch tests passing before enabling multi-org data.
- Flip admission from audit to enforce after backfill and UI route migration are complete.
