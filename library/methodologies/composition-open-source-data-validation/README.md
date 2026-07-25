# Composition: Open Source Data-Validation Framework (TDD + BDD + Kanban + XP + Continuous Deployment)

Implements methodology backlog **Example 7** (community-driven, greenfield data-validation
library). See `../backlog.md` (~line 2291): "Open Source Library — Data Validation Framework"
(previously **📝 Not Implemented**). Completes all seven backlog compositions.

## Why this composition

A public, community-driven validation library has to reconcile five concerns at once: community
demand, executable acceptance, test-first correctness, contributor flow, and safe releases.

| Methodology | What it contributes | Seam artifact |
|-------------|---------------------|---------------|
| **BDD (Specification by Example)** | Gherkin acceptance scenarios per validation behavior (valid + invalid + explicit error message), one `.feature` per rule | the **scenario set** |
| **TDD** | Each rule implemented red-green-refactor directly from its scenarios; every test annotated with its `scenarioId` | the **rule -> scenario -> test map** |
| **Kanban** | Community contribution flow: Backlog -> In Progress -> Review -> Done, labels (`bug`/`feature`/`documentation`/`good-first-issue`), **no WIP limit** (contributor availability is bursty) | the **board + flow metrics** |
| **XP** | Collective ownership, coding standards (lint/format), simple design, continuous integration, small releases | the **CI-green merge candidate** |
| **Continuous Deployment** | Stage-promoted pipeline to a public package registry, dry-run first | the **verified pipeline** |

The seam this composition exists to encode: **community signals -> RFC -> BDD scenarios ->
TDD/XP implementation on a Kanban board -> executed suite -> CD pipeline -> versioned release ->
community announcement.**

## Inline Continuous Deployment (no `continuous-deployment/` dir)

There is **no** `library/methodologies/continuous-deployment/` directory. Per the batch-3
**strangler-fig inline-ingredient precedent** (`../composition-legacy-modernization/` models the
Strangler Fig cutover inline via `clm.cutover.*` rather than importing a nonexistent dir), the
Continuous Deployment ingredient is modeled **inline** here: a frozen ordered `PIPELINE_STAGES`
list borrowing the **stage-promotion** semantics of
[`../../specializations/release-engineering/release-lifecycle.js`](../../specializations/release-engineering/release-lifecycle.js)
(frozen ordered stages, entry-gated promotion, executed per-stage verification). The module
**never references a nonexistent `continuous-deployment` path and never falls back.**

Frozen stages (a `pipelineStagesOverride` must be a strict **prefix-ordered subset**; an unknown
stage **throws**):

```
ci -> build -> publish-dry-run -> docs-deploy-dry-run
```

`publish-dry-run` packs the tarball and resolves the version **without** a real publish — the
real publish is the separate policy-gated `cod.package-publish` executor, never a pipeline stage.
Internal stage promotions are orchestrator-driven; the only human policy gates are the three
below.

## Phase chain (P0..P9)

```
P0 kip recall (methodology-composition)
P1 cod.requirements-intake -> cod.rfc-authoring                         (community RFC)
P2 ctx.parallel: cod.bdd-scenario-authoring per rule                    -> GATE cod.bdd-scenarios
P3 ctx.parallel: cod.contribution-triage + cod.tdd-implement-rule       (Kanban + TDD/XP)
   -> cod.ci-check (aggregate) -> parallel cod.contribution-review
P4 cod.test-suite-execution (executes both suites)                      -> GATE cod.executed-suite
P5 iterate PIPELINE_STAGES -> cod.cd-pipeline-stage; cod.semver-analysis-> GATE cod.cd-readiness
P6 [bump==major] routedBreakpoint breaking-change-release (reject=>stop)
   -> routedBreakpoint package-publish-approval -> cod.package-publish   (guarded)
P7 cod.changelog-generation                                            (changelog + living docs)
P8 cod.release-announcement-draft -> routedBreakpoint community-announcement-send
   -> cod.announcement-send                                             (guarded)
P9 cod.retrospective -> kip assert (composition-seam + open-source-release facts)
```

## Policy-gated actions

| Action / `breakpointId` | Expert | When raised | Executor guard |
|-------------------------|--------|-------------|----------------|
| `breaking-change-release` | `project-maintainer` | **only** when `semver.bump === 'major'` | rejection blocks the publish path entirely (explicit stop) |
| `package-publish-approval` | `project-maintainer` | after cd-readiness gate passed and (`bump !== 'major'` or breaking-change approved) | `cod.package-publish` runs ONLY inside `if (approved === true)` |
| `community-announcement-send` | `community-manager` | after a successful publish | `cod.announcement-send` runs ONLY inside `if (approved === true)` |

All three are raised via `routedBreakpoint` with `breakpointId = actionId`, tags
`['policy-gated', 'cod', <phase-tag>]`, strategy `single`, and **no** `autoApproveAfterN` — the
process never auto-approves a policy gate. Provenance
`{ approved, autoApproved, breakpointId, expert, response }` is always recorded (`autoApproved`
reflects `response?.autoApproved === true` set by an external rule — a fail-closed surfacing).
Ready for `adapters/policy` YAML gating on the `policy-gated` tag.

## Executed-evidence gate contract

Three adversarial seam gates (via `adversarialGate`) **re-execute** their artifacts — they never
read-only review:

| Gate `gateId` | Seam | Critics re-execute |
|---------------|------|--------------------|
| `cod.bdd-scenarios` | requirements -> BDD | parse/dry-run every `.feature`; every rule needs >=1 valid + >=1 invalid scenario |
| `cod.executed-suite` | BDD/TDD/XP -> CD | re-run BOTH suites; every rule maps to an EXECUTED passing test; a skipped/todo mapping is a FAIL |
| `cod.cd-readiness` | CD pipeline -> release | run a full pipeline dry-run + re-derive the semver bump from the actual API diff |

Each gate's critics are independent agents fanned out in parallel by the combinator (none is the
producing agent, none sees another's verdict); evidence is mandatory (a `passed:true` with empty
evidence is coerced to a protocol failure); a bounded fix loop (`maxFixAttempts`, built-in fixer)
runs between rounds; exhaustion escalates via the combinator-owned `<gateId>.gate-escalation`
breakpoint to `owner`. Any failed gate returns `success: false` and stops the chain before the
next phase.

## Inputs

```
{
  libraryName: string (required),
  libraryDescription: string (required),
  validationRules?: [{ ruleId, title, description, priority?, votes?, parallelSafe?, dependsOn? }],
  communitySignals?: string,        // at least one of validationRules / communitySignals required
  contributions?: [{ contributionId, kind: 'feature'|'bug'|'documentation', ruleRef?, summary, parallelSafe?, dependsOn? }],
  currentVersion?: string (default '0.0.0'),
  registry?: string (default 'npm'),
  pipelineStagesOverride?: string[]|null (default null — strict prefix-ordered subset; unknown stage THROWS),
  maxFixAttempts?: number (default 2),
  kipEnabled?: boolean (default true),
  kipDir?: string (default '.a5c/kip'),
  kipModel?: string (default 'sonnet')
}
```

## Outputs

```
{
  success: boolean,               // true iff every gate passed AND (bump!='major' || breaking approved)
                                  //   AND publish approved AND published === true
  rfc: { rfcPath, prioritizedRules, accepted },
  scenarios: [{ ruleId, featurePath, scenarioCount }],
  bddGate: { passed, attempts, escalated, issues, evidence },
  board: { columns, cards: [{ contributionId, column, labels }], flowMetrics },
  implementations: [{ ruleId, summary, filesChanged, scenarioTestMap }],
  reviews: [{ contributionId, approved, reviewer, findings }],
  suiteGate: { passed, attempts, escalated, issues, evidence },
  cdPipeline: { stages: [{ stage, gate, verified, dryRun, evidenceRef }], readinessGate },
  semver: { bump, breaking, apiDiffPath, rationale },
  breakingChange: { raised, approved, autoApproved, breakpointId, expert, response } | null,
  publish: { approved, autoApproved, breakpointId, expert, published, version, registry, artifacts, response },
  release: { changelogPath, docsPath, version, livingDocs },
  announcement: { approved, autoApproved, breakpointId, expert, sent, channels, response } | null,
  retro: { wentWell, couldImprove, actions },
  kipFactsAsserted: number,
  artifacts: array,
  metadata: { processId, runId, breakpointsHit, pipeline: { stages, dryRun: true } }
}
```

## Parallelism

- **P2**: `ctx.parallel.all` authors BDD scenarios concurrently, one thunk per prioritized rule.
- **P3**: a single `ctx.parallel.all` fans out contribution triage **and** the `parallelSafe`
  rule implementations concurrently; dependent rules are then awaited in `dependsOn` order
  (`orderByDependencies`, cycle **throws**) — never speculatively co-scheduled. Contribution
  reviews run in parallel afterward (they depend on triaged contributions).
- **P5**: pipeline stages are **sequential** — promotion requires the prior stage
  `verified === true` (deliberately not parallel).

## Usage

```js
const result = await orchestrate('methodologies/composition-open-source-data-validation', {
  libraryName: 'valides',
  libraryDescription: 'A schema-first data validation framework for JavaScript',
  communitySignals: 'Users want async validators and clearer error messages (#12, #34).',
  currentVersion: '1.2.0',
  contributions: [
    { contributionId: 'PR-101', kind: 'feature', ruleRef: 'rule-async', summary: 'Async validator support' },
  ],
});
```

## Composed modules

- [`../tdd.js`](../tdd.js) — red-green-refactor loop (a **file**, exporting only `process`; its
  task constants are not exported, so this composition defines its own `cod.*` tasks mirroring
  those phase semantics rather than importing constants)
- [`../bdd-specification-by-example/`](../bdd-specification-by-example/) — discovery-workshop /
  gherkin-formulation / execute-tests semantics
- [`../kanban/`](../kanban/) — pull-system / flow-metrics semantics
- [`../extreme-programming/`](../extreme-programming/) — continuous-integration / refactoring
  semantics and the XP constraints
- Continuous Deployment: **inline** (no `continuous-deployment/` dir), borrowing
  [`../../specializations/release-engineering/release-lifecycle.js`](../../specializations/release-engineering/release-lifecycle.js)
  stage-promotion semantics

Combinators come from
[`../../specializations/common-utilities/routed-gate-combinators.js`](../../specializations/common-utilities/routed-gate-combinators.js)
(`routedBreakpoint`, `adversarialGate`, `kipRecall`, `kipAssert`).

## Design rules honored

- **No shell subtasks**: every `cod.*` task is `kind: 'agent'`; suite/lint/pipeline execution is
  performed BY agents who paste executed output as evidence.
- **No fallbacks**: invalid inputs throw; an unknown pipeline-stage override throws; a rule
  dependency cycle throws; a malformed `currentVersion` throws; a failed gate, a rejected
  breaking-change, and a rejected/failed publish each return an explicit `success: false` shape.
- **Guarded executors**: `cod.package-publish` and `cod.announcement-send` run ONLY inside an
  `approved === true` branch; the breaking-change gate is a hard precondition on publish when the
  bump is major.
- **Sparse breakpoints**: exactly the three policy gates plus combinator-owned gate escalations;
  RFC acceptance and internal stage promotions are orchestrator decisions.
- **kip symmetry**: recall at start, assert at end (`methodology-composition` kind), emitting the
  required `open-source-release` facts.
```
