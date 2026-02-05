/**
 * Babysitter SDK Configuration Module
 *
 * This module provides centralized configuration management for the SDK.
 * Import from this module to access defaults, configuration helpers, and types.
 *
 * @example
 * ```ts
 * import { DEFAULTS, getConfig, validateConfig } from "@a5c/babysitter-sdk/config";
 *
 * // Use defaults directly
 * console.log(DEFAULTS.runsDir); // ".a5c/runs"
 *
 * // Get merged config with env overrides
 * const config = getConfig({ maxIterations: 500 });
 *
 * // Validate configuration
 * const result = validateConfig(config);
 * if (!result.valid) {
 *   throw new Error(result.errors.join(", "));
 * }
 * ```
 */

export {
  // Types
  type LogLevel,
  type BabysitterConfig,
  type ConfigValidationResult,

  // Constants
  DEFAULTS,
  CONFIG_ENV_VARS,

  // Functions
  getConfig,
  validateConfig,
  getDefaults,
  isValidLogLevel,
} from "./defaults";
