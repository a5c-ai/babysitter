/**
 * Map hooks-mux AdapterCapabilities to SDK HarnessCapability flags.
 *
 * The unified adapter does NOT import hooks-mux packages.  It reads
 * the JSON-serialised capabilities from the `AGENT_CAPABILITIES_JSON`
 * environment variable (set by hooks-mux) and derives SDK-level
 * capability flags from the structure.
 */

import { HarnessCapability } from "../types";
import type { PromptContext } from "../../prompts/types";
import {
  createDefaultCliSetupSnippet,
  createPromptContext,
} from "../../prompts/contextShared";

// ---------------------------------------------------------------------------
// Proxy capability shape (inferred from hooks-mux AdapterCapabilities)
// ---------------------------------------------------------------------------

export interface ProxyCapabilities {
  name: string;
  family: string;
  supportsBlock: boolean;
  supportsAsk: boolean;
  supportsToolInputMutation: boolean;
  supportsToolResultMutation: boolean;
  supportsPersistedEnv: boolean;
  envPersistenceMode: string;
  toolInterceptionScope: string;
  sessionIdQuality: string;
  supportsOrderedFanout: boolean;
  supportsNativeAdditionalContext: boolean;
  notes?: string[];
  hostAgentName?: string;
  hostAgentLabel?: string;
  hostCapabilities?: string[];
  hostTools?: unknown[];
  tools?: unknown[];
}

export type HostToolCategory =
  | "file"
  | "shell"
  | "search"
  | "browser"
  | "workflow"
  | "interaction"
  | "mcp"
  | "other";

export type HostToolAvailability = "built-in" | "conditional" | "unknown";

export interface HostToolDescriptor {
  name: string;
  category?: HostToolCategory;
  description?: string;
  availability?: HostToolAvailability;
  notes?: string[];
}

// ---------------------------------------------------------------------------
// Capability derivation
// ---------------------------------------------------------------------------

/**
 * Derive SDK HarnessCapability flags from hooks-mux AdapterCapabilities.
 */
export function deriveCapabilitiesFromProxy(
  proxy: ProxyCapabilities,
): HarnessCapability[] {
  const caps: HarnessCapability[] = [];

  // Always has these since it goes through hooks-mux
  caps.push(HarnessCapability.Programmatic);
  caps.push(HarnessCapability.SessionBinding);
  caps.push(HarnessCapability.HeadlessPrompt);

  // StopHook — if the adapter supports blocking
  if (proxy.supportsBlock) {
    caps.push(HarnessCapability.StopHook);
  }

  // MCP — proxy does not surface this directly; leave out for now.

  return caps;
}

// ---------------------------------------------------------------------------
// PromptContext derivation
// ---------------------------------------------------------------------------

/**
 * Build a PromptContext from proxy capabilities.
 *
 * This tells the SDK how to compose prompts for the underlying harness
 * that is fronted by hooks-mux.
 */
export function buildPromptContextFromProxy(
  proxy: ProxyCapabilities,
  overrides?: Partial<PromptContext>,
): PromptContext {
  const isShellHook = proxy.family === "shell-hook";
  const _hasEnvPersistence = proxy.envPersistenceMode !== "none";

  const promptCapabilities: string[] = ["task-tool", "breakpoint-routing"];
  if (proxy.supportsBlock) promptCapabilities.push("hooks", "stop-hook");
  if (proxy.supportsAsk) promptCapabilities.push("ask-user-question");
  const hostAgentName = proxy.hostAgentName || proxy.name || undefined;
  const hostAgentLabel = hostAgentName
    ? proxy.hostAgentLabel || formatHarnessLabel(hostAgentName)
    : undefined;

  return createPromptContext(
    {
      harness: proxy.name || "unified",
      harnessLabel: formatHarnessLabel(proxy.name),
      capabilities: promptCapabilities,
      hostAgentName,
      hostAgentLabel,
      hostCapabilities: hostAgentName ? proxy.hostCapabilities ?? promptCapabilities : undefined,
      pluginRootVar: "",
      loopControlTerm: proxy.supportsBlock ? "stop-hook" : "in-turn",
      sessionBindingFlags: "",
      hookDriven: isShellHook && proxy.supportsBlock,
      interactiveToolName: proxy.supportsAsk ? "question tool" : "",
      sessionEnvVars:
        "AGENT_SESSION_ID (hooks-mux convention)",
      resumeFlags: "",
      cliSetupSnippet: createDefaultCliSetupSnippet(),
      iterateFlags: "",
      hasIntentFidelityChecks: false,
      hasNonNegotiables: false,
      hostTools: normalizeHostTools(proxy.hostTools ?? proxy.tools),
    },
    overrides,
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a kebab-case harness name to a human-readable label. */
function formatHarnessLabel(name: string): string {
  if (!name) return "Unified";
  return name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function normalizeHostTools(
  hostTools: ProxyCapabilities["hostTools"] | ProxyCapabilities["tools"],
): HostToolDescriptor[] | undefined {
  if (!Array.isArray(hostTools)) return undefined;

  const normalized = hostTools
    .filter((tool): tool is HostToolDescriptor => {
      return (
        tool !== null &&
        typeof tool === "object" &&
        "name" in tool &&
        typeof tool.name === "string" &&
        tool.name.trim() !== ""
      );
    })
    .map((tool) => ({
      ...tool,
      name: tool.name.trim(),
    }));

  return normalized.length > 0 ? normalized : undefined;
}
