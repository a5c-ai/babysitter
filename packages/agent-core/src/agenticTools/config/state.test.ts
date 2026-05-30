import { afterEach, describe, expect, it } from "vitest";
import {
  getConfigValue,
  resetConfigValue,
  setConfigValue,
} from "./state";

describe("agent-core config state", () => {
  afterEach(() => {
    resetConfigValue();
    delete process.env.BABYSITTER_LOG_LEVEL;
    delete process.env.BABYSITTER_BREAKPOINT_AUTOAPPROVEAFTERN;
  });

  it("stores global config without mutating process.env", () => {
    delete process.env.BABYSITTER_LOG_LEVEL;
    setConfigValue("logLevel", "debug", "global");

    expect(getConfigValue("logLevel")).toBe("debug");
    expect(process.env.BABYSITTER_LOG_LEVEL).toBeUndefined();
  });

  it("keeps extended global config in scoped state instead of synthetic env vars", () => {
    delete process.env.BABYSITTER_BREAKPOINT_AUTOAPPROVEAFTERN;
    setConfigValue("breakpoint.autoApproveAfterN", 2, "global");

    expect(getConfigValue("breakpoint.autoApproveAfterN")).toBe(2);
    expect(process.env.BABYSITTER_BREAKPOINT_AUTOAPPROVEAFTERN).toBeUndefined();
  });
});
