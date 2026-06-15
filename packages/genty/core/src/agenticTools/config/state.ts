/**
 * Type for runtime config value validation.
 */
type RuntimeConfigValueType = "string" | "number" | "boolean";

interface ScopedRuntimeConfigStateOptions {
  readonly configKeyTypes: Readonly<Record<string, RuntimeConfigValueType>>;
  readonly extendedConfigKeys?: ReadonlySet<string>;
}

type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

function isValidLogLevel(value: string): value is LogLevel {
  return value === "debug"
    || value === "info"
    || value === "warn"
    || value === "error"
    || value === "silent";
}

/**
 * Creates a scoped runtime config state manager.
 *
 * This is a genty-local implementation that replaces the SDK version.
 * It manages run-scoped and global-scoped configuration values with
 * type validation.
 */
function createScopedRuntimeConfigState(options: ScopedRuntimeConfigStateOptions) {
  const runScopedConfig = new Map<string, unknown>();
  const globalScopedConfig = new Map<string, unknown>();
  const extendedConfigKeys = options.extendedConfigKeys ?? new Set<string>();

  // All known config keys from the key-types map plus extended keys.
  const allKnownKeys = new Set<string>([
    ...Object.keys(options.configKeyTypes),
    ...extendedConfigKeys,
  ]);

  function resetRunScopedConfig(): void {
    runScopedConfig.clear();
  }

  function isValidConfigKey(key: string): boolean {
    return allKnownKeys.has(key)
      || key.startsWith("compression.")
      || key.startsWith("breakpoint.");
  }

  function validateConfigValue(key: string, value: unknown): string | null {
    const expectedType = options.configKeyTypes[key];
    if (expectedType && typeof value !== expectedType) {
      return `Expected '${key}' to be ${expectedType}, got ${typeof value}.`;
    }
    if (key === "logLevel" && typeof value === "string" && !isValidLogLevel(value)) {
      return `Invalid logLevel '${value}'. Must be one of: debug, info, warn, error, silent.`;
    }
    if (expectedType === "number" && typeof value === "number" && key !== "clockStartMs" && value <= 0) {
      return `'${key}' must be a positive number.`;
    }
    return null;
  }

  function getConfigValue(key: string): unknown {
    if (runScopedConfig.has(key)) return runScopedConfig.get(key);
    if (globalScopedConfig.has(key)) return globalScopedConfig.get(key);
    return undefined;
  }

  function getConfigDefault(_key: string): unknown {
    return undefined;
  }

  function listConfigKeys(): string[] {
    return [...new Set<string>([
      ...allKnownKeys,
      ...globalScopedConfig.keys(),
      ...runScopedConfig.keys(),
    ])];
  }

  function getRunScopedConfigEntries(): IterableIterator<[string, unknown]> {
    return runScopedConfig.entries();
  }

  function setConfigValue(key: string, value: unknown, scope: string): void {
    if (scope === "global") {
      globalScopedConfig.set(key, value);
      return;
    }
    runScopedConfig.set(key, value);
  }

  function resetConfigValue(key?: string): void {
    if (key) {
      runScopedConfig.delete(key);
      globalScopedConfig.delete(key);
      return;
    }
    runScopedConfig.clear();
    globalScopedConfig.clear();
  }

  return {
    resetRunScopedConfig,
    isValidConfigKey,
    validateConfigValue,
    getConfigValue,
    getConfigDefault,
    listConfigKeys,
    getRunScopedConfigEntries,
    setConfigValue,
    resetConfigValue,
  };
}

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

const state = createScopedRuntimeConfigState({
  configKeyTypes: CONFIG_KEY_TYPES,
  extendedConfigKeys: EXTENDED_CONFIG_KEYS,
});

export const resetRunScopedConfig = state.resetRunScopedConfig;
export const isValidConfigKey = state.isValidConfigKey;
export const validateConfigValue = state.validateConfigValue;
export const getConfigValue = state.getConfigValue;
export const getConfigDefault = state.getConfigDefault;
export const listConfigKeys = state.listConfigKeys;
export const getRunScopedConfigEntries = state.getRunScopedConfigEntries;
export const setConfigValue = state.setConfigValue;
export const resetConfigValue = state.resetConfigValue;
