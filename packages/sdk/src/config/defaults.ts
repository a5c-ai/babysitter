/**
 * Centralized Configuration Defaults for Babysitter SDK
 *
 * This module serves as the single source of truth for all default configuration
 * values used throughout the babysitter SDK. Import from here instead of using
 * scattered magic numbers and strings.
 */

/**
 * Log level type for SDK logging configuration
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

/**
 * Complete configuration interface for the Babysitter SDK
 */
export interface BabysitterConfig {
  /**
   * Directory where run state is stored, relative to the working directory.
   * Contains journals, task definitions, blobs, and state snapshots.
   */
  runsDir: string;

  /**
   * Maximum number of iterations allowed before the run harness terminates.
   * Prevents infinite loops in process orchestration.
   */
  maxIterations: number;

  /**
   * Quality threshold percentage (0-100) for task completion validation.
   * Tasks below this threshold may be flagged for review.
   */
  qualityThreshold: number;

  /**
   * Default timeout in milliseconds for task execution.
   * Individual tasks may override this value.
   */
  timeout: number;

  /**
   * Minimum log level for SDK logging output.
   * Messages below this level will be suppressed.
   */
  logLevel: LogLevel;

  /**
   * Whether to allow logging of potentially sensitive values.
   * When false, secrets and sensitive data are redacted from logs.
   */
  allowSecretLogs: boolean;

  /**
   * Default timeout in milliseconds for hook execution.
   * Hooks that exceed this duration will be terminated.
   */
  hookTimeout: number;

  /**
   * Default timeout in milliseconds for node task execution.
   * Node.js child processes are terminated if they exceed this limit.
   */
  nodeTaskTimeout: number;

  /**
   * Default step interval in milliseconds for deterministic clock simulation.
   * Used in testing to advance simulated time predictably.
   */
  clockStepMs: number;

  /**
   * Default epoch timestamp (ms) for deterministic clock starting point.
   * Used in testing for reproducible timing behavior.
   */
  clockStartMs: number;

  /**
   * Storage layout version identifier.
   * Used to ensure compatibility between SDK versions and stored data.
   */
  layoutVersion: string;

  /**
   * Maximum size in bytes for inline result preview in CLI output.
   * Results larger than this are written to files instead.
   */
  largeResultPreviewLimit: number;
}

/**
 * Validation result for configuration checks
 */
export interface ConfigValidationResult {
  /**
   * Whether the configuration passed all validation checks
   */
  valid: boolean;

  /**
   * Array of validation error messages, empty if valid
   */
  errors: string[];

  /**
   * Array of validation warning messages (non-fatal issues)
   */
  warnings: string[];
}

/**
 * Environment variable names for configuration overrides
 */
export const CONFIG_ENV_VARS = {
  RUNS_DIR: "BABYSITTER_RUNS_DIR",
  MAX_ITERATIONS: "BABYSITTER_MAX_ITERATIONS",
  QUALITY_THRESHOLD: "BABYSITTER_QUALITY_THRESHOLD",
  TIMEOUT: "BABYSITTER_TIMEOUT",
  LOG_LEVEL: "BABYSITTER_LOG_LEVEL",
  ALLOW_SECRET_LOGS: "BABYSITTER_ALLOW_SECRET_LOGS",
  HOOK_TIMEOUT: "BABYSITTER_HOOK_TIMEOUT",
  NODE_TASK_TIMEOUT: "BABYSITTER_NODE_TASK_TIMEOUT",
} as const;

/**
 * Default configuration values for the Babysitter SDK.
 *
 * These defaults are used when no explicit configuration is provided.
 * They can be overridden via environment variables or explicit config.
 */
export const DEFAULTS: Readonly<BabysitterConfig> = {
  /**
   * Default runs directory: .a5c/runs
   * Stores all run-related state including journals, tasks, and blobs.
   */
  runsDir: ".a5c/runs",

  /**
   * Maximum iterations: 256
   * Reasonable upper bound for most workflows while preventing runaway loops.
   */
  maxIterations: 256,

  /**
   * Quality threshold: 80%
   * Standard quality bar for task completion verification.
   */
  qualityThreshold: 80,

  /**
   * Default timeout: 120000ms (2 minutes)
   * Balanced timeout for general task execution.
   */
  timeout: 120000,

  /**
   * Log level: info
   * Shows informational messages, warnings, and errors by default.
   */
  logLevel: "info",

  /**
   * Allow secret logs: false
   * Security-first default - sensitive data is redacted.
   */
  allowSecretLogs: false,

  /**
   * Hook timeout: 30000ms (30 seconds)
   * Hooks should complete quickly as they run synchronously.
   */
  hookTimeout: 30000,

  /**
   * Node task timeout: 900000ms (15 minutes)
   * Extended timeout for potentially long-running Node.js tasks.
   */
  nodeTaskTimeout: 15 * 60 * 1000, // 900000

  /**
   * Clock step: 1000ms (1 second)
   * Standard time increment for deterministic testing.
   */
  clockStepMs: 1000,

  /**
   * Clock start: January 1, 2025 UTC
   * Fixed epoch for reproducible test timing.
   */
  clockStartMs: Date.UTC(2025, 0, 1, 0, 0, 0, 0),

  /**
   * Layout version: 2026.01-storage-preview
   * Current storage format version identifier.
   */
  layoutVersion: "2026.01-storage-preview",

  /**
   * Large result preview limit: 1MB
   * Results exceeding this size are stored externally.
   */
  largeResultPreviewLimit: 1024 * 1024,
} as const;

/**
 * Valid log levels for validation
 */
const VALID_LOG_LEVELS: readonly LogLevel[] = ["debug", "info", "warn", "error", "silent"];

/**
 * Parses an environment variable as a boolean.
 *
 * @param value - The environment variable value
 * @returns true for "1" or "true" (case-insensitive), false otherwise
 */
function parseEnvBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true";
}

/**
 * Parses an environment variable as a positive integer.
 *
 * @param value - The environment variable value
 * @param fallback - Value to return if parsing fails
 * @returns The parsed integer or fallback
 */
function parseEnvPositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseInt(value.trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

/**
 * Parses an environment variable as a log level.
 *
 * @param value - The environment variable value
 * @param fallback - Value to return if parsing fails
 * @returns The parsed log level or fallback
 */
function parseEnvLogLevel(value: string | undefined, fallback: LogLevel): LogLevel {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase() as LogLevel;
  if (VALID_LOG_LEVELS.includes(normalized)) {
    return normalized;
  }
  return fallback;
}

/**
 * Retrieves configuration with environment variable overrides merged in.
 *
 * Environment variables take precedence over defaults. This allows runtime
 * configuration without code changes.
 *
 * @param overrides - Optional explicit overrides that take highest precedence
 * @returns Complete configuration with all values resolved
 *
 * @example
 * ```ts
 * // Get config with defaults and env var overrides
 * const config = getConfig();
 *
 * // Get config with explicit overrides
 * const customConfig = getConfig({ maxIterations: 500 });
 * ```
 */
export function getConfig(overrides?: Partial<BabysitterConfig>): BabysitterConfig {
  const env = typeof process !== "undefined" ? process.env : {};

  return {
    runsDir: overrides?.runsDir ?? env[CONFIG_ENV_VARS.RUNS_DIR] ?? DEFAULTS.runsDir,

    maxIterations:
      overrides?.maxIterations ??
      parseEnvPositiveInt(env[CONFIG_ENV_VARS.MAX_ITERATIONS], DEFAULTS.maxIterations),

    qualityThreshold:
      overrides?.qualityThreshold ??
      parseEnvPositiveInt(env[CONFIG_ENV_VARS.QUALITY_THRESHOLD], DEFAULTS.qualityThreshold),

    timeout: overrides?.timeout ?? parseEnvPositiveInt(env[CONFIG_ENV_VARS.TIMEOUT], DEFAULTS.timeout),

    logLevel:
      overrides?.logLevel ?? parseEnvLogLevel(env[CONFIG_ENV_VARS.LOG_LEVEL], DEFAULTS.logLevel),

    allowSecretLogs:
      overrides?.allowSecretLogs ?? parseEnvBoolean(env[CONFIG_ENV_VARS.ALLOW_SECRET_LOGS]),

    hookTimeout:
      overrides?.hookTimeout ?? parseEnvPositiveInt(env[CONFIG_ENV_VARS.HOOK_TIMEOUT], DEFAULTS.hookTimeout),

    nodeTaskTimeout:
      overrides?.nodeTaskTimeout ??
      parseEnvPositiveInt(env[CONFIG_ENV_VARS.NODE_TASK_TIMEOUT], DEFAULTS.nodeTaskTimeout),

    clockStepMs: overrides?.clockStepMs ?? DEFAULTS.clockStepMs,

    clockStartMs: overrides?.clockStartMs ?? DEFAULTS.clockStartMs,

    layoutVersion: overrides?.layoutVersion ?? DEFAULTS.layoutVersion,

    largeResultPreviewLimit: overrides?.largeResultPreviewLimit ?? DEFAULTS.largeResultPreviewLimit,
  };
}

/**
 * Validates a configuration object for correctness.
 *
 * Checks that all values are within acceptable ranges and of correct types.
 * Returns detailed error and warning messages for any issues found.
 *
 * @param config - The configuration to validate
 * @returns Validation result with errors and warnings
 *
 * @example
 * ```ts
 * const config = getConfig();
 * const result = validateConfig(config);
 * if (!result.valid) {
 *   console.error("Config errors:", result.errors);
 * }
 * ```
 */
export function validateConfig(config: BabysitterConfig): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate runsDir
  if (!config.runsDir || typeof config.runsDir !== "string") {
    errors.push("runsDir must be a non-empty string");
  }

  // Validate maxIterations
  if (!Number.isFinite(config.maxIterations) || config.maxIterations <= 0) {
    errors.push("maxIterations must be a positive finite number");
  } else if (config.maxIterations > 10000) {
    warnings.push("maxIterations is unusually high (>10000), this may cause performance issues");
  }

  // Validate qualityThreshold
  if (!Number.isFinite(config.qualityThreshold) || config.qualityThreshold < 0 || config.qualityThreshold > 100) {
    errors.push("qualityThreshold must be a number between 0 and 100");
  }

  // Validate timeout
  if (!Number.isFinite(config.timeout) || config.timeout <= 0) {
    errors.push("timeout must be a positive finite number");
  } else if (config.timeout < 1000) {
    warnings.push("timeout is very short (<1s), tasks may fail prematurely");
  }

  // Validate logLevel
  if (!VALID_LOG_LEVELS.includes(config.logLevel)) {
    errors.push(`logLevel must be one of: ${VALID_LOG_LEVELS.join(", ")}`);
  }

  // Validate allowSecretLogs
  if (typeof config.allowSecretLogs !== "boolean") {
    errors.push("allowSecretLogs must be a boolean");
  } else if (config.allowSecretLogs) {
    warnings.push("allowSecretLogs is enabled - sensitive data may be exposed in logs");
  }

  // Validate hookTimeout
  if (!Number.isFinite(config.hookTimeout) || config.hookTimeout <= 0) {
    errors.push("hookTimeout must be a positive finite number");
  }

  // Validate nodeTaskTimeout
  if (!Number.isFinite(config.nodeTaskTimeout) || config.nodeTaskTimeout <= 0) {
    errors.push("nodeTaskTimeout must be a positive finite number");
  }

  // Validate clockStepMs
  if (!Number.isFinite(config.clockStepMs) || config.clockStepMs <= 0) {
    errors.push("clockStepMs must be a positive finite number");
  }

  // Validate clockStartMs
  if (!Number.isFinite(config.clockStartMs) || config.clockStartMs < 0) {
    errors.push("clockStartMs must be a non-negative finite number");
  }

  // Validate layoutVersion
  if (!config.layoutVersion || typeof config.layoutVersion !== "string") {
    errors.push("layoutVersion must be a non-empty string");
  }

  // Validate largeResultPreviewLimit
  if (!Number.isFinite(config.largeResultPreviewLimit) || config.largeResultPreviewLimit <= 0) {
    errors.push("largeResultPreviewLimit must be a positive finite number");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Creates a frozen copy of the defaults for safe external use.
 *
 * @returns A read-only copy of the default configuration
 */
export function getDefaults(): Readonly<BabysitterConfig> {
  return { ...DEFAULTS };
}

/**
 * Checks if a value is a valid log level.
 *
 * @param value - The value to check
 * @returns true if the value is a valid LogLevel
 */
export function isValidLogLevel(value: unknown): value is LogLevel {
  return typeof value === "string" && VALID_LOG_LEVELS.includes(value as LogLevel);
}
