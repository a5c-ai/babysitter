# NodeKinds: SourceRef and ScopeBoundary

> Cluster 13 — catalog-meta utilities. `SourceRef` gives every imported artifact a
> verifiable upstream address; `ScopeBoundary` gives every entity an explicit
> in-scope / out-of-scope declaration. See [`README.md`](./README.md) for the full
> catalog and [`../../schema/meta-schema.md`](../../schema/meta-schema.md) for the standard
> node-kind file shape.

## Purpose

Two related primitives that close the loop between the catalog and the world it
describes.

`SourceRef` is the catalog's pointer to source-of-truth: a repo URL, a ref, a path,
optionally a package manager and version. Anything imported into the catalog —
skills, plugins, subagents, MCP servers, agent versions, processes — carries a
`sourced_from` edge to a `SourceRef`, so the validator can re-fetch and re-verify.

`ScopeBoundary` is the catalog's positive/negative declaration. Every entity says
not just *what it is* but *what it isn't*: a Skill scoped to "React 18+" with
"React Native, server components" excluded; a Benchmark scoped to "Python web
frameworks" with "data science, ML, Python 2" excluded. Out-of-scope items must be
tagged with at least one `OutOfScopeReason` (V-9.2), making exclusions auditable.

Together they answer two questions every consumer asks: *where does this come
from?* and *where does it stop?*

---

## NodeKind: `SourceRef`

A repo + ref + path pointer to the source-of-truth for an imported artifact.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `source-ref:<slug>`, e.g. `source-ref:packages-agent-catalog-v1`. |
| `repoUrl` | url | yes | Repository URL. |
| `ref` | string | yes | Branch, tag, or commit SHA. |
| `path` | string | yes | Relative path within the repo. |
| `packageManager` | enum<npm,pip,cargo,go-mod,nix,gem,none> | no | Set when the artifact is also packaged. |
| `packageName` | string | no | Set when the artifact is also packaged. |
| `version` | string | no | Set when the artifact is also packaged. |
| `description` | markdown | yes | One-paragraph description. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `source_for` | `Skill` \| `Plugin` \| `Subagent` \| `ToolServer` \| `MCPServer` \| `AgentVersion` \| `Process` | 1:N | Inverse of `sourced_from`. |

### Evidence

`repoUrl` and `ref` are evidence-bound at **vendor-doc-or-better** when the source
is the upstream of a vendor product (e.g., the Anthropic Claude Code repo). When
the source is a third-party fork, evidence at `community` is sufficient with a
note explaining the fork relationship.

### Invariants

1. `id` MUST start with `source-ref:`.
2. When any of `packageManager` / `packageName` / `version` is set, all three
   SHOULD be set together; the validator warns if only some are set.
3. `repoUrl` MUST be a fetchable HTTP(S) URL.

---

## NodeKind: `ScopeBoundary`

The explicit in-scope / out-of-scope declaration for any catalog entity. A
boundary may be carried by a single node attached to its subject, or split across
multiple boundaries (e.g., one per dimension).

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `scope-boundary:<slug>`. |
| `subjectId` | ref<any catalog entity> | yes | The entity being scoped. |
| `inScope` | markdown | yes | Positive list — what the subject covers. |
| `outOfScope` | markdown | yes | Negative list — explicit exclusions. |
| `outOfScopeReasonIds` | list<ref<`OutOfScopeReason`>> | yes | At least one when `outOfScope` is non-empty (V-9.2). |
| `evidenceSourceIds` | list<ref<`EvidenceSource`>> | no | Optional evidence backing the boundary. |
| `notes` | markdown | no | Reviewer commentary. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `scopes_in` | any catalog entity | N:N | Inverse of `in_scope`. |
| `scopes_out` | any catalog entity | N:N | Inverse of `out_of_scope`. |
| `out_of_scope_reason` | `OutOfScopeReason` | 1:N | One per excluded item or one default reason. |

### Invariants

1. `inScope` and `outOfScope` MUST NOT overlap (V-9.1).
2. `outOfScope` (when non-empty) MUST have at least one entry in
   `outOfScopeReasonIds` (V-9.2).
3. `subjectId` MUST resolve to an existing catalog entity.

---

## Examples

```yaml
# A SourceRef pointing at packages/agent-catalog at a specific commit
- id: source-ref:packages-agent-catalog-v1
  repoUrl: https://github.com/a5c-ai/babysitter
  ref: "ef128993"
  path: "packages/agent-catalog/v1"
  packageManager: npm
  packageName: "@a5c-ai/atlas/catalog"
  version: "1.4.2"
  description: |
    The v1 agent catalog package, pinned to commit ef128993. Used as the upstream
    source-of-truth for AgentProduct / AgentVersion records imported into the atlas
    catalog during the migration window.
```

```yaml
# A ScopeBoundary for a Skill
- id: scope-boundary:skill-react-tdd
  subjectId: skill:react-tdd
  inScope: |
    - React 18+ component testing with React Testing Library and Vitest/Jest
    - Hooks, context, and concurrent features as exposed in React 18
    - Test-driven workflow: red / green / refactor with assertion patterns
  outOfScope: |
    - React Native (different testing primitives, different runtime)
    - React Server Components (separate concerns, server-side test rig)
    - End-to-end tests with Playwright/Cypress (covered by skill:e2e-playwright)
  outOfScopeReasonIds:
    - out-of-scope-reason:not-design-artifact
    - out-of-scope-reason:future-phase
  notes: |
    Server components and RSC test patterns are tracked under
    open-question:rsc-test-patterns; revisit after React 19 stabilizes.
```

```yaml
# A ScopeBoundary for a Benchmark
- id: scope-boundary:benchmark-python-web-frameworks
  subjectId: benchmark:python-web-frameworks
  inScope: |
    - Python 3.10+ web frameworks: FastAPI, Flask, Django, Starlette
    - Request/response correctness, routing, middleware composition
    - Async-aware test cases (FastAPI, Starlette)
  outOfScope: |
    - Data-science / ML libraries (pandas, scikit-learn, PyTorch)
    - Python 2.x — out of support
    - Non-web frameworks (Click, Typer, Celery)
  outOfScopeReasonIds:
    - out-of-scope-reason:governance-deferred
    - out-of-scope-reason:future-phase
```

## Related

- [`catalog-meta.md`](./catalog-meta.md) — `OutOfScopeReason`, `EvidenceSource`,
  `Claim`.
- [`../../schema/edge-kinds.md`](../../schema/edge-kinds.md) — `sourced_from`, `in_scope`,
  `out_of_scope`, `out_of_scope_reason`.
- [`../../schema/validation-rules.md`](../../schema/validation-rules.md) — V-9 scope rules.
