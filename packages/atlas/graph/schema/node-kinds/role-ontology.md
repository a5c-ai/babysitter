# NodeKinds: `Role`, `Responsibility`, `OrgUnit`

> Cluster 10 — Role ontology. See [`README.md`](./README.md) for the full catalog.

## Purpose

Cluster 10 is the **accountability axis** of the catalog: the answer to "who (or what) does
this work, and what are they on the hook for?" It bridges *human* org structure (a tech lead
on the Platform team) and *agentic* worker structure (a Subagent that fulfils a code-reviewer
role) through a single `Role` NodeKind disambiguated by an `isAgentic` flag.

The cluster exists so the graph can answer:

- "For responsibility R (e.g., `responsibility:review-prs-merge-decisions`), which `Role`s
  hold it?"
- "Filter to agentic roles → for each, which `Subagent`s have `roles_played_by` that role?"
- "From a human role, what does it `delegates_to` — i.e., which agentic roles can absorb its
  load?"
- "Which `Plugin`s declare intended responsibilities matching the gaps in our role coverage?"

This is the core matchmaking surface for "find me an agentic worker for X" queries, and the
inverse "what work does a Subagent claim to be accountable for" queries.

The three NodeKinds split into:

1. **`Role`** — a named role, human or agentic, with required capabilities, domains,
   languages, frameworks, and skills. Roles are the *fulfillable* unit.
2. **`Responsibility`** — an atomic, accountable unit of work. Responsibilities are
   independent of roles; the same responsibility may be held by multiple roles (with weights)
   and the same role may hold multiple responsibilities.
3. **`OrgUnit`** — team / department / squad. Roles attach to OrgUnits via `member_of`.
   OrgUnits may nest.

Cluster 10 leans on Cluster 9 (`Domain`, `Specialization`, `Topic`, `Language`, `Framework`,
`Skill`) for everything subject-matter — roles do not redefine these; they reference them.

---

## `Role`

A human or agentic role.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `role:<slug>`, e.g., `role:code-reviewer`. |
| `displayName` | string | yes | Human-readable label. |
| `isAgentic` | bool | yes | **Discriminator**. `true` for agentic roles fulfilled by agents/subagents; `false` for human roles. Required on every `Role` — there is no default. |
| `description` | markdown | yes | One-paragraph description of what the role is for. |
| `seniority` | enum<junior,mid,senior,staff,principal> | conditional | **Only valid when `isAgentic = false`.** Indicates human seniority band. |
| `agentVersionConstraints` | list<ref<AgentVersion>> | conditional | **Only valid when `isAgentic = true`.** Which `AgentVersion`s are acceptable to fulfil the role. Empty list means "any". |
| `requiredCapabilities` | list<ref<Capability>> | optional | Capabilities the role demands (e.g., `capability:streaming`, `capability:parallel-tool-call`). |
| `requiredDomains` | list<ref<Domain> \| ref<Specialization> \| ref<Topic>> | optional | Subject-matter areas the role must cover. |
| `requiredLanguages` | list<ref<Language>> | optional | Languages the role must work in. |
| `requiredFrameworks` | list<ref<Framework>> | optional | Frameworks the role must work with. |
| `requiredSkills` | list<ref<Skill>> | optional | Skills the role expects on the bench. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `holds_responsibility` | `Responsibility` | N:N | The responsibilities this role is on the hook for. Edge attribute `weight` (0..1) records primary vs. supporting accountability. |
| `requires_skill` | `Skill` \| `Domain` \| `Specialization` | N:N | Edge attribute `level` (novice/intermediate/expert/authoritative — the former `ExpertiseLevel` enum, collapsed into edge attribute by Change A.6 of the 2026-04-29 remodel) records depth of competence required. |
| `delegates_to` | `Role` | N:N | Edge attribute `condition` (markdown) records when delegation applies (e.g., "for routine PR reviews under N lines"). |
| `member_of` | `OrgUnit` | N:1 | The org unit this role belongs to. |
| `played_by` | `Subagent` | N:N | Inverse of `Subagent.roles_played_by`. |

### Evidence

No evidence-bound attributes by default. A specific deployment MAY add an evidence policy on
`requiredCapabilities` if the role is being asserted against a vendor's published agent spec.

### Invariants

1. `isAgentic` is required (no default).
2. `seniority` MUST be unset when `isAgentic = true`.
3. `agentVersionConstraints` MUST be unset (or empty) when `isAgentic = false`.
4. The `delegates_to` graph is acyclic (no role transitively delegates to itself).
5. `id` MUST follow the form `role:<kebab-slug>`.
6. If `requiredFrameworks` is non-empty, every referenced framework's
   `belongsToLanguageId` MUST be present in `requiredLanguages` (else the role's language
   constraints are inconsistent with its framework constraints).

### Examples

Canonical roster — human roles:

`role:tech-lead` (human, senior), `role:sre` (human, mid), `role:qa-engineer` (human),
`role:product-manager` (human), `role:devrel` (human).

Canonical roster — agentic roles:

`role:code-reviewer`, `role:planner`, `role:explorer`, `role:security-reviewer`,
`role:documentation-writer`.

---

## `Responsibility`

An atomic unit of accountable work.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `responsibility:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `description` | markdown | yes | One-paragraph definition of the work, its inputs, and its expected outputs. |
| `scopeBoundary` | ref<ScopeBoundary> | optional | When the responsibility's scope is non-obvious, an explicit `ScopeBoundary` records what is in/out. |
| `requiredSkills` | list<ref<Skill>> | optional | Skills typically required to discharge this responsibility. Roles holding the responsibility usually inherit these. |
| `cadence` | enum<continuous,scheduled,on-demand,event-triggered> | yes | When the work happens. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `held_by` | `Role` | N:N | Inverse of `Role.holds_responsibility`. |
| `declared_intended_by` | `Plugin` | N:N | Inverse of `Plugin.declares_intended_responsibilities`. |

### Evidence

No evidence-bound attributes by default.

### Invariants

1. `cadence` is required (no default).
2. `id` MUST follow the form `responsibility:<kebab-slug>`.
3. If `scopeBoundary` is set, the referenced node MUST exist.

### Examples

`responsibility:approve-architecture-changes`, `responsibility:review-prs-merge-decisions`,
`responsibility:write-user-docs`, `responsibility:respond-incidents`.

---

## `OrgUnit`

A team, department, or squad. The smallest editorial container that carries `Role` membership.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `org-unit:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `parentOrgUnitId` | ref<OrgUnit> | optional | When the org unit nests under a larger one. |
| `description` | markdown | yes | One-paragraph definition. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `has_member` | `Role` | 1:N | Inverse of `Role.member_of`. |
| `parent_of` | `OrgUnit` | 1:N | Hierarchical container relation; mirrors `parentOrgUnitId`. |

### Evidence

No evidence-bound attributes.

### Invariants

1. The `parentOrgUnitId` chain is acyclic.
2. `id` MUST follow the form `org-unit:<kebab-slug>`.

---

## Bridging human ↔ agentic work

The matchmaking pattern this cluster enables, expressed as a query:

> *Given* a `Responsibility` R, *find* `Role`s where `holds_responsibility = R` and
> `isAgentic = true`, then *find* `Subagent`s with `roles_played_by` that role, *filtered*
> by `Subagent.applies_to ⊇ R.requiredSkills` (matched at sufficient expertise level via the `applies_to.expertiseLevel` edge attribute, formerly the `ExpertiseLevel` NodeKind).

The same query inverted answers "what should this Subagent be on the hook for?" — find the
`Role`s it plays, then their `holds_responsibility` set.

The `delegates_to` edge models the *escalation/handoff* shape: a senior human role can
declare which agentic roles are acceptable substitutes under stated conditions, and an
agentic role can declare which other agentic role it escalates to (e.g., `role:explorer`
escalates to `role:planner` when it surfaces a plan-worthy decision).

---

## Examples

```yaml
- id: role:code-reviewer
  displayName: "Code Reviewer"
  isAgentic: true
  description: |
    Reviews pull requests for correctness, style, security, and merge-readiness.
    Produces structured review comments, approval/request-changes decisions, and
    optionally suggested patches.
  agentVersionConstraints:
    - agent-version:claude-code@1.x
    - agent-version:codex@latest
  requiredCapabilities:
    - capability:tool-use
    - capability:parallel-tool-call
    - capability:long-context
  requiredDomains:
    - domain:web-development
    - specialization:frontend-react
    - specialization:backend-python-django
  requiredLanguages:
    - language:typescript
    - language:python
  requiredFrameworks:
    - framework:react
    - framework:django
  requiredSkills:
    - skill:react-tdd
    - skill:python-typing
  edges:
    holds_responsibility:
      - target: responsibility:review-prs-merge-decisions
        weight: 1.0
    requires_skill:
      - target: skill:react-tdd
        level: expert
      - target: domain:security
        level: intermediate
    member_of:
      - target: org-unit:platform-team
```

```yaml
- id: role:tech-lead
  displayName: "Tech Lead"
  isAgentic: false
  seniority: senior
  description: |
    Drives technical direction for a squad: architecture decisions, design
    review, escalation point for cross-team blockers. Delegates routine review
    work to the agentic code-reviewer role under stated conditions.
  requiredDomains:
    - domain:web-development
    - domain:devops
  edges:
    holds_responsibility:
      - target: responsibility:approve-architecture-changes
        weight: 1.0
      - target: responsibility:review-prs-merge-decisions
        weight: 0.5
    delegates_to:
      - target: role:code-reviewer
        condition: |
          Routine PR reviews (under ~400 LOC, no schema/migration changes,
          no security-sensitive paths). Tech-lead retains accountability for
          architecture-affecting reviews.
    member_of:
      - target: org-unit:platform-team
```

```yaml
# A Subagent fulfilling a Role
- id: subagent:claude-code-reviewer-v1
  displayName: "Claude Code Reviewer (v1)"
  edges:
    roles_played_by:
      - target: role:code-reviewer
    applies_to:
      - target: domain:web-development
        confidence: primary
      - target: domain:security
        confidence: secondary
```

```yaml
- id: responsibility:review-prs-merge-decisions
  displayName: "Review PRs and decide on merge"
  description: |
    For every open pull request in scope, produce a review (approve / request
    changes / comment-only) and a written rationale. The reviewer is on the
    hook for catching correctness regressions, style violations, security
    issues, and architectural drift before merge.
  cadence: event-triggered
  requiredSkills:
    - skill:code-review-fundamentals
    - skill:security-review-basics
```

```yaml
- id: org-unit:platform-team
  displayName: "Platform Team"
  description: |
    The squad that owns shared infrastructure, developer experience, and
    cross-cutting agentic tooling.
  edges:
    has_member:
      - target: role:tech-lead
      - target: role:sre
      - target: role:code-reviewer       # an agentic role lives on the team too
```

---

## `Tenant`

A logical isolation boundary for multi-tenant deployments. A tenant carries the platform-side
identity that owns runs, quotas, budgets, and audit trails. Distinct from `Customer`
(commercial counterparty) and from `OrgUnit` (organizational structure): a single
`Customer` may have multiple `Tenant`s (sandbox, staging, prod), and a `Tenant` may map
back to a single `OrgUnit` that "owns" it.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `tenant:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `externalId` | string | optional | Tenant's identifier in the platform's external system (e.g., billing). |
| `tier` | enum<free,starter,business,enterprise> | yes | Service tier. |
| `status` | enum<active,suspended,archived> | yes | Lifecycle status. |
| `createdAt` | iso-timestamp | yes | When the tenant was provisioned. |
| `description` | markdown | yes | One-paragraph description. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `owned_by` | `OrgUnit` | N:1 | The org unit that operates / owns the tenant. (Plan originally targeted `Org`; remapped to `OrgUnit` per catalog pass 19 review.) |

### Invariants

1. `id` MUST follow the form `tenant:<kebab-slug>`.

---

## `Customer`

The commercial counterparty: the party that signed the contract / pays the bill. Distinct
from `Tenant` (the operational isolation boundary the customer's runs land in) and from
`OrgUnit` (the platform-side organizational container). A single `Customer` typically
contracts with one `OrgUnit` and operates one or more `Tenant`s.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `customer:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `legalName` | string | yes | Legal entity name (often differs from `displayName`). |
| `segment` | enum<consumer,smb,mid-market,enterprise,public-sector,academic> | yes | Commercial segment. |
| `region` | enum<global,us,eu,uk,jp,ca,au,other> | yes | Primary commercial region. |
| `description` | markdown | yes | One-paragraph description. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `represents` | `OrgUnit` | N:1 | The internal org unit that owns the relationship. (Plan originally targeted `Org`; remapped to `OrgUnit` per catalog pass 19 review.) |
| `contracted_with` | `Tenant` | N:N | The tenant(s) the customer's contract entitles to. |

### Invariants

1. `id` MUST follow the form `customer:<kebab-slug>`.

> **Boundary note (per catalog pass 19 review):** `Customer` is the *commercial* layer (contracts,
> billing, segment); `OrgUnit` is the *organizational* layer (teams, squads, departments
> as `Role` containers); `Tenant` is the *operational* isolation layer (runs, quotas,
> data). All three are first-class because they are queried independently.

---

## `EndUser`

A natural person whose actions originate runs (the human typing into the agent UI, or the
identified API caller behind a token). Distinct from `Role` (a fulfillable accountability
slot) and `Customer` (a commercial counterparty). EndUsers belong to a `Tenant`.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `end-user:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `externalId` | string | optional | Identifier in the platform's identity system (email, SSO sub, etc.). |
| `status` | enum<active,suspended,deleted> | yes | Lifecycle status. |
| `createdAt` | iso-timestamp | yes | When the end-user was provisioned. |
| `description` | markdown | yes | One-paragraph description. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `belongs_to` | `Tenant` | N:1 | The tenant the end-user is enrolled in. |

### Invariants

1. `id` MUST follow the form `end-user:<kebab-slug>`.

---

## `VendorRelationship`

A first-class record of a contractual / commercial relationship with a `Provider` (or other
upstream vendor). Lets the catalog answer "which paid relationships do we hold, and who
is contractually accountable on our side?"

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `vendor-relationship:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `vendorName` | string | yes | Vendor's commercial name (e.g., `"OpenAI"`). |
| `contractType` | enum<api-paid,api-trial,enterprise,reseller,partner,oss-only> | yes | Commercial posture. |
| `startDate` | iso-date | yes | When the relationship began. |
| `endDate` | iso-date | optional | When the relationship was wound down (open-ended when unset). |
| `status` | enum<active,wind-down,terminated,suspended> | yes | Lifecycle status. |
| `description` | markdown | yes | One-paragraph description. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `with_organization` | `OrgUnit` | N:1 | The internal org unit owning the relationship. (Plan originally targeted `Org`; remapped to `OrgUnit` per catalog pass 19 review.) |
| `procures` | `Provider` | N:N | The provider(s) the relationship purchases from. |

### Invariants

1. `startDate` ≤ `endDate` (when both set).
2. `id` MUST follow the form `vendor-relationship:<kebab-slug>`.

---

## Related

- [`README.md`](./README.md) — the full node-kind catalog and cluster index.
- [`domain-ontology.md`](./domain-ontology.md) — `Role.requiredDomains`,
  `Role.requiredLanguages`, `Role.requiredFrameworks` reference Cluster 9 nodes.
- [`cost-quota.md`](./cost-quota.md) — `Quota.constrains` and `BudgetPolicy.governs`
  point at `Tenant`, `Customer`, `EndUser`, `OrgUnit`.
- [`../../schema/edge-kinds.md`](../../schema/edge-kinds.md) — `holds_responsibility`, `requires_skill`,
  `delegates_to`, `member_of`, `roles_played_by`, `owned_by`, `represents`,
  `contracted_with`, `belongs_to`, `with_organization`, `procures` edge specifications.
- `Subagent` (Cluster 7) — the content shape that fulfils agentic roles via
  `roles_played_by`.
- `Plugin` (Cluster 7) — declares intended responsibilities via
  `declares_intended_responsibilities`.

