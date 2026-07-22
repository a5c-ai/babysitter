/**
 * The model-assisted Layer-2 entity resolver (ADR-B12 / B12a / B12b / B12c,
 * packages/kip-sdk/docs/70-decision-records-adr.md) — the `layer2-resolver` work item.
 *
 * SCOPE OF THIS FILE (frozen-tests scaffolding). This module declares ONLY the minimal typed surface
 * the FROZEN `layer2-resolver.test.ts` acceptance suite must compile against. Every behaviour-bearing
 * function is an intentional EMPTY / THROWING stub so each acceptance assertion FAILS on its own diff
 * (a resolver that authors nothing where a `kip:same_as?`/`not_same_as` link is required; a candidate
 * generator that yields nothing; a confirm/reject/list handler that is not wired; a live gate that is
 * never enabled) — never on a type/import error. The later implementation phase fills these in.
 *
 * THE DESIGN (verbatim from the ADR, for the implementer):
 *   - The CLI does ALL deterministic graph reads: it generates a HARD-BOUNDED set of candidate PAIRS
 *     from `nodeEids` + `recall` (ADR-B12b). The model NEVER widens that set.
 *   - The resolver microagent adjudicates ONLY those bounded pairs, returning a per-pair verdict
 *     `{ decision, linkKind?, confidence?, rationale }` (ADR-B12c). It receives a `MicroagentInvocation`,
 *     never a `Repo` (INV-A1) — it structurally cannot write the graph.
 *   - `runAcquisition` (`kip-repo.ts`) commits the returned `AcquisitionResult`. The two verdict
 *     directions are authored DIFFERENTLY, and THAT ASYMMETRY IS THE ENTIRE DESIGN:
 *       . a confident `same`     → a QUARANTINED `kip:same_as?` candidate edge NO read consults for
 *                                  identity (proj's union-find folds ONLY `edgeKind==="same_as"`,
 *                                  proj.ts:2165) — surfaced (N5), reversible, but never a merge (ADR-B12a);
 *       . a confident `not-same` → a signed, trusted `not_same_as` edge (the homonym veto: surfaces
 *                                  `kip:conflict`, proj.ts:2223-2254 — a veto only makes reads MORE
 *                                  conservative, never fabricates a merge, D-63);
 *       . uncertain / sub-min-confidence / failed / malformed → ABSTAIN (author nothing, N5).
 *   - CONFIRM promotes a candidate to a real `same_as` (now the nodes DO merge); REJECT authors a
 *     `not_same_as` and/or retracts the candidate. Both are deterministic (NO model, NO live gate).
 *   - The whole live model path is opt-in behind `KIP_RESOLVE_LIVE` (mirrors `KIP_LEARN_LIVE`): no
 *     model ever runs unless explicitly enabled; an unavailable model on the live path fails LOUDLY.
 */
import type {
  AssertInput,
  AsOf,
  DispatchMicroagentFn,
  EID,
  FactId,
  MicroagentInvocation,
  MicroagentManifest,
  MicroagentResult,
  Provenance,
  PropValue,
  Repo,
  RetractInput,
} from "../index";

// --- edge-kind constants (ADR-B12a: the quarantine seam is a dedicated edge KIND) ----------------

/** The QUARANTINED candidate-merge edge kind (ADR-B12a, THE CRUX). proj's identity-merge union-find
 *  folds ONLY `edgeKind==="same_as"`, so a `kip:same_as?` edge is, BY CONSTRUCTION, invisible to
 *  `getNode` canonicalization / `sameAsClass` prop-union / every identity read — yet durable, signed,
 *  queryable and surfaced for operator review (N5). It is promoted to a real merge ONLY on confirm. */
export const KIP_SAME_AS_CANDIDATE_KIND = "kip:same_as?";

/** The real, trust-merging edge kind proj's union-find folds unconditionally (proj.ts:2165). A resolver
 *  authors this ONLY on `confirm` (promoting a candidate) — NEVER directly from a model `same` verdict. */
export const SAME_AS_EDGE_KIND = "same_as";

/** The homonym-veto edge kind (D-63): a signed `not_same_as(a,b)` contradicting a `same_as(a,b)` makes
 *  `getNode(a)`/`getNode(b)` surface `kip:conflict` instead of merging (proj.ts:2223-2254). */
export const NOT_SAME_AS_EDGE_KIND = "not_same_as";

// --- adjudication thresholds / caps (ADR-B12b/B12c defaults) --------------------------------------

/** ADR-B12c: author a link ONLY when a confident verdict clears this confidence bar; else ABSTAIN. */
export const DEFAULT_RESOLVE_MIN_CONFIDENCE = 0.85;

/** ADR-B12b: per-node recall fan-out cap (`--top-k` / `KIP_RESOLVE_TOPK`). */
export const DEFAULT_RESOLVE_TOP_K = 8;

/** ADR-B12b: hard cap on TOTAL candidate pairs handed to the model (`--max-pairs`). */
export const DEFAULT_RESOLVE_MAX_PAIRS = 500;

// --- the adjudication verdict schema (ADR-B12c, the strict minimal schema) ------------------------

/** The model's per-pair decision. `same`/`not-same` are the only authoring directions; everything
 *  else (including `uncertain`) ABSTAINS (N5). */
export type ResolverDecision = "same" | "not-same" | "uncertain";

/**
 * The strict verdict schema (ADR-B12c) — `additionalProperties:false` at every level in the live
 * `--json-schema`. `linkKind`/`confidence` are optional; `rationale` is persisted as an edge PROP for
 * audit ONLY (never load-bearing: no link is fabricated from it, INV-A1).
 */
export interface ResolverVerdict {
  decision: ResolverDecision;
  linkKind?: string;
  confidence?: number;
  rationale: string;
}

/** One unordered candidate pair the deterministic generator produced (ADR-B12b). */
export interface CandidatePair {
  a: EID;
  b: EID;
}

/**
 * The per-pair adjudicator the resolver dispatch consults. The LIVE path spawns the authenticated
 * `claude` CLI (reusing `cli/ask.ts`'s hardened envelope, ADR-B12c); tests inject a SCRIPTED map
 * (canned verdict per pair, fully deterministic, no model spend). Returning `null`/`undefined` (a
 * failed/timed-out/malformed dispatch) is treated as an ABSTAIN for that pair.
 */
export type ResolverAdjudicator = (pair: CandidatePair) => ResolverVerdict | null | undefined;

/** The resolver dispatch input (the CLI hands the microagent its bounded pair set, ADR-B12b). */
export interface ResolverInput {
  pairs: CandidatePair[];
  minConfidence?: number;
}

/**
 * The resolver's output payload — structurally an `AcquisitionResult` (docs/33): `proposed`
 * `kip:same_as?` / `not_same_as` edge (and edge-prop) `AssertInput`s plus `RetractInput`s, and a
 * `source` `Provenance` re-stamped by the orchestrator on every committed fact (INV-A1).
 */
export interface ResolverResult {
  proposed: Array<AssertInput | RetractInput>;
  source: Provenance;
  sameAs?: Array<{ candidate: EID; existing: EID }>;
}

/** The `KIP_RESOLVE_LIVE` opt-in gate result (mirrors `LearnLiveGate`, ADR-B12). */
export interface ResolverLiveGate {
  enabled: boolean;
  reason?: string;
}

/** A minimal probe shape (mirrors `ask.ts`'s `HarnessCliProbe`) — "can we?" after "may we?". */
export interface ResolverHarnessProbe {
  available: boolean;
  reason?: string;
}

// --- provenance + deterministic content-derived eids (real; harmless if unused by the stubs) ------

const RESOLVER_AUTHOR = "kip-resolver@1.0.0";
const RESOLVER_REPLICA = "kip-resolver";

/** A placeholder source `Provenance` — the orchestrator re-stamps its own signature at commit (INV-A1). */
export function resolverPlaceholderProvenance(): Provenance {
  return {
    author: RESOLVER_AUTHOR,
    signature: "",
    publicKeyFingerprint: "",
    signedFields: [],
    source: { uri: "resolver://kip-resolver" },
  };
}

/** The deterministic content-derived eid of a `kip:same_as?` candidate edge (ADR-B12a: a re-proposal
 *  folds idempotently, exactly like Layer-1's `documentsEdge`). */
export function sameAsCandidateEid(from: EID, to: EID): EID {
  return `${KIP_SAME_AS_CANDIDATE_KIND}/${from}=>${to}`;
}

/** The deterministic content-derived eid of a `not_same_as` veto edge. */
export function notSameAsEid(from: EID, to: EID): EID {
  return `${NOT_SAME_AS_EDGE_KIND}/${from}=>${to}`;
}

// --- STUBS (author from the ADR; the impl phase fills these in) ------------------------------------

/**
 * STUB (author nothing). The PURE verdict→`AcquisitionResult` mapping under test: a confident `same`
 * (≥ minConfidence) must author a `kip:same_as?` candidate edge (+ audit props); a confident
 * `not-same` a trusted `not_same_as`; everything else ABSTAINS. Returns an EMPTY result so every
 * acceptance assertion fails on its own diff (no fact authored), never on a throw.
 */
export function resolveCandidates(
  _pairs: readonly CandidatePair[],
  _adjudicate: ResolverAdjudicator,
  _opts?: { minConfidence?: number },
): ResolverResult {
  return { proposed: [], source: resolverPlaceholderProvenance(), sameAs: [] };
}

/**
 * The injectable resolver dispatch (`DispatchMicroagentFn`) `runAcquisition` calls. It reads the
 * bounded candidate pairs off `invocation.input` and returns the `ResolverResult` — receiving ONLY a
 * `MicroagentInvocation` (never a `Repo`), so it structurally cannot write the graph (INV-A1). The
 * adjudicator is closed over (live: spawn `claude`; tests: a scripted map). This is REAL wiring; the
 * behaviour under test lives in `resolveCandidates`.
 */
export function makeResolverDispatch(
  adjudicate: ResolverAdjudicator,
  opts?: { minConfidence?: number },
): DispatchMicroagentFn {
  return (invocation: MicroagentInvocation): Promise<MicroagentResult> => {
    const started = Date.now();
    const input = (invocation.input ?? {}) as Partial<ResolverInput>;
    const pairs = Array.isArray(input.pairs) ? input.pairs : [];
    const output = resolveCandidates(pairs, adjudicate, {
      minConfidence: opts?.minConfidence ?? input.minConfidence,
    });
    return Promise.resolve({ exitCode: 0, output, elapsedMs: Date.now() - started });
  };
}

/**
 * STUB (returns `[]`). The DETERMINISTIC, hard-bounded candidate-PAIR generator (ADR-B12b) — the CLI's
 * job, NO model. For each live `code:`/`doc:` node it recalls the top-K lexically nearest OTHER nodes,
 * pairs the seed with each, dedupes unordered `(min,max)` pairs, DROPS pairs already carrying a
 * `same_as`/`not_same_as`/`kip:same_as?` edge, caps per-node at `topK` and TOTAL at `maxPairs`, and is
 * a pure function of the as-of fact set (stable across fact-set permutation). Returns `[]` so the caps
 * hold vacuously but the non-empty/exclusion acceptance assertions fail on their own diff.
 */
export function generateResolverCandidatePairs(
  _repo: Repo,
  _opts?: { topK?: number; maxPairs?: number; prefixes?: string[]; include?: string; exclude?: string; asOf?: AsOf },
): Promise<CandidatePair[]> {
  return Promise.resolve([]);
}

/**
 * STUB (throws). `kip resolve confirm <from> <to>` — promotes an outstanding `kip:same_as?` candidate
 * to a REAL `same_as` (through `runAcquisition`'s `sameAs` channel, so the nodes now MERGE) and may
 * retract the candidate edge. Deterministic, NO model. Throws until implemented so the acceptance
 * assertions (the pair now merges) fail on a rejected promise where a `{ facts }` resolution is expected.
 */
export function resolveConfirm(
  _repo: Repo,
  _manifest: MicroagentManifest,
  _from: EID,
  _to: EID,
  _opts?: { asOf?: AsOf },
): Promise<{ facts: FactId[] }> {
  return Promise.reject(new Error("unimplemented: resolveConfirm"));
}

/**
 * STUB (throws). `kip resolve reject <from> <to>` — authors a signed `not_same_as(from,to)` (which
 * vetoes a Layer-1 `same_as`, surfacing `kip:conflict`) and/or retracts the `kip:same_as?` candidate.
 * Deterministic, NO model. Throws until implemented.
 */
export function resolveReject(
  _repo: Repo,
  _manifest: MicroagentManifest,
  _from: EID,
  _to: EID,
  _opts?: { asOf?: AsOf },
): Promise<{ facts: FactId[] }> {
  return Promise.reject(new Error("unimplemented: resolveReject"));
}

/** One outstanding candidate row `kip resolve list` surfaces for operator review (ADR-B12). */
export interface OutstandingCandidate {
  from: EID;
  to: EID;
  eid: EID;
  confidence?: number;
  rationale?: string;
}

/**
 * STUB (returns `[]`). `kip resolve list` — reads back the outstanding `kip:same_as?` candidate edges
 * for operator review (a pure read, authors nothing). Returns `[]` so the acceptance assertion (an
 * authored candidate is listed) fails on its own diff.
 */
export function resolveList(
  _repo: Repo,
  _opts?: { asOf?: AsOf },
): Promise<OutstandingCandidate[]> {
  return Promise.resolve([]);
}

/**
 * STUB (always disabled). The `KIP_RESOLVE_LIVE` opt-in gate (mirrors `resolveLearnLiveGate`): when the
 * env var is unset/not truthy it returns `{enabled:false}` WITHOUT consulting `probe` (the env var
 * answers "may we?", checked FIRST, so the default `npm run test:sdk` spawns nothing). When set, the
 * probe answers "can we?" — an unavailable model fails LOUDLY (never a silent fabricated link). Stubbed
 * to always-disabled so the "enables when KIP_RESOLVE_LIVE=1 and the model is available" assertion
 * fails on its own diff.
 */
export function resolveResolveLiveGate(_args: {
  env: Record<string, string | undefined>;
  probe: () => ResolverHarnessProbe;
}): ResolverLiveGate {
  return { enabled: false, reason: "resolver live gate: unimplemented stub (always disabled)" };
}
