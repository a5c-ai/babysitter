# D-57 (lexical half): robust `kip ask` text retrieval without embeddings — build report

**Item:** `d57-lexical-recall` · **Closes:** the LEXICAL half of D-57 · **ADR:** B13 · **Branch:** `staging`
**Status:** shipped, adversarially reviewed + behaviorally demoed. Semantic/embedding half remains deferred (owner-scoped).

## Problem

`kip ask`'s graph-QA text retrieval seeded nodes by a flat count of distinct query terms in a node's
searchable surface, via the one shared tokenizer `recallSearchTerms` (which graph-QA §6.1b subject-anchoring
also uses). Three documented lexical weaknesses (D-57): the `[a-z0-9]+` tokenizer **dropped CJK and all
non-Latin scripts**; **no stemming** so `owns`/`owned`/`owning` missed a surface saying `own`; and **flat
scoring** let a common schema key / edge kind count as much as a rare discriminative term. Owner scoped this
to the deterministic lexical path only — the semantic/embedding path (which changes kip's "never embeds the
query" N2/N5 stance) stays a separate deferred follow-up.

## What shipped (all deterministic, zero new deps)

1. **Unicode-aware, NFC-normalized tokenizer** — `recallSearchTerms` NFC-normalizes then splits on Unicode
   `\p{L}\p{M}\p{N}` runs (`/u`); each space-less CJK codepoint (Han/Hiragana/Katakana) becomes its own
   **unigram** (segmenter-free technique) instead of being dropped; Hangul/Cyrillic/Greek/accented Latin
   tokenize as whole word runs. NFC makes composed vs decomposed accented spellings match across query/surface.
2. **Pure inflectional stemmer** (`stemInflectional`) applied to each token inside `recallSearchTerms`, so
   query and surface are **symmetric by construction** — an imperfect stem is at worst a *shared miss*, never
   an asymmetric false match. Scope is inflectional (plural/`-s`/`-es`/`-ies`, `-ing`, `-ed`, doubled-consonant
   undoubling, ≥3-char/vowel guards).
3. **IDF/BM25-style ranking** — the seed score is the summed IDF (`log(1 + (N−df+0.5)/(df+0.5))`, df over the
   candidate corpus, strictly positive for all df∈[0,N]) of matched terms, in two deterministic passes over
   sorted candidate keys, with the exact-content boost kept dominant.

**Invariants preserved:** the admission bar `exact || matched > 0` is byte-identical and LOCAL to the
candidate — IDF feeds only the *ranking*, never admission. N5 / cite-or-abstain and graph-QA §6.1b
subject-anchoring are unweakened (same shared tokenizer). Vector half stays inert without `q.embedding`.
Cross-platform (no locale APIs), LF, `package-lock.json` untouched.

## Behavioral demo (real `recall({text})`, no model)

| Scenario | Result |
|---|---|
| Morphology | `owned`/`owning` now retrieve a surface saying `owns` (both missed under the old tokenizer); `ownership` correctly still misses |
| CJK | `谷歌` produced an **empty** term set before → now tokenizes to unigrams and retrieves; a single shared Han char suffices |
| IDF ranking | the rare-term node outranks the common-term node despite eid sort order (a flat count would mis-order); admission unchanged |
| Determinism | byte-identical eid+score+ranks across reversed ingest order and repeated calls |
| Honest boundary | `booking settlement` vs a `revenue recognition` node shares no stemmed root → `[]` (no synonym leak); a morphological variant still hits |

## Honest scope — what this does NOT close

True **synonymy / paraphrase** (no shared stemmed root) still correctly abstains — that needs the deferred
semantic/embedding half and is now the sole remaining content of D-57. The stemmer is inflectional-only (not
derivational: `ownership`↛`own`), has no lexicon (irregulars not lemmatized: `made`↛`make`), no silent-`e`
restoration (`settling`→`settl`, not `settle`), and applies one suffix rule per call (`bookings`→`booking`,
not `book`) — all documented in `stemInflectional` and pinned by boundary tests, not overclaimed.

## Quality

Adversarial determinism/N5 critic **86/100** — functionally sound (admission local, deterministic, N5/
subject-anchoring intact, IDF correct, no regression) with two real issues **fixed before commit**: (a) the
stemmer's doc + test **overclaimed idempotency "for every token"** — false for `-ings` double inflections;
corrected the wording and added an explicit double-inflection boundary test that pins the real behavior; (b)
the tokenizer **didn't Unicode-normalize** — added NFC normalization (+ a cross-source NFC/NFD match test).
Also noted the Unicode-DB-version scope of the determinism claim. The behavioral demo passed all five claims.

## Suite / gates

`906 passed | 8 skipped` (105 files; +25 D-57 tests: tokenizer/stemmer units + recall integration). `build:sdk`
and `verify:metadata` green; lockfile clean; zero new runtime deps.

## Files

- `src/text-terms.ts` — NFC + Unicode tokenizer (`RECALL_TOKEN_RE`), `stemInflectional`, `recallSearchTerms`.
- `src/kip-repo.ts` — `computeRecall` text half: IDF two-pass ranking (admission bar unchanged).
- `src/__tests__/d57-text-terms.test.ts`, `d57-lexical-recall.test.ts`.
- `docs/70-decision-records-adr.md` (ADR-B13) · `docs/DEBTS.md` (D-57 lexical half resolved, narrowed to the semantic half).
