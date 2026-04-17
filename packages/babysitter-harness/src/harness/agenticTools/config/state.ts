import { CONFIG_ENV_VARS, DEFAULTS, getConfig, type BabysitterConfig } from "@a5c-ai/babysitter-sdk";

const EXTENDED_CONFIG_KEYS: ReadonlySet<string> = new Set([
  "model",
  "provider",
  "breakpoint.autoApproveAfterN",
  "breakpoint.presentAlwaysApprove",
]);

const BABYSITTER_CONFIG_KEYS: ReadonlySet<string> = new Set([
  "runsDir",
  "maxIterations",
  "qualityThreshold",
  "timeout",
  "logLevel",
  "allowSecretLogs",
  "hookTimeout",
  "nodeTaskTimeout",
  "clockStepMs",
  "clockStartMs",
  "layoutVersion",
  "largeResultPreviewLimit",
]);

const CONFIG_KEY_TYPES: Record<string, string> = {
  runsDir: "string",
  maxIterations: "number",
  qualityThreshold: "number",
  timeout: "number",
  logLevel: "string",
  allowSecretLogs: "boolean",
  hookTimeout: "number",
  nodeTaskTimeout: "number",
  clockStepMs: "number",
  clockStartMs: "number",
  layoutVersion: "string",
  largeResultPreviewLimit: "number",
  model: "string",
  provider: "string",
};

const VALID_LOG_LEVELS = new Set(["debug", "info", "warn", "error", "silent"]);

const CONFIG_KEY_TO_ENV: Record<string, string> = {
  runsDir: CONFIG_ENV_VARS.RUNS_DIR,
  maxIterations: CONFIG_ENV_VARS.MAX_ITERATIONS,
  qualityThreshold: CONFIG_ENV_VARS.QUALITY_THRESHOLD,
  timeout: CONFIG_ENV_VARS.TIMEOUT,
  logLevel: CONFIG_ENV_VARS.LOG_LEVEL,
  allowSecretLogs: CONFIG_ENV_VARS.ALLOW_SECRET_LOGS,
  hookTimeout: CONFIG_ENV_VARS.HOOK_TIMEOUT,
  nodeTaskTimeout: CONFIG_ENV_VARS.NODE_TASK_TIMEOUT,
};

const runScopedConfig = new Map<string, unknown>();

export function resetRunScopedConfig(): void {
  runScopedConfig.clear();
}

export function isValidConfigKey(key: string): boolean {
  return BABYSITTER_CONFIG_KEYS.has(key)
    || EXTENDED_CONFIG_KEYS.has(key)
    || key.startsWith("compression.")
    || key.startsWith("breakpoint.");
}

export function validateConfigValue(key: string, value: unknown): string | null {
  const expectedType = CONFIG_KEY_TYPES[key];
  if (expectedType && typeof value !== expectedType) {
    return `Expected '${key}' to be ${expectedType}, got ${typeof value}.`;
  }
  if (key === "logLevel" && typeof value === "string" && !VALID_LOG_LEVELS.has(value)) {
    return `Invalid logLevel '${value}'. Must be one of: ${[...VALID_LOG_LEVELS].join(", ")}.`;
  }
  if (expectedType === "number" && typeof value === "number" && key !== "clockStartMs" && value <= 0) {
    return `'${key}' must be a positive number.`;
  }
  return null;
}

export function getConfigValue(key: string): unknown {
  if (runScopedConfig.has(key)) {
    return runScopedConfig.get(key);
  }
  if (BABYSITTER_CONFIG_KEYS.has(key)) {
    const config = getConfig();
    return config[key as keyof BabysitterConfig];
  }
  return undefined;
}

export function getConfigDefault(key: string): unknown {
  if (BABYSITTER_CONFIG_KEYS.has(key)) {
    return DEFAULTS[key as keyof BabysitterConfig];
  }
  return undefined;
}

export function listConfigKeys(): string[] {
  return [...new Set<string>([
    ...BABYSITTER_CONFIG_KEYS,
    ...EXTENDED_CONFIG_KEYS,
    ...runScopedConfig.keys(),
  ])];
}

export function getRunScopedConfigEntries(): IterableIterator<[string, unknown]> {
  return runScopedConfig.entries();
}

export function setConfigValue(key: string, value: unknown, scope: string): void {
  if (scope === "global") {
    const envKey = CONFIG_KEY_TO_ENV[key];
    if (envKey) {
      process.env[envKey] = String(value);
    } else {
      process.env[`BABYSITTER_${key.replace(/\./g, "_").toUpperCase()}`] = String(value);
    }
  }
  runScopedConfig.set(key, value);
}

export function resetConfigValue(key?: string): void {
  if (key) {
    runScopedConfig.delete(key);
    return;
  }
  runScopedConfig.clear();
}
