import { describe, it, expect } from "vitest";
import { renderStructuredDiff, parseDiff, stripAnsi } from "../index";

const SAMPLE_DIFF = `@@ -1,4 +1,5 @@
 function hello() {
-  console.log("old");
+  console.log("new");
+  console.log("extra");
   return true;
 }`;

describe("GAP-UX-001b: Diff Rendering", () => {
  describe("parseDiff", () => {
    it("parses hunk header", () => {
      const hunks = parseDiff(SAMPLE_DIFF);
      expect(hunks).toHaveLength(1);
      expect(hunks[0].oldStart).toBe(1);
      expect(hunks[0].oldCount).toBe(4);
      expect(hunks[0].newStart).toBe(1);
      expect(hunks[0].newCount).toBe(5);
    });

    it("identifies added lines", () => {
      const hunks = parseDiff(SAMPLE_DIFF);
      const added = hunks[0].lines.filter((l) => l.type === "add");
      expect(added.length).toBe(2);
      expect(added[0].content).toContain("new");
    });

    it("identifies removed lines", () => {
      const hunks = parseDiff(SAMPLE_DIFF);
      const removed = hunks[0].lines.filter((l) => l.type === "remove");
      expect(removed.length).toBe(1);
      expect(removed[0].content).toContain("old");
    });

    it("identifies context lines", () => {
      const hunks = parseDiff(SAMPLE_DIFF);
      const context = hunks[0].lines.filter((l) => l.type === "context");
      expect(context.length).toBeGreaterThanOrEqual(2);
    });

    it("assigns line numbers", () => {
      const hunks = parseDiff(SAMPLE_DIFF);
      const added = hunks[0].lines.filter((l) => l.type === "add");
      expect(added[0].newLine).toBeDefined();
    });

    it("returns empty array for empty input", () => {
      expect(parseDiff("")).toHaveLength(0);
      expect(parseDiff("  ")).toHaveLength(0);
    });
  });

  describe("renderStructuredDiff", () => {
    it("renders added lines with + prefix", () => {
      const result = stripAnsi(renderStructuredDiff({ diff: SAMPLE_DIFF }));
      expect(result).toContain("+");
      expect(result).toContain("new");
    });

    it("renders removed lines with - prefix", () => {
      const result = stripAnsi(renderStructuredDiff({ diff: SAMPLE_DIFF }));
      expect(result).toContain("-");
      expect(result).toContain("old");
    });

    it("renders file path header", () => {
      const result = stripAnsi(renderStructuredDiff({
        diff: SAMPLE_DIFF,
        filePath: "src/hello.ts",
      }));
      expect(result).toContain("src/hello.ts");
    });

    it("renders hunk header", () => {
      const result = stripAnsi(renderStructuredDiff({ diff: SAMPLE_DIFF }));
      expect(result).toContain("@@");
    });

    it("renders (no changes) for empty diff", () => {
      const result = stripAnsi(renderStructuredDiff({ diff: "" }));
      expect(result).toContain("no changes");
    });

    it("renders line numbers", () => {
      const result = stripAnsi(renderStructuredDiff({ diff: SAMPLE_DIFF }));
      // Should contain numbers in the gutter
      expect(result).toMatch(/\d/);
    });
  });
});
