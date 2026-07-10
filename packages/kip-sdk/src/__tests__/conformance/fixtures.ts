/**
 * Shared, non-test fixture helpers for the M0 exit-gate conformance suite
 * (INV-6a / INV-13a / INV-7a — see inv-6a.test.ts, inv-13a.test.ts, inv-7a.test.ts).
 *
 * This file intentionally does NOT end in `.test.ts` (vitest.config.ts only includes
 * `src/**\/*.test.ts`), so it contributes no test cases of its own — per ADR-B7, each
 * invariant's own file is the sole home for its `describe('INV-<id>: ...', ...)` block.
 *
 * Everything here is built exclusively against the public surface declared in
 * packages/kip-sdk/src/index.ts (the M0 scaffold): the `Fact`/`Provenance`/`HlcStamp`/`Target`
 * shapes, `KipRepo`, and nothing else. No SDK method is invented beyond what index.ts declares.
 */
import type { Fact, FactId, HlcStamp, Provenance, ReplicaId, Target } from "../../index";

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
    v: 1,
    type: "assert",
    target,
    value: "v",
    validFrom: hlc.wall,
    validTo: null,
    hlc,
    seq: 1,
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
