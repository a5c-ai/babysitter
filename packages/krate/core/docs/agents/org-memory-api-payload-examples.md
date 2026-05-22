# Org memory API payload examples

## Purpose

This document provides implementation-ready request and response examples for the org-scoped company brain memory vertical slice. The examples are intentionally explicit about org, namespace, commit, digest, redaction, and validation fields so API, UI, controller, and test work can share the same contract.

## `GET /api/orgs/[org]/agents/summary`

Response:

```json
{
  "organization": "a5c",
  "namespace": "krate-org-a5c",
  "agents": {
    "dispatchRuns": { "running": 2, "failed": 1, "succeeded24h": 12 },
    "approvals": { "pending": 3 },
    "blockedStacks": 1
  },
  "memory": {
    "repository": "org-company-brain",
    "phase": "Ready",
    "currentCommit": "abcdef1234567890",
    "ontologyDigest": "sha256:ontology",
    "indexDigest": "sha256:index",
    "importsAwaitingReview": 2,
    "updatesAwaitingReview": 1,
    "lastIndexedAt": "2026-05-11T08:00:00Z"
  }
}
```

## `POST /api/orgs/[org]/agents/memory/resolve-ref`

Request for current memory:

```json
{
  "memoryRepository": "org-company-brain",
  "mode": "current",
  "requested": "main"
}
```

Request for memory at a timestamp:

```json
{
  "memoryRepository": "org-company-brain",
  "mode": "ref-at-time",
  "requestedAt": "2026-05-09T08:00:00Z",
  "resolutionPolicy": "latest-commit-before-or-at",
  "requireApprovedCommit": true
}
```

Response:

```json
{
  "organization": "a5c",
  "memoryRepository": "org-company-brain",
  "mode": "ref-at-time",
  "requestedAt": "2026-05-09T08:00:00Z",
  "resolvedCommit": "13579bdf2468",
  "resolvedRef": "refs/heads/main",
  "currentCommit": "abcdef1234567890",
  "staleBySeconds": 172800,
  "ontologyDigest": "sha256:ontology-at-commit",
  "indexDigest": "sha256:index-at-commit",
  "conditions": [
    { "type": "Resolved", "status": "True", "reason": "CommitFound" }
  ]
}
```

## `POST /api/orgs/[org]/agents/memory/query`

Request:

```json
{
  "memoryRepository": "org-company-brain",
  "requestedRef": "main",
  "resolvedCommit": "abcdef1234567890",
  "query": {
    "text": "playwright flaky checks in krate",
    "modes": ["graph", "grep"],
    "graph": {
      "kinds": ["Runbook", "Decision", "Incident", "AgentPractice", "BabysitterRun"],
      "edgeDepth": 2
    },
    "grep": {
      "paths": ["runbooks/**", "babysitter/runs/**", "babysitter/retrospectives/**"],
      "maxMatches": 25,
      "includeLineContext": true
    }
  },
  "limits": {
    "maxBytes": 64000,
    "maxRecords": 40
  }
}
```

Response:

```json
{
  "organization": "a5c",
  "snapshotPreview": {
    "memoryRepository": "org-company-brain",
    "resolvedCommit": "abcdef1234567890",
    "queryManifestDigest": "sha256:query",
    "selectedRecordsDigest": "sha256:records",
    "selectedExcerptsDigest": "sha256:excerpts"
  },
  "records": [
    {
      "kind": "Runbook",
      "id": "runbook:ci-playwright-flake",
      "path": "runbooks/ci/playwright-flake.md",
      "title": "Playwright flake triage",
      "owners": ["team:platform"],
      "digest": "sha256:record"
    }
  ],
  "excerpts": [
    {
      "path": "babysitter/retrospectives/01KR1Z.md",
      "lineStart": 18,
      "lineEnd": 24,
      "text": "Redacted bounded excerpt suitable for prompt preview.",
      "digest": "sha256:excerpt"
    }
  ],
  "redaction": { "status": "redacted", "secretPatternCount": 0 },
  "limits": { "truncated": false, "bytes": 18340 }
}
```

## `POST /api/orgs/[org]/agents/dispatch`

Request:

```json
{
  "repository": "krate",
  "ref": "refs/heads/main",
  "source": {
    "kind": "manual-code-dispatch",
    "path": "docs/agents"
  },
  "agentStack": "claude-code-ci-repair",
  "task": {
    "kind": "docs-update",
    "prompt": "Improve the agent memory docs."
  },
  "memory": {
    "repositoryRef": "org-company-brain",
    "requestedRef": "main",
    "queryMode": "graph-and-grep",
    "queryText": "krate agent memory docs"
  }
}
```

Response:

```json
{
  "organization": "a5c",
  "dispatchRun": "adr-01hx",
  "attempt": "ada-01hx-1",
  "contextBundle": "acb-01hx",
  "memorySnapshot": "ams-01hx",
  "phase": "Queued",
  "links": {
    "runDetail": "/orgs/a5c/agents/runs/adr-01hx",
    "repositoryRuns": "/orgs/a5c/repositories/krate/runs"
  }
}
```

## `GET /api/orgs/[org]/agents/runs/[run]`

Response excerpt:

```json
{
  "organization": "a5c",
  "run": {
    "name": "adr-01hx",
    "phase": "Running",
    "repository": "krate",
    "agentStack": "claude-code-ci-repair"
  },
  "attempts": [
    { "name": "ada-01hx-1", "phase": "Running", "agentMuxSessionId": "mux-session-123" }
  ],
  "contextBundle": {
    "name": "acb-01hx",
    "digest": "sha256:context",
    "memorySnapshot": "ams-01hx"
  },
  "memorySnapshot": {
    "name": "ams-01hx",
    "memoryRepository": "org-company-brain",
    "requestedRef": "main",
    "resolvedCommit": "abcdef1234567890",
    "queryManifestDigest": "sha256:query",
    "selectedRecordsDigest": "sha256:records",
    "selectedExcerptsDigest": "sha256:excerpts"
  },
  "artifacts": []
}
```

## `POST /api/orgs/[org]/agents/memory/import-babysitter-run`

Request:

```json
{
  "source": {
    "kind": "babysitter-run",
    "repository": "krate",
    "runId": "01KR1ZCPQVVPJAJDNBQHGPWZZY",
    "sessionId": "019e-example",
    "a5cRunPath": ".a5c/runs/01KR1ZCPQVVPJAJDNBQHGPWZZY"
  },
  "memoryRepository": "org-company-brain",
  "retentionTier": "summary-only",
  "include": {
    "memoryMd": true,
    "sessionSummary": true,
    "journal": "none",
    "taskResults": "summarized",
    "artifactManifests": "digest-only",
    "retrospectives": true
  },
  "targetPath": "babysitter/runs/01KR1ZCPQVVPJAJDNBQHGPWZZY",
  "validationPolicy": {
    "redactSecrets": true,
    "detectPromptInjection": true,
    "requireReview": true
  }
}
```

Response:

```json
{
  "organization": "a5c",
  "import": "import-01kr1z",
  "phase": "Collecting",
  "sourceDigest": "sha256:source",
  "retentionTier": "summary-only",
  "links": {
    "detail": "/orgs/a5c/agents/memory/imports/import-01kr1z"
  }
}
```

## `GET /api/orgs/[org]/agents/memory/imports/[import]`

Response excerpt:

```json
{
  "organization": "a5c",
  "import": {
    "name": "import-01kr1z",
    "phase": "AwaitingReview",
    "retentionTier": "summary-only",
    "sourceDigest": "sha256:source",
    "redactionDigest": "sha256:redaction",
    "validationReportDigest": "sha256:validation",
    "targetBranch": "krate/memory-import/01kr1z",
    "pullRequestRef": "a5c-ai/company-brain/124"
  },
  "generatedFiles": [
    { "path": "babysitter/runs/01KR1Z/run.yaml", "digest": "sha256:run" },
    { "path": "babysitter/sessions/2026/05/11/019e-example.md", "digest": "sha256:session" }
  ],
  "conditions": [
    { "type": "SecretsRedacted", "status": "True", "reason": "NoSecretsDetected" },
    { "type": "OntologyValid", "status": "True", "reason": "ValidationPassed" },
    { "type": "ReviewReady", "status": "True", "reason": "PullRequestCreated" }
  ]
}
```

## Error examples

Cross-org denial:

```json
{
  "error": {
    "code": "CROSS_ORG_REF_DENIED",
    "message": "Referenced memory repository is not in the requested organization.",
    "referenceKind": "AgentMemoryRepository",
    "organization": "a5c"
  }
}
```

Missing organization route:

```json
{
  "error": {
    "code": "ORG_REQUIRED",
    "message": "Choose an organization before opening repository memory.",
    "path": "/api/orgs/{org}/memory"
  }
}
```

Redaction blocked import:

```json
{
  "error": {
    "code": "MEMORY_IMPORT_REDACTION_BLOCKED",
    "message": "Import removed too much sensitive content to create a useful memory summary.",
    "import": "import-01kr1z",
    "condition": "RedactionTooBroad"
  }
}
```
