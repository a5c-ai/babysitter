import { execSync } from "child_process";
import { readFileSync } from "fs";
import { resolve } from "path";

// QA F6: /api/version once cached the babysitter CLI version forever, so a
// long-lived observer server kept reporting the version detected at its very
// first request (e.g. "0.0.187") long after the CLI was upgraded (e.g. 6.0.2).
// The cache below re-detects on a normal TTL AND whenever the user comes back
// after an idle gap (a returning user is exactly who may have just upgraded).

const CACHE_TTL_MS = 5 * 60 * 1000; // refresh at most every 5 minutes under steady polling
const IDLE_THRESHOLD_MS = 60 * 1000; // >1 minute request gap = user was away, re-detect

export interface VersionInfo {
  app: string;
  babysitter: string;
}

export interface VersionInfoDeps {
  /** Clock, injectable for tests. */
  now: () => number;
  /** Runs a CLI command and returns its stdout; must throw on failure. */
  execCommand: (command: string) => string;
  /** Reads this app's package.json contents (raw JSON string). */
  readPackageJson: () => string;
}

const defaultDeps: VersionInfoDeps = {
  now: () => Date.now(),
  execCommand: (command: string) =>
    execSync(command, { encoding: "utf-8", timeout: 3000 }),
  readPackageJson: () =>
    // The Next server process runs with cwd at the app root, both in dev and
    // in the packaged CLI (src/cli.ts spawns next from the package dir).
    readFileSync(resolve(process.cwd(), "package.json"), "utf-8"),
};

let cached: VersionInfo | null = null;
let cachedAt = 0;
let lastRequestAt: number | null = null;

/** Test hook: clear the module-level cache. */
export function resetVersionInfoCache(): void {
  cached = null;
  cachedAt = 0;
  lastRequestAt = null;
}

/** Extract a semver-looking version from a CLI's --version output. */
export function detectCliVersion(
  command: string,
  execCommand: VersionInfoDeps["execCommand"] = defaultDeps.execCommand
): string {
  try {
    const raw = execCommand(command).trim();
    const match = raw.match(/(\d+\.\d+\.\d+)/);
    return match ? match[1] : raw || "N/A";
  } catch {
    return "N/A";
  }
}

function getAppVersion(deps: VersionInfoDeps): string {
  try {
    const pkg = JSON.parse(deps.readPackageJson());
    return pkg.version || process.env.NEXT_PUBLIC_APP_VERSION || "unknown";
  } catch {
    return process.env.NEXT_PUBLIC_APP_VERSION || "unknown";
  }
}

function isCacheStale(now: number): boolean {
  // User returned after being away — they may have upgraded the CLI meanwhile.
  if (lastRequestAt !== null && now - lastRequestAt > IDLE_THRESHOLD_MS) return true;
  // Normal TTL expiry under continuous polling.
  return now - cachedAt > CACHE_TTL_MS;
}

/**
 * Version info for the footer / /api/version: the observer app's own version
 * plus the ACTUAL currently-installed babysitter CLI version (re-detected on
 * staleness, never cached for the lifetime of the server process).
 */
export function getVersionInfo(overrides?: Partial<VersionInfoDeps>): VersionInfo {
  const deps: VersionInfoDeps = { ...defaultDeps, ...overrides };
  const now = deps.now();
  if (!cached || isCacheStale(now)) {
    cached = {
      app: getAppVersion(deps),
      babysitter: detectCliVersion("babysitter --version", deps.execCommand),
    };
    cachedAt = now;
  }
  lastRequestAt = now;
  return cached;
}
