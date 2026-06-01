import { createScopedRuntimeConfigState, type RuntimeConfigValueType } from "@a5c-ai/babysitter-sdk";

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
