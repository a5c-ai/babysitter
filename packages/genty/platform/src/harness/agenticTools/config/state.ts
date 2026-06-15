import type { RuntimeConfigValueType } from "../../../types";

/**
 * Local scoped runtime config state — replaces the SDK-coupled
 * createScopedRuntimeConfigState with a self-contained implementation
 * that manages run-scoped and global-scoped config in-process.
 */

const EXTENDED_CONFIG_KEYS: ReadonlySet<string> = new Set([
  "model",
  "provider",
  "breakpoint.autoApproveAfterN",
  "breakpoint.presentAlwaysApprove",
]);

const CONFIG_KEY_TYPES: Record<string, RuntimeConfigValueType> = {
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

const CORE_CONFIG_KEYS = new Set(Object.keys(CONFIG_KEY_TYPES));

const runScopedConfig = new Map<string, unknown>();
const globalScopedConfig = new Map<string, unknown>();

export function resetRunScopedConfig(): void {
  runScopedConfig.clear();
}

export function isValidConfigKey(key: string): boolean {
  return CORE_CONFIG_KEYS.has(key)
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
    return `Invalid logLevel '${value}'. Must be one of: debug, info, warn, error, silent.`;
  }
  if (expectedType === "number" && typeof value === "number" && key !== "clockStartMs" && value <= 0) {
    return `'${key}' must be a positive number.`;
  }
  return null;
}

export function getConfigValue(key: string): unknown {
  if (runScopedConfig.has(key)) return runScopedConfig.get(key);
  if (globalScopedConfig.has(key)) return globalScopedConfig.get(key);
  return undefined;
}

export function getConfigDefault(key: string): unknown {
  // Defaults are not embedded here; the provider or caller is expected
  // to supply them through the config system.  Return undefined for any
  // key without a run-scoped or global-scoped override.
  return undefined;
}

export function listConfigKeys(): string[] {
  return [...new Set<string>([
    ...CORE_CONFIG_KEYS,
    ...EXTENDED_CONFIG_KEYS,
    ...globalScopedConfig.keys(),
    ...runScopedConfig.keys(),
  ])];
}

export function getRunScopedConfigEntries(): IterableIterator<[string, unknown]> {
  return runScopedConfig.entries();
}

export function setConfigValue(key: string, value: unknown): void {
  if (CORE_CONFIG_KEYS.has(key)) {
    globalScopedConfig.set(key, value);
  }
  runScopedConfig.set(key, value);
}

export function resetConfigValue(key: string): void {
  runScopedConfig.delete(key);
  globalScopedConfig.delete(key);
}
