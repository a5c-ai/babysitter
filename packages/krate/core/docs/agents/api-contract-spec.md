# Agent API contract spec

## Purpose

This document defines future HTTP contracts for agent orchestration while preserving the current Krate API shape:

- `GET /api/controller` returns the `createControllerUiModel()` snapshot.
- `GET/POST /api/controller/resources` lists and applies arbitrary Krate resources.
- `GET/DELETE /api/controller/resources/[kind]/[name]` reads and deletes resources.
- `GET /api/watch/orgs/[org]/[[...resource]]` streams Krate live events as SSE.

Typed agent APIs should delegate to the same controller/resource gateway and never bypass resource admission.

## Response conventions

Successful resource response:

```json
{
  "kind": "AgentStack",
  "metadata": { "name": "claude-code-ci-repair" },
  "spec": {},
  "status": { "phase": "Ready", "conditions": [] }
}
```

Error response:

```json
{
  "error": {
    "code": "POLICY_DENIED",
    "message": "Secret grant is missing for github-commenter.",
    "correlationId": "krate-...",
    "resource": "AgentStack/krate-system/claude-code-ci-repair",
    "reasons": [
      {
        "code": "MissingSecretGrant",
        "field": "spec.permissionRefs.secretGrants",
        "message": "Secret krate-secrets/github-writeback:token is required."
      }
    ]
  }
}
```

Recommended status codes:

| Code | Use |
| --- | --- |
| `200` | read/action completed |
| `201` | resource created |
| `202` | async action accepted |
| `400` | invalid request body or field |
| `401` | unauthenticated |
| `403` | RBAC/policy/admission denied |
| `404` | resource not found |
| `409` | generation conflict, dedupe conflict, active run conflict |
| `422` | valid JSON but invalid resource spec |
| `429` | concurrency/rate limit |
| `503` | controller/gateway unavailable |

## Resource CRUD

These can initially use the existing generic API:

- `GET /api/controller/resources?kind=AgentStack`
- `POST /api/controller/resources`
- `GET /api/controller/resources/AgentStack/claude-code-ci-repair`
- `DELETE /api/controller/resources/AgentStack/claude-code-ci-repair`

Typed routes can wrap the generic API for better UX and validation:

- `GET /api/agents/stacks`
- `POST /api/agents/stacks`
- `GET /api/agents/stacks/:name`
- `PATCH /api/agents/stacks/:name`
- `DELETE /api/agents/stacks/:name`

## Permission review

`POST /api/agents/permissions/review`

Request:

```json
{
  "repository": "krate",
  "ref": "refs/pull/42/head",
  "actor": "tmusk",
  "agentStack": "claude-code-ci-repair",
  "triggerSource": "pull-request-comment",
  "taskKind": "ci-repair",
  "runnerPool": "untrusted-linux"
}
```

Response:

```json
{
  "decision": "denied",
  "runtimeIdentity": { "serviceAccountRef": "agent-claude-code-ci-repair", "ready": true },
  "runnerIdentity": { "runnerPool": "untrusted-linux", "serviceAccountRef": "runner-untrusted-linux", "ready": true },
  "requiredRoles": [],
  "requiredSecrets": [],
  "requiredConfigs": [],
  "missingGrants": [],
  "approvalRequirements": [],
  "yamlPreview": [],
  "reasons": []
}
```

The UI should call this endpoint for stack save, trigger dry-run, manual dispatch, and grant wizards.

## Manual dispatch

`POST /api/agents/runs`

Request:

```json
{
  "repository": "krate",
  "ref": "refs/heads/staging",
  "agentStack": "claude-code-ci-repair",
  "taskKind": "manual-repair",
  "prompt": "Investigate the failing docs validation.",
  "contextLabels": ["ci-failure-summary"],
  "runtimeIdentity": { "serviceAccountRef": "agent-claude-code-ci-repair" },
  "sourceRefs": { "path": "docs/agents", "actor": "tmusk" },
  "workspacePolicy": { "mode": "isolated-worktree" },
  "writeBackPolicy": { "requireApproval": true }
}
```

Response:

```json
{
  "run": { "kind": "AgentDispatchRun", "metadata": { "name": "adr-01hx" }, "status": { "phase": "queued" } },
  "attempt": { "kind": "AgentDispatchAttempt", "metadata": { "name": "ada-01hx-1" } },
  "links": { "detail": "/agents/runs/adr-01hx" }
}
```

## Dispatch actions

- `POST /api/agents/runs/:run/cancel`
- `POST /api/agents/runs/:run/retry`
- `POST /api/agents/runs/:run/resume`
- `POST /api/agents/runs/:run/fork`
- `POST /api/agents/runs/:run/continue`

Action request:

```json
{
  "reason": "user-requested",
  "message": "Continue with the focused test failure only.",
  "expectedGeneration": 12
}
```

Action response:

```json
{
  "accepted": true,
  "run": "adr-01hx",
  "attempt": "ada-01hx-2",
  "phase": "queued"
}
```

## Approvals

- `GET /api/agents/approvals`
- `POST /api/agents/approvals/:approval/decision`

Decision request:

```json
{
  "decision": "approved",
  "comment": "Post the diagnosis only; do not push the patch.",
  "approvedActionSubset": ["pull-request-comment"],
  "expectedArtifactDigest": "sha256:..."
}
```

Decision response:

```json
{
  "approval": "approval-01hx",
  "phase": "approved",
  "writeBack": { "accepted": true, "idempotencyKey": "approval-01hx:sha256:..." }
}
```

## Trigger rules

- `GET /api/agents/rules`
- `POST /api/agents/rules`
- `POST /api/agents/rules/:rule/dry-run`
- `POST /api/agents/rules/:rule/lifecycle`
- `POST /api/agents/rules/:rule/replay-delivery`

Dry-run response must include matcher result, rendered prompt preview, context bundle plan, permission review, dedupe key, and expected actions.

## Secret/config grants

- `GET /api/agents/secrets`
- `GET /api/agents/configmaps`
- `POST /api/agents/secrets/grants`
- `POST /api/agents/config/grants`
- `GET /api/agents/capability-requirements`

Grant APIs should only expose Secret metadata and key names, never values.

## Watch/SSE contracts

Current route:

- `GET /api/watch/orgs/[org]/agentdispatchruns`
- `GET /api/watch/orgs/[org]/agentapprovals`
- `GET /api/watch/orgs/[org]/agentworkspaces`
- `GET /api/watch/orgs/[org]/agenttriggerrules`

SSE events should preserve the current `event: krate` style and include resource path and event payload. Typed agent pages may wrap this with a client helper, but the server path should remain Kubernetes-watch aligned.

## UI model additions

`GET /api/controller` should eventually include:

```json
{
  "views": {
    "agents": {
      "activeRuns": [],
      "pendingApprovals": [],
      "stackReadiness": [],
      "missingPermissions": [],
      "repositoryAffordances": {}
    }
  }
}
```

This lets existing server components continue using `fetchControllerUiModel()` while typed agent routes are added incrementally.

## Memory API contracts

Typed routes should preserve the generic controller API while adding focused memory actions:

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/agents/memory/orgs/[org]/repositories` | `GET` | list visible `AgentMemoryRepository` resources and health. |
| `/api/agents/memory/query` | `POST` | run admitted graph/frontmatter/grep query and create `AgentMemoryQuery`. |
| `/api/agents/memory/resolve-ref` | `POST` | resolve branch, tag, SHA, snapshot tag, or `refAt` timestamp to commit. |
| `/api/agents/memory/snapshots` | `POST` | create `AgentMemorySnapshot` for a dispatch context. |
| `/api/agents/memory/diff` | `POST` | diff two memory refs or snapshots. |
| `/api/agents/memory/updates` | `POST` | create proposed `AgentMemoryUpdate` from agent artifact or UI edit. |
| `/api/agents/memory/updates/[id]/approve` | `POST` | approve an update. |
| `/api/agents/memory/updates/[id]/merge` | `POST` | merge an approved update after validation. |
| `/api/agents/memory/ontology/validate` | `POST` | validate ontology, graph YAML, frontmatter, and generated indexes. |

All responses must include permission-review status, selected commit, digests, and redaction/truncation summaries when content is returned.

## Org-scoped memory API requirements

Memory APIs must be org-addressed or receive an explicit org in the request body. Preferred routes:

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/orgs/[org]/agents/memory/import-babysitter-run` | `POST` | import curated `MEMORY.md`, session, journal, task, and artifact metadata into org memory. |
| `/api/orgs/[org]/agents/memory/query` | `POST` | query memory within org scope. |
| `/api/orgs/[org]/agents/memory/resolve-ref` | `POST` | resolve current, explicit, snapshot, or timestamp refs for org memory. |

The server must reject requests where repository, deployment, memory repository, ServiceAccount, Secret, ConfigMap, session, or run belongs to a different org namespace.

## Org route compatibility rules

- New API surfaces should be org-addressed first.
- Compatibility endpoints must resolve org before permission review and must fail if a repository, run, session, deployment, or memory source is ambiguous.
- Watch endpoints should accept org filters and must not stream cross-org records without explicit admin scope.
- Error bodies for org mismatch should identify the denied reference type, not leak private resource names from another org.

## Org-scoped error contract

Org-aware APIs should use stable errors:

| Code | Meaning |
| --- | --- |
| `ORG_REQUIRED` | request did not include resolvable org context. |
| `ORG_NOT_FOUND` | actor cannot see the requested org or it does not exist. |
| `ORG_REQUIRED` | org-scoped route was missing an organization. |
| `ORG_NAMESPACE_MISMATCH` | resource namespace does not match org binding. |
| `CROSS_ORG_REF_DENIED` | referenced resource belongs to another org and no sharing policy applies. |
| `MEMORY_IMPORT_REDACTION_BLOCKED` | import redaction was too broad or unsafe. |
| `MEMORY_IMPORT_VALIDATION_FAILED` | normalized memory failed ontology/frontmatter/path validation. |

Error responses must avoid leaking private names from other orgs. They can include the denied reference kind and policy reason.

## Payload example reference

Concrete JSON payloads for the org memory vertical slice are defined in [Org memory API payload examples](./org-memory-api-payload-examples.md). API implementation and tests should treat those examples as canonical fixtures for field names, digest fields, links, and stable error shapes.
