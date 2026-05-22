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
import {
  getHooksMuxDetectionRules,
  type HooksMuxDetectionRule,
} from "@a5c-ai/agent-catalog";
import type {
  CallerHarnessResult,
  HarnessDiscoveryResult,
  HarnessSpec,
  HarnessCapability,
} from "./types";
import { getHarnessDiscoverySpec, KNOWN_HARNESSES } from "./registry";
import { discoverHarnessesViaAmux } from "./install";

export { KNOWN_HARNESSES } from "./registry";

const HOOKS_MUX_ADAPTER_TO_HARNESS: Readonly<Record<string, string>> = {
  claude: "claude-code",
  codex: "codex",
  gemini: "gemini-cli",
  copilot: "github-copilot",
  cursor: "cursor",
  pi: "pi",
  "oh-my-pi": "oh-my-pi",
  opencode: "opencode",
  openclaw: "openclaw",
};

export interface HooksMuxCallerHarnessResult {
  /** Normalized babysitter harness identifier. */
  name: string;
  /** Original hooks-mux adapter identifier. */
  sourceAdapter: string;
  /** Environment variable names that matched the hooks-mux rule. */
  matchedEnvVars: string[];
  /** Capabilities advertised by the normalized harness. */
  capabilities: HarnessCapability[];
  /** Detection confidence from hooks-mux rules. */
  confidence: "high" | "medium" | "low";
}

/**
 * Checks whether a harness config directory exists in cwd or home.
 */
async function detectConfig(harnessName: string): Promise<boolean> {
  const spec = getHarnessDiscoverySpec(harnessName);
  const configDirs = spec?.configPaths ?? [];
  if (configDirs.length === 0) return false;
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
  // Try agent-mux first -- it has richer detection and caching.
  try {
    return await discoverHarnessesViaAmux();
  } catch {
    // Fall back to legacy direct probing.
  }

  return discoverHarnessesLegacy();
}

/**
 * Legacy discovery: probes each known harness CLI via `which`/`where` in
 * parallel.  Used as fallback when agent-mux is unavailable.
 */
async function discoverHarnessesLegacy(): Promise<HarnessDiscoveryResult[]> {
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

/**
 * Detect the active caller harness using hooks-mux style discovery rules.
 *
 * This mirrors hooks-mux environment-based detection, but normalizes the
 * adapter name back to babysitter's harness identifiers so SDK command
 * surfaces can reuse the result without depending on hooks-mux packages.
 */
export function detectCallerHarnessViaHooksMux(
  env: Record<string, string | undefined> = process.env,
): HooksMuxCallerHarnessResult | null {
  const detectionRules: HooksMuxDetectionRule[] = getHooksMuxDetectionRules();
  let bestMatch: HooksMuxCallerHarnessResult | null = null;

  for (const rule of detectionRules) {
    const normalizedName = HOOKS_MUX_ADAPTER_TO_HARNESS[rule.adapter];
    if (!normalizedName) {
      continue;
    }

    if (rule.absentSignals?.some((signal) => env[signal])) {
      continue;
    }

    const matchedEnvVars = rule.signals.filter((signal) => {
      const value = env[signal];
      return value != null && value !== "";
    });

    if (matchedEnvVars.length === 0) {
      continue;
    }

    const capabilities = getHarnessDiscoverySpec(normalizedName)?.capabilities ?? [];
    const match: HooksMuxCallerHarnessResult = {
      name: normalizedName,
      sourceAdapter: rule.adapter,
      matchedEnvVars,
      capabilities,
      confidence: rule.confidence,
    };

    if (match.confidence === "high") {
      return match;
    }

    if (!bestMatch) {
      bestMatch = match;
    }
  }

  return bestMatch;
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
