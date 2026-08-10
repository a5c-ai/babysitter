# Procurement — business domain specialization

Babysitter processes for the end-to-end buying lifecycle: sourcing intake, RFx, vendor
evaluation, negotiation, and purchase-order issuance — with policy gates on every
binding action.

## What lives here

- **`procurement-lifecycle.js`** (`procurement/procurement-lifecycle`) — the full
  lifecycle: intake -> RFx authoring -> parallel per-vendor evaluation -> adversarial
  evaluation-integrity gate -> bounded negotiation rounds -> selection -> policy-gated
  vendor commitment, spend approval, and PO issuance.

## Relationship to supply-chain

This directory owns the end-to-end buying lifecycle with policy gates, not the
individual supply-chain analytics. It composes supply-chain processes **by name**:

- `supply-chain/rfx-management.js` — the RFx authoring task reuses its RFI/RFP/RFQ
  package structure (evaluation criteria, timeline) inline; run that process for a full
  standalone RFx cycle.
- Supplier-evaluation concepts inform the per-vendor scoring slice; deep supplier
  analytics stay in the supply-chain domain.

## Policy-gated actions

Three actions are policy-gated and **never auto-approved** (no `autoApproveAfterN`,
no `presentAlwaysApprove`); each is a `routedBreakpoint` whose `breakpointId` equals
the action id, tagged `['policy-gated', 'procurement']`:

| Action | When | Meaning |
| --- | --- | --- |
| `vendor-commitment` | after selection | communicate a binding award decision to a vendor |
| `spend-approval` | after commitment | approve the negotiated final price at the routed authority tier |
| `po-issuance` | after PO drafting | issue the purchase order — a binding commercial commitment |

## Spend-threshold expert routing

Approvals route on spend through the frozen `SPEND_APPROVAL_ROUTING` table and the
throwing `resolveSpendExpert` lookup — invalid spend (missing, non-numeric, `NaN`,
negative) fails the run before any task runs:

| Spend (USD) | Expert |
| --- | --- |
| <= $25,000 | `procurement-manager` |
| <= $250,000 | `finance-director` |
| > $250,000 | `cfo` (Infinity cap tier — an explicit cap, not a fallback) |

Per-round negotiation approvals and `vendor-commitment` route on the current spend
position (latest negotiated price, initially `estimatedSpend`); `spend-approval` and
`po-issuance` route on the negotiated `finalPrice`.

## Quality gates

- **`prc.rfx-critique`** — requirements-completeness critic (executed mustHave-vs-RFx
  trace-matrix diff) + evaluability critic (executed weight-sum recomputation; every
  criterion needs a scoring anchor and must be vendor-evidenceable).
- **`prc.evaluation-integrity`** — runs against the process-computed evaluation matrix
  over **deterministically sampled** vendor claims (highest-weighted criteria first,
  then claimId order — no RNG, replay-safe). The evidence-verification critic opens
  every sampled claim's cited evidence file and pastes an executed re-score table; the
  scoring-consistency critic recomputes every vendor's weighted total.

Both gates run through the shared `adversarialGate` combinator: evidence-empty passes
are coerced to protocol failures, and fix-budget exhaustion escalates to the owner via
a routed `<gateId>.gate-escalation` breakpoint. A gate that fails even after
escalation ends the run through `buildResult(false, reason)` with the full record.

## Memory

kip kind `procurement`:

- **Recall (P1)** — vendor history, negotiated pricing baselines, and award outcomes
  for the category across the candidate vendors.
- **Assert (P10)** — facts built deterministically in process code (never by agents):
  `negotiated-term` per approved term, `awarded` for the selected vendor,
  `evaluated-not-awarded` per non-selected vendor, and a `lifecycle-outcome` record
  with gate attempts, escalations, and PO status.

## Inputs / outputs

Required inputs: `requirementsBrief` (path), `category`, `vendors` (non-empty array),
`estimatedSpend` (finite USD number). Optional: `rfxType` ('RFI'|'RFP'|'RFQ', default
'RFP'), `evidenceSampleSize` (default 3), `maxNegotiationRounds` (default 3),
`maxFixAttempts` (default 2), `kipEnabled`/`kipDir`/`kipModel`.

Outputs: `success`, `intake`, `recall`, `rfx` (with gate record), `evaluations`
(process-recomputed totals), `integrityGate` (with `sampledClaims`), `negotiation`
(per-round records with approvals), `selection`, `approvals` (the three policy-gated
records), `po` (`poPath`, `poNumber`, `finalPrice`), `kipFactsAsserted`, `artifacts`,
`metadata`. See the JSDoc header of `procurement-lifecycle.js` for the full shapes.

## Design rules

- **No fallbacks**: required inputs throw; breakpoint rejections without a directive
  throw; the Infinity routing tier is an explicit cap, not a default approver.
- **Bounded loops only**: negotiation is capped by `maxNegotiationRounds` with an
  explicit exhaustion escalation — never an unbounded retry.
- **Per-round breakpoint ids**: `prc.approve-terms.round-<n>` is unique per round so
  replay never collapses two rounds.
- **Arithmetic in process code**: weighted totals, ranking, spend deltas, and the
  evaluation matrix artifact are computed/written by process code — approval payloads
  never trust agent-reported numbers.
- **Style-A agent-only tasks**: every `defineTask` is `kind: 'agent'` with
  `tasks/<effectId>/input.json|result.json` io and labels.
