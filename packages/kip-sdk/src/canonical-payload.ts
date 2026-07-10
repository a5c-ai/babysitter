/**
 * canonical-payload.ts — ADR-B3: "an in-house canonical JSON encoder modeled on
 * packages/trust-core/src/signing.ts's `canonicalize`/`deepSortKeys`/`extractFields`, adapted to
 * SPEC §2.4's fixed, VERSION-INVARIANT field list."
 *
 * `CANONICAL_ENVELOPE_FIELDS` is a hardcoded array (A-10: version-invariant, `v` is opaque to the
 * gate and never used to pick a per-version list) — it MUST match, verbatim and in order, the
 * `CANONICAL_SIGNED_FIELDS` constant the frozen conformance fixtures pin
 * (src/__tests__/conformance/fixtures.ts), which is itself transcribed from index.ts's `Fact`
 * JSDoc (docs/21 §5.1's canonical field list, "signature excluded from the payload").
 */
import type { Fact } from "./index";

export const CANONICAL_ENVELOPE_FIELDS = [
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
] as const;

/**
 * Pulls exactly the `CANONICAL_ENVELOPE_FIELDS` values out of `f` — `author`/`publicKeyFingerprint`
 * live under `f.provenance` on the current index.ts `Fact` shape; every other field is top-level.
 * `f.id` and `f.provenance.signature` are deliberately excluded (id is the CID of THIS payload;
 * signature is computed over it, so neither can be an input to itself).
 */
export function buildCanonicalEnvelope(f: Fact): Record<string, unknown> {
  return {
    v: f.v,
    type: f.type,
    target: f.target,
    value: f.value,
    validFrom: f.validFrom,
    validTo: f.validTo,
    hlc: f.hlc,
    seq: f.seq,
    causedBy: f.causedBy,
    supersedes: f.supersedes,
    reAttests: f.reAttests,
    author: f.provenance ? f.provenance.author : undefined,
    publicKeyFingerprint: f.provenance ? f.provenance.publicKeyFingerprint : undefined,
    replicaId: f.replicaId,
  };
}

/**
 * Deterministic (order-independent-input, byte-identical-output) canonical JSON string of `f`'s
 * signed envelope: sort object keys recursively (mirrors trust-core's `deepSortKeys`), then
 * `JSON.stringify`. `undefined`-valued fields are dropped by `JSON.stringify` itself, which keeps
 * "field omitted" vs "field present as null" distinct and stable.
 */
export function canonicalPayloadString(f: Fact): string {
  return JSON.stringify(deepSortKeys(buildCanonicalEnvelope(f)));
}

export function deepSortKeys(value: unknown): unknown {
  if (value === null || value === undefined || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(deepSortKeys);
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    sorted[key] = deepSortKeys((value as Record<string, unknown>)[key]);
  }
  return sorted;
}
