# Org memory controller sequence spec

## Purpose

This document defines the controller and API sequences for org-scoped company brain memory. It ties together `Organization`, namespace binding, memory repository bootstrap, memory context query, historical refs, Agent Mux dispatch, `.a5c` import, and memory update review.

## Sequence principles

- Resolve org before any resource lookup that can cross tenant boundaries.
- Use the org namespace for all ServiceAccount, Secret, ConfigMap, runner, and workspace side effects.
- Resolve Git refs to commits before context assembly or memory import review.
- Store digests for every selected memory source, generated import file, validation report, and update patch.
- Keep Agent Mux execution behind Krate admission; Agent Mux never decides org access.
- Treat company brain memory as untrusted context until redacted and rendered with provenance.

## Org bootstrap sequence

```text
admin creates Organization
  -> org-controller validates slug and namespaceName
  -> org-controller creates or verifies namespace
  -> org-controller writes OrgNamespaceBinding
  -> RBAC controller creates org admin RoleBindings
  -> memory controller creates optional AgentMemoryRepository skeleton
  -> UI shows org dashboard and empty repository/agents/memory states
```

Required status conditions:

- `NamespaceReady`;
- `OrgRbacReady`;
- `DefaultPoliciesReady`;
- `MemoryRepositoryReady` when memory bootstrap is enabled;
- `Ready`.

## Memory repository bootstrap sequence

```text
admin creates AgentMemoryRepository
  -> memory controller verifies organizationRef and namespace
  -> memory controller creates/adopts internal Git repo
  -> memory controller commits default layout and ontology when empty
  -> indexer builds graph/search/ontology reports
  -> status records currentCommit, ontologyDigest, indexDigest
  -> UI enables /orgs/[org]/agents/memory
```

Failure handling:

- Git repo unavailable: `Ready=False`, `reason=MemoryRepositoryUnavailable`.
- Layout invalid: `Ready=False`, `reason=MemoryLayoutInvalid`.
- Ontology invalid: reads may be degraded, update merges blocked.

## Dispatch with current memory sequence

```text
user opens /orgs/[org]/repositories/[repo]/code
  -> UI requests dispatch preview
  -> API resolves org, repo, stack, memory source policy
  -> permission review checks repo, stack, runner, secrets, config, memory
  -> memory controller resolves default branch to commit
  -> context assembler queries graph/frontmatter/grep sources
  -> redactor bounds and redacts results
  -> AgentMemorySnapshot and AgentMemoryQuery are created
  -> AgentContextBundle stores memory snapshot digests
  -> AgentDispatchRun and AgentDispatchAttempt are created
  -> Agent Mux launch receives admitted tool/session options
  -> run detail streams events and shows memory provenance
```

Idempotency key:

```text
org + repository + source event + stack generation + memory resolved commit + context digest + attempt number
```

## Dispatch with historical memory sequence

```text
user selects memory from two days ago
  -> UI converts relative input to absolute timestamp
  -> API calls resolve-ref with mode ref-at-time
  -> memory controller selects latest approved commit <= timestamp
  -> UI shows resolved commit, age, and diff summary against current
  -> context assembly uses historical commit for all memory queries
  -> memory tools are scoped to historical AgentMemorySnapshot
  -> run retry reuses same snapshot unless user refreshes memory
```

Blocking cases:

- no commit exists before timestamp;
- commit exists but failed ontology validation and policy requires valid ontology;
- selected stack requires current-only memory;
- actor lacks `memory.snapshots.diff` for preview diff.

## Agent memory tool call sequence

```text
agent calls memory.docs.grep through Agent Mux
  -> Agent Mux forwards tool request to Krate memory tool gateway
  -> gateway resolves dispatch attempt and AgentMemorySnapshot
  -> gateway checks tool grant and snapshot path/kind scope
  -> memory query runs against pinned commit
  -> result is redacted, bounded, digested, and audited
  -> response returns excerpts with source paths and commit
```

The gateway must reject tool calls that ask for current branch state when the run is pinned to a historical snapshot unless the user explicitly refreshed context.

## Babysitter run import sequence

```text
user chooses Import run memory from run detail
  -> API creates AgentRunMemoryImport in org namespace
  -> import controller verifies run/session/repo org ownership
  -> import controller collects admitted MEMORY.md, session summary, journal, task, artifact metadata
  -> source digests are computed
  -> content is redacted and prompt-injection scanned
  -> normalized Markdown/YAML files are generated
  -> ontology/frontmatter/path/owner validation runs
  -> memory update branch/PR is created
  -> reviewer approves and merges
  -> memory index rebuilds
  -> source run links to merged memory commit
```

Idempotency key:

```text
organizationRef + source run ID + source digest + retention tier + targetPath
```

## Memory update review sequence

```text
agent proposes memory update artifact
  -> artifact controller records digest and source run
  -> memory controller creates AgentMemoryUpdate
  -> validation checks ontology, frontmatter, owners, edges, paths, redaction
  -> reviewer sees diff, source evidence, and validation report
  -> approval controller records decision
  -> memory controller merges or rejects update
  -> memory repository currentCommit and indexes update
  -> audit links update to source run/session/actor
```

Memory updates must not change the context snapshot of the run that proposed them. They only affect future dispatches or explicit refreshed retries.

## Cross-org denial sequence

```text
request references org a5c and memory repo in org other
  -> API resolves both refs
  -> admission detects org mismatch
  -> checks OrgSharingPolicy
  -> no policy found
  -> returns CROSS_ORG_REF_DENIED
  -> audit records denied kind and actor without leaking private target details
```

## Watch and event sequence

Org-scoped watch streams should publish:

- `AgentMemoryRepository.status` changes;
- `AgentMemorySnapshot` creation;
- `AgentMemoryQuery` completion;
- `AgentRunMemoryImport` phase/condition updates;
- `AgentMemoryUpdate` review and merge events;
- `AgentDispatchRun` memory provenance changes.

Watch payloads must include org and namespace and must be filtered before streaming to the client.

## Acceptance criteria

- Each sequence has a clear org resolution step before side effects.
- Every Git ref is resolved to a commit before context or import review.
- Every memory or run import write path produces a reviewable update with validation status.
- Cross-org references fail closed and produce non-leaky errors.
- Watch streams can update UI without polling and without cross-org leakage.
