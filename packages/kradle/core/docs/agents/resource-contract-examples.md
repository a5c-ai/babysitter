# Agent resource contract examples

## Purpose

This document gives concrete examples for the resource model described in the agent specs. The examples are intentionally implementation-ready but still docs-only. Field names may be refined during implementation, but the relationships should remain stable: stacks define launch capability, trigger rules decide when to dispatch, context labels explain prompt injection, dispatch runs track execution, and approvals gate privileged actions.

## Example: Claude Code repair stack

```yaml
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentStack
metadata:
  name: claude-code-ci-repair
  namespace: kradle-system
  labels:
    a5c.ai/owner: platform
spec:
  displayName: Claude Code CI Repair
  baseAgent: claude-code
  adapter: adapters.claude-code
  provider: anthropic
  model: claude-sonnet-4-5
  approvalMode: prompt
  prompt:
    system: >-
      You are a repository repair agent. Diagnose the failing CI signal, make the
      smallest safe change, and request approval before privileged write-back.
    developer: >-
      Preserve unrelated worktree changes. Prefer focused tests before broad gates.
  agentsDocRef:
    source: repository
    path: AGENTS.md
  toolProfileRef: repo-write-safe
  mcpServerRefs:
    - github-readonly
    - kradle-controller
  skillRefs:
    - ci-diagnosis
    - focused-test-selection
  subagentRefs:
    - ci-log-researcher
    - patch-reviewer
  contextLabelRefs:
    - ci-failure-summary
  workspacePolicyRef: isolated-worktree-default
  runnerPool: untrusted-linux
  runtimeIdentity:
    serviceAccountRef: agent-claude-code-ci-repair
  permissionRefs:
    roleBindings:
      - claude-code-ci-repair-repo-read-write
    secretGrants:
      - claude-code-github-comment-token
      - claude-code-anthropic-api-key
    configGrants:
      - claude-code-npm-config
  secretPolicy:
    allowOnForks: false
    allowedSecretRefs:
      - github-comment-token
  writeBackPolicy:
    requireApproval: true
    allowedTargets:
      - pull-request-comment
      - check-rerun
      - branch-push
status:
  phase: Ready
  conditions:
    - type: CapabilitiesResolved
      status: "True"
      reason: AdapterManifestLoaded
    - type: McpHealthy
      status: "True"
      reason: AllRequiredServersReady
    - type: Ready
      status: "True"
      reason: PolicyAdmitted
```

## Example: subagents

```yaml
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentSubagent
metadata:
  name: ci-log-researcher
spec:
  description: Reads CI logs and finds the smallest likely root cause.
  taskKinds:
    - research
    - triage
  rolePrompt: >-
    Inspect failing jobs, summarize root cause candidates, and do not edit files.
  workspaceScope: read-only
  maxParallelTasks: 2
  outputContract:
    format: markdown-summary
    requiredSections:
      - failing-signal
      - likely-root-cause
      - recommended-next-test
---
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentSubagent
metadata:
  name: patch-reviewer
spec:
  description: Reviews a proposed patch before write-back.
  taskKinds:
    - review
  rolePrompt: >-
    Review the diff for scope, safety, tests, and repository conventions.
  workspaceScope: branch-local
  maxParallelTasks: 1
  outputContract:
    format: checklist
```

## Example: tools, MCP, skills, and context labels

```yaml
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentToolProfile
metadata:
  name: repo-write-safe
spec:
  nativeTools:
    shell: true
    filesystem: true
    browser: false
  filesystemPolicy: workspace-write
  networkPolicy:
    default: deny
    allowHosts:
      - api.github.com
  allowedCommands:
    - git
    - npm
    - node
    - npx
  deniedCommands:
    - rm -rf /
    - git push --force
  approvalPolicyByTool:
    shell: prompt-on-denied-or-privileged
    filesystem: allow-workspace
    network: prompt
  auditLevel: full-redacted-transcript
---
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentMcpServer
metadata:
  name: kradle-controller
spec:
  transport: streamable-http
  url: http://kradle-controller.kradle-system.svc.cluster.local/mcp
  scope: repository
  allowedAgentStacks:
    - claude-code-ci-repair
  approvalPolicy: readonly-auto-write-prompt
status:
  health: Ready
  discoveredTools:
    - list_resources
    - get_resource
    - watch_resource
---
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentSkill
metadata:
  name: ci-diagnosis
spec:
  description: Standard Kradle CI failure diagnosis runbook.
  format: directory
  sourceRef:
    repository: kradle
    path: .agents/skills/ci-diagnosis
  requiredTools:
    - shell
  requiredMcpServers:
    - kradle-controller
  promptFragment: >-
    Start by identifying the exact failed job, command, and first actionable error.
---
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentContextLabel
metadata:
  name: ci-failure-summary
spec:
  displayName: CI failure summary
  promptFragment: >-
    Include failed workflow, job, step, command, exit code, first error block,
    changed files, branch, PR number, and rerun history.
  allowedSources:
    - pipeline
    - job
    - pull-request
  requiresReview: true
```

## Example: native ServiceAccount, roles, Secrets, and ConfigMaps

```yaml
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentServiceAccount
metadata:
  name: agent-claude-code-ci-repair
  namespace: kradle-system
spec:
  namespace: kradle-runners
  serviceAccountName: agent-claude-code-ci-repair
  owner:
    kind: AgentStack
    name: claude-code-ci-repair
  allowedRepositories:
    - kradle
  allowedRunnerPools:
    - untrusted-linux
  tokenAudience: kradle-agent-dispatch
  tokenExpirationSeconds: 3600
  automountServiceAccountToken: false
status:
  conditions:
    - type: ServiceAccountSynced
      status: "True"
      reason: NativeObjectReady
    - type: Ready
      status: "True"
      reason: TokenProjectionAllowed
---
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentRoleBinding
metadata:
  name: claude-code-ci-repair-repo-read-write
spec:
  subject:
    kind: agent-stack
    name: claude-code-ci-repair
    serviceAccountRef: agent-claude-code-ci-repair
  scope:
    kind: repository
    name: kradle
  roleRef:
    kind: ClusterRole
    name: kradle-agent-repository-repair
  resourceRules:
    - apiGroups: ["kradle.a5c.ai"]
      resources: ["repositories", "pullrequests", "pipelines", "jobs", "agentdispatchruns"]
      verbs: ["get", "list", "watch", "patch"]
  escalationPolicy: deny
status:
  conditions:
    - type: NativeBindingSynced
      status: "True"
      reason: RoleBindingReady
---
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentSecretGrant
metadata:
  name: claude-code-anthropic-api-key
spec:
  subject:
    kind: agent-stack
    name: claude-code-ci-repair
    serviceAccountRef: agent-claude-code-ci-repair
  secretRef:
    namespace: kradle-secrets
    name: anthropic-provider
    keys:
      - api-key
  purpose: model-provider-token
  allowedRepositories:
    - kradle
  allowedRefs:
    include:
      - refs/heads/staging
      - refs/heads/main
    exclude:
      - refs/pull/*/head
  mountPolicy: env
  requiredApproval: on-untrusted-ref
status:
  conditions:
    - type: SecretExists
      status: "True"
      reason: SecretFound
    - type: SubjectAuthorized
      status: "True"
      reason: GrantMatchesServiceAccount
---
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentSecretGrant
metadata:
  name: claude-code-github-comment-token
spec:
  subject:
    kind: tool
    name: github-commenter
    stackRef: claude-code-ci-repair
    serviceAccountRef: agent-claude-code-ci-repair
  secretRef:
    namespace: kradle-secrets
    name: github-writeback
    keys:
      - token
  purpose: tool
  allowedRepositories:
    - kradle
  allowedTriggerSources:
    - pull-request
    - ci
  mountPolicy: never-mount-pass-by-reference
  requiredApproval: always
---
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentConfigGrant
metadata:
  name: claude-code-npm-config
spec:
  subject:
    kind: skill
    name: focused-test-selection
    stackRef: claude-code-ci-repair
    serviceAccountRef: agent-claude-code-ci-repair
  configMapRef:
    namespace: kradle-config
    name: npm-test-policy
    keys:
      - allowed-scripts.json
  purpose: skill-config
  allowedRepositories:
    - kradle
  mountPolicy: file
```

## Example: capability requirement warning

```yaml
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentCapabilityRequirement
metadata:
  name: claude-code-ci-repair-requirements
spec:
  ownerRef:
    kind: AgentStack
    name: claude-code-ci-repair
  requiredSecretRefs:
    - reason: model-provider-token
      namespace: kradle-secrets
      name: anthropic-provider
      key: api-key
    - reason: tool
      toolRef: github-commenter
      namespace: kradle-secrets
      name: github-writeback
      key: token
  requiredConfigRefs:
    - reason: skill-config
      skillRef: focused-test-selection
      namespace: kradle-config
      name: npm-test-policy
      key: allowed-scripts.json
  requiredRoles:
    - kradle-agent-repository-repair
status:
  missingGrants:
    - kind: AgentSecretGrant
      reason: ToolSecretNotGranted
      message: github-commenter requires Secret kradle-secrets/github-writeback:token for stack claude-code-ci-repair.
  conditions:
    - type: GrantsResolved
      status: "False"
      reason: MissingSecretGrant
`

## Example: permission review response

Request:

```json
{
  "repository": "kradle",
  "ref": "refs/pull/42/head",
  "actor": "tmusk",
  "agentStack": "claude-code-ci-repair",
  "triggerSource": "pull-request-comment",
  "taskKind": "ci-repair",
  "runnerPool": "untrusted-linux"
}
```

Response when a tool secret is missing:

```json
{
  "decision": "denied",
  "runtimeIdentity": {
    "serviceAccountRef": "agent-claude-code-ci-repair",
    "ready": true
  },
  "runnerIdentity": {
    "runnerPool": "untrusted-linux",
    "serviceAccountRef": "runner-untrusted-linux",
    "ready": true
  },
  "requiredRoles": [
    {
      "roleRef": "kradle-agent-repository-repair",
      "allowed": true,
      "nativeReview": "allowed"
    }
  ],
  "requiredSecrets": [
    {
      "owner": { "kind": "tool", "name": "github-commenter" },
      "secretRef": "kradle-secrets/github-writeback",
      "keys": ["token"],
      "grant": null,
      "decision": "missing-grant"
    }
  ],
  "requiredConfigs": [
    {
      "owner": { "kind": "skill", "name": "focused-test-selection" },
      "configMapRef": "kradle-config/npm-test-policy",
      "keys": ["allowed-scripts.json"],
      "grant": "claude-code-npm-config",
      "decision": "allowed"
    }
  ],
  "missingGrants": [
    {
      "kind": "AgentSecretGrant",
      "suggestedName": "claude-code-github-comment-token",
      "reason": "ToolSecretNotGranted",
      "blocking": true
    }
  ],
  "reasons": [
    "github-commenter requires Secret kradle-secrets/github-writeback:token, but no AgentSecretGrant matches stack claude-code-ci-repair on refs/pull/42/head."
  ]
}
```

## Example: stack status after missing grant

```yaml
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentStack
metadata:
  name: claude-code-ci-repair
status:
  phase: Blocked
  conditions:
    - type: CapabilitiesResolved
      status: "True"
      reason: AdapterManifestLoaded
    - type: RuntimeIdentityReady
      status: "True"
      reason: ServiceAccountReady
    - type: RolesAdmitted
      status: "True"
      reason: RequiredRolesAllowed
    - type: SecretsAdmitted
      status: "False"
      reason: MissingSecretGrant
      message: github-commenter requires Secret kradle-secrets/github-writeback:token.
    - type: Ready
      status: "False"
      reason: PermissionRequirementsBlocked
```

## Example: audit event for grant creation

```yaml
apiVersion: kradle.a5c.ai/v1alpha1
kind: AuditEvent
metadata:
  name: audit-agent-secret-grant-01hx
spec:
  type: AgentSecretGrantApplied
  actor:
    kind: User
    name: tmusk
    kubernetesUser: tmusk@example.com
  target:
    kind: AgentSecretGrant
    name: claude-code-github-comment-token
  decision:
    nativeReview: allowed
    escalationReview: not-escalating
  details:
    subject:
      kind: tool
      name: github-commenter
      stackRef: claude-code-ci-repair
    secretRef:
      namespace: kradle-secrets
      name: github-writeback
      keys:
        - token
    purpose: tool
    allowedRepositories:
      - kradle
    allowedTriggerSources:
      - pull-request
      - ci
```
## Example: trigger rule for failed PR checks

```yaml
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentTriggerRule
metadata:
  name: failed-pr-check-repair
  namespace: kradle-system
spec:
  lifecycleState: active
  sources:
    - ci
    - check-suite
  match:
    repository: kradle
    eventTypes:
      - check_run.completed
      - workflow_job.completed
    conclusion:
      - failure
      - timed_out
    pullRequestRequired: true
    branches:
      include:
        - main
        - staging
    paths:
      include:
        - src/**
        - apps/web/**
        - tests/**
  agentStack: claude-code-ci-repair
  taskKind: ci-repair
  promptTemplate: >-
    Diagnose and repair the failed CI signal for {{ repository }} at {{ sha }}.
    Preserve unrelated changes and ask before write-back.
  contextLabels:
    - ci-failure-summary
  contextBundleTemplate:
    include:
      - changed-files
      - failing-job-log
      - pull-request-summary
      - recent-commits
      - repository-instructions
    maxBytes: 750000
    redactSecrets: true
  runnerPool: untrusted-linux
  approvalPolicy:
    requireFor:
      - write-back
      - secret-access
      - network-expanded
      - branch-push
  dedupePolicy:
    key: "{{ repository }}:{{ pullRequest.number }}:{{ check.name }}:{{ sha }}"
    window: 30m
  concurrencyPolicy:
    mode: coalesce
    maxActivePerPullRequest: 1
  writeBackPolicy:
    allowedTargets:
      - pull-request-comment
      - check-rerun
      - branch-push
status:
  lastTriggeredAt: "2026-05-10T00:00:00Z"
  executionSummary:
    created: 14
    coalesced: 3
    rejected: 2
```

## Example: dispatch run and attempt projection

```yaml
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentDispatchRun
metadata:
  name: adr-01hx-ci-repair
  namespace: kradle-system
spec:
  repository: kradle
  ref: refs/pull/42/head
  branch: user/fix-ci
  sha: abcdef1234567890
  sourceEvent:
    kind: WebhookDelivery
    name: delivery-01hx
  sourceRefs:
    pullRequest: kradle/42
    pipeline: pipeline-01hx
    job: job-01hx-test
    triggerRule: failed-pr-check-repair
  agentStack: claude-code-ci-repair
  taskKind: ci-repair
  contextBundleRef: acb-01hx
  workspaceRef: workspace-kradle-pr-42
  runnerPool: untrusted-linux
  approvalPolicy:
    requireWriteBackApproval: true
status:
  phase: waiting-for-approval
  agentMuxRunId: run_01hx
  agentMuxSessionId: ses_01hx
  childSubagentRuns:
    - ci-log-researcher/run_01hx_child_1
    - patch-reviewer/run_01hx_child_2
  artifacts:
    - kind: patch
      name: artifact-01hx-patch
    - kind: diagnosis
      name: artifact-01hx-diagnosis
  approvals:
    - approval-01hx-writeback
  eventCursor: "0000000000000104"
  conditions:
    - type: AgentMuxSessionBound
      status: "True"
      reason: SessionReady
    - type: ApprovalSatisfied
      status: "False"
      reason: WaitingForWriteBackApproval
---
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentDispatchAttempt
metadata:
  name: ada-01hx-ci-repair-1
spec:
  agentDispatchRun: adr-01hx-ci-repair
  attemptReason: initial
  agentStackSnapshot:
    name: claude-code-ci-repair
    generation: 7
  contextBundleDigest: sha256:9f5b...
  workspaceRef: workspace-kradle-pr-42
  runnerPool: untrusted-linux
status:
  agentMuxRunId: run_01hx
  agentMuxSessionId: ses_01hx
  queueEnteredAt: "2026-05-10T10:10:00Z"
  startedAt: "2026-05-10T10:10:24Z"
  exitReason: waiting-for-approval
```

## Example: approval request

```yaml
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentApproval
metadata:
  name: approval-01hx-writeback
spec:
  dispatchRun: adr-01hx-ci-repair
  attempt: ada-01hx-ci-repair-1
  requestedBy:
    kind: agent
    name: claude-code-ci-repair
  action:
    type: pull-request-comment
    target: kradle/42
    summary: Post diagnosis and attach proposed patch.
  policyReasons:
    - writeBackPolicy.requireApproval
    - pullRequest.fromFork
  artifactRefs:
    - artifact-01hx-diagnosis
    - artifact-01hx-patch
status:
  phase: pending
  createdAt: "2026-05-10T10:14:00Z"
```

## Example: issue, workspace, and session association

```yaml
apiVersion: kradle.a5c.ai/v1alpha1
kind: WorkItemSessionLink
metadata:
  name: issue-91-session-01hx
spec:
  issue: kradle/91
  agentSession: ses_01hx
  dispatchRun: adr-01hx-ci-repair
  relation: active-agent-chat
---
apiVersion: kradle.a5c.ai/v1alpha1
kind: WorkItemWorkspaceLink
metadata:
  name: issue-91-workspace-01hx
spec:
  issue: kradle/91
  workspace: workspace-kradle-pr-42
  relation: implementation-workspace
```

## API payload example: manual dispatch

```json
{
  "repository": "kradle",
  "ref": "refs/heads/staging",
  "agentStack": "claude-code-ci-repair",
  "taskKind": "manual-repair",
  "prompt": "Investigate the failing docs validation and propose the smallest fix.",
  "contextLabels": ["ci-failure-summary"],
  "runtimeIdentity": {
    "serviceAccountRef": "agent-claude-code-ci-repair"
  },
  "secretGrants": ["claude-code-anthropic-api-key"],
  "configGrants": ["claude-code-npm-config"],
  "sourceRefs": {
    "path": "docs/agents",
    "actor": "tmusk"
  },
  "workspacePolicy": {
    "mode": "isolated-worktree",
    "baseBranch": "staging"
  },
  "writeBackPolicy": {
    "requireApproval": true
  }
}
```

Expected response:

```json
{
  "run": {
    "kind": "AgentDispatchRun",
    "metadata": { "name": "adr-01hx-manual" },
    "status": { "phase": "queued" }
  },
  "links": {
    "detail": "/agents/runs/adr-01hx-manual",
    "repository": "/orgs/[org]/repositories/kradle/runs?agentRun=adr-01hx-manual"
  }
}
```

## Org-scoped memory examples

```yaml
apiVersion: kradle.a5c.ai/v1alpha1
kind: Organization
metadata:
  name: a5c
spec:
  namespaceName: kradle-org-a5c
  slug: a5c
  memoryRepositoryRef: org-company-brain
```

```yaml
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentRunMemoryImport
metadata:
  name: import-01kr
  namespace: kradle-org-a5c
  labels:
    kradle.a5c.ai/org: a5c
spec:
  organizationRef: a5c
  memoryRepository: org-company-brain
  source:
    kind: babysitter-run
    runId: 01KR1ZCPQVVPJAJDNBQHGPWZZY
    a5cRunPath: .a5c/runs/01KR1ZCPQVVPJAJDNBQHGPWZZY
  include:
    memoryMd: true
    sessionSummary: true
    journal: curated
    taskResults: true
    artifactManifests: true
  targetPath: babysitter/runs/01KR1ZCPQVVPJAJDNBQHGPWZZY
  validationPolicy:
    redactSecrets: true
    requireReview: true
```

```yaml
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentMemorySource
metadata:
  name: kradle-ci-memory
  namespace: kradle-org-a5c
spec:
  organizationRef: a5c
  repositoryRef: org-company-brain
  appliesTo:
    repositories: [kradle]
  include:
    paths:
      - babysitter/MEMORY.md
      - babysitter/runs/**
      - runbooks/ci/**
    graphKinds: [BabysitterRun, Runbook, AgentPractice, RunRetrospective]
```
