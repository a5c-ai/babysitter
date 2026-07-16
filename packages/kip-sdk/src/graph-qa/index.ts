/**
 * graph-QA microagent — the READ-ONLY retrieval→synthesis core (design: kip-graph-qa.md).
 *
 * `answerQuestion` is the pure-ish core the bundled `kip-graph-qa.mjs` entrypoint (and the `kip ask`
 * CLI / `kip_ask` MCP call sites) dispatch to: it turns a natural-language `question` into a grounded
 * NL `answer` with per-claim citations back to signed `FactId`s, using ONLY the kip read seams
 * (`recall`/`query`/`asOf`/`getNode`/`getEdge`/`provenanceOf`). It authors NOTHING (INV-A1) and
 * abstains rather than fabricates (N5).
 *
 * The single non-deterministic, accelerator-class step — prompting `runtime.model` to write the prose
 * and pick per-claim citations (kip-graph-qa.md §3.3) — is INJECTED as `synthesize`, mirroring the
 * accelerator boundary (§5.3): the retrieval half is a deterministic function of the as-of fact set,
 * while the model call lives outside `proj`. The frozen acceptance suite injects a deterministic
 * scripted synthesizer so the pipeline is byte-testable while the model boundary stays
 * recall-/citation-based.
 *
 * IMPLEMENTATION STATUS: `answerQuestion` is FULLY IMPLEMENTED — it runs the real, read-only
 * retrieval→assembly→citation-binding pipeline end-to-end (validate input → `recall` seed → bounded
 * typed `query` expansion → `getNode`/`getEdge` hydration with per-datum `FactId` binding → abstain
 * on empty retrieval → injected `synthesize` → drop hallucinated citations). The ONLY thing it does
 * NOT ship in-process is the model call itself: that is the caller-injected `synthesize` seam. In
 * production the SDK ships this whole pipeline plus the documented seam; the host supplies the model
 * synthesizer (genty exposes no in-process one-shot completion API — see `src/cli/ask.ts`
 * `gentyModelSynthesize`), and absent one the answer path fails LOUD on the dispatch-failure channel
 * (exit 5 / `ERR_ASK_DISPATCH_FAILED`), never fabricating (N5). All 15 §8 acceptance criteria are
 * covered by `src/__tests__/graph-qa.test.ts`.
 */
import type {
  AsOf,
  EdgeView,
  EID,
  FactId,
  NodeView,
  PropValue,
  RecallQuery,
  Repo,
  ScopeRef,
  TraversalSpec,
} from "../index";
import { KipError } from "../index";

/** The graph-QA input lens (kip-graph-qa.md §2 `inputSchema`): a question + an optional read lens. */
export interface GraphQaInput {
  /** The natural-language question (REQUIRED, minLength 1). */
  question: string;
  /** OPTIONAL bitemporal read lens — pin it for a reproducible RETRIEVED SET (R5, §5). */
  asOf?: AsOf;
  /** OPTIONAL tenant/namespace/snapshot lens (§8 ScopeRef). */
  scope?: ScopeRef;
}

/**
 * One retrieved datum placed into the model context (kip-graph-qa.md §3.2). Every datum records the
 * backing signed `factId` (the auditable retrieval envelope). The union of all `factId`s is the
 * `usedFacts` output. A `conflict` cell contributes ONE `RetrievedFact` per candidate, each carrying
 * `conflicted: true` and the shared `candidates` list, so both candidate `factId`s land in
 * `usedFacts` and are visible to synthesis (§6.3 — surface, never silently pick a side).
 */
export interface RetrievedFact {
  /** The signed fact backing this datum (REQUIRED). */
  factId: string;
  /** The node or edge EID this datum is about. */
  eid: string;
  /** What was read. */
  kind: "node" | "node-prop" | "edge";
  /** For `node-prop`: the PropKey read. */
  prop?: string;
  /** For `node-prop`: the covering value; for `node`/`edge` existence: `true`. */
  value?: PropValue;
  /** For `edge`: the EdgeKind traversed. */
  edgeKind?: string;
  /** For `edge`: the tail EID. */
  from?: string;
  /** For `edge`: the head EID. */
  to?: string;
  /** `true` iff the covering cell reads CONFLICTED (§6.3). */
  conflicted?: boolean;
  /** For a conflicted cell: the candidate `factId`s (each also present in `usedFacts`). */
  candidates?: string[];
}

/** The assembled, read-only context handed to the injected model synthesizer (§3.3). */
export interface SynthesisContext {
  question: string;
  facts: RetrievedFact[];
}

/** A per-claim citation (kip-graph-qa.md §2 `outputSchema.citations[]` / §4). */
export interface Citation {
  /** FactId of the signed fact backing this claim (REQUIRED). */
  factId: string;
  /** The EID the claim is about (node or edge). */
  eid?: string;
  /** For node-prop citations: the PropKey read. */
  prop?: string;
  /** For edge citations: the EdgeKind traversed. */
  edgeKind?: string;
  /** The answer span this fact supports (for grading). */
  quote?: string;
}

/** What the injected model synthesizer returns (§3.3): prose + its per-claim `factId` citations. */
export interface SynthesisOutput {
  answer: string;
  citations: Citation[];
}

/**
 * The injected, accelerator-class model-synthesis seam (§3.3/§5). Given the read-only context, it
 * returns an answer plus per-claim citations drawn from the supplied facts. It is the ONLY
 * non-deterministic step; `answerQuestion` binds/validates its citations against `usedFacts` (§3.4)
 * before returning.
 */
export type Synthesize = (ctx: SynthesisContext) => Promise<SynthesisOutput> | SynthesisOutput;

/**
 * The READ-ONLY kip handle `answerQuestion` is allowed to touch (INV-A1 by construction — the write
 * seams are not in this projection). Mirrors the §3 pipeline's `recall`/`query`/`asOf`/`getNode`/
 * `getEdge`/`provenanceOf` surface (+ `withScope` to resolve the scope lens).
 */
export type KipReadHandle = Pick<
  Repo,
  | "recall"
  | "query"
  | "getNode"
  | "getEdge"
  | "asOf"
  | "provenanceOf"
  | "withScope"
  // The edge analogue of a node-prop PropCell segment's `assertedBy` — the read-only seam that binds
  // an EDGE claim to its signed edge `FactId` (kip-graph-qa.md §3.2/§4; `provenanceOf` surfaces a
  // fact's `Provenance` but not its content-addressed id, so this is the id source for edge citations).
  | "edgeExistenceFactId"
>;

export interface AnswerQuestionDeps {
  /** A kip read handle (a `KipRepo`) — READ-ONLY use only (INV-A1). */
  repo: KipReadHandle;
  /** The injected model synthesizer (deterministic in tests, a genty model in production). */
  synthesize: Synthesize;
}

/** The graph-QA result (kip-graph-qa.md §2 `outputSchema` + the `abstained` flag). */
export interface GraphQaResult {
  /** The NL answer, OR the canonical abstention phrase (§6). */
  answer: string;
  /** `true` iff no supporting facts were found (§6): answer is the abstention phrase, arrays empty. */
  abstained: boolean;
  /** The per-claim evidence the answer rests on; every `factId` is an element of `usedFacts` (§4). */
  citations: Citation[];
  /** Every fact placed into the model context — the auditable retrieval envelope (§4). */
  usedFacts: string[];
}

/**
 * The canonical abstention phrase (kip-graph-qa.md §6.1) — a stable, testable string. When retrieval
 * yields no supporting facts, `answerQuestion` returns this verbatim with empty `citations`/`usedFacts`
 * and `abstained: true`, and never calls `synthesize` (never fabricates from parametric knowledge).
 */
export const ABSTENTION_ANSWER = "No supporting facts in the knowledge graph.";

/**
 * Answer `input.question` over the kip graph, READ-ONLY, grounded in signed facts (kip-graph-qa.md
 * §3). Retrieves candidates via `recall`, expands with `query`, hydrates with `getNode`/`getEdge`,
 * assembles a context subgraph (each datum bound to its `factId`), synthesizes an answer via the
 * injected `synthesize` seam, then binds/validates citations against `usedFacts` (drops any cited
 * `factId ∉ usedFacts`, §3.4). Empty retrieval ⇒ abstain (§6.1, `synthesize` NOT called). A malformed
 * input (missing `question`) throws (`ERR_MALFORMED_INPUT` / schema-mismatch — the throw channel);
 * an abstention is DATA, not an error (§6.5).
 */
export async function answerQuestion(
  input: GraphQaInput,
  deps: AnswerQuestionDeps,
): Promise<GraphQaResult> {
  const { repo, synthesize } = deps;

  // ── 1. Validate the invocation against the manifest inputSchema (kip-graph-qa.md §2/§6.5). A
  // malformed input (missing/empty `question`) surfaces on the THROW channel as a typed KipError
  // (`ERR_MALFORMED_INPUT`), NEVER as an abstention — abstention is a domain OUTCOME (data), a
  // caller-input rejection is an ERROR (§6.5, the two-channel model). ─────────────────────────────
  if (
    input === null ||
    typeof input !== "object" ||
    typeof (input as { question?: unknown }).question !== "string" ||
    (input as { question: string }).question.trim().length === 0
  ) {
    throw new KipError(
      "ERR_MALFORMED_INPUT",
      "answerQuestion: a non-empty `question` is required (kip-graph-qa.md §2 inputSchema)",
    );
  }
  const question = input.question;
  const asOf = input.asOf;
  const tenant = input.scope?.tenant;

  /** The `scope.tenant` narrowing the §8.12 fixtures enable: the tenant-scoped read sees ONLY EIDs
   *  namespaced under `${tenant}/` (kip's `recall`/`pin`/`withScope` tenant-narrowing is a documented
   *  M8 gap — see `computeRecall`'s `q.scope` note — so graph-QA applies the sound EID-prefix
   *  narrowing the fixtures were built to allow, never leaking a cross-tenant fact, §6/N5). Absent a
   *  `scope.tenant`, every EID is in scope. */
  const inScope = (eid: string): boolean => tenant === undefined || eid.startsWith(`${tenant}/`);

  // ── 2. RETRIEVE (READ-ONLY over `proj` at the resolved lens — no writer dispatched, no fact
  // authored). Candidate recall seeds the SUBJECT node (§5.1 `text` graph-seed), then a bounded typed
  // traversal expands to the connected edges/neighbors. Every read is bounded by `asOf` + `scope`. ──
  const K = 64;
  const recallQuery: RecallQuery = { text: question, k: K, expand: { hops: 3, maxFanout: K } };
  if (asOf !== undefined) recallQuery.asOf = asOf;
  const candidates = await repo.recall(recallQuery);

  const nodeEids = new Set<EID>();
  for (const c of candidates) {
    if (inScope(c.eid)) nodeEids.add(c.eid);
  }

  // Bounded typed expansion: follow as-of-valid edges from the recalled seeds, collecting the
  // connected edges + their endpoint nodes (§3.1). `query`/`traverse` yield as-of-valid edges only.
  const edgeViews = new Map<EID, EdgeView>();
  if (nodeEids.size > 0) {
    const spec: TraversalSpec = {
      seed: [...nodeEids].sort(),
      direction: "both",
      depth: 3,
      maxFanout: K,
    };
    if (asOf !== undefined) spec.asOf = asOf;
    for await (const item of repo.query(spec)) {
      if (isEdgeView(item)) {
        if (inScope(item.eid) && inScope(item.from) && inScope(item.to)) {
          edgeViews.set(item.eid, item);
          nodeEids.add(item.from);
          nodeEids.add(item.to);
        }
      } else if (inScope(item.eid)) {
        nodeEids.add(item.eid);
      }
    }
  }

  // ── 3. Assemble the context subgraph — every datum bound to its signed `FactId` (§3.2). The union
  // of all bound `FactId`s is the `usedFacts` retrieval envelope. ──────────────────────────────────
  const facts: RetrievedFact[] = [];
  const usedFacts = new Set<FactId>();
  const record = (rf: RetrievedFact): void => {
    facts.push(rf);
    usedFacts.add(rf.factId);
    for (const cand of rf.candidates ?? []) usedFacts.add(cand);
  };

  for (const eid of [...nodeEids].sort()) {
    if (!inScope(eid)) continue;
    // eslint-disable-next-line no-await-in-loop -- sequential hydration keeps the read deterministic.
    const node = await repo.getNode(eid, asOf);
    if (!node) continue;
    for (const prop of Object.keys(node.props).sort()) {
      const seg = coveringSegment(node.props[prop]);
      if (!seg) continue;
      if (seg.kind === "value") {
        // A node-prop claim cites the winning covering assert's `assertedBy` FactId (§3.2).
        record({ factId: seg.assertedBy, eid, kind: "node-prop", prop, value: seg.value });
      } else {
        // A `conflict` segment is surfaced as an explicit contradiction citing ALL candidates —
        // never silently collapsed to one side (§3.2/§6.3). One RetrievedFact per candidate so both
        // candidate FactIds land in `usedFacts` and are visible to synthesis.
        const candidates2 = [...seg.candidates];
        for (const cand of candidates2) {
          record({ factId: cand, eid, kind: "node-prop", prop, conflicted: true, candidates: candidates2 });
        }
      }
    }
  }

  for (const eid of [...edgeViews.keys()].sort()) {
    const edge = edgeViews.get(eid)!;
    // eslint-disable-next-line no-await-in-loop -- sequential read; binds the edge to its signed fact.
    const factId = await repo.edgeExistenceFactId(eid, asOf);
    if (factId === null) continue;
    record({ factId, eid, kind: "edge", edgeKind: edge.kind, from: edge.from, to: edge.to });
  }

  // ── 4. ABSTAIN (§6.1) when retrieval yields NO covering facts: the canonical phrase, empty
  // citations/usedFacts, `abstained: true`, and — critically — `synthesize` is NEVER called (no
  // fabrication from parametric knowledge, N5). ────────────────────────────────────────────────────
  if (usedFacts.size === 0) {
    return { answer: ABSTENTION_ANSWER, abstained: true, citations: [], usedFacts: [] };
  }

  // ── 5. SYNTHESIZE (the single accelerator-class, model-relative step, §3.3/§5) over the read-only
  // context. ───────────────────────────────────────────────────────────────────────────────────────
  const synthesized = await synthesize({ question, facts });

  // ── 6. BIND & VALIDATE citations against `usedFacts` (§3.4): DROP any cited `factId` outside the
  // retrieved envelope (a hallucinated citation never surfaces). Every surviving `citation.factId` is
  // an element of `usedFacts` by construction. ─────────────────────────────────────────────────────
  const citations = synthesized.citations.filter((c) => usedFacts.has(c.factId));

  return {
    answer: synthesized.answer,
    abstained: false,
    citations,
    usedFacts: [...usedFacts],
  };
}

/** Structural NodeView/EdgeView discriminator for `query`'s `NodeView | EdgeView` yield: an
 *  `EdgeView` carries topology (`from`/`to`), a `NodeView` does not. */
function isEdgeView(item: NodeView | EdgeView): item is EdgeView {
  return "from" in item && "to" in item;
}

/**
 * The covering value/conflict segment of a `PropCell` for the resolved read instant. `getNode(eid,
 * asOf)` already narrows a cell's segments to the instant (`filterViewToInstant`), so the current
 * covering segment is the open-tailed one (`validTo === null`) when present, else the latest-declared
 * value/conflict segment. `unknown`/`quarantine`/`excised` segments are surfaced as ABSENCE (not
 * coerced to a value, N5) — they contribute no citation.
 */
function coveringSegment(
  cell: NodeView["props"][string],
):
  | { kind: "value"; value: PropValue; assertedBy: FactId }
  | { kind: "conflict"; candidates: FactId[] }
  | undefined {
  const covering = cell.segments.filter((s) => s.kind === "value" || s.kind === "conflict");
  if (covering.length === 0) return undefined;
  const open = covering.filter((s) => s.validTo === null || s.validTo === undefined);
  const pool = open.length > 0 ? open : covering;
  const chosen = pool[pool.length - 1];
  if (chosen.kind === "value") return { kind: "value", value: chosen.value, assertedBy: chosen.assertedBy };
  if (chosen.kind === "conflict") return { kind: "conflict", candidates: chosen.candidates };
  return undefined;
}
