import { describe, expect, it, vi } from "vitest";
import { ToolRegistry } from "@a5c-ai/tool-mux";
import { McpToolRegistry } from "./toolRegistry";

function createManager() {
  return {
    listConnections: vi.fn(() => [
      { name: "docs", status: "connected" },
      { name: "web", status: "connected" },
    ]),
    listTools: vi.fn(async (serverName: string) => [
      {
        name: "search",
        description: `${serverName} search`,
        inputSchema: { type: "object", title: serverName },
        serverName,
      },
    ]),
  };
}

describe("McpToolRegistry", () => {
  it("backs refresh/search/qualified lookup with the unified ToolRegistry", async () => {
    const manager = createManager();
    const registry = new McpToolRegistry(manager as never);

    await registry.refreshAll();

    expect(registry.getToolRegistry()).toBeInstanceOf(ToolRegistry);
    expect(registry.getToolRegistry().get("search", { source: "mcp", sourceQualifier: "docs" })?.description)
      .toBe("docs search");
    expect(registry.getToolRegistry().get("search", { source: "mcp", sourceQualifier: "web" })?.description)
      .toBe("web search");
    expect(registry.searchTools("search").map((tool) => tool.serverName).sort()).toEqual(["docs", "web"]);
    expect(registry.getToolByQualifiedName("web:search")?.description).toBe("web search");
  });
});
