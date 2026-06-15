import { DEFAULTS, CONFIG_ENV_VARS } from "../../../config/defaults";
import { getRunsScope, resolveRunsDir } from "../../../config";
import type { HealthCheck } from "../health";

export function checkEnvironmentVariables(): HealthCheck {
  const envChecks: Array<{
    name: string;
    key: string;
    value: string | undefined;
    required: boolean;
    valid: boolean;
    note?: string;
  }> = [];

  const runsDir = process.env[CONFIG_ENV_VARS.RUNS_DIR];
  const runsScope = getRunsScope();
  envChecks.push({
    name: "BABYSITTER_RUNS_DIR",
    key: CONFIG_ENV_VARS.RUNS_DIR,
    value: runsDir,
    required: false,
    valid: true,
    note: runsDir ? `Custom runs directory: ${runsDir}` : `Using ${runsScope} scope default: ${resolveRunsDir()}`,
  });
  envChecks.push({
    name: "BABYSITTER_RUNS_SCOPE",
    key: CONFIG_ENV_VARS.RUNS_SCOPE,
    value: process.env[CONFIG_ENV_VARS.RUNS_SCOPE],
    required: false,
    valid: true,
    note: `Runs scope: ${runsScope}`,
  });

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

  const invalidVars = envChecks.filter((check) => !check.valid);
  const setVars = envChecks.filter((check) => check.value !== undefined);

  if (invalidVars.length > 0) {
    return {
      name: "environment-variables",
      description: "Environment variables are configured correctly",
      status: "fail",
      message: `${invalidVars.length} environment variable(s) have invalid values`,
      nextSteps: invalidVars.map((check) => `Fix ${check.name}: ${check.note}`),
      details: { checks: envChecks, invalid: invalidVars.map((check) => check.name) },
    };
  }

  return {
    name: "environment-variables",
    description: "Environment variables are configured correctly",
    status: "pass",
    message: setVars.length > 0 ? `${setVars.length} environment variable(s) configured` : "Using default configuration",
    details: { checks: envChecks, customized: setVars.map((check) => check.name) },
  };
}
