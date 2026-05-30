import {
  CONFIG_ENV_VARS,
  DEFAULTS,
  type BabysitterConfig,
  type LogLevel,
} from "./defaults";
import { getConfig } from "./configValidation";

export type EnvContractScope = "external-input" | "process-boundary" | "scoped-config";

export interface EnvVarContract {
  readonly name: string;
  readonly valueType: "string" | "number" | "boolean" | "json";
  readonly scope: EnvContractScope;
  readonly description: string;
}

export const ENV_VAR_CONTRACTS = {
  babysitter: {
    runsDir: {
      name: CONFIG_ENV_VARS.RUNS_DIR,
      valueType: "string",
      scope: "external-input",
      description: "Overrides the Babysitter runs directory at process startup.",
    },
    runsScope: {
      name: CONFIG_ENV_VARS.RUNS_SCOPE,
      valueType: "string",
      scope: "external-input",
      description: "Selects global or repo-scoped run storage at process startup.",
    },
    maxIterations: {
      name: CONFIG_ENV_VARS.MAX_ITERATIONS,
      valueType: "number",
      scope: "external-input",
      description: "Overrides the session iteration budget at process startup.",
    },
    qualityThreshold: {
      name: CONFIG_ENV_VARS.QUALITY_THRESHOLD,
      valueType: "number",
      scope: "external-input",
      description: "Overrides quality threshold defaults at process startup.",
    },
    timeout: {
      name: CONFIG_ENV_VARS.TIMEOUT,
      valueType: "number",
      scope: "external-input",
      description: "Overrides the default task timeout at process startup.",
    },
    logLevel: {
      name: CONFIG_ENV_VARS.LOG_LEVEL,
      valueType: "string",
      scope: "external-input",
      description: "Overrides SDK log level at process startup.",
    },
    allowSecretLogs: {
      name: CONFIG_ENV_VARS.ALLOW_SECRET_LOGS,
      valueType: "boolean",
      scope: "external-input",
      description: "Allows secret logging when explicitly enabled at process startup.",
    },
    hookTimeout: {
      name: CONFIG_ENV_VARS.HOOK_TIMEOUT,
      valueType: "number",
      scope: "external-input",
      description: "Overrides hook timeout at process startup.",
    },
    nodeTaskTimeout: {
      name: CONFIG_ENV_VARS.NODE_TASK_TIMEOUT,
      valueType: "number",
      scope: "external-input",
      description: "Overrides node task timeout at process startup.",
    },
  },
  azureOpenAi: {
    apiKey: {
      name: "AZURE_OPENAI_API_KEY",
      valueType: "string",
      scope: "external-input",
      description: "Azure OpenAI API key read from the process environment.",
    },
    projectName: {
      name: "AZURE_OPENAI_PROJECT_NAME",
      valueType: "string",
      scope: "external-input",
      description: "Azure OpenAI project/resource alias read from the process environment.",
    },
    resourceName: {
      name: "AZURE_OPENAI_RESOURCE_NAME",
      valueType: "string",
      scope: "scoped-config",
      description: "Pi-compatible Azure OpenAI resource name supplied through explicit env overlays.",
    },
    baseUrl: {
      name: "AZURE_OPENAI_BASE_URL",
      valueType: "string",
      scope: "scoped-config",
      description: "Normalized Azure OpenAI base URL supplied through explicit env overlays.",
    },
    deployment: {
      name: "AZURE_OPENAI_DEPLOYMENT",
      valueType: "string",
      scope: "external-input",
      description: "Default Azure OpenAI deployment read from the process environment.",
    },
    deploymentNameMap: {
      name: "AZURE_OPENAI_DEPLOYMENT_NAME_MAP",
      valueType: "string",
      scope: "scoped-config",
      description: "Pi model-to-deployment map supplied through explicit env overlays.",
    },
  },
  agentMux: {
    logLevel: {
      name: "AMUX_LOG_LEVEL",
      valueType: "string",
      scope: "external-input",
      description: "Agent mux log level read as startup input; CLI flags should configure loggers directly.",
    },
    logFile: {
      name: "AMUX_LOG_FILE",
      valueType: "string",
      scope: "external-input",
      description: "Agent mux log file read as startup input; CLI flags should configure loggers directly.",
    },
    observabilityMode: {
      name: "AMUX_OBSERVABILITY_MODE",
      valueType: "string",
      scope: "external-input",
      description: "Agent mux observability mode read as startup input, not in-process mutable state.",
    },
  },
} as const satisfies Record<string, Record<string, EnvVarContract>>;

export type RuntimeConfigValueType = "string" | "number" | "boolean";

export interface ScopedRuntimeConfigStateOptions {
  readonly configKeyTypes: Readonly<Record<string, RuntimeConfigValueType>>;
  readonly extendedConfigKeys?: Iterable<string>;
}

const BABYSITTER_CONFIG_KEYS: ReadonlySet<string> = new Set(Object.keys(DEFAULTS));

export function scopedBabysitterEnvVarName(key: string): string {
  return `BABYSITTER_${key.replace(/\./g, "_").toUpperCase()}`;
}

export function configKeyToEnvVar(key: string): string | undefined {
  const contract = ENV_VAR_CONTRACTS.babysitter[key as keyof typeof ENV_VAR_CONTRACTS.babysitter];
  return contract?.name;
}

export function createScopedRuntimeConfigState(options: ScopedRuntimeConfigStateOptions) {
  const runScopedConfig = new Map<string, unknown>();
  const globalScopedConfig = new Map<string, unknown>();
  const extendedConfigKeys = new Set(options.extendedConfigKeys ?? []);

  function resetRunScopedConfig(): void {
    runScopedConfig.clear();
  }

  function isValidConfigKey(key: string): boolean {
    return BABYSITTER_CONFIG_KEYS.has(key)
      || extendedConfigKeys.has(key)
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

  function getConfigOverrides(): Partial<BabysitterConfig> {
    const overrides: Partial<BabysitterConfig> = {};
    for (const [key, value] of globalScopedConfig) {
      if (!BABYSITTER_CONFIG_KEYS.has(key)) continue;
      (overrides as Record<string, unknown>)[key] = value;
    }
    return overrides;
  }

  function getConfigValue(key: string): unknown {
    if (runScopedConfig.has(key)) return runScopedConfig.get(key);
    if (globalScopedConfig.has(key)) return globalScopedConfig.get(key);
    if (BABYSITTER_CONFIG_KEYS.has(key)) {
      const config = getConfig(getConfigOverrides());
      return config[key as keyof BabysitterConfig];
    }
    return undefined;
  }

  function getConfigDefault(key: string): unknown {
    if (BABYSITTER_CONFIG_KEYS.has(key)) {
      return DEFAULTS[key as keyof BabysitterConfig];
    }
    return undefined;
  }

  function listConfigKeys(): string[] {
    return [...new Set<string>([
      ...BABYSITTER_CONFIG_KEYS,
      ...extendedConfigKeys,
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

function isValidLogLevel(value: string): value is LogLevel {
  return value === "debug"
    || value === "info"
    || value === "warn"
    || value === "error"
    || value === "silent";
}
