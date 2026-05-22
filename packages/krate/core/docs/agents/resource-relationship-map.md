# Agent resource relationship map

## Purpose

This document shows how the agent resources relate to Krate's existing repository, CI, webhook, identity, and UI resources. It is a navigation aid for implementers and reviewers.

## Existing Krate anchors

| Existing kind/surface | Agent relationship |
| --- | --- |
| `Repository` | root scope for stacks, triggers, workspaces, runs, permissions, and artifacts. |
| `PullRequest` | source for diagnosis/review/repair dispatches and write-back targets. |
| `Issue` | work item source for agent sessions, workspace links, and board flow. |
| `Pipeline` / `Job` | CI source and sibling display model for `AgentDispatchRun`. |
| `RunnerPool` | execution placement and trust tier for dispatch attempts. |
| `WebhookSubscription` / `WebhookDelivery` | incoming event source for `AgentTriggerRule`. |
| `User` / `Team` / `RepositoryPermission` | human identity and authorization inputs. |
| Native `ServiceAccount` / RBAC | authoritative agent, runner, and user permission enforcement. |
| Native `Secret` / `ConfigMap` | runtime secret/config sources admitted through grants. |

## Configuration relationship graph

```text
Repository
  -> AgentStack
    -> AgentToolProfile
      -> AgentCapabilityRequirement
      -> AgentSecretGrant / AgentConfigGrant
    -> AgentMcpServer
      -> AgentCapabilityRequirement
      -> AgentSecretGrant / AgentConfigGrant
    -> AgentSkill
      -> AgentCapabilityRequirement
      -> AgentSecretGrant / AgentConfigGrant
    -> AgentSubagent
      -> AgentToolProfile subset
      -> AgentSkill subset
      -> AgentMcpServer subset
    -> AgentWorkspacePolicy
    -> AgentServiceAccount
      -> AgentRoleBinding
    -> AgentContextLabel
  -> AgentTriggerRule
    -> AgentStack
    -> AgentContextLabel
    -> RunnerPool
```

## Execution relationship graph

```text
WebhookDelivery / Pipeline / Job / Issue / PullRequest / manual UI action
  -> AgentTriggerExecution
  -> AgentContextBundle
  -> permission review snapshot
  -> AgentDispatchRun
    -> AgentDispatchAttempt
      -> AgentMuxRunId / AgentMuxSessionId
      -> AgentSession
      -> AgentWorkspace
      -> AgentArtifact / AgentReviewArtifact
      -> AgentApproval
    -> WorkItemSessionLink
    -> WorkItemWorkspaceLink
```

## Source-to-run relationships

| Source | Creates/links | Notes |
| --- | --- | --- |
| failed `Job` | `AgentTriggerExecution`, `AgentDispatchRun` | shows beside pipeline/job row. |
| PR comment/mention | `AgentTriggerExecution`, `AgentContextBundle` | actor and comment are source refs. |
| issue label | `AgentTriggerExecution`, work-item links | label cannot grant permissions. |
| manual Code dispatch | `AgentContextBundle`, `AgentDispatchRun` | selected path/ref included. |
| webhook replay | new `AgentTriggerExecution` | dedupe may coalesce with existing run. |
| approval decision | write-back action and audit event | references artifact digest. |

## Permission relationship graph

```text
User / Team / AgentStack / RunnerPool
  -> AgentServiceAccount
  -> AgentRoleBinding
    -> native Role / ClusterRole
    -> native RoleBinding / ClusterRoleBinding
  -> AgentSecretGrant
    -> native Secret metadata + selected keys
  -> AgentConfigGrant
    -> native ConfigMap metadata + selected keys
  -> AgentCapabilityRequirement
    -> stack readiness and dispatch permission review
```

## UI relationship map

| UI page | Primary resources | Secondary resources |
| --- | --- | --- |
| `/agents` | dispatches, approvals, stack readiness | trigger health, workspace attention |
| `/agents/stacks` | `AgentStack` | tools, MCP, skills, subagents, grants |
| `/agents/runs` | `AgentDispatchRun` | attempts, sessions, artifacts, approvals |
| `/agents/rules` | `AgentTriggerRule` | executions, deliveries, dry-runs |
| `/agents/workspaces` | `AgentWorkspace` | sessions, runs, issues, PRs |
| `/agents/approvals` | `AgentApproval` | artifacts, write-back targets |
| `/agents/secrets` | `AgentSecretGrant`, `AgentConfigGrant` | consumers, rotations, missing grants |
| `/orgs/[org]/repositories/[repo]/code` | repository path/ref | context bundle, dispatch composer |
| `/orgs/[org]/repositories/[repo]/pull-requests` | PR, checks | run/artifact/approval/write-back links |
| `/orgs/[org]/repositories/[repo]/runs` | pipelines/jobs | agent dispatch rows and artifacts |
| `/orgs/[org]/repositories/[repo]/settings/agents` | stack/rule/grant policy | generated YAML and permission review |

## Label and index strategy

All agent resources should use common labels so generic list/watch APIs can power repository pages:

- `krate.a5c.ai/repository`;
- `krate.a5c.ai/source-kind`;
- `krate.a5c.ai/source-name`;
- `krate.a5c.ai/agent-stack`;
- `krate.a5c.ai/dispatch-run`;
- `krate.a5c.ai/trigger-rule`;
- `krate.a5c.ai/workspace`;
- `krate.a5c.ai/service-account`;
- `krate.a5c.ai/runner-pool`.

## Deletion impact rules

Deleting or disabling a resource should show dependent resources first:

| Delete/disable target | Must warn about |
| --- | --- |
| `AgentStack` | trigger rules, active runs, sessions, workspace links. |
| `AgentToolProfile` | stacks and subagents that require it. |
| `AgentMcpServer` | skills/stacks/subagents and missing capability requirements. |
| `AgentSkill` | stacks/subagents using prompt fragments or output contracts. |
| `AgentSecretGrant` | tools/MCP/skills/model providers that become blocked. |
| `AgentConfigGrant` | skills/tools/MCP servers that become blocked. |
| `AgentServiceAccount` | stacks, runner pools, active attempts. |
| `AgentWorkspace` | sessions, runs, artifacts, work item links. |
| `AgentArtifact` | approvals/write-back records that reference its digest. |

## Acceptance criteria

- Implementers can trace every UI affordance to resources and controllers.
- Repository pages can query by labels rather than bespoke UI state.
- Deletion warnings identify dependent stacks/rules/runs/grants/artifacts.
- Permission review can explain a missing capability through the relationship graph.

## Memory relationship graph

```text
Organization
  -> AgentMemoryRepository
    -> AgentMemoryOntology
    -> AgentMemorySource
      -> Repository / Team / AgentStack / AgentTriggerRule
    -> AgentMemoryAssociation
      -> Repository / Service / AgentStack / Tool / Skill / Subagent / Issue / PullRequest

AgentTriggerExecution / manual dispatch
  -> AgentContextBundle
    -> AgentMemorySnapshot
      -> AgentMemoryQuery
      -> selected graph records
      -> selected Markdown records
      -> selected grep excerpts
  -> AgentDispatchRun
    -> AgentMemoryUpdate
      -> AgentApproval
      -> memory repository PR / merge commit
```

Deleting a memory source must warn about stacks, trigger rules, and dispatch composers that rely on it. Deleting or disabling a memory repository must block new required-memory dispatches while preserving historical `AgentMemorySnapshot` records.

## Org-scoped relationship root

```text
Organization
  -> Kubernetes Namespace
  -> Repository
  -> Deployment / Environment
  -> AgentStack / AgentTriggerRule / RunnerPool
  -> AgentMemoryRepository
    -> MEMORY.md
    -> BabysitterSession
    -> BabysitterRun
      -> RunJournalEvent
      -> RunTaskResult
      -> ArtifactManifest
```

All relationship queries should include org. A resource without org scope is either installation/platform state or invalid for product data.
