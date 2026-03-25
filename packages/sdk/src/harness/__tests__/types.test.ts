/**
 * Type compilation tests for harness type definitions.
 *
 * These tests verify that the new types (HarnessCapability, HarnessDiscoveryResult,
 * HarnessInvokeOptions, HarnessInvokeResult, PiSessionOptions, PiPromptResult)
 * and the extended HarnessAdapter interface compile and can be used correctly.
 */

import { describe, it, expect } from "vitest";
import {
  HarnessCapability,
  type HarnessAdapter,
  type HarnessDiscoveryResult,
  type HarnessInvokeOptions,
  type HarnessInvokeResult,
  type HarnessInstallOptions,
  type HarnessInstallResult,
  type PiSessionOptions,
  type PiPromptResult,
  type SessionBindOptions,
  type SessionBindResult,
  type HookHandlerArgs,
} from "../types";

describe("HarnessCapability enum", () => {
  it("has the expected string values", () => {
    expect(HarnessCapability.Programmatic).toBe("programmatic");
    expect(HarnessCapability.SessionBinding).toBe("session-binding");
    expect(HarnessCapability.StopHook).toBe("stop-hook");
    expect(HarnessCapability.Mcp).toBe("mcp");
    expect(HarnessCapability.HeadlessPrompt).toBe("headless-prompt");
  });

  it("has exactly 5 members", () => {
    const values = Object.values(HarnessCapability);
    expect(values).toHaveLength(5);
  });
});

describe("HarnessDiscoveryResult", () => {
  it("can be constructed with all required fields", () => {
    const result: HarnessDiscoveryResult = {
      name: "claude-code",
      installed: true,
      cliCommand: "claude",
      configFound: true,
      capabilities: [HarnessCapability.Programmatic, HarnessCapability.Mcp],
      platform: "win32",
    };

    expect(result.name).toBe("claude-code");
    expect(result.installed).toBe(true);
    expect(result.capabilities).toContain(HarnessCapability.Programmatic);
  });

  it("accepts optional version and cliPath fields", () => {
    const result: HarnessDiscoveryResult = {
      name: "codex",
      installed: true,
      version: "1.2.3",
      cliPath: "/usr/local/bin/codex",
      cliCommand: "codex",
      configFound: false,
      capabilities: [],
      platform: "linux",
    };

    expect(result.version).toBe("1.2.3");
    expect(result.cliPath).toBe("/usr/local/bin/codex");
  });
});

describe("HarnessInvokeOptions", () => {
  it("requires only prompt", () => {
    const opts: HarnessInvokeOptions = {
      prompt: "Hello, world",
    };

    expect(opts.prompt).toBe("Hello, world");
    expect(opts.workspace).toBeUndefined();
    expect(opts.model).toBeUndefined();
    expect(opts.timeout).toBeUndefined();
    expect(opts.rpc).toBeUndefined();
    expect(opts.env).toBeUndefined();
  });

  it("accepts all optional fields", () => {
    const opts: HarnessInvokeOptions = {
      prompt: "Fix the bug",
      workspace: "/home/user/project",
      model: "gpt-4",
      timeout: 30000,
      rpc: true,
      env: { NODE_ENV: "test" },
    };

    expect(opts.env).toEqual({ NODE_ENV: "test" });
  });
});

describe("HarnessInvokeResult", () => {
  it("can be constructed with all required fields", () => {
    const result: HarnessInvokeResult = {
      success: true,
      output: "Done",
      exitCode: 0,
      duration: 1234,
      harness: "claude-code",
    };

    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(0);
  });
});

describe("PiSessionOptions", () => {
  it("all fields are optional", () => {
    const opts: PiSessionOptions = {};
    expect(opts.workspace).toBeUndefined();
  });

  it("accepts all fields", () => {
    const opts: PiSessionOptions = {
      workspace: "/tmp/pi-workspace",
      model: "pi-model",
      timeout: 60000,
      env: { PI_KEY: "abc" },
      cliPath: "/usr/local/bin/pi",
    };

    expect(opts.cliPath).toBe("/usr/local/bin/pi");
  });
});

describe("PiPromptResult", () => {
  it("can be constructed with all required fields", () => {
    const result: PiPromptResult = {
      output: "Pi output",
      exitCode: 0,
      duration: 500,
      success: true,
    };

    expect(result.success).toBe(true);
    expect(result.duration).toBe(500);
  });
});

describe("HarnessAdapter extended interface", () => {
  it("allows an adapter with the new optional methods", () => {
    const installOptions: HarnessInstallOptions = {
      json: false,
      dryRun: true,
      verbose: false,
      workspace: "/tmp/workspace",
    };
    const installResult: HarnessInstallResult = {
      harness: "test-harness",
      dryRun: true,
      summary: "Install test harness",
    };

    // Minimal adapter satisfying all required methods plus new optional ones
    const adapter: HarnessAdapter = {
      name: "test-harness",
      isActive: () => true,
      resolveSessionId: (_parsed: { sessionId?: string }) => "session-123",
      resolveStateDir: (_args: { stateDir?: string; pluginRoot?: string }) => "/tmp/state",
      resolvePluginRoot: (_args: { pluginRoot?: string }) => "/tmp/plugin",
      bindSession: async (_opts: SessionBindOptions): Promise<SessionBindResult> => ({
        harness: "test-harness",
        sessionId: "session-123",
      }),
      handleStopHook: async (_args: HookHandlerArgs): Promise<number> => 0,
      handleSessionStartHook: async (_args: HookHandlerArgs): Promise<number> => 0,
      findHookDispatcherPath: (_startCwd: string) => null,

      // New optional methods
      isCliInstalled: async () => true,
      getCliInfo: async () => ({
        command: "test-harness",
        version: "2.0.0",
        path: "/usr/bin/test-harness",
      }),
      getCapabilities: () => [
        HarnessCapability.Programmatic,
        HarnessCapability.SessionBinding,
      ],
      installHarness: async () => installResult,
      installPlugin: async () => installResult,
    };

    expect(adapter.name).toBe("test-harness");
    expect(adapter.isCliInstalled).toBeDefined();
    expect(adapter.getCliInfo).toBeDefined();
    expect(adapter.getCapabilities).toBeDefined();
    expect(adapter.installHarness).toBeDefined();
    expect(adapter.installPlugin).toBeDefined();
    void installOptions;
  });

  it("allows an adapter without the new optional methods", () => {
    const adapter: HarnessAdapter = {
      name: "minimal-harness",
      isActive: () => false,
      resolveSessionId: () => undefined,
      resolveStateDir: () => undefined,
      resolvePluginRoot: () => undefined,
      bindSession: async () => ({ harness: "minimal-harness", sessionId: "" }),
      handleStopHook: async () => 1,
      handleSessionStartHook: async () => 0,
      findHookDispatcherPath: () => null,
    };

    expect(adapter.isCliInstalled).toBeUndefined();
    expect(adapter.getCliInfo).toBeUndefined();
    expect(adapter.getCapabilities).toBeUndefined();
  });

  it("getCapabilities returns HarnessCapability array", async () => {
    const adapter: HarnessAdapter = {
      name: "capable-harness",
      isActive: () => true,
      resolveSessionId: () => undefined,
      resolveStateDir: () => undefined,
      resolvePluginRoot: () => undefined,
      bindSession: async () => ({ harness: "capable-harness", sessionId: "" }),
      handleStopHook: async () => 0,
      handleSessionStartHook: async () => 0,
      findHookDispatcherPath: () => null,
      getCapabilities: () => [
        HarnessCapability.Mcp,
        HarnessCapability.HeadlessPrompt,
        HarnessCapability.StopHook,
      ],
    };

    const caps = adapter.getCapabilities!();
    expect(caps).toContain(HarnessCapability.Mcp);
    expect(caps).toContain(HarnessCapability.HeadlessPrompt);
    expect(caps).toContain(HarnessCapability.StopHook);
    expect(caps).toHaveLength(3);
  });

  it("getCliInfo returns expected shape", async () => {
    const adapter: HarnessAdapter = {
      name: "info-harness",
      isActive: () => true,
      resolveSessionId: () => undefined,
      resolveStateDir: () => undefined,
      resolvePluginRoot: () => undefined,
      bindSession: async () => ({ harness: "info-harness", sessionId: "" }),
      handleStopHook: async () => 0,
      handleSessionStartHook: async () => 0,
      findHookDispatcherPath: () => null,
      getCliInfo: async () => ({ command: "info-cli" }),
    };

    const info = await adapter.getCliInfo!();
    expect(info.command).toBe("info-cli");
    expect(info.version).toBeUndefined();
    expect(info.path).toBeUndefined();
  });
});
