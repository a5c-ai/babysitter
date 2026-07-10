/**
 * Shared, non-test fixture helpers for the M0/M1 exit-gate conformance suite
 * (INV-6a / INV-13a / INV-7a from M0; INV-1 / INV-3 / INV-4a / INV-7 / INV-8 from M1 — see
 * inv-6a.test.ts, inv-13a.test.ts, inv-7a.test.ts, inv-1.test.ts, inv-3.test.ts, inv-4a.test.ts,
 * inv-7.test.ts, inv-8.test.ts).
 *
 * This file intentionally does NOT end in `.test.ts` (vitest.config.ts only includes
 * `src/**\/*.test.ts`), so it contributes no test cases of its own — per ADR-B7, each
 * invariant's own file is the sole home for its `describe('INV-<id>: ...', ...)` block.
 *
 * Everything here is built exclusively against the public surface declared in
 * packages/kip-sdk/src/index.ts (the M0/M1 scaffold): the `Fact`/`Provenance`/`HlcStamp`/`Target`
 * shapes, `KipRepo`, and nothing else. No SDK method is invented beyond what index.ts declares.
 *
 * M1 addendum: the M1 conformance files need MULTIPLE facts that (a) target the exact same cell
 * (same `(eid, prop)` or same edge `eid`), (b) carry deliberately-chosen `value`/`validFrom`/
 * `validTo`/`type` (`assert` vs `retract`) geometry, and (c) are byte-identical-except-content so
 * two independent `KipRepo` instances can be fed the SAME fact SET in different delivery orders
 * (the T12.1 "single-process fold + perturbation rig" this suite's INV-1/INV-3 gate on, per
 * docs/80-roadmap-and-milestones.md's M1 exit-criteria note). `makeWellFormedFact`'s
 * `BaseFactOverrides` is extended (additively — no existing M0 test call site's field set
 * changes meaning) with `value`/`validFrom`/`validTo`/`type`/`v`/`causedBy` overrides rather than
 * hand-mutating the returned `Fact` object at every call site (the M0 tests' own established
 * pattern of post-construction mutation, e.g. inv-13a.test.ts's `fact.validFrom = 0`, is left
 * untouched — this is purely additive constructor-time sugar for the M1 suite's heavier fixture
 * needs).
 */
import type {
  Fact,
  FactId,
  HlcOrTime,
  HlcStamp,
  Provenance,
  PropValue,
  ReplicaId,
  Target,
} from "../../index";

/**
 * The canonical signed-envelope field list this suite treats as authoritative for the m7-6
 * well-formedness checklist's item 1 ("f.provenance.signedFields MUST equal the canonical
 * envelope field list for THIS repo format ... exactly, in order"). Transcribed verbatim from
 * index.ts's own `Fact` JSDoc (docs/21 §5.1's canonical field list, "signature excluded from
 * the payload"): index.ts does not currently export this list as a runtime constant, so tests
 * that need it import it from here rather than re-deriving it ad hoc per file.
 */
export const CANONICAL_SIGNED_FIELDS: readonly string[] = [
  "v",
  "type",
  "target",
  "value",
  "validFrom",
  "validTo",
  "hlc",
  "seq",
  "causedBy",
  "supersedes",
  "reAttests",
  "author",
  "publicKeyFingerprint",
  "replicaId",
];

let fixtureCounter = 0;

/**
 * A deterministic-looking placeholder "signature" string. The gate's real Ed25519
 * signature *verification* is M0/T1.3 unimplemented machinery (index.ts: `ingest()` throws
 * `unimplemented: ingest`); there is no signer/verifier on the public surface to invoke. These
 * fixtures exist to pin the `ingest()` CONTRACT (a signature-shaped string is present and either
 * verifies or is deliberately tampered with) that the future verifier must satisfy — not to
 * exercise a real cryptographic implementation.
 */
function placeholderSignature(seed: string): string {
  return `sig:${seed}`;
}

export interface BaseFactOverrides {
  id?: FactId;
  hlc?: Partial<HlcStamp>;
  replicaId?: ReplicaId;
  target?: Target;
  provenance?: Partial<Provenance>;
  /** M1 addendum: schema version stamped into the fact (INV-8's upcaster keying field). */
  v?: number;
  /** M1 addendum: `assert` (default) vs `retract` — a retract is a bounded-validTo assert (§4.1). */
  type?: "assert" | "retract";
  /** M1 addendum: the cell's authored value (defaults to `"v"`, matching the pre-M1 baseline). */
  value?: PropValue;
  /** M1 addendum: the fact's valid-time interval start (defaults to `hlc.wall`, the pre-M1 baseline). */
  validFrom?: HlcOrTime;
  /** M1 addendum: the fact's valid-time interval end, `null` = open-ended (defaults to `null`). */
  validTo?: HlcOrTime | null;
  /** M1 addendum: voluntary causal-dominance declaration (left unused by M0's own fixtures). */
  causedBy?: FactId[];
  /**
   * M2 addendum (INV-14a, docs/60-conformance-and-testability.md#inv-14a): explicit per-
   * `(replicaId,key)` chain-sequence position (`seq`, §4b.1/m7-1) — `seq = 0` is a chain's
   * genesis, `seq = n` its `(n+1)`-th fact. Every pre-M2 fixture call site left this unset and
   * got the hardcoded baseline of `1`; this override is purely additive (defaults to `1`,
   * unchanged meaning for every existing M0/M1 call site) because M2's pin/chain-frontier tests
   * are the first to need a REAL, multi-fact `(replicaId,key)` chain (seq 0, 1, 2, ...) to
   * exercise the seq-contiguity completeness rule `pin()`/`resolvePin()` decide over.
   */
  seq?: number;
}

/**
 * A single well-formed-shaped, signature-bearing `Fact` fixture used as the "valid" baseline
 * across all three M0 gate invariants. Every field required by the `Fact` interface (index.ts
 * §2) is populated; `provenance.signedFields` matches `CANONICAL_SIGNED_FIELDS` exactly, in
 * order (m7-6 checklist item 1), and `id`/`signature` are internally self-consistent-looking
 * placeholders (see `placeholderSignature` above re: no real CID/signature machinery exists yet
 * to check against).
 */
export function makeWellFormedFact(overrides: BaseFactOverrides = {}): Fact {
  fixtureCounter += 1;
  const n = fixtureCounter;
  const replicaId = overrides.replicaId ?? `replica-${n}`;
  const hlc: HlcStamp = {
    wall: 1_700_000_000_000,
    counter: 0,
    replicaId,
    ...overrides.hlc,
  };
  const target: Target = overrides.target ?? { kind: "node", eid: `person/${n}`, nodeKind: "person" };
  const id: FactId = overrides.id ?? `cid-fixture-${n}`;
  const provenance: Provenance = {
    author: "test-actor",
    signature: placeholderSignature(id),
    publicKeyFingerprint: "known-fpr-1",
    signedFields: [...CANONICAL_SIGNED_FIELDS],
    ...overrides.provenance,
  };
  return {
    id,
    v: overrides.v ?? 1,
    type: overrides.type ?? "assert",
    target,
    value: overrides.value ?? "v",
    validFrom: overrides.validFrom ?? hlc.wall,
    validTo: overrides.validTo === undefined ? null : overrides.validTo,
    hlc,
    seq: overrides.seq ?? 1,
    causedBy: overrides.causedBy,
    replicaId,
    provenance,
  };
}

/**
 * Deep-clones a `Fact` so re-offer/purity tests exercise byte-equivalent (not identical-by-
 * object-reference) inputs — INV-6a's "pure function of the fact's bytes" and INV-7a's
 * "re-offering an already-admitted fact (same CID)" are both about the fact's serialized
 * content, not in-memory object identity.
 */
export function cloneFact(f: Fact): Fact {
  return JSON.parse(JSON.stringify(f)) as Fact;
}
