import { describe, it, expect } from "vitest";
import { renderEventMessage, stripAnsi, type JournalEvent } from "../index";

describe("GAP-UX-001d: Message Renderers", () => {
  describe("EventMessage dispatcher", () => {
    it("renders RUN_CREATED events", () => {
      const event: JournalEvent = {
        type: "RUN_CREATED",
        recordedAt: "2026-01-01T00:00:00Z",
        data: { runId: "run-123", processId: "test-process", entrypoint: { importPath: "./process.js" } },
      };
      const result = stripAnsi(renderEventMessage(event));
      expect(result).toContain("RUN_CREATED");
      expect(result).toContain("run-123");
      expect(result).toContain("test-process");
    });

    it("renders EFFECT_REQUESTED events", () => {
      const event: JournalEvent = {
        type: "EFFECT_REQUESTED",
        recordedAt: "2026-01-01T00:00:01Z",
        data: { effectId: "eff-1", kind: "agent", title: "Write tests", labels: ["tdd"] },
      };
      const result = stripAnsi(renderEventMessage(event));
      expect(result).toContain("EFFECT_REQUESTED");
      expect(result).toContain("eff-1");
      expect(result).toContain("agent");
      expect(result).toContain("Write tests");
      expect(result).toContain("[tdd]");
    });

    it("renders EFFECT_RESOLVED events with success", () => {
      const event: JournalEvent = {
        type: "EFFECT_RESOLVED",
        recordedAt: "2026-01-01T00:00:02Z",
        data: { effectId: "eff-1", status: "ok", duration: 1500 },
      };
      const result = stripAnsi(renderEventMessage(event));
      expect(result).toContain("EFFECT_RESOLVED");
      expect(result).toContain("ok");
      expect(result).toContain("1500ms");
    });

    it("renders EFFECT_RESOLVED events with failure", () => {
      const event: JournalEvent = {
        type: "EFFECT_RESOLVED",
        recordedAt: "2026-01-01T00:00:02Z",
        data: { effectId: "eff-1", status: "error" },
      };
      const result = stripAnsi(renderEventMessage(event));
      expect(result).toContain("EFFECT_RESOLVED");
      expect(result).toContain("error");
    });

    it("renders RUN_COMPLETED events", () => {
      const event: JournalEvent = {
        type: "RUN_COMPLETED",
        recordedAt: "2026-01-01T00:01:00Z",
        data: { outputRef: "output.json", costStats: { totalCostUsd: 0.0521 } },
      };
      const result = stripAnsi(renderEventMessage(event));
      expect(result).toContain("RUN_COMPLETED");
      expect(result).toContain("output.json");
      expect(result).toContain("$0.0521");
    });

    it("renders RUN_FAILED events", () => {
      const event: JournalEvent = {
        type: "RUN_FAILED",
        recordedAt: "2026-01-01T00:01:00Z",
        data: { error: { name: "RunFailedError", message: "Process crashed", stack: "at line 42\nat line 10" } },
      };
      const result = stripAnsi(renderEventMessage(event));
      expect(result).toContain("RUN_FAILED");
      expect(result).toContain("RunFailedError");
      expect(result).toContain("Process crashed");
    });

    it("renders RUN_FAILED with stack trace", () => {
      const event: JournalEvent = {
        type: "RUN_FAILED",
        recordedAt: "2026-01-01T00:00:00Z",
        data: { error: { name: "Error", message: "boom", stack: "Error: boom\n    at foo.js:42" } },
      };
      const result = stripAnsi(renderEventMessage(event));
      expect(result).toContain("Stack trace:");
      expect(result).toContain("foo.js:42");
    });

    it("renders unknown event types as JSON fallback", () => {
      const event: JournalEvent = {
        type: "CUSTOM_EVENT",
        recordedAt: "2026-01-01T00:00:00Z",
        data: { custom: "data" },
      };
      const result = stripAnsi(renderEventMessage(event));
      expect(result).toContain("CUSTOM_EVENT");
      expect(result).toContain("custom");
    });

    it("renders RUN_CREATED with entrypoint", () => {
      const event: JournalEvent = {
        type: "RUN_CREATED",
        recordedAt: "2026-01-01T00:00:00Z",
        data: { runId: "r1", entrypoint: { importPath: "./my-process.js" } },
      };
      const result = stripAnsi(renderEventMessage(event));
      expect(result).toContain("my-process.js");
    });

    it("renders RUN_COMPLETED without cost stats", () => {
      const event: JournalEvent = {
        type: "RUN_COMPLETED",
        recordedAt: "2026-01-01T00:00:00Z",
        data: { outputRef: "out.json" },
      };
      const result = stripAnsi(renderEventMessage(event));
      expect(result).toContain("RUN_COMPLETED");
      expect(result).not.toContain("$");
    });
  });
});
