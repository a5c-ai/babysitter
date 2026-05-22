# Agent CRD schema spec

## Purpose

This document defines the agent resource schema shape that should be added to Krate when implementation starts. It is grounded in the current Krate model:

- `src/resource-model.js` currently separates low-cardinality `CONFIG_KINDS` from high-cardinality `AGGREGATED_KINDS`.
- Every resource schema uses `apiVersion: krate.a5c.ai/v1alpha1`, `metadata.name`, `spec`, and `status.storage/phase/conditions`.
- `src/kubernetes-controller.js` exposes `KRATE_RESOURCES` through Kubernetes-style plural resources.
- `apps/web/app/api/controller/resources` already lists/applies resources through `createKrateApiController()`.

Agent resources should follow the same pattern rather than introducing a second API style.

## Resource classification

### Add to `CONFIG_KINDS`

These are declarative, low-cardinality, reviewable configuration resources:

| Kind | Plural | Context | Required spec | Storage |
| --- | --- | --- | --- | --- |
| `AgentStack` | `agentstacks` | `agents` | `baseAgent`, `adapter`, `runtimeIdentity` | etcd |
| `AgentSubagent` | `agentsubagents` | `agents` | `rolePrompt`, `taskKinds` | etcd |
| `AgentToolProfile` | `agenttoolprofiles` | `agents` | `filesystemPolicy`, `approvalPolicyByTool` | etcd |
| `AgentMcpServer` | `agentmcpservers` | `agents` | `transport`, `scope` | etcd |
| `AgentSkill` | `agentskills` | `agents` | `format`, `sourceRef` | etcd |
| `AgentTriggerRule` | `agenttriggerrules` | `agents` | `sources`, `agentStack`, `taskKind` | etcd |
| `AgentContextLabel` | `agentcontextlabels` | `agents` | `promptFragment`, `allowedSources` | etcd |
| `AgentWorkspacePolicy` | `agentworkspacepolicies` | `agents` | `mode`, `retentionPolicy` | etcd |
| `AgentServiceAccount` | `agentserviceaccounts` | `identity` | `namespace`, `serviceAccountName` | etcd |
| `AgentRoleBinding` | `agentrolebindings` | `identity` | `subject`, `roleRef`, `scope` | etcd |
| `AgentSecretGrant` | `agentsecretgrants` | `identity` | `subject`, `secretRef`, `purpose` | etcd |
| `AgentConfigGrant` | `agentconfiggrants` | `identity` | `subject`, `configMapRef`, `purpose` | etcd |

### Add to `AGGREGATED_KINDS`

These are execution records or projections that can grow quickly:

| Kind | Plural | Context | Required spec | Storage |
| --- | --- | --- | --- | --- |
| `AgentDispatchRun` | `agentdispatchruns` | `agents` | `repository`, `sourceRefs`, `agentStack`, `taskKind` | postgres |
| `AgentDispatchAttempt` | `agentdispatchattempts` | `agents` | `agentDispatchRun`, `attemptReason`, `agentStackSnapshot` | postgres |
| `AgentSession` | `agentsessions` | `agents` | `agentMuxSessionId`, `dispatchRun` | postgres |
| `AgentWorkspace` | `agentworkspaces` | `agents` | `repository`, `workspacePath`, `ownership` | postgres |
| `AgentApproval` | `agentapprovals` | `agents` | `dispatchRun`, `action`, `requestedBy` | postgres |
| `AgentContextBundle` | `agentcontextbundles` | `agents` | `dispatchRun`, `digest`, `sources` | postgres/object storage |
| `AgentArtifact` | `agentartifacts` | `agents` | `dispatchRun`, `kind`, `digest` | postgres/object storage |
| `AgentReviewArtifact` | `agentreviewartifacts` | `agents` | `dispatchRun`, `targetRef`, `decision` | postgres |
| `AgentTriggerExecution` | `agenttriggerexecutions` | `agents` | `triggerRule`, `sourceEvent`, `decision` | postgres |
| `AgentCapabilityRequirement` | `agentcapabilityrequirements` | `agents` | `ownerRef`, `requiredRoles` | postgres projection |
| `WorkItemSessionLink` | `workitemsessionlinks` | `agents` | `workItemRef`, `agentSession` | postgres |
| `WorkItemWorkspaceLink` | `workitemworkspacelinks` | `agents` | `workItemRef`, `workspace` | postgres |

## Shared schema conventions

Every agent kind should follow the current `resourceSchemaForKind()` contract:

```yaml
apiVersion: krate.a5c.ai/v1alpha1
kind: AgentStack
metadata:
  name: claude-code-ci-repair
  namespace: krate-system
  labels:
    a5c.ai/owner: platform
    krate.a5c.ai/repository: krate
spec: {}
status:
  storage: etcd
  phase: Ready
  conditions: []
```

Required shared fields:

- `metadata.name`: stable resource name.
- `metadata.namespace`: defaulted by `withKrateDefaults()` when missing.
- `metadata.labels`: searchable ownership, repository, stack, trigger, and source labels.
- `spec`: desired state or immutable execution request.
- `status.phase`: summary state for UI tables.
- `status.conditions`: typed readiness/blocked/drift details.
- `status.observedGeneration`: generation reconciled by the controller.

Condition shape:

```yaml
- type: Ready
  status: "False"
  reason: MissingSecretGrant
  message: github-commenter requires Secret krate-secrets/github-writeback:token.
  observedGeneration: 4
  lastTransitionTime: "2026-05-10T12:00:00Z"
```

Condition types should be stable enums. `message` is for humans and must not be parsed by controllers.

## Core config schemas

### `AgentStack.spec`

```yaml
baseAgent: claude-code
adapter: agent-mux.claude-code
provider: anthropic
model: claude-sonnet-4-5
prompt:
  system: string
  developer: string
agentsDocRef:
  source: repository
  path: AGENTS.md
approvalMode: prompt
runtimeIdentity:
  serviceAccountRef: agent-claude-code-ci-repair
toolProfileRef: repo-write-safe
mcpServerRefs: []
skillRefs: []
subagentRefs: []
contextLabelRefs: []
workspacePolicyRef: isolated-worktree-default
runnerPool: untrusted-linux
permissionRefs:
  roleBindings: []
  secretGrants: []
  configGrants: []
secretPolicy:
  allowOnForks: false
  allowedSecretRefs: []
writeBackPolicy:
  requireApproval: true
  allowedTargets: []
```

`AgentStack.status.conditions` must include: `CapabilitiesResolved`, `RuntimeIdentityReady`, `RolesAdmitted`, `SecretsAdmitted`, `ConfigAdmitted`, `ToolsAdmitted`, `McpHealthy`, `SkillsValidated`, `SubagentsValid`, `PolicyAdmitted`, `Ready`.

### `AgentTriggerRule.spec`

```yaml
lifecycleState: active
sources: [ci, issue-comment]
match:
  repository: krate
  eventTypes: []
  branches:
    include: []
    exclude: []
agentStack: claude-code-ci-repair
taskKind: ci-repair
promptTemplate: string
contextLabels: []
contextBundleTemplate:
  include: []
  maxBytes: 750000
  redactSecrets: true
runnerPool: untrusted-linux
approvalPolicy:
  requireFor: []
dedupePolicy:
  key: string
  window: 30m
concurrencyPolicy:
  mode: coalesce
writeBackPolicy:
  allowedTargets: []
```

### `AgentSecretGrant.spec`

```yaml
subject:
  kind: agent-stack
  name: claude-code-ci-repair
  serviceAccountRef: agent-claude-code-ci-repair
secretRef:
  namespace: krate-secrets
  name: anthropic-provider
  keys: [api-key]
purpose: model-provider-token
allowedRepositories: [krate]
allowedRefs:
  include: [refs/heads/main]
  exclude: [refs/pull/*/head]
allowedTriggerSources: [manual, ci]
mountPolicy: env
requiredApproval: on-untrusted-ref
rotationPolicy:
  maxAgeDays: 90
```

### `AgentConfigGrant.spec`

```yaml
subject:
  kind: skill
  name: focused-test-selection
  stackRef: claude-code-ci-repair
configMapRef:
  namespace: krate-config
  name: npm-test-policy
  keys: [allowed-scripts.json]
purpose: skill-config
allowedRepositories: [krate]
mountPolicy: file
```

## Execution record schemas

### `AgentDispatchRun.spec`

```yaml
repository: krate
ref: refs/pull/42/head
branch: user/fix-ci
sha: abcdef1234567890
sourceEvent:
  kind: WebhookDelivery
  name: delivery-01hx
sourceRefs:
  pullRequest: krate/42
  pipeline: pipeline-01hx
  job: job-01hx-test
  triggerRule: failed-pr-check-repair
agentStack: claude-code-ci-repair
taskKind: ci-repair
contextBundleRef: acb-01hx
workspaceRef: workspace-krate-pr-42
runnerPool: untrusted-linux
approvalPolicy:
  requireWriteBackApproval: true
```

`status` must include queue times, attempt refs, Agent Mux IDs, source breadcrumbs, artifacts, approvals, cost, event cursor, permission snapshot digest, and terminal reason.

### `AgentDispatchAttempt.spec`

```yaml
agentDispatchRun: adr-01hx-ci-repair
attemptReason: initial
agentStackSnapshot:
  name: claude-code-ci-repair
  generation: 7
contextBundleDigest: sha256:...
permissionSnapshotDigest: sha256:...
workspaceRef: workspace-krate-pr-42
runnerPool: untrusted-linux
```

`status.runtimeIdentity` and `status.runnerIdentity` are immutable after launch.

## Labels and indexes

Required labels for list/watch performance:

- `krate.a5c.ai/repository`
- `krate.a5c.ai/agent-stack`
- `krate.a5c.ai/trigger-rule`
- `krate.a5c.ai/dispatch-run`
- `krate.a5c.ai/source-kind`
- `krate.a5c.ai/source-name`
- `krate.a5c.ai/runner-pool`
- `krate.a5c.ai/service-account`

These labels let existing `/api/controller/resources?kind=...` and `/api/watch/orgs/[org]/...` endpoints support repository-scoped views without inventing UI-only state.

## Implementation notes

- Add resource definitions first to `src/resource-model.js` and `src/kubernetes-controller.js`.
- Keep initial schemas compatible with `resourceSchemaForKind()` before adding deeper OpenAPI validation.
- CRDs in `charts/krate/templates/crds.yaml` should be generated or hand-written from this matrix.
- UI resource tables can display these kinds immediately through the existing controller resources API.
- Future typed routes should delegate to the same controller/resource gateway to avoid bypassing Kubernetes-style behavior.

## Company brain memory resources

Add memory resources alongside agent config and aggregated execution resources.

### Add to `CONFIG_KINDS`

| Kind | Plural | Context | Required spec | Storage |
| --- | --- | --- | --- | --- |
| `AgentMemoryRepository` | `agentmemoryrepositories` | `agents` | `repositoryRef`, `defaultBranch`, `layoutProfile` | etcd |
| `AgentMemorySource` | `agentmemorysources` | `agents` | `repositoryRef`, `appliesTo`, `include` | etcd |
| `AgentMemoryOntology` | `agentmemoryontologies` | `agents` | `memoryRepository`, `ontologyPath` | etcd |
| `AgentMemoryAssociation` | `agentmemoryassociations` | `agents` | `memoryRef`, `targetRef`, `relationship` | etcd |

### Add to `AGGREGATED_KINDS`

| Kind | Plural | Context | Required spec | Storage |
| --- | --- | --- | --- | --- |
| `AgentMemorySnapshot` | `agentmemorysnapshots` | `agents` | `memoryRepository`, `requestedRef`, `resolvedCommit` | postgres/object storage |
| `AgentMemoryQuery` | `agentmemoryqueries` | `agents` | `snapshotRef`, `requester`, `query` | postgres/object storage |
| `AgentMemoryUpdate` | `agentmemoryupdates` | `agents` | `memoryRepository`, `sourceRun`, `changes` | postgres/object storage |

`AgentDispatchRun`, `AgentDispatchAttempt`, and `AgentContextBundle` should link to memory snapshots by name and digest. Memory update resources should link back to source runs, artifacts, PRs, approvals, and audit events.

## Organization and run-memory resources

Org scoping adds top-level tenancy resources and Babysitter memory import resources.

### Add to `CONFIG_KINDS`

| Kind | Plural | Context | Required spec | Storage |
| --- | --- | --- | --- | --- |
| `Organization` | `organizations` | `core` | `namespaceName`, `slug` | etcd |
| `OrgNamespaceBinding` | `orgnamespacebindings` | `core` | `organizationRef`, `namespace` | etcd |
| `OrgSharingPolicy` | `orgsharingpolicies` | `core` | `sourceOrg`, `targetOrg`, `allowedRefs` | etcd |

### Add to `AGGREGATED_KINDS`

| Kind | Plural | Context | Required spec | Storage |
| --- | --- | --- | --- | --- |
| `AgentRunMemoryImport` | `agentrunmemoryimports` | `agents` | `organizationRef`, `memoryRepository`, `source`, `include` | postgres/object storage |
| `AgentRunJournalEvent` | `agentrunjournalevents` | `agents` | `organizationRef`, `runRef`, `sequence`, `digest` | postgres/object storage |

All existing and proposed agent resources should gain `spec.organizationRef` or derive it from namespace plus labels. Product data without org scope should fail admission unless it is installation/platform state.
