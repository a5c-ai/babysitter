# Agent traceability matrix

## Purpose

This matrix maps product requirements to resources, controllers, UI surfaces, docs, and validation gates. It is intended for implementation reviews and PR checklists.

## Requirement traceability

| Requirement | Resources | Controllers/APIs | UI surfaces | Primary docs | Validation |
| --- | --- | --- | --- | --- | --- |
| Define an agent stack | `AgentStack`, tools, MCP, skills, subagents | stack controller, resource API | `/agents/stacks` | stack, CRD, tools, subagent specs | schema + UI validation |
| Validate ServiceAccount/RBAC | `AgentServiceAccount`, `AgentRoleBinding` | RBAC controller, permission review API | `/agents/permissions`, stack builder | RBAC spec | permission tests |
| Grant Secret/Config access | `AgentSecretGrant`, `AgentConfigGrant` | secret/config controller | `/agents/secrets`, grant wizards | RBAC spec, tools spec | no-secret-value tests |
| Assemble prompt/context | `AgentContextBundle`, context labels | context bundle service | dispatch composer, run detail | context spec | redaction tests |
| Dispatch manually from repo | `AgentDispatchRun`, `AgentDispatchAttempt` | dispatch API/controller | Code/Runs pages | MVP, API, repo integration | API + UI tests |
| Show CI-like run | dispatch run/attempt/session | dispatch controller, watch API | `/agents/runs`, repo Runs | UI flow, repository integration | UI validation |
| Bind Agent Mux session | attempt/session | Agent Mux client | run detail chat panel | adapter contract | gateway fallback tests |
| Manage tools/MCP/skills | tool/MCP/skill resources | stack/capability controllers | `/agents/tools`, `/mcp`, `/skills` | tools spec | capability tests |
| Run subagents | `AgentSubagent`, attempts/artifacts | dispatch/subagent controller | run detail subagent tree | subagent spec | child permission tests |
| Produce artifacts | artifacts/review artifacts | artifact service | run/PR/issue/pipeline pages | artifacts spec | digest tests |
| Gate write-back | approvals/artifacts | approval controller | inbox/run detail | artifacts, security specs | idempotency tests |
| Trigger from CI/webhook | trigger rules/executions | trigger controller | rules/hooks/pipelines | CI, trigger, API specs | dry-run/dedupe tests |
| Manage workspace lifecycle | workspace/link resources | workspace controller | workspaces/issues/PR/run | workspace spec | lifecycle tests |
| Observe and audit | audit/events/metrics | all controllers | run detail/insights | observability spec | audit/no-secret tests |
| Package/deploy agents | CRDs/chart values/templates | chart/package validation | operations install | chart spec | package check |

## File traceability

| Future implementation file | Governing docs |
| --- | --- |
| `src/resource-model.js` | CRD schema, MVP, developer checklist |
| `src/kubernetes-controller.js` | CRD schema, controller reconciliation, chart spec |
| `src/controller-ui.js` | UI flow, repository integration, observability |
| `src/api-controller.js` | API contract, controller reconciliation |
| `src/agent-permission-review.js` | RBAC spec, API contract, MVP |
| `src/agent-stack-controller.js` | stack spec, tools spec, RBAC spec |
| `src/agent-context-bundles.js` | context assembly spec |
| `src/agent-dispatch-controller.js` | controller reconciliation, adapter contract, MVP |
| `src/agent-mux-client.js` | Agent Mux adapter contract |
| `src/agent-trigger-controller.js` | CI spec, controller reconciliation |
| `src/agent-workspace-controller.js` | workspace lifecycle spec |
| `src/agent-approval-controller.js` | artifacts/write-back spec |
| `apps/web/app/agents/*` | UI flow, repository integration |
| `charts/krate/*` | chart packaging, storage migration |
| `examples/agents/*` | resource examples, package validation |
| `tests/*` | acceptance test matrix |

## Review checklist

Before merging implementation work, reviewers should ask:

- Which requirement row does this change satisfy?
- Which resource/controller/UI path backs the user action?
- Does the change preserve current generic resource/watch APIs?
- Are Secret values excluded from responses/status/logs/tests?
- Are denied states explainable from server-side conditions?
- Did package/docs/UI validation run?
- Did the PR update the affected docs and examples?

## Org memory traceability

| Requirement | Resources | Controllers | UI | Docs | Validation |
| --- | --- | --- | --- | --- | --- |
| Org namespace isolation | `Organization`, `OrgNamespaceBinding` | org controller, admission | org switcher, YAML panels | org scoping spec | cross-org rejection tests |
| Company brain per org | `AgentMemoryRepository`, `AgentMemorySource` | memory controller | `/orgs/[org]/agents/memory` | memory specs | memory query permission tests |
| Babysitter run memory import | `AgentRunMemoryImport`, `AgentRunJournalEvent` | memory import controller | memory imports panel | memory runbook | redaction/import validation |
| Historical memory dispatch | `AgentMemorySnapshot`, `AgentMemoryQuery` | context assembler | dispatch memory advanced panel | context integration | refAt resolution tests |

## Current app seam traceability

| Seam | Current file | Agent/memory use |
| --- | --- | --- |
| Org shell/navigation | `apps/web/app/ui-shell.jsx` | add Agents nav, memory attention counters, org breadcrumbs. |
| Org routes | `apps/web/app/orgs/[org]/*` | add `/agents/*` and `/agents/memory/*`. |
| Repo tabs | `apps/web/app/orgs/[org]/repositories/[repo]/*` | add dispatch actions, linked sessions/workspaces, memory associations. |
| Org resource API | `apps/web/app/api/orgs/[org]/resources/*` | list/apply agent and memory resources. |
| Watch API | `apps/web/app/api/watch/[[...resource]]/route.js` | stream org-scoped agent runs/imports after resource support. |
| Resource model | `src/resource-model.js` | add agent/memory kinds with `organizationRef`. |
| API controller | `src/api-controller.js` | add typed dispatch, memory query, import, approve, merge actions. |
