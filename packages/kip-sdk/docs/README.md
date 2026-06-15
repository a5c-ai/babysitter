# kip-sdk Documentation

> The entry point: every pre-development doc, grouped by cluster, with a one-line purpose and its
> spec source — plus a suggested reading order.

**Source:** whole-spec map of `../SPEC.md`.

> **`../SPEC.md` (3555 lines) remains the single authoritative source.** This documentation set is a
> faithful decomposition for pre-development reading and planning. Where any doc and the spec
> disagree, the spec wins. Companion sources: `../PRIOR-ART.md` (prior-art survey) and
> `../SCORECARD.md` (six-round adversarial convergence record).

kip-sdk (**K**nowledge / **I**nference / **P**rovenance) is a git-substrate, bitemporal, signed-fact
property-graph memory: a **library, not a runtime**, whose unit of synchronization is an append-only
signed temporal fact, so coordinator-free agent replicas converge mechanically at the substrate and
supersede semantically above it. Start with [Vision & scope](./00-vision-and-scope.md).

---

## The convergence core (read these to understand the load-bearing guarantees)

These five invariants run through every document; nothing in the set may contradict them.

- **Signature-only ingest gate** (§3.2) — only a valid Ed25519 signature decides set membership.
- **Set-pure `proj`** (§3.4) — the read model is a deterministic, total, order-independent fold.
- **SEC** (§4b.4) — convergence = set-convergence + projection determinism.
- **Accelerator boundary** (§5.3) — ANN/embeddings are best-effort, not byte-identical.
- **N5 no-fallbacks** + **INV-A1 microagents-are-clients** — nothing is silently chosen; microagents
  never write the substrate directly.

---

## All documents, by cluster

### Overview

| Doc | Purpose | Source |
|---|---|---|
| [README.md](./README.md) | Reading order + one-line description and §-source of every doc; the entry point. | whole-spec map |
| [00-vision-and-scope.md](./00-vision-and-scope.md) | Thesis, what kip is / is not, goals G1–G8, non-goals N1–N5. | §1 |
| [glossary.md](./glossary.md) | Authoritative definitions: Fact, fact set, proj, EID, CID, HLC, INGEST-GATE, PROJ-demotion, microagent, functionality, learner, etc. | §1 Terminology + throughout |
| [prior-art.md](./prior-art.md) | The HP hard-problems / T tensions the spec resolves; pointer to PRIOR-ART.md and the scorecard. No new claims. | PRIOR-ART.md + SCORECARD.md |

### Requirements

| Doc | Purpose | Source |
|---|---|---|
| [10-functional-requirements.md](./10-functional-requirements.md) | Numbered FRs derived from spec capabilities (write/read/sync/recall/active-knowledge/security ops). Each FR cites its §. | §2–§6, §5b |
| [11-non-functional-requirements.md](./11-non-functional-requirements.md) | Convergence/determinism, storage bounds, performance, security, auditability, no-fallback NFRs. Each NFR cites its §/INV. | Goals + §3.5a, §4b.4, §5.3, §7, §8.3b |

### Architecture

| Doc | Purpose | Source |
|---|---|---|
| [20-architecture-overview.md](./20-architecture-overview.md) | Layering (substrate → deterministic projection → accelerator projection → active layer → context layer), component map, data-flow diagram. | synthesis of §2, §3, §4b, §5, §5b, §6 |
| [21-data-model.md](./21-data-model.md) | Nodes/edges/cells/segments, schema/ontology + upcasters, episodic vs semantic, provenance envelope. | §2 |

### Substrate

| Doc | Purpose | Source |
|---|---|---|
| [22-git-substrate.md](./22-git-substrate.md) | Object/ref layout, write→commit, branch/commit semantics, set-union merge + deterministic proj, GC/retention/admission-control, dual-id scheme. | §3 |
| [23-temporality-and-bitemporality.md](./23-temporality-and-bitemporality.md) | Fact envelope, valid/transaction time, as-of queries, decay/salience/consolidation, forgetting (tombstone vs excision). | §4 |

### Convergence (correctness core)

| Doc | Purpose | Source |
|---|---|---|
| [24-synchronization-and-convergence.md](./24-synchronization-and-convergence.md) | HLC, append-only log, two-layer reconciliation, the convergence guarantee/SEC, branch-per-agent, concurrency model. The load-bearing correctness doc. | §4b + §7 |
| [27-failure-and-conflict-model.md](./27-failure-and-conflict-model.md) | The single home for the failure/outcome taxonomy (reject-at-gate, proj-demotion/quarantine, `kip:conflict`, dispatch-failure, pending-guard, exhausted, pin-incomplete) and how each propagates up the layers. | N5 + §3.2/§3.4 + §5b synthesis |
| [60-conformance-and-testability.md](./60-conformance-and-testability.md) | The INV-* and INV-A* conformance invariant catalog as a test plan; what the shipped suite asserts. | §8.4 |

### Retrieval & API

| Doc | Purpose | Source |
|---|---|---|
| [25-context-enablement-seams.md](./25-context-enablement-seams.md) | pin/asOf/recall/subscribe/provenance seams the context layer consumes (kip provides seams, not the layer — N1). | §4c |
| [26-retrieval.md](./26-retrieval.md) | Hybrid vector→graph→RRF pipeline, typed as-of traversal, derived/incremental indexing, salience projection. | §5 |
| [28-stack-integration.md](./28-stack-integration.md) | How kip integrates with the rest of the stack (babysitter-sdk, genty, adapters, atlas, kradle): what kip consumes/provides, the seams used, data flow, and ALREADY-IN-SPEC / GROUNDED-NEW / SPECULATIVE status per point. | SPEC + real packages |
| [40-sdk-api-surface.md](./40-sdk-api-surface.md) | The Kip/Repo interface: lifecycle, facts, reads, distribution, provenance/ops, and the §5b active-layer seams. Illustrative-normative shapes. | §6 |

### Active knowledge

| Doc | Purpose | Source |
|---|---|---|
| [30-active-knowledge-overview.md](./30-active-knowledge-overview.md) | How contextual functionalities, autoencoding, and acquisition fit; INV-A1 (microagents are clients, never the substrate). | §5b intro |
| [31-contextual-functionalities.md](./31-contextual-functionalities.md) | EdgeKinds carrying microagents; ContextualQuery→Segment(DAG)→signed-fact execution; answer graph; conditional/constraint/inheritance; query DSL; composition-discovery. | §5b.1 |
| [32-knowledge-autoencoding.md](./32-knowledge-autoencoding.md) | encode→decode→reconstruction-loss→learner loop; bounded disjunctive budget; kip:learn recorded-as-fact; accelerator-vs-substrate boundary. | §5b.2 |
| [33-mining-discovery-ingestion.md](./33-mining-discovery-ingestion.md) | Miner/Discoverer/Ingestor families; data-resource→objects-of-interest→query→acquire pipeline; open-set extensibility; all emit signed source-provenanced facts. | §5b.3 |

### Security & planning

| Doc | Purpose | Source |
|---|---|---|
| [50-security-trust-tenancy.md](./50-security-trust-tenancy.md) | Root-of-trust/scoped-authority/revocation, tenancy & scoping, privacy/redaction/erasure, auditability, DoS/resource-exhaustion threat model. | §8.1–§8.3b |
| [70-decision-records-adr.md](./70-decision-records-adr.md) | Distill the spec's key decisions into ADR-format records (context / decision / consequences / rejected alternatives). No new decisions. | all D-*/C-*/M-* across the spec |
| [80-roadmap-and-milestones.md](./80-roadmap-and-milestones.md) | Pre-dev implementation roadmap: milestone ordering (substrate → proj → sync → retrieval → active layer), dependencies, what each milestone delivers. Planning only. Drills down into [81](./81-roadmap-epics-and-tasks.md) for the epic/task/subtask WBS. | synthesis (arch + requirements) |
| [81-roadmap-epics-and-tasks.md](./81-roadmap-epics-and-tasks.md) | The detailed dependency-ordered WBS behind [80](./80-roadmap-and-milestones.md): 13 epics → 76 tasks → 193 subtasks, each with Implements (FR/NFR) / Exit criteria (INV) / Depends-on edges, plus a task-level mermaid dependency graph. | synthesis (SPEC + docs/10,11,60,80) |
| [90-open-questions.md](./90-open-questions.md) | The explicitly-deferred non-core questions; faithful restatement with §-cites. | §9 |

---

## Suggested reading order

1. **[00-vision-and-scope.md](./00-vision-and-scope.md)** — the thesis, goals, and non-goals.
2. **[glossary.md](./glossary.md)** — keep open as a reference for every term below.
3. **[prior-art.md](./prior-art.md)** — the hard problems and tensions that motivate the design.
4. **[20-architecture-overview.md](./20-architecture-overview.md)** — the layering and component map.
5. **[21-data-model.md](./21-data-model.md)** — nodes, edges, cells, provenance.
6. **[22-git-substrate.md](./22-git-substrate.md)** — how facts become git objects.
7. **[23-temporality-and-bitemporality.md](./23-temporality-and-bitemporality.md)** — the time axes
   and forgetting.
8. **[24-synchronization-and-convergence.md](./24-synchronization-and-convergence.md)** — the
   correctness core (read carefully; everything depends on it). Then
   **[27-failure-and-conflict-model.md](./27-failure-and-conflict-model.md)** — the failure/outcome
   taxonomy that runs through every layer.
9. **[25-context-enablement-seams.md](./25-context-enablement-seams.md)** →
   **[26-retrieval.md](./26-retrieval.md)** → **[40-sdk-api-surface.md](./40-sdk-api-surface.md)** —
   the read/consumption surface. Then
   **[28-stack-integration.md](./28-stack-integration.md)** — how the rest of the stack
   (babysitter-sdk, genty, adapters, atlas, kradle) produces, consumes, and clients these seams.
10. **[30-active-knowledge-overview.md](./30-active-knowledge-overview.md)** →
    **[31-contextual-functionalities.md](./31-contextual-functionalities.md)** →
    **[32-knowledge-autoencoding.md](./32-knowledge-autoencoding.md)** →
    **[33-mining-discovery-ingestion.md](./33-mining-discovery-ingestion.md)** — the active layer.
11. **[50-security-trust-tenancy.md](./50-security-trust-tenancy.md)** — trust, tenancy, threat model.
12. **[10-functional-requirements.md](./10-functional-requirements.md)** +
    **[11-non-functional-requirements.md](./11-non-functional-requirements.md)** +
    **[60-conformance-and-testability.md](./60-conformance-and-testability.md)** — what must be built
    and how it is verified.
13. **[70-decision-records-adr.md](./70-decision-records-adr.md)** →
    **[80-roadmap-and-milestones.md](./80-roadmap-and-milestones.md)** →
    **[90-open-questions.md](./90-open-questions.md)** — decisions, plan, and what remains deferred.

> Readers focused only on the correctness guarantee can read 1–3, then jump straight to
> [24-synchronization-and-convergence.md](./24-synchronization-and-convergence.md) and
> [60-conformance-and-testability.md](./60-conformance-and-testability.md).
