/**
 * Harness adapter registry with auto-detection.
 *
 * Central source of truth for harness-specific adapter factories, discovery
 * specs, and any specialized helper lookups that other modules need.
 */

import type { PromptContext } from "../prompts/types";
import type { HarnessAdapter, HarnessSpec } from "./types";
import { createClaudeCodeAdapter } from "./claudeCode/adapter";
import { CLAUDE_CODE_DISCOVERY_SPEC } from "./claudeCode/discovery";
import {
  resolveSessionIdDetailed as resolveClaudeCodeSessionDetails,
  type SessionResolutionDetails,
} from "./claudeCode/shared";
import { createCodexAdapter } from "./codex/adapter";
import { CODEX_DISCOVERY_SPEC } from "./codex/discovery";
import { createGeminiCliAdapter } from "./geminiCli/adapter";
import { GEMINI_CLI_DISCOVERY_SPEC } from "./geminiCli/discovery";
import { createPiAdapter } from "./pi/adapter";
import { PI_DISCOVERY_SPEC } from "./pi/discovery";
import { createOhMyPiAdapter } from "./ohMyPi/adapter";
import { OH_MY_PI_DISCOVERY_SPEC } from "./ohMyPi/discovery";
import { createCursorAdapter } from "./cursor/adapter";
import { CURSOR_DISCOVERY_SPEC } from "./cursor/discovery";
import { createGithubCopilotAdapter } from "./githubCopilot/adapter";
import { GITHUB_COPILOT_DISCOVERY_SPEC } from "./githubCopilot/discovery";
import { createOpenCodeAdapter } from "./opencode/adapter";
import { OPENCODE_DISCOVERY_SPEC } from "./opencode/discovery";
import { createOpenClawAdapter } from "./openclaw/adapter";
import { OPENCLAW_DISCOVERY_SPEC } from "./openclaw/discovery";
import { createCustomAdapter } from "./customAdapter";

export type { SessionResolutionDetails } from "./claudeCode/shared";

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
  CURSOR_DISCOVERY_SPEC,
  GEMINI_CLI_DISCOVERY_SPEC,
  GITHUB_COPILOT_DISCOVERY_SPEC,
  OPENCODE_DISCOVERY_SPEC,
  OH_MY_PI_DISCOVERY_SPEC,
  OPENCLAW_DISCOVERY_SPEC,
  PI_DISCOVERY_SPEC,
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
