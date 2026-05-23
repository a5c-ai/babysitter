/**
 * Token estimation utilities for context management.
 *
 * Uses a simple chars/4 heuristic — accurate enough for budget
 * planning without pulling in a full tokenizer dependency.
 */

import type { ContextEntry } from "./types";

/** Average characters per token (rough GPT-family heuristic). */
const CHARS_PER_TOKEN = 4;

/**
 * Estimate the number of tokens in a plain-text string.
 *
 * @param text - The text to measure.
 * @returns Estimated token count (always >= 0).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Estimate the token count for a {@link ContextEntry}.
 *
 * If the entry already carries a `tokenCount`, that value is returned
 * directly. Otherwise the content is measured with {@link estimateTokens}.
 *
 * @param entry - The context entry to measure.
 * @returns Estimated token count.
 */
export function estimateEntryTokens(entry: ContextEntry): number {
  if (entry.tokenCount !== undefined && entry.tokenCount >= 0) {
    return entry.tokenCount;
  }
  return estimateTokens(entry.content);
}
