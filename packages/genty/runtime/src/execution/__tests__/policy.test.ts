import { describe, expect, it } from "vitest";
import {
  resolveExecutionEnvironment,
  validateFilesystemMounts,
  validateLocalExecutionPolicy,
} from "../policy";
import type { ExecutionPolicy, LocalExecutionConfig } from "../types";

describe("ExecutionPolicy environment", () => {
  it("does not inherit parent env by default", () => {
    const env = resolveExecutionEnvironment(
      undefined,
      undefined,
      { SECRET: "leaked", PATH: "/bin" },
    );

    expect(env).toEqual({});
  });

  it("passes explicit env values and allowlisted parent env only", () => {
    const policy: ExecutionPolicy = {
      environment: {
        allow: ["PATH"],
        values: { SCOPED_TOKEN: "scoped" },
        deny: ["DENIED"],
      },
    };

    const env = resolveExecutionEnvironment(
      { DIRECT: "direct", DENIED: "remove-me" },
      policy,
      { PATH: "/bin", SECRET: "leaked", DENIED: "parent-denied" },
    );

    expect(env).toEqual({
      PATH: "/bin",
      DIRECT: "direct",
      SCOPED_TOKEN: "scoped",
    });
  });

  it("requires an explicit legacy opt-in to inherit all parent env", () => {
    const env = resolveExecutionEnvironment(
      { DIRECT: "direct" },
      { environment: { inheritParentEnv: true } },
      { SECRET: "legacy", PATH: "/bin" },
    );

    expect(env).toMatchObject({
      SECRET: "legacy",
      PATH: "/bin",
      DIRECT: "direct",
    });
  });
});

describe("ExecutionPolicy local validation", () => {
  it("fails fast for requested local network isolation", () => {
    const config: LocalExecutionConfig = {
      mode: "local",
      cwd: "/tmp",
      policy: {
        network: { mode: "none" },
      },
    };

    expect(() => validateLocalExecutionPolicy(config)).toThrow(
      /Local executor cannot enforce network policy/,
    );
  });

  it("fails fast for requested local kernel sandbox guarantees", () => {
    const config: LocalExecutionConfig = {
      mode: "local",
      cwd: "/tmp",
      policy: {
        sandbox: {
          requireNamespaces: true,
          requireChroot: true,
          requireSeccomp: true,
        },
      },
    };

    expect(() => validateLocalExecutionPolicy(config)).toThrow(
      /Local executor cannot enforce sandbox guarantees/,
    );
  });

  it("allows unsupported local guarantees only with explicit unsafe opt-in", () => {
    const config: LocalExecutionConfig = {
      mode: "local",
      cwd: "/tmp",
      policy: {
        sandbox: {
          requireNamespaces: true,
          allowUnsupportedLocal: true,
        },
      },
    };

    expect(() => validateLocalExecutionPolicy(config)).not.toThrow();
  });
});

describe("ExecutionPolicy filesystem validation", () => {
  it("rejects mounts outside allowed roots", () => {
    expect(() =>
      validateFilesystemMounts({
        filesystem: {
          allowedRoots: ["/workspace"],
          mounts: [
            {
              hostPath: "/etc",
              containerPath: "/mnt/etc",
            },
          ],
        },
      }),
    ).toThrow(/outside the configured filesystem allowed roots/);
  });
});
