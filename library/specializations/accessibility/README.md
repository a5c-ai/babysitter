# accessibility

The **first accessibility specialization** in the library (verified: none existed anywhere
under `library/`). It carries a real product through a full agentic WCAG audit-to-conformance
lifecycle with routed human approvals on every action that commits engineering effort or
leaves the org boundary. It **consolidates the previously scattered near-misses** by
referencing them as seeds rather than duplicating their content, and **supersedes** the
pre-bar `web-development/accessibility-audit-remediation.js` (now `@deprecated`).

## Flagship process: wcag-audit-remediation

`wcag-audit-remediation.js` (`@process accessibility/wcag-audit-remediation`) walks one
target and its surfaces from scope to a published conformance statement:

| Phase | What happens |
|---|---|
| 0 | `kipRecall` of known WCAG issues for the target across its surfaces (`kipEnabled`, kind `accessibility`) — an empty store is a fresh brain, threaded into scope + audit prompts |
| 1 | Audit scope definition (`acc.scope-definition`) — enumerate surfaces, resolve the WCAG success-criteria set, assistive-tech matrix, per-surface approach (sparse: no breakpoint) |
| 2 | **Parallel per-surface audit via `ctx.parallel.all`** — for every surface, two concurrent tasks: executed axe scan (`acc.axe-scan`) + manual expert audit (`acc.manual-audit`). An unscannable surface records `executed:false` with a reason, never a fabricated pass |
| 3 | Prioritized findings register (`acc.findings-register`) — dedupe axe + manual findings, map each to a WCAG criterion + level, prioritize; every finding carries an `evidenceRef` |
| 4 | **Policy-gated remediation-plan sign-off** (`acc.remediation-plan` + `remediation-plan-signoff` breakpoint, engineering-lead) — a rejection ends the run `success:false` before any fix work |
| 5 | Remediation implementation (`acc.remediation-implementation`) — fixes per the APPROVED register only; runs solely on `approved===true` |
| 6 | **Adversarial WCAG conformance re-audit gate** — `adversarialGate` (`accessibility.conformance-reaudit`) whose critics RE-RUN axe / manual checks on the remediated surfaces (executed evidence); **a failed gate returns `success:false` before any statement is drafted or published** |
| 7 | Regression-guard capture (`acc.regression-guard-capture`) — jest-axe / playwright-axe tests wired into CI so fixed findings cannot silently regress |
| 8 | Conformance/VPAT statement draft (`acc.conformance-statement-draft`) + **policy-gated publish** (`acc.publish-conformance-statement` + `conformance-statement-publish` breakpoint, accessibility-lead) |
| 9 | `kipAssert` at close — per-surface conformance outcome, register summary, remediation + gate outcomes, publish decision |

**Inputs:** `{ target: { name, surfaces: [{ id, kind:'page'|'component', url?, path?, description? }] (required, non-empty), assistiveTech?: string[] } (required), wcagLevel?='AA', repoRoot?='.', artifactsDir?, maxFixAttempts?=2, kipEnabled?=true, kipDir?='.a5c/kip', kipModel?='sonnet' }`

**Outputs:** `{ success, scope, priorKnowledge, audits, findingsRegister, remediationPlan, remediation, conformanceGate, regressionGuard, conformanceStatement, gatedActions, kipFactsAsserted, artifacts, metadata }` — `success = conformanceGate.passed && gatedActions.remediationPlanSignoff.approved && (statement not required OR gatedActions.conformanceStatementPublish.approved === gatedActions.conformanceStatementPublish.executed) && regressionGuard.captured`.

## Policy-gated actions

All approvals go through `routedBreakpoint`; for both policy-gated actions the `breakpointId`
**equals** the actionId and tags are `['policy-gated','accessibility']`. Fail-closed: the
executor task runs **only** on `approved === true` — a rejection is honored, recorded, and
never worked around.

| actionId | expert | when | fail-closed behavior |
|---|---|---|---|
| `remediation-plan-signoff` | engineering-lead | always, after `acc.remediation-plan` (before implementation) | implementation runs only on `approved===true`; a rejection ends the run with `success:false` before any fix work |
| `conformance-statement-publish` | accessibility-lead | only when the conformance re-audit gate passed AND a statement is requested | `acc.publish-conformance-statement` runs only on `approved===true`; a rejection leaves the draft unpublished and records the decision |

Additional (non-gated) breakpoint on the surface:

- `accessibility.conformance-reaudit.gate-escalation` — raised **internally** by the
  `adversarialGate` combinator on fix-budget exhaustion (expert `owner`, combinator-fixed);
  the process does not re-declare it, but operators should know it is part of the surface.

`outputs.gatedActions` records **every** decision — `{ actionId, required, approved,
autoApproved, response, executed }` per action, including non-interactive auto-approvals
(recorded raw from the BreakpointResult) and skipped / not-required gates
(`{ required:false, approved:false, autoApproved:false, response:null, executed:false }` —
never omitted). `metadata.breakpointsHit` logs every raised breakpointId in order.

## Quality bar

- **adversarialGate with EXECUTED axe re-scan evidence** — the conformance-reaudit gate's
  critics must RE-RUN axe on each remediated surface and re-perform the manual keyboard/AT
  checks; file-read / diff citations alone do not satisfy the gate, and `passed:true` with
  an empty evidence array is a protocol failure enforced by the combinator (IRON LAW: at
  least one executed axe re-scan per remediated surface).
- **Reviewer independence** — critic agent names (`wcag-conformance-critic`,
  `assistive-tech-critic`) are distinct from the implementer
  (`accessibility-remediation-engineer`); the combinator fans critics out in parallel — no
  self-review.
- **Bounded fix loop** — the built-in `gateFixerTask` edits the remediation for up to
  `maxFixAttempts` rounds between critic rounds, then the combinator escalates to the owner.
- **No fallbacks** — a target with an empty/absent `surfaces[]` throws before any work; an
  unscannable surface records `executed:false` with a reason (never a fabricated clean pass);
  a rejected `remediation-plan-signoff` ends the run with `success:false` before any fix
  work; a failed conformance re-audit gate ends the run before any statement is drafted or
  published; policy-gated executors run strictly on `approved===true`.

## kip integration

`kipRecall` at scope (topic: known WCAG issues for the target across its surfaces, kind
`accessibility`) and `kipAssert` at close (per-surface conformance outcome, register summary,
remediation outcome, gate outcome, conformance-statement decision), per
`shared/skills/kip-librarian`. An empty store is a fresh brain, never an error; assert
failures are reported by the librarian task, never swallowed.

## Near-miss consolidation map

This specialization consolidates the previously scattered accessibility work. The seeds stay
in place and are **referenced, not duplicated**; the pre-bar web-development process is
**superseded**.

| Path | Role | Disposition |
|---|---|---|
| [`../ux-ui-design/wcag-compliance.js`](../ux-ui-design/wcag-compliance.js) | WCAG success-criterion coverage reference | seed — referenced, not duplicated |
| [`../ux-ui-design/accessibility-audit.js`](../ux-ui-design/accessibility-audit.js) | manual audit / assistive-tech checklist reference | seed — referenced, not duplicated |
| [`../qa-testing-automation/accessibility-testing.js`](../qa-testing-automation/accessibility-testing.js) | axe-core / jest-axe / playwright-axe automation feeding the regression-guard phase | seed — referenced, not duplicated |
| [`../web-development/accessibility-audit-remediation.js`](../web-development/accessibility-audit-remediation.js) | pre-bar linear audit→plan→fix→loop process (single unrouted owner approval, dead 3-attempt loop, no executed evidence, no policy gating, no kip) | **superseded** — header-only `@deprecated` pointing here; sound WCAG domain content harvested into the flagship |

## Usage

```bash
babysitter run:create \
  --process library/specializations/accessibility/wcag-audit-remediation.js \
  --inputs '{
    "target": {
      "name": "checkout-flow",
      "surfaces": [
        { "id": "cart-page", "kind": "page", "url": "https://app.example.com/cart" },
        { "id": "payment-form", "kind": "component", "path": "src/components/PaymentForm.tsx" }
      ],
      "assistiveTech": ["VoiceOver", "NVDA", "keyboard-only"]
    },
    "wcagLevel": "AA",
    "maxFixAttempts": 2
  }'
```

## Files

- [`wcag-audit-remediation.js`](./wcag-audit-remediation.js) — the flagship process (9
  `acc.*` Style-A agent tasks + orchestration).
- Combinators: [`../common-utilities/routed-gate-combinators.js`](../common-utilities/routed-gate-combinators.js)
  — `routedBreakpoint`, `adversarialGate`, `kipRecall`, `kipAssert`, `gateFixerTask`.
- Seeds (referenced, not duplicated): [`../ux-ui-design/wcag-compliance.js`](../ux-ui-design/wcag-compliance.js),
  [`../ux-ui-design/accessibility-audit.js`](../ux-ui-design/accessibility-audit.js),
  [`../qa-testing-automation/accessibility-testing.js`](../qa-testing-automation/accessibility-testing.js).
