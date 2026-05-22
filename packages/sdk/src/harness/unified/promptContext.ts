/**
 * PromptContext factory for the unified adapter.
 *
 * When `AGENT_CAPABILITIES_JSON` is set, the context is derived from the
 * proxy capabilities advertised by hooks-mux.  Otherwise a sensible
 * default context is returned.
 */

import type { PromptContext } from "../../prompts/types";
import {
  createDefaultCliSetupSnippet,
  createPromptContext,
} from "../../prompts/contextShared";
import {
  buildPromptContextFromProxy,
  type ProxyCapabilities,
} from "./capabilities";

/**
 * Parse the AGENT_CAPABILITIES_JSON env var into typed ProxyCapabilities.
 * Returns `undefined` when the variable is absent or unparseable.
 */
function readProxyCapabilitiesFromEnv(): ProxyCapabilities | undefined {
  const raw = process.env.AGENT_CAPABILITIES_JSON;
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as ProxyCapabilities;
  } catch {
    return undefined;
  }
}

/**
 * Create a PromptContext for the unified adapter.
 *
 * 1. If AGENT_CAPABILITIES_JSON is set, derives context from the proxy.
 * 2. Otherwise returns a minimal default context.
 */
export function createUnifiedContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  const proxy = readProxyCapabilitiesFromEnv();
  if (proxy) {
    return buildPromptContextFromProxy(proxy, overrides);
  }

  // Fallback: sensible defaults when no proxy capabilities are available.
  return createPromptContext(
    {
      harness: "unified",
      harnessLabel: "Unified",
      capabilities: ["task-tool", "breakpoint-routing"],
      pluginRootVar: "",
      loopControlTerm: "in-turn",
      sessionBindingFlags: "",
      hookDriven: false,
      interactiveToolName: "",
      sessionEnvVars:
        "AGENT_SESSION_ID (hooks-mux convention)",
      resumeFlags: "",
      cliSetupSnippet: createDefaultCliSetupSnippet(),
      iterateFlags: "",
      hasIntentFidelityChecks: false,
      hasNonNegotiables: false,
    },
    overrides,
  );
}
