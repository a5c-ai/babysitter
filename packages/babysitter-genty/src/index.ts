/**
 * @a5c-ai/babysitter-genty
 *
 * Babysitter orchestration provider plugin for genty.
 * Implements all OrchestrationRegistry provider interfaces using
 * the @a5c-ai/babysitter-sdk runtime.
 *
 * Importing this module auto-registers all providers into the global registry.
 */

export { BabysitterOrchestrationProvider } from "./provider";
export { BabysitterJournalProvider } from "./journal";
export { BabysitterGovernanceProvider } from "./governance";
export { BabysitterAgentProvider } from "./agents";
export { BabysitterSessionProvider } from "./session";
export { BabysitterProcessProvider } from "./processes";
export { register, getGlobalRegistry } from "./register";

// Side-effect: auto-register all providers on import
import "./register";
