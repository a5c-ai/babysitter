# SPEC-KRADLE-MODEL — Commander's kradle entity model (3rd cut, faithful)

> **Status:** active. **Supersedes:** `SPEC-KRADLE-CONTROLPLANE.md` §2 (the resource↔view
> mapping) and the flat `kradle-resources.ts` / `kradle-stack.ts` / `kradle-workspace.ts`
> contracts. This is the **third** attempt at the kradle entity model; the prior two were
> rejected because *"agent and agent-stack modeling still doesn't fit kradle's one, also the
> rest of the entities and integrations."* This cut re-models Commander **field-by-field
> against the REAL kradle CRD schemas** and the **REAL web BFF**, and **removes the invented
> roster**.
>
> **Authoritative sources (the MAIN checkout, NOT this branch):**
> `packages/kradle/charts/crds/agent-resources.yaml` and `aggregated-resources.yaml` (the
> ACTUAL field schemas — ground truth), `packages/kradle/core/docs/agents/crd-schema-spec.md`,
> `resource-relationship-map.md`, `glossary.md`, `agent-stack-management-spec.md`,
> `dispatching-design.md`, `api-contract-spec.md`, `ui-flow-spec.md`, `ui-ux-system-spec.md`,
> `org-route-resource-model-spec.md`, `memory-ontology-schema-spec.md`; the live BFF
> `packages/kradle/web/app/api/controller/route.js`, `web/app/api/orgs/[org]/resources/route.js`,
> `web/app/api/orgs/[org]/agents/dispatch/route.js`, `.../runs/[name]/cancel/route.js`,
> `web/app/api/watch/[[...resource]]/route.js`; the reference UI
> `web/app/components/agent/{stack-builder,stack-builder-graph-nodes,dispatch-button,run-actions,session-tabs}.jsx`.
>
> **Commander side re-modeled FROM:** `apps/commander/src/contracts/kradle-*.ts`,
> `src/game/views.ts` (`SimViews`), `src/game/store.ts` (`Orders`, `ColumnId`, `commitTick`),
> `src/backend/mock/simulation.ts` (`Sim*View`), `src/backend/kradle/{controllerClient,mappers,kradleOrders}.ts`,
> `src/backend/real/realBoot.ts`, `src/components/panels/{Foundry,RegistryOverlay,Inspector}.tsx`,
> `src/game/board.ts`.

---

## 0. Why the prior two cuts did not fit kradle (the gap this cut closes)

Three concrete infidelities, each fixed below:

1. **No execution hierarchy.** Commander flattened kradle's **`AgentDispatchRun → AgentDispatchAttempt → AgentSession`** into "a card *is* a run, and sessions are keyed by agent `unitId`". kradle's `AgentDispatchAttempt` (the retry/resume/fork unit) had **no entity at all** — the superseded spec only *counted* attempts for `SimCardView.attempt` (`SPEC-KRADLE-CONTROLPLANE.md:442`). **Fix:** §1.B promotes `AgentDispatchAttempt` and `AgentSession` to first-class mirrored entities; §4 maps the full three-level hierarchy.
2. **An invented `roster`.** `SimRosterAgentView` + `createRosterAgent`/`deleteRosterAgent`/`assignTaskAgent` (`simulation.ts:361`, `store.ts:1620`) model "named, pre-recruited workers/reviewers assignable before a card runs." **kradle has no such CRD.** The superseded spec admitted this and faked it onto `AgentDefinition` + labels (`SPEC-KRADLE-CONTROLPLANE.md:357`). **Fix:** §2 and §5 **REMOVE roster** entirely.
3. **Wrong kinds & phases.** `KradlePhase = 'Ready' | 'Pending' | 'Failed'` (`kradle-resources.ts:24`) ≠ kradle's CRD `status.phase` enum `[Pending, Ready, Blocked, Error]` (`agent-resources.yaml:169`). The mirrored "`AgentWorkspace`/`AgentArtifact`/`AgentReviewArtifact`" names do not exist as CRDs — the real kinds are **`KradleWorkspace`/`KradleWorkspaceRuntime`/`KradleArtifact`/`Review`** (`agent-resources.yaml:1768`, `aggregated-resources.yaml:862,303`). **Fix:** §1, §2 align every kind name and phase enum to the YAML.

---

## 1. The full kradle entity model Commander adopts (field-by-field, cited)

Every kind below is **Namespaced**, `apiVersion: kradle.a5c.ai/v1alpha1`, with the shared shell
`metadata{name,namespace,labels}` + `spec` + `status{phase ∈ [Pending,Ready,Blocked,Error],
conditions[], observedGeneration}` (`crd-schema-spec.md:58-95`; `agent-resources.yaml:164-176`).
**Every product `spec` requires `organizationRef`** (`agent-resources.yaml:34`, enforced by the
BFF POST, `orgs/[org]/resources/route.js:49`). Citations are `file:line` against the MAIN
checkout unless noted. "preserve-unknown" marks `x-kubernetes-preserve-unknown-fields: true`
objects whose inner shape comes from `crd-schema-spec.md` / `agent-stack-management-spec.md`.

### 1.A — CONFIG_KINDS (declarative, low-cardinality, etcd-backed)

#### `AgentStack` — the composite (`agent-resources.yaml:1-176`; spec body `crd-schema-spec.md:99-134`)
The reusable agent definition; **composite root** referencing every other config kind.
Required: `organizationRef, baseAgent, adapter, runtimeIdentity`.

| field | type (YAML) | meaning / inner shape |
|---|---|---|
| `organizationRef` | string | org slug (required). |
| `baseAgent` | string | `claude-code \| codex \| gemini \| opencode \| babysitter \| adapters-remote \| external` (`agent-stack-management-spec.md:70`, builder `stack-builder.jsx:5`). |
| `adapter` | string | adapter ID / gateway route (`adapters.claude-code`). |
| `provider`, `model` | string | inference binding. |
| `prompt` | object (preserve) | `{ system, developer }` framing (`crd-schema-spec.md:106`). |
| `agentsDocRef` | object (preserve) | `{ source, path }` → `AGENTS.md` (`crd-schema-spec.md:108`). |
| `approvalMode` | string | `prompt \| deny \| yolo \| policy-derived` (`stack-builder.jsx:6`). |
| `runtimeIdentity` | object (preserve) | `{ serviceAccountRef }` → **`AgentServiceAccount`** (required). |
| `toolProfileRef` | string | → **`AgentToolProfile`**. |
| `internalTools` | object | `{ enabled:boolean(default true), filter:string[] }` (`agent-resources.yaml:63`). |
| `externalTools` | object | `{ mcpServerRefs:string[], cliToolRefs:string[], openApiRefs:string[] }` (`agent-resources.yaml:74`). |
| `mcpServerRefs` | string[] | → **`AgentMcpServer`** (also legacy top-level alongside `externalTools.mcpServerRefs`). |
| `skillRefs` | string[] | → **`AgentSkill`**. |
| `subagentRefs` | string[] | → **`AgentSubagent`**. |
| `contextLabelRefs` | string[] | → **`AgentContextLabel`**. |
| `workspacePolicyRef` | string | → **`KradleWorkspacePolicy`** (note real kind name, §1.A). |
| `runnerPool` | string | → **`RunnerPool`** (`aggregated-resources.yaml:33`). |
| `permissionRefs` | object (preserve) | `{ roleBindings[], secretGrants[], configGrants[] }` → `AgentRoleBinding`/`AgentSecretGrant`/`AgentConfigGrant` (`crd-schema-spec.md:121`). |
| `secretPolicy` | object (preserve) | `{ allowOnForks, allowedSecretRefs[] }`. |
| `writeBackPolicy` | object (preserve) | `{ requireApproval, allowedTargets[] }`. |
| `systemPrompt`/`developerPrompt`/`taskPrompt` | string | flat prompt fields the live builder writes (`stack-builder.jsx:34-36`). |
| `memoryRepositoryRefs`/`memorySnapshotRef` | string[]/string | company-brain bindings (`agent-resources.yaml:90`). |
| `atlasLayerBindings` | object[] (preserve) | stack-builder-graph per-layer Atlas bindings (`agent-resources.yaml:131`; nodes `stack-builder-graph-nodes.jsx:14`). |
| `jitsiCapability`/`jitsiMeetingProviderRef`/`jitsiConfig` | bool/string/object | meeting-agent extension (`agent-resources.yaml:136`; used by `dispatch-button.jsx:17`). |
| `status.conditions[]` | — | **readiness conditions** (required set): `CapabilitiesResolved, RuntimeIdentityReady, RolesAdmitted, SecretsAdmitted, ConfigAdmitted, ToolsAdmitted, McpHealthy, SkillsValidated, SubagentsValid, ContextLabelsValid, PolicyAdmitted, Ready` (`crd-schema-spec.md:134`; semantics `agent-stack-management-spec.md:325-338`). |

#### `AgentToolProfile` (`agent-resources.yaml:494-558`; `agent-stack-management-spec.md:113-127`)
Required: `organizationRef, filesystemPolicy, approvalPolicyByTool`. Fields:
`filesystemPolicy` (`read-only|repo-write|workspace-write|no-fs`), `networkPolicy`, `shellPolicy`,
`approvalPolicyByTool` (all preserve-unknown objects). Spec-doc also lists `nativeTools`,
`allowedCommands/deniedCommands`, `requiredSecretRefs/requiredConfigRefs`, `auditLevel`.

#### `AgentMcpServer` (`agent-resources.yaml:560-631`; `agent-stack-management-spec.md:129-146`)
Required: `organizationRef, transport, scope`. Fields: `transport` (`stdio|sse|streamable-http`,
preserve object with `command/args/url/envFrom/headersFrom`), `scope`
(`global|org|repository|stack|dispatch`), `discovery`, `health`, `secretRefs[]`, `configRefs[]`.
`status.discoveredTools` / `status.health` reported by adapter.

#### `AgentSkill` (`agent-resources.yaml:633-701`; `agent-stack-management-spec.md:148-165`)
Required: `organizationRef, format, sourceRef`. Fields: `format` (`file|directory|package|inline`),
`sourceRef` (preserve), `promptFragments[]`, `toolDeps[]`, `outputContract` (preserve).

#### `AgentSubagent` (`agent-resources.yaml:428-492`; `agent-stack-management-spec.md:94-111`)
Required: `organizationRef, rolePrompt, taskKinds`. Fields: `rolePrompt`, `taskKinds[]`
(`research|implementation|validation|review|triage|release-check`), `toolSubset[]`,
`workspaceScope` (`read-only|branch-local|isolated-worktree|no-workspace`).

#### `AgentContextLabel` (`agent-resources.yaml:803-861`; `glossary.md:17`)
Required: `organizationRef, promptFragment, allowedSources`. Fields: `promptFragment`,
`allowedSources[]`, `provenance` (preserve). A **reviewed prompt fragment with provenance** — NOT
a "prompt tag" (`glossary.md:51`).

#### `KradleWorkspacePolicy` (`agent-resources.yaml:863-925`)
> **Naming delta (important):** the CRD is **`KradleWorkspacePolicy`** (plural
> `kradleworkspacepolicies`, short `kwp`), **not** `AgentWorkspacePolicy` (which appears only in
> `crd-schema-spec.md:29` and `resource-relationship-map.md`). Commander mirrors the YAML name.
Required: `organizationRef, mode, retentionPolicy`. Fields: `mode`, `retentionPolicy` (preserve),
`trustTier`, `cleanupPolicy` (preserve).

#### Identity kinds — `runtimeIdentity → AgentServiceAccount → AgentRoleBinding` chain
- **`AgentServiceAccount`** (`agent-resources.yaml:927-983`): required `organizationRef, namespace, serviceAccountName`; conditions `ServiceAccountSynced, TokenProjectionAllowed, Ready` (`agent-stack-management-spec.md:181`).
- **`AgentRoleBinding`** (`agent-resources.yaml:985-1046`): required `organizationRef, subject, roleRef, scope`; `subject`/`roleRef` preserve objects; `scope ∈ namespace|repository|organization|cluster`.
- **`AgentSecretGrant`** (`agent-resources.yaml:1048-1127`; body `crd-schema-spec.md:167-188`): required `organizationRef, subject, secretRef, purpose`; fields `allowedRepositories[]`, `allowedRefs{include,exclude}`, `allowedTriggerSources[]`, `mountPolicy`, `requiredApproval`, `rotationPolicy`. **Permissions can never be prompt-injected** (`glossary.md:54`).
- **`AgentConfigGrant`** (`agent-resources.yaml:1129-1196`; `crd-schema-spec.md:190-204`): required `organizationRef, subject, configMapRef, purpose`; `allowedRepositories[]`, `mountPolicy`.

#### `AgentTriggerRule` (`agent-resources.yaml:703-798`; body `crd-schema-spec.md:136-165`)
Required: `organizationRef, sources, taskKind` **and `anyOf[agentStack, agentDefinition]`** (the
CRD accepts either an `AgentStack` or an `AgentDefinition` target — `agent-resources.yaml:740-744`).
Fields: `lifecycleState` (`draft|active|paused|disabled|archived`), `sources[]`
(`ci|webhook|issue-comment|pr-comment|label|push|tag|schedule|manual|repository-dispatch`),
`match` (preserve: workflow/job/step/branch/path/label/actor/mention/JSONPath/failure-signature),
`promptTemplate`, `contextLabels[]`, `contextBundleTemplate` (preserve), `runnerPool`,
`approvalPolicy`, `dedupePolicy`, `concurrencyPolicy`, `writeBackPolicy`. Conditions
`SourceConfigured, MatcherValid, TargetStackReady, ContextTemplateValid, DedupePolicyValid,
LifecycleActive` (`agent-stack-management-spec.md:340-349`).

> **Identity-kind aside (present in YAML, NOT adopted as Commander entities):** the real chart
> also ships `AgentPersona/AgentSoul/AgentAppearance/AgentVoiceProfile/AgentDefinition`
> (`agent-resources.yaml:178-426`) — the "persona identity" layer the live dispatch route
> resolves (`dispatch/route.js:43`). Commander dispatches by **`agentStack`** (game has no persona
> system), so these are **out of model** except where the BFF requires an `agentDefinition`
> fallback (§3.4). Documented, not mirrored.

### 1.B — AGGREGATED_KINDS (execution records / projections, postgres-backed)

The aggregated CRDs are **schema-light** (`spec`/`status` are bare preserve-unknown objects in
`aggregated-resources.yaml`); their **field contracts come from `agent-stack-management-spec.md`
and `crd-schema-spec.md`** and from live BFF behavior. Commander mirrors those documented fields.

#### `AgentDispatchRun` (`aggregated-resources.yaml:711-746`; spec `crd-schema-spec.md:208-232`, `agent-stack-management-spec.md:261-284`)
The CI-like **logical run** (`glossary.md:13`). `spec`: `repository, ref, branch, sha, sourceEvent{kind,name},
sourceRefs{pullRequest,pipeline,job,triggerRule,issue,check,workItem}, agentStack, taskKind,
contextBundleRef, workspaceRef, runnerPool, approvalPolicy{requireWriteBackApproval}`.
`status`: `phase`, `agentMuxRunId`, `agentMuxSessionId`, `childSubagentRuns[]`, `artifacts[]`,
`approvals[]`, `cost`, `eventCursor`, queue times, permission-snapshot digest, terminal reason.
**Phases (the canonical union):** `pending | queued | running | waiting-for-approval | succeeded |
failed | cancelled` (`agent-stack-management-spec.md:277`). The **live BFF additionally emits
`Cancelled`/`Completed`/`Succeeded`/`Failed`** capitalized terminal phases (cancel route patches
`status.phase='Cancelled'`, `runs/[name]/cancel/route.js:23`; `run-actions.jsx:129` treats
`Completed|Succeeded|Cancelled|Failed` as terminal). Commander's mapper MUST accept **both casings**
(§4.2). Conditions: `ContextAssembled, WorkspaceResolved, RunnerAssigned, AgentMuxSessionBound,
ApprovalSatisfied, ArtifactsIndexed` (`agent-stack-management-spec.md:351-360`).

#### `AgentDispatchAttempt` (`aggregated-resources.yaml:748-783`; spec `crd-schema-spec.md:234-248`, `agent-stack-management-spec.md:286-303`)
The **concrete execution attempt** under one run — the **retry/resume/fork/continuation unit**
(`glossary.md:14`). `spec`: `agentDispatchRun, attemptReason (initial|retry|resume|repair|rerun-after-fix|continuation),
agentStackSnapshot{name,generation}, contextBundleDigest, permissionSnapshotDigest, workspaceRef,
runnerPool`. `status`: `agentMuxRunId, agentMuxSessionId, queueEnteredAt/startedAt/completedAt,
exitReason, producedArtifacts[], subagentEvents[]`; **`status.runtimeIdentity`/`status.runnerIdentity`
are immutable after launch** (`crd-schema-spec.md:248`). **This entity did not exist in Commander
before — it is the centerpiece of this cut.**

#### `AgentSession` (`aggregated-resources.yaml:785-820`; `glossary.md:15`)
Kradle's **projection of an Agent Adapter chat/session linked to a dispatch attempt**. `spec`:
`agentMuxSessionId, dispatchRun` (required per `crd-schema-spec.md:43`), `dispatchAttempt`. `status`:
`phase (Active|Completed|Aborted)`, turn/message counts, token usage, cost. Sibling content kinds
**`AgentSessionTranscript`** (`aggregated-resources.yaml:1081`) and **`AgentSessionAttachment`**
(`aggregated-resources.yaml:1118`) carry the transcript ring + attachments (UI `session-tabs.jsx`:
Transcript / Flow tabs).

#### Workspace / artifact / approval / trigger-exec / capability / work-item kinds
| kind | YAML | notes / naming delta |
|---|---|---|
| **`KradleWorkspace`** | `agent-resources.yaml:1765-1801` | the git worktree/runtime surface. **Real kind is `KradleWorkspace`** (short `kws`), with sibling **`KradleWorkspaceRuntime`** (`aggregated-resources.yaml:1155`, terminal/dev-server surface) — **not** the doc-only `AgentWorkspace` (`crd-schema-spec.md:44`). Documented status fields: `phase (created|ready|missing|conflicted|archived)`, `gitStatus{branch,headSha,ahead,behind,dirty,uncommittedCount}` (`workspace-lifecycle-spec.md`; mirrored today in `kradle-workspace.ts:23-37`). |
| **`KradleArtifact`** | `aggregated-resources.yaml:859-894` | durable agent output (diagnosis/patch/review/report). **Real kind is `KradleArtifact`** (short `kart`) — **not** `AgentArtifact`. Patch payload shape (`kradle-workspace.ts:56`): `{baseRef,targetBranch,fileList[],diffDigest,patchObjectRef,testEvidence{status,summary},applyStrategy}`. |
| **`Review`** | `aggregated-resources.yaml:303-341` | PR review decision (`pullRequest, decision, body`). **There is NO `AgentReviewArtifact` CRD** — the "review artifact" of the relationship map is a **`Review` + a `KradleArtifact`**. Commander models review output as `Review` ∪ `KradleArtifact(kind:'review')`. |
| **`AgentApproval`** | `aggregated-resources.yaml:896-931` | human/policy gate. Mirrored today (`kradle-workspace.ts:77`): `spec{dispatchRun, requestedBy{kind,name}, action{type,target,summary}, policyReasons[]}`, `status{phase(pending|approved|denied|completed), decision, feedback}`. |
| **`AgentContextBundle`** | `aggregated-resources.yaml:822-857` | digest-addressed redacted prompt/context snapshot (`glossary.md:16`): `{dispatchRun, digest, sources[]}`. |
| **`AgentTriggerExecution`** | `aggregated-resources.yaml:933-968` | durable record of a rule evaluation + created/coalesced/rejected decision (`glossary.md:29`): `{triggerRule, sourceEvent, decision}`. |
| **`AgentCapabilityRequirement`** | `aggregated-resources.yaml:970-1005` | computed dependency from stack/tool/mcp/skill/subagent → roles/secrets/configs (`glossary.md:18`; `agent-stack-management-spec.md:225-238`): `{ownerRef, requiredRoles[], requiredSecretRefs[], requiredConfigRefs[]}`, `status.missingGrants[]`. |
| **`WorkItemSessionLink`** | `aggregated-resources.yaml:1007-1042` | `{workItemRef, agentSession, runRefs[], linkSource, branchName, createdBy}`. |
| **`WorkItemWorkspaceLink`** | `aggregated-resources.yaml:1044-1079` | `{workItemRef, workspace, ...}`. |

#### Anchor kinds Commander reads (not agent-specific, but in the graph)
`Repository`, `PullRequest` (`aggregated-resources.yaml:174`), `Issue` (`:219`), `Pipeline` (`:343`),
`Job` (`:379`), `WebhookDelivery` (`:415`), `RunnerPool` (`:30`), `KradleProject` (`agent-resources.yaml:1379`).
These are the work-item / source / runner anchors (`resource-relationship-map.md:7-19`).

---

## 2. The corrected Commander CONTRACTS plan (`src/contracts/kradle-*.ts`)

> **Discipline:** mirror the kradle SDK types; **do NOT import `@a5c-ai/kradle-sdk`** (mirror it,
> exactly as `controllerClient.ts:7` already promises). TS strict, no `any` (use `unknown` +
> narrow), no new deps. UI-only metadata (world positions, progress rings, icons) stays OUT of
> these contracts (`kradle-resources.ts:12`).

### 2.1 Shared shell — **correct the phase enum** (`kradle-resources.ts`)
- **Replace** `KradlePhase = 'Ready' | 'Pending' | 'Failed'` (`kradle-resources.ts:24`) with the
  real CRD enum **`KradleResourcePhase = 'Pending' | 'Ready' | 'Blocked' | 'Error'`**
  (`agent-resources.yaml:169`). Keep `KradleCondition`, `KradleMetadata`, `KradleResourceStatus`,
  `KradleResource<TKind,TSpec>` (already faithful). Aggregated runs carry their **own** lowercase
  lifecycle phase in `status.phase` (§1.B) — model that as a distinct `AgentRunPhase` string union,
  NOT the resource phase.
- Add `KRADLE_GROUP = 'kradle.a5c.ai'`, the label-key constants
  (`kradle.a5c.ai/repository|agent-stack|trigger-rule|dispatch-run|source-kind|source-name|runner-pool|service-account|org`
  — `crd-schema-spec.md:251-262`, `resource-relationship-map.md:112-122`).

### 2.2 CONFIG kinds — add the composite + its referenced kinds
**Add** to `kradle-resources.ts` (or a new `kradle-config.ts`): full `AgentStackSpec` per §1.A
(superseding the truncated one at `kradle-resources.ts:75-98` — it is missing `internalTools`,
`externalTools`, `permissionRefs`, `secretPolicy`, `writeBackPolicy`, `contextLabelRefs`,
`workspacePolicyRef`, `agentsDocRef`, flat `systemPrompt/developerPrompt/taskPrompt`,
`memoryRepositoryRefs`, `atlasLayerBindings`, `jitsi*`, and `organizationRef`). Add typed specs +
`KradleResource<…>` aliases for: `AgentToolProfile`, `AgentMcpServer`, `AgentSkill`,
`AgentSubagent`, `AgentContextLabel`, `KradleWorkspacePolicy`, `AgentServiceAccount`,
`AgentRoleBinding`, `AgentSecretGrant`, `AgentConfigGrant`, `AgentTriggerRule`. **Reconcile
`kradle-stack.ts`:** keep `KradleAgentStack`/`KradleStackSpec` as the **sim-facing editable
subset** the foundry writes (`stack-builder.jsx`), but re-export it as a `Pick<>`/structural
subtype of the canonical `AgentStackSpec` so the two cannot drift; widen `KradleStackStatus.phase`
to the real enum.

### 2.3 AGGREGATED kinds — add the **Run→Attempt→Session** hierarchy (the core change)
**Add** `AgentDispatchAttemptSpec`/`AgentDispatchAttempt` and `AgentSessionSpec`/`AgentSession`
(plus `AgentSessionTranscript`, `AgentSessionAttachment`) per §1.B. **Extend**
`AgentDispatchRunSpec` (`kradle-resources.ts:116`) with the missing documented fields (`ref,branch,
sha` already present; **add** `issue`/`check`/`workItem` to `sourceRefs`, and a typed
`AgentRunPhase` + `AgentDispatchRunStatus{phase, agentMuxRunId, agentMuxSessionId, attemptRefs[],
artifacts[], approvals[], cost, eventCursor}`). **Rename** the workspace/artifact contracts to the
real kinds: in `kradle-workspace.ts`, the `AgentWorkspaceStatus` shape stays but is documented as
**`KradleWorkspace.status`**; `PatchArtifact` is documented as a **`KradleArtifact` of kind
`patch`**; add a `Review` mirror. `CommanderTask = AgentDispatchRun` (`kradle-resources.ts:152`)
**remains** the card-backing alias, but the card now *also* carries attempt + session refs (§4, §5).

### 2.4 What the OLD flat types become — and **roster REMOVED**
| old Commander symbol | becomes |
|---|---|
| flat `AgentStackSpec` (`kradle-resources.ts:75`) | the full composite §1.A (referenced kinds added). |
| `KradlePhase` (`:24`) | `KradleResourcePhase` (4-value) + separate `AgentRunPhase`. |
| `AgentDispatchRun.status` (untyped via shared `status`) | typed `AgentDispatchRunStatus` with mux/attempt/artifact/approval refs. |
| (absent) `AgentDispatchAttempt` | **added** as first-class mirrored entity. |
| (absent) typed `AgentSession` contract | **added** (today only `SimSessionView` exists in the sim layer). |
| `kradle-workspace.ts` `AgentWorkspaceStatus` / `PatchArtifact` | documented/renamed to **`KradleWorkspace`** / **`KradleArtifact`**. |
| **`SimRosterAgentView`** (`simulation.ts:361`) | **REMOVED** (no kradle kind; §5). |
| **the roster `Orders`** `createRosterAgent/deleteRosterAgent/assignTaskAgent` (`store.ts:1620-1625`) | **REMOVED** (§5). |
| **`mapRosterAgents`** (`backend/kradle/mappers.ts`) + roster `kradleOrders` (`kradleOrders.ts:302-322`) | **REMOVED** (§5). |

---

## 3. The real BFF client contract (method / path / body / auth)

> **Two resource gateways exist — name both, and mark which is REAL/live.** The
> `api-contract-spec.md` PROPOSES `/api/controller/resources*` (`api-contract-spec.md:63-79`), but
> **the live BFF actually exposes the org-scoped `/api/orgs/<org>/resources*`** (route source
> `orgs/[org]/resources/route.js`), and the live UI + Commander's own client use the org-scoped one
> (`run-actions.jsx:161`, `controllerClient.ts:18-22`). Commander targets the **org-scoped live
> routes**; the controller path is noted as the spec's proposed alias only.

**Auth (every request) (`api-auth.js` via `withAuth`; mirrored `controllerClient.ts:106`):**
`Authorization: Bearer <VITE_KRADLE_TOKEN>` when present; **mutating** methods (POST/PATCH/DELETE)
carry the CSRF double-submit header (`X-Kradle-Request: commander`, `controllerClient.ts:107`);
GETs send `cache: 'no-store'`; `403` on org-claim mismatch; 5 s abort timeout
(`controllerClient.ts:104`).

### 3.1 Generic resource CRUD (the CRD gateway)
| op | method | path | body | result |
|---|---|---|---|---|
| list a kind | GET | `/api/orgs/<org>/resources?kind=<Kind>[&limit&offset]` | — | `{items[]}` or paginated `{items,total,limit,offset,hasMore}` (`orgs/[org]/resources/route.js:16-34`). |
| apply (create/update) | POST | `/api/orgs/<org>/resources` | a full resource `{apiVersion,kind,metadata,spec}` | server scopes it (`metadata.namespace=orgNamespaceName(org)`, injects `labels[kradle.a5c.ai/org]` and `spec.organizationRef`), runs `validateResource` for known kinds (`422` on fail), `201` (`orgs/[org]/resources/route.js:40-60`). |
| read one | GET | `/api/orgs/<org>/resources/<kind>/<name>` | — | the resource (controller `getResource`). |
| delete one | DELETE | `/api/orgs/<org>/resources/<kind>/<name>` | — | `200`/`404` (live UI deletes `AgentDispatchRun` this way, `run-actions.jsx:161`). |

> Proposed alias (NOT live): `GET/POST /api/controller/resources?kind=…`,
> `GET/DELETE /api/controller/resources/<kind>/<name>` (`api-contract-spec.md:67-70`). The
> read-only **controller snapshot** `GET /api/controller?org=<org>` IS live and returns the UI
> model with `resources[]` summaries (`controller/route.js:8-20`) — Commander uses it for the
> initial board hydrate (already `controllerClient.ts:15`).

### 3.2 `/api/agents/*` actions — typed agent surface (live where noted)
| action | method | path (**live, org-scoped**) | body | notes |
|---|---|---|---|---|
| **dispatch** (create a run) | POST | `/api/orgs/<org>/agents/dispatch` | `{ agentStack \| agentDefinition \| stackRef, repository, ref, taskKind, actor, meetingRef? }` | LIVE (`dispatch/route.js:7-37`). Requires one of `agentDefinition/stackRef/agentStack` (`:16`). Returns `201 {run, attempt?, links?}` (`api-contract-spec.md:140`). |
| cancel | POST | `/api/orgs/<org>/agents/runs/<run>/cancel` | — | LIVE; patches `status.phase='Cancelled'` (`runs/[name]/cancel/route.js`). |
| retry | POST | `/api/orgs/<org>/agents/dispatch` | `{ stackRef }` of the run | LIVE; **retry = re-dispatch** (`run-actions.jsx:187`). (The `…/runs/<run>/retry` typed route is proposed-only, `api-contract-spec.md:151`.) |
| resume / fork / continue | POST | `/api/orgs/<org>/agents/runs/<run>/{resume,fork,continue}` | `{reason,message,expectedGeneration}` | **PROPOSED** (`api-contract-spec.md:152-154`) — **not live**. Commander treats these as documented gaps (see `KRADLE-EXTENSIONS-NEEDED.md` E-RUNACTIONS). |
| approval decision | POST | `/api/orgs/<org>/agents/approvals/<name>/decide` | `{decision:'approve'\|'deny', comment?, approvedActionSubset?[], expectedArtifactDigest?}` | LIVE route exists (`web/app/api/orgs/[org]/agents/approvals/[name]/decide/route.js`); Commander already targets it (`controllerClient.ts:22`). (Spec calls it `/decision`, `api-contract-spec.md:180` — the live path is `/decide`.) |
| stacks CRUD | GET/POST/PATCH/DELETE | via §3.1 generic on `kind=AgentStack`, **or** the live `…/agents/definitions[/<name>]` (`controllerClient.ts:16`) | resource / patch body | The live builder POSTs an `AgentStack` to `/api/orgs/<org>/resources` (`stack-builder.jsx:77`); the definitions route is the persona path. |
| rules | GET/POST + `…/rules/<rule>/{dry-run,lifecycle,replay-delivery}` | proposed `/api/agents/rules*` (`api-contract-spec.md:204-209`) | rule resource | **Generic CRUD on `kind=AgentTriggerRule` is live via §3.1**; the typed dry-run/lifecycle actions are proposed-only. |
| secrets / grants | GET `…/secrets`, POST `…/secrets/grants` / `…/config/grants`, GET `…/capability-requirements` | proposed (`api-contract-spec.md:215-219`) | grant resource | **Generic CRUD on `kind=AgentSecretGrant`/`AgentConfigGrant`/`AgentCapabilityRequirement` is live via §3.1**; the typed grant wizards are proposed. **Grant APIs expose Secret metadata + key names only, never values** (`api-contract-spec.md:221`, `ui-flow-spec.md:84`). |

### 3.3 Watch / SSE (two live shapes)
- **Generic CRD watch:** `GET /api/watch/orgs/<org>/<plural>` — SSE, `event: kradle` frames, scoped
  to `/orgs/{org}/{resource}` (404 otherwise), emits a `SYNC` then per-resource line frames
  (`watch/[[...resource]]/route.js:8-49`). Plurals: `agentdispatchruns, agentdispatchattempts,
  agentsessions, agentapprovals, kradleworkspaces, agenttriggerrules` (`api-contract-spec.md:227-230`).
- **Aggregated agent event stream:** `GET /api/orgs/<org>/agents/events/stream` (EventSource) —
  the live high-level stream Commander's client subscribes to (`controllerClient.ts:20,437`).
- **Degradation:** when no `EventSource` is available, Commander polls the snapshot on the 5 s
  interval (already the realBoot contract, `realBoot.ts:13`).

### 3.4 `agentStack` vs `agentDefinition` dispatch
The live dispatch route accepts **either** `agentStack`/`stackRef` (legacy AgentStack path) **or**
`agentDefinition` (persona identity path, which server-side loads
`AgentDefinition+Persona+Soul+Appearance+VoiceProfile+AgentStack`, `dispatch/route.js:43-49`).
Commander dispatches **by stack** (`agentStack`/`stackRef`) since it has no persona system; it
passes `agentDefinition` only if a future persona feature lands. Mirror both keys in the dispatch
body type.

---

## 4. The corrected RESOURCE → VIEW mapping (kradle CRD → `Sim*View`)

> Reads are deterministic per snapshot (no rng) — every `Sim*View` is a pure projection of the
> latest `KradleControllerSnapshot` (`realBoot.ts:14`). The mapper lives in
> `src/backend/kradle/mappers.ts`.

### 4.1 The **Run → Attempt → Session** hierarchy (the headline fix)
| level | kradle kind | Commander view | hierarchy rule |
|---|---|---|---|
| run | `AgentDispatchRun` | `SimCardView` (board card) **+** `SimRunView` (runs-registry row) | one card per run (`simulation.ts:228,480`). |
| attempt | **`AgentDispatchAttempt`** | a new `SimAttemptView` (added) **and** `SimCardView.attempt` = count of attempts for the run | attempts grouped by `spec.agentDispatchRun`; newest attempt drives the card's live state; `attemptReason` shown on the run inspector (§5). |
| session | `AgentSession` (+`AgentSessionTranscript`) | `SimSessionView` / `SimSessionDetailView` | sessions grouped by `spec.dispatchAttempt` (preferred) falling back to `spec.dispatchRun`; `SimCardView.agentIds` = sessions of the **active** attempt with `status.phase==='Active'`. |

This replaces the superseded "run *is* the card, sessions keyed by unitId" flattening
(`SPEC-KRADLE-CONTROLPLANE.md:441-442`) with the true three-level graph
(`resource-relationship-map.md:51-65`).

### 4.2 Run phase → board column (corrected; both casings)
`ColumnId = 'backlog'|'do'|'ai-review'|'human-review'|'approved'|'merged'|'in-production'`
(`game/board.ts:14`, `simulation.ts:115`). Map `AgentDispatchRun.status.phase` (lowercase union
§1.B **and** the live capitalized terminals) refined by `AgentApproval` state + Commander labels:

| run phase (+ refinement) | `ColumnId` | rationale |
|---|---|---|
| `pending`/`Pending`, `queued`/`Queued` (no workspace) | `backlog` | created, not executing. |
| `running`/`Running` | `do` | actively working. |
| `running` + a pending **review-kind** `AgentApproval`, or `taskKind==='review'` mid-flight | `ai-review` | automated review stage. |
| `waiting-for-approval` / `AwaitingApproval` (pending `AgentApproval` action `write-back`/`release`/`tool-use`) | `human-review` | blocked on a human gate. |
| `succeeded`/`Succeeded`/`Completed` + approved write-back, `labels['commander.a5c.ai/merged']!=='true'` | `approved` | passed review, awaiting integration. |
| `…` + `labels['commander.a5c.ai/merged']==='true'` | `merged` | integrated. |
| `…` + `labels['commander.a5c.ai/release-id']` present | `in-production` | shipped on a release train. |
| `failed`/`Failed`, `cancelled`/`Cancelled` | `backlog` | returned for rework. |

> The `merged` / `in-production` / `release-id` refinements are a **Commander label convention**
> (`commander.a5c.ai/merged`, `/release-id`) because kradle's run has **no** merged/in-production
> phase — see `KRADLE-EXTENSIONS-NEEDED.md` **E-LIFECYCLE / E-RELEASE-RAIL**. Absent the labels the
> base phase mapping applies, keeping the function total + deterministic.

### 4.3 `SimCardView` / `SimRunView` field map (delta from §2.3.x of the superseded spec)
Inherit the field map at `SPEC-KRADLE-CONTROLPLANE.md:427-452` with these corrections:
- `attempt` ← **count of `AgentDispatchAttempt`** for the run (now a real entity), not `status.attempt`.
- `agentIds` ← sessions of the **active attempt** (was: all sessions of the run).
- `workerAgentId`/`reviewerAgentId` (`simulation.ts:258-260`) ← **REMOVED** with roster (§5); the
  card no longer carries roster assignment labels.
- `dirtyFileCount` ← the run's **`KradleWorkspace`** `gitStatus.uncommittedCount` (§4.4).
- `merged`/`releaseId`/`compacted` stay label/column-derived (Commander convention).

### 4.4 Workspace / artifacts / approvals / triggers surfacing
- `SimWorkspaceView` / `SimWorkspaceSummaryView` (`simulation.ts:394,431`) ← **`KradleWorkspace`**
  (+`KradleWorkspaceRuntime` for terminal/dev-server surfaces); `gitStatus`, `files[]` (from the
  run's `KradleArtifact` patch `fileList`/diff), `testEvidence` ← patch `testEvidence`.
- `SimRunObservationView.phases` (`simulation.ts:403`) ← the run's
  `status.conditions`/`AgentDispatchAttempt` timeline projected to a phase pipeline; the active
  phase drives `runStages` in `commitTick` (`store.ts:1664-1669`).
- **Approvals** ← `AgentApproval`: surface as `hasPendingInquiry` on the card and as the Human
  Review panel + Approvals registry tab (§5). Decision via §3.2 `…/approvals/<name>/decide`.
- **Trigger rules / executions** ← `AgentTriggerRule` / `AgentTriggerExecution`: a new Rules
  registry tab (§5) lists rules with `lifecycleState` + last `AgentTriggerExecution.decision`.
- **Artifacts** ← `KradleArtifact` (+`Review`): patch/diagnosis/review artifacts on the run
  inspector and Review panel.

### 4.5 Composite `AgentStack` → stack-builder view
`SimStackView` (`simulation.ts:459`) stays `{stackRef,name,custom,stack}` but `stack` is now the
**full composite** §1.A. The stack-builder view (§5) renders the stack as **layers**: each
`*Ref(s)` field becomes a resolved layer (tool/mcp/skill/subagent/context-label/workspace-policy/
identity), each with the referenced resource's `status.phase` + the stack's readiness conditions —
matching kradle's per-layer stack-builder (`stack-builder-graph-nodes.jsx` `LayerSection`,
`ui-flow-spec.md:39-49`).

### 4.6 Memory (unchanged surface, kinds confirmed)
`SimMemorySiloView` (`simulation.ts:447`) / `getMemoryIO` ← `AgentMemoryRepository` +
`AgentMemoryQuery`/`AgentMemoryUpdate` (`agent-resources.yaml:1505`,
`aggregated-resources.yaml:1192`); fix its `phase: KradlePhase` to the 4-value enum. Query via the
live `/api/orgs/<org>/agents/memory/query` (`controllerClient.ts:21`).

---

## 5. The UI ENTITY-MODEL rework plan

### 5.1 Foundry: stacks tab → a **stack-builder composition** (replace the flat form)
The Foundry `stacks` tab (`Foundry.tsx:140` `StacksTab`) currently edits the flat
`KradleStackSpec` (name/baseAgent/approvalMode/model/3 prompts/3 comma-lists). Replace with a
**layered composition builder** mirroring kradle's (`stack-builder-graph*.jsx`,
`ui-flow-spec.md:39`):
- **Layers (one section each):** tool profile (`AgentToolProfile`), MCP servers (`AgentMcpServer`),
  skills (`AgentSkill`), subagents (`AgentSubagent`), context labels (`AgentContextLabel`),
  workspace policy (`KradleWorkspacePolicy`), runtime identity
  (`runtimeIdentity → AgentServiceAccount → AgentRoleBinding`), runner pool (`RunnerPool`),
  write-back policy.
- Each layer is a per-layer search/select section (the kradle `LayerSection` pattern) populated by
  a §3.1 `GET …/resources?kind=<Kind>` list; selection writes the corresponding `*Ref(s)` array on
  the `AgentStack`.
- **Readiness conditions panel:** render `status.conditions` (`CapabilitiesResolved … Ready`,
  §1.A) with True/False/Unknown + reason, so the operator sees why a stack is not `Ready` (the
  kradle permission-review/readiness UX, `ui-flow-spec.md:50-62`).
- Save POSTs the composite `AgentStack` via §3.1 (the live builder already POSTs an `AgentStack` to
  `/api/orgs/<org>/resources`, `stack-builder.jsx:77`).

### 5.2 **REMOVE roster agents** (sanctioned)
Delete the entire roster concept — it has no kradle entity:
- **Foundry `agents` tab** (`Foundry.tsx:308-380` `AgentsTab`/`RosterAgentRow`) → **removed**; the
  Foundry drops to two tabs (`commission`, `stacks`). The `FoundryTab` union
  (`Foundry.tsx:41`) loses `'agents'`.
- **`SimRosterAgentView`** (`simulation.ts:361`), the `rosterAgents` store slice
  (`store.ts:182,297,957,1680`), and the assignment chips on cards
  (`workerAgentId`/`reviewerAgentId`/`humanAssigneeId` roster bits, `simulation.ts:258-262`) →
  **removed**. (Keep `humanAssigneeId` only if it maps to an `AgentApproval` requestedBy 'user'
  gate; otherwise remove.)
- **`Orders` roster verbs** `createRosterAgent`/`deleteRosterAgent`/`assignTaskAgent` and
  `assignTaskHuman` roster path (`store.ts:1620-1627`) → **removed**.
- **`backend/kradle`**: `mapRosterAgents` and the `kradleOrders` roster handlers
  (`kradleOrders.ts:302-322`) + `realViewsStub.listRosterAgents` (`realBoot.ts:82`) + `SimViews.listRosterAgents`
  (`views.ts:34`) → **removed**. The RegistryOverlay roster references
  (`RegistryOverlay.tsx`) and KanbanBoard roster chips → **removed**.
- **Replacement (if any worker/reviewer attribution is still wanted):** show the **session**
  (`AgentSession` creature) attached to the active attempt — that is the real kradle "who worked
  this" signal, not a pre-recruited roster.

### 5.3 Registry overlay tabs → kradle's agent pages
Re-tab the Registry overlay (`RegistryOverlay.tsx`) to mirror kradle's
`/agents/{stacks,runs,rules,workspaces,approvals,secrets}` (`resource-relationship-map.md:96-104`,
`ui-flow-spec.md:16-27`):
| tab | primary kind | shows |
|---|---|---|
| **Stacks** | `AgentStack` | composition + readiness (§5.1). |
| **Runs** | `AgentDispatchRun` → `AgentDispatchAttempt` → `AgentSession` | run rows; expand → attempts → sessions (§5.4). |
| **Rules** | `AgentTriggerRule` | lifecycleState + last `AgentTriggerExecution`. |
| **Workspaces** | `KradleWorkspace` | git state, linked runs/sessions. |
| **Approvals** | `AgentApproval` | pending gates + decide action. |
| **Secrets** | `AgentSecretGrant`/`AgentConfigGrant` | metadata + key names only (never values). |
(The existing roster/agents Registry tab is removed with §5.2.)

### 5.4 Cards / inspector show **Run → Attempt → Session**
- **Card** (`KanbanBoard.tsx`): badge the **attempt count** (`AgentDispatchAttempt` count) and the
  active **session** creature; remove roster chips.
- **Inspector** (`Inspector.tsx`): the run inspector gains an **Attempts** sub-panel (each
  `AgentDispatchAttempt` with `attemptReason`/`exitReason`/timings) and, under the active attempt,
  the **Sessions** list (`SimSessionView`) with the existing Transcript/Flow tabs
  (`SessionsTab.tsx`, `session-tabs.jsx`). Run-action footer (`run-actions.jsx`): `Cancel`
  (live), `Retry`=re-dispatch (live); `Resume/Fork/Continue` rendered **disabled with a
  "kradle-gap" tooltip** until the proposed routes ship (§3.2, E-RUNACTIONS).

### 5.5 Tests that change / are removed
- **Removed:** roster tests — `simulation.ts` roster coverage, `store.ts` roster orders,
  `backend/kradle/__tests__/{mappers,kradleOrders}.test.ts` roster cases,
  `game/__tests__/panels.test.ts` Foundry-agents-tab assertions, any `data-testid` like
  `foundry-tab-agents`, `roster-row`, `roster-empty`, `assign-worker`/`assign-reviewer`.
- **Changed:** Foundry tests assert **two** tabs; stack tests assert the layered composition +
  readiness conditions; card/inspector tests assert **attempt count + session list** (new
  `attempt-row`/`session-row` testids) instead of roster chips; mapper tests assert the
  Run→Attempt→Session grouping and the corrected phase→column table (both casings).
- **Mock determinism (`backend/mock/__tests__/determinism.test.ts`) MUST stay green** — the mock is
  byte-identical (§6).

---

## 6. Invariants (acceptance criteria)

- **AC1 — Faithful entity model.** Commander's contracts mirror the real kradle CRDs field-by-field
  per §1: CONFIG composite **`AgentStack`** + `AgentToolProfile`/`AgentMcpServer`/`AgentSkill`/
  `AgentSubagent`/`AgentContextLabel`/`KradleWorkspacePolicy`/`AgentServiceAccount`/
  `AgentRoleBinding`/`AgentSecretGrant`/`AgentConfigGrant`/`AgentTriggerRule`; AGGREGATED
  **`AgentDispatchRun → AgentDispatchAttempt → AgentSession`** + `KradleWorkspace`/`AgentApproval`/
  `AgentContextBundle`/`KradleArtifact`/`Review`/`AgentTriggerExecution`/`AgentCapabilityRequirement`/
  `WorkItemSessionLink`/`WorkItemWorkspaceLink`. Real kind names and the `status.phase`
  `[Pending,Ready,Blocked,Error]` enum are used (no `Ready|Pending|Failed`).
- **AC2 — Run→Attempt→Session hierarchy is first-class.** `AgentDispatchAttempt` is a real mirrored
  entity; cards/inspector/runs registry render the three levels (§4.1, §5.4); the flattening is
  gone.
- **AC3 — roster REMOVED.** No `SimRosterAgentView`, no roster `Orders`, no `mapRosterAgents`, no
  Foundry agents tab, no assignment chips, no roster tests (§2.4, §5.2). Removal is sanctioned.
- **AC4 — Real BFF contract.** Commander targets the **live org-scoped** routes (§3): generic
  `/api/orgs/<org>/resources*`, `/api/orgs/<org>/agents/dispatch`, `…/runs/<run>/cancel`,
  `…/approvals/<name>/decide`, the `/api/watch/orgs/<org>/<plural>` SSE and the
  `…/agents/events/stream`; proposed-only routes (`resume/fork/continue`, typed rules/grants,
  `/api/controller/resources`) are documented as such and not assumed live.
- **AC5 — Mock is the byte-identical default.** The deterministic MOCK backend and
  `bindBackendToStore` are untouched; mock-mode output and determinism tests are byte-identical
  (`realBoot.ts:21`). The kradle re-model touches the **real** path + the **contracts/UI** only.
- **AC6 — kradle path env-gated + additive.** All kradle behavior is constructed **only when
  `VITE_KRADLE_API_URL` is set** (`realBoot.ts:11-20`); it composes additively with the gateway
  binding (neither producer writes the other's `commitTick` slice).
- **AC7 — Discipline.** TS strict, **no `any`** (use `unknown`+narrow), **no new deps**, and **do
  NOT import `@a5c-ai/kradle-sdk`** — mirror it (`controllerClient.ts:7`). UI-only metadata stays
  out of the mirrored contracts.
- **AC8 — Planned file paths.**
  - `apps/commander/src/contracts/kradle-resources.ts` — corrected shell + phase enum + extended
    `AgentDispatchRun`/`AgentStack`; add `AgentDispatchAttempt`, `AgentSession`(+transcript/attachment).
  - `apps/commander/src/contracts/kradle-config.ts` *(new)* — the CONFIG referenced kinds
    (`AgentToolProfile`…`AgentTriggerRule`).
  - `apps/commander/src/contracts/kradle-stack.ts` — re-typed as a subset of the composite.
  - `apps/commander/src/contracts/kradle-workspace.ts` — `KradleWorkspace`/`KradleArtifact`/`Review`
    naming.
  - `apps/commander/src/contracts/index.ts` — export the new types.
  - `apps/commander/src/backend/kradle/mappers.ts` — Run→Attempt→Session grouping, corrected
    phase→column, **remove `mapRosterAgents`**.
  - `apps/commander/src/backend/kradle/kradleOrders.ts` — **remove roster verbs**; keep
    dispatch/cancel/decide.
  - `apps/commander/src/backend/kradle/controllerClient.ts` — add attempt/session/resources list
    endpoints; keep the mirrored (non-SDK) discipline.
  - `apps/commander/src/backend/mock/simulation.ts` — **remove `SimRosterAgentView`** + roster
    records/methods; add `SimAttemptView`.
  - `apps/commander/src/backend/real/realBoot.ts` — drop `listRosterAgents` from `realViewsStub`.
  - `apps/commander/src/game/views.ts` — drop `listRosterAgents`; add attempt view accessor.
  - `apps/commander/src/game/store.ts` — drop roster slice + roster `Orders`.
  - `apps/commander/src/components/panels/Foundry.tsx` — two tabs; layered stack builder.
  - `apps/commander/src/components/panels/RegistryOverlay.tsx` — Stacks/Runs/Rules/Workspaces/
    Approvals/Secrets tabs.
  - `apps/commander/src/components/panels/Inspector.tsx` + `SessionsTab.tsx` — Attempts→Sessions.
  - `apps/commander/src/components/board/KanbanBoard.tsx` — attempt/session badges; remove roster
    chips.

> **Grep anchors (the gate checks the spec literally contains these):**
> `AgentDispatchAttempt`, `AgentToolProfile`, `roster`.
