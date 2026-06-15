/**
 * Configuration validation and construction helpers.
 * Extracted from defaults.ts for max-lines compliance.
 */

import type { BabysitterConfig, ConfigValidationResult, LogLevel } from "./defaults";
import { DEFAULTS, CONFIG_ENV_VARS } from "./defaults";
import { resolveRunsDir } from "./runs";

/**
 * Valid log levels for validation
 */
const VALID_LOG_LEVELS: readonly LogLevel[] = ["debug", "info", "warn", "error", "silent"];

/**
 * Parses an environment variable as a boolean.
 */
function parseEnvBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true";
}

/**
 * Parses an environment variable as a positive integer.
 */
function parseEnvPositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseInt(value.trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

/**
 * Parses an environment variable as a log level.
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
 */
export function getConfig(overrides?: Partial<BabysitterConfig>): BabysitterConfig {
  const env = typeof process !== "undefined" ? process.env : {};

  return {
    runsDir: overrides?.runsDir ?? resolveRunsDir(),

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
 */
export function validateConfig(config: BabysitterConfig): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.runsDir || typeof config.runsDir !== "string") {
    errors.push("runsDir must be a non-empty string");
  }

  if (!Number.isFinite(config.maxIterations) || config.maxIterations <= 0) {
    errors.push("maxIterations must be a positive finite number");
  } else if (config.maxIterations > 10000) {
    warnings.push("maxIterations is unusually high (>10000), this may cause performance issues");
  }

  if (!Number.isFinite(config.qualityThreshold) || config.qualityThreshold < 0 || config.qualityThreshold > 100) {
    errors.push("qualityThreshold must be a number between 0 and 100");
  }

  if (!Number.isFinite(config.timeout) || config.timeout <= 0) {
    errors.push("timeout must be a positive finite number");
  } else if (config.timeout < 1000) {
    warnings.push("timeout is very short (<1s), tasks may fail prematurely");
  }

  if (!VALID_LOG_LEVELS.includes(config.logLevel)) {
    errors.push(`logLevel must be one of: ${VALID_LOG_LEVELS.join(", ")}`);
  }

  if (typeof config.allowSecretLogs !== "boolean") {
    errors.push("allowSecretLogs must be a boolean");
  } else if (config.allowSecretLogs) {
    warnings.push("allowSecretLogs is enabled - sensitive data may be exposed in logs");
  }

  if (!Number.isFinite(config.hookTimeout) || config.hookTimeout <= 0) {
    errors.push("hookTimeout must be a positive finite number");
  }

  if (!Number.isFinite(config.nodeTaskTimeout) || config.nodeTaskTimeout <= 0) {
    errors.push("nodeTaskTimeout must be a positive finite number");
  }

  if (!Number.isFinite(config.clockStepMs) || config.clockStepMs <= 0) {
    errors.push("clockStepMs must be a positive finite number");
  }

  if (!Number.isFinite(config.clockStartMs) || config.clockStartMs < 0) {
    errors.push("clockStartMs must be a non-negative finite number");
  }

  if (!config.layoutVersion || typeof config.layoutVersion !== "string") {
    errors.push("layoutVersion must be a non-empty string");
  }

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
 */
export function getDefaults(): Readonly<BabysitterConfig> {
  return { ...DEFAULTS };
}

/**
 * Checks if a value is a valid log level.
 */
export function isValidLogLevel(value: unknown): value is LogLevel {
  return typeof value === "string" && VALID_LOG_LEVELS.includes(value as LogLevel);
}
