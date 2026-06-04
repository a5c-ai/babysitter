/**
 * Context management interfaces for the L4 Agent-Core layer.
 *
 * Defines how the agent manages its conversation context window:
 * compaction strategies, memory-augmented prompting, tool result
 * summarization, and dynamic system prompt injection.
 */

// ---------------------------------------------------------------------------
// Compaction Strategies
// ---------------------------------------------------------------------------

/** Discriminator for the compaction algorithm. */
export type CompactionStrategyKind = 'priority' | 'sliding' | 'summary';

/** Priority compaction: entries are scored and the lowest-priority ones are evicted first. */
export interface PriorityCompactionStrategy {
  readonly kind: 'priority';
  /**
   * Minimum priority score (0-1) an entry must have to survive compaction.
   * Entries below this threshold are evicted first.
   */
  readonly minPriority?: number;
}

/** Sliding window compaction: retains the most recent N entries, discarding older ones. */
export interface SlidingCompactionStrategy {
  readonly kind: 'sliding';
  /** Maximum number of entries to retain in the window. */
  readonly windowSize: number;
  /** When `true`, the system prompt is always retained regardless of window position. */
  readonly preserveSystemPrompt?: boolean;
}

/**
 * Summary compaction: evicted entries are condensed into a single summary
 * entry that is re-injected into the context.
 */
export interface SummaryCompactionStrategy {
  readonly kind: 'summary';
  /**
   * Target token count for the summary. The summarizer will attempt
   * to produce a summary that fits within this budget.
   */
  readonly targetTokens?: number;
  /** When `true`, tool call/result pairs are summarized together. */
  readonly summarizeToolResults?: boolean;
}

/** Union of all supported compaction strategies. */
export type CompactionStrategy =
  | PriorityCompactionStrategy
  | SlidingCompactionStrategy
  | SummaryCompactionStrategy;

// ---------------------------------------------------------------------------
// Context Entries
// ---------------------------------------------------------------------------

/** A single entry in the managed context window. */
export interface ContextEntry {
  /** Unique identifier for this entry. */
  readonly id: string;

  /** Role of the entry in the conversation. */
  readonly role: 'system' | 'user' | 'assistant' | 'tool' | 'summary';

  /** Text content of the entry. */
  readonly content: string;

  /**
   * Priority score (0-1) used by the priority compaction strategy.
   * Higher values are retained longer. Defaults to 0.5.
   */
  readonly priority?: number;

  /** Estimated token count for this entry. */
  readonly tokenCount?: number;

  /** Timestamp when this entry was added. */
  readonly timestamp?: Date;

  /** Arbitrary metadata attached to the entry. */
  readonly metadata?: Record<string, unknown>;
}

export interface TokenEstimatorContext {
  readonly provider?: "openai" | "azure" | "anthropic" | "custom" | string;
  readonly model?: string;
}

// ---------------------------------------------------------------------------
// Context Manager Configuration
// ---------------------------------------------------------------------------

/** Configuration for a ContextManager instance. */
export interface ContextManagerConfig {
  /** The compaction strategy to use when the context exceeds its budget. */
  readonly strategy: CompactionStrategy;

  /** Maximum token budget for the entire context window. */
  readonly maxTokens: number;

  /**
   * Token threshold that triggers automatic compaction.
   * When `getTokenCount()` exceeds this value, `compact()` is called.
   * Defaults to `maxTokens * 0.9`.
   */
  readonly compactionThreshold?: number;

  /**
   * When `true`, system prompt entries are never evicted during compaction.
   * Defaults to `true`.
   */
  readonly preserveSystemPrompt?: boolean;

  /** Provider/model context used by heuristic token estimation. */
  readonly tokenEstimatorContext?: TokenEstimatorContext;
}

// ---------------------------------------------------------------------------
// ContextManager Interface
// ---------------------------------------------------------------------------

/**
 * Core context management abstraction for the L4 agent layer.
 *
 * Manages the conversation context window, providing injection of new
 * entries, token-aware compaction, summarization of evicted content,
 * and dynamic system prompt management.
 */
export interface ContextManager {
  /**
   * Inject one or more entries into the context window.
   *
   * If the resulting token count exceeds the compaction threshold,
   * compaction is triggered automatically.
   *
   * @param entries - The entries to inject.
   */
  inject(entries: ContextEntry | readonly ContextEntry[]): Promise<void>;

  /**
   * Explicitly trigger compaction using the configured strategy.
   *
   * @returns The entries that were evicted during compaction.
   */
  compact(): Promise<readonly ContextEntry[]>;

  /**
   * Summarize the provided entries into a single condensed entry.
   *
   * This is used internally by the `summary` compaction strategy but
   * is also exposed for callers that want manual summarization.
   *
   * @param entries - The entries to summarize.
   * @returns A single summary entry.
   */
  summarize(entries: readonly ContextEntry[]): Promise<ContextEntry>;

  /**
   * Return the current estimated token count of all entries in the context.
   */
  getTokenCount(): number;

  /**
   * Return a snapshot of all entries currently in the context window,
   * in conversation order.
   */
  getEntries(): readonly ContextEntry[];

  /**
   * Replace or append segments to the dynamic system prompt.
   *
   * @param segments - One or more prompt segments to set. These replace
   *   any previously set dynamic segments (the base system prompt is unchanged).
   */
  setDynamicSystemPrompt(segments: string | readonly string[]): void;
}
