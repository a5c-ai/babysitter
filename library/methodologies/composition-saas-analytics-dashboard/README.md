# Composition: SaaS Analytics Dashboard (JTBD + Impact Mapping + Spec-Kit + Kanban + XP)

Implements methodology backlog **Example 5** (B2B SaaS analytics-dashboard archetype, brownfield
feature added to an existing product). See `../backlog.md` (~line 2062): a customer-health
analytics dashboard delivered by composing five methodologies, each owning one seam.

## Why this composition

- **Jobs-to-be-Done** owns discovery: parallel interview synthesis (one segment per fan-out)
  surfaces the real, solution-agnostic jobs the dashboard is hired to do; the imported
  `forcesAnalysisTask` consolidates push/pull/anxiety/habit forces and `jobStoryGenerationTask`
  emits situation/motivation/expected-outcome stories. The artifact that crosses its seam is the
  **JTBD report** (jobs + job stories).
- **Impact Mapping** owns the goal-to-deliverable ladder: from the `businessGoal` root, imported
  `actorIdentificationTask -> impactAnalysisTask -> deliverableGenerationTask -> prioritizationTask`
  build `goal -> actor -> impact -> deliverable` branches. The artifact that crosses its seam is
  the **impact map** (prioritized per-actor branches).
- **Spec-Kit** owns the buildable contract: a constitution encodes the non-functional budgets, and
  then — **per impact branch, in parallel** — a dashboard view spec (layout, metrics, drill-downs,
  measurable acceptance assertions) and its data contract are authored. The artifact that crosses
  its seam is the **per-view spec + data contract + machine-checkable acceptance assertions**.
- **Kanban** owns flow: a board (`Backlog -> Design -> Dev(WIP=3) -> Code Review -> QA -> Done`)
  with a Dev WIP limit; each view spec becomes a card pulled under the limit. The artifact that
  crosses its seam is the **flow-metered board** (cycle/lead time, throughput, bottlenecks).
- **Extreme Programming** owns engineering excellence: imported `pairProgrammingTask` +
  `tddPracticeTask` (tests first from the acceptance assertions, red-green-refactor, recording
  `assertionId -> test`), `continuousIntegrationTask` on every increment, `refactoringTask` for
  cleanup. The artifact that crosses its seam is the **assertion-derived test suite**.

The seam this composition exists to encode: **jobs -> impact ladder -> per-view specs -> flow-metered
XP increments -> rendered-conformance release**, guarded by an adversarial executed-evidence gate at
every methodology boundary.

> **Kanban re-expression:** `kanban/kanban.js` and `extreme-programming/xp-process.js` both register
> a global task id `retrospective`, so a module importing both throws a `DuplicateTaskIdError` at
> load. The XP task constants are imported directly; the three Kanban stages are re-expressed as own
> `csd.wip-setup`, `csd.pull-cards`, `csd.flow-metrics` tasks (the same treatment the design gives
> Spec-Kit, which exports only `process`). The module therefore loads with no id collision.

## Seam map

| Phase | Methodology | Artifact in | Artifact out | Combinator used |
|-------|-------------|-------------|--------------|-----------------|
| P0 kip recall | (memory) | kip store | prior seam insights | `kipRecall` |
| P1 JTBD | Jobs-to-be-Done | dashboard brief + segments | JTBD report (jobs, forces, stories) | — (`ctx.parallel.all` over segments) |
| G1 gate | (verification) | JTBD report | synthesis verdict | `adversarialGate` (`csd.jtbd-synthesis`) |
| P2 Impact Mapping | Impact Mapping | business goal + jobs | impact map (goal->actor->impact->deliverable) | imported task constants |
| G2 gate | (verification) | impact map | ladder-integrity verdict | `adversarialGate` (`csd.impact-map`) |
| P3 Spec-Kit | Spec-Kit | branches + job stories + budget | constitution + per-view specs + data contracts | — (`ctx.parallel.all` per impact branch) |
| G3 gate | (verification) | Spec-Kit artifacts | measurability + contract verdict | `adversarialGate` (`csd.spec-authoring`) |
| P4 Kanban + XP | Kanban + XP | view specs | flow-metered TDD-built views | imported XP tasks + `ctx.parallel.all` (WIP-bounded) |
| G4 release gate | (verification) | executed conformance report | rendered-conformance verdict | `adversarialGate` (`csd.spec-conformance`) |
| P5 beta | (release) | conformance report + partners | beta rollout (guarded) | `routedBreakpoint` (`beta-customer-invite`) |
| P6 GA | (release) | beta outcomes + conformance | GA release (guarded) | `routedBreakpoint` (`dashboard-ga-release`) |
| P7 close | retro + memory | cycle record | retro actions + kip facts | `kipAssert` |

## Per-impact-branch parallel elaboration

Spec-Kit specification is not authored monolithically. After the constitution is fixed,
`ctx.parallel.all` fans out over `impactMap.branches`: **for each impact branch concurrently**, the
view spec (`csd.view-spec`) is authored and then its data contract (`csd.data-contract`) — so every
prioritized actor/impact branch produces exactly one dashboard view + backing data contract in
parallel with the others. Interview synthesis (P1) and WIP-bounded card implementation (P4) are the
other two parallel sections; dependent stages (forces -> stories per job, view -> its data contract)
are awaited in order, never speculatively co-scheduled.

## Executed spec-conformance release gate

`adversarialGate` with `gateId: 'csd.spec-conformance'` — the **dashboard-release gate** — runs over
the report written by `csd.spec-conformance-run`, which **renders/executes each dashboard view** and
captures the rendered value / measurement / API response per acceptance assertion, then re-runs the
XP/TDD suite. Three independent critics (`rendered-conformance-critic`, `constitution-budget-critic`,
`tdd-evidence-critic`) are fanned out in parallel; none is the implementer or the conformance runner.
Iron law:

- Do **not** trust the report — render/execute the dashboard yourself and compare rendered output to
  each spec assertion.
- Every in-scope `acceptanceAssertion` must map to an **EXECUTED** conformance check with rendered
  proof; an assertion mapped only to a skipped/unexecuted check is a **FAIL**.
- Measured dashboard load and query latency must meet the constitution budgets (numbers, not claims).

A planning invariant is enforced in code before the gate: `assertConformanceComplete(specs,
conformance)` throws if the conformance run left any in-scope assertion without an executed rendered
check. A bounded fix loop (`maxFixAttempts`, built-in fixer) runs between rounds; exhaustion escalates
via the combinator-owned `csd.spec-conformance.gate-escalation` breakpoint. **This gate MUST pass
before any beta invite is raised** — if it fails, the process returns `success: false` with
`beta: null` and `ga: null`, and no guarded executor ever runs.

## Policy-gated actions

| Action | breakpointId | Expert | Phase | Executor guard |
|--------|--------------|--------|-------|----------------|
| Beta invite + scoped access to design partners | `beta-customer-invite` | `product-owner` | P5 | `csd.beta-rollout` runs ONLY inside `if (approved === true)` |
| GA release to all tenants | `dashboard-ga-release` | `head-of-product` | P6 | `csd.ga-release` runs ONLY inside `if (approved === true)` |

Both are raised via `routedBreakpoint` with tags `['policy-gated', 'csd', <phase-tag>]`, strategy
`single`, and **no** `autoApproveAfterN`. Provenance `{ approved, autoApproved, breakpointId, expert,
response }` is always recorded (`autoApproved` reflects `response?.autoApproved === true`). GA is only
raised once beta is approved+executed. Ready for `adapters/policy` YAML gating on the `policy-gated`
tag.

## Inputs

```
{
  productName: string (required),
  dashboardBrief: string (required),
  businessGoal: string (required),
  customerSegments?: array<string> (default derived: [`${productName} primary users`]),
  designPartners?: array<{customerId, name, segment}> (default []),
  performanceBudget?: object (default { dashboardLoadMs: 3000, queryMs: 1000, dataLatencyMin: 5 }),
  maxFixAttempts?: number (default 2 — bounded fixer budget per adversarial gate),
  maxInterviews?: number (default 5 — cap on parallel JTBD interview-synthesis fan-out),
  kipEnabled?: boolean (default true),
  kipDir?: string (default '.a5c/kip'),
  kipModel?: string (default 'sonnet')
}
```

## Outputs

```
{
  success: boolean,  // true only when the spec-conformance gate passed AND beta approved+executed AND GA approved+released
  jtbd: { reportPath, jobs: [{ jobId, jobStatement, forces:{push,pull,anxiety,habit}, jobStories }] },
  impactMap: { mapPath, goal, branches: [{ branchId, actor, impact, deliverables:[{deliverableId,name,priority}] }] },
  specs: { constitutionPath, viewSpecs: [{ branchId, viewId, viewSpecPath, dataContractPath, acceptanceAssertions }], checklist:{passed,items} },
  implementation: { board:{columns,wipLimits}, storiesImplemented:[{storyId,viewId,exampleTestMap,ciRunId}], flowMetrics:{cycleTimeDays,leadTimeDays,throughputPerWeek,bottlenecks} },
  conformance: { reportPath, passed, renderedEvidence:[{viewId,assertionId,status,renderedProof}], totals:{assertions,passed,failed,unrendered} },
  beta: { approved, autoApproved, breakpointId, expert, response, invitedCustomers, accessGranted } | null,
  ga: { approved, autoApproved, breakpointId, expert, response, released, releaseNotes } | null,
  retro: { wentWell, couldImprove, actions },
  kipFactsAsserted: number,
  artifacts: array,
  metadata: { processId, runId, breakpointsHit, seamGatesPassed }
}
```

A failed seam gate (G1–G3) returns `success: false` with a `failedStage` marker and nothing
downstream invoked. A failed release gate (G4) returns `success: false` with `beta: null` and
`ga: null`. A rejected beta or GA breakpoint returns a valid non-success provenance record with the
guarded executor never called.

## kip touchpoints

- **Recall (P0)** — `kipRecall` under kind `methodology-composition`, topic keyed to `productName` +
  `businessGoal`; also carries saas-product facts. Guarded by `kipEnabled`; an empty store is a fresh
  brain, not an error.
- **Assert (P7)** — `kipAssert` under kind `methodology-composition` writes five facts:
  `seam-handoffs` (`{jobCount, branchCount, viewCount}`), `conformance-coverage` (assertions ->
  executed checks, `{gateAttempts, escalated, failed}`), `flow-metrics` (`{bottlenecks}`),
  `provenance-summary` (beta/ga approved+auto, `{released}`), and `observed-seam` (which seam leaked).

## Composed modules

- [`../jobs-to-be-done/`](../jobs-to-be-done/) — imports `forcesAnalysisTask`, `jobStoryGenerationTask`
- [`../impact-mapping/`](../impact-mapping/) — imports `actorIdentificationTask`, `impactAnalysisTask`,
  `deliverableGenerationTask`, `prioritizationTask`
- [`../spec-kit/`](../spec-kit/) — exports only `process`; its stages are re-expressed as own
  `csd.constitution`, `csd.view-spec`, `csd.data-contract`, `csd.spec-checklist` tasks
- [`../extreme-programming/`](../extreme-programming/) — imports `pairProgrammingTask`,
  `tddPracticeTask`, `continuousIntegrationTask`, `refactoringTask`
- [`../kanban/`](../kanban/) — semantics mirrored as own `csd.wip-setup`, `csd.pull-cards`,
  `csd.flow-metrics` (importing it alongside XP would collide on the `retrospective` task id)
- [`../../specializations/product-management/product-lifecycle-e2e.js`](../../specializations/product-management/product-lifecycle-e2e.js)
  — pattern reference: point tasks composed as callable stages; Spec-Kit artifacts feed implementation

Combinators come from
[`../../specializations/common-utilities/routed-gate-combinators.js`](../../specializations/common-utilities/routed-gate-combinators.js)
(`routedBreakpoint`, `adversarialGate`, `kipRecall`, `kipAssert`).

## Usage

```js
const result = await orchestrate('methodologies/composition-saas-analytics-dashboard', {
  productName: 'AcmeCRM',
  dashboardBrief: 'A customer-health analytics dashboard for CSMs: usage trends, cohort retention, churn alerts, CSV export',
  businessGoal: 'increase B2B retention by 10% through better health insights',
  customerSegments: ['enterprise CSMs', 'mid-market CSMs'],
  designPartners: [{ customerId: 'cust-1', name: 'Northwind', segment: 'enterprise CSMs' }],
});
```

## Design rules honored

- **No shell subtasks**: every task is `kind: 'agent'`; test/render/latency execution is performed BY
  agents who paste executed output and measured numbers as evidence.
- **No fallbacks**: invalid inputs throw before any orchestration; a failed gate or an unapproved
  beta/GA returns an explicit `success: false` shape; a missing executed conformance check throws
  (`assertConformanceComplete`) rather than being papered over.
- **Guarded executors**: `csd.beta-rollout` and `csd.ga-release` run strictly inside
  `if (provenance.approved === true)`; a non-approval yields a valid non-success record, never a
  side-effecting fallback path.
- **Executed-evidence gates**: an `adversarialGate` at every methodology seam; the release gate
  renders the dashboard and re-runs the suite rather than trusting summaries.
- **Honest scheduling**: `ctx.parallel.all` is used for interview synthesis, per-impact-branch
  elaboration, and WIP-bounded card implementation; dependent stages are awaited in order.
- **Combinators from `common-utilities` only.**
```
