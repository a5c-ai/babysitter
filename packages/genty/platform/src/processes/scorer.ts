/**
 * ProcessScorer — computes a relevance score for a ProcessDescriptor
 * against a set of RecommendationCriteria.
 *
 * Scoring factors:
 *   1. Keyword overlap between criteria text and the process description,
 *      task ids, inputs, and outputs.
 *   2. Category bonus when the process category appears in the criteria text.
 *   3. Domain bonus when criteria.domain matches process.domain.
 *   4. Quality score multiplier (boosts/dampens the raw score).
 */

import type { ProcessDescriptor, RecommendationCriteria } from './types';

// ── helpers ──────────────────────────────────────────────────────────────────

/** Normalize text to a set of lowercase tokens for overlap scoring. */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[\s,.\-_/|:;]+/)
      .filter((token) => token.length > 1),
  );
}

/** Count how many tokens from `query` appear in `corpus`. */
function tokenOverlap(query: Set<string>, corpus: Set<string>): number {
  let count = 0;
  for (const token of query) {
    if (corpus.has(token)) {
      count += 1;
    }
  }
  return count;
}

// ── constants ────────────────────────────────────────────────────────────────

const CATEGORY_BONUS = 10;
const DOMAIN_BONUS = 15;

/** Range for the quality multiplier: [MIN, MAX]. */
const QUALITY_MULTIPLIER_MIN = 0.5;
const QUALITY_MULTIPLIER_MAX = 1.5;

// ── scorer ───────────────────────────────────────────────────────────────────

export interface ScoringResult {
  score: number;
  reasons: string[];
}

export class ProcessScorer {
  /**
   * Score a single process against the given criteria.
   *
   * Returns a composite score >= 0 and an array of human-readable
   * reason strings explaining what contributed to the score.
   */
  score(process: ProcessDescriptor, criteria: RecommendationCriteria): ScoringResult {
    let rawScore = 0;
    const reasons: string[] = [];

    // ── 1. Build query tokens from criteria ────────────────────────────
    const queryParts: string[] = [criteria.taskDescription];
    if (criteria.repoContext) queryParts.push(criteria.repoContext);
    if (criteria.capabilities) queryParts.push(...criteria.capabilities);
    const queryTokens = tokenize(queryParts.join(' '));

    // ── 2. Build corpus tokens from process ────────────────────────────
    const corpusParts: string[] = [process.name, process.description];
    if (process.category) corpusParts.push(process.category);
    if (process.tasks) corpusParts.push(...process.tasks);
    if (process.inputs) corpusParts.push(...process.inputs);
    if (process.outputs) corpusParts.push(...process.outputs);
    const corpusTokens = tokenize(corpusParts.join(' '));

    // ── 3. Keyword overlap ─────────────────────────────────────────────
    if (queryTokens.size > 0 && corpusTokens.size > 0) {
      const overlap = tokenOverlap(queryTokens, corpusTokens);
      if (overlap > 0) {
        const ratio = overlap / queryTokens.size;
        const keywordScore = ratio * 100;
        rawScore += keywordScore;
        reasons.push(`keyword overlap ${overlap}/${queryTokens.size} (${Math.round(ratio * 100)}%)`);
      }
    }

    // ── 4. Category bonus ──────────────────────────────────────────────
    if (process.category) {
      const categoryLower = process.category.toLowerCase();
      const rawQuery = queryParts.join(' ').toLowerCase();
      if (rawQuery.includes(categoryLower)) {
        rawScore += CATEGORY_BONUS;
        reasons.push(`category match "${process.category}"`);
      }
    }

    // ── 5. Domain bonus ────────────────────────────────────────────────
    if (
      criteria.domain &&
      process.domain &&
      criteria.domain.toLowerCase() === process.domain.toLowerCase()
    ) {
      rawScore += DOMAIN_BONUS;
      reasons.push('domain match');
    }

    // ── 6. Quality multiplier ──────────────────────────────────────────
    if (typeof process.qualityScore === 'number' && rawScore > 0) {
      const clamped = Math.max(0, Math.min(1, process.qualityScore));
      const multiplier =
        QUALITY_MULTIPLIER_MIN +
        clamped * (QUALITY_MULTIPLIER_MAX - QUALITY_MULTIPLIER_MIN);
      rawScore *= multiplier;
      reasons.push(`quality multiplier x${multiplier.toFixed(2)}`);
    }

    return { score: Math.round(rawScore * 100) / 100, reasons };
  }
}
