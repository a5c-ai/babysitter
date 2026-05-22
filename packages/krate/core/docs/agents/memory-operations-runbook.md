# Memory operations runbook

## Purpose

This runbook defines operational flows for bootstrapping, validating, querying, updating, rolling back, and time-traveling the company brain memory repository.

## Bootstrap org memory

1. Create `AgentMemoryRepository` with `managedByKrate=true`.
2. Krate creates or adopts the Git repository.
3. Seed `ontology/`, `graph/`, `pages/`, `notes/`, `runbooks/`, `decisions/`, `incidents/`, and `indexes/`.
4. Seed base ontology with node kinds, edge kinds, statuses, sensitivity levels, and owner vocabulary.
5. Create default `AgentMemorySource` policies per repository/team.
6. Build initial indexes and validation report.
7. Expose `/agents/memory` only to users with memory read permission.

## Validate memory repository

Validation should run on every memory PR, scheduled reconcile, and manual UI request.

Required checks:

- parse YAML and Markdown frontmatter;
- enforce ontology schema;
- verify graph IDs and edge targets;
- verify owner/team references;
- scan for secret-like content;
- rebuild derived indexes;
- compare generated indexes with committed indexes when committed indexes are enabled;
- produce `ontology-report.json` and update `AgentMemoryOntology` status.

## Dispatch with current memory

1. User or trigger selects stack.
2. Krate resolves default memory branch to commit.
3. Context assembler runs allowed memory queries.
4. Run detail stores `AgentMemorySnapshot` and selected context.
5. Agent Mux launch receives prompt content plus memory tool descriptors.

## Dispatch with memory from two days ago

1. User selects `Memory ref: two days ago` in advanced dispatch settings.
2. Krate converts the request to an absolute timestamp.
3. Memory controller finds the latest approved commit at or before that timestamp.
4. UI shows resolved commit and current-vs-pinned diff summary.
5. `AgentContextBundle` stores both resolved historical commit and current commit.
6. Agent prompt includes a stale-memory banner.
7. Agent tools default to the pinned memory commit.

Example:

```yaml
memory:
  repositoryRef: org-company-brain
  refAt: 2026-05-08T12:00:00Z
  resolutionPolicy: latest-commit-before-or-at
  requireApprovedCommit: true
```

## Propose memory update from a run

1. Agent writes a memory update artifact with file changes and rationale.
2. Krate validates the patch against ontology, path, owner, and redaction policy.
3. Krate creates `AgentMemoryUpdate`.
4. If allowed, Krate opens a PR or internal review branch.
5. Reviewers inspect diff, source run, selected evidence, and validation report.
6. Merge updates default branch and rebuilds indexes.
7. Original run links to merged memory commit.

## Recover from bad memory

1. Identify bad commit, PR, or update record.
2. Disable affected `AgentMemorySource` paths if needed.
3. Revert or fix-forward in the memory repository.
4. Rebuild indexes.
5. Mark affected `AgentMemorySnapshot` records as `KnownBad` without mutating their content.
6. Notify owners of dispatches that consumed the bad memory.
7. Add a `Decision` or `Incident` record describing remediation when appropriate.

## Rotate or move memory repository

1. Create a new `AgentMemoryRepository` in disabled/read-only mode.
2. Mirror Git contents and verify digest parity.
3. Rebuild indexes from source.
4. Update `AgentMemorySource` policies to point to the new repository.
5. Run dry-run context assembly for representative stacks.
6. Switch writes after validation.
7. Keep old repository read-only until retention expires.

## Operational dashboards

`/agents/memory` should show:

- current commit and last successful index build;
- ontology validation state;
- pending updates and stale PRs;
- top memory consumers by repository/stack;
- recent historical-memory runs;
- denied memory queries;
- records without owners;
- stale approved records;
- secret-scan alerts.

## Alerts

| Alert | Severity | Response |
| --- | --- | --- |
| memory index build failed | warning/critical by duration | inspect parse errors and block new writes if stale. |
| ontology validation failed on main | critical | disable update merges and surface degraded context warning. |
| secret-like content detected | critical | block merge, revoke if leaked, notify owners. |
| memory repo unreachable | warning | block required-memory dispatches; allow optional-memory dispatches with warning. |
| stale generated indexes | warning | rebuild and compare source commit. |
| historical ref cannot resolve | warning | block requested dispatch. |

## Acceptance criteria

- Operators can bootstrap an org memory repo from UI or CRD.
- Every memory PR receives validation output before merge.
- Users can run with current, explicit-ref, snapshot-tag, or ref-at-time memory.
- Bad memory can be reverted without corrupting past run snapshots.
- Dashboards make memory health, permissions, and pending updates visible.
