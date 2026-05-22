# Agent stack management spec

## Purpose

Krate needs a general agent orchestration layer, not only a UI integration. Users should be able to define a reusable agent stack such as "Claude Code reviewer with filesystem tools, repo MCP tools, two subagents, release-runbook skills, prompt context labels, and strict approval policy", then connect it to CI failures, issue/PR triggers, incoming webhooks, schedules, or manual repository actions.

The result should look and behave like a CI run in Krate: queued on runner capacity, tied to repo/ref/source event, visible beside pipelines/jobs, streamable in real time, artifact-producing, cancellable, approval-gated, and auditable. It should also expose the Agent Mux chat/session so humans can continue the run, inspect transcript/tool activity, manage subagents, and recover the workspace.

## Core user flows

### Define an agent stack

1. Platform admin or repo maintainer creates an `AgentStack`.
2. They select a base runtime: `claude-code`, `codex`, `gemini`, `opencode`, `babysitter`, or an external Agent Mux adapter.
3. They configure model/provider, approval mode, allowed/denied tools, sandbox, workspace policy, secrets policy, MCP servers, skills, subagents, and default prompt.
4. Krate validates the definition against adapter capabilities from Agent Mux.
5. The stack becomes selectable by dispatch rules and manual repository actions.

### Define Claude Code subagents

1. User adds subagent definitions under an `AgentStack`.
2. Each subagent gets a name, description, role prompt, optional model override, allowed tools, MCP access, workspace scope, and concurrency limit.
3. The parent stack can dispatch to these subagents for research, implementation, review, validation, or release checks.
4. Subagent activity is surfaced as child attempts/events under the main dispatch run.

### Manage tools, MCP servers, and skills

1. User registers tools as managed capabilities, not ad-hoc prompt text.
2. MCP servers define transport, command/URL, args, env refs, headers refs, scope, and approval policy.
3. Skills define reusable procedures/runbooks that can be loaded into an agent stack.
4. Krate checks repository policy before a tool/skill/MCP server is attached to a stack or dispatch.
5. Dispatch context shows exactly which tools, skills, and MCP servers were made available.

### Connect triggers to an agent stack

1. User creates an `AgentTriggerRule`.
2. The rule selects source events: failed check, pipeline/job event, incoming webhook, issue/PR mention, label, push, tag, schedule, manual action, or repository dispatch.
3. The rule matches workflow/job/step/path/branch/label/comment/body/failure signature/webhook payload fields.
4. The rule selects an agent stack, task kind, context labels, runner pool, approval policy, dedupe policy, and write-back policy.
5. When an event matches, Krate creates a dispatch run and links it to the source object.

### Dispatch appears as a CI-like run

1. Krate creates an `AgentDispatchRun` and one `AgentDispatchAttempt`.
2. The run appears next to `Pipeline` and `Job` records for the repo/ref/PR.
3. The run shows queue state, runner pool, workspace, source trigger, agent stack, task kind, phase, cost/tokens, artifacts, approvals, and linked Agent Mux session.
4. Opening the run shows CI-style metadata plus the live Agent Mux chat/transcript.
5. Agent output can produce artifacts: diagnosis, patch, branch proposal, review comments, subagent reports, release report, or rerun request.
6. Privileged write-back requires approval before comments, PR updates, pushes, review submissions, check reruns, or release actions.

### Manage work item, workspace, and session lifecycle

1. A trigger can create or link a work item/card/issue.
2. The work item can own or link a workspace.
3. The workspace can own or link active sessions and dispatch runs.
4. Users can pin, archive, cleanup, recover, rebase, annotate, and inspect runtime surfaces for the workspace.
5. The issue/PR/pipeline/workspace/session views are projections of the same linked orchestration graph.

## Proposed resource model

Names are planning names only.

### `AgentStack`

Reusable definition of a runnable agent configuration.

Important fields:

- `spec.displayName`;
- `spec.baseAgent`: `claude-code`, `codex`, `gemini`, `opencode`, `babysitter`, `agent-mux-remote`, external;
- `spec.adapter`: Agent Mux adapter ID or gateway route;
- `spec.model` and `spec.provider`;
- `spec.prompt`: default system/developer/task framing;
- `spec.agentsDocRef`: `AGENTS.md` or equivalent instruction source;
- `spec.approvalMode`: prompt, deny, yolo, or policy-derived;
- `spec.allowedCommands` / `spec.deniedCommands`;
- `spec.toolPolicy`;
- `spec.mcpServerRefs`;
- `spec.skillRefs`;
- `spec.subagentRefs`;
- `spec.contextLabelRefs`;
- `spec.workspacePolicy`;
- `spec.runnerPool`;
- `spec.secretPolicy`;
- `spec.runtimeIdentity.serviceAccountRef`;
- `spec.permissionRefs.roleBindings`;
- `spec.permissionRefs.secretGrants`;
- `spec.permissionRefs.configGrants`;
- `spec.writeBackPolicy`;
- `status.capabilities`: adapter-reported normalized capabilities;
- `status.validation`: valid, warning, invalid.

### `AgentSubagent`

A named child-agent definition available to an `AgentStack`.

Important fields:

- `spec.name`;
- `spec.description`;
- `spec.rolePrompt`;
- `spec.taskKinds`: research, implementation, validation, review, triage, release-check;
- `spec.modelOverride`;
- `spec.toolRefs`;
- `spec.mcpServerRefs`;
- `spec.skillRefs`;
- `spec.workspaceScope`: read-only, branch-local, isolated-worktree, no-workspace;
- `spec.maxParallelTasks`;
- `spec.outputContract`: summary, patch, checklist, JSON, review comments.

Subagents must be visible in run telemetry. A parent dispatch should show which subagents were invoked, what context they received, and what they returned.

### `AgentToolProfile`

Policy bundle for native tools and shell access.

Important fields:

- `spec.nativeTools`: enabled/disabled native tool categories;
- `spec.allowedCommands`;
- `spec.deniedCommands`;
- `spec.filesystemPolicy`: read-only, repo-write, workspace-write, no-fs;
- `spec.networkPolicy`;
- `spec.approvalPolicyByTool`;
- `spec.requiredSecretRefs` for tools that need credentials;
- `spec.requiredConfigRefs` for tools that need non-secret config;
- `spec.auditLevel`: metadata, inputs, outputs, full redacted transcript.

### `AgentMcpServer`

Managed MCP server definition.

Important fields:

- `spec.name`;
- `spec.transport`: stdio, sse, streamable-http;
- `spec.command` / `spec.args` for stdio;
- `spec.url` for network transports;
- `spec.envFrom` and `spec.secretRefs`;
- `spec.configMapRefs`;
- `spec.headersFrom`;
- `spec.scope`: global, org, repository, stack, dispatch;
- `spec.allowedAgentStacks`;
- `spec.approvalPolicy`;
- `status.health`;
- `status.discoveredTools`.

### `AgentSkill`

Reusable runbook/procedure available to agent stacks.

Important fields:

- `spec.name`;
- `spec.description`;
- `spec.format`: file, directory, package, inline;
- `spec.sourceRef`;
- `spec.allowedAgentStacks`;
- `spec.requiredTools`;
- `spec.requiredMcpServers`;
- `spec.requiredSecretRefs`;
- `spec.requiredConfigRefs`;
- `spec.promptFragment`;
- `spec.version`;
- `status.validation`.

### `AgentServiceAccount`

Krate-managed wrapper around native Kubernetes `ServiceAccount` identity for agent stacks and runner pools.

Important fields:

- `spec.namespace`;
- `spec.serviceAccountName`;
- `spec.owner`: agent-stack, runner-pool, repository, organization;
- `spec.allowedRepositories`;
- `spec.allowedRunnerPools`;
- `spec.tokenAudience` and `spec.tokenExpirationSeconds`;
- `spec.imagePullSecretRefs`;
- `status.syncedServiceAccount`;
- `status.conditions`: ServiceAccountSynced, TokenProjectionAllowed, Ready.

### `AgentRoleBinding`

Krate-managed intent that syncs to native Kubernetes `Role`, `ClusterRole`, `RoleBinding`, or `ClusterRoleBinding` resources.

Important fields:

- `spec.subject`: user, group, team, agent-stack, runner-pool, service-account;
- `spec.scope`: namespace, repository, organization, cluster;
- `spec.roleRef`: native role or Krate role template;
- `spec.resourceRules`;
- `spec.nativeRoleBindingName`;
- `spec.escalationPolicy`;
- `status.syncedRoleRefs`;
- `status.conditions`: RoleResolved, SubjectsResolved, NativeBindingSynced, EscalationAdmitted, Ready.

### `AgentSecretGrant`

Permission for an actor to consume selected Kubernetes Secret keys for an explicit purpose.

Important fields:

- `spec.subject`: agent-stack, service-account, runner-pool, user, team, tool, skill, MCP server;
- `spec.secretRef`: namespace/name and allowed keys;
- `spec.purpose`: model-provider-token, git-credential, mcp-server, tool, skill, webhook-signing, image-pull, cache, deployment;
- `spec.allowedRepositories`, `spec.allowedRefs`, and `spec.allowedTriggerSources`;
- `spec.mountPolicy`: env, file, projected-volume, never-mount-pass-by-reference;
- `spec.requiredApproval`;
- `status.conditions`: SecretExists, KeysExist, SubjectAuthorized, PolicyAdmitted, Ready.

### `AgentConfigGrant`

Permission for an actor to consume selected Kubernetes ConfigMap keys.

Important fields:

- `spec.subject`;
- `spec.configMapRef`: namespace/name and allowed keys;
- `spec.purpose`: tool-config, skill-config, mcp-config, runner-config, prompt-template, repository-policy;
- `spec.allowedRepositories`;
- `spec.mountPolicy`: env, file, projected-volume, api-read;
- `status.conditions`: ConfigMapExists, KeysExist, SubjectAuthorized, PolicyAdmitted, Ready.

### `AgentCapabilityRequirement`

Computed requirement record for tools, MCP servers, skills, subagents, model providers, and stack launch options.

Important fields:

- `spec.ownerRef`;
- `spec.requiredSecretRefs`;
- `spec.requiredConfigRefs`;
- `spec.requiredRoles`;
- `spec.requiredServiceAccountCapabilities`;
- `status.missingGrants`;
- `status.invalidGrants`;
- `status.conditions`: RequirementsDiscovered, GrantsResolved, Ready.

### `AgentTriggerRule`

Connects incoming events to agent stacks.

Important fields:

- `spec.sources`: ci, webhook, issue-comment, pr-comment, label, push, tag, schedule, manual, repository-dispatch;
- `spec.match`: workflow, job, step, check, branch, path, label, actor, mention, payload JSONPath, failure signature;
- `spec.agentStack`;
- `spec.taskKind`;
- `spec.promptTemplate`;
- `spec.contextLabels`;
- `spec.contextBundleTemplate`;
- `spec.runnerPool`;
- `spec.approvalPolicy`;
- `spec.dedupePolicy`;
- `spec.concurrencyPolicy`;
- `spec.writeBackPolicy`;
- `status.lastTriggeredAt`;
- `status.executionSummary`.

### `AgentDispatchRun`

Logical agent run that appears like a pipeline run.

Important fields:

- `spec.repository`;
- `spec.ref`, `spec.branch`, `spec.sha`;
- `spec.sourceEvent`;
- `spec.sourceRefs`: PR, issue, check, pipeline, job, webhook delivery, schedule, work item;
- `spec.agentStack`;
- `spec.taskKind`;
- `spec.contextBundleRef`;
- `spec.workspaceRef`;
- `spec.runnerPool`;
- `spec.approvalPolicy`;
- `status.phase`: pending, queued, running, waiting-for-approval, succeeded, failed, cancelled;
- `status.agentMuxRunId`;
- `status.agentMuxSessionId`;
- `status.childSubagentRuns`;
- `status.artifacts`;
- `status.approvals`;
- `status.cost`;
- `status.eventCursor`.

### `AgentDispatchAttempt`

Concrete execution attempt under one logical dispatch run.

Important fields:

- `spec.agentDispatchRun`;
- `spec.attemptReason`: initial, retry, resume, repair, rerun-after-fix, continuation;
- `spec.agentStackSnapshot`;
- `spec.contextBundleDigest`;
- `spec.workspaceRef`;
- `spec.runnerPool`;
- `status.agentMuxRunId`;
- `status.agentMuxSessionId`;
- `status.queueEnteredAt`, `status.startedAt`, `status.completedAt`;
- `status.exitReason`;
- `status.producedArtifacts`;
- `status.subagentEvents`.

### `WorkItemSessionLink` and `WorkItemWorkspaceLink`

Generalized links from Agent Mux kanban issue/session/workspace associations.

Important fields:

- `spec.workItemRef`: issue, PR, check failure, release task, or internal card;
- `spec.workspaceRef` or `spec.sessionRef`;
- `spec.runRefs`;
- `spec.linkSource`: created-from-work-item, linked-existing-workspace, linked-session, automation-derived;
- `spec.branchName`;
- `spec.createdBy`;
- `status.lastActivityAt`.

## Status conditions and admission contract

Every declarative agent resource needs `status.conditions` so the UI and controllers can explain why an action is enabled or disabled. Conditions should use stable reason codes; free-form messages are for humans only.

### `AgentStack.status.conditions`

| Condition | True means | False examples |
| --- | --- | --- |
| `CapabilitiesResolved` | Agent Mux adapter capabilities were fetched and normalized. | adapter unavailable, unsupported base agent, stale capability schema. |
| `ToolsAdmitted` | Native tool profile is compatible with repo/org policy. | denied shell command, filesystem scope too broad, network policy missing. |
| `McpHealthy` | Referenced MCP servers are reachable or explicitly allowed to be lazy. | failed probe, secret ref missing, server not allowed for repo. |
| `SkillsValidated` | Skill sources were found, compatible, and prompt fragments passed policy. | missing skill, invalid package, required tool not admitted. |
| `SubagentsValid` | Subagent definitions are compatible with adapter and stack policy. | adapter lacks subagent dispatch, parallelism exceeds limit, output contract unsupported. |
| `ContextLabelsValid` | Default labels exist and have approved prompt fragments. | label deleted, stale version, unsafe injection token. |
| `PolicyAdmitted` | Repository/org/cluster policy allows this stack to dispatch. | untrusted repo, forbidden approval mode, privileged secrets on fork. |
| `RuntimeIdentityReady` | Selected agent ServiceAccount exists and can receive projected tokens. | ServiceAccount missing, token projection forbidden, runner pool cannot use identity. |
| `RolesAdmitted` | Required native Roles/RoleBindings are present and non-escalating. | missing RoleBinding, ClusterRole denied, binding drifted from native state. |
| `SecretsAdmitted` | Required Secret keys have matching `AgentSecretGrant` records. | missing secret grant, key missing, secret not allowed for repo/ref/trigger. |
| `ConfigAdmitted` | Required ConfigMap keys have matching `AgentConfigGrant` records. | missing config grant, key missing, config denied for stack. |
| `Ready` | All required conditions for dispatch are true. | any required condition false or unknown. |

### `AgentTriggerRule.status.conditions`

| Condition | True means | False examples |
| --- | --- | --- |
| `SourceConfigured` | Event source and delivery endpoint are valid. | webhook missing secret, unknown CI workflow, invalid schedule. |
| `MatcherValid` | Match expression compiles and can be dry-run. | invalid JSONPath, unknown label matcher, unsupported failure signature. |
| `TargetStackReady` | Referenced `AgentStack` is `Ready`. | stack not admitted, capability resolution unknown. |
| `ContextTemplateValid` | Prompt/context template can render with sample payload. | missing payload field, unsafe raw payload injection, attachment too large. |
| `DedupePolicyValid` | Dedupe/concurrency keys are stable and bounded. | unbounded key, missing coalescing target, conflicting concurrency policy. |
| `LifecycleActive` | Rule can dispatch new runs. | draft, paused, disabled, archived. |

### `AgentDispatchRun.status.conditions`

| Condition | True means | False examples |
| --- | --- | --- |
| `ContextAssembled` | Context bundle snapshot exists with digest and provenance. | source object missing, artifact fetch failed, redaction error. |
| `WorkspaceResolved` | Workspace was selected/provisioned and policy-admitted. | workspace missing, rebase blocked, untrusted ref requires isolated workspace. |
| `RunnerAssigned` | Execution host/pool accepted the attempt. | no capacity, forbidden runner, queue timeout. |
| `AgentMuxSessionBound` | Agent Mux run/session IDs are attached. | gateway unavailable, pending handoff, launch failed. |
| `ApprovalSatisfied` | Required human gates are resolved for current phase. | waiting on tool/write-back/secret/network/release approval. |
| `ArtifactsIndexed` | Produced outputs are durable and linked. | missing patch, review artifact parse failed, upload failed. |

## Controller admission sequence

1. Resolve actor, source repository, trust boundary, and event source.
2. Load `AgentTriggerRule` or manual dispatch request.
3. Snapshot `AgentStack` and referenced tool/MCP/skill/subagent/context-label resources.
4. Validate adapter capabilities, native Kubernetes RBAC, runtime ServiceAccount, Secret grants, and ConfigMap grants.
5. Assemble bounded context bundle and record digest before launch.
6. Select or provision workspace using `AgentWorkspacePolicy`.
7. Select runner/execution host, verify runner ServiceAccount, and enforce untrusted/fork isolation.
8. Create `AgentDispatchRun` and initial `AgentDispatchAttempt`.
9. Launch through Agent Mux and bind run/session IDs when available.
10. Stream events into status, artifacts, approvals, and work item/session/workspace links.

## Trigger management requirements

- Trigger rules are managed resources, not hidden UI settings.
- Incoming webhooks must create durable delivery records before rule evaluation.
- Trigger rules must support dry-run/testing against a sample event.
- Every trigger execution must record matched rule, source event, context bundle digest, agent stack snapshot, dedupe decision, approval decision, and created dispatch run.
- Disabled, paused, archived, and draft trigger states must be explicit.
- Rule actions should include enable, pause, resume, disable, archive/delete, replay delivery, and materialize work item without dispatch.

## Tool and capability validation

Before dispatch, Krate must validate:

1. Selected `AgentStack` is valid for the adapter capabilities.
2. Required MCP servers are available and allowed for repository/ref/trust tier.
3. Skills are compatible with the base agent and task kind.
4. Subagents do not exceed adapter/runtime concurrency limits.
5. Tool profile is compatible with runner trust tier and fork/untrusted status.
6. Runtime ServiceAccount and runner ServiceAccount are admitted by native Kubernetes RBAC.
7. Required Secret keys have matching `AgentSecretGrant` records for the selected subject, repository, ref, and trigger source.
8. Required ConfigMap keys have matching `AgentConfigGrant` records for the selected subject, repository, ref, and trigger source.
9. Secrets and environment refs are allowed by policy.
10. Approval mode is allowed for the source trigger and actor.

## CI-like run projection

`AgentDispatchRun` should share the mental model of `Pipeline` and `Job`:

- listable in repository pipeline/check views;
- filterable by status, source, agent stack, task kind, runner pool, branch, PR, issue, and trigger rule;
- streamable through watch/SSE;
- has attempts, artifacts, logs/events, queue timing, runner placement, and status;
- can be cancelled, retried, resumed, or continued when the adapter supports it;
- links to Agent Mux chat/session for transcript and continuation;
- posts back to checks/PR/issues only through explicit write-back policy.

## Agent Mux boundary

Krate should not reimplement adapter internals. It should:

- store desired stack/tool/trigger policy;
- validate against Agent Mux adapter capabilities;
- launch through Agent Mux gateway/client;
- subscribe to Agent Mux run/session events;
- link Agent Mux session IDs to Krate work items and dispatch attempts;
- surface Agent Mux chat and runtime state inside Krate pages;
- keep repository, trigger, approval, runner, and audit state in Krate.
