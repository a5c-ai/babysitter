# Agent subagent orchestration spec

## Purpose

Krate should support parent agents that delegate to subagents for research, implementation, validation, review, and release checks. Subagents must be visible, policy-admitted, auditable, and linked to parent dispatch attempts.

## Model

`AgentSubagent` defines a reusable child-agent role. A parent `AgentStack` references subagents and sets concurrency/permission boundaries.

Subagents may run in two modes:

| Mode | Description | Owner |
| --- | --- | --- |
| native Agent Mux subagent | adapter supports child-agent dispatch inside one session | Agent Mux executes; Krate projects telemetry |
| Krate-emulated child attempt | Krate creates child `AgentDispatchAttempt` or linked run | Krate schedules and links child execution |

Krate chooses mode based on adapter capabilities and stack policy.

## `AgentSubagent` fields

Important fields:

- `spec.name`;
- `spec.description`;
- `spec.rolePrompt`;
- `spec.taskKinds`;
- `spec.modelOverride`;
- `spec.toolRefs`;
- `spec.mcpServerRefs`;
- `spec.skillRefs`;
- `spec.runtimeIdentityOverride`;
- `spec.workspaceScope`: no-workspace, read-only, branch-local, isolated-worktree;
- `spec.maxParallelTasks`;
- `spec.contextPolicy`;
- `spec.outputContract`;
- `spec.approvalPolicy`.

## Context slicing

Subagents should not automatically receive full parent context.

Context policies:

- `summary-only`: parent sends task summary and source breadcrumbs;
- `selected-sources`: parent sends selected files/logs/artifacts;
- `full-redacted`: parent sends full redacted context bundle;
- `artifact-only`: parent sends specific artifacts;
- `no-context`: parent sends only role prompt and task.

Every child context slice gets a digest and provenance entry.

## Output contracts

Common contracts:

- markdown summary;
- checklist;
- JSON finding list;
- patch artifact;
- review comments;
- test report;
- release readiness report;
- risk assessment.

The parent run should record whether each subagent fulfilled its contract.

## Telemetry projection

Run detail should show a subagent tree/lane view with:

- subagent name and role;
- mode: native or Krate-emulated;
- status;
- context slice digest;
- tools/MCP/skills enabled;
- workspace scope;
- started/completed timestamps;
- output artifact links;
- parent decision impact.

## Permission model

Subagents inherit the parent stack by default but can only reduce permissions unless policy explicitly allows override.

Rules:

- tool set must be subset of parent admitted tools unless override is approved;
- Secret/ConfigMap grants must match child subject or parent stack policy;
- runtime ServiceAccount override requires `AgentRoleBinding` and permission review;
- untrusted source remains untrusted for every child;
- subagent output cannot directly write back without parent/approval gate.

## Scheduling and concurrency

Concurrency limits:

- per parent run;
- per subagent definition;
- per stack;
- per runner pool;
- per repository.

When limits are reached, child work is queued and visible in the subagent tree.

## Failure behavior

| Failure | Parent behavior |
| --- | --- |
| subagent unavailable | parent continues only if subagent optional; otherwise blocked/failed |
| output contract invalid | parent sees failed child and artifact validation error |
| child permission denied | parent gets permission warning and suggested fix |
| child timeout | parent can retry child or continue with partial results |
| child produces unsafe write-back | converted to `AgentApproval`, never auto-applied |

## UI flows

### Stack builder

- add/remove subagents;
- select task kinds;
- choose context policy;
- select tool/MCP/skill subset;
- show adapter support;
- show permission review for each child.

### Run detail

- show parent timeline and child lanes;
- allow expanding each child transcript/summary;
- show artifacts per child;
- show child failures with retry/ignore controls when supported.

## Audit requirements

Audit records must include:

- parent dispatch run and attempt;
- subagent definition generation;
- context slice digest;
- runtime identity;
- tools/MCP/skills/secrets/configs admitted;
- output artifact digest;
- parent decision that consumed child output.

## Acceptance criteria

- Parent run shows which subagents were invoked and why.
- Subagents cannot silently receive broader permissions than parent.
- Each child context slice and output artifact is digest-addressed.
- Failed or partial child work is visible in run detail.
- Native Agent Mux subagents and Krate-emulated child attempts project into the same UI model.