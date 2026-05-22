import type {
  CheckStatus,
  HealthCheck,
  HealthCheckOptions,
  HealthCheckResult,
} from "../health";

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
} as const;

const SYMBOLS = {
  pass: `${COLORS.green}\u2713${COLORS.reset}`,
  fail: `${COLORS.red}\u2717${COLORS.reset}`,
  warn: `${COLORS.yellow}\u26A0${COLORS.reset}`,
} as const;

const PLAIN_SYMBOLS = {
  pass: "[PASS]",
  fail: "[FAIL]",
  warn: "[WARN]",
} as const;

export function supportsColors(): boolean {
  if (process.env.NO_COLOR !== undefined) return false;
  if (process.env.FORCE_COLOR !== undefined) return true;
  return Boolean(process.stdout && typeof process.stdout.isTTY === "boolean" && process.stdout.isTTY);
}

export function getSymbol(status: CheckStatus, useColors: boolean): string {
  return useColors ? SYMBOLS[status] : PLAIN_SYMBOLS[status];
}

export function outputTextResult(result: HealthCheckResult, options: HealthCheckOptions): void {
  const useColors = supportsColors();
  const { verbose } = options;

  console.log("");
  console.log(`Babysitter SDK Health Check: ${formatOverallStatus(result, useColors)}`);
  console.log("");

  for (const check of result.checks) {
    console.log(`  ${getSymbol(check.status, useColors)} ${check.description}`);
    if (verbose || check.status !== "pass") {
      const message = useColors ? `${getMessageColor(check)}${check.message}${COLORS.reset}` : check.message;
      console.log(`      ${message}`);
    }
    if (verbose && check.details) {
      const details = JSON.stringify(check.details, null, 2)
        .split("\n")
        .map((line) => `      ${useColors ? COLORS.dim : ""}${line}${useColors ? COLORS.reset : ""}`)
        .join("\n");
      console.log(details);
    }
  }

  console.log("");
  console.log(`Summary: ${formatSummary(result)}`);

  if (result.nextSteps.length > 0) {
    console.log("");
    console.log(useColors ? `${COLORS.cyan}${COLORS.bold}Next Steps:${COLORS.reset}` : "Next Steps:");
    for (const step of result.nextSteps) {
      console.log(`  - ${step}`);
    }
  }

  console.log("");
}

function formatOverallStatus(result: HealthCheckResult, useColors: boolean): string {
  if (!useColors) {
    return result.status.toUpperCase();
  }
  const statusColor =
    result.status === "healthy"
      ? COLORS.green
      : result.status === "degraded"
        ? COLORS.yellow
        : COLORS.red;
  return `${statusColor}${COLORS.bold}${result.status.toUpperCase()}${COLORS.reset}`;
}

function getMessageColor(check: HealthCheck): string {
  if (check.status === "pass") return COLORS.dim;
  if (check.status === "warn") return COLORS.yellow;
  return COLORS.red;
}

function formatSummary(result: HealthCheckResult): string {
  return [
    `${result.summary.passed} passed`,
    result.summary.failed > 0 ? `${result.summary.failed} failed` : null,
    result.summary.warnings > 0 ? `${result.summary.warnings} warnings` : null,
  ]
    .filter(Boolean)
    .join(", ");
}
