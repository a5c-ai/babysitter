/**
 * Centralized Configuration Defaults for Babysitter SDK
 *
 * This module serves as the single source of truth for all default configuration
 * values used throughout the babysitter SDK. Import from here instead of using
 * scattered magic numbers and strings.
 */

import * as path from "node:path";
import * as os from "node:os";

/**
 * Log level type for SDK logging configuration
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

/**
 * Complete configuration interface for the Babysitter SDK
 */
export interface BabysitterConfig {
  runsDir: string;
  maxIterations: number;
  qualityThreshold: number;
  timeout: number;
  logLevel: LogLevel;
  allowSecretLogs: boolean;
  hookTimeout: number;
  nodeTaskTimeout: number;
  clockStepMs: number;
  clockStartMs: number;
  layoutVersion: string;
  largeResultPreviewLimit: number;
}

/**
 * Validation result for configuration checks
 */
export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Environment variable names for configuration overrides
 */
export const CONFIG_ENV_VARS = {
  RUNS_DIR: "BABYSITTER_RUNS_DIR",
  RUNS_SCOPE: "BABYSITTER_RUNS_SCOPE",
  MAX_ITERATIONS: "BABYSITTER_MAX_ITERATIONS",
  QUALITY_THRESHOLD: "BABYSITTER_QUALITY_THRESHOLD",
  TIMEOUT: "BABYSITTER_TIMEOUT",
  LOG_LEVEL: "BABYSITTER_LOG_LEVEL",
  ALLOW_SECRET_LOGS: "BABYSITTER_ALLOW_SECRET_LOGS",
  HOOK_TIMEOUT: "BABYSITTER_HOOK_TIMEOUT",
  NODE_TASK_TIMEOUT: "BABYSITTER_NODE_TASK_TIMEOUT",
} as const;

/** Default SDK configuration values; env vars and explicit overrides can replace them. */
export const DEFAULTS: Readonly<BabysitterConfig> = {
  runsDir: path.join(getConfiguredGlobalStateRoot(), "runs"),
  maxIterations: 65_000,
  qualityThreshold: 80,
  timeout: 120000,
  logLevel: "info",
  allowSecretLogs: false,
  hookTimeout: 30000,
  nodeTaskTimeout: 15 * 60 * 1000,
  clockStepMs: 1000,
  clockStartMs: Date.UTC(2025, 0, 1, 0, 0, 0, 0),
  layoutVersion: "2026.01-storage-preview",
  largeResultPreviewLimit: 1024 * 1024,
} as const;

export function getConfiguredGlobalStateRoot(): string {
  return process.env.BABYSITTER_GLOBAL_STATE_DIR?.trim()
    ? path.resolve(process.env.BABYSITTER_GLOBAL_STATE_DIR)
    : path.join(os.homedir(), ".a5c");
}

function normalizeComparablePath(value: string): string {
  const normalized = path.normalize(path.resolve(value));
  return process.platform === "win32"
    ? normalized.toLowerCase()
    : normalized;
}

/**
 * Normalizes a session-state directory path.
 */
export function normalizeSessionStateDir(stateDir?: string): string {
  const globalRoot = getConfiguredGlobalStateRoot();
  if (!stateDir?.trim()) {
    return path.join(globalRoot, "state");
  }

  const resolved = path.resolve(stateDir);
  if (normalizeComparablePath(resolved) === normalizeComparablePath(globalRoot)) {
    return path.join(globalRoot, "state");
  }

  return resolved;
}

/**
 * Returns the global babysitter state directory (~/.a5c/state/).
 */
export function getGlobalStateDir(): string {
  return normalizeSessionStateDir(process.env.BABYSITTER_STATE_DIR);
}

/**
 * Returns the global babysitter log directory (~/.a5c/logs/).
 */
export function getGlobalLogDir(): string {
  const override = process.env.BABYSITTER_LOG_DIR?.trim();
  if (override) {
    if (!path.isAbsolute(override)) {
      const rebased = path.join(os.homedir(), ".a5c", "logs");
      // eslint-disable-next-line no-console
      console.warn(
        `[babysitter] BABYSITTER_LOG_DIR must be an absolute path; got ${JSON.stringify(
          override,
        )}. Falling back to ${rebased}. Set an absolute path to silence this warning.`,
      );
      return rebased;
    }
    return path.resolve(override);
  }
  const globalRoot = getConfiguredGlobalStateRoot();
  return path.join(globalRoot, "logs");
}

// Re-export validation and config functions from the extracted module
export { getConfig, validateConfig, getDefaults, isValidLogLevel } from "./configValidation";
