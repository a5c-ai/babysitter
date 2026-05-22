# NodeKinds: `VCSHost`, `PullRequest`, `CodeReview`, `CIWorkflow`

> Cluster — VCS & CI. See [`README.md`](./README.md) for the full catalog.

## Purpose

This cluster makes version-control hosting and continuous-integration workflows first-class
catalog entities. Without it, the graph can describe agents that perform code review but
cannot anchor *which PR on which host* the review attaches to, nor which CI workflow runs
against the same change. With it, the graph carries
`VCSHost → PullRequest → CodeReview` and `VCSHost → CIWorkflow`, anchoring agentic code
work to its real-world artifacts.

The four NodeKinds are:

1. **`VCSHost`** — a git host (GitHub, GitLab.com, Bitbucket Cloud, self-hosted Forgejo).
2. **`PullRequest`** — one merge proposal on a `VCSHost`.
3. **`CodeReview`** — one review event (human or automated) against a `PullRequest`.
4. **`CIWorkflow`** — a named CI pipeline definition (`.github/workflows/test.yml`,
   GitLab `.gitlab-ci.yml`, etc.).

This cluster is the surface that lets the schema answer:

- "Which `CodeReview`s did `role:code-reviewer` produce on `vcs-host:github` last week?"
- "For `pull-request:acme-app-1234`, list all reviews and the CI workflow that ran."
- "Which `CIWorkflow`s exist on `vcs-host:gitlab`?"

---

## `VCSHost`

A version-control hosting service.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `vcs-host:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `homepageUrl` | url | yes, evidence: vendor-doc-or-better | Canonical homepage. |
| `hostKind` | enum<saas,self-hosted,hybrid> | yes | Deployment posture. |
| `protocols` | list<string> | yes | Protocols spoken (e.g., `git-https`, `git-ssh`, `github-api-v3`, `github-graphql-v4`, `gitlab-rest-v4`). |
| `description` | markdown | yes | One-paragraph description. |

### Edges

No outgoing edges by default. Inverses come from `PullRequest.hosted_on` and
`CIWorkflow.runs_on_host`.

### Evidence

`homepageUrl` is required and evidence-bound at `vendor-doc-or-better`.

### Invariants

1. `protocols` is non-empty.
2. `id` MUST follow the form `vcs-host:<kebab-slug>`.

---

## `PullRequest` (origin: `universal`)

> **catalog pass 22 origin correction:** previously `standardized` in
> `schema/ontology-schema.yaml`; reclassified to `universal`. PullRequest
> semantics are cross-vendor (GitHub PR, GitLab MR, Bitbucket / Forgejo CR);
> while the name "PullRequest" is GitHub-coined, the relation it captures is
> universal across modern git hosts. See `REMODEL-NOTES.md` (catalog pass 22 hygiene).

One merge proposal.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `pull-request:<slug>`. |
| `displayName` | string | yes | Human-readable label (typically `<repo>#<number> — <title>`). |
| `number` | int | yes | PR number on the host. |
| `state` | enum<open,merged,closed,draft> | yes | Lifecycle state. |
| `title` | string | yes | PR title. |
| `authorRef` | string | yes | The author (typically a `role:` id, vendor handle, or freeform string). |
| `branchHead` | string | yes | Source branch. |
| `branchBase` | string | yes | Target branch. |
| `url` | url | yes | Canonical PR URL on the host. |
| `createdAt` | iso-timestamp | yes | When the PR was opened. |
| `description` | markdown | optional | Free-form description. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `hosted_on` | `VCSHost` | N:1 | The host this PR lives on. |
| `authored_by` | `Role` \| `Subagent` \| `AgentVersion` | N:1 | The author entity (when modeled as a role/agent rather than a freeform string). |

### Evidence

No evidence-bound attributes by default. `url` is editorial (the host is the source of
truth).

### Invariants

1. `number` ≥ 1.
2. `branchHead` ≠ `branchBase`.
3. `id` MUST follow the form `pull-request:<kebab-slug>`.

---

## `CodeReview`

One review event against a `PullRequest`.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `code-review:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `state` | enum<approved,changes-requested,commented,dismissed> | yes | Review verdict. |
| `submittedAt` | iso-timestamp | yes | When the review was submitted. |
| `body` | markdown | optional | Review body / summary comment. |
| `reviewKind` | enum<human,automated,llm-as-reviewer> | yes | Whether the review was authored by a human, a deterministic checker, or an LLM-based agent. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `reviews` | `PullRequest` | N:1 | The PR being reviewed. |
| `submitted_by` | `Role` \| `Subagent` \| `AgentVersion` | N:1 | The reviewing actor. (Plan originally targeted `Identity`; that NodeKind does not exist in atlas — remapped to `Role` per catalog pass 19 review.) |

### Evidence

No evidence-bound attributes by default.

### Invariants

1. `id` MUST follow the form `code-review:<kebab-slug>`.

---

## `CIWorkflow`

A named CI pipeline definition.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `ci-workflow:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `platform` | enum<github-actions,gitlab-ci,buildkite,circleci,jenkins,bitbucket-pipelines,other> | yes | CI platform. |
| `filePath` | string | yes | Path to the workflow definition within the repo. |
| `triggers` | list<string> | yes | Trigger events (e.g., `push`, `pull_request`, `release`, `schedule`). |
| `description` | markdown | yes | One-paragraph description. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `runs_on_host` | `VCSHost` | N:1 | The VCS host that hosts the repository whose CI this workflow defines. |

### Evidence

No evidence-bound attributes by default.

### Invariants

1. `triggers` is non-empty.
2. `id` MUST follow the form `ci-workflow:<kebab-slug>`.

---

## Examples

See [`graph/extensions/vcs/`](../graph/extensions/vcs/) and
[`graph/extensions/ci/`](../graph/extensions/ci/).

## Related

- [`README.md`](./README.md) — the full node-kind catalog and cluster index.
- [`role-ontology.md`](./role-ontology.md) — `Role` is the source of `CodeReview.submitted_by`
  and `PullRequest.authored_by`.
- [`../../schema/edge-kinds.md`](../../schema/edge-kinds.md) — `hosted_on`, `authored_by`, `reviews`,
  `submitted_by`, `runs_on_host` edge specs.

