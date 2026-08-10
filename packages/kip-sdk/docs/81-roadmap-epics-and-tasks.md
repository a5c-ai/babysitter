# Roadmap epics, tasks & dependency WBS

> The detailed, dependency-ordered work-breakdown structure (WBS) behind the milestone view in [80-roadmap-and-milestones.md](./80-roadmap-and-milestones.md): 13 epics → 76 tasks → 193 subtasks, with every dependency edge drawn explicitly.

**This is the INDEX file.** The legend, the id scheme, and the full task-level dependency graph live below. The **task bodies themselves** (each `T#.#`'s Goal/Implements/Exit-criteria/Depends-on/Subtasks) are split into eleven per-milestone files — see [Per-milestone task files](#per-milestone-task-files) for the table of contents.

**Source:** SPEC + docs/10,11,60,80.

> [!IMPORTANT]
> This is a **DEPENDENCY-ORDERED** work-breakdown structure. It contains **NO timelines, durations, dates, sprints, or effort estimates** — sequencing here is determined **by dependency only** (a task may begin once the tasks it `Depends on` exist). Reading order within an epic follows the dependency edges, not any calendar. The words *timeline*, *estimate*, and *duration* appear in this document **only** in this disclaimer; no time unit is ever attached to any epic, task, or subtask.

---

## Legend

**Id scheme.**

- **`E#`** — an **epic** (a coherent subsystem of work), e.g. `E4`.
- **`T#.#`** — a **task** inside an epic, e.g. `T4.3` (the third task of epic `E4`).
- **`T#.#.#`** — a **subtask** inside a task, e.g. `T4.3.1` (the first subtask of `T4.3`).

**Each task records three things.**

- **Implements:** the functional / non-functional requirement ids it realizes — **FR-\*** and **NFR-\***. Each id links to its **per-id anchor** (an `<a id="fr-a1">`-style tag placed on every bold id label) in [./10-functional-requirements.md](./10-functional-requirements.md) (FR) / [./11-non-functional-requirements.md](./11-non-functional-requirements.md) (NFR) — the link lands on the exact requirement, machine-checkable by the docs link-check CI job.
- **Exit criteria:** the conformance invariant ids that must pass for the task to be done — **INV-\*** / **INV-A\*** — each linking to its per-id anchor in [./60-conformance-and-testability.md](./60-conformance-and-testability.md). A blank exit-criteria line means the task has no *direct* gating INV; it is exercised through the tasks that depend on it.
- **Depends on:** the task ids that must exist first (the load-bearing ordering). Since the WBS is split into per-milestone files (below), these render as an **in-page** anchor link when the dependency lives in the *same* split file, or a **cross-file** link of the form `./81x-tasks-mN.md` + the task's in-file anchor when it lives in a *different* one — never a bare in-page anchor reaching across files.

**Dependency-respecting epic order.** Epics appear in an order consistent with the edges: `E1 → E2 → E3 → E4 → E5 → E6 → E7 → E8 → E9 → E10 → E11 → E12 → E13`. Within an epic, tasks are listed in their own dependency-respecting order.

> [!NOTE]
> **Maintenance — id anchors are hand-authored, but now machine-checked.** Each same-file or cross-file dependency link resolves through an explicit id-anchor tag placed on the task heading (not a GitHub auto-generated heading slug) in whichever per-milestone file owns that task, and each FR/NFR/INV link resolves through a per-id anchor tag in 10/11/60. Adding, renumbering, or removing an id — or moving a task to a different split file — means hand-editing both the anchor tag and every link that targets it, in whichever file(s) hold them. The **docs link-check CI job** (`.github/workflows/kip-docs-link-check.yml`, running `packages/kip-sdk/scripts/check-doc-links.mjs` over `packages/kip-sdk`) fails the build on any dangling relative link or missing anchor — a dropped/mistyped anchor is no longer silent, and it catches a same-file link left behind after a task moves files.

---

## Per-milestone task files

The 13 epics / 76 tasks / 193 subtasks are split into per-milestone files, one per row of the [80 milestone → epic map](./80-roadmap-and-milestones.md#milestone--epic-map), kept alongside this index (no path adjustment needed for their FR/NFR/INV links into 10/11/60):

| File | Milestone | Epic(s) |
|---|---|---|
| [81a-tasks-m0.md](./81a-tasks-m0.md) | M0 — Git substrate, fact envelope & signature-only gate | E1 |
| [81b-tasks-m1.md](./81b-tasks-m1.md) | M1 — Projection & convergence: proj, /heads, reducers | E2 |
| [81c-tasks-m2.md](./81c-tasks-m2.md) | M2 — Bitemporality & as-of | E3 |
| [81d-tasks-m3.md](./81d-tasks-m3.md) | M3 — Synchronization, merge & deterministic regeneration | E4 |
| [81e-tasks-m4.md](./81e-tasks-m4.md) | M4 — Retrieval & indexing | E5 |
| [81f-tasks-m5.md](./81f-tasks-m5.md) | M5 — Active knowledge: contextual functionalities | E6 |
| [81g-tasks-m6.md](./81g-tasks-m6.md) | M6 — Active knowledge: autoencoding (learn) | E7 |
| [81h-tasks-m7.md](./81h-tasks-m7.md) | M7 — Active knowledge: acquisition families | E8 |
| [81i-tasks-m8.md](./81i-tasks-m8.md) | M8 — Security / tenancy / DoS hardening | E9, E10 |
| [81j-tasks-m9.md](./81j-tasks-m9.md) | M9 — Conformance suite (full INV + INV-A) | E12 |
| [81k-tasks-cross-cutting.md](./81k-tasks-cross-cutting.md) | *(cross-cutting / operational — threads across milestones, see [80](./80-roadmap-and-milestones.md#milestone--epic-map))* | E11 (SDK surface), E13 (tooling & ops) |

---

## Dependency graph (task-level)

Nodes are tasks (`id` + short title); edges are the `Depends on` relation (an arrow `A --> B` means **B depends on A** — A must exist first). Subgraphs group tasks by epic. The edges below mirror the skeleton exactly.

```mermaid
flowchart LR
  subgraph E1["E1 · Git substrate, fact envelope & signature-only gate"]
    T1_1["T1.1 Object/ref layout + frozen manifest"]
    T1_2["T1.2 Fact envelope & canonical signed payload"]
    T1_3["T1.3 Signature-only ingest gate"]
    T1_4["T1.4 Dual-id: CID + namespaced EID"]
    T1_5["T1.5 Batched commit & durability signalling"]
    T1_6["T1.6 Idempotent ingestion (CID dedup)"]
  end
  subgraph E2["E2 · Projection & convergence"]
    T2_1["T2.1 orderKey total order"]
    T2_2["T2.2 proj fold pipeline"]
    T2_3["T2.3 Cell reducers"]
    T2_4["T2.4 Versioned upcasters"]
    T2_5["T2.5 Interval geometry & first-class unknown"]
    T2_6["T2.6 Conflict surfacing"]
    T2_7["T2.7 Read API: getNode/getEdge & traversal"]
  end
  subgraph E3["E3 · Bitemporality & as-of"]
    T3_1["T3.1 Bitemporal envelope"]
    T3_2["T3.2 asOf reads (valid-time & belief lens)"]
    T3_3["T3.3 Tombstone (logical forgetting)"]
    T3_4["T3.4 Soft-forget"]
    T3_5["T3.5 Frontier-addressed pins (SnapshotRef)"]
    T3_6["T3.6 Memory dynamics seams"]
  end
  subgraph E4["E4 · Synchronization, merge & deterministic regeneration"]
    T4_1["T4.1 HLC fully wired"]
    T4_2["T4.2 Sync: set-union delta"]
    T4_3["T4.3 Explicit merge & /heads regeneration"]
    T4_4["T4.4 Branch-per-replica topology"]
    T4_5["T4.5 Two-layer reconciliation & supersede"]
    T4_6["T4.6 Excision & deterministic DAG regen"]
    T4_7["T4.7 As-of across excision & placeholders"]
    T4_8["T4.8 Incremental update stream (subscribe)"]
  end
  subgraph E5["E5 · Retrieval & indexing"]
    T5_1["T5.1 Incremental content-addressed indexing"]
    T5_2["T5.2 Vector ANN accelerator projection"]
    T5_3["T5.3 Salience projection"]
    T5_4["T5.4 Bounded graph expansion"]
    T5_5["T5.5 Hybrid recall pipeline (RRF)"]
    T5_6["T5.6 Reproducible recall under fixed asOf"]
  end
  subgraph E6["E6 · Active knowledge: contextual functionalities"]
    T6_1["T6.1 Microagent manifests & FunctionalityBinding"]
    T6_2["T6.2 ContextualQuery compile -> Segment DAG"]
    T6_3["T6.3 Step execution & orchestrator-only authoring"]
    T6_4["T6.4 N5-safe step outcomes"]
    T6_5["T6.5 Multi-segment/multi-realizer typed choice"]
    T6_6["T6.6 AnswerGraph from derived_from"]
    T6_7["T6.7 Hop idempotence & node-merge (same_as)"]
  end
  subgraph E7["E7 · Active knowledge: autoencoding (learn)"]
    T7_1["T7.1 Explicit microagent selection"]
    T7_2["T7.2 Autoencoding loop with disjunctive budget"]
    T7_3["T7.3 Accept-if-improved & rawKind threading"]
    T7_4["T7.4 Record result as facts"]
    T7_5["T7.5 Loss-exclusion & replica-fold"]
  end
  subgraph E8["E8 · Active knowledge: acquisition families"]
    T8_1["T8.1 runAcquisition dispatch & authoring"]
    T8_2["T8.2 AcquisitionResult -> facts mapping"]
    T8_3["T8.3 Source provenance, EID dedup & quarantine"]
    T8_4["T8.4 Open-set extensibility & conflict"]
  end
  subgraph E9["E9 · Security, trust & tenancy"]
    T9_1["T9.1 Scoped key auth & genesis-root chaining"]
    T9_2["T9.2 Gate/proj separation & trust demotion"]
    T9_3["T9.3 Set-resident anti-backdating & causedBy"]
    T9_4["T9.4 Revocation modes & re-attest"]
    T9_5["T9.5 Tenancy scoping & secret redaction"]
    T9_6["T9.6 Provenance & fsck"]
  end
  subgraph E10["E10 · Admission control & retention"]
    T10_1["T10.1 Set-pure RetentionClass"]
    T10_2["T10.2 Quarantine pool budgets"]
    T10_3["T10.3 Cap-bounded key-chain-durable retention"]
    T10_4["T10.4 Anti-backdating under eviction"]
    T10_5["T10.5 Per-shared-subset SEC"]
  end
  subgraph E11["E11 · SDK surface"]
    T11_1["T11.1 Write API surface"]
    T11_2["T11.2 Read & query API surface"]
    T11_3["T11.3 Sync, pin & subscribe API surface"]
    T11_4["T11.4 Retrieval & provenance API surface"]
    T11_5["T11.5 Forgetting & security API surface"]
  end
  subgraph E12["E12 · Conformance suite (full INV + INV-A)"]
    T12_1["T12.1 Determinism harness"]
    T12_2["T12.2 Convergence & substrate INV suite"]
    T12_3["T12.3 Bitemporal & projection INV suite"]
    T12_4["T12.4 Excision & regenerated-DAG INV suite"]
    T12_5["T12.5 Trust, anti-backdating & retention INV suite"]
    T12_6["T12.6 Active-layer INV-A suite"]
  end
  subgraph E13["E13 · Tooling & ops"]
    T13_1["T13.1 CLI surface"]
    T13_2["T13.2 fsck CLI & integrity reporting"]
    T13_3["T13.3 Rollup & read-latency snapshots"]
    T13_4["T13.4 Packing & GC of unreachable objects"]
    T13_5["T13.5 Observability over runs & projections"]
  end

  %% E1
  T1_1 --> T1_2
  T1_2 --> T1_3
  T1_2 --> T1_4
  T1_2 --> T1_5
  T1_3 --> T1_5
  T1_2 --> T1_6
  T1_3 --> T1_6
  %% E2
  T1_6 --> T2_1
  T2_1 --> T2_2
  T2_2 --> T2_3
  T2_2 --> T2_4
  T2_2 --> T2_5
  T2_3 --> T2_6
  T2_5 --> T2_7
  %% E3
  T2_5 --> T3_1
  T3_1 --> T3_2
  T2_5 --> T3_3
  T3_3 --> T3_4
  T3_2 --> T3_5
  T3_1 --> T3_6
  %% E4
  T2_2 --> T4_1
  T1_2 --> T4_1
  T4_1 --> T4_2
  T1_6 --> T4_2
  T4_2 --> T4_3
  T2_6 --> T4_3
  T4_3 --> T4_4
  T4_3 --> T4_5
  T4_4 --> T4_6
  T3_5 --> T4_6
  T4_6 --> T4_7
  T4_4 --> T4_8
  %% E5
  T4_4 --> T5_1
  T5_1 --> T5_2
  T5_1 --> T5_3
  T2_7 --> T5_4
  T4_4 --> T5_4
  T5_2 --> T5_5
  T5_3 --> T5_5
  T5_4 --> T5_5
  T5_5 --> T5_6
  T3_2 --> T5_6
  %% E6
  T4_4 --> T6_1
  T2_4 --> T6_1
  T6_1 --> T6_2
  T5_4 --> T6_2
  T6_2 --> T6_3
  T6_3 --> T6_4
  T6_2 --> T6_5
  T6_3 --> T6_6
  T6_3 --> T6_7
  T1_6 --> T6_7
  %% E7
  T6_1 --> T7_1
  T7_1 --> T7_2
  T7_2 --> T7_3
  T7_2 --> T7_4
  T7_4 --> T7_5
  T2_3 --> T7_5
  %% E8
  T6_3 --> T8_1
  T7_4 --> T8_1
  T8_1 --> T8_2
  T6_7 --> T8_2
  T8_2 --> T8_3
  T8_1 --> T8_4
  %% E9
  T4_4 --> T9_1
  T2_2 --> T9_1
  T9_1 --> T9_2
  T1_3 --> T9_2
  T9_2 --> T9_3
  T9_2 --> T9_4
  T9_1 --> T9_5
  T9_1 --> T9_6
  T4_6 --> T9_6
  %% E10
  T9_3 --> T10_1
  T10_1 --> T10_2
  T10_1 --> T10_3
  T10_3 --> T10_4
  T9_3 --> T10_4
  T10_4 --> T10_5
  %% E11
  T1_5 --> T11_1
  T1_6 --> T11_1
  T2_7 --> T11_2
  T3_2 --> T11_2
  T4_2 --> T11_3
  T4_8 --> T11_3
  T3_5 --> T11_3
  T5_5 --> T11_4
  T9_6 --> T11_4
  T4_6 --> T11_5
  T6_3 --> T11_5
  T7_2 --> T11_5
  T8_1 --> T11_5
  T9_4 --> T11_5
  T9_5 --> T11_5
  %% E12
  T2_2 --> T12_1
  T2_3 --> T12_1
  T4_3 --> T12_1
  %% T4_3 edge applies to subtask T12.1.2 only (replay-across-merge); T12.1.1/T12.1.3 need only T2.2/T2.3 (m7-27)
  T12_1 --> T12_2
  T1_6 --> T12_2
  T9_2 --> T12_2
  T12_1 --> T12_3
  T3_2 --> T12_3
  T5_1 --> T12_3
  T12_1 --> T12_4
  T4_6 --> T12_4
  T12_1 --> T12_5
  T9_4 --> T12_5
  T9_3 --> T12_5
  T10_5 --> T12_5
  T12_1 --> T12_6
  T6_7 --> T12_6
  T7_5 --> T12_6
  T8_4 --> T12_6
  %% E13
  T11_1 --> T13_1
  T11_3 --> T13_1
  T9_6 --> T13_2
  T4_4 --> T13_3
  T4_6 --> T13_4
  T11_4 --> T13_5
  T10_5 --> T13_5
```

---

## Dependency roots

The starting points — tasks with **no** `Depends on` edges, from which the entire WBS unfolds:

- [T1.1](./81a-tasks-m0.md#T1.1) — Object & ref layout + frozen manifest (the single foundation task; every other task transitively depends on it).
