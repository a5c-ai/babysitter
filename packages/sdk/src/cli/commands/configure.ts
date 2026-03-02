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
// Color Utilities
// ============================================================================

/**
 * ANSI color codes for terminal output
 */
const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  blue: "\x1b[34m",
} as const;

/**
 * Checks if stdout supports colors
 */
function supportsColors(): boolean {
  if (process.env.NO_COLOR !== undefined) {
    return false;
  }
  if (process.env.FORCE_COLOR !== undefined) {
    return true;
  }
  if (process.stdout && typeof process.stdout.isTTY === "boolean") {
    return process.stdout.isTTY;
  }
  return false;
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

/**
 * Format a value for display
 */
function formatValue(value: unknown): string {
  if (typeof value === "string") {
    return `"${value}"`;
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    return value.toLocaleString();
  }
  return String(value);
}

/**
 * Calculate column widths for table display
 */
function calculateColumnWidths(rows: string[][]): number[] {
  if (rows.length === 0) return [];
  const numCols = rows[0].length;
  const widths: number[] = new Array<number>(numCols).fill(0);
  // eslint-disable-next-line no-control-regex
  const ansiRegex = /\x1b\[[0-9;]*m/g;

  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      // Strip ANSI codes for width calculation
      const stripped = row[i].replace(ansiRegex, "");
      widths[i] = Math.max(widths[i], stripped.length);
    }
  }

  return widths;
}

/**
 * Pad a string to a specific width, accounting for ANSI codes
 */
function padString(str: string, width: number): string {
  // eslint-disable-next-line no-control-regex
  const stripped = str.replace(/\x1b\[[0-9;]*m/g, "");
  const padding = width - stripped.length;
  return str + " ".repeat(Math.max(0, padding));
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

// ============================================================================
// Output Formatting
// ============================================================================

/**
 * Output configuration values as a formatted table
 */
function outputShowTable(result: ConfigureShowResult, useColors: boolean): void {
  console.log("");
  const header = useColors
    ? `${COLORS.bold}${COLORS.cyan}Babysitter SDK Configuration${COLORS.reset}`
    : "Babysitter SDK Configuration";
  console.log(header);
  console.log("");

  // Prepare table rows
  const headers = ["Setting", "Value", "Source"];
  const rows: string[][] = [headers];

  for (const item of result.values) {
    const valueStr = formatValue(item.value);
    const sourceStr =
      item.source === "env"
        ? useColors
          ? `${COLORS.green}env${COLORS.reset}`
          : "env"
        : useColors
          ? `${COLORS.dim}default${COLORS.reset}`
          : "default";

    rows.push([item.key, valueStr, sourceStr]);
  }

  // Calculate column widths
  const widths = calculateColumnWidths(rows);

  // Print header
  const headerRow = headers.map((h, i) => padString(useColors ? `${COLORS.bold}${h}${COLORS.reset}` : h, widths[i]));
  console.log("  " + headerRow.join("  "));

  // Print separator
  const separator = widths.map((w) => "-".repeat(w)).join("  ");
  console.log("  " + (useColors ? `${COLORS.dim}${separator}${COLORS.reset}` : separator));

  // Print data rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i].map((cell, j) => padString(cell, widths[j]));
    console.log("  " + row.join("  "));
  }

  console.log("");

  // Print environment variable hints
  const envOverridden = result.values.filter((v) => v.source === "env");
  if (envOverridden.length > 0) {
    const envHeader = useColors
      ? `${COLORS.cyan}Environment Overrides:${COLORS.reset}`
      : "Environment Overrides:";
    console.log(envHeader);
    for (const item of envOverridden) {
      console.log(`  ${item.envVar} = ${formatValue(item.value)}`);
    }
    console.log("");
  }

  // Print doc link hint
  const docHint = useColors
    ? `${COLORS.dim}Documentation: ${DOC_BASE_URL}${COLORS.reset}`
    : `Documentation: ${DOC_BASE_URL}`;
  console.log(docHint);
  console.log("");
}

/**
 * Output validation results
 */
function outputValidateResult(result: ConfigureValidateResult, useColors: boolean): void {
  console.log("");

  const statusIcon = result.valid
    ? useColors
      ? `${COLORS.green}\u2713${COLORS.reset}`
      : "[PASS]"
    : useColors
      ? `${COLORS.red}\u2717${COLORS.reset}`
      : "[FAIL]";

  const statusText = result.valid ? "Configuration is valid" : "Configuration has errors";
  const header = useColors
    ? `${COLORS.bold}${statusIcon} ${statusText}${COLORS.reset}`
    : `${statusIcon} ${statusText}`;
  console.log(header);
  console.log("");

  if (result.errors.length > 0) {
    const errHeader = useColors
      ? `${COLORS.red}${COLORS.bold}Errors:${COLORS.reset}`
      : "Errors:";
    console.log(errHeader);
    for (const err of result.errors) {
      const bullet = useColors ? `${COLORS.red}\u2022${COLORS.reset}` : "-";
      console.log(`  ${bullet} ${err}`);
    }
    console.log("");
  }

  if (result.warnings.length > 0) {
    const warnHeader = useColors
      ? `${COLORS.yellow}${COLORS.bold}Warnings:${COLORS.reset}`
      : "Warnings:";
    console.log(warnHeader);
    for (const warn of result.warnings) {
      const bullet = useColors ? `${COLORS.yellow}\u2022${COLORS.reset}` : "-";
      console.log(`  ${bullet} ${warn}`);
    }
    console.log("");
  }

  if (result.valid && result.warnings.length === 0) {
    const msg = useColors
      ? `${COLORS.dim}All configuration values are within valid ranges.${COLORS.reset}`
      : "All configuration values are within valid ranges.";
    console.log(msg);
    console.log("");
  }
}

/**
 * Output path information
 */
function outputPathsResult(result: ConfigurePathsResult, useColors: boolean): void {
  console.log("");
  const header = useColors
    ? `${COLORS.bold}${COLORS.cyan}Babysitter SDK Paths${COLORS.reset}`
    : "Babysitter SDK Paths";
  console.log(header);
  console.log("");

  for (const pathInfo of result.paths) {
    const existsIcon = pathInfo.exists
      ? useColors
        ? `${COLORS.green}\u2713${COLORS.reset}`
        : "[EXISTS]"
      : useColors
        ? `${COLORS.yellow}\u2717${COLORS.reset}`
        : "[MISSING]";

    const nameStr = useColors
      ? `${COLORS.bold}${pathInfo.name}${COLORS.reset}`
      : pathInfo.name;

    console.log(`  ${existsIcon} ${nameStr}`);
    console.log(`      Path: ${pathInfo.path}`);
    const descStr = useColors
      ? `${COLORS.dim}${pathInfo.description}${COLORS.reset}`
      : pathInfo.description;
    console.log(`      ${descStr}`);
    console.log("");
  }
}

// ============================================================================
// Main Command Handler
// ============================================================================

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
          outputShowTable(result, useColors);
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
          console.error(useColors ? `${COLORS.red}Error:${COLORS.reset} ${errorMsg}` : `Error: ${errorMsg}`);
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
      console.error(useColors ? `${COLORS.red}Error:${COLORS.reset} ${errorMsg}` : `Error: ${errorMsg}`);
    }
    return 1;
  }
}
