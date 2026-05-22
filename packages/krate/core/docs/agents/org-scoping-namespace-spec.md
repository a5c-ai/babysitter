# Org scoping and namespace spec

## Purpose

Every Krate resource that belongs to a business tenant must be scoped under an organization. Each organization owns a Kubernetes namespace, and repositories, deployments, agents, runners, triggers, memory repositories, secrets, config, sessions, workspaces, and audit records must resolve through that org boundary before any controller side effect occurs.

## Org namespace model

```text
Organization a5c
  -> Kubernetes namespace krate-org-a5c
  -> repositories
  -> deployments/environments
  -> runner pools and service accounts
  -> agent stacks, triggers, skills, tools, subagents
  -> company brain memory repository
  -> sessions, dispatch runs, workspaces, journals
  -> secrets, config maps, roles, role bindings
```

The namespace is the default isolation unit. Cluster-scoped resources exist only for installation, CRDs, API aggregation, shared controllers, and explicitly shared platform services.

## Core resources

### `Organization`

```yaml
kind: Organization
metadata:
  name: a5c
spec:
  namespaceName: krate-org-a5c
  displayName: a5c.ai
  slug: a5c
  defaultVisibility: internal
  memoryRepositoryRef: org-company-brain
  policyProfileRef: default-org-policy
status:
  phase: Ready
  namespaceReady: true
```

### `OrgNamespaceBinding`

```yaml
kind: OrgNamespaceBinding
spec:
  organizationRef: a5c
  namespace: krate-org-a5c
  createNamespace: true
  labels:
    krate.a5c.ai/org: a5c
  serviceAccountPolicy:
    defaultRunnerPrefix: runner-
    defaultAgentPrefix: agent-
```

## Required labels

All namespaced resources must carry:

- `krate.a5c.ai/org`;
- `krate.a5c.ai/namespace`;
- `krate.a5c.ai/repository` when repository-scoped;
- `krate.a5c.ai/environment` when deployment-scoped;
- `krate.a5c.ai/agent-stack` when agent-scoped.

Controllers must reject cross-org references unless a cluster-admin has created an explicit sharing policy.

## Scope hierarchy

```text
Cluster
  -> Organization
    -> Repository
      -> PullRequest / Issue / Pipeline / Job / WebhookDelivery
      -> AgentWorkspace / AgentSession / AgentDispatchRun
    -> Deployment / Environment
      -> release policy / runtime status / environment secrets
    -> CompanyBrainMemory
      -> AgentMemoryRepository / Source / Snapshot / Query / Update
```

Repositories, deployments, and memory repositories are sibling org-scoped domains. Agent dispatches may reference all three only through org-compatible resource refs.

## RBAC requirements

- Org admins can manage org-scoped resources within their namespace.
- Repo admins can manage repository settings but cannot read unrelated memory paths or deployment secrets.
- Runner ServiceAccounts are namespaced to the org and bound only to permitted repo/ref/environment scopes.
- Agent ServiceAccounts are namespaced to the org and cannot mount secrets/config from another org namespace.
- Memory read/update grants are org-scoped and path/kind-scoped.
- Cross-org actions require an explicit `OrgSharingPolicy` and audit event.

## UI requirements

- Global navigation starts with an org switcher.
- Repository URLs should be org-aware, for example `/orgs/[org]/repositories/[repo]/code`, while legacy `/orgs/[org]/repositories/[repo]` may redirect when unambiguous.
- Agent pages are org-scoped by default: `/orgs/[org]/agents/runs`, `/orgs/[org]/agents/memory`, `/orgs/[org]/agents/settings`.
- Deployment and environment pages are org-scoped and can link to repository runs and agent dispatches.
- Resource YAML panels must show namespace and org labels.

## Acceptance criteria

- Creating an organization creates or binds exactly one Kubernetes namespace.
- Creating a repository, deployment, runner pool, agent stack, trigger, memory source, or secret grant requires an org.
- Controllers reject cross-org references by default.
- UI always shows current org context and never mixes runs, memory, secrets, or workspaces across orgs.
- Audit events include org, namespace, actor, resource ref, and source controller.

## Detailed companion specs

- [Org route and resource model spec](./org-route-resource-model-spec.md) expands route shape, API shape, resource refs, deployment scope, and controller enforcement.
- [Agent run memory import spec](./agent-run-memory-import-spec.md) expands how `MEMORY.md`, sessions, `.a5c` journals, task results, artifacts, and retrospectives enter the org company brain.
