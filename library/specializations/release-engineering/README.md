# Release Engineering

Flagship release lifecycle for the library: release cut and versioning -> parallel changelog + pre-flight verification -> an adversarial release-readiness gate that EXECUTES the built artifact -> a policy-gated production deploy -> staged rollout (canary -> partial -> full) with stage-promotion approvals and per-stage verification -> an adversarial post-release gate -> a regression path with severity-routed escalation and a policy-gated rollback -> kip-backed release memory. This is a brand-new specialization directory.

It **complements** [`devops-sre-platform/post-deploy-visual-check.js`](../devops-sre-platform/post-deploy-visual-check.js): that module does a visual spot-check after a deploy has happened; this process owns the release lifecycle itself (cut -> rollout -> rollback). This is explicitly **not** a supersession — nothing is deprecated by this specialization.

## Module table — `release-lifecycle.js` exports

| Export | Kind | Purpose |
|---|---|---|
| `process(inputs, ctx)` | orchestrator | The flagship lifecycle, phases P0–P7 |
| `ROLLOUT_STAGES` | frozen const | `['canary','partial','full']` — ordered rollout stages |
| `ROLLOUT_STAGE_POLICY` | frozen const | Per-stage traffic/bake/entry-gate policy (lookup via `stagePolicy`) |
| `REGRESSION_SEVERITIES` | frozen const | `['SEV1','SEV2','SEV3','SEV4']` — model borrowed from incident-management severity routing |
| `REGRESSION_ROUTING` | frozen const | Regression escalation routing per severity (lookup via `regressionRouting`) |
| `stagePolicy(stage)` | helper | Stage-policy lookup — **throws** on unknown stage (no fallback policy) |
| `regressionRouting(severity, request?)` | helper | Routing lookup — **throws** on unknown severity and on escalationExpert requests for immediate-rollback severities (no fallback route) |
| `assertRegressionSeverity(value, source)` | helper | Accepts SEV1..SEV4 or `'none'`; anything else **throws** naming the source |
| `releaseCutTask` | agent task | `rel.release-cut` — semver bump from commit history, releaseId, cut plan |
| `changelogTask` | agent task | `rel.changelog` — changelog markdown; every entry maps to a real commit ref |
| `preflightVerificationTask` | agent task | `rel.preflight-verification` — actually builds the artifact and runs the tests |
| `deployStageTask` | agent task | `rel.deploy-stage` — only after its entry gate approves; deploys exactly the approved artifact |
| `stageVerificationTask` | agent task | `rel.stage-verification` — executes every smoke probe across the bake window; writes the post-release report for the full stage |
| `regressionTriageTask` | agent task | `rel.regression-triage` — SEV1..SEV4 classification, rollback/roll-forward recommendation |
| `executeRollbackTask` | agent task | `rel.execute-rollback` — only after the production-rollback gate approves |
| `rollbackVerificationTask` | agent task | `rel.rollback-verification` — executed probes proving the restored version serves traffic |

All tasks are Style-A `kind: 'agent'` (zero `kind: 'shell'`), with per-effect `io` paths and `labels`, and every gate/verification output schema declares `evidence { type: 'array', minItems: 1 }`. Gate combinators (`routedBreakpoint`, `adversarialGate`, `kipRecall`, `kipAssert`) are imported from [`../common-utilities/routed-gate-combinators.js`](../common-utilities/routed-gate-combinators.js), not redefined.

## Stage model

### Rollout table (`ROLLOUT_STAGE_POLICY`, verbatim)

| Stage | Traffic % | Bake | Entry gate | Expert |
|---|---|---|---|---|
| `canary` | 5% | 30m | `production-deploy` | release-manager |
| `partial` | 50% | 60m | `stage-promotion` | sre-lead |
| `full` | 100% | 60m | `stage-promotion` | sre-lead |

Lookups go through `stagePolicy(stage)`, which **throws** on an unknown stage — there is no fallback stage plan. `stagesOverride` must be a strict prefix-ordered subset of `ROLLOUT_STAGES` (e.g. `['canary']` or `['canary','partial']`); an unknown stage name throws.

## Policy-gated actions

Three actions are policy-gated. Convention: **`breakpointId` = actionId**, strategy `single`.

| actionId | Expert | Tags | Raised when | Rejection behavior |
|---|---|---|---|---|
| `production-deploy` | release-manager | `['policy-gated','release-engineering']` | Once, before the FIRST production stage (canary) deploy; payload carries version, releaseId, cut plan, readiness-gate evidence, and the canary policy (5%, 30m bake) | Run ends `success:false` with reason `production-deploy gate rejected — nothing deployed`; `deployStageTask` is never invoked (no alternate path) |
| `stage-promotion` | sre-lead | `['policy-gated','release-engineering','<stage>']` (stage tag interpolated: `partial`\|`full`) | Before canary->partial and before partial->full; payload carries prior-stage verification probes + evidence, next-stage traffic/bake, regression signals (empty on healthy) | Rollout halts at the current stage, `success:false` with reason; the release is **not** auto-rolled-back (rollback has its own gate) — recorded in `outputs.stages` |
| `production-rollback` | release-manager | `['policy-gated','release-engineering','<sev>']` (severity tag interpolated sev1..sev4) | In the regression path after triage (SEV1/SEV2 immediately; SEV3/SEV4 only after the remediation-choice breakpoint picked rollback); payload carries triage severity/summary/recommendation, failing probes, restore target ref | Run ends `success:false` with reason `production-rollback gate rejected — release left at current stage, state surfaced`; `executeRollbackTask` is never invoked |

**Fail-closed posture:** there is no alternate execution path around a gate — the deploy and rollback executors are invoked only inside `gate.approved === true` branches. **No gate in this process sets `autoApproveAfterN`**, and the `production-deploy` and `production-rollback` gates carry explicit code comments stating it must never be added. Any harness-level auto-approval of a gate is surfaced in `outputs.autoApprovals` (`{ breakpointId, phase, at }`), which is **always present** in outputs, possibly empty.

## Regression path

Entered only when a stage verification (or deploy) fails or the post-release gate fails. Severity matrix (incident-style): SEV1 user-facing outage/data risk; SEV2 significant ongoing degradation; SEV3 partial/limited; SEV4 internal-only.

### Routing table (`REGRESSION_ROUTING`, verbatim)

| Severity | Escalation path | Escalation expert |
|---|---|---|
| SEV1 | `immediate-rollback` | — (straight to the `production-rollback` gate; expert lookup throws) |
| SEV2 | `immediate-rollback` | — (straight to the `production-rollback` gate; expert lookup throws) |
| SEV3 | `remediation-choice` | sre-lead |
| SEV4 | `remediation-choice` | sre-lead |

For SEV3/SEV4 the process raises `rel.regression.remediation-choice` — the **only non-policy breakpoint** in this process (sparse-breakpoint rule: the roll-forward vs rollback call is genuinely ambiguous at these severities). A `roll-forward` response ends the run `success:false` with reason `roll-forward chosen — regression accepted at <stage>` and **no rollback gate is raised**; any other outcome proceeds to the `production-rollback` gate. All outcomes land in `outputs.regression`.

## Quality gates

### `rel.release-readiness`

Runs after the parallel changelog + pre-flight strands, over the pre-flight verification report (with the built artifact reachable via `artifactRef` in context). Failure (including an owner-rejected escalation) ends the run — the `production-deploy` gate is never raised (fail closed).

| Critic | Focus |
|---|---|
| `artifact-execution-critic` | EXECUTES the built artifact (start/run it via artifactRef) and runs every smokeProbe against it — raw execution outputs cited per probe; a build-log citation without a fresh execution in the review is not evidence |
| `changelog-accuracy-critic` | Diffs every changelog entry against the actual commit log since the last tag — the comparison is EXECUTED; each verified/missing/invented entry cited; breaking changes must be flagged |
| `version-policy-critic` | The semver bump matches the commit contents (breaking=>major, feature=>minor, fix=>patch), the tag/branch plan is consistent, and the version does not collide with an existing tag — commits and tag list cited |

### `rel.post-release`

Runs after full-stage verification passes, over the post-release report written by the full-stage `stageVerificationTask`. Failure routes into the regression path (triage -> severity-routed escalation -> gated rollback) instead of ending silently.

| Critic | Focus |
|---|---|
| `smoke-execution-critic` | Re-EXECUTES the smokeProbes against production and confirms the deployed version marker matches the release — raw outputs cited per probe |
| `regression-signal-critic` | Error/latency signals across the full-stage bake window show no regression vs the pre-release baseline; every report claim backed by a re-run/verified query |
| `changelog-consistency-critic` | What actually shipped (deployRefs, stages, version) matches the changelog and cut plan — report diffed against the orchestrator timeline in context; mismatches cited |

IRON-LAW rules (appended to every critic prompt): executed evidence only — the readiness gate must RUN the built artifact and smoke-verify it, the post-release gate must re-run the probes; a skim of a report is not evidence; `passed:true` with empty evidence is rejected by the combinator. Fix budget: `maxFixAttempts` (default 2) rounds of the built-in `gateFixerTask`; on exhaustion the combinator escalates to the owner via a routed breakpoint (`rel.release-readiness.gate-escalation` / `rel.post-release.gate-escalation`).

## kip release memory

- **Recall (P0)**: `kipRecall(ctx, { kipDir, topic: 'release signature: <serviceName>@<baseRef>', kipModel, kind: 'release-engineering' })` — prior release facts, rollback lessons, and gate outcomes threaded as `priorKnowledge` into release-cut, triage, and both adversarial gates' context. An empty store is initialized and reported as `factCount: 0`, never an error.
- **Assert at close (P7)**, fact shapes:
  - `{ subject: 'release:<releaseId>', predicate: 'has-version', object: <version> }`
  - `{ subject: 'release:<releaseId>', predicate: 'outcome', object: 'released'|'failed', props: { stagesCompleted, readinessGatePassed, postReleaseGatePassed } }`
  - one per completed stage: `{ subject: 'release:<releaseId>', predicate: 'reached-stage', object: <stage>, props: { trafficPercent } }`
  - only when rollback executed: `{ subject: 'release:<releaseId>', predicate: 'rollback-lesson', object: <triage.summary>, props: { severity, rollbackVerified } }`
  - only when the readiness gate surfaced issues: `{ subject: 'release:<releaseId>', predicate: 'readiness-lesson', object: <first issue description> }`

Both touchpoints are wrapped in `if (kipEnabled)` (default `true`). The assert facts are built deterministically in the orchestrator (never inside an agent) and are unconditionally non-empty when reached — the has-version and outcome facts always exist.

## Usage

```bash
babysitter run:create \
  --process-file library/specializations/release-engineering/release-lifecycle.js \
  --inputs '{
    "release": {
      "serviceName": "orders-api",
      "baseRef": "main",
      "versionHint": "minor"
    },
    "smokeProbes": [
      { "name": "health", "url": "https://orders.example.com/healthz", "expectation": "HTTP 200 with status:ok" },
      { "name": "create-order", "command": "node scripts/smoke/create-order.mjs", "expectation": "exit 0, order id returned" },
      { "name": "version-marker", "url": "https://orders.example.com/version", "expectation": "reports the released version" }
    ]
  }'
```

For this run: the release is cut from `main` with a minor bump, the changelog and pre-flight build/test run in parallel, the `rel.release-readiness` gate executes the built artifact and the three probes, `production-deploy` (release-manager) gates the canary at 5%, `stage-promotion` (sre-lead) gates canary->partial and partial->full, and after full-stage verification the `rel.post-release` gate re-runs the probes against production. A regression at any stage triages SEV1..SEV4; only SEV1/SEV2 (or an sre-lead choosing rollback at SEV3/SEV4) reach the `production-rollback` gate.

## Non-interactive runs

Nothing policy-gated auto-approves **by design** — no gate in this process sets `autoApproveAfterN`, and the `production-deploy` / `production-rollback` gates must never gain it. If a non-interactive harness auto-approves a breakpoint at its own level, that approval is recorded in `outputs.autoApprovals` as `{ breakpointId, phase, at }` with its phase provenance, so the fail-closed posture stays auditable. `autoApprovals` is always present in outputs, even when empty.
