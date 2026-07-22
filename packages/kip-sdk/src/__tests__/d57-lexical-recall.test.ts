/**
 * d57-lexical-recall.test.ts — D-57 (lexical-robustness half): `recall`'s text path is made more
 * robust WITHOUT embeddings, models, or query embedding (kip never embeds the query, N2/N5). Three
 * DETERMINISTIC, dependency-free upgrades, all exercised end-to-end through `repo.recall`:
 *
 *   1. INFLECTIONAL STEMMING (symmetric, inside the shared tokenizer): a morphological variant in the
 *      question now seeds the node whose surface uses a different inflection (owns/owned/owning).
 *   2. UNICODE-AWARE tokenization: a CJK question term now retrieves (the old `[a-z0-9]+` tokenizer
 *      dropped CJK entirely, so such a query used to compose to a guaranteed empty seed set).
 *   3. IDF/BM25-style relevance weighting: a discriminative RARE term now outranks a common schema-
 *      key / edge-kind term that matches uniformly — WITHOUT changing the admission bar.
 *
 * The HONEST BOUNDARY is pinned too: a genuine SYNONYM/paraphrase with no shared (even stemmed) root
 * still seeds nothing (lexical robustness does not close true synonymy — that remains D-57's open
 * semantic half). Determinism (identical output + ordering across fact permutations and repeated
 * calls) is pinned by an explicit permutation test.
 */
import { afterEach, describe, expect, it } from "vitest";
import type { Fact, KipRepo, RecallResult } from "../index";
import {
  edgeFact,
  ingestFacts,
  makeRepo,
  nodeExistenceFact,
  nodePropFact,
  type SpecRecallQuery,
} from "./conformance/fixtures-m4";

const open: KipRepo[] = [];
function track(repo: KipRepo): KipRepo {
  open.push(repo);
  return repo;
}
afterEach(() => {
  while (open.length > 0) open.pop()?.close();
});

function eidsOf(results: readonly RecallResult[]): string[] {
  return results.map((r) => r.eid);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────
// (1) INFLECTIONAL MORPHOLOGY — a variant in the question seeds a surface with a different inflection.
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("D-57 (1) — a morphological variant of a surface term now SEEDS the node it previously missed", () => {
  it("surface says 'owns'; questions using 'owned' / 'owning' / 'owns' all retrieve it (stemmed to 'own')", async () => {
    const { repo } = makeRepo("d57-morphology");
    track(repo);
    await ingestFacts(repo, [
      nodeExistenceFact("owner-node", "note"),
      nodePropFact("owner-node", "description", "This actor owns the settlement pipeline"),
      // A distractor sharing NO term with the morphological query, so this is not "match all".
      nodeExistenceFact("distractor", "note"),
      nodePropFact("distractor", "description", "photosynthesis chlorophyll"),
    ]);

    // Each is a DIFFERENT inflection of "own" than the surface's "owns"; under exact tokenization
    // (pre-D-57) the term "owned"/"owning" was absent from the surface and this returned [].
    for (const q of ["owned", "owning", "owns"]) {
      // eslint-disable-next-line no-await-in-loop -- sequential asserts over the variant set
      const results = await repo.recall({ text: q, k: 10 } as SpecRecallQuery);
      expect(eidsOf(results)).toContain("owner-node");
      expect(eidsOf(results)).not.toContain("distractor");
    }
  });

  it("plural / gerund / past morphology is symmetric: surface 'booking'+'booked', question 'book'/'books' seeds it", async () => {
    const { repo } = makeRepo("d57-plural-morph");
    track(repo);
    await ingestFacts(repo, [
      nodeExistenceFact("bk", "record"),
      nodePropFact("bk", "description", "booking ledger for booked flights"),
    ]);
    // Surface "booking"→book and "booked"→book; these queries all stem to "book" and match.
    for (const q of ["book", "books", "booked", "booking"]) {
      // eslint-disable-next-line no-await-in-loop -- sequential asserts over the variant set
      expect(eidsOf(await repo.recall({ text: q, k: 10 } as SpecRecallQuery))).toContain("bk");
    }
    // HONEST LIMIT — single-pass stemming does not unify the DOUBLE inflection "bookings"
    // (plural-of-gerund): it strips only "-s" → "booking", which does not match the surface's "book".
    expect(eidsOf(await repo.recall({ text: "bookings", k: 10 } as SpecRecallQuery))).not.toContain("bk");
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// (2) UNICODE-AWARE — a CJK query term now retrieves (previously dropped by the ASCII tokenizer).
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("D-57 (2) — a CJK term is no longer dropped: a Chinese-name node is retrievable", () => {
  it("recall({ text: '谷歌' }) retrieves the node named 谷歌 and does not match a Latin-only distractor", async () => {
    const { repo } = makeRepo("d57-cjk");
    track(repo);
    await ingestFacts(repo, [
      nodeExistenceFact("gv", "company"),
      nodePropFact("gv", "name", "谷歌"), // "Google" in Chinese — no ASCII to tokenize
      nodeExistenceFact("latin-only", "company"),
      nodePropFact("latin-only", "name", "Acme"),
    ]);
    // Old tokenizer: query "谷歌" → EMPTY term set, no content prop → guaranteed []. New: CJK unigrams
    // 谷/歌 match the surface's unigrams.
    expect(eidsOf(await repo.recall({ text: "谷歌", k: 10 } as SpecRecallQuery))).toEqual(["gv"]);
    // A single shared CJK character is enough to seed (per-character unigram matching).
    expect(eidsOf(await repo.recall({ text: "谷", k: 10 } as SpecRecallQuery))).toEqual(["gv"]);
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// (3) IDF — a discriminative rare term outranks a common one, WITHOUT changing the admission bar.
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("D-57 (3) — IDF ranks a discriminative-term node ABOVE a common-term node", () => {
  it("with a query of {common, rare}, the node matching the RARE term ranks first even though the common-term node's eid sorts earlier (flat count would tie → eid → common first)", async () => {
    const { repo } = makeRepo("d57-idf");
    track(repo);
    const facts: Fact[] = [
      // "aaa-common" matches only the common term "status"; its eid sorts BEFORE "zzz-rare", so under
      // a FLAT distinct-term count (both match exactly one term) the eid tie-break would rank it first.
      nodeExistenceFact("aaa-common", "report"),
      nodePropFact("aaa-common", "description", "status update"),
      // "zzz-rare" matches only the rare, discriminative term "zephyrine".
      nodeExistenceFact("zzz-rare", "report"),
      nodePropFact("zzz-rare", "description", "zephyrine anomaly"),
    ];
    // Filler nodes that ALSO carry "status", inflating its document-frequency so IDF(status) ≪ IDF(zephyrine).
    for (let i = 0; i < 4; i += 1) {
      facts.push(nodeExistenceFact(`filler-${i}`, "report"));
      facts.push(nodePropFact(`filler-${i}`, "description", "status report"));
    }
    await ingestFacts(repo, facts);

    const results = await repo.recall({ text: "status zephyrine", k: 10 } as SpecRecallQuery);
    const eids = eidsOf(results);
    // The discriminative-term node wins the top rank; the eid-earlier common-term node ranks below it.
    expect(eids[0]).toBe("zzz-rare");
    expect(eids.indexOf("zzz-rare")).toBeLessThan(eids.indexOf("aaa-common"));

    // ADMISSION BAR UNCHANGED: every node that shares ≥1 distinct query term is still admitted (IDF
    // only re-ranks). All the "status" fillers + aaa-common + zzz-rare are present; a node sharing no
    // term is not.
    expect(eids).toContain("aaa-common");
    for (let i = 0; i < 4; i += 1) expect(eids).toContain(`filler-${i}`);
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// (4) DETERMINISM — identical recall output + ordering across fact permutations and repeated calls.
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("D-57 (4) — the upgraded text path is DETERMINISTIC (permutation- and call-invariant)", () => {
  // A graph exercising ALL three new code paths at once: morphology (owns), CJK (谷歌), and a common
  // vs rare term for IDF — so the determinism assertion covers the full new surface.
  function d57Facts(): Fact[] {
    return [
      nodeExistenceFact("team-owns", "team"),
      nodePropFact("team-owns", "name", "Platform Team"),
      nodePropFact("team-owns", "charter", "Owns the booking ledger"),
      nodeExistenceFact("gv", "company"),
      nodePropFact("gv", "name", "谷歌"),
      nodeExistenceFact("ledger", "component"),
      nodePropFact("ledger", "name", "Ledger"),
      nodePropFact("ledger", "description", "booking settlement store"),
      edgeFact("owns/team-ledger", "owns", "team-owns", "ledger"),
    ];
  }

  const shape = (rs: readonly RecallResult[]): string =>
    JSON.stringify(rs.map((r) => ({ eid: r.eid, score: r.score, ranks: r.ranks })));

  it("two replicas ingesting the SAME facts in DIFFERENT orders return a byte-identical ranked list", async () => {
    const { repo: r1 } = makeRepo("d57-determinism-1");
    const { repo: r2 } = makeRepo("d57-determinism-2");
    track(r1);
    track(r2);
    const facts = d57Facts();
    await ingestFacts(r1, facts);
    await ingestFacts(r2, [...facts].reverse()); // reverse arrival order — recall is a function of the SET

    const q = (): SpecRecallQuery =>
      ({ text: "which team owned the booking ledger 谷歌", k: 10, expand: { hops: 2 } } as SpecRecallQuery);
    const a = await r1.recall(q());
    const b = await r2.recall(q());
    expect(eidsOf(b)).toEqual(eidsOf(a));
    expect(shape(b)).toBe(shape(a));
  });

  it("repeated calls on the SAME repo are byte-identical (no clock/random/Map-iteration dependence)", async () => {
    const { repo } = makeRepo("d57-determinism-repeat");
    track(repo);
    await ingestFacts(repo, d57Facts());
    const q = (): SpecRecallQuery => ({ text: "who owns the booking ledger", k: 10 } as SpecRecallQuery);
    const a = await repo.recall(q());
    const b = await repo.recall(q());
    expect(shape(b)).toBe(shape(a));
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// (5) HONEST BOUNDARY — a true synonym/paraphrase with NO shared stemmed root still seeds nothing.
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("D-57 (5) — lexical robustness does NOT close true synonymy (the open semantic half)", () => {
  it("a paraphrase sharing no stemmed root with the graph returns [] (would need semantic retrieval)", async () => {
    const { repo } = makeRepo("d57-synonymy");
    track(repo);
    await ingestFacts(repo, [
      nodeExistenceFact("rev", "concept"),
      nodePropFact("rev", "name", "Revenue recognition"),
      nodePropFact("rev", "description", "How earned income is recorded"),
    ]);

    // "booking settlement" is a genuine SYNONYM of "revenue recognition" in this domain, but shares no
    // lexical root — no stemming/tokenizer change can bridge it. Correctly seeds nothing (abstain-safe).
    expect(await repo.recall({ text: "booking settlement schedule", k: 10 } as SpecRecallQuery)).toEqual([]);

    // CONTRAST — a MORPHOLOGICAL variant of a term the graph DOES contain still seeds it, showing the
    // fix helps inflection (recorded→record, revenues→revenue) but not synonymy.
    const hit = await repo.recall({ text: "recorded revenues", k: 10 } as SpecRecallQuery);
    expect(eidsOf(hit)).toContain("rev");
  });
});
