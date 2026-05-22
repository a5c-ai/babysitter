/**
 * Programmatic integration API.
 *
 * Spec section 19.2.
 */

import type { UnifiedHookEvent } from './types/event';
import type { UnifiedHookResult } from './types/result';
import type { AdapterCapabilities } from './types/adapter';
import type { HookPlanEntry } from './types/plan';
import { mergeResults, type MergedExecutionResult } from './merge-engine';

/**
 * Implementation callbacks provided by an adapter.
 */
export interface AdapterImpl {
  /** Normalize raw input into a UnifiedHookEvent. */
  normalize(rawInput: unknown): UnifiedHookEvent;
  /** Render a merged result into harness-native output. */
  renderOutput?(mergedResult: MergedExecutionResult): unknown;
}

/**
 * A registered adapter with capabilities and implementation.
 */
export interface RegisteredAdapter {
  name: string;
  capabilities: AdapterCapabilities;
  impl: AdapterImpl;
}

// ---------------------------------------------------------------------------
// Internal registries
// ---------------------------------------------------------------------------

const adapterRegistry = new Map<string, RegisteredAdapter>();
const handlerRegistry: HookPlanEntry[] = [];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Register a new adapter with its capabilities and implementation.
 */
export function createAdapter(
  name: string,
  capabilities: AdapterCapabilities,
  impl: AdapterImpl,
): RegisteredAdapter {
  const adapter: RegisteredAdapter = { name, capabilities, impl };
  adapterRegistry.set(name, adapter);
  return adapter;
}

/**
 * Register a handler in the global plan.
 */
export function registerHandler(planEntry: HookPlanEntry): void {
  handlerRegistry.push(planEntry);
}

/**
 * Run the full normalized pipeline: execute all matching handlers for
 * the event's phase and return the merged result.
 */
export async function runNormalized(
  event: UnifiedHookEvent,
): Promise<MergedExecutionResult> {
  const matchingEntries = handlerRegistry
    .filter((e) => e.phase === event.phase)
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      const sp = a.pluginId.localeCompare(b.pluginId);
      if (sp !== 0) return sp;
      return a.id.localeCompare(b.id);
    });

  const results: UnifiedHookResult[] = [];

  for (const entry of matchingEntries) {
    // Handler.source is the shell command to execute as a child process.
    const { runHandler } = await import('./normalizer/runner');
    try {
      const result = await runHandler(event, entry.handler);
      results.push(result);
    } catch (_err) {
      // Fail-open by default in programmatic API
      results.push({ decision: 'noop', reason: 'handler error (fail-open)' });
    }
  }

  return mergeResults(results);
}

/**
 * Get a registered adapter by name.
 */
export function getAdapter(name: string): RegisteredAdapter | undefined {
  return adapterRegistry.get(name);
}

/**
 * Clear all registrations (useful for testing).
 */
export function clearRegistries(): void {
  adapterRegistry.clear();
  handlerRegistry.length = 0;
}
