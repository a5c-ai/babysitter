/**
 * Harness adapter registry with auto-detection.
 *
 * Maintains a lazy singleton of the active adapter. On first access,
 * probes registered adapters via `isActive()` and returns the first match
 * (or the null adapter if none match).
 */

import type { HarnessAdapter } from "./types";
import { createClaudeCodeAdapter } from "./claudeCode";
import { createNullAdapter } from "./nullAdapter";

// ---------------------------------------------------------------------------
// Registry of known adapters (ordered by priority)
// ---------------------------------------------------------------------------

const knownAdapters: HarnessAdapter[] = [
  createClaudeCodeAdapter(),
];

// ---------------------------------------------------------------------------
// Auto-detection
// ---------------------------------------------------------------------------

/**
 * Probe each registered adapter and return the first that reports active.
 * Falls back to the null adapter.
 */
export function detectAdapter(): HarnessAdapter {
  for (const adapter of knownAdapters) {
    if (adapter.isActive()) return adapter;
  }
  return createNullAdapter();
}

/**
 * Look up an adapter by harness name (e.g. "claude-code").
 * Returns null if the name is not recognized.
 */
export function getAdapterByName(name: string): HarnessAdapter | null {
  for (const adapter of knownAdapters) {
    if (adapter.name === name) return adapter;
  }
  return null;
}

/**
 * List the names of all supported harnesses.
 */
export function listSupportedHarnesses(): string[] {
  return knownAdapters.map((a) => a.name);
}

// ---------------------------------------------------------------------------
// Lazy singleton
// ---------------------------------------------------------------------------

let current: HarnessAdapter | null = null;

/**
 * Get the active harness adapter (auto-detected on first call).
 */
export function getAdapter(): HarnessAdapter {
  if (!current) {
    current = detectAdapter();
  }
  return current;
}

/**
 * Override the active adapter (useful for testing).
 */
export function setAdapter(adapter: HarnessAdapter): void {
  current = adapter;
}

/**
 * Reset the singleton so the next `getAdapter()` call re-detects.
 */
export function resetAdapter(): void {
  current = null;
}
