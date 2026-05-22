# Memory context integration spec

## Purpose

This document defines how Krate's context layer should read the company brain and add memory-backed context to `AgentContextBundle` resources. Memory follows the same core rules as every other context source: permission review, provenance, redaction, bounded size, immutable digests, and preview before dispatch.

## Source families

| Family | Example | Retrieval | Prompt treatment |
| --- | --- | --- | --- |
| Graph YAML records | `graph/orgs/[org]/repositories/krate.yaml` | ID lookup, kind filters, edge traversal | summarized records with IDs, owners, and edge breadcrumbs. |
| Markdown records | `runbooks/ci/playwright-flake.md` | frontmatter filters and bounded reads | title, frontmatter, body excerpts, source path. |
| Free-form Markdown | `notes/investigations/*.md` | grep/ripgrep search within allowed paths | line excerpts with context and digest. |
| Ontology records | `ontology/node-kinds.yaml` | schema lookup and validation report | validation context, not task facts unless requested. |

Graph and grep results should work together: graph traversal can identify relevant repositories, services, decisions, and runbooks; grep can then search those candidate paths for specific failure signatures or terms.

## `AgentContextBundle` additions

```yaml
spec:
  memory:
    enabled: true
    repositoryRef: org-company-brain
    requestedRef: main
    resolvedCommit: abcdef1234567890
    refResolution:
      mode: current
    snapshotRef: memory-snapshot-01hx
    queryManifestDigest: sha256:...
    ontologyDigest: sha256:...
    indexDigest: sha256:...
    sources:
      - kind: memory-graph-record
        id: runbook:ci-playwright-flake
        path: runbooks/ci/playwright-flake.md
        digest: sha256:...
      - kind: memory-grep-excerpt
        path: notes/investigations/2026-05-playwright.md
        lineStart: 42
        lineEnd: 48
        digest: sha256:...
    limits:
      maxMemoryBytes: 128000
      truncated: false
```

Memory entries may also appear in the existing `sources` list, but the dedicated `memory` block is required for retries, stale-memory warnings, historical refs, and audits.

## Query modes

| Mode | Behavior | Use |
| --- | --- | --- |
| `graph-only` | query structured graph/frontmatter records only | ownership, dependency, runbook, and ontology-driven tasks. |
| `grep-only` | search allowed Markdown paths without graph traversal | raw notes, broad recall, and unstructured history. |
| `graph-and-grep` | graph narrows candidate paths, then grep searches them | default for repository tasks. |
| `document-read` | read selected memory documents by path or ID | user-selected context in composer. |
| `ontology-validation` | validate proposed graph/frontmatter changes | update review and memory CI. |
| `diff-ref` | compare current memory with pinned memory | time-travel and stale-context warnings. |

## Ref resolution

```yaml
memory:
  refResolution:
    mode: current | explicit-ref | ref-at-time | snapshot-tag
    requested: main
    resolvedCommit: abcdef1234567890
    resolvedAt: 2026-05-10T12:00:00Z
```

Rules:

- `current` resolves the configured default branch at dispatch creation.
- `explicit-ref` resolves a branch, tag, or SHA.
- `ref-at-time` resolves the latest approved commit at or before a timestamp.
- `snapshot-tag` resolves a Krate-created stable snapshot tag.
- Ambiguous or missing refs block dispatch before Agent Mux launch.

## Assembly flow

```text
source event or manual dispatch
  -> resolve AgentStack and AgentMemorySource
  -> review memory read/query permissions
  -> resolve memory ref to commit
  -> load ontology and index manifests at commit
  -> run graph, frontmatter, and grep retrieval
  -> redact, rank, and bound selected memory
  -> create AgentMemorySnapshot and AgentMemoryQuery records
  -> add memory block to AgentContextBundle
  -> launch AgentDispatchAttempt with immutable snapshot
```

## Ranking requirements

The preview must explain why each memory item was selected. Rank by:

1. explicit user selection;
2. direct association to repository, issue, PR, service, stack, trigger, or skill;
3. graph edge distance from source refs;
4. allow-list specificity;
5. grep match strength and recency;
6. owner-approved status;
7. size and freshness constraints.

## Prompt rendering

Memory should render in a dedicated prompt section after repository instructions and before transient logs or diffs:

```text
## Company Brain Memory
Memory repository: org-company-brain
Resolved commit: abcdef1234567890
Query manifest: sha256:...

### Graph records
- runbook:ci-playwright-flake ...

### Markdown excerpts
- notes/investigations/2026-05-playwright.md:42 ...
```

The prompt must tell agents that memory is advisory and may be stale, especially when pinned to a historical ref.

## Historical memory runs

When dispatch uses `refAt` or an old snapshot:

- UI displays `Memory is pinned to <commit> from <date>`.
- Context bundle stores current memory commit separately for comparison.
- Run detail offers `Diff memory against current`.
- Agent prompt includes a stale-memory banner.
- Memory read tools default to the pinned commit.
- Memory update proposals target current `main` unless policy explicitly says otherwise.

Example:

```yaml
memory:
  requestedRefAt: 2026-05-08T09:30:00Z
  resolvedCommit: 13579bdf2468
  currentCommitAtDispatch: abcdef1234567890
  staleBy: 2d3h
```

## Memory tools

After Krate permission review, Agent Mux can expose:

- `memory.graph.search`: search graph records by text, kind, edge, owner, or association.
- `memory.record.read`: read graph or Markdown records by ID/path at the pinned commit.
- `memory.docs.grep`: grep allowed Markdown paths at the pinned commit.
- `memory.snapshot.diff`: diff pinned memory against another ref.
- `memory.update.propose`: create a proposed memory patch artifact.
- `memory.ontology.validate`: validate proposed graph/frontmatter changes.

Tools operate against the dispatch memory snapshot by default. Reading current memory from a historical run requires explicit refresh or approval.

## Failure behavior

| Failure | Required behavior |
| --- | --- |
| Memory repo unavailable | block if memory is required; warn and continue only if optional. |
| Ref cannot resolve | block dispatch. |
| Ontology invalid | block update merges; allow reads only with warning if policy permits. |
| Grep returns too much | truncate with omitted-count summary. |
| Permission denied | omit content and show denied path/kind without leaking values. |
| Secret-like content detected | redact; mark unsafe if redaction is too broad. |

## Acceptance criteria

- `AgentContextBundle` explains memory repository, requested ref, resolved commit, selected records, selected excerpts, and query manifest.
- Graph and grep results can be combined in one dispatch.
- Time-travel memory uses a commit-pinned snapshot and never silently refreshes during retry.
- Agents can only call memory tools for paths/kinds granted by Krate.
- Context preview and run detail expose stale-memory warnings and diff actions.

## Babysitter memory context

Context assembly can include curated Babysitter run memory from the org company brain:

- `babysitter/MEMORY.md` for stable orchestration instructions and conventions;
- session summaries for previous related agent work;
- curated run journals for replaying decisions and state transitions;
- task results and artifact manifests for evidence-backed context;
- retrospectives for process improvements and known pitfalls.

Selection rules:

- match org first, then repository, stack, process, trigger, issue/PR, and run status;
- prefer summarized sessions and retrospectives over raw journal events unless a replay/debug task needs detail;
- include raw journal excerpts only with line/event bounds and redaction;
- pin all imported run memory to the same memory commit as other company brain sources.
