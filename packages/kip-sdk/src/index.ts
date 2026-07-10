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

import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { CANONICAL_ENVELOPE_FIELDS, canonicalPayloadString } from "./canonical-payload";
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
import { gitBlobId, SeqTipStore, Substrate, type HashAlgo } from "./substrate";

// ---------------------------------------------------------------------------
// 1. Core scalar / branded types (docs/21-data-model.md §1)
// ---------------------------------------------------------------------------

/** Namespaced stable identity: "<tenant>/<namespaceId>/<localId>" (§3.6). */
export type EID = string;
/** Git object id (hex). */
export type CID = string;
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

export type CellSegment<V = PropValue> =
  | { kind: "value"; value: V; validFrom: HlcOrTime; validTo: HlcOrTime | null; assertedBy: FactId }
  | { kind: "unknown"; validFrom: HlcOrTime; validTo: HlcOrTime | null }
  | { kind: "conflict"; validFrom: HlcOrTime; validTo: HlcOrTime | null; candidates: FactId[] };

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
  tip: CID;
}
export interface SyncReport {
  received: number;
  sent: number;
  merged: number;
  conflicts: Conflict[];
  tip: CID;
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
  }) {
    this.explicitDir = options?.dir;
    this.hashAlgo = options?.hashAlgo ?? "sha1";
    this.replicaId = options?.replicaId ?? `replica-${randomUUID()}`;
    this.chainSequencer = new ChainSequencer();
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

    // ADMIT: write /facts/<shardHi>/<shardLo>/<f.id>.json — a real, content-addressed, idempotent
    // git-blob write (INV-7's CID dedup happens inside `writeFactBlob`/`writeBlob`, T1.6).
    this.getSubstrate().writeFactBlob(f.id, JSON.stringify(f));

    // Advance local HLC past f.hlc (receive-advance, docs/22 §2.1 step 3) — audit-only, never
    // touches this fact's own seq chain (m7-1), never affects the returned verdict.
    this.localHlc = hlcReceiveTick(this.localHlc, f.hlc, this.replicaId);

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

  // TODO(M2/T2.7): project a NodeView from proj-materialized cells.
  async getNode(_eid: EID, _asOf?: AsOf): Promise<NodeView | null> {
    throw new Error("unimplemented: getNode");
  }

  // TODO(M2/T2.7): project an EdgeView from proj-materialized cells.
  async getEdge(_eid: EID, _asOf?: AsOf): Promise<EdgeView | null> {
    throw new Error("unimplemented: getEdge");
  }

  // TODO(M2/T2.7, M4/T5.4): typed directional as-of BFS/DFS with mandatory depth/maxFanout.
  async *query(_spec: TraversalSpec): AsyncIterable<NodeView | EdgeView> {
    throw new Error("unimplemented: query");
  }

  // TODO(M4/T5.5): hybrid vector+graph+RRF recall pipeline.
  async recall(_q: RecallQuery): Promise<RecallResult[]> {
    throw new Error("unimplemented: recall");
  }

  // TODO(M2/T3.2): bitemporal snapshot lens (valid-time / belief-audit txTime).
  async asOf(_asOf: AsOf): Promise<ReadView> {
    throw new Error("unimplemented: asOf");
  }

  // TODO(M3/T3.5): frontier-addressed SnapshotRef (survives excision, ADR-006).
  async pin(_scope: ScopeRef, _asOf?: AsOf): Promise<SnapshotRef> {
    throw new Error("unimplemented: pin");
  }

  // TODO(M3/T3.5): re-resolve a pin against the current set (pin-incomplete vs pin-complete).
  async resolvePin(
    _ref: SnapshotRef,
  ): Promise<{ status: "pin-incomplete" } | { status: "pin-complete"; factSetDigest: CID }> {
    throw new Error("unimplemented: resolvePin");
  }

  // TODO(M3/T4.2): content-addressed set-union sync delta.
  async sync(_remote: RemoteRef, _opts?: SyncOptions): Promise<SyncReport> {
    throw new Error("unimplemented: sync");
  }

  // TODO(M3/T4.3): explicit merge — /heads regenerated, never text-merged (ADR-006).
  async merge(_from: BranchRef, _opts?: MergeOptions): Promise<MergeReport> {
    throw new Error("unimplemented: merge");
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

  // TODO(M3/T4.6): PHYSICAL erasure; requires `excise` scope (§4.5, m-11).
  async excise(_factId: FactId, _reason: string): Promise<ExcisionMarker> {
    throw new Error("unimplemented: excise");
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

  // TODO(M9/T9.6, M13/T13.2): verify heads == proj(facts); verify signatures + authority chain.
  async fsck(): Promise<FsckReport> {
    throw new Error("unimplemented: fsck");
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
