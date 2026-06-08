/**
 * Global singleton for the orchestration provider registry.
 *
 * Modules that need a provider at call time use getGlobalRegistry() rather
 * than accepting the registry as an explicit argument.  Test code can swap
 * the instance with setGlobalRegistry() or tear it down with
 * resetGlobalRegistry().
 */

import { createOrchestrationRegistry } from "./registry";
import type { OrchestrationRegistry } from "./registry";
import type { JournalEvent } from "../types";

let _registry: OrchestrationRegistry | undefined;

export function getGlobalRegistry(): OrchestrationRegistry {
  if (!_registry) {
    _registry = createOrchestrationRegistry();
  }
  return _registry;
}

export function setGlobalRegistry(registry: OrchestrationRegistry): void {
  _registry = registry;
}

export function resetGlobalRegistry(): void {
  _registry = undefined;
}

/**
 * Load journal events from the global registry's journal provider,
 * cast to the full JournalEvent type used by platform code.
 *
 * The provider interface declares RunEvent[] (narrow), but concrete
 * implementations return the full JournalEvent shape with seq, ulid,
 * recordedAt, etc.  This helper centralises the assertion.
 */
export async function loadJournalEvents(runDir: string): Promise<JournalEvent[]> {
  const events = await getGlobalRegistry().getJournal().loadEvents(runDir);
  return events as unknown as JournalEvent[];
}

/**
 * Append a journal event through the global registry's journal provider.
 */
export async function appendJournalEvent(
  runDir: string,
  eventType: string,
  data: Record<string, unknown>,
): Promise<void> {
  await getGlobalRegistry().getJournal().appendEvent(runDir, {
    type: eventType,
    timestamp: new Date().toISOString(),
    data,
  });
}
