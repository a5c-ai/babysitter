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
 * NOT ship in-process is the model call itself: that is the caller-injected `synthesize` seam, which
 * remains the primary override (and is what the deterministic suites inject). The PRODUCTION default
 * binds `harnessCliSynthesize` (`src/cli/ask.ts`, ADR-B8): it spawns the already-authenticated local
 * `claude` CLI via `node:child_process` — a Node builtin, so no dependency crosses this boundary. When
 * no model is available (binary absent/unauthenticated) or the contract deviates, the answer path
 * still fails LOUD on the dispatch-failure channel (exit 5 / `ERR_ASK_DISPATCH_FAILED`), never
 * fabricating (N5). All 15 §8 acceptance criteria are covered by `src/__tests__/graph-qa.test.ts`;
 * the production seam is covered by `src/__tests__/graph-qa-live.test.ts`.
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
import { recallSearchTerms, stripLearnEidNamespace } from "../text-terms";

/**
 * The FREE-TEXT prop keys whose VALUES are prose, not schema vocabulary about the subject (round-4
 * §6.1b). Their VALUES are EXCLUDED from the subject-anchoring surface — though their KEYS are still
 * indexed, because a key is schema vocabulary a modeller wrote about the entity. Everything else a
 * retrieved fact carries — the `eid`, `kind`, `EdgeKind`s, every prop/edge-prop KEY, and every
 * STRUCTURED (string/number/boolean) prop VALUE — IS part of the surface (round-4 finding #1: a
 * question keyed on a prop key like "role"/"employer" or a structured value like `role:"CEO"` must be
 * ABLE to anchor, or it retrieves the backing fact and then silently abstains — a §0 "surfaced, never
 * silent" violation in the hard-to-notice direction). The exclusion is what keeps the §8.4
 * Zara-absent fabrication guard abstaining: Tal's `content: "Where does Tal work?"` sharing the verb
 * "work" with a question about Zara must NOT anchor it. Closed and small on purpose: it is part of the
 * relevance contract, not a tunable.
 */
const FREE_TEXT_PROPS: ReadonlySet<string> = new Set(["content", "description", "summary"]);

/**
 * The concept→code link EdgeKind the deterministic entity-linker authors (ADR-B11a,
 * `src/linker/entity-linker.ts` — `DOCUMENTS_EDGE_KIND`): a `doc:` concept DOCUMENTS a `code:*`
 * implementation. graph-QA reads it (never authors it, INV-A1) to surface the LINKED CODE EVIDENCE
 * (D-62): when a cited concept documents a code node, the code side is cited across this edge.
 */
const DOCUMENTS_EDGE_KIND = "documents";

/** The namespace prefix of a `doc:` concept node eid (`doc:<blob>#<slug>`, ADR-B10d). */
const CONCEPT_EID_PREFIX = "doc:";

/** The namespace prefix of a `code:*` node eid (`code:module:…`/`code:symbol:…`/`code:package:…`). */
const CODE_EID_PREFIX = "code:";

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
  kind: "node" | "node-prop" | "edge" | "edge-prop";
  /** For `node-prop`/`edge-prop`: the PropKey read. */
  prop?: string;
  /** For `node-prop`/`edge-prop`: the covering value; for `node`/`edge` existence: `true`. */
  value?: PropValue;
  /** For `edge`/`edge-prop`: the EdgeKind of the edge (traversed, resp. qualified). */
  edgeKind?: string;
  /** For `edge`/`edge-prop`: the tail EID. */
  from?: string;
  /** For `edge`/`edge-prop`: the head EID. */
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

/**
 * A per-claim citation (kip-graph-qa.md §2 `outputSchema.citations[]` / §4).
 *
 * PROVENANCE IS SUBSTRATE-DERIVED, NOT MODEL-SUPPLIED (round-2 finding #1). Of these fields, only
 * `factId` (which fact the claim leans on) and `quote` (which span of the model's own prose it
 * supports) are the model's to choose. `eid`/`prop`/`edgeKind` DESCRIBE the cited fact, so
 * {@link answerQuestion} RECONSTRUCTS them from the {@link RetrievedFact} the `factId` names and
 * discards whatever the synthesizer put there — see the §3.4 rebinding step.
 */
export interface Citation {
  /** FactId of the signed fact backing this claim (REQUIRED). Validated against `usedFacts` (§3.4). */
  factId: string;
  /** The EID the claim is about (node or edge). RECONSTRUCTED from the retrieved fact — never the
   *  synthesizer's. */
  eid?: string;
  /** For node-prop AND edge-prop citations: the PropKey read. RECONSTRUCTED from the retrieved fact.
   *  (An edge-prop citation carries BOTH `prop` and `edgeKind`: the qualifier and the edge it
   *  qualifies.) */
  prop?: string;
  /** For edge citations: the EdgeKind traversed. RECONSTRUCTED from the retrieved fact. */
  edgeKind?: string;
  /** The answer span this fact supports (for grading). The model's OWN prose — accelerator-class
   *  (§5.3), and the only citation field it contributes besides `factId`. It carries no provenance:
   *  nothing downstream resolves a `quote` to a fact. */
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
  // The `same_as` prop-union seams (ADR-B11c / D-66): `sameAsClass` enumerates a seed's equivalence
  // class (reusing proj's already-computed closure) and `getNodeRaw` reads EACH member's OWN cells —
  // the read `getNode` masks behind the canonical member — so a query seeded on one alias returns the
  // UNION of the class's distinct props, each fact bound to its OWN `assertedBy` `FactId`. Read-only.
  | "sameAsClass"
  | "getNodeRaw"
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
  /**
   * `true` iff the answer is the canonical abstention phrase — i.e. `answer === ABSTENTION_ANSWER`
   * and `citations` is empty, ALWAYS. Two ways to get here, and the flag is consistent across both:
   *  - **retrieval abstention** (§6.1, the normal case): no supporting facts were found, so
   *    `synthesize` was never called and `usedFacts` is empty too;
   *  - **synthesizer abstention**: facts WERE retrieved but the synthesizer reported the canonical
   *    phrase, so `usedFacts` stays POPULATED (the retrieval envelope is an audit record of the read
   *    that happened, §4) while `citations` is empty.
   * The invariant a consumer may rely on: `abstained === (answer === ABSTENTION_ANSWER)` — the
   * phrase and the flag can never disagree, and neither is forgeable independently of the other.
   */
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
 *
 * IT IS THE SUBSTRATE'S SIGNAL, AND IT IS NOT FORGEABLE (round-2 finding #2). Because consumers key
 * on the string, model output carrying it must never be able to mean something DIFFERENT from what
 * `answerQuestion` means by it. `answerQuestion` therefore treats a synthesized answer equal to this
 * phrase as an abstention (`abstained: true`, `citations: []`) rather than as an answer, so
 * `abstained === (answer === ABSTENTION_ANSWER)` holds no matter what a synthesizer emits.
 */
export const ABSTENTION_ANSWER = "No supporting facts in the knowledge graph.";

/** `factId` → the retrieved fact backing it. The trusted source for rebinding a citation (§3.4). */
export type RetrievedFactIndex = ReadonlyMap<string, RetrievedFact>;

/**
 * Is `answer` the substrate's abstention sentinel? (§6.1a.) The ONE check that makes
 * `abstained === (answer === ABSTENTION_ANSWER)` hold no matter who produced the answer — a property
 * of the STRING, so unlike an envelope check it cannot be defeated by a component that authors its
 * own envelope. Exported so every layer that mints an abstention/answer surface uses the same rule.
 */
export function isAbstentionAnswer(answer: string): boolean {
  return answer.trim() === ABSTENTION_ANSWER;
}

/**
 * The §3.4 citation guard, shared by every layer that surfaces citations (round-2 review, finding
 * #1 "one layer up"): {@link answerQuestion} runs it over model output, and the `kip ask` / `kip_ask`
 * mapping seams run it over a DISPATCHER's output.
 *
 * It does three things, and what it can promise depends on `facts`:
 *  1. **Filter** — a cited `factId` outside `usedFacts` is DROPPED (never surfaced).
 *  2. **Rebuild** — the citation is reconstructed from known keys, so an unknown key a producer
 *     attached cannot ride along.
 *  3. **Rebind (only with `facts`)** — `eid`/`prop`/`edgeKind` are taken from the RETRIEVED FACT,
 *     making provenance a deterministic function of retrieval. The producer chooses WHICH fact; it
 *     never says what the fact is about.
 *
 * **The honest boundary.** Without `facts`, (3) is impossible: `eid` cannot be checked against a
 * graph that is not in scope, so it is the producer's own claim. This is not laziness — at the
 * mapping seam the check would be *self-referential*: a dispatcher that fabricates a citation also
 * authors the `usedFacts` it would be validated against, so no guard at that layer can constrain it.
 * What (1) DOES close there is the realistic case — a host dispatcher faithfully forwarding output
 * from its own model, where `usedFacts` is genuine and the model invented the `factId`. A host that
 * holds the retrieved facts should pass them here (or use the `synthesize` seam, which routes
 * through `answerQuestion` and gets (3) for free).
 */
export function bindAndValidateCitations(
  citations: readonly Citation[],
  usedFacts: ReadonlySet<string> | readonly string[],
  facts?: RetrievedFactIndex,
): Citation[] {
  const envelope = usedFacts instanceof Set ? usedFacts : new Set(usedFacts as readonly string[]);
  const bound: Citation[] = [];
  for (const c of citations) {
    if (c === null || typeof c !== "object" || typeof c.factId !== "string") continue;
    if (!envelope.has(c.factId)) continue; // (1) outside the retrieved envelope — dropped.
    const f = facts?.get(c.factId);
    // With an index, a `factId` in the envelope but absent from it has unreconstructable provenance:
    // DROP rather than fall back to the producer's version (N5 — no fallbacks).
    if (facts !== undefined && f === undefined) continue;
    // (2)/(3) — rebuilt, from retrieval when we have it.
    const rebound: Citation = { factId: c.factId };
    const eid = f !== undefined ? f.eid : c.eid;
    if (eid !== undefined) rebound.eid = eid;
    const prop = f !== undefined ? f.prop : c.prop;
    if (prop !== undefined) rebound.prop = prop;
    const edgeKind = f !== undefined ? f.edgeKind : c.edgeKind;
    if (edgeKind !== undefined) rebound.edgeKind = edgeKind;
    if (typeof c.quote === "string") rebound.quote = c.quote; // the producer's own prose span (§5.3).
    bound.push(rebound);
  }
  return bound;
}

/**
 * LINKED CODE EVIDENCE — the deterministic, set-pure citation augmentation that closes DEBTS.md
 * **D-62** (kip-graph-qa citation selection over a linked `code:*`/`doc:*` graph).
 *
 * THE GAP. After `kip link` (`src/linker/entity-linker.ts`) authors a `documents` edge from a `doc:`
 * concept node to its `code:module` node, a `kip ask` whose answer rests on that concept cited the
 * CONCEPT side only. The linked `code:module` node's props are `content`(blob)/`format`/`linesOfCode`
 * — no question-lexical text — so the accelerator-class synthesizer never picks it over the concept
 * facts that DO match the question. The graph is unified and traversable (the depth-3 both-direction
 * traversal already crosses the `documents` edge and both the edge fact AND the code node's props are
 * in `usedFacts`), but the provenance under-served the code side.
 *
 * THE FIX, AND WHY IT LIVES HERE (post-`bindAndValidateCitations`, NOT in the synthesis context).
 * Injecting a "code:module X implements this" datum into the synthesis context would leave the CITATION
 * up to the model — and the model's failure to cite the code node (no question-lexical text) is the
 * whole defect, so that path stays model-dependent. Binding the linkage AFTER citation binding makes it
 * DETERMINISTIC: for every concept the answer GENUINELY cites (a bound citation whose subject `eid` is a
 * `doc:` concept), if a `documents` edge in the ALREADY-RETRIEVED fact set connects it to a `code:*`
 * node, add ONE linked-evidence citation naming that code node, bound to the `documents` edge's REAL
 * signed `factId` (already an element of `usedFacts` — the edge-existence fact recorded in step 3).
 *
 * HONESTY / N5. A code citation is added ONLY when a real `documents` edge in the retrieved set connects
 * the code node to a concept that is genuinely in the answer's used evidence — never for a code node no
 * cited concept documents, never for an edge kind other than `documents`, never a fabricated `factId`.
 * The citation is "what the used concept documents": its `eid` is the real `to` of the edge and its
 * `factId` is the edge's real existence fact, so every field is substrate-derived (it is NOT routed back
 * through the model-facing rebinder because it is not model output — it is a deterministic function of
 * the retrieved edge set). It is bounded by the retrieved node/edge set (fetches no new node/edge, widens
 * no traversal), read-only (authors nothing, INV-A1), and it runs only on the non-abstaining return
 * path, so the abstention contract (empty citations on abstain) is untouched.
 *
 * MODEL-DEPENDENCE RESIDUAL (honest): whether the answer PROSE names the file is still the model's; this
 * only guarantees the `code:*` node's linkage FACT is in the citable evidence set deterministically.
 */
function linkedCodeEvidenceCitations(
  facts: readonly RetrievedFact[],
  citations: readonly Citation[],
  usedFacts: ReadonlySet<string>,
): Citation[] {
  // The concepts the answer GENUINELY rests on: a bound citation whose subject eid is a `doc:` concept.
  const citedConceptEids = new Set<string>();
  for (const c of citations) {
    if (typeof c.eid === "string" && c.eid.startsWith(CONCEPT_EID_PREFIX)) citedConceptEids.add(c.eid);
  }
  if (citedConceptEids.size === 0) return [];

  // The retrieved `documents` edges from a genuinely-cited concept to a `code:*` node. Bounded by the
  // already-hydrated `facts`; no new read. Stable order by (edge factId, code eid) for determinism.
  const docEdges = facts
    .filter(
      (f): f is RetrievedFact & { from: string; to: string } =>
        f.kind === "edge" &&
        f.edgeKind === DOCUMENTS_EDGE_KIND &&
        typeof f.from === "string" &&
        typeof f.to === "string" &&
        f.to.startsWith(CODE_EID_PREFIX) &&
        citedConceptEids.has(f.from) &&
        usedFacts.has(f.factId),
    )
    .sort((a, b) => strCmp(a.factId, b.factId) || strCmp(a.to, b.to));

  const linked: Citation[] = [];
  const seen = new Set<string>(); // dedupe on the edge's existence factId — one edge ⇒ one linked citation.
  for (const e of docEdges) {
    if (seen.has(e.factId)) continue;
    seen.add(e.factId);
    // "documented by <cited concept> → implemented in <code node>": the claim is ABOUT the code node
    // (`eid = e.to`), backed by the real `documents` edge fact (`factId`), qualified by its EdgeKind.
    linked.push({ factId: e.factId, eid: e.to, edgeKind: DOCUMENTS_EDGE_KIND });
  }
  return linked;
}

/** A total, deterministic string comparator (no locale) — mirrors the linker's `cmp` (INV-A1 read). */
function strCmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

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
  // Idempotent on the datum's identity `(kind, eid, prop, factId)` (D-66): the `same_as` prop-union pass
  // (§3a) re-reads a class's canonical member — whose OWN cells the main loop already recorded — so a
  // re-record of an identical datum must be a no-op, never a duplicated `RetrievedFact` in the model
  // context. A `conflict` cell keeps contributing one datum per candidate (distinct `factId`s ⇒ distinct
  // keys), unchanged.
  const recordedKeys = new Set<string>();
  const record = (rf: RetrievedFact): void => {
    const key = JSON.stringify([rf.kind, rf.eid, rf.prop ?? null, rf.factId]);
    if (recordedKeys.has(key)) return;
    recordedKeys.add(key);
    facts.push(rf);
    usedFacts.add(rf.factId);
    for (const cand of rf.candidates ?? []) usedFacts.add(cand);
  };

  // ── SUBJECT-ANCHORING SURFACES (round-3 finding #3 / round-4 finding #1 / round-5 §6.1b). Round-4
  // folded everything a retrieved fact carries — eid, kind, EdgeKinds, prop/edge-prop KEYS, structured
  // values — into ONE anchoring surface, and a question anchored if ANY query term hit it. That
  // re-opened the §8.4 fabrication hole in a new shape: "What is Zara's role?" over a graph holding
  // only `person/tal` (with `role:"Engineer"`) shares the bare SCHEMA KEY "role" with Tal's node, so
  // it anchored and fabricated an answer about the ABSENT subject "zara" citing Tal's signed fact. A
  // key/kind the modeller wrote is schema vocabulary the WHOLE graph shares; it names an ATTRIBUTE the
  // question asks ABOUT, not the SUBJECT the question is about. So the surface is split in two, and the
  // query is PARTITIONED against them:
  //   • `schemaVocab` — every prop/edge-prop KEY + every node/edge KIND across the retrieved facts.
  //     Query terms landing here are SCHEMA terms (`role`, `status`, `team`, `owns`): they say WHICH
  //     attribute/relation is asked, never WHO/WHAT.
  //   • `identityValueSurface` — every node/edge's `eid` (learn namespace stripped) + every STRUCTURED
  //     (string/number/boolean) prop/edge-prop VALUE, EXCLUDING the VALUES of free-text props
  //     (`content`/`description`/`summary`, {@link FREE_TEXT_PROPS}). Query terms landing here are the
  //     SUBJECT terms actually present in the graph. `name`/`title`/`label` need no special case —
  //     their values are structured, so they are already in this surface.
  // A question is subject-anchored (§4b) iff it has NO subject term at all (a pure schema question like
  // "What is the status?") OR at least one subject term is present in `identityValueSurface`. A bare
  // schema-key match can no longer anchor a subject that is absent — closing the round-5 hole — while
  // "Who is the CEO?" (subject `ceo` matches the VALUE "CEO") and "Which team owns Ledger?" (subject
  // `ledger` matches identity) still answer. Same deterministic tokenizer as recall on both surfaces,
  // so "present"/"absent" means exactly what it means at the recall layer. */
  const schemaVocab = new Set<string>();
  const identityValueSurface = new Set<string>();
  const addSchema = (text: string): void => {
    for (const term of recallSearchTerms(text)) schemaVocab.add(term);
  };
  const addIdentity = (text: string): void => {
    for (const term of recallSearchTerms(text)) identityValueSurface.add(term);
  };
  /** Add a STRUCTURED prop value (string/number/boolean) to the identity/value surface; a `null`/
   *  `BlobRef` value contributes nothing (an address is not text about the subject — mirrors
   *  `recallSurfaceTerms` in kip-repo.ts, so "present"/"absent" stays identical across the two
   *  layers). */
  const addStructuredValue = (value: PropValue): void => {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      addIdentity(String(value));
    }
  };

  for (const eid of [...nodeEids].sort()) {
    if (!inScope(eid)) continue;
    // eslint-disable-next-line no-await-in-loop -- sequential hydration keeps the read deterministic.
    const node = await repo.getNode(eid, asOf);
    if (!node) continue;
    addIdentity(stripLearnEidNamespace(eid)); // the eid localId is the node's IDENTITY (round-5).
    addSchema(node.kind); // a node KIND is schema vocabulary the whole graph shares, not a subject.
    for (const prop of Object.keys(node.props).sort()) {
      const seg = coveringSegment(node.props[prop]);
      if (!seg) continue;
      addSchema(prop); // the prop KEY is schema vocabulary (which attribute), not the subject (round-5).
      if (seg.kind === "value") {
        // A node-prop claim cites the winning covering assert's `assertedBy` FactId (§3.2). A
        // STRUCTURED value anchors; a free-text value (`content`/`description`/`summary`) does not.
        if (!FREE_TEXT_PROPS.has(prop)) addStructuredValue(seg.value);
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

  // ── 3a. `same_as` PROP-UNION (ADR-B11c / D-66). Two concepts joined by a signed `same_as` edge are
  // ONE entity, but `getNode(alias)` returns only the CANONICAL member's cells (proj's node-merge read
  // semantics — UNCHANGED here), so the loop above recorded one side's facts and MASKED the other
  // member's distinct props. Close the gap in retrieval, per ADR-B11c: for every already-retrieved
  // seed, enumerate its `same_as` equivalence class (`repo.sameAsClass`, reusing proj's already-computed
  // closure — no new traversal), then record EACH class member's OWN node-prop facts read RAW
  // (`repo.getNodeRaw`, the alias-UNMASKED read `getNode` collapses), each bound to its OWN `assertedBy`
  // `FactId`. NOTHING is merged — every fact keeps its own eid + `FactId`, so a query seeded on one
  // alias returns the UNION of the class's distinct props with honest per-fact citations. Bounded (only
  // the classes of already-retrieved seeds), deterministic (sorted class members + idempotent `record`),
  // read-only (authors nothing, INV-A1). It runs on the already-non-empty retrieval path and only ADDS
  // real signed facts, so the §6.1 abstention contract and the §4b subject-anchoring guard (whose
  // surfaces it extends with each member's OWN identity/schema, never a fabricated one) are untouched.
  const sameAsMembers = new Set<EID>();
  for (const seed of [...nodeEids].sort()) {
    if (!inScope(seed)) continue;
    // eslint-disable-next-line no-await-in-loop -- sequential read keeps class enumeration deterministic.
    for (const member of await repo.sameAsClass(seed)) {
      if (inScope(member)) sameAsMembers.add(member);
    }
  }
  for (const eid of [...sameAsMembers].sort()) {
    // eslint-disable-next-line no-await-in-loop -- sequential raw hydration keeps the read deterministic.
    const raw = await repo.getNodeRaw(eid, asOf);
    if (!raw) continue;
    addIdentity(stripLearnEidNamespace(eid)); // the member's own eid localId is IDENTITY (round-5).
    addSchema(raw.kind); // a node KIND is schema vocabulary the whole graph shares, not a subject.
    for (const prop of Object.keys(raw.props).sort()) {
      const seg = coveringSegment(raw.props[prop]);
      if (!seg) continue;
      addSchema(prop); // the prop KEY is schema vocabulary (which attribute), not the subject (round-5).
      if (seg.kind === "value") {
        // The member's OWN node-prop claim cites its OWN winning covering assert's `assertedBy` FactId —
        // identical binding to the node loop above; `record` dedupes an already-recorded canonical datum.
        if (!FREE_TEXT_PROPS.has(prop)) addStructuredValue(seg.value);
        record({ factId: seg.assertedBy, eid, kind: "node-prop", prop, value: seg.value });
      } else {
        const memberCandidates = [...seg.candidates];
        for (const cand of memberCandidates) {
          record({ factId: cand, eid, kind: "node-prop", prop, conflicted: true, candidates: memberCandidates });
        }
      }
    }
  }

  for (const eid of [...edgeViews.keys()].sort()) {
    const edge = edgeViews.get(eid)!;
    addIdentity(stripLearnEidNamespace(eid)); // the edge eid localId is IDENTITY (round-5).
    addSchema(edge.kind); // an EdgeKind is schema vocabulary (which relation), not a subject.
    // eslint-disable-next-line no-await-in-loop -- sequential read; binds the edge to its signed fact.
    const factId = await repo.edgeExistenceFactId(eid, asOf);
    if (factId !== null) {
      record({ factId, eid, kind: "edge", edgeKind: edge.kind, from: edge.from, to: edge.to });
    }

    // AN EDGE'S PROPS ARE FACTS TOO (§3.2). Recording only `edgeExistenceFactId` said an edge EXISTS
    // and nothing about what it SAYS, so any answer the learn encoder stored as an edge qualifier —
    // `reason`, `max_duration_seconds`, a confidence — was structurally invisible to synthesis: the
    // retrieval half surfaced the right edge, the model cited it, and the answer was still
    // unreachable ("the graph does not contain facts explaining the reason"). This is the SAME walk
    // the node loop above performs, over `EdgeView.props` instead of `NodeView.props`, and it
    // inherits the identical semantics by construction: the `EdgeView` came from `repo.query`, which
    // already applied this read's `asOf` gate-instant lens (`buildAsOfView`'s `applyValidTimeLens` —
    // the same lens `getNode(eid, asOf)` applies), and `coveringSegment` is the same covering-cell
    // resolver, so `unknown`/`quarantine`/`excised` stay ABSENCE and a `conflict` stays a surfaced
    // contradiction citing every candidate (§6.3). Each edge-prop datum also carries the edge's own
    // topology (`edgeKind`/`from`/`to`) so the SYNTHESIZER sees which edge the qualifier belongs to.
    // Precisely what survives onto a CITATION: `bindAndValidateCitations` rebinds the three fields a
    // `Citation` actually has — `eid`, `prop` and `edgeKind` — from this datum, so an edge-prop
    // citation names the edge's EID, the qualifier's PropKey and the EdgeKind. `from`/`to` are NOT
    // `Citation` fields and are therefore NOT carried onto the citation; they live on the
    // `RetrievedFact` (the audit record + the model's context) only. Adding them to `Citation` would
    // widen a public output shape, so the honest statement is the one made here rather than a
    // comment claiming a rebinding that does not happen.
    //
    // BOUNDED EXACTLY LIKE THE NODE WALK: `coveringSegment` yields AT MOST ONE covering segment per
    // prop, and the edge set is already capped by the §3.1 traversal bounds (`k`/`depth`/
    // `maxFanout`), so this adds O(props-per-edge) data on an already-bounded edge set — the same
    // growth law node props have. Nothing widens retrieval; this only reads what was already
    // retrieved.
    for (const prop of Object.keys(edge.props).sort()) {
      const seg = coveringSegment(edge.props[prop]);
      if (!seg) continue;
      addSchema(prop); // the edge-prop KEY is schema vocabulary (which qualifier), not the subject (round-5).
      if (seg.kind === "value") {
        // An edge-prop claim cites the winning covering assert's `assertedBy` FactId (§3.2). A
        // STRUCTURED value anchors; a free-text value does not (same rule as the node walk).
        if (!FREE_TEXT_PROPS.has(prop)) addStructuredValue(seg.value);
        record({
          factId: seg.assertedBy,
          eid,
          kind: "edge-prop",
          prop,
          value: seg.value,
          edgeKind: edge.kind,
          from: edge.from,
          to: edge.to,
        });
      } else {
        const edgeCandidates = [...seg.candidates];
        for (const cand of edgeCandidates) {
          record({
            factId: cand,
            eid,
            kind: "edge-prop",
            prop,
            conflicted: true,
            candidates: edgeCandidates,
            edgeKind: edge.kind,
            from: edge.from,
            to: edge.to,
          });
        }
      }
    }
  }

  // ── 4. ABSTAIN (§6.1) when retrieval yields NO covering facts: the canonical phrase, empty
  // citations/usedFacts, `abstained: true`, and — critically — `synthesize` is NEVER called (no
  // fabrication from parametric knowledge, N5). ────────────────────────────────────────────────────
  if (usedFacts.size === 0) {
    return { answer: ABSTENTION_ANSWER, abstained: true, citations: [], usedFacts: [] };
  }

  // ── 4b. SUBJECT-ANCHORING ABSTENTION (round-3 finding #3 / round-4 finding #1 / round-5 §6.1b) —
  // the fabrication guard, moved to the layer that can actually evaluate it. Facts WERE retrieved, but
  // the question must be about their SUBJECT, not merely share a SCHEMA key with them. Partition the
  // question's non-stopword terms against `schemaVocab` (all retrieved prop/edge-prop KEYS + node/edge
  // KINDS): the terms NOT in it are the SUBJECT terms (who/what the question names). The question is
  // anchored iff it has no subject term at all (a pure schema question — "What is the status?" — whose
  // only terms name attributes) OR at least one subject term is PRESENT in `identityValueSurface`
  // (eid localIds + structured non-free-text values). If a subject term exists but NONE is present,
  // the overlap that surfaced these facts was a schema key ("role") or an incidental prose term
  // ("work"), not relevance to the named subject ("zara") — handing those facts to a synthesizer is
  // precisely the §8.4 fabrication setup (the model answers about the wrong/absent entity from
  // parametric knowledge). The honest outcome is the §6.1 abstention.
  //
  // Why partition rather than "ANY query term hits ANY surface": that round-4 rule let a bare schema
  // key anchor an absent subject (the round-5 hole). Why "at least one subject term present" rather
  // than "every": a present-subject question whose RELATION verb is unmatched — "Where does Zara
  // work?" with Zara present but her fact under `employer` (not "work"), "which team owns Ledger" with
  // no explicit `owns` edge — must still ANSWER (the D-52 capability); requiring EVERY subject term
  // would over-abstain and destroy it. The named subject being present is the relevance signal; an
  // unmatched relation verb is not evidence of irrelevance. This is set-pure over the hydrated facts +
  // the query — the same determinism the retrieval half holds. `synthesize` is NEVER called on this
  // path (no fabrication from parametric knowledge, N5).
  const queryTerms = recallSearchTerms(question);
  const subjectTerms = [...queryTerms].filter((t) => !schemaVocab.has(t));
  const subjectAnchored =
    subjectTerms.length === 0 || subjectTerms.some((t) => identityValueSurface.has(t));
  if (!subjectAnchored) {
    return { answer: ABSTENTION_ANSWER, abstained: true, citations: [], usedFacts: [] };
  }

  // ── 5. SYNTHESIZE (the single accelerator-class, model-relative step, §3.3/§5) over the read-only
  // context. ───────────────────────────────────────────────────────────────────────────────────────
  const synthesized = await synthesize({ question, facts });

  // ── 5b. THE SENTINEL IS THE SUBSTRATE'S, NOT THE MODEL'S (round-2 finding #2). `ABSTENTION_ANSWER`
  // is a deterministic SIGNAL this function emits on empty retrieval (§6.1) — "a stable, testable
  // string" consumers key on. A synthesizer that emits it verbatim is therefore reporting an
  // abstention, and MUST NOT be reported as `abstained: false` / `status: "answered"`: that surface
  // says "answered" while carrying the canonical unanswerable phrase, and hands a consumer keying on
  // the phrase a wrong `abstained` reading whose provenance is a model rather than the substrate.
  // The prompt no longer teaches the sentinel (`ask.ts` renderSynthesisPrompt), so this is the
  // belt-and-braces half: however the phrase gets into model output — including a hostile fact value
  // instructing the model to emit it — the substrate reads it as an abstention and stays consistent
  // with the §6.1 retrieval-abstention path. `usedFacts` deliberately stays POPULATED: the facts
  // really were retrieved and placed into the context, and §4 makes `usedFacts` the auditable
  // retrieval envelope — emptying it here would misreport the read that actually happened.
  if (isAbstentionAnswer(synthesized.answer)) {
    return { answer: ABSTENTION_ANSWER, abstained: true, citations: [], usedFacts: [...usedFacts] };
  }

  // ── 6. BIND & VALIDATE citations against `usedFacts` (§3.4). TWO steps, because validating the
  // `factId` alone is not enough (round-2 finding #1 — probe-confirmed):
  //
  //   (a) DROP any cited `factId` outside the retrieved envelope (a hallucinated citation never
  //       surfaces). Every surviving `citation.factId` is an element of `usedFacts` by construction.
  //   (b) REBIND the surviving citation's provenance fields from the RETRIEVED FACT rather than
  //       trusting the synthesizer's copy. A filter that passed the citation OBJECT through verbatim
  //       let a model bind a REAL, signed `factId` to an INVENTED `eid`/`prop`/`edgeKind` — a
  //       citation asserting that a genuine signed fact is about an entity it is not about. That is
  //       manufactured provenance wearing real cryptographic evidence (strictly worse than an obvious
  //       hallucination, because the `factId` audits clean), and it is reachable by prompt injection
  //       from attacker-controlled fact VALUES — the threat ADR-B8 names. Rebinding makes
  //       `eid`/`prop`/`edgeKind` a DETERMINISTIC FUNCTION OF RETRIEVAL (restoring the §5.3
  //       accelerator boundary for them: the model chooses WHICH fact, never WHAT the fact says), and
  //       structurally drops any unknown key a synthesizer attached.
  //
  // The model's remaining contribution to a citation is `quote` — a span of its own prose, which
  // carries no provenance and resolves to nothing (§4).
  //
  // This runs the SHARED guard ({@link bindAndValidateCitations}) rather than an inline copy, so the
  // rule the `kip ask` / `kip_ask` mapping seams apply to a dispatcher's output is literally the same
  // code — one guard, one place to audit (round-2 review, finding #1 "one layer up").
  const factById = new Map<string, RetrievedFact>();
  for (const f of facts) if (!factById.has(f.factId)) factById.set(f.factId, f);
  const citations = bindAndValidateCitations(synthesized.citations, usedFacts, factById);

  // ── 7. LINKED CODE EVIDENCE (D-62). Deterministically surface the `code:*` side of the union: for
  // every concept the answer GENUINELY cites, add the `documents`-edge-backed citation naming the code
  // node it documents (set-pure over the already-retrieved edge set, honest/N5 — see
  // {@link linkedCodeEvidenceCitations}). Runs ONLY here on the non-abstaining path, so the abstention
  // contract is untouched, and appends real-`factId`-bound citations without changing the citation shape.
  const linkedCitations = linkedCodeEvidenceCitations(facts, citations, usedFacts);

  return {
    answer: synthesized.answer,
    abstained: false,
    citations: [...citations, ...linkedCitations],
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
