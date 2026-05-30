export type EnvVarBoundary = "external-read" | "process-boundary" | "in-process-config";

export interface EnvVarContract {
  readonly name: string;
  readonly owner: string;
  readonly boundary: EnvVarBoundary;
  readonly description: string;
}

export const ENV_VAR_CONTRACTS = {
  AZURE_OPENAI_API_KEY: {
    name: "AZURE_OPENAI_API_KEY",
    owner: "azure-openai",
    boundary: "external-read",
    description: "Azure OpenAI API credential read from the host environment.",
  },
  AZURE_OPENAI_PROJECT_NAME: {
    name: "AZURE_OPENAI_PROJECT_NAME",
    owner: "azure-openai",
    boundary: "external-read",
    description: "Azure project/resource alias supplied by the host environment.",
  },
  AZURE_OPENAI_RESOURCE_NAME: {
    name: "AZURE_OPENAI_RESOURCE_NAME",
    owner: "azure-openai",
    boundary: "in-process-config",
    description: "Pi-compatible Azure resource alias synthesized into explicit config.",
  },
  AZURE_OPENAI_BASE_URL: {
    name: "AZURE_OPENAI_BASE_URL",
    owner: "azure-openai",
    boundary: "in-process-config",
    description: "Azure OpenAI base URL normalized into explicit config.",
  },
  AZURE_OPENAI_DEPLOYMENT_NAME_MAP: {
    name: "AZURE_OPENAI_DEPLOYMENT_NAME_MAP",
    owner: "azure-openai",
    boundary: "in-process-config",
    description: "Pi model-to-deployment map synthesized into explicit config.",
  },
  AMUX_LOG_LEVEL: {
    name: "AMUX_LOG_LEVEL",
    owner: "agent-mux",
    boundary: "external-read",
    description: "Agent-mux log level read from the host environment at startup.",
  },
  AMUX_LOG_FILE: {
    name: "AMUX_LOG_FILE",
    owner: "agent-mux",
    boundary: "external-read",
    description: "Agent-mux log file path read from the host environment at startup.",
  },
  AMUX_OBSERVABILITY_MODE: {
    name: "AMUX_OBSERVABILITY_MODE",
    owner: "agent-mux",
    boundary: "external-read",
    description: "Agent-mux observability mode read from the host environment at startup.",
  },
  BABYSITTER_CONFIG: {
    name: "BABYSITTER_*",
    owner: "babysitter-sdk",
    boundary: "external-read",
    description: "SDK configuration keys read from the host environment or explicit scoped config.",
  },
} as const satisfies Record<string, EnvVarContract>;

export type ScopedConfigScope = "run" | "global";

export interface ScopedConfigEntry {
  readonly value: unknown;
  readonly scope: ScopedConfigScope;
  readonly envKey?: string;
}

const scopedConfig = new Map<string, ScopedConfigEntry>();

export function setScopedConfigValue(
  key: string,
  value: unknown,
  scope: ScopedConfigScope,
  envKey?: string,
): void {
  scopedConfig.set(key, { value, scope, envKey });
}

export function getScopedConfigValue(key: string): unknown {
  return scopedConfig.get(key)?.value;
}

export function hasScopedConfigValue(key: string): boolean {
  return scopedConfig.has(key);
}

export function resetScopedConfigValue(key?: string): void {
  if (key) {
    scopedConfig.delete(key);
    return;
  }
  scopedConfig.clear();
}

export function listScopedConfigKeys(): string[] {
  return [...scopedConfig.keys()];
}

export function getScopedConfigEntries(): IterableIterator<[string, ScopedConfigEntry]> {
  return scopedConfig.entries();
}
