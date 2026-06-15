/**
 * GAP-PROMPT-002: Runtime Prompt Context Factory
 *
 * Wraps static context factories with runtime capability collection,
 * producing enriched PromptContext instances with deterministic capabilities.
 *
 * @module prompts/runtimeContext
 */

import type { PromptContext } from './types';
import { createPromptContextForHarness } from '../harness/registry';
import { collectCapabilities, mergeCapabilities } from './capabilityCollector';
import type { CapabilityCollectionOptions } from './capabilityCollector';

/**
 * Options for creating a runtime-enriched PromptContext.
 */
export interface RuntimeContextOptions {
  /** Harness identifier */
  harness: string;
  /** Partial overrides for the base context */
  baseContext?: Partial<PromptContext>;
  /** Options for runtime capability collection */
  collectionOptions?: CapabilityCollectionOptions;
}

/**
 * Create a PromptContext enriched with runtime-collected capabilities.
 *
 * Picks the correct static context factory based on harness name,
 * collects runtime capabilities, and returns a context with merged,
 * sorted capabilities. Falls back to claude-code context for unknown harnesses.
 */
export async function createRuntimePromptContext(
  options: RuntimeContextOptions,
): Promise<PromptContext> {
  const baseCtx =
    createPromptContextForHarness(options.harness, options.baseContext) ??
    createPromptContextForHarness('claude-code', {
      ...options.baseContext,
      harness: options.harness,
    });
  if (!baseCtx) {
    throw new Error('Claude Code prompt context is not available.');
  }

  const collected = await collectCapabilities({
    harness: options.harness,
    ...options.collectionOptions,
  });

  return {
    ...baseCtx,
    capabilities: mergeCapabilities(baseCtx.capabilities, collected),
  };
}
