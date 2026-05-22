# Agent RBAC, service account, secret, and config management spec

## Purpose

Krate must use native Kubernetes identity and RBAC for humans, agents, and runners. Agent orchestration must not introduce a parallel permission system. The UI can make permission management easy, but the authoritative checks must resolve to Kubernetes users, groups, ServiceAccounts, Roles, ClusterRoles, RoleBindings, ClusterRoleBindings, Secrets, ConfigMaps, and admission decisions.

This spec adds the missing permission layer for agent dispatch: service account management for runners and agents, role synchronization for users and teams, secret/config access grants, tool-secret and skill-secret associations, and UI warnings when a stack requests a capability whose required secret/config is not admitted.

## Design goals

- Keep Kubernetes RBAC as the enforcement point for humans, agents, runners, and controllers.
- Make permission intent easy to manage from Krate without hiding the native objects that enforce it.
- Separate identity (`ServiceAccount`), authorization (`RoleBinding`), secret access (`AgentSecretGrant`), and non-secret config access (`AgentConfigGrant`).
- Treat tool, MCP, skill, model, and subagent requirements as typed dependencies that can be validated before dispatch.
- Fail closed for missing or stale grants, but explain the exact missing ServiceAccount, role, Secret key, ConfigMap key, repository, ref, and trigger source.
- Never pass broad cluster credentials into Agent Mux; pass only admitted scoped references or projected mounts for the selected attempt.

## Non-goals

- Do not store Secret values in Krate resources, events, prompt previews, audit logs, or Agent Mux transcripts.
- Do not replace Kubernetes RBAC with a Krate-only ACL system.
- Do not allow label/comment-triggered dispatches to grant themselves new roles or secrets.
- Do not let a tool or skill imply secret access through prompt text; every dependency must be declared and admitted.
- Do not allow untrusted/forked refs to inherit trusted runner or agent ServiceAccounts.
## Native identity model

| Actor | Kubernetes identity | Krate management surface | Notes |
| --- | --- | --- | --- |
| Human user | Kubernetes user from OIDC/delegated identity, plus groups | `User`, `Team`, `IdentityMapping`, `RepositoryPermission`, native `RoleBinding` projection | UI actions must be authorized by API/server checks, not local role flags. |
| Team/group | Kubernetes group | `Team`, `RepositoryPermission`, `AgentRoleBinding` | Team membership changes must refresh repository and agent permissions. |
| Agent stack | ServiceAccount selected by `AgentStack.spec.runtimeIdentity` | `AgentServiceAccount`, `AgentRoleBinding`, `AgentSecretGrant`, `AgentConfigGrant` | Stack readiness depends on the selected ServiceAccount having all required permissions. |
| Dispatch attempt | Projected ServiceAccount token for the attempt | `AgentDispatchAttempt.status.runtimeIdentity` | Attempt identity is immutable once launched. |
| Runner pool | ServiceAccount used by runner pods | `RunnerPool.spec.serviceAccountRef`, `AgentRunnerIdentityBinding` | Runner identity controls pod creation, logs, caches, and workspace access. |
| Tool/MCP server/skill | Secret/config requirements attached to the capability | `AgentToolSecretRequirement`, `AgentSkillSecretRequirement`, `AgentMcpServer.spec.secretRefs` | Requirements are validated against grants before dispatch. |

## Resources to add

### `AgentServiceAccount`

Declarative wrapper for a Kubernetes `ServiceAccount` used by an agent stack or runner pool.

Important fields:

- `spec.namespace`;
- `spec.serviceAccountName`;
- `spec.owner`: agent-stack, runner-pool, repository, organization;
- `spec.allowedRepositories`;
- `spec.allowedRunnerPools`;
- `spec.tokenAudience`;
- `spec.tokenExpirationSeconds`;
- `spec.imagePullSecretRefs`;
- `spec.automountServiceAccountToken`: should default to false except where projected tokens are required;
- `status.syncedServiceAccount`;
- `status.conditions`: `ServiceAccountSynced`, `TokenProjectionAllowed`, `ImagePullSecretsReady`, `Ready`.

### `AgentRoleBinding`

Krate-managed projection to Kubernetes `Role`, `ClusterRole`, `RoleBinding`, and `ClusterRoleBinding` resources.

Important fields:

- `spec.subject`: user, group, team, agent-stack, runner-pool, service-account;
- `spec.scope`: namespace, repository, organization, cluster;
- `spec.roleRef`: native Kubernetes Role/ClusterRole or Krate role template;
- `spec.resourceRules`: optional generated rules for Krate resources;
- `spec.nativeRoleBindingName`;
- `spec.escalationPolicy`: deny, require-admin-approval, allow-if-owner;
- `status.syncedRoleRefs`;
- `status.conditions`: `RoleResolved`, `SubjectsResolved`, `NativeBindingSynced`, `EscalationAdmitted`, `Ready`.

### `AgentSecretGrant`

Declarative permission for an actor to consume a Kubernetes `Secret` for a specific purpose.

Important fields:

- `spec.subject`: agent-stack, service-account, runner-pool, user, team;
- `spec.secretRef`: namespace/name and optional keys;
- `spec.purpose`: model-provider-token, git-credential, mcp-server, tool, skill, webhook-signing, image-pull, cache, deployment;
- `spec.allowedRepositories`;
- `spec.allowedRefs`;
- `spec.allowedTriggerSources`;
- `spec.mountPolicy`: env, file, projected-volume, never-mount-pass-by-reference;
- `spec.requiredApproval`: never, on-untrusted-ref, always;
- `spec.rotationPolicy`;
- `status.conditions`: `SecretExists`, `KeysExist`, `SubjectAuthorized`, `PolicyAdmitted`, `Ready`.

### `AgentConfigGrant`

Declarative permission for an actor to consume a Kubernetes `ConfigMap` or typed non-secret config.

Important fields:

- `spec.subject`;
- `spec.configMapRef`: namespace/name and optional keys;
- `spec.purpose`: tool-config, skill-config, mcp-config, runner-config, prompt-template, repository-policy;
- `spec.allowedRepositories`;
- `spec.mountPolicy`: env, file, projected-volume, api-read;
- `status.conditions`: `ConfigMapExists`, `KeysExist`, `SubjectAuthorized`, `PolicyAdmitted`, `Ready`.

### `AgentCapabilityRequirement`

Normalized requirement record created from tools, MCP servers, skills, subagents, and model providers. This can be an aggregated resource or a computed projection.

Important fields:

- `spec.ownerRef`: `AgentToolProfile`, `AgentMcpServer`, `AgentSkill`, `AgentSubagent`, or `AgentStack`;
- `spec.requiredSecretRefs`;
- `spec.requiredConfigRefs`;
- `spec.requiredRoles`;
- `spec.requiredServiceAccountCapabilities`;
- `status.missingGrants`;
- `status.invalidGrants`;
- `status.conditions`: `RequirementsDiscovered`, `GrantsResolved`, `Ready`.

## Role templates

Krate should ship role templates that compile into native Kubernetes roles. Users may still bind pre-existing native Roles/ClusterRoles, but templates make safe paths obvious.

| Template | Intended subject | Native capabilities | Guardrails |
| --- | --- | --- | --- |
| `krate-agent-readonly` | agent stack, subagent | get/list/watch repository, issue, PR, pipeline, job, context bundle metadata | no Secret read, no write-back, no pod exec. |
| `krate-agent-repository-repair` | trusted repair agent | read repo graph, create dispatch artifacts, patch allowed PR/issue records | branch push and PR comments still require write-back approval. |
| `krate-agent-ci-diagnoser` | CI diagnosis agent | read pipeline/job/log/artifact projections | no repository mutation and no privileged secrets. |
| `krate-agent-workspace-manager` | workspace controller/agent | create/link/archive/recover agent workspaces | cannot access unrelated namespaces or runner pools. |
| `krate-runner-untrusted` | untrusted runner pool | create own pods/jobs, stream own logs, read no Secrets | forced for forks and untrusted refs. |
| `krate-runner-trusted` | trusted runner pool | create own pods/jobs, mount admitted Secrets/ConfigMaps | only trusted refs and approved task kinds. |
| `krate-secret-grant-admin` | platform admin | create/update `AgentSecretGrant` and `AgentConfigGrant` resources | native RBAC must also allow binding or reading target metadata. |
| `krate-agent-approver` | maintainer/team | approve selected `AgentApproval` classes | cannot approve grants that would escalate beyond their own bind permissions. |

Role templates should include generated YAML preview and native object names before apply. Binding a template must call a server-side permission review equivalent to Kubernetes `SelfSubjectAccessReview` plus bind/escalate checks.

## Grant resolution algorithm

For every stack save, trigger dry-run, and dispatch creation, Krate should run the same deterministic resolver:

1. Expand the selected `AgentStack` into model provider, base adapter, tool profile, MCP servers, skills, subagents, context labels, workspace policy, runner pool, and write-back policy.
2. Collect `AgentCapabilityRequirement` records from each expanded capability.
3. Resolve the runtime `AgentServiceAccount` and runner `ServiceAccount`.
4. Resolve native Kubernetes RBAC for required API verbs/resources using subject access reviews or equivalent server-side checks.
5. Resolve `AgentSecretGrant` records by exact subject first, then stack, tool/skill/MCP owner, team/group, and repository policy, without allowing broader grants to override explicit denies.
6. Resolve `AgentConfigGrant` records using the same precedence as Secret grants.
7. Apply source constraints: repository, ref, pull request trust tier, actor, trigger source, workflow/job, and task kind.
8. Produce a normalized decision with `allowed`, `requiresApproval`, `denied`, `missingGrant`, `staleGrant`, and `driftedNativeObject` entries.
9. Snapshot the decision into `AgentDispatchAttempt.status.permissionSnapshot` before launch.

Resolution precedence:

1. explicit deny policy;
2. missing/deleted native object;
3. subject-specific grant;
4. stack-specific grant;
5. capability-specific grant for tool, skill, MCP, or model provider;
6. repository/team grant;
7. organization default grant;
8. no grant.

## Admission decision matrix

| Scenario | Save stack | Dry-run trigger | Create dispatch | Launch attempt |
| --- | --- | --- | --- | --- |
| Missing runtime ServiceAccount | block | show blocked | block | block |
| Missing runner ServiceAccount | warn if external gateway, otherwise block | show blocked | block unless external gateway | block |
| Tool requires Secret with no grant | block by default | show missing grant | block | block |
| Skill requires ConfigMap with no grant | block by default | show missing grant | block | block |
| Grant exists but Secret key is missing | block | show missing key | block | block |
| Grant exists but ref is untrusted | allow only if grant explicitly allows untrusted source | show policy decision | approval or block | enforce decision |
| Native RoleBinding drifted | warn or block based on role criticality | show drift | block for required roles | block |
| Approval required for secret use | save allowed with warning | show approval requirement | create run waiting for approval | wait until approved |
| Secret rotation happened after context snapshot | save allowed | show changed metadata | require fresh permission snapshot on retry | use current admitted version only |

## Permission review API

The UI needs a fast, explainable server-side review endpoint. Proposed action:

`POST /api/agents/permissions/review`

Request fields:

- `repository`;
- `ref`;
- `actor`;
- `agentStack`;
- `triggerSource`;
- `taskKind`;
- `runnerPool`;
- optional `toolRefs`, `skillRefs`, `mcpServerRefs`, `contextLabelRefs`.

Response fields:

- `decision`: allowed, denied, requires-approval;
- `runtimeIdentity` and `runnerIdentity`;
- `requiredRoles` with native review result;
- `requiredSecrets` with grant and metadata status only;
- `requiredConfigs` with grant and key status;
- `missingGrants` with suggested safe grants;
- `approvalRequirements`;
- `yamlPreview` for resources the current user may create;
- `reasons` sorted by blocking severity.
## Controller responsibilities

### Identity/RBAC sync controller

- Watches `User`, `Team`, `RepositoryPermission`, `AgentServiceAccount`, `AgentRoleBinding`, and native Kubernetes RBAC objects.
- Creates or updates native `ServiceAccount`, `Role`, `ClusterRole`, `RoleBinding`, and `ClusterRoleBinding` resources when Krate owns them.
- Imports externally managed native RBAC into read-only projections when Krate does not own them.
- Prevents privilege escalation by checking whether the actor applying an `AgentRoleBinding` can bind the requested role.
- Emits clear conditions for missing subjects, forbidden roles, escalation attempts, and drift from native RBAC.

### Secret/config access controller

- Watches `Secret`, `ConfigMap`, `AgentSecretGrant`, `AgentConfigGrant`, `AgentToolProfile`, `AgentMcpServer`, `AgentSkill`, `AgentStack`, and `AgentDispatchRun`.
- Validates that every requested secret/config key exists and is allowed for the subject, repository, ref, trigger source, and trust tier.
- Produces stack/rule/run warnings when a tool, MCP server, model provider, or skill requires a secret/config that the selected agent ServiceAccount cannot access.
- Never exposes secret values to the UI; only names, keys, purposes, status, age, rotation metadata, and access graph edges.
- Supports config injection through ConfigMaps and secret injection through projected volumes/env only after admission.

### Stack readiness integration

The `AgentStack` controller must combine capability validation with native permission validation:

1. Discover tool/MCP/skill/model/subagent requirements.
2. Resolve selected runtime ServiceAccount and runner ServiceAccount.
3. Check native Kubernetes RBAC for each required API verb/resource.
4. Check `AgentSecretGrant` and `AgentConfigGrant` for each required Secret/ConfigMap key.
5. Set `AgentStack.status.conditions` with actionable reasons such as `MissingSecretGrant`, `MissingConfigGrant`, `ServiceAccountCannotUseRunner`, `RoleBindingDrifted`, or `SecretKeyMissing`.
6. Block dispatch or require approval according to policy.

### Reconciliation ownership and drift

Krate must distinguish native objects it owns from native objects it only observes:

- Owned objects carry Krate labels/owner references and are reconciled back to desired state.
- Imported objects appear in the UI as external and read-only unless the user claims ownership.
- Drift in owned objects sets `NativeBindingDrifted`, `ServiceAccountDrifted`, or `GrantTargetDrifted` conditions.
- Drift should not silently repair privilege escalation; dangerous drift blocks dispatch and requires a human/admin decision.
- Deleting a Krate grant should remove only Krate-owned native bindings/mount wiring, never arbitrary external RBAC objects.

### Secret and ConfigMap lifecycle

- Secret value entry is write-only; after save, the UI can show key names, metadata, hash/version, age, and rotation state only.
- ConfigMap values may be shown only when native RBAC allows `get` and Krate marks the key non-sensitive.
- Secret/ConfigMap deletion or key removal must show affected stacks, tools, skills, MCP servers, trigger rules, runner pools, and active dispatches.
- Rotation should create a new metadata version and mark active dispatches as using an older snapshot without revealing the old value.
- A retry/resume after rotation must rerun permission review and produce a fresh permission snapshot.
## UI management requirements

### Global pages

- `/agents/identities`: agent ServiceAccounts, runner ServiceAccounts, users, teams, groups, and native RBAC projection.
- `/agents/secrets`: Secret/ConfigMap inventory filtered by what the current user can see, with grants and consumers.
- `/agents/permissions`: role templates, native RoleBindings, ClusterRoleBindings, grant graph, drift, and escalation warnings.

### Repository settings

`/orgs/[org]/repositories/[repo]/settings/agents` should include:

- allowed agent stacks and runtime ServiceAccounts;
- allowed runner pools and runner ServiceAccounts;
- secret grants by stack/tool/skill/MCP server;
- config grants by stack/tool/skill/MCP server;
- role bindings for users, teams, agents, and runners;
- dry-run permission check for a selected stack + trigger + ref;
- generated YAML preview for native ServiceAccount/RBAC/SecretGrant/ConfigGrant changes.

### Stack builder

The stack builder should show a permission matrix:

| Capability | Requires | Current grant | UI state |
| --- | --- | --- | --- |
| model provider | Secret key | `AgentSecretGrant` | ready/missing/forbidden |
| MCP server | Secret + ConfigMap + network policy | grant + RBAC | ready/missing/drifted |
| shell tool | Role + runner trust | `AgentRoleBinding` | allowed/needs approval/denied |
| skill | Secret + ConfigMap + required tools | grants + tool profile | ready/missing dependency |
| subagent | ServiceAccount + tool subset | stack permission | ready/incompatible |

If a tool or skill references a secret without an admitted grant, the UI must show a blocking warning before save and before dispatch: `This stack enables <tool/skill> but <serviceAccount> cannot access Secret <namespace>/<name>:<key>. Add a grant, choose another ServiceAccount, or remove the capability.`

### Permission management user flows

#### Grant a Secret to a tool

1. User opens `/agents/secrets` or the stack builder warning.
2. UI shows the tool, stack, selected ServiceAccount, missing Secret key, repository/ref scope, and why it is required.
3. User selects an existing Secret/key or creates a write-only Secret key if RBAC permits it.
4. UI previews `AgentSecretGrant`, affected stacks/rules, and native permission review result.
5. Saving creates the grant and immediately recomputes stack readiness.

#### Grant a ConfigMap to a skill

1. User opens the skill dependency panel.
2. UI shows required ConfigMap keys and whether values are visible, write-only, or metadata-only.
3. User grants selected keys for selected repositories/task kinds.
4. UI previews `AgentConfigGrant` and the mount/injection mode.
5. Stack readiness moves from blocked to ready only after the grant and native RBAC pass.

#### Bind an agent stack to a ServiceAccount

1. User selects or creates an `AgentServiceAccount` from the stack builder.
2. UI shows runner pools that may use it, native RBAC templates, Secret/ConfigMap grants, and trust-tier restrictions.
3. UI previews `ServiceAccount`, `RoleBinding`, and grant changes.
4. Server checks bind/escalate permission before applying.
5. Existing active runs keep their original ServiceAccount snapshot; new attempts use the new identity.

#### Explain a denied dispatch

Denied dispatch views should show:

- source actor and Kubernetes identity;
- selected agent stack and ServiceAccounts;
- missing or denied native role checks;
- missing Secret/ConfigMap grants by capability owner;
- trust-tier reason such as fork/untrusted ref;
- suggested fix with least-privilege grant YAML;
- whether a human approval can unblock it or whether policy hard-blocks it.

### UI information architecture

- Stack builder: capability requirements, ServiceAccount picker, readiness, and missing grants.
- Tool profile page: required Secret/ConfigMap inputs and consuming stacks.
- Skill page: required tools, Secrets, ConfigMaps, and compatible ServiceAccounts.
- MCP page: server health, secret refs, config refs, and allowed stacks.
- Runner pool page: runner ServiceAccount, trust tier, allowed stacks, Secret/ConfigMap policy.
- Secret detail page: metadata, key names, grants, consumers, rotation state, active dispatch snapshots.
- ConfigMap detail page: keys, sensitivity, grants, consumers, drift, active dispatch snapshots.
- Permission page: role templates, native RBAC graph, ownership, drift, escalation checks.
## Secret and ConfigMap UX rules

- The UI must never render secret values.
- Users can create/update Secret metadata and key names only if native RBAC permits the operation; value entry should use write-only forms.
- ConfigMaps can show values only when RBAC permits `get` on the ConfigMap and Krate policy marks the key non-sensitive.
- Every grant must show consumers: stacks, tools, skills, MCP servers, trigger rules, runner pools, and recent dispatches.
- Every Secret/ConfigMap must show reverse dependencies and breakage warnings before deletion or key removal.
- Rotation state should show last updated time, affected stacks, pending restarts, and dispatches still using old snapshots.

## Audit model

Every permission-sensitive operation must emit an audit event with enough context to reconstruct the decision without exposing secret values.

| Event | Required fields |
| --- | --- |
| `AgentServiceAccountCreated` | actor, namespace, ServiceAccount, owner, allowed repositories, runner pools. |
| `AgentRoleBindingApplied` | actor, subject, roleRef, scope, native binding, escalation review result. |
| `AgentSecretGrantApplied` | actor, subject, Secret namespace/name, key names, purpose, repository/ref scope, approval policy. |
| `AgentConfigGrantApplied` | actor, subject, ConfigMap namespace/name, key names, purpose, repository scope. |
| `AgentPermissionReviewDenied` | actor, stack, source, missing roles/grants, trust tier, hard-block reason. |
| `AgentDispatchPermissionSnapshotCreated` | dispatch run, attempt, ServiceAccounts, grant names, metadata versions, decision digest. |
| `AgentSecretRotated` | Secret metadata, key names, affected stacks/rules/runs, old/new metadata version only. |
| `NativeRbacDriftDetected` | owned object, desired hash, observed hash, severity, dispatch impact. |

Audit records should link to source repository, trigger, dispatch run, stack generation, capability requirement generation, and approving user where applicable.

## Failure modes

| Failure | Expected behavior |
| --- | --- |
| Kubernetes API cannot perform subject access review | fail closed for dispatch; show review unavailable. |
| Secret exists but key metadata cannot be listed | fail closed unless an admin configured metadata-blind grants for that namespace. |
| ConfigMap value is sensitive by policy | show key metadata only; do not render values. |
| RoleBinding apply succeeds but later drifts | mark dependent stacks not ready and block new attempts requiring that role. |
| Secret deleted while dispatch is running | running attempt continues only if already mounted; retries require fresh review. |
| Agent Mux launch rejects secret/config reference | mark attempt failed with adapter rejection and keep Krate permission snapshot. |
| User loses permission while editing grant form | server rejects save and UI refreshes permission review. |
## Dispatch-time enforcement

At dispatch creation:

1. Snapshot the selected stack, runtime ServiceAccount, runner ServiceAccount, tool/MCP/skill/subagent requirements, SecretGrants, ConfigGrants, RoleBindings, and ConfigMaps/Secret metadata.
2. Refuse untrusted/forked refs from receiving privileged secrets unless policy explicitly allows a safe read-only grant.
3. Create `AgentApproval` when policy allows a secret/config/tool but requires human approval for this source.
4. Launch Agent Mux with only admitted secret/config references, never with the full cluster credential set.
5. Record the exact secret/config names and key hashes in the audit snapshot, not secret values.

## Acceptance criteria

- A repository admin can create an agent ServiceAccount and bind it to an agent stack from the UI.
- A platform admin can create runner ServiceAccounts and bind them to runner pools.
- A user can grant a specific stack/tool/skill/MCP server access to a specific Secret key or ConfigMap key without writing YAML by hand.
- The stack builder warns when a capability requires a Secret/ConfigMap/Role that the selected ServiceAccount lacks.
- Dispatch creation fails closed when required permissions, SecretGrants, ConfigGrants, or native RBAC are missing.
- Native Kubernetes RBAC remains the enforcement point; Krate resources are declarative management and UI projection, not a parallel authorization backend.

## Memory repository permissions

Company brain memory requires explicit permissions separate from repository code permissions.

| Permission | Grants |
| --- | --- |
| `memory.repositories.read` | view memory repository metadata and health. |
| `memory.graph.query` | query graph records for allowed kinds and paths. |
| `memory.docs.grep` | grep free-form Markdown in allowed paths. |
| `memory.records.read` | read full memory records or documents. |
| `memory.snapshots.diff` | diff memory refs and historical snapshots. |
| `memory.updates.propose` | create memory update artifacts or PR branches. |
| `memory.updates.approve` | approve proposed memory updates. |
| `memory.updates.merge` | merge approved memory updates. |
| `memory.ontology.manage` | change ontology node kinds, edge kinds, vocabularies, and validators. |

`AgentMemorySource` acts like a read grant for memory paths and graph kinds. `AgentMemoryUpdate` admission checks write permissions, ontology validity, secret scan, target branch policy, and reviewer requirements before opening or merging a PR. Tools and skills that require memory secrets or restricted memory paths must surface missing grants in `AgentCapabilityRequirement` so the UI can explain why a stack is blocked.

## Org-scoped memory and run imports

Memory and Babysitter run imports are namespace-scoped to an organization. The importing controller uses an org ServiceAccount and can read only admitted `.a5c` paths, session summaries, and artifacts for repositories in that org. `MEMORY.md` updates, journal imports, and retrospective promotion require memory update permissions and cannot cross namespace boundaries.

Secret grants remain separate: importing a run journal does not imply permission to expose secrets that appeared in logs or artifacts. Secret scans and redaction happen before content enters the company brain.
