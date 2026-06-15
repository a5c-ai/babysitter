import { describe, expect, it } from "vitest";
import { CONFIG_ENV_VARS } from "./defaults";
import {
  ENV_VAR_CONTRACTS,
  configKeyToEnvVar,
  createScopedRuntimeConfigState,
} from "./envContract";

describe("env contract registry", () => {
  it("documents process-boundary env contracts centrally", () => {
    expect(configKeyToEnvVar("logLevel")).toBe(CONFIG_ENV_VARS.LOG_LEVEL);
    expect(ENV_VAR_CONTRACTS.azureOpenAi.baseUrl.name).toBe("AZURE_OPENAI_BASE_URL");
    expect(ENV_VAR_CONTRACTS.agentMux.observabilityMode.name).toBe("AGENT_MUX_OBSERVABILITY_MODE");
  });

  it("keeps global runtime config scoped instead of mutating process.env", () => {
    const previous = process.env.BABYSITTER_LOG_LEVEL;
    delete process.env.BABYSITTER_LOG_LEVEL;
    try {
      const state = createScopedRuntimeConfigState({
        configKeyTypes: { logLevel: "string" },
      });

      state.setConfigValue("logLevel", "debug", "global");

      expect(process.env.BABYSITTER_LOG_LEVEL).toBeUndefined();
      expect(state.getConfigValue("logLevel")).toBe("debug");
    } finally {
      if (previous === undefined) delete process.env.BABYSITTER_LOG_LEVEL;
      else process.env.BABYSITTER_LOG_LEVEL = previous;
    }
  });
});
