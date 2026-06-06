import { describe, expect, it } from "vitest";
import { renderEventMessage, stripAnsi, type JournalEvent } from "../index";

describe("cli render eventMessage", () => {
  it("renders known journal events", () => {
    const event: JournalEvent = {
      type: "RUN_CREATED",
      recordedAt: "2026-01-01T00:00:00Z",
      data: { runId: "run-123", processId: "test-process", entrypoint: { importPath: "./process.js" } },
    };

    const rendered = stripAnsi(renderEventMessage(event));
    expect(rendered).toContain("RUN_CREATED");
    expect(rendered).toContain("run-123");
    expect(rendered).toContain("test-process");
  });

  it("falls back for unknown event types", () => {
    const event: JournalEvent = {
      type: "CUSTOM_EVENT",
      recordedAt: "2026-01-01T00:00:00Z",
      data: { custom: "data" },
    };

    const rendered = stripAnsi(renderEventMessage(event));
    expect(rendered).toContain("CUSTOM_EVENT");
    expect(rendered).toContain("custom");
  });
});
