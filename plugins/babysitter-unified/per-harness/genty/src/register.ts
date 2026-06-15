/**
 * Registration entry point — registers all babysitter providers into an
 * OrchestrationRegistry. Import `@a5c-ai/babysitter-genty/register` for
 * side-effect registration against the module-level singleton registry.
 */

import type { OrchestrationRegistry } from "@a5c-ai/genty-platform/orchestration";
import { createOrchestrationRegistry } from "@a5c-ai/genty-platform/orchestration";
import { BabysitterOrchestrationProvider } from "./provider";
import { BabysitterJournalProvider } from "./journal";
import { BabysitterGovernanceProvider } from "./governance";
import { BabysitterAgentProvider } from "./agents";
import { BabysitterSessionProvider } from "./session";
import { BabysitterProcessProvider } from "./processes";

let globalRegistry: OrchestrationRegistry | undefined;

/** Get or create the global singleton registry. */
export function getGlobalRegistry(): OrchestrationRegistry {
  if (!globalRegistry) {
    globalRegistry = createOrchestrationRegistry();
  }
  return globalRegistry;
}

/**
 * Register all babysitter providers into the given (or global) registry.
 */
export function register(registry?: OrchestrationRegistry): void {
  const reg = registry ?? getGlobalRegistry();

  reg.registerOrchestration("babysitter", new BabysitterOrchestrationProvider());
  reg.registerJournal("babysitter", new BabysitterJournalProvider());
  reg.registerGovernance("babysitter", new BabysitterGovernanceProvider());
  reg.registerAgentDiscovery("babysitter", new BabysitterAgentProvider());
  reg.registerSession("babysitter", new BabysitterSessionProvider());
  reg.registerProcessDefinition("babysitter", new BabysitterProcessProvider());
}

// Side-effect: auto-register on import
register();
