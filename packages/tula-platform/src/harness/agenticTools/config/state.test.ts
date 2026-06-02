import { describe, expect, it } from "vitest";
import { getConfigValue, resetConfigValue, setConfigValue } from "./state";

describe("agent-platform config state", () => {
  it("does not write global config scope into process.env", () => {
    const previous = process.env.BABYSITTER_LOG_LEVEL;
    delete process.env.BABYSITTER_LOG_LEVEL;
    try {
      resetConfigValue();

      setConfigValue("logLevel", "debug", "global");

      expect(process.env.BABYSITTER_LOG_LEVEL).toBeUndefined();
      expect(getConfigValue("logLevel")).toBe("debug");
    } finally {
      resetConfigValue();
      if (previous === undefined) delete process.env.BABYSITTER_LOG_LEVEL;
      else process.env.BABYSITTER_LOG_LEVEL = previous;
    }
  });
});
