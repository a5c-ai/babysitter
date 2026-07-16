/**
 * M4 (Retrieval: `recall()` — hybrid vector→graph→RRF + salience/decay) shared test support.
 *
 * FROZEN, spec-driven, PRE-implementation. `recall()` is still an unimplemented throwing stub
 * (`throw new Error("unimplemented: recall")`, index.ts) as of this round — every INV-5 conformance
 * test and every m4-retrieval acceptance test built on these helpers is EXPECTED TO FAIL on a real
 * assertion (a rejected promise where a `RecallResult[]` was expected), never on a type/syntax/
 * import error. These frozen tests are the acceptance criteria for the M4 `recall()` implementation.
 *
 * Sole source of truth: packages/kip-sdk/docs/26-retrieval.md (§5.1 hybrid pipeline / §5.2 traversal
 * / §5.3 derived-content-addressed-incremental indexing + accelerator boundary / §5.4 salience),
 * docs/30-active-knowledge-overview.md (§5.3 accelerator boundary — non-deterministic embedding runs
 * OUTSIDE proj), docs/40-sdk-api-surface.md (`recall`/`RecallQuery`/`RecallResult` shapes), and
 * docs/60-conformance-and-testability.md (INV-5 canonical title + body + pinned-fixture requirement).
 *
 * Like fixtures-m6.ts, this file is built PURELY against the public surface declared in
 * `src/index.ts` (`KipRepo`, `Fact`, `RecallQuery`, `RecallResult`, `DispatchMicroagentFn`,
 * `MicroagentInvocation`, `MicroagentResult`, …) and the M0/M1 `makeWellFormedFact` fixture builder.
 * It invents no private/implementation type.
 *
 * ── The embedding-via-dispatch seam contract (docs/26 §5.1/§5.3, docs/30 §5.3, N2/N5) ──────────────
 * kip NEVER embeds text itself (N2/N5): the *query* vector is CALLER-SUPPLIED as
 * `RecallQuery.embedding`. The *corpus* embedding projection (the ANN accelerator, §5.3) is built by
 * dispatching a genty embedding microagent through the injectable `dispatchMicroagent` seam — the
 * SAME constructor seam `KipRepo` already accepts for M5/M6 — so the non-deterministic embedding runs
 * OUTSIDE the deterministic `proj` fold (§5.3: "the deterministic projection must NOT depend on the
 * non-deterministic embedding"). `makeEmbeddingDispatch()` below is this round's realization of that
 * seam: a `DispatchMicroagentFn` that returns FIXED, pinned embedding vectors for the fixture corpus,
 * making `recall`'s vector half deterministic and INV-5's `recall@10 ≥ 0.95` a byte-deterministic
 * assertion (no live embedding model in the loop — the T5.2.1 "caller-supplied fixed embedding
 * vectors" requirement in INV-5's body).
 *
 * SEAM INVOCATION CONTRACT the implementation MUST honor (defined HERE, by the frozen fixture, since
 * `recall` does not exist yet): to embed corpus entity content the orchestrator dispatches a
 * `MicroagentInvocation` whose `manifest` is `EMBEDDING_MANIFEST` and whose `input` identifies the
 * entity by ITS CONTENT and/or EID — any of `{ content }`, `{ eid }`, `{ text }`, a bare content
 * string, or a batch `{ contents: string[] }` / an array thereof — and reads the returned vector from
 * `output.embedding` (single) or `output.embeddings` (batch). The handler resolves the entity's
 * pinned vector from the corpus and is tolerant of all of those shapes so it never over-constrains
 * the (not-yet-written) implementation's exact call framing.
 */
import {
  KipRepo,
  type DispatchMicroagentFn,
  type Fact,
  type MicroagentInvocation,
  type MicroagentResult,
  type PropValue,
  type RecallQuery,
} from "../../index";
import { cloneFact, makeWellFormedFact } from "./fixtures";

// ────────────────────────────────────────────────────────────────────────────────────────────────
// The SPEC RecallQuery shape (docs/26 §5.1) as a superset of index.ts's current minimal placeholder.
// ────────────────────────────────────────────────────────────────────────────────────────────────
/**
 * docs/26 §5.1 declares `RecallQuery` with `text?`, `embedding?`, `filters?`, `scope?`, `asOf?`,
 * `expand?`, `k`, `rank?`. index.ts currently ships a MINIMAL PLACEHOLDER (`query?`, `embedding?`,
 * `k?`, `asOf?`) with an explicit `TODO(M4/T11.4)` to widen it to the normative shape. Per docs/40
 * ("Implementations MAY extend these shapes with additional optional fields; they MUST NOT repurpose
 * or drop a declared field"), the M4 implementation is expected to widen `RecallQuery` to carry the
 * spec fields below. These frozen tests express the spec contract via this intersection type; every
 * value of `SpecRecallQuery` is assignable to the current `RecallQuery` (which has no required
 * field), so `repo.recall(q)` type-checks TODAY and keeps checking once the surface is widened.
 */
export type SpecRecallQuery = RecallQuery & {
  /** ADVISORY exact/keyword graph-seed only. kip NEVER embeds it (N2). */
  text?: string;
  filters?: { kind?: string[]; props?: Record<string, PropValue>; edgeKinds?: string[] };
  /** Bounded, OPT-IN graph expansion (docs/26 §5.1: "MUST be bounded and opt-in, never unbounded"). */
  expand?: { hops: number; edgeKinds?: string[]; maxFanout?: number };
  /** RRF + salience/recency reweight knobs (docs/26 §5.1/§5.4). */
  rank?: { rrfK?: number; salienceWeight?: number; recencyWeight?: number };
};

// ────────────────────────────────────────────────────────────────────────────────────────────────
// The embedding microagent identity (docs/26 §5.4 / M-7.2: "kip:embedding-model" fact).
// ────────────────────────────────────────────────────────────────────────────────────────────────
export const EMBEDDING_MODEL_ID = "kip-embedding-model";
export const EMBEDDING_MODEL_VERSION = "1.0.0";
/** The `MicroagentInvocation.manifest` the orchestrator MUST name when embedding corpus content. */
export const EMBEDDING_MANIFEST = { name: EMBEDDING_MODEL_ID, version: EMBEDDING_MODEL_VERSION } as const;

export const EMBED_DIM = 8;

// ────────────────────────────────────────────────────────────────────────────────────────────────
// The PINNED corpus — a fixed set of node facts + fixed embedding vectors committed WITH the suite
// (INV-5's "deterministic fixture corpus committed with the suite ... caller-supplied fixed embedding
// vectors ... no live embedding model in the loop"). 16 documents ⇒ a real top-10 vs. bottom-6.
// ────────────────────────────────────────────────────────────────────────────────────────────────
export interface CorpusEntry {
  eid: string;
  kind: string;
  /** The embedded text content (a `content` node-prop fact carries it; the embedder keys off it). */
  content: string;
  /** The PINNED accelerator embedding vector for this entity (returned by `makeEmbeddingDispatch`). */
  embedding: number[];
  /** Optional authored confidence (salience `w_c·confidence` term, docs/26 §5.4). */
  confidence?: number;
}

/** 16 fixed, distinct 8-dimensional embedding vectors — arbitrary but PINNED (byte-committed). */
export const CORPUS: readonly CorpusEntry[] = [
  { eid: "doc/00", kind: "document", content: "alpha vector zero", embedding: [0.90, 0.10, 0.05, 0.02, 0.01, 0.00, 0.03, 0.04] },
  { eid: "doc/01", kind: "document", content: "alpha vector one", embedding: [0.85, 0.20, 0.10, 0.05, 0.02, 0.01, 0.02, 0.03] },
  { eid: "doc/02", kind: "document", content: "alpha vector two", embedding: [0.80, 0.30, 0.08, 0.04, 0.03, 0.02, 0.01, 0.05] },
  { eid: "doc/03", kind: "document", content: "beta vector three", embedding: [0.10, 0.90, 0.15, 0.05, 0.03, 0.02, 0.04, 0.01] },
  { eid: "doc/04", kind: "document", content: "beta vector four", embedding: [0.15, 0.85, 0.20, 0.06, 0.02, 0.03, 0.01, 0.02] },
  { eid: "doc/05", kind: "document", content: "beta vector five", embedding: [0.08, 0.80, 0.30, 0.04, 0.05, 0.01, 0.03, 0.02] },
  { eid: "doc/06", kind: "document", content: "gamma vector six", embedding: [0.05, 0.10, 0.90, 0.20, 0.03, 0.02, 0.01, 0.04] },
  { eid: "doc/07", kind: "document", content: "gamma vector seven", embedding: [0.04, 0.15, 0.85, 0.25, 0.02, 0.03, 0.05, 0.01] },
  { eid: "doc/08", kind: "document", content: "gamma vector eight", embedding: [0.06, 0.08, 0.80, 0.30, 0.04, 0.01, 0.02, 0.03] },
  { eid: "doc/09", kind: "document", content: "delta vector nine", embedding: [0.03, 0.05, 0.10, 0.90, 0.20, 0.02, 0.01, 0.04] },
  { eid: "doc/10", kind: "document", content: "delta vector ten", embedding: [0.02, 0.04, 0.15, 0.85, 0.25, 0.03, 0.02, 0.01] },
  { eid: "doc/11", kind: "document", content: "epsilon vector eleven", embedding: [0.01, 0.03, 0.05, 0.10, 0.90, 0.20, 0.02, 0.03] },
  { eid: "doc/12", kind: "document", content: "epsilon vector twelve", embedding: [0.02, 0.02, 0.04, 0.15, 0.85, 0.25, 0.03, 0.01] },
  { eid: "doc/13", kind: "document", content: "zeta vector thirteen", embedding: [0.03, 0.01, 0.02, 0.05, 0.10, 0.90, 0.20, 0.04] },
  { eid: "doc/14", kind: "document", content: "eta vector fourteen", embedding: [0.04, 0.02, 0.01, 0.03, 0.05, 0.10, 0.90, 0.20] },
  { eid: "doc/15", kind: "document", content: "theta vector fifteen", embedding: [0.05, 0.03, 0.02, 0.01, 0.03, 0.05, 0.10, 0.90] },
] as const;

/**
 * The PINNED query set — each `embedding` is the CALLER-SUPPLIED query vector (docs/26 §5.1: kip
 * consumes, never produces query embeddings). Each is a deliberate BLEND (not equal to any single
 * corpus vector) so exact-kNN is a genuine ranking, not a trivial identity lookup.
 */
export interface QueryFixture {
  id: string;
  embedding: number[];
}
export const QUERIES: readonly QueryFixture[] = [
  { id: "q-alpha", embedding: [0.88, 0.22, 0.09, 0.04, 0.02, 0.01, 0.02, 0.03] },
  { id: "q-beta", embedding: [0.12, 0.87, 0.22, 0.05, 0.03, 0.02, 0.02, 0.02] },
  { id: "q-gamma", embedding: [0.05, 0.11, 0.87, 0.24, 0.03, 0.02, 0.02, 0.03] },
  { id: "q-delta", embedding: [0.03, 0.05, 0.13, 0.87, 0.23, 0.03, 0.02, 0.02] },
] as const;

// ────────────────────────────────────────────────────────────────────────────────────────────────
// Deterministic exact-kNN ground truth math (computed IN-TEST from the pinned vectors — the
// "ground-truth exact-kNN ranking over the deterministic fixture corpus" INV-5 measures against).
// ────────────────────────────────────────────────────────────────────────────────────────────────
export function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/** The exact top-`k` corpus eids for `queryEmbedding`, ranked by descending cosine similarity. */
export function exactTopKByCosine(queryEmbedding: readonly number[], k: number): string[] {
  return CORPUS.map((c) => ({ eid: c.eid, sim: cosineSimilarity(queryEmbedding, c.embedding) }))
    .sort((x, y) => (y.sim - x.sim) || (x.eid < y.eid ? -1 : 1))
    .slice(0, k)
    .map((r) => r.eid);
}

/** recall@k = |retrieved ∩ groundTruthTopK| / min(k, |groundTruthTopK|). */
export function recallAtK(retrievedEids: readonly string[], groundTruthTopK: readonly string[]): number {
  if (groundTruthTopK.length === 0) return 1;
  const retrieved = new Set(retrievedEids);
  const hits = groundTruthTopK.reduce((n, eid) => (retrieved.has(eid) ? n + 1 : n), 0);
  return hits / groundTruthTopK.length;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────
// Fact builders — the corpus is materialized by INGESTING hand-built facts (the t5-4 pattern), since
// `putNode`/`putEdge` are themselves still unimplemented throwing stubs on the current surface.
// ────────────────────────────────────────────────────────────────────────────────────────────────
/** A node-existence `assert` fact (value=true, open valid interval). */
export function nodeExistenceFact(eid: string, kind: string, opts?: { wall?: number }): Fact {
  const f = makeWellFormedFact({
    target: { kind: "node", eid, nodeKind: kind },
    ...(opts?.wall !== undefined ? { hlc: { wall: opts.wall } } : {}),
  });
  f.value = true;
  f.validFrom = 0;
  f.validTo = null;
  return f;
}

/** A `node-prop` `assert` fact (the observable value carrier — reads back via `getNode(eid).props`). */
export function nodePropFact(eid: string, prop: string, value: PropValue, opts?: { wall?: number }): Fact {
  const f = makeWellFormedFact({
    target: { kind: "node-prop", eid, prop },
    ...(opts?.wall !== undefined ? { hlc: { wall: opts.wall } } : {}),
  });
  f.value = value;
  f.validFrom = 0;
  f.validTo = null;
  return f;
}

/** An `edge` existence `assert` fact over `[validFrom, validTo)` (drives graph expansion/centrality). */
export function edgeFact(
  eid: string,
  edgeKind: string,
  from: string,
  to: string,
  opts?: { validFrom?: number; validTo?: number | null },
): Fact {
  const f = makeWellFormedFact({
    target: { kind: "edge", eid, edgeKind, from, to },
  });
  f.value = true;
  f.validFrom = opts?.validFrom ?? 0;
  f.validTo = opts?.validTo === undefined ? null : opts.validTo;
  return f;
}

/** The `kip:embedding-model` identity fact (docs/26 §5.4 / M-7.2) — a schema-target marker so the
 *  accelerator projection's cache key covers the embedding-model identity. */
export function embeddingModelFact(): Fact {
  const f = makeWellFormedFact({
    target: { kind: "schema", ontologyRef: `kip:embedding-model/${EMBEDDING_MODEL_ID}@${EMBEDDING_MODEL_VERSION}` },
  });
  f.value = `${EMBEDDING_MODEL_ID}@${EMBEDDING_MODEL_VERSION}`;
  f.validFrom = 0;
  f.validTo = null;
  return f;
}

/** Every fact needed to materialize the pinned corpus: existence + content + confidence per node,
 *  plus the embedding-model identity fact. Ingested in array order into a fresh repo. */
export function buildCorpusFacts(): Fact[] {
  const facts: Fact[] = [embeddingModelFact()];
  for (const c of CORPUS) {
    facts.push(nodeExistenceFact(c.eid, c.kind));
    facts.push(nodePropFact(c.eid, "content", c.content));
    if (c.confidence !== undefined) facts.push(nodePropFact(c.eid, "confidence", c.confidence));
  }
  return facts;
}

/** Ingest an ordered fact list into a fresh `KipRepo` built with the scripted embedding dispatch. */
export async function ingestFacts(repo: KipRepo, facts: readonly Fact[]): Promise<void> {
  for (const f of facts) {
    // eslint-disable-next-line no-await-in-loop -- intentionally sequential, mirrors t5-4/inv-1 rig
    await repo.ingest(cloneFact(f));
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────
// The scripted embedding-dispatch seam (§5.3 accelerator, OUTSIDE proj).
// ────────────────────────────────────────────────────────────────────────────────────────────────
export interface EmbeddingDispatchHandle {
  dispatch: DispatchMicroagentFn;
  /** Every invocation the seam received, in arrival order (assert dispatch counts / that proj never
   *  triggers embedding). */
  log: MicroagentInvocation[];
  /** Just the invocations whose manifest is `EMBEDDING_MANIFEST` (the embedding calls). */
  embedInvocations: MicroagentInvocation[];
}

function resolveVectorWith(entries: readonly CorpusEntry[]): (target: unknown) => number[] | undefined {
  const contentToVec = new Map(entries.map((c) => [c.content, c.embedding] as const));
  const eidToVec = new Map(entries.map((c) => [c.eid, c.embedding] as const));
  return (target: unknown): number[] | undefined => {
    if (typeof target === "string") {
      return contentToVec.get(target) ?? eidToVec.get(target);
    }
    if (target && typeof target === "object") {
      const o = target as Record<string, unknown>;
      for (const key of ["content", "text", "eid"] as const) {
        const v = o[key];
        if (typeof v === "string") {
          const hit = contentToVec.get(v) ?? eidToVec.get(v);
          if (hit) return hit;
        }
      }
      // Tolerant substring fallback so the (not-yet-written) implementation's exact input framing is
      // not over-constrained: match any known entity whose content or eid appears in the input JSON.
      const json = JSON.stringify(target);
      for (const c of entries) {
        if (json.includes(c.content) || json.includes(c.eid)) return c.embedding;
      }
    }
    return undefined;
  };
}

function collectBatch(input: unknown): string[] | undefined {
  if (Array.isArray(input)) return input.map((x) => x) as string[];
  if (input && typeof input === "object") {
    const o = input as Record<string, unknown>;
    for (const key of ["contents", "texts", "eids", "items", "nodes"] as const) {
      if (Array.isArray(o[key])) return o[key] as string[];
    }
  }
  return undefined;
}

/**
 * Builds the `DispatchMicroagentFn` that returns pinned embedding vectors for the fixture corpus.
 * Only invocations naming `EMBEDDING_MANIFEST` are treated as embedding calls; any other manifest
 * throws (this seam scripts embeddings only — the M4 recall path dispatches nothing else). A batch
 * input yields `output.embeddings`; a single input yields `output.embedding`.
 */
export function makeEmbeddingDispatch(extra: readonly CorpusEntry[] = []): EmbeddingDispatchHandle {
  const log: MicroagentInvocation[] = [];
  const embedInvocations: MicroagentInvocation[] = [];
  const resolveVector = resolveVectorWith([...CORPUS, ...extra]);
  const dispatch: DispatchMicroagentFn = async (invocation): Promise<MicroagentResult> => {
    log.push(invocation);
    if (invocation.manifest.name !== EMBEDDING_MANIFEST.name) {
      throw new Error(
        `makeEmbeddingDispatch: unexpected non-embedding manifest "${invocation.manifest.name}@${invocation.manifest.version}" ` +
          `(the M4 recall pipeline dispatches ONLY the embedding microagent, docs/26 §5.1/§5.3)`,
      );
    }
    embedInvocations.push(invocation);
    const batch = collectBatch(invocation.input);
    if (batch) {
      const embeddings = batch.map((item) => {
        const vec = resolveVector(item);
        if (!vec) throw new Error(`makeEmbeddingDispatch: no pinned vector for batch item ${JSON.stringify(item)}`);
        return vec;
      });
      return { exitCode: 0, output: { embeddings }, elapsedMs: 0 };
    }
    const embedding = resolveVector(invocation.input);
    if (!embedding) {
      throw new Error(`makeEmbeddingDispatch: no pinned vector for input ${JSON.stringify(invocation.input)}`);
    }
    return { exitCode: 0, output: { embedding }, elapsedMs: 0 };
  };
  return { dispatch, log, embedInvocations };
}

// ────────────────────────────────────────────────────────────────────────────────────────────────
// Repo construction helper (collision-free replicaId for the process-shared KipRepo.registry).
// ────────────────────────────────────────────────────────────────────────────────────────────────
let replicaCounter = 0;
export function freshReplicaId(label: string): string {
  replicaCounter += 1;
  return `m4-test-${label}-${replicaCounter}-${Date.now()}`;
}

/**
 * A fresh `KipRepo` wired with the scripted embedding dispatch; caller MUST `.close()` it. `extra`
 * registers additional content/eid→vector mappings for scenario nodes not in the base `CORPUS` (the
 * graph-expansion / salience / filter fixtures build their own small graphs of such nodes).
 */
export function makeRepo(
  label: string,
  extra: readonly CorpusEntry[] = [],
): { repo: KipRepo; embed: EmbeddingDispatchHandle } {
  const embed = makeEmbeddingDispatch(extra);
  const repo = new KipRepo({ replicaId: freshReplicaId(label), dispatchMicroagent: embed.dispatch });
  return { repo, embed };
}
