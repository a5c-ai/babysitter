/**
 * Harness installation and discovery via adapters delegation.
 *
 * Instead of maintaining per-harness install logic in babysitter, we delegate
 * to @a5c-ai/adapters which already has comprehensive adapter detection,
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
// Agent name mapping (babysitter harness name -> adapters adapter name)
// ---------------------------------------------------------------------------

const HARNESS_TO_AMUX: Readonly<Record<string, string>> = {
  "claude-code": "claude",
  "claude": "claude",
  "codex": "codex",
  "copilot": "copilot",
  "cursor": "cursor",
  "gemini": "gemini",
  "gemini-cli": "gemini",
  "github-copilot": "copilot",
  "hermes": "hermes",
  "oh-my-pi": "omp",
  "omp": "omp",
  "openclaw": "openclaw",
  "opencode": "opencode",
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
  "copilot": { packageName: "@a5c-ai/babysitter-github", supportsWorkspace: true },
  "cursor": { packageName: "@a5c-ai/babysitter-cursor", supportsWorkspace: true },
  "gemini": { packageName: "@a5c-ai/babysitter-gemini", supportsWorkspace: true },
  "gemini-cli": { packageName: "@a5c-ai/babysitter-gemini", supportsWorkspace: true },
  "github-copilot": { packageName: "@a5c-ai/babysitter-github", supportsWorkspace: true },
  "hermes": { packageName: "@a5c-ai/babysitter-hermes", supportsWorkspace: true },
  "oh-my-pi": { packageName: "@a5c-ai/babysitter-omp", supportsWorkspace: true },
  "omp": { packageName: "@a5c-ai/babysitter-omp", supportsWorkspace: true },
  "openclaw": { packageName: "@a5c-ai/babysitter-openclaw", supportsWorkspace: true },
  "opencode": { packageName: "@a5c-ai/babysitter-opencode", supportsWorkspace: true },
  "pi": { packageName: "@a5c-ai/babysitter-pi", supportsWorkspace: true },
};

// ---------------------------------------------------------------------------
// Lazy client accessor
// ---------------------------------------------------------------------------

type AdapterAdapterInfo = { agent: string; displayName: string; cliCommand: string };
type AdapterInstalledInfo = {
  agent: string;
  installed: boolean;
  cliPath: string | null;
  version: string | null;
};
type AdapterInstallResult = {
  ok: boolean;
  method: string;
  command: string;
  message?: string;
  installedVersion?: string;
  stdout?: string;
  stderr?: string;
};
interface AdapterAdapterHandle {
  install?(opts?: { force?: boolean; dryRun?: boolean; version?: string }): Promise<AdapterInstallResult>;
  detectInstallation?(): Promise<{ installed: boolean; version?: string; path?: string }>;
}
interface AdapterAdapterRegistry {
  list(): AdapterAdapterInfo[];
  detect(agent: string): Promise<AdapterInstalledInfo | null>;
  get(agent: string): AdapterAdapterHandle | undefined;
  installed(): Promise<AdapterInstalledInfo[]>;
}
interface AgentMuxClientLike {
  adapters: AdapterAdapterRegistry;
}

let _clientPromise: Promise<AgentMuxClientLike> | null = null;
let _agentMuxOverride:
  | { createClient: (opts: Record<string, unknown>) => AgentMuxClientLike }
  | undefined;

function requireAmux(): { createClient: (opts: Record<string, unknown>) => AgentMuxClientLike } {
  if (_agentMuxOverride) {
    return _agentMuxOverride;
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
  const mod: { createClient: (opts: Record<string, unknown>) => AgentMuxClientLike } = require("@a5c-ai/adapters");
  return mod;
}

async function getAgentMuxClient(): Promise<AgentMuxClientLike> {
  if (!_clientPromise) {
    _clientPromise = Promise.resolve(requireAmux().createClient({}));
  }
  return _clientPromise;
}

// ---------------------------------------------------------------------------
// Discovery via adapters
// ---------------------------------------------------------------------------

/**
 * Discovers installed harnesses by delegating to adapters's adapter registry.
 *
 * Falls back to the legacy probe-based discovery if adapters is unavailable.
 */
export async function discoverHarnessesViaAmux(): Promise<HarnessDiscoveryResult[]> {
  const client = await getAgentMuxClient();
  const installedList = await client.adapters.installed();

  const installedByAgent = new Map(
    installedList.map((info) => [info.agent, info]),
  );

  const results: HarnessDiscoveryResult[] = [];

  for (const spec of KNOWN_HARNESSES) {
    const agentMuxName = HARNESS_TO_AMUX[spec.name];
    if (!agentMuxName) {
      // No adapters mapping -- report as not installed
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

    const info = installedByAgent.get(agentMuxName);
    results.push({
      name: spec.name,
      installed: info?.installed ?? false,
      version: info?.version ?? undefined,
      cliPath: info?.cliPath ?? undefined,
      cliCommand: spec.cli,
      configFound: false, // adapters doesn't track config dirs
      capabilities: spec.capabilities,
      platform: process.platform,
    });
  }

  results.sort((a, b) => a.name.localeCompare(b.name));
  return results;
}

// ---------------------------------------------------------------------------
// Installation via adapters
// ---------------------------------------------------------------------------

/**
 * Install a harness CLI by delegating to adapters's adapter install().
 */
export async function installHarnessViaAmux(
  harnessName: string,
  options: HarnessInstallOptions,
): Promise<HarnessInstallResult> {
  const agentMuxName = HARNESS_TO_AMUX[harnessName];
  if (!agentMuxName) {
    return {
      harness: harnessName,
      success: false,
      status: "unsupported",
      installer: "adapters",
      warning: `No adapters adapter mapping for "${harnessName}". Cannot install via adapters.`,
    };
  }

  const client = await getAgentMuxClient();
  const adapter = client.adapters.get(agentMuxName);

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
      installer: "adapters",
      warning: `Adapters adapter "${agentMuxName}" does not support install().`,
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
    installer: "adapters",
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

  const resolvedPackage = options.tag
    ? `${installer.packageName}@${options.tag}`
    : installer.packageName;

  return await runPackageBinaryViaNpx({
    harness: harnessName,
    packageName: resolvedPackage,
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
 * Override the adapters module for testing.
 * Pass `undefined` to restore require-based resolution.
 * @internal
 */
export function _setAmuxInstallModuleForTesting(
  mod: { createClient: (opts: Record<string, unknown>) => AgentMuxClientLike } | undefined,
): void {
  _agentMuxOverride = mod;
  _clientPromise = null;
}
