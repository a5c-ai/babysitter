# Agent observability and audit spec

## Purpose

Agent runs should be observable like CI runs and auditable like privileged control-plane actions. This document defines metrics, events, logs, traces, audit records, and UI projections for agent orchestration.

It is grounded in current Krate behavior: `src/controller-ui.js` already exposes metrics, events, validation checks, and empty `auditLog`, while `/api/watch/orgs/[org]/*` streams live Kubernetes watch events into UI panels.

## Observability principles

- Every run is traceable from source event to trigger execution to dispatch run to Agent Mux session to artifacts/write-back.
- Every privileged decision has an audit event.
- User-facing run pages should explain queueing, execution, approvals, and failures without requiring raw logs first.
- Metrics should be repository-, stack-, runner-, and trigger-scoped.
- Secret values are never logged; Secret/ConfigMap metadata can be logged only by name/key/purpose/digest.

## Correlation IDs

Every agent operation should carry:

- `correlationId`: request/session-wide trace.
- `sourceEventUid`: webhook/CI/comment/label/manual source.
- `triggerExecutionUid`.
- `dispatchRunUid`.
- `attemptUid`.
- `agentMuxRunId`.
- `agentMuxSessionId`.
- `contextBundleDigest`.
- `permissionSnapshotDigest`.
- `artifactDigest` where applicable.

These IDs should appear in events, logs, audit records, and UI details.

## Event taxonomy

| Event | Producer | UI surface |
| --- | --- | --- |
| `AgentTriggerMatched` | trigger controller | rules, source page, run detail |
| `AgentTriggerCoalesced` | trigger controller | rules, source page |
| `AgentTriggerRejected` | trigger controller | rules, denied dispatch panel |
| `AgentContextAssembled` | context bundle controller | dispatch composer, run detail |
| `AgentPermissionReviewCompleted` | permission review | stack builder, run detail, audit |
| `AgentDispatchQueued` | dispatch controller | run list, pipeline page |
| `AgentRunnerAssigned` | dispatch controller | run detail |
| `AgentMuxLaunchRequested` | dispatch controller | run detail |
| `AgentMuxSessionBound` | Agent Mux client | run/session page |
| `AgentToolCallStarted` | Agent Mux event projection | observability timeline |
| `AgentToolCallApprovalRequested` | Agent Mux/client | approval inbox, run detail |
| `AgentSubagentStarted` | Agent Mux event projection | subagent tree |
| `AgentArtifactProduced` | dispatch controller | run detail, PR/issue page |
| `AgentWriteBackRequested` | approval/write-back controller | approval inbox |
| `AgentWriteBackApplied` | approval/write-back controller | run detail, source page |
| `AgentDispatchCompleted` | dispatch controller | run list, source page |
| `AgentDispatchFailed` | dispatch controller | run detail, source page |

## Metrics

### Global metrics

- active dispatches;
- queued dispatches;
- pending approvals;
- running Agent Mux sessions;
- failed dispatches by reason;
- average queue wait;
- average run duration;
- approval wait duration;
- token/cost estimates by stack/provider;
- trigger coalescing/rejection rates;
- missing permission warning counts.

### Repository metrics

- dispatches per repository/ref/PR/issue;
- failed CI repair attempts;
- write-back approvals/applied actions;
- workspace recoveries/rebase conflicts;
- top failing trigger rules;
- secrets/config grants used by active stacks.

### Runner metrics

- queue depth by runner pool;
- wait latency p50/p95;
- active attempts;
- trusted vs untrusted usage;
- runner ServiceAccount denials;
- cost by pool/repository.

### Agent Mux metrics

- launch latency;
- session bind latency;
- stream reconnect count;
- tool call count/duration;
- subagent count/duration;
- adapter rejection count;
- transcript/event bytes.

## Audit records

Audit records should be append-only and queryable by repository, user, stack, trigger, dispatch, and target object.

Required audit event classes:

- permission/grant changes;
- role/service-account changes;
- stack save and readiness changes;
- trigger lifecycle changes;
- dispatch creation and cancellation;
- context refresh;
- approval decisions;
- write-back actions;
- secret/config rotation impact;
- native RBAC drift;
- policy bypass or denial.

Audit record required fields:

```yaml
type: AgentApprovalDecision
actor:
  kind: User
  name: tmusk
  kubernetesUser: tmusk@example.com
source:
  repository: krate
  dispatchRun: adr-01hx
  attempt: ada-01hx-1
target:
  kind: PullRequest
  name: krate/42
decision:
  allowed: true
  reason: ApprovedByMaintainer
digests:
  contextBundle: sha256:...
  permissionSnapshot: sha256:...
  artifact: sha256:...
metadata:
  correlationId: krate-...
  agentMuxRunId: run_01hx
  agentMuxSessionId: ses_01hx
```

## Logs

Controller logs should be structured and include:

- controller name;
- reconciliation key;
- correlation ID;
- resource kind/name;
- phase/condition changes;
- external call target without secrets;
- duration and result.

Do not log:

- Secret values;
- raw authorization headers;
- full prompt when it may contain sensitive context;
- full transcript unless explicitly configured for a safe environment.

## Traces

Trace spans should cover:

- API request;
- permission review;
- context assembly;
- trigger evaluation;
- dispatch creation;
- runner placement;
- Agent Mux launch;
- event stream reconciliation;
- artifact persistence;
- approval/write-back.

## UI projections

`src/controller-ui.js` should eventually expose:

```json
{
  "metrics": {
    "agentDispatches": 12,
    "agentApprovals": 3,
    "agentMissingPermissions": 2
  },
  "auditLog": [],
  "views": {
    "agents": {
      "activeRuns": [],
      "pendingApprovals": [],
      "recentFailures": [],
      "missingPermissions": []
    }
  }
}
```

Run detail must show:

- event timeline;
- transcript/session state;
- queue and runner timings;
- permission snapshot;
- context digest;
- artifacts and approvals;
- audit trail for write-back.

## Alerts

Recommended alert conditions:

- Agent Mux gateway unavailable;
- dispatch queue wait p95 over threshold;
- approval backlog over threshold;
- repeated adapter launch rejection;
- native RBAC drift on owned role;
- missing Secret/ConfigMap grant blocks active stack;
- untrusted ref attempted privileged secret access;
- write-back failure after approval;
- retention job failure.

## Acceptance criteria

- A user can follow a failed CI-triggered agent run from source event through dispatch, session, artifacts, approval, and write-back.
- Every privileged grant/approval/write-back has an audit record.
- Missing permission warnings appear in metrics and UI.
- Agent Mux stream disconnects produce visible stale/reconnect state.
- No log/audit/UI surface contains Secret values.

## Memory observability

Memory events must be auditable because memory can change agent behavior.

Required events:

- `agent.memory.ref.resolved` with requested ref, resolved commit, mode, and requester.
- `agent.memory.query.executed` with snapshot, query modes, counts, truncation, and denied scopes.
- `agent.memory.snapshot.created` with ontology/index/query digests.
- `agent.memory.update.proposed` with source run, paths, diff digest, and validation result.
- `agent.memory.update.approved`, `agent.memory.update.merged`, and `agent.memory.update.rejected`.
- `agent.memory.ontology.invalid` with parse/error counts and blocking status.

Metrics should include query latency, index age, validation failures, denied memory reads, update merge latency, and historical-memory dispatch count.

## Org and memory audit fields

Every agent, memory, deployment, and repository audit event should include:

- `organizationRef`;
- `namespace`;
- actor user/group/service account;
- repository/deployment refs when applicable;
- memory repository and resolved commit when memory is used;
- session ID and run ID when Agent Mux or Babysitter participates;
- journal digest when `.a5c` run memory is imported;
- cross-org sharing policy ID when a cross-org ref is admitted.

## Org memory sequence audit coverage

Each sequence in `org-memory-controller-sequence-spec.md` should emit audit records for preflight, admission decision, Git ref resolution, memory query, context snapshot, Agent Mux launch, memory import collection, redaction, validation, review, merge, and cross-org denial. Audit records must include org, namespace, source refs, resolved commit, and digest fields where applicable.
