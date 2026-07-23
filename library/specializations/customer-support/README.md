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

## Files

- [`ticket-lifecycle.js`](./ticket-lifecycle.js) — the flagship process (11 `cst.*` Style-A
  agent tasks + orchestration).
- Combinators: [`../common-utilities/routed-gate-combinators.js`](../common-utilities/routed-gate-combinators.js)
  — `routedBreakpoint`, `adversarialGate`, `kipRecall`, `kipAssert`, `gateFixerTask`.
