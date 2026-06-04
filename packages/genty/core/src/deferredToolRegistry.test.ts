import { describe, expect, it, vi } from "vitest";
import { DeferredToolRegistry } from "./deferredToolRegistry";

describe("DeferredToolRegistry", () => {
  it("ranks exact and prefix matches ahead of looser description matches", () => {
    const registry = new DeferredToolRegistry();
    registry.registerTools([
      { name: "read", description: "Read a file from disk", source: "builtin" },
      { name: "reader", description: "Reader helper for files", source: "plugin", sourceQualifier: "plugin-a" },
      { name: "fetch", description: "Read remote content", source: "mcp", sourceQualifier: "web" },
    ]);

    expect(registry.searchTools("read").map((entry) => entry.name)).toEqual([
      "read",
      "reader",
      "fetch",
    ]);
  });

  it("fetches and caches schemas with source disambiguation", async () => {
    const registry = new DeferredToolRegistry();
    const pluginLoader = vi.fn(async (entry: { name: string; sourceQualifier?: string }) => ({
      inputSchema: {
        type: "object",
        title: `${entry.sourceQualifier}:${entry.name}`,
      },
    }));

    registry.registerLoader("plugin", pluginLoader);
    registry.registerTools([
      { name: "tool_fetch", description: "Fetch from plugin a", source: "plugin", sourceQualifier: "plugin-a" },
      { name: "tool_fetch", description: "Fetch from plugin b", source: "plugin", sourceQualifier: "plugin-b" },
    ]);

    const first = await registry.fetchSchema("tool_fetch", "plugin", "plugin-a");
    const second = await registry.fetchSchema("tool_fetch", "plugin", "plugin-a");
    const third = await registry.fetchSchema("tool_fetch", "plugin", "plugin-b");

    expect(first?.schema.inputSchema).toEqual({
      type: "object",
      title: "plugin-a:tool_fetch",
    });
    expect(second?.schema.inputSchema).toEqual(first?.schema.inputSchema);
    expect(third?.schema.inputSchema).toEqual({
      type: "object",
      title: "plugin-b:tool_fetch",
    });
    expect(pluginLoader).toHaveBeenCalledTimes(2);
    expect(registry.loadedSchemaCount).toBe(2);
  });

  it("preserves unified metadata through search and schema fetch", async () => {
    const registry = new DeferredToolRegistry();
    registry.registerLoader("mcp", async () => ({
      inputSchema: { type: "object" },
    }));
    registry.registerTools([
      {
        name: "web_fetch",
        description: "Fetch remote content",
        source: "mcp",
        sourceQualifier: "web",
        metadata: {
          category: "web",
          tags: ["read-only"],
          requiresApproval: "never",
          cache: { read: true },
        },
      },
    ]);

    const metadata = {
      category: "web",
      tags: ["read-only"],
      requiresApproval: "never",
      cache: { read: true },
    };
    expect(registry.searchTools("fetch")[0]?.metadata).toEqual(metadata);
    expect((await registry.fetchSchema("web_fetch", "mcp", "web"))?.metadata).toEqual(metadata);
  });

  it("removes matching source entries and cached schemas without touching others", async () => {
    const registry = new DeferredToolRegistry();
    const loader = vi.fn(async () => ({
      inputSchema: { type: "object" },
    }));

    registry.registerLoader("plugin", loader);
    registry.registerTools([
      { name: "alpha", description: "Alpha tool", source: "plugin", sourceQualifier: "plugin-a" },
      { name: "beta", description: "Beta tool", source: "plugin", sourceQualifier: "plugin-b" },
    ]);

    await registry.fetchSchema("alpha", "plugin", "plugin-a");
    await registry.fetchSchema("beta", "plugin", "plugin-b");

    expect(registry.removeToolsBySource("plugin", "plugin-a")).toBe(1);
    expect(registry.getEntriesBySource("plugin").map((entry) => entry.name)).toEqual(["beta"]);
    expect(registry.loadedSchemaCount).toBe(1);
    expect(await registry.fetchSchema("alpha", "plugin", "plugin-a")).toBeUndefined();
  });
});
