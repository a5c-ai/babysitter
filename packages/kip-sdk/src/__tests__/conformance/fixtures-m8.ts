/**
 * Shared, non-test fixture helpers for the M8 ("Security / trust / tenancy / DoS-hardening")
 * FULL-form conformance suite — INV-2, INV-6, INV-10, INV-13, INV-15, INV-16, INV-17, INV-18,
 * INV-19 (see inv-2.test.ts … inv-19.test.ts in this directory) and the m8-security method-
 * acceptance suite (../m8-security.test.ts).
 *
 * This file intentionally does NOT end in `.test.ts` (vitest.config.ts only includes
 * `src/**\/*.test.ts`), so it contributes no test cases of its own — per ADR-B7 (see fixtures.ts's
 * own doc comment), each invariant's own file is the sole home for its `describe('INV-<id>: …', …)`.
 *
 * Everything here is built exclusively against the public surface declared in
 * packages/kip-sdk/src/index.ts (`KipRepo`, `Fact`/`Provenance`/`HlcStamp`/`Target`/`PropValue`,
 * `NodeView`/`PropCell`/`CellSegment`, `ScopeRef`). No SDK method or private field is invented.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 * MODELING CONVENTIONS (spec-faithful; flagged because the code surface leaves them open)
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 *
 * 1. "Signing key of a fact" = `provenance.publicKeyFingerprint`. A signature-valid fact is built
 *    with the M0-conformance PLACEHOLDER signature convention (`signature === "sig:" + id`,
 *    fixtures.ts) so it is ADMITTED by the byte-pure ingest gate (§3.2) on every replica — the exact
 *    "admitted-then-demoted" precondition INV-6/INV-13 are stated against.
 *
 * 2. "Authorized / registered key" (§8.1): a key that has a `KeyAuthorization` fact chaining to the
 *    genesis root at the fact's author-HLC. `KeyAuthorization`/`KeyRevocation` are NOT exported by
 *    index.ts and the code pins NO on-fact serialization for their §8.1 field set, so this file
 *    models them as ordinary signed facts (`target.kind === "key"`) carrying the §8.1 payload
 *    JSON-encoded in `value` (a `string`, a valid `PropValue`). This is the modeled serialization of
 *    §8.1's normative `KeyAuthorization`/`KeyRevocation` interfaces the M8 `proj` fold must read; the
 *    exact carrier an implementation chooses is a documented degree of freedom (see each INV file's
 *    coverage notes and this task's `untestable` report).
 *
 * 3. "Trusted value head" = a `{ kind: "value" }` `CellSegment` for the target cell in `proj`'s
 *    output (`getNode(eid).props[prop].segments`). A `proj`-time trust DEMOTION (§3.6/§8.1) means the
 *    fact's value is NOT present as a trusted `value` head — it is surfaced as `unknown`/`quarantine`/
 *    a demoted status, or (when the demoted fact was the cell's only cover, or the node's existence
 *    fact) `getNode` returns `null`. `hasTrustedValueHead` below is robust to ALL of those M8 surface
 *    choices: it asks only "did this value win `/heads` as a trusted value?", which is the observable
 *    §8.1 promises ("loses to trusted asserts, never dropped"; INV-18(a) "affecting no cell").
 *
 * WHY THESE TESTS FAIL NOW: the M8 value-trust overlay does not exist yet — `proj` projects an
 * admitted signature-valid fact as a trusted `value` regardless of its key's authorization
 * (registeredFingerprintsInSet feeds only excision-authorization, not value cells), and
 * `revokeKey`/`withScope` throw `unimplemented`. So every DEMOTION assertion below evaluates against
 * a still-trusted head (a real assertion mismatch), and every method-driven test rejects with
 * `unimplemented`/a non-`KipError` message — never an import/type/syntax error.
 */
import {
  KipRepo,
  type CellSegment,
  type Fact,
  type HlcStamp,
  type NodeView,
  type PropCell,
  type PropValue,
} from "../../index";
import { makeWellFormedFact } from "./fixtures";

let idCounter = 0;
let replicaCounter = 0;

/** A collision-free `replicaId` for this process's shared `KipRepo.registry` (static, keyed by
 *  `replicaId`). Every repo built with a fresh id SHOULD be `.close()`-d by the owning test. */
export function freshReplicaId(label: string): string {
  replicaCounter += 1;
  return `m8-${label}-${replicaCounter}-${Date.now()}`;
}

/** A stable, collision-free fact `id` (== CID stand-in) so two replicas fed "the same fact" receive
 *  byte-identical bytes (identical CID ⇒ INV-7 dedup, identical admitted set). */
export function freshFactId(label: string): string {
  idCounter += 1;
  return `m8-cid-${label}-${idCounter}`;
}

/** Author-HLC constructor. `replicaId` is the CHAIN replica (chain = `(replicaId, keyFpr)`, §4b.1). */
export function hlc(wall: number, counter = 0, replicaId = "m8-author"): HlcStamp {
  return { wall, counter, replicaId };
}

export interface DataFactOpts {
  id: string;
  /** Signing-key fingerprint (§8.1 "the fact's key"). */
  fpr: string;
  /** Author-HLC wall (orders facts; compared to revocation `effectiveFrom` and same-key backdating). */
  wall: number;
  counter?: number;
  /** Chain replica id — `(replicaId, fpr)` is the per-key contiguity chain (§4b.1). */
  replicaId?: string;
  /** Chain position (seq) — contiguous per `(replicaId, fpr)` for a complete chain (§4c/m4-1). */
  seq?: number;
  causedBy?: string[];
}

/** A signature-valid node-EXISTENCE fact for `eid` signed by key `fpr` (admitted; value `true`). */
export function existenceFact(eid: string, nodeKind: string, opts: DataFactOpts): Fact {
  const rid = opts.replicaId ?? "m8-author";
  return makeWellFormedFact({
    id: opts.id,
    replicaId: rid,
    hlc: { wall: opts.wall, counter: opts.counter ?? 0, replicaId: rid },
    seq: opts.seq ?? 0,
    target: { kind: "node", eid, nodeKind },
    value: true,
    validFrom: 0,
    validTo: null,
    causedBy: opts.causedBy,
    provenance: { publicKeyFingerprint: opts.fpr },
  });
}

/** A signature-valid node-PROP fact for `(eid, prop)` signed by key `fpr`. */
export function propFact(eid: string, prop: string, value: PropValue, opts: DataFactOpts): Fact {
  const rid = opts.replicaId ?? "m8-author";
  return makeWellFormedFact({
    id: opts.id,
    replicaId: rid,
    hlc: { wall: opts.wall, counter: opts.counter ?? 0, replicaId: rid },
    seq: opts.seq ?? 0,
    target: { kind: "node-prop", eid, prop },
    value,
    validFrom: 0,
    validTo: null,
    causedBy: opts.causedBy,
    provenance: { publicKeyFingerprint: opts.fpr },
  });
}

/** §8.1 `KeyAuthorization` — normative field set (index.ts exports no type for it). */
export interface ModeledKeyAuthorization {
  keyFpr: string;
  namespaces: string[];
  ops: Array<"write" | "delegate" | "excise" | "revoke" | "resolve" | "excise-evidence">;
  authorizedBy: string; // fingerprint of the delegating key (must chain to a genesis root)
  effectiveFrom: HlcStamp;
}

/** §8.1 `KeyRevocation` — normative field set. */
export interface ModeledKeyRevocation {
  keyFpr: string;
  effectiveFrom: HlcStamp;
  mode: "ordinary-cutoff" | "causal-cutoff";
  reason: string;
  revokedBy: string;
}

/**
 * A signed `KeyAuthorization` fact (`type:"assert"`, `target.kind:"key"`) — the modeled §8.1 carrier
 * (payload JSON-encoded in `value`; see this file's MODELING CONVENTIONS #2). Signed by `signerFpr`
 * (the authorizing key), so `proj` can check `authorizedBy` chains to the genesis root at author-HLC.
 */
export function keyAuthFact(auth: ModeledKeyAuthorization, opts: { id: string; signerFpr: string; wall: number; replicaId?: string; seq?: number }): Fact {
  const rid = opts.replicaId ?? "m8-authorizer";
  return makeWellFormedFact({
    id: opts.id,
    replicaId: rid,
    hlc: { wall: opts.wall, counter: 0, replicaId: rid },
    seq: opts.seq ?? 0,
    target: { kind: "key", keyFpr: auth.keyFpr },
    value: JSON.stringify(auth),
    validFrom: 0,
    validTo: null,
    provenance: { publicKeyFingerprint: opts.signerFpr },
  });
}

/**
 * A signed `KeyRevocation` fact (`type:"revoke-key"`, `target.kind:"key"`) — the modeled §8.1 carrier
 * for delivering a revocation into TWO replicas' sets directly (the INV-2 straddle recipe), distinct
 * from the `revokeKey()` authoring SEAM the m8-security method-acceptance suite drives.
 */
export function revokeFact(rev: ModeledKeyRevocation, opts: { id: string; signerFpr: string; wall: number; replicaId?: string; seq?: number }): Fact {
  const rid = opts.replicaId ?? "m8-revoker";
  const f = makeWellFormedFact({
    id: opts.id,
    replicaId: rid,
    hlc: { wall: opts.wall, counter: 0, replicaId: rid },
    seq: opts.seq ?? 0,
    target: { kind: "key", keyFpr: rev.keyFpr },
    value: JSON.stringify(rev),
    validFrom: 0,
    validTo: null,
    provenance: { publicKeyFingerprint: opts.signerFpr },
  });
  f.type = "revoke-key";
  return f;
}

/**
 * A shared, AUTHORIZED "seeder" identity used only to author trusted node-EXISTENCE facts, so a
 * test can observe a PROP cell's demotion (the value under test) against a PRESENT node rather than a
 * `null` node. The seeder is authorized (a KeyAuthorization chaining to `SEEDER_ROOT_FPR`) and each
 * existence fact sits on its OWN single-fact chain (`chain-seeder-<eid>`, seq 0) so it is always
 * chain-complete and author-HLC-monotone ⇒ trusted, never entangled with the key-under-test's chain.
 */
export const SEEDER_ROOT_FPR = "genesis-root-m8-seeder";
export const SEEDER_FPR = "authorized-seeder-key-m8";

/** The seeder's KeyAuthorization (authorized for the namespaces its existence facts write). */
export function seederAuthFact(id: string, namespaces: string[] = ["person", "org"]): Fact {
  return keyAuthFact(
    { keyFpr: SEEDER_FPR, namespaces, ops: ["write"], authorizedBy: SEEDER_ROOT_FPR, effectiveFrom: hlc(0) },
    { id, signerFpr: SEEDER_ROOT_FPR, wall: 50 },
  );
}

/** A trusted node-existence fact for `eid` on the seeder's per-eid single-fact chain (seq 0). */
export function seederExistence(eid: string, nodeKind: string, id: string): Fact {
  return existenceFact(eid, nodeKind, { id, fpr: SEEDER_FPR, wall: 10, replicaId: `chain-seeder-${eid}`, seq: 0 });
}

/** Deep clone (byte-equivalent re-offer, not object identity — matches fixtures.ts `cloneFact`). */
export function clone(f: Fact): Fact {
  return JSON.parse(JSON.stringify(f)) as Fact;
}

/** Ingest every fact into `repo` in order (all must be gate-admitted). */
export async function ingestAll(repo: KipRepo, facts: readonly Fact[]): Promise<void> {
  for (const f of facts) {
    // eslint-disable-next-line no-await-in-loop -- sequential ingest, the module-wide pattern
    await repo.ingest(clone(f));
  }
}

/** The `{ kind: "value" }` segments of a cell (the trusted value heads). */
export function valueSegments(cell: PropCell | undefined): Array<Extract<CellSegment, { kind: "value" }>> {
  return (cell?.segments ?? []).filter((s): s is Extract<CellSegment, { kind: "value" }> => s.kind === "value");
}

/**
 * Did `value` win `/heads` as a TRUSTED value head for `(node, prop)`? Robust to every M8 demotion
 * surface (null node, `unknown`/`quarantine`/demoted-status segment) — see MODELING CONVENTIONS #3.
 */
export function hasTrustedValueHead(node: NodeView | null, prop: string, value: PropValue): boolean {
  if (!node) return false;
  return valueSegments(node.props[prop]).some((s) => s.value === value);
}
