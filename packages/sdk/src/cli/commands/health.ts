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
import { outputTextResult } from "./health/output";
import { checkEnvironmentVariables } from "./health/environment";

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
