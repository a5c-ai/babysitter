# customer-support

The first full agentic **customer-facing workflow** specialization in the library. It closes
the census's top customer-facing gap: `domains/business/customer-experience` holds **20
pre-bar point tasks with zero breakpoint routing**, and no customer-support specialization
existed anywhere. This specialization carries a real support ticket end-to-end with routed
human approvals on every action that leaves the org boundary, while the 20 point tasks
remain independently callable utilities (mapped per phase below).

## Flagship process: ticket-lifecycle

`ticket-lifecycle.js` (`@process customer-support/ticket-lifecycle`) walks one ticket
through the whole lifecycle:

| Phase | What happens |
|---|---|
| 0 | `kipRecall` at intake — prior similar-ticket resolutions thread into every later task (`kipEnabled`, kind `customer-support`) |
| 1 | Intake & classification (`cst.intake-classify`) — category, structured facts, candidate known issues |
| 2 | Severity/priority triage (`cst.triage`) — conditional `customer-support.triage-ambiguity` breakpoint fires only on `triage.ambiguous === true`; approver response may override severity/priority/queue and is recorded as `ambiguityResolution` |
| 3 | Parallel investigation via `ctx.parallel.all` — repro (`cst.investigate-repro`), knowledge search (`cst.investigate-knowledge`), account context (`cst.investigate-account-context`) |
| 4 | Resolution drafting (`cst.resolution-draft`) — resolution document + customer replyDraft + remediation proposal; an unknown `remediation.kind` on a monetary remediation throws before any gate |
| 5 | Adversarial resolution review — `adversarialGate` (`customer-support.resolution-review`) with two independent critics and executed evidence; **a failed gate returns `success:false` before any customer contact** |
| 6 | Policy-gated customer reply + conditional refund/credit — refund breakpoint/execution first when `remediation.monetary === true`, its outcome folded into the reply breakpoint context |
| 7 | Verification & close (`cst.verify-close`) — verificationSteps re-executed, unverified closes recorded honestly |
| 8 | KCS-style KB capture (`cst.kb-article-capture`) + policy-gated publish (`cst.publish-kb-article`) — the publish breakpoint is always raised; a human decides even when the author recommends against |
| 9 | `kipAssert` at close — root cause, resolution pattern, refund decision, gate outcome, KB decision |

**Inputs:** `{ ticket: {id, channel, subject, body, customerRef, attachments?} (required), customerProfile?, repoRoot?='.', kbDir?='artifacts/kb', maxFixAttempts?=2, kipEnabled?=true, kipDir?='.a5c/kip', kipModel?='sonnet' }`

**Outputs:** `{ success, classification, triage, investigation, resolution, resolutionGate, gatedActions, verification, kbArticle, kipFactsAsserted, artifacts, metadata }` — `success = resolutionGate.passed && gatedActions.sendCustomerReply.executed && verification.verified && (!resolution.remediation.monetary || gatedActions.issueRefundOrCredit.approved === gatedActions.issueRefundOrCredit.executed)`.

## Policy-gated actions

All approvals go through `routedBreakpoint`; for the three policy-gated actions the
`breakpointId` **equals** the actionId and tags are `['policy-gated','customer-support']`.
Fail-closed: the executor task runs **only** on `approved === true` — a rejection is
honored, recorded, and never worked around.

| actionId | expert | when | fail-closed behavior |
|---|---|---|---|
| `send-customer-reply` | support-lead | always | executor runs only on `approved===true`; rejection records the decision and the run continues to verify/close with `sent=false` surfaced honestly |
| `issue-refund-or-credit` | support-manager | only when `resolution.remediation.monetary === true` | executor runs only on `approved===true`; rejected refund records `approved=false` and the reply proceeds without monetary language |
| `publish-kb-article` | knowledge-manager | always raised after capture (author recommendation in context) | executor runs only on `approved===true`; rejection leaves the draft in place |

Additional (non-gated) breakpoints on the surface:

- `customer-support.triage-ambiguity` — expert support-lead, conditional on `triage.ambiguous === true`.
- `customer-support.resolution-review.gate-escalation` — raised internally by the
  `adversarialGate` combinator on fix-budget exhaustion (expert `owner`, combinator-fixed);
  the process does not re-declare it, but operators should know it is part of the surface.

`outputs.gatedActions` records **every** decision — `{ actionId, required, approved,
autoApproved, response, executed }` per action, including non-interactive auto-approvals
(recorded raw from the BreakpointResult) and skipped conditional gates
(`{ required:false, approved:false, autoApproved:false, executed:false }` — never omitted).
`metadata.breakpointsHit` logs every raised breakpointId in order.

## Phase -> customer-experience point-task map

All 20 utilities under [`../domains/business/customer-experience/`](../domains/business/customer-experience/)
remain independently callable helpers. Which phase can invoke which:

| Phase | Point tasks (callable helpers) |
|---|---|
| Intake & classification | `ticket-triage-routing`, `service-request-fulfillment` |
| Triage | `sla-management`, `escalation-management` |
| Investigation | `fcr-optimization`, `problem-management`, `customer-health-scoring`, `knowledge-base-development`, `feedback-analysis-pipeline` |
| Resolution | `churn-prevention` |
| Verify & close | `csat-collection`, `closed-loop-feedback`, `nps-survey-program` |
| KB capture & publish | `kcs-implementation`, `self-service-optimization` |
| Journey-level companions (outside the single-ticket loop) | `customer-onboarding`, `customer-journey-mapping`, `qbr-preparation`, `touchpoint-optimization` |
| Ownership note | `itil-incident-management` and `problem-management` escalate to the **incident-management** specialization — this specialization owns *tickets*, not *incidents* |

## Quality bar

- **adversarialGate with executed evidence** — the resolution-review gate's critics must
  RE-EXECUTE the repro steps / verificationSteps; file-read citations alone do not satisfy
  the gate, and `passed:true` with an empty evidence array is a protocol failure enforced
  by the combinator.
- **Reviewer independence** — critic agent names (`resolution-accuracy-critic`,
  `customer-communication-critic`) are distinct from the drafting agent
  (`support-resolution-author`); the combinator fans critics out in parallel.
- **Bounded fix loop** — the built-in `gateFixerTask` edits the resolution artifact for up
  to `maxFixAttempts` rounds, then the combinator escalates to the owner.
- **No fallbacks** — missing `ticket`/`ticket.id`/`ticket.body` throws; an unknown
  `remediation.kind` on a monetary remediation throws before the refund breakpoint;
  rejected gates are honored, never worked around; a failed resolution gate ends the run
  with `success:false` before any customer contact.

## kip integration

`kipRecall` at intake (topic: similar support tickets by subject/body, kind
`customer-support`) and `kipAssert` at close (root cause, resolution pattern, refund
decision, gate outcome, KB decision — one fact each, subject `ticket:<id>`), per
`shared/skills/kip-librarian`. An empty store is a fresh brain, never an error; assert
failures are reported by the librarian task, never swallowed.

## Usage

```bash
babysitter run:create \
  --process library/specializations/customer-support/ticket-lifecycle.js \
  --inputs '{
    "ticket": {
      "id": "TCK-4821",
      "channel": "email",
      "subject": "Webhook deliveries failing since upgrade",
      "body": "Since upgrading to v3.2 our webhook endpoint receives 401s on every delivery...",
      "customerRef": "acme-corp"
    },
    "customerProfile": { "tier": "enterprise", "tenureMonths": 26 },
    "kbDir": "artifacts/kb",
    "maxFixAttempts": 2
  }'
```

## Second flagship process: onboarding-lifecycle

`onboarding-lifecycle.js` (`@process customer-support/onboarding-lifecycle`) carries one
**signed deal** end-to-end — from handoff intake through account-context recall, success-plan
drafting, an adversarial plan/success review with **executed** evidence, policy-gated kickoff
comms, parallel provisioning/training/integration tracks with per-track verification, milestone
reviews that route to a policy-gated at-risk escalation, go-live sign-off, and a closing
health-score baseline asserted into kip. It **composes** the pre-bar customer-experience point
seeds by name as callable stages — it does not duplicate them.

| Phase | What happens |
|---|---|
| 0 | `kipRecall` of prior onboarding outcomes, health signals, and account history (`kipEnabled`, kind `customer-support`, topic keyed by `account:<accountId>`) |
| 1 | Signed-deal handoff intake (`onb.handoff-intake`) — normalizes account/tier/stakeholders/contractTerms; duplicate or missing contractTerm ids throw before drafting |
| 2 | Success-plan drafting (`onb.success-plan-draft`) — markdown plan where **every commitment carries a `contractTermId`**; applies customer-onboarding (discovery/plan/milestones) + customer-journey-mapping lenses by name |
| 3 | Adversarial plan/success review — `adversarialGate` (`onb.success-plan-review`) with two independent critics (`commitment-traceability-critic` re-traces commitments to contract terms; `health-baseline-critic` executes the health-scoring logic over `stubAccountData`); **a failed gate returns `success:false` before any customer contact** |
| 4 | Policy-gated kickoff comms — `onb.kickoff-comms-draft` then the `customer-comms-send` breakpoint; `onb.send-kickoff-comms` runs only on `approved===true` |
| 5 | Parallel tracks via `ctx.parallel.map` (`maxConcurrency=maxParallel`) — provisioning (`onb.provision-plan` → `tenant-provisioning-approval` gate → guarded `onb.provision-execute`), training (`onb.training-track-prepare`), integration (`onb.integration-track-prepare`); each ends in `onb.verify-track` with executed evidence and honest `failures[]`. Unknown track name throws (no default-skip); results re-keyed by name via a Map |
| 6 | Milestone review (`onb.milestone-review`) — a routed breakpoint fires **only** when a milestone is `atRisk===true`, raising the policy-gated `account-escalation-approval` with an `onb.escalation-package` handoff; non-at-risk milestones auto-continue |
| 7 | Go-live sign-off — `routedBreakpoint` `go-live-sign-off` (expert onboarding-manager, tags `customer-support`/`go-live`; **not** one of the three policy-gated actions); a no-go is final but the closing phases still run |
| 8 | Health-score baseline (`onb.health-baseline`) — composes the customer-health-scoring scoring-model; not-computable sub-scores are reported, never invented |
| 9 | `kipAssert` — onboarding-outcome, health-baseline (composite + tier), plan-review gate-outcome, and one policy-decision fact per gated action |

**Inputs:** `{ handoff: {accountId, accountName, contractTerms:[{id,term,commitment,metric?}], productTier, stakeholders:[{name,role,email?}], signedValue?, closeDate?} (required), objectives?, stubAccountData?, repoRoot?='.', maxParallel?=3, maxFixAttempts?=2, kipEnabled?=true, kipDir?='.a5c/kip', kipModel?='sonnet' }` — missing `handoff`/`handoff.accountId`/empty `contractTerms` throws.

**Outputs:** `{ success, handoffSummary, successPlan, planReviewGate, gatedActions, tracks, milestones, goLive, healthBaseline, kipFactsAsserted, artifacts, metadata }` — `success` is true only when `planReviewGate.passed`, kickoff comms `executed===approved`, tenant provisioning `executed===approved` (when required), every track verified, go-live `decision==='go'`, and `healthBaseline.computed`; any at-risk escalation rejection or go-live no-go yields `success:false` with an honest reason.

### Policy-gated actions (onboarding)

Same fail-closed pattern as ticket-lifecycle: `breakpointId` **equals** the actionId, tags are
`['policy-gated','customer-support']`, the executor runs **only** on `approved===true`, and every
decision (including skipped conditional gates and non-interactive auto-approvals) is recorded raw
in `outputs.gatedActions`.

| actionId | expert | when | fail-closed behavior |
|---|---|---|---|
| `customer-comms-send` | customer-success-manager | always (Phase 4 kickoff comms) | `onb.send-kickoff-comms` runs only on `approved===true`; rejection records the decision and the run continues with `sent=false` surfaced honestly |
| `tenant-provisioning-approval` | onboarding-manager | always within the provisioning track (Phase 5) | `onb.provision-execute` runs only on `approved===true`; rejection records `approved=false` and the track verifies with `provisioned=false` |
| `account-escalation-approval` | customer-success-director | **conditional** — only when a milestone review yields `atRisk===true` (Phase 6) | escalation acted on only when `approved===true`; a skipped conditional gate is recorded as `{required:false,...}`, never omitted |

Additional (non-gated) breakpoints on the surface:

- `go-live-sign-off` — expert onboarding-manager, tags `['customer-support','go-live']`; always raised in Phase 7.
- `onb.success-plan-review.gate-escalation` — raised internally by the `adversarialGate` combinator on fix-budget exhaustion (expert `owner`); the process does not re-declare it but records it in `breakpointsHit` when the gate escalates.

### Onboarding phase -> customer-experience seed map

The onboarding workflow composes four pre-bar seeds under
[`../domains/business/customer-experience/`](../domains/business/customer-experience/) **by name**;
the seeds remain independently callable point methods.

| Seed | Methods used | Composed by |
|---|---|---|
| `customer-onboarding` | discovery-assessment, onboarding-plan, training-program, success-milestones | `onb.success-plan-draft` (discovery/plan/milestones lenses) + `onb.training-track-prepare` (training-program lens) |
| `customer-health-scoring` | indicator-design, scoring-model, threshold-definition | `health-baseline-critic` in the plan-review gate (executed over `stubAccountData`) + `onb.health-baseline` (composite baseline) |
| `escalation-management` | handoff-package + communication-standards | `onb.escalation-package` on the at-risk path feeding `account-escalation-approval` |
| `customer-journey-mapping` | journey-map lens | `onb.success-plan-draft` (milestone journey framing) |

`domains/business/customer-experience/customer-onboarding.js` is soft-`@deprecated` as the e2e
entrypoint (superseded by this workflow) but stays independently callable for standalone
onboarding-plan drafting.

## Files

- [`ticket-lifecycle.js`](./ticket-lifecycle.js) — the flagship process (11 `cst.*` Style-A
  agent tasks + orchestration).
- [`onboarding-lifecycle.js`](./onboarding-lifecycle.js) — the second flagship process (12
  `onb.*` Style-A agent tasks + orchestration; gated end-to-end signed-deal onboarding).
- Combinators: [`../common-utilities/routed-gate-combinators.js`](../common-utilities/routed-gate-combinators.js)
  — `routedBreakpoint`, `adversarialGate`, `kipRecall`, `kipAssert`, `gateFixerTask`.
