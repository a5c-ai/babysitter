/**
 * SkillRouter — registers skill descriptors and scores them against match criteria.
 *
 * Scoring strategy:
 *   1. Keyword overlap between criteria text (taskType + context) and the skill's
 *      description / capabilities / triggers.
 *   2. Exact domain match bonus.
 *   3. Trigger pattern match bonus.
 *   4. Capability intersection bonus.
 */

import type {
  SkillDescriptor,
  SkillMatchCriteria,
  SkillMatchResult,
} from './types';

/** Normalize a string to lowercase tokens for keyword overlap scoring. */
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

const DOMAIN_BONUS = 15;
const TRIGGER_BONUS = 10;
const CAPABILITY_BONUS = 5;

export class SkillRouter {
  private readonly skills = new Map<string, SkillDescriptor>();

  /** Register a skill descriptor. Replaces any existing entry with the same name. */
  register(descriptor: SkillDescriptor): void {
    this.skills.set(descriptor.name, descriptor);
  }

  /** Remove a skill by name. Returns true if it existed. */
  unregister(name: string): boolean {
    return this.skills.delete(name);
  }

  /** Return the number of registered skills. */
  get size(): number {
    return this.skills.size;
  }

  /** Iterate over all registered descriptors. */
  descriptors(): IterableIterator<SkillDescriptor> {
    return this.skills.values();
  }

  /** Retrieve a registered descriptor by name. */
  get(name: string): SkillDescriptor | undefined {
    return this.skills.get(name);
  }

  /**
   * Score every registered skill against the given criteria and return
   * results sorted by descending score. Skills that score 0 are excluded.
   */
  match(criteria: SkillMatchCriteria): SkillMatchResult[] {
    const results: SkillMatchResult[] = [];

    for (const skill of this.skills.values()) {
      const { score, reason } = this.scoreSkill(skill, criteria);
      if (score > 0) {
        results.push({ skill, score, reason });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Return the single best matching skill, or undefined when nothing matches.
   */
  select(criteria: SkillMatchCriteria): SkillMatchResult | undefined {
    const matches = this.match(criteria);
    return matches.length > 0 ? matches[0] : undefined;
  }

  // ---- private helpers ----

  private scoreSkill(
    skill: SkillDescriptor,
    criteria: SkillMatchCriteria,
  ): { score: number; reason: string } {
    let score = 0;
    const reasons: string[] = [];

    // Build a query token set from taskType + context
    const queryParts: string[] = [];
    if (criteria.taskType) queryParts.push(criteria.taskType);
    if (criteria.context) queryParts.push(criteria.context);
    const queryTokens = tokenize(queryParts.join(' '));

    // Build a corpus token set from skill description + capabilities + triggers
    const corpusParts: string[] = [skill.description];
    if (skill.capabilities) corpusParts.push(...skill.capabilities);
    if (skill.triggers) corpusParts.push(...skill.triggers);
    const corpusTokens = tokenize(corpusParts.join(' '));

    // 1. Keyword overlap
    if (queryTokens.size > 0 && corpusTokens.size > 0) {
      const overlap = tokenOverlap(queryTokens, corpusTokens);
      if (overlap > 0) {
        score += overlap;
        reasons.push(`keyword overlap (${overlap})`);
      }
    }

    // 2. Domain exact match bonus
    if (
      criteria.domain &&
      skill.domain &&
      criteria.domain.toLowerCase() === skill.domain.toLowerCase()
    ) {
      score += DOMAIN_BONUS;
      reasons.push('domain match');
    }

    // 3. Trigger pattern match
    if (skill.triggers && queryTokens.size > 0) {
      for (const trigger of skill.triggers) {
        const triggerLower = trigger.toLowerCase();
        // Check if the full trigger phrase appears in the raw query text
        const rawQuery = queryParts.join(' ').toLowerCase();
        if (rawQuery.includes(triggerLower)) {
          score += TRIGGER_BONUS;
          reasons.push(`trigger "${trigger}"`);
          break; // only count trigger bonus once
        }
      }
    }

    // 4. Capability intersection bonus
    if (criteria.capabilities && criteria.capabilities.length > 0 && skill.capabilities) {
      const skillCaps = new Set(skill.capabilities.map((c) => c.toLowerCase()));
      let capMatches = 0;
      for (const cap of criteria.capabilities) {
        if (skillCaps.has(cap.toLowerCase())) {
          capMatches += 1;
        }
      }
      if (capMatches > 0) {
        score += capMatches * CAPABILITY_BONUS;
        reasons.push(`capability match (${capMatches})`);
      }
    }

    return {
      score,
      reason: reasons.length > 0 ? reasons.join(', ') : 'no match',
    };
  }
}
