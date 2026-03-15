import { beforeEach, describe, expect, it, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDiscoveryTools } from "../../tools/discovery";

vi.mock("../../../cli/commands/health", () => ({
  runHealthCheck: vi.fn(),
}));

vi.mock("../../../cli/commands/configure", () => ({
  configureShow: vi.fn(),
}));

vi.mock("../../../cli/commands/skill", () => ({
  discoverSkillsInternal: vi.fn(),
}));

import { runHealthCheck } from "../../../cli/commands/health";
import { configureShow } from "../../../cli/commands/configure";
import { discoverSkillsInternal } from "../../../cli/commands/skill";

const mockedRunHealthCheck = vi.mocked(runHealthCheck);
const mockedConfigureShow = vi.mocked(configureShow);
const mockedDiscoverSkillsInternal = vi.mocked(discoverSkillsInternal);

type ToolHandler = (args: Record<string, unknown>) => Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}>;

function getToolHandler(server: McpServer, name: string): ToolHandler {
  const tools = (server as unknown as { _registeredTools: Record<string, { handler: ToolHandler }> })._registeredTools;
  const tool = tools[name];
  if (!tool) throw new Error(`Tool ${name} not found`);
  return tool.handler;
}

function parseResult(result: { content: Array<{ type: string; text: string }> }): unknown {
  return JSON.parse(result.content[0].text);
}

let server: McpServer;

beforeEach(() => {
  vi.clearAllMocks();
  server = new McpServer({ name: "test", version: "0.0.0" });
  registerDiscoveryTools(server);
});

describe("health", () => {
  it("returns healthy status", async () => {
    mockedRunHealthCheck.mockResolvedValue({
      status: "healthy",
      summary: "All systems operational",
      checks: [
        { name: "sdk", status: "pass", message: "SDK found" },
      ],
      nextSteps: [],
    } as Awaited<ReturnType<typeof runHealthCheck>>);

    const handler = getToolHandler(server, "health");
    const result = await handler({});

    expect(result.isError).toBeUndefined();
    const data = parseResult(result) as { status: string; summary: string };
    expect(data.status).toBe("healthy");
    expect(data.summary).toBe("All systems operational");
  });

  it("returns unhealthy status", async () => {
    mockedRunHealthCheck.mockResolvedValue({
      status: "unhealthy",
      summary: "Missing configuration",
      checks: [
        { name: "config", status: "fail", message: "No config found" },
      ],
      nextSteps: ["Run babysitter configure"],
    } as Awaited<ReturnType<typeof runHealthCheck>>);

    const handler = getToolHandler(server, "health");
    const result = await handler({});

    const data = parseResult(result) as { status: string; nextSteps: string[] };
    expect(data.status).toBe("unhealthy");
    expect(data.nextSteps).toContain("Run babysitter configure");
  });

  it("returns error when health check throws", async () => {
    mockedRunHealthCheck.mockRejectedValue(new Error("Health check failed"));

    const handler = getToolHandler(server, "health");
    const result = await handler({});

    expect(result.isError).toBe(true);
    const data = parseResult(result) as { error: string };
    expect(data.error).toBe("Health check failed");
  });
});

describe("configure_show", () => {
  it("returns current configuration", async () => {
    mockedConfigureShow.mockReturnValue({
      values: {
        runsDir: ".a5c/runs",
        maxIterations: 256,
        qualityThreshold: 80,
      },
      timestamp: "2026-03-15T12:00:00Z",
    } as ReturnType<typeof configureShow>);

    const handler = getToolHandler(server, "configure_show");
    const result = await handler({});

    expect(result.isError).toBeUndefined();
    const data = parseResult(result) as { values: Record<string, unknown>; timestamp: string };
    expect(data.values.runsDir).toBe(".a5c/runs");
    expect(data.values.maxIterations).toBe(256);
    expect(data.timestamp).toBe("2026-03-15T12:00:00Z");
  });

  it("returns error when configure throws", async () => {
    mockedConfigureShow.mockImplementation(() => {
      throw new Error("Config parse error");
    });

    const handler = getToolHandler(server, "configure_show");
    const result = await handler({});

    expect(result.isError).toBe(true);
    const data = parseResult(result) as { error: string };
    expect(data.error).toBe("Config parse error");
  });
});

describe("skill_discover", () => {
  it("returns discovered skills, agents, and processes", async () => {
    mockedDiscoverSkillsInternal.mockResolvedValue({
      skills: [{ name: "babysit", path: "/plugins/babysitter/skills/babysit" }],
      agents: [{ name: "code-reviewer", path: "/agents/code-reviewer.md" }],
      processes: [{ name: "tdd", path: "/processes/tdd.js" }],
      summary: "Found 1 skill, 1 agent, 1 process",
      cached: false,
    } as Awaited<ReturnType<typeof discoverSkillsInternal>>);

    const handler = getToolHandler(server, "skill_discover");
    const result = await handler({
      pluginRoot: "/plugins",
    });

    expect(result.isError).toBeUndefined();
    const data = parseResult(result) as {
      skills: unknown[];
      agents: unknown[];
      processes: unknown[];
      summary: string;
    };
    expect(data.skills).toHaveLength(1);
    expect(data.agents).toHaveLength(1);
    expect(data.processes).toHaveLength(1);
    expect(data.summary).toContain("Found");
  });

  it("returns error when discovery fails", async () => {
    mockedDiscoverSkillsInternal.mockRejectedValue(new Error("Plugin root not found"));

    const handler = getToolHandler(server, "skill_discover");
    const result = await handler({
      pluginRoot: "/nonexistent",
    });

    expect(result.isError).toBe(true);
    const data = parseResult(result) as { error: string };
    expect(data.error).toBe("Plugin root not found");
  });
});
