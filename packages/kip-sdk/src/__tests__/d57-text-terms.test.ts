/**
 * d57-text-terms.test.ts — D-57 (lexical-robustness half): the shared deterministic tokenizer
 * `recallSearchTerms` and the pure inflectional stemmer `stemInflectional`.
 *
 * These pin the DETERMINISTIC, no-model, no-embedding upgrades that make `kip ask` graph-QA text
 * retrieval more robust WITHOUT touching kip's "never embeds the query" stance:
 *   1. a Unicode-aware tokenizer (NFC-normalized; CJK no longer dropped; Latin/etc. unchanged;
 *      stopwords still cut);
 *   2. a pure/total inflectional stemmer applied inside `recallSearchTerms` (idempotent for the
 *      single-inflection tokens recall produces; NOT for double inflections, by design — pinned below).
 *
 * The stemmer's SCOPE is inflectional (plural/-ing/-ed), NOT derivational — the honest-boundary
 * assertions below pin that it does not over-claim (`ownership` does not reduce to `own`).
 */
import { describe, expect, it } from "vitest";
import { RECALL_STOPWORDS, recallSearchTerms, stemInflectional } from "../text-terms";

// ────────────────────────────────────────────────────────────────────────────────────────────────
// stemInflectional — pure, total; unifies inflectional variants; short-token safe.
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("D-57 stemInflectional — inflectional morphology is unified deterministically", () => {
  it("plural / 3rd-person / gerund / past all reduce to the shared base (owns/owned/owning → own)", () => {
    for (const v of ["own", "owns", "owned", "owning"]) expect(stemInflectional(v)).toBe("own");
    for (const v of ["book", "books", "booking", "booked"]) expect(stemInflectional(v)).toBe("book");
    for (const v of ["work", "works", "worked", "working"]) expect(stemInflectional(v)).toBe("work");
  });

  it("HONEST BOUNDARY — silent-e verbs: -ed/-ing forms unify but the bare base keeps its silent 'e'", () => {
    // No dictionary and no 'e'-restoration (matching real Porter step-1b), so "settling"/"settled"
    // collapse to "settl", but the base "settle" keeps its silent 'e' and does not join them.
    // Documented as a scope limit in stemInflectional. Symmetry means such cases are shared MISSES,
    // never asymmetric false matches.
    expect(stemInflectional("settling")).toBe(stemInflectional("settled"));
    expect(stemInflectional("settle")).not.toBe(stemInflectional("settling"));
  });

  it("-ies → -y (ponies→pony, cities→city) and sibilant -es → base (boxes→box, matches→match)", () => {
    expect(stemInflectional("ponies")).toBe("pony");
    expect(stemInflectional("cities")).toBe("city");
    expect(stemInflectional("boxes")).toBe("box");
    expect(stemInflectional("matches")).toBe("match");
    expect(stemInflectional("dishes")).toBe("dish");
  });

  it("doubled-consonant gerund/past are undoubled (running→run, stopped→stop)", () => {
    expect(stemInflectional("running")).toBe("run");
    expect(stemInflectional("stopped")).toBe("stop");
  });

  it("is TOTAL, and IDEMPOTENT for SINGLE-inflection tokens (the forms recall actually stems)", () => {
    // Idempotency holds for every SINGLE-inflection token — the only kind recall ever produces, since
    // `recallSearchTerms` applies `stemInflectional` exactly once per token and never composes it.
    const words = [
      "own", "owns", "owned", "owning", "books", "booking", "ponies", "cities", "boxes",
      "matches", "running", "stopped", "ledger", "settlement", "employer", "status", "class",
      "basis", "", "a", "is", "as", "中", "谷歌", "iphone",
    ];
    for (const w of words) {
      const once = stemInflectional(w);
      expect(stemInflectional(once)).toBe(once);
    }
  });

  it("is NOT idempotent for DOUBLE inflections (-ings), BY DESIGN — at most one suffix rule per call", () => {
    // HONEST BOUNDARY (not a bug): the single-rule-per-call design means a plural-gerund reduces only
    // one level per application. Recall applies the stemmer ONCE per token, so this is never observed
    // at runtime — but the contract is that a SECOND pass keeps reducing, so we pin the real behavior
    // rather than claim a blanket idempotency the design deliberately does not provide.
    expect(stemInflectional("bookings")).toBe("booking"); // pass 1 strips only the plural -s
    expect(stemInflectional("booking")).toBe("book"); //     a hypothetical pass 2 would strip -ing
    expect(stemInflectional("readings")).toBe("reading");
    expect(stemInflectional("reading")).toBe("read");
  });

  it("is PURE (no throw on empty/odd input) and returns the SAME output across repeated calls", () => {
    expect(() => stemInflectional("")).not.toThrow();
    expect(stemInflectional("")).toBe("");
    expect(stemInflectional("owns")).toBe(stemInflectional("owns"));
  });

  it("guards very short tokens (≤3 chars) against collapsing into collisions", () => {
    // Bare function/short words must survive intact — stripping a suffix here creates collisions.
    for (const v of ["is", "as", "us", "id", "bus", "gas", "ion", "the", "and"]) {
      expect(stemInflectional(v)).toBe(v);
    }
  });

  it("does NOT over-stem words that merely END in an inflectional suffix into nonsense (safe guards)", () => {
    // "class"/"status"/"basis" end in -s but are ss/us/is → untouched (not "clas"/"statu"/"basi").
    expect(stemInflectional("class")).toBe("class");
    expect(stemInflectional("status")).toBe("status");
    expect(stemInflectional("basis")).toBe("basis");
    // "need"/"feed"/"weed" end in -ed but strip to a ≤2-char remnant → untouched.
    expect(stemInflectional("need")).toBe("need");
    expect(stemInflectional("feed")).toBe("feed");
  });

  it("HONEST BOUNDARY — DERIVATIONAL morphology is NOT unified (ownership ≠ own)", () => {
    // This is the documented scope limit: inflection only. Derivational suffixes stay intact, so a
    // derivational paraphrase is (correctly) still a lexical miss.
    expect(stemInflectional("ownership")).not.toBe("own");
    expect(stemInflectional("owner")).not.toBe("own");
    // Irregulars are not lemmatized (no lexicon): made ≠ make.
    expect(stemInflectional("made")).not.toBe("make");
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
// recallSearchTerms — Unicode-aware tokenizer, stopwords cut, stemming applied, deterministic.
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("D-57 recallSearchTerms — Unicode-aware, stemmed, deterministic term set", () => {
  it("CJK is NO LONGER DROPPED — a CJK string yields a non-empty per-character unigram term set", () => {
    // "谁拥有账本" ≈ "who owns the ledger". The old /[a-z0-9]+/ tokenizer returned an EMPTY set.
    const terms = recallSearchTerms("谁拥有账本");
    expect(terms.size).toBeGreaterThan(0);
    // per-character unigrams (segmenter-free CJK technique).
    expect(terms.has("账")).toBe(true);
    expect(terms.has("本")).toBe(true);
  });

  it("mixed Latin+CJK splits cleanly: Latin as a run, each CJK char as its own unigram", () => {
    const terms = recallSearchTerms("iPhone 中国");
    expect(terms.has("iphone")).toBe(true); // lowercased Latin run
    expect(terms.has("中")).toBe(true);
    expect(terms.has("国")).toBe(true);
  });

  it("non-Latin ALPHABETIC scripts (Cyrillic/Greek/accented Latin) tokenize as whole word runs", () => {
    expect([...recallSearchTerms("Москва")]).toEqual(["москва"]);
    // Korean uses inter-word spaces → whole word runs, NOT unigrams.
    expect(recallSearchTerms("한국어 조선").has("한국어")).toBe(true);
  });

  it("NFC-normalizes so composed vs decomposed accented spellings yield the SAME term (cross-source match)", () => {
    // Build both forms at runtime (ASCII source, no fragile accented literals): the same word "cafe"
    // with a precomposed é (U+00E9, NFC) vs an ASCII 'e' + combining acute (U+0301, NFD) — DIFFERENT
    // byte sequences that a real query vs a stored fact could each carry. Without NFC they tokenize to
    // different terms and never match; the tokenizer NFC-normalizes so they collapse to one term.
    const composed = "caf" + String.fromCodePoint(0x00e9); // NFC:  c a f é
    const decomposed = "cafe" + String.fromCodePoint(0x0301); // NFD: c a f e ◌́
    expect(composed).not.toBe(decomposed); // genuinely different byte sequences, same text
    expect(composed.normalize("NFC")).toBe(decomposed.normalize("NFC")); // ...that NFC unifies
    expect([...recallSearchTerms(composed)]).toEqual([...recallSearchTerms(decomposed)]);
    expect(recallSearchTerms(decomposed).size).toBe(1); // one term, not two mismatched ones
  });

  it("Latin tokenization is UNCHANGED for existing ASCII cases (lowercased, split on non-word)", () => {
    // Same terms the old tokenizer produced, now additionally stemmed. "which" is a stopword.
    const terms = recallSearchTerms("Which team owns the Ledger-store");
    expect(terms.has("team")).toBe(true);
    expect(terms.has("own")).toBe(true); // "owns" → stem "own"
    expect(terms.has("ledger")).toBe(true);
    expect(terms.has("store")).toBe(true);
    expect(terms.has("which")).toBe(false); // stopword dropped
    expect(terms.has("the")).toBe(false); // stopword dropped
  });

  it("stopwords are still dropped, on the UNSTEMMED token", () => {
    for (const sw of RECALL_STOPWORDS) {
      expect(recallSearchTerms(sw).has(sw)).toBe(false);
    }
    expect(recallSearchTerms("which the and why was is")).toEqual(new Set());
  });

  it("stemming is applied inside the tokenizer so morphological variants share a term", () => {
    expect(recallSearchTerms("owns").has("own")).toBe(true);
    expect(recallSearchTerms("owned").has("own")).toBe(true);
    expect(recallSearchTerms("owning").has("own")).toBe(true);
    // symmetric: query variant and surface variant collapse to the same token.
    expect([...recallSearchTerms("booked")]).toEqual([...recallSearchTerms("booking")]);
  });

  it("is DETERMINISTIC — repeated calls return an identical term set (order-independent equality)", () => {
    const a = [...recallSearchTerms("Which team owns the Ledger and 中国 booking")].sort();
    const b = [...recallSearchTerms("Which team owns the Ledger and 中国 booking")].sort();
    expect(b).toEqual(a);
  });
});
