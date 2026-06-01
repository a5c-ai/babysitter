/**
 * ContextManagerImpl — concrete implementation of the {@link ContextManager}
 * interface for L4 Agent-Core.
 *
 * Maintains an ordered list of {@link ContextEntry} items and applies
 * compaction strategies when the token budget is exceeded.
 */

import type {
  CompactionStrategy,
  ContextEntry,
  ContextManager,
  ContextManagerConfig,
  TokenEstimatorContext,
} from "./types";
import { estimateEntryTokens, estimateTokens } from "./token-estimator";
import { applyPriorityCompaction } from "./strategies/priority";
import { applySlidingCompaction } from "./strategies/sliding";
import { applySummaryCompaction, type SummarizeFn } from "./strategies/summary";

/**
 * Options for constructing a {@link ContextManagerImpl}.
 */
export interface ContextManagerImplOptions {
  /** Base configuration. */
  readonly config: ContextManagerConfig;
  /**
   * Summarizer function used by the `summary` compaction strategy.
   * Required only when the configured strategy is `summary`.
   * Defaults to a simple concatenation if not provided.
   */
  readonly summarizeFn?: SummarizeFn;
}

/**
 * Default summarizer: concatenates entry contents separated by newlines.
 */
function defaultSummarizeFn(entries: readonly ContextEntry[]): string {
  return entries.map((e) => `[${e.role}] ${e.content}`).join("\n");
}

export class ContextManagerImpl implements ContextManager {
  private entries: ContextEntry[] = [];
  private dynamicSegments: string[] = [];
  private readonly config: ContextManagerConfig;
  private readonly compactionThreshold: number;
  private readonly preserveSystem: boolean;
  private readonly summarizeFn: SummarizeFn;
  private readonly tokenEstimatorContext: TokenEstimatorContext | undefined;

  constructor(options: ContextManagerImplOptions) {
    this.config = options.config;
    this.compactionThreshold =
      options.config.compactionThreshold ??
      Math.floor(options.config.maxTokens * 0.9);
    this.preserveSystem = options.config.preserveSystemPrompt ?? true;
    this.summarizeFn = options.summarizeFn ?? defaultSummarizeFn;
    this.tokenEstimatorContext = options.config.tokenEstimatorContext;
  }

  // -----------------------------------------------------------------------
  // ContextManager interface
  // -----------------------------------------------------------------------

  async inject(
    entries: ContextEntry | readonly ContextEntry[],
  ): Promise<void> {
    const toAdd = Array.isArray(entries)
      ? (entries as readonly ContextEntry[])
      : [entries as ContextEntry];

    for (const entry of toAdd) {
      this.entries.push({
        ...entry,
        tokenCount: entry.tokenCount ?? estimateEntryTokens(entry, this.tokenEstimatorContext),
        timestamp: entry.timestamp ?? new Date(),
      });
    }

    // Auto-compact when threshold is exceeded.
    if (this.getTokenCount() > this.compactionThreshold) {
      await this.compact();
    }
  }

  async compact(): Promise<readonly ContextEntry[]> {
    return this.applyStrategy(this.config.strategy);
  }

  async summarize(entries: readonly ContextEntry[]): Promise<ContextEntry> {
    const summaryText = this.summarizeFn(entries);
    return {
      id: `summary-${Date.now()}`,
      role: "summary",
      content: summaryText,
      priority: 0.8,
      tokenCount: estimateTokens(summaryText, this.tokenEstimatorContext),
      timestamp: new Date(),
    };
  }

  getTokenCount(): number {
    let total = 0;
    for (const entry of this.entries) {
      total += estimateEntryTokens(entry, this.tokenEstimatorContext);
    }
    return total;
  }

  getEntries(): readonly ContextEntry[] {
    return [...this.entries];
  }

  setDynamicSystemPrompt(segments: string | readonly string[]): void {
    this.dynamicSegments = Array.isArray(segments)
      ? [...(segments as readonly string[])]
      : [segments as string];
  }

  /**
   * Return the current dynamic system prompt segments.
   */
  getDynamicSegments(): readonly string[] {
    return [...this.dynamicSegments];
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  private applyStrategy(
    strategy: CompactionStrategy,
  ): readonly ContextEntry[] {
    switch (strategy.kind) {
      case "priority": {
        const result = applyPriorityCompaction(
          this.entries,
          this.config.maxTokens,
          strategy,
          this.preserveSystem,
          this.tokenEstimatorContext,
        );
        this.entries = [...result.retained];
        return result.evicted;
      }
      case "sliding": {
        const result = applySlidingCompaction(
          this.entries,
          this.config.maxTokens,
          strategy,
          this.preserveSystem,
          this.tokenEstimatorContext,
        );
        this.entries = [...result.retained];
        return result.evicted;
      }
      case "summary": {
        const result = applySummaryCompaction(
          this.entries,
          this.config.maxTokens,
          strategy,
          this.summarizeFn,
          this.preserveSystem,
          this.tokenEstimatorContext,
        );
        this.entries = [...result.retained];
        return result.evicted;
      }
    }
  }
}
