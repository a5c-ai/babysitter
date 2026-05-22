---
id: page:process-00-process-design
nodeKind: Page
title: "v6 Ontology-Driven Development Process — Master Design"
slug: "process/00-process-design"
articlePath: "wiki/process/00-process-design.md"
documents: []
---
# v6 Ontology-Driven Development Process — Master Design

> Definitive specification for how the v6 effort runs end-to-end. The schema and graph live under `C:/work/v6/graph/`; this document describes the process that produces, evolves, and delivers everything derived from them.

---

## 1. Vision

The **agent-catalog graph** is the single source of truth for the v6 domain. Every other artifact — node-kind specs, validation rules, generated documentation, the wiki, generator code, the SDK, and user-facing interfaces — is a *projection* of the graph, never authored independently.

The flow is strict and one-directional:

```
Schema (C:/work/v6/graph/schema/ontology-schema.yaml)
   ↓
Graph (populated nodes + edges + evidence)
   ↓
Derived artifacts (docs, generators, tests, code, SDK, interfaces)
```

Because prose is regenerated from the graph, **prose drift is structurally impossible**: if a fact changes, the change is made in the graph, and every projection that depends on that fact is regenerated. Out-of-band edits to derived artifacts are rejected by CI.

The graph aspires to **wiki-grade thoroughness**: it must hold enough structured fact and evidence (per `C:/work/v6/graph/schema/evidence-model.md`) to write a full encyclopedia of the agent / Claude Code / babysitter ecosystem — every Term defined, every Product specified, every Capability sourced, every Hook documented, every Channel typed. If a human reader needs to know it, the graph must hold it as data + evidence, not as floating prose.

---

## 2. Phases 1–5

The forward direction is **top-down**: each phase initially completes before the next begins. Each phase has explicit deliverables and acceptance criteria. Phases are revisited continuously through the debt-driven loop (Section 3).

### Phase 1 — Schema (mostly done)

**Deliverables**
- Meta-schema: `C:/work/v6/graph/schema/meta-schema.md`
- 14 node-kind specs under `C:/work/v6/graph/schema/node-kinds/` (agent-stack, benchmarks, capabilities, catalog-meta, channels-hooks, domain-ontology, extensions-plugins, lifecycle, role-ontology, sourceref-and-scope, stack-layers, terminology, transport, trust). Note: the `trust` spec is slimmed to `TrustLevel` only — the cross-stack Trust Chain (`Authority`, `Attestation`, `trust-interface`) is out-of-scope for Phase 1 and deferred to a separate trust-and-signing initiative if pursued.
- Edge-kind spec: `C:/work/v6/graph/schema/edge-kinds.md`
- Machine-readable schema files: `C:/work/v6/graph/schema/ontology-schema.yaml`, `attribute-types.yaml`, `invariants.yaml`
- Evidence model: `C:/work/v6/graph/schema/evidence-model.md`
- Validation rules: `C:/work/v6/graph/schema/validation-rules.md`
- Derivation spec: `C:/work/v6/graph/schema/derivation-spec.md`
- Versioning: `C:/work/v6/graph/schema/versioning.md`
- Coverage checklist: `C:/work/v6/graph/coverage-checklist.md`

**Acceptance criteria**
- Every legacy concept (from `C:/work/v6/graph/wiki/legacy/`) maps to a schema element or is explicitly marked out-of-scope.
- All 29 OpenQuestions raised during schema authoring are resolved or formally deferred (deferred questions tracked as `Gap` nodes per Section 6).
- A validator stub exists that loads `ontology-schema.yaml` + `invariants.yaml` and reports structural violations on a sample graph.

### Phase 2 — Full graph

**Deliverables**
- Complete graph population covering every named real-world entity in scope. Current state: the graph data under `C:/work/v6/graph/` is still sample-heavy and needs full coverage.
- Every node carries live evidence pointing into `SourceRef` nodes (per `schema/evidence-model.md`).

**Acceptance criteria**
- Every NodeKind has full real-world coverage where applicable (concrete entities, not just samples).
- Every fact-bearing claim has live evidence within the freshness window defined in `04-evidence-model.md`.
- Cross-reference integrity is 100%: no dangling edge endpoints, no orphan nodes outside the explicitly-orphan-allowed kinds.
- The validator stub from Phase 1 passes on the full graph, with zero invariant violations.

### Phase 3 — Generators

**Deliverables**
- Generator implementations for the 10 illustrative outputs in `C:/work/v6/graph/schema/derivation-spec.md`:
  1. Glossary
  2. Stack documentation
  3. Product card
  4. Capability matrix
  5. Hook taxonomy doc
  6. Adapter scaffold
  7. OpenAPI artifact
  8. Per-package README
  9. Stack diagram
  10. Coverage check

**Acceptance criteria**
- Generators are **pure**, **deterministic**, **idempotent**: same graph in → byte-identical output.
- Output diffs only when the graph (or generator code) changes; running a generator twice in a row produces no diff.
- Each generator emits a manifest declaring which graph nodes/edges it read.

### Phase 4 — Documentation / wiki

**Deliverables**
- A full wiki/encyclopedia derived from the graph: per-NodeKind page, per-Product page, per-Capability page, per-Term entry, per-Hook entry, per-Channel entry, per-Stack-layer page.
- Phase-by-phase architecture pages.
- Navigation, full-text search, cross-references between every named graph entity.
- Glossary auto-generated from `Term` nodes.

**Acceptance criteria**
- Every `Term` in the graph has a wiki page.
- Every `Product` has a page.
- Every `Capability` has a page.
- Navigation works (no dead links from generated nav).
- Search returns expected hits for spot-check queries pulled from the graph.

### Phase 5 — Testing / verification / delivery

**Deliverables**
- Test pyramid: unit tests per generator, integration tests across schema → graph → generator, end-to-end tests on shipped artifacts.
- Evidence-boundary checks (claims without evidence fail; stale evidence fails).
- Schema-version delivery and generator versioning per `C:/work/v6/graph/schema/versioning.md`.
- CI/CD pipeline that gates schema and graph PRs.
- Downstream artifact distribution (npm packages, generated docs site, OpenAPI artifacts, etc.).

**Acceptance criteria**
- Every NodeKind has at least one test.
- Every generator has an integration test against a known graph fixture.
- E2E tests exist for key user flows (e.g., schema change → regenerated docs → SDK consumer compiles).
- CI gates schema/graph PRs on validator + invariant + freshness checks.

---

## 3. Debt-driven loop

The debt loop runs **between each forward phase** and **continuously after all phases complete**. It identifies and closes drift between the seven levels listed below. Each iteration: pick the highest-priority unaddressed gap, close it, then cascade per Section 4.

### The 7 levels (priority order — lower number wins)

1. **Real world vs graph + schema** — vendor news, third-party updates, online sources, analytics, bug reports, feature requests. New Anthropic capabilities, new Claude Code releases, breaking SDK changes, new MCP servers, new community plugins, deprecations, pricing/quota changes.
2. **Graph vs docs** — graph data and node-kind/edge-kind specs in agreement; example YAMLs valid against the schema; invariants in `invariants.yaml` reflected in `schema/validation-rules.md` prose.
3. **Quality / delivery process vs docs** — the Phase 5 artifacts (CI, versioning, distribution) match what the docs say they should produce.
4. **Generators vs docs** — Phase 3 generators emit exactly what `schema/derivation-spec.md` says they should emit, with no extra fields and no missing fields.
5. **Code vs docs + above** — implementation code (validators, generators, runtime libraries) matches the schema and the spec; no hardcoded facts that should be derived.
6. **Programmable interfaces vs SDK + above** — the SDK surface (TypeScript types, function signatures, exported constants) matches the schema-derived contract.
7. **Interfaces vs everything above** — user-facing interfaces (CLI, web UI, dashboards) match the SDK surface and the spec.

### Why priority order matters

A gap at Level 1 invalidates derivations at Levels 2–7. Fixing a Level 5 issue while a Level 1 gap is open is wasted work — the truth changed underneath you. Always resolve Level N before spending energy on Level N+1, **unless** Level N+1 work is the cascade of a Level N fix already in progress (Section 4).

### Sources of Level-1 signal

- Anthropic changelog, model release notes, system card updates
- Claude Code release notes, plugin marketplace updates
- MCP registry updates
- GitHub issues and PRs in tracked upstreams
- User feedback (bug reports, feature requests)
- Telemetry / analytics on shipped artifacts (which generators were rerun, which docs were viewed, which SDK calls 404'd)

### What "closing a gap" means

A gap is closed when:
- The change is committed to the graph (and schema, if needed).
- All cascaded changes (Section 4) are committed or explicitly marked `not-applicable`.
- Adversarial review (Section 5) signs off.
- The gap node's `status` flips from `open` → `closed` and `propagationStatus` is `done`/`not-applicable` for every level.

---

## 4. Cascade rule

When closing a gap at Level N, **propagate the change DOWN through Levels N+1...7 BEFORE picking up generic gaps at higher levels**.

Concretely, a Level 1 gap (e.g., "Anthropic shipped a new caching primitive") triggers:

- **Level 1**: graph data updated; schema extended if a new attribute or NodeKind is needed.
- **Level 2**: node-kind specs under `schema/node-kinds/` updated; example YAMLs added; `coverage-checklist.md` updated.
- **Level 3**: any process docs that referenced the now-stale state are updated (this document, release notes, runbooks).
- **Level 4**: regenerate affected wiki pages (new Capability page, updated Product page, updated glossary entries).
- **Level 5**: any code paths that depend on the changed claim (validators, generators, runtime helpers) updated.
- **Level 6**: SDK signatures regenerated; type tests updated.
- **Level 7**: user-facing interfaces (CLI flags, dashboard widgets) updated.

Track propagation explicitly in the gap entry's `propagationStatus` field (Section 6). A gap is **not** closed until every applicable level is `done`. Levels that genuinely don't apply must be set to `not-applicable` with a one-line reason.

The cascade rule prevents the most common failure mode of the debt loop: closing a high-priority gap at its origin level and leaving downstream projections inconsistent.

---

## 5. Adversarial review

Every gap closure goes through an **independent adversarial reviewer** before it's marked closed. The reviewer reads the proposed change against this spec and the schema, looking specifically for:

- Missing cascade steps (Level N fixed, Level N+k forgotten).
- Evidence that doesn't support the claim, or evidence outside the freshness window.
- Schema changes without corresponding `versioning.md` bumps.
- Generator output drift not reflected in tests.
- Hidden coupling — a "small" change at one level that silently shifts behavior at another.

The reviewer **must be a different identity** from the implementer: a different agent invocation, a different human, or both. Same-identity review is structurally blind to the implementer's assumptions and is rejected. The reviewer's findings either gate the close (must-fix) or attach as follow-up gap nodes (next-cycle).

---

## 6. Tracking

Gaps are **first-class graph entities**. We extend `ontology-schema.yaml` with a new `NodeKind: Gap` so the debt loop is itself part of the graph and visible to every generator.

### `Gap` node attributes

| Attribute | Type | Notes |
|---|---|---|
| `id` | string | `GAP-<level>-<priority>-<slug>` |
| `title` | string | One-line human title |
| `level` | int (1–7) | Per Section 3 |
| `priority` | enum | `P0` \| `P1` \| `P2` \| `P3` |
| `discoveredAt` | timestamp | When first noted |
| `source` | string | URL, channel, or person |
| `currentState` | text | What the system says today |
| `desiredState` | text | What it should say |
| `propagationStatus` | object | Per-level: `not-started` \| `in-progress` \| `done` \| `not-applicable` (with reason) |
| `owner` | ref → Authority | Per Section 8 |
| `evidenceLinks` | list → SourceRef | Per `04-evidence-model.md` |
| `status` | enum | `open` \| `in-progress` \| `closed` \| `deferred` |
| `notes` | text | Free-form |
| `propagationChain` | list of `{level, fix, by, at}` | Audit trail |

Each tracked gap also has a markdown file at `C:/work/v6/graph/wiki/process/gaps/GAP-<level>-<priority>-<slug>.md` (the human-readable form). The YAML form lives in `C:/work/v6/graph/catalog-meta/gaps/` like every other graph entity. The two are kept in sync by a generator (one of the Phase 3 deliverables, added to the `schema/derivation-spec.md` list as the eleventh output).

---

## 7. Iteration cadence

| Level | Cadence |
|---|---|
| 1 — Real world vs graph | Continuous monitoring; weekly batch review |
| 2 — Graph vs docs | Every PR (CI gate) |
| 3 — Process docs | Monthly |
| 4 — Generators / wiki | Every PR (regenerate-on-merge) + weekly full regeneration |
| 5 — Code vs docs | Every PR + every release |
| 6 — SDK | Every release |
| 7 — Interfaces | Every release |

P0 gaps at any level interrupt cadence and are addressed immediately.

---

## 8. Governance

| Role | Scope |
|---|---|
| **Schema owner** | Phase 1 deliverables; final say on `ontology-schema.yaml` shape |
| **Graph data owners** | Phase 2; one per node-kind cluster (e.g., one for `capabilities` + `channels-hooks`, one for `agent-stack` + `extensions-plugins`, etc.) |
| **Generator owners** | Phase 3; one per generator listed in `schema/derivation-spec.md` |
| **Wiki editors** | Phase 4; navigation, search, page templates (content itself is generated) |
| **QA owner** | Phase 5; CI, versioning, distribution, evidence-boundary enforcement |
| **Debt-loop coordinator** | Cross-cutting; ensures the cascade rule (Section 4) is applied on every gap closure; runs the weekly Level-1 batch review |

All owners are represented as `Authority` nodes in the graph and referenced from the `owner` field of `Gap` nodes.

---

## 9. Acceptance gates

A phase is complete when **all** of the following hold:

1. Its deliverables (Section 2) exist and are in the repo.
2. Tests pass — unit, integration, and any e2e tests that apply at that phase.
3. Adversarial review (Section 5) signs off on the phase's deliverables as a whole.
4. A debt-loop pass at the current phase's level finds **no P0 or P1 gaps**. P2/P3 gaps may remain open with explicit deferral.

Gates are evaluated at PR merge time (per-deliverable) and at phase-close time (overall).

---

## 10. Deliverables enumeration

- **Schema**: meta-schema + 14 node-kind specs + `ontology-schema.yaml` + `attribute-types.yaml` + `invariants.yaml` + evidence model + validation rules + derivation spec + versioning + coverage checklist + `Gap` NodeKind tracking.
- **Graph**: full population per NodeKind, with evidence, under `C:/work/v6/graph/`.
- **Generators**: 10+ per `schema/derivation-spec.md`, plus the `Gap` markdown<->YAML sync generator.
- **Wiki**: full encyclopedia + navigation + search; one page per Term, Product, Capability, Hook, Channel, Stack layer.
- **QA**: tests + e2e + evidence-boundary checks + coverage report + versioning policy + CI/CD + downstream artifact distribution.
- **Code**: validators, generators, and runtime helpers — all derived from / driven by the schema.
- **SDK**: programmable interfaces (TypeScript types, runtime helpers) generated from the schema contract.
- **Interfaces**: user-facing surfaces (CLI, dashboard, docs site) consuming the SDK.

---

## 11. Open questions about the process itself

- Should `Gap` nodes participate in the same evidence-freshness rules as factual nodes, or do they get their own freshness policy (e.g., open >90 days = auto-escalate priority)?
- Where does the Level-1 monitoring tooling itself live — inside this repo, or as a separate side-car? (Affects how the weekly batch review is automated.)
- Who arbitrates when two graph data owners disagree on a cross-cluster edge? Default: schema owner; needs confirmation.
- Is "adversarial review by a different agent invocation" sufficient, or must at least one human reviewer be in the loop for schema changes? Lean: human-required for schema, agent-sufficient for graph data.
- Cascade rule defines top-down propagation. Do we ever need bottom-up propagation (e.g., interface constraint forcing a schema change)? If so, that's a Level-1 gap with the interface as `source` — confirm this framing is sufficient.
