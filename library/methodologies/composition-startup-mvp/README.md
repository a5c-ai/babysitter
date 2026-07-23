# Composition: Startup MVP (Shape Up + Example Mapping + TDD + Scrum)

Implements methodology backlog **Example 3** (startup MVP fitness-app archetype, greenfield
discovery -> bet -> build). See `../backlog.md` (~line 1871): "Startup MVP - Fitness Tracking App".

## Why this composition

- **Shape Up** owns discovery and commitment: shaping produces the pitch (appetite statement,
  breadboards, fat-marker notes, rabbit holes, no-gos, 2-5 buildable scopes with demo criteria);
  the betting table decides bet-or-pass; the appetite runs the circuit breaker mid-build; and
  cool-down closes the cycle. The artifact that crosses its seam is the **pitch**.
- **Example Mapping** owns elaboration: each pitch scope gets a 25-minute-session-shaped mapping
  into blue (story) / yellow (rule) / green (example) / red (question) cards, with gherkin
  generated per green card. The artifact that crosses its seam is the **example map** (and its
  gherkin file).
- **TDD** owns construction: each story is implemented red-green-refactor **directly from its
  green-card examples**, every test annotated with its `exampleId` — the example->test
  traceability matrix is the pass currency of the ship gate. The artifact that crosses its seam
  is the **example-derived test suite**.
- **Scrum** owns cadence: sprint planning maps the appetite onto sprints
  (`sprintCount = ceil(appetiteWeeks / sprintLengthWeeks)`), sprint review demos against the
  pitch demo criteria and places scopes on the hill chart, and the whole-cycle retrospective
  feeds cool-down. The artifact that crosses its seam is the **sprint increment**.

The seam this composition exists to encode: **pitch -> bet -> example maps -> example-derived
tests -> sprint increments -> ship**, all bounded by the appetite.

## Seam map

| Phase | Methodology | Artifact in | Artifact out | Combinator used |
|-------|-------------|-------------|--------------|-----------------|
| P0 kip recall | (memory) | kip store | prior seam insights | `kipRecall` |
| P1 shaping | Shape Up | product idea + insights | pitch (scopes, appetite, no-gos) | — |
| P2 betting table | Shape Up | pitch | bet decision + provenance | `routedBreakpoint` (`bet-commitment`) |
| P3 elaboration | Example Mapping | pitch scopes + stories | example maps + gherkin (parallel per scope) | — (`ctx.parallel.all`) |
| P4 sprint setup | Scrum | example maps | sprint plan + **appetite->sprint mapping** | — |
| P5 build loop | TDD inside Scrum | sprint backlog + example maps | tested increments, hill chart, appetite check | `routedBreakpoint` (`scope-cut-approval`, conditional) |
| P6 ship gate | (verification) | executed suite + traceability matrix | ship-readiness verdict | `adversarialGate` (`csm.ship-readiness`) |
| P7 ship | (release) | gate evidence | shipped MVP (guarded) | `routedBreakpoint` (`mvp-ship`) |
| P8 close | Scrum retro + Shape Up cool-down | cycle record | retro actions, cool-down notes, kip facts | `kipAssert` |

The **circuit-breaker/scope-cut seam** (P5) is Shape Up's fixed-time-variable-scope rule living
inside Scrum's cadence: when the appetite check reports `exceeded` or `forecastOverrun`, a scope
cut is proposed and policy-gated; the founder may instead grant a one-time `extend-one-sprint`
or order `stop-and-ship-what-is-done`. At most `maxScopeCutRounds` rounds; no silent extension.

## Inputs

```
{
  productName: string (required),
  mvpDescription: string (required),
  appetiteWeeks?: number (default 2 — startup pace, not 6),
  sprintLengthWeeks?: number (default 1; sprintCount = ceil(appetiteWeeks / sprintLengthWeeks)),
  teamContext?: string,
  maxFixAttempts?: number (default 2 — ship-gate fixer budget),
  maxScopeCutRounds?: number (default 1),
  kipEnabled?: boolean (default true),
  kipDir?: string (default '.a5c/kip'),
  kipModel?: string (default 'sonnet')
}
```

## Outputs

```
{
  success: boolean,
  bet: { approved, breakpointId, expert, autoApproved, response },
  pitch: { pitchPath, appetiteWeeks, scopes, rabbitHoles, noGos },
  exampleMaps: [{ scopeId, cards, gherkinPath }],
  sprints: [{ sprint, goal, storiesCompleted, tddSummaries, hillChart, appetiteRemainingWeeks }],
  circuitBreaker: { tripped, scopeCut? { approved, breakpointId, cutScopes, response } },
  shipGate: { passed, attempts, escalated, issues, evidence },
  ship: { approved, shipped, breakpointId, expert, autoApproved, response },
  coolDown: { retroActions, coolDownNotes },
  kipFactsAsserted: number,
  artifacts: array,
  metadata: { processId, runId, breakpointsHit, appetite: { budgetWeeks, consumedWeeks } }
}
```

A rejected bet ("pass") is a **valid** outcome, not an error: the process records provenance,
runs cool-down with reason `bet-passed`, asserts the kip facts, and returns `success: false`
with nothing downstream ever invoked.

## Policy-gated actions

| Action | breakpointId | Expert | Phase | Executor guard |
|--------|--------------|--------|-------|----------------|
| Commit the bet + appetite | `bet-commitment` | `product-founder` | P2 | downstream phases run only if `approved === true` |
| Approve circuit-breaker scope cuts | `scope-cut-approval` | `product-founder` | P5 (conditional) | cuts applied only if `approved === true`; rejection must carry an explicit decision |
| Ship the MVP | `mvp-ship` | `product-founder` | P7 | `shipMvpTask` runs ONLY inside `if (approved === true)` |

All three are raised via `routedBreakpoint` with tags `['policy-gated', 'csm', <phase-tag>]`,
strategy `single`, and **no** `autoApproveAfterN` — the process never auto-approves a policy
gate. Provenance `{ approved, autoApproved, breakpointId, expert, response }` is always recorded
(`autoApproved` reflects `response?.autoApproved === true` set by an external rule). Ready for
`adapters/policy` YAML gating on the `policy-gated` tag.

## Ship-readiness gate (executed evidence)

`adversarialGate` with `gateId: 'csm.ship-readiness'` over the ship-readiness report written by
`csm.test-suite-execution` (which itself EXECUTES the full suite and builds the example->test
traceability matrix). Three independent critics — `example-coverage-critic`,
`tdd-evidence-critic`, `mvp-scope-critic` — are fanned out in parallel by the combinator; none
is the implementer or the test-executor, and none sees another's verdict. Iron law: critics
**re-run the suite themselves**; every in-scope green-card example must map to an EXECUTED
passing test (skipped/todo/unexecuted mappings are FAIL); passing without evidence is coerced to
a protocol failure. A bounded fix loop (`maxFixAttempts`, built-in fixer) runs between rounds;
exhaustion escalates via the combinator-owned `csm.ship-readiness.gate-escalation` breakpoint to
`owner`. If the gate still fails, the process returns `success: false` and **`mvp-ship` is never
raised**.

## Composed modules

- [`../shape-up/`](../shape-up/) — shaping, betting table, hill chart, circuit breaker, cool-down
- [`../example-mapping/`](../example-mapping/) — card-session shape and gherkin output
- [`../scrum/`](../scrum/) — sprint planning / review / retrospective cadence
- [`../tdd.js`](../tdd.js) — red-green-refactor loop (a **file**, exporting only `process`; its
  task constants are not exported, so this composition defines its own `csm.*` tasks mirroring
  those phase semantics rather than importing constants)
- [`../atdd-tdd/`](../atdd-tdd/) is the acceptance-first sibling — cited for orientation, **not**
  composed here

Combinators come from
[`../../specializations/common-utilities/routed-gate-combinators.js`](../../specializations/common-utilities/routed-gate-combinators.js)
(`routedBreakpoint`, `adversarialGate`, `kipRecall`, `kipAssert`).

## Usage

```js
const result = await orchestrate('methodologies/composition-startup-mvp', {
  productName: 'FitTrack',
  mvpDescription: 'Fitness tracking mobile app MVP: workout logging and progress charts',
  appetiteWeeks: 2,
  sprintLengthWeeks: 1,
});
```

## Design rules honored

- **No shell subtasks**: every `csm.*` task is `kind: 'agent'`; test execution is performed BY
  agents who paste executed output as evidence.
- **No fallbacks**: invalid inputs throw; an unapproved bet or ship and a failed gate return
  explicit `success: false` shapes; a rejected scope cut must carry an explicit founder decision
  (`extend-one-sprint`, once, or `stop-and-ship-what-is-done`) — never a silent alternate path.
- **Sparse breakpoints**: exactly the three policy gates plus the combinator-owned gate
  escalation; unresolved red cards are carried as named sprint risks instead of extra
  breakpoints.
- **Bounded loops**: circuit breaker at most `maxScopeCutRounds`; gate fixer at most
  `maxFixAttempts`.
- **Honest scheduling**: `ctx.parallel.all` is used exactly twice in process code (P3 per-scope
  elaboration, P5 `parallelSafe` story fan-out); dependent stories are awaited in `dependsOn`
  order, never speculatively co-scheduled.
