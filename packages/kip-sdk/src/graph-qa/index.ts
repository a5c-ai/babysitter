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
 * while the model call lives outside `proj`. The production entrypoint wires a genty model into
 * `synthesize`; the frozen acceptance suite injects a deterministic scripted synthesizer so the
 * pipeline is byte-testable while the model boundary stays recall-/citation-based.
 *
 * THIS IS A PRE-IMPLEMENTATION STUB (TDD): `answerQuestion` throws `unimplemented` so the frozen
 * `src/__tests__/graph-qa.test.ts` acceptance suite fails on real assertions (a rejected promise
 * where a `GraphQaResult` was expected), never on a type/syntax/import error.
 */
import type { AsOf, PropValue, Repo, ScopeRef } from "../index";

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
  "recall" | "query" | "getNode" | "getEdge" | "asOf" | "provenanceOf" | "withScope"
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
  _input: GraphQaInput,
  _deps: AnswerQuestionDeps,
): Promise<GraphQaResult> {
  void _input;
  void _deps;
  throw new Error("unimplemented: answerQuestion (graph-qa microagent — kip-graph-qa.md §3)");
}
