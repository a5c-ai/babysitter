# Composition: Legacy Modernization (Event Storming + DDD + FDD + Strangler Fig + RUP)

**Provenance**: implements methodology backlog Example 4 "Legacy Banking System Modernization"
(`library/methodologies/backlog.md`, ~line 1954, previously marked "Not Implemented").
Scenario: refactor a monolithic banking system to microservices (brownfield), with a
zero-downtime requirement and irreversible legacy retirement steps that demand recorded approvals.

## Why this composition

No single ingredient methodology suffices for a brownfield banking migration:

| Ingredient | Unique contribution | Why it is not enough alone |
| --- | --- | --- |
| **Event Storming** | Discovery breadth — maps ALL domain events, hotspots, and pivotal events across the whole monolith fast | Produces a timeline, not boundaries, delivery plans, or governance |
| **DDD strategic design** | Boundary rigor — bounded contexts, context map, ubiquitous language, anti-corruption layers against the legacy model | Assumes discovery already happened; says nothing about delivery cadence or cutover risk |
| **FDD** | Delivery cadence — per-context feature lists and design/build-by-feature loops that parallelize cleanly | Feature factories do not decide when it is safe to route production traffic |
| **Strangler Fig (inline)** | Incremental risk containment — facade routing, executed old-vs-new parity, slice-at-a-time cutover, verified retirement | A cutover pattern, not a discovery or modeling method |
| **RUP** | Governance — phase-boundary go/no-go sign-offs (Inception/Elaboration/Construction/Transition) with accountable experts | Governance without domain discovery or parity evidence is rubber-stamping |

## Ingredient handoff map

Ingredient tasks are imported and invoked **by name**; the `clm.*` tasks are this module's own glue and cutover machinery.

| Producer stage | Artifact | Consumer stage |
| --- | --- | --- |
| Event Storming (`bigPictureStormingTask`, `processModelingTask`) | events timeline, hotspots, pivotal events | `clm.handoff.storm-to-contexts` distills DDD-ready candidate subdomains |
| Storm handoff | candidate subdomains + hotspots | DDD (`identifySubdomainsTask`, `defineBoundedContextsTask`) |
| DDD (`createContextMapTask`, `contextMappingTask`, `buildUbiquitousLanguageTask`, `identifyDomainEventsTask`) | bounded contexts + context map | `clm.design.legacy-acl-plan` (ACL per legacy touchpoint), FDD model scope, RUP `defineArchitectureTask` |
| FDD (`developOverallModelTask`, `buildFeaturesListTask`, `planByFeatureTask`) | per-context feature plans | `clm.handoff.features-to-slices` derives ordered cutover `sliceSpecs[]` |
| FDD (`designByFeatureTask`, `buildByFeatureTask`) + `clm.build.context-verification` | verified context builds (executed evidence) | Construction sign-off, then the P5 slice loop |
| `clm.parity.execute-comparison` + adversarial parity gate | executed old-vs-new parity report | `cutover-slice-approval.<sliceId>` and `legacy-decommission.<sliceId>` approvals |
| All phase boundaries | phase payloads (vision, gates, evidence) | RUP sign-offs (`createVisionDocumentTask`, `createBusinessCaseTask`, `assessRisksTask`, `defineArchitectureTask`, `refineProjectPlanTask` feed the payloads) |

## Strangler Fig is modeled inline

There is **no** `strangler-fig` ingredient directory in this library, and this module never
references one. The Strangler Fig pattern lives entirely in this module's own tasks:

- `clm.cutover.prepare-routing` — facade routing seam, shadow-capable, legacy path untouched
- `clm.parity.execute-comparison` — EXECUTED old-vs-new comparison checks (parity report artifact)
- `clm.cutover.execute` — guarded routing flip (approval provenance recorded)
- `clm.cutover.post-verification` — executed smoke/invariant re-checks against live routing
- `clm.decommission.execute` — guarded legacy retirement with post-removal regression run

## Phase walkthrough (P0–P6)

- **P0 — kip recall**: composition-pattern facts, ingredient interface shapes, prior handoff
  successes/failures, strangler cutover lessons (kind `methodology-composition`). Threaded into every later task.
- **P1 — RUP Inception + big-picture discovery**: vision, business case, risk assessment;
  big-picture storming and process modeling over the legacy system; storm-to-contexts handoff.
  Gate: `phase-gate-signoff.inception`.
- **P2 — DDD strategic design (Elaboration)**: subdomains → bounded contexts → context map →
  ubiquitous language + domain events; ACL plan per context; architecture + plan baseline.
  Adversarial gate `clm.context-map-review`, then `phase-gate-signoff.elaboration`.
- **P3 — FDD feature decomposition**: sequential per-context model/feature-list/plan; the
  features-to-slices handoff derives risk-ascending `sliceSpecs[]` (each with EXECUTABLE
  comparison checks — a slice without them is invalid and the process throws).
- **P4 — parallel context builds (Construction)**: `ctx.parallel.all` over contexts, chunked by
  `maxParallelContexts`. Contexts are independent by construction (P2 gate enforced single
  ownership), so branches share no state. **Orchestrator note**: do not co-schedule P5 slices
  against unresolved P4 branches — compose slice inputs only from settled build results.
  Gate: `phase-gate-signoff.construction` with per-context executed verification evidence.
- **P5 — strictly sequential cutover slices**: a plain `for...of` — never parallel. Per slice:
  routing seam → executed parity comparison → adversarial parity gate → cutover approval →
  guarded cutover → post-verification → decommission approval → guarded decommission.
  Any rejection or failed verification halts the loop with an explicit halt record.
- **P6 — Transition close-out**: modernization report (completed AND halted slices, first-class),
  `phase-gate-signoff.transition`, then kip assert of handoff/parity/ordering lessons.

**Parallel/sequential contract**: context builds run in parallel (bounded), cutover slices run
strictly sequentially with executed verification between each slice.

## Policy-gated actions

Enumerated in the module JSDoc `@policyGatedActions` block so `adapters/policy` YAML gating can be generated from it.

| actionId | Expert | breakpointId pattern | Guarded executor |
| --- | --- | --- | --- |
| `cutover-slice-approval` | `modernization-lead` | `cutover-slice-approval.<sliceId>` (per-slice-unique) | `clm.cutover.execute` runs only when `result.approved === true`; approval provenance (`breakpointId`, `approved`, `autoApproved`) recorded in its output |
| `legacy-decommission` | `modernization-lead` | `legacy-decommission.<sliceId>` (per-slice-unique) | `clm.decommission.execute` — **decommission never auto-executes**; an unapproved decommission is a halt, not a skip |
| `phase-gate-signoff` | `program-sponsor` | `phase-gate-signoff.<inception\|elaboration\|construction\|transition>` | Rejection returns an explicit halted result — later phases never run |

None of these carry `autoApproveAfterN` — production-traffic, irreversible-retirement, and
go/no-go decisions stay accountable.

## Adversarial parity gate

Per slice, `clm.parity.<sliceId>` (via the shared `adversarialGate` combinator) reviews the
executed parity report with two independent critics:

- **parity-critic** — re-executes a sample of comparison checks itself and verifies the report's
  diffs are real, complete, and reproducible; executed old-vs-new evidence is mandatory.
- **risk-critic** — divergence severity, rollback readiness, banking invariants (balances,
  idempotency, audit trail) covered by executed checks.

Iron law: every claim needs an EXECUTED check output (file:line citations plus re-run outputs);
a parity report whose checks were not actually executed is an automatic FAIL. A `passed: true`
verdict with empty evidence is coerced to a protocol failure by the combinator. Fix loop:
`maxFixAttempts` (default 2) with the built-in gate fixer, then escalation to a routed owner
breakpoint; on escalation-reject the slice **halts** — no cutover approval is ever raised.
Ordering guarantee: the parity gate must pass (or be owner-approved) **before**
`cutover-slice-approval.<sliceId>` is raised.

## Inputs and usage

| Input | Type | Default | Meaning |
| --- | --- | --- | --- |
| `systemName` | string | — (required) | Legacy system name, e.g. `core-banking` |
| `legacyDescription` | string | — (required) | Monolith overview, tech stack, constraints |
| `domainExperts` | string[] | `[]` | Storming participants |
| `zeroDowntimeRequired` | boolean | `true` | Cutover downtime constraint |
| `maxParallelContexts` | number | `3` | Context-build chunk size |
| `maxFixAttempts` | number | `2` | Adversarial-gate fix budget |
| `kipDir` | string | `.a5c/kip` | kip store directory |
| `kipModel` | string | `sonnet` | Model for structured kip paths |

```bash
babysitter run:create \
  --process methodologies/composition-legacy-modernization/composition-legacy-modernization.js#process \
  --inputs '{
    "systemName": "core-banking",
    "legacyDescription": "COBOL+Java monolith: accounts, payments, loans, fraud; Oracle DB; zero-downtime SLA",
    "domainExperts": ["ops-lead", "payments-sme", "loans-sme"],
    "zeroDowntimeRequired": true
  }'
```

## Design rules

- **No fallbacks.** Missing slice `comparisonChecks`, unapproved breakpoints, and unexecuted
  parity checks are hard halts/failures — never defaulted, skipped, or silently continued.
  Guarded executors additionally refuse to build without `approved === true` provenance.
- **Combinator reuse.** Routing metadata, adversarial gates, and kip checkpoints come from
  `../../specializations/common-utilities/routed-gate-combinators.js` (`routedBreakpoint`,
  `adversarialGate`, `kipRecall`, `kipAssert`) — kip calls override the combinators' default
  kind with `methodology-composition` and take `kipModel` from inputs (default `sonnet`).
- **Agent-only tasks.** Every `clm.*` task is a Style-A `defineTask` factory with
  `kind: 'agent'` and a mandatory `evidence` array (`minItems: 1`) in its output schema.
