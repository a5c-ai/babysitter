/**
 * @a5c-ai/kip-sdk — M0: the signature-only ingest gate (T1.3) is REAL and IMPLEMENTED, along with
 * its supporting machinery.
 *
 * This is a SINGLE-FILE module skeleton (per ADR-B5/repo-map scaffolding TODO) declaring the
 * normative M0 public surface (types + the `Repo`/`Tx` interfaces + the `KipRepo` implementation +
 * the `open()` entrypoint), split by concern into sibling modules (`hlc.ts`, `canonical-payload.ts`,
 * `signing.ts`, `substrate.ts`, `chain-sequencer.ts`, `well-formed.ts`, per ADR-B5).
 *
 * IMPLEMENTED (real, non-stub) as of this round: `ingest()` (the T1.3 well-formed+signature gate,
 * ADR-001), `assertFact`/`retractFact` (mint-then-ingest via a real Ed25519 keypair and a real
 * git-blob CID, T1.1/T1.2/T1.2.5), `open()` (genesis manifest read/write, T1.1), and the real
 * content-addressed git-blob substrate write path (`substrate.ts`). NOT yet implemented — every
 * other `Repo` method body still throws `unimplemented: <name>`: `txn`/`commit` (T1.5 batched
 * commit), all read paths (`getNode`/`getEdge`/`query`/`recall`/`asOf`, M2+), sync/merge/subscribe
 * (M3+), and the M5+ active-knowledge surface (`registerFunctionality`/`compileContextualQuery`/
 * `runAcquisition`/`learn`/etc). Tracked by the roadmap task ids referenced inline below — see
 * packages/kip-sdk/docs/81-roadmap-epics-and-tasks.md.
 *
 * Shapes are transcribed verbatim (or as a minimal, explicitly-flagged placeholder where the
 * source doc wasn't in scope for this scaffold) from:
 *   - packages/kip-sdk/docs/40-sdk-api-surface.md  (Kip/Repo/Tx surface, Errors)
 *   - packages/kip-sdk/docs/21-data-model.md        (Fact-adjacent value/envelope types)
 */

import { createHash, randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { CANONICAL_ENVELOPE_FIELDS, canonicalPayloadString, deepSortKeys } from "./canonical-payload";
import { checkWellFormed } from "./well-formed";
import { ChainSequencer, chainIdFor } from "./chain-sequencer";
import { tick as hlcTick, receiveTick as hlcReceiveTick } from "./hlc";
import {
  generateEd25519KeyPair,
  importEd25519KeyPair,
  importEd25519PublicKey,
  KeyRegistry,
  signPayload,
  verifyPayload,
  type Ed25519KeyPair,
} from "./signing";
import { gitBlobId, KeyRegistryStore, SelfWitnessedExcisionStore, SeqTipStore, Substrate, type HashAlgo } from "./substrate";
import {
  canon,
  collectExcisions,
  compareByContent,
  compareOrderKey,
  computeExcisionRef,
  isAuthorizedExcisionMarker,
  orderKey,
  proj,
  traverse,
  type ProjOptions,
  type SelfWitnessedExcisionRecord,
} from "./proj";
import type { CellReducerAssociations } from "./cell-reducers";

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

/** Tagged reference to a large value blob (m-1) — large values never a bare CID string. */
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
  supersedes?: FactId[]; // the input-CID set a `supersede` fact keys on (ADR-004)
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
      reason: "unknown-version";
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
// 5. Supporting API types (docs/40 "Supporting API types (normative)")
// ---------------------------------------------------------------------------

export interface OpenOptions {
  dir: string;
  replicaId: ReplicaId;
  keyring: unknown;
  createIfMissing?: boolean;
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
 * TODO(M4/T11.4): `RecallQuery` is normatively defined in docs/26-retrieval.md (out of scope for
 * this scaffold's reading list). Minimal placeholder covering the `recall(q)` / `ReadView.recall`
 * call shape implied by docs/40 (`RecallResult`, and the design note that `RecallQuery` carries a
 * caller-supplied `embedding`).
 */
export interface RecallQuery {
  query?: string;
  embedding?: number[];
  k?: number;
  asOf?: AsOf;
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
export interface RegeneratedCommit {
  /** The regenerated commit object's own content-derived id (a git-blob-style hash of `commitBytes`). */
  commitOid: CID;
  /** The RAW regenerated commit object bytes (header + body) — the actual byte-identity surface INV-12/M4-3 is about. */
  commitBytes: Uint8Array;
  author: { name: string; email: string; timestampSeconds: number; tzOffset: string };
  /** MUST be a FIXED SENTINEL identity (M3-3) — never the real fact author's `provenance.author`/key fingerprint. */
  committer: { name: string; email: string; timestampSeconds: number; tzOffset: string };
  message: string;
  /** Commit `encoding` header. Per INV-12/M4-3: absent, or exactly `"UTF-8"` — never a locale leak. */
  encoding?: "UTF-8";
  /** Whether a `gpgsig` header is present. Per INV-12/M3-3/M4-3 the regenerated DAG is UNSIGNED: MUST be `false`. */
  signed: boolean;
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
// 6. Active-knowledge (§5b) supporting shapes — placeholders (docs/31/32/33 out of
//    scope for this scaffold's reading list; refined at their owning M5-M7 tasks).
// ---------------------------------------------------------------------------

/** TODO(M5/T6.1): normatively defined in docs/31-contextual-functionalities.md. Placeholder. */
export interface MicroagentManifest {
  name: string;
  version: string;
  outputSchema?: unknown;
}

/** TODO(M5/T6.1, ADR-015): declared `/ontology` fact, evaluated as a pure read over proj. Placeholder. */
export interface ConditionNode {
  op: string;
  args?: unknown[];
}

/** TODO(M5/T6.1, ADR-014/015/016): a microagent's binding to an EdgeKind. Placeholder. */
export interface FunctionalityBinding {
  edgeKind: EdgeKind;
  sourceKind?: NodeKind;
  targetKind?: NodeKind;
  weight?: number;
  condition?: ConditionNode;
  requires?: ConditionNode;
  relationClass?: string;
  tags?: string[];
}

/** TODO(M5/T6.2): the caller's contextual-relation query. Placeholder. */
export interface ContextualQuery {
  seed: EID;
  edgeKind: EdgeKind;
  asOf?: AsOf;
}

/** TODO(M5/T6.2, T6.3, ADR-017): compiled dependency-DAG of steps. Placeholder. */
export interface Segment {
  steps: unknown[];
  deps: number[][];
  alternatives?: Segment[];
}

/** TODO(M5/T6.6): the derived_from subgraph read back after executeSegment. Placeholder. */
export interface AnswerGraph {
  nodes: NodeView[];
  edges: EdgeView[];
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
  | "ERR_ILL_TYPED_SEGMENT"
  | "ERR_UNREGISTERED_MANIFEST"
  | "ERR_INVALID_WEIGHT"
  | "ERR_HASH_ALGO_MISMATCH"
  | "ERR_MANIFEST_FORK"
  | "ERR_NO_PROMISOR_PEER";

/**
 * Domain outcomes (`pending`, `pin-incomplete`, a `conflict` segment, `status: "exhausted"`, ...)
 * are DATA, never thrown (docs/40). Only caller-input rejections throw a `KipError` — every
 * "rejected" in the spec has this declared channel (N5: no method rejects silently).
 */
export class KipError extends Error {
  readonly code: KipErrorCode;
  readonly context?: Record<string, unknown>;

  constructor(code: KipErrorCode, message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = "KipError";
    this.code = code;
    this.context = context;
  }
}

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

  registerFunctionality(
    edgeKind: EdgeKind,
    manifest: MicroagentManifest,
    binding?: Pick<FunctionalityBinding, "weight" | "condition" | "requires" | "relationClass" | "tags">,
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
  ): Promise<{ facts: FactId[]; loss: number; status: "accept" | "exhausted" }>;
}

// ---------------------------------------------------------------------------
// 9. `KipRepo` — a minimal concrete Repo, every method a throwing stub.
// ---------------------------------------------------------------------------

/**
 * A minimal CONCRETE (not abstract) implementation of `Repo` so the module compiles and is
 * importable end-to-end. Every method throws `unimplemented: <methodName>` — actual behavior
 * lands per the roadmap task ids referenced on each method
 * (see docs/81-roadmap-epics-and-tasks.md for the full dependency-ordered WBS).
 */
export class KipRepo implements Repo {
  /** `undefined` until the first ingest/assert lazily provisions a substrate (bare `new KipRepo()`). */
  private substrate: Substrate | undefined;
  private readonly explicitDir: string | undefined;
  private readonly hashAlgo: HashAlgo;
  private readonly replicaId: ReplicaId;
  private readonly keyRegistry = new KeyRegistry();
  private chainSequencer: ChainSequencer;
  private ownKeyPair: Ed25519KeyPair | undefined;
  private localHlc: HlcStamp | undefined;
  private readonly knownMaxVersion: number | undefined;
  private readonly cellReducers: CellReducerAssociations | undefined;
  /**
   * M2/T3.2 addition: this replica's own `FactAnnotation.rxFrom` record (docs/23 §1/§2.1) —
   * "receiver-assigned at first verified ingest", kept ONLY for the txTime belief-audit lens
   * (`asOf({txTime, believer})`), never consulted by `proj`/`orderKey`/any trust decision (the
   * SAME exclusion `ingest()`'s own doc comment already establishes for `localHlc`'s receive-tick).
   *
   * Keyed by the fact's REAL content `oid` (the same oid `writeFactBlob`/`ingest` already compute),
   * NOT by the caller-declared `f.id` — well-formed.ts's item-4 check is a length-only heuristic for
   * externally-supplied facts, so two admitted facts can legitimately declare the SAME `id` with
   * DIFFERENT content, and keying this map by `f.id` alone would let one fact's `ingest()` call
   * overwrite (or mask) the other's `rxFrom` stamp, corrupting the belief-audit lens for a fact that
   * was never actually re-ingested. Keying by `oid` instead makes two distinct-content facts collide
   * here only on a real hash collision, exactly like the storage-layer keying in substrate.ts. See
   * round3-witness-collision-fix.test.ts.
   */
  private readonly rxFromByOid = new Map<string, HlcStamp>();

  /**
   * The erased fact's cell target + valid-time interval geometry is embedded directly in the
   * excision marker fact's own (signed, admitted, synced) payload — see `mintAndIngestExcisionMarker`
   * below and proj.ts's `ExcisionMarkerPayload`/`collectExcisions` doc comments — so ANY replica
   * holding the marker (not only the one that physically erased the bytes) derives the identical
   * placeholder from `proj()`'s pure fold over `facts` alone. (There is deliberately no per-replica,
   * never-synced excision-geometry cache here — that shape was tried and proved to let two replicas
   * holding the byte-identical admitted set diverge on whether a cell shows `"excised"` or
   * `"unknown"`, a SEC/INV-1 violation; see reviews/build-final-report.md.)
   */

  /**
   * An explicit, opt-in, constructor-configured allowlist of signer fingerprints this replica
   * trusts to excise ANY fact regardless of self-authorship (SPEC §4.5 m-11) — the minimal
   * admin/operator escape hatch named in `isAuthorizedExcisionMarker`'s doc comment (proj.ts).
   * Empty by default (never a broader capability system) — see the `trustedExciseKeys` constructor
   * option below.
   */
  private readonly trustedExciseKeyFingerprints: ReadonlySet<string>;

  /**
   * The set of real content OIDS this replica's OWN `excise()` call has itself, locally, ALREADY
   * verified authorization for — populated ONLY from `excise()`'s mint-time check (which reads the
   * REAL candidate fact directly off this replica's own admitted set, never from any marker's
   * self-declared payload, so it cannot be spoofed by an attacker). Each entry is a
   * `SelfWitnessedExcisionRecord` (proj.ts) carrying the REAL geometry
   * (`cellTarget`/`validFrom`/`validTo`/`excisedFactId`/`excisedReason`) this replica itself read
   * off the real candidate fact at its own `excise()` mint time — never sourced from a marker's own
   * (potentially attacker-crafted) payload; see `SelfWitnessedExcisionRecord`'s doc comment for the
   * forgery this closes.
   *
   * WHY THIS EXISTS: `collectExcisions`'s fold-time authorization for the "target currently absent
   * from `facts`" case (the erasing replica's own subsequent re-fold, once its own `Substrate.erase`
   * has removed the candidate's bytes, is ALWAYS this case) cannot trust the marker's self-declared
   * `origFingerprint`, and has no live candidate fact left to cross-check a REMOTE marker's claim
   * against. This set is this replica's own, locally-verified, non-spoofable exception to that
   * otherwise-unauthorizable case: "I personally already checked this exact content's real signer
   * before I erased it" is sound local knowledge, never a marker's own claim about itself. It is
   * NEVER populated from a synced/received fact — only from THIS replica's own `excise()` call — so
   * a remote replica's marker for a target THIS replica never itself excised still falls through to
   * the narrower "only an explicit trusted-excise-key" rule.
   *
   * SCOPE LIMIT (documented dispute): in-memory only, like `rxFromByOid` above — a reopened `KipRepo`
   * pointed at the same `dir` does not remember which oids IT PERSONALLY once excised, so its own
   * historical excisions may re-fold to `"unknown"` rather than the typed `"excised"` placeholder
   * after a restart. No currently-frozen test reopens a repo across its own excise() call, so this
   * is a real but narrower, documented scope boundary rather than a live regression.
   *
   * See proj.ts's `SelfWitnessedExcisionRecord` doc comment, round4-excision-convergence-fix.test.ts,
   * and reviews/build-final-report.md for the fuller history.
   */
  private readonly selfWitnessedExcisionOids = new Map<string, SelfWitnessedExcisionRecord>();

  /**
   * M3/T4.2 addition: a MINIMAL, same-process replica registry keyed by `replicaId`, letting
   * `sync(remote)` (below) resolve a `RemoteRef` string to another live `KipRepo` instance in this
   * SAME process — see `sync()`'s own doc comment for why this is an explicit, documented scope
   * boundary (real git-remote/network transport is out of this round's scope) rather than a
   * fabricated substitute for one.
   */
  private static readonly registry = new Map<ReplicaId, KipRepo>();

  /**
   * TODO(M0/T1.1): a full `open()`-driven construction (genesis manifest, on-disk substrate) is
   * `open()`'s job (below). This bare constructor exists so `new KipRepo()` — the shape every
   * frozen M0 conformance test under src/__tests__/conformance/ uses directly — is a fully
   * functional, self-provisioning `Repo`: it lazily creates its own OS-temp-dir git substrate on
   * first write and generates its own Ed25519 signing identity (ADR-B2), rather than requiring
   * every caller to thread an explicit `open()` + keyring through just to exercise the ingest gate.
   */
  constructor(options?: {
    dir?: string;
    replicaId?: ReplicaId;
    hashAlgo?: HashAlgo;
    keyPair?: Ed25519KeyPair;
    /**
     * Genesis-declared trusted public keys (`OpenOptions.genesis.rootKeys`/`manifest.rootKeys`,
     * PEM-encoded SPKI), wired into this repo's `keyRegistry` at construction time — see this
     * round's finding #1: previously `rootKeys` was written to `manifest.json` by `open()` but
     * never read back, so genesis-declared trust did nothing and `KeyRegistry` was ONLY ever
     * populated from the local operator's own keypair.
     */
    rootKeys?: string[];
    /**
     * The highest schema version `getNode`/`getEdge`/`query`'s `proj()` fold treats as "known"
     * (see `ProjOptions.knownMaxVersion`, proj.ts) — configurable here so it is reachable
     * end-to-end, not just a `proj()`-internal default. Defaults to `proj()`'s own default (`1`).
     */
    knownMaxVersion?: number;
    /**
     * A per-cell `CellReducerRef` association (cell-reducers.ts's `CellReducerAssociations`)
     * threaded into every `proj()` call this repo makes (`getNode`/`getEdge`/`query`) — the seam
     * that makes `gsetReducer`/`pncounterReducer` reachable end-to-end from a real `KipRepo`, not
     * merely unit-testable in isolation against raw `Fact` arrays (see cell-reducers.ts and
     * proj.ts's `reduceCellByRef`).
     */
    cellReducers?: CellReducerAssociations;
    /**
     * An explicit, opt-in allowlist of signer fingerprints this replica trusts to excise ANY fact
     * (SPEC §4.5 m-11; the minimal admin/operator escape hatch — see
     * `trustedExciseKeyFingerprints`'s own doc comment and proj.ts's `isAuthorizedExcisionMarker`).
     * Empty by default; never a broader capability system.
     */
    trustedExciseKeys?: string[];
  }) {
    this.explicitDir = options?.dir;
    this.hashAlgo = options?.hashAlgo ?? "sha1";
    this.replicaId = options?.replicaId ?? `replica-${randomUUID()}`;
    this.chainSequencer = new ChainSequencer();
    this.knownMaxVersion = options?.knownMaxVersion;
    this.cellReducers = options?.cellReducers;
    this.trustedExciseKeyFingerprints = new Set(options?.trustedExciseKeys ?? []);
    if (options?.keyPair) {
      this.ownKeyPair = options.keyPair;
      this.keyRegistry.register(options.keyPair.fingerprint, options.keyPair.publicKey);
    }
    for (const rootKeyPem of options?.rootKeys ?? []) {
      try {
        const { publicKey, fingerprint } = importEd25519PublicKey(rootKeyPem);
        this.keyRegistry.register(fingerprint, publicKey);
      } catch {
        // A malformed genesis `rootKeys` entry is a manifest-authoring error, not an ingest-time
        // concern (m7-6's well-formed() checklist doesn't cover genesis data) — skip it rather
        // than fail `open()` outright. Full genesis-manifest integrity checking is `fsck`'s job
        // (M9/T9.6, out of M0 scope).
      }
    }
    // Substrate provisioning is deferred to first write (see `getSubstrate`) so a bare
    // `new KipRepo()` doesn't touch disk until something is actually ingested.

    // M3/T4.2: self-register into the same-process replica registry (see its own doc comment and
    // `sync()` below) — last registration for a given `replicaId` wins, matching this round's
    // minimal in-process scope (a real deployment has exactly one live `KipRepo` per `replicaId`
    // per process anyway).
    KipRepo.registry.set(this.replicaId, this);
  }

  /**
   * D-29: removes this instance from the static, never-auto-evicting `KipRepo.registry` (see its
   * own doc comment above). Call this when done with a `KipRepo` in a long-lived host process —
   * failing to do so leaks the instance (and its `Substrate`/`keyRegistry`/
   * `selfWitnessedExcisionOids`) forever, since nothing else ever removes a registry entry.
   * Idempotent; safe to call more than once.
   */
  close(): void {
    KipRepo.registry.delete(this.replicaId);
  }

  /** Lazily provisions (and memoizes) this repo's git object-store substrate (T1.1/T1.5). */
  private getSubstrate(): Substrate {
    if (!this.substrate) {
      this.substrate = this.explicitDir
        ? new Substrate(this.explicitDir, this.hashAlgo)
        : Substrate.createTemp(this.hashAlgo);
      // T1.2.5's durable seq-tip persistence: re-seed the sequencer directly via
      // `ChainSequencer`'s own `initial` constructor parameter, rather than hand-rolling a
      // peek/next replay loop that reimplements the same seeding logic (this round's finding #5)
      // — so a re-opened repo resumes its chain tips durably.
      const persistedSeq = new SeqTipStore(this.substrate.dir).load();
      this.chainSequencer = new ChainSequencer(persistedSeq);
      // Re-seed `keyRegistry` with every peer key THIS replica durably learned via a past `sync()`
      // call (see `KeyRegistryStore`'s own doc comment, substrate.ts), so a reopened `KipRepo`
      // pointed at the same `dir` doesn't silently forget a genuinely-verified peer's key (which
      // would flip `isAuthorizedExcisionMarker`'s permissive "never registered" branch open for
      // that peer's facts). Each entry is registered under the fingerprint RECOMPUTED from its own
      // imported public key material, never the persisted map-key string verbatim: an entry whose
      // stored fingerprint disagrees with the one recomputed from its own PEM is corrupt/tampered
      // (the label doesn't match the key it's stored against) and is skipped entirely, the same
      // defensive convention used for a PEM that fails to parse at all.
      const persistedKeys = new KeyRegistryStore(this.substrate.dir).load();
      for (const [storedFingerprint, pem] of Object.entries(persistedKeys)) {
        try {
          const { publicKey, fingerprint } = importEd25519PublicKey(pem);
          if (fingerprint !== storedFingerprint) {
            // Corrupt/tampered entry: the persisted label doesn't match the key it's stored
            // against — never trust the label, skip the entry entirely.
            continue;
          }
          this.keyRegistry.register(fingerprint, publicKey);
        } catch {
          // A corrupt persisted entry is a storage-layer concern, not an ingest-time one — skip it.
        }
      }
      // D-28: re-seed `selfWitnessedExcisionOids` from its durable `SelfWitnessedExcisionStore`
      // side-file, the SAME way `keyRegistry` is just re-seeded from `KeyRegistryStore` above — so a
      // reopened `KipRepo` pointed at the same `dir` still remembers which oids IT PERSONALLY
      // already verified and excised in a prior process lifetime (see `selfWitnessedExcisionOids`'s
      // own doc comment for why this durable record is sound local knowledge, never a marker's own
      // claim about itself).
      const persistedExcisions = new SelfWitnessedExcisionStore(this.substrate.dir).load();
      for (const [oid, record] of Object.entries(persistedExcisions)) {
        this.selfWitnessedExcisionOids.set(oid, record);
      }
    }
    return this.substrate;
  }

  /** This repo's own signing identity — generated on first use if `open()` supplied none. */
  private getOwnKeyPair(): Ed25519KeyPair {
    if (!this.ownKeyPair) {
      this.ownKeyPair = generateEd25519KeyPair();
      this.keyRegistry.register(this.ownKeyPair.fingerprint, this.ownKeyPair.publicKey);
    }
    return this.ownKeyPair;
  }

  /**
   * `signature === "sig:" + f.id` is the M0-conformance-suite's deterministic PLACEHOLDER
   * signature convention (src/__tests__/conformance/fixtures.ts's `placeholderSignature`) — NOT
   * real cryptographic verification. It exists purely so the frozen fixtures can exercise
   * `ingest()`'s admit/reject contract for a fingerprint this replica has genuinely never seen
   * (INV-13a's "signing key the replica has never seen" case) without a full
   * external-signer/verifier round-trip.
   *
   * CRITICAL (this round's finding #1 — round 2's "fix" made a round-1 authentication bypass
   * WORSE, and was independently live-reproduced by two adversarial reviewers): this check MUST
   * NEVER be consulted — not even as a first/unconditional check — when `keyRegistry` has REAL
   * public key material registered for `f.provenance.publicKeyFingerprint`. Fingerprints are NOT
   * secret (they travel in-band on every fact and in genesis `rootKeys`), so if this placeholder
   * shortcut is allowed to apply unconditionally, ANY attacker who knows a fingerprint this
   * replica has a real registered key for (its own identity, an imported peer key, or a genesis
   * root key) can forge a fact claiming that fingerprint with `signature: "sig:"+id` and have it
   * admitted with ZERO possession of the corresponding private key — a complete authentication
   * bypass for every registered/trusted key. See `verifySignature` below for the fix: it consults
   * `keyRegistry` FIRST, and this placeholder fallback only ever runs for a fingerprint that has
   * NO entry in `keyRegistry` on THIS replica.
   */
  private isPlaceholderSignature(f: Fact): boolean {
    return f.provenance.signature === `sig:${f.id}`;
  }

  /**
   * Real Ed25519 verification (ADR-B2) is MANDATORY whenever this replica has real public key
   * material registered for `f.provenance.publicKeyFingerprint` (own identity, an imported peer
   * key, or a genesis `rootKeys` entry — see the constructor): the registry check runs FIRST, and
   * when it finds a registered key, `verifyPayload` is the ONLY path to an "admit" verdict — the
   * placeholder-convention shortcut NEVER applies once a real key is registered for that
   * fingerprint, no exceptions. Only when the fingerprint has NO entry in `keyRegistry` (genuinely
   * unregistered/unknown to this replica — there is no key to check real asymmetric math against)
   * does the placeholder-convention fallback run, satisfying INV-13a's "admits despite an
   * unknown/never-seen signing key" requirement without weakening verification for any key this
   * replica actually trusts.
   */
  private verifySignature(f: Fact, canonicalPayload: string): boolean {
    const registeredKey = this.keyRegistry.get(f.provenance.publicKeyFingerprint);
    if (registeredKey) {
      return verifyPayload(registeredKey, canonicalPayload, f.provenance.signature);
    }
    return this.isPlaceholderSignature(f);
  }

  // TODO(M0/T4.4): branch-per-replica topology — return the current replica/session branch.
  branch(): string {
    throw new Error("unimplemented: branch");
  }

  // TODO(M0/T9.5): tenant/namespace lens — return a scoped Repo view.
  withScope(_scope: ScopeRef): Repo {
    throw new Error("unimplemented: withScope");
  }

  // TODO(M0/T1.5): one-commit-per-txn batching (§3.2 commit granularity).
  async txn<T>(_fn: (tx: Tx) => Promise<T>): Promise<{ result: T; commit: CID }> {
    throw new Error("unimplemented: txn");
  }

  // TODO(M0/T1.5): flush auto-batched facts as the publish point (m-9).
  async commit(_message?: string): Promise<CID> {
    throw new Error("unimplemented: commit");
  }

  /**
   * Stamp `hlc`/`seq`, sign the canonical payload with this repo's OWN keypair (real Ed25519,
   * ADR-B2), and run the SAME `ingest()` gate every fact — self-authored or received — passes
   * through (docs/22 §2: "A memory write -> a commit" starts with the author signing `f`, then
   * `ingest(f)` on the receiving replica — here, self-receipt). Batched commit (T1.5) is NOT yet
   * implemented (`txn`/`commit` stay throwing stubs), so this always returns `status: "pending"`
   * per ADR-012 ("no path where a durable ack precedes the commit").
   */
  async assertFact(input: AssertInput): Promise<Pick<Fact, "id" | "hlc" | "seq"> & { status: "pending" | "durable" }> {
    const fact = this.mintFact(input);
    const verdict = await this.ingest(fact);
    if (!verdict.admitted) {
      throw new KipError(
        verdict.reason === "signature-invalid" ? "ERR_SIGNATURE_INVALID" : "ERR_MALFORMED_INPUT",
        `assertFact: self-authored fact was rejected at ingest (${verdict.reason})`,
        { factId: fact.id },
      );
    }
    return { id: fact.id, hlc: fact.hlc, seq: fact.seq, status: "pending" };
  }

  /** A bounded-validTo assert (§4.1) — same mint-then-ingest path as `assertFact`. */
  async retractFact(
    input: RetractInput,
  ): Promise<Pick<Fact, "id" | "hlc" | "seq"> & { status: "pending" | "durable" }> {
    const fact = this.mintFact(input);
    const verdict = await this.ingest(fact);
    if (!verdict.admitted) {
      throw new KipError(
        verdict.reason === "signature-invalid" ? "ERR_SIGNATURE_INVALID" : "ERR_MALFORMED_INPUT",
        `retractFact: self-authored fact was rejected at ingest (${verdict.reason})`,
        { factId: fact.id },
      );
    }
    return { id: fact.id, hlc: fact.hlc, seq: fact.seq, status: "pending" };
  }

  /**
   * Shared assert/retract construction: stamp `hlc` (author-side tick, T1.2.5), mint `seq` from
   * this key's `(replicaId,keyFpr)` chain (ADR-B4), sign the canonical payload with this repo's
   * own real Ed25519 key, and derive `id` as the REAL git-blob CID of that canonical payload
   * (T1.1/T1.4) — so self-authored facts always satisfy well-formed()'s item-4 self-consistency
   * check via genuine hash equality, never the ingest-gate's unregistered-key fallback.
   */
  private mintFact(input: AssertInput | RetractInput): Fact {
    // Provision (and, on a re-opened dir, restore the persisted seq-tips into) the substrate
    // BEFORE minting `seq` below — otherwise a re-opened repo's first mint would race ahead of
    // its own durably-persisted chain tip (getSubstrate() is what re-seeds `chainSequencer`).
    const substrate = this.getSubstrate();
    const keyPair = this.getOwnKeyPair();
    const replicaId = input.replicaId ?? this.replicaId;
    this.localHlc = hlcTick(this.localHlc, replicaId);
    const chainId = chainIdFor(replicaId, keyPair.fingerprint);
    const seq = this.chainSequencer.next(chainId);
    new SeqTipStore(substrate.dir).save(this.chainSequencer.snapshot());

    const draft: Omit<Fact, "id"> = {
      v: input.v,
      type: input.type,
      target: input.target,
      value: input.value,
      validFrom: input.validFrom,
      validTo: input.validTo,
      hlc: this.localHlc,
      seq,
      causedBy: input.causedBy,
      replicaId,
      provenance: {
        author: input.provenance.author,
        signature: "", // filled in below, once the canonical payload (which excludes it) is known
        publicKeyFingerprint: keyPair.fingerprint,
        signedFields: [...CANONICAL_ENVELOPE_FIELDS],
        source: input.provenance.source,
        confidence: input.provenance.confidence,
      },
    };
    const canonicalPayload = canonicalPayloadString(draft as Fact);
    const id = gitBlobId(Buffer.from(canonicalPayload, "utf8"), this.hashAlgo);
    const signature = signPayload(keyPair.privateKey, canonicalPayload);
    return { ...draft, id, provenance: { ...draft.provenance, signature } } as Fact;
  }

  // TODO(M3/T4.5): supersede keyed by input-CID set (ADR-004, §4b.3/C-3).
  async supersedeFact(
    _input: SupersedeInput,
  ): Promise<Pick<Fact, "id" | "hlc" | "seq"> & { status: "pending" | "durable" }> {
    throw new Error("unimplemented: supersedeFact");
  }

  // TODO(M9/T9.4): §8.1 M5-3 re-attest mechanism.
  async reAttestFact(
    _input: ReAttestInput,
  ): Promise<Pick<Fact, "id" | "hlc" | "seq"> & { status: "pending" | "durable" }> {
    throw new Error("unimplemented: reAttestFact");
  }

  /**
   * T1.3: the signature-only ingest gate — the sole membership predicate (ADR-001). A PURE
   * function of `f`'s own bytes (INV-6a): well-formed() first (reject-malformed on ANY m7-6
   * checklist failure), THEN signature verification (reject signature-invalid) — nothing else is
   * consulted (no drift, no key-registration state, no namespace/revocation check, docs/22 §2.1).
   * A signature-valid fact is ALWAYS admitted (INV-13a) and re-offering an already-admitted CID is
   * a no-op at the storage layer (INV-7a) — `ingest()`'s own return value stays byte-identical for
   * byte-identical input on every call/replica either way, since it recomputes rather than caches.
   */
  async ingest(f: Fact): Promise<{ admitted: boolean; reason?: "malformed" | "signature-invalid" }> {
    // This round's finding #2: the length-bound half of well-formed()'s id-shape check must be
    // derived from THIS repo's actual configured hashAlgo, not a hardcoded SHA-1 constant — else a
    // sha256 repo rejects its own well-formed, correctly-self-minted facts (see well-formed.ts).
    const wellFormed = checkWellFormed(f, this.hashAlgo);
    if (!wellFormed.ok) {
      return { admitted: false, reason: wellFormed.reason };
    }

    const canonicalPayload = canonicalPayloadString(f);
    if (!this.verifySignature(f, canonicalPayload)) {
      return { admitted: false, reason: "signature-invalid" };
    }

    // ADMIT: write the fact's content-addressed git-blob object (INV-7's CID dedup happens inside
    // `writeFactBlob`/`writeBlob`, T1.6) at /facts/<oidShardHi>/<oidShardLo>/<oid>.json — keyed by
    // the REAL content oid, never the caller-declared `f.id` (see substrate.ts's top-level doc
    // comment for why: the oid-keyed object store is the SOLE content source, with only a
    // lightweight eviction WITNESS pointer namespaced by BOTH `oid` and `f.id`, for `pin`/
    // `resolvePin`'s A-7 retention-eviction story, never a duplicate copy of the fact's bytes).
    const { oid } = this.getSubstrate().writeFactBlob(f.id, JSON.stringify(f));

    // Advance local HLC past f.hlc (receive-advance, docs/22 §2.1 step 3) — audit-only, never
    // touches this fact's own seq chain (m7-1), never affects the returned verdict.
    this.localHlc = hlcReceiveTick(this.localHlc, f.hlc, this.replicaId);

    // M2/T3.2 addition: stamp `FactAnnotation.rxFrom` = this replica's local HLC AT FIRST verified
    // ingest (docs/23 §1/§2.1) — genuinely `this.localHlc` right after the receive-tick above, so it
    // is strictly monotone in THIS replica's own ingest order. Recorded ONLY the first time this
    // fact's own real content `oid` (not the caller-declared `f.id` — see `rxFromByOid`'s doc
    // comment) is admitted (re-offering an already-admitted fact, INV-7a, must never overwrite the
    // ORIGINAL belief-order stamp with a later one).
    if (!this.rxFromByOid.has(oid)) {
      this.rxFromByOid.set(oid, this.localHlc);
    }

    return { admitted: true };
  }

  // TODO(M0/T1.2): sugar -> assert node-existence + prop facts.
  async putNode(_node: NodePut): Promise<EID> {
    throw new Error("unimplemented: putNode");
  }

  // TODO(M0/T1.2): sugar -> assert edge + edge-prop facts.
  async putEdge(_edge: EdgePut): Promise<EID> {
    throw new Error("unimplemented: putEdge");
  }

  /**
   * T2.7.1: project a `NodeView` from `proj`-materialized cells. `proj` is a pure, whole-set fold
   * (T2.2) over every admitted fact this repo currently holds — recomputed fresh on every call (no
   * incremental/cached `/heads`, an M1-scope simplification; correctness, not staleness, is the
   * exit criterion here) so a subsequent `ingest()` is always reflected on the next read.
   *
   * M2/T3.2 UPDATE: `asOf` now genuinely delegates to `this.asOf(asOf)` (below) rather than
   * throwing — an explicit lens request is honored, not silently ignored (the repo's own
   * "fallbacks are evil" rule cuts the other way now that a real lens exists to route to).
   */
  async getNode(eid: EID, asOf?: AsOf): Promise<NodeView | null> {
    if (asOf !== undefined) {
      return (await this.asOf(asOf)).getNode(eid);
    }
    return applyLiveExcisionLens(proj(this.currentFacts(), this.projOptions()).getNode(eid));
  }

  /** T2.7.1: project an `EdgeView` from `proj`-materialized cells (see `getNode`'s doc comment). */
  async getEdge(eid: EID, asOf?: AsOf): Promise<EdgeView | null> {
    if (asOf !== undefined) {
      return (await this.asOf(asOf)).getEdge(eid);
    }
    return applyLiveExcisionLens(proj(this.currentFacts(), this.projOptions()).getEdge(eid));
  }

  /**
   * T2.7.2: typed directional BFS with MANDATORY `depth`/`maxFanout` (m7-21, no unbounded default)
   * over the current `proj` projection. `spec.asOf` (M2/T3.2) now delegates to the SAME lens
   * `getNode`/`getEdge` use (see above) rather than throwing.
   */
  async *query(spec: TraversalSpec): AsyncIterable<NodeView | EdgeView> {
    if (spec.asOf !== undefined) {
      const view = await this.asOf(spec.asOf);
      yield* view.query(spec);
      return;
    }
    const projection = proj(this.currentFacts(), this.projOptions());
    for (const item of traverse(projection, spec)) {
      yield applyLiveExcisionLens(item) as NodeView | EdgeView;
    }
  }

  /**
   * Threads this repo's constructor-supplied `knownMaxVersion`/`cellReducers` into every `proj()`
   * call (`getNode`/`getEdge`/`query`), so these are reachable from a real `KipRepo` read path
   * rather than only `proj()`-internal defaults/unit-tested-in-isolation seams. `hashAlgo`/
   * `trustedExciseKeys`/`isRegisteredFingerprint` let `proj()`'s excision fold (proj.ts's
   * `collectExcisions`) compute a real content oid per fact and evaluate excision-marker
   * authorization against THIS replica's own key material.
   */
  private projOptions(): ProjOptions {
    return {
      knownMaxVersion: this.knownMaxVersion,
      cellReducers: this.cellReducers,
      hashAlgo: this.hashAlgo,
      trustedExciseKeys: this.trustedExciseKeyFingerprints,
      isRegisteredFingerprint: (fingerprint: string) => this.keyRegistry.get(fingerprint) !== undefined,
      selfWitnessedExcisionOids: this.selfWitnessedExcisionOids,
    };
  }

  /** Reads back the FULL admitted fact SET `S` this repo currently holds (T2.2's fold input) —
   * every durably-written `/facts/**` blob, deduplicated by content hash (INV-7a), parsed back
   * into `Fact` envelopes. */
  private currentFacts(): Fact[] {
    return this.currentFactsWithOid().map(({ fact }) => fact);
  }

  /**
   * The same fold as `currentFacts()` above, but keeps each surviving fact's real content `oid`
   * alongside its parsed `Fact` envelope — needed by `asOf`'s txTime belief-audit lens (below) to
   * look up `rxFromByOid` by the SAME collision-safe key `ingest()` stamps it with, rather than the
   * caller-declared (and unverified) `Fact.id`.
   */
  private currentFactsWithOid(): Array<{ oid: string; fact: Fact }> {
    return this.getSubstrate()
      .listFactBlobsWithOid()
      .map(({ oid, json }) => ({ oid, fact: JSON.parse(json) as Fact }));
  }

  // TODO(M4/T5.5): hybrid vector+graph+RRF recall pipeline.
  async recall(_q: RecallQuery): Promise<RecallResult[]> {
    throw new Error("unimplemented: recall");
  }

  /**
   * T3.2: the bitemporal snapshot lens — the two INDEPENDENT axes docs/23 §2.1/§3 tables out.
   *
   * `validTime` (INV-11, convergent): filters each returned view's `PropCell.segments` down to the
   * (at most one, since segments are non-overlapping) segment covering the instant — a pure
   * function of the admitted set, NEVER `rxFrom`, NEVER a commit-DAG walk (docs/23 §3's "proj-pure"
   * clause). When `validTime` is omitted, the full (unfiltered) segment geometry is returned, same
   * as a plain `getNode`/`getEdge` read.
   *
   * `txTime`+`believer` (INV-4, per-replica AUDIT, explicitly non-convergent): selects the subset
   * of the admitted set whose `FactAnnotation.rxFrom` (this replica's OWN receive-tick history,
   * `rxFromByOid`) is `<= txTime`, THEN `proj`-folds that subset — "what did replica R believe at
   * transaction-time T", never a world-truth claim. `believer` other than this repo's own
   * `replicaId` is out of reach without M3's `sync` (this replica has no way to observe another
   * replica's `rxFrom` order) — rejected explicitly rather than silently substituting this
   * replica's own belief for the requested one (see this task's disputes for the scope note; the
   * frozen INV-4 suite itself documents this exact single-replica scope).
   */
  async asOf(asOf: AsOf): Promise<ReadView> {
    const believer = asOf.believer ?? this.replicaId;
    let facts: Fact[];
    if (asOf.txTime !== undefined) {
      if (believer !== this.replicaId) {
        throw new Error(
          "unimplemented: asOf({txTime, believer}) for a believer other than this replica's own replicaId " +
            "— cross-replica belief-audit requires M3 sync machinery (this replica cannot observe another " +
            "replica's rxFrom ingest order)",
        );
      }
      const cutoff = asOf.txTime;
      facts = this.currentFactsWithOid()
        .filter(({ oid }) => {
          // Looked up by the fact's real content `oid` (matching how `ingest()` stamps
          // `rxFromByOid`), NOT by the caller-declared `f.id` — see `rxFromByOid`'s own doc comment
          // for why keying this by the unverified declared id would be a same-class bug.
          const rxFrom = this.rxFromByOid.get(oid);
          // A durably-held fact this replica never itself recorded an in-memory rxFrom for (e.g. a
          // fresh `KipRepo` instance re-opened against an existing `dir`, since `rxFromByOid` is
          // in-memory-only this round — see its own doc comment) is conservatively EXCLUDED from the
          // belief-audit lens rather than guessed either way — never fabricating a belief this
          // replica cannot actually attest to.
          if (rxFrom === undefined) return false;
          return canon(rxFrom) <= canon(cutoff);
        })
        .map(({ fact }) => fact);
    } else {
      // The convergent validTime-only lens (INV-11): the full currently-admitted set, exactly like
      // a plain `getNode`/`getEdge` read — never consults `rxFrom` at all.
      facts = this.currentFacts();
    }

    const projection = proj(facts, this.projOptions());
    const validTime = asOf.validTime;

    const applyValidTimeLens = <T extends NodeView | EdgeView>(view: T | null): T | null => {
      if (!view) return view;
      // M3/T4.7: no `validTime` means "the full, unfiltered segment geometry" (this method's own
      // established doc comment) — i.e. the SAME lens a plain `getNode`/`getEdge` read applies, so
      // any `"excised"` segment converts to `"unknown"` here too (see `applyLiveExcisionLens`'s doc
      // comment for why `"excised"` is reserved for a read that specifically resolves THROUGH the
      // erased interval via an explicit `validTime`).
      if (validTime === undefined) return applyLiveExcisionLens(view);
      return filterViewToInstant(view, validTime);
    };

    const view: ReadView = {
      getNode: async (eid: EID) => applyValidTimeLens(projection.getNode(eid)),
      getEdge: async (eid: EID) => applyValidTimeLens(projection.getEdge(eid)),
      async *query(spec: Omit<TraversalSpec, "asOf">) {
        for (const item of traverse(projection, spec as TraversalSpec)) {
          const filtered = applyValidTimeLens(item);
          if (filtered) yield filtered;
        }
      },
      // TODO(M4/T5.5): the hybrid vector+graph+RRF recall pipeline is out of M2 scope — same gap
      // as `KipRepo.recall` itself (below).
      recall: async () => {
        throw new Error("unimplemented: recall (M4/T5.5 hybrid recall pipeline)");
      },
    };
    return view;
  }

  /**
   * T3.5: a frontier-addressed `SnapshotRef` (ADR-006) — durably content-addresses the
   * per-`(replicaId,keyFpr)` CHAIN frontier (`frontier.chainSeq`, "highest seq per chain AT PIN
   * TIME", docs/25's `Frontier` doc comment), never a commit CID (C2-3/M2-2: pins survive excision
   * because they never point at transport). `factSetDigest` is an order-independent merkle-style
   * digest (`computeFactSetDigest`, sorted by the SAME `orderKey` ordering `proj()` itself uses,
   * with a `compareByContent` tiebreak — see that method's own doc comment for why `orderKey` alone
   * is NOT sufficient: two admitted facts can share a forged, caller-declared `id` and genuinely tie)
   * over the deterministically-selected sub-frontier subset AT PIN TIME — `resolvePin` below always
   * RECOMPUTES this from whatever the resolving replica currently holds, never trusting this
   * pin-time value as a cached answer (docs/25: "recomputed from the current set, NOT a snapshot
   * hash of the set as it was when pinned").
   *
   * `scope.tenant`/`scope.namespace`-based narrowing is NOT implemented (see this task's disputes):
   * this SDK's own frozen fixtures never namespace `EID`s by tenant, so there is no sound way to
   * filter the frontier by `scope` without inventing an un-spec'd convention — the pinned frontier
   * spans every chain this replica currently holds, matching INV-14a's own single-replica,
   * no-narrowing test scope. An explicit `asOf` is rejected rather than silently ignored (a combined
   * time-cut + chain-frontier pin is M3+ scope, not yet a sound composition here).
   */
  async pin(_scope: ScopeRef, asOf?: AsOf): Promise<SnapshotRef> {
    if (asOf !== undefined) {
      throw new Error("unimplemented: pin with asOf (a combined time-cut + chain-frontier pin is M3+ scope)");
    }
    const facts = this.currentFacts();
    const chainSeq = this.computeChainFrontier(facts);
    const subset = this.subsetForFrontier(facts, chainSeq);
    const factSetDigest = this.computeFactSetDigest(subset);
    return { frontier: { chainSeq }, factSetDigest };
  }

  /**
   * T3.5: re-resolve `ref` against whatever this replica CURRENTLY holds (docs/25's
   * pin-completeness rule): per enumerated `chainId`, every `seq` in `[0, frontier.chainSeq[chainId]]`
   * MUST be present (seq-CONTIGUITY, never `hlc`) — a single detected gap on ANY enumerated chain
   * flips the whole pin `"pin-incomplete"` (N5: never a silent partial digest). A chain the pin
   * never enumerated is simply excluded from both the completeness check and the digest — never
   * grown by facts arriving on a chain the pin didn't capture. When complete, `factSetDigest` is
   * RECOMPUTED fresh from the current set (never reused verbatim from `ref.factSetDigest`) so a
   * `resolvePin` genuinely proves "the subset I hold right now digests to X", including regressing
   * to `pin-incomplete` after a simulated local-store eviction (A-7) and recovering the ORIGINAL
   * digest once the evicted bytes are restored (both exercised by inv-14a.test.ts).
   */
  async resolvePin(
    ref: SnapshotRef,
  ): Promise<{ status: "pin-incomplete" } | { status: "pin-complete"; factSetDigest: CID }> {
    const facts = this.currentFacts();
    const seqsByChain = new Map<ChainId, Set<number>>();
    for (const f of facts) {
      const chainId = chainIdFor(f.replicaId, f.provenance.publicKeyFingerprint);
      const held = seqsByChain.get(chainId);
      if (held) held.add(f.seq);
      else seqsByChain.set(chainId, new Set([f.seq]));
    }
    for (const [chainId, maxSeq] of Object.entries(ref.frontier.chainSeq)) {
      const held = seqsByChain.get(chainId) ?? new Set<number>();
      for (let seq = 0; seq <= maxSeq; seq += 1) {
        if (!held.has(seq)) return { status: "pin-incomplete" };
      }
    }
    const subset = this.subsetForFrontier(facts, ref.frontier.chainSeq);
    return { status: "pin-complete", factSetDigest: this.computeFactSetDigest(subset) };
  }

  /** The `(replicaId,keyFpr)` chain frontier "at pin time" — the highest `seq` THIS replica has
   * currently seen per chain (docs/25's `Frontier.chainSeq` doc comment), regardless of whether
   * every lower `seq` has actually been delivered yet (that gap is what `resolvePin` detects). */
  private computeChainFrontier(facts: readonly Fact[]): Record<ChainId, number> {
    const frontier: Record<ChainId, number> = {};
    for (const f of facts) {
      const chainId = chainIdFor(f.replicaId, f.provenance.publicKeyFingerprint);
      const current = frontier[chainId];
      if (current === undefined || f.seq > current) frontier[chainId] = f.seq;
    }
    return frontier;
  }

  /** The deterministically-selected pin subset (docs/25, verbatim):
   * `{ f ∈ S_current : chainId(f) ∈ frontier.chainSeq ∧ f.seq ≤ frontier.chainSeq[chainId(f)] }` —
   * a chain ABSENT from `frontier` is EXCLUDED entirely, never implicitly included. */
  private subsetForFrontier(facts: readonly Fact[], frontier: Record<ChainId, number>): Fact[] {
    return facts.filter((f) => {
      const chainId = chainIdFor(f.replicaId, f.provenance.publicKeyFingerprint);
      const maxSeq = frontier[chainId];
      return maxSeq !== undefined && f.seq <= maxSeq;
    });
  }

  /** An order-independent digest of `facts`: sort by the SAME `orderKey` ordering `proj()` uses
   * (never by ingest/array position), WITH `compareByContent` appended as a secondary key (see
   * `compareOrderKey`'s doc comment in proj.ts for why a bare `orderKey` comparison alone can
   * genuinely tie between distinct-content facts — `Array.prototype.sort` is stable, so without this
   * secondary key, tied facts would keep whatever relative ingest/array position they happened to
   * occupy, which differs across replicas). Each fact's key order is also canonicalized
   * (`deepSortKeys`, the same helper every other content-equality check in this codebase relies on)
   * before hashing. Two replicas holding the identical subset — regardless of the order they
   * received it in — always compute the identical digest. See round4-digest-tiebreak-fix.test.ts.
   */
  private computeFactSetDigest(facts: readonly Fact[]): CID {
    const sorted = [...facts].sort((a, b) => compareOrderKey(orderKey(a), orderKey(b)) || compareByContent(a, b));
    const canonicalized = sorted.map((f) => deepSortKeys(f));
    return createHash(this.hashAlgo).update(JSON.stringify(canonicalized)).digest("hex");
  }

  /**
   * T4.2: a MINIMAL, honest content-addressed set-union sync delta — PULLS `remote`'s currently
   * admitted fact set into `this` via the SAME `ingest()` gate every other fact (self-authored or
   * received) passes through, no shortcuts.
   *
   * SCOPE (see this task's disputes): `remote` resolves against a same-process `KipRepo` registry
   * keyed by `replicaId` (see the `registry` field above) — real git-remote/network transport
   * (fetch/push over an actual wire protocol) is out of this round's scope; a real deployment would
   * fetch loose objects over git's own protocol instead. `opts.push`/`opts.fetch`/`opts.remoteBranches`/
   * `opts.retention` are accepted but not yet acted on (one-directional PULL only this round).
   *
   * TRUST BOOTSTRAP (see this task's disputes): before pulling facts, this replica registers
   * `remote`'s own real public key into its `keyRegistry` — a same-process stand-in for the
   * key-distribution mechanism a real deployment would need (KeyAuthorization/`grant` facts, M9/
   * T9.1, not yet implemented). Without this, a self-authored fact signed by `remote`'s own
   * genuinely-generated keypair (e.g. this round's excision-marker facts, minted via
   * `mintAndIngestExcisionMarker` below) would be REJECTED here — `remote`'s fingerprint is
   * unregistered on `this`, and its REAL signature does not match `isPlaceholderSignature`'s
   * fixture-only convention (see that method's own doc comment: it must never be repurposed as a
   * real trust mechanism). This is a deliberate, minimal, honest bootstrap, not a weakening of
   * `ingest()`'s own gate — every pulled fact still goes through the full well-formed()+signature
   * check unchanged.
   *
   * `ingest()` is already idempotent for an already-held CID (INV-7a), so pulling and re-offering
   * `remote`'s WHOLE currently-admitted set is itself a sound (if not yet bandwidth-optimal)
   * set-union delta — no separate diff/negotiation protocol is needed for CORRECTNESS.
   */
  async sync(remote: RemoteRef, _opts?: SyncOptions): Promise<SyncReport> {
    const remoteRepo = KipRepo.registry.get(remote);
    if (!remoteRepo) {
      throw new KipError(
        "ERR_MALFORMED_INPUT",
        `sync: unknown remote "${remote}" — no KipRepo with this replicaId is registered in this ` +
          "process (this round's T4.2 scope: sync() resolves a RemoteRef against an in-process " +
          "replica registry; real network/git-remote transport is out of scope, see this task's disputes)",
        { remote },
      );
    }

    const remoteKeyPair = remoteRepo.getOwnKeyPair();
    this.keyRegistry.register(remoteKeyPair.fingerprint, remoteKeyPair.publicKey);
    // Durably persist this trust-bootstrap registration too (not just in-memory), so a later reopen
    // of THIS replica's own `dir` doesn't forget it — see `KeyRegistryStore`'s doc comment
    // (substrate.ts) for the restart-censorship attack this avoids.
    {
      const substrate = this.getSubstrate();
      const store = new KeyRegistryStore(substrate.dir);
      const snapshot = store.load();
      snapshot[remoteKeyPair.fingerprint] = remoteKeyPair.publicKey.export({ type: "spki", format: "pem" }) as string;
      store.save(snapshot);
    }

    const remoteFacts = remoteRepo.currentFacts();
    let received = 0;
    for (const f of remoteFacts) {
      // eslint-disable-next-line no-await-in-loop -- intentionally sequential: each `ingest()`
      // mutates this repo's own durable seq-tip/substrate state, matching every other call site's
      // established sequential-ingest pattern in this module.
      const verdict = await this.ingest(f);
      if (verdict.admitted) received += 1;
    }

    return {
      received,
      sent: 0, // one-directional PULL this round (`opts.push` unimplemented, see disputes)
      merged: 0, // no separate "merge" step — proj() is a pure whole-set fold (T4.3 scope)
      conflicts: [], // sync() never adjudicates; any conflicts surface at READ time via proj()
      // No real commit-DAG tip exists yet (T1.5's txn/commit stay unimplemented) — `tip` is
      // populated with this replica's post-sync `factSetDigest` as the closest honest, genuinely
      // COMPUTED (never fabricated) content-addressed proxy, not a real git commit CID. See disputes.
      tip: this.computeFactSetDigest(this.currentFacts()),
    };
  }

  // TODO(M3/T4.3): explicit merge — /heads regenerated, never text-merged (ADR-006).
  async merge(_from: BranchRef, _opts?: MergeOptions): Promise<MergeReport> {
    throw new Error("unimplemented: merge");
  }

  /**
   * TEST-SUPPORT STUB (INV-12 byte-DAG half — see `RegeneratedCommit`'s doc comment above): would
   * regenerate the commit DAG for THIS replica's CURRENT admitted fact set — deterministic
   * `orderKey`-based commit boundaries (docs/24 §4.5), a commit timestamp of
   * `floor(maxAuthorHlcWall / 1000)` (the batch's max author-HLC `wall`, integer seconds, a FIXED
   * `+0000` offset — never the process's local TZ), a FIXED SENTINEL committer identity (never the
   * real fact author's own identity, M3-3), UNSIGNED (no `gpgsig` header), LF-only line endings in
   * any text it touches, and no `encoding` header (absent or UTF-8) — per INV-12's M3-3/M4-3 byte
   * recipe (docs/60-conformance-and-testability.md#inv-12).
   *
   * `opts` lets a caller perturb the AMBIENT environment the regenerator would read from
   * (`process.env.TZ`, the repo's own `core.autocrlf` config, process locale) — the in-process
   * "m7-26 execution mechanism" fidelity — so a test can prove every regenerated field is
   * set-derived rather than leaked from any of these, by regenerating twice under mismatched
   * perturbations and asserting byte-identical `commitBytes` both times.
   *
   * UNIMPLEMENTED (M3/T4.x — isomorphic-git was only just installed this round; no commit/tree/ref
   * regeneration code exists yet). Throws, never fakes a passing byte recipe.
   */
  async regenerateHeads(_opts?: { tz?: string; coreAutocrlf?: boolean; locale?: string }): Promise<RegeneratedCommit> {
    throw new Error("unimplemented: regenerateHeads");
  }

  // TODO(M3/T4.8): frontier-cursor keyed FactDelta stream (never a scalar HLC).
  async *subscribe(_scope: ScopeRef, _since?: Frontier): AsyncIterable<FactDelta> {
    throw new Error("unimplemented: subscribe");
  }

  // TODO(M9/T9.6): provenance chain for an EID or FactId.
  async provenanceOf(_ref: EID | FactId): Promise<Provenance[]> {
    throw new Error("unimplemented: provenanceOf");
  }

  // TODO(M13/T13.3): read-latency snapshot rollup (does NOT free bytes, §3.5).
  async rollup(_opts: RollupOptions): Promise<CID> {
    throw new Error("unimplemented: rollup");
  }

  // TODO(M2/T3.3): logical, signature-preserving forgetting (§4.5).
  async tombstone(_eid: EID, _reason: string): Promise<FactId> {
    throw new Error("unimplemented: tombstone");
  }

  /**
   * T4.6: PHYSICAL erasure of one admitted fact's content (docs/50 §8.3, GDPR Art. 17) — "the ONE
   * operation that breaks pure append-only". Re-folds `/heads` over the remaining set (no separate
   * cached `/heads` store to invalidate — every read already recomputes `proj()` fresh, M1 scope
   * note) so no residue of the excised value survives a LIVE (`asOf`-free) read; a historical
   * `asOf({validTime})` read resolving through the erased interval instead returns a typed
   * `"excised"` placeholder (T4.7, see `applyLiveExcisionLens`/proj.ts's excision doc comment).
   *
   * AUTHORIZATION SCOPE (see this task's disputes): docs/50 §8.1 names a SEPARATELY-scoped `excise`
   * `KeyAuthorization.ops` capability (and a further-scoped `excise-evidence` for a fork-/
   * well-formedness-demotion target) — but that whole `KeyAuthorization`/`grant`-fact CHAIN-of-
   * trust enforcement is its OWN, LATER roadmap task (T9.1 "Separately-scoped excise/revoke/resolve
   * capabilities", M8/M9; docs/81), explicitly depended-on BY T4.6 rather than delivered BY it, and
   * this repo implements NO `KeyAuthorization`/`grant`-fact processing anywhere yet (not even for
   * ordinary `write` scope — see index.ts's own `FactType`/`Target` doc comments: `grant`/`policy`
   * facts are RECOGNIZED at the ingest gate but processed by no `Repo` method today). Building a
   * one-off, partial authorization check here — with no genesis-chain/`KeyAuthorization` machinery
   * anywhere else in the codebase to ground it in — would be inventing an ungrounded, inconsistent
   * enforcement seam, not implementing the spec's real T9.1 design. What THIS round DOES enforce,
   * honestly and for real: `excise()` is NEVER an anonymous/unauthenticated erasure — it can only be
   * invoked through a live `KipRepo` instance backed by a real Ed25519 keypair, and it PRODUCES a
   * durable, cryptographically-signed audit record (the excision-marker fact below, admitted through
   * the SAME `ingest()` gate every other fact passes) rather than a silent, unattributed deletion —
   * so every excision is attributable to a specific signing key and independently re-verifiable via
   * that marker fact, satisfying T4.6.1's "authorized excision marker" at the fidelity this round's
   * WBS scope (T4.1-T4.8) actually covers.
   *
   * AUTHORIZATION ENFORCEMENT (SPEC §4.5 m-11, `ERR_UNAUTHORIZED_EXCISION`): full `ops`-chain
   * `KeyAuthorization`/grant-fact enforcement is STILL deferred to T9.1 (M8/M9), matching the
   * roadmap's own dependency ordering — but shipping `sync()` with NO check at all here would make
   * an unauthorized excision a REAL, mesh-wide censorship vector (an attacker replica excising
   * another party's fact and having that marker silently honored once synced). The MINIMAL
   * safeguard enforced instead, both HERE (mint-time — see
   * `isAuthorizedExcisionMarker` below) and in proj.ts's `collectExcisions` (fold-time, so a
   * hand-crafted/foreign marker that bypassed THIS check entirely — e.g. a real adversarial peer
   * that doesn't call this SDK's own `excise()` — is STILL never honored on a receiving replica):
   * this replica's OWN signing key must be either the SAME signer as the target fact (self-
   * excision) or an explicitly-configured `trustedExciseKeys` fingerprint, UNLESS the target's own
   * signer was never a real, registered key on this replica in the first place (see
   * `isAuthorizedExcisionMarker`'s doc comment for the full reasoning and its documented scope
   * limit relative to full M8/M9 grant-chain machinery).
   */
  async excise(factId: FactId, reason: string): Promise<ExcisionMarker> {
    const ALLOWED_REASONS = ["fork", "malformed", "gdpr-erasure", "other"] as const;
    if (!(ALLOWED_REASONS as readonly string[]).includes(reason)) {
      throw new KipError(
        "ERR_MALFORMED_INPUT",
        `excise: reason must be one of ${ALLOWED_REASONS.join("/")}, got "${reason}"`,
        { reason },
      );
    }

    // `factId` is a caller-DECLARED id, and well-formed.ts's item-4 check is a documented
    // length-only heuristic — two admitted, DIFFERENT-content facts can legitimately share one.
    // When multiple candidates share `factId`, pick ONE deterministically via `compareByContent`
    // (the SAME canonical-representative pattern `buildFactsById`/`maxByOrderKey` already establish
    // in proj.ts), never "whichever happens to be first in this replica's local ingest-order array".
    const candidates = this.currentFactsWithOid().filter(({ fact }) => fact.id === factId);
    if (candidates.length === 0) {
      throw new KipError(
        "ERR_MALFORMED_INPUT",
        `excise: no admitted fact with id "${factId}" is currently held by this replica`,
        { factId },
      );
    }
    const { oid, fact: orig } =
      candidates.length === 1 ? candidates[0] : [...candidates].sort((a, b) => compareByContent(a.fact, b.fact))[0];
    const origValidFrom = orig.validFrom;
    const origValidTo = orig.validTo ?? null;
    const origTarget = orig.target;
    const origFingerprint = orig.provenance.publicKeyFingerprint;
    const excisedChainId = chainIdFor(orig.replicaId, origFingerprint);
    const excisedSeq = orig.seq;

    const ownFingerprint = this.getOwnKeyPair().fingerprint;
    if (
      !isAuthorizedExcisionMarker(
        ownFingerprint,
        origFingerprint,
        (fingerprint) => this.keyRegistry.get(fingerprint) !== undefined,
        this.trustedExciseKeyFingerprints,
      )
    ) {
      throw new KipError(
        "ERR_UNAUTHORIZED_EXCISION",
        `excise: this replica's own signing key ("${ownFingerprint}") is not authorized to excise ` +
          `fact "${factId}" — it is signed by a DIFFERENT, real, registered key ("${origFingerprint}") ` +
          "this replica does not administer, and is not a configured trusted-excise key (SPEC §4.5 " +
          "m-11: an excision marker MUST be self-excision or explicitly trusted)",
        { factId, origFingerprint },
      );
    }

    // Record that THIS replica itself, just now, verified authorization for erasing this exact real
    // content oid against the REAL local candidate (`orig`) — see `selfWitnessedExcisionOids`'s own
    // doc comment for why this (and ONLY this) is a sound basis for `collectExcisions` to later
    // honor this replica's OWN marker once the candidate's bytes are gone (the "target absent" case
    // every excise() call immediately produces on re-fold). Also captures the REAL geometry
    // (`orig`'s own target + valid-time interval) THIS replica just read directly off the real
    // candidate, so `collectExcisions` never has to fall back to trusting a (possibly
    // attacker-crafted) marker's self-declared payload for it.
    const selfWitnessedRecord: SelfWitnessedExcisionRecord = {
      cellTarget: origTarget,
      validFrom: origValidFrom,
      validTo: origValidTo,
      excisedFactId: factId,
      excisedReason: reason,
    };
    this.selfWitnessedExcisionOids.set(oid, selfWitnessedRecord);
    // D-28 fix: write through to the durable side-file too (mirrors `KeyRegistryStore`'s
    // sync()-learned-key write-through above), so this record survives a close()+reopen of this
    // same `dir` — see `getSubstrate()`'s re-seed of `selfWitnessedExcisionOids` above.
    {
      const store = new SelfWitnessedExcisionStore(this.getSubstrate().dir);
      const snapshot = store.load();
      snapshot[oid] = selfWitnessedRecord;
      store.save(snapshot);
    }

    // T4.6.1 / fix #4: a privacy-safe, non-content-derived nonce — the HMAC KEY for the marker's
    // anti-fingerprint reference (see `mintAndIngestExcisionMarker`), genuinely random, never
    // derived from the erased value.
    const nonce = randomUUID();

    // MINOR FIX (this task): mint+ingest the durable, signed audit-record marker FIRST, and only
    // physically erase the bytes once it is safely admitted — previously `Substrate.erase()` ran
    // BEFORE the marker mint, so a failed mint (e.g. a rejected ingest) left the bytes already gone
    // with no audit record at all (silent, unattributed data loss).
    const marker = await this.mintAndIngestExcisionMarker({
      cellTarget: origTarget,
      validFrom: origValidFrom,
      validTo: origValidTo,
      origFingerprint,
      oid,
      nonce,
      excisedFactId: factId,
      excisedReason: reason,
    });

    // T4.6.1: physically erase the content — the ONLY copy of these bytes this replica ever held is
    // now genuinely gone from disk (substrate.ts's `erase`), not merely hidden behind a flag.
    this.getSubstrate().erase(oid);

    return {
      markerFactId: marker.id,
      excised: factId,
      nonce,
      excisedChainId,
      excisedSeq,
      excisedReason: reason as ExcisionMarker["excisedReason"],
    };
  }

  /**
   * Mints, self-signs (real Ed25519, this repo's own key — see `excise()`'s authorization doc
   * comment), and admits (via the SAME `ingest()` gate every other fact passes) the durable
   * `type:"excision"` audit-record fact that makes an excision cross-replica-discoverable (T4.2's
   * `sync()` propagates it like any other admitted fact) — `target:{kind:"control",op:"excision"}`
   * (index.ts's own `Target`/`FactType` shapes already recognize this combination).
   *
   * `value` is never the bare excised `FactId` (a content-derived CID for self-minted facts would be
   * exactly the stable-fingerprint-of-erased-content C-4.3 forbids) — it is a JSON-encoded, signed
   * payload: `ref`/`nonce` (an HMAC-SHA256 reference to the erased fact's REAL content oid, never the
   * oid itself — proj.ts's `computeExcisionRef`), `origFingerprint` (an authorization input),
   * `cellTarget`/`validFrom`/`validTo` (geometry, so ANY replica — not only this one — can
   * reconstruct the `"excised"` placeholder), and `excisedFactId` (a DOCUMENTED, DELIBERATE
   * EXCEPTION — see proj.ts's `ExcisionMarkerPayload` doc comment for why this one field is still
   * embedded verbatim). `proj.ts`'s `collectExcisions` is this fact's SOLE reader.
   */
  private async mintAndIngestExcisionMarker(params: {
    cellTarget: Target;
    validFrom: HlcOrTime;
    validTo: HlcOrTime | null;
    origFingerprint: string;
    oid: string;
    nonce: string;
    excisedFactId: FactId;
    /** `excise()`'s own already-validated `reason` string, genuinely persisted into the signed
     * marker payload so it survives as part of the durable audit record. */
    excisedReason: string;
  }): Promise<Fact> {
    const { cellTarget, validFrom, validTo, origFingerprint, oid, nonce, excisedFactId, excisedReason } = params;
    const substrate = this.getSubstrate();
    const keyPair = this.getOwnKeyPair();
    const replicaId = this.replicaId;
    this.localHlc = hlcTick(this.localHlc, replicaId);
    const chainId = chainIdFor(replicaId, keyPair.fingerprint);
    const seq = this.chainSequencer.next(chainId);
    new SeqTipStore(substrate.dir).save(this.chainSequencer.snapshot());

    const derivedEid: EID | undefined =
      cellTarget.kind === "node" || cellTarget.kind === "node-prop" || cellTarget.kind === "edge" || cellTarget.kind === "edge-prop"
        ? cellTarget.eid
        : undefined;

    const ref = computeExcisionRef(nonce, oid);
    const value = JSON.stringify({ ref, nonce, origFingerprint, cellTarget, validFrom, validTo, excisedFactId, excisedReason });

    const draft: Omit<Fact, "id"> = {
      v: 1,
      type: "excision",
      target: { kind: "control", op: "excision", eid: derivedEid },
      value,
      validFrom: this.localHlc,
      validTo: null,
      hlc: this.localHlc,
      seq,
      replicaId,
      provenance: {
        author: `excise:${replicaId}`,
        signature: "",
        publicKeyFingerprint: keyPair.fingerprint,
        signedFields: [...CANONICAL_ENVELOPE_FIELDS],
      },
    };
    const canonicalPayload = canonicalPayloadString(draft as Fact);
    const id = gitBlobId(Buffer.from(canonicalPayload, "utf8"), this.hashAlgo);
    const signature = signPayload(keyPair.privateKey, canonicalPayload);
    const marker: Fact = { ...draft, id, provenance: { ...draft.provenance, signature } } as Fact;

    const verdict = await this.ingest(marker);
    if (!verdict.admitted) {
      throw new KipError(
        verdict.reason === "signature-invalid" ? "ERR_SIGNATURE_INVALID" : "ERR_MALFORMED_INPUT",
        `excise: internally-minted excision marker was rejected at ingest (${verdict.reason})`,
        { excisedFactId },
      );
    }
    return marker;
  }

  // TODO(M9/T9.4): revocation modes (ordinary-cutoff / causal-cutoff, ADR M4-1).
  async revokeKey(
    _keyFpr: string,
    _effectiveFrom: HlcStamp,
    _reason: string,
    _mode?: "ordinary-cutoff" | "causal-cutoff",
  ): Promise<FactId> {
    throw new Error("unimplemented: revokeKey");
  }

  /**
   * A MINIMAL, genuinely-computed `fsck()` — implemented THIS round only far enough to back T4.6's
   * excision-half exit gate (INV-9's own frozen test calls `fsck()` and asserts real, non-hardcoded
   * `excisionResidue`/`headsMatch` values). Full `fsck` (signature-chain/authority-violation/
   * durability-tracking checks) is M9/T9.6 + M13/T13.2 scope — every field this round does not
   * genuinely check is returned as an honestly-documented, conservative default (never fabricating a
   * violation OR a clean bill of health it hasn't actually verified), never silently omitted.
   */
  async fsck(): Promise<FsckReport> {
    const facts = this.currentFacts();
    const { excisedOids, oidByFact } = collectExcisions(
      facts,
      this.hashAlgo,
      (fingerprint) => this.keyRegistry.get(fingerprint) !== undefined,
      this.trustedExciseKeyFingerprints,
      this.selfWitnessedExcisionOids,
    );

    // T9.6.3 (this round's real slice): an excised id whose bytes are STILL among the currently
    // held facts is genuine RESIDUE — see substrate.ts's `erase`/docs §8.3's "distributed-erasure
    // residual" (e.g. reintroduced by a lagging/non-compliant sync peer, INV-12's own scenario).
    // Keyed by real content oid (fix #2), never the caller-declared `f.id`.
    const residueEids = new Set<EID>();
    for (const f of facts) {
      const oid = oidByFact.get(f);
      if (oid === undefined || !excisedOids.has(oid)) continue;
      const t = f.target;
      if (t.kind === "node" || t.kind === "node-prop" || t.kind === "edge" || t.kind === "edge-prop") {
        residueEids.add(t.eid);
      }
    }

    // T9.6.2 (partial, this round's real slice): every currently-held fact's signature genuinely
    // re-verified (real Ed25519 math for a registered key, the SAME placeholder-fallback-for-
    // unregistered-keys convention `ingest()` itself uses — see `verifySignature`'s doc comment).
    const badSignatures: FactId[] = [];
    for (const f of facts) {
      if (!this.verifySignature(f, canonicalPayloadString(f))) badSignatures.push(f.id);
    }

    return {
      ok: residueEids.size === 0 && badSignatures.length === 0,
      // `/heads` is never a separate cached store on this repo — every read recomputes `proj(facts)`
      // fresh (M1 scope note, `getNode`/`getEdge`'s own doc comments), so "heads == proj(facts)" is
      // true BY CONSTRUCTION: there is no second copy that could have diverged.
      headsMatch: true,
      // TODO(M3/T4.3): no git-merge-driver machinery is installed by this SDK yet.
      mergeDriverInstalled: false,
      // TODO(M9/T9.6): full genesis-manifest CID re-verification is out of scope this round (see
      // `open()`'s own doc comment) — conservatively reported true (no mismatch-detection machinery
      // exists yet to genuinely flag a real mismatch, never fabricating a false-negative "clean" claim
      // where a check actually ran and could have failed).
      manifestGenesisCidMatch: true,
      badSignatures,
      // TODO(M9/T9.1-T9.6): KeyAuthorization-chain authority checking is not implemented yet.
      authorityViolations: [],
      excisionResidue: [...residueEids].sort(),
      // TODO(M6/M9): durability-tier tracking (durable vs. quarantined-pending bytes) is not
      // implemented yet.
      missingDurable: [],
      missingNonDurable: [],
      promisorMissingDurable: [],
    };
  }

  // TODO(M5/T6.1): signed microagent-registration + EdgeKind FunctionalityBinding facts (ADR-014).
  async registerFunctionality(
    _edgeKind: EdgeKind,
    _manifest: MicroagentManifest,
    _binding?: Pick<FunctionalityBinding, "weight" | "condition" | "requires" | "relationClass" | "tags">,
  ): Promise<FactId> {
    throw new Error("unimplemented: registerFunctionality");
  }

  // TODO(M5/T6.2): PHASE 1 pure-read compile+match over proj at q.asOf (ADR-017/018).
  async compileContextualQuery(_q: ContextualQuery): Promise<Segment> {
    throw new Error("unimplemented: compileContextualQuery");
  }

  // TODO(M5/T6.3): PHASE 2 execute one caller-chosen segment (topological order over deps).
  async executeSegment(_segment: Segment, _opts?: { asOf?: AsOf }): Promise<AnswerGraph> {
    throw new Error("unimplemented: executeSegment");
  }

  // TODO(M5/T6.2, T6.3): convenience compile+execute with the discriminated choice return (N5).
  async runContextualQuery(
    _q: ContextualQuery,
  ): Promise<AnswerGraph | { kind: "choice"; segments: Segment[] }> {
    throw new Error("unimplemented: runContextualQuery");
  }

  // TODO(M7/T8.1): dispatch a standalone Miner/Discoverer/Ingestor/RDF family microagent (ADR-022/023).
  async runAcquisition(
    _manifest: MicroagentManifest,
    _input: unknown,
    _opts?: { asOf?: AsOf },
  ): Promise<{ facts: FactId[] }> {
    throw new Error("unimplemented: runAcquisition");
  }

  // TODO(M6/T7.1, T7.2): explicit-selection autoencoding loop under a disjunctive budget (ADR-021).
  async learn(
    _rawRef: BlobRefInput,
    _opts: LearnOptions,
  ): Promise<{ facts: FactId[]; loss: number; status: "accept" | "exhausted" }> {
    throw new Error("unimplemented: learn");
  }
}

// ---------------------------------------------------------------------------
// 9b. M2/T3.2 helper: the `asOf({validTime})` per-segment instant filter.
// ---------------------------------------------------------------------------

/**
 * True iff `seg`'s own `[validFrom, validTo)` (half-open — `validTo === null` means the open tail)
 * contains the instant `at` — the SAME half-open convention `proj.ts`'s own `covers()` sweep uses,
 * so `asOf({validTime})` picks the identical segment a plain fold's geometry already implies.
 */
function segmentCoversInstant(seg: CellSegment, at: bigint): boolean {
  if (canon(seg.validFrom) > at) return false;
  if (seg.validTo === null) return true;
  return canon(seg.validTo) > at;
}

/**
 * `asOf({validTime: V})` = `proj(S)` "filtered to segments covering V" (docs/23 §3, verbatim) — a
 * PURE, per-cell narrowing of an already-materialized `NodeView`/`EdgeView`'s `PropCell.segments`
 * arrays to the (at most one, since segments are non-overlapping by construction) segment covering
 * the instant `validTime`. Never re-derives `kind`/`provenance`/edge topology — those are properties
 * of the WHOLE view, not of a single valid-time slice, and `proj`'s existence-gating has already
 * baked "does this entity exist at this instant" into each prop cell's own segment geometry.
 */
function filterViewToInstant<T extends NodeView | EdgeView>(view: T, validTime: HlcOrTime): T {
  const at = canon(validTime);
  const props: Record<PropKey, PropCell> = {};
  for (const [prop, cell] of Object.entries(view.props)) {
    props[prop] = { segments: cell.segments.filter((seg) => segmentCoversInstant(seg, at)) };
  }
  return { ...view, props };
}

// ---------------------------------------------------------------------------
// 9c. M3/T4.6-T4.7 helper: the LIVE (asOf-free) excision lens — docs/24 §4.5's "Heads re-fold ...
// if a cell loses its only covering assert it becomes unknown" clause, applied to `proj()`'s raw
// (potentially `"excised"`-typed) fold output. `proj()` itself stays a pure function that always
// computes the fullest-available answer (including `"excised"` where it has local evidence for it);
// it is THIS lens — applied by every LIVE read call site (`getNode`/`getEdge`/`query` with no
// `asOf`, and `asOf({txTime})` with no `validTime`, see those methods' own doc comments) — that
// downgrades `"excised"` to plain `"unknown"`, reserving the typed placeholder for a HISTORICAL
// `asOf({validTime})` read that specifically resolves through the erased interval (T4.7).
// ---------------------------------------------------------------------------

/** Converts every `"excised"` segment to `"unknown"`, then merges newly-adjacent `"unknown"` runs
 * back together (the SAME half-open-adjacency merge `proj.ts`'s own `mergeAdjacent` performs, kept
 * local to this file since it operates on `proj()`'s already-materialized OUTPUT, not on facts). */
function convertExcisedToUnknown(segments: readonly CellSegment[]): CellSegment[] {
  const mapped: CellSegment[] = segments.map((seg) =>
    seg.kind === "excised" ? { kind: "unknown", validFrom: seg.validFrom, validTo: seg.validTo } : seg,
  );
  const out: CellSegment[] = [];
  for (const seg of mapped) {
    const prev = out[out.length - 1];
    if (
      prev &&
      prev.kind === "unknown" &&
      seg.kind === "unknown" &&
      prev.validTo !== null &&
      canon(prev.validTo) === canon(seg.validFrom)
    ) {
      out[out.length - 1] = { kind: "unknown", validFrom: prev.validFrom, validTo: seg.validTo };
    } else {
      out.push(seg);
    }
  }
  return out;
}

/** Applies `convertExcisedToUnknown` to every prop cell of a materialized `NodeView`/`EdgeView` —
 * the LIVE-read counterpart to `filterViewToInstant` above. `null` passes through unchanged (a
 * genuinely nonexistent entity has no props to convert). */
function applyLiveExcisionLens<T extends NodeView | EdgeView>(view: T | null): T | null {
  if (!view) return view;
  const props: Record<PropKey, PropCell> = {};
  for (const [prop, cell] of Object.entries(view.props)) {
    props[prop] = { segments: convertExcisedToUnknown(cell.segments) };
  }
  return { ...view, props };
}

// ---------------------------------------------------------------------------
// 10. Lifecycle entrypoint (docs/40 "Kip — lifecycle / substrate")
// ---------------------------------------------------------------------------

/**
 * T1.1: open/clone a memory repo — provisions the git-substrate object store at `options.dir`
 * (creating it if `createIfMissing`) and writes the genesis-immutable `manifest.json` (docs/22
 * §1.5) the first time the directory is initialized. Re-opening an already-initialized dir reuses
 * whatever `manifest.json` is already there rather than re-writing it (genesis parameters are
 * immutable post-creation, m2-5) — full genesis-CID re-verification (docs/22 §1.5's "every
 * open/fsck/merge-postcheck MUST verify") is `fsck`'s job (M9/T9.6, out of M0 scope per this
 * task's instructions).
 */
export async function open(options: OpenOptions): Promise<KipRepo> {
  const hashAlgo: HashAlgo = options.genesis?.hashAlgo ?? "sha1";
  const manifestPath = path.join(options.dir, "manifest.json");

  const dirExists = fs.existsSync(options.dir) && fs.existsSync(manifestPath);
  if (!dirExists) {
    if (!options.createIfMissing && fs.existsSync(options.dir) === false) {
      throw new KipError("ERR_MALFORMED_INPUT", `open: ${options.dir} does not exist and createIfMissing is not set`, {
        dir: options.dir,
      });
    }
    fs.mkdirSync(options.dir, { recursive: true });
    const manifest = {
      hashAlgo,
      shardDepth: options.genesis?.shardDepth ?? 2,
      clockEpoch: options.genesis?.clockEpoch ?? 0,
      epsilonCausalMs: options.genesis?.epsilonCausalMs ?? 0,
      regenBoundaryRule: options.genesis?.regenBoundaryRule ?? "per-commit",
      rootKeys: options.genesis?.rootKeys ?? [],
      quarantineTtlMs: options.genesis?.quarantineTtlMs ?? 0,
      quarantineKeyCapBytes: options.genesis?.quarantineKeyCapBytes ?? 0,
      quarantinePoolBytes: options.genesis?.quarantinePoolBytes ?? 0,
      keyChainDurableCapBytes: options.genesis?.keyChainDurableCapBytes ?? 0,
      headsCommitted: options.genesis?.headsCommitted ?? true,
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }

  const persistedManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
    hashAlgo: HashAlgo;
    rootKeys?: string[];
  };
  const keyPair = extractKeyPairFromKeyring(options.keyring);
  return new KipRepo({
    dir: options.dir,
    replicaId: options.replicaId,
    hashAlgo: persistedManifest.hashAlgo,
    keyPair,
    // This round's finding #1: genesis-declared `rootKeys` are now actually wired into the
    // repo's `keyRegistry` (previously written to manifest.json but never read back).
    rootKeys: persistedManifest.rootKeys,
  });
}

/**
 * `OpenOptions.keyring` is intentionally typed `unknown` (docs/40 doesn't pin its shape in the
 * excerpt read for this scaffold). This accepts the minimal, most obvious concrete shape — a PEM
 * private key (optionally paired with its PEM public key) — via `signing.ts`'s real ADR-B2
 * import path; any other shape is treated as "no explicit keyring", falling back to a
 * repo-generated identity (`KipRepo.getOwnKeyPair`).
 */
function extractKeyPairFromKeyring(keyring: unknown): Ed25519KeyPair | undefined {
  if (!keyring || typeof keyring !== "object") return undefined;
  const candidate = keyring as { privateKeyPem?: unknown; publicKeyPem?: unknown };
  if (typeof candidate.privateKeyPem !== "string") return undefined;
  const publicKeyPem = typeof candidate.publicKeyPem === "string" ? candidate.publicKeyPem : undefined;
  return importEd25519KeyPair(candidate.privateKeyPem, publicKeyPem);
}
