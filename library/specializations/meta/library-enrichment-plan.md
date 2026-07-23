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

## Seed Candidates

The process performs live gap analysis each run; these are starting points, not a quota.

### New specialization domains
- `knowledge-management` — company-brain curation on kip: ingestion (`kip learn`,
  `ingest-rdf`), entity resolution reviews (`kip resolve`), retention/rollup hygiene.
- `release-engineering` — versioning, changelog, staged rollout, post-release verification.
- `incident-management` — triage, mitigation, blameless postmortem, action-item tracking.
- `api-design` — contract-first design, breaking-change review, versioning policy.
- `accessibility` — WCAG audit, remediation, regression-guard processes.
- `internationalization` — extraction, translation QA, locale regression sweeps.
- `mlops` — model eval harnesses, drift monitoring, dataset governance.
- `developer-relations` — docs-driven sample apps, changelog comms, community triage.

### Enrichment of existing domains
- Work items already tracked in `specializations/meta/processes-backlog.md`,
  `methodologies/backlog.md`, and `specializations/backlog.md` (unchecked entries).
- Retrofit older library processes to the current quality bar (breakpoint routing options,
  adversarial gates, parallelization, kip hooks) — one retrofit batch per run is a valid slate.

### Skills / agents
- `kip-librarian` skill (query/assert patterns for processes) and `knowledge-curator` agent.
- `adversarial-gatekeeper` agent variants per artifact type if quality-assessor proves too generic.

## Per-Run Flow (implemented by library-enrichment.js)

survey (parallel: backlogs + library census + kip recall) -> slate synthesis ->
owner slate breakpoint -> parallel per-item authoring (design -> generate ->
adversarial gate loop) -> integration (backlogs/README/index updates) ->
kip knowledge capture -> final report + owner sign-off.
