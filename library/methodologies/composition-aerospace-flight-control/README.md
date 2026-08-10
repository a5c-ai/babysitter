# Composition: Aerospace Flight Control (Waterfall + V-Model + Cleanroom + inline Formal Verification)

DO-178C flight-control software archetype: Waterfall system/software requirements
capture, V-Model decomposition with per-level verification plans, Cleanroom
incremental development with statistical usage testing, **inline** formal
verification of critical properties (parallel per-property proofs with
**executed** proof-checker output), certification evidence assembly behind an
independent adversarial certification gate, and a policy-gated flight-software
baseline release. Every stage exit is guarded by an **executed**
requirement-to-verification traceability gate plus a routed verification-lead
sign-off; safety-requirement waivers, DER certification sign-off, and baseline
release are **fail-closed** policy-gated approvals that never auto-execute.

Implements `library/methodologies/backlog.md` Example 6 (line 2183, previously
*Not Implemented*). Pairs with `composition-regulated-greenfield` to complete
the **safety / compliance quadrant** of the methodology matrix.

## Why this composition

Each ingredient contributes a distinct DO-178C capability:

- **Waterfall** — staged rigor and the frozen, sign-off-gated document sequence
  certification authorities audit (system/software requirements capture).
- **V-Model** — every left-side design artifact is paired with its right-side
  test level, making requirement-to-verification traceability *computable* and
  giving each level its own DO-178C verification plan (independence + structural
  coverage objectives).
- **Cleanroom** — defect prevention through box-structure formal specification
  and statistical certification of reliability over an operational usage model.
- **Formal Verification** — machine-checkable proofs for the critical properties
  (safety invariants, control-loop timing/liveness, numerical stability) that
  testing alone cannot certify to Level A confidence.

## Inline formal verification (missing-ingredient rationale)

There is **no** `library/methodologies/formal-verification/` directory in the
library. Rather than reference a nonexistent dir or skip the ingredient, the
formal-verification methodology is modeled **inline** as first-class `caf.formal-*`
tasks inside this composition, following the **batch-3 strangler-fig precedent**
established by `composition-legacy-modernization` (which models legacy-modernization
strangler-fig behavior inline the same way).

The inline seam is deliberately extraction-ready. A future standalone
`formal-verification` methodology dir can lift, unchanged:

- the task set `caf.formal-property-extraction` -> `caf.formal-model-construction`
  -> `caf.property-proof` (executed) -> `caf.fix-formal` (counterexample-driven),
- the `caf.formal.proof-audit` adversarial gate, and
- the **proof-evidence schema**
  `artifacts/caf/formal/<propertyId>/proof-output.json`
  `{propertyId, proofStatus, executionRecord{statesExplored|obligationsDischarged, bound, wallTime}, counterexample|null}`.

This kip fact records the seam:
`process:composition-aerospace-flight-control --inlines-methodology--> methodology:formal-verification`
with `props.seam = 'caf.formal-* task set + proof-evidence schema'`.

## Phase flow

```mermaid
flowchart TD
  P0[Phase 0: kip recall] --> P1
  P1[Phase 1: Waterfall requirements + safety assessment] --> P2
  P2[Phase 2: V-Model decomposition + per-level verification plans] --> P3
  P3[Phase 3: Cleanroom increments + statistical usage testing] --> P4
  P4[Phase 4: INLINE formal verification of critical properties] --> P5
  P5[Phase 5: V-Model right-side verification] --> P6
  P6[Phase 6: Certification evidence + independent gate + DER sign-off] --> P7
  P7[Phase 7: Flight-software baseline release] --> P8
  P8[Phase 8: kip assert]

  P1 -. certifiedStageExit .-> G1{{caf.requirements.traceability}}
  P2 -. certifiedStageExit .-> G2{{caf.decomposition.traceability}}
  P3 -. certifiedStageExit .-> G3{{caf.cleanroom-development.traceability}}
  P4 -. proof-audit .-> GF{{caf.formal.proof-audit}}
  P4 -. certifiedStageExit .-> G4{{caf.formal-verification.traceability}}
  P5 -. per-level .-> GV{{caf.verification.unit|integration|system|acceptance}}
  P5 -. certifiedStageExit .-> G5{{caf.verification.traceability}}
  P6 -. independent .-> GC{{caf.certification.evidence}}
```

Phases are strictly sequential. `ctx.parallel.all` is used only **within** a
phase:

- **Phase 2** — per-level verification planning (four V-Model levels) and per-module module design.
- **Phase 4** — per-property formal analysis (model construction -> executed proof -> bounded fix).
- **Phase 5** — per-module (unit) and per-suite (integration) work; the four verification **levels** are sequential.
- **Phase 3** increments are deliberately **sequential** — Cleanroom increments build on prior increments.

## Ingredients composed by name

Ingredient `process()` functions are **not** called — only exported `defineTask`
tasks are composed, so ingredient-internal breakpoints/loops never double-fire.

| Task | Source module | Phase |
| --- | --- | --- |
| `requirementsGatheringTask` | `../waterfall/waterfall.js` | 1 |
| `requirementsWithAcceptanceTask` | `../v-model/v-model.js` | 1 |
| `systemDesignWithSystemTestTask` | `../v-model/v-model.js` | 2 |
| `architectureWithIntegrationTestTask` | `../v-model/v-model.js` | 2 |
| `moduleDesignWithUnitTestTask` | `../v-model/v-model.js` | 2 (parallel per module) |
| `executeTestsTask` | `../v-model/v-model.js` | 5 (per level/scope) |
| `traceabilityMatrixTask` | `../v-model/v-model.js` | every stage exit + 6 |
| `planIncrementsTask` | `../cleanroom/cleanroom.js` | 3 |
| `createFormalSpecificationTask` | `../cleanroom/cleanroom.js` | 3 (per increment) |
| `designWithVerificationTask` | `../cleanroom/cleanroom.js` | 3 (bounded fix loop) |
| `fixDesignTask` | `../cleanroom/cleanroom.js` | 3 (fix-loop body) |
| `implementIncrementTask` | `../cleanroom/cleanroom.js` | 3 |
| `codeInspectionTask` | `../cleanroom/cleanroom.js` | 3 (bounded fix loop) |
| `fixImplementationTask` | `../cleanroom/cleanroom.js` | 3 (fix-loop body) |
| `createUsageModelTask` | `../cleanroom/cleanroom.js` | 3 (statistical) |
| `generateStatisticalTestsTask` | `../cleanroom/cleanroom.js` | 3 (statistical) |
| `executeStatisticalTestsTask` | `../cleanroom/cleanroom.js` | 3 (executed) |
| `analyzeReliabilityTask` | `../cleanroom/cleanroom.js` | 3 (statistical) |

Combinators (`routedBreakpoint`, `adversarialGate`, `kipRecall`, `kipAssert`)
are imported from
`../../specializations/common-utilities/routed-gate-combinators.js` — never
re-implemented.

Local `caf.*` tasks (all `kind: 'agent'`): `caf.safety-assessment`,
`caf.level-verification-plan`, `caf.trace-diff`, `caf.formal-property-extraction`,
`caf.formal-model-construction`, `caf.property-proof`, `caf.fix-formal`,
`caf.fix-verification`, `caf.assemble-certification-evidence`,
`caf.baseline-release`.

### Task-registry collision

`waterfall.js` and `v-model.js` both register the task id `implementation` at
module-evaluation time (a known library-wide shared-id issue). This composition
uses **neither** module's `implementation` task — Cleanroom's
`implementIncrementTask` does implementation — so the two modules are imported
sequentially via top-level `await import(...)`, and the inert colliding
definition is cleared between them (the same pattern as
`composition-regulated-greenfield`).

## Policy-gated actions (adapters/policy ready)

`breakpointId === actionId` exactly; none carries `autoApproveAfterN` or
`presentAlwaysApprove`; every decision records `autoApproved: false` provenance.

| actionId (== breakpointId) | Expert | When raised | Fail-closed semantics |
| --- | --- | --- | --- |
| `requirement-waiver-approval` | certification-liaison | By `requireSafetyWaiver` for ANY deviation from a captured safety requirement or DO-178C objective (refuted hinted requirements, unformalizable critical properties, exhausted proof/fix budgets, reliability/coverage shortfalls) | **NEVER** auto-executes; rejection **throws**; approvals appended per-requirement to the waivers provenance log, never generalized |
| `certification-evidence-signoff` | designated-engineering-representative | Phase 6, only **after** the independent `caf.certification.evidence` gate passed; payload structurally requires the executed gate result + evidence index | **NEVER** auto-executes; rejection **throws** — the package cannot be released unsigned |
| `flight-software-baseline-release` | chief-engineer | Phase 7 | **NEVER** auto-executes; guarded executor `caf.baseline-release` runs **only** on `approved === true`; rejection leaves `baselineRelease` null and `success` false — no fallback |

**Process breakpoints** (not policy-gated actions): `caf.stage-exit.<stage>`
(verification-lead, one per stage exit: requirements, decomposition,
cleanroom-development, formal-verification, verification) and failure-only owner
escalations (`caf.phase-3.design-escalation.<increment>`,
`caf.phase-3.inspection-escalation.<increment>`,
`caf.phase-5.<level>-escalation.<scope>`). Owner acceptance of a shortfall
touching a safety requirement **additionally** requires
`requirement-waiver-approval` — owner escalation never substitutes for the
certification-liaison waiver.

## Stage-exit contract (`certifiedStageExit`)

1. **Executed traceability** — `traceabilityMatrixTask` computes the stage
   matrix; `caf.trace-diff` diffs it against the previous stored matrix + the SRS
   requirement set, writing `artifacts/caf/<stage>/trace-diff.json`.
2. **Adversarial gate** — `adversarialGate` (`gateId: caf.<stage>.traceability`)
   over the executed diff with `traceability-critic` + `waiver-provenance-critic`,
   IRON LAW ("re-run the trace computation or cite the executed trace-diff.json
   line-by-line"), bounded fixer, owner escalation. Gate failure throws.
3. **verification-lead sign-off** — `routedBreakpoint` with the per-stage-unique
   `caf.stage-exit.<stage>` id; payload built from the executed gate result after
   a structural malformed-check, so sign-off without traceability evidence is
   impossible to construct.
4. **Rejected sign-off throws** — stages are sequential, no skip-ahead.

## Gate catalog and evidence schemas

| Gate | Reviews | Evidence schema |
| --- | --- | --- |
| `caf.<stage>.traceability` (x5) | executed trace diff | `artifacts/caf/<stage>/trace-diff.json` `{stage, coveredCount, uncovered, orphanedVerifications, regressions, waivedRequirements[{reqId, waiverBreakpointEventId}]}` |
| `caf.formal.proof-audit` | executed proof outputs | `artifacts/caf/formal/<propertyId>/proof-output.json` `{propertyId, proofStatus, executionRecord{statesExplored|obligationsDischarged, bound, wallTime}, counterexample|null}` |
| `caf.verification.<level>` (x4) | executed test runs | `artifacts/caf/verification/<level>/results.json` (executed test-run results per plan method) |
| `caf.certification.evidence` | assembled evidence index | `artifacts/caf/certification/evidence-index.json` `{sections[{objective, artifactPath|breakpointEventId}], openItems}` |

The certification gate is **independent and adversarial**: `certification-auditor`
+ `evidence-integrity-critic` are distinct from all producer roles **and** from
every per-stage critic; the auditor must SPOT-CHECK by re-executing at least one
test level and one property proof and diffing against recorded outputs. Every
gate reviews **executed** artifacts — never prose.

## Inputs

| Input | Type | Default |
| --- | --- | --- |
| `systemRequirements` | `string` | **REQUIRED** — empty throws |
| `dalLevelHint` | `string` | — (hint only; `caf.safety-assessment` is authoritative) |
| `flightControlFunctions` | `string[]` | `[]` |
| `criticalPropertiesHint` | `string[]` | `[]` (hint only) |
| `complianceStandards` | `string[]` | `['DO-178C']` |
| `incrementCountHint` | `number` | — (hint only) |
| `kipDir` | `string` | `.a5c/kip` |
| `kipModel` | `string` | `sonnet` |
| `maxFixAttempts` | `number` | `2` |
| `maxProofAttempts` | `number` | `2` |

## Outputs

`{ success, srs, safetyAssessment, vModelDesign, cleanroomDevelopment, formalVerification, verification, traceabilityMatrices, waivers, certificationEvidence, signoffs, baselineRelease, metadata }`

- `baselineRelease` is `null` and `success` is `false` whenever the
  `flight-software-baseline-release` breakpoint is rejected — no fallback path.
- `verification` is keyed by level (`unit` / `integration` / `system` /
  `acceptance`) plus `levelGates`.
- `waivers` is the full safety-requirement waiver provenance log; each entry
  records `{breakpointEventId, breakpointId, requirementIds, rationale, requestingStage, approvedAt, respondedBy, autoApproved:false}`.

## Exported tasks and helpers

| Export | Kind | Role |
| --- | --- | --- |
| `safetyAssessmentTask` | task | Authoritative DO-178C software-level assignment + critical properties |
| `levelVerificationPlanTask` | task | Per-V-Model-level verification plan (independence + coverage) |
| `traceDiffTask` | task | Computed requirement->verification set-diff (waiver provenance) |
| `formalPropertyExtractionTask` | task | Inline formal step 1: property set |
| `formalModelConstructionTask` | task | Inline formal step 2: per-property model |
| `propertyProofTask` | task | Inline formal step 3: EXECUTED proof check |
| `fixFormalTask` | task | Counterexample-driven proof fixer / proof-audit gate fixer |
| `fixVerificationTask` | task | V-Model verification-level fixer / level-gate fixer |
| `assembleCertificationEvidenceTask` | task | DO-178C evidence index assembly / certification-gate fixer |
| `baselineReleaseTask` | task | Guarded executor: cut the flight-software baseline |
| `requireSafetyWaiver` | helper | Fail-closed policy-gated waiver guard |
| `certifiedStageExit` | helper | Stage-boundary contract (executed trace + gate + sign-off) |
| `process` | orchestrator | `process(inputs, ctx)` |

## Usage

```bash
babysitter run:create \
  --process library/methodologies/composition-aerospace-flight-control/composition-aerospace-flight-control.js \
  --input '{"systemRequirements": "Fly-by-wire primary flight control: pitch/roll/yaw command laws with triple-redundant actuators, envelope protection, and a 20ms control-loop deadline. DO-178C Level A.", "flightControlFunctions": ["pitch-law", "roll-law", "envelope-protection"], "criticalPropertiesHint": ["actuator-command-bounds", "control-loop-deadline", "mode-exclusion"]}'
```

## Relationship to ingredients and to composition-regulated-greenfield

This composition and `composition-regulated-greenfield` together fill the
safety/compliance quadrant. `composition-regulated-greenfield` targets a
HIPAA-regulated greenfield build (Waterfall + DDD + Cleanroom + V-Model with
PHI-access policy gating); this one targets a DO-178C flight-control build,
swapping DDD for **inline formal verification** and adding the certification
evidence package + baseline release. Both share the same backbone:
combinator-based routed breakpoints and adversarial gates, an executed-trace
stage-exit contract, guarded policy-gated executors, per-item waiver/approval
provenance threading, and kip recall/assert (here under kind
`methodology-composition`). The `caf.formal-*` seam documented above is the
extraction point should formal verification become a standalone methodology dir.
