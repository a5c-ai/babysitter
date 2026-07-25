# MLOps

Flagship model-lifecycle for the library: dataset governance intake (parallel per-dataset lineage/consent/retention checks) -> eval-harness design -> executed training/eval runs -> an adversarial eval-review gate that RE-RUNS a sampled eval and diffs metrics -> a policy-gated model promotion with an executed serving smoke -> drift-monitoring setup with an executed drift-detection stub -> an adversarial drift-review gate -> a drift path with severity-routed escalation and a policy-gated rollback/retirement -> kip-backed model-registry memory. This is a brand-new specialization directory (verified: no prior `mlops` dir anywhere in `library/`).

## Composition map — callable upstream training stages (NOT superseded)

`model-lifecycle.js` consumes a **trained candidate** (`modelVersion` + `artifactRef`) and owns the governance / eval / promotion / drift / retirement lifecycle **around** it. Training itself is a pre-bar point task that can be delegated to either data-science-ml near-miss:

| Upstream stage | Role |
|---|---|
| [`data-science-ml/model-training-pipeline.js`](../data-science-ml/model-training-pipeline.js) | Hyperparameter tuning + experiment tracking producing the candidate model artifact that model-lifecycle P3 evaluates and promotes |
| [`data-science-ml/automl-pipeline.js`](../data-science-ml/automl-pipeline.js) | Alternate: automated algorithm selection / ensembling producing a candidate; feeds the same P3 eval-harness inlet |

These are mapped as callable upstream stages — **NOT superseded, NOT re-implemented**, nothing deprecated. `mlo.training-run` (P3, optional, gated on `retrain`) is the delegation seam.

## Module table — `model-lifecycle.js` exports

| Export | Kind | Purpose |
|---|---|---|
| `process(inputs, ctx)` | orchestrator | The flagship lifecycle, phases P0–P8 |
| `MODEL_STAGES` | frozen const | `['development','staging','production']` — ordered lifecycle stages |
| `STAGE_PROMOTION_POLICY` | frozen const | Per-target-stage entry gate + accountable expert (lookup via `stagePromotionPolicy`) |
| `DATASET_GOVERNANCE_CHECKS` | frozen const | `['lineage','consent','retention']` — the three per-dataset checks (dsar-lifecycle shape) |
| `DRIFT_SEVERITIES` | frozen const | `['SEV1','SEV2','SEV3','SEV4']` — mirrored from release-lifecycle severity routing |
| `DRIFT_ROUTING` | frozen const | Drift escalation routing per severity (lookup via `driftRouting`) |
| `stagePromotionPolicy(stage)` | helper | Promotion-policy lookup — **throws** on unknown stage (no fallback policy) |
| `driftRouting(severity, request?)` | helper | Routing lookup — **throws** on unknown severity and on `escalationExpert` requests for immediate-rollback severities (no fallback route) |
| `assertDriftSeverity(value, source)` | helper | Accepts SEV1..SEV4 or `'none'`; anything else **throws** naming the source |
| `governanceCheckLabel(check)` | helper | Validates a check name against `DATASET_GOVERNANCE_CHECKS`; **throws** on unknown check |
| `datasetGovernanceCheckTask` | agent task | `mlo.dataset-governance-check` — runs lineage/consent/retention for one dataset (fanned out per dataset) |
| `retentionExecutionTask` | agent task | `mlo.retention-execution` — executes the approved retention action; only inside `dataset-retention-action` approved |
| `evalHarnessDesignTask` | agent task | `mlo.eval-harness-design` — authors the benchmark harness + regression-threshold table |
| `trainingRunTask` | agent task | `mlo.training-run` — optionally (re)trains the candidate; delegable to the data-science-ml near-misses |
| `evalRunTask` | agent task | `mlo.eval-run` — actually runs one benchmark suite; one instance per evalSuite via `ctx.parallel` |
| `promotionDeployTask` | agent task | `mlo.promotion-deploy` — promotes exactly the evaluated version; only inside `model-promotion-approval` approved |
| `promotionVerificationTask` | agent task | `mlo.promotion-verification` — executes a serving smoke proving the promoted version serves |
| `driftMonitorSetupTask` | agent task | `mlo.drift-monitor-setup` — configures detectors + hooks, captures baseline, runs the drift-detection stub |
| `driftTriageTask` | agent task | `mlo.drift-triage` — SEV1..SEV4 classification grounded in the executed drift metrics |
| `rollbackExecutionTask` | agent task | `mlo.rollback-execution` — restores `currentProductionRef` / retires the superseded version; only inside `model-rollback-approval` approved |
| `rollbackVerificationTask` | agent task | `mlo.rollback-verification` — executed probes proving the restored version serves and the drift symptom is gone |

## Style note

All tasks are Style-A `kind: 'agent'` (zero `kind: 'shell'`), with per-effect `io` paths (`tasks/<effectId>/input.json|result.json`) and `labels`, and every gate / verification / executed-run output schema declares `evidence { type: 'array', minItems: 1 }`. Gate combinators (`routedBreakpoint`, `adversarialGate`, `kipRecall`, `kipAssert`) are imported from [`../common-utilities/routed-gate-combinators.js`](../common-utilities/routed-gate-combinators.js), not redefined. Timeline, `breakpointsHit`, and `autoApprovals` are accumulated in the orchestrator only — agents never write the timeline.

## Stage model

### Lifecycle stages (`MODEL_STAGES`, verbatim)

`['development', 'staging', 'production']` — promotion advances one stage toward production; `promotionTargetStage` must be a member beyond `development` (default `production`). An unknown value throws (no fallback stage).

### Promotion table (`STAGE_PROMOTION_POLICY`, verbatim)

| Target stage | Entry gate | Expert |
|---|---|---|
| `staging` | `model-promotion-approval` | ml-engineering-lead |
| `production` | `model-promotion-approval` | ml-engineering-lead |

Lookups go through `stagePromotionPolicy(stage)`, which **throws** on an unknown stage — there is no fallback promotion policy.

### Drift routing table (`DRIFT_ROUTING`, verbatim)

| Severity | Escalation path | Escalation expert |
|---|---|---|
| SEV1 | `immediate-rollback` | — (straight to the `model-rollback-approval` gate; expert lookup throws) |
| SEV2 | `immediate-rollback` | — (straight to the `model-rollback-approval` gate; expert lookup throws) |
| SEV3 | `remediation-choice` | ml-engineering-lead |
| SEV4 | `remediation-choice` | ml-engineering-lead |

All lookups (`stagePromotionPolicy`, `driftRouting`, `assertDriftSeverity`, `governanceCheckLabel`) **throw** naming the source on any unknown enum — there are no fallback rows anywhere.

## Policy-gated actions

Three actions are policy-gated. Convention: **`breakpointId` = actionId**, strategy `single`.

| actionId | Expert | Tags | Raised when | Rejection behavior |
|---|---|---|---|---|
| `dataset-retention-action` | data-governance-officer | `['policy-gated','mlops','dataset-governance']` | P1, only when a dataset governance check flags a deletion/retention-enforcement action; payload carries the dataset, proposedAction, check details, and priorKnowledge governance facts | `retentionExecutionTask` never invoked; the action is recorded not-executed; if the un-actioned dataset is a required training/eval set the lifecycle **fails closed before eval** |
| `model-promotion-approval` | ml-engineering-lead | `['policy-gated','mlops','promotion']` | P5, only after a passed `mlo.eval-review` gate; payload carries eval metrics, per-threshold pass/fail, eval-review evidence, governance clearance, target stage | Run ends `success:false`, nothing promoted; `promotionDeployTask` never invoked (no alternate path) |
| `model-rollback-approval` | ml-engineering-lead | `['policy-gated','mlops','<sev>' | 'retirement']` | P7 drift path (SEV1/SEV2 immediately; SEV3/SEV4 after the remediation-choice picks rollback), and for retirement of a superseded production version | Run ends `success:false`, model left at current version, state surfaced; `rollbackExecutionTask` never invoked |

**Fail-closed posture:** there is no alternate execution path around a gate — the retention, promotion, and rollback executors are invoked **only** inside `gate.approved === true` branches, each with an explicit code comment that no other call site exists. **No gate in this process sets `autoApproveAfterN`**, and all three policy gates carry explicit code comments stating it must never be added. Any harness-level auto-approval is surfaced in `outputs.autoApprovals` (`{ breakpointId, phase, at }`), which is **always present** in outputs, possibly empty.

## Quality gates

### `mlo.eval-review` (P4) — RE-RUNS a sampled eval, diffs metrics

Runs over the eval report (per-suite metrics + deterministic threshold pass/fail), with the harness and evalSuites reachable in context. Failure (including an owner-rejected escalation) ends the run **before** `model-promotion-approval` is ever raised (fail closed).

| Critic | Focus |
|---|---|
| `sampled-eval-reexecution-critic` | RE-RUNS a sampled subset of an evalSuite itself and DIFFS the fresh metrics against the reported metrics — raw re-execution outputs cited per sampled metric; a citation of the reported number without a fresh run is NOT evidence |
| `regression-threshold-critic` | Recomputes every metric against `regressionThresholds` (min/max/baseline/maxRegression) and flags any breach the run under-reported — the recomputation is cited |
| `eval-integrity-critic` | The eval datasets are the governed holdout with no train/eval leakage — cross-checked against the P1 lineage clearance; datasets checked are cited |

### `mlo.drift-review` (P6) — RE-RUNS the drift-detection stub, fires the hooks

Runs over the drift-monitor spec + executed drift-detection run. A live breach in the executed run routes into the P7 drift path.

| Critic | Focus |
|---|---|
| `drift-detection-reexecution-critic` | RE-RUNS the drift-detection stub itself over baselineWindow vs checkWindow and DIFFS its drift scores against the reported ones — raw executed outputs cited; a read of the reported drift score is not evidence |
| `alerting-hook-critic` | Proves each configured alerting hook ACTUALLY FIRES on a synthetic drift breach (executed) — the fired-alert output cited per hook |

**IRON-LAW (executed evidence only):** the eval-review gate must re-run a sampled eval and diff; the drift-review gate must re-run the drift-detection stub and fire the hooks — reading a report or spec is not evidence, and `passed:true` with empty evidence is rejected by the combinator. Fix budget: `maxFixAttempts` (default 2) rounds of the built-in `gateFixerTask`; on exhaustion the combinator escalates to the owner via a routed breakpoint (`mlo.eval-review.gate-escalation` / `mlo.drift-review.gate-escalation`). A model **never promotes on a read-only review**.

## Drift path

Entered only when the executed drift-detection run surfaces a live breach. `driftTriageTask` classifies SEV1..SEV4 grounded in the executed drift metrics (recommendation only). Then `DRIFT_ROUTING`:

- **SEV1 / SEV2** -> straight to the `model-rollback-approval` gate.
- **SEV3 / SEV4** -> one non-policy `mlo.drift.remediation-choice` breakpoint first (accept-drift/roll-forward vs rollback, expert ml-engineering-lead) — the **only non-policy breakpoint** in this process (sparse-breakpoint rule: the call is genuinely ambiguous at low severity). A `roll-forward` response ends the run `success:false` (drift accepted, no rollback gate raised); any other response proceeds to the gate.

On `model-rollback-approval` approved, `rollbackExecutionTask` restores exactly `currentProductionRef` and `rollbackVerificationTask` executes serving probes proving the restored version serves and the drift symptom is gone (bounded by `driftPolicy.maxRollbackAttempts`, default 1). **Retirement** of a superseded prior production version is the same gate surface (`model-rollback-approval`, tagged `retirement`): a clean promotion to `production` that supersedes a non-null `currentProductionRef` requests retirement of the old version through this gate.

## kip model-registry memory

- **Recall (P0)**: `kipRecall(ctx, { kipDir, topic: 'model registry: <modelName>@<modelVersion>', kipModel, kind: 'mlops-model-registry' })` — prior model performance, promotion decisions, and drift incidents threaded as `priorKnowledge` into every downstream agent. An empty store is initialized and reported as `factCount: 0`, never an error.
- **Assert at close (P8)**, facts built deterministically in the orchestrator (never in an agent), subject `model:<modelName>@<modelVersion>`:
  - `{ predicate: 'has-version', object: <modelVersion> }`
  - `{ predicate: 'outcome', object: 'promoted'|'failed'|'rolled-back', props: { evalReviewPassed, promoted, driftDetected } }`
  - one per eval suite: `{ predicate: 'eval-metric', object: <suite>, props: { thresholdsPassed } }`
  - `{ predicate: 'promotion-decision', object: 'promoted-to-<stage>'|'not-promoted', props: { approved, verified } }`
  - only when the drift path ran: `{ predicate: 'drift-incident', object: <triage.summary>, props: { severity, rollbackVerified } }` and `{ predicate: 'rollback-lesson', object: '<severity>: <rationale>' }`

Both touchpoints are wrapped in `if (kipEnabled)` (default `true`). The assert facts are unconditionally non-empty when reached — the has-version and outcome facts always exist.

## Inputs / outputs reference

Mirrors the JSDoc `@inputs` / `@outputs` in `model-lifecycle.js`. Required: `model { modelName, modelVersion, artifactRef }`, a non-empty `datasets[]` (each `{ name, uri, purpose }`, purpose `train`|`eval`|`holdout`), a non-empty `evalSuites[]` (each `{ name, dataset, metrics[] }`), and a `regressionThresholds` object mapping every referenced metric to a threshold (a referenced metric with no threshold **throws** before any run). Optional: `promotionTargetStage` (default `production`), `retrain` (default `false`), `driftPolicy { maxRollbackAttempts, baselineWindow, checkWindow }`, `maxFixAttempts` (default 2), `kipEnabled`/`kipDir`/`kipModel`, `artifactsDir`.

## Usage

```bash
babysitter run:create \
  --process-file library/specializations/mlops/model-lifecycle.js \
  --inputs '{
    "model": {
      "modelName": "fraud-scorer",
      "modelVersion": "2.4.0",
      "artifactRef": "s3://models/fraud-scorer/2.4.0/model.pt",
      "currentProductionRef": "s3://models/fraud-scorer/2.3.1/model.pt"
    },
    "datasets": [
      { "name": "txn-train", "uri": "s3://data/txn/train", "purpose": "train", "lineageRef": "dvc://txn@train" },
      { "name": "txn-holdout", "uri": "s3://data/txn/holdout", "purpose": "holdout", "consentBasis": "contract" }
    ],
    "evalSuites": [
      { "name": "accuracy-suite", "dataset": "txn-holdout", "metrics": ["auc", "precision"] }
    ],
    "regressionThresholds": {
      "auc": { "min": 0.9, "baseline": 0.94, "maxRegression": 0.01 },
      "precision": { "min": 0.85 }
    },
    "promotionTargetStage": "production"
  }'
```

For this run: the two datasets clear lineage/consent/retention in parallel (a flagged retention action would gate `dataset-retention-action` with the data-governance-officer), the eval harness is authored and every metric is checked for a threshold, `accuracy-suite` runs against the candidate and is scored deterministically, the `mlo.eval-review` gate re-runs a sampled eval and diffs it, `model-promotion-approval` (ml-engineering-lead) gates promotion to `production`, an executed serving smoke verifies it, `mlo.drift-review` re-runs the drift-detection stub, and — because a prior `currentProductionRef` exists — retirement of `2.3.1` is requested through the `model-rollback-approval` gate tagged `retirement`.

## Non-interactive runs

Nothing policy-gated auto-approves **by design** — no gate in this process sets `autoApproveAfterN`, and the three policy gates must never gain it. If a non-interactive harness auto-approves a breakpoint at its own level, that approval is recorded in `outputs.autoApprovals` as `{ breakpointId, phase, at }` with its phase provenance, so the fail-closed posture stays auditable. `autoApprovals` is always present in outputs, even when empty.
