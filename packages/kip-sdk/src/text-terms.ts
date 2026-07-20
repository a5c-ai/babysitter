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
 * DETERMINISM CONTRACT (part of the recall contract, not a tunable): explicit `toLowerCase()` (NOT
 * `toLocaleLowerCase`, which is locale-sensitive — a Turkish locale maps `I` to `ı`), a fixed
 * ASCII-alphanumeric tokenizer, a fixed closed stopword set, dedup into a `Set` (so term FREQUENCY
 * never beats distinct-term COVERAGE). No clock, no randomness, no Map-iteration order, no
 * environment reads. Two replicas holding the same facts tokenize identically.
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
 * D-52 — the deterministic tokenizer: explicit `toLowerCase()`, split on runs of ASCII
 * alphanumerics, stopwords dropped, deduplicated into a set.
 */
export function recallSearchTerms(text: string): Set<string> {
  const terms = new Set<string>();
  for (const match of text.toLowerCase().matchAll(/[a-z0-9]+/g)) {
    const term = match[0];
    if (!RECALL_STOPWORDS.has(term)) terms.add(term);
  }
  return terms;
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
