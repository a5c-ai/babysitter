# NodeKinds: `Domain`, `Specialization`, `Topic`, `Language`, `Framework`, `StackProfile`, `SkillArea`, `Library`, `Tool`, `StackPart`

> Cluster 9 — Domain ontology. See [`README.md`](./README.md) for the full catalog.

## Purpose

Cluster 9 is the **subject-matter axis** of the catalog. Where Clusters 1–8 describe *how the
machinery works* (layers, transports, agents, hooks, capabilities), Cluster 9 describes *what
the machinery is being applied to* — the human knowledge domains, the languages and frameworks
the work is expressed in, and the named technology stacks built from those primitives.

Without this cluster the graph cannot answer questions like:

- "Which Skills apply to React frontend work?"
- "Which Subagents specialize in OAuth flows?"
- "Which `StackProfile` does this Workspace match, and what `Skill` set should be loaded?"
- "What expertise level does this Subagent claim in `domain:security`?"

The seven NodeKinds in this cluster form a small, opinionated taxonomy that other extension
content shapes (`Skill`, `Subagent`, `Plugin`) attach to via `applies_to` and that role
descriptors (`Role`, see Cluster 10) attach to via `requires_skill` / `specializes_in`. The
cluster is deliberately *content*-oriented; it carries no runtime behaviour, only declarations
that other parts of the graph reference.

The seven kinds split into three groups:

1. **Subject hierarchy** — `Domain` → `Specialization` → `Topic`. A loose tree of decreasing
   breadth. Topics may attach directly to a Domain when they cut across specializations (e.g.,
   `topic:rate-limiting` belongs to `domain:web-development` directly rather than to a
   specific frontend or backend specialization).
2. **Technology primitives** — `Language` and `Framework`. Languages are the implementation
   substrate; Frameworks are reusable libraries/platforms that belong to one Language (or, in
   rare polyglot cases, a small set treated as siblings).
3. **Composition and grading** — `StackProfile` (a named composition over Languages,
   Frameworks, and tools) and the expertise-level enum (a graded scale used when binding an entity to
   a domain area; collapsed from the former ExpertiseLevel NodeKind into edge attributes — see below).

---

## `Domain`

A broad area of practice — the coarsest unit of subject categorization in the catalog.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `domain:<slug>`, e.g., `domain:web-development`. |
| `displayName` | string | yes | Human-readable label (e.g., `"Web Development"`). |
| `description` | markdown | yes | One-paragraph definition of the domain. |
| `parentDomainId` | ref<Domain> | optional | Set only when the domain nests under a broader domain (e.g., `domain:ml-ops` may declare `parentDomainId: domain:devops`). Most domains are roots and leave this unset. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `contains` | `Specialization` | 1:N | The specializations rolled up under this domain. |
| `contains` | `Topic` | 1:N | Cross-cutting topics that attach directly to the domain rather than to a specialization. |
| `applied_by` | `Skill` \| `Plugin` \| `Subagent` | N:N | Inverse of `applies_to`; populated by content-shape nodes. |
| `targeted_by` | `Benchmark` | N:N | Inverse of `Benchmark.targets`. |

### Evidence

`Domain` carries no evidence-bound attributes. Domain membership is an editorial taxonomy, not
a vendor-attributable claim. `description` is descriptive and policy-default only.

### Invariants

1. The `parentDomainId` chain is acyclic.
2. `id` MUST follow the form `domain:<kebab-slug>`.
3. A domain MAY contain `Specialization`s and `Topic`s; it need not contain any.

### Examples

Canonical roster (illustrative, not exhaustive):

`domain:web-development`, `domain:devops`, `domain:data-science`, `domain:security`,
`domain:mobile`, `domain:infrastructure`, `domain:ml-ops`, `domain:embedded`,
`domain:gaming`, `domain:blockchain`.

---

## `Specialization`

A sub-domain. Specializations are the working unit at which most Skills and Subagents declare
themselves: granular enough to bound expertise, coarse enough that several content-shape nodes
can share one.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `specialization:<slug>`, e.g., `specialization:frontend-react`. |
| `displayName` | string | yes | Human-readable label. |
| `parentDomainId` | ref<Domain> | yes | The parent domain. Required — every specialization rolls up to exactly one domain. |
| `description` | markdown | yes | One-paragraph definition. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `contained_in` | `Domain` | N:1 | Inverse of `Domain.contains`. Mirrors `parentDomainId`. |
| `contains` | `Topic` | 1:N | Topics that specifically belong to this specialization. |
| `applied_by` | `Skill` \| `Plugin` \| `Subagent` | N:N | Inverse of `applies_to`. |
| `targeted_by` | `Benchmark` | N:N | Benchmarks that target this specialization. |

### Evidence

No evidence-bound attributes.

### Invariants

1. `parentDomainId` MUST refer to an existing `Domain` node.
2. The (`Domain` → `Specialization` → `Topic`) graph forms a tree when restricted to
   `contains` edges; cycles are rejected.
3. `id` MUST follow the form `specialization:<kebab-slug>`.

### Examples

`specialization:frontend-react`, `specialization:backend-python-django`,
`specialization:k8s-ops`, `specialization:sre`, `specialization:ml-training`,
`specialization:mobile-ios`, `specialization:mobile-android`.

---

## `Topic`

A granular topic of expertise. Topics are the finest grain at which an extension can declare
relevance, and the level at which most evidence-of-expertise (benchmark coverage, skill
targeting) attaches.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `topic:<slug>`, e.g., `topic:oauth-flows`. |
| `displayName` | string | yes | Human-readable label. |
| `parentSpecializationId` | ref<Specialization> | optional | The specialization this topic belongs to, when applicable. |
| `parentDomainId` | ref<Domain> | optional | Used when the topic cross-cuts specializations and rolls up to the domain directly. Exactly one of `parentSpecializationId` or `parentDomainId` is set. |
| `description` | markdown | yes | One-paragraph definition. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `contained_in` | `Specialization` \| `Domain` | N:1 | Inverse of `contains`. |
| `applied_by` | `Skill` \| `Plugin` \| `Subagent` | N:N | Inverse of `applies_to`. |
| `targeted_by` | `Benchmark` | N:N | Benchmarks that score against this topic. |

### Evidence

No evidence-bound attributes.

### Invariants

1. Exactly one of `parentSpecializationId` or `parentDomainId` MUST be set; both unset or both
   set is invalid.
2. The `contains` tree (Domain → Specialization → Topic, with optional Domain → Topic
   shortcut) is acyclic.
3. `id` MUST follow the form `topic:<kebab-slug>`.

### Examples

`topic:routing`, `topic:state-management`, `topic:ssl-certs`, `topic:oauth-flows`,
`topic:jwt-handling`, `topic:rate-limiting`, `topic:webhook-verification`.

---

## `Language`

A programming language. Languages are *technology primitives* — they describe the
implementation substrate, not a domain of practice. A Skill can declare that it applies to
both `domain:web-development` (the subject) and `language:typescript` (the substrate); both
edges carry independent meaning.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `language:<slug>`, e.g., `language:typescript`. |
| `displayName` | string | yes | Canonical name (e.g., `"TypeScript"`). |
| `paradigms` | list<enum<imperative,functional,object-oriented,declarative,logic>> | yes | Paradigms the language meaningfully supports. Multi-paradigm languages list multiple values. |
| `popularExtensions` | list<string> | yes | File extensions associated with the language (e.g., `[".ts", ".tsx"]`). |
| `homepageUrl` | url | optional, evidence: vendor-doc-or-better | Canonical homepage. When set, MUST be backed by an `EvidenceSource` at `vendor-doc` trust level or higher. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `has_framework` | `Framework` | 1:N | Inverse of `Framework.belongs_to_language`. |
| `composed_in` | `StackProfile` | N:N | Inverse of `StackProfile.composes`. |
| `applied_by` | `Skill` \| `Plugin` \| `Subagent` | N:N | Content shapes that target this language. |
| `targeted_by` | `Benchmark` | N:N | Benchmarks that score against language proficiency (e.g., HumanEval targets `language:python`). |

### Evidence

`homepageUrl` is evidence-bound at `vendor-doc-or-better`. All other attributes are
descriptive editorial values gated by the default policy only.

### Invariants

1. `paradigms` is non-empty.
2. `popularExtensions` entries each begin with `.` and contain no whitespace.
3. `id` MUST follow the form `language:<kebab-slug>`.

### Examples

`language:typescript`, `language:javascript`, `language:python`, `language:rust`,
`language:go`, `language:java`, `language:kotlin`, `language:swift`, `language:c`,
`language:cpp`, `language:ruby`, `language:php`, `language:elixir`, `language:haskell`,
`language:scala`, `language:clojure`, `language:csharp`.

---

## `Framework`

A reusable framework or library that anchors a meaningful chunk of work.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `framework:<slug>`, e.g., `framework:react`. |
| `displayName` | string | yes | Canonical name. |
| `belongsToLanguageId` | ref<Language> | yes | The framework's primary language. Polyglot frameworks (e.g., React Native + JS/TS) pick the canonical one and the others attach via additional `belongs_to_language` edges with `role: secondary`. |
| `category` | enum<web-frontend,web-backend,mobile,game,ml,data,testing,build,other> | yes | Editorial category for navigation and filtering. |
| `description` | markdown | yes | One-paragraph definition. |
| `homepageUrl` | url | optional, evidence: vendor-doc-or-better | Canonical homepage. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `belongs_to_language` | `Language` | N:1 | Primary language. |
| `composed_in` | `StackProfile` | N:N | Inverse of `StackProfile.composes`. |
| `applied_by` | `Skill` \| `Plugin` \| `Subagent` | N:N | Content shapes that target this framework. |
| `targeted_by` | `Benchmark` | N:N | Benchmarks that score against framework proficiency. |

### Evidence

`homepageUrl` is evidence-bound at `vendor-doc-or-better`.

### Invariants

1. A `Framework` belongs to **exactly one** primary `Language` (`belongsToLanguageId`).
   Additional language associations are expressed as edges, not as multiple primary refs.
2. `id` MUST follow the form `framework:<kebab-slug>`.

### Examples

`framework:react`, `framework:nextjs`, `framework:vue`, `framework:angular`,
`framework:svelte`, `framework:django`, `framework:flask`, `framework:fastapi`,
`framework:rails`, `framework:express`, `framework:fastify`, `framework:nest`,
`framework:spring`, `framework:gin`, `framework:axum`, `framework:rocket`,
`framework:react-native`, `framework:flutter`.

---

## ExpertiseLevel (collapsed to enum)

The former `ExpertiseLevel` NodeKind was collapsed in the 2026-04-29 remodel
(Change A.6). The four discrete grades — `novice`, `intermediate`, `expert`,
`authoritative` — now live as edge attributes:

- `requires_skill.level` — the depth of competence a `Role` or
  `Responsibility` requires in a `Skill` / `Domain` / `Specialization`.
- `applies_to.expertiseLevel` — the (optional) graded competence a content
  shape (`Skill`, `Subagent`, `Plugin`, `Blueprint`) claims in a domain area.

Both attributes share the same closed 4-value expertise-level enum. New levels
require a schema bump.

---

## `StackProfile`

A named composition of `Language`, `Framework`, and tooling — the "I run a Next.js + Supabase
+ Stripe shop" identity of a project, recorded as a graph node so multiple Workspaces can
declare alignment with it and Skills/Subagents can target it.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `stack-profile:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `composes` | list<ref<Language> \| ref<Framework> \| ref<Tool>> | yes | The ordered composition. The order is editorial (read order); the graph edges carry the formal relation. |
| `description` | markdown | yes | One-paragraph definition. |
| `popularityRank` | int | optional | Editorial popularity rank (1 = most popular) within a moving snapshot; absent when no ranking is asserted. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `composes` | `Language` \| `Framework` \| `Tool` | N:N | Each item from the `composes` list materializes as one edge with `role` carrying the item's role within the stack. |
| `targeted_by` | `Benchmark` | N:N | Benchmarks that score against the full stack profile. |
| `applied_by` | `Skill` \| `Plugin` \| `Subagent` | N:N | Content shapes that declare themselves stack-profile-aware. |

### Evidence

`popularityRank` is editorial; if claimed against a vendor or analyst report it MUST be
evidence-bound at `community-or-better`. `description` is descriptive only.

### Invariants

1. `composes` is non-empty.
2. Each `composes` entry resolves to an existing `Language`, `Framework`, or `Tool` node.
3. `id` MUST follow the form `stack-profile:<kebab-slug>`.

---

## Examples

```yaml
- id: domain:web-development
  displayName: "Web Development"
  description: |
    The practice of building applications that run primarily over HTTP — both
    the user-facing surfaces (browsers, PWAs) and the server-side machinery
    that powers them.
  edges:
    contains:
      - target: specialization:frontend-react
      - target: specialization:backend-python-django
      - target: topic:rate-limiting   # cross-cutting, attaches to domain
```

```yaml
- id: specialization:frontend-react
  displayName: "Frontend React"
  parentDomainId: domain:web-development
  description: |
    Building user interfaces with React and the wider React ecosystem
    (component libraries, state managers, routers, build tools).
  edges:
    contains:
      - target: topic:routing
      - target: topic:state-management
```

```yaml
- id: framework:react
  displayName: "React"
  belongsToLanguageId: language:typescript
  category: web-frontend
  description: |
    A declarative component library for building user interfaces. Originated
    at Facebook, now maintained by Meta with broad community contribution.
  homepageUrl: https://react.dev/
  evidence:
    - attribute: homepageUrl
      claim: claim:react-homepage
      source: evidence:react-homepage-2026-01
      trustLevel: trust:vendor-doc
  edges:
    belongs_to_language:
      - target: language:typescript
        role: primary
      - target: language:javascript
        role: primary  # React is genuinely both
```

```yaml
- id: stack-profile:nextjs-supabase-stripe
  displayName: "Next.js + Supabase + Stripe"
  description: |
    The canonical "modern indie SaaS" stack: Next.js for the app, Supabase for
    auth+postgres+storage, Stripe for billing.
  composes:
    - language:typescript
    - framework:nextjs
    - tool:supabase
    - tool:stripe
  popularityRank: 3
  edges:
    composes:
      - target: language:typescript
        role: language
      - target: framework:nextjs
        role: web-framework
      - target: tool:supabase
        role: backend-as-a-service
      - target: tool:stripe
        role: billing
```


---

## `SkillArea`

A named area of expertise — the descriptive layer parallel to `Skill` (which carries SKILL.md
implementation content). A `SkillArea` answers "what knowledge does this expertise cover?"
independent of any concrete skill artifact. Roles declare `requires_expertise` against
`SkillArea`s; concrete `Skill` shapes `addresses` `SkillArea`s when their content delivers that
expertise.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `skill-area:<slug>`, e.g., `skill-area:react-testing`. |
| `displayName` | string | yes | Human-readable label. |
| `description` | markdown | yes | What knowledge area this covers. |
| `parentSpecializationId` | ref<Specialization> | optional | Parent specialization, if narrowly scoped. |
| `domains` | list<id> | optional | Refs to `Domain` / `Specialization` / `Topic` this area applies to. |
| `requiresLanguages` | list<id> | optional | Typical languages used. |
| `requiresFrameworks` | list<id> | optional | Typical frameworks. |
| `requiresLibraries` | list<id> | optional | Typical libraries. |
| `requiresStackParts` | list<id> | optional | Typical stack parts. |
| `prerequisiteSkillAreas` | list<id> | optional | Skill areas that should precede this one. |
| `expertiseLevels` | list<enum<novice,intermediate,expert,authoritative>> | optional | Levels at which this area is meaningfully graded. |
| `relatedSkillAreas` | list<id> | optional | Sideways links to nearby areas. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `applies_to` | `Domain` \| `Specialization` \| `Topic` | N:N | Subject ontology this area belongs to. |
| `uses_language` | `Language` | N:N | Typical languages. |
| `uses_framework` | `Framework` | N:N | Typical frameworks. |
| `uses_library` | `Library` | N:N | Typical libraries. |
| `uses_stack_part` | `StackPart` | N:N | Typical stack parts. |
| `uses_tool` | `Tool` | N:N | Typical tools. |
| `requires_skill_area` | `SkillArea` | N:N | Prerequisite chain. |
| `addressed_by` | `Skill` \| `Subagent` \| `Plugin` | N:N | Inverse of `addresses`. |
| `expertise_required_by` | `Role` \| `Responsibility` | N:N | Inverse of `requires_expertise`. |

### Evidence

`SkillArea` is editorial taxonomy; no evidence-bound attributes.

### Invariants

1. `id` MUST follow the form `skill-area:<kebab-slug>`.
2. The `requires_skill_area` (prerequisite) graph is acyclic.

### Examples

`skill-area:react-testing`, `skill-area:kafka-stream-processing`,
`skill-area:k8s-operator-development`, `skill-area:graphql-schema-design`,
`skill-area:postgres-tuning`, `skill-area:oauth-flows`,
`skill-area:webhook-verification`, `skill-area:rate-limiting`.

---

## `Library`

A callable software dependency — code your code calls. Distinct from:

- `Framework` — *inverts control* (calls your code; structures your application).
- `Tool` — developer-facing build/dev/infra tooling, not linked into the app.
- `ToolDescriptor` / `ToolServer` — Cluster 7 agent-callable tool primitives.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `library:<slug>`. |
| `displayName` | string | yes | Canonical name. |
| `belongsToLanguageId` | ref<Language> | optional | Primary language. |
| `category` | enum | optional | testing, validation, http-client, http-server, orm, logging, metrics, tracing, crypto, auth, parsing, serialization, concurrency, datetime, math, data-structures, file-format, image-processing, other. |
| `description` | markdown | yes | One-paragraph definition. |
| `homepageUrl` | url | optional, evidence: vendor-doc-or-better | Canonical homepage. |
| `version` | semver | optional | Pinned version when a specific release is intended. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `belongs_to_language` | `Language` | N:1 | Primary language. |
| `used_for` | `SkillArea` | N:N | Skill areas this library typically supports. |
| `implements_stack_part` | `StackPart` | N:N | Stack-part role this library can fill. |
| `used_by` | `SkillArea` \| `Framework` | N:N | Inverse of `uses_library`. |

### Evidence

`homepageUrl` is evidence-bound at `vendor-doc-or-better`. Other attributes are descriptive.

### Invariants

1. `id` MUST follow the form `library:<kebab-slug>`.

### Examples

`library:zod`, `library:axios`, `library:lodash`, `library:rxjs`, `library:date-fns`,
`library:tokio`, `library:serde`, `library:pydantic`, `library:requests`,
`library:sqlalchemy`, `library:numpy`, `library:pandas`, `library:jackson`.

---

## `Tool`

Developer-facing build / dev / infra tools. Distinct from `ToolDescriptor` (agent-callable
tool with schema) and `ToolServer` (MCP server process). A `Tool` is something a human
operator runs at the command line, in CI, or in their editor — bundlers, linters, container
runtimes, CI systems, observability backends.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `tool:<slug>`. |
| `displayName` | string | yes | Canonical name. |
| `kind` | enum | optional | build-tool, package-manager, linter, formatter, transpiler, bundler, container, orchestrator, iac, debugger, profiler, test-runner, ci, secrets-manager, observability, sql-tool, api-tool, config-mgmt, other. |
| `description` | markdown | yes | One-paragraph definition. |
| `homepageUrl` | url | optional, evidence: vendor-doc-or-better | Canonical homepage. |
| `language` | ref<Language> | optional | Set when the tool is language-specific (e.g., `tool:rustfmt` -> `language:rust`). |
| `platforms` | list<enum<darwin,linux,win32,all>> | optional | Supported host platforms. |
| `installMethods` | list<ref<InstallMethod>> | optional | How users install it (npm, brew, cargo, …). |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `belongs_to_language` | `Language` | N:1 | When language-specific. |
| `used_for` | `SkillArea` | N:N | Skill areas this tool typically supports. |
| `implements_stack_part` | `StackPart` | N:N | Stack-part role this tool can fill. |
| `composed_in` | `StackProfile` | N:N | Stack profiles that include this tool. |

### Evidence

`homepageUrl` is evidence-bound at `vendor-doc-or-better`.

### Invariants

1. `id` MUST follow the form `tool:<kebab-slug>`.

### Examples

`tool:webpack`, `tool:vite`, `tool:esbuild`, `tool:eslint`, `tool:prettier`, `tool:tsc`,
`tool:cargo`, `tool:npm`, `tool:pnpm`, `tool:docker`, `tool:kubernetes`, `tool:helm`,
`tool:terraform`, `tool:ansible`, `tool:jest`, `tool:vitest`, `tool:playwright`,
`tool:github-actions`, `tool:vault`, `tool:datadog`, `tool:prometheus`, `tool:grafana`,
`tool:postman`.

---

## `StackPart`

The abstract **role** a stack component fills — the "what does this layer of the application
stack do?" answer, independent of any specific implementation. Distinct from the atlas agentic
`Layer` NodeKind (which describes the 11-layer agent-stack model). A `StackPart` such as
`stack-part:orm` is filled by `library:hibernate`, `library:sqlalchemy`, `library:prisma`,
`library:drizzle`, `library:sequelize`.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `stack-part:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `description` | markdown | yes | What role this stack part fills. |
| `category` | enum | optional | data-store, data-format, api, runtime, infrastructure, security, observability, tooling, **compute**, **messaging**, other. (catalog pass 16 added `compute` and `messaging` to capture serverless-runtime / container-runtime / pubsub-service / email-delivery / sms-delivery without overloading `infrastructure`.) |
| `commonImplementations` | list<id> | optional | Refs to `Library` / `Framework` / `Tool` / **`PlatformService`** that commonly fill this role. |
| `relatedStackParts` | list<id> | optional | Adjacent stack parts. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `implemented_by` | `Library` \| `Framework` \| `Tool` \| `PlatformService` | N:N | Concrete implementations. (catalog pass 16 widened source list to include `PlatformService` so that e.g. `aws-s3 implements_stack_part stack-part:object-storage`.) |
| `used_by` | `SkillArea` \| `StackProfile` | N:N | Inverse of `uses_stack_part`. |

### Evidence

No evidence-bound attributes.

### Invariants

1. `id` MUST follow the form `stack-part:<kebab-slug>`.

### Examples

`stack-part:orm`, `stack-part:api-gateway`, `stack-part:service-mesh`,
`stack-part:message-queue`, `stack-part:cache`, `stack-part:search-index`,
`stack-part:cdn`, `stack-part:identity-provider`, `stack-part:secrets-manager`,
`stack-part:object-storage`, `stack-part:relational-database`, `stack-part:nosql-database`,
`stack-part:graph-database`, `stack-part:time-series-database`, `stack-part:vector-database`,
`stack-part:logging`, `stack-part:metrics`, `stack-part:tracing`, `stack-part:event-bus`,
`stack-part:reverse-proxy`, `stack-part:load-balancer`, `stack-part:cms`.

catalog pass 16 cloud-primitive additions:
`stack-part:serverless-runtime`, `stack-part:container-runtime`,
`stack-part:kubernetes-cluster`, `stack-part:container-registry`,
`stack-part:managed-postgres`, `stack-part:managed-mysql`, `stack-part:managed-redis`,
`stack-part:block-storage`, `stack-part:file-storage`, `stack-part:virtual-private-network`,
`stack-part:dns-service`, `stack-part:pubsub-service`, `stack-part:data-warehouse`,
`stack-part:data-lake`, `stack-part:model-registry`, `stack-part:model-serving`,
`stack-part:feature-store`, `stack-part:email-delivery`, `stack-part:sms-delivery`.

---

## `Platform`

A **Platform** is a cloud provider, Kubernetes distribution, PaaS, or self-hosted PaaS
that hosts one or more `PlatformService`s. Introduced in catalog pass 16 so the catalog can
distinguish *abstract* role (`StackPart`) from *concrete vendor offering*
(`PlatformService`) while keeping the abstract layer's query surface unchanged.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `platform:<slug>`. |
| `displayName` | string | yes | Canonical name (e.g., `"Amazon Web Services"`). |
| `description` | markdown | yes | One-paragraph description. |
| `kind` | enum | yes | `cloud-provider`, `k8s-distribution`, `paas`, `self-hosted-paas`. |
| `homepageUrl` | url | optional, evidence: vendor-doc-or-better | Canonical homepage. |
| `ownerCompany` | string | optional | Owning vendor / foundation. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `provides` | `PlatformService` | 1:N | A Platform provides one or more PlatformServices. Inverse of `provided_by`. |

### Evidence

`homepageUrl` is evidence-bound at `vendor-doc-or-better` when present.

### Invariants

1. `id` MUST follow the form `platform:<kebab-slug>`.

### Examples

`platform:aws`, `platform:azure`, `platform:gcp`, `platform:kubernetes`,
`platform:vercel`, `platform:netlify`, `platform:heroku`, `platform:fly-io`,
`platform:railway`, `platform:dokploy`.

---

## `PlatformService`

A **PlatformService** is a concrete first-party service offered by a `Platform` —
e.g. `platform-service:aws-lambda`, `platform-service:gcp-pubsub`,
`platform-service:k8s-deployment`. A PlatformService **implements** zero or more
abstract `StackPart`s via the `implements_stack_part` edge (catalog pass 16 widened the edge's
source list to include `PlatformService`).

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `platform-service:<slug>`. |
| `displayName` | string | yes | Canonical name. |
| `description` | markdown | yes | One-paragraph description. |
| `category` | enum | yes | `compute`, `storage`, `database`, `messaging`, `networking`, `observability`, `security`, `ml`, `build-deploy`, `other`. **Diverges from `StackPart.category` by design** — PlatformService is concrete, StackPart is abstract role; no cross-validation between the two enums is required (see V-platform-4 in `../../schema/validation-rules.md`). |
| `providedByPlatformId` | ref<Platform> | yes | The owning Platform (exactly one). |
| `implementsStackPartIds` | list<id> | optional | Refs to abstract StackParts this service fills. **MAY be empty** for services with no abstract counterpart (k8s API objects: `k8s-deployment`, `k8s-configmap`, `k8s-hpa`, `k8s-crd`, `k8s-operator`; `gcp-cloud-build`, `netlify-forms`, `heroku-connect`). See V-platform-5. |
| `homepageUrl` | url | optional, evidence: vendor-doc-or-better | Canonical product page. |
| `launchedAt` | iso-date | optional | Public launch date. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `provided_by` | `Platform` | N:1 | Inverse of `provides`. Exactly one. |
| `integrates_with` | `PlatformService` | N:N (symmetric) | Documented integration (e.g. Lambda ↔ S3 event trigger). Carries `nature: enum<native,sdk,api,event>`. **Canonicalized as `(min(id), max(id))` — exactly one row per unordered pair (V-platform-2)**. |
| `depends_on` | `PlatformService` | N:N | Runtime requires/recommends (e.g. EKS depends_on IAM). Carries `kind: enum<required,optional,recommended>`. Inverse `depended_on_by`. |
| `implements_stack_part` | `StackPart` | N:N | Fills the role of an abstract StackPart. Inverse `implemented_by` (widened in catalog pass 16 to include PlatformService). |

### Evidence

`homepageUrl` is evidence-bound at `vendor-doc-or-better` when present.

### Invariants

1. `id` MUST follow the form `platform-service:<kebab-slug>`.
2. **V-platform-1**: exactly one `provided_by` edge per PlatformService.
3. **V-platform-5**: `implementsStackPartIds` MAY be empty when the service has no abstract stack-part counterpart.

### Examples

AWS: `platform-service:aws-s3`, `platform-service:aws-lambda`, `platform-service:aws-rds`,
`platform-service:aws-dynamodb`, `platform-service:aws-cloudfront`,
`platform-service:aws-sqs`, `platform-service:aws-eventbridge`,
`platform-service:aws-cloudwatch`, `platform-service:aws-iam`,
`platform-service:aws-eks`, `platform-service:aws-ecr`,
`platform-service:aws-api-gateway`, `platform-service:aws-cognito`,
`platform-service:aws-vpc`.

GCP: `platform-service:gcp-cloud-run`, `platform-service:gcp-cloud-functions`,
`platform-service:gcp-pubsub`, `platform-service:gcp-bigquery`,
`platform-service:gcp-gcs`, `platform-service:gcp-cloud-sql`,
`platform-service:gcp-firestore`, `platform-service:gcp-cloud-build`,
`platform-service:gcp-iam`, `platform-service:gcp-gke`,
`platform-service:gcp-artifact-registry`.

Azure: `platform-service:azure-functions`, `platform-service:azure-blob-storage`,
`platform-service:azure-cosmos-db`, `platform-service:azure-service-bus`,
`platform-service:azure-monitor`, `platform-service:azure-aks`,
`platform-service:azure-container-registry`,
`platform-service:azure-active-directory`.

Kubernetes (API-object PlatformServices, `implementsStackPartIds` may be empty):
`platform-service:k8s-deployment`, `platform-service:k8s-service`,
`platform-service:k8s-ingress`, `platform-service:k8s-configmap`,
`platform-service:k8s-secret`, `platform-service:k8s-pvc`,
`platform-service:k8s-hpa`, `platform-service:k8s-crd`,
`platform-service:k8s-operator`.

PaaS: `platform-service:vercel-functions`, `platform-service:netlify-edge-functions`,
`platform-service:heroku-dynos`, `platform-service:fly-apps`,
`platform-service:railway-service`, `platform-service:dokploy-app`, etc.

---

## Prefix policy (catalog pass 16 additions)

Two new ID prefixes are reserved by catalog pass 16 alongside the new NodeKinds above. They
follow the same `<kind>:<kebab-slug>` shape as the rest of the catalog.

| Prefix | Owning NodeKind | Example |
|---|---|---|
| `platform:` | `Platform` | `platform:aws` |
| `platform-service:` | `PlatformService` | `platform-service:aws-lambda` |

Prefix policy in atlas is documented per-NodeKind here in `../../schema/node-kinds/domain-ontology.md`
(there is intentionally no separate `04-prefix-policy.md`).

---

## Related

- [`README.md`](./README.md) — the full node-kind catalog and cluster index.
- [`role-ontology.md`](./role-ontology.md) — `Role` and `Responsibility` reference these
  domains via `requires_skill` / `specializes_in`.
- [`benchmarks.md`](./benchmarks.md) — `Benchmark.targets` may point at any node in this
  cluster; `Benchmark.domainsTested` lists the subject ontology nodes covered.
- [`../../schema/edge-kinds.md`](../../schema/edge-kinds.md) — `contains`, `belongs_to_language`, `composes`,
  `applies_to` edge specifications.
- [`../../schema/evidence-model.md`](../../schema/evidence-model.md) — evidence policies for `homepageUrl`
  fields on `Language` and `Framework`.

