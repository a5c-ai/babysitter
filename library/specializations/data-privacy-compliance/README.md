# Data Privacy Compliance

Privacy operations lifecycle for DSAR (data-subject access request), erasure, and DPIA work: intake and identity verification, kip-reconciled data mapping, parallel multi-system retrieval, exemption analysis with mandatory legal bases, policy-gated deletion and disclosure, and deadline-audited closure — all inside statutory clocks. This specialization **complements** `security-compliance` and supersedes nothing.

Use it when a data-subject request arrives (access, erasure, rectification, portability), when an erasure demands verified deletion across systems, or when a request surfaces new high-risk processing that needs a DPIA signed off.

## Statutory clocks

Clocks are **frozen consts, not inputs** — there is deliberately no override knob. A statute is not configurable.

| Clock | Duration | Legal basis | Starts from |
|---|---|---|---|
| `dsar` | 30 days | GDPR Art 12(3) / CCPA 1798.130 | **RECEIPT** (`request.receivedAt`), not verification |
| `breach` | 72 hours | GDPR Art 33(1) | breach-indicator detection at intake |

The DSAR clock is started by the **orchestrator** the moment the process runs — before classification finishes, because the statute does not wait. If intake reports non-empty `breachIndicators`, a second 72-hour ledger clock opens and the run records a composition directive to run `specializations/domains/business/legal/data-breach-response` **by name** — this process never absorbs regulator notification.

## Deadline-escalation map

Zone computed by `deadlineZone(nowMs, clockStartMs, deadlineMs)` from the remaining/total ratio: **comfortable** > 0.5, **warning** > 0.25, **critical** > 0, **breached** <= 0. Throws on non-finite inputs or a deadline at/before the clock start — no fallback zone.

`DEADLINE_ESCALATION` (verbatim — the frozen const is the implementation):

| Action | comfortable | warning | critical | breached |
|---|---|---|---|---|
| `data-deletion` | dpo | dpo | privacy-counsel | privacy-counsel |
| `disclosure-response` | dpo | dpo | privacy-counsel | privacy-counsel |
| `dpia-signoff` | privacy-counsel | privacy-counsel | privacy-counsel | privacy-counsel |

`dpia-signoff` is not clock-driven; its row is kept total so lookups never miss. Lookups go through `deadlineExpert(actionId, zone)`, which **throws** on unknown actions and unknown zones — the exact analog of incident-lifecycle `routingExpert()`; no default expert exists.

## Policy-gated actions

Convention: **`breakpointId` = actionId**, expert from `deadlineExpert(actionId, currentZone())`, tags `['policy-gated','privacy','dsar'|'dpia', <zone>]`, strategy `single`, **never auto-approved** (no `autoApproveAfterN`, no `presentAlwaysApprove`). Any harness-level auto-approval is surfaced by `recordGate()` into the always-present `autoApprovals[]` output — fail-closed provenance, nothing auto-approves silently.

| actionId | What it gates | Raised in |
|---|---|---|
| `data-deletion` | Irreversible deletion of personal data | P6, erasure branch only; one bounded re-plan round; second rejection halts with nothing deleted |
| `disclosure-response` | Sending the disclosure package **or denial letter** to the data subject | P10, both outcomes; one bounded revise-and-re-gate round; unapproved -> withheld, fail closed |
| `dpia-signoff` | Approving the privacy impact assessment | P9, only when `dpiaRequired` or `inputs.dpiaContext` |

Non-policy breakpoints: `dpc.identity-verification.unverified` (P2, only on failed verification — genuinely blocking) and the combinator-owned `dpc.dsar-completeness.gate-escalation` (only on gate exhaustion).

## Lifecycle walkthrough (P0–P11)

- **P0 — kip recall** (kind `data-privacy`): data-map/system-of-record facts and DSAR precedents for the subject + jurisdiction, threaded into intake and the data-map refresh.
- **P1 — DSAR intake + clock start**: orchestrator starts the 30-day clock from `request.receivedAt`; `assertRequestType` validates the classification; `non-dsar` exits early before verification or any gate; breach indicators open the 72-hour clock + composition directive.
- **P2 — identity verification (fail-closed)**: failed verification raises the unverified breakpoint; rejected -> run refused with **closure audit still executed** (a refusal is still deadline-audited); approved -> recorded as an identity bypass that forces `success:false`.
- **P3 — data-map refresh**: kip-recalled map reconciled against the live inventory (seeded from `data-mapping-inventory.js` discovery/classification/system-inventory slices). **Zero mapped systems throws** — there is no fallback system list.
- **P4 — parallel multi-system retrieval**: one `dpc.system-retrieval` task per mapped system via `ctx.parallel.all`; the orchestrator diffs results against the map to compute `allSystemsSearched` (ground truth for the coverage critic).
- **P5 — exemption analysis + branch assembly**: every withheld item must cite instrument + article + rationale (uncited withholding is schema-invalid). Access/rectification/portability -> disclosure package compiled (an all-withheld outcome compiles a **denial letter** riding the same schema and gates); erasure -> deletion plan whose every action carries the exact `verificationQuery` the gate later executes.
- **P6 — data-deletion gate** (erasure only): never auto-approves; one re-plan round; second rejection returns with **nothing deleted** — the executor has no other invocation site.
- **P7 — deletion execution**: only inside the `approved === true` branch; per-system outcomes reported honestly, ledgered by the orchestrator.
- **P8 — adversarial completeness-and-exemption gate** (`dpc.dsar-completeness`): coverage-critic + exemption-critic, plus deletion-verification-critic on erasure, which **executes every verificationQuery** and requires zero records back. Nothing leaves until this gate passes (or the owner accepts via escalation).
- **P9 — dpia-signoff gate** (conditional): DPIA drafted to `artifactsDir`, signed off by privacy-counsel at every zone; rejection blocks closure success only when the DPIA need came from the request's own processing.
- **P10 — disclosure-response gate -> delivery**: both disclosure and denial ride the same gate; approved -> the package is delivered **verbatim** with a concrete `messageRef`; unapproved after one revise round -> withheld, recorded, fail closed.
- **P11 — deadline-audited closure + kip assert**: `dpc.closure-audit` executes the deadline arithmetic against the orchestrator ledger; kip assert writes updated data-map facts, the DSAR precedent, and deletion outcomes.

## Composition seeds

- [`domains/business/legal/data-mapping-inventory.js`](../domains/business/legal/data-mapping-inventory.js) — **folded slice** (composition, NOT supersedes): discovery/classification/system-inventory folded into `dpc.data-map-refresh`.
- [`domains/business/legal/data-breach-response.js`](../domains/business/legal/data-breach-response.js) — **composed by name** when `breachIndicators` fire the 72-hour clock; regulator notification stays in that process.

## Module table — `dsar-lifecycle.js` exports

| Export | Kind | Purpose |
|---|---|---|
| `process(inputs, ctx)` | orchestrator | The DSAR lifecycle, phases P0–P11 |
| `STATUTORY_CLOCKS` | frozen const | 30-day DSAR / 72-hour breach clocks with legal bases |
| `REQUEST_TYPES` | frozen const | `['access','erasure','rectification','portability']` |
| `IDENTITY_VERIFICATION_METHODS` | frozen const | Allowed verification methods |
| `DEADLINE_ZONES` | frozen const | `['comfortable','warning','critical','breached']` |
| `DEADLINE_ESCALATION` | frozen const | Per-zone expert routing (lookup via `deadlineExpert`) |
| `deadlineExpert(actionId, zone)` | helper | Escalation lookup — **throws** on unknown action/zone (no fallback expert) |
| `deadlineZone(nowMs, clockStartMs, deadlineMs)` | helper | Zone computation — **throws** on non-finite inputs or deadline <= start |
| `assertRequestType(value, source)` | helper | **Throws** on unknown request types; `'non-dsar'` passes as a classification outcome |
| `dsarIntakeTask` | agent task | `dpc.dsar-intake` — classification, dsarId mint, breach indicators |
| `identityVerificationTask` | agent task | `dpc.identity-verification` — executed checks, fail-closed |
| `dataMapRefreshTask` | agent task | `dpc.data-map-refresh` — kip-reconciled inventory |
| `systemRetrievalTask` | agent task | `dpc.system-retrieval` — per-system fan-out unit |
| `exemptionAnalysisTask` | agent task | `dpc.exemption-analysis` — per-item legal bases |
| `responseCompilationTask` | agent task | `dpc.response-compilation` — draft only, denial included |
| `deletionPlanTask` | agent task | `dpc.deletion-plan` — plan only, verificationQuery per action |
| `deletionExecutionTask` | agent task | `dpc.deletion-execution` — only after its gate approves |
| `dpiaDraftTask` | agent task | `dpc.dpia-draft` — DPIA markdown |
| `responseDeliveryTask` | agent task | `dpc.response-delivery` — only after its gate approves |
| `closureAuditTask` | agent task | `dpc.closure-audit` — executed deadline arithmetic |

Gate combinators (`routedBreakpoint`, `adversarialGate`, `kipRecall`, `kipAssert`) are imported from [`../common-utilities/routed-gate-combinators.js`](../common-utilities/routed-gate-combinators.js), not redefined.

## Inputs / outputs reference

**Inputs**: `request { receivedAt (ISO, REQUIRED — starts the statutory clock), channel, subject { name, email, identifiers? }, rawText }`, `requestTypeOverride?`, `jurisdiction` (`'gdpr'|'ccpa'|string`, REQUIRED), `dpiaContext?`, `maxFixAttempts?` (default 2), `kipEnabled?` (default true), `kipDir?` (default `.a5c/kip`), `kipModel?` (default `sonnet`), `artifactsDir?`. Missing `request.receivedAt`/`subject` **throws** — the process refuses to guess when a statutory clock started.

**Outputs**: `success`, `dsarId`, `requestType`, `identityVerified`, `clock { startedAt, deadlineAt, zoneAtClosure, breached, ledger[] }`, `dataMap { systems, discrepancies, dpiaRequired }`, `retrieval { perSystem[], allSystemsSearched }`, `withheld[]`, `deletion { plan, executed, verified } | null`, `disclosure { sent, deliveredAt, messageRef } | null`, `dpia { required, path, signedOff } | null`, `completenessGate { passed, attempts, escalated, issues }`, `autoApprovals[]` (ALWAYS present — fail-closed provenance), `kipFactsAsserted`, `slaBreaches[]`, `artifacts[]`, `metadata { processId, runId, clockLedger, breakpointsHit }`.

## Hard rules

- **No fallbacks**: `assertRequestType`, `deadlineZone`, and `deadlineExpert` all throw on unknown values; an empty data map throws; missing `request.receivedAt` throws. There is no default expert, zone, request type, or system list anywhere.
- **Fail-closed gates**: deletion and disclosure never execute via any ungated path. `dpc.deletion-execution` and `dpc.response-delivery` are invoked only inside the `approved === true` branches of their gates; no retry, recovery, or closure path calls them otherwise.
- **Style-A agent-only**: every task is `kind: 'agent'` (zero `kind: 'shell'`), with per-effect `io` paths and `labels`, and every evidence-carrying output schema declares `evidence { type: 'array', minItems: 1 }`.
- **Orchestrator-owned clock ledger**: the ledger is accumulated in the orchestrator, never inside agents, so the deadline auditor and gate critics diff against ground truth the agents cannot rewrite.

## Validation

ESM import check from the repo root (resolves the `../common-utilities` import and `@a5c-ai/babysitter-sdk`):

```bash
node --input-type=module -e "await import('./library/specializations/data-privacy-compliance/dsar-lifecycle.js')"
```

Then confirm the exported consts are frozen and the lookups throw:

```bash
node --input-type=module -e "
const m = await import('./library/specializations/data-privacy-compliance/dsar-lifecycle.js');
if (!Object.isFrozen(m.STATUTORY_CLOCKS) || !Object.isFrozen(m.DEADLINE_ESCALATION)) throw new Error('consts not frozen');
try { m.deadlineExpert('data-deletion', 'nope'); throw new Error('should have thrown'); } catch (e) { if (!/unknown deadline zone/.test(e.message)) throw e; }
try { m.assertRequestType('bogus', 'test'); throw new Error('should have thrown'); } catch (e) { if (!/Unknown requestType/.test(e.message)) throw e; }
console.log('ok');
"
```
