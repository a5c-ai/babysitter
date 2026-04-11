import { describe, it, expect } from "vitest";
import { renderStatusLine, formatElapsed, stripAnsi } from "../index";

describe("GAP-UX-001e: StatusLine", () => {
  const baseProps = {
    runId: "01ABCDEFGH1234567890ABCDEF",
    iteration: 5,
    pendingEffects: 2,
    elapsed: 120000, // 2 minutes
    status: "running" as const,
  };

  it("renders run ID (abbreviated)", () => {
    const result = stripAnsi(renderStatusLine(baseProps));
    expect(result).toContain("01ABCDEF..");
  });

  it("renders iteration count", () => {
    const result = stripAnsi(renderStatusLine(baseProps));
    expect(result).toContain("iter:5");
  });

  it("renders pending effect count", () => {
    const result = stripAnsi(renderStatusLine(baseProps));
    expect(result).toContain("pending:2");
  });

  it("renders status indicator", () => {
    const result = stripAnsi(renderStatusLine(baseProps));
    expect(result).toContain("[running]");
  });

  it("renders elapsed time formatted", () => {
    const result = stripAnsi(renderStatusLine(baseProps));
    expect(result).toContain("02:00");
  });

  it("renders token usage when provided", () => {
    const result = stripAnsi(renderStatusLine({ ...baseProps, tokenUsage: 15000 }));
    expect(result).toContain("tokens:");
    expect(result).toContain("15,000");
  });

  it("renders cost when provided", () => {
    const result = stripAnsi(renderStatusLine({ ...baseProps, cost: 0.0523 }));
    expect(result).toContain("$0.0523");
  });

  it("renders pending by kind breakdown", () => {
    const result = stripAnsi(renderStatusLine({
      ...baseProps,
      pendingByKind: { agent: 1, shell: 1 },
    }));
    expect(result).toContain("agent:1");
    expect(result).toContain("shell:1");
  });

  it("omits pending section when no pending effects", () => {
    const result = stripAnsi(renderStatusLine({ ...baseProps, pendingEffects: 0 }));
    expect(result).not.toContain("pending:");
  });

  it("renders short runId unchanged", () => {
    const result = stripAnsi(renderStatusLine({ ...baseProps, runId: "SHORT" }));
    expect(result).toContain("SHORT");
  });

  describe("formatElapsed", () => {
    it("formats seconds", () => {
      expect(formatElapsed(5000)).toBe("00:05");
    });

    it("formats minutes and seconds", () => {
      expect(formatElapsed(125000)).toBe("02:05");
    });

    it("formats hours", () => {
      expect(formatElapsed(3661000)).toBe("01:01:01");
    });
  });
});
