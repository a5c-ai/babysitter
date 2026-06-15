import { readFileSync, writeFileSync, mkdirSync, unlinkSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { AuthTokenSchema, type AuthToken } from "../auth/index.js";

// ── Constants ─────────────────────────────────────────────────────────────

const BMUX_DIR = ".tasks-adapter";
const AUTH_FILE = "auth.json";
const CONFIG_FILE = "config.json";
const KEYS_DIR = "keys";

export interface BmuxClientConfig {
  serverUrl?: string;
  authToken?: string;
}

// ── Path helpers ─────────────────────────────────────────────────────────

/**
 * Get the path to the tasks-adapter config directory (~/.tasks-adapter).
 */
export function getBmuxDir(): string {
  return join(homedir(), BMUX_DIR);
}

/**
 * Get the path to the auth state file (~/.tasks-adapter/auth.json).
 */
export function getAuthStorePath(): string {
  return join(getBmuxDir(), AUTH_FILE);
}

/**
 * Get the path to the client config file (~/.tasks-adapter/config.json).
 */
export function getClientConfigPath(): string {
  return join(getBmuxDir(), CONFIG_FILE);
}

/**
 * Get the path to the SSH keys directory (~/.tasks-adapter/keys).
 */
export function getKeysDir(): string {
  return join(getBmuxDir(), KEYS_DIR);
}

// ── Generic client config ───────────────────────────────────────────────

/**
 * Load CLI/MCP client configuration from ~/.tasks-adapter/config.json.
 */
export function loadClientConfig(): BmuxClientConfig {
  const filePath = getClientConfigPath();

  if (!existsSync(filePath)) {
    return {};
  }

  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const config: BmuxClientConfig = {};

    if (typeof parsed.serverUrl === "string" && parsed.serverUrl.trim().length > 0) {
      config.serverUrl = parsed.serverUrl.trim();
    }
    if (typeof parsed.authToken === "string" && parsed.authToken.trim().length > 0) {
      config.authToken = parsed.authToken.trim();
    }

    return config;
  } catch {
    return {};
  }
}

/**
 * Save or update CLI/MCP client configuration in ~/.tasks-adapter/config.json.
 */
export function saveClientConfig(next: BmuxClientConfig): void {
  const dir = getBmuxDir();
  mkdirSync(dir, { recursive: true });

  const merged = { ...loadClientConfig() };

  if (next.serverUrl !== undefined) {
    const normalized = next.serverUrl.trim();
    if (normalized.length > 0) {
      merged.serverUrl = normalized;
    } else {
      delete merged.serverUrl;
    }
  }

  if (next.authToken !== undefined) {
    const normalized = next.authToken.trim();
    if (normalized.length > 0) {
      merged.authToken = normalized;
    } else {
      delete merged.authToken;
    }
  }

  const filePath = getClientConfigPath();
  if (Object.keys(merged).length === 0) {
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
    return;
  }

  writeFileSync(filePath, JSON.stringify(merged, null, 2), {
    encoding: "utf-8",
    mode: 0o600,
  });
}

// ── Auth state persistence ───────────────────────────────────────────────

/**
 * Load the stored authentication state from ~/.tasks-adapter/auth.json.
 * Returns null if no auth file exists or the contents are invalid.
 */
export function loadAuthState(): AuthToken | null {
  const filePath = getAuthStorePath();

  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    const result = AuthTokenSchema.safeParse(parsed);

    if (!result.success) {
      return null;
    }

    return result.data;
  } catch {
    return null;
  }
}

/**
 * Save authentication state to ~/.tasks-adapter/auth.json.
 * Creates the directory if it does not exist.
 * Sets file permissions to 0600 (owner read/write only).
 */
export function saveAuthState(state: AuthToken): void {
  const dir = getBmuxDir();
  mkdirSync(dir, { recursive: true });

  const filePath = getAuthStorePath();
  writeFileSync(filePath, JSON.stringify(state, null, 2), {
    encoding: "utf-8",
    mode: 0o600,
  });
}

/**
 * Clear the stored authentication state by removing ~/.tasks-adapter/auth.json.
 */
export function clearAuthState(): void {
  const filePath = getAuthStorePath();

  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
}

// ── Token expiration ─────────────────────────────────────────────────────

/**
 * Check whether a token has expired based on its expiresAt timestamp.
 */
export function isTokenExpired(expiresAt: string): boolean {
  const expiry = new Date(expiresAt).getTime();
  return Date.now() >= expiry;
}
