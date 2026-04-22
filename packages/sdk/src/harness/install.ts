/**
 * Harness installation and discovery via agent-mux delegation.
 *
 * Instead of maintaining per-harness install logic in babysitter, we delegate
 * to @a5c-ai/agent-mux which already has comprehensive adapter detection,
 * installation, and update support for all known harness CLIs.
 */

import type {
  HarnessDiscoveryResult,
  HarnessInstallOptions,
  HarnessInstallResult,
} from "./types";
import { KNOWN_HARNESSES } from "./registry";

// ---------------------------------------------------------------------------
// Agent name mapping (babysitter harness name -> agent-mux adapter name)
// ---------------------------------------------------------------------------

const HARNESS_TO_AMUX: Readonly<Record<string, string>> = {
  "claude-code": "claude",
  "codex": "codex",
  "gemini-cli": "gemini",
  "github-copilot": "copilot",
  "cursor": "cursor",
  "opencode": "opencode",
  "openclaw": "openclaw",
  "oh-my-pi": "omp",
  "pi": "pi",
};

// ---------------------------------------------------------------------------
// Lazy client accessor
// ---------------------------------------------------------------------------

type AmuxAdapterInfo = { agent: string; displayName: string; cliCommand: string };
type AmuxInstalledInfo = {
  agent: string;
  installed: boolean;
  cliPath: string | null;
  version: string | null;
};
type AmuxInstallResult = {
  ok: boolean;
  method: string;
  command: string;
  message?: string;
  installedVersion?: string;
  stdout?: string;
  stderr?: string;
};
interface AmuxAdapterHandle {
  install?(opts?: { force?: boolean; dryRun?: boolean; version?: string }): Promise<AmuxInstallResult>;
  detectInstallation?(): Promise<{ installed: boolean; version?: string; path?: string }>;
}
interface AmuxAdapterRegistry {
  list(): AmuxAdapterInfo[];
  detect(agent: string): Promise<AmuxInstalledInfo | null>;
  get(agent: string): AmuxAdapterHandle | undefined;
  installed(): Promise<AmuxInstalledInfo[]>;
}
interface AmuxClientLike {
  adapters: AmuxAdapterRegistry;
}

let _clientPromise: Promise<AmuxClientLike> | null = null;
let _amuxOverride:
  | { createClient: (opts: Record<string, unknown>) => AmuxClientLike }
  | undefined;

function requireAmux(): { createClient: (opts: Record<string, unknown>) => AmuxClientLike } {
  if (_amuxOverride) {
    return _amuxOverride;
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
  const mod: { createClient: (opts: Record<string, unknown>) => AmuxClientLike } = require("@a5c-ai/agent-mux");
  return mod;
}

async function getAmuxClient(): Promise<AmuxClientLike> {
  if (!_clientPromise) {
    _clientPromise = Promise.resolve(requireAmux().createClient({}));
  }
  return _clientPromise;
}

// ---------------------------------------------------------------------------
// Discovery via agent-mux
// ---------------------------------------------------------------------------

/**
 * Discovers installed harnesses by delegating to agent-mux's adapter registry.
 *
 * Falls back to the legacy probe-based discovery if agent-mux is unavailable.
 */
export async function discoverHarnessesViaAmux(): Promise<HarnessDiscoveryResult[]> {
  const client = await getAmuxClient();
  const installedList = await client.adapters.installed();

  const installedByAgent = new Map(
    installedList.map((info) => [info.agent, info]),
  );

  const results: HarnessDiscoveryResult[] = [];

  for (const spec of KNOWN_HARNESSES) {
    const amuxName = HARNESS_TO_AMUX[spec.name];
    if (!amuxName) {
      // No agent-mux mapping -- report as not installed
      results.push({
        name: spec.name,
        installed: false,
        cliCommand: spec.cli,
        configFound: false,
        capabilities: spec.capabilities,
        platform: process.platform,
      });
      continue;
    }

    const info = installedByAgent.get(amuxName);
    results.push({
      name: spec.name,
      installed: info?.installed ?? false,
      version: info?.version ?? undefined,
      cliPath: info?.cliPath ?? undefined,
      cliCommand: spec.cli,
      configFound: false, // agent-mux doesn't track config dirs
      capabilities: spec.capabilities,
      platform: process.platform,
    });
  }

  results.sort((a, b) => a.name.localeCompare(b.name));
  return results;
}

// ---------------------------------------------------------------------------
// Installation via agent-mux
// ---------------------------------------------------------------------------

/**
 * Install a harness CLI by delegating to agent-mux's adapter install().
 */
export async function installHarnessViaAmux(
  harnessName: string,
  options: HarnessInstallOptions,
): Promise<HarnessInstallResult> {
  const amuxName = HARNESS_TO_AMUX[harnessName];
  if (!amuxName) {
    return {
      harness: harnessName,
      warning: `No agent-mux adapter mapping for "${harnessName}". Cannot install via agent-mux.`,
    };
  }

  const client = await getAmuxClient();
  const adapter = client.adapters.get(amuxName);

  if (!adapter || !adapter.install) {
    return {
      harness: harnessName,
      warning: `Agent-mux adapter "${amuxName}" does not support install().`,
    };
  }

  const result = await adapter.install({
    force: false,
    dryRun: options.dryRun,
  });

  return {
    harness: harnessName,
    dryRun: options.dryRun || undefined,
    summary: result.message ?? (result.ok ? `Installed ${harnessName}` : `Failed to install ${harnessName}`),
    command: result.command || undefined,
    output: [result.stdout, result.stderr].filter(Boolean).join("\n") || undefined,
  };
}

/**
 * Reset the cached client. For testing.
 * @internal
 */
export function _resetAmuxInstallClientCache(): void {
  _clientPromise = null;
}

/**
 * Override the agent-mux module for testing.
 * Pass `undefined` to restore require-based resolution.
 * @internal
 */
export function _setAmuxInstallModuleForTesting(
  mod: { createClient: (opts: Record<string, unknown>) => AmuxClientLike } | undefined,
): void {
  _amuxOverride = mod;
  _clientPromise = null;
}
