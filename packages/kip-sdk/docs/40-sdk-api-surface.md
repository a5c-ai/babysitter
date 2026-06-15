# SDK API surface

Purpose: the `Kip` / `Repo` interface — lifecycle, transactional writes (facts are the only writable
thing), convenience folds, reads, distribution, provenance/ops, and the §5b active-layer seams.

Source: SPEC §6 (2694–2810). The shapes below are **illustrative-normative**: the core is deliberately
small; everything else (context assembly, LLM extraction, embedding) is a **client of these seams**.

---

## Authoring inputs

```ts
/** The signed-fact AUTHORING inputs (the substrate's only writable shapes, §4.1). An author supplies the
 *  intent fields of a `Fact` (`target`, `value?`, valid-time, `causedBy?`, `provenance`, …) AND stamps and
 *  signs the schema version `v` (it is part of the canonical signed payload, §2.4); kip fills only the
 *  derived `id`/`FactId` (= CID of the canonical payload) and the audit-only `rxFrom` annotation — never
 *  `v`. `AssertInput` carries `type: "assert"`, `RetractInput` `type: "retract"` (a bounded `validTo`).
 *  §5b REUSES these names (it does NOT invent its own). */
type AssertInput = Omit<Fact, "id" | "type"> & { type: "assert" };
type RetractInput = Omit<Fact, "id" | "type"> & { type: "retract" };
```

`AssertInput` / `RetractInput` are the substrate's **only** writable shapes — see
[the data model](./21-data-model.md) for the `Fact` envelope and
[the git substrate](./22-git-substrate.md) for how a fact becomes a commit.

---

## `Kip` — lifecycle / substrate

```ts
interface Kip {
  // --- lifecycle / substrate ---
  open(opts: OpenOptions): Promise<Repo>;          // open/clone a memory repo (git dir + manifest)
}
```

---

## `Repo` — the working surface

```ts
interface Repo {
  branch(): string;                                 // current replica/session branch
  withScope(scope: ScopeRef): Repo;                 // tenant/namespace lens (§8)

  // --- transactional writes (facts are the ONLY writable thing) ---
  txn<T>(fn: (tx: Tx) => Promise<T>): Promise<{ result: T; commit: CID }>; // one commit per txn
  commit(message?: string): Promise<CID>;           // flush auto-batched facts

  // --- facts ---  (author signs incl. HLC; ingest GATE = SIGNATURE VALIDITY ONLY; key-registration,
  //   authority, revocation, drift/backdating are ALL proj-time demotions, NOT gates; schema is NOT a gate)
  assertFact(input: AssertInput): Promise<{ factId: FactId; status: "pending" | "durable" }>; // m-9
  retractFact(input: RetractInput): Promise<{ factId: FactId; status: "pending" | "durable" }>;

  // --- convenience folds over facts (sugar; emit facts under the hood) ---
  putNode(node: NodePut): Promise<EID>;             // → assert node-existence + prop facts
  putEdge(edge: EdgePut): Promise<EID>;             // → assert edge + edge-prop facts

  // --- reads ---
  getNode(eid: EID, asOf?: AsOf): Promise<NodeView | null>;
  getEdge(eid: EID, asOf?: AsOf): Promise<EdgeView | null>;
  query(spec: TraversalSpec): AsyncIterable<NodeView | EdgeView>;   // typed graph traversal
  recall(q: RecallQuery): Promise<RecallResult[]>;                  // hybrid vector+graph+RRF
  asOf(asOf: AsOf): Promise<ReadView>;                             // bitemporal snapshot lens

  // --- distribution ---
  pin(scope: ScopeRef, asOf?: AsOf): Promise<SnapshotRef>;          // frontier-addressed snapshot (survives excision)
  sync(remote: RemoteRef, opts?: SyncOptions): Promise<SyncReport>; // fetch/push facts + set-union merge
  merge(from: BranchRef, opts?: MergeOptions): Promise<MergeReport>;// explicit merge (convergent; heads regen-not-merge)
  subscribe(scope: ScopeRef, since?: Frontier): AsyncIterable<FactDelta>; // frontier cursor (m-5)

  // --- provenance / ops ---
  provenanceOf(ref: EID | FactId): Promise<Provenance[]>;
  rollup(opts: RollupOptions): Promise<CID>;        // read-latency snapshot (does NOT free bytes, §3.5)
  tombstone(eid: EID, reason: string): Promise<FactId>;        // logical, signature-preserving (§4.5)
  excise(factId: FactId, reason: string): Promise<ExcisionMarker>; // PHYSICAL erasure; requires `excise` scope (§4.5, m-11)
  revokeKey(keyFpr: string, effectiveFrom: HlcStamp, reason: string, mode?: "ordinary-cutoff" | "causal-cutoff"): Promise<FactId>; // effectiveFrom is AUTHOR-HLC, compared to each fact's author-HLC in proj (C-6, M2-5) — NOT rxFrom. mode default "ordinary-cutoff" (M4-1): causal-cutoff is opt-in for key COMPROMISE and surfaces honest-concurrent casualties as kip:revoked-concurrent.
  fsck(): Promise<FsckReport>;                       // verify heads == proj(facts); verify all FACT signatures + author-HLC authority chain. Does NOT check commit signatures (transport, M2-2).

  // --- active knowledge (§5b) — thin clients that COMPILE TO FACTS (like putNode/putEdge) ---
  registerFunctionality(edgeKind: EdgeKind, manifest: MicroagentManifest): Promise<FactId>; // → signed microagent-registration + EdgeKind FunctionalityBinding facts; ADDITIVE — N realizers MAY bind one (edgeKind,sourceKind,targetKind), enumerated as Segment.alternatives, never silently picked (N5, INV-A7); descriptor is advisory selection only, NOT a gate (§5b.1)
  runContextualQuery(q: ContextualQuery): Promise<AnswerGraph>;                              // compile+match = PURE READ over proj at q.asOf (default now); execute = dispatch bound microagents; emits signed assert + derived_from facts that RECORD the resolved asOf in provenance; AnswerGraph is the derived_from subgraph read back (§5b.1, INV-A8). Multiple segments ⇒ typed choice, never auto-picked (N5, INV-A7). Reproducible only against the recorded asOf (R5).
  runAcquisition(manifest: MicroagentManifest, input: unknown, opts?: { asOf?: AsOf }): Promise<{ facts: FactId[] }>; // dispatches a STANDALONE Miner/Discoverer/Ingestor/RDF family microagent (not edge-bound) and commits its AcquisitionResult.proposed as signed facts (quarantined until trusted; same_as → signed same_as facts); orchestrator-only assertFact path (§5b.3, INV-A1)
  learn(rawRef: BlobRef, opts: LearnOptions): Promise<{ facts: FactId[]; loss: number; status: "accept" | "exhausted" }>; // SELECTS the encode/decode/learner/loss microagents explicitly from LearnOptions.{encode,decode,learner,loss} (name+version of registered manifests — NEVER a heuristic pick by rawKind, N5; the §5b.2 dual of registerFunctionality) and threads LearnOptions.rawKind unchanged into DecodeAgent.rawKind; seeds LearnerLoopState.threshold from LearnOptions.threshold and LearnerLoopState.budget from {maxIterations,maxWallMs,maxInvocations} (the two MUST agree — they name one contract); runs the autoencoding loop OUTSIDE proj under that budget cap (disjunctive: ANY axis); on accept, commits a signed kip:learn fact naming inputs (rawRef + the selected manifest (name,version)s) + achieved loss; on exhausted, commits a signed kip:learn-exhausted marker and NO accept fact (§5b.2)
}
```

<a id="learnoptions"></a>

```ts
interface LearnOptions {
  threshold: number; maxIterations: number; maxWallMs: number; maxInvocations: number; asOf?: AsOf;
  /** Content-kind of `rawRef` (e.g. "text/markdown", "image/png"); threaded UNCHANGED into every
   *  `DecodeAgent.rawKind` (a bare `BlobRef` is `{ blob: CID }` only, §255, so the kind is declared here). */
  rawKind: string;
  /** The encode/decode/learner/loss microagent SELECTION — `(name, version)` of each registered
   *  `MicroagentManifest` the loop dispatches for THIS run. The explicit manifest-selection seam (the
   *  §5b.2 dual of `registerFunctionality`): kip NEVER silently picks a manifest by `rawKind` or any
   *  heuristic (N5) — the caller names exactly which agents realize the loop, and those `(name,version)`
   *  pairs are recorded in the `kip:learn` fact's key. An unregistered/unsigned named manifest is
   *  rejected, never substituted. */
  encode: { name: string; version: string };
  decode: { name: string; version: string };
  learner: { name: string; version: string };
  loss: { name: string; version: string };
}

interface SyncReport { received: number; sent: number; merged: number; conflicts: Conflict[]; tip: CID; }
```

---

## Design notes (normative)

- **`assertFact` / `retractFact` are the substrate**; `putNode` / `putEdge` are thin sugar that compile
  to facts. There is **exactly one way to change state: append a signed fact**. The author stamps and
  signs the HLC; kip's **only** hard ingest gate is **signature validity** (a pure function of the
  fact's bytes, §3.2). Key-registration, namespace-authorization, revocation, **and** author-HLC
  causal-plausibility (anti-backdating) are **set-pure demotions inside `proj`** keyed on author-HLC
  (§3.6/§8), **never** ingest gates and **never** read against `rxFrom` or any receiver clock
  (C2-1, C3-1). The signature-only gate and proj-time demotion are detailed in
  [synchronization & convergence](./24-synchronization-and-convergence.md).
- **No `delete` / `update`** in the surface (accretion-only, §4.1). Forgetting is `tombstone` /
  `excise` — see [temporality & bitemporality](./23-temporality-and-bitemporality.md).
- **`sync` and `merge` are first-class**, returning typed `conflicts` (**never** auto-picked).
- **Durability is explicit:** `assertFact` returns `pending` until the commit publishes, then
  `durable` (m-9).
- **Determinism:** every read takes an optional `asOf`; default is `now` (current local frontier).
- **Active-layer seams are clients, the substrate is facts (§5b, INV-A1).**
  `registerFunctionality`, `runContextualQuery`, `runAcquisition`, and `learn` are **thin clients** in
  exactly the sense `putNode` / `putEdge` are: they ultimately call `assertFact`, so the *only* way
  they change state is by appending signed facts. A microagent (a bound functionality, an
  encode/decode/learner, a Miner/Discoverer/Ingestor) **never** touches the graph directly —
  **microagents are clients, never the substrate**.
  - `runContextualQuery` compiles + matches as a **pure read over `proj`** and emits its results — the
    `AnswerGraph` — as signed `assert` + `derived_from` facts that record the resolved `asOf`.
  - `runAcquisition` gives the standalone (non-edge-bound) Miner/Discoverer/Ingestor/RDF families a
    callable seam: it dispatches the family microagent and commits its `AcquisitionResult.proposed` as
    signed facts (quarantined until trusted).
  - `learn` runs the accelerator-class autoencoding loop **outside `proj`** under a hard budget cap
    **total over all three axes (disjunctive: ANY axis tripping its cap yields `exhausted`)** and, on
    convergence, records a signed `kip:learn` fact (or, on exhaustion, a `kip:learn-exhausted` marker)
    naming its inputs + achieved loss, so replicas **fold the recorded result and never re-run the
    loop** (§3.4/C-3).

  The ingest gate, `proj` purity, and convergence (§3.2, §3.4, §4b.4) are therefore **untouched** by
  the active layer.

---

## Cross-links by method

- **Facts** (`assertFact` / `retractFact` / `putNode` / `putEdge`) →
  [Git substrate](./22-git-substrate.md), [Data model](./21-data-model.md).
- **`recall` / `query`** → [Retrieval](./26-retrieval.md).
- **`asOf` / `tombstone` / `excise`** → [Temporality & bitemporality](./23-temporality-and-bitemporality.md).
- **`sync` / `merge` / `subscribe` / `pin`** →
  [Synchronization & convergence](./24-synchronization-and-convergence.md) and the frontier-addressed
  [context-enablement seams](./25-context-enablement-seams.md).
- **`revokeKey` / `fsck` / `withScope`** → [Security, trust & tenancy](./50-security-trust-tenancy.md).
- **Active seams** (`registerFunctionality` / `runContextualQuery` / `runAcquisition` / `learn`) →
  [Active knowledge overview](./30-active-knowledge-overview.md),
  [Contextual-relation functionalities](./31-contextual-functionalities.md),
  [Knowledge autoencoding](./32-knowledge-autoencoding.md),
  [Mining, discovery & ingestion](./33-mining-discovery-ingestion.md).
