import { describe, expect, it } from "vitest";
import { resolveCliLoggerConfig } from "./loggingConfig.js";

describe("resolveCliLoggerConfig", () => {
  it("uses CLI logging flags without mutating ADAPTERS env vars", () => {
    const env: NodeJS.ProcessEnv = {};

    const config = resolveCliLoggerConfig({
      debug: true,
      logLevel: "warn",
      logFile: "/tmp/adapters.log",
    }, env);

    expect(config).toEqual({ level: "warn", logFile: "/tmp/adapters.log" });
    expect(env.AGENT_MUX_LOG_LEVEL).toBeUndefined();
    expect(env.AGENT_MUX_LOG_FILE).toBeUndefined();
    expect(env.AGENT_MUX_OBSERVABILITY_MODE).toBeUndefined();
  });

  it("falls back to startup env as input when flags are absent", () => {
    expect(resolveCliLoggerConfig({}, {
      AGENT_MUX_LOG_LEVEL: "error",
      AGENT_MUX_LOG_FILE: "/tmp/from-env.log",
    })).toEqual({ level: "error", logFile: "/tmp/from-env.log" });
  });
});
