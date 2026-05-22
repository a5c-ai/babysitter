/**
 * Harness adapter registry with auto-detection.
 *
 * Central source of truth for harness-specific adapter factories, discovery
 * specs, and any specialized helper lookups that other modules need.
 */

import type { PromptContext } from "../prompts/types";
import type { HarnessAdapter, HarnessSpec } from "./types";
import { HarnessCapability as Cap } from "./types";
import {
  createClaudeCodeAdapter,
  resolveSessionIdDetailed as resolveClaudeCodeSessionDetails,
} from "./adapters/claude-code";
import type { SessionResolutionDetails } from "./adapters/claude-code";
import { createCodexAdapter } from "./adapters/codex";
import { createGeminiCliAdapter } from "./adapters/gemini-cli";
import { createPiAdapter } from "./adapters/pi";
import { createOhMyPiAdapter } from "./adapters/oh-my-pi";
import { createCursorAdapter } from "./adapters/cursor";
import { createGithubCopilotAdapter } from "./adapters/github-copilot";
import { createOpenCodeAdapter } from "./adapters/opencode";
import { createOpenClawAdapter } from "./adapters/openclaw";
import { createUnifiedAdapter } from "./unified/adapter";
import { UNIFIED_DISCOVERY_SPEC } from "./unified/discovery";
import { createCustomAdapter } from "./customAdapter";

// ---------------------------------------------------------------------------
// Discovery specs — derived from agent-catalog (which reads Atlas graph)
// ---------------------------------------------------------------------------

import { listPluginTargetDescriptors } from "@a5c-ai/agent-catalog";

const CAPABILITY_MAP: Record<string, Cap> = {
  SessionBinding: Cap.SessionBinding,
  StopHook: Cap.StopHook,
  Mcp: Cap.Mcp,
  HeadlessPrompt: Cap.HeadlessPrompt,
  Programmatic: Cap.Programmatic,
};

function buildDiscoverySpecs(): Map<string, HarnessSpec> {
  const specs = new Map<string, HarnessSpec>();
  try {
    for (const target of listPluginTargetDescriptors()) {
      if (!target.cliCommand) continue;
      specs.set(target.targetId, {
        name: target.targetId,
        cli: target.cliCommand,
        callerEnvVars: target.callerEnvVars ?? [],
        capabilities: (target.harnessCapabilities ?? [])
          .map((c) => CAPABILITY_MAP[c])
          .filter((c): c is Cap => c !== undefined),
        configPaths: target.configPaths ?? [],
      });
    }
  } catch {
    // Atlas/catalog not available (e.g. during initial bootstrap) — empty specs
  }
  return specs;
}

let cachedDiscoverySpecs: Map<string, HarnessSpec> | undefined;
function getDiscoverySpecs(): Map<string, HarnessSpec> {
  if (!cachedDiscoverySpecs) cachedDiscoverySpecs = buildDiscoverySpecs();
  return cachedDiscoverySpecs;
}

function getDiscoverySpec(name: string): HarnessSpec | undefined {
  return getDiscoverySpecs().get(name);
}

// Named exports for backward compatibility (consumers import these directly).
// All fields are derived from the catalog with no hardcoded fallbacks --
// if the catalog is unavailable the spec returns empty defaults.
function specFor(id: string): HarnessSpec {
  return {
    get name() { return getDiscoverySpec(id)?.name ?? id; },
    get cli() { return getDiscoverySpec(id)?.cli ?? ''; },
    get callerEnvVars() { return getDiscoverySpec(id)?.callerEnvVars ?? []; },
    get capabilities() { return getDiscoverySpec(id)?.capabilities ?? []; },
    get configPaths() { return getDiscoverySpec(id)?.configPaths ?? []; },
  };
}
export const CLAUDE_CODE_DISCOVERY_SPEC: HarnessSpec = specFor("claude-code");
export const PI_DISCOVERY_SPEC: HarnessSpec = specFor("pi");
export const CODEX_DISCOVERY_SPEC: HarnessSpec = specFor("codex");
export const CURSOR_DISCOVERY_SPEC: HarnessSpec = specFor("cursor");
export const GEMINI_CLI_DISCOVERY_SPEC: HarnessSpec = specFor("gemini-cli");
export const GITHUB_COPILOT_DISCOVERY_SPEC: HarnessSpec = specFor("github-copilot");
export const OH_MY_PI_DISCOVERY_SPEC: HarnessSpec = specFor("oh-my-pi");
export const OPENCODE_DISCOVERY_SPEC: HarnessSpec = specFor("opencode");
export const OPENCLAW_DISCOVERY_SPEC: HarnessSpec = specFor("openclaw");

export type { SessionResolutionDetails } from "./adapters/claude-code";

interface HarnessRegistryEntry {
  name: string;
  adapterFactory: () => HarnessAdapter;
  discoverySpec?: HarnessSpec;
  resolveSessionIdDetailed?: (
    explicit?: string,
  ) => SessionResolutionDetails;
}

const HARNESS_REGISTRY: readonly HarnessRegistryEntry[] = [
  {
    name: "codex",
    adapterFactory: createCodexAdapter,
    discoverySpec: CODEX_DISCOVERY_SPEC,
  },
  {
    name: "oh-my-pi",
    adapterFactory: createOhMyPiAdapter,
    discoverySpec: OH_MY_PI_DISCOVERY_SPEC,
  },
  {
    name: "pi",
    adapterFactory: createPiAdapter,
    discoverySpec: PI_DISCOVERY_SPEC,
  },
  {
    name: "openclaw",
    adapterFactory: createOpenClawAdapter,
    discoverySpec: OPENCLAW_DISCOVERY_SPEC,
  },
  {
    name: "opencode",
    adapterFactory: createOpenCodeAdapter,
    discoverySpec: OPENCODE_DISCOVERY_SPEC,
  },
  {
    name: "claude-code",
    adapterFactory: createClaudeCodeAdapter,
    discoverySpec: CLAUDE_CODE_DISCOVERY_SPEC,
    resolveSessionIdDetailed: resolveClaudeCodeSessionDetails,
  },
  {
    name: "gemini-cli",
    adapterFactory: createGeminiCliAdapter,
    discoverySpec: GEMINI_CLI_DISCOVERY_SPEC,
  },
  {
    name: "cursor",
    adapterFactory: createCursorAdapter,
    discoverySpec: CURSOR_DISCOVERY_SPEC,
  },
  {
    name: "github-copilot",
    adapterFactory: createGithubCopilotAdapter,
    discoverySpec: GITHUB_COPILOT_DISCOVERY_SPEC,
  },
  {
    name: "unified",
    adapterFactory: createUnifiedAdapter,
    discoverySpec: UNIFIED_DISCOVERY_SPEC,
  },
  {
    name: "custom",
    adapterFactory: createCustomAdapter,
  },
] as const;

const harnessRegistryByName = new Map(
  HARNESS_REGISTRY.map((entry) => [entry.name, entry]),
);

export const KNOWN_HARNESSES: readonly HarnessSpec[] = [
  CLAUDE_CODE_DISCOVERY_SPEC,
  CODEX_DISCOVERY_SPEC,
  PI_DISCOVERY_SPEC,
  OH_MY_PI_DISCOVERY_SPEC,
  GEMINI_CLI_DISCOVERY_SPEC,
  CURSOR_DISCOVERY_SPEC,
  OPENCODE_DISCOVERY_SPEC,
  GITHUB_COPILOT_DISCOVERY_SPEC,
  OPENCLAW_DISCOVERY_SPEC,
  UNIFIED_DISCOVERY_SPEC,
];

function createKnownAdapters(): HarnessAdapter[] {
  return HARNESS_REGISTRY.map((entry) => entry.adapterFactory());
}

export function getHarnessDiscoverySpec(name: string): HarnessSpec | null {
  return KNOWN_HARNESSES.find((spec) => spec.name === name) ?? null;
}

export function getHarnessCallerEnvVars(name: string): string[] {
  return [...(getHarnessDiscoverySpec(name)?.callerEnvVars ?? [])];
}

export function getSessionResolutionDetails(
  name: string,
  explicit?: string,
): SessionResolutionDetails | null {
  const resolver = harnessRegistryByName.get(name)?.resolveSessionIdDetailed;
  return resolver ? resolver(explicit) : null;
}

export function createPromptContextForHarness(
  name: string,
  overrides?: Partial<PromptContext>,
): PromptContext | null {
  const adapter = getAdapterByName(name);
  if (!adapter?.getPromptContext) {
    return null;
  }
  const base = adapter.getPromptContext({
    interactive: overrides?.interactive,
  });
  return overrides ? { ...base, ...overrides } : base;
}

/**
 * Probe each registered adapter and return the first that reports active.
 * Falls back to the custom adapter (which requires explicit args).
 */
export function detectAdapter(): HarnessAdapter {
  for (const adapter of createKnownAdapters()) {
    if (adapter.isActive()) return adapter;
  }
  return createCustomAdapter();
}

/**
 * Look up an adapter by harness name (e.g. "claude-code").
 * Returns null if the name is not recognized.
 */
export function getAdapterByName(name: string): HarnessAdapter | null {
  const entry = harnessRegistryByName.get(name);
  return entry ? entry.adapterFactory() : null;
}

/**
 * List the names of all supported harnesses.
 */
export function listSupportedHarnesses(): string[] {
  return HARNESS_REGISTRY.map((entry) => entry.name);
}

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
