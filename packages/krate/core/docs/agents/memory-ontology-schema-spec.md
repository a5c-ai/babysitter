# Memory ontology and file schema spec

## Purpose

The company brain needs a maintained ontology so shared memory stays navigable, enforceable, searchable, and useful to agents. This document defines Markdown/YAML schema conventions for graph records, frontmatter records, free-form documents, ontology files, and generated indexes.

## Principles

- Human-readable files are authoritative.
- Canonical facts have stable IDs.
- Graph structure improves retrieval but does not block useful notes.
- Ontology changes are reviewed like code.
- Derived indexes are reproducible from Git contents.
- Memory records expose owners, status, and source references where possible.

## File classes

| Class | Pattern | Structure |
| --- | --- | --- |
| Graph records | `graph/**/*.yaml` | Atlas-style `nodeKind`, `id`, `attributes`, `edges`. |
| Markdown records | `runbooks/**/*.md`, `decisions/**/*.md`, `incidents/**/*.md`, `repositories/**/*.md` | YAML frontmatter plus body. |
| Free-form notes | `notes/**/*.md`, `meetings/**/*.md`, `scratch/**/*.md` | body required; frontmatter optional. |
| Ontology | `ontology/**/*.yaml` | node kinds, edge kinds, vocabularies, validation rules. |
| Generated indexes | `indexes/**/*` | generated reports tied to source commit/digest. |

## Graph YAML schema

```yaml
nodeKind: Runbook
id: runbook:ci-playwright-flake
attributes:
  title: Playwright flake triage
  status: approved
  owners: [team:platform]
  summary: How to diagnose recurring Playwright failures in Krate CI.
  tags: [ci, playwright, krate]
  updatedAt: 2026-05-10T12:00:00Z
edges:
  applies_to_repo:
    - target: repository:krate
  owned_by:
    - target: team:platform
  supersedes:
    - target: runbook:old-playwright-flake
```

Required graph fields:

- `nodeKind`: ontology kind name.
- `id`: stable prefixed ID.
- `attributes.title`: display name.
- `attributes.status`: `draft`, `approved`, `deprecated`, or `archived`.
- `attributes.owners`: one or more teams/users.
- `attributes.updatedAt`: ISO timestamp.

## Markdown frontmatter schema

```markdown
---
id: decision:agent-memory-git-backed
kind: Decision
title: Use Git as source of truth for company brain
status: approved
owners:
  - team:platform
aliases:
  - company brain git memory
repoRefs:
  - repository:krate
tags:
  - agents
  - memory
related:
  documents:
    - runbook:agent-memory-update-review
  supersedes:
    - decision:agent-memory-db-only
updatedAt: 2026-05-10T12:00:00Z
---

# Use Git as source of truth for company brain

Decision body...
```

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes for records | Stable graph ID; optional for pure free-form notes. |
| `kind` | yes for records | Ontology node kind. |
| `title` | yes | Display title; free-form notes can fall back to first H1. |
| `status` | yes for records | `draft`, `approved`, `deprecated`, `archived`. |
| `owners` | yes for records | Team/user IDs. |
| `aliases` | no | Search and disambiguation terms. |
| `repoRefs` | no | Associated Krate repositories. |
| `tags` | no | Controlled vocabulary preferred. |
| `related` | no | Edge map from edge kind to target IDs. |
| `updatedAt` | yes for records | ISO timestamp. |
| `sensitivity` | no | `public`, `internal`, `restricted`, `secret-metadata`. |
| `sourceRefs` | no | Issues, PRs, dispatch runs, incidents, docs, URLs. |

## Free-form Markdown

Free-form files are intentionally lightweight:

```markdown
---
title: Investigation notes for flaky Krate checks
owners: [user:alice]
tags: [investigation, ci]
repoRefs: [repository:krate]
status: draft
---

Raw notes...
```

Rules:

- frontmatter is optional but recommended;
- `id` is optional unless the note should be graph-addressable;
- grep search may return excerpts from files without IDs;
- promotion from note to canonical record should preserve source links.

## Initial node kinds

| Node kind | Purpose |
| --- | --- |
| `Organization` | company or business unit. |
| `Team` | owner, reviewer, or operating group. |
| `Repository` | Krate repository identity and associated practices. |
| `Service` | deployed service or component. |
| `Package` | package/library/module ownership and practices. |
| `Runbook` | operational procedure. |
| `Decision` | architectural, product, or process decision. |
| `Incident` | incident summary, remediation, follow-up. |
| `AgentPractice` | reusable lesson for agent dispatches. |
| `Skill` | agent skill knowledge and requirements. |
| `Tool` | native tool or MCP capability knowledge. |
| `Customer` | customer-specific context when allowed. |
| `ProductArea` | product/domain grouping. |
| `Term` | glossary, aliases, and terminology. |
| `PromptFragment` | reviewed context text reusable by stacks. |

## Initial edge kinds

| Edge kind | Use |
| --- | --- |
| `documents` | page or record documents another node. |
| `implements` | service/package implements a decision or capability. |
| `depends_on` | dependency or operational prerequisite. |
| `supersedes` | replaces older record. |
| `owned_by` | ownership by team/user. |
| `applies_to_repo` | memory applies to a repository. |
| `applies_to_stack` | memory applies to an agent stack. |
| `mentions` | weak mention/reference. |
| `derived_from` | extracted from run, issue, PR, incident, or note. |
| `requires_secret` | tool/skill/runbook requires a named secret grant. |
| `requires_config` | tool/skill/runbook requires a named config grant. |
| `safe_for_trigger` | approved for a trigger source or trust level. |
| `resolved_by` | incident or issue resolved by runbook, decision, PR, or dispatch. |

## ID conventions

| Kind | Example |
| --- | --- |
| Repository | `repository:krate` |
| Team | `team:platform` |
| Runbook | `runbook:ci-playwright-flake` |
| Decision | `decision:agent-memory-git-backed` |
| Incident | `incident:2026-05-krate-ci-outage` |
| AgentPractice | `agent-practice:prefer-focused-tests-first` |
| Skill | `skill:focused-test-selection` |
| Tool | `tool:memory-docs-grep` |

IDs are immutable. Renames update title and aliases. Replacements use `supersedes` and deprecate the older record.

## Validation rules

Validators should check:

- YAML parse errors and Markdown frontmatter parse errors;
- duplicate IDs;
- unknown node kinds and edge kinds;
- missing required fields;
- invalid owner IDs;
- dangling edges;
- forbidden status transitions;
- forbidden secrets or high-entropy strings;
- path policy violations;
- stale generated indexes;
- ontology compatibility version.

## Derived index shape

```yaml
generatedAt: 2026-05-10T12:00:00Z
sourceCommit: abcdef1234567890
ontologyDigest: sha256:...
stats:
  records: 1200
  edges: 4200
  markdownRecords: 550
  freeFormDocuments: 900
  parseErrors: 0
records: {}
edges: []
pathIndex: {}
ownerIndex: {}
repoIndex: {}
tagIndex: {}
```

Indexes may be committed for review or stored as controller artifacts, but Krate must be able to rebuild them from source.

## Governance

- Ontology changes require memory-owner review.
- New node/edge kinds need examples and validation rules.
- Deprecated kinds stay readable until migration completes.
- Reports show unowned records, stale records, dangling edges, and sensitive records.
- Canonical records should include source references when derived from runs, incidents, issues, or PRs.

## Acceptance criteria

- A developer can add a useful free-form note without learning the full graph schema.
- A memory steward can promote a note into a canonical graph or Markdown record.
- Validators catch duplicate IDs, dangling edges, unknown kinds, and secret-like content.
- Krate can build graph traversal, frontmatter filters, and grep search from the same Git ref.
- UI can explain owners, source refs, and associations to repositories, stacks, skills, tools, triggers, and runs.

## Babysitter memory schema

Add ontology support for Babysitter orchestration memory:

| Node kind | Purpose |
| --- | --- |
| `BabysitterRun` | org-scoped orchestration run with status, source repo, process, and task graph. |
| `BabysitterSession` | chat/session summary linked to one or more dispatches or runs. |
| `RunJournalEvent` | ordered event extracted from `.a5c/runs/<run>/journal`. |
| `RunTaskResult` | task-level result, evidence, artifacts, and validation status. |
| `RunRetrospective` | durable lesson or process improvement derived from a run. |

Additional edge kinds:

| Edge kind | Use |
| --- | --- |
| `has_journal_event` | run contains ordered journal event. |
| `has_task_result` | run contains task result. |
| `summarized_by` | session/run is summarized by Markdown memory. |
| `produced_artifact` | task or run produced artifact manifest/digest. |
| `learned_from` | practice, runbook, or retrospective derived from run/session. |

`MEMORY.md` may remain a special entrypoint file, but durable facts extracted from it should use normal graph IDs and frontmatter when promoted.
