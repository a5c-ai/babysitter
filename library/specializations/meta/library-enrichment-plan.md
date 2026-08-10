# Process Library Enrichment Plan

Seed plan consumed by the reusable `meta/library-enrichment` process
([library-enrichment.js](./library-enrichment.js)). Each enrichment run re-reads this
plan plus the live backlogs, so editing this file steers future runs without touching
process code.

## Goal

Continuously extend the process library with high-quality processes, skills, and agents
across new and existing domains — in batches, with human slate approval, adversarial
proof-driven quality gates, and knowledge capture into kip so every run builds on the last.

## Quality Bar (every authored item must meet ALL of these)

1. **Conventions**: ESM, `import { defineTask } from '@a5c-ai/babysitter-sdk'`, JSDoc header
   with `@process`/`@description`/`@inputs`/`@outputs`/`@graph` (>= 1 `domain:` node),
   `export async function process(inputs, ctx)`, structured return with `metadata`.
2. **Breakpoints**: sparse, only at genuinely critical decisions; every breakpoint uses the
   routing options — `breakpointId` (dotted namespace), `expert`, `tags` (topics),
   `strategy`, and where sensible `autoApproveAfterN` / `presentAlwaysApprove`.
3. **Adversarial quality gates**: reviewer tasks are independent of implementer tasks,
   carry IRON-LAW instructions ("do NOT trust the implementer report — read the actual
   artifacts"), and must return `{ passed, issues[], evidence[] }` where evidence cites
   concrete file paths/lines. No gate passes on assertion alone.
4. **Parallelization**: independent tasks run via `ctx.parallel.all` / `ctx.parallel.map`;
   sequential chains only where a real data dependency exists.
5. **kip integration**: any process that touches knowledge, memory, research, or
   organizational data must read prior context via `kip recall`/`kip query`/`kip ask` and
   write durable facts via `kip assert` (company-brain pattern). Use `--model sonnet` for
   structured adjudication paths.
6. **No shell subtasks** unless the workflow is explicitly shell-oriented (repo override).
7. **No fallbacks**: degraded paths must surface as failures or explicit inputs, never
   silent substitution.

## Throughput (owner decision, 2026-07-23)

Batches of ~12 items; the slate-approval breakpoint is auto-approved under standing owner
authorization (the orchestrator picks from the ranked gap list). Gate escalations and the
final run sign-off are still surfaced to the owner. Two large batches are authorized after
the batch-2 run (~24 items total), then stop and report.

## Direction (owner steering, 2026-07-23)

Slates must target **actual work domains** — full agentic-AI work workflows that carry a
real business process end-to-end. kip and the policy engine are cross-cutting *awareness
requirements* on every item, never the subject of a slate item. Meta/tooling items only
when they unblock a work-domain batch.

### Policy-engine awareness (required on every authored workflow)

The policy engine is `packages/adapters/policy`: YAML policy documents declare, per
action, matchers plus trust-chain requirements (typed evidence steps `human-approval` /
`model-decision` / `delegation`, distinct-holder quorums; fail-closed on parse errors).
Authored workflows must:
- Enumerate their sensitive/irreversible actions (external comms sent, money spent,
  data deleted, content published, deploys, contract terms accepted, offers extended)
  as a declared `policyGatedActions` list in the process JSDoc/outputs.
- Route each such action through a routed breakpoint whose approval is structured so it
  can serve as `human-approval` evidence in a trust chain (stable breakpointId = the
  action id; expert = the accountable role; tags include `policy-gated`).
- Never auto-execute a policy-gated action in non-interactive mode without recording
  that the gate was auto-approved (fail-closed posture; surface, don't bury).

### kip awareness (required, not the subject)

Recall prior domain facts at start, assert decisions/outcomes at end, per the
`kip-librarian` skill (`library/specializations/shared/skills/kip-librarian/`). Use the
`routedBreakpoint`/`adversarialGate`/`kipRecall`/`kipAssert` combinators from
`library/specializations/common-utilities/` instead of re-implementing.

## Seed Candidates

The process performs live gap analysis each run; these are starting points, not a quota.

### New work-domain specializations (full agentic workflows)
- `customer-support` — ticket triage → investigation → resolution → KB-article capture;
  policy-gated: outbound customer replies, refunds/credits.
- `sales-revenue-ops` — lead qualification → research → outreach sequencing → proposal →
  CRM hygiene; policy-gated: outbound emails, discount approvals.
- `legal-contracts` — contract intake → clause/risk review → redline negotiation cycle →
  execution; policy-gated: accepting terms, sending redlines externally.
- `finance-accounting` — AP invoice processing, month-end close checklist, expense audit;
  policy-gated: payment release, journal postings.
- `hiring-recruiting` — JD authoring → sourcing → screening → interview loop → offer;
  policy-gated: candidate outreach, offer extension.
- `marketing-content` — campaign brief → content production (adversarial brand/claims
  review) → multi-channel publish → analytics retro; policy-gated: publishing.
- `procurement` — RFP authoring → vendor evaluation matrix → selection → PO;
  policy-gated: vendor commitments, spend.
- `data-privacy-compliance` — DSAR handling, privacy review of features, retention
  enforcement; policy-gated: data deletion, disclosure responses.
- `incident-management` — triage → mitigation → comms → blameless postmortem →
  action-item tracking; policy-gated: status-page/customer comms, prod changes.
- `release-engineering` — versioning → changelog → staged rollout → post-release
  verification; policy-gated: production deploy/rollback.

### Full workflows missing in existing domains
- product-management: discovery → spec → prioritization → launch retro end-to-end run.
- research: literature review → experiment design → analysis → publication workflow.
- communication/authoring: multi-audience announcement pipeline with review gates.
- business/sourcing: build out or fold per census; vestigial today.
- Unchecked entries in the three backlogs remain valid candidates when they are
  work-domain workflows (composition-* methodology examples qualify).

### Skills / agents
- Only in service of a work-domain batch (e.g. a `policy-gate-author` helper that emits
  the YAML policy document matching a workflow's declared policyGatedActions).

## Per-Run Flow (implemented by library-enrichment.js)

survey (parallel: backlogs + library census + kip recall) -> slate synthesis ->
owner slate breakpoint -> parallel per-item authoring (design -> generate ->
adversarial gate loop) -> integration (backlogs/README/index updates) ->
kip knowledge capture -> final report + owner sign-off.
