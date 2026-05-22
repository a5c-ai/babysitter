# Org memory E2E fixture plan

## Purpose

This document defines deterministic fixtures for testing the org-scoped memory vertical slice. The fixtures should let future implementation prove org isolation, memory snapshotting, run import, and UI visibility without requiring a live external GitHub organization.

## Fixture topology

```text
Cluster
  -> Organization a5c / namespace krate-org-a5c
    -> Repository krate
    -> AgentStack claude-code-ci-repair
    -> AgentMemoryRepository org-company-brain
    -> AgentMemorySource krate-ci-memory
    -> RunnerPool trusted-linux
  -> Organization other / namespace krate-org-other
    -> Repository krate
    -> AgentMemoryRepository other-company-brain
```

The duplicate repository slug is intentional. It tests org-aware routing and legacy ambiguity handling.

## Memory repository fixture

`org-company-brain` initial tree:

```text
.company-brain/
  README.md
  babysitter/MEMORY.md
  ontology/node-kinds.yaml
  ontology/edge-kinds.yaml
  runbooks/ci/playwright-flake.md
  repositories/krate.md
  babysitter/retrospectives/seed.md
  indexes/ontology-report.json
```

`runbooks/ci/playwright-flake.md` frontmatter:

```yaml
id: runbook:ci-playwright-flake
kind: Runbook
title: Playwright flake triage
status: approved
owners: [team:platform]
repoRefs: [repository:krate]
tags: [ci, playwright]
updatedAt: 2026-05-11T08:00:00Z
```

## `.a5c` run fixture

Fixture path:

```text
.a5c/runs/01KR-FIXTURE/
  run.json
  journal/000001.json
  journal/000002.json
  tasks/task-1/task.json
  tasks/task-1/result.json
```

Minimum `run.json` fields:

```json
{
  "id": "01KR-FIXTURE",
  "organizationRef": "a5c",
  "repository": "krate",
  "process": "docs-memory-fixture",
  "status": "completed",
  "startedAt": "2026-05-11T08:00:00Z",
  "completedAt": "2026-05-11T08:15:00Z"
}
```

Journal fixture should include one harmless event and one secret-like value to prove redaction:

```json
{
  "sequence": 2,
  "eventType": "task.output",
  "timestamp": "2026-05-11T08:05:00Z",
  "message": "Token-like content sk-test-fixture-redact-me must be redacted."
}
```

## Seed resources

Required resources:

- `Organization/a5c`;
- `OrgNamespaceBinding/a5c`;
- `Organization/other`;
- `OrgNamespaceBinding/other`;
- `Repository/krate` in both orgs;
- `AgentStack/claude-code-ci-repair` in `a5c`;
- `AgentMemoryRepository/org-company-brain` in `a5c`;
- `AgentMemorySource/krate-ci-memory` in `a5c`;
- `AgentServiceAccount/agent-claude-code-ci-repair` in `a5c`;
- `RunnerPool/trusted-linux` in `a5c`.

## Test cases

### Org route ambiguity

1. Request legacy `/repositories/krate/code`.
2. Fixture has `krate` in `a5c` and `other`.
3. Expect an explicit org picker or `ORG_REQUIRED`, not silent selection.

### Memory query preview

1. Request `/api/orgs/a5c/agents/memory/query` for `playwright flaky checks`.
2. Expect `runbook:ci-playwright-flake` and no `other` org records.
3. Expect resolved commit and digests.

### Manual dispatch with memory

1. Dispatch from `/orgs/a5c/repositories/krate/code`.
2. Expect `AgentMemorySnapshot`, `AgentContextBundle`, and `AgentDispatchRun`.
3. Expect run detail to show memory commit and selected records.

### Summary-only run import

1. Import `.a5c/runs/01KR-FIXTURE` with `summary-only` tier.
2. Expect secret-like journal content not present in generated memory.
3. Expect `SecretsRedacted=True`, `OntologyValid=True`, `ReviewReady=True`.
4. Expect generated run/session summary files and artifact manifest digest only.

### Cross-org memory denial

1. Dispatch in `a5c` requests `other-company-brain`.
2. Expect `CROSS_ORG_REF_DENIED`.
3. Expect no content from `other` in preview, context, transcript, tool output, or audit details.

### Historical memory pin

1. Resolve `refAt` before a fixture update commit.
2. Dispatch with resolved historical commit.
3. Update current memory.
4. Retry run.
5. Expect retry to use original commit and show stale warning.

## Assertions

- Every created resource includes `organizationRef`.
- Every UI route includes `/orgs/a5c` or `/orgs/other`.
- Every memory source includes resolved commit and digest fields.
- Every redacted import omits raw secret-like values.
- Every cross-org denial emits an audit event with org and denied kind but no private target content.

## Out of scope for fixture

- External GitHub API calls.
- Real Agent Mux runtime execution.
- Raw artifact byte retention.
- Cross-org sharing policy allow path.
- Vector search.
