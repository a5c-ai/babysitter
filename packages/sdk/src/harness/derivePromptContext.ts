/**
 * Derive prompt context and adapter config from agent-mux adapter capabilities.
 *
 * Replaces per-harness prompt context factories in hooks/promptContexts.ts
 * with a single derivation function that reads capabilities from agent-mux.
 */

import type { AmuxAdapterMetadata } from "./amuxMetadata";
import type { AdapterConfig } from "./BaseAdapter";
import { HarnessCapability as Cap } from "./types";

// ---------------------------------------------------------------------------
// Prompt capabilities derivation
// ---------------------------------------------------------------------------

/**
 * Derive the prompt capabilities list from agent-mux metadata.
 */
export function derivePromptCapabilities(metadata: AmuxAdapterMetadata): string[] {
  const caps: string[] = [];

  if (metadata.capabilities.hasRuntimeHooks) {
    caps.push("hooks");
  }
  if (metadata.capabilities.hasStopHook) {
    caps.push("stop-hook");
  }
  if (metadata.capabilities.supportsInteractiveMode) {
    caps.push("ask-user-question");
  }
  if (metadata.capabilities.supportsMCP) {
    caps.push("mcp");
  }
  if (metadata.capabilities.supportsSkills) {
    caps.push("skills");
    caps.push("slash-commands");
    caps.push("harness-routing");
    caps.push("programmatic-session");
  }

  // Always include these
  caps.push("task-tool");
  caps.push("breakpoint-routing");

  return caps;
}

// ---------------------------------------------------------------------------
// HarnessCapability[] derivation
// ---------------------------------------------------------------------------

/**
 * Derive babysitter HarnessCapability[] from agent-mux capabilities.
 */
export function deriveHarnessCapabilities(metadata: AmuxAdapterMetadata): Cap[] {
  const caps: Cap[] = [];

  if (metadata.capabilities.hasStopHook) {
    caps.push(Cap.StopHook);
  }
  if (metadata.capabilities.supportsMCP) {
    caps.push(Cap.Mcp);
  }
  if (metadata.capabilities.supportsSkills) {
    caps.push(Cap.Programmatic);
  }

  // SessionBinding and HeadlessPrompt are generally available for all
  caps.push(Cap.SessionBinding);
  caps.push(Cap.HeadlessPrompt);

  return caps;
}

// ---------------------------------------------------------------------------
// Activation env vars derivation
// ---------------------------------------------------------------------------

/**
 * Derive activation env vars from hostEnvSignals.
 * Always includes AGENT_SESSION_ID as a universal activation signal.
 */
export function deriveActivationEnvVars(
  metadata: AmuxAdapterMetadata,
  extraVars?: string[],
): string[] {
  const vars = new Set<string>(["AGENT_SESSION_ID"]);
  for (const signal of metadata.hostEnvSignals) {
    vars.add(signal);
  }
  if (extraVars) {
    for (const v of extraVars) {
      vars.add(v);
    }
  }
  return Array.from(vars);
}

// ---------------------------------------------------------------------------
// Full AdapterConfig derivation
// ---------------------------------------------------------------------------

/**
 * Options for deriving an AdapterConfig from agent-mux metadata.
 * Allows per-adapter overrides for fields that cannot be derived.
 */
export interface DeriveConfigOptions {
  /** The babysitter harness name (e.g. 'claude-code'). */
  name: string;
  /** Human-readable display name. */
  displayName: string;
  /** Extra env vars to check for activation (beyond hostEnvSignals). */
  extraActivationEnvVars?: string[];
  /** Plugin root env vars. */
  pluginRootEnvVars?: string[];
  /** If true, resolvePluginRoot always returns undefined. */
  noPluginRoot?: boolean;
  /** Session ID env vars (in priority order). */
  sessionIdEnvVars?: string[];
  /** Plugin root variable expression for shell interpolation. */
  pluginRootVar?: string;
  /** Interactive tool name override. */
  interactiveToolName?: string;
  /** Session env vars description override. */
  sessionEnvVars?: string;
  /** Whether this harness has intent fidelity checks. */
  hasIntentFidelityChecks?: boolean;
  /** Whether this harness has non-negotiables. */
  hasNonNegotiables?: boolean;
  /** Override loop control term. */
  loopControlTerm?: string;
  /** Override hook-driven flag. */
  hookDriven?: boolean;
  /** Override capabilities list. */
  capabilities?: Cap[];
  /** Override prompt capabilities list. */
  promptCapabilities?: string[];
  /** Supported hook types (if limited). */
  supportedHookTypes?: string[];
  /** If true, adapter does not support any hooks. */
  noHookSupport?: boolean;
  /** Whether bindSession should auto-release stale sessions. */
  autoReleaseStale?: boolean;
  /** Custom missing session ID hint. */
  missingSessionIdHint?: string;
  /** Lower-priority fallback env vars (checked after AGENT_SESSION_ID and PID marker). */
  fallbackSessionIdEnvVars?: string[];
  /** Custom messages for specific unsupported hook types. */
  unsupportedHookMessages?: Record<string, string>;
}

/**
 * Derive a full AdapterConfig from agent-mux metadata + per-adapter overrides.
 */
export function deriveAdapterConfig(
  metadata: AmuxAdapterMetadata,
  opts: DeriveConfigOptions,
): AdapterConfig {
  const hookDriven = opts.hookDriven ?? metadata.capabilities.hasStopHook;
  const loopControlTerm = opts.loopControlTerm ?? (
    metadata.capabilities.hasStopHook
      ? "stop-hook"
      : metadata.capabilities.supportsSkills
        ? "skill-driven"
        : "in-turn"
  );

  return {
    name: opts.name,
    displayName: opts.displayName,
    activationEnvVars: deriveActivationEnvVars(metadata, opts.extraActivationEnvVars),
    capabilities: opts.capabilities ?? deriveHarnessCapabilities(metadata),
    loopControlTerm,
    autoResolvesSession: true,
    pluginRootEnvVars: opts.pluginRootEnvVars ?? [],
    noPluginRoot: opts.noPluginRoot,
    sessionIdEnvVars: opts.sessionIdEnvVars ?? ["AGENT_SESSION_ID"],
    supportedHookTypes: opts.supportedHookTypes,
    noHookSupport: opts.noHookSupport,
    autoReleaseStale: opts.autoReleaseStale,
    missingSessionIdHint: opts.missingSessionIdHint,
    fallbackSessionIdEnvVars: opts.fallbackSessionIdEnvVars,
    unsupportedHookMessages: opts.unsupportedHookMessages,
    promptCapabilities: opts.promptCapabilities ?? derivePromptCapabilities(metadata),
    pluginRootVar: opts.pluginRootVar ?? "",
    hookDriven,
    interactiveToolName: opts.interactiveToolName ?? (
      metadata.capabilities.supportsInteractiveMode ? "AskUserQuestion tool" : ""
    ),
    sessionEnvVars: opts.sessionEnvVars ?? "AGENT_SESSION_ID",
    hasIntentFidelityChecks: opts.hasIntentFidelityChecks ?? metadata.capabilities.requiresToolApproval,
    hasNonNegotiables: opts.hasNonNegotiables ?? metadata.capabilities.requiresToolApproval,
  };
}
