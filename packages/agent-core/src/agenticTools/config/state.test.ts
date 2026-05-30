import { afterEach, describe, expect, it } from "vitest";
import {
  getConfigValue,
  resetConfigValue,
  resetRunScopedConfig,
  setConfigValue,
} from "./state";

describe("agent-core runtime config state", () => {
  afterEach(() => {
    resetConfigValue();
    delete process.env.BABYSITTER_MODEL;
  });

  it("keeps global config overrides out of process.env", () => {
    setConfigValue("model", "gpt-test", "global");

    expect(getConfigValue("model")).toBe("gpt-test");
    expect(process.env.BABYSITTER_MODEL).toBeUndefined();
  });

  it("lets run-scoped config override process-local global config", () => {
    setConfigValue("model", "gpt-global", "global");
    setConfigValue("model", "gpt-run", "run");

    expect(getConfigValue("model")).toBe("gpt-run");

    resetRunScopedConfig();

    expect(getConfigValue("model")).toBe("gpt-global");
  });
});
