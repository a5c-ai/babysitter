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

import { outputTextResult } from "./health/output";
import { checkEnvironmentVariables } from "./health/environment";
import {
  checkSdkVersion,
  checkNodeVersion,
  checkA5cDirectory,
  checkPackageDependency,
} from "./health/checks";

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
// Main Health Check Runner
// ============================================================================

/**
 * Runs all health checks and returns aggregated results
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
