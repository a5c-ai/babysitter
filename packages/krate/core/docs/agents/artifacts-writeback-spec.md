# Agent artifacts and write-back spec

## Purpose

Agents produce diagnoses, patches, review comments, reports, test results, and release recommendations. Krate must treat these as durable artifacts with explicit approval and write-back paths, not opaque chat text.

## Artifact resources

| Artifact kind | Resource | Typical source | Write-back target |
| --- | --- | --- | --- |
| diagnosis | `AgentArtifact` | CI/run analysis | PR/issue comment |
| patch | `AgentArtifact` | repair agent | branch push or PR update |
| review | `AgentReviewArtifact` | reviewer agent | PR review/comments |
| test report | `AgentArtifact` | validation subagent | pipeline/job summary |
| release report | `AgentArtifact` | release-check agent | release approval item |
| subagent output | `AgentArtifact` | child agent | parent run summary |
| workspace diff | `AgentArtifact` | workspace controller | review/apply flow |

## Artifact metadata

Required fields:

- dispatch run and attempt;
- producing agent/subagent;
- kind;
- digest;
- object storage ref or inline safe summary;
- source context digest;
- permission snapshot digest;
- target object refs;
- validation status;
- retention policy;
- redaction status.

## Patch artifacts

Patch artifacts should include:

- base ref/SHA;
- target branch/workspace;
- file list;
- diff digest;
- generated patch object ref;
- test evidence;
- conflicts/rebase status;
- unsafe file warnings;
- apply strategy: comment-only, branch update, PR update, local workspace only.

Patch artifacts never push themselves. They create write-back requests.

## Review artifacts

`AgentReviewArtifact` should support:

- review decision: pending, approved, changes-requested, comment-only;
- inline comments with file/line anchors;
- summary comment;
- risk checklist;
- confidence score;
- target PR/check refs;
- provider integration status;
- approval state before submission.

## Write-back actions

Supported actions:

- issue comment;
- PR comment;
- PR review submission;
- branch push;
- create branch;
- open PR;
- check rerun;
- workflow rerun;
- release note/report;
- deployment/release approval request.

Every write-back action must have:

- explicit target;
- artifact digest;
- actor/approver;
- idempotency key;
- policy decision;
- audit event;
- rollback/repair note where possible.

## Approval model

Write-back may be:

- denied by policy;
- allowed automatically by narrow repository policy;
- require approval always;
- require approval only for untrusted refs;
- require approval based on action class.

Approval UI must show:

- artifact preview;
- target object;
- exact mutation;
- actor and agent;
- context/permission digests;
- risk warnings;
- allow subset controls where applicable.

## Idempotency

Idempotency key format:

```text
<approval-uid>:<action-type>:<target-kind>:<target-name>:<artifact-digest>
```

Repeated apply with same key must not duplicate comments, pushes, reviews, or reruns.

## UI surfaces

- Run detail: artifacts tab/list with approval/write-back controls.
- PR page: review artifacts, patch proposals, comments, check reruns.
- Issue page: diagnosis/report artifacts and linked dispatches.
- Runs page: diagnosis/test report artifacts beside failed jobs.
- Inbox: pending write-back approvals.
- Workspace page: workspace diff and patch artifacts.

## Failure modes

| Failure | Behavior |
| --- | --- |
| artifact digest mismatch | reject approval/write-back |
| target PR changed | require rebase/refresh before write-back |
| branch push rejected | keep artifact, mark write-back failed, suggest rebase |
| review comment anchor stale | show stale anchor and allow comment-only fallback |
| check rerun denied | mark approval applied=false with RBAC reason |
| artifact contains suspected secret | block write-back until redaction/remediation |

## Acceptance criteria

- Agent output becomes durable artifacts, not just transcript text.
- Privileged write-back is gated by approval/policy.
- Artifact digest is checked before write-back.
- Duplicate approvals do not duplicate side effects.
- PR/issue/pipeline pages show related artifacts in context.