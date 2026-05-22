# Org memory vertical slice spec

## Purpose

This document defines the smallest coherent implementation slice for org-scoped agent memory. It is designed to prove that Krate can manage an org company brain, assemble memory into an agent dispatch, import curated run memory, and preserve org isolation without implementing every advanced UI or automation path.

## Slice outcome

A user can:

1. select an org;
2. open a repository in that org;
3. configure a company brain memory source for the repository;
4. manually dispatch an agent with a memory preview;
5. inspect the run detail with memory snapshot provenance;
6. import a summarized run/session into the org memory repo;
7. query that imported memory in a later dispatch;
8. verify that another org cannot read or import the memory.

## Included resources

Config resources:

- `Organization`;
- `OrgNamespaceBinding`;
- `Repository`;
- `AgentStack`;
- `AgentMemoryRepository`;
- `AgentMemorySource`;
- `AgentMemoryOntology`;
- `AgentServiceAccount`;
- `AgentRoleBinding`.

Aggregated resources:

- `AgentDispatchRun`;
- `AgentDispatchAttempt`;
- `AgentSession`;
- `AgentContextBundle`;
- `AgentMemorySnapshot`;
- `AgentMemoryQuery`;
- `AgentRunMemoryImport`;
- `AgentArtifact`;
- `AgentApproval`.

Deferred resources for later slices:

- `AgentSubagent` advanced trees;
- full `AgentMemoryUpdate` editing UI beyond import PRs;
- broad trigger automation;
- cross-org sharing;
- raw artifact-byte retention;
- vector/embedding indexes.

## UI scope

Required screens:

| Screen | Minimum capability |
| --- | --- |
| `/orgs/[org]` | shows Agents and Memory attention cards. |
| `/orgs/[org]/repositories/[repo]/code` | manual dispatch button with memory preview. |
| `/orgs/[org]/repositories/[repo]/runs` | shows agent dispatch rows beside pipeline rows. |
| `/orgs/[org]/agents/runs/[run]` | shows run timeline, Agent Mux session placeholder/link, context bundle, memory snapshot. |
| `/orgs/[org]/agents/memory` | shows memory repo health, current commit, ontology status, imports. |
| `/orgs/[org]/agents/memory/search` | can query selected graph/Markdown sources. |
| `/orgs/[org]/agents/memory/imports/[import]` | review summarized import, redaction, validation, PR/merge state. |
| `/orgs/[org]/repositories/[repo]/settings` | can attach `AgentMemorySource` to the repo. |

## API scope

Required endpoints:

| Endpoint | Minimum capability |
| --- | --- |
| `GET /api/orgs/[org]/agents/summary` | dashboard counters. |
| `POST /api/orgs/[org]/agents/dispatch` | create manual dispatch with memory snapshot. |
| `GET /api/orgs/[org]/agents/runs/[run]` | run detail projection. |
| `POST /api/orgs/[org]/agents/memory/query` | graph/frontmatter/grep preview. |
| `POST /api/orgs/[org]/agents/memory/resolve-ref` | current and explicit ref resolution. |
| `POST /api/orgs/[org]/agents/memory/import-babysitter-run` | summary-only import. |
| `POST /api/orgs/[org]/agents/memory/imports/[import]/approve` | approve import PR/merge. |
| `GET /api/watch/orgs/[org]/agentdispatchruns` | run updates. |
| `GET /api/watch/orgs/[org]/agentrunmemoryimports` | import updates. |

Historical `refAt` can be included if cheap after current/explicit refs, but should not block the first slice.

## Memory repository scope

Minimum layout:

```text
.company-brain/
  README.md
  babysitter/MEMORY.md
  ontology/node-kinds.yaml
  ontology/edge-kinds.yaml
  runbooks/
  repositories/
  babysitter/sessions/
  babysitter/runs/
  indexes/ontology-report.json
```

Minimum validators:

- parse YAML and Markdown frontmatter;
- require `id`, `kind`, `title`, `owners`, `status` for canonical records;
- detect duplicate IDs;
- detect unknown edge kinds;
- scan for secret-like values;
- verify imported run memory has org/repo/source digests.

## Dispatch acceptance path

```text
Given org a5c has repo krate and memory repo org-company-brain
And repo krate has AgentMemorySource krate-ci-memory
When a user dispatches agent claude-code-ci-repair from /orgs/a5c/repositories/krate/code
Then Krate resolves memory repo main to a commit
And creates AgentMemorySnapshot and AgentContextBundle
And creates AgentDispatchRun and AgentDispatchAttempt
And the run detail shows selected memory records/excerpts and digests
```

## Import acceptance path

```text
Given an AgentDispatchRun completed in org a5c
And its session has a summary and .a5c run metadata
When a user creates a summary-only AgentRunMemoryImport
Then Krate redacts and normalizes the source material
And opens or records a reviewable memory update
And after approval merges into org-company-brain
And later memory search can find the imported session/run summary
```

## Cross-org negative path

```text
Given org a5c and org other both have memory repos
When an a5c dispatch requests memory from other
Then Krate rejects with CROSS_ORG_REF_DENIED
And no memory content is returned in preview, prompt, transcript, audit, or tool output
```

## Validation gates

- Unit/schema tests for new resources and required `organizationRef` fields.
- API tests for org mismatch and route ambiguity.
- Context assembly test for memory snapshot digest creation.
- Import test for summary-only `.a5c` run memory with redaction.
- UI smoke for org memory dashboard and run detail memory provenance.
- Package validation for CRDs/examples/docs.

## Out of scope

- Multi-org sharing.
- Full raw journal retention.
- Editing arbitrary memory files in UI.
- Vector search.
- Advanced subagent orchestration.
- Automated issue/PR/label triggers beyond manual dispatch.

## Fixture and payload references

- [Org memory API payload examples](./org-memory-api-payload-examples.md) defines the JSON contracts for this slice.
- [Org memory E2E fixture plan](./org-memory-e2e-fixture-plan.md) defines the deterministic data needed to prove this slice without external services.
