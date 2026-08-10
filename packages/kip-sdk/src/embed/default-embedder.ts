/**
 * default-embedder.ts — D-57 (semantic half): the DEPENDENCY-FREE default query/corpus embedder kip
 * ships so the vector half of `recall` can run with NO injected model.
 *
 * ── WHAT THIS IS, STATED HONESTLY ────────────────────────────────────────────────────────────────
 * `defaultEmbed` is a LEXICAL / FUZZY vector embedding — a fixed-dimension, L2-normalized,
 * FEATURE-HASHED bag over a text's stemmed tokens (reusing the D-57 `recallSearchTerms` tokenizer)
 * PLUS character 3-grams of those tokens. Its cosine similarity therefore measures TOKEN and
 * CHARACTER OVERLAP: it rewards typos, morphology, compounds, and substrings (a query and a surface
 * that share tokens or character n-grams land near each other), which the flat lexical admission bar
 * scores as a miss.
 *
 * IT IS NOT LEARNED SEMANTICS. Because every feature is derived from the literal characters of the
 * text, two strings that denote the SAME concept but share NO characters are ORTHOGONAL:
 * `defaultEmbed("revenue recognition")` and `defaultEmbed("booking settlement")` have a cosine of
 * ~0 — the embedder cannot know they are synonyms. True synonymy / paraphrase is out of reach of any
 * character-derived vector and requires INJECTING a real embedding model through the section 5.3
 * `dispatchMicroagent` embedding seam (which embeds both the query and the corpus). Do NOT call this
 * "semantic": it is honest fuzzy lexical overlap, the zero-dependency default, and nothing more.
 *
 * ── DETERMINISM CONTRACT ─────────────────────────────────────────────────────────────────────────
 * PURE and TOTAL: only string ops + a fixed 32-bit FNV-1a hash + the deterministic `recallSearchTerms`
 * tokenizer. No clock, no randomness, no locale, no environment, no Map-iteration-order dependence.
 * The same text always yields the same vector, so a `recall` driven by this embedder stays a pure
 * function of the fact set + query (the vector scan + RRF fusion are already deterministic).
 */
import { recallSearchTerms } from "../text-terms";

/**
 * The fixed embedding dimension. 1024 buckets keep hash collisions rare for the small feature sets a
 * short query/surface produces (a handful of tokens + their 3-grams) — collision noise scales as
 * features²/dim, so a wider space keeps two character-DISJOINT texts crisply near-orthogonal (the
 * honest-boundary property) while staying compact. It is part of the deterministic contract, not a
 * tunable — query and corpus MUST embed at the same size.
 */
export const DEFAULT_EMBED_DIM = 1024;

/**
 * FNV-1a (32-bit) as an unsigned integer — the SAME shift-based prime multiply `rdf/ntriples.ts`
 * uses, deterministic across engines, zero-dependency. Used ONLY to map a feature string to a bucket
 * index + a sign bit; NOT a cryptographic hash.
 */
function fnv1a32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

/**
 * The signed hashing trick: map a feature to a bucket in [0, DEFAULT_EMBED_DIM) and a sign in
 * {+1,-1} from an INDEPENDENT salted hash. The random signs make collisions cancel in expectation
 * rather than always add, so an accidental bucket clash between two unrelated features does not
 * systematically inflate cosine (the standard feature-hashing sign trick).
 */
function hashFeature(feature: string): { index: number; sign: number } {
  const index = fnv1a32(feature) % DEFAULT_EMBED_DIM;
  const sign = (fnv1a32("sign:" + feature) & 1) === 0 ? 1 : -1;
  return { index, sign };
}

/**
 * Character 3-grams of a token, with '^'/'$' boundary markers so a token shorter than 3 chars (and
 * the leading/trailing edges of every token) still produce features. "care" -> "^ca","car","are",
 * "re$". Boundary-aware grams are what let a substring/compound (health within healthcare) share
 * most of its interior grams with the longer form. '^'/'$' are ASCII (LF-safe, no control chars in
 * source) and cannot appear in a `recallSearchTerms` token (the tokenizer keeps only letters/marks/
 * numbers), so they can never collide with a real token character.
 */
function charTrigrams(token: string): string[] {
  const padded = "^" + token + "$";
  const grams: string[] = [];
  for (let i = 0; i + 3 <= padded.length; i += 1) grams.push(padded.slice(i, i + 3));
  return grams;
}

/**
 * Embed `text` into a fixed-dimension, L2-normalized fuzzy-lexical vector (see the file header for
 * the honest scope). Features are "t:<token>" for each stemmed token plus "g:<trigram>" for each of
 * that token's boundary-padded character 3-grams; each feature adds its signed unit to its hashed
 * bucket, and the accumulated vector is L2-normalized.
 *
 * A text that tokenizes to nothing (empty / all-stopword / punctuation-only) yields the ZERO vector,
 * whose cosine against anything is 0 (never NaN) — the additive identity, not a fabricated match.
 */
export function defaultEmbed(text: string): number[] {
  const vec = new Array<number>(DEFAULT_EMBED_DIM).fill(0);
  for (const token of recallSearchTerms(text)) {
    const t = hashFeature("t:" + token);
    vec[t.index] += t.sign;
    for (const gram of charTrigrams(token)) {
      const g = hashFeature("g:" + gram);
      vec[g.index] += g.sign;
    }
  }
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm === 0) return vec; // no features -> zero vector (cosine 0, never NaN).
  for (let i = 0; i < DEFAULT_EMBED_DIM; i += 1) vec[i] /= norm;
  return vec;
}
