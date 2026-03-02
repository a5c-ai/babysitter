/**
 * health command - Verify SDK installation and environment health
 *
 * This command performs diagnostic checks to verify:
 * - SDK CLI is properly installed and version is accessible
 * - .a5c directory exists and is writable
 * - Node.js version is compatible (>=18)
 * - Package.json has babysitter-sdk dependency if in project context
 * - Environment variables are set correctly
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { DEFAULTS, CONFIG_ENV_VARS } from "../../config/defaults";

// ============================================================================
// Types
// ============================================================================

/**
 * Status of an individual health check
 */
export type CheckStatus = "pass" | "fail" | "warn";

/**
 * Result of a single health check
 */
export interface HealthCheck {
  /** Name of the check */
  name: string;
  /** Human-readable description of what was checked */
  description: string;
  /** Status of the check */
  status: CheckStatus;
  /** Detailed message about the result */
  message: string;
  /** Suggested next steps if the check failed or warned */
  nextSteps?: string[];
  /** Additional diagnostic details */
  details?: Record<string, unknown>;
}

/**
 * Options for running health checks
 */
export interface HealthCheckOptions {
  /** Output in JSON format for machine consumption */
  json?: boolean;
  /** Include verbose diagnostic information */
  verbose?: boolean;
  /** Working directory to check (defaults to cwd) */
  cwd?: string;
}

/**
 * Overall health check result
 */
export interface HealthCheckResult {
  /** Overall health status */
  status: "healthy" | "degraded" | "unhealthy";
  /** Timestamp of the health check */
  timestamp: string;
  /** Individual check results */
  checks: HealthCheck[];
  /** Summary counts */
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  /** Aggregated next steps from all failing checks */
  nextSteps: string[];
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
} as const;

/**
 * Check symbols with colors
 */
const SYMBOLS = {
  pass: `${COLORS.green}\u2713${COLORS.reset}`,
  fail: `${COLORS.red}\u2717${COLORS.reset}`,
  warn: `${COLORS.yellow}\u26A0${COLORS.reset}`,
} as const;

/**
 * Plain symbols without colors (for non-TTY output)
 */
const PLAIN_SYMBOLS = {
  pass: "[PASS]",
  fail: "[FAIL]",
  warn: "[WARN]",
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

/**
 * Get the appropriate symbol for a check status
 */
function getSymbol(status: CheckStatus, useColors: boolean): string {
  return useColors ? SYMBOLS[status] : PLAIN_SYMBOLS[status];
}

// ============================================================================
// Version Utilities
// ============================================================================

/**
 * Reads the CLI version from package.json
 */
async function readCliVersion(): Promise<string> {
  try {
    const packagePath = path.join(__dirname, "..", "..", "..", "package.json");
    const raw = await fs.readFile(packagePath, "utf8");
    const parsed = JSON.parse(raw) as { version?: string };
    return parsed.version ?? "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Parses a semver version string into components
 */
function parseVersion(version: string): { major: number; minor: number; patch: number } | null {
  const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

// ============================================================================
// Individual Health Checks
// ============================================================================

/**
 * Check: SDK CLI Version
 * Verifies the SDK CLI is installed and version is accessible
 */
async function checkSdkVersion(): Promise<HealthCheck> {
  const version = await readCliVersion();

  if (version === "unknown") {
    return {
      name: "sdk-version",
      description: "SDK CLI version is accessible",
      status: "fail",
      message: "Unable to read SDK version from package.json",
      nextSteps: [
        "Ensure @a5c-ai/babysitter-sdk is properly installed",
        "Run: npm install @a5c-ai/babysitter-sdk",
      ],
    };
  }

  return {
    name: "sdk-version",
    description: "SDK CLI version is accessible",
    status: "pass",
    message: `SDK version ${version}`,
    details: { version },
  };
}

/**
 * Check: Node.js Version
 * Verifies Node.js version is compatible (>=18)
 */
function checkNodeVersion(): HealthCheck {
  const nodeVersion = process.version;
  const parsed = parseVersion(nodeVersion);

  if (!parsed) {
    return {
      name: "node-version",
      description: "Node.js version is compatible (>=18)",
      status: "warn",
      message: `Unable to parse Node.js version: ${nodeVersion}`,
      nextSteps: ["Verify Node.js is properly installed"],
      details: { version: nodeVersion },
    };
  }

  const minMajor = 18;
  if (parsed.major < minMajor) {
    return {
      name: "node-version",
      description: "Node.js version is compatible (>=18)",
      status: "fail",
      message: `Node.js ${nodeVersion} is below minimum required version (v${minMajor}.0.0)`,
      nextSteps: [
        `Upgrade Node.js to version ${minMajor} or higher`,
        "Visit https://nodejs.org to download the latest LTS version",
        "Consider using nvm or fnm for version management",
      ],
      details: { version: nodeVersion, required: `>=${minMajor}.0.0` },
    };
  }

  return {
    name: "node-version",
    description: "Node.js version is compatible (>=18)",
    status: "pass",
    message: `Node.js ${nodeVersion}`,
    details: { version: nodeVersion, major: parsed.major },
  };
}

/**
 * Check: .a5c Directory
 * Verifies the .a5c directory exists and is writable
 */
async function checkA5cDirectory(cwd: string): Promise<HealthCheck> {
  const a5cDir = path.join(cwd, ".a5c");
  const runsDir = path.join(a5cDir, "runs");

  try {
    const stats = await fs.stat(a5cDir);
    if (!stats.isDirectory()) {
      return {
        name: "a5c-directory",
        description: ".a5c directory exists and is writable",
        status: "fail",
        message: `.a5c exists but is not a directory at ${a5cDir}`,
        nextSteps: [
          "Remove the .a5c file and let the SDK create the directory",
          "Or run: rm .a5c && mkdir -p .a5c/runs",
        ],
        details: { path: a5cDir, isDirectory: false },
      };
    }

    // Check if writable by attempting to write a test file
    const testFile = path.join(a5cDir, ".health-check-test");
    try {
      await fs.writeFile(testFile, "test", "utf8");
      await fs.unlink(testFile);
    } catch (writeError) {
      return {
        name: "a5c-directory",
        description: ".a5c directory exists and is writable",
        status: "fail",
        message: `.a5c directory exists but is not writable at ${a5cDir}`,
        nextSteps: [
          "Check file permissions on the .a5c directory",
          "Run: chmod 755 .a5c",
        ],
        details: { path: a5cDir, writable: false },
      };
    }

    // Check if runs subdirectory exists
    let runsExists = false;
    try {
      const runsStats = await fs.stat(runsDir);
      runsExists = runsStats.isDirectory();
    } catch {
      // runs dir doesn't exist yet, that's okay
    }

    return {
      name: "a5c-directory",
      description: ".a5c directory exists and is writable",
      status: "pass",
      message: `.a5c directory is ready at ${a5cDir}`,
      details: { path: a5cDir, runsDir, runsExists, writable: true },
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return {
        name: "a5c-directory",
        description: ".a5c directory exists and is writable",
        status: "warn",
        message: `.a5c directory does not exist at ${a5cDir}`,
        nextSteps: [
          "The directory will be created automatically when running babysitter commands",
          "Or create it manually: mkdir -p .a5c/runs",
        ],
        details: { path: a5cDir, exists: false },
      };
    }

    return {
      name: "a5c-directory",
      description: ".a5c directory exists and is writable",
      status: "fail",
      message: `Error accessing .a5c directory: ${err.message}`,
      nextSteps: ["Check file system permissions and disk space"],
      details: { path: a5cDir, error: err.message },
    };
  }
}

/**
 * Check: Package.json Dependency
 * Verifies babysitter-sdk is listed as a dependency in the project
 */
async function checkPackageDependency(cwd: string): Promise<HealthCheck> {
  const packagePath = path.join(cwd, "package.json");

  try {
    const raw = await fs.readFile(packagePath, "utf8");
    const pkg = JSON.parse(raw) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    const depVersion = pkg.dependencies?.["@a5c-ai/babysitter-sdk"];
    const devDepVersion = pkg.devDependencies?.["@a5c-ai/babysitter-sdk"];
    const version = depVersion || devDepVersion;
    const location = depVersion ? "dependencies" : devDepVersion ? "devDependencies" : null;

    if (version) {
      return {
        name: "package-dependency",
        description: "Project has babysitter-sdk dependency",
        status: "pass",
        message: `@a5c-ai/babysitter-sdk@${version} found in ${location}`,
        details: { version, location, packagePath },
      };
    }

    return {
      name: "package-dependency",
      description: "Project has babysitter-sdk dependency",
      status: "warn",
      message: "@a5c-ai/babysitter-sdk not found in package.json",
      nextSteps: [
        "Add the dependency: npm install @a5c-ai/babysitter-sdk",
        "Or if this is not a babysitter project, this warning can be ignored",
      ],
      details: { packagePath, found: false },
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return {
        name: "package-dependency",
        description: "Project has babysitter-sdk dependency",
        status: "warn",
        message: "No package.json found in current directory",
        nextSteps: [
          "If this is a Node.js project, run: npm init -y",
          "If not in a project directory, this warning can be ignored",
        ],
        details: { packagePath, exists: false },
      };
    }

    return {
      name: "package-dependency",
      description: "Project has babysitter-sdk dependency",
      status: "warn",
      message: `Error reading package.json: ${err.message}`,
      details: { packagePath, error: err.message },
    };
  }
}

/**
 * Check: Environment Variables
 * Verifies babysitter-related environment variables are set correctly
 */
function checkEnvironmentVariables(): HealthCheck {
  const envChecks: Array<{
    name: string;
    key: string;
    value: string | undefined;
    required: boolean;
    valid: boolean;
    note?: string;
  }> = [];

  // Check BABYSITTER_RUNS_DIR
  const runsDir = process.env[CONFIG_ENV_VARS.RUNS_DIR];
  envChecks.push({
    name: "BABYSITTER_RUNS_DIR",
    key: CONFIG_ENV_VARS.RUNS_DIR,
    value: runsDir,
    required: false,
    valid: true,
    note: runsDir ? `Custom runs directory: ${runsDir}` : `Using default: ${DEFAULTS.runsDir}`,
  });

  // Check BABYSITTER_MAX_ITERATIONS
  const maxIterations = process.env[CONFIG_ENV_VARS.MAX_ITERATIONS];
  let maxIterValid = true;
  if (maxIterations) {
    const parsed = parseInt(maxIterations, 10);
    maxIterValid = Number.isFinite(parsed) && parsed > 0;
  }
  envChecks.push({
    name: "BABYSITTER_MAX_ITERATIONS",
    key: CONFIG_ENV_VARS.MAX_ITERATIONS,
    value: maxIterations,
    required: false,
    valid: maxIterValid,
    note: maxIterations
      ? maxIterValid
        ? `Max iterations: ${maxIterations}`
        : `Invalid value: ${maxIterations} (must be positive integer)`
      : `Using default: ${DEFAULTS.maxIterations}`,
  });

  // Check BABYSITTER_LOG_LEVEL
  const logLevel = process.env[CONFIG_ENV_VARS.LOG_LEVEL];
  const validLogLevels = ["debug", "info", "warn", "error", "silent"];
  const logLevelValid = !logLevel || validLogLevels.includes(logLevel.toLowerCase());
  envChecks.push({
    name: "BABYSITTER_LOG_LEVEL",
    key: CONFIG_ENV_VARS.LOG_LEVEL,
    value: logLevel,
    required: false,
    valid: logLevelValid,
    note: logLevel
      ? logLevelValid
        ? `Log level: ${logLevel}`
        : `Invalid value: ${logLevel} (must be one of: ${validLogLevels.join(", ")})`
      : `Using default: ${DEFAULTS.logLevel}`,
  });

  // Check BABYSITTER_ALLOW_SECRET_LOGS
  const allowSecrets = process.env[CONFIG_ENV_VARS.ALLOW_SECRET_LOGS];
  envChecks.push({
    name: "BABYSITTER_ALLOW_SECRET_LOGS",
    key: CONFIG_ENV_VARS.ALLOW_SECRET_LOGS,
    value: allowSecrets,
    required: false,
    valid: true,
    note: allowSecrets
      ? `Secret logging: ${allowSecrets === "1" || allowSecrets.toLowerCase() === "true" ? "enabled" : "disabled"}`
      : "Secret logging: disabled (default)",
  });

  const invalidVars = envChecks.filter((c) => !c.valid);
  const setVars = envChecks.filter((c) => c.value !== undefined);

  if (invalidVars.length > 0) {
    return {
      name: "environment-variables",
      description: "Environment variables are configured correctly",
      status: "fail",
      message: `${invalidVars.length} environment variable(s) have invalid values`,
      nextSteps: invalidVars.map((v) => `Fix ${v.name}: ${v.note}`),
      details: { checks: envChecks, invalid: invalidVars.map((v) => v.name) },
    };
  }

  return {
    name: "environment-variables",
    description: "Environment variables are configured correctly",
    status: "pass",
    message:
      setVars.length > 0
        ? `${setVars.length} environment variable(s) configured`
        : "Using default configuration",
    details: { checks: envChecks, customized: setVars.map((v) => v.name) },
  };
}

// ============================================================================
// Main Health Check Runner
// ============================================================================

/**
 * Runs all health checks and returns aggregated results
 *
 * @param options - Health check options
 * @returns Complete health check result
 *
 * @example
 * ```ts
 * // Run health checks with default options
 * const result = await runHealthCheck({});
 *
 * // Run with verbose output
 * const result = await runHealthCheck({ verbose: true });
 *
 * // Get JSON output
 * const result = await runHealthCheck({ json: true });
 * ```
 */
export async function runHealthCheck(options: HealthCheckOptions): Promise<HealthCheckResult> {
  const cwd = options.cwd ?? process.cwd();
  const timestamp = new Date().toISOString();

  // Run all checks
  const checks = await Promise.all([
    checkSdkVersion(),
    checkNodeVersion(),
    checkA5cDirectory(cwd),
    checkPackageDependency(cwd),
    checkEnvironmentVariables(),
  ]);

  // Calculate summary
  const summary = {
    total: checks.length,
    passed: checks.filter((c) => c.status === "pass").length,
    failed: checks.filter((c) => c.status === "fail").length,
    warnings: checks.filter((c) => c.status === "warn").length,
  };

  // Determine overall status
  let status: HealthCheckResult["status"];
  if (summary.failed > 0) {
    status = "unhealthy";
  } else if (summary.warnings > 0) {
    status = "degraded";
  } else {
    status = "healthy";
  }

  // Aggregate next steps from failing and warning checks
  const nextSteps = checks
    .filter((c) => c.status === "fail" || c.status === "warn")
    .flatMap((c) => c.nextSteps ?? []);

  const result: HealthCheckResult = {
    status,
    timestamp,
    checks,
    summary,
    nextSteps,
  };

  // Output results
  if (!options.json) {
    outputTextResult(result, options);
  }

  return result;
}

/**
 * Outputs health check results in human-readable format
 */
function outputTextResult(result: HealthCheckResult, options: HealthCheckOptions): void {
  const useColors = supportsColors();
  const { verbose } = options;

  // Header
  console.log("");
  const statusColor =
    result.status === "healthy"
      ? COLORS.green
      : result.status === "degraded"
        ? COLORS.yellow
        : COLORS.red;
  const statusText = useColors
    ? `${statusColor}${COLORS.bold}${result.status.toUpperCase()}${COLORS.reset}`
    : result.status.toUpperCase();
  console.log(`Babysitter SDK Health Check: ${statusText}`);
  console.log("");

  // Individual checks
  for (const check of result.checks) {
    const symbol = getSymbol(check.status, useColors);
    console.log(`  ${symbol} ${check.description}`);

    if (verbose || check.status !== "pass") {
      const msgColor =
        check.status === "pass"
          ? COLORS.dim
          : check.status === "warn"
            ? COLORS.yellow
            : COLORS.red;
      const message = useColors ? `${msgColor}${check.message}${COLORS.reset}` : check.message;
      console.log(`      ${message}`);
    }

    if (verbose && check.details) {
      const detailsStr = JSON.stringify(check.details, null, 2)
        .split("\n")
        .map((line) => `      ${useColors ? COLORS.dim : ""}${line}${useColors ? COLORS.reset : ""}`)
        .join("\n");
      console.log(detailsStr);
    }
  }

  console.log("");

  // Summary
  const summaryLine = [
    `${result.summary.passed} passed`,
    result.summary.failed > 0 ? `${result.summary.failed} failed` : null,
    result.summary.warnings > 0 ? `${result.summary.warnings} warnings` : null,
  ]
    .filter(Boolean)
    .join(", ");
  console.log(`Summary: ${summaryLine}`);

  // Next steps
  if (result.nextSteps.length > 0) {
    console.log("");
    const nextStepsHeader = useColors
      ? `${COLORS.cyan}${COLORS.bold}Next Steps:${COLORS.reset}`
      : "Next Steps:";
    console.log(nextStepsHeader);
    for (const step of result.nextSteps) {
      console.log(`  - ${step}`);
    }
  }

  console.log("");
}

/**
 * CLI entry point for the health command
 *
 * @param options - Parsed CLI options
 * @returns Exit code (0 for healthy, 1 for unhealthy)
 */
export async function handleHealthCommand(options: HealthCheckOptions): Promise<number> {
  const result = await runHealthCheck(options);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  }

  // Return exit code based on status
  switch (result.status) {
    case "healthy":
      return 0;
    case "degraded":
      return 0; // Warnings don't cause failure
    case "unhealthy":
      return 1;
    default:
      return 1;
  }
}
