import { Type } from "@sinclair/typebox";
import type { CustomToolDefinition } from "../types";
import { errorResult, jsonResult, ok } from "../shared/results";
import {
  getConfigDefault,
  getConfigValue,
  getRunScopedConfigEntries,
  isValidConfigKey,
  listConfigKeys,
  resetConfigValue,
  setConfigValue,
  validateConfigValue,
} from "./state";

export function createConfigTool(): CustomToolDefinition {
  return {
    name: "config",
    label: "Runtime Config",
    description:
      "Read and modify babysitter configuration at runtime. Supports get/set/list/reset actions for standard config keys, model/provider selection, and compression settings.",
    parameters: Type.Object({
      action: Type.Union([
        Type.Literal("get"),
        Type.Literal("set"),
        Type.Literal("list"),
        Type.Literal("reset"),
      ], { description: "Action to perform: get, set, list, or reset" }),
      key: Type.Optional(
        Type.String({ description: "Config key path (dot notation for nested, e.g. 'compression.enabled')" }),
      ),
      value: Type.Optional(Type.Unknown({ description: "New value for set action" })),
      scope: Type.Optional(
        Type.Union([Type.Literal("run"), Type.Literal("global")], {
          description: "Scope: 'run' (default) or 'global' process-scoped config",
        }),
      ),
    }),
    execute: (_toolCallId, params) => {
      const action = params.action as string | undefined;
      if (!action) {
        return errorResult("'action' parameter is required (get, set, list, reset).");
      }

      const key = params.key as string | undefined;
      const value = params.value;
      const scope = (params.scope as string) ?? "run";

      switch (action) {
        case "get":
          if (!key) {
            const merged: Record<string, unknown> = {};
            for (const configKey of listConfigKeys()) {
              merged[configKey] = getConfigValue(configKey);
            }
            return jsonResult(merged);
          }
          if (!isValidConfigKey(key)) {
            return errorResult(`Error: Unknown config key '${key}'.`);
          }
          return jsonResult({ key, value: getConfigValue(key) });
        case "set":
          if (!key) {
            return errorResult("Error: 'key' parameter is required for set action.");
          }
          if (value === undefined) {
            return errorResult("Error: 'value' parameter is required for set action.");
          }
          if (!isValidConfigKey(key)) {
            return errorResult(`Error: Unknown config key '${key}'.`);
          }
          {
            const validationError = validateConfigValue(key, value);
            if (validationError) {
              return errorResult(`Error: ${validationError}`);
            }
          }
          setConfigValue(key, value, scope);
          return ok(`Set '${key}' to ${JSON.stringify(value)} (scope: ${scope}).`);
        case "list": {
          const entries: Record<string, { current: unknown; default: unknown }> = {};
          for (const configKey of listConfigKeys()) {
            entries[configKey] = {
              current: getConfigValue(configKey),
              default: getConfigDefault(configKey),
            };
          }
          for (const [configKey, configValue] of getRunScopedConfigEntries()) {
            if (!entries[configKey]) {
              entries[configKey] = { current: configValue, default: undefined };
            }
          }
          return jsonResult(entries);
        }
        case "reset":
          resetConfigValue(key);
          return ok(key ? `Reset '${key}' to default.` : "Reset all config to defaults.");
        default:
          return errorResult(`Error: Unknown action '${action}'. Use get, set, list, or reset.`);
      }
    },
  };
}
