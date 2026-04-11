import { describe, it, expect } from "vitest";
import {
  OPERATOR_COMMANDS,
  renderOperatorCommand,
  getCommandsByCategory,
  getGroupedCommands,
  formatCommandsForPrompt,
} from "../operatorCommands";

describe("GAP-USER-001: Operator Commands", () => {
  it("has built-in commands", () => {
    expect(OPERATOR_COMMANDS.length).toBeGreaterThanOrEqual(5);
  });

  it("all commands have required fields", () => {
    for (const cmd of OPERATOR_COMMANDS) {
      expect(cmd.name).toBeTruthy();
      expect(cmd.label).toBeTruthy();
      expect(cmd.description).toBeTruthy();
      expect(cmd.commandTemplate).toBeTruthy();
      expect(cmd.category).toBeTruthy();
    }
  });

  describe("renderOperatorCommand", () => {
    it("substitutes runDir", () => {
      const result = renderOperatorCommand(
        "babysitter run:status {{runDir}}",
        { runDir: ".a5c/runs/abc" },
      );
      expect(result).toBe("babysitter run:status .a5c/runs/abc");
    });

    it("substitutes multiple placeholders", () => {
      const result = renderOperatorCommand(
        "babysitter task:show {{runDir}} {{effectId}}",
        { runDir: ".a5c/runs/x", effectId: "eff-1" },
      );
      expect(result).toBe("babysitter task:show .a5c/runs/x eff-1");
    });

    it("defaults to placeholders for missing context", () => {
      const result = renderOperatorCommand("babysitter task:show {{runDir}} {{effectId}}", {});
      expect(result).toBe("babysitter task:show . <effectId>");
    });
  });

  describe("getCommandsByCategory", () => {
    it("returns only inspect commands", () => {
      const cmds = getCommandsByCategory("inspect");
      expect(cmds.length).toBeGreaterThan(0);
      expect(cmds.every((c) => c.category === "inspect")).toBe(true);
    });

    it("returns manage commands", () => {
      const cmds = getCommandsByCategory("manage");
      expect(cmds.length).toBeGreaterThan(0);
    });
  });

  describe("getGroupedCommands", () => {
    it("groups all commands by category", () => {
      const grouped = getGroupedCommands();
      expect(Object.keys(grouped)).toContain("inspect");
      expect(Object.keys(grouped)).toContain("debug");
      expect(Object.keys(grouped)).toContain("tokens");
    });
  });

  describe("formatCommandsForPrompt", () => {
    it("renders markdown with commands", () => {
      const output = formatCommandsForPrompt({ runDir: ".a5c/runs/test" });
      expect(output).toContain("## Available Operator Commands");
      expect(output).toContain("babysitter");
    });
  });
});
