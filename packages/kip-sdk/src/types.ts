/**
 * @a5c-ai/kip-sdk — PUBLIC TYPE SURFACE (ADR-B5 "modularize").
 *
 * Hoisted verbatim out of `index.ts` (M0-deferred step 1): the branded scalar types, the fact
 * envelope + authoring inputs, the cell/segment + view model, the supporting API types, the
 * active-knowledge (§5b) shapes, `KipErrorCode`, and the `Repo` working-surface interface. Pure
 * type declarations only (erased at runtime) — no imports, no runtime bindings. Re-exported
 * unchanged from `./index` via `export * from "./types"`.
 */
// ---------------------------------------------------------------------------
// 1. Core scalar / branded types (docs/21-data-model.md §1)
// ---------------------------------------------------------------------------

/** Namespaced stable identity: "<tenant>/<namespaceId>/<localId>" (§3.6). */
export type EID = string;
/** Git object id (hex). */
export type CID = string;
/**
 * D-30: a digest of the current admitted fact SET (`computeFactSetDigest`) — stable and
 * comparable across calls, but NOT a real git commit object id (there is no regenerated commit
 * DAG yet, see D-27/ADR-B1). Kept distinct from `CID` so `SyncReport.tip`/`MergeReport.tip`'s
 * type no longer implies a git-resolvable commit id.
 */
export type FactSetDigest = string;
/** Schema-defined node kind, e.g. "person", "episode". */
export type NodeKind = string;
/** Schema-defined edge kind, e.g. "works_at", "derived_from". */
export type EdgeKind = string;
export type PropKey = string;

/**
 * The author's stable, self-chosen replica id — signed (part of `hlc` and of the canonical
 * payload, §2.4). MUST NOT contain "/" (ChainId is rendered "<replicaId>/<keyFpr>", §4b.1/m7-1).
 */
export type ReplicaId = string;

/** Who/what asserted a fact — agent, human, or importer identity (Provenance.author, §2.4). */
export type ActorId = string;
/** Base64-encoded 64-byte Ed25519 signature over the canonical payload (Provenance.signature, §2.4). */
export type Ed25519Sig = string;

/**
 * `FactId` = the CID of a fact's canonical signed payload (docs/40 AssertInput comment: "kip
 * fills the derived `id`/`FactId` (= CID of the canonical payload)"). Kept as a distinct alias
 * (rather than reusing `CID` everywhere) so fact-identity call sites read intentionally.
 */
export type FactId = CID;

/** The excised/chain-durable fact's `(replicaId,key)` chain — "<replicaId>/<keyFpr>" (§4b.1/m7-1). */
export type ChainId = string;

/** The HLC stamp on every fact (§4b.1): author-stamped and signed. */
export interface HlcStamp {
  wall: number; // int64 ms
  counter: number; // uint32
  replicaId: ReplicaId;
}

/**
 * A valid-time endpoint (`validFrom`/`validTo`). Canonicalizes to the bigint
 * `wall * 2^32 + counter` (m7-19); a plain instant coerces to `(wall = epochMs, counter = 0)`.
 */
export type HlcOrTime = HlcStamp | string /* ISO-8601 */ | number /* epoch ms */;

/**
 * Tagged reference to a large value blob (m-1) — large values never a bare CID string.
 *
 * ROUND-2 FIX (M6, MAJOR #2 — documentation-only, no behavior change): `blob` is a caller-DECLARED
 * `CID` string, never verified/re-hashed against the referenced content by `learn()` or anything
 * else in this module (unlike a `Fact.id`, which `mintFact` derives as a REAL content hash — see
 * proj.ts's own `compareOrderKey` doc comment for the parallel caveat about externally-supplied
 * `Fact.id`s). `learn()`'s `kip:learn`/`kip:learn-exhausted` fact key is built from `rawRef.blob`
 * (via `ontologyRefForLearn`) with NO out-of-band hash check, so `BlobRef` identity here is
 * ADVISORY-ONLY: two `learn()` calls over genuinely DIFFERENT raw artifacts that happen to declare
 * the SAME `rawRef.blob` string collide onto the identical `kip:learn` key (indistinguishable from
 * two calls over the SAME artifact), while the converse (the SAME artifact declared under two
 * DIFFERENT `blob` strings) never collides at all. Downstream consumers reading `kip:learn` facts
 * back MUST NOT treat two facts sharing a key as "provably the same content" without an out-of-band
 * hash check of their own — this is a pre-existing placeholder-type limitation (`BlobRefInput`'s own
 * doc comment), not introduced or closed by this fix; see `m6-round2-critic-fixes.test.ts`'s "M6
 * round-2 finding MAJOR #2: BlobRef identity is advisory-only/caller-declared" describe block for a
 * conformance test asserting this collision behavior is bounded and understood (same string used
 * twice ⇒ same key, by design; two distinct strings ⇒ never collide). [ROUND-3 FIX (MINOR,
 * citation-only): this comment previously cited a non-existent `round2-blobref-collision.test.ts`
 * file name; corrected to name the actual describe block above.]
 */
export type BlobRef = { blob: CID };
export type PropValue = string | number | boolean | null | BlobRef;

// ---------------------------------------------------------------------------
// 2. The fact envelope (docs/21 §5, canonical signed-payload field list)
// ---------------------------------------------------------------------------

/**
 * SPEC.md §5b/1297-1382's canonical `FactType` vocabulary, transcribed verbatim (all 8 variants).
 * M0 only IMPLEMENTS `assert`/`retract` (mint-then-ingest, `assertFact`/`retractFact`) and admits
 * `supersede`/`re-attest` at the well-formed()/ingest-gate level (their dedicated `Repo` methods —
 * `supersedeFact`/`reAttestFact` — stay unimplemented throwing stubs, M3/M9 scope). `revoke-key` /
 * `excision` / `grant` / `policy` are recognized here so the ingest gate does not reject an
 * otherwise-well-formed, signature-valid fact of these kinds on TYPE grounds alone (ADR-001: the
 * gate is signature-only membership, not a feature-completeness gate) — but this round implements
 * NO corresponding `Repo` method (`revokeKey`/`excise`/etc. remain throwing stubs); recognizing the
 * shape is strictly a well-formed()-checklist concern, not a claim of full processing support.
 */
export type FactType =
  | "assert"
  | "retract"
  | "supersede"
  | "revoke-key"
  | "excision"
  | "re-attest"
  | "grant"
  | "policy";

/**
 * `Target` addresses the cell/entity a fact writes to or names. SPEC.md §1297-1382's canonical
 * shape declares `kind: "node" | "edge" | "schema" | "key" | "control"` with `eid?`/`edgeKind?`/
 * `ontologyRef?`/`keyFpr?`/`op?` as the (mostly optional) discriminant payload. This module also
 * keeps the pre-existing `node-prop`/`edge-prop` refinements (a M0/T1.2 addition, not in the SPEC
 * excerpt verbatim, inferred from `Conflict.cellId`'s "(eid, prop) | edge-eid cell key" comment and
 * needed for M0's node/edge-PROPERTY cell-addressing) since dropping them would be a regression for
 * the shapes M0 already fully processes. `schema`/`key`/`control` are added per this round's
 * finding #4 so the ingest gate can RECOGNIZE (not necessarily fully process — no corresponding
 * `Repo` method is implemented this round) spec-legal `revoke-key`/`excision`/`grant`/`policy`-style
 * facts addressing schema/key/control targets, matching the SPEC's own optional-field shape (no
 * `eid` requirement, unlike the node/edge variants below).
 */
export type Target =
  | { kind: "node"; eid: EID; nodeKind?: NodeKind }
  | { kind: "node-prop"; eid: EID; prop: PropKey }
  | { kind: "edge"; eid: EID; edgeKind?: EdgeKind; from?: EID; to?: EID }
  | { kind: "edge-prop"; eid: EID; prop: PropKey }
  | { kind: "schema"; ontologyRef?: string }
  | { kind: "key"; keyFpr?: string }
  | { kind: "control"; op?: "rollup" | "tombstone" | "consolidate" | "excision"; eid?: EID };

/**
 * Provenance is signed and verifiable before ingest (docs/21 §5). `author`/`publicKeyFingerprint`
 * are IN the canonical signed payload; `source`/`confidence` are advisory-only (never affect the
 * deterministic cell reducer, m-2).
 */
export interface Provenance {
  author: ActorId;
  signature: Ed25519Sig;
  publicKeyFingerprint: string;
  signedFields: string[];
  /**
   * CONVERGENCE-CORE (M3 round-3 finding #1, docs/24 §3.2/§4.4-step-1): the SPKI-PEM-encoded raw
   * Ed25519 PUBLIC KEY that `publicKeyFingerprint` is the SHA-256 digest of, carried IN-BAND so the
   * ingest gate can verify this fact's signature as a PURE FUNCTION OF THE FACT'S BYTES — reading no
   * `keyRegistry`, no partially-synced key log, no receiver clock, no local state (§4.4-step-1: "Ed25519
   * verification is deterministic and a function of the fact's bytes alone"). Every replica that receives
   * these exact bytes therefore computes the IDENTICAL admit/reject verdict, so `equal received sets ⇒
   * equal admitted sets` holds even for a REAL-signed fact received transitively (authored by C, pulled
   * via B) on a replica that has never registered C's key — closing the transitive-merge admission
   * divergence vector. `fingerprintOf(publicKey)` MUST equal `publicKeyFingerprint` (the gate enforces
   * this binding), so an attacker cannot swap in a key they possess for a fingerprint they do not.
   *
   * Deliberately OUTSIDE the canonical signed payload (`canonical-payload.ts`'s `buildCanonicalEnvelope`
   * never reads it — exactly like `signature`/`source`/`confidence`): it is derivable from the signing
   * key and its binding to `publicKeyFingerprint` (which IS signed) is what the gate checks, so it needs
   * no independent signature and never perturbs `factCID`/`id`/`orderKey`/reducers. Absent on the
   * conformance suite's placeholder-signed fixtures (whose deterministic `signature === "sig:"+id`
   * convention is the test stand-in for a byte-pure "signature valid" check); present on every
   * self-authored real-crypto fact this SDK mints (`mintFact`/rollup/excision markers) and on any real
   * adversarial peer fact modeled in the additive tests.
   */
  publicKey?: string;
  source?: { uri: string; cid?: CID };
  confidence?: number; // [0,1], advisory only
  /**
   * MAJOR-FINDING addition (M1 round-3 task, proj.ts's `pickProvenance`): set `true` ONLY when this
   * `Provenance` was chosen from a genuinely tied (identical orderKey, including the "total" order's
   * `factCID` tiebreak) but CONTENT-DIFFERENT candidate group — e.g. a cross-cell tie between an
   * existence fact and an unrelated prop fact sharing a colliding `id` (well-formed.ts's item-4
   * self-consistency check is a documented, deliberately weak length-only bound for externally-
   * supplied facts, not a real hash-recompute-and-compare — see proj.ts's `maxByOrderKey` doc
   * comment). An honest ambiguity flag, never fabricating which candidate's authorship is "the"
   * correct one; absent (never `false`) for every ordinary, unambiguous pick, so this field never
   * appears in any projection the frozen M0/M1 conformance suite exercises.
   */
  conflicted?: boolean;
  /**
   * CRITICAL FIX #2 (M5 round-2, INV-A2/docs/31 Phase 2): "provenance.source naming the
   * MicroagentInvocation... AND RECORDING THE RESOLVED asOf FRONTIER". Stamped by the active-layer
   * authoring seams — `executeSegment` and `runAcquisition` (M7) — on the facts they author: the
   * compiled/resolved `AsOf` (`opts.asOf` or the originating `Segment.asOf`) the hop's guards were
   * evaluated against and the fact was minted under, so a reproducible mining run can verify exactly
   * which frontier produced this fact. `mintFact` now genuinely carries it through onto the minted
   * fact (an earlier build set it in the authoring provenance but `mintFact`'s provenance rebuild
   * silently dropped it — the drop is fixed). Never part of the canonical signed payload
   * (`canonical-payload.ts`'s `buildCanonicalEnvelope` only extracts `author`/`publicKeyFingerprint`
   * off `provenance` — mirrors `source`/`confidence` above, advisory-only, never affects
   * `factCID`/signature/reducer behavior).
   */
  resolvedAsOf?: AsOf;
}

/** Annotated AFTER durable recording — NOT signed, NOT part of FactId, NOT read by proj/orderKey. */
export interface FactAnnotation {
  commit: CID;
  rxFrom: HlcStamp;
}

/**
 * The signed fact envelope (docs/21 §5.1's canonical field list:
 * `[v, type, target, value?, validFrom, validTo, hlc, seq, causedBy?, supersedes?, reAttests?,
 * author, publicKeyFingerprint, replicaId]`, `signature` excluded from the payload). `author` and
 * `publicKeyFingerprint` are modeled as living inside `provenance` (mirroring `NodeView`/
 * `EdgeView.provenance: Provenance`); `replicaId` is kept top-level per the canonical field list
 * (TODO(M0/T1.2): confirm this split against the full SPEC.md canonical-payload builder once
 * implemented — the docs excerpts read for this scaffold don't show the builder's exact literal
 * object shape).
 */
export interface Fact {
  id: FactId;
  v: number; // schema version, IN the canonical signed payload
  type: FactType;
  target: Target;
  value?: PropValue;
  validFrom: HlcOrTime;
  validTo: HlcOrTime | null;
  hlc: HlcStamp; // author-stamped-by-kip (§4b.1)
  seq: number; // per-(replicaId,key) chain sequence, minted at txn-commit boundary (A-5)
  causedBy?: FactId[]; // voluntary causal-dominance declaration (ADR-007 SECONDARY rule)
  // docs/23 §1 defines the supersession envelope as the RICH object shape
  // `{ inputCids: FactId[]; retract: FactId[]; assert?: PropValue }` (keyed by inputCids, C-3): the
  // `retract` sub-list is the interval-CLOSING mechanism (proj folds it as a scoped retract of the
  // named facts), `assert` an optional projected-value override. The bare `FactId[]` form is the
  // legacy flattened shape (== `inputCids`, empty retract) the frozen M0/M1/M2 conformance fixtures
  // bake (see this task's `disputes`); it is accepted as a strict subset so those tests still pass,
  // while the object shape carries the full docs/23 §1 semantics. `proj` normalizes both via
  // `supersedeInputCids`/`supersedeRetractIds` (proj.ts), so equal admitted sets still converge.
  supersedes?: FactId[] | { inputCids: FactId[]; retract?: FactId[]; assert?: PropValue };
  reAttests?: FactId; // §8.1 M5-3 re-attest mechanism
  replicaId: ReplicaId;
  provenance: Provenance;
}

// ---------------------------------------------------------------------------
// 3. Authoring inputs (docs/40 "Authoring inputs" — copied verbatim)
// ---------------------------------------------------------------------------

export type AssertInput = Omit<Fact, "id" | "hlc" | "seq" | "type" | "supersedes" | "reAttests"> & {
  type: "assert";
};
export type RetractInput = Omit<Fact, "id" | "hlc" | "seq" | "type" | "supersedes" | "reAttests"> & {
  type: "retract";
};
export type SupersedeInput = Omit<Fact, "id" | "hlc" | "seq" | "type" | "reAttests"> & {
  type: "supersede";
  supersedes: NonNullable<Fact["supersedes"]>;
};
export type ReAttestInput = Omit<Fact, "id" | "hlc" | "seq" | "type" | "supersedes"> & {
  type: "re-attest";
  reAttests: FactId;
};

// ---------------------------------------------------------------------------
// 4. Cell + segment model, NodeView/EdgeView (docs/21 §2/§1)
// ---------------------------------------------------------------------------

/**
 * MAJOR-FINDING addition (M1 round-2 task): a FOURTH `CellSegment` variant realizing INV-8's
 * "typed result (value | quarantine)" / "unknown versions pass through as opaque-quarantined"
 * clause (docs/60-conformance-and-testability.md#inv-8) — previously vacuously true because no
 * such variant existed for any code path to produce (see proj.ts's T2.4 scope note and inv-8's own
 * `it.skip` documenting this exact gap). Minimal, honest trigger (proj.ts's `reduceRawCell`): a
 * fact whose `v` exceeds the projection's configured `knownMaxVersion` quarantines that segment
 * instead of a passthrough `value` — still terminates, still never throws, still never fabricates
 * data (the ONLY thing withheld is treating an unrecognized-version fact's `value` as trustworthy),
 * matching INV-8's own text without inventing a full per-ontology-kind upcaster registry.
 */
export type CellSegment<V = PropValue> =
  | { kind: "value"; value: V; validFrom: HlcOrTime; validTo: HlcOrTime | null; assertedBy: FactId }
  | { kind: "unknown"; validFrom: HlcOrTime; validTo: HlcOrTime | null }
  | { kind: "conflict"; validFrom: HlcOrTime; validTo: HlcOrTime | null; candidates: FactId[] }
  | {
      kind: "quarantine";
      validFrom: HlcOrTime;
      validTo: HlcOrTime | null;
      assertedBy: FactId;
      v: number;
      // `"unknown-version"`: `v` exceeds the projection's `knownMaxVersion` (INV-8). "malformed-
      // supersede": an object-shaped `supersede` that OMITS/empties its `inputCids` key-set — a
      // signature-valid, admittable fact (well-formed.ts only checks presence-iff-type) that is
      // nonetheless malformed per docs/23 §1 ("keyed by its input-CID set"). proj is TOTAL over the
      // admitted set (INV-3): it quarantines such a fact — surfaced, never dropped, never trusted as
      // a value, never thrown on — rather than letting it reach a `.some()` on `undefined`.
      reason: "unknown-version" | "malformed-supersede";
    }
  | {
      /**
       * M3/T4.7 addition (INV-9/INV-12 conformance): a FIFTH `CellSegment` variant realizing
       * docs/24-synchronization-and-convergence.md §4.3's "reads that would resolve through an
       * EXCISED fact return a typed 'excised' placeholder segment ... never silently fabricated
       * data" clause. Distinct from `"unknown"`: `"unknown"` means "no covering assert ever
       * existed for this sub-interval"; `"excised"` means "a covering assert once existed here but
       * its bytes were physically erased (§4.5)" — a `getNode`/`getEdge`/`query` LIVE read (no
       * `asOf`) whose cell loses its ONLY covering assert to excision instead re-folds that
       * sub-interval to plain `"unknown"` (docs §4.5 "Heads re-fold", verbatim: "if a cell loses
       * its only covering assert it becomes unknown") — `"excised"` is specifically the
       * historical-`asOf`-read placeholder for a validTime instant that resolves THROUGH the now-
       * erased fact. Added here as a MINIMAL typed placeholder (no `proj`/`asOf` code path
       * produces it yet — `excise()`/`asOf` remain M3 stubs, see this file's other TODOs) so the
       * frozen inv-9.test.ts conformance file can type-check the shape it asserts against, mirroring
       * the established precedent of the `"quarantine"` variant above (added ahead of its
       * producing code path for the same reason, M1 round-2).
       */
      kind: "excised";
      validFrom: HlcOrTime;
      validTo: HlcOrTime | null;
      excisedFactId: FactId;
      /** The `excise()` caller's own validated `reason` string, carried through from the durable,
       * signed marker payload (proj.ts's `ExcisionMarkerPayload`) — `undefined` only for a marker
       * minted before this field existed (optional, never fabricated). */
      excisedReason?: string;
    };

export interface PropCell<V = PropValue> {
  segments: CellSegment<V>[];
}

export interface NodeView {
  eid: EID;
  kind: NodeKind;
  props: Record<PropKey, PropCell>;
  provenance: Provenance;
  /**
   * SCHEMA SLICE 1 (docs/21 §3): non-empty ONLY when this node's `kind` has a DECLARED `NodeKindDef`
   * (via `Repo.registerSchema`) whose declared props its projected props VIOLATE — each entry a
   * `kip:schema-violation` message (a missing REQUIRED prop, or a prop whose covering value's runtime
   * type ≠ the declared type). The node/prop is NEVER dropped and no value is invented (N5); this is a
   * proj-time QUARANTINE surfacing, never a write-time reject (schema is not an ingest gate — a fact's
   * SIGNATURE is the sole membership predicate, docs/21 §3/§5.1, so rejecting at write would break
   * set-union CRDT convergence). Absent (`undefined`) for a node whose `kind` has NO declared schema —
   * so schema is purely OPT-IN and non-breaking (a free-form node projects exactly as before). Present
   * on BOTH `getNode` (canonical) and `getNodeRaw` reads. Deterministic: a pure function of the fact
   * set (node facts + schema facts), independent of authoring/ingest order.
   */
  schemaViolations?: string[];
}

export interface EdgeView {
  eid: EID;
  kind: EdgeKind;
  from: EID;
  to: EID;
  props: Record<PropKey, PropCell>;
  validFrom: HlcOrTime;
  validTo: HlcOrTime | null;
  provenance: Provenance;
}

// ---------------------------------------------------------------------------
// 4b. Schema / ontology declaration (docs/21 §3 — SCHEMA SLICE 1)
// ---------------------------------------------------------------------------

/**
 * SCHEMA SLICE 1 (docs/21 §3): one declared property on a node kind. Deliberately MINIMAL — a
 * `name`, a primitive runtime `type`, and an optional `required` flag. The spec's fuller shape
 * (per-prop `cellReducer`, identity/cardinality/inverse) is explicitly DEFERRED to later slices.
 */
export interface PropSchema {
  name: PropKey;
  type: "string" | "number" | "boolean";
  required?: boolean;
}

/**
 * SCHEMA SLICE 1 (docs/21 §3): a VERSIONED, FACT-STORED declaration of a node kind's shape. Authored
 * via `Repo.registerSchema` as exactly ONE signed `{ kind:"schema", ontologyRef:"kip:node-kind/<kind>" }`
 * fact carrying this def (mirroring `registerFunctionality`'s orchestrator-signed schema-fact channel),
 * and read back as-of-queryably via `Repo.getSchema` (schema history is itself auditable, docs/21 §3).
 *
 * `proj` validates a node of this `kind` against `props` and surfaces any violation as a
 * `kip:schema-violation` quarantine on `NodeView.schemaViolations` — NEVER a write-time reject
 * (docs/21 §3: schema conformance is not an ingest gate; the signature is the sole membership
 * predicate, so a write-gate would break set-union convergence).
 *
 * DEFERRED (later slices, NOT in Slice 1): the spec's `cellReducer: CellReducerRef` and
 * `identity: IdentityPolicy` fields; versioned UPCASTERS / migration / rename / deprecate (Slice 1
 * validates against the CURRENTLY-declared def only, never per-fact-version upcasters).
 */
export interface NodeKindDef {
  kind: NodeKind;
  /** Schema version → upcaster keying (docs/21 §3, HP-8). Recorded, but Slice 1 validates against
   *  the currently-declared def only; versioned upcasters are DEFERRED. */
  version: number;
  props: PropSchema[];
}

/**
 * SCHEMA SLICE 1 (docs/21 §3): the edge analogue of `NodeKindDef`, declared for surface completeness.
 * Slice 1 does NOT validate edges against it — edge-kind prop validation, cardinality/`inverse`
 * (`kip:cardinality-violation`), and per-kind reducers are explicitly DEFERRED to later slices.
 */
export interface EdgeKindDef {
  kind: EdgeKind;
  version: number;
  source?: NodeKind | NodeKind[];
  target?: NodeKind | NodeKind[];
  props?: PropSchema[];
}

// ---------------------------------------------------------------------------
// 5. Supporting API types (docs/40 "Supporting API types (normative)")
// ---------------------------------------------------------------------------

export interface OpenOptions {
  dir: string;
  replicaId: ReplicaId;
  keyring: unknown;
  createIfMissing?: boolean;
  /**
   * ADR-B9c (the one required core change): an optional microagent-dispatch seam threaded into the
   * constructed `KipRepo`, so an acquisition surface (`kip index` → `runAcquisition`) reaches a REAL
   * family microagent instead of the always-succeeds default stub. When omitted, `open()` behaves
   * exactly as before (the default `KipRepo.defaultDispatchMicroagent` is used).
   */
  dispatchMicroagent?: DispatchMicroagentFn;
  genesis?: {
    hashAlgo: "sha1" | "sha256";
    shardDepth: number;
    clockEpoch: number;
    epsilonCausalMs: number;
    regenBoundaryRule: string;
    rootKeys: string[];
    quarantineTtlMs: number;
    quarantineKeyCapBytes: number;
    quarantinePoolBytes: number;
    keyChainDurableCapBytes: number;
    headsCommitted?: boolean;
  };
}

/** The transaction handle: the WRITE sub-surface of Repo whose facts batch into one commit. */
export interface Tx {
  assertFact(input: AssertInput): Promise<Pick<Fact, "id" | "hlc" | "seq"> & { status: "pending" }>;
  retractFact(input: RetractInput): Promise<Pick<Fact, "id" | "hlc" | "seq"> & { status: "pending" }>;
  supersedeFact(input: SupersedeInput): Promise<Pick<Fact, "id" | "hlc" | "seq"> & { status: "pending" }>;
  reAttestFact(input: ReAttestInput): Promise<Pick<Fact, "id" | "hlc" | "seq"> & { status: "pending" }>;
  putNode(node: NodePut): Promise<EID>;
  putEdge(edge: EdgePut): Promise<EID>;
}

export interface ScopeRef {
  tenant: string;
  namespace?: string;
  snapshot?: SnapshotRef;
}

export interface AsOf {
  validTime?: HlcOrTime;
  txTime?: HlcStamp;
  believer?: ReplicaId;
}

export interface NodePut {
  eid: EID;
  kind: NodeKind;
  props?: Record<PropKey, PropValue>;
  validFrom?: HlcOrTime;
  validTo?: HlcOrTime | null;
}

export interface EdgePut {
  eid?: EID;
  kind: EdgeKind;
  from: EID;
  to: EID;
  props?: Record<PropKey, PropValue>;
  validFrom: HlcOrTime;
  validTo?: HlcOrTime | null;
}

/** Typed as-of traversal (§5.2). `depth`/`maxFanout` are MANDATORY (m7-21, no unbounded default). */
export interface TraversalSpec {
  seed: EID | EID[];
  direction: "out" | "in" | "both";
  edgeKinds?: EdgeKind[];
  depth: number;
  maxFanout: number;
  kinds?: NodeKind[];
  asOf?: AsOf;
}

/**
 * M4/T5.5: `RecallQuery` widened to the normative docs/26 §5.1 shape (the round-4 realization of the
 * former minimal-placeholder's own `TODO(M4/T11.4)`). Every field is docs/26 §5.1-declared:
 *
 * - `text`: exact/keyword GRAPH-SEED input, AND (D-57 / ADR-B17) the source kip embeds when `semantic`
 *   is opted in. By DEFAULT (no `semantic`, no `embedding`) kip does NOT embed it and the vector half
 *   is inert — pure lexical + graph, the pre-ADR-B17 behavior. A `text` exact-match on a candidate's
 *   `content` cell is a GRAPH SEED (§5.1 flowchart `G0`): the matched node is itself a hop-0 candidate
 *   (it earns a graph rank even with no inbound edge and no vector half), so a pure-`text` query
 *   surfaces the matched nodes THEMSELVES, not only their graph-expanded neighbors.
 * - `semantic`: D-57 (semantic half) OPT-IN — when `true`, kip embeds `text` itself and drives the
 *   vector half (see the field's own doc). Absent ⇒ unchanged behavior.
 * - `embedding`: the CALLER-SUPPLIED query vector (N2: kip consumes embeddings, never produces them),
 *   the ANN candidate seed. Corpus vectors are built OUTSIDE the deterministic `proj` fold, via the
 *   injectable `dispatchMicroagent` embedding seam (§5.3 accelerator boundary — recall/embeddings
 *   are non-deterministic accelerators, NEVER a `proj` input, so they can never perturb `/heads`
 *   byte-identity, INV-5). NOTE: the M4 vector half is an EXACT brute-force cosine scan (recall-equal
 *   to exact-kNN by construction) computed PER-CALL — there is no HNSW/IVF ANN index and no
 *   content-addressed embedding cache yet; the pluggable ANN accelerator + incremental cache (§5.3)
 *   are a named follow-up (see `dispatchEmbedding` / `computeRecall` vector-half comments).
 * - `filters`: candidate restriction (§5.1). ALL THREE sub-fields are honored — `kind` (node-kind),
 *   `props` (every named prop must match the candidate's covering value), and `edgeKinds` (the
 *   candidate must be incident to ≥1 as-of-valid edge of a named kind). None is a silent no-op.
 * - `scope`: DEFERRED to M8 tenancy — NOT applied here. Consistent with `withScope`/`pin`/`subscribe`,
 *   whose `scope.tenant`/`scope.namespace` narrowing is likewise unimplemented at this milestone
 *   (this SDK's fixtures never namespace `EID`s by tenant, so there is no sound narrowing to apply).
 *   `computeRecall` documents this loudly as a NAMED GAP rather than pretending it restricts candidates
 *   — see the `q.scope` handling in `computeRecall`.
 * - `asOf`: the bitemporal frontier the whole pipeline (candidate visibility, edge validity, salience
 *   recency) is bounded by (§5.2/§5.4, m-7).
 * - `expand`: bounded, OPT-IN graph expansion (docs/26 §5.1: "MUST be bounded and opt-in, never
 *   unbounded") — `hops` + optional `maxFanout` caps.
 * - `k`: REQUIRED top-k cap (docs/26 §5.1 declares `k: number`; docs/40 "MUST NOT drop a declared
 *   field"). The fused ranked result is ALWAYS truncated to `k` — recall never returns the whole fused
 *   candidate set (no silent unbounded-result fallback, §5.1 "top-k results" + context-dilution intent).
 * - `rank`: RRF + salience-composition knobs (§5.1/§5.4). `rrfK` defaults to 60 (the canonical RRF
 *   constant). The salience half maps each knob onto a §5.4 `SalienceModel` weight:
 *   `recencyWeight`=`w_r`, `confidenceWeight`=`w_c`, `salienceWeight`=`w_g` (centrality). All default
 *   to 0 (salience is OPT-IN — a term participates ONLY when its weight is positive, so a pure
 *   vector/graph query is never silently salience-perturbed and INV-5's pure-vector measurement is
 *   exact). `halfLifeMs` is the §5.4 recency decay constant (defaults to `KIP_SALIENCE_HALF_LIFE_MS`).
 *   The fourth §5.4 term `w_a·accessFreq` is an EXPLICIT M4 DEFERRAL (see `computeRecall` salience-half
 *   NAMED GAP): M4 exposes no public API to author `read`-event facts, and recall itself MUST NOT emit
 *   read facts (that would make it observer-effecting, §5.4 m-7 closure) — so `accessFreq` has no
 *   convergence-safe input surface at this milestone and is scoped out with the citation, never
 *   silently folded in.
 */
export interface RecallQuery {
  text?: string;
  embedding?: number[];
  /**
   * D-57 (semantic half) — OPT-IN query embedding (the owner-approved lift of the former N2/N5 "kip
   * never embeds the query" stance). When `true` AND a `text` is present AND no `embedding` was
   * supplied, kip embeds `text` ITSELF and drives the vector half with it, embedding the corpus
   * SYMMETRICALLY through the SAME embedder: the injected `dispatchMicroagent` embedding microagent
   * when one is available, ELSE the dependency-free fuzzy `defaultEmbed` (`src/embed/default-embedder.ts`).
   * ABSENT/`false` ⇒ behavior is EXACTLY as before this field existed (pure lexical + graph, the
   * vector half runs only on a caller-supplied `embedding`) — the frozen suite is byte-identical.
   * HONEST SCOPE: the built-in `defaultEmbed` is FUZZY character/token overlap, NOT learned synonymy;
   * true synonymy needs a real embedding model injected through the seam. Reading this field keeps
   * `computeRecall` a pure function of (fact set, query) — the `--semantic` flag / `KIP_ASK_EMBED`
   * env are resolved at the `kip ask` / graph-QA wiring layer and merely set this bit.
   */
  semantic?: boolean;
  filters?: { kind?: NodeKind[]; props?: Record<PropKey, PropValue>; edgeKinds?: EdgeKind[] };
  scope?: ScopeRef;
  expand?: { hops: number; edgeKinds?: EdgeKind[]; maxFanout?: number };
  k: number;
  asOf?: AsOf;
  rank?: {
    rrfK?: number;
    salienceWeight?: number;
    recencyWeight?: number;
    /** §5.4 `w_c` — additive optional knob (docs/40 MAY-extend); weights the node's authored
     *  `confidence` prop into salience. 0/absent ⇒ the confidence term does not participate. */
    confidenceWeight?: number;
    /** §5.4 `halfLifeMs` recency decay constant (ms). Absent ⇒ `KIP_SALIENCE_HALF_LIFE_MS`. */
    halfLifeMs?: number;
  };
}

export interface RecallResult {
  eid: EID;
  view: NodeView;
  score: number;
  ranks: { vector?: number; graph?: number; salience?: number };
  conflicted: boolean;
  provenance: Provenance;
}

/** The Repo read sub-surface curried at a FIXED AsOf — what `asOf(asOf)` returns. */
export interface ReadView {
  getNode(eid: EID): Promise<NodeView | null>;
  /** ADR-B11c/D-66: `eid`'s OWN `NodeView` at this view's instant — its per-EID cells BEFORE `same_as`
   * canonical resolution (the alias-unmasked read behind the graph-qa prop-union). Applies this view's
   * SAME existence gate + valid-time lens as `getNode`; it differs ONLY in skipping the canonical
   * collapse. READ-ONLY (INV-A1). */
  getNodeRaw(eid: EID): Promise<NodeView | null>;
  getEdge(eid: EID): Promise<EdgeView | null>;
  query(spec: Omit<TraversalSpec, "asOf">): AsyncIterable<NodeView | EdgeView>;
  recall(q: Omit<RecallQuery, "asOf">): Promise<RecallResult[]>;
}

export type RemoteRef = string;
export type BranchRef = string;

export interface SyncOptions {
  fetch?: boolean;
  push?: boolean;
  remoteBranches?: BranchRef[];
  retention?: "default" | "permissive";
}
export interface MergeOptions {
  intoBranch?: BranchRef;
}
export interface MergeReport {
  merged: number;
  conflicts: Conflict[];
  /** D-30: a fact-set digest (`FactSetDigest`), NOT a resolvable git commit `CID` — see that type's doc comment. */
  tip: FactSetDigest;
}
export interface SyncReport {
  received: number;
  sent: number;
  merged: number;
  conflicts: Conflict[];
  /** D-30: a fact-set digest (`FactSetDigest`), NOT a resolvable git commit `CID` — see that type's doc comment. */
  tip: FactSetDigest;
  /**
   * D-32 (docs/DEBTS.md, optional/nice-to-have criterion #8): count of remote facts this `sync()`
   * call's ingest loop rejected specifically with `reason === "signature-invalid"` — distinct from
   * `received`'s plain admit-count, so a reopened replica that lost its signing identity (D-32's
   * central failure mode) silently under-counting `received` is at least OBSERVABLE here instead of
   * indistinguishable from "the peer just had fewer facts". An additive, optional field (docs/40:
   * "Implementations MAY extend these shapes with additional optional fields") — never populated
   * with anything but a real count of THIS call's own rejections.
   */
  signatureInvalid?: number;
  /**
   * D-32 round 2 (major #2 fix): count of remote facts this `sync()` call's ingest loop rejected
   * specifically with `reason === "malformed"` — mirrors `signatureInvalid` above exactly, so a
   * well-formedness rejection is equally OBSERVABLE here rather than silently vanishing from both
   * `received` and `signatureInvalid` (the same silent-drop failure mode D-32 exists to close, just
   * for the other `ingest()` rejection reason, docs/40 "ingest" — `reason?: "malformed" |
   * "signature-invalid"`). When populated, `received + signatureInvalid + malformed ===
   * remoteFacts.length` for this call — the report is provably exhaustive over the remote set.
   */
  malformed?: number;
}

/** A surfaced, never-auto-picked contradiction (§3.4). DATA, not an error. */
export interface Conflict {
  cellId: string;
  eid: EID;
  prop?: PropKey;
  kind: "supersede" | "kip:learn" | "same_as" | "registration" | "custom";
  candidates: FactId[];
}

export interface RollupOptions {
  throughHlc: HlcStamp;
  scope?: ScopeRef;
}

export interface ExcisionMarker {
  markerFactId: FactId;
  excised: FactId;
  nonce: string;
  excisedChainId: ChainId;
  excisedSeq: number;
  excisedReason: "fork" | "malformed" | "gdpr-erasure" | "other";
}

export interface FsckReport {
  ok: boolean;
  headsMatch: boolean;
  /**
   * Attests that the normative m7-4 merge-driver PROVISIONING is present in this repo's local git
   * config: the `[merge "kip-regen"]` section AND its `driver =` command line, plus the `/heads/**` +
   * `/manifest.json` attribute bindings (docs/22 §1.4). ROUND-2 finding #5 (honesty): this is a
   * CONFIG-PRESENCE attestation, NOT a guarantee that an executable `kip merge-regen` binary is
   * resolvable — this SDK ships no such binary and NEVER invokes stock `git merge` (it regenerates
   * `/heads` by folding `proj()` live over the unioned `/facts` on every read, so the named driver is
   * correctly-provisioned-but-inert here). See `Substrate.isMergeDriverInstalled`'s doc comment.
   */
  mergeDriverInstalled: boolean;
  manifestGenesisCidMatch: boolean;
  badSignatures: FactId[];
  authorityViolations: FactId[];
  excisionResidue: EID[];
  missingDurable: FactId[];
  missingNonDurable: FactId[];
  promisorMissingDurable: FactId[];
}

/**
 * TEST-SUPPORT ADDITION (INV-12 byte-DAG half, docs/60-conformance-and-testability.md#inv-12,
 * M3-3/M4-3/m7-26) — NOT part of the documented docs/40-sdk-api-surface.md `Repo` contract
 * (`Repo`'s own members above are transcribed verbatim from that doc). The regenerated git
 * commit DAG is deliberately kept a TRANSPORT detail, never an addressable identity (docs/24 §4.5,
 * the `FactSetDigest` doc comment above, D-27/ADR-B1) — callers never see this shape. It exists
 * solely so a conformance test can inspect the regenerator's byte-level output without reaching
 * into on-disk substrate internals (which this task's scope forbids reading/depending on).
 *
 * Every field here is exactly what INV-12's M4-3 byte-recipe names: a raw regenerated commit
 * object's decomposed identity/author/committer/message/header fields, PLUS the actual bytes and
 * their own content-derived oid, so a test can assert byte-for-byte equality directly (never via
 * a derived/hashed proxy that could itself hide a divergence).
 */
export interface RegeneratedDagCommit {
  /** The regenerated commit object's own content-derived id (a git-blob-style hash of `commitBytes`). */
  commitOid: CID;
  /** The RAW regenerated commit object bytes (header + body) — the actual byte-identity surface INV-12/M4-3 is about. */
  commitBytes: Uint8Array;
  /** Derived by PARSING `commitBytes`' own `author` header line (round 2 FIX 4) — never a hardcoded
   * echo of an input, so this field is a faithful inspection of the artifact itself. */
  author: { name: string; email: string; timestampSeconds: number; tzOffset: string };
  /** MUST be a FIXED SENTINEL identity (M3-3) — never the real fact author's `provenance.author`/key
   * fingerprint. Derived by PARSING `commitBytes`' own `committer` header line (round 2 FIX 4). */
  committer: { name: string; email: string; timestampSeconds: number; tzOffset: string };
  message: string;
  /** Commit `encoding` header, derived by PARSING `commitBytes` for a literal `encoding ` header
   * line (round 2 FIX 4) — never hardcoded. Per INV-12/M4-3: absent, or exactly `"UTF-8"` — never a
   * locale leak. */
  encoding?: "UTF-8";
  /** Whether a `gpgsig` header is present, derived by PARSING `commitBytes` for a literal `gpgsig`
   * header line (round 2 FIX 4) — never hardcoded. Per INV-12/M3-3/M4-3 the regenerated DAG is
   * UNSIGNED: MUST be `false`. */
  signed: boolean;
  /**
   * Round 2 / D-27 FIX 2: this commit's own parent oid in the regenerated chain — `null` for the
   * chain's ROOT commit (the earliest author-HLC-contiguous batch), the real prior batch's
   * `commitOid` otherwise. Docs/23 §5.2's `regenBoundaryRule` table, verbatim: "a regenerated
   * commit's parent is the immediately-preceding regenerated commit in `orderKey`-batch order (the
   * excision-root has no parent)."
   */
  parent: CID | null;
}

/**
 * Round 2 / D-27 FIX 2: `regenerateHeads()`'s return shape now exposes a GENUINE multi-commit DAG
 * (docs/23 §5.2's `regenBoundaryRule`) rather than a single root commit — round 1 built only one
 * commit over the WHOLE admitted set regardless of author-HLC batch boundaries, which a round-1
 * adversarial critic correctly flagged as not actually implementing the spec's batching rule at
 * all. `commits` is the full chain, ROOT FIRST, TIP LAST, one entry per author-HLC-contiguous batch.
 *
 * The top-level `commitOid`/`commitBytes`/`author`/`committer`/`message`/`encoding`/`signed`/
 * `parent` fields (via `RegeneratedDagCommit`) are ALWAYS exactly `commits[commits.length - 1]` —
 * the chain's TIP — kept so the round-1 frozen `inv-12.test.ts` assertions (written against what
 * was then a single-commit return shape) keep passing unchanged against a now-genuinely-multi-commit
 * DAG: that file's own fixtures happen to put every fact on one (replicaId, hlc.wall) batch, so the
 * TIP *is* the whole (one-commit) chain for those two tests specifically.
 */
export interface RegeneratedCommit extends RegeneratedDagCommit {
  /** Every commit in the regenerated chain, ROOT FIRST, TIP LAST — see this interface's own doc
   * comment. Walk `.parent` from the tip (or index backwards through this array) to inspect the
   * DAG's link structure. */
  commits: RegeneratedDagCommit[];
}

/**
 * TODO(M3/T3.5): `SnapshotRef` is normatively defined in docs/25-context-enablement-seams.md (out
 * of scope for this scaffold's reading list). Placeholder shape per ADR-006 / docs/40 comments:
 * content-addresses the chain-seq + author-HLC frontier + `factSetDigest`, deliberately carrying
 * NO commit CIDs (so pins survive excision/regeneration).
 */
export interface SnapshotRef {
  factSetDigest: CID;
  frontier: Frontier;
  /**
   * The valid-time cut of a bitemporal `pin(scope, {validTime})` (round-2 finding #3). Present ONLY
   * for an asOf-valid-time pin; absent for the plain no-asOf chain-frontier pin. It is load-bearing,
   * not advisory: `resolvePin` MUST re-apply this exact cut so the resolved digest is computed over
   * the SAME `{ validFrom ≤ validTimeCut ∧ seq ≤ frontier }` subset the pin captured — future-valid
   * facts (`validFrom > validTimeCut`) are excluded on BOTH sides, so a past-time pin can never leak
   * a fact whose valid-time had not begun by the cut. Carrying the cut in the ref (rather than the
   * frontier alone) is required precisely because `seq` (authoring order) and `validFrom` (valid
   * time) are independent axes: the frontier alone cannot distinguish an in-cut from an out-of-cut
   * fact at the same `seq`.
   */
  validTimeCut?: HlcOrTime;
}

/**
 * TODO(M3/T4.8): `Frontier` is normatively defined in docs/24-synchronization-and-convergence.md /
 * docs/25 (out of scope for this scaffold's reading list). T11.3's exit criteria name a
 * `Frontier.chainSeq` field, which this placeholder reflects: a per-(replicaId,key) chain
 * sequence cursor.
 */
export interface Frontier {
  chainSeq: Record<ChainId, number>;
}

/**
 * TODO(M3/T4.8): `FactDelta` is normatively defined alongside `subscribe()` in docs/24; minimal
 * placeholder — `affected` lists every entity whose head changed (incl. revocation/excision
 * re-folds, per docs/81 T4.8's subtask description).
 */
export interface FactDelta {
  facts: FactId[];
  affected: EID[];
}

// ---------------------------------------------------------------------------
// 6. Active-knowledge (§5b) supporting shapes (docs/31-contextual-functionalities.md, M5/T6.1-T6.7).
//    Transcribed verbatim (normative shape) from the doc's own `FunctionalityBinding`/`ConditionNode`/
//    `ContextualQuery`/`Segment`/`AnswerGraph`/`MicroagentManifest` blocks — every `Repo` method body
//    that consumes/produces these still throws `unimplemented: <name>` (M5 is TEST-FIRST TDD; these
//    are TYPED STUBS only, no behavior). `FunctionalityBinding.tags` is additive (not in docs/31's own
//    field list) purely so `Repo.registerFunctionality`'s existing `Pick<FunctionalityBinding, ...,
//    "tags">` binding-options param (below, docs/40) continues to type-check; docs/31 itself only
//    ever discusses `tags` as MicroagentManifest's own advisory field ("An open free `tag` (manifest
//    `tags`) is also permitted"), so this mirrors that same advisory-only semantics at the binding
//    level, never a gate.
// ---------------------------------------------------------------------------

/** docs/31 §"Functionality descriptor = MicroagentManifest" — the `@a5c-ai/genty-core` isolation enum,
 *  reused verbatim ("do not invent fields"). */
export type IsolationMode = "subprocess" | "worker" | "container";

/** docs/31 §"Functionality descriptor = MicroagentManifest" (normative shape, transcribed verbatim —
 *  the real `@a5c-ai/genty-core` `MicroagentManifest` contract, promoted to the kip-side interface). */
export interface MicroagentManifest {
  name: string; // (name, version) is the registration/selection key (§5b.2 LearnOptions)
  version: string;
  description: string;
  inputSchema: unknown; // JSON Schema for MicroagentInvocation.input
  outputSchema: unknown; // JSON Schema the orchestrator validates MicroagentResult.output against
  isolation: IsolationMode;
  runtime: {
    entrypoint: string; // the executable the runner spawns
    skills?: string[];
    tools?: string[];
    scripts?: string[];
    processes?: string[];
    model?: string;
    timeout?: number;
    env?: Record<string, string>;
  };
  tags?: string[]; // advisory selection metadata only — never a gate
  builtIn?: boolean;
}

/**
 * docs/31's own opening paragraph: "All microagent identifiers (MicroagentManifest,
 * MicroagentInvocation, MicroagentResult, IsolationMode) are the @a5c-ai/genty-core types; do not
 * invent fields." `@a5c-ai/genty-core` is NOT a dependency of this package (see package.json) and
 * this round's hard rules forbid adding a new runtime dependency to reach it — so, mirroring the
 * ALREADY-established convention `MicroagentManifest`/`IsolationMode` set above ("transcribed
 * verbatim, promoted to a kip-side interface"), these two are defined LOCALLY as well, carrying
 * exactly the fields docs/31's own text says the execution path reads: "The execution path reads
 * ONLY MicroagentResult.output, MicroagentResult.exitCode, MicroagentInvocation.input, and the
 * EFFECTIVE timeout" (the "Timeout rule": "the orchestrator MUST set MicroagentInvocation.timeout to
 * the bound manifest's runtime.timeout; that single value is the EFFECTIVE timeout the
 * dispatch-failure outcome is evaluated against").
 *
 * CRITICAL FIX #1 (M5 round-2): round 1 had NO invocation/result shape and NO dispatch seam at
 * all — `executeSegment` fabricated a deterministic placeholder output directly (the exact
 * "fabricating a plausible output" N5 anti-pattern docs/31 forbids) instead of ever constructing an
 * invocation or calling anything. `dispatchMicroagent` below is the real (if minimal) dispatch seam
 * this round adds: an injectable, constructor-supplied function `executeSegment` actually calls,
 * with a documented default stub for the common case where no test cares about a specific dispatch
 * outcome. `elapsedMs` on `MicroagentResult` is this round's own honestly-scoped addition (genty-
 * core's real result shape is not in this task's read docs slice) — it exists purely so the
 * injectable seam has a concrete, deterministic way to report "ran longer than
 * `MicroagentInvocation.timeout`" (INV-A3(c)) without spawning a real subprocess/timer.
 */
export interface MicroagentInvocation {
  id: string;
  manifest: { name: string; version: string };
  input: unknown;
  /** The EFFECTIVE timeout (docs/31's "Timeout rule") — derived from the bound manifest's
   *  `runtime.timeout`, never caller-supplied independently. */
  timeout?: number;
}

export interface MicroagentResult {
  exitCode: number;
  output: unknown;
  /** Honestly-scoped addition (see this section's own doc comment) — when present and greater than
   *  the invoking `MicroagentInvocation.timeout`, `executeSegment` treats the step as dispatch-failure
   *  (INV-A3(c)), exactly like a non-zero `exitCode` or schema-invalid `output`. */
  elapsedMs?: number;
  /**
   * ROUND-3 FIX (MAJOR #5) — an OUT-OF-BAND, non-scored side channel for a dispatch's diagnostics.
   *
   * It exists so a role whose measured `output` must stay a BARE value (the loss body's number,
   * ADR-B10d trap 2) can STILL surface the loss model's `fabricated`/`missing` list to the
   * orchestrator, which records the accepted iteration's `fabricated` on the `kip:learn` audit fact's
   * value JSON. It is deliberately NOT `output`: nothing validates it against the `outputSchema` and
   * nothing scores it, so it cannot perturb the accept/exhaust decision — exactly like `elapsedMs`,
   * it is a report ABOUT the dispatch, never the dispatch's measured result. The orchestrator reads
   * it audit-only (the `kip:learn` fact is a `schema` target whose `cellKeyFor` is `null`, so it can
   * never reach `orderKey`/reducers/trust). */
  diagnostics?: unknown;
}

/** The injectable microagent-dispatch seam (see `MicroagentInvocation`'s own doc comment) —
 *  `KipRepo`'s constructor accepts one; the default (`KipRepo`'s own static
 *  `defaultDispatchMicroagent`) always "succeeds" deterministically so every M5 conformance test that
 *  is NOT deliberately exercising a dispatch-failure outcome continues to materialize a hop's output
 *  through this SAME real dispatch → validate → author pipeline. */
export type DispatchMicroagentFn = (invocation: MicroagentInvocation) => Promise<MicroagentResult>;

/** docs/31 §"FunctionalityBinding (normative shape)" `ConditionNode` — a graded range and/or complex
 *  predicate over projected PropCells (pure over proj; `unknown` cells propagate `unknown`, never
 *  defaulted). A `range` with NEITHER min NOR max, or a NaN/±Infinity numeric leaf, is MALFORMED and
 *  MUST be rejected at registration (ERR_INVALID_WEIGHT, INV-A7) — not enforced by this type alone. */
export type ConditionNode =
  | { kind: "range"; prop: PropKey; min?: PropValue; max?: PropValue }
  | { kind: "cmp"; prop: PropKey; op: "=" | ">" | "<" | ">=" | "<="; value: PropValue }
  | { kind: "all"; of: ReadonlyArray<ConditionNode> }
  | { kind: "any"; of: ReadonlyArray<ConditionNode> };

/** docs/31 §"FunctionalityBinding (normative shape)" — binds a contextual functionality (microagent)
 *  to an EdgeKind in the ontology (transcribed verbatim). This is the COMPILED step-descriptor shape
 *  (what a matched `Segment.steps[i]` carries, docs/31's own Segment doc comment) — NOT a shape the
 *  caller hand-assembles wholesale for `registerFunctionality` (that seam's own `binding?` param below
 *  picks only the caller-supplied subset: `weight`/`condition`/`requires`/`relationClass`/`tags`;
 *  `microagentName`/`version` come from the paired `MicroagentManifest.name`/`.version`, and
 *  `sourceKind`/`targetKind`/`cardinality` are derived by the compiler from the ontology graph — see
 *  docs/40's own "KNOWN GAP" callout on `registerFunctionality`). */
export interface FunctionalityBinding {
  edgeKind: EdgeKind; // the contextual relation this realizes
  microagentName: string; // MicroagentManifest.name (registered descriptor)
  version: string; // MicroagentManifest.version (semver)
  /** Source/target NodeKinds the hop connects; MUST be compatible with the manifest schemas. */
  sourceKind: NodeKind;
  targetKind: NodeKind;
  /** CLAIM-12 CONDITIONAL relation: EdgeKinds whose instances MUST be PRESENT (projected) before this
   *  hop may fire. PURE READ over proj, never against sync state. Distinct from `constraint`. */
  requires?: EdgeKind[];
  /** CLAIM-8 CONSTRAINT relation: a predicate the SEED/INPUT (the patent's "known instance") MUST
   *  satisfy as a precondition of the hop firing — proj VERIFIES the known instance complies. A
   *  non-compliant seed yields the N5-safe `constraint-violation` outcome (INV-A3(e)). */
  constraint?: ConditionNode;
  /** CONDITION NODE — a graded/complex condition gating the hop (claim 12), a PURE READ over proj. */
  condition?: ConditionNode;
  /** WEIGHTED relation — a deterministic priority totally ordering competing bindings/segments at the
   *  SAME asOf. MUST be FINITE: NaN/±Infinity are MALFORMED and rejected at registration
   *  (ERR_INVALID_WEIGHT) — a NaN weight would make the sort NON-TOTAL (N5). */
  weight?: number;
  /** CLAIM-7 RELATION-TYPE TAXONOMY — ADVISORY only; NEVER gates fact membership or hop firing. */
  relationClass?: "social" | "characterizing" | "ownership" | "property" | "identifying";
  /** Advisory manifest-tag override at the binding level (see this section's own top doc comment for
   *  why this field is additive beyond docs/31's own FunctionalityBinding field list). */
  tags?: string[];
  /**
   * Cardinality the hop produces, for DSL `?`/`/` expectation checking (docs/31's kip-flavored query
   * DSL section — `?` expects a list, `/` expects a single). MINOR-FINDING DOCUMENTATION (round 2):
   * `registerFunctionality`'s own binding-options `Pick` (below) has no caller-supplied cardinality
   * field, and no per-`(edgeKind,sourceKind,targetKind)` schema-registration API exists at M5 (see
   * `contextual.ts`'s own top doc comment) from which a REAL per-hop cardinality signal could be
   * derived — so `compiledStepFrom` (below) stamps this as the fixed constant `"many"` for every
   * compiled step. This is an honestly-documented fixed constant with NO CONSUMER in this round (the
   * DSL's own `?`/`/` expectation-checking client layer, docs/31, is explicitly N3-deferred and not
   * implemented at M5), rather than a silently-wrong/fabricated per-hop signal.
   */
  cardinality: "one" | "many";
}

/** docs/31 §"Query → Segment → AnswerGraph (normative shapes)" — a contextual query: a known seed
 *  instance + a desired target type + a linkage expression (transcribed verbatim). */
export interface ContextualQuery {
  seed: EID; // a concrete instance of a known NodeKind the caller already has
  target: NodeKind; // the type of instance the caller wants
  /** Ordered, possibly-PARTIAL linkage constraint — EdgeKinds that MUST appear, IN ORDER, as a
   *  SUBSEQUENCE of any matched Segment.steps. Empty/omitted ⇒ no constraint (compiler discovers a path). */
  via?: EdgeKind[];
  /** Deterministic filters over PROJECTED PropCell values (Unknown cells excluded, never defaulted). */
  filters?: ReadonlyArray<{ prop: PropKey; op: "=" | ">" | "<" | ">=" | "<="; value: PropValue }>;
  /** Compiled & matched against this fact-set frontier and RECORDED in every emitted fact's provenance. */
  asOf?: AsOf;
}

/** docs/31 §"Query → Segment → AnswerGraph (normative shapes)" — a matched segment of the ontology
 *  graph: the ordered chain of contextual EdgeKinds connecting the seed's NodeKind to `target`
 *  (transcribed verbatim; produced by a PURE READ over proj, no dispatch yet). */
export interface Segment {
  /** One entry = one single-step query = one MicroagentInvocation (the patent's "number of
   *  SINGLE-STEP QUERIES", claim 1(d)). For the LINEAR case `deps` is empty/absent and `steps` is a
   *  chain where every adjacent pair's `steps[i].targetKind` MUST equal — or be an `is_a`
   *  supertype-compatible match of — `steps[i+1].sourceKind` (ERR_ILL_TYPED_SEGMENT otherwise). */
  steps: FunctionalityBinding[];
  /** CLAIM-4/CLAIM-1(e)+24 dependency DAG: each `[producer, consumer]` pair (indices into `steps`)
   *  declares that step `consumer` consumes step `producer`'s materialized instance(s). EMPTY/absent
   *  ⇒ the linear case (topo order = `steps[]` index order). A cycle or out-of-range index is
   *  MALFORMED and rejected at compile (ERR_COMPILE_CYCLIC_DEPS, INV-A2). */
  deps?: ReadonlyArray<readonly [producer: number, consumer: number]>;
  /** The OTHER segments that also satisfied the query, ENUMERABLE so the caller can present them.
   *  `alternatives.length > 0` ⇒ a typed CHOICE surfaced to the caller, NEVER an arbitrary pick (N5,
   *  INV-A7); `weight` deterministically ORDERS this list for presentation but never collapses it. */
  alternatives: Segment[];
  /** ADDITIVE (beyond docs/31's own field list — mirroring the precedent already set by
   *  `FunctionalityBinding.tags` above, docs/40's own "KNOWN GAP" note): `executeSegment`'s declared
   *  signature (docs/40) takes no separate seed/asOf parameter, yet PHASE 2 execution MUST start
   *  dispatch from a CONCRETE seed instance and record the RESOLVED `asOf` in provenance (docs/31's
   *  own Phase 2 description) — the compiled `Segment` is the only value that travels from
   *  `compileContextualQuery` to `executeSegment`, so it is the only place this can ride along.
   *  Populated by `compileContextualQuery`, read by `executeSegment`; never part of the byte-identity
   *  comparison INV-A2 actually cares about (that invariant is about `steps`/`deps`/`alternatives`),
   *  and always identical between two replicas compiling the SAME `ContextualQuery` (INV-A2). */
  seed?: EID;
  asOf?: AsOf;
}

/** docs/31 §"Query → Segment → AnswerGraph (normative shapes)" — the patent's "answer graph":
 *  requested + intermediate instances and the relation edges that produced them, expressed PURELY as
 *  `derived_from` provenance over the emitted facts (transcribed verbatim; a READ view, never a
 *  separately-authored authoritative artifact, INV-A8). */
export interface AnswerGraph {
  result: EID[]; // requested-type instances; empty ⇒ no answer (N5, never fabricated)
  intermediates: EID[]; // every in-between instance materialized along the chain
  /** The ORDERED relation-edge chain seed → intermediate[0] → … → result, one entry per executed
   *  step, naming WHICH EdgeKind (and the binding's realizer) connected each pair and the
   *  `derived_from` fact that recorded it. */
  edges: ReadonlyArray<{ from: EID; to: EID; edgeKind: EdgeKind; viaFactId: FactId }>;
  /** Every node/edge linked back to seed and its asserting factId via `derived_from`. `producedBy` is
   *  the FACT-RESIDENT Provenance (never the ephemeral runtime object), so the whole AnswerGraph is a
   *  pure READ over facts (INV-A8). */
  derivedFrom: ReadonlyArray<{ eid: EID; factId: FactId; producedBy: Provenance }>;
}

/** docs/40 LearnOptions — copied verbatim. */
export interface LearnOptions {
  threshold: number;
  maxIterations: number;
  maxWallMs: number;
  maxInvocations: number;
  asOf?: AsOf;
  rawKind: string;
  encode: { name: string; version: string };
  decode: { name: string; version: string };
  learner: { name: string; version: string };
  loss: { name: string; version: string };
}

/** TODO(M6/T7.1): the raw input blob reference threaded into learn(); docs/32. Placeholder. */
export type BlobRefInput = BlobRef;

// ---------------------------------------------------------------------------
// 7. Errors — the typed `KipError` model (docs/40 "Errors", m7-10)
// ---------------------------------------------------------------------------

export type KipErrorCode =
  | "ERR_MALFORMED_INPUT"
  | "ERR_SIGNATURE_INVALID"
  | "ERR_SCOPE_DENIED"
  | "ERR_UNAUTHORIZED_EXCISION"
  | "ERR_EXCISE_EVIDENCE_REQUIRED"
  | "ERR_COMPILE_CYCLIC_DEPS"
  /**
   * Steps chaining violates targetKind→sourceKind compatibility (§5b.1). DOCUMENTED SCOPE NARROWING
   * (round 2, honest-disclosure precedent matching INV-A3(a-c)/INV-A11(b)): `KipRepo`'s own
   * `compileContextualQuery` throws this ONLY for a multi-hop chain whose declared target loops back
   * to the seed's own NodeKind (the self-loop heuristic) — it does NOT implement general
   * per-adjacent-pair `steps[i].targetKind` vs `steps[i+1].sourceKind` compatibility checking, because
   * no `NodeKindDef`/`is_a` schema-registration API exists at M5 from which a REAL per-hop kind signal
   * could be derived (see `compileContextualQuery`'s own doc comment for the full reasoning). This is
   * named here, not silently claimed as general adjacency enforcement this build does not have.
   */
  | "ERR_ILL_TYPED_SEGMENT"
  | "ERR_UNREGISTERED_MANIFEST"
  /**
   * M7 round-2 (convergence-safety / security — authority-escalation surface): `runAcquisition`
   * commits an acquisition family microagent's `AcquisitionResult.proposed` as immediately-effective
   * ORCHESTRATOR-SIGNED facts. The full untrusted/quarantine trust overlay (INV-A10(a) §8.1) is M8,
   * so until it lands `runAcquisition` MUST NOT let a (possibly compromised/malicious) acquisition
   * microagent mint CONTROL-PLANE / authority facts — a `schema`/`key`/`control` target would
   * otherwise be authored as authoritative state (a microagent-registration a later dispatch resolves,
   * a key/schema fact, etc.). Authority facts are NEVER acquisition-authored: a proposed entry whose
   * target is not a DATA target (`node`/`edge`/`node-prop`/`edge-prop`) is rejected with this code
   * BEFORE the commit txn opens (no partial facts). `same_as` merge facts the seam authors itself are
   * ordinary data edges and unaffected.
   */
  | "ERR_ACQUISITION_TARGET_FORBIDDEN"
  /**
   * M7 round-2 (INV-A10 divergent-registration clause, docs/33 §Conformance / docs/40): two
   * microagent-registrations of the SAME `(name, version)` carrying DIVERGENT manifest descriptors
   * read CONFLICTED — "a LWW-overwrite fails" (docs/60 INV-A10). `runAcquisition` therefore refuses
   * to dispatch a family whose named `(name, version)` registration is conflicted, rather than
   * silently LWW-picking one of the divergent descriptors (the violating build docs/60 flags, and a
   * silent-pick N5/CLAUDE.md "fallbacks are evil" forbids). Thrown BEFORE any dispatch — no microagent
   * runs, no fact is authored. A single registration (or repeated registration of the byte-identical
   * descriptor) is not conflicted and dispatches normally.
   */
  | "ERR_CONFLICTED_REGISTRATION"
  | "ERR_INVALID_WEIGHT"
  | "ERR_HASH_ALGO_MISMATCH"
  | "ERR_MANIFEST_FORK"
  | "ERR_NO_PROMISOR_PEER"
  /**
   * D-27 FIX 2 (round 3, `regenerateHeads()`-only, test-support surface — see that method's own
   * doc comment): this replica's configured `regenBoundaryRule` (manifest-persisted or constructor-
   * supplied) names a batching rule other than the one `regenerateHeads()` actually implements
   * (`"author-hlc-contiguous"`, docs/23 §5.2 rule (a)). Thrown rather than silently regenerating
   * under a different rule than configured — closing round 2's adversarially-flagged
   * config/behavior disconnect (the manifest's old `"per-commit"` default matched NEITHER
   * spec-named rule while `regenerateHeads()` silently always ran rule (a) regardless).
   */
  | "ERR_UNSUPPORTED_REGEN_BOUNDARY_RULE"
  /**
   * ROUND-4 FIX (finding #3, honest-disclosure precedent matching ERR_ILL_TYPED_SEGMENT's own
   * DOCUMENTED SCOPE NARROWING above): docs/31 §"Single-step decomposition" (D-5b.8) names a REAL
   * capability — "a step MAY consume more than one upstream instance (multi-input join)" — that this
   * build does NOT implement. `executeSegment`'s deps-based producer resolution can only thread a
   * SINGLE materialized producer into each step's `MicroagentInvocation.input`; a `Segment.deps` DAG
   * whose consumer has more than one distinct producer (reachable today via `compileContextualQuery`
   * itself: a step declaring more than one `requires` EdgeKind, each satisfied by a DIFFERENT other
   * step in the same segment, mints exactly this shape) is REJECTED here rather than silently
   * narrowed to just the first-materialized producer — which would fabricate a plausible single-input
   * answer over an incomplete input, the exact silent-narrowing hazard N5 forbids. Thrown by
   * `compileContextualQuery` (rejecting that candidate chain, mirroring how `ERR_COMPILE_CYCLIC_DEPS`
   * excludes a malformed combination from `alternatives` rather than silently admitting it) AND
   * defensively by `executeSegment` itself (for a hand-built `Segment` bypassing compile). A REAL
   * multi-input join (threading every producer into `MicroagentInvocation.input`, and defining what
   * `constraint`/`condition` even means against more than one producer's PropCells) is un-spec'd
   * machinery beyond this round's scope — tracked as a residual for a future round, never silently
   * implemented as a guess.
   */
  | "ERR_MULTI_INPUT_JOIN_UNSUPPORTED"
  /**
   * D-33 FIX (round 6 debt closure, INV-A2): `compileContextualQuery` rejects a `ContextualQuery.asOf`
   * that names a `txTime` outright, rather than silently routing it through
   * `selectFactsForContextualAsOf`/`selectFactsForAsOf`'s txTime branch. `asOf({txTime, believer})`'s
   * OWN doc comment (see `asOf()` above) already establishes `txTime` as a per-replica belief-AUDIT
   * axis, resolved via `rxFromByOid` — "this replica's OWN receive-tick history", genuinely
   * non-convergent state two replicas can disagree on even for the identical admitted fact set (e.g.
   * the same facts ingested in a different order, ordinary under eventual consistency). INV-A2
   * promises "two replicas compiling the same ContextualQuery at the same asOf produce byte-identical
   * Segment sets" — a promise `txTime` cannot honor for this seam, since it would make the compiled
   * Segment set depend on which replica compiled it and in what order it happened to receive facts.
   * Rather than silently stripping `txTime` (which would make `compileContextualQuery` compile
   * against a DIFFERENT, unrequested frontier than the caller pinned, an equally dishonest silent
   * substitution — N5), the caller's request is rejected outright: `validTime` remains the only
   * convergent pinning axis this compile-determinism seam accepts (see
   * `selectFactsForContextualAsOf`'s own doc comment for how `validTime` alone continues to work).
   *
   * D-33 FOLLOW-UP FIX (round 7 debt closure, attempt 2): adversarial review found `compileContextual
   * Query` was only ONE of three reachable entry points into `selectFactsForContextualAsOf`'s txTime
   * branch. `executeSegment(segment, { asOf })` — a public method a caller can invoke DIRECTLY with a
   * hand-built `Segment`, entirely bypassing `compileContextualQuery`'s guard — and `getLearnResult`'s
   * own `asOf` param both threaded an unguarded `txTime` into the identical non-convergent
   * `rxFromByOid` path. Both now throw this SAME code (rather than minting a distinct one) for the
   * identical INV-A2 reasoning: `executeSegment`'s case is in fact WORSE than a merely-divergent
   * compiled `Segment`, since a pinned `asOf.txTime` there would make DURABLE, signed facts
   * (materialized/dispatched/deduped via the INV-A6 idempotence check) diverge across replicas.
   */
  | "ERR_ASOF_TXTIME_NOT_SUPPORTED_FOR_COMPILE"
  /**
   * ROUND-4 (M6, part b — defense-in-depth against ANY unforeseen accept-commit failure): `learn()`'s
   * accept-commit sequence (existence facts + accepted `AssertInput[]` + the final `kip:learn` audit
   * fact) commits several facts one at a time (`Repo.txn()`/`Tx` are still unimplemented throwing
   * stubs in this build, so a real all-or-nothing transaction is not available — see `learn()`'s own
   * doc comment). Part (a) above closes every KNOWN malformed-target vector before a candidate can
   * ever reach this sequence, but `assertFact`'s own `checkWellFormed` (or `ensureExistenceFor`, or
   * `assertFact` itself) MAY still reject/throw for some OTHER, unforeseen reason after one or more
   * earlier items in the SAME accepted batch already committed durably. Thrown (never left to escape
   * as a raw, untyped exception) once a `kip:learn-exhausted` marker recording the failure reason and
   * every already-committed fact id has been durably authored — so this outcome is NEVER
   * silent/unaudited (N5), even though it is not the ordinary `"accept"`/`"exhausted"` return
   * contract `learn()` otherwise promises.
   */
  | "ERR_LEARN_COMMIT_FAILED"
  /**
   * D-36 closure: `KipRepo.txn()` is now a REAL, atomic transaction (see `txn()`'s own doc comment)
   * — this replica tracks whether one is already active via a single instance flag, and rejects a
   * nested `txn()` call (one made from inside an already-active txn's own callback) immediately,
   * rather than silently flattening it into the outer transaction's staging array (which would let
   * an inner abort's discard also wipe the outer's already-staged writes, or vice versa — neither is
   * a sound semantics this build invents a guess for) or letting it corrupt/queue behind the outer
   * one. The inner `txn()` call's own promise rejects with this code before its own callback is ever
   * invoked (D-36 test (6)).
   *
   * ROUND-2 CRITIC FIX (finding 3): also thrown by `assertFact`/`retractFact` themselves when called
   * DIRECTLY (not via an active txn's own `tx.assertFact`/`tx.retractFact`) while some OTHER `txn()`
   * call is active elsewhere on this same instance — refusing outright rather than silently absorbing
   * the unrelated write into that other transaction's staging array (see `assertFact`'s own doc
   * comment).
   */
  | "ERR_TXN_ALREADY_ACTIVE"
  /**
   * ROUND-3 CRITIC FIX (code-quality, major finding 1): `txn()`'s post-ingest rollback loop
   * (`for (const oid of rollbackOids) substrate.erase(oid)`) itself calls into `Substrate.erase()`,
   * which is UNGUARDED (`fs.rmSync`/`fs.writeFileSync`, substrate.ts) and can genuinely throw (a
   * Windows file-lock EBUSY/EPERM, disk-full, permission errors). Fallbacks are evil (CLAUDE.md): a
   * rollback-erase failure is never silently swallowed, never allowed to mask the ORIGINAL commit
   * failure that triggered the rollback in the first place, and never allowed to skip resetting this
   * instance's own txn state. When one or more `oid`s fail to erase during rollback, `txn()` attempts
   * every remaining oid anyway (never abandons the loop after the first failure), ALWAYS resets
   * `txnActive`/staging state (so this instance is never permanently poisoned), and throws exactly
   * ONE `KipError` with this code naming BOTH the original failure reason (`context.originalError`)
   * AND the oid(s) that could not be erased (`context.eraseFailures`) — so a caller/auditor knows
   * precisely which facts may have survived a failed rollback, rather than silently dropping either
   * piece of information. See `txn()`'s own doc comment.
   */
  | "ERR_TXN_ROLLBACK_FAILED"
  /**
   * ROUND-5 CRITIC FIX (all 3 fresh critics independently reproduced, Critical #1): `txn()`'s
   * post-commit-success tail — folding the shadow seq/hlc clone into the REAL `chainSequencer`/
   * `localHlc` fields and persisting the result via a SECOND, final `SeqTipStore.save()` call — runs
   * strictly AFTER the real git commit object is written, every staged fact is durably ingested, AND
   * `CommitTipStore.save()` has already durably advanced the commit tip (all three already covered by
   * the EARLIER guarded try/catch+rollback block above). By the time this tail runs, the commit itself
   * has ALREADY, GENUINELY, DURABLY succeeded — only this call's own local seq/hlc TIP-BOOKKEEPING
   * write can still fail. Reordering `SeqTipStore.save()` to happen BEFORE the commit-tip save (so it
   * shares the EARLIER block's rollback) was considered and rejected: that would require also being
   * able to roll back an already-successful `SeqTipStore.save()` write if a LATER step in that same
   * guarded block then failed, to preserve `mintFact`'s own documented "an aborted/rolled-back txn
   * never permanently burns a seq number" invariant (finding 2 above) — real, working rollback
   * machinery this round doesn't need to invent when a narrower, correctly-scoped fix suffices.
   * Thrown ONLY for this specific, narrow failure — NEVER the generic/untyped rejection that (pre-fix)
   * misleadingly implied nothing had been committed, and NEVER left to escape while skipping
   * `resetTxnState()` (which — pre-fix — permanently stuck `txnActive` `true` forever, rejecting every
   * subsequent `txn()`/direct `assertFact`/`retractFact` call on this instance with
   * `ERR_TXN_ALREADY_ACTIVE`, and — chained through `learn()` — silently starved
   * `authorLearnExhaustedMarker()`'s own fresh `this.txn(...)` call of ever running, since THAT call
   * would itself immediately hit the same poisoned-instance rejection). `context.commitOid` names the
   * commit that DID durably succeed; the in-memory `chainSequencer`/`localHlc` are folded BEFORE this
   * write is attempted, so this live instance keeps minting from the correct, already-advanced state
   * regardless of whether the persist call itself failed (and self-heals the on-disk tip file on the
   * very next mint outside any txn, since `mintFact`'s own non-txn branch calls `SeqTipStore.save()` on
   * every mint) — only a crash before that next write, on a substrate then reopened elsewhere, remains
   * an acknowledged residual gap, matching this method's own documented "no cross-instance file-
   * locking" concurrency-scope narrowing (see `txn()`'s own doc comment).
   */
  | "ERR_TXN_TIP_PERSIST_FAILED"
  /**
   * D-36 ROUND-6 CRITIC FIX (correctness — a `tx` handle invoked after its own `txn()` call already
   * settled): `tx.assertFact`/`tx.retractFact` (the closures `txn()`, above, hands to `fn`) capture
   * their OWNING txn() call's own `txnToken` at construction time and, before delegating into
   * `this.assertFact`/`this.retractFact`, now check that THIS SPECIFIC captured token still
   * `===`-matches `this.txnToken` (the CURRENTLY active txn's token, `undefined` once none is
   * active). Before this fix, a `tx` handle captured by out-of-band code (e.g. an unawaited
   * `setTimeout`/callback closure inside `fn`, invoked after `fn` itself already returned AND the
   * whole `txn()` call already settled — committed OR aborted) fell through BOTH of `assertFact`'s/
   * `retractFact`'s own guards: `isThisActiveTxnsOwnDelegatedCall` is `false` (its own `this.txnToken
   * !== undefined` check fails, since `resetTxnState()` already cleared it), but `this.txnActive` is
   * ALSO `false` by then — so `this.txnActive && !isThisActiveTxnsOwnDelegatedCall` never fires
   * either, and the stale call silently proceeded as an ORDINARY, immediately-durable DIRECT write,
   * entirely outside the already-committed-or-aborted transaction it appears to belong to (a fact
   * minted and durably ingested with no txn ever "owning" it). This is thrown instead, BEFORE
   * `this.assertFact`/`this.retractFact` is ever called — so a settled txn's stale handle can never
   * mint a seq/hlc tick or touch the substrate at all (fallbacks are evil: never silently absorbed as
   * an unrelated direct write).
   */
  | "ERR_TXN_ALREADY_SETTLED";

// ---------------------------------------------------------------------------
// 8. `Repo` — the working surface (docs/40 "Repo — the working surface", verbatim)
// ---------------------------------------------------------------------------

export interface Repo {
  branch(): string;
  withScope(scope: ScopeRef): Repo;

  txn<T>(fn: (tx: Tx) => Promise<T>): Promise<{ result: T; commit: CID }>;
  commit(message?: string): Promise<CID>;

  assertFact(input: AssertInput): Promise<Pick<Fact, "id" | "hlc" | "seq"> & { status: "pending" | "durable" }>;
  retractFact(input: RetractInput): Promise<Pick<Fact, "id" | "hlc" | "seq"> & { status: "pending" | "durable" }>;
  supersedeFact(
    input: SupersedeInput,
  ): Promise<Pick<Fact, "id" | "hlc" | "seq"> & { status: "pending" | "durable" }>;
  reAttestFact(
    input: ReAttestInput,
  ): Promise<Pick<Fact, "id" | "hlc" | "seq"> & { status: "pending" | "durable" }>;

  ingest(f: Fact): Promise<{ admitted: boolean; reason?: "malformed" | "signature-invalid" }>;

  putNode(node: NodePut): Promise<EID>;
  putEdge(edge: EdgePut): Promise<EID>;

  getNode(eid: EID, asOf?: AsOf): Promise<NodeView | null>;
  getEdge(eid: EID, asOf?: AsOf): Promise<EdgeView | null>;
  query(spec: TraversalSpec): AsyncIterable<NodeView | EdgeView>;
  recall(q: RecallQuery): Promise<RecallResult[]>;
  asOf(asOf: AsOf): Promise<ReadView>;

  pin(scope: ScopeRef, asOf?: AsOf): Promise<SnapshotRef>;
  resolvePin(
    ref: SnapshotRef,
  ): Promise<{ status: "pin-incomplete" } | { status: "pin-complete"; factSetDigest: CID }>;
  sync(remote: RemoteRef, opts?: SyncOptions): Promise<SyncReport>;
  merge(from: BranchRef, opts?: MergeOptions): Promise<MergeReport>;
  subscribe(scope: ScopeRef, since?: Frontier): AsyncIterable<FactDelta>;

  provenanceOf(ref: EID | FactId): Promise<Provenance[]>;
  /**
   * READ-ONLY (INV-A1): the `FactId` of the winning existence assert backing edge `eid` at `asOf`
   * (`null` when no edge is valid there). The EDGE analogue of a node-prop `PropCell` value segment's
   * `assertedBy` (already surfaced on `getNode`) — the seam the graph-QA microagent
   * (docs/design/kip-graph-qa.md §3.2/§4) binds an edge CLAIM to its signed edge fact through:
   * `provenanceOf(eid)` surfaces a fact's `Provenance` but NOT its content-addressed `FactId`, so an
   * edge citation (whose `factId` must trace to a real signed fact) has no other read-surface source
   * for the id. A pure read over `proj`; authors nothing.
   */
  edgeExistenceFactId(eid: EID, asOf?: AsOf): Promise<FactId | null>;
  /**
   * READ-ONLY (INV-A1, ADR-B11b): the sorted, live-gated `EID`s of every node the admitted set names,
   * optionally restricted to eids starting with ANY of `opts.prefixes`. The minimal node-enumeration
   * seam the deterministic entity-linker (`kip link`) uses to see every live `code:*`/`doc:*` node,
   * derived from the SAME node-existence scan `computeRecall` performs — no proj change, authors nothing.
   */
  nodeEids(opts?: { prefixes?: string[] }): Promise<EID[]>;
  /**
   * READ-ONLY (INV-A1, ADR-B12b): the sorted `EID`s of every currently-existing edge the admitted set
   * names, optionally restricted to `opts.kinds` (an edge whose `edgeKind` is in the list). The edge
   * analogue of `nodeEids` — the enumeration seam the model-assisted Layer-2 resolver (`kip resolve`)
   * uses to see the already-decided `same_as`/`not_same_as`/`kip:same_as?` pairs (to exclude them from
   * re-adjudication) and to list outstanding candidates. Live-gated on edge existence at `opts.asOf`
   * (retracted edges drop); a pure read over `proj`, authors nothing.
   */
  edgeEids(opts?: { kinds?: EdgeKind[]; asOf?: AsOf }): Promise<EID[]>;
  /**
   * READ-ONLY (INV-A1, ADR-B11c/D-66): the sorted `same_as` equivalence class of `eid` — every EID proj
   * folds into `eid`'s union-find class — or `[eid]` when `eid` has no `same_as` edge. Derived from proj's
   * ALREADY-computed class members (no second closure), so it cannot diverge from the canonical-EID
   * node-merge; a pure read over the current fact set. The retrieval-layer prop-union (graph-qa) enumerates
   * a seed's class, then reads EACH member's OWN cells via `getNodeRaw`, so a query seeded on one alias
   * returns the UNION of the class's distinct props. Merge semantics are UNCHANGED — this only exposes the
   * closure; authors nothing.
   */
  sameAsClass(eid: EID): Promise<EID[]>;
  /**
   * READ-ONLY (INV-A1, ADR-B11c/D-66): `eid`'s OWN projected `NodeView` — its per-EID cells BEFORE `same_as`
   * canonical resolution — or `null` for a ghost/absent eid. Identical to `getNode` for every eid that is NOT
   * a non-canonical `same_as` alias; for such an alias it returns the alias's OWN props that `getNode` masks
   * behind the canonical member's cells. Applies the SAME live-existence gate + excision lens (and the SAME
   * `asOf` lens when given) as `getNode` — it differs ONLY in skipping the canonical collapse. The
   * union-hydration seam behind the graph-qa `same_as` prop-union; authors nothing.
   */
  getNodeRaw(eid: EID, asOf?: AsOf): Promise<NodeView | null>;
  rollup(opts: RollupOptions): Promise<CID>;
  tombstone(eid: EID, reason: string): Promise<FactId>;
  excise(factId: FactId, reason: string): Promise<ExcisionMarker>;
  revokeKey(
    keyFpr: string,
    effectiveFrom: HlcStamp,
    reason: string,
    mode?: "ordinary-cutoff" | "causal-cutoff",
  ): Promise<FactId>;
  fsck(): Promise<FsckReport>;

  /**
   * SCHEMA SLICE 1 (docs/21 §3): declare a node kind as a VERSIONED ontology FACT. Authors exactly ONE
   * signed `{ kind:"schema", ontologyRef:"kip:node-kind/<def.kind>" }` fact carrying `def` (mirroring
   * `registerFunctionality`'s orchestrator-signed schema-fact channel — INV-A1, nothing else writes).
   * Schema is NOT a write-time gate: declaring it never rejects or throws on any fact. `proj` validates
   * nodes of this kind against `def.props` and surfaces violations as `kip:schema-violation`
   * (`NodeView.schemaViolations`). Grow-only: declaring a schema AFTER a node exists re-projects that
   * node on the next read. Returns the schema fact's `FactId`.
   */
  registerSchema(def: NodeKindDef): Promise<FactId>;
  /**
   * SCHEMA SLICE 1 (docs/21 §3): read back the currently-declared `NodeKindDef` for `kind` (the
   * orderKey-winning `kip:node-kind/<kind>` schema fact), or `null` if none is declared. As-of-queryable
   * (the def is stored as a fact with a real `validFrom`): a schema declared at t2 is absent at an `asOf`
   * before t2. READ-ONLY (authors nothing, INV-A1).
   */
  getSchema(kind: NodeKind, asOf?: AsOf): Promise<NodeKindDef | null>;

  registerFunctionality(
    edgeKind: EdgeKind,
    manifest: MicroagentManifest,
    binding?: Pick<FunctionalityBinding, "weight" | "condition" | "constraint" | "requires" | "relationClass" | "tags">,
  ): Promise<FactId>;
  compileContextualQuery(q: ContextualQuery): Promise<Segment>;
  executeSegment(segment: Segment, opts?: { asOf?: AsOf }): Promise<AnswerGraph>;
  runContextualQuery(q: ContextualQuery): Promise<AnswerGraph | { kind: "choice"; segments: Segment[] }>;
  runAcquisition(
    manifest: MicroagentManifest,
    input: unknown,
    opts?: { asOf?: AsOf },
  ): Promise<{ facts: FactId[] }>;
  learn(
    rawRef: BlobRefInput,
    opts: LearnOptions,
  ): Promise<{
    facts: FactId[];
    loss: number;
    status: "accept" | "exhausted";
    /** ROUND-3 FIX (MAJOR #5): the loss model's fabrication indictment for the ACCEPTED
     *  reconstruction (empty on `exhausted` or when nothing was indicted) — the same list recorded on
     *  the `kip:learn` audit fact's value JSON, surfaced so `--json` is no longer blind to it. */
    fabricated: string[];
  }>;
  /**
   * ADR-B10a — the blob gap. `putBlob` turns bytes into a REAL content-addressed `BlobRef` (the git
   * loose-object hash `blob <len>\0<content>`, the same one `mintFact` uses for `Fact.id`);
   * `getBlob` resolves one back, `null` for a genuinely absent oid and `ERR_MALFORMED_INPUT` on a
   * hash mismatch — never a zero-length buffer, never a partial read (N5).
   *
   * A blob is CONTENT addressed by hash; it is **not a member of S and it is not knowledge**. These
   * MUST NOT touch `writeFactBlob`/the facts index, MUST NOT involve `proj` in any way, and MUST NOT
   * author, sign, or mint a fact (so they need no keyring).
   */
  putBlob(content: Uint8Array): Promise<BlobRef>;
  getBlob(ref: BlobRef): Promise<Uint8Array | null>;
}
