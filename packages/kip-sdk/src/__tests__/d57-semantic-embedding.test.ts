/**
 * d57-semantic-embedding.test.ts — D-57 (SEMANTIC half): the owner-approved lift of the "kip never
 * embeds the query" (N2/N5) stance. kip now embeds the query ITSELF and drives the EXISTING vector
 * half of recall — OPT-IN (`q.semantic === true`), so the frozen suite's default behavior is unchanged.
 *
 * Three honest layers are pinned here:
 *   1. `defaultEmbed` — the dependency-free FUZZY embedder: pure/total/deterministic, L2-normalized,
 *      character/token OVERLAP (typos/compounds/substrings) but NOT learned synonymy (the honest
 *      boundary: a true synonym with no shared characters is ~orthogonal — pinned so nobody mistakes
 *      the default for semantic).
 *   2. QUERY-EMBEDDING WIRING with the dep-free default (opt-in on): a fuzzy/compound overlap the pure
 *      lexical path misses now surfaces via the vector half's RRF contribution; opt-in OFF is
 *      byte-identical to the pre-D-57 path (no query embedding, no vector ranks).
 *   3. INJECTED REAL EMBEDDER: with a scripted synonym-aware embedding dispatch, a TRUE synonym query
 *      (no lexical overlap at all) NOW retrieves the node — proving the §5.3 seam delivers true
 *      semantics when a real model is injected, and that kip embeds the query SYMMETRICALLY.
 *
 * Plus: N5 subject-anchoring still abstains over a semantic-retrieved node whose subject is absent, and
 * the dep-free default keeps recall permutation-deterministic.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  KipRepo,
  type DispatchMicroagentFn,
  type EID,
  type Fact,
  type MicroagentResult,
  type Provenance,
  type PropValue,
  type RecallResult,
} from "../index";
import { defaultEmbed, DEFAULT_EMBED_DIM } from "../embed/default-embedder";
import {
  edgeFact,
  freshReplicaId,
  ingestFacts,
  nodeExistenceFact,
  nodePropFact,
  type SpecRecallQuery,
} from "./conformance/fixtures-m4";
import {
  answerQuestion,
  type AnswerQuestionDeps,
  type SynthesisContext,
  type SynthesisOutput,
} from "../graph-qa";

const open: KipRepo[] = [];
function track(repo: KipRepo): KipRepo {
  open.push(repo);
  return repo;
}
afterEach(() => {
  while (open.length > 0) open.pop()?.close();
});

/** A repo with NO injected dispatch ⇒ the semantic path uses the dependency-free `defaultEmbed`. */
function depFreeRepo(label: string): KipRepo {
  return track(new KipRepo({ replicaId: freshReplicaId(label) }));
}

function eidsOf(results: readonly RecallResult[]): string[] {
  return results.map((r) => r.eid);
}

function cosine(a: readonly number[], b: readonly number[]): number {
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

// ────────────────────────────────────────────────────────────────────────────────────────────────
// (1) defaultEmbed — the dependency-free FUZZY embedder units.
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("D-57 semantic (1) — defaultEmbed is pure/total/deterministic, L2-normalized, fuzzy-not-semantic", () => {
  it("is deterministic: identical text yields a byte-identical vector across calls", () => {
    const a = defaultEmbed("revenue recognition schedule");
    const b = defaultEmbed("revenue recognition schedule");
    expect(b).toEqual(a);
    expect(a.length).toBe(DEFAULT_EMBED_DIM);
  });

  it("is L2-normalized for any non-empty text (unit norm), and the ZERO vector for tokenless text", () => {
    const v = defaultEmbed("healthcare platform");
    let norm = 0;
    for (const x of v) norm += x * x;
    expect(Math.sqrt(norm)).toBeCloseTo(1, 10);

    // All-stopword / punctuation-only tokenizes to nothing ⇒ the zero vector (cosine 0, never NaN).
    const empty = defaultEmbed("the of and !!! ...");
    expect(empty.length).toBe(DEFAULT_EMBED_DIM);
    expect(empty.every((x) => x === 0)).toBe(true);
    expect(cosine(empty, v)).toBe(0);
  });

  it("is TOTAL: never throws on empty/whitespace/unicode input", () => {
    expect(() => defaultEmbed("")).not.toThrow();
    expect(() => defaultEmbed("   ")).not.toThrow();
    expect(() => defaultEmbed("谷歌 café naïve")).not.toThrow();
  });

  it("a shared-token/char-overlap pair has HIGHER cosine than a disjoint pair", () => {
    const health = defaultEmbed("healthcare");
    const healthCare = defaultEmbed("health care"); // compound overlap (health ⊂ healthcare)
    const disjoint = defaultEmbed("photosynthesis chlorophyll");
    const overlapCos = cosine(health, healthCare);
    const disjointCos = cosine(health, disjoint);
    expect(overlapCos).toBeGreaterThan(0.3);
    expect(overlapCos).toBeGreaterThan(disjointCos);
  });

  it("HONEST BOUNDARY: a true synonym with NO shared characters is ~orthogonal (NOT learned synonymy)", () => {
    // The canonical D-57 example: same concept, disjoint surface. A character-derived vector CANNOT
    // know these are synonyms — its cosine is ~0. This pins that the default is FUZZY, not semantic.
    const revenueRecognition = defaultEmbed("revenue recognition");
    const bookingSettlement = defaultEmbed("booking settlement");
    const synonymCos = cosine(revenueRecognition, bookingSettlement);
    expect(Math.abs(synonymCos)).toBeLessThan(0.25);
    // And decisively lower than a genuine character-overlap pair.
    const overlapCos = cosine(defaultEmbed("revenue recognition"), defaultEmbed("revenue recognized"));
    expect(synonymCos).toBeLessThan(overlapCos);
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// (2) Query-embedding wiring with the dep-free default (opt-in ON), and the opt-in OFF byte-identity.
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("D-57 semantic (2) — kip embeds the query (dep-free default); opt-in OFF is unchanged", () => {
  async function seedFuzzy(repo: KipRepo): Promise<void> {
    await ingestFacts(repo, [
      // "healthcare" is a COMPOUND of the query's "health care" — no shared TOKEN (so the lexical path
      // misses it), but heavy character-3-gram overlap (so the fuzzy vector half surfaces it).
      nodeExistenceFact("hb", "note"),
      nodePropFact("hb", "content", "healthcare platform overview"),
      // A distractor sharing neither token nor character overlap with the query ⇒ never surfaced.
      nodeExistenceFact("px", "note"),
      nodePropFact("px", "content", "photosynthesis chlorophyll"),
    ]);
  }

  it("OPT-IN OFF: a compound-overlap query does NOT surface the node, and no result carries a vector rank (byte-identical to pre-D-57)", async () => {
    const repo = depFreeRepo("sem-off");
    await seedFuzzy(repo);
    const results = await repo.recall({ text: "health care", k: 10 } as SpecRecallQuery);
    expect(eidsOf(results)).not.toContain("hb");
    for (const r of results) expect(r.ranks.vector).toBeUndefined();
  });

  it("OPT-IN ON: the compound-overlap node is now surfaced VIA the vector half's RRF contribution", async () => {
    const repo = depFreeRepo("sem-on");
    await seedFuzzy(repo);
    const results = await repo.recall({ text: "health care", k: 10, semantic: true } as SpecRecallQuery);
    const hb = results.find((r) => r.eid === "hb");
    expect(hb).toBeDefined();
    expect(hb!.ranks.vector).toBeDefined(); // it came from the vector half, not lexical
    // The character-disjoint distractor is NOT a vector candidate (cosine 0), so it is not surfaced.
    expect(eidsOf(results)).not.toContain("px");
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// (3) Injected REAL embedder — true synonymy when a real model is behind the seam.
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("D-57 semantic (3) — an injected synonym-aware embedder makes a TRUE synonym query retrieve", () => {
  // A scripted embedding dispatch mapping synonyms to the SAME vector. It embeds BOTH the query (kip
  // dispatches it symmetrically now) and the corpus content through this ONE seam.
  const VEC_A = [1, 0, 0, 0];
  const VEC_ORTH = [0, 1, 0, 0];
  function synonymVector(text: string): number[] {
    // "revenue recognition" and "booking settlement store" are treated as the SAME concept.
    if (/revenue recognition|booking settlement/i.test(text)) return VEC_A;
    return VEC_ORTH;
  }
  const synonymDispatch: DispatchMicroagentFn = async (invocation): Promise<MicroagentResult> => {
    const input = invocation.input as { content?: unknown };
    const content = typeof input?.content === "string" ? input.content : "";
    return { exitCode: 0, output: { embedding: synonymVector(content) }, elapsedMs: 0 };
  };

  it("query 'revenue recognition' (no lexical overlap) retrieves the 'booking settlement' node via the injected embedder", async () => {
    const repo = track(new KipRepo({ replicaId: freshReplicaId("sem-injected"), dispatchMicroagent: synonymDispatch }));
    await ingestFacts(repo, [
      nodeExistenceFact("bs", "concept"),
      nodePropFact("bs", "content", "booking settlement store"),
      nodeExistenceFact("distract", "concept"),
      nodePropFact("distract", "content", "chlorophyll photosynthesis"),
    ]);

    // No lexical overlap between "revenue recognition" and "booking settlement store" — the LEXICAL
    // path (opt-in OFF) retrieves nothing.
    expect(await repo.recall({ text: "revenue recognition", k: 10 } as SpecRecallQuery)).toEqual([]);

    // Opt-in ON: kip embeds the query through the injected seam; the synonym vector matches bs.
    const results = await repo.recall({ text: "revenue recognition", k: 10, semantic: true } as SpecRecallQuery);
    const bs = results.find((r) => r.eid === "bs");
    expect(bs).toBeDefined();
    expect(bs!.ranks.vector).toBeDefined();
    // The orthogonal distractor is not a vector candidate (cosine 0).
    expect(eidsOf(results)).not.toContain("distract");
  });

  it("a genuinely-failed injected embedder surfaces LOUDLY (N5 — never a silent fallback to the default)", async () => {
    const failing: DispatchMicroagentFn = async () => {
      throw new Error("embedding model unavailable");
    };
    const repo = track(new KipRepo({ replicaId: freshReplicaId("sem-failing"), dispatchMicroagent: failing }));
    await ingestFacts(repo, [nodeExistenceFact("n", "note"), nodePropFact("n", "content", "revenue recognition")]);
    await expect(
      repo.recall({ text: "revenue recognition", k: 10, semantic: true } as SpecRecallQuery),
    ).rejects.toThrow(/embedding model unavailable/);
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// (4) N5 — semantic recall only ADDS candidates; subject-anchoring still governs the ANSWER.
// ────────────────────────────────────────────────────────────────────────────────────────────────
function fixtureProvenance(): Provenance {
  return { author: "d57-sem-fixture", signature: "sig:placeholder", publicKeyFingerprint: "fpr", signedFields: [] };
}
async function assertNode(repo: KipRepo, eid: EID, nodeKind: string): Promise<string> {
  const r = await repo.assertFact({
    type: "assert",
    v: 1,
    target: { kind: "node", eid, nodeKind },
    value: true,
    validFrom: 0,
    validTo: null,
    replicaId: "author",
    provenance: fixtureProvenance(),
  });
  return r.id;
}
async function assertProp(repo: KipRepo, eid: EID, prop: string, value: PropValue): Promise<string> {
  const r = await repo.assertFact({
    type: "assert",
    v: 1,
    target: { kind: "node-prop", eid, prop },
    value,
    validFrom: 0,
    validTo: null,
    replicaId: "author",
    provenance: fixtureProvenance(),
  });
  return r.id;
}
async function assertEdge(repo: KipRepo, eid: EID, edgeKind: string, from: EID, to: EID): Promise<string> {
  const r = await repo.assertFact({
    type: "assert",
    v: 1,
    target: { kind: "edge", eid, edgeKind, from, to },
    value: true,
    validFrom: 0,
    validTo: null,
    replicaId: "author",
    provenance: fixtureProvenance(),
  });
  return r.id;
}

describe("D-57 semantic (4) — N5: a semantic-retrieved node whose subject is absent still ABSTAINS (no fabrication)", () => {
  it("'Where does Zara work?' with semantic ON, over a graph holding only Tal, abstains and does NOT invoke synthesize", async () => {
    const repo = track(new KipRepo({ replicaId: freshReplicaId("sem-n5") }));
    // The graph holds ONLY Tal. His content shares the token "work" with the question, so the fuzzy
    // DEFAULT embedder WILL surface Tal's node in the vector half — the semantic path adds it. But the
    // subject "zara" is absent from every retrieved fact, so §6.1b anchoring must still abstain.
    await assertNode(repo, "person/tal", "person");
    await assertProp(repo, "person/tal", "content", "Where does Tal work?");
    await assertNode(repo, "org/a5c", "org");
    await assertProp(repo, "org/a5c", "content", "a5c");
    await assertEdge(repo, "edge/tal-a5c", "employed_by", "person/tal", "org/a5c");

    const synth = vi.fn((_ctx: SynthesisContext): SynthesisOutput => {
      throw new Error("synthesize MUST NOT be called: subject 'zara' is absent (N5 abstention)");
    });
    const deps: AnswerQuestionDeps = { repo, synthesize: synth as unknown as AnswerQuestionDeps["synthesize"] };
    const result = await answerQuestion({ question: "Where does Zara work?", semantic: true }, deps);
    expect(result.abstained).toBe(true);
    expect(synth).not.toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// (5) DETERMINISM — the dep-free semantic recall is permutation-invariant.
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("D-57 semantic (5) — dep-free semantic recall is permutation-deterministic", () => {
  function facts(): Fact[] {
    return [
      nodeExistenceFact("a", "note"),
      nodePropFact("a", "content", "healthcare platform overview"),
      nodeExistenceFact("b", "note"),
      nodePropFact("b", "content", "settlement clearing house"),
      nodeExistenceFact("c", "note"),
      nodePropFact("c", "content", "quarterly revenue recognition"),
      edgeFact("a-b", "relates", "a", "b"),
    ];
  }
  const shape = (rs: readonly RecallResult[]): string =>
    JSON.stringify(rs.map((r) => ({ eid: r.eid, score: r.score, ranks: r.ranks })));

  it("two repos ingesting the SAME facts in DIFFERENT orders return a byte-identical semantic ranked list", async () => {
    const r1 = depFreeRepo("sem-det-1");
    const r2 = depFreeRepo("sem-det-2");
    const f = facts();
    await ingestFacts(r1, f);
    await ingestFacts(r2, [...f].reverse());
    const q = (): SpecRecallQuery =>
      ({ text: "health care revenue", k: 10, semantic: true, expand: { hops: 1 } } as SpecRecallQuery);
    const a = await r1.recall(q());
    const b = await r2.recall(q());
    expect(eidsOf(b)).toEqual(eidsOf(a));
    expect(shape(b)).toBe(shape(a));
  });
});
