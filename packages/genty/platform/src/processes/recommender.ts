/**
 * ProcessRecommender — registers process descriptors and recommends
 * the most relevant ones for a given set of criteria.
 *
 * Delegates scoring to {@link ProcessScorer} and exposes a simple
 * registry + query API analogous to the sibling SkillRouter.
 */

import type {
  ProcessDescriptor,
  ProcessRecommendation,
  RecommendationCriteria,
} from './types';
import { ProcessScorer } from './scorer';

const DEFAULT_MAX_RESULTS = 5;

export interface ProcessFilter {
  category?: string;
  domain?: string;
}

export class ProcessRecommender {
  private readonly registry = new Map<string, ProcessDescriptor>();
  private readonly scorer = new ProcessScorer();

  // ── registration ─────────────────────────────────────────────────────────

  /** Register a single process descriptor. Replaces any existing entry with the same id. */
  register(descriptor: ProcessDescriptor): void {
    this.registry.set(descriptor.id, descriptor);
  }

  /** Register multiple descriptors at once. */
  registerBatch(descriptors: ProcessDescriptor[]): void {
    for (const descriptor of descriptors) {
      this.register(descriptor);
    }
  }

  // ── queries ──────────────────────────────────────────────────────────────

  /**
   * Score all registered processes against the given criteria and return
   * the top results sorted by descending score. Processes that score 0
   * are excluded.
   */
  recommend(criteria: RecommendationCriteria): ProcessRecommendation[] {
    const maxResults = criteria.maxResults ?? DEFAULT_MAX_RESULTS;
    const results: ProcessRecommendation[] = [];

    for (const process of this.registry.values()) {
      const { score, reasons } = this.scorer.score(process, criteria);
      if (score > 0) {
        results.push({ process, score, reasons });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, maxResults);
  }

  /** Look up a process descriptor by its id. */
  getById(id: string): ProcessDescriptor | undefined {
    return this.registry.get(id);
  }

  /**
   * List all registered descriptors, optionally filtered by category
   * and/or domain.
   */
  list(filter?: ProcessFilter): ProcessDescriptor[] {
    const all = Array.from(this.registry.values());
    if (!filter) {
      return all;
    }
    return all.filter((process) => {
      if (filter.category && process.category !== filter.category) {
        return false;
      }
      if (filter.domain && process.domain !== filter.domain) {
        return false;
      }
      return true;
    });
  }

  /** Return the number of registered process descriptors. */
  get size(): number {
    return this.registry.size;
  }
}
