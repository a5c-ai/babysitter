/**
 * Token estimation utilities for context management.
 *
 * Uses model/provider-aware character heuristics for budget planning without
 * pulling in full tokenizer dependencies.
 */

import type { ContextEntry, TokenEstimatorContext } from "./types";

const DEFAULT_CHARS_PER_TOKEN = 3;
const OPENAI_CHARS_PER_TOKEN = 4;
const ANTHROPIC_CHARS_PER_TOKEN = 3.5;

function charsPerToken(context?: TokenEstimatorContext): number {
  const provider = context?.provider?.toLowerCase();
  const model = context?.model?.toLowerCase() ?? "";

  if (provider === "anthropic" || model.includes("claude")) {
    return ANTHROPIC_CHARS_PER_TOKEN;
  }
  if (
    provider === "openai"
    || provider === "azure"
    || model.startsWith("gpt")
    || model.startsWith("o")
  ) {
    return OPENAI_CHARS_PER_TOKEN;
  }
  return DEFAULT_CHARS_PER_TOKEN;
}

/**
 * Estimate the number of tokens in a plain-text string.
 *
 * @param text - The text to measure.
 * @returns Estimated token count (always >= 0).
 */
export function estimateTokens(text: string, context?: TokenEstimatorContext): number {
  if (!text) return 0;
  return Math.ceil(text.length / charsPerToken(context));
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
export function estimateEntryTokens(entry: ContextEntry, context?: TokenEstimatorContext): number {
  if (entry.tokenCount !== undefined && entry.tokenCount >= 0) {
    return entry.tokenCount;
  }
  return estimateTokens(entry.content, context);
}
