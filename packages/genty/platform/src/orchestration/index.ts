/**
 * Orchestration provider abstraction layer.
 *
 * Re-exports all interfaces and the registry factory so consumers can
 * import from `@a5c-ai/genty-platform/orchestration` (or via the
 * platform barrel) without reaching into individual files.
 */

export type {
  // Run lifecycle
  RunStatus,
  RunHandle,
  CreateRunOptions,

  // Effects
  EffectKind,
  PendingEffect,
  EffectResult,

  // Iteration
  IterationResult,

  // Journal
  RunEvent,

  // Providers
  OrchestrationProvider,
  JournalProvider,
  GovernanceProvider,
  ExternalAgentProvider,
  SessionProvider,
  ProcessDefinitionProvider,

  // Governance
  ApprovalPosture,
  BreakpointDecision,

  // Process
  ProcessValidationResult,

  // Agents
  AgentInfo,
} from "./interfaces";

export type { OrchestrationRegistry } from "./registry";
export { createOrchestrationRegistry } from "./registry";
export { getGlobalRegistry, setGlobalRegistry, resetGlobalRegistry, loadJournalEvents } from "./global";
