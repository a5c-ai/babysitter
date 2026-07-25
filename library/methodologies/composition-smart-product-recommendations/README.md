# Composition: Smart Product Recommendations (DDD + Hypothesis-Driven Development + BDD + Kanban)

Implements methodology backlog **Example 1** (AI-powered product recommendations engine). See
`../backlog.md` (~line 1744, Status **📝 Not Implemented**): "Smart Product Recommendations". This
composition supersedes that *Not Implemented* status only — no code module is replaced.

## Why this composition

- **Domain-Driven Design** owns the map: it models the catalog/shopper domain into subdomains,
  bounded contexts, a context map, and a ubiquitous language. The artifact that crosses its seam
  is the **domain model** (bounded contexts + ubiquitous language), which the strategist turns
  into candidate uplift levers.
- **Hypothesis-Driven Development** owns measurable uplift: each candidate lever becomes a
  falsifiable hypothesis with a primary metric, a quantified uplift target, guardrail metrics, and
  a measurement plan. The artifact that crosses its seam is the **hypothesis + measurement plan**.
- **BDD / Specification by Example** owns executable behavior: every hypothesis is specified as
  Given/When/Then recommendation scenarios (cold-start, personalization relevance,
  diversity/guardrails, **no-fallback ranking**), authored **in parallel per bounded context**,
  each scenario id embedding its `contextId` and `hypothesisId`. The artifact that crosses its
  seam is the **executable gherkin suite**.
- **Kanban** owns delivery flow: scenarios become WIP-limited cards pulled through the board,
  implemented so their mapped scenarios execute green, with flow metrics drawn from real card
  history. The artifact that crosses its seam is the **implemented, tested build**.

The seam this composition exists to encode: **domain model -> hypotheses -> executable scenarios
-> tested build -> validated experiment -> production rollout**, with an adversarial
executed-evidence gate re-checking every seam.

## Seam map

| Phase | Methodology | Artifact in | Artifact out | Combinator used |
|-------|-------------|-------------|--------------|-----------------|
| P0 kip recall + interview | (memory) | topic | prior seam insights, clarified requirements | `kipRecall`, `routedBreakpoint` (`requirements-interview`, conditional) |
| P1 domain modeling | DDD (imported) | catalog description + insights | domain model + hypothesis candidates | `adversarialGate` (`csr.seam.domain-to-hypothesis`) |
| P2 hypothesis formulation | Hypothesis-Driven (imported) | candidates | hypotheses + measurement plans + behavior backlog | — |
| P3 scenario authoring | BDD (csr authoring + imported execution) | behavior backlog per context | executable gherkin + card backlog (parallel per context) | `adversarialGate` (`csr.seam.hypothesis-to-scenarios`), `ctx.parallel.all` |
| P4 implementation flow | Kanban (imported) + csr cards | cards + scenarios | tested build, flow metrics, scenario->test map | `adversarialGate` (`csr.seam.flow-to-experiment`), `ctx.parallel.all` |
| P5 launch + validation | Hypothesis-Driven (imported analysis) + csr lanes | tested build | launch + lane metrics + analysis | `routedBreakpoint` (`experiment-launch-approval`), `adversarialGate` (`csr.experiment-validation`), `ctx.parallel.all` |
| P6 rollout | (release; policy-gated) | validation evidence | rollout decision (guarded) | `routedBreakpoint` (`recommendations-production-rollout`) |
| P7 close | Kanban retro (imported) + memory | cycle record | retro, seam report, kip facts | `kipAssert` |

## Inputs

```
{
  storefrontName: string (required),
  catalogDescription: string (required),
  recommendationGoals: string (required),
  boundedContextHints?: string[],
  experimentLanes?: [{ laneId, variant, description }]  (if absent, derived from validated hypotheses),
  upliftTargets?: object   (explicit per-metric uplift targets; else formulated in P2),
  requirementsClear?: boolean (default false — when false, P0 runs the interview + breakpoint),
  maxParallelContexts?: number (default 3 — parallel authoring/build chunk size),
  maxFixAttempts?: number (default 2 — adversarial-gate fix budget),
  kipEnabled?: boolean (default true),
  kipDir?: string (default '.a5c/kip'),
  kipModel?: string (default 'sonnet')
}
```

## Outputs

```
{
  success: boolean,
  domainModel: { subdomains, boundedContexts, contextMapPath, ubiquitousLanguage },
  hypotheses: [{ hypothesisId, statement, contextId, primaryMetric, upliftTarget, guardrailMetrics, measurementPlanPath }],
  scenarios: [{ contextId, gherkinPath, stepDefPath, scenarioIds }],
  flow: { boardPath, wipLimits, flowMetrics, cardsImplemented },
  seamGates: { domainToHypothesis, hypothesisToScenarios, flowToExperiment } each { passed, attempts, escalated, issues, evidence },
  experiment: { launch, lanes: [{ laneId, computedMetrics, rawDataPath }], analysis, validationGate },
  rollout: { approved, breakpointId, expert, autoApproved, rolledOut, response },
  retro,
  kipFactsAsserted: number,
  artifacts: array,
  metadata: { processId, runId, breakpointsHit }
}
```

`success` is `true` only if all three seam gates passed, experiment validation passed, the launch
was approved, and (if rollout was approved) the model was rolled out. A failed seam gate, a
rejected launch, or a failed validation returns an explicit `success: false` shape with nothing
downstream ever invoked — never a silent fallback that resumes the pipeline.

## Policy-gated actions

| Action | breakpointId | Expert | Phase | Executor guard |
|--------|--------------|--------|-------|----------------|
| Launch live recommendation experiment | `experiment-launch-approval` | `growth-product-lead` | P5 | `csr.launch-experiment` + `csr.experiment-lane` run ONLY if `approved === true` |
| Roll recommendation model to production | `recommendations-production-rollout` | `product-owner` | P6 | `csr.production-rollout` runs ONLY if `approved === true` |

Both are raised via `routedBreakpoint` with `breakpointId = actionId`, tags
`['policy-gated', 'csr', <phase-tag>]`, strategy `single`, and **no** `autoApproveAfterN` — the
process never auto-approves a policy gate. Provenance
`{ approved, autoApproved, breakpointId, expert, response }` is always recorded (`autoApproved`
reflects `response?.autoApproved === true` set by an external rule). Ready for `adapters/policy`
YAML gating on the `policy-gated` tag. A conditional `requirements-interview` breakpoint
(`growth-product-lead`) is raised in P0 only when `requirementsClear !== true`.

## Adversarial seam gates (executed evidence)

Every methodology handoff carries an `adversarialGate` reducing to `{ passed, issues, evidence }`
with mandatory evidence; three independent IRON-LAW critics fan out in parallel (none is the
drafting agent, none sees another's verdict), a bounded fixer loop runs `maxFixAttempts` rounds
between critic rounds, and exhaustion escalates to `owner` via the combinator-owned
`<gateId>.gate-escalation` breakpoint.

| Gate | Seam | Executed evidence | Iron law (abridged) |
|------|------|-------------------|---------------------|
| `csr.seam.domain-to-hypothesis` | DDD -> Hypothesis | design seam (re-derive model artifacts) | re-derive boundaries + language from artifacts; a metric not measurable online is a FAIL |
| `csr.seam.hypothesis-to-scenarios` | Hypothesis -> BDD | **yes** — execute authored gherkin (expect RED/pending) | every hypothesis traces to >= 1 scenario and every scenario to a hypothesis; a non-executable scenario is a FAIL |
| `csr.seam.flow-to-experiment` | BDD/Kanban -> Experiment | **yes** — re-run full BDD suite green | every in-scope scenario maps to an EXECUTED passing test; any silent fallback ranking branch is a FAIL |
| `csr.experiment-validation` | Experiment -> Rollout | **yes** — recompute metrics from raw data + re-run BDD | an uplift not reproducible from `rawDataPath` is a FAIL; a breached guardrail is a FAIL regardless of primary uplift |

The executed-evidence gates use the imported `executeTestsTask` to produce executed output threaded
into the critics' context.

## Composed modules

- [`../domain-driven-design/`](../domain-driven-design/) — `identifySubdomainsTask`,
  `defineBoundedContextsTask`, `createContextMapTask`, `buildUbiquitousLanguageTask`
- [`../hypothesis-driven-development/`](../hypothesis-driven-development/) —
  `formulateHypothesisTask`, `createMeasurementPlanTask`, `analyzeResultsTask`
- [`../bdd-specification-by-example/`](../bdd-specification-by-example/) — `executeTestsTask`
- [`../kanban/`](../kanban/) — `boardVisualizationTask`, `wipLimitManagementTask`,
  `pullSystemTask`, `flowMetricsTask`, `retrospectiveTask`

Combinators come from
[`../../specializations/common-utilities/routed-gate-combinators.js`](../../specializations/common-utilities/routed-gate-combinators.js)
(`routedBreakpoint`, `adversarialGate`, `kipRecall`, `kipAssert`). Phase interiors compose **by
import** where ingredient exports exist; `csr.*` tasks are defined only for cross-methodology
seams, recommendation-domain authoring/execution, and the two guarded policy executors.

## Usage

```js
const result = await orchestrate('methodologies/composition-smart-product-recommendations', {
  storefrontName: 'NovaMart',
  catalogDescription: 'Mid-size fashion storefront: 40k SKUs, returning + cold-start shoppers',
  recommendationGoals: 'Lift average order value and PDP click-through with cross-sell + personalization',
  requirementsClear: false,
});
```

## Design rules honored

- **No shell subtasks**: every `csr.*` task is `kind: 'agent'`; scenario and metric execution is
  performed BY agents who paste executed output as evidence.
- **No fallbacks**: invalid inputs throw; a failed seam gate, a rejected experiment launch, and a
  failed validation each return an explicit `success: false` shape; the recommendation ranking
  itself must specify missing-signal handling as an explicit behavior (enforced by
  `no-fallback-ranking-critic`) — never a silent alternate path. `pickWinningLane` returns an
  honest `null` when no lane qualifies rather than defaulting to an arbitrary lane.
- **Sparse breakpoints**: exactly the two policy gates plus a conditional
  `requirements-interview` and the combinator-owned gate escalations.
- **Bounded loops**: each adversarial gate fixer runs at most `maxFixAttempts`.
- **Honest scheduling**: `ctx.parallel.all` is used at exactly three sites in process code (P3
  per-context authoring, P4 `parallelSafe`-card fan-out, P5 experiment lanes), each bounded by
  `maxParallelContexts` via `chunk`; dependent cards are awaited in `dependsOn` order via
  `orderByDependencies`, never speculatively co-scheduled.
- **Provenance recorded** for both policy gates; executors are strictly guarded on
  `approved === true` — ready for `adapters/policy` YAML gating on the `policy-gated` tag.
