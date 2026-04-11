import { describe, it, expect } from "vitest";
import {
  renderStatusBadge,
  renderStatusSymbol,
  renderKeyValue,
  renderKeyValueBlock,
  renderTable,
  stripAnsi,
} from "../index";

describe("GAP-UX-001: Foundation Components", () => {
  describe("StatusBadge", () => {
    it("renders completed status with check mark", () => {
      const result = stripAnsi(renderStatusBadge("completed"));
      expect(result).toContain("\u2714");
      expect(result).toContain("completed");
    });

    it("renders failed status with X mark", () => {
      const result = stripAnsi(renderStatusBadge("failed"));
      expect(result).toContain("\u2718");
      expect(result).toContain("failed");
    });

    it("renders pending status with circle", () => {
      const result = stripAnsi(renderStatusBadge("pending"));
      expect(result).toContain("\u25CB");
      expect(result).toContain("pending");
    });

    it("renders running status with filled circle", () => {
      const result = stripAnsi(renderStatusBadge("running"));
      expect(result).toContain("\u25CF");
      expect(result).toContain("running");
    });

    it("renderStatusSymbol returns just the symbol", () => {
      const result = stripAnsi(renderStatusSymbol("completed"));
      expect(result).toBe("\u2714");
    });

    it("returns raw text for unknown status", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = renderStatusBadge("unknown" as any);
      expect(result).toBe("unknown");
    });
  });

  describe("KeyValue", () => {
    it("renders label and value", () => {
      const result = stripAnsi(renderKeyValue("Name", "Alice"));
      expect(result).toContain("Name");
      expect(result).toContain("Alice");
    });

    it("renders undefined as (not set)", () => {
      const result = stripAnsi(renderKeyValue("Missing", undefined));
      expect(result).toContain("(not set)");
    });

    it("pads label to specified width", () => {
      const result = stripAnsi(renderKeyValue("A", "val", { labelWidth: 10 }));
      expect(result).toMatch(/^A\s+:/);
    });

    it("renderKeyValueBlock renders multiple entries", () => {
      const result = stripAnsi(renderKeyValueBlock([
        ["Name", "Alice"],
        ["Age", 30],
        ["Active", true],
      ]));
      expect(result).toContain("Name");
      expect(result).toContain("Alice");
      expect(result).toContain("Age");
      expect(result).toContain("30");
    });
  });

  describe("Table", () => {
    it("renders headers and rows", () => {
      const result = stripAnsi(renderTable(
        ["Name", "Score"],
        [["Alice", "95"], ["Bob", "87"]],
      ));
      expect(result).toContain("Name");
      expect(result).toContain("Score");
      expect(result).toContain("Alice");
      expect(result).toContain("95");
      expect(result).toContain("Bob");
    });

    it("renders separator line between headers and rows", () => {
      const result = stripAnsi(renderTable(
        ["Col1"],
        [["Val1"]],
      ));
      const lines = result.split("\n");
      expect(lines.length).toBeGreaterThanOrEqual(3);
      expect(lines[1]).toContain("\u2500");
    });

    it("handles empty rows", () => {
      const result = stripAnsi(renderTable(["Header"], []));
      expect(result).toContain("Header");
    });
  });

  describe("colors", () => {
    it("stripAnsi removes ANSI codes", () => {
      expect(stripAnsi("\x1b[31mred\x1b[0m")).toBe("red");
    });

    it("stripAnsi returns plain text unchanged", () => {
      expect(stripAnsi("hello")).toBe("hello");
    });
  });
});
