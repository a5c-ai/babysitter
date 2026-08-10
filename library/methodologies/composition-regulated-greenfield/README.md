# Composition: Regulated Greenfield (V-Model + DDD + Cleanroom + Waterfall)

HIPAA-compliant patient-portal archetype: Waterfall stage sequencing over DDD
clinical-domain modeling, Cleanroom formal specification/verification for
PHI-handling components, and V-Model paired verification levels with
per-component parallel verification. Every stage exit is guarded by an
**executed** requirement-to-verification traceability gate plus a routed
qa-lead sign-off breakpoint; PHI access and production deploy are policy-gated
compliance-officer breakpoints that never auto-execute.

## Why this quadrant

This composition fills the **compliance / formal-verification quadrant** of the
methodology matrix and pairs with the `data-privacy-compliance` specialization:

- **Waterfall** supplies frozen, sign-off-gated stage sequencing — the shape
  regulators audit.
- **DDD** keeps the clinical domain honest (Patient Management, Scheduling,
  Medical Records, Billing, Communication contexts with a shared clinical
  glossary).
- **Cleanroom** supplies formal specification and correctness verification for
  exactly the components that handle PHI.
- **V-Model** pairs every left-side design artifact with its right-side test
  level, making requirement-to-verification traceability computable instead of
  aspirational.

**Provenance**: implements `library/methodologies/backlog.md` Example 2
("Healthcare Patient Portal - HIPAA Compliant", previously *Not Implemented*).

## Stage map

```
  Waterfall stage           Ingredient ownership (left V | right V)
  ---------------           ----------------------------------------
  Stage 1 Requirements      waterfall:requirements-gathering (SRS)
                            v-model:requirements-with-acceptance ----+
                            crg:phi-classification                   |
  Stage 2 Domain modeling   ddd strategic+tactical tasks             |
                            v-model:system-design-with-system-test -+|
  Stage 3 Formal spec       cleanroom:create-formal-specification   ||
   (PHI components)         cleanroom:design-with-verification      ||
                            v-model:architecture-with-integration -+||
                            v-model:module-design-with-unit-test -+|||
  Stage 4 Implementation    crg:implement-component               ||||
  Stage 5 Verification      v-model:execute-tests  unit <---------+|||
                             + cleanroom:code-inspection (PHI)     |||
                            v-model:execute-tests  integration <---+||
                            v-model:execute-tests  system <---------+|
                            v-model:execute-tests  acceptance <------+
  Stage 6 Deploy            v-model:traceability-matrix (full)
                            waterfall:deployment (guarded)
```

Every stage boundary runs `regulatedStageExit` (see contract below). Stage
boundaries are strictly sequential; `ctx.parallel.all` is used only *within*
a stage.

## Ingredients composed by name

Ingredient `process()` functions are **not** called — only exported
`defineTask` tasks are composed, so ingredient-internal breakpoints/loops
never double-fire.

| Task | Source module | Stage |
| --- | --- | --- |
| `requirementsGatheringTask` | `../waterfall/waterfall.js` | 1 |
| `deploymentTask` | `../waterfall/waterfall.js` | 6 (guarded) |
| `identifySubdomainsTask` | `../domain-driven-design/domain-driven-design.js` | 2 |
| `defineBoundedContextsTask` | `../domain-driven-design/domain-driven-design.js` | 2 |
| `createContextMapTask` | `../domain-driven-design/domain-driven-design.js` | 2 |
| `buildUbiquitousLanguageTask` | `../domain-driven-design/domain-driven-design.js` | 2 |
| `identifyEntitiesValueObjectsTask` | `../domain-driven-design/domain-driven-design.js` | 2 (parallel per context) |
| `defineAggregatesTask` | `../domain-driven-design/domain-driven-design.js` | 2 (parallel per context) |
| `identifyDomainEventsTask` | `../domain-driven-design/domain-driven-design.js` | 2 (parallel per context) |
| `validateLanguageConsistencyTask` | `../domain-driven-design/domain-driven-design.js` | 2 |
| `createFormalSpecificationTask` | `../cleanroom/cleanroom.js` | 3 (parallel per PHI component) |
| `designWithVerificationTask` | `../cleanroom/cleanroom.js` | 3 (bounded fix loop) |
| `fixDesignTask` | `../cleanroom/cleanroom.js` | 3 (fix-loop body) |
| `codeInspectionTask` | `../cleanroom/cleanroom.js` | 5a (PHI components) |
| `fixImplementationTask` | `../cleanroom/cleanroom.js` | 5a (fix-loop body) |
| `requirementsWithAcceptanceTask` | `../v-model/v-model.js` | 1 |
| `systemDesignWithSystemTestTask` | `../v-model/v-model.js` | 2 |
| `architectureWithIntegrationTestTask` | `../v-model/v-model.js` | 3 |
| `moduleDesignWithUnitTestTask` | `../v-model/v-model.js` | 3 (parallel per component) |
| `executeTestsTask` | `../v-model/v-model.js` | 5 (per level) |
| `traceabilityMatrixTask` | `../v-model/v-model.js` | every stage exit + 6 |

Combinators (`routedBreakpoint`, `adversarialGate`, `kipRecall`, `kipAssert`)
are imported from
`../../specializations/common-utilities/routed-gate-combinators.js` — never
re-implemented.

Local `crg.*` tasks (all `kind: 'agent'`): `crg.phi-classification`,
`crg.trace-diff`, `crg.implement-component`, `crg.fix-verification`.

## Policy-gated breakpoints

| breakpointId | Expert | Tags | When raised | Auto-execute |
| --- | --- | --- | --- | --- |
| `crg.phi-data-access-approval` | compliance-officer | crg, policy-gated, phi, hipaa | By `requirePhiApproval` BEFORE any task is scheduled with PHI-derived data (Stage 3 entry; again in Stage 4 for any dataset not already covered) | **NEVER** |
| `crg.stage-exit.requirements` | qa-lead | crg, policy-gated, stage-exit, requirements | Stage 1 exit | **NEVER** |
| `crg.stage-exit.domain-modeling` | qa-lead | crg, policy-gated, stage-exit, domain-modeling | Stage 2 exit | **NEVER** |
| `crg.stage-exit.formal-specification` | qa-lead | crg, policy-gated, stage-exit, formal-specification | Stage 3 exit | **NEVER** |
| `crg.stage-exit.implementation` | qa-lead | crg, policy-gated, stage-exit, implementation | Stage 4 exit | **NEVER** |
| `crg.stage-exit.verification` | qa-lead | crg, policy-gated, stage-exit, verification | Stage 5 exit | **NEVER** |
| `crg.production-deploy` | compliance-officer | crg, policy-gated, deploy, hipaa | After the final full traceability matrix, before `deploymentTask` | **NEVER** |

Combinator-internal escalations (adversarial-gate owner escalation, bounded
fix-loop exhaustion in Stages 3/5) carry their own per-stage-unique ids, e.g.
`crg.<stage>.traceability.gate-escalation`,
`crg.stage-3.design-escalation.<component>`,
`crg.stage-5.unit-escalation.<component>`.

## Stage-exit contract (`regulatedStageExit`)

1. **Executed traceability check** — `traceabilityMatrixTask` computes the
   stage's requirement->artifact->test matrix; `crg.trace-diff` diffs it
   against the previous stage's stored matrix and the SRS requirement set,
   writing `artifacts/crg/<stage>/trace-diff.json` with
   `{coveredCount, uncovered, orphanedTests, regressions}` — a computed diff,
   not prose.
2. **Adversarial gate** — `adversarialGate` (`gateId: crg.<stage>.traceability`)
   over the executed diff with `traceability-critic` + `phi-provenance-critic`,
   IRON LAW ("re-run the trace computation yourself or cite trace-diff.json
   line-by-line"), the built-in gate fixer, `maxFixAttempts` budget, and owner
   escalation. A failed gate blocks the stage.
3. **qa-lead sign-off** — `routedBreakpoint` with the per-stage-unique
   `crg.stage-exit.<stage>` id. Payload schema:

   ```json
   {
     "question": "...",
     "stage": "<stage>",
     "traceDiff": { "coveredCount": 0, "uncovered": [], "orphanedTests": [], "regressions": [] },
     "gateResult": { "passed": true, "attempts": 1, "escalated": false, "evidence": [] },
     "artifacts": ["artifacts/crg/<stage>/trace-diff.json"]
   }
   ```

   The payload is built from the executed gate result, so sign-off without
   traceability evidence is structurally impossible.
4. **Rejected sign-off throws** — stage boundaries are sequential; there is no
   skip-ahead path.

## PHI provenance model

- `requirePhiApproval(ctx, purpose, datasets, { requestingStage, phiApprovals })`
  raises `crg.phi-data-access-approval` **before** any task receives
  PHI-derived data in its context.
- Approvals are **per-dataset, never generalized**: only datasets with no
  recorded approval are raised; each approval records
  `{breakpointEventId, breakpointId, purpose, requestingStage, datasets, approvedAt, respondedBy}`.
- The provenance log is threaded into every downstream PHI task context
  (Cleanroom specs, `crg.implement-component`, the phi-provenance-critic).
- Rejection **throws**. The process invents no de-identified fallback path.

## Inputs

| Input | Type | Default |
| --- | --- | --- |
| `projectRequirements` | `string` | **REQUIRED** — empty throws |
| `phiComponents` | `string[]` | `[]` (hint only; `crg.phi-classification` is authoritative) |
| `boundedContextsHint` | `string[]` | `[]` |
| `complianceStandards` | `string[]` | `['HIPAA Security Rule', 'HIPAA Privacy Rule']` |
| `kipDir` | `string` | `.a5c/kip` |
| `kipModel` | `string` | `sonnet` |
| `maxFixAttempts` | `number` | `2` |

## Outputs

`{ success, srs, domainModel, formalSpecs, implementation, verification, traceabilityMatrices, stageSignoffs, deployment, metadata }`

- `deployment` is `null` and `success` is `false` whenever the
  `crg.production-deploy` breakpoint is rejected — there is no fallback deploy
  path.
- `verification` is keyed by level: `unit` / `integration` / `system` /
  `acceptance`.
- `metadata.phiApprovals` is the full PHI approval provenance log.

## Usage

```bash
babysitter run:create \
  --process library/methodologies/composition-regulated-greenfield/composition-regulated-greenfield.js \
  --input '{"projectRequirements": "Build a patient portal for a hospital system: appointment scheduling, medical-records access, secure messaging, billing. HIPAA Privacy + Security Rules apply.", "phiComponents": ["medical-records", "secure-messaging"]}'
```

## Design notes

- **No fallbacks**: missing `projectRequirements` throws; rejected sign-offs
  and PHI denials throw; a rejected deploy returns `success:false` with
  `deployment:null`; gate escalation is the combinator's owner breakpoint,
  never a silent pass.
- **Parallelism boundaries**: `ctx.parallel.all` only *within* a stage
  (per-context tactical DDD, per-component Cleanroom spec/verify,
  per-component implementation, per-component/per-suite Stage-5 level runs);
  stage boundaries are strictly sequential — no speculative cross-stage
  scheduling.
- **Escalation semantics**: bounded fix loops (`fixDesignTask`,
  `fixImplementationTask`, `crg.fix-verification`) run at most
  `maxFixAttempts` times, then escalate to an owner `routedBreakpoint`;
  owner rejection throws.
- **kip touchpoints**: `kipRecall` at stage 0 (kind
  `methodology-composition`), `kipAssert` after stage 6 with composition,
  interface, pattern, and run-outcome facts.
- **Task-registry collision**: `waterfall.js` and `v-model.js` both register
  the task id `implementation` at module-evaluation time (known library-wide
  shared-id issue). This composition uses neither module's `implementation`
  task (it has `crg.implement-component`), so it imports the two modules
  sequentially via top-level `await import(...)` and clears the inert
  colliding definition between them.
