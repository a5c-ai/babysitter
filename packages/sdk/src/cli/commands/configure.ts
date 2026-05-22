/**
 * configure command - Display and validate SDK configuration
 *
 * This command provides utilities to:
 * - Display current effective configuration (merged defaults + env)
 * - Validate current configuration
 * - Show important paths (runs dir, etc.)
 *
 * Subcommands:
 * - configure show     - Display current effective configuration
 * - configure validate - Validate current configuration
 * - configure paths    - Show important paths
 */

import * as path from "node:path";
import {
  DEFAULTS,
  CONFIG_ENV_VARS,
  getConfig,
  validateConfig,
  type BabysitterConfig,
} from "../../config/defaults";
import {
  outputPathsResult,
  outputShowTable,
  outputValidateResult,
  supportsColors,
} from "./configure/output";

// ============================================================================
// Types
// ============================================================================

/**
 * Options for the configure command
 */
export interface ConfigureOptions {
  /** Output in JSON format for machine consumption */
  json?: boolean;
  /** Show only default values (ignore env overrides) */
  defaultsOnly?: boolean;
  /** Working directory (defaults to cwd) */
  cwd?: string;
}

/**
 * Configuration value with source information
 */
export interface ConfigValue {
  /** Configuration key name */
  key: string;
  /** Current effective value */
  value: unknown;
  /** Source of the value: "default" or "env" */
  source: "default" | "env";
  /** Environment variable name that can override this value */
  envVar?: string;
  /** Documentation link for this configuration option */
  docLink: string;
  /** Human-readable description */
  description: string;
}

/**
 * Result of the configure show subcommand
 */
export interface ConfigureShowResult {
  /** All configuration values with their sources */
  values: ConfigValue[];
  /** Timestamp of when the configuration was read */
  timestamp: string;
}

/**
 * Result of the configure validate subcommand
 */
export interface ConfigureValidateResult {
  /** Whether the configuration is valid */
  valid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
  /** Timestamp of when the validation was performed */
  timestamp: string;
}

/**
 * Path information
 */
export interface PathInfo {
  /** Name of the path */
  name: string;
  /** Absolute path value */
  path: string;
  /** Whether the path exists */
  exists: boolean;
  /** Description of what the path is used for */
  description: string;
}

/**
 * Result of the configure paths subcommand
 */
export interface ConfigurePathsResult {
  /** All important paths */
  paths: PathInfo[];
  /** Timestamp of when the paths were resolved */
  timestamp: string;
}

// ============================================================================
// Documentation Links
// ============================================================================

const DOC_BASE_URL = "https://docs.a5c.ai/sdk/config";

/**
 * Documentation links for each configuration option
 */
const DOC_LINKS: Record<keyof BabysitterConfig, string> = {
  runsDir: `${DOC_BASE_URL}#runs-dir`,
  maxIterations: `${DOC_BASE_URL}#max-iterations`,
  qualityThreshold: `${DOC_BASE_URL}#quality-threshold`,
  timeout: `${DOC_BASE_URL}#timeout`,
  logLevel: `${DOC_BASE_URL}#log-level`,
  allowSecretLogs: `${DOC_BASE_URL}#allow-secret-logs`,
  hookTimeout: `${DOC_BASE_URL}#hook-timeout`,
  nodeTaskTimeout: `${DOC_BASE_URL}#node-task-timeout`,
  clockStepMs: `${DOC_BASE_URL}#clock-step-ms`,
  clockStartMs: `${DOC_BASE_URL}#clock-start-ms`,
  layoutVersion: `${DOC_BASE_URL}#layout-version`,
  largeResultPreviewLimit: `${DOC_BASE_URL}#large-result-preview-limit`,
};

/**
 * Descriptions for each configuration option
 */
const DESCRIPTIONS: Record<keyof BabysitterConfig, string> = {
  runsDir: "Directory where run state is stored",
  maxIterations: "Maximum iterations before run terminates",
  qualityThreshold: "Quality threshold percentage (0-100)",
  timeout: "Default task timeout in milliseconds",
  logLevel: "Minimum log level for output",
  allowSecretLogs: "Allow logging of sensitive values",
  hookTimeout: "Hook execution timeout in milliseconds",
  nodeTaskTimeout: "Node task execution timeout in milliseconds",
  clockStepMs: "Clock step interval for testing (ms)",
  clockStartMs: "Clock start epoch for testing (ms)",
  layoutVersion: "Storage layout version identifier",
  largeResultPreviewLimit: "Max size for inline result preview (bytes)",
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the environment variable name for a config key, if any
 */
function getEnvVarForKey(key: keyof BabysitterConfig): string | undefined {
  const envVarMap: Record<string, keyof typeof CONFIG_ENV_VARS | undefined> = {
    runsDir: "RUNS_DIR",
    maxIterations: "MAX_ITERATIONS",
    qualityThreshold: "QUALITY_THRESHOLD",
    timeout: "TIMEOUT",
    logLevel: "LOG_LEVEL",
    allowSecretLogs: "ALLOW_SECRET_LOGS",
    hookTimeout: "HOOK_TIMEOUT",
    nodeTaskTimeout: "NODE_TASK_TIMEOUT",
  };

  const envVarKey = envVarMap[key];
  if (envVarKey) {
    return CONFIG_ENV_VARS[envVarKey];
  }
  return undefined;
}

/**
 * Determine if a config value came from an environment variable
 */
function getValueSource(key: keyof BabysitterConfig): "default" | "env" {
  const envVar = getEnvVarForKey(key);
  if (envVar && process.env[envVar] !== undefined) {
    return "env";
  }
  return "default";
}

// ============================================================================
// Subcommand Implementations
// ============================================================================

/**
 * Execute the "configure show" subcommand
 */
export function configureShow(options: ConfigureOptions): ConfigureShowResult {
  const config = options.defaultsOnly ? DEFAULTS : getConfig();
  const timestamp = new Date().toISOString();

  const values: ConfigValue[] = (Object.keys(config) as Array<keyof BabysitterConfig>).map((key) => ({
    key,
    value: config[key],
    source: options.defaultsOnly ? "default" : getValueSource(key),
    envVar: getEnvVarForKey(key),
    docLink: DOC_LINKS[key],
    description: DESCRIPTIONS[key],
  }));

  return { values, timestamp };
}

/**
 * Execute the "configure validate" subcommand
 */
export function configureValidate(options: ConfigureOptions): ConfigureValidateResult {
  const config = options.defaultsOnly ? DEFAULTS : getConfig();
  const result = validateConfig(config as BabysitterConfig);
  const timestamp = new Date().toISOString();

  return {
    valid: result.valid,
    errors: result.errors,
    warnings: result.warnings,
    timestamp,
  };
}

/**
 * Execute the "configure paths" subcommand
 */
export async function configurePaths(options: ConfigureOptions): Promise<ConfigurePathsResult> {
  const cwd = options.cwd ?? process.cwd();
  const config = options.defaultsOnly ? DEFAULTS : getConfig();
  const timestamp = new Date().toISOString();

  const { promises: fs } = await import("node:fs");

  const pathInfos: Array<{ name: string; relativePath: string; description: string }> = [
    {
      name: "runsDir",
      relativePath: config.runsDir,
      description: "Directory where run state and journals are stored",
    },
    {
      name: "a5cDir",
      relativePath: ".a5c",
      description: "Root directory for babysitter data",
    },
    {
      name: "hooksDir",
      relativePath: ".a5c/hooks",
      description: "Directory for runtime hook scripts",
    },
    {
      name: "processesDir",
      relativePath: ".a5c/processes",
      description: "Directory for process definitions",
    },
  ];

  const paths: PathInfo[] = await Promise.all(
    pathInfos.map(async (info) => {
      const absolutePath = path.resolve(cwd, info.relativePath);
      let exists = false;
      try {
        await fs.access(absolutePath);
        exists = true;
      } catch {
        exists = false;
      }
      return {
        name: info.name,
        path: absolutePath,
        exists,
        description: info.description,
      };
    })
  );

  return { paths, timestamp };
}

/**
 * CLI entry point for the configure command
 *
 * @param args - Subcommand arguments (e.g., ["show"], ["validate"], ["paths"])
 * @param options - Parsed CLI options
 * @returns Exit code (0 for success, 1 for failure)
 *
 * @example
 * ```ts
 * // Show current configuration
 * await handleConfigureCommand(["show"], {});
 *
 * // Show configuration in JSON format
 * await handleConfigureCommand(["show"], { json: true });
 *
 * // Show only default values
 * await handleConfigureCommand(["show"], { defaultsOnly: true });
 *
 * // Validate configuration
 * await handleConfigureCommand(["validate"], {});
 *
 * // Show paths
 * await handleConfigureCommand(["paths"], {});
 * ```
 */
export async function handleConfigureCommand(
  args: string[],
  options: ConfigureOptions
): Promise<number> {
  const subcommand = args[0] ?? "show";
  const useColors = !options.json && supportsColors();

  try {
    switch (subcommand) {
      case "show": {
        const result = configureShow(options);
        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          outputShowTable(result, useColors, DOC_BASE_URL);
        }
        return 0;
      }

      case "validate": {
        const result = configureValidate(options);
        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          outputValidateResult(result, useColors);
        }
        return result.valid ? 0 : 1;
      }

      case "paths": {
        const result = await configurePaths(options);
        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          outputPathsResult(result, useColors);
        }
        return 0;
      }

      default: {
        const errorMsg = `Unknown subcommand: ${subcommand}`;
        if (options.json) {
          console.log(JSON.stringify({ error: errorMsg }, null, 2));
        } else {
          console.error(`Error: ${errorMsg}`);
          console.error("");
          console.error("Available subcommands:");
          console.error("  show      Display current effective configuration");
          console.error("  validate  Validate current configuration");
          console.error("  paths     Show important paths");
          console.error("");
          console.error("Options:");
          console.error("  --json          Output in JSON format");
          console.error("  --defaults-only Show only default values (ignore env overrides)");
        }
        return 1;
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (options.json) {
      console.log(JSON.stringify({ error: errorMsg }, null, 2));
    } else {
      console.error(`Error: ${errorMsg}`);
    }
    return 1;
  }
}
