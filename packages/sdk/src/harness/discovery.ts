/**
 * Harness discovery module.
 *
 * Two distinct detection mechanisms:
 *
 * 1. **Installed discovery** (`discoverHarnesses`) — probes the local system
 *    for known AI coding agent CLIs via `which`/`where`, checks for config
 *    directories, and reports capabilities.  Pure PATH + filesystem detection,
 *    no environment variable checks.
 *
 * 2. **Caller detection** (`detectCallerHarness`) — inspects environment
 *    variables to determine which harness (if any) spawned the current
 *    process.  This answers "are we running *inside* a Claude Code session?"
 *    rather than "is the `claude` binary installed?".
 */

import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { HarnessDiscoveryResult, HarnessCapability, CallerHarnessResult } from "./types";
import { HarnessCapability as Cap } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Detection specification for a single known harness. */
interface HarnessSpec {
  /** Harness identifier (matches HarnessAdapter.name). */
  name: string;
  /** CLI command name used to invoke the harness. */
  cli: string;
  /**
   * Environment variables that indicate we are running **inside** an active
   * session of this harness (e.g. the harness spawned our process).
   *
   * Used exclusively by `detectCallerHarness()`, never by `discoverHarnesses()`.
   */
  callerEnvVars: string[];
  /** Capabilities advertised by this harness. */
  capabilities: HarnessCapability[];
}

// ---------------------------------------------------------------------------
// Known harnesses
// ---------------------------------------------------------------------------

/** Detection specs for all supported harnesses. */
export const KNOWN_HARNESSES: readonly HarnessSpec[] = [
  {
    name: "claude-code",
    cli: "claude",
    callerEnvVars: ["CLAUDE_ENV_FILE"],
    capabilities: [Cap.SessionBinding, Cap.StopHook, Cap.Mcp, Cap.HeadlessPrompt],
  },
  {
    name: "codex",
    cli: "codex",
    callerEnvVars: ["CODEX_THREAD_ID", "CODEX_SESSION_ID", "CODEX_PLUGIN_ROOT"],
    capabilities: [Cap.SessionBinding, Cap.StopHook, Cap.HeadlessPrompt],
  },
  {
    name: "cursor",
    cli: "cursor",
    // CURSOR_PROJECT_DIR and CURSOR_VERSION are set by Cursor in hook execution
    // contexts only (not in child processes spawned by hooks).
    callerEnvVars: ["CURSOR_PROJECT_DIR", "CURSOR_VERSION"],
    capabilities: [Cap.HeadlessPrompt, Cap.StopHook, Cap.SessionBinding, Cap.Mcp],
  },
  {
    name: "gemini-cli",
    cli: "gemini",
    callerEnvVars: ["GEMINI_SESSION_ID", "GEMINI_PROJECT_DIR", "GEMINI_CWD"],
    capabilities: [Cap.SessionBinding, Cap.HeadlessPrompt, Cap.StopHook],
  },
  {
    name: "github-copilot",
    cli: "copilot",
    // Note: official Copilot docs do not confirm these env vars are injected
    // into hooks. They are used as best-effort discriminators for caller detection.
    callerEnvVars: ["COPILOT_HOME", "COPILOT_GITHUB_TOKEN"],
    // No StopHook — Copilot CLI uses in-turn orchestration model
    capabilities: [Cap.HeadlessPrompt, Cap.SessionBinding, Cap.Mcp],
  },
  {
    name: "opencode",
    cli: "opencode",
    callerEnvVars: ["BABYSITTER_SESSION_ID", "OPENCODE_CONFIG"],
    capabilities: [Cap.HeadlessPrompt],
  },
  {
    name: "oh-my-pi",
    cli: "omp",
    callerEnvVars: ["OMP_SESSION_ID", "OMP_PLUGIN_ROOT"],
    capabilities: [Cap.Programmatic, Cap.SessionBinding, Cap.HeadlessPrompt, Cap.Mcp],
  },
  {
    name: "pi",
    cli: "pi",
    callerEnvVars: ["PI_SESSION_ID", "PI_PLUGIN_ROOT"],
    capabilities: [Cap.Programmatic, Cap.SessionBinding, Cap.HeadlessPrompt],
  },
  {
    name: "internal",
    cli: "internal",
    callerEnvVars: [],
    capabilities: [Cap.Programmatic, Cap.SessionBinding, Cap.StopHook, Cap.HeadlessPrompt],
  },
] as const;

// ---------------------------------------------------------------------------
// Config path detection
// ---------------------------------------------------------------------------

/** Map of harness names to config directory names to look for. */
const CONFIG_PATHS: Record<string, string[]> = {
  "claude-code": [".claude"],
  codex: [".codex"],
  pi: [".pi"],
  "oh-my-pi": [".omp"],
  "gemini-cli": [".gemini"],
  "github-copilot": [".copilot", ".github"],
  cursor: [".cursor", ".cursorrules"],
  opencode: [".opencode"],
};

/**
 * Checks whether a harness config directory exists in cwd or home.
 */
async function detectConfig(harnessName: string): Promise<boolean> {
  const configDirs = CONFIG_PATHS[harnessName];
  if (!configDirs || configDirs.length === 0) return false;
  const cwd = process.cwd();
  const home = os.homedir();
  for (const dir of configDirs) {
    // Check in cwd
    try { await fs.access(path.join(cwd, dir)); return true; } catch { /* skip */ }
    // Check in home
    try { await fs.access(path.join(home, dir)); return true; } catch { /* skip */ }
  }
  return false;
}

// ---------------------------------------------------------------------------
// CLI availability check
// ---------------------------------------------------------------------------

/** Timeout in milliseconds for each CLI probe. */
const CLI_CHECK_TIMEOUT_MS = 2000;

/**
 * Checks whether a single CLI command is available on the system.
 *
 * Uses `which` on Unix and `where` on Windows to locate the binary, then
 * attempts `<command> --version` to extract a version string.
 *
 * @returns An object indicating availability and, when found, the resolved
 *          path and version string.
 */
export async function checkCliAvailable(
  command: string,
): Promise<{ available: boolean; path?: string; version?: string }> {
  const locateCmd = process.platform === "win32" ? "where" : "which";

  let cliPath: string | undefined;
  try {
    cliPath = await execFilePromise(locateCmd, [command], CLI_CHECK_TIMEOUT_MS);
  } catch {
    return { available: false };
  }

  // `which`/`where` may return multiple lines; take the first.
  const resolvedPath = cliPath.split(/\r?\n/)[0]?.trim();
  if (!resolvedPath) {
    return { available: false };
  }

  // Attempt to extract version.
  let version: string | undefined;
  try {
    const raw = await execFilePromise(command, ["--version"], CLI_CHECK_TIMEOUT_MS);
    version = parseVersionString(raw);
  } catch {
    // Version extraction is best-effort; the CLI is still considered installed.
  }

  return { available: true, path: resolvedPath, version };
}

// ---------------------------------------------------------------------------
// Installed discovery (mechanism 1)
// ---------------------------------------------------------------------------

/**
 * Probes the local environment for all known harness CLIs in parallel.
 *
 * Checks only whether each CLI binary is installed on PATH, whether config
 * directories exist, and what capabilities the harness advertises.
 *
 * Does **not** inspect environment variables — use `detectCallerHarness()`
 * for that.
 *
 * Each harness is checked independently via `Promise.allSettled` so that a
 * single failing/timing-out probe does not block the rest.
 *
 * @returns An array of discovery results sorted alphabetically by harness name.
 */
export async function discoverHarnesses(): Promise<HarnessDiscoveryResult[]> {
  const settled = await Promise.allSettled(
    KNOWN_HARNESSES.map((spec) => probeHarness(spec)),
  );

  const results: HarnessDiscoveryResult[] = settled.map((outcome, idx) => {
    if (outcome.status === "fulfilled") {
      return outcome.value;
    }
    // Graceful degradation: if the probe itself threw, return a safe default.
    const spec = KNOWN_HARNESSES[idx];
    return {
      name: spec.name,
      installed: false,
      cliCommand: spec.cli,
      configFound: false,
      capabilities: spec.capabilities,
      platform: process.platform,
    };
  });

  // The 'internal' harness is always available (built into the SDK).
  const internalIdx = results.findIndex((r) => r.name === "internal");
  if (internalIdx >= 0) {
    results[internalIdx].installed = true;
  }

  results.sort((a, b) => a.name.localeCompare(b.name));
  return results;
}

// ---------------------------------------------------------------------------
// Caller detection (mechanism 2)
// ---------------------------------------------------------------------------

/**
 * Detects which harness (if any) spawned the current process by inspecting
 * environment variables.
 *
 * This answers the question "are we running inside a Claude Code / Codex /
 * Gemini CLI / etc. session right now?" — completely independent of whether
 * those CLIs are installed on PATH.
 *
 * @returns The detected caller harness, or `null` if no caller is detected.
 *          When multiple harnesses match (e.g. pi and oh-my-pi share some
 *          env vars), the first match in `KNOWN_HARNESSES` order wins.
 */
export function detectCallerHarness(): CallerHarnessResult | null {
  for (const spec of KNOWN_HARNESSES) {
    if (spec.callerEnvVars.length === 0) continue;
    const matchedVars = spec.callerEnvVars.filter((v) => !!process.env[v]);
    if (matchedVars.length > 0) {
      return {
        name: spec.name,
        matchedEnvVars: matchedVars,
        capabilities: spec.capabilities,
      };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Probes a single harness spec and returns an installed-discovery result.
 */
async function probeHarness(spec: HarnessSpec): Promise<HarnessDiscoveryResult> {
  const cliCheck = await checkCliAvailable(spec.cli);
  const configFound = await detectConfig(spec.name);

  return {
    name: spec.name,
    installed: cliCheck.available,
    version: cliCheck.version,
    cliPath: cliCheck.path,
    cliCommand: spec.cli,
    configFound,
    capabilities: spec.capabilities,
    platform: process.platform,
  };
}

/**
 * Promise wrapper around `child_process.execFile` (no shell).
 *
 * Resolves with trimmed stdout on exit code 0, rejects otherwise.
 */
function execFilePromise(
  command: string,
  args: string[],
  timeoutMs: number,
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const child = execFile(
      command,
      args,
      { timeout: timeoutMs, windowsHide: true },
      (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(String(stdout).trim());
      },
    );

    // Safety: if the child process lingers beyond the timeout, kill it.
    // Node's built-in timeout sends SIGTERM; this is a belt-and-suspenders guard.
    child.on("error", (err: Error) => {
      reject(err);
    });
  });
}

/**
 * Extracts a semver-ish version from raw `--version` output.
 *
 * Looks for patterns like "1.2.3", "v2.0.0-beta.1", etc.
 */
function parseVersionString(raw: string): string | undefined {
  const match = raw.match(/v?(\d+\.\d+\.\d+(?:[^\s]*))/);
  return match?.[1];
}
