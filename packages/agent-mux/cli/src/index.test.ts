import { describe, expect, it } from "vitest";
import { resolveCliLoggerConfig } from "./loggingConfig.js";

describe("resolveCliLoggerConfig", () => {
  it("uses CLI logging flags without mutating AMUX env vars", () => {
    const env: NodeJS.ProcessEnv = {};

    const config = resolveCliLoggerConfig({
      debug: true,
      logLevel: "warn",
      logFile: "/tmp/amux.log",
    }, env);

    expect(config).toEqual({ level: "warn", logFile: "/tmp/amux.log" });
    expect(env.AMUX_LOG_LEVEL).toBeUndefined();
    expect(env.AMUX_LOG_FILE).toBeUndefined();
    expect(env.AMUX_OBSERVABILITY_MODE).toBeUndefined();
  });

  it("falls back to startup env as input when flags are absent", () => {
    expect(resolveCliLoggerConfig({}, {
      AMUX_LOG_LEVEL: "error",
      AMUX_LOG_FILE: "/tmp/from-env.log",
    })).toEqual({ level: "error", logFile: "/tmp/from-env.log" });
  });
});
