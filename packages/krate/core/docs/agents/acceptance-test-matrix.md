# Agent acceptance test matrix

## Purpose

This matrix turns the docs into validation work for implementation. It follows existing Krate validation style: start with resource/controller unit tests, then API route tests, UI validation, package/chart checks, and e2e flows.

## Existing validation anchors

Current commands to preserve:

- `npm run validate:docs`
- `npm run package:check`
- `npm run ui:validate`
- `npm test`
- `npm run e2e`
- `npm run check`

## Resource/schema tests

| Scenario | Expected proof |
| --- | --- |
| Agent config kinds appear in `CONFIG_KINDS` | `resourceSchemaForKind()` returns plural, storage, required fields. |
| Agent execution kinds appear in `AGGREGATED_KINDS` | list schema returns postgres/object-storage intent. |
| Conditions use stable fields | schema accepts type/status/reason/message/observedGeneration. |
| `AgentSecretGrant` never stores values | schema rejects value-like fields. |
| `AgentDispatchAttempt` identity snapshot immutable | update attempts cannot mutate runtime identity after launch. |

## Controller tests

| Controller | Scenario | Expected proof |
| --- | --- | --- |
| stack | missing tool Secret grant | `SecretsAdmitted=False`, `Ready=False`. |
| stack | all requirements satisfied | stack `Ready=True`. |
| rbac | role escalation attempted | no native binding apply; condition false; audit event. |
| secret/config | Secret key deleted | dependent stacks blocked; active runs marked stale. |
| trigger | duplicate failed check | second execution coalesces. |
| dispatch | Agent Mux unavailable | attempt remains queued/starting with retry condition. |
| dispatch | launch option rejected | attempt failed with adapter rejection reason. |
| workspace | missing worktree path | workspace missing state and recover/archive actions. |
| approval | artifact digest changed | approval decision rejected. |

## API tests

| Route | Scenario | Expected proof |
| --- | --- | --- |
| `POST /api/agents/permissions/review` | missing Secret grant | `decision=denied`, reason includes missing grant, no secret value. |
| `POST /api/agents/runs` | valid manual dispatch | creates run + attempt before Agent Mux launch. |
| `POST /api/agents/runs` | denied RBAC | returns `403 POLICY_DENIED`. |
| `POST /api/agents/rules/:rule/dry-run` | matching CI event | returns prompt/context/dedupe/permission preview. |
| `POST /api/agents/approvals/:approval/decision` | valid approver | approval updated and write-back accepted. |
| `GET /api/watch/orgs/[org]/agentdispatchruns` | watch connected | emits initial SYNC event and resource updates. |

## UI validation

| Surface | Scenario | Expected proof |
| --- | --- | --- |
| stack builder | missing Secret grant | blocking warning with suggested fix. |
| stack builder | ready stack | save/dispatch actions enabled by server state. |
| repo code page | manual dispatch | composer prefilled with repo/ref/path. |
| repo runs page | agent run exists | dispatch appears beside pipeline/job rows. |
| run detail | session pending | handoff state shown until session bound. |
| run detail | approval blocked | approval card and disabled write-back controls shown. |
| settings agents tab | ServiceAccount selected | RBAC/grants/runner policy visible. |
| secrets page | Secret listed | key names and consumers visible, no values. |
| permissions page | drifted RoleBinding | drift warning and fix path visible. |

## E2E flows

### Manual dispatch from code

1. Create `AgentStack`, ServiceAccount, grants, and workspace policy.
2. Open repository code page.
3. Dispatch agent with selected path.
4. Verify `AgentDispatchRun`, attempt, context bundle, permission snapshot, and run detail link.

### Failed CI repair

1. Create failed `Pipeline`/`Job` event.
2. Trigger rule matches and creates `AgentTriggerExecution`.
3. Dispatch appears beside pipeline.
4. Agent produces patch artifact.
5. Write-back requires approval.

### Missing secret remediation

1. Enable tool requiring Secret.
2. Stack builder shows missing grant.
3. Create `AgentSecretGrant` from wizard.
4. Stack readiness turns ready.
5. Dispatch proceeds.

### Untrusted fork denial

1. Simulate fork PR event.
2. Rule selects repair stack.
3. Permission review denies privileged ServiceAccount/Secret.
4. UI shows untrusted-fork reason and no launch occurs.

### Approval write-back

1. Agent creates PR comment request.
2. Approval inbox shows action.
3. Maintainer approves comment only.
4. Controller posts comment idempotently and records audit.

## Package/chart tests

| Scenario | Expected proof |
| --- | --- |
| Agent CRDs in chart | `package:check` includes required CRDs and examples. |
| Helm values include feature gates | values validation covers Agent Mux URL, default ServiceAccount, grants. |
| Examples stay valid | examples use known kinds and required fields. |
| Docs stay linked | `validate:docs` sees all agent docs in README index. |

## Done gate for first implementation slice

The first implementation slice is not complete until these are green:

- resource/schema tests for `AgentStack`, `AgentServiceAccount`, `AgentSecretGrant`, `AgentDispatchRun`;
- permission review API tests;
- stack builder missing-grant UI validation;
- manual dispatch API test;
- run detail pending-session UI validation;
- docs/package validation.

## Company brain memory acceptance

| Area | Acceptance gate |
| --- | --- |
| Memory repository | can create/adopt `AgentMemoryRepository` and validate layout. |
| Ontology | invalid node kinds, edge kinds, dangling edges, and missing owners fail validation. |
| Context | dispatch bundle records requested ref, resolved commit, selected records, grep excerpts, and digests. |
| Historical refs | `refAt` resolves to the latest approved commit before timestamp and retries stay pinned. |
| Permissions | denied memory paths/kinds never leak content into preview, prompt, tools, or audit. |
| Tools | memory tools operate against dispatch snapshot and require explicit grants. |
| Updates | agent memory proposals become validated PR/update records before merge. |
| UI | `/agents/memory`, dispatch composer, run detail, and repository settings expose memory state and warnings. |

## Org scoping acceptance

| Area | Acceptance gate |
| --- | --- |
| Namespace | creating an org creates or binds one Kubernetes namespace. |
| Repositories | repositories cannot be created without org scope. |
| Deployments | deployment/environment resources are org-scoped and namespace-bound. |
| Agents | stacks, triggers, runs, sessions, workspaces, and runners stay inside org scope. |
| Memory | company brain query/update/import cannot cross org boundaries. |
| Babysitter imports | `MEMORY.md`, sessions, journals, task results, and artifact manifests import only after redaction and org permission review. |
| UI | routes, breadcrumbs, search, and YAML panels show org and namespace. |

## Run memory import acceptance details

| Scenario | Expected result |
| --- | --- |
| Import completed run with summary tier | creates normalized run/session/task files and opens review. |
| Import active run without policy | blocks with clear condition. |
| Import run from another org | fails with `CROSS_ORG_REF_DENIED`. |
| Import journal containing secret-like content | redacts or blocks before PR creation. |
| Import duplicate source digest | no duplicate PR; status points to existing memory commit. |
| Import with ontology error | branch may exist, merge blocked, validation report shown. |
| Query imported run memory from dispatch | selected content is pinned to memory commit and shown in context preview. |

## Current app seam acceptance

| Area | Acceptance gate |
| --- | --- |
| Org navigation | `Agents` appears under existing org navigation and preserves current org switcher behavior. |
| Agent routes | `/orgs/[org]/agents/*` pages render only with org context and never use a global unscoped agent root as canonical. |
| Repository integration | existing repo Code, Issues, Pull Requests, Runs, Hooks, and Settings pages link to agent/memory flows with org and repo context. |
| Resource API | new agent/memory resources can be listed through `/api/orgs/[org]/resources` after resource model support. |
| Watch API | agent runs and memory imports can stream through org-scoped watch filters without cross-org leakage. |
| Route guard | run/memory detail pages reject resources whose org label or namespace does not match the route. |
| Advanced YAML | generated resource YAML includes namespace, org label, and `organizationRef`. |

## Org memory vertical slice acceptance

| Flow | Acceptance gate |
| --- | --- |
| Bootstrap | org has namespace binding and memory repo health visible. |
| Configure | repository settings can attach an `AgentMemorySource`. |
| Dispatch | manual dispatch creates memory snapshot and context bundle. |
| Run detail | run shows memory commit, query manifest, selected excerpts, and digests. |
| Import | summary-only run import creates redacted, validated memory update. |
| Reuse | later dispatch can query imported run/session summary. |
| Isolation | another org receives `CROSS_ORG_REF_DENIED` and no memory content. |

## E2E fixture reference

The deterministic fixture set for org memory is defined in [Org memory E2E fixture plan](./org-memory-e2e-fixture-plan.md). Acceptance tests should include duplicate repository slugs across orgs, a seed company brain repo, a redaction-bearing `.a5c` run, manual dispatch with memory, summary-only import, cross-org denial, and historical memory pinning.

## QA matrix reference

Product-wide test coverage expectations live in `docs/tests/product-test-matrix.md`. Agent-specific rows in this matrix should be treated as future required coverage once agent resources, Agent Mux integration, company brain memory, and `.a5c` imports move from docs to implementation.
