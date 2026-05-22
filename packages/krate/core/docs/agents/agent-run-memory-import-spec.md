# Agent run memory import spec

## Purpose

Krate should support importing durable agent-run memory into the org company brain. This includes `MEMORY.md`, Agent Mux/Babysitter session summaries, curated `.a5c` run journals, task results, artifact manifests, retrospectives, and selected process notes. The import path turns operational run state into governed org memory without dumping entire workspaces or leaking secrets.

## Source model

| Source | Local shape | Memory target | Default import |
| --- | --- | --- | --- |
| org memory entrypoint | `MEMORY.md` | `babysitter/MEMORY.md` | yes, reviewed. |
| run metadata | `.a5c/runs/<run>/run.json` | `babysitter/runs/<run>/run.yaml` | yes, normalized. |
| journal events | `.a5c/runs/<run>/journal/*.json` | `babysitter/runs/<run>/journal/*.yaml` | curated/redacted. |
| task records | `.a5c/runs/<run>/tasks/*/{task,result,output}.json` | `babysitter/runs/<run>/tasks/*.yaml` | summaries by default. |
| artifacts | `.a5c/artifacts/*` or run artifact refs | `babysitter/runs/<run>/artifacts/manifest.yaml` | digest/manifest only by default. |
| sessions | Agent Mux/Babysitter session transcript or summary | `babysitter/sessions/<date>/<session>.md` | summary by default. |
| retrospectives | run review output | `babysitter/retrospectives/<run>.md` | yes when approved. |

Raw transcripts, raw logs, raw artifacts, and raw workspace files require explicit retention policy and reviewer approval.

## Import resource

```yaml
apiVersion: krate.a5c.ai/v1alpha1
kind: AgentRunMemoryImport
metadata:
  name: import-01kr1z
  namespace: krate-org-a5c
  labels:
    krate.a5c.ai/org: a5c
    krate.a5c.ai/repository: krate
spec:
  organizationRef: a5c
  memoryRepository: org-company-brain
  source:
    kind: babysitter-run
    runId: 01KR1ZCPQVVPJAJDNBQHGPWZZY
    sessionId: 019e-example
    repositoryRef: krate
    a5cRunPath: .a5c/runs/01KR1ZCPQVVPJAJDNBQHGPWZZY
  include:
    memoryMd: true
    sessionSummary: true
    journal: curated
    taskResults: summarized
    artifactManifests: digest-only
    retrospectives: true
  targetPath: babysitter/runs/01KR1ZCPQVVPJAJDNBQHGPWZZY
  validationPolicy:
    redactSecrets: true
    detectPromptInjection: true
    requireReview: true
    requireOntologyValid: true
status:
  phase: AwaitingReview
  sourceDigest: sha256:...
  redactionDigest: sha256:...
  targetBranch: krate/memory-import/01kr1z
  pullRequestRef: a5c-ai/company-brain/124
```

## Import lifecycle

```text
run/session selected for import
  -> resolve org and repository ownership
  -> collect admitted .a5c files and session summary
  -> compute source digests
  -> redact secrets and unsafe content
  -> normalize to YAML/Markdown memory records
  -> validate ontology, frontmatter, paths, owners, and edges
  -> create AgentRunMemoryImport
  -> open review branch/PR when policy allows
  -> merge into org company brain
  -> rebuild indexes
  -> link memory commit to source run/session
```

## Normalized run metadata

```yaml
nodeKind: BabysitterRun
id: babysitter-run:01KR1ZCPQVVPJAJDNBQHGPWZZY
attributes:
  organization: org:a5c
  repository: repository:krate
  process: krate-full-spec-convergence
  status: completed
  startedAt: 2026-05-10T09:00:00Z
  completedAt: 2026-05-10T10:30:00Z
  sourceDigest: sha256:...
  redactionStatus: redacted
edges:
  ran_for_repo:
    - target: repository:krate
  has_session:
    - target: babysitter-session:019e-example
  produced_retrospective:
    - target: run-retrospective:01KR1ZCPQVVPJAJDNBQHGPWZZY
```

## Normalized journal event

```yaml
nodeKind: RunJournalEvent
id: run-journal-event:01KR1ZCPQ:000001
attributes:
  sequence: 1
  eventType: task.created
  timestamp: 2026-05-10T09:01:00Z
  summary: Created implementation task for docs refinement.
  sourcePath: .a5c/runs/01KR1ZCP.../journal/000001.json
  sourceDigest: sha256:...
  redactionStatus: redacted
edges:
  event_of_run:
    - target: babysitter-run:01KR1ZCPQVVPJAJDNBQHGPWZZY
```

## Session summary format

```markdown
---
id: babysitter-session:019e-example
kind: BabysitterSession
title: Krate agent docs refinement session
status: approved
owners: [team:platform]
repoRefs: [repository:krate]
sourceRefs:
  - babysitter-run:01KR1ZCPQVVPJAJDNBQHGPWZZY
updatedAt: 2026-05-10T10:30:00Z
---

# Session summary

## Goal

Summarize the user goal, constraints, and final state.

## Important decisions

- Docs-only scope.
- Org company brain stores curated run memory, not raw `.a5c` dumps.

## Follow-ups

- Implement org-scoped memory import controller after resource model lands.
```

## `MEMORY.md` handling

`babysitter/MEMORY.md` is the org-level orchestration entrypoint. It should contain stable practices, conventions, and lessons that should apply to future runs in the org. It must not become a dumping ground for raw transcripts.

Update modes:

- human edit through memory repo PR;
- agent-proposed update through `AgentMemoryUpdate`;
- retrospective promotion from `AgentRunMemoryImport`;
- controller-generated index summary with explicit generated marker.

Every update requires owner review unless an org policy grants auto-merge for low-risk generated sections.

## Redaction and safety

Imports must remove or block:

- secrets, tokens, private keys, kubeconfigs, and credential-like values;
- raw webhook signatures and auth headers;
- private customer data outside allowed org policy;
- prompt-injection instructions that target future agents;
- unrestricted filesystem paths outside admitted run roots;
- raw artifact bytes unless explicitly allowed.

The redaction report is stored as metadata and digest, not raw secret content.

## Context use

Imported run memory can be selected by context assembly when:

- org matches;
- repository or deployment matches;
- agent stack, skill, tool, process, issue, PR, or trigger matches;
- run status and validation status are allowed;
- memory source policy includes `BabysitterRun`, `BabysitterSession`, `RunJournalEvent`, or `RunRetrospective` kinds.

Summaries and retrospectives should rank above raw journal events unless the task asks for replay/debug detail.

## Acceptance criteria

- A run import can include `MEMORY.md`, session summary, curated journal events, task summaries, and artifact manifests.
- Import output is org-scoped, redacted, ontology-valid, and reviewable before merge.
- Context assembly can select imported run memory from a pinned memory commit.
- UI can show source run, session, imported files, redaction status, validation status, PR, and resulting memory commit.
- Raw `.a5c` dumps are never imported by default.

## Import phases and conditions

`AgentRunMemoryImport.status.phase` should use stable values:

| Phase | Meaning |
| --- | --- |
| `Pending` | import request accepted but not collected. |
| `Collecting` | source `.a5c`, session, and artifact metadata are being read. |
| `Redacting` | secret and safety redaction is running. |
| `Normalizing` | source JSON/transcripts are becoming Markdown/YAML memory records. |
| `Validating` | ontology, frontmatter, path, owner, and edge validators are running. |
| `AwaitingReview` | import branch/PR exists and requires human review. |
| `Merged` | memory repo accepted the import and indexes were rebuilt. |
| `Rejected` | reviewer rejected the import. |
| `Failed` | controller could not complete import. |

Required conditions:

- `SourceResolved`;
- `OrgScopeVerified`;
- `SecretsRedacted`;
- `PromptInjectionScanned`;
- `OntologyValid`;
- `ReviewReady`;
- `MemoryMerged`;
- `Ready`.

Conditions must include source digest, target path, validation report digest, and blocking reason without including sensitive source content.

## Retention tiers

| Tier | Keeps | Default |
| --- | --- | --- |
| `summary-only` | `MEMORY.md`, session summary, run summary, task summaries, retrospective | default for normal runs. |
| `curated-journal` | summary plus selected journal events and bounded excerpts | default for incident/debug runs. |
| `full-journal-redacted` | all journal events after redaction, no raw artifacts | requires reviewer approval. |
| `artifact-manifest-only` | artifact names, kinds, sizes, digests, and storage refs | default artifact mode. |
| `artifact-bytes-retained` | selected raw artifacts in object storage | restricted, retention-limited, approval required. |

The selected retention tier is stored on `AgentRunMemoryImport.spec.retentionTier` and repeated in the resulting memory metadata.

## Import conflict handling

- If target path already exists for the same source digest, mark import `Ready` without opening a duplicate PR.
- If target path exists with a different digest, create a new branch and show a conflict in the memory update review.
- If the source run is still active, allow summary import only when policy permits partial imports.
- If redaction removes too much content to preserve meaning, block with `Ready=False` and `reason=RedactionTooBroad`.
- If ontology validation fails, keep the branch for review but block merge.

## UI review panel

The memory import review panel should show:

- source org, namespace, repository, run ID, session ID, process, and status;
- selected retention tier and included source families;
- source digest, redaction digest, validation report digest, and target branch;
- generated file tree and diff summary;
- secret-scan and prompt-injection scan summaries;
- linked Agent Dispatch Run, Agent Mux session, Babysitter run, artifacts, and retrospective;
- actions: approve, request changes, reject, merge, rerun validation, lower retention tier.
