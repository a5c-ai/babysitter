# Incident Management

Single owner for incident handling across the library. This specialization carries the flagship detection-to-postmortem lifecycle — severity classification, commander mobilization, parallel mitigation strands, severity-routed policy gates for every externally visible action, an adversarial postmortem-completeness gate, and kip-backed incident memory across runs.

## Consolidation statement

The library census flagged three scattered near-misses that each owned a slice of incident handling. This specialization consolidates them under one flagship process:

- **Supersedes** [`specializations/devops-sre-platform/incident-response.js`](../devops-sre-platform/incident-response.js) — **deprecated, do not extend.** Harvested: commander/roles mobilization, parallel log/metrics/trace investigation (folded into the diagnosis strand), blast-radius fields, MTTR/MTTD metrics, Style-A task shape.
- **Supersedes** [`specializations/domains/business/customer-experience/itil-incident-management.js`](../domains/business/customer-experience/itil-incident-management.js) — **deprecated, do not extend.** Harvested: categorization-informed severity rationale; the knowledge-base lookup is replaced by `kipRecall`, the post-incident-review loop by `adversarialGate`.
- **Absorbs** [`specializations/observability/incident-lifecycle.js`](../observability/incident-lifecycle.js) — structural seed: single-workflow lifecycle, severity matrix text, non-incident early exit, timeline accumulation, comms phase model with no-blame rules, iterative 3-pass diagnosis, SLO breach detection, follow-up issue creation.

The superseded files are **not deleted** by this consolidation — this README declares them deprecated pending a separate removal pass. New work goes here.

## Migration notes

| Old process | Old inputs | New inputs mapping | Behavioral deltas |
|---|---|---|---|
| `devops-sre-platform/incident-response` | `{ incidentType, severity, affectedServices, alertSource, description }` | `signal: { source: alertSource, ref, firstSeenAt, symptomSummary: description, impactedSurfaces: affectedServices }` + `severityOverride: severity` | Severity is classified by the process (the old hand-fed `severity` becomes `severityOverride`, which wins and is recorded in metadata). Production changes and all comms now sit behind severity-routed policy gates instead of running unguarded. |
| `business/customer-experience/itil-incident-management` | `{ incident, knowledgeBase }` | `incident` fields fold into `signal{...}`; `knowledgeBase` is replaced by the kip store (`kipEnabled`/`kipDir`/`kipModel`) | KB lookup becomes `kipRecall` at detection; the post-incident-review loop becomes the adversarial postmortem-completeness gate with executed evidence. |
| `observability/incident-lifecycle` | `{ signal, onCall, commsChannels, slo }` | Same shape — `onCall` becomes `oncall` (adds `commsLead`, `engineeringManager`); adds `severityOverride`, `customerFacing`, `postmortemRequired`, kip knobs | Comms no longer publish directly: every status-page/customer message rides a policy gate. Postmortem gains the adversarial completeness gate and gated publication. |

## Module table — `incident-lifecycle.js` exports

| Export | Kind | Purpose |
|---|---|---|
| `process(inputs, ctx)` | orchestrator | The flagship lifecycle, phases P0–P10 |
| `SEVERITY_ROUTING` | frozen const | Policy-gate expert routing per severity (lookup via `routingExpert`) |
| `COMMS_CADENCE` | frozen const | Comms cadence rules per severity |
| `REQUIRED_ROLES` | frozen const | Roles that must be staffed per severity |
| `INCIDENT_SEVERITIES` | frozen const | `['SEV1','SEV2','SEV3','SEV4']` |
| `routingExpert(actionId, severity)` | helper | Routing lookup — **throws** on unknown action, unknown severity, or never-raised actions (no fallback expert) |
| `commsPolicyFor(actionId, severity, customerFacing)` | helper | Cadence-table lookup — **throws** on unknown severity/action |
| `detectClassifyTask` | agent task | `iml.detect-classify` — severity classification |
| `commanderAssignmentTask` | agent task | `iml.commander-assignment` — roster mobilization |
| `diagnoseTask` | agent task | `iml.diagnose` — iterative root-cause passes |
| `blastRadiusTask` | agent task | `iml.blast-radius` — impact assessment |
| `commsDraftTask` | agent task | `iml.comms-draft` — drafts only, never publishes |
| `mitigationPlanTask` | agent task | `iml.mitigation-plan` — reversible-first plan |
| `executeMitigationTask` | agent task | `iml.execute-mitigation` — only after its gate approves |
| `publishCommsTask` | agent task | `iml.publish-comms` — only after its gate approves |
| `verifyRecoveryTask` | agent task | `iml.verify-recovery` — executed probe evidence |
| `postmortemDraftTask` | agent task | `iml.postmortem-draft` — blameless postmortem markdown |
| `actionItemTrackingTask` | agent task | `iml.action-item-tracking` — one issue per action item |

All tasks are Style-A `kind: 'agent'` (zero `kind: 'shell'`), with per-effect `io` paths and `labels`, and every evidence-carrying output schema declares `evidence { type: 'array', minItems: 1 }`. Gate combinators (`routedBreakpoint`, `adversarialGate`, `kipRecall`, `kipAssert`) are imported from [`../common-utilities/routed-gate-combinators.js`](../common-utilities/routed-gate-combinators.js), not redefined.

## Severity model

- **SEV1** — user-facing outage on a critical path OR data loss/corruption risk.
- **SEV2** — significant degradation with ongoing user impact (workaround may exist).
- **SEV3** — partial degradation, limited user impact.
- **SEV4** — internal-only, no user impact, cleanup-later.
- **non-incident** — false alarm, duplicate, or expected behavior → early return before any commander is assigned or gate raised.

### Routing table (`SEVERITY_ROUTING`, verbatim)

| Action | SEV1 | SEV2 | SEV3 | SEV4 |
|---|---|---|---|---|
| `execute-prod-mitigation` | incident-commander | incident-commander | tech-lead | tech-lead |
| `publish-status-page` | comms-lead | comms-lead | comms-lead (presentAlwaysApprove) | not raised |
| `send-customer-incident-comms` | comms-lead | comms-lead (only if customerFacing) | not raised | not raised |
| `publish-postmortem` | engineering-manager | engineering-manager | tech-lead | tech-lead (postmortem only when postmortemRequired===true) |

### Comms cadence table (`COMMS_CADENCE`, verbatim)

| Severity | Status page | Customer comms |
|---|---|---|
| SEV1 | required, 30m updates | required |
| SEV2 | required, 60m updates | required iff customerFacing |
| SEV3 | discretionary | not required |
| SEV4 | not required | not required |

Lookups go through `routingExpert(actionId, severity)`, which **throws** on an unknown severity, an unknown action, or an action that is never raised at that severity. There is deliberately no default expert — fallbacks are forbidden.

## Policy-gated actions

Four actions are policy-gated. Convention: **`breakpointId` = actionId**, tags `['policy-gated', 'incident', '<sev>']` (severity tag interpolated per run), strategy `single`, expert from `SEVERITY_ROUTING`.

| actionId | What it gates | Raised when |
|---|---|---|
| `execute-prod-mitigation` | Any production change made to mitigate the incident (config change, rollback, failover, feature-flag kill) | Always, before any production change. Never auto-approves (`autoApproveAfterN` is never set). Rejection → one re-plan pass; second rejection ends the run `success:false` with the executor never invoked. |
| `publish-status-page` | Publishing/updating the public status page entry | SEV1/SEV2 required; SEV3 discretionary (`presentAlwaysApprove:true`); SEV4 never |
| `send-customer-incident-comms` | Direct customer notifications about impact, workarounds, or resolution | SEV1 required; SEV2 required iff `customerFacing`; SEV3/SEV4 never |
| `publish-postmortem` | Publishing the blameless postmortem to its audience | Only after the adversarial completeness gate passes (or the owner accepts via escalation) |

**Fail-closed posture:** a rejected or never-raised gate leaves its action unexecuted and unpublished — there is no alternate path around a gate. Every not-raised comms action is still recorded in `commsLog` as `{ required: false, raised: false }`. Any harness-level auto-approval of a gate is surfaced in `outputs.autoApprovals` (`{ breakpointId, phase, at }`), which is **always present** in outputs, possibly empty.

The only non-policy breakpoint is `iml.commander-assignment.roster-gap`, raised solely when severity-required roles are unstaffed (sparse-breakpoint rule: an unstaffed incident is genuinely blocking).

## Quality gate — postmortem completeness

`adversarialGate(ctx, { gateId: 'iml.postmortem-completeness', ... })` fans out three independent critics over the postmortem draft (the postmortem author never reviews its own work):

| Critic | Focus |
|---|---|
| `timeline-fidelity-critic` | Every timeline entry in the postmortem matches the run journal and task timestamps — the comparison is EXECUTED (read both, diff them), with each verified/mismatched entry cited. The orchestrator accumulates the timeline itself, so the critic has ground truth to diff. |
| `action-item-completeness-critic` | Every action item has a named owner AND concrete due date AND category; every "what went poorly" finding maps to at least one action item — exact lines cited. |
| `blameless-depth-critic` | Contributing factors go beyond the proximate cause (systemic depth, 5-whys); language blameless; root cause stated with supporting evidence. |

IRON-LAW rules (appended to every critic prompt): executed evidence only — run the actual cross-checks, a read-only skim is not evidence; cite `file:line` or executed-check output for every claim; `passed:true` with empty evidence is rejected by the combinator. Fix budget: `maxFixAttempts` (default 2) rounds of the default `gateFixerTask` between critic rounds; on exhaustion the combinator escalates to the owner via a routed breakpoint (`iml.postmortem-completeness.gate-escalation`).

## kip incident memory

- **Recall at detection (P0)**: `kipRecall(ctx, { kipDir, topic: 'incident signature: <symptomSummary> [<impactedSurfaces>]', kipModel, kind: 'incident-management' })` — prior incidents with matching signatures, known-good mitigations, and prior action-item outcomes are threaded into classification, diagnosis, and mitigation prompts. An empty store is initialized and reported as `factCount: 0`, never an error.
- **Assert at close (P10)**, fact shapes:
  - `{ subject: 'incident:<incidentId>', predicate: 'has-signature', object: <signatureString> }`
  - `{ subject: 'incident:<incidentId>', predicate: 'root-cause', object: <rootCause> }`
  - `{ subject: 'incident:<incidentId>', predicate: 'mitigated-by', object: <planSummary>, props: { efficacy: 'effective'|'ineffective', reversible } }`
  - one per action item: `{ subject: 'incident:<incidentId>', predicate: 'action-item', object: <title>, props: { owner, dueDate, category } }`

Both touchpoints are wrapped in `if (kipEnabled)` (default `true`); the assert facts array is built unconditionally-non-empty when reached (the signature fact always exists).

## Usage

```bash
babysitter run:create \
  --process-file library/specializations/incident-management/incident-lifecycle.js \
  --inputs '{
    "signal": {
      "source": "alert",
      "ref": "pagerduty:P-4821",
      "firstSeenAt": "2026-07-23T09:14:00Z",
      "symptomSummary": "checkout API p99 latency 8x baseline, elevated 5xx on payment confirmation",
      "impactedSurfaces": ["checkout", "payments-api"]
    },
    "customerFacing": true,
    "oncall": {
      "primary": "alice",
      "secondary": "bob",
      "commsLead": "carol",
      "engineeringManager": "dana"
    },
    "commsChannels": [
      { "kind": "status-page", "target": "status.example.com" },
      { "kind": "slack", "target": "#incident-war-room" }
    ],
    "slo": { "mttdMinutes": 10, "mttrMinutes": 120 }
  }'
```

A signal like this classifies as SEV2: the status page gate routes to `comms-lead` (required, 60m cadence), customer comms is required because `customerFacing` is true, mitigation execution routes to `incident-commander`, and postmortem publication routes to `engineering-manager` after the completeness gate passes.

## Non-interactive runs

Nothing policy-gated auto-approves **by design** — `execute-prod-mitigation` never sets `autoApproveAfterN`, and the comms/postmortem gates require an explicit approval. If a non-interactive harness auto-approves a breakpoint at its own level, that approval is recorded in `outputs.autoApprovals` as `{ breakpointId, phase, at }` so the fail-closed posture stays auditable. `autoApprovals` is always present in outputs, even when empty.
