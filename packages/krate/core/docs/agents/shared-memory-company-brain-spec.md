# Shared memory company brain spec

## Purpose

Krate should manage repo-based shared agent memory as an org-level company brain. The company brain is an internal Git repository managed by Krate behind the scenes, but still inspectable, exportable, reviewable, and recoverable like any other repository. Agents can read it, query it, cite it in context, and propose updates to it through governed workflows.

This is docs-only product scope.

## Goals

- Make shared agent memory explicit, durable, reviewable, versioned, and auditable.
- Use Git, Markdown, YAML frontmatter, YAML graph records, and grep-searchable Markdown as the source of truth.
- Treat the memory repository as a private Atlas-style graph layer, not as an opaque vector store.
- Let context assembly pin memory to a commit, tag, branch, or timestamp-derived historical ref.
- Let agents propose memory updates as PRs or patch artifacts by default, not direct writes.
- Connect memory to repositories, agent stacks, tools, skills, subagents, triggers, CI runs, issues, PRs, and workspaces.

## Non-goals

- Do not replace repository code, `AGENTS.md`, issue history, PR discussions, CI artifacts, or run transcripts.
- Do not require every useful note to be promoted into a graph node before it can be searched.
- Do not let memory records grant tools, secrets, config, approval bypasses, or runner privileges.
- Do not store raw secrets, private keys, OAuth tokens, kubeconfigs, or unredacted credential material.

## Atlas alignment

Local Atlas research shows a useful shape for Krate memory:

- YAML graph records use `nodeKind`, `id`, `attributes`, and `edges`.
- Markdown pages can be indexed from YAML frontmatter plus body content.
- Edge extraction supports object maps and list forms.
- Context engineering already models `MemoryStore`, `ContextBundle`, memory hierarchy, compaction, and background consolidation.
- Private overlays are separate from public graph data and can reuse the same graph/index vocabulary with stricter RBAC.

Krate should model company brain as an org-private Atlas overlay with Kubernetes/RBAC-backed access control and Git-backed history.

## Memory repository layout

Recommended default layout:

```text
.company-brain/
  README.md
  ontology/
    node-kinds.yaml
    edge-kinds.yaml
    controlled-vocabulary.yaml
    validation-rules.yaml
  graph/
    teams/
    repositories/
    services/
    products/
    runbooks/
    decisions/
    incidents/
    agent-practices/
  pages/
  runbooks/
  decisions/
  incidents/
  repositories/
  agents/
    stacks/
    skills/
    tools/
    subagents/
  notes/
    meetings/
    investigations/
    scratch/
  indexes/
    graph-index.json
    search-manifest.json
    ontology-report.json
```

`graph/` contains canonical typed YAML records. `runbooks/`, `decisions/`, `incidents/`, `repositories/`, and `pages/` contain Markdown records with YAML frontmatter. `notes/` contains free-form Markdown that can be searched with grep and later promoted into canonical records. `indexes/` is generated and reproducible from source files.

## Knowledge forms

| Form | Source of truth | Use |
| --- | --- | --- |
| Graph YAML | `graph/**/*.yaml` | typed nodes, edges, ownership, dependencies, repository associations. |
| Markdown records | `**/*.md` with frontmatter | human-readable knowledge that is also graph-addressable. |
| Free-form Markdown | `notes/**/*.md`, `meetings/**/*.md`, `scratch/**/*.md` | broad grep search and raw institutional notes. |
| Ontology YAML | `ontology/**/*.yaml` | node kinds, edge kinds, controlled vocabulary, validation. |
| Derived indexes | `indexes/**/*` | fast lookup, search manifests, validation summaries; never authoritative. |

## Core resources

### `AgentMemoryRepository`

Declarative config for the org memory Git repository.

```yaml
kind: AgentMemoryRepository
spec:
  organization: a5c
  visibility: internal
  provider: github
  repositoryRef:
    owner: a5c-ai
    name: company-brain
  defaultBranch: main
  managedByKrate: true
  layoutProfile: atlas-md-yaml-v1
  indexPolicy:
    buildGraphIndex: true
    buildSearchManifest: true
    buildOntologyReport: true
status:
  phase: Ready
  currentCommit: abcdef1234567890
  indexDigest: sha256:...
  ontologyDigest: sha256:...
```

### `AgentMemorySource`

Read policy for repositories, teams, stacks, triggers, or users.

```yaml
kind: AgentMemorySource
spec:
  repositoryRef: org-company-brain
  appliesTo:
    repositories: [krate]
    teams: [platform]
  include:
    graphKinds: [Repository, Service, Runbook, Decision, Incident, AgentPractice]
    paths:
      - graph/orgs/[org]/repositories/krate/**
      - runbooks/ci/**
      - decisions/platform/**
  exclude:
    paths:
      - incidents/security/**
  defaultQueryMode: graph-and-grep
  maxContextBytes: 128000
```

### `AgentMemorySnapshot`

Immutable execution-time record of the memory ref and selected material.

```yaml
kind: AgentMemorySnapshot
spec:
  memoryRepository: org-company-brain
  requestedRef: main
  resolvedCommit: abcdef1234567890
  refResolution:
    mode: current
  queryManifestDigest: sha256:...
  selectedRecordsDigest: sha256:...
  selectedDocumentsDigest: sha256:...
  ontologyDigest: sha256:...
  indexDigest: sha256:...
```

### `AgentMemoryQuery`

Aggregated query record for graph and grep retrieval.

```yaml
kind: AgentMemoryQuery
spec:
  snapshotRef: memory-snapshot-01hx
  requester:
    kind: AgentDispatchRun
    name: adr-01hx
  query:
    text: flaky playwright failures in krate pipelines
    modes: [graph, grep]
    graph:
      kinds: [Runbook, Decision, Incident, AgentPractice]
      edgeDepth: 2
    grep:
      paths: [runbooks/**, incidents/**, notes/**]
      maxMatches: 25
```

### `AgentMemoryUpdate`

Reviewable proposed mutation to the memory repository.

```yaml
kind: AgentMemoryUpdate
spec:
  memoryRepository: org-company-brain
  sourceRun: adr-01hx
  updateKind: proposed-pr
  baseCommit: abcdef1234567890
  branchName: krate/agent-memory/adr-01hx
  changes:
    - path: runbooks/ci/playwright-flake.md
      action: upsert
      reason: Capture verified remediation from dispatch adr-01hx.
  validationPolicy:
    requireOntologyValid: true
    requireFrontmatterValid: true
    requireHumanApproval: true
status:
  phase: AwaitingApproval
  diffDigest: sha256:...
  pullRequestRef: a5c-ai/company-brain/123
```

### `AgentMemoryOntology`

Pointer to ontology policy and validation status.

```yaml
kind: AgentMemoryOntology
spec:
  memoryRepository: org-company-brain
  ontologyPath: ontology
  requiredFields: [id, kind, title, owners, status]
  allowedEdgeKindsRef: ontology/edge-kinds.yaml
  controlledVocabularyRef: ontology/controlled-vocabulary.yaml
```

### `AgentMemoryAssociation`

Bridge between memory records and Krate resources.

```yaml
kind: AgentMemoryAssociation
spec:
  memoryRepository: org-company-brain
  memoryRef:
    id: runbook:ci-playwright-flake
    path: runbooks/ci/playwright-flake.md
  targetRef:
    kind: Repository
    name: krate
  relationship: applies_to_repo
```

## Git-backed versioning

- Every memory read resolves to a commit SHA before context assembly.
- The default branch represents current approved memory.
- Dispatch snapshots store requested ref, resolved commit, ontology digest, index digest, query manifest, selected records, and selected excerpts.
- Time-travel memory resolves by finding the latest approved commit at or before the requested timestamp.
- Retrying a run uses the original memory snapshot unless the user explicitly refreshes memory.
- Updating memory from a historical run targets current `main` unless policy explicitly allows a different branch.

## Time-travel examples

Current memory:

```yaml
memory:
  repositoryRef: org-company-brain
  ref: main
  queryMode: graph-and-grep
```

Memory from two days ago:

```yaml
memory:
  repositoryRef: org-company-brain
  refAt: 2026-05-08T00:00:00Z
  resolutionPolicy: latest-commit-before-or-at
  queryMode: graph-and-grep
```

Named snapshot:

```yaml
memory:
  repositoryRef: org-company-brain
  ref: refs/tags/memory/snapshots/2026-05-08T000000Z
  queryMode: graph-only
```

## Required user flows

- Configure or adopt an org-level memory repository from `/agents/memory`.
- Associate memory paths and graph kinds with a repository from `/orgs/[org]/repositories/[repo]/settings/agents`.
- Preview selected memory records and grep excerpts in the dispatch composer.
- Run an agent with current memory, explicit ref, snapshot tag, or memory from a timestamp.
- Open run detail and inspect memory commit, query manifest, selected records, excerpts, redaction status, and stale-memory warning.
- Let an agent propose a memory update from a run and route it through validation plus PR review.
- Browse graph records and grep-search free-form docs from `/agents/memory` subject to permissions.

## Acceptance criteria

- Repository dispatch can include graph records and grep excerpts from allowed memory paths with visible provenance.
- Historical memory dispatches are commit-pinned and never silently refresh on retry.
- Agents can propose memory updates as reviewable PRs with ontology validation.
- UI warns when a stack, tool, or skill needs memory permissions it does not have.
- Past runs remain explainable even after the memory repository changes.

## Babysitter run memory artifacts

The company brain must also support durable Babysitter run memory for org-scoped orchestration. Krate should treat Babysitter's `MEMORY.md`, session summaries, journals, task results, and selected `.a5c` run artifacts as first-class memory sources when they are admitted into the org memory repository.

Recommended layout:

```text
.company-brain/
  babysitter/
    MEMORY.md
    sessions/
      2026/05/10/<session-id>.md
    runs/
      <run-id>/
        run.yaml
        journal/
          000001.yaml
        tasks/
          <task-id>.yaml
        artifacts/
          manifest.yaml
    retrospectives/
    process-notes/
```

Requirements:

- `MEMORY.md` is the org-level agent memory entrypoint for orchestration conventions, stable lessons, and runbooks.
- Raw `.a5c` files are not copied wholesale by default; Krate imports curated manifests, journals, session summaries, task results, and artifact digests according to retention and sensitivity policy.
- Run journals preserve event order, task IDs, source repository, agent stack, session IDs, artifacts, and final status.
- Session summaries and retrospectives can be promoted into canonical graph or Markdown memory records.
- Imported run memory is org-scoped and cannot be queried by agents in another org.
- Secret scans and prompt-injection checks run before `.a5c` artifacts become searchable memory.

### Babysitter memory resources

```yaml
kind: AgentRunMemoryImport
spec:
  organizationRef: a5c
  memoryRepository: org-company-brain
  source:
    kind: babysitter-run
    a5cRunPath: .a5c/runs/01KR...
  include:
    memoryMd: true
    sessionSummary: true
    journal: curated
    taskResults: true
    artifactManifests: true
  targetPath: babysitter/runs/01KR...
  validationPolicy:
    redactSecrets: true
    requireReview: true
```

The memory repo stores durable knowledge and replayable context, not arbitrary private workspace dumps.

## Run memory import boundary

`AgentRunMemoryImport` is the only supported path for moving Babysitter operational state into the company brain. The import controller normalizes and redacts `MEMORY.md`, sessions, `.a5c` journals, task outputs, and artifact manifests before proposing changes to the org memory repo. Direct writes from a runner workspace into the memory repo are not allowed unless an org policy explicitly grants a trusted maintenance workflow.
