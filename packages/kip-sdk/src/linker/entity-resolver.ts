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
  EdgeKind,
  EID,
  FactId,
  MicroagentInvocation,
  MicroagentManifest,
  MicroagentResult,
  Provenance,
  PropCell,
  PropValue,
  RecallQuery,
  Repo,
  RetractInput,
} from "../index";
import { KipError } from "../index";
import { linkResolver, type NodeInventory } from "./entity-linker";

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

// --- verdict validation + the pure verdict→AcquisitionResult mapping (ADR-B12c, N5) ---------------

/** A finite JS number (rejects `NaN`/`Infinity`, which never clear a confidence bar). */
function isFiniteNumber(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

/**
 * STRICT N5 validation of ONE raw verdict — the exact `additionalProperties:false` schema the live
 * `--json-schema` enforces, applied to the scripted/parsed value: `decision` MUST be one of the three
 * enum members, `rationale` MUST be a string, and `confidence`/`linkKind` (when present) MUST have the
 * right primitive type. Anything else (a missing rationale, an off-schema `decision`, a non-number
 * confidence) is malformed and ABSTAINS — never a fabricated link (INV-A1/N5).
 */
function isWellFormedVerdict(v: unknown): v is ResolverVerdict {
  if (v === null || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  if (r.decision !== "same" && r.decision !== "not-same" && r.decision !== "uncertain") return false;
  if (typeof r.rationale !== "string") return false;
  if (r.confidence !== undefined && !isFiniteNumber(r.confidence)) return false;
  if (r.linkKind !== undefined && typeof r.linkKind !== "string") return false;
  return true;
}

/** One edge-prop `AssertInput` (the covering value cell for an audit prop on a resolver edge). */
function edgePropAssert(eid: EID, prop: string, value: PropValue, provenance: Provenance): AssertInput {
  return {
    type: "assert",
    v: 1,
    target: { kind: "edge-prop", eid, prop },
    value,
    validFrom: 0,
    validTo: null,
    replicaId: RESOLVER_REPLICA,
    provenance,
  };
}

/**
 * The N5 verdict→`AssertInput[]` mapping for ONE pair (ADR-B12c). A confident `same` (≥ minConfidence)
 * yields a QUARANTINED `kip:same_as?` candidate edge (+ audit props); a confident `not-same` a trusted
 * `not_same_as` veto edge (+ audit props); EVERYTHING else — `uncertain`, a sub-threshold or absent
 * confidence, a failed/malformed verdict — abstains (empty array, author nothing). The `rationale`/
 * `confidence` ride along as ordinary edge-prop cells: audit-only, NEVER a proj order/reducer input.
 */
function verdictEntries(
  pair: CandidatePair,
  verdict: ResolverVerdict | null | undefined,
  minConfidence: number,
  source: Provenance,
): AssertInput[] {
  if (!isWellFormedVerdict(verdict)) return []; // failed/malformed/off-schema ⇒ ABSTAIN (N5).
  if (verdict.decision === "uncertain") return []; // an honest "cannot tell" ⇒ ABSTAIN (N5).
  const confidence = verdict.confidence;
  // A calibrated probability is in [0,1] (ADR-B12c prompt). An out-of-range value (1.5, 999, a negative)
  // is malformed, not "very confident": REJECT it (ABSTAIN), never clamp — the same rule the sibling
  // learn-loss scorer applies. The bar is `confidence >= minConfidence && confidence ∈ [0,1]`.
  if (!isFiniteNumber(confidence) || confidence < minConfidence || confidence < 0 || confidence > 1) return [];

  const isSame = verdict.decision === "same";
  const eid = isSame ? sameAsCandidateEid(pair.a, pair.b) : notSameAsEid(pair.a, pair.b);
  const edgeKind = isSame ? KIP_SAME_AS_CANDIDATE_KIND : NOT_SAME_AS_EDGE_KIND;

  const out: AssertInput[] = [
    {
      type: "assert",
      v: 1,
      target: { kind: "edge", eid, edgeKind, from: pair.a, to: pair.b },
      value: true,
      validFrom: 0,
      validTo: null,
      replicaId: RESOLVER_REPLICA,
      provenance: { ...source },
    },
    edgePropAssert(eid, "rationale", verdict.rationale, { ...source }),
    edgePropAssert(eid, "confidence", confidence, { ...source }),
  ];
  if (verdict.linkKind !== undefined) out.push(edgePropAssert(eid, "linkKind", verdict.linkKind, { ...source }));
  return out;
}

/**
 * The PURE verdict→`AcquisitionResult` mapping (ADR-B12c). For each bounded candidate pair it consults
 * the adjudicator and maps a confident `same`→`kip:same_as?` candidate edge / a confident
 * `not-same`→`not_same_as` veto edge / everything-else→ABSTAIN (N5). Authors nothing itself — it only
 * assembles the `proposed` array of `AssertInput`s the orchestrator (`runAcquisition`) commits (INV-A1).
 * Deterministic and side-effect-free: the verdict/confidence never touch orderKey/reducers (§5.3).
 */
export function resolveCandidates(
  pairs: readonly CandidatePair[],
  adjudicate: ResolverAdjudicator,
  opts?: { minConfidence?: number },
): ResolverResult {
  const minConfidence = opts?.minConfidence ?? DEFAULT_RESOLVE_MIN_CONFIDENCE;
  const source = resolverPlaceholderProvenance();
  const proposed: Array<AssertInput | RetractInput> = [];
  for (const pair of pairs) {
    const verdict = adjudicate(pair);
    for (const entry of verdictEntries(pair, verdict, minConfidence, source)) proposed.push(entry);
  }
  return { proposed, source, sameAs: [] };
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

/** A stable unordered `(min,max)` key for a pair — the dedupe/exclusion identity (order-insensitive). */
function unorderedKey(a: EID, b: EID): string {
  return a < b ? `${a} ${b}` : `${b} ${a}`;
}

/** The covering scalar value of a projected prop cell (its `"value"` segment), or `undefined`. */
function coveringValueOf(cell?: PropCell): PropValue | undefined {
  if (!cell) return undefined;
  const seg = cell.segments.find((s) => s.kind === "value");
  return seg && seg.kind === "value" ? seg.value : undefined;
}

/**
 * The DETERMINISTIC, hard-bounded candidate-PAIR generator (ADR-B12b) — the CLI's job, NO model. For
 * each live node (enumerated via `nodeEids`, sorted) it hydrates props, derives an identity/lexical
 * surface, and calls `recall` to get the top-K lexically-nearest OTHER nodes, pairing the seed with
 * each; it ALSO folds in Layer-1's own strong-name `sameAs` collisions over the inventory (so every
 * D-63 homonym false-merge candidate is adjudicated). Then it dedupes unordered `(min,max)` pairs,
 * DROPS pairs already carrying a `same_as`/`not_same_as`/`kip:same_as?` edge, and greedily caps BOTH
 * per-node degree (`topK`) and the TOTAL (`maxPairs`). A pure function of the as-of fact set (`recall`
 * is proj-external but deterministic given the set), so the pair set is stable across fact-set
 * permutation and identical across repeated calls. Authors nothing (INV-A1).
 */
export async function generateResolverCandidatePairs(
  repo: Repo,
  opts?: { topK?: number; maxPairs?: number; prefixes?: string[]; include?: string; exclude?: string; asOf?: AsOf },
): Promise<CandidatePair[]> {
  const topK = opts?.topK ?? DEFAULT_RESOLVE_TOP_K;
  const maxPairs = opts?.maxPairs ?? DEFAULT_RESOLVE_MAX_PAIRS;
  const prefixes = opts?.include ? [opts.include] : (opts?.prefixes ?? ["code:", "doc:"]);
  const asOf = opts?.asOf;

  const enumerated = await repo.nodeEids({ prefixes });
  const seeds = opts?.exclude ? enumerated.filter((eid) => !eid.startsWith(opts.exclude!)) : enumerated;

  // Hydrate each live node's props → a Layer-1 inventory entry + its lexical identity surface.
  const inventory: NodeInventory = [];
  const surfaceText = new Map<EID, string>();
  for (const eid of seeds) {
    // eslint-disable-next-line no-await-in-loop -- bounded per-node read over an already-sorted list.
    const view = await repo.getNode(eid, asOf);
    if (!view) continue; // raced/absent — never adjudicate a node a read cannot resolve (N5).
    const props: Array<{ key: string; value: PropValue }> = [];
    const parts: string[] = [];
    for (const [key, cell] of Object.entries(view.props ?? {})) {
      const value = coveringValueOf(cell);
      if (value === undefined) continue;
      props.push({ key, value });
      if (typeof value === "string") parts.push(value);
    }
    inventory.push({ eid, kind: view.kind, props });
    surfaceText.set(eid, parts.join(" "));
  }

  // The already-decided pairs (a same_as / not_same_as / kip:same_as? edge already exists) — excluded.
  const excluded = new Set<string>();
  const decidedEdgeEids = await repo.edgeEids({
    kinds: [SAME_AS_EDGE_KIND, NOT_SAME_AS_EDGE_KIND, KIP_SAME_AS_CANDIDATE_KIND],
    asOf,
  });
  for (const eeid of decidedEdgeEids) {
    // eslint-disable-next-line no-await-in-loop -- bounded per-edge read.
    const edge = await repo.getEdge(eeid, asOf);
    if (edge) excluded.add(unorderedKey(edge.from, edge.to));
  }

  const degree = new Map<EID, number>();
  const seen = new Set<string>();
  const pairs: CandidatePair[] = [];
  const tryAdd = (x: EID, y: EID): void => {
    if (x === y || pairs.length >= maxPairs) return;
    const lo = x < y ? x : y;
    const hi = x < y ? y : x;
    const key = `${lo} ${hi}`;
    if (seen.has(key) || excluded.has(key)) return;
    if ((degree.get(lo) ?? 0) >= topK || (degree.get(hi) ?? 0) >= topK) return; // per-node cap.
    seen.add(key);
    degree.set(lo, (degree.get(lo) ?? 0) + 1);
    degree.set(hi, (degree.get(hi) ?? 0) + 1);
    pairs.push({ a: lo, b: hi });
  };

  // (1) Layer-1 strong-name collisions FIRST (the D-63 homonym candidates get priority, ADR-B12b).
  const l1 = linkResolver(inventory);
  for (const { candidate, existing } of l1.sameAs ?? []) tryAdd(candidate, existing);

  // (2) recall top-K nearest OTHER nodes per seed, in sorted seed order (deterministic).
  for (const seed of seeds) {
    if (pairs.length >= maxPairs) break;
    const text = surfaceText.get(seed);
    if (text === undefined || text.trim().length === 0) continue;
    const query: RecallQuery = { text, k: topK + 1 }; // +1 to absorb the seed itself when recalled.
    if (asOf !== undefined) query.asOf = asOf;
    // eslint-disable-next-line no-await-in-loop -- deterministic bounded recall per seed.
    const results = await repo.recall(query);
    for (const r of results) tryAdd(seed, r.eid);
  }

  return pairs;
}

/** A deterministic operator-authored provenance for a confirm/reject write (re-signed by the repo). */
function operatorProvenance(): Provenance {
  return { author: RESOLVER_AUTHOR, signature: "", publicKeyFingerprint: "", signedFields: [], source: { uri: "resolver://kip-resolver" } };
}

/** True iff an outstanding `kip:same_as?` candidate edge exists between the pair (EITHER orientation —
 *  the content-derived eid is order-sensitive, but an operator may name the pair in either order). */
async function hasOutstandingCandidate(repo: Repo, from: EID, to: EID, asOf?: AsOf): Promise<boolean> {
  if ((await repo.edgeExistenceFactId(sameAsCandidateEid(from, to), asOf)) !== null) return true;
  if ((await repo.edgeExistenceFactId(sameAsCandidateEid(to, from), asOf)) !== null) return true;
  return false;
}

/** Retract the outstanding `kip:same_as?` candidate for the pair (whichever orientation is durable),
 *  pushing each authored retract `FactId`. Idempotent: retracts ONLY an orientation that exists. */
async function retractOutstandingCandidate(repo: Repo, from: EID, to: EID, facts: FactId[], asOf?: AsOf): Promise<void> {
  for (const [f, t] of [[from, to], [to, from]] as Array<[EID, EID]>) {
    const candEid = sameAsCandidateEid(f, t);
    // eslint-disable-next-line no-await-in-loop -- at most two bounded existence reads per confirm/reject.
    if ((await repo.edgeExistenceFactId(candEid, asOf)) === null) continue;
    // eslint-disable-next-line no-await-in-loop -- sequential HLC/seq advance per authored retract.
    const retracted = await repo.retractFact({
      type: "retract",
      v: 1,
      target: { kind: "edge", eid: candEid, edgeKind: KIP_SAME_AS_CANDIDATE_KIND, from: f, to: t },
      validFrom: 0,
      validTo: null,
      replicaId: RESOLVER_REPLICA,
      provenance: operatorProvenance(),
    });
    facts.push(retracted.id);
  }
}

/**
 * `kip resolve confirm <from> <to>` — promotes an outstanding `kip:same_as?` candidate to a REAL,
 * trust-merging `same_as(from,to)` (proj's union-find now folds the class, so the nodes MERGE) and
 * retracts the quarantined candidate edge. Deterministic — NO model, NO live gate.
 *
 * VALIDATION (ADR-B12 quarantine-then-promote): a merge is authored ONLY to promote an OUTSTANDING
 * candidate the resolver generated. With no outstanding `kip:same_as?` candidate between the pair (either
 * orientation), this fails LOUDLY and authors nothing (N5 — never a merge no candidate lifecycle
 * produced), unless the operator passes an explicit `--force` override (off by default).
 *
 * REVERSIBILITY (honest, ADR-B12a): reversibility is at the FACT level only — retracting the authored
 * `same_as` removes the merge FACT (its existence factId goes null). It does NOT auto-UN-MERGE the read:
 * proj's union-find folds every signature-admitted `same_as` and ignores retraction bookkeeping when
 * re-projecting the class, so read-level un-merge after a confirm would need a proj change and is a
 * DOCUMENTED follow-on (DEBTS D-68). Returns the authored `FactId`s.
 */
export async function resolveConfirm(
  repo: Repo,
  _manifest: MicroagentManifest,
  from: EID,
  to: EID,
  opts?: { asOf?: AsOf; force?: boolean },
): Promise<{ facts: FactId[] }> {
  const asOf = opts?.asOf;
  if (!opts?.force && !(await hasOutstandingCandidate(repo, from, to, asOf))) {
    throw new KipError(
      "ERR_MALFORMED_INPUT",
      `kip resolve confirm: no outstanding kip:same_as? candidate between "${from}" and "${to}" — nothing to ` +
        "promote. confirm promotes a candidate the resolver generated: run `kip resolve` first, or pass --force to override.",
      { from, to },
    );
  }
  const facts: FactId[] = [];
  const merge = await repo.assertFact({
    type: "assert",
    v: 1,
    target: { kind: "edge", eid: `${SAME_AS_EDGE_KIND}/${from}=>${to}`, edgeKind: SAME_AS_EDGE_KIND, from, to },
    value: true,
    validFrom: 0,
    validTo: null,
    replicaId: RESOLVER_REPLICA,
    provenance: operatorProvenance(),
  });
  facts.push(merge.id);
  await retractOutstandingCandidate(repo, from, to, facts, asOf);
  return { facts };
}

/**
 * `kip resolve reject <from> <to>` — authors a signed `not_same_as(from,to)` (vetoing a Layer-1
 * `same_as`, so `getNode(from)`/`getNode(to)` surface `kip:conflict` instead of silently merging, D-63)
 * and retracts the outstanding `kip:same_as?` candidate. Deterministic — NO model, NO live gate.
 *
 * VALIDATION (ADR-B12): a veto is authored ONLY when there is something to veto — an OUTSTANDING
 * `kip:same_as?` candidate OR an existing `same_as` merge between the pair. With neither, this fails
 * LOUDLY and authors nothing (N5), unless the operator passes an explicit `--force` override (off by
 * default).
 *
 * REVERSIBILITY (honest, ADR-B12a): reversibility is at the FACT level only — retracting the signed
 * `not_same_as` removes the veto FACT (its existence factId goes null). It does NOT auto-RE-MERGE the
 * disputed pair: proj's dispute loop counts raw `not_same_as` asserts and does not consult retraction
 * bookkeeping, so `getNode(from)`/`getNode(to)` can remain `kip:conflict` after a retract. Read-level
 * re-merge after a veto would need a proj change and is a DOCUMENTED follow-on (DEBTS D-68). Returns the
 * authored `FactId`s.
 */
export async function resolveReject(
  repo: Repo,
  _manifest: MicroagentManifest,
  from: EID,
  to: EID,
  opts?: { asOf?: AsOf; force?: boolean },
): Promise<{ facts: FactId[] }> {
  const asOf = opts?.asOf;
  if (!opts?.force) {
    const cls = await repo.sameAsClass(from);
    const hasMerge = from !== to && cls.includes(to);
    if (!hasMerge && !(await hasOutstandingCandidate(repo, from, to, asOf))) {
      throw new KipError(
        "ERR_MALFORMED_INPUT",
        `kip resolve reject: nothing to veto between "${from}" and "${to}" — no outstanding kip:same_as? ` +
          "candidate and no same_as merge. reject vetoes a candidate or an existing merge; pass --force to override.",
        { from, to },
      );
    }
  }
  const facts: FactId[] = [];
  const nsEid = notSameAsEid(from, to);
  const veto = await repo.assertFact({
    type: "assert",
    v: 1,
    target: { kind: "edge", eid: nsEid, edgeKind: NOT_SAME_AS_EDGE_KIND, from, to },
    value: true,
    validFrom: 0,
    validTo: null,
    replicaId: RESOLVER_REPLICA,
    provenance: operatorProvenance(),
  });
  facts.push(veto.id);
  await retractOutstandingCandidate(repo, from, to, facts, asOf);
  return { facts };
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
 * `kip resolve list` — reads back the outstanding `kip:same_as?` candidate edges for operator review
 * (a pure read, authors nothing, INV-A1). Enumerates the live candidate edges via the `edgeEids` seam
 * and hydrates each edge's audit props (confidence/rationale) off `getEdge`.
 */
export async function resolveList(repo: Repo, opts?: { asOf?: AsOf }): Promise<OutstandingCandidate[]> {
  const asOf = opts?.asOf;
  const eids = await repo.edgeEids({ kinds: [KIP_SAME_AS_CANDIDATE_KIND], asOf });
  const out: OutstandingCandidate[] = [];
  for (const eid of eids) {
    // eslint-disable-next-line no-await-in-loop -- bounded per-candidate read over a sorted list.
    const edge = await repo.getEdge(eid, asOf);
    if (!edge) continue;
    const confidence = coveringValueOf(edge.props.confidence);
    const rationale = coveringValueOf(edge.props.rationale);
    out.push({
      from: edge.from,
      to: edge.to,
      eid,
      confidence: typeof confidence === "number" ? confidence : undefined,
      rationale: typeof rationale === "string" ? rationale : undefined,
    });
  }
  return out;
}

/**
 * STUB (always disabled). The `KIP_RESOLVE_LIVE` opt-in gate (mirrors `resolveLearnLiveGate`): when the
 * env var is unset/not truthy it returns `{enabled:false}` WITHOUT consulting `probe` (the env var
 * answers "may we?", checked FIRST, so the default `npm run test:sdk` spawns nothing). When set, the
 * probe answers "can we?" — an unavailable model fails LOUDLY (never a silent fabricated link). Stubbed
 * to always-disabled so the "enables when KIP_RESOLVE_LIVE=1 and the model is available" assertion
 * fails on its own diff.
 */
export function resolveResolveLiveGate(args: {
  env: Record<string, string | undefined>;
  probe: () => ResolverHarnessProbe;
}): ResolverLiveGate {
  const flag = args.env.KIP_RESOLVE_LIVE;
  if (flag === undefined || flag.length === 0 || flag === "0" || flag.toLowerCase() === "false") {
    return {
      enabled: false,
      reason:
        "the live kip resolve path is opt-in: set KIP_RESOLVE_LIVE=1 to allow this run to spawn (and " +
        "pay for) the local `claude` CLI per candidate pair. The probe was NOT consulted.",
    };
  }
  const probe = args.probe();
  if (!probe.available) {
    return { enabled: false, reason: `KIP_RESOLVE_LIVE is set, but no model is usable — ${probe.reason ?? "unavailable"}` };
  }
  return { enabled: true };
}
