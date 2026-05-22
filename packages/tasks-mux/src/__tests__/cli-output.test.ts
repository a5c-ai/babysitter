import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Breakpoint, BreakpointAnswer, ResponderProfile } from "../types.js";

// ────────────────────────────────────────────────────────────────────────────
// Dynamic import
// ────────────────────────────────────────────────────────────────────────────

async function importOutput() {
  return import("../cli/output.js");
}

// ────────────────────────────────────────────────────────────────────────────
// Test Factories
// ────────────────────────────────────────────────────────────────────────────

const NOW = "2026-04-21T10:00:00.000Z";
const LATER = "2026-04-21T10:30:00.000Z";

function makeBreakpoint(overrides: Partial<Breakpoint> = {}): Breakpoint {
  return {
    id: "bp-001",
    text: "Should we use connection pooling?",
    context: { description: "", codeSnippets: [], fileReferences: [], tags: ["perf"] },
    status: "pending",
    routing: { strategy: "first-response-wins", targetResponders: ["tal", "bob"], timeoutMs: 1_800_000, presentToUser: false },
    answers: [],
    createdAt: NOW,
    updatedAt: NOW,
    expiresAt: LATER,
    ...overrides,
  };
}

function makeAnswer(overrides: Partial<BreakpointAnswer> = {}): BreakpointAnswer {
  return {
    id: "answer-001",
    breakpointId: "bp-001",
    responderId: "tal",
    responderName: "Tal M",
    text: "Yes, use connection pooling with ioredis.",
    approved: true,
    confidence: 90,
    references: ["https://github.com/redis/ioredis#cluster"],
    followUpQuestions: ["What about connection limits?"],
    answeredAt: NOW,
    ...overrides,
  };
}

function makeResponder(overrides: Partial<ResponderProfile> = {}): ResponderProfile {
  return {
    id: "resp-001",
    name: "Tal M",
    title: "Senior Engineer",
    domains: ["typescript", "backend"],
    tags: ["security", "auth"],
    availability: true,
    responseTimeSla: 300_000,
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("CLI Output Formatting", () => {
  describe("formatBreakpoint", () => {
    it("formats breakpoint in text mode with all fields", async () => {
      const { formatBreakpoint } = await importOutput();
      const bp = makeBreakpoint();
      const output = formatBreakpoint(bp, false);

      expect(output).toContain("Breakpoint: bp-001");
      expect(output).toContain("Status:     pending");
      expect(output).toContain("Text:       Should we use connection pooling?");
      expect(output).toContain("Strategy:   first-response-wins");
      expect(output).toContain("Responders: tal, bob");
      expect(output).toContain(`Created:    ${NOW}`);
      expect(output).toContain(`Expires:    ${LATER}`);
    });

    it("includes tags when present", async () => {
      const { formatBreakpoint } = await importOutput();
      const bp = makeBreakpoint();
      const output = formatBreakpoint(bp, false);

      expect(output).toContain("Tags:       perf");
    });

    it("omits tags line when no tags", async () => {
      const { formatBreakpoint } = await importOutput();
      const bp = makeBreakpoint({
        context: { description: "", codeSnippets: [], fileReferences: [], tags: [] },
      });
      const output = formatBreakpoint(bp, false);

      expect(output).not.toContain("Tags:");
    });

    it("shows answer count when breakpoint has answers", async () => {
      const { formatBreakpoint } = await importOutput();
      const bp = makeBreakpoint({ answers: [makeAnswer()] });
      const output = formatBreakpoint(bp, false);

      expect(output).toContain("Answers:    1");
    });

    it("omits answer count when no answers", async () => {
      const { formatBreakpoint } = await importOutput();
      const bp = makeBreakpoint({ answers: [] });
      const output = formatBreakpoint(bp, false);

      expect(output).not.toContain("Answers:");
    });

    it("shows (none) when no target responders", async () => {
      const { formatBreakpoint } = await importOutput();
      const bp = makeBreakpoint({
        routing: { strategy: "first-response-wins", targetResponders: [], timeoutMs: 1_800_000, presentToUser: false },
      });
      const output = formatBreakpoint(bp, false);

      expect(output).toContain("Responders: (none)");
    });

    it("returns JSON in json mode", async () => {
      const { formatBreakpoint } = await importOutput();
      const bp = makeBreakpoint();
      const output = formatBreakpoint(bp, true);
      const parsed = JSON.parse(output);

      expect(parsed.id).toBe("bp-001");
      expect(parsed.status).toBe("pending");
    });
  });

  describe("formatAnswer", () => {
    it("formats answer in text mode", async () => {
      const { formatAnswer } = await importOutput();
      const answer = makeAnswer();
      const output = formatAnswer(answer, false);

      expect(output).toContain("Answer:     answer-001");
      expect(output).toContain("Breakpoint: bp-001");
      expect(output).toContain("Responder:  Tal M (tal)");
      expect(output).toContain("Confidence: 90%");
      expect(output).toContain(`Answered:   ${NOW}`);
      expect(output).toContain("Yes, use connection pooling with ioredis.");
    });

    it("includes references when present", async () => {
      const { formatAnswer } = await importOutput();
      const answer = makeAnswer();
      const output = formatAnswer(answer, false);

      expect(output).toContain("References:");
      expect(output).toContain("https://github.com/redis/ioredis#cluster");
    });

    it("includes follow-up questions when present", async () => {
      const { formatAnswer } = await importOutput();
      const answer = makeAnswer();
      const output = formatAnswer(answer, false);

      expect(output).toContain("Follow-up questions:");
      expect(output).toContain("What about connection limits?");
    });

    it("omits references section when empty", async () => {
      const { formatAnswer } = await importOutput();
      const answer = makeAnswer({ references: [] });
      const output = formatAnswer(answer, false);

      expect(output).not.toContain("References:");
    });

    it("omits follow-up section when empty", async () => {
      const { formatAnswer } = await importOutput();
      const answer = makeAnswer({ followUpQuestions: [] });
      const output = formatAnswer(answer, false);

      expect(output).not.toContain("Follow-up questions:");
    });

    it("returns JSON in json mode", async () => {
      const { formatAnswer } = await importOutput();
      const answer = makeAnswer();
      const output = formatAnswer(answer, true);
      const parsed = JSON.parse(output);

      expect(parsed.id).toBe("answer-001");
      expect(parsed.confidence).toBe(90);
    });
  });

  describe("formatResponder", () => {
    it("formats responder in text mode", async () => {
      const { formatResponder } = await importOutput();
      const r = makeResponder();
      const output = formatResponder(r, false);

      expect(output).toContain("Responder: resp-001");
      expect(output).toContain("Name:      Tal M");
      expect(output).toContain("Title:     Senior Engineer");
      expect(output).toContain("Available: yes");
      expect(output).toContain("Response SLA: 5m");
    });

    it("shows domains when present", async () => {
      const { formatResponder } = await importOutput();
      const r = makeResponder();
      const output = formatResponder(r, false);

      expect(output).toContain("Domains:   typescript, backend");
    });

    it("shows tags when present", async () => {
      const { formatResponder } = await importOutput();
      const r = makeResponder();
      const output = formatResponder(r, false);

      expect(output).toContain("Tags:      security, auth");
    });

    it("omits domains line when empty", async () => {
      const { formatResponder } = await importOutput();
      const r = makeResponder({ domains: [] });
      const output = formatResponder(r, false);

      expect(output).not.toContain("Domains:");
    });

    it("omits tags line when empty", async () => {
      const { formatResponder } = await importOutput();
      const r = makeResponder({ tags: [] });
      const output = formatResponder(r, false);

      expect(output).not.toContain("Tags:");
    });

    it("shows availability as 'no' when unavailable", async () => {
      const { formatResponder } = await importOutput();
      const r = makeResponder({ availability: false });
      const output = formatResponder(r, false);

      expect(output).toContain("Available: no");
    });

    it("formats SLA of less than 1 second as milliseconds", async () => {
      const { formatResponder } = await importOutput();
      const r = makeResponder({ responseTimeSla: 500 });
      const output = formatResponder(r, false);

      expect(output).toContain("Response SLA: 500ms");
    });

    it("formats SLA of seconds correctly", async () => {
      const { formatResponder } = await importOutput();
      const r = makeResponder({ responseTimeSla: 45_000 });
      const output = formatResponder(r, false);

      expect(output).toContain("Response SLA: 45s");
    });

    it("formats SLA of hours correctly", async () => {
      const { formatResponder } = await importOutput();
      const r = makeResponder({ responseTimeSla: 3_600_000 });
      const output = formatResponder(r, false);

      expect(output).toContain("Response SLA: 1h");
    });

    it("formats SLA of hours and minutes correctly", async () => {
      const { formatResponder } = await importOutput();
      const r = makeResponder({ responseTimeSla: 5_400_000 });
      const output = formatResponder(r, false);

      expect(output).toContain("Response SLA: 1h 30m");
    });

    it("returns JSON in json mode", async () => {
      const { formatResponder } = await importOutput();
      const r = makeResponder();
      const output = formatResponder(r, true);
      const parsed = JSON.parse(output);

      expect(parsed.id).toBe("resp-001");
      expect(parsed.availability).toBe(true);
    });
  });

  describe("formatTable", () => {
    it("returns (no results) for empty rows", async () => {
      const { formatTable } = await importOutput();
      const output = formatTable([], ["ID", "Name"]);

      expect(output).toBe("(no results)");
    });

    it("formats headers and data rows", async () => {
      const { formatTable } = await importOutput();
      const output = formatTable(
        [["bp-001", "pending"], ["bp-002", "answered"]],
        ["ID", "Status"],
      );

      expect(output).toContain("ID");
      expect(output).toContain("Status");
      expect(output).toContain("bp-001");
      expect(output).toContain("pending");
      expect(output).toContain("bp-002");
      expect(output).toContain("answered");
    });

    it("pads columns to the widest content", async () => {
      const { formatTable } = await importOutput();
      const output = formatTable(
        [["a", "short"], ["long-value", "x"]],
        ["Col1", "Col2"],
      );
      const lines = output.split("\n");

      // Header and separator lines should have consistent width
      expect(lines.length).toBe(4); // header + separator + 2 data rows
    });

    it("includes separator line between headers and data", async () => {
      const { formatTable } = await importOutput();
      const output = formatTable(
        [["val"]],
        ["Header"],
      );
      const lines = output.split("\n");

      // Second line should be dashes
      expect(lines[1]).toMatch(/^-+$/);
    });
  });

  describe("printOutput", () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it("prints JSON in json mode", async () => {
      const { printOutput } = await importOutput();
      printOutput({ key: "value" }, true);

      expect(consoleSpy).toHaveBeenCalledWith(
        JSON.stringify({ key: "value" }, null, 2),
      );
    });

    it("prints string directly in text mode", async () => {
      const { printOutput } = await importOutput();
      printOutput("hello world", false);

      expect(consoleSpy).toHaveBeenCalledWith("hello world");
    });

    it("prints non-string objects in text mode", async () => {
      const { printOutput } = await importOutput();
      const data = { foo: "bar" };
      printOutput(data, false);

      expect(consoleSpy).toHaveBeenCalledWith(data);
    });
  });

  describe("printError", () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it("prints error message in text mode", async () => {
      const { printError } = await importOutput();
      printError(new Error("Something went wrong"), false);

      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Something went wrong");
    });

    it("prints JSON error in json mode", async () => {
      const { printError } = await importOutput();
      printError(new Error("Something went wrong"), true);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        JSON.stringify({ error: "Something went wrong" }),
      );
    });

    it("handles non-Error values", async () => {
      const { printError } = await importOutput();
      printError("plain string error", false);

      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: plain string error");
    });

    it("handles non-Error values in JSON mode", async () => {
      const { printError } = await importOutput();
      printError("plain string error", true);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        JSON.stringify({ error: "plain string error" }),
      );
    });
  });
});
