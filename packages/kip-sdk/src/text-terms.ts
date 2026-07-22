/**
 * The ONE deterministic lexical tokenizer kip's text paths share (D-52 / round-3 finding #1).
 *
 * Two call sites need to agree, exactly, on "what terms does this string contain?":
 *  - `computeRecall`'s text half (`kip-repo.ts`), which decides which nodes a free-text `text`
 *    query seeds; and
 *  - graph-QA's SUBJECT-ANCHORING check (`graph-qa/index.ts` §6.1b), which decides whether the
 *    facts retrieval returned are actually ABOUT the question that was asked.
 *
 * They must agree because the second is a relevance check ON the output of the first: if the two
 * tokenized differently, a question term could be "present" for one and "absent" for the other, and
 * the abstention decision would depend on which copy of the tokenizer ran. Living in one module is
 * what makes that impossible rather than merely unlikely.
 *
 * DETERMINISM CONTRACT (part of the recall contract, not a tunable): NFC Unicode normalization then
 * explicit `toLowerCase()` (NOT `toLocaleLowerCase`, which is locale-sensitive — a Turkish locale maps
 * `I` to `ı`), a fixed Unicode-property tokenizer (built-in `\p{…}` escapes, `/u`; no
 * locale/ICU-collator/segmenter and no new dependency), a fixed closed stopword set, a pure/total
 * inflectional stemmer, and dedup into a `Set` (so term FREQUENCY never beats distinct-term COVERAGE).
 * The NFC pass makes composed/decomposed spellings of the same accented text (`café` as one `é`
 * codepoint vs `e`+combining-accent) tokenize to the SAME term, so a query and a stored surface from
 * different sources still match. No clock, no randomness, no Map-iteration order, no environment reads.
 * Two replicas holding the same facts tokenize identically — scoped to a shared Unicode database
 * version: the `\p{Script=…}`/`\p{L}` classes and NFC resolve against the runtime's bundled ICU, so
 * the "identical across replicas" guarantee assumes replicas on the same Unicode-DB version (the
 * practical risk of a cross-version codepoint reclassification is very low).
 *
 * D-57 (lexical-robustness half) — three deterministic, dependency-free upgrades to the tokenizer,
 * all SYMMETRIC because query and every node surface flow through THIS one function:
 *  1. UNICODE-AWARE tokenization. The old `/[a-z0-9]+/g` dropped CJK and every non-Latin script
 *     outright. The tokenizer now splits on Unicode letter/mark/number runs (`\p{L}\p{M}\p{N}`, `/u`)
 *     so Latin/Cyrillic/Greek/… words tokenize as term runs unchanged, and — because CJK is written
 *     without spaces and has no dependency-free word segmenter — each CJK codepoint (Han / Hiragana /
 *     Katakana) becomes its own UNIGRAM term (the standard segmenter-free technique) instead of being
 *     discarded. Hangul (Korean) DOES use inter-word spaces, so it is tokenized as whole word runs,
 *     not unigrams.
 *  2. INFLECTIONAL STEMMING ({@link stemInflectional}) applied to each surviving token AFTER
 *     lowercasing and stopword filtering. Because both the query and the surface pass through here,
 *     stemming is symmetric by construction — `owns`/`owned`/`owning` all seed a surface that says
 *     `own`. SCOPE IS INFLECTIONAL ONLY (plural/3rd-person `-s`/`-es`/`-ies→y`, gerund `-ing`, past
 *     `-ed`); it does NOT unify DERIVATIONAL morphology (`ownership` does NOT reduce to `own`). See
 *     {@link stemInflectional} for the exact rules and honest limitations.
 *  3. IDF/BM25-style relevance WEIGHTING lives at the recall SCORING site (`kip-repo.ts`), not here —
 *     this function only decides membership of the term set. It has NO effect on the ADMISSION bar.
 */

/**
 * D-52 — the fixed, locale-independent stopword set dropped from BOTH the query and the surface, so
 * function words ("which", "the", "and", "why", "was", "is", …) do not make every node a seed.
 * Deliberately small and closed: it is part of the deterministic recall contract, not a tunable.
 */
export const RECALL_STOPWORDS: ReadonlySet<string> = new Set([
  "a", "an", "and", "are", "as", "at", "be", "been", "but", "by", "did", "do", "does", "for",
  "from", "had", "has", "have", "how", "i", "if", "in", "into", "is", "it", "its", "of", "on", "or",
  "that", "the", "their", "them", "then", "there", "these", "they", "this", "to", "was", "were",
  "what", "when", "where", "which", "while", "who", "whom", "why", "will", "with", "would", "you",
]);

/**
 * D-57 — the Unicode-aware token pattern (built-in property escapes, `/u`; no dependency).
 *
 * The alternation reads: match EITHER a single CJK codepoint (Han / Hiragana / Katakana — the
 * space-less scripts, emitted as its own unigram) OR a maximal run of letter/mark/number codepoints
 * that are NOT one of those CJK scripts (the negative lookahead keeps a Latin run from swallowing a
 * trailing CJK char, since CJK is also `\p{L}`). Ordering matters: the single-CJK branch is tried
 * first at each position so `中国` yields `中`,`国` rather than one run. Deterministic — no `\b`
 * word-boundary, no locale, no ICU segmenter.
 */
const CJK_UNIGRAM = String.raw`\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}`;
const RECALL_TOKEN_RE = new RegExp(
  `[${CJK_UNIGRAM}]|(?:(?![${CJK_UNIGRAM}])[\\p{L}\\p{M}\\p{N}])+`,
  "gu",
);

/**
 * D-52 / D-57 — the deterministic tokenizer: explicit `toLowerCase()` (never `toLocaleLowerCase`),
 * split into Unicode letter/number runs (with CJK codepoints as unigrams), stopwords dropped, each
 * survivor reduced by the pure inflectional {@link stemInflectional} stemmer, deduplicated into a
 * set. Stopword filtering happens on the UNSTEMMED token (the stopword set is the closed list of
 * English function words as written); stemming applies only to what survives.
 */
export function recallSearchTerms(text: string): Set<string> {
  const terms = new Set<string>();
  // NFC-normalize BEFORE lowercasing/tokenizing so a composed vs decomposed accented spelling of the
  // same text (`café` = `é` vs `e`+U+0301) yields the SAME token — symmetric because both the query
  // and every surface flow through here (D-57 critic finding). Deterministic (NFC is a fixed mapping).
  for (const match of text.normalize("NFC").toLowerCase().matchAll(RECALL_TOKEN_RE)) {
    const token = match[0];
    if (RECALL_STOPWORDS.has(token)) continue;
    terms.add(stemInflectional(token));
  }
  return terms;
}

/**
 * D-57 — a pure, total, dependency-free English INFLECTIONAL stemmer.
 *
 * PURPOSE: collapse the inflected forms of ONE lemma to a shared token so a morphological variant in
 * the question seeds the node whose surface uses a different inflection — `owns`/`owned`/`owning` all
 * reduce to `own`, `books`/`booking`/`booked` all reduce to `book`. It runs on BOTH the query and the
 * surface (both flow through {@link recallSearchTerms}), so matching stays symmetric: a term matches
 * iff the two sides stem to the same string. That symmetry is why even a linguistically imperfect
 * stem never introduces an ASYMMETRIC false negative — at worst it costs precision (two unrelated
 * words colliding), which the short-token guard and the recall `k` cap contain.
 *
 * SCOPE — INFLECTIONAL ONLY, and honestly NOT more:
 *  • plural / 3rd-person singular `-s`, `-es` (sibilant stems), `-ies → -y`;
 *  • gerund `-ing`; past tense / participle `-ed`.
 * It does NOT perform DERIVATIONAL morphology: `ownership`, `owner`, `ownable` do NOT reduce to
 * `own`; `-ly`/`-ment`/`-tion`/`-ness` etc. are left intact. It is not a lemmatizer — it has no
 * lexicon, so irregular forms are not unified (`made`≠`make`, `mice`≠`mouse`, `ran`≠`run`), and a
 * handful of words that merely END in an inflectional suffix are over-stemmed (`speed → spe`). There
 * is NO silent-`e` restoration (matching Porter step-1b): `settling`/`settled`/`settles` collapse to
 * `settl` and so unify with EACH OTHER, but not with the bare base `settle` (which keeps its `e`).
 * These are deliberate: a compact rule set with no dictionary, accepted for its determinism and zero
 * deps. The symmetry (query and surface both stemmed) means every such case is at worst a shared
 * MISS, never an asymmetric false match.
 *
 * GUARANTEES: PURE (only string ops + fixed regexes; no clock/locale/random) and TOTAL (defined for
 * every string, never throws). Tokens ≤3 chars (and single CJK unigrams, which are length 1) are
 * returned unchanged so short words are never collapsed into collisions. It applies at most ONE suffix
 * rule per call (no cascade), so a DOUBLE inflection like `bookings` (plural-of-gerund) reduces only to
 * `booking`, not `book`. Consequently it is idempotent for every SINGLE-inflection token — the only
 * kind `recallSearchTerms` ever produces, since it applies the stemmer exactly once per token and
 * never composes it — but it is NOT idempotent for a double inflection (`stem("bookings")==="booking"`,
 * `stem("booking")==="book"`); a second pass keeps reducing, by design. Both facts are pinned by the
 * unit tests (the single-inflection idempotency case and the explicit double-inflection boundary case).
 */
export function stemInflectional(token: string): string {
  if (token.length <= 3) return token;

  // `-ies → -y`: "ponies"→"pony", "cities"→"city". Requires a real stem in front (length > 4).
  if (token.length > 4 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;

  // `-es` on a SIBILANT stem: "boxes"→"box", "matches"→"match", "dishes"→"dish". A non-sibilant
  // "-es" ("notes","types") deliberately falls through to the `-s` rule so it lands on "note"/"type"
  // rather than "not"/"typ".
  if (token.length > 4 && token.endsWith("es")) {
    const stem = token.slice(0, -2);
    if (/(?:s|x|z|ch|sh)$/u.test(stem)) return stem;
  }

  // `-s`: "owns"→"own", "books"→"book". Never "ss"/"us"/"is" ("class","status","basis"), and only
  // when a ≥3-char stem remains (so "gas"/"bus" are untouched — though those are ≤3 and guarded too).
  if (token.endsWith("s") && !/(?:ss|us|is)$/u.test(token)) {
    const stem = token.slice(0, -1);
    if (stem.length >= 3) return stem;
  }

  // `-ing`: "owning"→"own", "booking"→"book", "running"→"run" (undoubled). Requires a ≥3-char stem
  // that still contains a vowel, so short verbs ("king","bring") and vowel-less remnants are left be.
  if (token.endsWith("ing")) {
    const stem = undoubleFinalConsonant(token.slice(0, -3));
    if (stem.length >= 3 && hasVowel(stem)) return stem;
  }

  // `-ed`: "owned"→"own", "booked"→"book", "stopped"→"stop" (undoubled). Same ≥3 + vowel guard, so
  // "need"/"feed"/"weed" (which strip to a ≤2-char remnant) stay intact.
  if (token.endsWith("ed")) {
    const stem = undoubleFinalConsonant(token.slice(0, -2));
    if (stem.length >= 3 && hasVowel(stem)) return stem;
  }

  return token;
}

/** "runn"→"run", "stopp"→"stop": a trailing doubled consonant is an `-ing`/`-ed` doubling artifact. */
function undoubleFinalConsonant(stem: string): string {
  return /([bcdfghjklmnpqrstvwxz])\1$/u.test(stem) ? stem.slice(0, -1) : stem;
}

/** A stem with no vowel (a,e,i,o,u,y) is not a real base — used to gate `-ing`/`-ed` stripping. */
function hasVowel(stem: string): boolean {
  return /[aeiouy]/u.test(stem);
}

/**
 * ROUND-3 FIX (finding #1) — strip the `kip learn` EID NAMESPACE before tokenizing an eid.
 *
 * `compile.ts` namespaces every learned node/edge eid as `doc:<rawRef.blob>#<slug>` (ADR-B10d) so
 * two documents can never collide. Tokenizing that verbatim put the literal term `doc` — plus every
 * ASCII-alphanumeric run of the content-address oid — into EVERY learned node's searchable surface.
 * Two concrete harms: a query containing the word "doc" matched the entire learned graph uniformly
 * (so the term carried zero discriminating information while still counting as a match), and an oid
 * fragment that happens to spell a query term ("ace", "beef", "10") matched by pure coincidence.
 * Only the SLUG is text a human wrote about the entity, so only the slug is indexed.
 *
 * Deliberately narrow: it strips the one namespace shape kip itself mints, and leaves any other
 * `:`/`#`-bearing eid alone (it is not a general "chop at the last #" rule, which would silently
 * mangle eids kip does not own).
 */
export function stripLearnEidNamespace(eid: string): string {
  if (!eid.startsWith("doc:")) return eid;
  const hash = eid.indexOf("#");
  if (hash < 0) return eid;
  return eid.slice(hash + 1);
}
