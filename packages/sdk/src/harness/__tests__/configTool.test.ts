/**
 * TDD RED-phase tests for the config agentic tool (GAP-TOOLS-033).
 *
 * Tests the new `config` tool being added to agenticTools:
 *   - action: 'get' | 'set' | 'list' | 'reset'
 *   - key: optional config key path (dot notation for nested)
 *   - value: optional value for set action
 *   - scope: 'run' | 'global' (default: 'run')
 *
 * Supports reading/modifying babysitter config at runtime including
 * model, provider, compression, timeouts, and standard BabysitterConfig keys.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createAgenticToolDefinitions,
  resetRunScopedConfig,
  type CustomToolDefinition,
} from "../agenticTools";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_WORKSPACE = "/tmp/test-workspace";

function getConfigTool(): CustomToolDefinition {
  const tools = createAgenticToolDefinitions({
    workspace: TEST_WORKSPACE,
    interactive: false,
  });
  const tool = tools.find((t) => t.name === "config");
  if (!tool) throw new Error("config tool not found in agentic tool definitions");
  return tool;
}

function getResultText(result: {
  content: Array<{ type: string; text: string }>;
}): string {
  return result.content[0]?.text ?? "";
}

function parseResultJson(result: {
  content: Array<{ type: string; text: string }>;
}): unknown {
  return JSON.parse(getResultText(result));
}

async function exec(
  tool: CustomToolDefinition,
  params: Record<string, unknown>,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  return (await tool.execute("test-call", params)) as {
    content: Array<{ type: string; text: string }>;
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let configTool: CustomToolDefinition;
const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  configTool = getConfigTool();
  // Save env vars we might modify
  savedEnv.BABYSITTER_MAX_ITERATIONS = process.env.BABYSITTER_MAX_ITERATIONS;
  savedEnv.BABYSITTER_LOG_LEVEL = process.env.BABYSITTER_LOG_LEVEL;
});

afterEach(() => {
  // Restore env vars
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) {
      delete process.env[k];
    } else {
      process.env[k] = v;
    }
  }
  // Reset run-scoped config via exported function for clean isolation
  resetRunScopedConfig();
});

// ---------------------------------------------------------------------------
// 1. Tool definition
// ---------------------------------------------------------------------------

describe("GAP-TOOLS-033: config agentic tool", () => {
  describe("tool definition", () => {
    it("exists in createAgenticToolDefinitions output", () => {
      const tools = createAgenticToolDefinitions({
        workspace: TEST_WORKSPACE,
        interactive: false,
      });
      const names = tools.map((t) => t.name);
      expect(names).toContain("config");
    });

    it("has correct name, label, and description", () => {
      expect(configTool.name).toBe("config");
      expect(configTool.label).toBeDefined();
      expect(configTool.description).toContain("config");
    });

    it("has action parameter in schema", () => {
      const props = configTool.parameters.properties;
      expect(props).toHaveProperty("action");
    });

    it("has optional key, value, and scope parameters", () => {
      const props = configTool.parameters.properties;
      expect(props).toHaveProperty("key");
      expect(props).toHaveProperty("value");
      expect(props).toHaveProperty("scope");
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Get action
  // ---------------------------------------------------------------------------

  describe("get action", () => {
    it("returns full config when no key specified", async () => {
      const result = await exec(configTool, { action: "get" });
      const data = parseResultJson(result) as Record<string, unknown>;
      expect(data).toHaveProperty("maxIterations");
      expect(data).toHaveProperty("timeout");
      expect(data).toHaveProperty("logLevel");
    });

    it("returns specific value when key specified", async () => {
      const result = await exec(configTool, { action: "get", key: "maxIterations" });
      const data = parseResultJson(result) as Record<string, unknown>;
      expect(data).toHaveProperty("value");
      expect(typeof (data as { value: number }).value).toBe("number");
    });

    it("returns error for unknown key", async () => {
      const result = await exec(configTool, { action: "get", key: "nonExistentKey" });
      const text = getResultText(result);
      expect(text).toContain("Error");
    });

    it("returns model setting", async () => {
      const result = await exec(configTool, { action: "get", key: "model" });
      const text = getResultText(result);
      // Should not error - model is a valid extended key
      expect(text).not.toContain("Error: Unknown");
    });

    it("returns provider setting", async () => {
      const result = await exec(configTool, { action: "get", key: "provider" });
      const text = getResultText(result);
      expect(text).not.toContain("Error: Unknown");
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Set action
  // ---------------------------------------------------------------------------

  describe("set action", () => {
    it("sets a valid config key and returns confirmation", async () => {
      const result = await exec(configTool, {
        action: "set",
        key: "maxIterations",
        value: 500,
      });
      const text = getResultText(result);
      expect(text.toLowerCase()).not.toContain("error");

      // Verify via get
      const getResult = await exec(configTool, { action: "get", key: "maxIterations" });
      const data = parseResultJson(getResult) as { value: number };
      expect(data.value).toBe(500);
    });

    it("rejects unknown keys with error", async () => {
      const result = await exec(configTool, {
        action: "set",
        key: "totallyFakeKey",
        value: "whatever",
      });
      const text = getResultText(result);
      expect(text).toContain("Error");
    });

    it("sets model preference", async () => {
      const result = await exec(configTool, {
        action: "set",
        key: "model",
        value: "claude-sonnet-4-5-20250514",
      });
      const text = getResultText(result);
      expect(text.toLowerCase()).not.toContain("error");

      const getResult = await exec(configTool, { action: "get", key: "model" });
      const data = parseResultJson(getResult) as { value: string };
      expect(data.value).toBe("claude-sonnet-4-5-20250514");
    });

    it("sets provider preference", async () => {
      const result = await exec(configTool, {
        action: "set",
        key: "provider",
        value: "anthropic",
      });
      const text = getResultText(result);
      expect(text.toLowerCase()).not.toContain("error");

      const getResult = await exec(configTool, { action: "get", key: "provider" });
      const data = parseResultJson(getResult) as { value: string };
      expect(data.value).toBe("anthropic");
    });

    it("sets compression.enabled toggle", async () => {
      const result = await exec(configTool, {
        action: "set",
        key: "compression.enabled",
        value: false,
      });
      const text = getResultText(result);
      expect(text.toLowerCase()).not.toContain("error");

      const getResult = await exec(configTool, {
        action: "get",
        key: "compression.enabled",
      });
      const data = parseResultJson(getResult) as { value: boolean };
      expect(data.value).toBe(false);
    });

    it("sets nested compression layer toggle", async () => {
      const result = await exec(configTool, {
        action: "set",
        key: "compression.layers.userPromptHook.enabled",
        value: false,
      });
      const text = getResultText(result);
      expect(text.toLowerCase()).not.toContain("error");
    });

    it("sets timeout override", async () => {
      const result = await exec(configTool, {
        action: "set",
        key: "timeout",
        value: 60000,
      });
      const text = getResultText(result);
      expect(text.toLowerCase()).not.toContain("error");

      const getResult = await exec(configTool, { action: "get", key: "timeout" });
      const data = parseResultJson(getResult) as { value: number };
      expect(data.value).toBe(60000);
    });

    it("sets logLevel", async () => {
      const result = await exec(configTool, {
        action: "set",
        key: "logLevel",
        value: "debug",
      });
      const text = getResultText(result);
      expect(text.toLowerCase()).not.toContain("error");

      const getResult = await exec(configTool, { action: "get", key: "logLevel" });
      const data = parseResultJson(getResult) as { value: string };
      expect(data.value).toBe("debug");
    });

    it("requires key parameter", async () => {
      const result = await exec(configTool, { action: "set", value: 42 });
      const text = getResultText(result);
      expect(text).toContain("Error");
    });

    it("requires value parameter", async () => {
      const result = await exec(configTool, { action: "set", key: "timeout" });
      const text = getResultText(result);
      expect(text).toContain("Error");
    });
  });

  // ---------------------------------------------------------------------------
  // 4. List action
  // ---------------------------------------------------------------------------

  describe("list action", () => {
    it("returns all config keys with current values and defaults", async () => {
      const result = await exec(configTool, { action: "list" });
      const data = parseResultJson(result) as Record<string, unknown>;
      // Should have standard config keys
      expect(data).toHaveProperty("maxIterations");
      expect(data).toHaveProperty("timeout");
      expect(data).toHaveProperty("logLevel");
      // Should have extended keys
      expect(data).toHaveProperty("model");
      expect(data).toHaveProperty("provider");
    });

    it("each key has current and default fields", async () => {
      const result = await exec(configTool, { action: "list" });
      const data = parseResultJson(result) as Record<
        string,
        { current: unknown; default: unknown }
      >;
      const entry = data["maxIterations"];
      expect(entry).toHaveProperty("current");
      expect(entry).toHaveProperty("default");
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Reset action
  // ---------------------------------------------------------------------------

  describe("reset action", () => {
    it("resets a specific key to default", async () => {
      // Set a value first
      await exec(configTool, { action: "set", key: "maxIterations", value: 999 });
      // Verify it's set
      let getResult = await exec(configTool, { action: "get", key: "maxIterations" });
      let data = parseResultJson(getResult) as { value: number };
      expect(data.value).toBe(999);

      // Reset
      const result = await exec(configTool, { action: "reset", key: "maxIterations" });
      const text = getResultText(result);
      expect(text.toLowerCase()).not.toContain("error");

      // Verify it's back to default
      getResult = await exec(configTool, { action: "get", key: "maxIterations" });
      data = parseResultJson(getResult) as { value: number };
      expect(data.value).toBe(256); // DEFAULTS.maxIterations
    });

    it("resets all config when no key specified", async () => {
      // Set some values
      await exec(configTool, { action: "set", key: "maxIterations", value: 999 });
      await exec(configTool, { action: "set", key: "model", value: "test-model" });

      // Reset all
      const result = await exec(configTool, { action: "reset" });
      const text = getResultText(result);
      expect(text.toLowerCase()).not.toContain("error");

      // Verify model is reset
      const getResult = await exec(configTool, { action: "get", key: "model" });
      const data = parseResultJson(getResult) as { value: unknown };
      expect(data.value).not.toBe("test-model");
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Scope tests
  // ---------------------------------------------------------------------------

  describe("run-scoped vs global", () => {
    it("defaults to run scope", async () => {
      await exec(configTool, {
        action: "set",
        key: "maxIterations",
        value: 777,
      });
      // Should NOT have modified env var
      expect(process.env.BABYSITTER_MAX_ITERATIONS).not.toBe("777");
    });

    it("global scope sets environment variable", async () => {
      await exec(configTool, {
        action: "set",
        key: "logLevel",
        value: "debug",
        scope: "global",
      });
      expect(process.env.BABYSITTER_LOG_LEVEL).toBe("debug");
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Error handling
  // ---------------------------------------------------------------------------

  describe("error handling", () => {
    it("returns error for invalid action", async () => {
      const result = await exec(configTool, { action: "invalid-action" });
      const text = getResultText(result);
      expect(text).toContain("Error");
    });

    it("returns error when action is missing", async () => {
      const result = await exec(configTool, {});
      const text = getResultText(result);
      expect(text).toContain("Error");
    });
  });

  // ---------------------------------------------------------------------------
  // 8. Type validation
  // ---------------------------------------------------------------------------

  describe("type validation", () => {
    it("rejects string value for numeric key", async () => {
      const result = await exec(configTool, {
        action: "set",
        key: "timeout",
        value: "not-a-number",
      });
      const text = getResultText(result);
      expect(text).toContain("Error");
      expect(text).toContain("number");
    });

    it("rejects number value for string key", async () => {
      const result = await exec(configTool, {
        action: "set",
        key: "model",
        value: 42,
      });
      const text = getResultText(result);
      expect(text).toContain("Error");
      expect(text).toContain("string");
    });

    it("rejects negative timeout", async () => {
      const result = await exec(configTool, {
        action: "set",
        key: "timeout",
        value: -100,
      });
      const text = getResultText(result);
      expect(text).toContain("Error");
      expect(text).toContain("positive");
    });
  });

  // ---------------------------------------------------------------------------
  // 9. Breakpoint config
  // ---------------------------------------------------------------------------

  describe("breakpoint config", () => {
    it("can set breakpoint.autoApproveAfterN", async () => {
      const result = await exec(configTool, {
        action: "set",
        key: "breakpoint.autoApproveAfterN",
        value: 3,
      });
      const text = getResultText(result);
      expect(text.toLowerCase()).not.toContain("error");

      const getResult = await exec(configTool, {
        action: "get",
        key: "breakpoint.autoApproveAfterN",
      });
      const data = parseResultJson(getResult) as { value: number };
      expect(data.value).toBe(3);
    });

    it("can set breakpoint.presentAlwaysApprove", async () => {
      const result = await exec(configTool, {
        action: "set",
        key: "breakpoint.presentAlwaysApprove",
        value: false,
      });
      const text = getResultText(result);
      expect(text.toLowerCase()).not.toContain("error");
    });

    it("breakpoint keys appear in list after set", async () => {
      await exec(configTool, {
        action: "set",
        key: "breakpoint.autoApproveAfterN",
        value: 5,
      });
      const result = await exec(configTool, { action: "list" });
      const data = parseResultJson(result) as Record<string, unknown>;
      expect(data).toHaveProperty("breakpoint.autoApproveAfterN");
    });
  });

  // ---------------------------------------------------------------------------
  // 10. List reflects run-scoped changes
  // ---------------------------------------------------------------------------

  describe("list reflects run-scoped changes", () => {
    it("list shows updated value after set", async () => {
      await exec(configTool, {
        action: "set",
        key: "maxIterations",
        value: 512,
      });
      const result = await exec(configTool, { action: "list" });
      const data = parseResultJson(result) as Record<
        string,
        { current: unknown; default: unknown }
      >;
      expect(data["maxIterations"].current).toBe(512);
      expect(data["maxIterations"].default).toBe(256);
    });

    it("compression keys appear in list after set", async () => {
      await exec(configTool, {
        action: "set",
        key: "compression.enabled",
        value: false,
      });
      const result = await exec(configTool, { action: "list" });
      const data = parseResultJson(result) as Record<string, unknown>;
      expect(data).toHaveProperty("compression.enabled");
    });
  });

  // ---------------------------------------------------------------------------
  // 11. Test isolation via resetRunScopedConfig
  // ---------------------------------------------------------------------------

  describe("test isolation", () => {
    it("resetRunScopedConfig clears all run-scoped state", async () => {
      await exec(configTool, { action: "set", key: "model", value: "test-model" });
      resetRunScopedConfig();
      const result = await exec(configTool, { action: "get", key: "model" });
      const data = parseResultJson(result) as { value: unknown };
      expect(data.value).toBeUndefined();
    });
  });
});
