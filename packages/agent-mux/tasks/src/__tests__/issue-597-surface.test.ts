import { describe, expect, it } from "vitest";

async function importProgram() {
  return import("../cli/program.js");
}

async function importMcpServer() {
  return import("../mcp/server.js");
}

describe("issue #597 CLI and MCP surface parity", () => {
  it("registers missing CLI command groups and breakpoint/responder commands", async () => {
    const { createProgram } = await importProgram();
    const program = createProgram();

    expect(program.commands.map((command) => command.name())).toEqual(
      expect.arrayContaining(["breakpoints", "responders", "templates", "rules"]),
    );

    const breakpoints = program.commands.find((command) => command.name() === "breakpoints");
    expect(breakpoints?.commands.map((command) => command.name())).toEqual(
      expect.arrayContaining(["list", "search", "assign", "reassign", "close", "approve"]),
    );
    expect(breakpoints?.commands.find((command) => command.name() === "list")?.options.map((option) => option.long))
      .toContain("--status");

    const responders = program.commands.find((command) => command.name() === "responders");
    expect(responders?.commands.map((command) => command.name())).toEqual(
      expect.arrayContaining(["list", "search", "stats", "show"]),
    );

    const templates = program.commands.find((command) => command.name() === "templates");
    expect(templates?.commands.map((command) => command.name())).toEqual(
      expect.arrayContaining(["list", "show", "create"]),
    );

    const rules = program.commands.find((command) => command.name() === "rules");
    expect(rules?.commands.map((command) => command.name())).toEqual(
      expect.arrayContaining(["list", "add", "remove"]),
    );
  });

  it("registers requested MCP task aliases and breakpoint resources", async () => {
    const { createBreakpointMcpServer } = await importMcpServer();
    const server = createBreakpointMcpServer() as unknown as {
      _registeredTools: Record<string, unknown>;
      _registeredResourceTemplates: Record<string, { resourceTemplate: { uriTemplate: { toString(): string } } }>;
      server: { getCapabilities(): { resources?: { subscribe?: boolean; listChanged?: boolean } } };
    };

    expect(Object.keys(server._registeredTools)).toEqual(expect.arrayContaining([
      "create_todo",
      "create_task",
      "assign_task",
      "search_tasks",
      "cancel_breakpoint",
      "escalate_breakpoint",
      "add_comment_to_breakpoint",
    ]));

    expect(Object.values(server._registeredResourceTemplates).map((template) =>
      template.resourceTemplate.uriTemplate.toString(),
    )).toContain("breakpoint://{id}");
    expect(server.server.getCapabilities().resources).toMatchObject({
      subscribe: true,
      listChanged: true,
    });
  });
});
