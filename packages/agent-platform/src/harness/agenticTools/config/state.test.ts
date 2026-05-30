import { afterEach, describe, expect, it } from "vitest";
import {
  getConfigValue,
  resetConfigValue,
  setConfigValue,
} from "./state";

describe("agent-platform config state", () => {
  afterEach(() => {
    resetConfigValue();
    delete process.env.BABYSITTER_LOG_LEVEL;
  });

  it("stores global config without mutating process.env", () => {
    delete process.env.BABYSITTER_LOG_LEVEL;
    setConfigValue("logLevel", "debug", "global");

    expect(getConfigValue("logLevel")).toBe("debug");
    expect(process.env.BABYSITTER_LOG_LEVEL).toBeUndefined();
  });
});
