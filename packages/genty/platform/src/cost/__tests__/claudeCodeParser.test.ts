import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  parseClaudeCodeSession,
  parseClaudeCodeSessionWithSubagents,
  aggregateUsageData,
} from "../claudeCodeParser";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "babysitter-cost-parser-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

// ============================================================================
// Helper: write a JSONL file from an array of objects
// ============================================================================

async function writeJsonl(filePath: string, entries: unknown[]): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const content = entries.map((e) => JSON.stringify(e)).join("\n") + "\n";
  await fs.writeFile(filePath, content, "utf-8");
}

// ============================================================================
// Fixtures
// ============================================================================

function makeAssistantEntry(overrides: Record<string, unknown> = {}) {
  return {
    type: "assistant",
    message: {
      model: "claude-opus-4-6",
      usage: {
        input_tokens: 100,
        output_tokens: 50,
        cache_creation_input_tokens: 2000,
        cache_read_input_tokens: 500,
        cache_creation: {
          ephemeral_5m_input_tokens: 800,
          ephemeral_1h_input_tokens: 1200,
        },
        service_tier: "standard",
      },
      ...overrides,
    },
    timestamp: "2026-04-05T12:00:00.000Z",
  };
}

function makeUserEntry() {
  return {
    type: "human",
    message: { role: "user", content: "Hello" },
    timestamp: "2026-04-05T11:59:59.000Z",
  };
}

function makeSystemEntry() {
  return {
    type: "system",
    message: { content: "System prompt" },
    timestamp: "2026-04-05T11:59:58.000Z",
  };
}

// ============================================================================
// parseClaudeCodeSession
// ============================================================================

describe("parseClaudeCodeSession", () => {
  test("extracts usage data from assistant messages", async () => {
    const sessionFile = path.join(tmpDir, "session.jsonl");
    await writeJsonl(sessionFile, [
      makeUserEntry(),
      makeAssistantEntry(),
      makeUserEntry(),
      makeAssistantEntry(),
    ]);

    const events = await parseClaudeCodeSession(sessionFile);
    expect(events).toHaveLength(2);

    const first = events[0];
    expect(first.model).toBe("claude-opus-4-6");
    expect(first.inputTokens).toBe(100);
    expect(first.outputTokens).toBe(50);
    expect(first.cacheCreationTokens).toBe(2000);
    expect(first.cacheReadTokens).toBe(500);
    expect(first.cacheCreation5mTokens).toBe(800);
    expect(first.cacheCreation1hTokens).toBe(1200);
    expect(first.serviceTier).toBe("standard");
    expect(first.timestamp).toBe("2026-04-05T12:00:00.000Z");
  });

  test("computes costUsd for each event", async () => {
    const sessionFile = path.join(tmpDir, "session.jsonl");
    await writeJsonl(sessionFile, [makeAssistantEntry()]);

    const events = await parseClaudeCodeSession(sessionFile);
    expect(events).toHaveLength(1);
    expect(events[0].costUsd).toBeDefined();
    expect(events[0].costUsd).toBeGreaterThan(0);
  });

  test("skips non-assistant messages", async () => {
    const sessionFile = path.join(tmpDir, "session.jsonl");
    await writeJsonl(sessionFile, [
      makeUserEntry(),
      makeSystemEntry(),
      { type: "tool_use", tool: { name: "bash" } },
    ]);

    const events = await parseClaudeCodeSession(sessionFile);
    expect(events).toHaveLength(0);
  });

  test("skips assistant messages without usage block", async () => {
    const sessionFile = path.join(tmpDir, "session.jsonl");
    await writeJsonl(sessionFile, [
      {
        type: "assistant",
        message: { model: "claude-opus-4-6", content: "Hello" },
        timestamp: "2026-04-05T12:00:00.000Z",
      },
    ]);

    const events = await parseClaudeCodeSession(sessionFile);
    expect(events).toHaveLength(0);
  });

  test("handles malformed JSON lines gracefully", async () => {
    const sessionFile = path.join(tmpDir, "session.jsonl");
    const content = [
      JSON.stringify(makeAssistantEntry()),
      "this is not valid json {{{",
      "",
      JSON.stringify(makeAssistantEntry()),
      '{"truncated": true',
    ].join("\n");
    await fs.writeFile(sessionFile, content, "utf-8");

    const events = await parseClaudeCodeSession(sessionFile);
    // Should parse the 2 valid assistant entries, skip the malformed lines
    expect(events).toHaveLength(2);
  });

  test("handles empty lines gracefully", async () => {
    const sessionFile = path.join(tmpDir, "session.jsonl");
    const content = [
      "",
      JSON.stringify(makeAssistantEntry()),
      "",
      "",
      JSON.stringify(makeAssistantEntry()),
      "",
    ].join("\n");
    await fs.writeFile(sessionFile, content, "utf-8");

    const events = await parseClaudeCodeSession(sessionFile);
    expect(events).toHaveLength(2);
  });

  test("returns empty array for non-existent file", async () => {
    const events = await parseClaudeCodeSession(path.join(tmpDir, "nonexistent.jsonl"));
    expect(events).toEqual([]);
  });

  test("returns empty array for empty file", async () => {
    const sessionFile = path.join(tmpDir, "empty.jsonl");
    await fs.writeFile(sessionFile, "", "utf-8");

    const events = await parseClaudeCodeSession(sessionFile);
    expect(events).toEqual([]);
  });

  test("defaults missing token fields to 0", async () => {
    const sessionFile = path.join(tmpDir, "session.jsonl");
    await writeJsonl(sessionFile, [
      {
        type: "assistant",
        message: {
          model: "claude-opus-4-6",
          usage: {
            // All token fields omitted
            service_tier: "standard",
          },
        },
        timestamp: "2026-04-05T12:00:00.000Z",
      },
    ]);

    const events = await parseClaudeCodeSession(sessionFile);
    expect(events).toHaveLength(1);
    expect(events[0].inputTokens).toBe(0);
    expect(events[0].outputTokens).toBe(0);
    expect(events[0].cacheCreationTokens).toBe(0);
    expect(events[0].cacheReadTokens).toBe(0);
    expect(events[0].cacheCreation5mTokens).toBe(0);
    expect(events[0].cacheCreation1hTokens).toBe(0);
  });

  test("defaults missing model to 'unknown'", async () => {
    const sessionFile = path.join(tmpDir, "session.jsonl");
    await writeJsonl(sessionFile, [
      {
        type: "assistant",
        message: {
          usage: { input_tokens: 10, output_tokens: 5 },
        },
        timestamp: "2026-04-05T12:00:00.000Z",
      },
    ]);

    const events = await parseClaudeCodeSession(sessionFile);
    expect(events).toHaveLength(1);
    expect(events[0].model).toBe("unknown");
  });
});

// ============================================================================
// parseClaudeCodeSessionWithSubagents
// ============================================================================

describe("parseClaudeCodeSessionWithSubagents", () => {
  test("merges main session events with subagent events", async () => {
    const sessionFile = path.join(tmpDir, "session.jsonl");
    const sessionDir = path.join(tmpDir, "session");
    const subagentsDir = path.join(sessionDir, "subagents");

    // Main session: 1 assistant message
    await writeJsonl(sessionFile, [makeAssistantEntry()]);

    // Subagent 1: 2 assistant messages
    await writeJsonl(path.join(subagentsDir, "agent-001.jsonl"), [
      makeAssistantEntry({ model: "claude-sonnet-4-6" }),
      makeAssistantEntry({ model: "claude-sonnet-4-6" }),
    ]);

    // Subagent 2: 1 assistant message
    await writeJsonl(path.join(subagentsDir, "agent-002.jsonl"), [
      makeAssistantEntry({ model: "claude-haiku-4-5" }),
    ]);

    const events = await parseClaudeCodeSessionWithSubagents(sessionFile);
    expect(events).toHaveLength(4);

    // Check models to verify merge happened correctly
    const models = events.map((e) => e.model);
    expect(models.filter((m) => m === "claude-opus-4-6")).toHaveLength(1);
    expect(models.filter((m) => m === "claude-sonnet-4-6")).toHaveLength(2);
    expect(models.filter((m) => m === "claude-haiku-4-5")).toHaveLength(1);
  });

  test("returns only main events when no subagents directory exists", async () => {
    const sessionFile = path.join(tmpDir, "solo-session.jsonl");
    await writeJsonl(sessionFile, [makeAssistantEntry(), makeAssistantEntry()]);

    const events = await parseClaudeCodeSessionWithSubagents(sessionFile);
    expect(events).toHaveLength(2);
  });

  test("ignores non-agent files in subagents directory", async () => {
    const sessionFile = path.join(tmpDir, "session2.jsonl");
    const sessionDir = path.join(tmpDir, "session2");
    const subagentsDir = path.join(sessionDir, "subagents");

    await writeJsonl(sessionFile, [makeAssistantEntry()]);
    // Non-matching file names should be ignored
    await writeJsonl(path.join(subagentsDir, "notes.jsonl"), [makeAssistantEntry()]);
    await writeJsonl(path.join(subagentsDir, "log.txt"), [makeAssistantEntry()]);

    const events = await parseClaudeCodeSessionWithSubagents(sessionFile);
    expect(events).toHaveLength(1); // Only from main session
  });
});

// ============================================================================
// aggregateUsageData
// ============================================================================

describe("aggregateUsageData", () => {
  test("sums token counts and costs across events", () => {
    const events = [
      {
        model: "claude-opus-4-6",
        inputTokens: 100,
        outputTokens: 50,
        cacheCreationTokens: 200,
        cacheReadTokens: 300,
        cacheCreation5mTokens: 100,
        cacheCreation1hTokens: 100,
        costUsd: 0.01,
      },
      {
        model: "claude-opus-4-6",
        inputTokens: 200,
        outputTokens: 100,
        cacheCreationTokens: 400,
        cacheReadTokens: 600,
        cacheCreation5mTokens: 200,
        cacheCreation1hTokens: 200,
        costUsd: 0.02,
      },
    ];

    const result = aggregateUsageData(events);
    expect(result.eventCount).toBe(2);
    expect(result.totalInputTokens).toBe(300);
    expect(result.totalOutputTokens).toBe(150);
    expect(result.totalCacheCreationTokens).toBe(600);
    expect(result.totalCacheReadTokens).toBe(900);
    expect(result.totalCacheCreation5mTokens).toBe(300);
    expect(result.totalCacheCreation1hTokens).toBe(300);
    expect(result.totalCostUsd).toBeCloseTo(0.03, 6);
  });

  test("produces per-model breakdown", () => {
    const events = [
      {
        model: "claude-opus-4-6",
        inputTokens: 100,
        outputTokens: 50,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        cacheCreation5mTokens: 0,
        cacheCreation1hTokens: 0,
        costUsd: 0.005,
      },
      {
        model: "claude-sonnet-4-6",
        inputTokens: 200,
        outputTokens: 100,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        cacheCreation5mTokens: 0,
        cacheCreation1hTokens: 0,
        costUsd: 0.002,
      },
      {
        model: "claude-opus-4-6",
        inputTokens: 300,
        outputTokens: 150,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        cacheCreation5mTokens: 0,
        cacheCreation1hTokens: 0,
        costUsd: 0.01,
      },
    ];

    const result = aggregateUsageData(events);
    expect(Object.keys(result.byModel)).toHaveLength(2);

    const opus = result.byModel["claude-opus-4-6"];
    expect(opus.eventCount).toBe(2);
    expect(opus.inputTokens).toBe(400);
    expect(opus.outputTokens).toBe(200);
    expect(opus.costUsd).toBeCloseTo(0.015, 6);

    const sonnet = result.byModel["claude-sonnet-4-6"];
    expect(sonnet.eventCount).toBe(1);
    expect(sonnet.inputTokens).toBe(200);
    expect(sonnet.outputTokens).toBe(100);
    expect(sonnet.costUsd).toBeCloseTo(0.002, 6);
  });

  test("returns zeroed result for empty events array", () => {
    const result = aggregateUsageData([]);
    expect(result.eventCount).toBe(0);
    expect(result.totalInputTokens).toBe(0);
    expect(result.totalOutputTokens).toBe(0);
    expect(result.totalCostUsd).toBe(0);
    expect(Object.keys(result.byModel)).toHaveLength(0);
  });

  test("handles events with undefined costUsd", () => {
    const events = [
      {
        model: "claude-opus-4-6",
        inputTokens: 100,
        outputTokens: 50,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        cacheCreation5mTokens: 0,
        cacheCreation1hTokens: 0,
        // costUsd intentionally omitted
      },
    ];

    const result = aggregateUsageData(events);
    expect(result.eventCount).toBe(1);
    expect(result.totalCostUsd).toBe(0);
    expect(result.byModel["claude-opus-4-6"].costUsd).toBe(0);
  });

  test("rounds totalCostUsd and per-model costUsd to 6 decimal places", () => {
    // Use values that might cause floating-point drift
    const events = Array.from({ length: 100 }, () => ({
      model: "claude-opus-4-6",
      inputTokens: 33,
      outputTokens: 77,
      cacheCreationTokens: 11,
      cacheReadTokens: 99,
      cacheCreation5mTokens: 5,
      cacheCreation1hTokens: 6,
      costUsd: 0.000001,
    }));

    const result = aggregateUsageData(events);
    // Verify 6 decimal places max
    const totalParts = result.totalCostUsd.toString().split(".");
    if (totalParts.length > 1) {
      expect(totalParts[1].length).toBeLessThanOrEqual(6);
    }
    for (const ms of Object.values(result.byModel)) {
      const msParts = ms.costUsd.toString().split(".");
      if (msParts.length > 1) {
        expect(msParts[1].length).toBeLessThanOrEqual(6);
      }
    }
  });
});
