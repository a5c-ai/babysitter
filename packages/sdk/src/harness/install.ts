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
import { existsSync } from "node:fs";
import { join } from "node:path";
import { execFilePromise, installCliViaNpm, renderCommand, runPackageBinaryViaNpx } from "./installSupport";

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

interface HarnessPluginInstaller {
  packageName: string;
  supportsWorkspace: boolean;
}

interface HarnessCliInstaller {
  cliCommand: string;
  packageName: string;
}

const HARNESS_CLI_INSTALLERS: Readonly<Record<string, HarnessCliInstaller>> = {
  "claude-code": { cliCommand: "claude", packageName: "@anthropic-ai/claude-code" },
  "codex": { cliCommand: "codex", packageName: "@openai/codex" },
};

const HARNESS_PLUGIN_INSTALLERS: Readonly<Record<string, HarnessPluginInstaller>> = {
  "codex": { packageName: "@a5c-ai/babysitter-codex", supportsWorkspace: true },
  "cursor": { packageName: "@a5c-ai/babysitter-cursor", supportsWorkspace: true },
  "gemini-cli": { packageName: "@a5c-ai/babysitter-gemini", supportsWorkspace: true },
  "github-copilot": { packageName: "@a5c-ai/babysitter-github", supportsWorkspace: true },
  "oh-my-pi": { packageName: "@a5c-ai/babysitter-omp", supportsWorkspace: true },
  "openclaw": { packageName: "@a5c-ai/babysitter-openclaw", supportsWorkspace: true },
  "opencode": { packageName: "@a5c-ai/babysitter-opencode", supportsWorkspace: true },
  "pi": { packageName: "@a5c-ai/babysitter-pi", supportsWorkspace: true },
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
      success: false,
      status: "unsupported",
      installer: "agent-mux",
      warning: `No agent-mux adapter mapping for "${harnessName}". Cannot install via agent-mux.`,
    };
  }

  const client = await getAmuxClient();
  const adapter = client.adapters.get(amuxName);

  if (!adapter || !adapter.install) {
    const installer = HARNESS_CLI_INSTALLERS[harnessName];
    if (installer) {
      return await installCliViaNpm({
        harness: harnessName,
        cliCommand: installer.cliCommand,
        packageName: installer.packageName,
        summary: `Install ${harnessName} CLI from npm`,
        options,
      });
    }
    return {
      harness: harnessName,
      success: false,
      status: "unsupported",
      installer: "agent-mux",
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
    success: result.ok,
    status: options.dryRun ? "planned" : result.ok ? "installed" : "failed",
    installer: "agent-mux",
    summary: result.message ?? (result.ok ? `Installed ${harnessName}` : `Failed to install ${harnessName}`),
    command: result.command || undefined,
    output: [result.stdout, result.stderr].filter(Boolean).join("\n") || undefined,
    exitCode: result.ok ? 0 : 1,
    error: result.ok ? undefined : (result.message ?? `Failed to install ${harnessName}`),
  };
}

export async function installHarnessPlugin(
  harnessName: string,
  options: HarnessInstallOptions,
): Promise<HarnessInstallResult> {
  if (harnessName === "claude-code") {
    return await installClaudeCodePlugin(options);
  }

  const installer = HARNESS_PLUGIN_INSTALLERS[harnessName];
  if (!installer) {
    return {
      harness: harnessName,
      success: false,
      status: "unsupported",
      installer: "npx",
      warning: `No Babysitter plugin installer is defined for "${harnessName}".`,
    };
  }

  const packageArgs = ["install"];
  if (options.workspace) {
    if (!installer.supportsWorkspace) {
      return {
        harness: harnessName,
        success: false,
        status: "unsupported",
        installer: "npx",
        scope: "workspace",
        warning: `${harnessName} does not support workspace plugin installation.`,
      };
    }
    packageArgs.push("--workspace", options.workspace);
  } else {
    packageArgs.push("--global");
  }

  return await runPackageBinaryViaNpx({
    harness: harnessName,
    packageName: installer.packageName,
    packageArgs,
    summary: options.workspace
      ? `Install Babysitter plugin for ${harnessName} into ${options.workspace}`
      : `Install Babysitter plugin for ${harnessName} globally`,
    options,
    cwd: options.workspace,
    location: options.workspace,
  });
}

/**
 * Reset the cached client. For testing.
 * @internal
 */
function resolveClaudeMarketplaceSource(options: HarnessInstallOptions): string {
  if (options.workspace) {
    const generatedMarketplace = join(options.workspace, "artifacts", "generated-plugins", ".claude-plugin", "marketplace.json");
    if (existsSync(generatedMarketplace)) return join(options.workspace, "artifacts", "generated-plugins");
  }
  return "a5c-ai/babysitter-claude";
}

async function installClaudeCodePlugin(options: HarnessInstallOptions): Promise<HarnessInstallResult> {
  const marketplaceSource = resolveClaudeMarketplaceSource(options);
  const commands = [
    { command: "claude", args: ["plugin", "marketplace", "add", marketplaceSource] },
    { command: "claude", args: ["plugin", "install", "--scope", options.workspace ? "project" : "user", "babysitter@a5c.ai"] },
  ];
  const rendered = commands.map((item) => renderCommand(item.command, item.args)).join(" && ");
  if (options.dryRun) {
    return {
      harness: "claude-code",
      dryRun: true,
      success: true,
      status: "planned",
      installer: "claude",
      scope: options.workspace ? "workspace" : "global",
      summary: "Install Babysitter plugin for Claude Code",
      command: rendered,
      location: options.workspace,
    };
  }

  const outputs: string[] = [];
  for (const item of commands) {
    const result = await execFilePromise(item.command, item.args, { cwd: options.workspace });
    outputs.push([result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n"));
    if (result.exitCode !== 0) {
      return {
        harness: "claude-code",
        success: false,
        status: "failed",
        installer: "claude",
        scope: options.workspace ? "workspace" : "global",
        summary: "Failed to install Babysitter plugin for Claude Code",
        command: renderCommand(item.command, item.args),
        output: outputs.filter(Boolean).join("\n"),
        exitCode: result.exitCode,
        error: [result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n") || `${renderCommand(item.command, item.args)} failed`,
      };
    }
  }

  return {
    harness: "claude-code",
    success: true,
    status: "installed",
    installer: "claude",
    scope: options.workspace ? "workspace" : "global",
    summary: "Install Babysitter plugin for Claude Code",
    command: rendered,
    location: options.workspace,
    output: outputs.filter(Boolean).join("\n"),
    exitCode: 0,
  };
}

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
