# SDK API surface

Purpose: the `Kip` / `Repo` interface — lifecycle, transactional writes (facts are the only writable
thing), convenience folds, reads, distribution, provenance/ops, and the §5b active-layer seams.

Source: SPEC §6. The shapes below are **illustrative-normative**: the core is deliberately
small; everything else (context assembly, LLM extraction, embedding) is a **client of these seams**.

---

## Authoring inputs

```ts
/** The signed-fact AUTHORING inputs (the substrate's only writable shapes, §4.1). KIP — NOT the caller —
 *  stamps `hlc` and `seq` and produces the `signature`, using the keyring supplied at `open()`
 *  (`OpenOptions.keyring`, §4b.1/m7-1/A-3/A-5): the author supplies ONLY the intent fields of a `Fact`
 *  (`target`, `value?`, valid-time, `causedBy?`, the non-derived parts of `provenance`, …) and the schema
 *  version `v` (part of the canonical signed payload, §2.4). kip fills the derived `id`/`FactId` (= CID of
 *  the canonical payload), the AUTHOR-STAMPED-BY-KIP `hlc` (§4b.1) and `seq` (the per-`(replicaId,key)`
 *  chain-contiguity witness, minted at txn-commit boundary, A-5), the `signature` (Ed25519 over the
 *  canonical payload using the `open()`-scoped keyring), and the audit-only `rxFrom` annotation — never
 *  `v`. `AssertInput` carries `type: "assert"`, `RetractInput` `type: "retract"` (a bounded `validTo`).
 *  §5b REUSES these names (it does NOT invent its own).
 *
 *  Each input is NARROWED per discriminant (m7-24): `supersedes` is legal ONLY on type==="supersede"
 *  and `reAttests` ONLY on type==="re-attest" (§4.1), so an author cannot type-legally attach
 *  supersession metadata to a plain assert — the constraint is structural, not a runtime check. */
type AssertInput    = Omit<Fact, "id" | "hlc" | "seq" | "type" | "supersedes" | "reAttests"> & { type: "assert" };
type RetractInput   = Omit<Fact, "id" | "hlc" | "seq" | "type" | "supersedes" | "reAttests"> & { type: "retract" };
type SupersedeInput = Omit<Fact, "id" | "hlc" | "seq" | "type" | "reAttests"> & { type: "supersede"; supersedes: NonNullable<Fact["supersedes"]> };
type ReAttestInput  = Omit<Fact, "id" | "hlc" | "seq" | "type" | "supersedes"> & { type: "re-attest"; reAttests: FactId };
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
  //   Return type echoes the stamped envelope fields (id/hlc/seq) back to the caller — kip stamps these
  //   at commit time (§4b.1/A-5) and the caller otherwise has no way to learn the assigned values.
  assertFact(input: AssertInput): Promise<Pick<Fact, "id" | "hlc" | "seq"> & { status: "pending" | "durable" }>; // m-9
  retractFact(input: RetractInput): Promise<Pick<Fact, "id" | "hlc" | "seq"> & { status: "pending" | "durable" }>;
  supersedeFact(input: SupersedeInput): Promise<Pick<Fact, "id" | "hlc" | "seq"> & { status: "pending" | "durable" }>; // §4b.3/C-3
  reAttestFact(input: ReAttestInput): Promise<Pick<Fact, "id" | "hlc" | "seq"> & { status: "pending" | "durable" }>; // §8.1 M5-3 re-attest mechanism

  // --- gate-observable ingest seam (B-2) — accepts an ALREADY-SIGNED fact (e.g. from sync/import, or a
  //   hand-built test fixture) and reports the GATE VERDICT without throwing; distinct from the authoring
  //   methods above, which stamp+sign on the caller's behalf. This is the seam INV-6a/INV-13a drive: they
  //   need to offer a foreign-signed, deliberately malformed, or unregistered-key fact and observe the
  //   admit/reject verdict directly (§3.2 gate; admission is signature-only, never proj/trust — those are
  //   NOT evaluated by this call).
  //   On admission, ingest() performs the full write-through (gate + HLC/seq stamping is NOT re-applied
  //   since the fact is already signed — it goes straight to blob-write + commit + proj-rebuild, i.e.
  //   steps 2-6 of the §3.2 internal pipeline minus HLC-advance since seq/hlc are already fixed in the
  //   signed fact); on rejection, nothing is written. This is the same procedure INV-7a's conformance
  //   recipe re-runs and checks against `/facts` git-tree state (§3.2; see the SPEC.md §3.2 disambiguation
  //   note — assertFact/retractFact construct+sign a fact and then invoke this identical procedure).
  ingest(f: Fact): Promise<{ admitted: boolean; reason?: "malformed" | "signature-invalid" }>;

  // --- convenience folds over facts (sugar; emit facts under the hood) ---
  putNode(node: NodePut): Promise<EID>;             // → assert node-existence + prop facts
  putEdge(edge: EdgePut): Promise<EID>;             // → assert edge + edge-prop facts

  // --- reads ---
  getNode(eid: EID, asOf?: AsOf): Promise<NodeView | null>;
  getEdge(eid: EID, asOf?: AsOf): Promise<EdgeView | null>;
  query(spec: TraversalSpec): AsyncIterable<NodeView | EdgeView>;   // typed graph traversal
  recall(q: RecallQuery): Promise<RecallResult[]>;                  // hybrid vector+graph+RRF
  asOf(asOf: AsOf): Promise<ReadView>;                             // bitemporal snapshot lens
  nodeEids(opts?: { prefixes?: string[] }): Promise<EID[]>;         // read-only, sorted enumeration of every LIVE node eid (ADR-B11b, the entity-linker node-enumeration seam). Optionally restricted to `opts.prefixes` (an eid whose start matches ANY listed prefix, e.g. `["code:","doc:"]`). Derived from the current admitted set's node-existence scan and the LIVE frontier, so it EXCLUDES tombstoned/absent nodes. A pure read: authors NOTHING (INV-A1).
  sameAsClass(eid: EID): Promise<EID[]>;                            // read-only, sorted `same_as` equivalence class of `eid` (ADR-B11c/D-66, the retrieval prop-union seam) — every EID proj folds into `eid`'s union-find class, or `[eid]` when it has no `same_as` edge. Derived from proj's ALREADY-computed class members (no second closure), so it cannot diverge from the canonical-EID node-merge. A pure read: authors NOTHING (INV-A1).
  getNodeRaw(eid: EID, asOf?: AsOf): Promise<NodeView | null>;      // read-only, `eid`'s OWN NodeView BEFORE `same_as` canonical resolution (ADR-B11c/D-66) — identical to `getNode` for a non-alias eid; for a `same_as` alias it returns the alias's OWN props that `getNode` masks behind the canonical member's cells. Same live-existence gate + excision/`asOf` lens as `getNode`; differs ONLY in skipping the canonical collapse. The union-hydration seam behind the graph-qa prop-union. Authors NOTHING (INV-A1).

  // --- distribution ---
  pin(scope: ScopeRef, asOf?: AsOf): Promise<SnapshotRef>;          // frontier-addressed snapshot (survives excision)
  resolvePin(ref: SnapshotRef): Promise<{ status: "pin-incomplete" } | { status: "pin-complete"; factSetDigest: CID }>;
                                                    // re-resolve a pin against the CURRENT set — a DISCRIMINATED
                                                    //   return: "pin-incomplete" (no digest — not yet computable)
                                                    //   while any enumerated chain has a seq gap (§4c/m4-1/m7-2);
                                                    //   "pin-complete" + the recomputed digest once every
                                                    //   sub-frontier fact is held — the observable INV-14 drives
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
  registerFunctionality(edgeKind: EdgeKind, manifest: MicroagentManifest, binding?: Pick<FunctionalityBinding, "weight" | "condition" | "requires" | "relationClass" | "tags">): Promise<FactId>; // → signed microagent-registration + EdgeKind FunctionalityBinding facts; ADDITIVE — N realizers MAY bind one (edgeKind,sourceKind,targetKind), enumerated as Segment.alternatives, never silently picked (N5, INV-A7); descriptor is advisory selection only, NOT a gate (§5b.1). KNOWN GAP: the two-arg (edgeKind, manifest) shape shown elsewhere in this doc does not say how `FunctionalityBinding`'s weight/condition/requires fields enter — they are properties of the registered `FunctionalityBinding` fact (§5b.1/31-contextual-functionalities.md), so a conformant implementation MUST accept them via an optional third param (as here) or an equivalent binding-options object; this is not yet pinned in SPEC.md §6 and is called out rather than silently assumed.
  compileContextualQuery(q: ContextualQuery): Promise<Segment>;                              // PHASE 1 ONLY (m7-22): the pure read over proj at q.asOf — compile + match, alternatives enumerated on the returned Segment; NO dispatch, NO fact authored (§5b.1, INV-A2). The API channel through which the typed multi-segment/multi-realizer choice is SURFACED (INV-A7).
  executeSegment(segment: Segment, opts?: { asOf?: AsOf }): Promise<AnswerGraph>;            // PHASE 2 ONLY: execute ONE caller-chosen segment (topological order over deps); dispatches bound microagents; emits signed assert + derived_from facts recording the resolved asOf; AnswerGraph = the derived_from subgraph read back (§5b.1, INV-A8)
  runContextualQuery(q: ContextualQuery): Promise<AnswerGraph | { kind: "choice"; segments: Segment[] }>; // convenience compile+execute with a DISCRIMINATED return: exactly ONE match ⇒ executes it and returns the AnswerGraph; MULTIPLE matches ⇒ returns { kind:"choice", segments } and executes NOTHING until the caller picks one and calls executeSegment (N5, INV-A7 — never auto-picked). Reproducible only against the recorded asOf (R5).
  runAcquisition(manifest: MicroagentManifest, input: unknown, opts?: { asOf?: AsOf }): Promise<{ facts: FactId[] }>; // dispatches a STANDALONE Miner/Discoverer/Ingestor/RDF family microagent (not edge-bound) and commits its AcquisitionResult.proposed as signed facts (quarantined until trusted; same_as → signed same_as facts); orchestrator-only assertFact path (§5b.3, INV-A1)
  // --- the blob API (ADR-B10a) — bytes in, the SAME bytes out, and NEVER a member of S ---
  putBlob(content: Uint8Array): Promise<BlobRef>;                                           // stores `content` in the OID OBJECT STORE ONLY and returns { blob: <real git loose-object oid, sha1("blob <len>\0<bytes>")> } — content-addressed, so identical bytes yield the identical BlobRef and write one object. AUTHORS NO FACT: never writeFactBlob, nothing enters kip-facts-index.json, nothing is signed, and `proj` is byte-identical before and after — a blob is CONTENT, not knowledge, and is NOT a member of the admitted fact set S (ADR-B10a prohibition 2; this is what makes it safe under INV-A1 for a `learn()` microagent body, whose only write this is). Throws ERR_MALFORMED_INPUT when `content` is not a Uint8Array/Buffer.
  getBlob(ref: BlobRef): Promise<Uint8Array | null>;                                        // the inverse, with exactly three outcomes and no fourth: `null` when this repo genuinely does not hold `ref.blob` (never a zero-length buffer, never a partial read — callers MUST treat it as ABSENT and fail, which is what makes `learn()`'s encode/learner/loss bodies turn a miss into an honest failed iteration rather than prompting a model with no source, ADR-B10b/N5); the byte-identical content (UTF-8 or binary, NUL bytes included); or ERR_MALFORMED_INPUT — on a malformed `ref`, and on the INTEGRITY check, when the stored object re-hashes to something other than the oid it is filed under (a corrupt object store is loud; content is never returned under a hash it does not have). Reads the object store only: no facts, no `proj`, nothing in S.
  learn(rawRef: BlobRef, opts: LearnOptions): Promise<{ facts: FactId[]; loss: number; status: "accept" | "exhausted"; fabricated: string[] }>; // SELECTS the encode/decode/learner/loss microagents explicitly from LearnOptions.{encode,decode,learner,loss} (name+version of registered manifests — NEVER a heuristic pick by rawKind, N5; the §5b.2 dual of registerFunctionality) and threads LearnOptions.rawKind unchanged into DecodeAgent.rawKind; seeds LearnerLoopState.threshold from LearnOptions.threshold and LearnerLoopState.budget from {maxIterations,maxWallMs,maxInvocations} (the two MUST agree — they name one contract); runs the autoencoding loop OUTSIDE proj under that budget cap (disjunctive: ANY axis); on accept, commits a signed kip:learn fact naming inputs (rawRef + the selected manifest (name,version)s) + achieved loss + the loss model's `fabricated` indictment; on exhausted, commits a signed kip:learn-exhausted marker and NO accept fact (§5b.2). Returns `{facts, loss, status, fabricated}` — `fabricated` is that same persisted indictment surfaced to the caller (empty on exhausted / when nothing was indicted, ROUND-3 MAJOR #5)
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
   *  rejected BEFORE the loop runs, never substituted — surfaced by learn() THROWING a typed KipError
   *  with code ERR_UNREGISTERED_MANIFEST (see "Errors" below): no dispatch, no kip:learn /
   *  kip:learn-exhausted fact, cells stay Unknown (INV-A13). */
  encode: { name: string; version: string };
  decode: { name: string; version: string };
  learner: { name: string; version: string };
  loss: { name: string; version: string };
}

interface SyncReport { received: number; sent: number; merged: number; conflicts: Conflict[]; tip: CID; }
```

---

## Supporting API types (normative)

Every type the `Kip`/`Repo` surface names is defined — here for API-only shapes; value/envelope types
(`Fact`, `HlcStamp`, `HlcOrTime`, `ReplicaId`, `Provenance`, `NodeView`/`EdgeView`, `PropCell`) in the
[data model](./21-data-model.md); pin types (`SnapshotRef`, `Frontier`, `PinStatus`, `FactDelta`,
`ChainId`) in the
[context-enablement seams](./25-context-enablement-seams.md); active-layer shapes (`ContextualQuery`,
`Segment`, `AnswerGraph`, `MicroagentManifest`, `IsolationMode`) in
[contextual functionalities](./31-contextual-functionalities.md). Implementations MAY extend these
shapes with additional optional fields; they MUST NOT repurpose or drop a declared field. Minimum for
M0 (T1.5/T11.1): `OpenOptions`, `Tx`, `ScopeRef`, `HlcStamp`, `Conflict`, `FsckReport`.

```ts
interface OpenOptions {
  dir: string;                          // the git dir of the memory repo
  replicaId: ReplicaId;                 // this instance's stable author replicaId (§4b.1)
  keyring: unknown;                     // signing key material; MUST chain to the tenant root (§8.1)
  createIfMissing?: boolean;            // create (genesis) when dir is empty — requires `genesis`
  genesis?: {                           // REQUIRED at creation; IMMUTABLE thereafter (m2-5) — see §3.1
    hashAlgo: "sha1" | "sha256"; shardDepth: number; clockEpoch: number; epsilonCausalMs: number;
    regenBoundaryRule: string; rootKeys: string[];             // genesis tenant root fingerprints
    quarantineTtlMs: number; quarantineKeyCapBytes: number;    // retention caps (§3.5a) — genesis-final (R10)
    quarantinePoolBytes: number; keyChainDurableCapBytes: number;
    headsCommitted?: boolean;
  };
}

/** The transaction handle: the WRITE sub-surface of Repo whose facts batch into the txn's ONE commit
 *  (§3.2 commit granularity). No reads-with-side-effects, no nested txn. */
interface Tx {
  assertFact(input: AssertInput): Promise<Pick<Fact, "id" | "hlc" | "seq"> & { status: "pending" }>;   // durable at txn commit
  retractFact(input: RetractInput): Promise<Pick<Fact, "id" | "hlc" | "seq"> & { status: "pending" }>;
  supersedeFact(input: SupersedeInput): Promise<Pick<Fact, "id" | "hlc" | "seq"> & { status: "pending" }>; // §4b.3/C-3
  reAttestFact(input: ReAttestInput): Promise<Pick<Fact, "id" | "hlc" | "seq"> & { status: "pending" }>; // §8.1 M5-3 re-attest mechanism
  putNode(node: NodePut): Promise<EID>;
  putEdge(edge: EdgePut): Promise<EID>;
}

interface ScopeRef {
  tenant: string;                       // tenancy root (§8.2)
  namespace?: string;                   // frozen genesis namespaceId (§3.6); absent = all namespaces the key may read
  snapshot?: SnapshotRef;               // read against a pinned frontier instead of the live set
}

interface AsOf {                        // the bitemporal read selector (§4.2/§4.3)
  validTime?: HlcOrTime;                // convergent world-truth lens (default: now-frontier)
  txTime?: HlcStamp;                    // per-replica belief-audit lens — NON-convergent (M-5)
  believer?: ReplicaId;                 // whose rxFrom order the txTime lens reads (default: this replica)
}

interface NodePut {
  eid: EID; kind: NodeKind;
  props?: Record<PropKey, PropValue>;
  validFrom?: HlcOrTime; validTo?: HlcOrTime | null;
}
interface EdgePut {
  eid?: EID;                            // derived from (kind, from, to) when omitted
  kind: EdgeKind; from: EID; to: EID;
  props?: Record<PropKey, PropValue>;
  validFrom: HlcOrTime; validTo?: HlcOrTime | null;
}

/** Typed as-of traversal (§5.2). depth and maxFanout are MANDATORY — the declared bound INV-A10(c)
 *  enforces; there is no unbounded default (m7-21). */
interface TraversalSpec {
  seed: EID | EID[];
  direction: "out" | "in" | "both";
  edgeKinds?: EdgeKind[];
  depth: number;                        // REQUIRED hop bound
  maxFanout: number;                    // REQUIRED per-node expansion bound
  kinds?: NodeKind[];                   // optional target-kind filter
  asOf?: AsOf;
}

interface RecallResult {
  eid: EID;
  view: NodeView;
  score: number;                        // RRF-fused (§5.1)
  ranks: { vector?: number; graph?: number; salience?: number };
  conflicted: boolean;                  // true iff any surfaced cell reads CONFLICTED (m-4)
  provenance: Provenance;
}

/** The Repo read sub-surface curried at a FIXED AsOf — what asOf(asOf) returns. */
interface ReadView {
  getNode(eid: EID): Promise<NodeView | null>;
  getEdge(eid: EID): Promise<EdgeView | null>;
  query(spec: Omit<TraversalSpec, "asOf">): AsyncIterable<NodeView | EdgeView>;
  recall(q: Omit<RecallQuery, "asOf">): Promise<RecallResult[]>;
}

type RemoteRef = string;                // a git remote name or URL (transport address, never identity)
type BranchRef = string;                // a kip branch name (refs/kip/replicas/* | refs/kip/sessions/* | main)

interface SyncOptions {
  fetch?: boolean; push?: boolean;      // default: both
  remoteBranches?: BranchRef[];         // default: all kip replica branches + main
  retention?: "default" | "permissive"; // §3.5a policy applied to fetched non-durable bytes
}
interface MergeOptions { intoBranch?: BranchRef }  // default: current branch
interface MergeReport { merged: number; conflicts: Conflict[]; tip: CID }

/** A surfaced, never-auto-picked contradiction (§3.4). DATA, not an error. */
interface Conflict {
  cellId: string;                       // (eid, prop) | edge-eid cell key
  eid: EID; prop?: PropKey;
  kind: "supersede" | "kip:learn" | "same_as" | "registration" | "custom";
  candidates: FactId[];                 // the full candidate set (m-4)
}

interface RollupOptions { throughHlc: HlcStamp; scope?: ScopeRef }  // covered range ends at throughHlc (§3.5)

interface ExcisionMarker {
  markerFactId: FactId;                 // the signed excision fact (§4.5)
  excised: FactId;                      // the fact whose bytes are reclaimed
  nonce: string;                        // NON-content-derived (C-4.3) — never a PII fingerprint
  excisedChainId: ChainId;              // the excised fact's (replicaId,key) chain — "<replicaId>/<keyFpr>" (§4b.1/m7-1)
  excisedSeq: number;                   // the excised fact's chain position (m4-1/m7-1/A-1): the signed marker records
                                         //   WHERE in the chain the excised fact sat, so the chain-completeness gate
                                         //   (§3.6 step (i)) and pin-completeness (§4c/m4-1) can treat a present, signed
                                         //   marker for (excisedChainId, excisedSeq) as an ATTESTED HOLE — the marker
                                         //   itself is the witness that nothing is missing at that seq, distinct from
                                         //   an unexplained gap. Without these fields excision of a mid-chain fact would
                                         //   permanently brick the chain (every later same-pair fact reads pending
                                         //   forever) and permanently pin-incomplete every pin enumerating that chain —
                                         //   contradicting "pin survives excision" and INV-14.
  excisedReason: 'fork' | 'malformed' | 'gdpr-erasure' | 'other';  // STRUCTURED reason class (new, security) — NOT
                                         //   free text: 'fork'/'malformed' excisions target a fork- or
                                         //   well-formedness-demoted fact (§4b.1, R11) and REQUIRE the higher-privileged
                                         //   `excise-evidence` capability (distinct from ordinary GDPR-erasure `excise`),
                                         //   so the same key that forked (or a colluding ordinary-excise-scope holder)
                                         //   cannot unilaterally destroy the evidence of the fork. 'gdpr-erasure'/'other'
                                         //   use ordinary `excise` scope as today.
}

interface FsckReport {
  ok: boolean;
  headsMatch: boolean;                        // heads == proj(facts)
  mergeDriverInstalled: boolean;              // m7-4 provisioning check
  manifestGenesisCidMatch: boolean;           // m7-4 genesis-CID check
  badSignatures: FactId[];                    // fact-signature failures (commit sigs NOT checked, M2-2)
  authorityViolations: FactId[];              // author key fails genesis chaining at its author-HLC
  excisionResidue: EID[];                     // post-excision residue found in /heads (MUST be empty)
  missingDurable: FactId[];                   // durable blobs missing locally — integrity FAILURE (m7-3)
  missingNonDurable: FactId[];                // promisor-missing non-durable blobs — HEALTHY (m7-3)
  promisorMissingDurable: FactId[];           // ALIAS/cross-ref for `missingDurable` under the promisor-remote
                                               //   framing: a promisor-covered durable blob reported missing
                                               //   locally is the SAME integrity failure `missingDurable` names
                                               //   (SPEC.md §3.5a, ~lines 935-937) — `kip fsck` reports a
                                               //   promisor-missing DURABLE blob as an integrity failure and a
                                               //   promisor-missing NON-durable blob as healthy (`missingNonDurable`).
}
```

---

## Errors — the typed `KipError` model (m7-10)

kip separates **two channels, never mixed**:

1. **Domain outcomes are DATA, never thrown.** A `pending` status, `pin-incomplete`, a `conflict`
   segment, an empty `AnswerGraph`, `status: "exhausted"` — these are part of the deterministic read
   model ([failure & conflict model](./27-failure-and-conflict-model.md)) and are returned as typed
   values.
2. **Caller-input rejections THROW a typed `KipError`.** Every "rejected" in the spec has this declared
   channel; no method rejects silently (N5).

```ts
interface KipError extends Error {
  code: KipErrorCode;
  context?: Record<string, unknown>;    // e.g. { factId }, { manifest: {name, version} }, { cycle: number[] }
}
type KipErrorCode =
  | "ERR_MALFORMED_INPUT"          // authoring input fails the m7-6 well-formedness checklist (27 row #1's local-author mirror)
  | "ERR_SIGNATURE_INVALID"        // gate rejection surfaced to a local author (27 row #1)
  | "ERR_SCOPE_DENIED"             // withScope client guard: authoring an EID outside the scope (C-5.3 — advisory, §8.2)
  | "ERR_UNAUTHORIZED_EXCISION"    // excise() without the `excise` scope (m-11; 27's rejected excision marker)
  | "ERR_EXCISE_EVIDENCE_REQUIRED" // excise() targets a fork/malformed-demoted fact without the `excise-evidence` scope (§4.5, §4b.1, R11)
  | "ERR_COMPILE_CYCLIC_DEPS"      // Segment.deps cycle / out-of-range index at compile (INV-A2)
  /** INTENDED (full §5b.1 semantics, `Segment.steps` doc): a chain where some adjacent pair's
   *  `steps[i].targetKind` fails to equal — or be an `is_a` supertype-compatible match of —
   *  `steps[i+1].sourceKind`. ACTUAL (M5, honest-disclosure precedent, D-35 — CLOSED as a doc-accuracy
   *  fix, code behavior unchanged): the ONLY real throw site is a narrower self-loop heuristic in
   *  `compileContextualQuery` — `steps.length > 1 && seedKind === q.target` — NOT a general
   *  per-adjacent-pair check. No `NodeKindDef`/`is_a` schema-registration API exists yet from which a
   *  genuine per-hop kind signal could be derived (every intermediate step's `targetKind` is a
   *  placeholder derived from its own `edgeKind` name, so comparing two such placeholders would be a
   *  vacuous, self-invented check, not a real one). A chain with two genuinely incompatible
   *  intermediate hops that never loops back to the seed's own kind compiles WITHOUT error today.
   *  General per-adjacent-pair checking is DEFERRED until a schema API lands (see index.ts's own
   *  `compileContextualQuery` DOCUMENTED SCOPE NARROWING doc comment; tracked as a pre-existing gap in
   *  reviews/build-final-report.md §6's "no ontology/schema-registration API" residual). */
  | "ERR_ILL_TYPED_SEGMENT"        // ACTUAL (M5): self-loop-only heuristic (seedKind === q.target for a multi-hop chain); see block comment above for intended-vs-actual scope
  | "ERR_UNREGISTERED_MANIFEST"    // learn()/binding names a manifest with no signature-valid registration fact (INV-A13)
  | "ERR_INVALID_WEIGHT"           // NaN/±Infinity weight or range/cmp comparand at registration (INV-A7)
  | "ERR_HASH_ALGO_MISMATCH"       // cross-algo convergence-group membership (m-6) — hard error
  | "ERR_MANIFEST_FORK"            // /manifest.json fails the genesis-CID check (m7-4) — hard error (fork)
  | "ERR_NO_PROMISOR_PEER"         // eviction requested with no configured re-fetch source (m7-3)
  | "ERR_TXN_ALREADY_ACTIVE"       // D-36: a txn() call was attempted (nested, or a direct assertFact/retractFact) while another txn() is already active on this repo instance
  | "ERR_LEARN_COMMIT_FAILED"      // learn()'s accept-commit txn() failed for an unforeseen reason after passing every known validation gate; a kip:learn-exhausted marker naming the failure is authored before this throws (N5)
  | "ERR_TXN_ROLLBACK_FAILED"      // txn()'s post-commit-failure rollback could not erase one or more newly-ingested oids (e.g. a locked/undeletable blob); names BOTH the original commit failure and the oid(s) that failed to erase
  | "ERR_TXN_TIP_PERSIST_FAILED"   // round-5: txn()'s commit/facts/commit-tip already succeeded durably — only the FINAL seq/hlc tip-bookkeeping write (SeqTipStore.save) failed afterward; names context.commitOid (the commit that DID succeed), never implies nothing was committed
  | "ERR_ASOF_TXTIME_NOT_SUPPORTED_FOR_COMPILE"  // compileContextualQuery/executeSegment/getLearnResult/runAcquisition: an asOf.txTime frontier resolves through this replica's non-convergent rxFrom receive-tick history; rejected on the compile-determinism/durable-authoring seams (INV-A2), pin asOf.validTime instead
  | "ERR_ACQUISITION_TARGET_FORBIDDEN"           // runAcquisition (M7): a proposed entry names a CONTROL-PLANE target (schema/key/control); an acquisition microagent may author ONLY data facts (node/edge/node-prop/edge-prop) — authority facts are never acquisition-authored (§8.1 trust path is M8)
  | "ERR_CONFLICTED_REGISTRATION";               // runAcquisition (M7): the named (name,version) has DIVERGENT registration descriptors (INV-A10 divergent-registration clause) — the seam refuses to LWW-pick one silently ("a LWW-overwrite fails")
```

**Per-method channels** (throws = `KipError`; everything else returns typed data):

| Method | Throws | Returns as data |
|---|---|---|
| `open` | `ERR_MANIFEST_FORK`, `ERR_HASH_ALGO_MISMATCH`, `ERR_MALFORMED_INPUT` | — |
| `assertFact`/`retractFact`/`putNode`/`putEdge`/`txn` | `ERR_MALFORMED_INPUT`, `ERR_SCOPE_DENIED`, `ERR_SIGNATURE_INVALID`, `ERR_TXN_ALREADY_ACTIVE` (nested txn(), or a direct call while another txn() is active), `ERR_TXN_ROLLBACK_FAILED` (txn() only — rollback after a commit failure could not erase every newly-ingested oid), `ERR_TXN_TIP_PERSIST_FAILED` (txn() only — the commit already succeeded durably; only the final seq/hlc tip-bookkeeping write failed afterward) | `status: "pending"\|"durable"` (m-9) |
| `supersedeFact`/`reAttestFact` | `ERR_MALFORMED_INPUT`, `ERR_SCOPE_DENIED` (resolve-scope supersedes), `ERR_SIGNATURE_INVALID` | `status: "pending"\|"durable"` (m-9) |
| `ingest` | — (never throws; rejection is EXPECTED/tested behavior, not an error condition, B-2) | `{ admitted, reason? }` — a typed gate verdict, always returned, even for a malformed/signature-invalid/foreign-signed fact |
| `getNode`/`getEdge`/`query`/`recall`/`asOf` | `ERR_MALFORMED_INPUT` (bad selector) | `unknown`/`conflict` segments, `pending` trust states, `conflicted` results |
| `pin`/`resolvePin`/`subscribe` | `ERR_MALFORMED_INPUT` | `PinStatus` (`pin-incomplete` is data, never an error) |
| `sync`/`merge` | transport failures (wrapped), `ERR_NO_PROMISOR_PEER` | `SyncReport.conflicts` / `MergeReport.conflicts` (typed, never auto-picked) |
| `tombstone` | `ERR_MALFORMED_INPUT` (empty `eid`/`reason` — the input-validation precondition), `ERR_SCOPE_DENIED` (deferred: the scope/`KeyAuthorization` guard is not yet enforced repo-wide, so this channel is currently unreachable — tracked with the M-stage that lands scope enforcement) | `FactId` (the signed tombstone fact's own content address) |
| `excise` | `ERR_UNAUTHORIZED_EXCISION`, `ERR_EXCISE_EVIDENCE_REQUIRED` (fork/malformed-demoted target without `excise-evidence` scope) | `ExcisionMarker` |
| `revokeKey` | `ERR_SCOPE_DENIED` (no `revoke` scope) | — (demotion is a proj outcome) |
| `fsck` | — | `FsckReport` (failures are report fields, not throws) |
| `registerFunctionality` | `ERR_INVALID_WEIGHT`, `ERR_UNREGISTERED_MANIFEST` (unsigned), `ERR_SCOPE_DENIED` | divergent re-registration surfaces as a `CONFLICTED` cell (data, §3.4) |
| `compileContextualQuery` | `ERR_COMPILE_CYCLIC_DEPS`, `ERR_ILL_TYPED_SEGMENT` | `Segment.alternatives` (the typed choice) |
| `runContextualQuery`/`executeSegment` | compile errors as above | `{ kind: "choice" }`, empty-`result` `AnswerGraph` (outcomes #4–#7) |
| `runAcquisition` | `ERR_UNREGISTERED_MANIFEST` (unregistered/unsigned manifest, before dispatch), `ERR_CONFLICTED_REGISTRATION` (divergent `(name,version)` registration — a LWW-overwrite fails, INV-A10), `ERR_ASOF_TXTIME_NOT_SUPPORTED_FOR_COMPILE` (`asOf.txTime` on this durable-authoring seam, INV-A2), `ERR_MALFORMED_INPUT` (the dispatched microagent's OUTPUT is unusable: non-zero exitCode / fails `outputSchema` / not a well-formed `AcquisitionResult`), `ERR_ACQUISITION_TARGET_FORBIDDEN` (a `proposed` entry names a control-plane `schema`/`key`/`control` target — authority facts are never acquisition-authored, §8.1 trust path is M8) | quarantined-until-trusted facts (data) |
| `learn` | `ERR_UNREGISTERED_MANIFEST` (before the loop, INV-A13), `ERR_LEARN_COMMIT_FAILED` (unforeseen accept-commit failure after every known validation gate; a `kip:learn-exhausted` marker naming the failure is durably authored first), `ERR_TXN_ALREADY_ACTIVE` (rethrown verbatim when a concurrently-racing `learn()` call's own accept-commit `txn()` finds another already active on this instance — never masked as `ERR_LEARN_COMMIT_FAILED`, never authors a spurious exhausted marker for it) | `{ facts, loss, status: "accept" \| "exhausted", fabricated: string[] }` (INV-A5; `fabricated` = the loss model's fabrication indictment for the accepted reconstruction — the SAME list persisted on the `kip:learn` audit fact, surfaced so `--json` is not blind to it; empty on `exhausted` or when nothing was indicted, ROUND-3 MAJOR #5) |

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
