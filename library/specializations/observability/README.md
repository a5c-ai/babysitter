# Observability specialization

The observability specialization is an **SLO-driven reliability practice**. Its flagship,
`slo-lifecycle.js`, runs the end-to-end loop — SLO design -> telemetry-pipeline delivery ->
alert tuning -> error-budget review cadence — with every production-affecting step closed by
an adversarial *executed-evidence* gate and a policy-gated routed breakpoint. Incident
handling (detection -> mitigation -> postmortem) is **not** owned here: it lives in the
[incident-management specialization](../incident-management/incident-lifecycle.js). The
`sre/` subdirectory holds the cloud-specific SRE point tasks that predate the flagship.

## Module index

| Module | Role | Purpose |
| --- | --- | --- |
| `slo-lifecycle.js` | **Flagship process** | End-to-end SLO practice: recall -> inventory -> SLI selection -> error-budget policy -> telemetry pipeline -> alert tuning -> review cadence -> assert. Three adversarial gates, three policy gates. |
| `incident-lifecycle.js` | **DEPRECATED pointer** | Header-only `@deprecated` re-export of [`../incident-management/incident-lifecycle.js`](../incident-management/incident-lifecycle.js). The incident-management flagship `@absorbs` this module's seed features. |
| `sre/sre-base.js` | Point task | Cloud-neutral SRE persona: SLO/SLI/error-budget discipline, runbook dispatch, incident-response rigor; emits an incident-escalation breakpoint. Specialized by the three cloud modules below. |
| `sre/sre-aws.js` | Point task | AWS-specialized SRE persona (CloudWatch, CloudTrail, Auto Scaling, multi-AZ, Route 53 failover, CloudFormation/Terraform IaC). |
| `sre/sre-azure.js` | Point task | Azure-specialized SRE persona (Azure Monitor, App Insights, Log Analytics, availability zones, Traffic Manager, Site Recovery, ARM/Bicep, AKS scaffolding). |
| `sre/sre-gcp.js` | Point task | GCP-specialized SRE persona (Cloud Monitoring, Cloud Logging, multi-region + load balancing, Backup for GKE, Deployment Manager/Terraform IaC). |

## `slo-lifecycle.js` — phase walkthrough

Data flow:

```
service-inventory
  -> (parallel sli-selection per service) -> error-budget-policy
  -> slo-design gate -> slo-change-approval
  -> instrumentation-plan -> pipeline-config -> telemetry gate -> telemetry-pipeline-deploy
  -> staged pipeline rollout (deploy-executor + stage-verification per stage, sequential)
  -> alert-noise-audit -> (parallel alert-family-tuning per family) -> alert-tuning gate
  -> alert-policy-change -> staged alert rollout (shadow canary -> paging-enabled full)
  -> error-budget-review-cadence -> kip assert
```

- **P0 — kip recall.** `kipRecall` (kind `observability`) threads prior SLO targets,
  known-good burn-rate thresholds, and past tuning outcomes into every drafting prompt as
  `priorKnowledge`. An empty/missing store is initialized and reported `factCount 0` — a
  fresh brain is not an error.
- **P1 — SLO design.** `slo.service-inventory` builds the service list (declared or repo
  discovery); `ctx.parallel.map` fans `slo.sli-selection` out per service;
  `slo.error-budget-policy` composes the cross-service budget math, burn thresholds, and
  freeze rules. Closed by the `slo.gate.slo-design` adversarial gate, then the
  **slo-change-approval** policy gate. The SLO pack is only marked `adopted` when
  `approved === true`; rejection returns a failed result — there is no unapproved-adoption path.
- **P2 — instrumentation + telemetry pipeline delivery.** `slo.instrumentation-plan` maps
  each approved SLI to concrete emit points; `slo.pipeline-config` generates the
  collector/pipeline configs and reports the exact `validationCommand`. Closed by the
  `slo.gate.telemetry-pipeline` gate (critics **execute** the dry-run/validate), then the
  **telemetry-pipeline-deploy** policy gate. `slo.pipeline-deploy-executor` runs **only**
  under `approved === true`, followed by sequential staged rollout with per-stage
  `slo.stage-verification`.
- **P3 — alert tuning.** `slo.alert-noise-audit` classifies existing alerts into families;
  `ctx.parallel.map` fans `slo.alert-family-tuning` out per family onto multi-window
  multi-burn-rate alerting derived from the approved error-budget policy. Closed by the
  `slo.gate.alert-tuning` gate (critics **execute** rule lint + burn-rate simulation), then
  the **alert-policy-change** policy gate. `slo.alert-rollout-executor` runs **only** under
  `approved === true`, staged shadow -> paging.
- **P4 — error-budget review cadence.** `slo.error-budget-review-cadence` composes the
  recurring budget-burn report template and review cadence (weekly while any service burned
  >25% of budget last window, else monthly). Documentation, not a production change — **no
  breakpoint** (sparse-breakpoint rule).
- **P5 — kip assert.** Learned facts written back under kind `observability`: per-service
  adopted SLO targets, per-family tuned burn-rate thresholds, and a run-outcome fact.

### Inputs / outputs (summary)

Inputs: `services?` / `discover?`, **`telemetryStack` (required — absent throws)**,
`alertSources?`, `sloHorizon?` (default `{ windowDays: 28 }`), `maxFixAttempts?` (2),
`kipEnabled?` (true), `kipDir?` (`.a5c/kip`), `kipModel?` (`sonnet`), `artifactsDir?`.

Outputs: `{ success, sloPack, sloDesignGate, telemetry, alerting, reviewCadence,
autoApprovals (always present), kipFactsAsserted, artifacts, metadata }`.

### Example invocation

```js
import { process as sloLifecycle } from './slo-lifecycle.js';

const result = await sloLifecycle({
  services: [{ name: 'checkout', tier: 'critical', userJourneys: ['place-order'] }],
  telemetryStack: {
    metricsBackend: 'prometheus',
    tracingBackend: 'tempo',
    collector: 'otelcol',
    alertRuleFormat: 'prometheus',
  },
  alertSources: [{ system: 'alertmanager', ref: 'prod' }],
  sloHorizon: { windowDays: 28 },
}, ctx);
```

## Policy-gated actions

| actionId | expert | phase | never auto-approves |
| --- | --- | --- | --- |
| `slo-change-approval` | `service-owner` | P1 | Yes — SLO adoption is a production-policy change; any harness auto-approval is surfaced in `autoApprovals`. |
| `telemetry-pipeline-deploy` | `platform-engineering-lead` | P2 | Yes — production pipeline deploys never auto-approve. |
| `alert-policy-change` | `sre-lead` | P3 | Yes — production alerting changes never auto-approve. |

Each is a `routedBreakpoint` with `breakpointId` equal to the `actionId`, an accountable-role
expert, and a `policy-gated` tag — ready for the `adapters/policy` YAML gating layer to
enforce readiness. The frozen `POLICY_GATE_ROUTING` table + throwing `gateExpert(actionId)`
lookup guarantees no fallback expert is ever substituted.

## Adversarial gates

| gateId | critics | executed-evidence requirement |
| --- | --- | --- |
| `slo.gate.slo-design` | `slo-math-critic`, `slo-coverage-critic` | Recompute the error budget from each target+window; run the measurement-query validator; every archetype must be in `SLI_CATALOG`. |
| `slo.gate.telemetry-pipeline` | `pipeline-dryrun-critic`, `instrumentation-fidelity-critic` | **Execute** the reported `validationCommand` (collector validate / dry-run) against every config path and quote outputs. |
| `slo.gate.alert-tuning` | `alert-rule-executor-critic`, `noise-regression-critic` | **Execute** the rule linter (promtool/vendor) over `rulePaths` **and** run the burn-rate simulation from `simulationSpec`. |

Every gate enforces `evidence` `minItems: 1`; a `passed: true` verdict with empty evidence is
coerced to a protocol failure by the combinator. Each gate escalates internally via its own
`<gateId>.gate-escalation` routed breakpoint when the fix budget is exhausted.

## Staged rollout semantics

Both rollouts share the frozen `TELEMETRY_ROLLOUT_STAGES = ['canary', 'full']` table with the
throwing `stagePolicy(stage)` lookup:

- **Telemetry:** `canary` (10% scope, 30m bake) -> `full` (100% scope, 60m bake).
- **Alerts:** `canary` = shadow-mode / paging-disabled -> `full` = paging-enabled.

Stages are promoted **sequentially**. A failed `slo.stage-verification` (probes actually
executed, `evidence` `minItems: 1`) **halts promotion** and returns a failed result with the
stage recorded — there is no silent continue.

## kip memory

Kind `observability`. **Recalled** at P0: prior SLO targets, known-good burn-rate thresholds,
past tuning outcomes. **Asserted** at P5: per-service `has-slo` facts, per-family `tuned-alert`
facts, and a `run-outcome` fact (gates, attempts, auto-approvals). Future runs recall these to
seed drafting and skip re-deriving known-good thresholds.

## Deprecation notice

`incident-lifecycle.js` in this directory is a **header-only `@deprecated` pointer** that
re-exports the incident-management flagship. The old 230-line implementation duplicated the
incident lifecycle; the incident-management flagship `@absorbs` every seed feature
(single-workflow lifecycle, severity matrix, non-incident early exit, timeline accumulation,
comms phase model, 3-pass diagnosis, SLO breach detection, follow-up issues). Existing callers
keep working against the flagship contract (same signal shape, superset of options). The
reduction was approved through the `incident-lifecycle-deprecation` policy gate
(expert `library-maintainer`) at generation time. The re-export has no `try`/`catch` or
conditional import — if the flagship moves, the import breaks loudly.

## Hard rules recap

- **Style-A agent tasks only** — zero `kind: 'shell'` subtasks.
- **No fallbacks** — throwing lookups (`gateExpert`, `stagePolicy`), `telemetryStack` required,
  SLI archetypes outside `SLI_CATALOG` are gate issues.
- **Evidence `minItems: 1`** on every evidence-carrying and verification schema.
- **Guarded executors** — deploy/rollout executors exist only inside `approved === true`
  branches; a rejected gate returns a failed result, never a degraded alternate path.
- **Orchestrator-owned timeline** — agents never write the timeline; combinators are imported
  from `../common-utilities/`, never re-implemented.
