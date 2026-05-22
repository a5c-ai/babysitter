# Org resource model delta spec

## Purpose

This document captures the concrete resource-model delta between the current Krate core and the proposed org-scoped agent/memory layer. The current model already includes `Organization` and `OrgNamespaceBinding`; the agent memory work should extend that model consistently instead of creating a parallel tenant system.

## Existing core model anchors

Current core resource definitions already include:

- `Organization` as platform identity with a bound tenant namespace;
- `OrgNamespaceBinding` as the binding from org to namespace;
- `Repository`, `User`, `Team`, `Invite`, `IdentityMapping`, `AuthProvider`, `SSHKey`, `RepositoryPermission`, `WebhookSubscription`, `RefPolicy`, `BranchProtection`, `RunnerPool`, `View`, and `Selector` with `organizationRef` requirements;
- aggregated `PullRequest`, `Issue`, `Review`, `Pipeline`, `Job`, and `WebhookDelivery` with `organizationRef` requirements.

Agent resources should follow the same storage split and naming style.

## Config resources to add

| Kind | Context | Required spec | Notes |
| --- | --- | --- | --- |
| `AgentStack` | agents | `organizationRef`, `baseAgent`, `adapter`, `runtimeIdentity` | org-scoped reusable agent definition. |
| `AgentSubagent` | agents | `organizationRef`, `stackRef`, `role` | child-agent definition. |
| `AgentToolProfile` | agents | `organizationRef`, `allowedTools` | native tool policy. |
| `AgentMcpServer` | agents | `organizationRef`, `endpoint`, `transport` | MCP server config. |
| `AgentSkill` | agents | `organizationRef`, `source`, `capabilities` | skill definition and dependencies. |
| `AgentTriggerRule` | agents | `organizationRef`, `sources`, `agentStack` | webhook/CI/issue/PR/manual trigger policy. |
| `AgentContextLabel` | agents | `organizationRef`, `promptFragment`, `allowedSources` | reviewed context snippet. |
| `AgentWorkspacePolicy` | agents | `organizationRef`, `mode`, `retentionPolicy` | worktree/runtime policy. |
| `AgentServiceAccount` | identity | `organizationRef`, `serviceAccountName` | org namespace ServiceAccount binding. |
| `AgentRoleBinding` | identity | `organizationRef`, `subject`, `roleRef` | desired RBAC binding. |
| `AgentSecretGrant` | identity | `organizationRef`, `subject`, `secretRef` | secret key access. |
| `AgentConfigGrant` | identity | `organizationRef`, `subject`, `configMapRef` | ConfigMap key access. |
| `AgentMemoryRepository` | agents | `organizationRef`, `repositoryRef`, `defaultBranch` | org company brain repo. |
| `AgentMemorySource` | agents | `organizationRef`, `repositoryRef`, `include` | memory read/query policy. |
| `AgentMemoryOntology` | agents | `organizationRef`, `memoryRepository`, `ontologyPath` | ontology validation policy. |
| `AgentMemoryAssociation` | agents | `organizationRef`, `memoryRef`, `targetRef` | memory-to-resource edge. |

## Aggregated resources to add

| Kind | Context | Required spec | Notes |
| --- | --- | --- | --- |
| `AgentDispatchRun` | agents | `organizationRef`, `repository`, `agentStack`, `sourceRefs` | CI-like agent run. |
| `AgentDispatchAttempt` | agents | `organizationRef`, `agentDispatchRun`, `attemptReason` | retry/fork attempt. |
| `AgentSession` | agents | `organizationRef`, `agentMuxSessionId`, `dispatchRun` | Agent Mux session projection. |
| `AgentWorkspace` | agents | `organizationRef`, `repository`, `workspacePath` | worktree/runtime state. |
| `AgentApproval` | agents | `organizationRef`, `dispatchRun`, `action` | human approval state. |
| `AgentContextBundle` | agents | `organizationRef`, `dispatchRun`, `digest` | immutable context snapshot. |
| `AgentArtifact` | agents | `organizationRef`, `dispatchRun`, `kind`, `digest` | run output. |
| `AgentTriggerExecution` | agents | `organizationRef`, `triggerRule`, `sourceEvent` | trigger evaluation. |
| `AgentMemorySnapshot` | agents | `organizationRef`, `memoryRepository`, `resolvedCommit` | pinned memory snapshot. |
| `AgentMemoryQuery` | agents | `organizationRef`, `snapshotRef`, `query` | graph/frontmatter/grep query. |
| `AgentMemoryUpdate` | agents | `organizationRef`, `memoryRepository`, `changes` | memory PR/update proposal. |
| `AgentRunMemoryImport` | agents | `organizationRef`, `memoryRepository`, `source` | curated `.a5c`/session import. |
| `AgentRunJournalEvent` | agents | `organizationRef`, `runRef`, `sequence`, `digest` | imported journal event projection. |

## Schema conventions

All added resources should use:

```yaml
metadata:
  namespace: krate-org-a5c
  labels:
    krate.a5c.ai/org: a5c
spec:
  organizationRef: a5c
status:
  phase: Pending
  conditions: []
```

`organizationRef` is required even when namespace can imply org, because aggregated API resources may be stored outside etcd and need an explicit partition key.

## Index requirements

Aggregated tables need org-first compound indexes:

- `(organization_ref, repository, created_at)` for repository activity;
- `(organization_ref, phase, updated_at)` for dashboards;
- `(organization_ref, agent_stack, created_at)` for agent run lists;
- `(organization_ref, memory_repository, resolved_commit)` for memory snapshots;
- `(organization_ref, source_run, created_at)` for memory imports;
- `(organization_ref, work_item_ref)` for issue/session/workspace links.

## Admission requirements

- `organizationRef` must match namespace binding for namespaced resources.
- Aggregated resources must store org even when created from a namespaced parent.
- Cross-org target refs are invalid unless `OrgSharingPolicy` admits them.
- Secret and ConfigMap refs must name resources in the org namespace unless a future replication policy exists.
- Memory repository refs must belong to the same org as the dispatch or import.

## Acceptance criteria

- A resource implementer can add agent/memory kinds to `src/resource-model.js` without inventing new storage categories.
- Every new kind has `organizationRef` and org labels.
- List/watch APIs can filter by org before repository, stack, run, or memory filters.
- Package validation can assert the full set of org-scoped CRDs and examples.

## Package validation additions

Package validation should eventually assert:

- every new agent/memory kind has a resource definition;
- every config kind has a CRD example with `organizationRef`;
- every aggregated kind has an API schema example with `organizationRef`;
- org-scoped labels are present in examples;
- `AgentRunMemoryImport` examples include redaction and retention policy;
- memory snapshot examples include resolved commit and digest fields;
- route docs refer to `/orgs/[org]` canonical paths.
