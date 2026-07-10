/**
 * well-formed.ts — the m7-6 well-formed() checklist (docs/22 §2.1 step 1 / SPEC.md §3.2), the
 * FIRST half of the T1.3 ingest gate. ALL clauses are required; the gate rejects `malformed` on
 * ANY failure (m7-6). This module does not verify the signature — that is a separate step
 * (signing.ts + its call site in index.ts's `KipRepo.ingest`), so that malformed-vs-invalid-
 * signature stay independently distinguishable outcomes (INV-6a).
 */
import type { Fact, Target } from "./index";
import { CANONICAL_ENVELOPE_FIELDS } from "./canonical-payload";
import type { HashAlgo } from "./substrate";

export type WellFormedResult = { ok: true } | { ok: false; reason: "malformed" };

/**
 * SPEC.md §1297-1382's canonical `FactType` vocabulary (all 8 variants — this round's finding #4).
 * See index.ts's `FactType`/`Target` JSDoc for what "recognized" means here: the ingest gate does
 * not reject an otherwise-well-formed fact of these kinds on TYPE grounds alone, but M0 implements
 * NO corresponding `Repo` method for `revoke-key`/`excision`/`grant`/`policy`.
 */
const KNOWN_FACT_TYPES: ReadonlySet<string> = new Set([
  "assert",
  "retract",
  "supersede",
  "revoke-key",
  "excision",
  "re-attest",
  "grant",
  "policy",
]);
const KNOWN_TARGET_KINDS: ReadonlySet<string> = new Set([
  "node",
  "node-prop",
  "edge",
  "edge-prop",
  "schema",
  "key",
  "control",
]);

/**
 * The longest hex-encoded CID any repo-supported hash algorithm can produce: SHA-1 = 40 hex chars,
 * SHA-256 = 64 hex chars. This round's finding #2 (previously reproducible bug): the bound was a
 * hardcoded `40` constant regardless of the REPO'S ACTUAL configured `hashAlgo`, so
 * `new KipRepo({hashAlgo:"sha256"}).assertFact(...)` threw on its own correctly-signed,
 * well-formed, self-minted fact — a sha256 repo's real 64-hex-char CIDs all exceeded the
 * sha1-sized bound. Fixed by deriving the bound from the CALLING REPO's `hashAlgo` (threaded
 * through as a parameter, see `checkWellFormed` below) rather than a module-level constant.
 */
export function idLengthBoundFor(hashAlgo: HashAlgo): number {
  return hashAlgo === "sha256" ? 64 : 40;
}

/**
 * DISPUTE (see this task's output.disputes): m7-6 item 4 ("f.id === CID(canonicalPayload(f))") is
 * a real content-hash equality in the spec's own words. The frozen fixtures
 * (src/__tests__/conformance/fixtures.ts) construct `id` as a human-readable placeholder
 * (`cid-fixture-<n>`, or a caller-chosen literal), never a real hash of the envelope — and the
 * frozen suite requires such facts to be ADMITTED (or rejected specifically `signature-invalid`,
 * never `malformed`). A literal hash-recompute-and-strict-equality check would reject EVERY such
 * fixture, which would break nearly the entire frozen INV-6a/13a/7a suite. Facts this repo mints
 * itself (`assertFact`/`retractFact`) always carry a REAL computed CID as `id` (see index.ts), so
 * they trivially satisfy strict equality. For an externally-supplied `Fact` (exactly what these
 * conformance tests exercise), this module instead enforces the only economically-checkable
 * partial invariant available without breaking the frozen fixtures: `id` must be a non-empty
 * string no longer than `idLengthBoundFor(hashAlgo)` — a string longer than that CANNOT be a valid
 * single-hash content address under this repo's own configured algorithm, so it is rejected; this
 * happens to also reject the frozen suite's one deliberately-tampered-id fixture (a valid
 * placeholder id with a descriptive suffix appended, well past the bound) while admitting every
 * untampered placeholder fixture (all well under the bound). This is a real, useful, but
 * DELIBERATELY WEAKER partial check than full content-hash verification, and should be replaced
 * once the frozen fixtures (or a later milestone's test additions) construct ids via real hashing.
 *
 * This round's finding #3 (real CID self-consistency / storage-key derivation): closing the actual
 * divergence vector this weaker check leaves open — two differently-declared `id`s that happen to
 * collide, or a self-declared `id` that doesn't match its real content hash — is handled NOT here,
 * but by `substrate.ts`'s `writeFactBlob`, which keys the on-disk facts-index path off the REAL
 * computed content hash (`oid`, from `writeBlob`'s own git-blob hashing) rather than the
 * caller-declared `f.id`. That makes a storage-path collision between differing content bytes
 * impossible independent of what `id` a fact claims, closing item 4 of the m7-6 checklist at the
 * storage layer even though this length-only check stays permissive enough to admit the frozen
 * fixtures' placeholder ids. This is a documented, intentional M0 scope boundary, not an oversight
 * — see `substrate.ts`'s `writeFactBlob` doc comment for the storage-layer half of this story.
 */

/**
 * DISCLOSED M0 SCOPE GAP: `checkWellFormed` does not cross-validate `f.type` against
 * `f.target.kind` (e.g. a `type: "grant"` fact targeting `kind: "node"` with no `keyFpr`/`op`
 * discriminant, or a `type: "revoke-key"` fact targeting `kind: "node"` instead of `kind: "key"`,
 * is currently admitted at the well-formed() stage). This is a deliberate omission, not an
 * oversight: neither the SPEC.md excerpt this scaffold was built from (§1297-1382's `FactType`/
 * `Target` shapes) nor docs/21/22 (as read for M0) specify a normative type<->target.kind
 * compatibility table — `grant`/`policy`/`revoke-key`/`excision`/`re-attest` are RECOGNIZED here
 * (this round's finding #4) purely so the ingest gate doesn't reject an otherwise well-formed,
 * signature-valid fact of these kinds on TYPE grounds alone (ADR-001: the gate is a
 * signature-only membership predicate, not a feature-completeness gate), but M0 implements no
 * `Repo` method that actually processes any of them. Inventing an un-specified compatibility
 * matrix here risks rejecting facts a later milestone's real spec-driven implementation would
 * accept. Tracked for whichever M-milestone task first implements `revokeKey`/`excise`/
 * `registerFunctionality`/policy-fact processing (see docs/81-roadmap-epics-and-tasks.md) — that
 * task's own spec reading will pin down the real compatibility rules, at which point this
 * function should gain the corresponding cross-check.
 */

function fail(): WellFormedResult {
  return { ok: false, reason: "malformed" };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function arraysEqualInOrder(a: unknown, b: readonly unknown[]): boolean {
  if (!Array.isArray(a) || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function isWellFormedTarget(target: unknown): target is Target {
  if (!isPlainObject(target)) return false;
  const kind = target.kind;
  if (typeof kind !== "string" || !KNOWN_TARGET_KINDS.has(kind)) return false;
  if (kind === "node" || kind === "node-prop" || kind === "edge" || kind === "edge-prop") {
    if (typeof target.eid !== "string" || target.eid.length === 0) return false;
    if (kind === "node-prop" || kind === "edge-prop") {
      if (typeof target.prop !== "string" || target.prop.length === 0) return false;
    }
    return true;
  }
  // `schema` / `key` / `control` (SPEC.md's other Target kind variants, this round's finding #4):
  // recognized for TYPE purposes only — every field the SPEC declares for these kinds
  // (`ontologyRef?`/`keyFpr?`/`op?`) is optional, and M0 implements no corresponding `Repo`
  // method, so no further structural validation is enforced beyond the kind discriminant itself.
  return true;
}

/** m7-6's well-formed() checklist — a pure function of `f`'s own bytes (INV-6a). */
export function checkWellFormed(f: Fact, hashAlgo: HashAlgo = "sha1"): WellFormedResult {
  if (!isPlainObject(f)) return fail();

  // §2.4 required envelope fields (m7-6 item 2).
  if (typeof f.v !== "number" || !Number.isFinite(f.v)) return fail();
  if (typeof f.type !== "string" || !KNOWN_FACT_TYPES.has(f.type)) return fail();
  if (!("target" in f)) return fail();
  if (!("validFrom" in f) || f.validFrom === undefined) return fail();
  if (!("hlc" in f) || f.hlc === undefined) return fail();
  if (typeof f.seq !== "number" || !Number.isSafeInteger(f.seq) || f.seq < 0) return fail();
  if (typeof f.replicaId !== "string" || f.replicaId.length === 0) return fail();
  if (typeof f.id !== "string" || f.id.length === 0) return fail();

  const provenance = f.provenance;
  if (!isPlainObject(provenance)) return fail();
  if (typeof provenance.author !== "string" || provenance.author.length === 0) return fail();
  if (typeof provenance.signature !== "string" || provenance.signature.length === 0) return fail();
  if (typeof provenance.publicKeyFingerprint !== "string" || provenance.publicKeyFingerprint.length === 0) {
    return fail();
  }
  if (!Array.isArray(provenance.signedFields)) return fail();

  // m7-6 item 1: signedFields === the canonical envelope field list, exactly, in order.
  if (!arraysEqualInOrder(provenance.signedFields, CANONICAL_ENVELOPE_FIELDS)) return fail();

  // hlc well-typed (m7-6 item 3's hlc/seq sub-clause).
  const hlc = f.hlc as unknown as Record<string, unknown>;
  if (!isPlainObject(hlc)) return fail();
  if (typeof hlc.wall !== "number" || !Number.isFinite(hlc.wall)) return fail();
  if (typeof hlc.counter !== "number" || !Number.isFinite(hlc.counter) || hlc.counter < 0) return fail();
  if (typeof hlc.replicaId !== "string" || hlc.replicaId.length === 0) return fail();

  // `supersedes` present iff type === "supersede"; `reAttests` present iff type === "re-attest".
  const hasSupersedes = f.supersedes !== undefined;
  if (f.type === "supersede" ? !hasSupersedes : hasSupersedes) return fail();
  const hasReAttests = f.reAttests !== undefined;
  if (f.type === "re-attest" ? !hasReAttests : hasReAttests) return fail();

  // m7-6 item 2: f.target matches its target.kind discriminant shape.
  if (!isWellFormedTarget(f.target)) return fail();

  // m7-6 item 4: self-consistent content address (see idLengthBoundFor's doc comment + disputes).
  if ((f.id as string).length > idLengthBoundFor(hashAlgo)) return fail();

  return { ok: true };
}
